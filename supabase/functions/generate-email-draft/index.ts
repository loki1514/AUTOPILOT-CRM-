import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are an expert email copywriter. Generate professional marketing emails based on the user's description.

RULES:
1. NEVER use real names, emails, phone numbers, or personal data
2. Use placeholders like {{first_name}}, {{company_name}}, {{booking_url}}, {{unsubscribe_url}}
3. Keep content concise and actionable
4. Include a clear call-to-action
5. Maintain professional tone
6. Structure content for easy reading (short paragraphs, bullet points)
7. ALWAYS include a footer block with {{company_address}} for CAN-SPAM compliance
8. Subject lines should be compelling and under 60 characters`;

const emailBlocksTool = {
  type: "function",
  function: {
    name: "generate_email_blocks",
    description: "Generate structured email content blocks for a marketing email",
    parameters: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: "Email subject line (under 60 characters, compelling)",
        },
        blocks: {
          type: "array",
          description: "Array of content blocks that make up the email body",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["heading", "paragraph", "bullets", "cta", "footer"],
                description: "The type of content block",
              },
              content: {
                type: "string",
                description: "Main text content of the block",
              },
              items: {
                type: "array",
                items: { type: "string" },
                description: "For bullets type: array of bullet point strings",
              },
              buttonText: {
                type: "string",
                description: "For cta type: text on the call-to-action button",
              },
              buttonUrl: {
                type: "string",
                description: "For cta type: URL or placeholder like {{booking_url}}",
              },
            },
            required: ["type", "content"],
          },
        },
      },
      required: ["subject", "blocks"],
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, targetAudience } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Please provide a description of your email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured. Set OPENROUTER_API_KEY in Supabase secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userMessage = `Generate a professional marketing email based on this description:\n\n${prompt}`;
    if (targetAudience) {
      userMessage += `\n\nTarget audience: ${targetAudience}`;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://officeflow.app",
        "X-Title": "OfficeFlow",
      },
      body: JSON.stringify({
        model: "perplexity/sonar",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        tools: [emailBlocksTool],
        tool_choice: { type: "function", function: { name: "generate_email_blocks" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached or invalid API key. Check your OpenRouter credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate draft. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("OpenRouter response:", JSON.stringify(data, null, 2));

    // Extract tool call arguments
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_email_blocks") {
      console.error("Unexpected response format:", data);
      return new Response(
        JSON.stringify({ error: "AI couldn't generate content. Try a more detailed description." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let emailContent;
    try {
      emailContent = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("Failed to parse tool call arguments:", parseError);
      return new Response(
        JSON.stringify({ error: "AI response was malformed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add unique IDs to each block
    const blocksWithIds = emailContent.blocks.map((block: any, index: number) => ({
      ...block,
      id: crypto.randomUUID(),
    }));

    // Ensure footer exists
    const hasFooter = blocksWithIds.some((b: any) => b.type === "footer");
    if (!hasFooter) {
      blocksWithIds.push({
        id: crypto.randomUUID(),
        type: "footer",
        content: "{{company_address}} | {{unsubscribe_url}}",
      });
    }

    return new Response(
      JSON.stringify({
        subject: emailContent.subject,
        blocks: blocksWithIds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-email-draft error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
