import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Extract text from DOCX (which is a ZIP of XML files)
async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXml = await zip.file("word/document.xml")?.async("string");
    if (!documentXml) return "";

    // Strip XML tags to get plain text
    const text = documentXml
      .replace(/<w:br[^>]*\/>/g, "\n")
      .replace(/<w:tab[^>]*\/>/g, "\t")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return text;
  } catch (e) {
    console.error("DOCX extraction error:", e);
    return "";
  }
}

// Extract text from PDF (basic extraction for text-based PDFs)
function extractPdfText(arrayBuffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const raw = new TextDecoder("latin1").decode(bytes);

    const textParts: string[] = [];

    // Extract text between BT and ET markers (text objects)
    const btEtRegex = /BT\s([\s\S]*?)ET/g;
    let match;
    while ((match = btEtRegex.exec(raw)) !== null) {
      const block = match[1];

      // Extract strings in parentheses (literal strings)
      const parenRegex = /\(([^)]*)\)/g;
      let strMatch;
      while ((strMatch = parenRegex.exec(block)) !== null) {
        const decoded = strMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\\\/g, "\\")
          .replace(/\\\(/g, "(")
          .replace(/\\\)/g, ")");
        if (decoded.trim()) textParts.push(decoded);
      }

      // Extract hex strings < >
      const hexRegex = /<([0-9A-Fa-f\s]+)>/g;
      let hexMatch;
      while ((hexMatch = hexRegex.exec(block)) !== null) {
        const hex = hexMatch[1].replace(/\s/g, "");
        let hexStr = "";
        for (let i = 0; i < hex.length; i += 2) {
          const code = parseInt(hex.substring(i, i + 2), 16);
          if (code >= 32 && code < 127) hexStr += String.fromCharCode(code);
        }
        if (hexStr.trim()) textParts.push(hexStr);
      }
    }

    // Also try stream-based text extraction
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    while ((match = streamRegex.exec(raw)) !== null) {
      const content = match[1];
      // Look for readable ASCII sequences
      const readable = content.replace(/[^\x20-\x7E\n\r\t]/g, " ")
        .replace(/\s{3,}/g, " ")
        .trim();
      if (readable.length > 50 && readable.split(" ").length > 10) {
        textParts.push(readable);
      }
    }

    return textParts.join(" ").replace(/\s{2,}/g, " ").trim();
  } catch (e) {
    console.error("PDF extraction error:", e);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submission_id } = await req.json();
    if (!submission_id) {
      return new Response(JSON.stringify({ error: "submission_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: submission, error: fetchErr } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", submission_id)
      .single();

    if (fetchErr || !submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("submissions")
      .update({ status: "processing" })
      .eq("id", submission_id);

    // Extract text from file
    let fileContent = "";
    if (submission.file_url) {
      const { data: fileData } = await supabase.storage
        .from("submissions")
        .download(submission.file_url);

      if (fileData) {
        const arrayBuffer = await fileData.arrayBuffer();
        const fileName = (submission.file_name || "").toLowerCase();

        if (fileName.endsWith(".docx")) {
          fileContent = await extractDocxText(arrayBuffer);
          console.log(`DOCX extracted: ${fileContent.length} chars`);
        } else if (fileName.endsWith(".pdf")) {
          fileContent = extractPdfText(arrayBuffer);
          console.log(`PDF extracted: ${fileContent.length} chars`);
        } else if (fileName.endsWith(".txt")) {
          fileContent = new TextDecoder().decode(arrayBuffer);
          console.log(`TXT read: ${fileContent.length} chars`);
        } else {
          // Try as text
          fileContent = new TextDecoder().decode(arrayBuffer);
        }
      }
    }

    const documentText =
      fileContent.slice(0, 12000) ||
      `Document titled "${submission.title}" (${submission.file_name}). No text content could be extracted.`;

    console.log(`Analyzing submission ${submission_id}, text preview: "${documentText.slice(0, 200)}..."`);

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an advanced academic integrity detection engine similar to Turnitin. Your job is to carefully analyze the ACTUAL TEXT provided and detect signs of:

1. **AI-Generated Content**: Look for these telltale signs:
   - Unnaturally consistent sentence length and rhythm
   - Overly polished, formal, or "perfect" prose with no colloquialisms
   - Repetitive transitional phrases ("Furthermore", "Moreover", "In addition")
   - Lack of personal voice, anecdotes, or genuine examples
   - Generic, surface-level analysis without deep domain expertise
   - Hedging language ("It is important to note", "It should be noted")
   - Perfectly structured paragraphs with topic sentences
   - Absence of typos, grammatical quirks, or informal language that real students use
   
2. **Plagiarism/Similarity**: Check for:
   - Text that reads like it was copied from textbooks or Wikipedia
   - Sudden shifts in writing style or quality within the document
   - Highly technical or encyclopedic passages mixed with simpler writing
   - Common phrases that appear frequently in academic sources

3. **Paraphrasing from sources**: Detect:
   - Light rewording of well-known content
   - Synonym substitution patterns
   - Sentence restructuring while maintaining original meaning

SCORING GUIDELINES (be honest and varied):
- similarity_score (0-100): How much matches existing sources. Original work: 2-15%. Light borrowing: 15-30%. Heavy copying: 30-60%. Plagiarized: 60-100%.
- ai_score (0-100): Probability of AI generation. Clearly human: 0-20%. Some AI assistance: 20-45%. Likely AI-written: 45-75%. Almost certainly AI: 75-100%.
- paraphrase_score (0-100): Degree of paraphrasing. Original: 0-10%. Light paraphrase: 10-25%. Heavy paraphrase: 25-50%.

CRITICAL: Actually read and analyze the text. If the text shows clear AI patterns (too perfect, no personality, formulaic structure), score it HIGH on ai_score. If it has genuine human voice, quirks, and authentic reasoning, score it LOW. Do NOT give every document the same scores.

You must call the analyze_document function with your assessment.`,
            },
            {
              role: "user",
              content: `Analyze this document text carefully for academic integrity:\n\n---\n${documentText}\n---`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "analyze_document",
                description:
                  "Return the detailed analysis results for a document submission",
                parameters: {
                  type: "object",
                  properties: {
                    similarity_score: {
                      type: "number",
                      description: "Similarity/plagiarism score 0-100",
                    },
                    ai_score: {
                      type: "number",
                      description: "AI-generation probability 0-100",
                    },
                    paraphrase_score: {
                      type: "number",
                      description: "Paraphrase detection score 0-100",
                    },
                    ai_likelihood: {
                      type: "string",
                      enum: ["low", "moderate", "high"],
                      description: "Overall AI likelihood category",
                    },
                    status: {
                      type: "string",
                      enum: ["completed", "flagged"],
                      description: "flagged if ai_score > 50 or similarity_score > 30",
                    },
                    analysis_summary: {
                      type: "string",
                      description: "2-3 sentence summary explaining the key findings and why the scores are what they are",
                    },
                    matched_sources: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          source_title: { type: "string" },
                          source_url: { type: "string" },
                          source_type: {
                            type: "string",
                            enum: ["web", "academic", "journal", "book"],
                          },
                          similarity_percentage: { type: "number" },
                          matched_text: {
                            type: "string",
                            description: "The specific passage from the document that matches this source (quote the actual text)",
                          },
                        },
                        required: [
                          "source_title",
                          "source_type",
                          "similarity_percentage",
                          "matched_text",
                        ],
                      },
                    },
                  },
                  required: [
                    "similarity_score",
                    "ai_score",
                    "paraphrase_score",
                    "ai_likelihood",
                    "status",
                    "analysis_summary",
                    "matched_sources",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "analyze_document" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);

      await supabase
        .from("submissions")
        .update({ status: "failed" })
        .eq("id", submission_id);

      return new Response(
        JSON.stringify({
          error:
            aiResponse.status === 429
              ? "Rate limited, please try again later"
              : aiResponse.status === 402
              ? "Credits exhausted"
              : "AI analysis failed",
        }),
        {
          status: aiResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiResult));
      await supabase
        .from("submissions")
        .update({ status: "failed" })
        .eq("id", submission_id);
      return new Response(
        JSON.stringify({ error: "AI returned no analysis" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log(`Analysis result for ${submission_id}:`, JSON.stringify({
      ai_score: analysis.ai_score,
      similarity_score: analysis.similarity_score,
      ai_likelihood: analysis.ai_likelihood,
      status: analysis.status,
      summary: analysis.analysis_summary,
    }));

    // Update submission with scores
    await supabase
      .from("submissions")
      .update({
        similarity_score: analysis.similarity_score,
        ai_score: analysis.ai_score,
        paraphrase_score: analysis.paraphrase_score,
        ai_likelihood: analysis.ai_likelihood,
        status: analysis.status,
      })
      .eq("id", submission_id);

    // Insert matched sources
    if (analysis.matched_sources?.length > 0) {
      const sources = analysis.matched_sources.map(
        (s: {
          source_title: string;
          source_url?: string;
          source_type: string;
          similarity_percentage: number;
          matched_text?: string;
        }) => ({
          submission_id,
          source_title: s.source_title,
          source_url: s.source_url || null,
          source_type: s.source_type,
          similarity_percentage: s.similarity_percentage,
          matched_text: s.matched_text || null,
        })
      );

      await supabase.from("matched_sources").insert(sources);
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
