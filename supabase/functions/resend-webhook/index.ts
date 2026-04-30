import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/svix@1.24.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

// Map Resend events to our recipient_status enum
const eventToStatus: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

// Map status to timestamp field
const statusToTimestampField: Record<string, string> = {
  "sent": "sent_at",
  "delivered": "delivered_at",
  "opened": "opened_at",
  "clicked": "clicked_at",
};

interface ResendWebhookPayload {
  type: string;
  data: {
    email_id: string;
    created_at: string;
    from?: string;
    to?: string[];
    subject?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("RESEND_WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the raw payload for signature verification
    const payload = await req.text();
    
    // Verify webhook signature using Svix
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error("Missing Svix headers");
      return new Response(
        JSON.stringify({ error: "Missing webhook signature headers" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wh = new Webhook(webhookSecret);
    let event: ResendWebhookPayload;

    try {
      event = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ResendWebhookPayload;
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Received Resend webhook event:", event.type, "for email:", event.data.email_id);

    // Map event type to our status
    const newStatus = eventToStatus[event.type];
    if (!newStatus) {
      console.log("Ignoring unhandled event type:", event.type);
      return new Response(
        JSON.stringify({ received: true, ignored: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find recipient by resend_email_id
    const { data: recipient, error: findError } = await supabase
      .from("campaign_recipients")
      .select("id, campaign_id, status")
      .eq("resend_email_id", event.data.email_id)
      .maybeSingle();

    if (findError) {
      console.error("Error finding recipient:", findError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!recipient) {
      // Unknown email ID - return 200 for idempotency
      console.warn("Unknown resend_email_id:", event.data.email_id);
      return new Response(
        JSON.stringify({ received: true, warning: "Unknown email ID" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build update payload
    const updateData: Record<string, string> = {
      status: newStatus,
    };

    // Set appropriate timestamp field
    const timestampField = statusToTimestampField[newStatus];
    if (timestampField) {
      updateData[timestampField] = new Date().toISOString();
    }

    // Update recipient status
    const { error: updateError } = await supabase
      .from("campaign_recipients")
      .update(updateData)
      .eq("id", recipient.id);

    if (updateError) {
      console.error("Error updating recipient:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update recipient" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Updated recipient ${recipient.id} to status: ${newStatus}`);

    // Update email_outbox status and timeline
    await updateOutboxStatus(supabase, event.data.email_id, newStatus, updateData);

    // Update campaign analytics
    await updateCampaignAnalytics(supabase, recipient.campaign_id);

    // Handle bounce - mark contact as bounced
    if (newStatus === "bounced") {
      await handleBounce(supabase, recipient.id);
    }

    return new Response(
      JSON.stringify({ received: true, status: newStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

// Update outbox status and timeline
async function updateOutboxStatus(
  supabase: any,
  resendEmailId: string,
  newStatus: string,
  timestampData: Record<string, string>
) {
  try {
    // Find outbox entry by resend_email_id
    const { data: outboxEntry, error: findError } = await supabase
      .from("email_outbox")
      .select("id, status_timeline")
      .eq("resend_email_id", resendEmailId)
      .maybeSingle();

    if (findError || !outboxEntry) {
      console.log("No outbox entry found for resend_email_id:", resendEmailId);
      return;
    }

    // Build updated timeline
    const currentTimeline = outboxEntry.status_timeline || [];
    const newTimelineEntry = {
      status: newStatus,
      timestamp: new Date().toISOString(),
    };
    
    // Append new status to timeline (avoid duplicates)
    const hasStatus = currentTimeline.some((entry: any) => entry.status === newStatus);
    const updatedTimeline = hasStatus 
      ? currentTimeline 
      : [...currentTimeline, newTimelineEntry];

    // Build update object
    const updateObj: Record<string, any> = {
      status: newStatus,
      status_timeline: updatedTimeline,
    };

    // Add timestamp fields
    if (timestampData.delivered_at) updateObj.delivered_at = timestampData.delivered_at;
    if (timestampData.opened_at) updateObj.opened_at = timestampData.opened_at;
    if (timestampData.clicked_at) updateObj.clicked_at = timestampData.clicked_at;

    const { error: updateError } = await supabase
      .from("email_outbox")
      .update(updateObj)
      .eq("id", outboxEntry.id);

    if (updateError) {
      console.error("Error updating outbox:", updateError);
    } else {
      console.log(`Updated outbox ${outboxEntry.id} to status: ${newStatus}`);
    }
  } catch (err) {
    console.error("Error in updateOutboxStatus:", err);
  }
}

async function updateCampaignAnalytics(supabase: any, campaignId: string) {
  try {
    // Count recipients by status
    const { data: counts, error } = await supabase
      .from("campaign_recipients")
      .select("status")
      .eq("campaign_id", campaignId);

    if (error) {
      console.error("Error fetching recipient counts:", error);
      return;
    }

    const statusCounts = {
      total_recipients: counts.length,
      sent_count: 0,
      delivered_count: 0,
      opened_count: 0,
      clicked_count: 0,
      bounced_count: 0,
      complained_count: 0,
    };

    for (const { status } of counts) {
      switch (status) {
        case "sent":
          statusCounts.sent_count++;
          break;
        case "delivered":
          statusCounts.delivered_count++;
          break;
        case "opened":
          statusCounts.opened_count++;
          break;
        case "clicked":
          statusCounts.clicked_count++;
          break;
        case "bounced":
          statusCounts.bounced_count++;
          break;
        case "complained":
          statusCounts.complained_count++;
          break;
      }
    }

    // Upsert analytics record
    const { error: upsertError } = await supabase
      .from("email_analytics")
      .upsert({
        campaign_id: campaignId,
        ...statusCounts,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "campaign_id",
      });

    if (upsertError) {
      console.error("Error updating analytics:", upsertError);
    } else {
      console.log("Updated analytics for campaign:", campaignId);
    }
  } catch (err) {
    console.error("Error in updateCampaignAnalytics:", err);
  }
}

async function handleBounce(supabase: any, recipientId: string) {
  try {
    // Get contact_id from recipient
    const { data: recipient, error: fetchError } = await supabase
      .from("campaign_recipients")
      .select("contact_id")
      .eq("id", recipientId)
      .single();

    if (fetchError || !recipient) {
      console.error("Error fetching recipient for bounce handling:", fetchError);
      return;
    }

    // Mark contact as bounced
    const { error: updateError } = await supabase
      .from("email_contacts")
      .update({ bounced: true })
      .eq("id", recipient.contact_id);

    if (updateError) {
      console.error("Error marking contact as bounced:", updateError);
    } else {
      console.log("Marked contact as bounced:", recipient.contact_id);
    }
  } catch (err) {
    console.error("Error in handleBounce:", err);
  }
}

serve(handler);
