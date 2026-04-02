import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    return NextResponse.json({ error: "Payload pembayaran simpanan tidak valid." }, { status: 400 });
  }

  const model = String(body.model ?? "").trim();
  const kodeSimpanan = String(body.kodeSimpanan ?? "").trim();

  const { data: jenisSimpanan, error: jenisError } = await supabase
    .from("jenis_simpanan")
    .select("kode,nama,model_pencatatan")
    .eq("kode", kodeSimpanan)
    .maybeSingle();

  if (jenisError) {
    return NextResponse.json(
      { error: jenisError.message ?? "Gagal memverifikasi jenis simpanan." },
      { status: 400 },
    );
  }

  if (!jenisSimpanan) {
    return NextResponse.json({ error: "Jenis simpanan tidak ditemukan." }, { status: 400 });
  }

  if (jenisSimpanan.model_pencatatan !== model) {
    return NextResponse.json(
      {
        error:
          jenisSimpanan.model_pencatatan === "TAGIHAN"
            ? `Jenis simpanan ${jenisSimpanan.kode} - ${jenisSimpanan.nama} wajib diproses lewat Pembayaran Tagihan.`
            : `Jenis simpanan ${jenisSimpanan.kode} - ${jenisSimpanan.nama} wajib diproses lewat Transaksi Langsung.`,
      },
      { status: 400 },
    );
  }

  if (model === "TAGIHAN") {
    const { data, error } = await supabase.rpc("fn_bayar_tagihan_simpanan", {
      p_no_anggota: String(body.noAnggota ?? "").trim(),
      p_kode_simpanan: kodeSimpanan,
      p_tanggal_transaksi: toNullableString(body.tanggalTransaksi),
      p_nominal_bayar: toNullableNumber(body.nominal),
      p_metode_bayar: String(body.metodeBayar ?? "TRANSFER").trim() || "TRANSFER",
      p_keterangan: toNullableString(body.keterangan),
      p_created_by: String(body.dibuatOleh ?? "system").trim() || "system",
    });

    if (error) {
      return NextResponse.json(
        { error: error.message ?? "Pembayaran tagihan gagal diproses." },
        { status: 400 },
      );
    }

    return NextResponse.json({ data });
  }

  if (model === "TRANSAKSI_LANGSUNG") {
    const { data, error } = await supabase.rpc("fn_catat_transaksi_simpanan_langsung", {
      p_no_anggota: String(body.noAnggota ?? "").trim(),
      p_kode_simpanan: kodeSimpanan,
      p_tanggal_transaksi: toNullableString(body.tanggalTransaksi),
      p_tipe_transaksi: String(body.tipeTransaksi ?? "").trim(),
      p_nominal: toNullableNumber(body.nominal),
      p_metode_bayar: String(body.metodeBayar ?? "TUNAI").trim() || "TUNAI",
      p_keterangan: toNullableString(body.keterangan),
      p_created_by: String(body.dibuatOleh ?? "system").trim() || "system",
    });

    if (error) {
      return NextResponse.json(
        { error: error.message ?? "Transaksi simpanan langsung gagal diproses." },
        { status: 400 },
      );
    }

    return NextResponse.json({ data });
  }

  return NextResponse.json(
    { error: "Model pembayaran tidak dikenali." },
    { status: 400 },
  );
}
