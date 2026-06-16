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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          check_in: string
          check_out: string | null
          date: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          check_in?: string
          check_out?: string | null
          date?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          check_in?: string
          check_out?: string | null
          date?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          handled: boolean
          id: string
          message: string
          name: string
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          handled?: boolean
          id?: string
          message: string
          name: string
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          handled?: boolean
          id?: string
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          service: Database["public"]["Enums"]["service_type"] | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          service?: Database["public"]["Enums"]["service_type"] | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          service?: Database["public"]["Enums"]["service_type"] | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          order_index: number
          project_id: string
          status: Database["public"]["Enums"]["milestone_status"]
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number
          project_id: string
          status?: Database["public"]["Enums"]["milestone_status"]
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number
          project_id?: string
          status?: Database["public"]["Enums"]["milestone_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string
          id: string
          photo_urls: string[] | null
          project_id: string
          title: string
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          photo_urls?: string[] | null
          project_id: string
          title: string
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          photo_urls?: string[] | null
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          cover_image: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          progress: number
          project_manager_id: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          spent: number
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          cover_image?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          progress?: number
          project_manager_id?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          spent?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          cover_image?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          progress?: number
          project_manager_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          spent?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          ai_breakdown: Json | null
          ai_estimate: string | null
          area_sqft: number | null
          budget_range: string | null
          created_at: string
          email: string
          id: string
          location: string | null
          name: string
          phone: string
          project_type: string | null
          quoted_amount: number | null
          requirements: string
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["quote_status"]
          timeline: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_breakdown?: Json | null
          ai_estimate?: string | null
          area_sqft?: number | null
          budget_range?: string | null
          created_at?: string
          email: string
          id?: string
          location?: string | null
          name: string
          phone: string
          project_type?: string | null
          quoted_amount?: number | null
          requirements: string
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["quote_status"]
          timeline?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_breakdown?: Json | null
          ai_estimate?: string | null
          area_sqft?: number | null
          budget_range?: string | null
          created_at?: string
          email?: string
          id?: string
          location?: string | null
          name?: string
          phone?: string
          project_type?: string | null
          quoted_amount?: number | null
          requirements?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["quote_status"]
          timeline?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      staff_leaves: {
        Row: {
          created_at: string
          from_date: string
          id: string
          leave_type: string
          reason: string | null
          staff_user_id: string
          status: string
          to_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_date: string
          id?: string
          leave_type?: string
          reason?: string | null
          staff_user_id: string
          status?: string
          to_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          staff_user_id?: string
          status?: string
          to_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_salaries: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          period_month: string
          staff_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          period_month: string
          staff_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          period_month?: string
          staff_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_tasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_to: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          client_name: string
          client_role: string | null
          content: string
          created_at: string
          featured: boolean
          id: string
          project_type: Database["public"]["Enums"]["service_type"] | null
          published: boolean
          rating: number
        }
        Insert: {
          client_name: string
          client_role?: string | null
          content: string
          created_at?: string
          featured?: boolean
          id?: string
          project_type?: Database["public"]["Enums"]["service_type"] | null
          published?: boolean
          rating?: number
        }
        Update: {
          client_name?: string
          client_role?: string | null
          content?: string
          created_at?: string
          featured?: boolean
          id?: string
          project_type?: Database["public"]["Enums"]["service_type"] | null
          published?: boolean
          rating?: number
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          author_id: string
          created_at: string
          id: string
          message: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          message: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          message?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          customer_id: string
          id: string
          message: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          project_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          customer_id: string
          id?: string
          message: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          message?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      revoke_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: undefined
      }
      set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "customer"
      lead_status: "new" | "contacted" | "qualified" | "converted" | "lost"
      milestone_status: "pending" | "in_progress" | "completed" | "delayed"
      project_status:
        | "planning"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "cancelled"
      quote_status: "pending" | "reviewing" | "quoted" | "accepted" | "rejected"
      service_type:
        | "construction"
        | "interiors"
        | "real_estate"
        | "hvac"
        | "solar"
      task_status: "todo" | "in_progress" | "done" | "blocked"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
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
      app_role: ["admin", "staff", "customer"],
      lead_status: ["new", "contacted", "qualified", "converted", "lost"],
      milestone_status: ["pending", "in_progress", "completed", "delayed"],
      project_status: [
        "planning",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
      ],
      quote_status: ["pending", "reviewing", "quoted", "accepted", "rejected"],
      service_type: [
        "construction",
        "interiors",
        "real_estate",
        "hvac",
        "solar",
      ],
      task_status: ["todo", "in_progress", "done", "blocked"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
