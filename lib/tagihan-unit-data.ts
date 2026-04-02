import { createSupabaseServerClient } from "./supabase/server";

export type UnitBisnisItem = {
  id: number;
  kodeUnit: string;
  namaUnit: string;
  aktif: boolean;
};

type SupabaseUnitBisnisRow = {
  id: number;
  kode_unit: string;
  nama_unit: string;
  aktif: boolean;
};

function mapUnitBisnis(row: SupabaseUnitBisnisRow): UnitBisnisItem {
  return {
    id: row.id,
    kodeUnit: row.kode_unit,
    namaUnit: row.nama_unit,
    aktif: row.aktif,
  };
}

export async function getUnitBisnisData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as UnitBisnisItem[];
  }

  const { data, error } = await supabase
    .from("unit_bisnis")
    .select("id,kode_unit,nama_unit,aktif")
    .order("kode_unit", { ascending: true });

  if (error || !data) {
    return [] as UnitBisnisItem[];
  }

  return (data as SupabaseUnitBisnisRow[]).map(mapUnitBisnis);
}

export async function getUnitBisnisById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("unit_bisnis")
    .select("id,kode_unit,nama_unit,aktif")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapUnitBisnis(data as SupabaseUnitBisnisRow);
}
