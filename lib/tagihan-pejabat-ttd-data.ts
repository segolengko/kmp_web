import { createSupabaseServerClient } from "./supabase/server";

export type PejabatTTDItem = {
  id: number;
  namaPejabat: string;
  jabatanPejabat: string;
  unitBisnisId: number | null;
  unitBisnisNama: string;
  mitraPerusahaanId: number | null;
  mitraPerusahaanNama: string;
  modul: string;
  aktif: boolean;
};

export type PejabatTTDOption = {
  value: string;
  label: string;
  namaPejabat: string;
  jabatanPejabat: string;
  unitBisnisId: number | null;
  unitBisnisNama: string;
  mitraPerusahaanId: number | null;
  mitraPerusahaanNama: string;
  modul: string;
};

type SupabasePejabatTTDRow = {
  id: number;
  nama_pejabat: string;
  jabatan_pejabat: string;
  unit_bisnis_id: number | null;
  unit_bisnis: { nama_unit: string } | { nama_unit: string }[] | null;
  mitra_perusahaan_id: number | null;
  mitra_perusahaan: { nama_perusahaan: string } | { nama_perusahaan: string }[] | null;
  modul: string | null;
  aktif: boolean;
};

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function mapPejabatTTD(row: SupabasePejabatTTDRow): PejabatTTDItem {
  const unitBisnis = firstRelation(row.unit_bisnis);
  const mitraPerusahaan = firstRelation(row.mitra_perusahaan);

  return {
    id: row.id,
    namaPejabat: row.nama_pejabat,
    jabatanPejabat: row.jabatan_pejabat,
    unitBisnisId: row.unit_bisnis_id,
    unitBisnisNama: unitBisnis?.nama_unit ?? "-",
    mitraPerusahaanId: row.mitra_perusahaan_id,
    mitraPerusahaanNama: mitraPerusahaan?.nama_perusahaan ?? "-",
    modul: row.modul ?? "",
    aktif: row.aktif,
  };
}

export async function getPejabatTTDData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as PejabatTTDItem[];
  }

  const { data, error } = await supabase
    .from("pejabat_ttd")
    .select("id,nama_pejabat,jabatan_pejabat,unit_bisnis_id,unit_bisnis:unit_bisnis_id(nama_unit),mitra_perusahaan_id,mitra_perusahaan:mitra_perusahaan_id(nama_perusahaan),modul,aktif")
    .order("nama_pejabat", { ascending: true });

  if (error || !data) {
    return [] as PejabatTTDItem[];
  }

  return (data as SupabasePejabatTTDRow[]).map(mapPejabatTTD);
}

export async function getPejabatTTDById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("pejabat_ttd")
    .select("id,nama_pejabat,jabatan_pejabat,unit_bisnis_id,unit_bisnis:unit_bisnis_id(nama_unit),mitra_perusahaan_id,mitra_perusahaan:mitra_perusahaan_id(nama_perusahaan),modul,aktif")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapPejabatTTD(data as SupabasePejabatTTDRow);
}

export async function getPejabatTTDOptions() {
  const data = await getPejabatTTDData();

  return data
    .filter((item) => item.aktif)
    .map((item) => ({
      value: String(item.id),
      label: `${item.namaPejabat} - ${item.jabatanPejabat}${item.unitBisnisNama !== "-" ? ` (${item.unitBisnisNama})` : ""}${item.mitraPerusahaanNama !== "-" ? ` / ${item.mitraPerusahaanNama}` : ""}${item.modul ? ` / ${item.modul}` : ""}`,
      namaPejabat: item.namaPejabat,
      jabatanPejabat: item.jabatanPejabat,
      unitBisnisId: item.unitBisnisId,
      unitBisnisNama: item.unitBisnisNama,
      mitraPerusahaanId: item.mitraPerusahaanId,
      mitraPerusahaanNama: item.mitraPerusahaanNama,
      modul: item.modul,
    })) satisfies PejabatTTDOption[];
}
