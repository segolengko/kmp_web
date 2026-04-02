import { createSupabaseServerClient } from "./supabase/server";

export type PengaturanSimpananAnggotaItem = {
  id: number;
  anggotaId: number;
  noAnggota: string;
  namaLengkap: string;
  jenisSimpananId: number;
  kodeSimpanan: string;
  namaSimpanan: string;
  namaPengaturan: string;
  nominal: number;
  berlakuMulai: string;
  berlakuSampai: string | null;
  aktif: boolean;
  keterangan: string | null;
};

type SupabasePengaturanAnggotaRow = {
  id: number;
  anggota_id: number;
  jenis_simpanan_id: number;
  nama_pengaturan: string;
  nominal: number | string;
  berlaku_mulai: string;
  berlaku_sampai: string | null;
  aktif: boolean;
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

type SimpleOption = {
  id: number;
  label: string;
};

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function mapPengaturanAnggota(
  row: SupabasePengaturanAnggotaRow,
): PengaturanSimpananAnggotaItem {
  return {
    id: row.id,
    anggotaId: row.anggota_id,
    noAnggota: row.anggota?.[0]?.no_anggota ?? "-",
    namaLengkap: row.anggota?.[0]?.nama_lengkap ?? "-",
    jenisSimpananId: row.jenis_simpanan_id,
    kodeSimpanan: row.jenis_simpanan?.[0]?.kode ?? "-",
    namaSimpanan: row.jenis_simpanan?.[0]?.nama ?? "-",
    namaPengaturan: row.nama_pengaturan,
    nominal: toNumber(row.nominal),
    berlakuMulai: row.berlaku_mulai,
    berlakuSampai: row.berlaku_sampai,
    aktif: row.aktif,
    keterangan: row.keterangan,
  };
}

export async function getPengaturanSimpananAnggotaData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as PengaturanSimpananAnggotaItem[];
  }

  const { data, error } = await supabase
    .from("pengaturan_simpanan_anggota")
    .select(
      "id,anggota_id,jenis_simpanan_id,nama_pengaturan,nominal,berlaku_mulai,berlaku_sampai,aktif,keterangan,anggota:anggota_id(no_anggota,nama_lengkap),jenis_simpanan:jenis_simpanan_id(kode,nama)",
    )
    .order("berlaku_mulai", { ascending: false });

  if (error || !data) {
    return [] as PengaturanSimpananAnggotaItem[];
  }

  return (data as unknown as SupabasePengaturanAnggotaRow[]).map(mapPengaturanAnggota);
}

export async function getPengaturanSimpananAnggotaById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("pengaturan_simpanan_anggota")
    .select(
      "id,anggota_id,jenis_simpanan_id,nama_pengaturan,nominal,berlaku_mulai,berlaku_sampai,aktif,keterangan,anggota:anggota_id(no_anggota,nama_lengkap),jenis_simpanan:jenis_simpanan_id(kode,nama)",
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapPengaturanAnggota(data as unknown as SupabasePengaturanAnggotaRow);
}

export async function getPengaturanAnggotaOptions() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      anggotaOptions: [] as SimpleOption[],
      jenisSimpananOptions: [] as SimpleOption[],
    };
  }

  const [anggotaResult, jenisResult] = await Promise.all([
    supabase
      .from("anggota")
      .select("id,no_anggota,nama_lengkap")
      .order("no_anggota", { ascending: true }),
    supabase
      .from("jenis_simpanan")
      .select("id,kode,nama")
      .order("kode", { ascending: true }),
  ]);

  return {
    anggotaOptions: (anggotaResult.data ?? []).map(
      (item: { id: number; no_anggota: string; nama_lengkap: string }) => ({
        id: item.id,
        label: `${item.no_anggota} - ${item.nama_lengkap}`,
      }),
    ),
    jenisSimpananOptions: (jenisResult.data ?? []).map(
      (item: { id: number; kode: string; nama: string }) => ({
        id: item.id,
        label: `${item.kode} - ${item.nama}`,
      }),
    ),
  };
}
