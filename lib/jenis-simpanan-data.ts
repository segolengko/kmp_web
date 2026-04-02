import { createSupabaseServerClient } from "./supabase/server";

export type JenisSimpananItem = {
  id: number;
  kode: string;
  nama: string;
  kategori: "POKOK" | "WAJIB" | "SUKARELA" | "PENYERTAAN";
  frekuensi: "SEKALI" | "HARIAN" | "MINGGUAN" | "BULANAN" | "TAHUNAN" | "FLEKSIBEL";
  wajib: boolean;
  modelPencatatan: "TAGIHAN" | "TRANSAKSI_LANGSUNG";
  bolehCicil: boolean;
  bisaDitarik: boolean;
  nominalDefault: number;
  aktif: boolean;
  keterangan: string | null;
};

type SupabaseJenisSimpananRow = {
  id: number;
  kode: string;
  nama: string;
  kategori: JenisSimpananItem["kategori"];
  frekuensi: JenisSimpananItem["frekuensi"];
  wajib: boolean;
  model_pencatatan: JenisSimpananItem["modelPencatatan"];
  boleh_cicil: boolean;
  bisa_ditarik: boolean;
  nominal_default: number | string;
  aktif: boolean;
  keterangan: string | null;
};

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function mapJenisSimpanan(row: SupabaseJenisSimpananRow): JenisSimpananItem {
  return {
    id: row.id,
    kode: row.kode,
    nama: row.nama,
    kategori: row.kategori,
    frekuensi: row.frekuensi,
    wajib: row.wajib,
    modelPencatatan: row.model_pencatatan,
    bolehCicil: row.boleh_cicil,
    bisaDitarik: row.bisa_ditarik,
    nominalDefault: toNumber(row.nominal_default),
    aktif: row.aktif,
    keterangan: row.keterangan,
  };
}

export async function getJenisSimpananData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as JenisSimpananItem[];
  }

  const { data, error } = await supabase
    .from("jenis_simpanan")
    .select(
      "id,kode,nama,kategori,frekuensi,wajib,model_pencatatan,boleh_cicil,bisa_ditarik,nominal_default,aktif,keterangan",
    )
    .order("kode", { ascending: true });

  if (error || !data) {
    return [] as JenisSimpananItem[];
  }

  return (data as SupabaseJenisSimpananRow[]).map(mapJenisSimpanan);
}

export async function getJenisSimpananById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("jenis_simpanan")
    .select(
      "id,kode,nama,kategori,frekuensi,wajib,model_pencatatan,boleh_cicil,bisa_ditarik,nominal_default,aktif,keterangan",
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapJenisSimpanan(data as SupabaseJenisSimpananRow);
}
