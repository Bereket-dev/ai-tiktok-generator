import { createClient } from "@supabase/supabase-js";

// ----------------------------------------------------------------
// Database types — mirrors 0001_initial_schema.sql
// ----------------------------------------------------------------
export type ProjectStatus =
  | "draft"
  | "uploading"
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export type RenderStatus = "queued" | "processing" | "ready" | "failed";
export type AssetType = "selfie" | "preview" | "final";
export type Locale = "am" | "en";

export interface VideoProject {
  id: string;
  prompt_key: string;
  locale: Locale;
  source_url: string | null;
  source_rights_confirmed: boolean;
  status: ProjectStatus;
  user_id: string | null;
  session_id: string | null;
  free_video_used: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoAsset {
  id: string;
  project_id: string;
  asset_type: AssetType;
  cloudinary_url: string;
  public_id: string | null;
  duration_s: number | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  created_at: string;
}

export interface VideoRender {
  id: string;
  project_id: string;
  status: RenderStatus;
  instructions: Record<string, unknown>;
  output_url: string | null;
  preview_url: string | null;
  error_message: string | null;
  inngest_event_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostingRequest {
  id: string;
  project_id: string;
  tiktok_username: string | null;
  privacy_level: string;
  allow_comments: boolean;
  allow_duet: boolean;
  allow_stitch: boolean;
  brand_content: boolean;
  agreed_to_terms: boolean;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      video_projects: {
        Row: VideoProject;
        Insert: Omit<VideoProject, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<VideoProject, "id" | "created_at">>;
      };
      video_assets: {
        Row: VideoAsset;
        Insert: Omit<VideoAsset, "id" | "created_at">;
        Update: Partial<Omit<VideoAsset, "id" | "created_at">>;
      };
      video_renders: {
        Row: VideoRender;
        Insert: Omit<VideoRender, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<VideoRender, "id" | "created_at">>;
      };
      posting_requests: {
        Row: PostingRequest;
        Insert: Omit<PostingRequest, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PostingRequest, "id" | "created_at">>;
      };
    };
  };
};

// ----------------------------------------------------------------
// Server-only client (service role — never sent to browser)
// ----------------------------------------------------------------
let _serverClient: ReturnType<typeof createClient<Database>> | null = null;

export function getServerSupabase() {
  if (_serverClient) return _serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }

  _serverClient = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _serverClient;
}

/**
 * Convenience wrapper — returns the server client typed as `any` so
 * route handlers can use plain object literals without fighting the
 * Supabase generic inference engine. The schema is still enforced at
 * the DB level via the migration.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function db(): any {
  return getServerSupabase();
}

// ----------------------------------------------------------------
// Browser client (anon key — safe to expose)
// ----------------------------------------------------------------
let _browserClient: ReturnType<typeof createClient<Database>> | null = null;

export function getBrowserSupabase() {
  if (_browserClient) return _browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars"
    );
  }

  _browserClient = createClient<Database>(url, key);
  return _browserClient;
}
