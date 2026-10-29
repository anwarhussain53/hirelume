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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      candidates: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          location: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_pairs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          label: Database["public"]["Enums"]["fit_label"]
          notes: string | null
          organization_id: string
          resume_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          label: Database["public"]["Enums"]["fit_label"]
          notes?: string | null
          organization_id: string
          resume_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          label?: Database["public"]["Enums"]["fit_label"]
          notes?: string | null
          organization_id?: string
          resume_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_pairs_job_id_organization_id_fkey"
            columns: ["job_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "eval_pairs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_pairs_resume_id_organization_id_fkey"
            columns: ["resume_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      eval_runs: {
        Row: {
          agreement_rate: number | null
          avg_cost_usd: number | null
          avg_latency_ms: number | null
          confusion: Json | null
          error: string | null
          finished_at: string | null
          id: string
          model: string
          organization_id: string
          pair_count: number
          prompt_version: string
          results: Json | null
          started_at: string
          started_by: string | null
          status: Database["public"]["Enums"]["eval_run_status"]
        }
        Insert: {
          agreement_rate?: number | null
          avg_cost_usd?: number | null
          avg_latency_ms?: number | null
          confusion?: Json | null
          error?: string | null
          finished_at?: string | null
          id?: string
          model: string
          organization_id: string
          pair_count?: number
          prompt_version: string
          results?: Json | null
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["eval_run_status"]
        }
        Update: {
          agreement_rate?: number | null
          avg_cost_usd?: number | null
          avg_latency_ms?: number | null
          confusion?: Json | null
          error?: string | null
          finished_at?: string | null
          id?: string
          model?: string
          organization_id?: string
          pair_count?: number
          prompt_version?: string
          results?: Json | null
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["eval_run_status"]
        }
        Relationships: [
          {
            foreignKeyName: "eval_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_runs_started_by_organization_id_fkey"
            columns: ["started_by", "organization_id"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["recruiter_role"]
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["recruiter_role"]
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["recruiter_role"]
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_organization_id_fkey"
            columns: ["invited_by", "organization_id"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          location: string | null
          min_years_experience: number
          must_have_skills: string[]
          nice_to_have_skills: string[]
          organization_id: string
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
          work_mode: Database["public"]["Enums"]["work_mode"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          location?: string | null
          min_years_experience?: number
          must_have_skills: string[]
          nice_to_have_skills?: string[]
          organization_id: string
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
          work_mode?: Database["public"]["Enums"]["work_mode"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          location?: string | null
          min_years_experience?: number
          must_have_skills?: string[]
          nice_to_have_skills?: string[]
          organization_id?: string
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          work_mode?: Database["public"]["Enums"]["work_mode"]
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_organization_id_fkey"
            columns: ["created_by", "organization_id"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_usage: {
        Row: {
          cost_usd: number
          created_at: string
          error_code: string | null
          eval_run_id: string | null
          id: string
          input_tokens: number
          job_id: string | null
          latency_ms: number
          match_id: string | null
          model: string
          organization_id: string
          output_tokens: number
          provider: string
          purpose: Database["public"]["Enums"]["llm_purpose"]
          recruiter_id: string | null
          resume_id: string | null
          success: boolean
        }
        Insert: {
          cost_usd?: number
          created_at?: string
          error_code?: string | null
          eval_run_id?: string | null
          id?: string
          input_tokens?: number
          job_id?: string | null
          latency_ms: number
          match_id?: string | null
          model: string
          organization_id: string
          output_tokens?: number
          provider: string
          purpose: Database["public"]["Enums"]["llm_purpose"]
          recruiter_id?: string | null
          resume_id?: string | null
          success: boolean
        }
        Update: {
          cost_usd?: number
          created_at?: string
          error_code?: string | null
          eval_run_id?: string | null
          id?: string
          input_tokens?: number
          job_id?: string | null
          latency_ms?: number
          match_id?: string | null
          model?: string
          organization_id?: string
          output_tokens?: number
          provider?: string
          purpose?: Database["public"]["Enums"]["llm_purpose"]
          recruiter_id?: string | null
          resume_id?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "llm_usage_eval_run_id_organization_id_fkey"
            columns: ["eval_run_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "eval_runs"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "llm_usage_job_id_organization_id_fkey"
            columns: ["job_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "llm_usage_match_id_organization_id_fkey"
            columns: ["match_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "llm_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_usage_recruiter_id_organization_id_fkey"
            columns: ["recruiter_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "llm_usage_resume_id_organization_id_fkey"
            columns: ["resume_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      matches: {
        Row: {
          candidate_id: string
          created_at: string
          error: string | null
          gaps: Json | null
          id: string
          input_hash: string | null
          job_id: string
          model: string | null
          organization_id: string
          prompt_version: string | null
          reasons: Json | null
          resume_id: string
          score: number | null
          score_status: Database["public"]["Enums"]["score_status"]
          scored_at: string | null
          stage: Database["public"]["Enums"]["pipeline_stage"]
          stage_changed_at: string
          subscores: Json | null
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          error?: string | null
          gaps?: Json | null
          id?: string
          input_hash?: string | null
          job_id: string
          model?: string | null
          organization_id: string
          prompt_version?: string | null
          reasons?: Json | null
          resume_id: string
          score?: number | null
          score_status?: Database["public"]["Enums"]["score_status"]
          scored_at?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          stage_changed_at?: string
          subscores?: Json | null
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          error?: string | null
          gaps?: Json | null
          id?: string
          input_hash?: string | null
          job_id?: string
          model?: string | null
          organization_id?: string
          prompt_version?: string | null
          reasons?: Json | null
          resume_id?: string
          score?: number | null
          score_status?: Database["public"]["Enums"]["score_status"]
          scored_at?: string | null
          stage?: Database["public"]["Enums"]["pipeline_stage"]
          stage_changed_at?: string
          subscores?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_candidate_id_organization_id_fkey"
            columns: ["candidate_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "matches_job_id_organization_id_fkey"
            columns: ["job_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "matches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_resume_id_organization_id_fkey"
            columns: ["resume_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      outreach_emails: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          match_id: string
          model: string
          organization_id: string
          prompt_version: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          match_id: string
          model: string
          organization_id: string
          prompt_version: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          match_id?: string
          model?: string
          organization_id?: string
          prompt_version?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_emails_created_by_organization_id_fkey"
            columns: ["created_by", "organization_id"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "outreach_emails_match_id_organization_id_fkey"
            columns: ["match_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "outreach_emails_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiters: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["recruiter_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id: string
          organization_id: string
          role?: Database["public"]["Enums"]["recruiter_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["recruiter_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          embedding: string
          id: string
          organization_id: string
          resume_id: string
          token_count: number
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          embedding: string
          id?: string
          organization_id: string
          resume_id: string
          token_count: number
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string
          id?: string
          organization_id?: string
          resume_id?: string
          token_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "resume_chunks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_chunks_resume_id_organization_id_fkey"
            columns: ["resume_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      resumes: {
        Row: {
          candidate_id: string
          created_at: string
          error: string | null
          file_name: string
          file_sha256: string
          file_size_bytes: number
          id: string
          organization_id: string
          page_count: number | null
          parsed: Json | null
          raw_text: string | null
          redacted_text: string | null
          skills: string[]
          status: Database["public"]["Enums"]["resume_status"]
          storage_path: string
          total_years_experience: number | null
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          error?: string | null
          file_name: string
          file_sha256: string
          file_size_bytes: number
          id?: string
          organization_id: string
          page_count?: number | null
          parsed?: Json | null
          raw_text?: string | null
          redacted_text?: string | null
          skills?: string[]
          status?: Database["public"]["Enums"]["resume_status"]
          storage_path: string
          total_years_experience?: number | null
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          error?: string | null
          file_name?: string
          file_sha256?: string
          file_size_bytes?: number
          id?: string
          organization_id?: string
          page_count?: number | null
          parsed?: Json | null
          raw_text?: string | null
          redacted_text?: string | null
          skills?: string[]
          status?: Database["public"]["Enums"]["resume_status"]
          storage_path?: string
          total_years_experience?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_candidate_id_organization_id_fkey"
            columns: ["candidate_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "resumes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_org_id: { Args: never; Returns: string }
      is_org_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      eval_run_status: "running" | "completed" | "failed"
      fit_label: "strong" | "maybe" | "no_fit"
      job_status: "open" | "closed"
      llm_purpose:
        | "parse"
        | "embed_resume"
        | "embed_query"
        | "score"
        | "outreach"
        | "eval"
      pipeline_stage: "new" | "screened" | "interview" | "offer" | "rejected"
      recruiter_role: "admin" | "recruiter"
      resume_status:
        | "uploaded"
        | "extracting"
        | "parsing"
        | "embedding"
        | "ready"
        | "failed"
      score_status: "pending" | "scored" | "failed"
      work_mode: "onsite" | "hybrid" | "remote"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      eval_run_status: ["running", "completed", "failed"],
      fit_label: ["strong", "maybe", "no_fit"],
      job_status: ["open", "closed"],
      llm_purpose: [
        "parse",
        "embed_resume",
        "embed_query",
        "score",
        "outreach",
        "eval",
      ],
      pipeline_stage: ["new", "screened", "interview", "offer", "rejected"],
      recruiter_role: ["admin", "recruiter"],
      resume_status: [
        "uploaded",
        "extracting",
        "parsing",
        "embedding",
        "ready",
        "failed",
      ],
      score_status: ["pending", "scored", "failed"],
      work_mode: ["onsite", "hybrid", "remote"],
    },
  },
} as const
