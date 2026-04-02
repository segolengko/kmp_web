import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function toBoolean(value: unknown) {
  return value === true || value === "true";
}

function toNullableNumber(value: unknown) {
  const normalized = String(value ?? "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: "Payload jenis simpanan tidak valid." }, { status: 400 });
  }

  const payload = {
    kode: String(body.kode ?? "").trim(),
    nama: String(body.nama ?? "").trim(),
    kategori: String(body.kategori ?? "").trim(),
    frekuensi: String(body.frekuensi ?? "").trim(),
    wajib: toBoolean(body.wajib),
    model_pencatatan: String(body.modelPencatatan ?? "").trim(),
    boleh_cicil: toBoolean(body.bolehCicil),
    bisa_ditarik: toBoolean(body.bisaDitarik),
    nominal_default: toNullableNumber(body.nominalDefault) ?? 0,
    aktif: toBoolean(body.aktif),
    keterangan: toNullableString(body.keterangan),
    updated_at: new Date().toISOString(),
  };

  if (!payload.kode || !payload.nama || !payload.kategori || !payload.frekuensi || !payload.model_pencatatan) {
    return NextResponse.json({ error: "Field wajib jenis simpanan belum lengkap." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("jenis_simpanan")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message ?? "Gagal menambah jenis simpanan." }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
