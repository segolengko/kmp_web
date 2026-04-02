import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { anggotaPhotoBucket } = getSupabaseEnv();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase belum terkonfigurasi di environment aplikasi." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const noAnggota = String(formData.get("noAnggota") ?? "anggota").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File foto belum dipilih." }, { status: 400 });
  }

  const extension = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    : "jpg";
  const safeNoAnggota = slugify(noAnggota || "anggota");
  const filePath = `${safeNoAnggota}/${Date.now()}.${extension}`;

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(anggotaPhotoBucket)
    .upload(filePath, fileBuffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ??
          "Upload foto gagal. Pastikan bucket dan policy storage sudah siap.",
      },
      { status: 400 },
    );
  }

  const { data: signedUrlData } = await supabase.storage
    .from(anggotaPhotoBucket)
    .createSignedUrl(filePath, 60 * 60 * 24 * 7);

  const {
    data: { publicUrl },
  } = supabase.storage.from(anggotaPhotoBucket).getPublicUrl(filePath);

  if (noAnggota && noAnggota !== "anggota") {
    await supabase
      .from("anggota")
      .update({
        foto_url: signedUrlData?.signedUrl ?? publicUrl,
        foto_storage_key: filePath,
        foto_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("no_anggota", noAnggota);
  }

  return NextResponse.json({
    filePath,
    publicUrl: signedUrlData?.signedUrl ?? publicUrl,
    bucket: anggotaPhotoBucket,
  });
}
