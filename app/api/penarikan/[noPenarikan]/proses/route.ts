import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    noPenarikan: string;
  }>;
};

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function toNullableNumber(value: unknown) {
  const normalized = String(value ?? "").trim();

  if (normalized.length === 0) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase belum terkonfigurasi di environment aplikasi." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const { noPenarikan } = await context.params;
  const currentNoPenarikan = decodeURIComponent(noPenarikan);

  if (!body) {
    return NextResponse.json({ error: "Payload proses penarikan tidak valid." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("fn_proses_penarikan_simpanan", {
    p_no_penarikan: currentNoPenarikan,
    p_status_baru: String(body.statusBaru ?? "").trim(),
    p_tanggal_proses: toNullableString(body.tanggalProses),
    p_nominal_disetujui: toNullableNumber(body.nominalDisetujui),
    p_catatan: toNullableString(body.catatan),
    p_diproses_oleh: String(body.diprosesOleh ?? "system").trim() || "system",
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Proses penarikan simpanan gagal." },
      { status: 400 },
    );
  }

  return NextResponse.json({ data });
}
