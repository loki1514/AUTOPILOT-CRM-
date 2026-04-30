-- Add columns to campaign_recipients for webhook correlation
ALTER TABLE campaign_recipients 
ADD COLUMN resend_email_id text,
ADD COLUMN delivered_at timestamptz;

-- Create index for fast webhook lookups
CREATE INDEX idx_recipients_resend_email_id 
ON campaign_recipients(resend_email_id) 
WHERE resend_email_id IS NOT NULL;