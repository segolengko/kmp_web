export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anggotaPhotoBucket =
    process.env.NEXT_PUBLIC_SUPABASE_ANGGOTA_PHOTO_BUCKET ?? "anggota-foto";

  return {
    url,
    key,
    anggotaPhotoBucket,
    isConfigured: Boolean(url && key),
  };
}
