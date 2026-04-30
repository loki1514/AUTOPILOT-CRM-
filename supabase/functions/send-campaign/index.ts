import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailBlock {
  id: string;
  type: "heading" | "paragraph" | "bullets" | "image" | "cta" | "divider" | "footer";
  content: string;
  items?: string[];
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
  altText?: string;
}

interface SendCampaignRequest {
  campaignId: string;
  recipientIds?: string[]; // Optional: specific recipients. If not provided, sends to all contacts
  testMode?: boolean; // If true, only sends to first recipient
}

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 2000;

// Convert blocks to HTML
function blocksToHtml(blocks: EmailBlock[], footerAddress: string): string {
  const styles = {
    container: `max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;`,
    heading: `font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px;`,
    paragraph: `font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 16px;`,
    bullets: `font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 16px; padding-left: 20px;`,
    cta: `display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;`,
    image: `max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 16px;`,
    divider: `border: 0; border-top: 1px solid #e5e5e5; margin: 24px 0;`,
    footer: `font-size: 12px; color: #888888; text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5;`,
  };

  let html = `<div style="${styles.container}">`;

  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        html += `<h1 style="${styles.heading}">${escapeHtml(block.content)}</h1>`;
        break;
      case "paragraph":
        html += `<p style="${styles.paragraph}">${escapeHtml(block.content)}</p>`;
        break;
      case "bullets":
        html += `<ul style="${styles.bullets}">`;
        if (block.items) {
          for (const item of block.items) {
            html += `<li>${escapeHtml(item)}</li>`;
          }
        }
        html += `</ul>`;
        break;
      case "cta":
        html += `<p style="text-align: center; margin: 24px 0;">`;
        html += `<a href="${escapeHtml(block.buttonUrl || "#")}" style="${styles.cta}">${escapeHtml(block.buttonText || "Learn More")}</a>`;
        html += `</p>`;
        break;
      case "image":
        if (block.imageUrl) {
          html += `<img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.altText || "")}" style="${styles.image}" />`;
        }
        break;
      case "divider":
        html += `<hr style="${styles.divider}" />`;
        break;
      case "footer":
        html += `<div style="${styles.footer}">${escapeHtml(block.content)}</div>`;
        break;
    }
  }

  // Add mandatory footer with address
  if (footerAddress) {
    html += `<div style="${styles.footer}">
      <p>Internal Use Only</p>
      <p>${escapeHtml(footerAddress)}</p>
    </div>`;
  }

  html += `</div>`;
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify JWT and get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Client for user validation
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Service client for admin operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = claimsData.claims.sub;

    const { campaignId, recipientIds, testMode } = await req.json() as SendCampaignRequest;

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: "Campaign ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch campaign with sender profile
    const { data: campaign, error: campaignError } = await userClient
      .from("email_campaigns")
      .select(`
        *,
        sender_profiles (
          id, name, from_email,
          sending_domains (domain, from_name, status)
        )
      `)
      .eq("id", campaignId)
      .eq("user_id", userId)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate campaign is approved
    if (campaign.status !== "approved") {
      return new Response(
        JSON.stringify({ error: "Campaign must be approved before sending" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate sender profile exists
    const senderProfile = campaign.sender_profiles;
    if (!senderProfile) {
      return new Response(
        JSON.stringify({ error: "Campaign must have a sender profile configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate domain is verified
    const domain = senderProfile.sending_domains;
    if (!domain || domain.status !== "verified") {
      return new Response(
        JSON.stringify({ error: "Sender domain must be verified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch email template
    const { data: template, error: templateError } = await userClient
      .from("email_templates")
      .select("*")
      .eq("campaign_id", campaignId)
      .single();

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: "Email template not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch recipients (either specific or all contacts)
    let recipientsQuery = userClient
      .from("email_contacts")
      .select("id, email, name")
      .eq("user_id", userId)
      .eq("subscribed", true)
      .eq("bounced", false);

    if (recipientIds && recipientIds.length > 0) {
      recipientsQuery = recipientsQuery.in("id", recipientIds);
    }

    const { data: contacts, error: contactsError } = await recipientsQuery;

    if (contactsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch recipients" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No eligible recipients found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // In test mode, only send to first recipient
    const recipients = testMode ? [contacts[0]] : contacts;

    // Update campaign status to 'sending'
    await userClient
      .from("email_campaigns")
      .update({ status: "sending" })
      .eq("id", campaignId);

    // Prepare HTML from blocks
    const blocks = template.blocks as EmailBlock[];
    const html = blocksToHtml(blocks, template.footer_address);

    // Prepare sender info
    const fromName = domain.from_name || senderProfile.name;
    const fromEmail = senderProfile.from_email;
    const replyTo = campaign.reply_to_mode === "shared" && campaign.reply_to_email
      ? campaign.reply_to_email
      : campaign.reply_to_mode === "custom" && campaign.reply_to_email
        ? campaign.reply_to_email
        : undefined;

    const resend = new Resend(resendApiKey);

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process in batches
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      for (const contact of batch) {
        try {
          // Create campaign_recipient record
          const { data: recipientRecord, error: recipientInsertError } = await adminClient
            .from("campaign_recipients")
            .insert({
              campaign_id: campaignId,
              contact_id: contact.id,
              status: "pending",
            })
            .select("id")
            .single();

          if (recipientInsertError) {
            console.error("Error creating recipient:", recipientInsertError);
            results.failed++;
            results.errors.push(`Failed to create recipient for ${contact.email}`);
            continue;
          }

          // Create outbox entry
          const { data: outboxEntry, error: outboxError } = await adminClient
            .from("email_outbox")
            .insert({
              campaign_id: campaignId,
              recipient_id: recipientRecord.id,
              from_name: fromName,
              from_email: fromEmail,
              reply_to: replyTo,
              to_email: contact.email,
              cc_emails: campaign.cc_emails || [],
              bcc_emails: campaign.bcc_emails || [],
              subject: template.subject,
              html_snapshot: html,
              status: "queued",
              status_timeline: [{ status: "queued", timestamp: new Date().toISOString() }],
            })
            .select("id")
            .single();

          if (outboxError) {
            console.error("Error creating outbox entry:", outboxError);
          }

          // Send via Resend
          const emailPayload: any = {
            from: `${fromName} <${fromEmail}>`,
            to: [contact.email],
            subject: template.subject,
            html: html,
          };

          if (replyTo) {
            emailPayload.reply_to = replyTo;
          }

          if (campaign.cc_emails && campaign.cc_emails.length > 0) {
            emailPayload.cc = campaign.cc_emails;
          }

          if (campaign.bcc_emails && campaign.bcc_emails.length > 0) {
            emailPayload.bcc = campaign.bcc_emails;
          }

          const { data: sendResult, error: sendError } = await resend.emails.send(emailPayload);

          if (sendError) {
            console.error("Resend error:", sendError);
            results.failed++;
            results.errors.push(`Failed to send to ${contact.email}: ${sendError.message}`);

            // Update recipient status to bounced
            await adminClient
              .from("campaign_recipients")
              .update({ status: "bounced" })
              .eq("id", recipientRecord.id);

            // Update outbox status
            if (outboxEntry) {
              await adminClient
                .from("email_outbox")
                .update({
                  status: "bounced",
                  status_timeline: [
                    { status: "queued", timestamp: new Date().toISOString() },
                    { status: "bounced", timestamp: new Date().toISOString() },
                  ],
                })
                .eq("id", outboxEntry.id);
            }

            continue;
          }

          // Success - update recipient and outbox
          const emailId = sendResult?.id || 'unknown';
          await adminClient
            .from("campaign_recipients")
            .update({
              resend_email_id: emailId,
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", recipientRecord.id);

          if (outboxEntry) {
            await adminClient
              .from("email_outbox")
              .update({
                resend_email_id: emailId,
                status: "sent",
                sent_at: new Date().toISOString(),
                status_timeline: [
                  { status: "queued", timestamp: new Date().toISOString() },
                  { status: "sent", timestamp: new Date().toISOString() },
                ],
              })
              .eq("id", outboxEntry.id);
          }

          results.sent++;
          console.log(`Sent email to ${contact.email}, resend_id: ${emailId}`);

        } catch (err) {
          console.error(`Error sending to ${contact.email}:`, err);
          results.failed++;
          results.errors.push(`Error sending to ${contact.email}`);
        }
      }

      // Delay between batches
      if (i + BATCH_SIZE < recipients.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    // Update campaign status
    const finalStatus = results.sent > 0 ? "sent" : "approved";
    await userClient
      .from("email_campaigns")
      .update({
        status: finalStatus,
        sent_at: results.sent > 0 ? new Date().toISOString() : null,
      })
      .eq("id", campaignId);

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors.slice(0, 10), // Limit error messages
        testMode: testMode || false,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Send campaign error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
