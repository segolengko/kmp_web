import { createSupabaseServerClient } from "./supabase/server";

export type ReferensiSRItem = {
  id: number;
  unitBisnisId: number;
  mitraPerusahaanId: number;
  noSr: string;
  tanggalSr: string;
  deskripsi: string | null;
  unitBisnisNama: string;
  mitraPerusahaanNama: string;
};

type SupabaseReferensiSRRow = {
  id: number;
  unit_bisnis_id: number;
  mitra_perusahaan_id: number;
  no_sr: string;
  tanggal_sr: string;
  deskripsi: string | null;
  unit_bisnis: { nama_unit: string } | { nama_unit: string }[] | null;
  mitra_perusahaan:
    | { nama_perusahaan: string }
    | { nama_perusahaan: string }[]
    | null;
};

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function mapReferensiSR(row: SupabaseReferensiSRRow): ReferensiSRItem {
  const unitBisnis = firstRelation(row.unit_bisnis);
  const mitraPerusahaan = firstRelation(row.mitra_perusahaan);

  return {
    id: row.id,
    unitBisnisId: row.unit_bisnis_id,
    mitraPerusahaanId: row.mitra_perusahaan_id,
    noSr: row.no_sr,
    tanggalSr: row.tanggal_sr,
    deskripsi: row.deskripsi,
    unitBisnisNama: unitBisnis?.nama_unit ?? "-",
    mitraPerusahaanNama: mitraPerusahaan?.nama_perusahaan ?? "-",
  };
}

export async function getReferensiSRData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as ReferensiSRItem[];
  }

  const { data, error } = await supabase
    .from("referensi_sr")
    .select(
      "id,unit_bisnis_id,mitra_perusahaan_id,no_sr,tanggal_sr,deskripsi,unit_bisnis:unit_bisnis_id(nama_unit),mitra_perusahaan:mitra_perusahaan_id(nama_perusahaan)",
    )
    .order("tanggal_sr", { ascending: false })
    .order("no_sr", { ascending: true });

  if (error || !data) {
    return [] as ReferensiSRItem[];
  }

  return (data as SupabaseReferensiSRRow[]).map(mapReferensiSR);
}

export async function getReferensiSRById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("referensi_sr")
    .select(
      "id,unit_bisnis_id,mitra_perusahaan_id,no_sr,tanggal_sr,deskripsi,unit_bisnis:unit_bisnis_id(nama_unit),mitra_perusahaan:mitra_perusahaan_id(nama_perusahaan)",
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapReferensiSR(data as SupabaseReferensiSRRow);
}

export async function getReferensiSROptions() {
  const items = await getReferensiSRData();

  return items.map((item) => ({
    value: String(item.id),
    label: `${item.noSr} • ${item.mitraPerusahaanNama} • ${item.unitBisnisNama}`,
  }));
}
