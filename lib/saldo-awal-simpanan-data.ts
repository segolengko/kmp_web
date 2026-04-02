import { createSupabaseServerClient } from "./supabase/server";

export type SaldoAwalSimpananItem = {
  id: number;
  noAnggota: string;
  namaLengkap: string;
  kodeSimpanan: string;
  namaSimpanan: string;
  tanggalSaldoAwal: string;
  saldoTerbentukAwal: number;
  saldoTitipanAwal: number;
  totalSetorAwal: number;
  totalTarikAwal: number;
  totalTagihanAwal: number;
  totalTunggakanAwal: number;
  catatan: string | null;
};

type SupabaseSaldoAwalRow = {
  id: number;
  tanggal_saldo_awal: string;
  saldo_terbentuk_awal: number | string;
  saldo_titipan_awal: number | string;
  total_setor_awal: number | string;
  total_tarik_awal: number | string;
  total_tagihan_awal: number | string;
  total_tunggakan_awal: number | string;
  catatan: string | null;
  anggota:
    | Array<{
        no_anggota: string;
        nama_lengkap: string;
      }>
    | {
        no_anggota: string;
        nama_lengkap: string;
      }
    | null;
  jenis_simpanan:
    | Array<{
        kode: string;
        nama: string;
      }>
    | {
        kode: string;
        nama: string;
      }
    | null;
};

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function pickSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getSaldoAwalSimpananData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as SaldoAwalSimpananItem[];
  }

  const { data, error } = await supabase
    .from("saldo_awal_simpanan_anggota")
    .select(
      "id,tanggal_saldo_awal,saldo_terbentuk_awal,saldo_titipan_awal,total_setor_awal,total_tarik_awal,total_tagihan_awal,total_tunggakan_awal,catatan,anggota:anggota_id(no_anggota,nama_lengkap),jenis_simpanan:jenis_simpanan_id(kode,nama)",
    )
    .order("tanggal_saldo_awal", { ascending: false })
    .order("id", { ascending: false });

  if (error || !data) {
    return [] as SaldoAwalSimpananItem[];
  }

  return (data as unknown as SupabaseSaldoAwalRow[]).map((row) => {
    const anggota = pickSingleRelation(row.anggota);
    const jenisSimpanan = pickSingleRelation(row.jenis_simpanan);

    return {
      id: row.id,
      noAnggota: anggota?.no_anggota ?? "-",
      namaLengkap: anggota?.nama_lengkap ?? "-",
      kodeSimpanan: jenisSimpanan?.kode ?? "-",
      namaSimpanan: jenisSimpanan?.nama ?? "-",
      tanggalSaldoAwal: row.tanggal_saldo_awal,
      saldoTerbentukAwal: toNumber(row.saldo_terbentuk_awal),
      saldoTitipanAwal: toNumber(row.saldo_titipan_awal),
      totalSetorAwal: toNumber(row.total_setor_awal),
      totalTarikAwal: toNumber(row.total_tarik_awal),
      totalTagihanAwal: toNumber(row.total_tagihan_awal),
      totalTunggakanAwal: toNumber(row.total_tunggakan_awal),
      catatan: row.catatan,
    };
  });
}
