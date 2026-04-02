import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ noTransaksi: string }> },
) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase belum terkonfigurasi di environment aplikasi." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const { noTransaksi } = await context.params;

  const { data, error } = await supabase.rpc("fn_batalkan_pembayaran_simpanan", {
    p_no_transaksi: noTransaksi,
    p_tanggal_batal: toNullableString(body?.tanggalBatal),
    p_catatan: toNullableString(body?.catatan),
    p_dibatalkan_oleh: String(body?.dibatalkanOleh ?? "system").trim() || "system",
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Pembatalan pembayaran gagal diproses." },
      { status: 400 },
    );
  }

  return NextResponse.json({ data });
}
