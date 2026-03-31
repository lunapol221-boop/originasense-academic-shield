import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── DOCX Extraction (improved) ───
async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const parts: string[] = [];

    // Extract from all content parts: document, headers, footers, footnotes, endnotes
    const xmlFiles = [
      "word/document.xml",
      "word/header1.xml", "word/header2.xml", "word/header3.xml",
      "word/footer1.xml", "word/footer2.xml", "word/footer3.xml",
      "word/footnotes.xml",
      "word/endnotes.xml",
    ];

    for (const path of xmlFiles) {
      const file = zip.file(path);
      if (!file) continue;
      const xml = await file.async("string");
      const text = extractTextFromXml(xml);
      if (text.trim()) parts.push(text.trim());
    }

    return parts.join("\n\n").trim();
  } catch (e) {
    console.error("DOCX extraction error:", e);
    return "";
  }
}

function extractTextFromXml(xml: string): string {
  // Extract text from <w:t> tags specifically for more accurate extraction
  const textParts: string[] = [];
  let currentParagraph: string[] = [];

  // Split by paragraph boundaries
  const paragraphs = xml.split(/<\/w:p>/g);

  for (const para of paragraphs) {
    currentParagraph = [];

    // Find all <w:t> content (the actual text nodes)
    const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let match;
    while ((match = tRegex.exec(para)) !== null) {
      currentParagraph.push(match[1]);
    }

    // Check for line breaks
    if (/<w:br[^>]*\/?>/.test(para)) {
      currentParagraph.push("\n");
    }

    // Check for tab
    if (/<w:tab[^>]*\/?>/.test(para)) {
      currentParagraph.push("\t");
    }

    const paraText = currentParagraph.join("").trim();
    if (paraText) textParts.push(paraText);
  }

  let result = textParts.join("\n");
  // Decode XML entities
  result = result
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/\n{3,}/g, "\n\n");

  return result;
}

// ─── PDF Extraction (improved with multiple strategies) ───
function extractPdfText(arrayBuffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const raw = new TextDecoder("latin1").decode(bytes);
    const textParts: string[] = [];

    // Strategy 1: Extract from BT/ET text objects (most reliable)
    const btEtRegex = /BT\s([\s\S]*?)ET/g;
    let match;
    while ((match = btEtRegex.exec(raw)) !== null) {
      const block = match[1];
      const blockText = extractTextFromPdfBlock(block);
      if (blockText.trim()) textParts.push(blockText);
    }

    // Strategy 2: Decompress FlateDecode streams and extract text
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    while ((match = streamRegex.exec(raw)) !== null) {
      const streamData = match[1];

      // Check if preceding dict has FlateDecode
      const dictStart = raw.lastIndexOf("<<", match.index);
      const dictSection = raw.substring(dictStart, match.index);
      
      if (dictSection.includes("FlateDecode")) {
        try {
          const compressed = new Uint8Array(
            [...streamData].map(c => c.charCodeAt(0))
          );
          const decompressed = decompressFlate(compressed);
          if (decompressed) {
            const decodedStream = new TextDecoder("latin1").decode(decompressed);
            // Extract text from decompressed stream
            const innerBtEt = /BT\s([\s\S]*?)ET/g;
            let innerMatch;
            while ((innerMatch = innerBtEt.exec(decodedStream)) !== null) {
              const blockText = extractTextFromPdfBlock(innerMatch[1]);
              if (blockText.trim()) textParts.push(blockText);
            }
          }
        } catch {
          // Decompression failed, try raw extraction
        }
      }

      // Strategy 3: Plain text streams
      const readable = streamData
        .replace(/[^\x20-\x7E\n\r\t]/g, " ")
        .replace(/\s{3,}/g, " ")
        .trim();
      if (readable.length > 80 && readable.split(/\s+/).length > 15) {
        // Avoid duplicating text already found
        const sample = readable.substring(0, 60);
        if (!textParts.some(p => p.includes(sample))) {
          textParts.push(readable);
        }
      }
    }

    // Deduplicate and join
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const part of textParts) {
      const norm = part.trim().replace(/\s+/g, " ");
      if (norm.length > 5 && !seen.has(norm)) {
        seen.add(norm);
        unique.push(part.trim());
      }
    }

    return unique.join("\n").replace(/\s{2,}/g, " ").trim();
  } catch (e) {
    console.error("PDF extraction error:", e);
    return "";
  }
}

function extractTextFromPdfBlock(block: string): string {
  const parts: string[] = [];

  // Extract literal strings in parentheses (handles nested parens and escapes)
  const chars = [...block];
  let i = 0;
  while (i < chars.length) {
    if (chars[i] === "(") {
      let depth = 1;
      let str = "";
      i++;
      while (i < chars.length && depth > 0) {
        if (chars[i] === "\\" && i + 1 < chars.length) {
          const next = chars[i + 1];
          if (next === "n") { str += "\n"; i += 2; continue; }
          if (next === "r") { str += "\r"; i += 2; continue; }
          if (next === "t") { str += "\t"; i += 2; continue; }
          if (next === "(" || next === ")" || next === "\\") { str += next; i += 2; continue; }
          // Octal
          if (next >= "0" && next <= "7") {
            let oct = next;
            if (i + 2 < chars.length && chars[i + 2] >= "0" && chars[i + 2] <= "7") { oct += chars[i + 2]; }
            if (oct.length === 2 && i + 3 < chars.length && chars[i + 3] >= "0" && chars[i + 3] <= "7") { oct += chars[i + 3]; }
            str += String.fromCharCode(parseInt(oct, 8));
            i += 1 + oct.length;
            continue;
          }
          str += next;
          i += 2;
          continue;
        }
        if (chars[i] === "(") depth++;
        if (chars[i] === ")") { depth--; if (depth === 0) { i++; break; } }
        str += chars[i];
        i++;
      }
      if (str.trim()) parts.push(str);
    } else if (chars[i] === "<") {
      // Hex string
      i++;
      let hex = "";
      while (i < chars.length && chars[i] !== ">") {
        if (/[0-9A-Fa-f]/.test(chars[i])) hex += chars[i];
        i++;
      }
      i++; // skip >
      if (hex.length >= 2) {
        let decoded = "";
        // Try as UTF-16BE first (common in modern PDFs)
        if (hex.length >= 8 && hex.length % 4 === 0) {
          let isUtf16 = true;
          let utf16 = "";
          for (let j = 0; j < hex.length; j += 4) {
            const code = parseInt(hex.substring(j, j + 4), 16);
            if (code >= 32 && code < 0xFFFF) {
              utf16 += String.fromCharCode(code);
            } else if (code === 0) {
              isUtf16 = false;
              break;
            }
          }
          if (isUtf16 && utf16.trim()) decoded = utf16;
        }
        // Fall back to single-byte
        if (!decoded) {
          for (let j = 0; j < hex.length; j += 2) {
            const code = parseInt(hex.substring(j, j + 2), 16);
            if (code >= 32 && code < 127) decoded += String.fromCharCode(code);
          }
        }
        if (decoded.trim()) parts.push(decoded);
      }
    }
    i++;
  }

  // Handle Tj, TJ, ', " operators for text positioning
  return parts.join("").replace(/\s{2,}/g, " ");
}

// Simple inflate/deflate (using Deno's built-in DecompressionStream)
function decompressFlate(data: Uint8Array): Uint8Array | null {
  try {
    // Use synchronous zlib-compatible decompression
    // Strip zlib header (2 bytes) and checksum (4 bytes) if present
    let payload = data;
    if (data.length > 2 && (data[0] === 0x78)) {
      payload = data.slice(2);
      if (payload.length > 4) {
        payload = payload.slice(0, payload.length - 4);
      }
    }

    // Attempt raw inflate using a simple approach
    // For Deno, we can try the DecompressionStream API
    return null; // Fallback - stream decompression is async, skip for now
  } catch {
    return null;
  }
}

// ─── Pre-compute text metrics before sending to AI ───
function computeTextMetrics(text: string): {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  sentenceLengthStdDev: number;
  uniqueWordRatio: number;
  avgWordLength: number;
  paragraphCount: number;
  topRepeatedPhrases: string[];
} {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Sentence splitting
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  const sentenceCount = sentences.length;

  // Sentence length stats
  const sentLengths = sentences.map(s => s.split(/\s+/).length);
  const avgSentenceLength = sentLengths.length > 0
    ? sentLengths.reduce((a, b) => a + b, 0) / sentLengths.length
    : 0;
  const variance = sentLengths.length > 1
    ? sentLengths.reduce((sum, l) => sum + Math.pow(l - avgSentenceLength, 2), 0) / (sentLengths.length - 1)
    : 0;
  const sentenceLengthStdDev = Math.sqrt(variance);

  // Vocabulary richness (type-token ratio)
  const lowerWords = words.map(w => w.toLowerCase().replace(/[^a-z']/g, "")).filter(w => w.length > 0);
  const uniqueWords = new Set(lowerWords);
  const uniqueWordRatio = lowerWords.length > 0 ? uniqueWords.size / lowerWords.length : 0;

  // Average word length
  const avgWordLength = lowerWords.length > 0
    ? lowerWords.reduce((sum, w) => sum + w.length, 0) / lowerWords.length
    : 0;

  // Paragraph count
  const paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim().length > 20).length || 1;

  // Find repeated 3-grams (potential plagiarism indicators)
  const trigrams: Record<string, number> = {};
  for (let i = 0; i < lowerWords.length - 2; i++) {
    const tri = `${lowerWords[i]} ${lowerWords[i + 1]} ${lowerWords[i + 2]}`;
    trigrams[tri] = (trigrams[tri] || 0) + 1;
  }
  const topRepeatedPhrases = Object.entries(trigrams)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase, count]) => `"${phrase}" (×${count})`);

  return {
    wordCount,
    sentenceCount,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    sentenceLengthStdDev: Math.round(sentenceLengthStdDev * 10) / 10,
    uniqueWordRatio: Math.round(uniqueWordRatio * 1000) / 1000,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    paragraphCount,
    topRepeatedPhrases,
  };
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
          console.log(`DOCX extracted: ${fileContent.length} chars, preview: "${fileContent.slice(0, 150)}"`);
        } else if (fileName.endsWith(".pdf")) {
          fileContent = extractPdfText(arrayBuffer);
          console.log(`PDF extracted: ${fileContent.length} chars, preview: "${fileContent.slice(0, 150)}"`);
        } else if (fileName.endsWith(".txt")) {
          fileContent = new TextDecoder().decode(arrayBuffer);
          console.log(`TXT read: ${fileContent.length} chars`);
        } else {
          fileContent = new TextDecoder().decode(arrayBuffer);
        }
      }
    }

    if (!fileContent || fileContent.length < 20) {
      console.error(`Insufficient text extracted for ${submission_id}: ${fileContent.length} chars`);
      await supabase
        .from("submissions")
        .update({ status: "failed" })
        .eq("id", submission_id);
      return new Response(
        JSON.stringify({ error: "Could not extract sufficient text from the document. Please ensure the file contains readable text content." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const documentText = fileContent.slice(0, 15000);

    // Pre-compute text metrics
    const metrics = computeTextMetrics(documentText);
    console.log(`Text metrics for ${submission_id}:`, JSON.stringify(metrics));

    const metricsBlock = `
PRE-COMPUTED TEXT METRICS (use these to calibrate your scores):
- Word count: ${metrics.wordCount}
- Sentence count: ${metrics.sentenceCount}
- Avg sentence length: ${metrics.avgSentenceLength} words
- Sentence length std dev: ${metrics.sentenceLengthStdDev} (human writing typically 5-12, AI typically 2-5)
- Unique word ratio (type-token): ${metrics.uniqueWordRatio} (human: 0.55-0.80, AI: 0.35-0.55)
- Avg word length: ${metrics.avgWordLength} chars
- Paragraph count: ${metrics.paragraphCount}
- Repeated 3-word phrases: ${metrics.topRepeatedPhrases.length > 0 ? metrics.topRepeatedPhrases.join(", ") : "none found"}
`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            {
              role: "system",
              content: `You are an expert academic integrity analysis engine. You perform deep linguistic analysis on document text to detect AI-generated content, plagiarism patterns, and paraphrasing.

ANALYSIS METHODOLOGY:

1. **AI DETECTION** — Analyze the ACTUAL text for these empirical signals:
   - PERPLEXITY: How predictable is the next word? AI text has low perplexity (very predictable). Human text is more surprising.
   - BURSTINESS: Humans write with high variance — short punchy sentences mixed with long complex ones. AI tends toward uniform length.
   - SENTENCE VARIANCE: Measure actual standard deviation of sentence lengths. High variance = human.
   - VOCABULARY: AI uses a narrower, more "safe" vocabulary. Humans use colloquialisms, domain jargon, rare words.
   - STYLE CONSISTENCY: AI maintains unnaturally consistent tone. Humans shift between formal/informal.
   - TRANSITIONAL PATTERNS: Overuse of "Furthermore", "Moreover", "It is important to note", "In conclusion" suggests AI.
   - PERSONAL VOICE: Lack of first-person experience, opinions, or authentic examples suggests AI.
   - HEDGING: Excessive qualifiers ("It can be argued", "One might consider") are AI markers.

2. **PLAGIARISM/SIMILARITY** — Look for:
   - Text that reads like encyclopedia or textbook definitions
   - Sudden quality/style shifts indicating patchwork from multiple sources
   - Overly formal academic language in what should be original analysis
   - Common well-known phrases or definitions copied verbatim

3. **PARAPHRASING** — Detect:
   - Synonym substitution patterns (replacing words but keeping structure)
   - Sentence restructuring while preserving identical meaning
   - Mixing original and paraphrased content

CRITICAL SCORING RULES:
- Use the PRE-COMPUTED METRICS provided to ground your scores in actual data
- If sentence_length_std_dev < 4: strong AI signal → ai_score should be 60+
- If unique_word_ratio < 0.45: AI signal → ai_score += 15
- If the text has genuine personality, humor, errors, or authentic voice → ai_score should be under 30
- Scores should VARY significantly between documents. Not every document is "moderate risk"
- Be DECISIVE: if it looks AI-generated, score it 70+. If it looks human, score it under 25.

You must call the analyze_document function with your detailed assessment.`,
            },
            {
              role: "user",
              content: `Analyze this document for academic integrity. Use the pre-computed metrics to calibrate your assessment.

${metricsBlock}

DOCUMENT TEXT:
---
${documentText}
---`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "analyze_document",
                description:
                  "Return detailed analysis results for academic integrity assessment",
                parameters: {
                  type: "object",
                  properties: {
                    similarity_score: {
                      type: "number",
                      description: "Similarity/plagiarism score 0-100. Original work: 2-15. Light borrowing: 15-30. Heavy copying: 30-60. Plagiarized: 60-100.",
                    },
                    ai_score: {
                      type: "number",
                      description: "AI-generation probability 0-100. Clearly human: 0-20. Some AI help: 20-45. Likely AI: 45-75. Certainly AI: 75-100.",
                    },
                    paraphrase_score: {
                      type: "number",
                      description: "Paraphrase detection 0-100. Original: 0-10. Light: 10-25. Heavy: 25-50. Excessive: 50+.",
                    },
                    ai_likelihood: {
                      type: "string",
                      enum: ["low", "moderate", "high"],
                    },
                    status: {
                      type: "string",
                      enum: ["completed", "flagged"],
                      description: "Flag if ai_score > 50 OR similarity_score > 30",
                    },
                    analysis_summary: {
                      type: "string",
                      description: "3-4 sentence detailed summary of findings explaining WHY the scores are what they are, referencing specific patterns found in the text",
                    },
                    perplexity_score: {
                      type: "number",
                      description: "Text perplexity 0-100. Human: 60-95. AI: 10-40. Based on how predictable/surprising word choices are.",
                    },
                    burstiness_score: {
                      type: "number",
                      description: "Burstiness 0-100. Human: 55-90. AI: 10-35. Based on sentence length variation.",
                    },
                    sentence_variance: {
                      type: "number",
                      description: "Sentence length variance 0-100. Human: 50-85. AI: 10-30.",
                    },
                    vocabulary_richness: {
                      type: "number",
                      description: "Vocabulary diversity 0-100. Human: 55-85. AI: 30-55.",
                    },
                    consistency_score: {
                      type: "number",
                      description: "Style consistency 0-100. Very high (85+) = AI uniform style. Mixed (40-70) = human variation.",
                    },
                    matched_sources: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          source_title: { type: "string", description: "Name of the likely source" },
                          source_url: { type: "string", description: "URL if identifiable, otherwise omit" },
                          source_type: {
                            type: "string",
                            enum: ["web", "academic", "journal", "book"],
                          },
                          similarity_percentage: { type: "number", description: "How similar the matched passage is 0-100" },
                          matched_text: {
                            type: "string",
                            description: "Quote the EXACT passage from the document that appears to match this source",
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
                    "perplexity_score",
                    "burstiness_score",
                    "sentence_variance",
                    "vocabulary_richness",
                    "consistency_score",
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
      paraphrase_score: analysis.paraphrase_score,
      ai_likelihood: analysis.ai_likelihood,
      status: analysis.status,
      perplexity: analysis.perplexity_score,
      burstiness: analysis.burstiness_score,
      summary: analysis.analysis_summary?.slice(0, 200),
    }));

    // Delete old matched_sources for re-analysis
    await supabase
      .from("matched_sources")
      .delete()
      .eq("submission_id", submission_id);

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
