import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
}

function parseRSSXML(xmlText: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  // Simple regex-based XML parsing for RSS feeds
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];
    
    const title = extractTag(itemContent, 'title');
    const link = extractTag(itemContent, 'link');
    const description = extractTag(itemContent, 'description');
    const pubDate = extractTag(itemContent, 'pubDate');
    
    if (title && link) {
      items.push({
        title: cleanHTML(title),
        link,
        description: cleanHTML(description || '').slice(0, 500),
        pubDate,
      });
    }
  }
  
  return items;
}

function extractTag(content: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = regex.exec(content);
  if (match) {
    return match[1] || match[2] || null;
  }
  return null;
}

function cleanHTML(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { source_id } = await req.json();

    if (!source_id) {
      return new Response(
        JSON.stringify({ error: "source_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the source
    const { data: source, error: sourceError } = await supabase
      .from("intelligence_sources")
      .select("*")
      .eq("id", source_id)
      .single();

    if (sourceError || !source) {
      return new Response(
        JSON.stringify({ error: "Source not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (source.source_type !== "rss" || !source.url) {
      return new Response(
        JSON.stringify({ error: "Source is not an RSS feed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the RSS feed
    console.log(`Fetching RSS feed: ${source.url}`);
    const rssResponse = await fetch(source.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BDAccelerate/1.0)",
      },
    });

    if (!rssResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch RSS: ${rssResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rssText = await rssResponse.text();
    const items = parseRSSXML(rssText);

    console.log(`Parsed ${items.length} items from RSS feed`);

    // Insert items into intelligence_items (skip duplicates by source_url)
    let insertedCount = 0;
    for (const item of items.slice(0, 20)) { // Limit to 20 items per fetch
      const { error: insertError } = await supabase
        .from("intelligence_items")
        .upsert(
          {
            source_id: source.id,
            user_id: source.user_id,
            headline: item.title,
            summary: item.description,
            content_preview: item.description,
            source_url: item.link,
            city: source.city,
            micro_market: source.micro_market,
            intelligence_type: source.intelligence_type,
            relevance_date: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          },
          { onConflict: "source_url", ignoreDuplicates: true }
        );

      if (!insertError) {
        insertedCount++;
      }
    }

    // Update last_fetched_at
    await supabase
      .from("intelligence_sources")
      .update({ last_fetched_at: new Date().toISOString() })
      .eq("id", source_id);

    return new Response(
      JSON.stringify({
        success: true,
        items_found: items.length,
        items_inserted: insertedCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error ingesting RSS:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
