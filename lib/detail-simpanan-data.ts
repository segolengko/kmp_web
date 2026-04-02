import { createSupabaseServerClient } from "./supabase/server";

type RelationValue<T> = T | T[] | null;

type AnggotaIdentityRow = {
  id: number;
  no_anggota: string;
  nama_lengkap: string;
  jenis_anggota: string;
  status_anggota: string;
  departemen: string | null;
  jabatan: string | null;
};

type SaldoRow = {
  id: number;
  jenis_simpanan_id?: number;
  saldo_terbentuk: number | string;
  saldo_ditahan: number | string;
  saldo_tersedia: number | string;
  total_setor: number | string;
  total_tarik: number | string;
  total_tagihan: number | string;
  total_tunggakan: number | string;
  terakhir_dihitung_at: string | null;
  jenis_simpanan: RelationValue<{
    kode: string;
    nama: string;
  }>;
};

type TitipanRow = {
  jenis_simpanan_id: number;
  saldo_titipan: number | string;
};

type TagihanRow = {
  id: number;
  no_tagihan: string;
  periode_label: string | null;
  tanggal_tagihan: string;
  tanggal_jatuh_tempo: string | null;
  nominal_tagihan: number | string;
  nominal_terbayar: number | string;
  status_tagihan: string;
  keterangan: string | null;
  jenis_simpanan: RelationValue<{
    kode: string;
    nama: string;
  }>;
};

type TransaksiRow = {
  id: number;
  no_transaksi: string;
  tanggal_transaksi: string;
  model_transaksi: string;
  tipe_transaksi: string;
  metode_bayar: string | null;
  nominal: number | string;
  keterangan: string | null;
  created_at: string;
  jenis_simpanan: RelationValue<{
    kode: string;
    nama: string;
  }>;
};

type MutasiTitipanRow = {
  id: number;
  no_mutasi: string;
  tanggal_mutasi: string;
  tipe_mutasi: string;
  nominal: number | string;
  keterangan: string | null;
  referensi_transaksi_simpanan_id: number | null;
  referensi_tagihan_simpanan_id: number | null;
  jenis_simpanan: RelationValue<{
    kode: string;
    nama: string;
  }>;
};

export type DetailSimpananAnggota = {
  anggota: {
    id: number;
    noAnggota: string;
    namaLengkap: string;
    jenisAnggota: string;
    statusAnggota: string;
    departemen: string;
    jabatan: string;
  } | null;
  saldoItems: Array<{
    id: number;
    kodeSimpanan: string;
    namaSimpanan: string;
    saldoTerbentuk: number;
    saldoTitipan: number;
    saldoDitahan: number;
    saldoTersedia: number;
    totalSetor: number;
    totalTarik: number;
    totalTagihan: number;
    totalTunggakan: number;
    terakhirDihitungAt: string | null;
  }>;
  tagihanItems: Array<{
    id: number;
    noTagihan: string;
    kodeSimpanan: string;
    namaSimpanan: string;
    periodeLabel: string | null;
    tanggalTagihan: string;
    tanggalJatuhTempo: string | null;
    nominalTagihan: number;
    nominalTerbayar: number;
    statusTagihan: string;
    keterangan: string | null;
  }>;
  transaksiItems: Array<{
    id: number;
    noTransaksi: string;
    kodeSimpanan: string;
    namaSimpanan: string;
    tanggalTransaksi: string;
    modelTransaksi: string;
    tipeTransaksi: string;
    metodeBayar: string | null;
    nominal: number;
    keterangan: string | null;
    createdAt: string;
  }>;
  mutasiTitipanItems: Array<{
    id: number;
    noMutasi: string;
    kodeSimpanan: string;
    namaSimpanan: string;
    tanggalMutasi: string;
    tipeMutasi: string;
    nominal: number;
    keterangan: string | null;
    referensiTransaksiSimpananId: number | null;
    referensiTagihanSimpananId: number | null;
  }>;
};

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function pickSingleRelation<T>(value: RelationValue<T> | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getDetailSimpananAnggota(
  noAnggota: string,
): Promise<DetailSimpananAnggota> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      anggota: null,
      saldoItems: [],
      tagihanItems: [],
      transaksiItems: [],
      mutasiTitipanItems: [],
    };
  }

  const { data: anggotaRow } = await supabase
    .from("anggota")
    .select("id,no_anggota,nama_lengkap,jenis_anggota,status_anggota,departemen,jabatan")
    .eq("no_anggota", noAnggota)
    .maybeSingle();

  if (!anggotaRow) {
    return {
      anggota: null,
      saldoItems: [],
      tagihanItems: [],
      transaksiItems: [],
      mutasiTitipanItems: [],
    };
  }

  const anggota = anggotaRow as AnggotaIdentityRow;

  const [saldoResult, tagihanResult, transaksiResult, titipanResult, mutasiTitipanResult] =
    await Promise.all([
      supabase
        .from("saldo_simpanan_anggota")
        .select(
          "id,jenis_simpanan_id,saldo_terbentuk,saldo_ditahan,saldo_tersedia,total_setor,total_tarik,total_tagihan,total_tunggakan,terakhir_dihitung_at,jenis_simpanan:jenis_simpanan_id(kode,nama)",
        )
        .eq("anggota_id", anggota.id)
        .order("jenis_simpanan_id", { ascending: true }),
      supabase
        .from("tagihan_simpanan")
        .select(
          "id,no_tagihan,periode_label,tanggal_tagihan,tanggal_jatuh_tempo,nominal_tagihan,nominal_terbayar,status_tagihan,keterangan,jenis_simpanan:jenis_simpanan_id(kode,nama)",
        )
        .eq("anggota_id", anggota.id)
        .order("tanggal_tagihan", { ascending: false })
        .limit(24),
      supabase
        .from("transaksi_simpanan")
        .select(
          "id,no_transaksi,tanggal_transaksi,model_transaksi,tipe_transaksi,metode_bayar,nominal,keterangan,created_at,jenis_simpanan:jenis_simpanan_id(kode,nama)",
        )
        .eq("anggota_id", anggota.id)
        .order("tanggal_transaksi", { ascending: false })
        .order("id", { ascending: false })
        .limit(30),
      supabase
        .from("titipan_simpanan_anggota")
        .select("jenis_simpanan_id,saldo_titipan")
        .eq("anggota_id", anggota.id),
      supabase
        .from("mutasi_titipan_simpanan")
        .select(
          "id,no_mutasi,tanggal_mutasi,tipe_mutasi,nominal,keterangan,referensi_transaksi_simpanan_id,referensi_tagihan_simpanan_id,jenis_simpanan:jenis_simpanan_id(kode,nama)",
        )
        .eq("anggota_id", anggota.id)
        .order("tanggal_mutasi", { ascending: false })
        .order("id", { ascending: false })
        .limit(30),
    ]);

  const titipanByJenis = new Map<number, number>();

  for (const row of (titipanResult.data ?? []) as TitipanRow[]) {
    titipanByJenis.set(row.jenis_simpanan_id, toNumber(row.saldo_titipan));
  }

  return {
    anggota: {
      id: anggota.id,
      noAnggota: anggota.no_anggota,
      namaLengkap: anggota.nama_lengkap,
      jenisAnggota: anggota.jenis_anggota,
      statusAnggota: anggota.status_anggota,
      departemen: anggota.departemen ?? "-",
      jabatan: anggota.jabatan ?? "-",
    },
    saldoItems: ((saldoResult.data ?? []) as SaldoRow[]).map((row) => {
      const jenisSimpanan = pickSingleRelation(row.jenis_simpanan);

      return {
        id: row.id,
        kodeSimpanan: jenisSimpanan?.kode ?? "-",
        namaSimpanan: jenisSimpanan?.nama ?? "-",
        saldoTerbentuk: toNumber(row.saldo_terbentuk),
        saldoTitipan: titipanByJenis.get(row.jenis_simpanan_id ?? 0) ?? 0,
        saldoDitahan: toNumber(row.saldo_ditahan),
        saldoTersedia: toNumber(row.saldo_tersedia),
        totalSetor: toNumber(row.total_setor),
        totalTarik: toNumber(row.total_tarik),
        totalTagihan: toNumber(row.total_tagihan),
        totalTunggakan: toNumber(row.total_tunggakan),
        terakhirDihitungAt: row.terakhir_dihitung_at,
      };
    }),
    tagihanItems: ((tagihanResult.data ?? []) as TagihanRow[]).map((row) => {
      const jenisSimpanan = pickSingleRelation(row.jenis_simpanan);

      return {
        id: row.id,
        noTagihan: row.no_tagihan,
        kodeSimpanan: jenisSimpanan?.kode ?? "-",
        namaSimpanan: jenisSimpanan?.nama ?? "-",
        periodeLabel: row.periode_label,
        tanggalTagihan: row.tanggal_tagihan,
        tanggalJatuhTempo: row.tanggal_jatuh_tempo,
        nominalTagihan: toNumber(row.nominal_tagihan),
        nominalTerbayar: toNumber(row.nominal_terbayar),
        statusTagihan: row.status_tagihan,
        keterangan: row.keterangan,
      };
    }),
    transaksiItems: ((transaksiResult.data ?? []) as TransaksiRow[]).map((row) => {
      const jenisSimpanan = pickSingleRelation(row.jenis_simpanan);

      return {
        id: row.id,
        noTransaksi: row.no_transaksi,
        kodeSimpanan: jenisSimpanan?.kode ?? "-",
        namaSimpanan: jenisSimpanan?.nama ?? "-",
        tanggalTransaksi: row.tanggal_transaksi,
        modelTransaksi: row.model_transaksi,
        tipeTransaksi: row.tipe_transaksi,
        metodeBayar: row.metode_bayar,
        nominal: toNumber(row.nominal),
        keterangan: row.keterangan,
        createdAt: row.created_at,
      };
    }),
    mutasiTitipanItems: ((mutasiTitipanResult.data ?? []) as MutasiTitipanRow[]).map((row) => {
      const jenisSimpanan = pickSingleRelation(row.jenis_simpanan);

      return {
        id: row.id,
        noMutasi: row.no_mutasi,
        kodeSimpanan: jenisSimpanan?.kode ?? "-",
        namaSimpanan: jenisSimpanan?.nama ?? "-",
        tanggalMutasi: row.tanggal_mutasi,
        tipeMutasi: row.tipe_mutasi,
        nominal: toNumber(row.nominal),
        keterangan: row.keterangan,
        referensiTransaksiSimpananId: row.referensi_transaksi_simpanan_id,
        referensiTagihanSimpananId: row.referensi_tagihan_simpanan_id,
      };
    }),
  };
}
