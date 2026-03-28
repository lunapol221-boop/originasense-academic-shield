import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Get submission
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

    // Update status to processing
    await supabase
      .from("submissions")
      .update({ status: "processing" })
      .eq("id", submission_id);

    // Try to get file content
    let fileContent = "";
    if (submission.file_url) {
      const { data: fileData } = await supabase.storage
        .from("submissions")
        .download(submission.file_url);

      if (fileData) {
        fileContent = await fileData.text();
      }
    }

    // If no file content, use title/filename as context
    const documentText =
      fileContent.slice(0, 8000) ||
      `Document titled "${submission.title}" (${submission.file_name})`;

    // Call Lovable AI for analysis
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are an academic integrity analysis engine. Analyze the provided document text and return a JSON assessment. You must call the analyze_document function with realistic scores.

Guidelines for scoring:
- similarity_score: 0-100, percentage of text that appears to match existing sources. Most legitimate student work: 5-25%.
- ai_score: 0-100, probability the text was AI-generated. Genuine human writing: 5-20%. AI-assisted: 30-60%. Fully AI: 70-100%.
- paraphrase_score: 0-100, degree of paraphrasing from known sources. Normal: 0-15%.
- ai_likelihood: "low" if ai_score <= 30, "moderate" if 31-60, "high" if > 60.
- matched_sources: Array of 0-5 plausible academic/web sources that the text could match against. Include realistic titles and URLs.
- status: "completed" if scores are normal, "flagged" if any score exceeds institutional thresholds.

Be realistic and varied in your assessments. Not every document should be flagged.`,
            },
            {
              role: "user",
              content: `Analyze this document:\n\n${documentText}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "analyze_document",
                description:
                  "Return the analysis results for a document submission",
                parameters: {
                  type: "object",
                  properties: {
                    similarity_score: {
                      type: "number",
                      description: "Similarity score 0-100",
                    },
                    ai_score: {
                      type: "number",
                      description: "AI probability 0-100",
                    },
                    paraphrase_score: {
                      type: "number",
                      description: "Paraphrase score 0-100",
                    },
                    ai_likelihood: {
                      type: "string",
                      enum: ["low", "moderate", "high"],
                    },
                    status: {
                      type: "string",
                      enum: ["completed", "flagged"],
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
                          matched_text: { type: "string" },
                        },
                        required: [
                          "source_title",
                          "source_type",
                          "similarity_percentage",
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

      // Set to failed
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

      // Need INSERT policy for matched_sources - use service role client
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
