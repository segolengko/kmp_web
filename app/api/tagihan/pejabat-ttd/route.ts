import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    return NextResponse.json({ error: "Payload pejabat tanda tangan tidak valid." }, { status: 400 });
  }

  const payload = {
    nama_pejabat: String(body.namaPejabat ?? "").trim(),
    jabatan_pejabat: String(body.jabatanPejabat ?? "").trim().toUpperCase(),
    unit_bisnis_id:
      body.unitBisnisId === null || body.unitBisnisId === undefined || String(body.unitBisnisId).trim() === ""
        ? null
        : Number(body.unitBisnisId),
    mitra_perusahaan_id:
      body.mitraPerusahaanId === null || body.mitraPerusahaanId === undefined || String(body.mitraPerusahaanId).trim() === ""
        ? null
        : Number(body.mitraPerusahaanId),
    modul: String(body.modul ?? "").trim(),
    aktif: toBoolean(body.aktif),
    updated_at: new Date().toISOString(),
  };

  if (!payload.nama_pejabat || !payload.jabatan_pejabat || !payload.unit_bisnis_id || !payload.mitra_perusahaan_id || !payload.modul) {
    return NextResponse.json({ error: "Unit bisnis, mitra, modul, nama pejabat, dan jabatan wajib diisi." }, { status: 400 });
  }

  const { data, error } = await supabase.from("pejabat_ttd").insert(payload).select("id").single();

  if (error) {
    return NextResponse.json({ error: error.message ?? "Gagal menambah pejabat tanda tangan." }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
