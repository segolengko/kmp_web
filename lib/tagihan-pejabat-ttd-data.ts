import { createSupabaseServerClient } from "./supabase/server";

export type PejabatTTDItem = {
  id: number;
  namaPejabat: string;
  jabatanPejabat: string;
  aktif: boolean;
};

export type PejabatTTDOption = {
  value: string;
  label: string;
  namaPejabat: string;
  jabatanPejabat: string;
};

type SupabasePejabatTTDRow = {
  id: number;
  nama_pejabat: string;
  jabatan_pejabat: string;
  aktif: boolean;
};

function mapPejabatTTD(row: SupabasePejabatTTDRow): PejabatTTDItem {
  return {
    id: row.id,
    namaPejabat: row.nama_pejabat,
    jabatanPejabat: row.jabatan_pejabat,
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
    .select("id,nama_pejabat,jabatan_pejabat,aktif")
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
    .select("id,nama_pejabat,jabatan_pejabat,aktif")
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
      label: `${item.namaPejabat} - ${item.jabatanPejabat}`,
      namaPejabat: item.namaPejabat,
      jabatanPejabat: item.jabatanPejabat,
    })) satisfies PejabatTTDOption[];
}
