import { createSupabaseServerClient } from "./supabase/server";

export type PengaturanSimpananItem = {
  id: number;
  jenisSimpananId: number;
  segmenAnggota: "BIASA_AKTIF" | "LUAR_BIASA_AKTIF" | "LUAR_BIASA_PASIF" | null;
  kodeSimpanan: string;
  namaSimpanan: string;
  namaPengaturan: string;
  nominal: number;
  berlakuMulai: string;
  berlakuSampai: string | null;
  aktif: boolean;
  keterangan: string | null;
};

type SupabasePengaturanSimpananRow = {
  id: number;
  jenis_simpanan_id: number;
  segmen_anggota: "BIASA_AKTIF" | "LUAR_BIASA_AKTIF" | "LUAR_BIASA_PASIF" | null;
  nama_pengaturan: string;
  nominal: number | string;
  berlaku_mulai: string;
  berlaku_sampai: string | null;
  aktif: boolean;
  keterangan: string | null;
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

function pickJenisSimpanan(value: SupabasePengaturanSimpananRow["jenis_simpanan"]) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function mapPengaturan(row: SupabasePengaturanSimpananRow): PengaturanSimpananItem {
  const jenisSimpanan = pickJenisSimpanan(row.jenis_simpanan);

  return {
    id: row.id,
    jenisSimpananId: row.jenis_simpanan_id,
    segmenAnggota: row.segmen_anggota,
    kodeSimpanan: jenisSimpanan?.kode ?? "-",
    namaSimpanan: jenisSimpanan?.nama ?? "-",
    namaPengaturan: row.nama_pengaturan,
    nominal: toNumber(row.nominal),
    berlakuMulai: row.berlaku_mulai,
    berlakuSampai: row.berlaku_sampai,
    aktif: row.aktif,
    keterangan: row.keterangan,
  };
}

export async function getPengaturanSimpananData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as PengaturanSimpananItem[];
  }

  const { data, error } = await supabase
    .from("pengaturan_simpanan")
    .select(
      "id,jenis_simpanan_id,segmen_anggota,nama_pengaturan,nominal,berlaku_mulai,berlaku_sampai,aktif,keterangan,jenis_simpanan:jenis_simpanan_id(kode,nama)",
    )
    .order("berlaku_mulai", { ascending: false });

  if (error || !data) {
    return [] as PengaturanSimpananItem[];
  }

  return (data as unknown as SupabasePengaturanSimpananRow[]).map(mapPengaturan);
}

export async function getPengaturanSimpananById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("pengaturan_simpanan")
    .select(
      "id,jenis_simpanan_id,segmen_anggota,nama_pengaturan,nominal,berlaku_mulai,berlaku_sampai,aktif,keterangan,jenis_simpanan:jenis_simpanan_id(kode,nama)",
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapPengaturan(data as unknown as SupabasePengaturanSimpananRow);
}
