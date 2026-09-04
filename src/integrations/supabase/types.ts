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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_name: string | null
          canonical_url: string | null
          category: string | null
          content: string | null
          created_at: string
          custom_schema: Json | null
          excerpt: string | null
          faq_schema: Json | null
          featured_image_url: string | null
          focus_keyword: string | null
          how_to_schema: Json | null
          id: string
          image_alt: string | null
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          noindex: boolean
          og_image_url: string | null
          published_at: string | null
          reading_time_minutes: number | null
          schema_type: string
          secondary_keywords: string[] | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          canonical_url?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          custom_schema?: Json | null
          excerpt?: string | null
          faq_schema?: Json | null
          featured_image_url?: string | null
          focus_keyword?: string | null
          how_to_schema?: Json | null
          id?: string
          image_alt?: string | null
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          noindex?: boolean
          og_image_url?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          schema_type?: string
          secondary_keywords?: string[] | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          canonical_url?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          custom_schema?: Json | null
          excerpt?: string | null
          faq_schema?: Json | null
          featured_image_url?: string | null
          focus_keyword?: string | null
          how_to_schema?: Json | null
          id?: string
          image_alt?: string | null
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          noindex?: boolean
          og_image_url?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          schema_type?: string
          secondary_keywords?: string[] | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          sort_order: number
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          sort_order?: number
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          sort_order?: number
          website_url?: string | null
        }
        Relationships: []
      }
      chat_client_orgs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          archived: boolean
          client_org_id: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["chat_conversation_kind"]
          last_message_at: string | null
          title: string
        }
        Insert: {
          archived?: boolean
          client_org_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["chat_conversation_kind"]
          last_message_at?: string | null
          title: string
        }
        Update: {
          archived?: boolean
          client_org_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["chat_conversation_kind"]
          last_message_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_client_org_id_fkey"
            columns: ["client_org_id"]
            isOneToOne: false
            referencedRelation: "chat_client_orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_display_profiles: {
        Row: {
          avatar_url: string | null
          display_name: string
          role_label: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          display_name: string
          role_label?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          display_name?: string
          role_label?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_members: {
        Row: {
          conversation_id: string
          joined_at: string
          last_read_at: string
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          last_read_at?: string
          role?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          last_read_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachment_mime: string | null
          attachment_name: string | null
          attachment_url: string | null
          body: string | null
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          sender_id: string
        }
        Insert: {
          attachment_mime?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          body?: string | null
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          attachment_mime?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          body?: string | null
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      city_pages: {
        Row: {
          city: string
          created_at: string
          cta_description: string | null
          cta_heading: string | null
          faqs: Json
          h1: string
          hero_image_url: string | null
          hero_subtitle: string | null
          id: string
          intro: string | null
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          process: string | null
          service: string
          service_slug: string | null
          slug: string
          sort_order: number
          stats: Json
          testimonials: Json
          updated_at: string
          why_us: string | null
        }
        Insert: {
          city: string
          created_at?: string
          cta_description?: string | null
          cta_heading?: string | null
          faqs?: Json
          h1: string
          hero_image_url?: string | null
          hero_subtitle?: string | null
          id?: string
          intro?: string | null
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          process?: string | null
          service: string
          service_slug?: string | null
          slug: string
          sort_order?: number
          stats?: Json
          testimonials?: Json
          updated_at?: string
          why_us?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          cta_description?: string | null
          cta_heading?: string | null
          faqs?: Json
          h1?: string
          hero_image_url?: string | null
          hero_subtitle?: string | null
          id?: string
          intro?: string | null
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          process?: string | null
          service?: string
          service_slug?: string | null
          slug?: string
          sort_order?: number
          stats?: Json
          testimonials?: Json
          updated_at?: string
          why_us?: string | null
        }
        Relationships: []
      }
      content_drafts: {
        Row: {
          created_at: string
          entity_id: string | null
          id: string
          payload: Json
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          id?: string
          payload?: Json
          scope: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          id?: string
          payload?: Json
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_team_allocations: {
        Row: {
          allocation_type: Database["public"]["Enums"]["allocation_type"]
          created_at: string
          created_by: string | null
          customer_id: string
          effective_month: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          allocation_type: Database["public"]["Enums"]["allocation_type"]
          created_at?: string
          created_by?: string | null
          customer_id: string
          effective_month?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          allocation_type?: Database["public"]["Enums"]["allocation_type"]
          created_at?: string
          created_by?: string | null
          customer_id?: string
          effective_month?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_team_allocations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          created_by: string | null
          currency: string
          email: string | null
          id: string
          monthly_ad_budget: number | null
          monthly_retainer: number | null
          notes: string | null
          onboarded_at: string | null
          phone: string | null
          status: Database["public"]["Enums"]["customer_status"]
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          email?: string | null
          id?: string
          monthly_ad_budget?: number | null
          monthly_retainer?: number | null
          notes?: string | null
          onboarded_at?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          email?: string | null
          id?: string
          monthly_ad_budget?: number | null
          monthly_retainer?: number | null
          notes?: string | null
          onboarded_at?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      footer_links: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          url: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          url?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          background_image_url: string | null
          created_at: string
          cta_link: string | null
          cta_text: string | null
          graphic_type: string | null
          id: string
          is_active: boolean
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          background_image_url?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          graphic_type?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          background_image_url?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          graphic_type?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          label: string
          section_key: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          label: string
          section_key: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          label?: string
          section_key?: string
          sort_order?: number
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          sort_order: number
          unit_price: number
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number
          unit_price?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string
          discount_amount: number
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          tax_percent: number
          terms: string | null
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id: string
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          tax_percent?: number
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          tax_percent?: number
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_url: string | null
          id: string
          is_completed: boolean | null
          lead_id: string
          scheduled_at: string | null
        }
        Insert: {
          activity_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_completed?: boolean | null
          lead_id: string
          scheduled_at?: string | null
        }
        Update: {
          activity_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_completed?: boolean | null
          lead_id?: string
          scheduled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_assignees: {
        Row: {
          assigned_at: string
          lead_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          lead_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          lead_id?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget: string | null
          company: string | null
          created_at: string
          created_by: string | null
          designation: string | null
          email: string | null
          follow_up_date: string | null
          followup_notified_at: string | null
          id: string
          last_contacted_at: string | null
          lead_label: string | null
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          priority: string | null
          reminder_sent: boolean | null
          requirement: string | null
          service_interest: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          website_url: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          designation?: string | null
          email?: string | null
          follow_up_date?: string | null
          followup_notified_at?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_label?: string | null
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          priority?: string | null
          reminder_sent?: boolean | null
          requirement?: string | null
          service_interest?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          designation?: string | null
          email?: string | null
          follow_up_date?: string | null
          followup_notified_at?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_label?: string | null
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          priority?: string | null
          reminder_sent?: boolean | null
          requirement?: string | null
          service_interest?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      legal_pages: {
        Row: {
          content_markdown: string
          created_at: string
          id: string
          is_published: boolean
          meta_description: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content_markdown?: string
          created_at?: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content_markdown?: string
          created_at?: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      metrics: {
        Row: {
          created_at: string
          icon_name: string | null
          id: string
          is_active: boolean
          label: string
          sort_order: number
          suffix: string | null
          value: string
        }
        Insert: {
          created_at?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          suffix?: string | null
          value: string
        }
        Update: {
          created_at?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          suffix?: string | null
          value?: string
        }
        Relationships: []
      }
      nav_links: {
        Row: {
          created_at: string
          href: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          href: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          href?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          task_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          task_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          task_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          invoice_id: string | null
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          payment_date: string
          reference_no: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          invoice_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          reference_no?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          invoice_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          reference_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_bookmarks: {
        Row: {
          category: string
          created_at: string
          icon: string | null
          id: string
          sort_order: number
          title: string
          url: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          sort_order?: number
          title: string
          url: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          sort_order?: number
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_notes: {
        Row: {
          color: string
          content: string | null
          created_at: string
          id: string
          is_pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_todos: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          is_done: boolean
          notes: string | null
          priority: string
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          notes?: string | null
          priority?: string
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          notes?: string | null
          priority?: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_logos: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          sort_order: number
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          sort_order?: number
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          sort_order?: number
          website_url?: string | null
        }
        Relationships: []
      }
      portfolio: {
        Row: {
          body_blocks: Json
          category: string | null
          client_name: string | null
          created_at: string
          duration: string | null
          full_description: string | null
          gallery: Json
          hero_image_url: string | null
          id: string
          image_url: string | null
          industry: string | null
          is_active: boolean
          is_featured: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          results: Json | null
          service_id: string | null
          short_description: string | null
          slug: string
          sort_order: number
          technologies: string[] | null
          testimonial_quote: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body_blocks?: Json
          category?: string | null
          client_name?: string | null
          created_at?: string
          duration?: string | null
          full_description?: string | null
          gallery?: Json
          hero_image_url?: string | null
          id?: string
          image_url?: string | null
          industry?: string | null
          is_active?: boolean
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          results?: Json | null
          service_id?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number
          technologies?: string[] | null
          testimonial_quote?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body_blocks?: Json
          category?: string | null
          client_name?: string | null
          created_at?: string
          duration?: string | null
          full_description?: string | null
          gallery?: Json
          hero_image_url?: string | null
          id?: string
          image_url?: string | null
          industry?: string | null
          is_active?: boolean
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          results?: Json | null
          service_id?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          technologies?: string[] | null
          testimonial_quote?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      process_steps: {
        Row: {
          color: string | null
          created_at: string
          description: string
          detail: string | null
          icon_name: string | null
          id: string
          is_active: boolean
          sort_order: number
          step_number: string | null
          title: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description: string
          detail?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          step_number?: string | null
          title: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string
          detail?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          step_number?: string | null
          title?: string
        }
        Relationships: []
      }
      project_files: {
        Row: {
          created_at: string
          file_name: string
          id: string
          journey_entry_id: string | null
          mime_type: string | null
          project_id: string
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          journey_entry_id?: string | null
          mime_type?: string | null
          project_id: string
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          journey_entry_id?: string | null
          mime_type?: string | null
          project_id?: string
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_journey_entry_id_fkey"
            columns: ["journey_entry_id"]
            isOneToOne: false
            referencedRelation: "project_journey_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "task_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_journey_entries: {
        Row: {
          author_id: string | null
          body: string | null
          created_at: string
          entry_type: string
          id: string
          metadata: Json
          occurred_at: string
          project_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          entry_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          project_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          created_at?: string
          entry_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          project_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_journey_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "task_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          progress: number
          project_id: string
          sort_order: number
          status: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          progress?: number
          project_id: string
          sort_order?: number
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          progress?: number
          project_id?: string
          sort_order?: number
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "task_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      revenue_engine_segments: {
        Row: {
          color: string
          created_at: string
          description: string
          icon_name: string | null
          id: string
          is_active: boolean
          label: string
          segment_key: string
          sort_order: number
          stat: string
          title: string
        }
        Insert: {
          color?: string
          created_at?: string
          description: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          label: string
          segment_key: string
          sort_order?: number
          stat: string
          title: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          label?: string
          segment_key?: string
          sort_order?: number
          stat?: string
          title?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          features: Json | null
          full_description: string | null
          icon_name: string | null
          id: string
          image_url: string | null
          is_active: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          short_description: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json | null
          full_description?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          short_description?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json | null
          full_description?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          short_description?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          case_studies_heading: string | null
          case_studies_subheading: string | null
          contact_address: string | null
          contact_email: string | null
          contact_form_heading: string | null
          contact_phone: string | null
          contact_section_heading: string | null
          credentials_url: string | null
          cta_badge_text: string | null
          cta_button_text: string | null
          cta_description: string | null
          cta_footer_text: string | null
          cta_heading: string | null
          cta_secondary_button_text: string | null
          faq_heading: string | null
          favicon_url: string | null
          footer_description: string | null
          funnel_heading: string | null
          funnel_revenue_description: string | null
          funnel_revenue_title: string | null
          funnel_subtitle: string | null
          funnel_traditional_description: string | null
          funnel_traditional_title: string | null
          google_maps_embed: string | null
          hero_badge_text: string | null
          hero_subtitle: string | null
          id: string
          logo_url: string | null
          metrics_heading: string | null
          metrics_subheading: string | null
          platform_expertise_heading: string | null
          process_heading: string | null
          process_subheading: string | null
          services_heading: string | null
          services_subheading: string | null
          site_name: string
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_twitter: string | null
          social_youtube: string | null
          tagline: string | null
          testimonials_heading: string | null
          updated_at: string
          whatsapp_number: string | null
          why_us_heading: string | null
          why_us_subheading: string | null
        }
        Insert: {
          case_studies_heading?: string | null
          case_studies_subheading?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_form_heading?: string | null
          contact_phone?: string | null
          contact_section_heading?: string | null
          credentials_url?: string | null
          cta_badge_text?: string | null
          cta_button_text?: string | null
          cta_description?: string | null
          cta_footer_text?: string | null
          cta_heading?: string | null
          cta_secondary_button_text?: string | null
          faq_heading?: string | null
          favicon_url?: string | null
          footer_description?: string | null
          funnel_heading?: string | null
          funnel_revenue_description?: string | null
          funnel_revenue_title?: string | null
          funnel_subtitle?: string | null
          funnel_traditional_description?: string | null
          funnel_traditional_title?: string | null
          google_maps_embed?: string | null
          hero_badge_text?: string | null
          hero_subtitle?: string | null
          id?: string
          logo_url?: string | null
          metrics_heading?: string | null
          metrics_subheading?: string | null
          platform_expertise_heading?: string | null
          process_heading?: string | null
          process_subheading?: string | null
          services_heading?: string | null
          services_subheading?: string | null
          site_name?: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          tagline?: string | null
          testimonials_heading?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          why_us_heading?: string | null
          why_us_subheading?: string | null
        }
        Update: {
          case_studies_heading?: string | null
          case_studies_subheading?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_form_heading?: string | null
          contact_phone?: string | null
          contact_section_heading?: string | null
          credentials_url?: string | null
          cta_badge_text?: string | null
          cta_button_text?: string | null
          cta_description?: string | null
          cta_footer_text?: string | null
          cta_heading?: string | null
          cta_secondary_button_text?: string | null
          faq_heading?: string | null
          favicon_url?: string | null
          footer_description?: string | null
          funnel_heading?: string | null
          funnel_revenue_description?: string | null
          funnel_revenue_title?: string | null
          funnel_subtitle?: string | null
          funnel_traditional_description?: string | null
          funnel_traditional_title?: string | null
          google_maps_embed?: string | null
          hero_badge_text?: string | null
          hero_subtitle?: string | null
          id?: string
          logo_url?: string | null
          metrics_heading?: string | null
          metrics_subheading?: string | null
          platform_expertise_heading?: string | null
          process_heading?: string | null
          process_subheading?: string | null
          services_heading?: string | null
          services_subheading?: string | null
          site_name?: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          tagline?: string | null
          testimonials_heading?: string | null
          updated_at?: string
          whatsapp_number?: string | null
          why_us_heading?: string | null
          why_us_subheading?: string | null
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          author_handle: string | null
          author_name: string | null
          caption: string | null
          comments: number
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          likes: number
          link_url: string | null
          platform: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          author_handle?: string | null
          author_name?: string | null
          caption?: string | null
          comments?: number
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          likes?: number
          link_url?: string | null
          platform?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          author_handle?: string | null
          author_name?: string | null
          caption?: string | null
          comments?: number
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          likes?: number
          link_url?: string | null
          platform?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      task_activities: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          task_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          task_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          task_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_activities_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          assigned_at: string
          task_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          task_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          mentioned_users: string[]
          task_id: string
          user_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          mentioned_users?: string[]
          task_id: string
          user_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          mentioned_users?: string[]
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_projects: {
        Row: {
          client_name: string | null
          color: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean
          name: string
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          description: string | null
          due_date: string | null
          due_notified_at: string | null
          id: string
          lead_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          sort_order: number
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          due_notified_at?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          due_notified_at?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "task_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          company: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          rating: number | null
          role: string | null
          sort_order: number
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          rating?: number | null
          role?: string | null
          sort_order?: number
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          rating?: number | null
          role?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      tracking_scripts: {
        Row: {
          body_code: string | null
          created_at: string
          head_code: string | null
          id: string
          is_active: boolean
          name: string
          script_id: string | null
          script_type: string
          updated_at: string
        }
        Insert: {
          body_code?: string | null
          created_at?: string
          head_code?: string | null
          id?: string
          is_active?: boolean
          name: string
          script_id?: string | null
          script_type: string
          updated_at?: string
        }
        Update: {
          body_code?: string | null
          created_at?: string
          head_code?: string | null
          id?: string
          is_active?: boolean
          name?: string
          script_id?: string | null
          script_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      trust_badges: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_enabled: boolean
          label: string
          slug: string
          sort_order: number
          sublabel: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_enabled?: boolean
          label: string
          slug: string
          sort_order?: number
          sublabel?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_enabled?: boolean
          label?: string
          slug?: string
          sort_order?: number
          sublabel?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_notification_prefs: {
        Row: {
          chat_message: boolean
          followup_due: boolean
          master_enabled: boolean
          mention: boolean
          task_assigned: boolean
          task_due: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_message?: boolean
          followup_due?: boolean
          master_enabled?: boolean
          mention?: boolean
          task_assigned?: boolean
          task_due?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_message?: boolean
          followup_due?: boolean
          master_enabled?: boolean
          mention?: boolean
          task_assigned?: boolean
          task_due?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          module: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module?: string
          user_id?: string
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
      video_showcase_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          poster_url: string | null
          sort_order: number
          title: string
          updated_at: string
          video_url: string
          video_url_hd: string | null
          video_url_sd: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          poster_url?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          video_url: string
          video_url_hd?: string | null
          video_url_sd?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          poster_url?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          video_url?: string
          video_url_hd?: string | null
          video_url_sd?: string | null
        }
        Relationships: []
      }
      why_us_reasons: {
        Row: {
          created_at: string
          description: string
          icon_name: string | null
          id: string
          is_active: boolean
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_permission: {
        Args: { _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { _conv_id: string; _user_id: string }
        Returns: boolean
      }
      is_lead_assignee: {
        Args: { _lead_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_task_assignee: {
        Args: { _task_id: string; _user_id: string }
        Returns: boolean
      }
      next_invoice_number: { Args: never; Returns: string }
    }
    Enums: {
      allocation_type: "revenue_share" | "ad_spend" | "hours" | "fixed_payout"
      app_role: "admin" | "moderator" | "user" | "team" | "client"
      chat_conversation_kind: "client_group" | "internal" | "dm"
      customer_status: "active" | "paused" | "churned" | "prospect"
      invoice_status: "draft" | "sent" | "partial" | "paid" | "overdue" | "void"
      lead_status: "new" | "contacted" | "qualified" | "converted" | "lost"
      payment_method:
        | "bank_transfer"
        | "upi"
        | "cash"
        | "card"
        | "cheque"
        | "other"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "review" | "done"
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
      allocation_type: ["revenue_share", "ad_spend", "hours", "fixed_payout"],
      app_role: ["admin", "moderator", "user", "team", "client"],
      chat_conversation_kind: ["client_group", "internal", "dm"],
      customer_status: ["active", "paused", "churned", "prospect"],
      invoice_status: ["draft", "sent", "partial", "paid", "overdue", "void"],
      lead_status: ["new", "contacted", "qualified", "converted", "lost"],
      payment_method: [
        "bank_transfer",
        "upi",
        "cash",
        "card",
        "cheque",
        "other",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "review", "done"],
    },
  },
} as const
