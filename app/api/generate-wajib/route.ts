import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase belum terkonfigurasi di environment aplikasi." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: "Payload generate wajib tidak valid." }, { status: 400 });
  }

  const tanggalProses = toNullableString(body.tanggalProses);
  const dibuatOleh = String(body.dibuatOleh ?? "system").trim() || "system";

  if (!tanggalProses) {
    return NextResponse.json({ error: "Tanggal proses wajib diisi." }, { status: 400 });
  }

  const requestDate = new Date(tanggalProses);
  const periodeTahun = requestDate.getUTCFullYear();
  const periodeBulan = requestDate.getUTCMonth() + 1;

  const { data: existingBatch } = await supabase
    .from("batch_generate_tagihan_simpanan")
    .select(
      "id,kode_batch,status_batch,total_tagihan_terbentuk,jenis_simpanan:jenis_simpanan_id!inner(kode)",
    )
    .eq("jenis_simpanan.kode", "SW")
    .eq("periode_tahun", periodeTahun)
    .eq("periode_bulan", periodeBulan)
    .neq("status_batch", "DIBATALKAN")
    .maybeSingle();

  if (existingBatch) {
    return NextResponse.json(
      {
        error: `Generate simpanan wajib untuk periode ${periodeTahun}-${String(
          periodeBulan,
        ).padStart(2, "0")} sudah pernah dijalankan pada batch ${existingBatch.kode_batch}.`,
      },
      { status: 409 },
    );
  }

  const { data, error } = await supabase.rpc("fn_generate_tagihan_wajib_bulanan", {
    p_tanggal_proses: tanggalProses,
    p_dibuat_oleh: dibuatOleh,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Generate simpanan wajib gagal diproses." },
      { status: 400 },
    );
  }

  return NextResponse.json({ data });
}
