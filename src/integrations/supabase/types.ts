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
      accounts: {
        Row: {
          account_number: string
          account_type: Database["public"]["Enums"]["account_type"]
          balance: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          iban: string
          id: string
          is_active: boolean
          is_primary: boolean
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          account_type?: Database["public"]["Enums"]["account_type"]
          balance?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          iban: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          account_type?: Database["public"]["Enums"]["account_type"]
          balance?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          iban?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      beneficiaries: {
        Row: {
          bank_name: string | null
          created_at: string
          iban: string
          id: string
          name: string
          nickname: string | null
          user_id: string
        }
        Insert: {
          bank_name?: string | null
          created_at?: string
          iban: string
          id?: string
          name: string
          nickname?: string | null
          user_id: string
        }
        Update: {
          bank_name?: string | null
          created_at?: string
          iban?: string
          id?: string
          name?: string
          nickname?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          account_id: string
          card_holder: string
          card_number: string
          card_type: Database["public"]["Enums"]["card_type"]
          created_at: string
          cvv: string | null
          daily_limit: number
          expiry_month: number
          expiry_year: number
          id: string
          status: Database["public"]["Enums"]["card_status"]
          user_id: string
        }
        Insert: {
          account_id: string
          card_holder: string
          card_number: string
          card_type?: Database["public"]["Enums"]["card_type"]
          created_at?: string
          cvv?: string | null
          daily_limit?: number
          expiry_month: number
          expiry_year: number
          id?: string
          status?: Database["public"]["Enums"]["card_status"]
          user_id: string
        }
        Update: {
          account_id?: string
          card_holder?: string
          card_number?: string
          card_type?: Database["public"]["Enums"]["card_type"]
          created_at?: string
          cvv?: string | null
          daily_limit?: number
          expiry_month?: number
          expiry_year?: number
          id?: string
          status?: Database["public"]["Enums"]["card_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          kind: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          preferred_language: string
          preferred_theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          preferred_language?: string
          preferred_theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          preferred_language?: string
          preferred_theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          description: string | null
          id: string
          recipient_iban: string | null
          recipient_name: string | null
          reference: string
          related_account_id: string | null
          status: Database["public"]["Enums"]["tx_status"]
          tx_type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          currency: Database["public"]["Enums"]["currency_code"]
          description?: string | null
          id?: string
          recipient_iban?: string | null
          recipient_name?: string | null
          reference: string
          related_account_id?: string | null
          status?: Database["public"]["Enums"]["tx_status"]
          tx_type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string | null
          id?: string
          recipient_iban?: string | null
          recipient_name?: string | null
          reference?: string
          related_account_id?: string | null
          status?: Database["public"]["Enums"]["tx_status"]
          tx_type?: Database["public"]["Enums"]["tx_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_related_account_id_fkey"
            columns: ["related_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      admin_delete_user: { Args: { p_user_id: string }; Returns: undefined }
      admin_monthly_processing: { Args: never; Returns: Json }
      admin_promote_to_admin: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      admin_reset_password_for: { Args: { p_user_id: string }; Returns: string }
      admin_set_user_active: {
        Args: { p_active: boolean; p_user_id: string }
        Returns: undefined
      }
      admin_topup: {
        Args: { p_amount: number; p_description: string; p_destination: string }
        Returns: Json
      }
      admin_transfer: {
        Args: {
          p_amount: number
          p_description: string
          p_from: string
          p_to: string
        }
        Returns: Json
      }
      apex_email_html: {
        Args: { p_body: string; p_full_name: string; p_title: string }
        Returns: string
      }
      execute_transfer: {
        Args: {
          p_amount: number
          p_description: string
          p_from_account: string
          p_recipient_name: string
          p_to_iban: string
        }
        Returns: Json
      }
      execute_transfer_smart: {
        Args: {
          p_amount: number
          p_description: string
          p_from_account: string
          p_recipient_name: string
          p_to_destination: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      issue_card: {
        Args: {
          p_account_id: string
          p_card_type: Database["public"]["Enums"]["card_type"]
          p_holder: string
        }
        Returns: string
      }
      lookup_recipient: { Args: { p_destination: string }; Returns: Json }
      open_account: {
        Args: {
          p_currency: Database["public"]["Enums"]["currency_code"]
          p_name: string
          p_type: Database["public"]["Enums"]["account_type"]
        }
        Returns: string
      }
    }
    Enums: {
      account_type: "current" | "savings" | "deposit"
      app_role: "admin" | "user"
      card_status: "active" | "blocked" | "frozen"
      card_type: "debit" | "credit" | "virtual"
      currency_code: "AZN" | "USD" | "EUR"
      tx_status: "pending" | "completed" | "failed" | "cancelled"
      tx_type:
        | "transfer_in"
        | "transfer_out"
        | "deposit"
        | "withdrawal"
        | "payment"
        | "fee"
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
      account_type: ["current", "savings", "deposit"],
      app_role: ["admin", "user"],
      card_status: ["active", "blocked", "frozen"],
      card_type: ["debit", "credit", "virtual"],
      currency_code: ["AZN", "USD", "EUR"],
      tx_status: ["pending", "completed", "failed", "cancelled"],
      tx_type: [
        "transfer_in",
        "transfer_out",
        "deposit",
        "withdrawal",
        "payment",
        "fee",
      ],
    },
  },
} as const
