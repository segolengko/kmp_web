import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toBoolean(value: unknown) {
  return value === true || value === "true";
}

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: "Payload mitra perusahaan tidak valid." }, { status: 400 });
  }

  const payload = {
    nama_perusahaan: String(body.namaPerusahaan ?? "").trim(),
    alamat: toNullableString(body.alamat),
    npwp: toNullableString(body.npwp),
    pic_nama: toNullableString(body.picNama),
    pic_jabatan: toNullableString(body.picJabatan),
    pic_email: toNullableString(body.picEmail),
    pic_hp: toNullableString(body.picHp),
    aktif: toBoolean(body.aktif),
    updated_at: new Date().toISOString(),
  };

  if (!payload.nama_perusahaan) {
    return NextResponse.json({ error: "Nama perusahaan wajib diisi." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("mitra_perusahaan")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message ?? "Gagal menambah mitra perusahaan." }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
