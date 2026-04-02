"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

export function createSupabaseBrowserClient() {
  const { url, key, isConfigured } = getSupabaseEnv();

  if (!isConfigured || !url || !key) {
    return null;
  }

  return createBrowserClient(url, key);
}
