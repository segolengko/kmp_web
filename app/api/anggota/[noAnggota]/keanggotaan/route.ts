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
    return NextResponse.json({ error: "Payload perubahan keanggotaan tidak valid." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("fn_update_keanggotaan_anggota", {
    p_no_anggota: currentNoAnggota,
    p_jenis_anggota_baru: String(body.jenisAnggotaBaru ?? "").trim() || null,
    p_status_anggota_baru: String(body.statusAnggotaBaru ?? "").trim() || null,
    p_tanggal_berlaku: String(body.tanggalBerlaku ?? "").trim() || null,
    p_tanggal_keluar_koperasi: String(body.tanggalKeluarKoperasi ?? "").trim() || null,
    p_alasan_perubahan: String(body.alasanPerubahan ?? "").trim() || null,
    p_keterangan: String(body.keterangan ?? "").trim() || null,
    p_dibuat_oleh: String(body.dibuatOleh ?? "system").trim() || "system",
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Perubahan keanggotaan gagal diproses." },
      { status: 400 },
    );
  }

  return NextResponse.json({ data });
}
