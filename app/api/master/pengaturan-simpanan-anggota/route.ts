import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function toNullableNumber(value: unknown) {
  const normalized = String(value ?? "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value: unknown) {
  return value === true || value === "true";
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Payload pengaturan simpanan anggota tidak valid." }, { status: 400 });
  }

  const payload = {
    anggota_id: toNullableNumber(body.anggotaId),
    jenis_simpanan_id: toNullableNumber(body.jenisSimpananId),
    nama_pengaturan: String(body.namaPengaturan ?? "").trim(),
    nominal: toNullableNumber(body.nominal),
    berlaku_mulai: String(body.berlakuMulai ?? "").trim(),
    berlaku_sampai: toNullableString(body.berlakuSampai),
    aktif: toBoolean(body.aktif),
    keterangan: toNullableString(body.keterangan),
    updated_at: new Date().toISOString(),
  };

  if (!payload.anggota_id || !payload.jenis_simpanan_id || !payload.nama_pengaturan || !payload.nominal || !payload.berlaku_mulai) {
    return NextResponse.json({ error: "Field wajib pengaturan simpanan anggota belum lengkap." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pengaturan_simpanan_anggota")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message ?? "Gagal menambah pengaturan simpanan anggota." }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
