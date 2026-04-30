export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          content: string | null
          created_at: string
          id: string
          lead_id: string
          rep_id: string | null
          type: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          lead_id: string
          rep_id?: string | null
          type: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          rep_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "bd_reps_with_load"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "bd_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          auto_approve: boolean | null
          cities: string[]
          created_at: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          rule_type: string
          schedule_time: string | null
          sender_profile_id: string | null
          user_id: string
        }
        Insert: {
          auto_approve?: boolean | null
          cities?: string[]
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          rule_type: string
          schedule_time?: string | null
          sender_profile_id?: string | null
          user_id: string
        }
        Update: {
          auto_approve?: boolean | null
          cities?: string[]
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          rule_type?: string
          schedule_time?: string | null
          sender_profile_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "sender_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bd_team_members: {
        Row: {
          avatar_url: string | null
          city: string
          city_focus: string[]
          created_at: string
          id: string
          is_active: boolean | null
          max_leads: number
          member_email: string
          member_name: string
          role: string | null
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          city: string
          city_focus?: string[]
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_leads?: number
          member_email: string
          member_name: string
          role?: string | null
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string
          city_focus?: string[]
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_leads?: number
          member_email?: string
          member_name?: string
          role?: string | null
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          contact_id: string
          delivered_at: string | null
          id: string
          opened_at: string | null
          resend_email_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["recipient_status"]
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          contact_id: string
          delivered_at?: string | null
          id?: string
          opened_at?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["recipient_status"]
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          contact_id?: string
          delivered_at?: string | null
          id?: string
          opened_at?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["recipient_status"]
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "email_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_analyses: {
        Row: {
          cost_per_seat: number | null
          created_at: string
          fitout_per_sqft: number
          id: string
          lead_id: string
          opex_per_sqft: number
          rent_per_sqft: number
          total_fitout_cost: number | null
          total_monthly_cost: number | null
          updated_at: string
        }
        Insert: {
          cost_per_seat?: number | null
          created_at?: string
          fitout_per_sqft?: number
          id?: string
          lead_id: string
          opex_per_sqft?: number
          rent_per_sqft?: number
          total_fitout_cost?: number | null
          total_monthly_cost?: number | null
          updated_at?: string
        }
        Update: {
          cost_per_seat?: number | null
          created_at?: string
          fitout_per_sqft?: number
          id?: string
          lead_id?: string
          opex_per_sqft?: number
          rent_per_sqft?: number
          total_fitout_cost?: number | null
          total_monthly_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_analyses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_briefs: {
        Row: {
          bd_tips: Json
          brief_date: string
          campaign_id: string | null
          city: string
          city_actionables: Json
          competitor_alerts: Json
          competitor_movement: Json | null
          created_at: string
          created_lead_ids: string[]
          expiring_leases: Json
          funded_startups: Json
          generated_by: string
          headline: string
          id: string
          micro_market_watch: Json | null
          published_at: string | null
          status: string | null
          suggested_actions: Json | null
          top_signals: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          bd_tips?: Json
          brief_date?: string
          campaign_id?: string | null
          city: string
          city_actionables?: Json
          competitor_alerts?: Json
          competitor_movement?: Json | null
          created_at?: string
          created_lead_ids?: string[]
          expiring_leases?: Json
          funded_startups?: Json
          generated_by?: string
          headline: string
          id?: string
          micro_market_watch?: Json | null
          published_at?: string | null
          status?: string | null
          suggested_actions?: Json | null
          top_signals?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          bd_tips?: Json
          brief_date?: string
          campaign_id?: string | null
          city?: string
          city_actionables?: Json
          competitor_alerts?: Json
          competitor_movement?: Json | null
          created_at?: string
          created_lead_ids?: string[]
          expiring_leases?: Json
          funded_startups?: Json
          generated_by?: string
          headline?: string
          id?: string
          micro_market_watch?: Json | null
          published_at?: string | null
          status?: string | null
          suggested_actions?: Json | null
          top_signals?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_briefs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_analytics: {
        Row: {
          bounced_count: number
          campaign_id: string
          clicked_count: number
          complained_count: number
          delivered_count: number
          id: string
          opened_count: number
          sent_count: number
          total_recipients: number
          updated_at: string
        }
        Insert: {
          bounced_count?: number
          campaign_id: string
          clicked_count?: number
          complained_count?: number
          delivered_count?: number
          id?: string
          opened_count?: number
          sent_count?: number
          total_recipients?: number
          updated_at?: string
        }
        Update: {
          bounced_count?: number
          campaign_id?: string
          clicked_count?: number
          complained_count?: number
          delivered_count?: number
          id?: string
          opened_count?: number
          sent_count?: number
          total_recipients?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bcc_emails: string[] | null
          cc_emails: string[] | null
          created_at: string
          id: string
          is_recurring: boolean
          name: string
          purpose: string | null
          reply_to_email: string | null
          reply_to_mode: string
          sender_profile_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          created_at?: string
          id?: string
          is_recurring?: boolean
          name: string
          purpose?: string | null
          reply_to_email?: string | null
          reply_to_mode?: string
          sender_profile_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          created_at?: string
          id?: string
          is_recurring?: boolean
          name?: string
          purpose?: string | null
          reply_to_email?: string | null
          reply_to_mode?: string
          sender_profile_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "sender_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_contacts: {
        Row: {
          bounced: boolean
          city: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          subscribed: boolean
          tags: string[] | null
          unsubscribed_at: string | null
          user_id: string
        }
        Insert: {
          bounced?: boolean
          city?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string
          subscribed?: boolean
          tags?: string[] | null
          unsubscribed_at?: string | null
          user_id: string
        }
        Update: {
          bounced?: boolean
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          subscribed?: boolean
          tags?: string[] | null
          unsubscribed_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_outbox: {
        Row: {
          bcc_emails: string[] | null
          campaign_id: string
          cc_emails: string[] | null
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          from_email: string
          from_name: string
          html_snapshot: string
          id: string
          opened_at: string | null
          recipient_id: string
          reply_to: string | null
          resend_email_id: string | null
          sent_at: string | null
          status: string
          status_timeline: Json
          subject: string
          to_email: string
        }
        Insert: {
          bcc_emails?: string[] | null
          campaign_id: string
          cc_emails?: string[] | null
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          from_email: string
          from_name: string
          html_snapshot: string
          id?: string
          opened_at?: string | null
          recipient_id: string
          reply_to?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          status?: string
          status_timeline?: Json
          subject: string
          to_email: string
        }
        Update: {
          bcc_emails?: string[] | null
          campaign_id?: string
          cc_emails?: string[] | null
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          from_email?: string
          from_name?: string
          html_snapshot?: string
          id?: string
          opened_at?: string | null
          recipient_id?: string
          reply_to?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          status?: string
          status_timeline?: Json
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_outbox_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_outbox_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "campaign_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          blocks: Json
          campaign_id: string
          created_at: string
          footer_address: string
          id: string
          subject: string
          updated_at: string
        }
        Insert: {
          blocks?: Json
          campaign_id: string
          created_at?: string
          footer_address?: string
          id?: string
          subject?: string
          updated_at?: string
        }
        Update: {
          blocks?: Json
          campaign_id?: string
          created_at?: string
          footer_address?: string
          id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      enrichment_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          latency_ms: number | null
          lead_id: string | null
          provider: string
          request: Json
          response: Json | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          lead_id?: string | null
          provider: string
          request?: Json
          response?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          lead_id?: string | null
          provider?: string
          request?: Json
          response?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_status: {
        Row: {
          counter_date: string
          created_at: string
          credits_remaining: number | null
          id: string
          last_error: string | null
          last_success_at: string | null
          last_sync_at: string | null
          metadata: Json
          provider: string
          total_calls_today: number
          total_leads_ingested: number
          updated_at: string
          user_id: string
        }
        Insert: {
          counter_date?: string
          created_at?: string
          credits_remaining?: number | null
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          last_sync_at?: string | null
          metadata?: Json
          provider: string
          total_calls_today?: number
          total_leads_ingested?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          counter_date?: string
          created_at?: string
          credits_remaining?: number | null
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          last_sync_at?: string | null
          metadata?: Json
          provider?: string
          total_calls_today?: number
          total_leads_ingested?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      intelligence_items: {
        Row: {
          action_notes: string | null
          city: string | null
          content_preview: string | null
          created_at: string
          headline: string
          id: string
          intelligence_type: string | null
          is_actionable: boolean | null
          micro_market: string | null
          relevance_date: string | null
          source_id: string | null
          source_url: string | null
          summary: string | null
          user_id: string
        }
        Insert: {
          action_notes?: string | null
          city?: string | null
          content_preview?: string | null
          created_at?: string
          headline: string
          id?: string
          intelligence_type?: string | null
          is_actionable?: boolean | null
          micro_market?: string | null
          relevance_date?: string | null
          source_id?: string | null
          source_url?: string | null
          summary?: string | null
          user_id: string
        }
        Update: {
          action_notes?: string | null
          city?: string | null
          content_preview?: string | null
          created_at?: string
          headline?: string
          id?: string
          intelligence_type?: string | null
          is_actionable?: boolean | null
          micro_market?: string | null
          relevance_date?: string | null
          source_id?: string | null
          source_url?: string | null
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_items_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "intelligence_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_sources: {
        Row: {
          city: string | null
          created_at: string
          file_path: string | null
          id: string
          intelligence_type: string | null
          is_active: boolean | null
          last_fetched_at: string | null
          micro_market: string | null
          name: string
          source_type: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          intelligence_type?: string | null
          is_active?: boolean | null
          last_fetched_at?: string | null
          micro_market?: string | null
          name: string
          source_type: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          intelligence_type?: string | null
          is_active?: boolean | null
          last_fetched_at?: string | null
          micro_market?: string | null
          name?: string
          source_type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      intent_indicators: {
        Row: {
          category: string
          color: string
          created_at: string
          description: string | null
          detection_keywords: string[] | null
          icon: string
          id: string
          is_active: boolean
          name: string
          signals_converted: number
          signals_detected: number
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          detection_keywords?: string[] | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          signals_converted?: number
          signals_detected?: number
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          description?: string | null
          detection_keywords?: string[] | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          signals_converted?: number
          signals_detected?: number
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      intent_signals: {
        Row: {
          brief_id: string | null
          claim: string | null
          confidence: number | null
          converted: boolean
          detected_at: string
          event_date: string | null
          id: string
          indicator_id: string | null
          lead_id: string
          published_date: string | null
          score_contribution: number
          signal_type: string
          signal_value: string | null
          source_api: string | null
          source_title: string | null
          source_type: string | null
          source_url: string | null
          verification_status: string | null
          why_it_matters: string | null
        }
        Insert: {
          brief_id?: string | null
          claim?: string | null
          confidence?: number | null
          converted?: boolean
          detected_at?: string
          event_date?: string | null
          id?: string
          indicator_id?: string | null
          lead_id: string
          published_date?: string | null
          score_contribution?: number
          signal_type: string
          signal_value?: string | null
          source_api?: string | null
          source_title?: string | null
          source_type?: string | null
          source_url?: string | null
          verification_status?: string | null
          why_it_matters?: string | null
        }
        Update: {
          brief_id?: string | null
          claim?: string | null
          confidence?: number | null
          converted?: boolean
          detected_at?: string
          event_date?: string | null
          id?: string
          indicator_id?: string | null
          lead_id?: string
          published_date?: string | null
          score_contribution?: number
          signal_type?: string
          signal_value?: string | null
          source_api?: string | null
          source_title?: string | null
          source_type?: string | null
          source_url?: string | null
          verification_status?: string | null
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intent_signals_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "daily_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intent_signals_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "intent_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intent_signals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      layout_images: {
        Row: {
          generated_at: string
          id: string
          image_url: string | null
          lead_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          image_url?: string | null
          lead_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          image_url?: string | null
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "layout_images_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_contacts: {
        Row: {
          apollo_person_id: string | null
          city: string | null
          country: string | null
          created_at: string
          departments: string[]
          email: string | null
          email_status: string | null
          enriched_at: string
          full_name: string
          id: string
          lead_id: string
          linkedin_url: string | null
          phone: string | null
          photo_url: string | null
          priority_rank: number
          seniority: string | null
          state: string | null
          title: string | null
        }
        Insert: {
          apollo_person_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          departments?: string[]
          email?: string | null
          email_status?: string | null
          enriched_at?: string
          full_name: string
          id?: string
          lead_id: string
          linkedin_url?: string | null
          phone?: string | null
          photo_url?: string | null
          priority_rank?: number
          seniority?: string | null
          state?: string | null
          title?: string | null
        }
        Update: {
          apollo_person_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          departments?: string[]
          email?: string | null
          email_status?: string | null
          enriched_at?: string
          full_name?: string
          id?: string
          lead_id?: string
          linkedin_url?: string | null
          phone?: string | null
          photo_url?: string | null
          priority_rank?: number
          seniority?: string | null
          state?: string | null
          title?: string | null
        }
        Relationships: []
      }
      lead_properties: {
        Row: {
          assigned_at: string | null
          brochure_sent_at: string | null
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          property_id: string
          stage: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          brochure_sent_at?: string | null
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          property_id: string
          stage?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          brochure_sent_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          property_id?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_properties_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          apollo_org_id: string | null
          assigned_to: string | null
          budget_max: number | null
          budget_min: number | null
          budget_monthly: number | null
          city: string | null
          client_name: string
          company: string
          company_domain: string | null
          company_size: string | null
          contactability_score: number
          created_at: string
          crm_status: string
          disqualified_claims: Json
          dm_confidence: string | null
          dm_linkedin_url: string | null
          dm_name: string | null
          dm_title: string | null
          email: string | null
          enriched_at: string | null
          enrichment_note: string | null
          enrichment_status: string | null
          full_name: string | null
          headcount: number
          id: string
          intent_score: number
          intent_signals: Json
          job_title: string | null
          last_activity: string
          last_enriched_provider: string | null
          linkedin_lead_id: string | null
          linkedin_url: string | null
          location: string | null
          meta_lead_id: string | null
          move_in_date: string | null
          notes: string | null
          office_size_needed: string | null
          outreach_readiness: number
          perplexity_summary: string | null
          phone: string | null
          source: string
          stage: Database["public"]["Enums"]["lead_stage"]
          timeline: string | null
          updated_at: string
          user_id: string | null
          verification_score: number
          website: string | null
        }
        Insert: {
          apollo_org_id?: string | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_monthly?: number | null
          city?: string | null
          client_name: string
          company: string
          company_domain?: string | null
          company_size?: string | null
          contactability_score?: number
          created_at?: string
          crm_status?: string
          disqualified_claims?: Json
          dm_confidence?: string | null
          dm_linkedin_url?: string | null
          dm_name?: string | null
          dm_title?: string | null
          email?: string | null
          enriched_at?: string | null
          enrichment_note?: string | null
          enrichment_status?: string | null
          full_name?: string | null
          headcount?: number
          id?: string
          intent_score?: number
          intent_signals?: Json
          job_title?: string | null
          last_activity?: string
          last_enriched_provider?: string | null
          linkedin_lead_id?: string | null
          linkedin_url?: string | null
          location?: string | null
          meta_lead_id?: string | null
          move_in_date?: string | null
          notes?: string | null
          office_size_needed?: string | null
          outreach_readiness?: number
          perplexity_summary?: string | null
          phone?: string | null
          source?: string
          stage?: Database["public"]["Enums"]["lead_stage"]
          timeline?: string | null
          updated_at?: string
          user_id?: string | null
          verification_score?: number
          website?: string | null
        }
        Update: {
          apollo_org_id?: string | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_monthly?: number | null
          city?: string | null
          client_name?: string
          company?: string
          company_domain?: string | null
          company_size?: string | null
          contactability_score?: number
          created_at?: string
          crm_status?: string
          disqualified_claims?: Json
          dm_confidence?: string | null
          dm_linkedin_url?: string | null
          dm_name?: string | null
          dm_title?: string | null
          email?: string | null
          enriched_at?: string | null
          enrichment_note?: string | null
          enrichment_status?: string | null
          full_name?: string | null
          headcount?: number
          id?: string
          intent_score?: number
          intent_signals?: Json
          job_title?: string | null
          last_activity?: string
          last_enriched_provider?: string | null
          linkedin_lead_id?: string | null
          linkedin_url?: string | null
          location?: string | null
          meta_lead_id?: string | null
          move_in_date?: string | null
          notes?: string | null
          office_size_needed?: string | null
          outreach_readiness?: number
          perplexity_summary?: string | null
          phone?: string | null
          source?: string
          stage?: Database["public"]["Enums"]["lead_stage"]
          timeline?: string | null
          updated_at?: string
          user_id?: string | null
          verification_score?: number
          website?: string | null
        }
        Relationships: []
      }
      module_settings: {
        Row: {
          enabled_modules: Json
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled_modules?: Json
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled_modules?: Json
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      payslip_audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Relationships: []
      }
      payslip_employees: {
        Row: {
          created_at: string
          department: string | null
          employee_email: string
          employee_id: string
          employee_name: string
          id: string
          is_active: boolean | null
          normalized_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          employee_email: string
          employee_id: string
          employee_name: string
          id?: string
          is_active?: boolean | null
          normalized_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          employee_email?: string
          employee_id?: string
          employee_name?: string
          id?: string
          is_active?: boolean | null
          normalized_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payslip_jobs: {
        Row: {
          created_at: string
          drive_file_id: string
          drive_file_name: string
          employee_id: string
          error_code: string | null
          error_message: string | null
          id: string
          match_confidence: number | null
          max_retries: number
          resend_email_id: string | null
          retry_count: number
          run_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["payslip_job_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          drive_file_id: string
          drive_file_name: string
          employee_id: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          match_confidence?: number | null
          max_retries?: number
          resend_email_id?: string | null
          retry_count?: number
          run_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["payslip_job_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          drive_file_id?: string
          drive_file_name?: string
          employee_id?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          match_confidence?: number | null
          max_retries?: number
          resend_email_id?: string | null
          retry_count?: number
          run_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["payslip_job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payslip_jobs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payslip_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslip_jobs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "payslip_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payslip_runs: {
        Row: {
          created_at: string
          drive_folder_id: string
          drive_folder_url: string
          email_body_template: string | null
          email_subject_template: string | null
          email_tone: string | null
          failed_count: number
          id: string
          locked_at: string | null
          payroll_month: string
          run_name: string | null
          sender_email: string
          sender_name: string
          sent_count: number
          status: Database["public"]["Enums"]["payslip_run_status"]
          total_jobs: number
          updated_at: string
          user_id: string
          validation_snapshot: Json | null
        }
        Insert: {
          created_at?: string
          drive_folder_id: string
          drive_folder_url: string
          email_body_template?: string | null
          email_subject_template?: string | null
          email_tone?: string | null
          failed_count?: number
          id?: string
          locked_at?: string | null
          payroll_month: string
          run_name?: string | null
          sender_email: string
          sender_name: string
          sent_count?: number
          status?: Database["public"]["Enums"]["payslip_run_status"]
          total_jobs?: number
          updated_at?: string
          user_id: string
          validation_snapshot?: Json | null
        }
        Update: {
          created_at?: string
          drive_folder_id?: string
          drive_folder_url?: string
          email_body_template?: string | null
          email_subject_template?: string | null
          email_tone?: string | null
          failed_count?: number
          id?: string
          locked_at?: string | null
          payroll_month?: string
          run_name?: string | null
          sender_email?: string
          sender_name?: string
          sent_count?: number
          status?: Database["public"]["Enums"]["payslip_run_status"]
          total_jobs?: number
          updated_at?: string
          user_id?: string
          validation_snapshot?: Json | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          amenities: string[] | null
          built_up_area: number | null
          cam_charges: number | null
          carpet_area: number | null
          company_description: string | null
          company_logo_url: string | null
          company_name: string | null
          company_tagline: string | null
          contact_address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          custom_fields: Json | null
          developer_name: string | null
          escalation: number | null
          id: string
          images: string[] | null
          key_distances: Json | null
          lease_term: string | null
          location: string | null
          property_name: string
          rent_per_sqft: number | null
          security_deposit: string | null
          team_image_url: string | null
          total_seats: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amenities?: string[] | null
          built_up_area?: number | null
          cam_charges?: number | null
          carpet_area?: number | null
          company_description?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_tagline?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          custom_fields?: Json | null
          developer_name?: string | null
          escalation?: number | null
          id?: string
          images?: string[] | null
          key_distances?: Json | null
          lease_term?: string | null
          location?: string | null
          property_name: string
          rent_per_sqft?: number | null
          security_deposit?: string | null
          team_image_url?: string | null
          total_seats?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amenities?: string[] | null
          built_up_area?: number | null
          cam_charges?: number | null
          carpet_area?: number | null
          company_description?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_tagline?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          custom_fields?: Json | null
          developer_name?: string | null
          escalation?: number | null
          id?: string
          images?: string[] | null
          key_distances?: Json | null
          lease_term?: string | null
          location?: string | null
          property_name?: string
          rent_per_sqft?: number | null
          security_deposit?: string | null
          team_image_url?: string | null
          total_seats?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      requirements: {
        Row: {
          additional_notes: string | null
          budget_per_seat: number | null
          city: string
          created_at: string
          id: string
          lead_id: string
          micro_market: string | null
          preferred_move_in: string | null
          target_seats: number
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          budget_per_seat?: number | null
          city: string
          created_at?: string
          id?: string
          lead_id: string
          micro_market?: string | null
          preferred_move_in?: string | null
          target_seats: number
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          budget_per_seat?: number | null
          city?: string
          created_at?: string
          id?: string
          lead_id?: string
          micro_market?: string | null
          preferred_move_in?: string | null
          target_seats?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirements_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sender_profiles: {
        Row: {
          created_at: string
          default_reply_to_email: string | null
          default_reply_to_mode: string
          domain_id: string
          from_email: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_reply_to_email?: string | null
          default_reply_to_mode?: string
          domain_id: string
          from_email: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_reply_to_email?: string | null
          default_reply_to_mode?: string
          domain_id?: string
          from_email?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sender_profiles_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "sending_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      sending_domains: {
        Row: {
          created_at: string
          dns_records: Json | null
          domain: string
          from_email: string
          from_name: string
          id: string
          resend_domain_id: string | null
          status: Database["public"]["Enums"]["domain_status"]
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          dns_records?: Json | null
          domain: string
          from_email: string
          from_name?: string
          id?: string
          resend_domain_id?: string | null
          status?: Database["public"]["Enums"]["domain_status"]
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          dns_records?: Json | null
          domain?: string
          from_email?: string
          from_name?: string
          id?: string
          resend_domain_id?: string | null
          status?: Database["public"]["Enums"]["domain_status"]
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      space_calculations: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          modules: Json
          total_carpet_area: number
          total_seats: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          modules?: Json
          total_carpet_area?: number
          total_seats?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          modules?: Json
          total_carpet_area?: number
          total_seats?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_calculations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      space_library: {
        Row: {
          area_sqft: number
          category: string
          created_at: string
          id: string
          images: string[] | null
          is_custom: boolean
          is_standard: boolean
          length_ft: number | null
          name: string
          seats: number
          updated_at: string
          width_ft: number | null
        }
        Insert: {
          area_sqft: number
          category: string
          created_at?: string
          id?: string
          images?: string[] | null
          is_custom?: boolean
          is_standard?: boolean
          length_ft?: number | null
          name: string
          seats?: number
          updated_at?: string
          width_ft?: number | null
        }
        Update: {
          area_sqft?: number
          category?: string
          created_at?: string
          id?: string
          images?: string[] | null
          is_custom?: boolean
          is_standard?: boolean
          length_ft?: number | null
          name?: string
          seats?: number
          updated_at?: string
          width_ft?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      bd_reps_with_load: {
        Row: {
          active_leads_count: number | null
          avatar_url: string | null
          city: string | null
          city_focus: string[] | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          max_leads: number | null
          member_email: string | null
          member_name: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          active_leads_count?: never
          avatar_url?: string | null
          city?: string | null
          city_focus?: string[] | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          max_leads?: number | null
          member_email?: string | null
          member_name?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          active_leads_count?: never
          avatar_url?: string | null
          city?: string | null
          city_focus?: string[] | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          max_leads?: number | null
          member_email?: string | null
          member_name?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bump_integration_status: {
        Args: {
          _credits_remaining?: number
          _error?: string
          _leads_ingested?: number
          _provider: string
          _success: boolean
          _user_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_master: { Args: { _user_id: string }; Returns: boolean }
      seed_default_indicators: {
        Args: { _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "master_admin" | "admin" | "rep"
      campaign_status: "draft" | "approved" | "sending" | "sent" | "paused"
      domain_status: "pending" | "verified" | "failed"
      lead_stage: "lead" | "qualified" | "proposal" | "closed" | "lost"
      payslip_job_status: "pending" | "processing" | "sent" | "failed"
      payslip_run_status:
        | "draft"
        | "validating"
        | "validated"
        | "sending"
        | "partial"
        | "completed"
        | "failed"
      recipient_status:
        | "pending"
        | "sent"
        | "delivered"
        | "opened"
        | "clicked"
        | "bounced"
        | "complained"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["master_admin", "admin", "rep"],
      campaign_status: ["draft", "approved", "sending", "sent", "paused"],
      domain_status: ["pending", "verified", "failed"],
      lead_stage: ["lead", "qualified", "proposal", "closed", "lost"],
      payslip_job_status: ["pending", "processing", "sent", "failed"],
      payslip_run_status: [
        "draft",
        "validating",
        "validated",
        "sending",
        "partial",
        "completed",
        "failed",
      ],
      recipient_status: [
        "pending",
        "sent",
        "delivered",
        "opened",
        "clicked",
        "bounced",
        "complained",
      ],
    },
  },
} as const
