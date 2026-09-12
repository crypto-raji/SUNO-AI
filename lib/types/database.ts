export type Mode = "student" | "business" | "creator" | "reading" | "general";
export type MessageRole = "user" | "assistant" | "system";
export type DocumentStatus = "uploading" | "uploaded" | "extracting" | "analyzing" | "ready" | "failed";
export type AudioStatus = "pending" | "generating" | "ready" | "failed" | "not_configured";
export type TranscriptStatus = "queued" | "processing" | "ready" | "failed";
export type UsageService = "ai_groq" | "ai_anthropic" | "tts" | "stt_assemblyai";

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  referral_code: string;
  referred_by: string | null;
  default_mode: Mode;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  mode: Mode;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  user_id: string;
  session_id: string | null;
  filename: string;
  file_type: string;
  file_size: number | null;
  file_url: string | null;
  extracted_text: string | null;
  detected_type: string | null;
  sections: { index: number; title: string; content: string }[] | null;
  status: DocumentStatus;
  error_message: string | null;
  created_at: string;
}

export interface AudioFile {
  id: string;
  user_id: string;
  session_id: string | null;
  document_id: string | null;
  title: string;
  audio_url: string | null;
  provider: string | null;
  duration_seconds: number | null;
  section: string | null;
  status: AudioStatus;
  error_message: string | null;
  created_at: string;
}

export interface Transcript {
  id: string;
  user_id: string;
  session_id: string | null;
  source_audio_url: string;
  provider: string;
  transcript_text: string | null;
  status: TranscriptStatus;
  error_message: string | null;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  created_at: string;
}

export interface Usage {
  id: string;
  user_id: string;
  service: UsageService;
  characters: number | null;
  tokens: number | null;
  created_at: string;
}

export interface AppSettings {
  id: number;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  updated_at: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          username: string | null;
          avatar_url: string | null;
          referral_code: string;
          referred_by: string | null;
          default_mode: Mode;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          referral_code?: string;
          referred_by?: string | null;
          default_mode?: Mode;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          referral_code?: string;
          referred_by?: string | null;
          default_mode?: Mode;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey";
            columns: ["referred_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          mode: Mode;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mode?: Mode;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mode?: Mode;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          role: MessageRole;
          content: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          role: MessageRole;
          content: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          role?: MessageRole;
          content?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          filename: string;
          file_type: string;
          file_size: number | null;
          file_url: string | null;
          extracted_text: string | null;
          detected_type: string | null;
          sections: Json | null;
          status: DocumentStatus;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          filename: string;
          file_type: string;
          file_size?: number | null;
          file_url?: string | null;
          extracted_text?: string | null;
          detected_type?: string | null;
          sections?: Json | null;
          status?: DocumentStatus;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          filename?: string;
          file_type?: string;
          file_size?: number | null;
          file_url?: string | null;
          extracted_text?: string | null;
          detected_type?: string | null;
          sections?: Json | null;
          status?: DocumentStatus;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      audio_files: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          document_id: string | null;
          title: string;
          audio_url: string | null;
          provider: string | null;
          duration_seconds: number | null;
          section: string | null;
          status: AudioStatus;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          document_id?: string | null;
          title: string;
          audio_url?: string | null;
          provider?: string | null;
          duration_seconds?: number | null;
          section?: string | null;
          status?: AudioStatus;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          document_id?: string | null;
          title?: string;
          audio_url?: string | null;
          provider?: string | null;
          duration_seconds?: number | null;
          section?: string | null;
          status?: AudioStatus;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audio_files_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audio_files_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audio_files_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      transcripts: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          source_audio_url: string;
          provider: string;
          transcript_text: string | null;
          status: TranscriptStatus;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          source_audio_url: string;
          provider?: string;
          transcript_text?: string | null;
          status?: TranscriptStatus;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          source_audio_url?: string;
          provider?: string;
          transcript_text?: string | null;
          status?: TranscriptStatus;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transcripts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transcripts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_user_id: string;
          referral_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referred_user_id: string;
          referral_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          referrer_id?: string;
          referred_user_id?: string;
          referral_code?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey";
            columns: ["referred_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey";
            columns: ["referrer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      usage: {
        Row: {
          id: string;
          user_id: string;
          service: UsageService;
          characters: number | null;
          tokens: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service: UsageService;
          characters?: number | null;
          tokens?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          service?: UsageService;
          characters?: number | null;
          tokens?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usage_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      app_settings: {
        Row: {
          id: number;
          maintenance_mode: boolean;
          maintenance_message: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          maintenance_mode?: boolean;
          maintenance_message?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          maintenance_mode?: boolean;
          maintenance_message?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      [key: string]: any;
    };
    Views: {
      [key: string]: any;
    };
    Functions: {
      [key: string]: any;
    };
    Enums: {
      [key: string]: any;
    };
    CompositeTypes: {
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
};
