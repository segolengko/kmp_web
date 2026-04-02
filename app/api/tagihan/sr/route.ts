import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toNullableNumber(value: unknown) {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : null;
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
    return NextResponse.json({ error: "Payload SR tidak valid." }, { status: 400 });
  }

  const payload = {
    unit_bisnis_id: toNullableNumber(body.unitBisnisId),
    mitra_perusahaan_id: toNullableNumber(body.mitraPerusahaanId),
    no_sr: String(body.noSr ?? "").trim(),
    tanggal_sr: String(body.tanggalSr ?? "").trim(),
    deskripsi: toNullableString(body.deskripsi),
    updated_at: new Date().toISOString(),
  };

  if (!payload.unit_bisnis_id || !payload.mitra_perusahaan_id || !payload.no_sr || !payload.tanggal_sr) {
    return NextResponse.json({ error: "Field wajib SR belum lengkap." }, { status: 400 });
  }

  const { data, error } = await supabase.from("referensi_sr").insert(payload).select("id").single();

  if (error) {
    const message =
      error.code === "23505"
        ? "Nomor SR ini sudah terdaftar untuk unit dan mitra yang sama."
        : error.message ?? "Gagal menambah SR.";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
