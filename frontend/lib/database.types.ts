export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          priority: 'low' | 'medium' | 'high' | 'critical'
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          user_id: string
          user_email: string
          assigned_to: string | null
          created_at: string
          updated_at: string
          resolved_at: string | null
          ai_classification: Json | null
          resolution: Json | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          priority?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          user_id: string
          user_email: string
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          ai_classification?: Json | null
          resolution?: Json | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          priority?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          user_id?: string
          user_email?: string
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          ai_classification?: Json | null
          resolution?: Json | null
        }
      }
      chat_messages: {
        Row: {
          id: string
          ticket_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          timestamp: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          ticket_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          timestamp?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          ticket_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          timestamp?: string
          metadata?: Json | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'user' | 'admin' | 'agent'
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role?: 'user' | 'admin' | 'agent'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'user' | 'admin' | 'agent'
          created_at?: string
        }
      }
      automation_scripts: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          script_path: string
          parameters: Json
          success_rate: number
          last_run: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: string
          script_path: string
          parameters: Json
          success_rate?: number
          last_run?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          script_path?: string
          parameters?: Json
          success_rate?: number
          last_run?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
