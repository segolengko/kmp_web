import { createSupabaseServerClient } from "./supabase/server";

export type SaldoSimpananReportItem = {
  id: number;
  jenisSimpananId: number;
  noAnggota: string;
  namaLengkap: string;
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
};

export type TunggakanSimpananReportItem = {
  tagihanId: number;
  noTagihan: string;
  noAnggota: string;
  namaLengkap: string;
  jenisAnggota: string;
  statusAnggota: string;
  kodeSimpanan: string;
  namaSimpanan: string;
  periodeLabel: string | null;
  nominalTagihan: number;
  nominalTerbayar: number;
  sisaTunggakan: number;
  umurTunggakanHari: number;
  statusTagihan: string;
};

export type LaporanIuranTahunanItem = {
  anggotaId: number;
  noAnggota: string;
  departemen: string;
  namaLengkap: string;
  simpananPokok: number;
  wajibBulanan: number[];
  total: number;
};

type SupabaseSaldoRow = {
  id: number;
  anggota_id: number;
  jenis_simpanan_id: number;
  saldo_terbentuk: number | string;
  saldo_ditahan: number | string;
  saldo_tersedia: number | string;
  total_setor: number | string;
  total_tarik: number | string;
  total_tagihan: number | string;
  total_tunggakan: number | string;
  terakhir_dihitung_at: string | null;
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

type SupabaseTitipanRow = {
  anggota_id: number;
  jenis_simpanan_id: number;
  saldo_titipan: number | string;
};

type SupabaseTunggakanRow = {
  tagihan_id: number;
  no_tagihan: string;
  no_anggota: string;
  nama_lengkap: string;
  jenis_anggota: string;
  status_anggota: string;
  kode_simpanan: string;
  nama_simpanan: string;
  periode_label: string | null;
  nominal_tagihan: number | string;
  nominal_terbayar: number | string;
  sisa_tunggakan: number | string;
  umur_tunggakan_hari: number | string;
  status_tagihan: string;
};

type SupabaseAnggotaTahunanRow = {
  id: number;
  no_anggota: string;
  nama_lengkap: string;
  departemen: string | null;
};

type SupabaseTagihanTahunanRow = {
  anggota_id: number;
  periode_bulan: number | string | null;
  nominal_terbayar: number | string;
  jenis_simpanan:
    | Array<{
        kode: string;
      }>
    | {
        kode: string;
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

export async function getLaporanSimpananData(tahun: number = new Date().getFullYear()) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      saldoItems: [] as SaldoSimpananReportItem[],
      tunggakanItems: [] as TunggakanSimpananReportItem[],
      annualItems: [] as LaporanIuranTahunanItem[],
      departemenOptions: [] as string[],
    };
  }

  const [saldoResult, tunggakanResult, titipanResult, anggotaTahunanResult, tagihanTahunanResult] =
    await Promise.all([
    supabase
      .from("saldo_simpanan_anggota")
      .select(
        "id,anggota_id,jenis_simpanan_id,saldo_terbentuk,saldo_ditahan,saldo_tersedia,total_setor,total_tarik,total_tagihan,total_tunggakan,terakhir_dihitung_at,anggota:anggota_id(no_anggota,nama_lengkap),jenis_simpanan:jenis_simpanan_id(kode,nama)",
      )
      .order("anggota_id", { ascending: true }),
    supabase
      .from("v_tunggakan_simpanan_wajib")
      .select(
        "tagihan_id,no_tagihan,no_anggota,nama_lengkap,jenis_anggota,status_anggota,kode_simpanan,nama_simpanan,periode_label,nominal_tagihan,nominal_terbayar,sisa_tunggakan,umur_tunggakan_hari,status_tagihan",
      )
      .order("umur_tunggakan_hari", { ascending: false })
      .limit(20),
    supabase
      .from("titipan_simpanan_anggota")
      .select("anggota_id,jenis_simpanan_id,saldo_titipan"),
    supabase
      .from("anggota")
      .select("id,no_anggota,nama_lengkap,departemen")
      .order("departemen", { ascending: true })
      .order("nama_lengkap", { ascending: true }),
    supabase
      .from("tagihan_simpanan")
      .select("anggota_id,periode_bulan,nominal_terbayar,jenis_simpanan:jenis_simpanan_id(kode)")
      .eq("periode_tahun", tahun)
      .gt("nominal_terbayar", 0),
    ]);

  const titipanMap = new Map<string, number>();

  for (const row of ((titipanResult.data ?? []) as unknown as SupabaseTitipanRow[])) {
    titipanMap.set(`${row.anggota_id}-${row.jenis_simpanan_id}`, toNumber(row.saldo_titipan));
  }

  const saldoItems = ((saldoResult.data ?? []) as unknown as SupabaseSaldoRow[]).map(
    (row): SaldoSimpananReportItem => {
      const anggota = pickSingleRelation(row.anggota);
      const jenisSimpanan = pickSingleRelation(row.jenis_simpanan);

      return {
        id: row.id,
        jenisSimpananId: row.jenis_simpanan_id,
        noAnggota: anggota?.no_anggota ?? "-",
        namaLengkap: anggota?.nama_lengkap ?? "-",
        kodeSimpanan: jenisSimpanan?.kode ?? "-",
        namaSimpanan: jenisSimpanan?.nama ?? "-",
        saldoTerbentuk: toNumber(row.saldo_terbentuk),
        saldoTitipan: titipanMap.get(`${row.anggota_id}-${row.jenis_simpanan_id}`) ?? 0,
        saldoDitahan: toNumber(row.saldo_ditahan),
        saldoTersedia: toNumber(row.saldo_tersedia),
        totalSetor: toNumber(row.total_setor),
        totalTarik: toNumber(row.total_tarik),
        totalTagihan: toNumber(row.total_tagihan),
        totalTunggakan: toNumber(row.total_tunggakan),
        terakhirDihitungAt: row.terakhir_dihitung_at,
      };
    },
  );

  const tunggakanItems = ((tunggakanResult.data ?? []) as unknown as SupabaseTunggakanRow[]).map(
    (row): TunggakanSimpananReportItem => ({
      tagihanId: row.tagihan_id,
      noTagihan: row.no_tagihan,
      noAnggota: row.no_anggota,
      namaLengkap: row.nama_lengkap,
      jenisAnggota: row.jenis_anggota,
      statusAnggota: row.status_anggota,
      kodeSimpanan: row.kode_simpanan,
      namaSimpanan: row.nama_simpanan,
      periodeLabel: row.periode_label,
      nominalTagihan: toNumber(row.nominal_tagihan),
      nominalTerbayar: toNumber(row.nominal_terbayar),
      sisaTunggakan: toNumber(row.sisa_tunggakan),
      umurTunggakanHari: toNumber(row.umur_tunggakan_hari),
      statusTagihan: row.status_tagihan,
    }),
  );

  const departemenOptions = Array.from(
    new Set(
      ((anggotaTahunanResult.data ?? []) as unknown as SupabaseAnggotaTahunanRow[]).map(
        (row) => row.departemen?.trim() || "-",
      ),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const annualMap = new Map<number, LaporanIuranTahunanItem>();

  for (const row of ((anggotaTahunanResult.data ?? []) as unknown as SupabaseAnggotaTahunanRow[])) {
    annualMap.set(row.id, {
      anggotaId: row.id,
      noAnggota: row.no_anggota,
      departemen: row.departemen ?? "-",
      namaLengkap: row.nama_lengkap,
      simpananPokok: 0,
      wajibBulanan: Array.from({ length: 12 }, () => 0),
      total: 0,
    });
  }

  for (const row of ((tagihanTahunanResult.data ?? []) as unknown as SupabaseTagihanTahunanRow[])) {
    const item = annualMap.get(row.anggota_id);
    const jenisSimpanan = pickSingleRelation(row.jenis_simpanan);
    const nominalTerbayar = toNumber(row.nominal_terbayar);

    if (!item || !jenisSimpanan || nominalTerbayar <= 0) {
      continue;
    }

    if (jenisSimpanan.kode === "SP") {
      item.simpananPokok += nominalTerbayar;
      item.total += nominalTerbayar;
      continue;
    }

    if (jenisSimpanan.kode === "SW") {
      const bulanIndex = toNumber(row.periode_bulan) - 1;

      if (bulanIndex >= 0 && bulanIndex < 12) {
        item.wajibBulanan[bulanIndex] += nominalTerbayar;
        item.total += nominalTerbayar;
      }
    }
  }

  const annualItems = Array.from(annualMap.values()).filter(
    (item) => item.total > 0 || item.simpananPokok > 0 || item.wajibBulanan.some((value) => value > 0),
  );

  return {
    saldoItems,
    tunggakanItems,
    annualItems,
    departemenOptions,
  };
}
