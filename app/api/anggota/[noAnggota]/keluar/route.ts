import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    noAnggota: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase belum terkonfigurasi di environment aplikasi." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const { noAnggota } = await context.params;
  const currentNoAnggota = decodeURIComponent(noAnggota);

  if (!body) {
    return NextResponse.json({ error: "Payload proses keluar tidak valid." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("fn_proses_anggota_keluar_lengkap", {
    p_no_anggota: currentNoAnggota,
    p_tanggal_keluar: String(body.tanggalKeluar ?? "").trim() || null,
    p_alasan_keluar: String(body.alasanKeluar ?? "").trim() || null,
    p_keterangan: String(body.keterangan ?? "").trim() || null,
    p_dibuat_oleh: String(body.dibuatOleh ?? "system").trim() || "system",
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Proses keluar anggota gagal diproses." },
      { status: 400 },
    );
  }

  return NextResponse.json({ data });
}
