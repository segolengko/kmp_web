import { createSupabaseServerClient } from "./supabase/server";

export type PembayaranOption = {
  noAnggota: string;
  namaLengkap: string;
};

export type JenisSimpananOption = {
  kode: string;
  nama: string;
  modelPencatatan: "TAGIHAN" | "TRANSAKSI_LANGSUNG";
};

export type TagihanTerbukaItem = {
  id: number;
  noTagihan: string;
  noAnggota: string;
  namaLengkap: string;
  kodeSimpanan: string;
  namaSimpanan: string;
  periodeLabel: string | null;
  nominalTagihan: number;
  nominalTerbayar: number;
  sisaTagihan: number;
  statusTagihan: string;
};

export type TransaksiSimpananItem = {
  id: number;
  noTransaksi: string;
  tanggalTransaksi: string | null;
  noAnggota: string;
  namaLengkap: string;
  kodeSimpanan: string;
  namaSimpanan: string;
  modelTransaksi: string;
  tipeTransaksi: string;
  metodeBayar: string | null;
  nominal: number;
  keterangan: string | null;
};

type SupabaseAnggotaOptionRow = {
  no_anggota: string;
  nama_lengkap: string;
};

type SupabaseJenisSimpananOptionRow = {
  kode: string;
  nama: string;
  model_pencatatan: "TAGIHAN" | "TRANSAKSI_LANGSUNG";
};

type SupabaseTagihanRow = {
  id: number;
  no_tagihan: string;
  periode_label: string | null;
  nominal_tagihan: number | string;
  nominal_terbayar: number | string;
  status_tagihan: string;
  anggota: Array<{
    no_anggota: string;
    nama_lengkap: string;
  }> | null;
  jenis_simpanan: Array<{
    kode: string;
    nama: string;
  }> | null;
};

type SupabaseTransaksiRow = {
  id: number;
  no_transaksi: string;
  tanggal_transaksi: string | null;
  model_transaksi: string;
  tipe_transaksi: string;
  metode_bayar: string | null;
  nominal: number | string;
  keterangan: string | null;
  anggota: Array<{
    no_anggota: string;
    nama_lengkap: string;
  }> | null;
  jenis_simpanan: Array<{
    kode: string;
    nama: string;
  }> | null;
};

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export async function getPembayaranSimpananData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      anggotaOptions: [] as PembayaranOption[],
      jenisSimpananOptions: [] as JenisSimpananOption[],
      tagihanTerbuka: [] as TagihanTerbukaItem[],
      transaksiTerbaru: [] as TransaksiSimpananItem[],
    };
  }

  const [anggotaResult, jenisResult, tagihanResult, transaksiResult] = await Promise.all([
    supabase
      .from("anggota")
      .select("no_anggota,nama_lengkap")
      .neq("status_anggota", "KELUAR")
      .order("no_anggota", { ascending: true }),
    supabase
      .from("jenis_simpanan")
      .select("kode,nama,model_pencatatan")
      .eq("aktif", true)
      .order("kode", { ascending: true }),
    supabase
      .from("tagihan_simpanan")
      .select(
        "id,no_tagihan,periode_label,nominal_tagihan,nominal_terbayar,status_tagihan,anggota:anggota_id(no_anggota,nama_lengkap),jenis_simpanan:jenis_simpanan_id(kode,nama)",
      )
      .in("status_tagihan", ["BELUM_BAYAR", "SEBAGIAN"])
      .order("tanggal_tagihan", { ascending: false })
      .limit(12),
    supabase
      .from("transaksi_simpanan")
      .select(
        "id,no_transaksi,tanggal_transaksi,model_transaksi,tipe_transaksi,metode_bayar,nominal,keterangan,anggota:anggota_id(no_anggota,nama_lengkap),jenis_simpanan:jenis_simpanan_id(kode,nama)",
      )
      .order("tanggal_transaksi", { ascending: false })
      .limit(12),
  ]);

  const anggotaOptions = (anggotaResult.data ?? []).map(
    (item: SupabaseAnggotaOptionRow): PembayaranOption => ({
      noAnggota: item.no_anggota,
      namaLengkap: item.nama_lengkap,
    }),
  );

  const jenisSimpananOptions = (jenisResult.data ?? []).map(
    (item: SupabaseJenisSimpananOptionRow): JenisSimpananOption => ({
      kode: item.kode,
      nama: item.nama,
      modelPencatatan: item.model_pencatatan,
    }),
  );

  const tagihanTerbuka = ((tagihanResult.data ?? []) as unknown as SupabaseTagihanRow[]).map(
    (item): TagihanTerbukaItem => ({
      id: item.id,
      noTagihan: item.no_tagihan,
      noAnggota: item.anggota?.[0]?.no_anggota ?? "-",
      namaLengkap: item.anggota?.[0]?.nama_lengkap ?? "-",
      kodeSimpanan: item.jenis_simpanan?.[0]?.kode ?? "-",
      namaSimpanan: item.jenis_simpanan?.[0]?.nama ?? "-",
      periodeLabel: item.periode_label,
      nominalTagihan: toNumber(item.nominal_tagihan),
      nominalTerbayar: toNumber(item.nominal_terbayar),
      sisaTagihan: toNumber(item.nominal_tagihan) - toNumber(item.nominal_terbayar),
      statusTagihan: item.status_tagihan,
    }),
  );

  const transaksiTerbaru = ((transaksiResult.data ?? []) as unknown as SupabaseTransaksiRow[]).map(
    (item): TransaksiSimpananItem => ({
      id: item.id,
      noTransaksi: item.no_transaksi,
      tanggalTransaksi: item.tanggal_transaksi,
      noAnggota: item.anggota?.[0]?.no_anggota ?? "-",
      namaLengkap: item.anggota?.[0]?.nama_lengkap ?? "-",
      kodeSimpanan: item.jenis_simpanan?.[0]?.kode ?? "-",
      namaSimpanan: item.jenis_simpanan?.[0]?.nama ?? "-",
      modelTransaksi: item.model_transaksi,
      tipeTransaksi: item.tipe_transaksi,
      metodeBayar: item.metode_bayar,
      nominal: toNumber(item.nominal),
      keterangan: item.keterangan,
    }),
  );

  return {
    anggotaOptions,
    jenisSimpananOptions,
    tagihanTerbuka,
    transaksiTerbaru,
  };
}
