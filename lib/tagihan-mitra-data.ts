import { createSupabaseServerClient } from "./supabase/server";

export type MitraPerusahaanItem = {
  id: number;
  namaPerusahaan: string;
  alamat: string | null;
  npwp: string | null;
  picNama: string | null;
  picJabatan: string | null;
  picEmail: string | null;
  picHp: string | null;
  aktif: boolean;
};

type SupabaseMitraPerusahaanRow = {
  id: number;
  nama_perusahaan: string;
  alamat: string | null;
  npwp: string | null;
  pic_nama: string | null;
  pic_jabatan: string | null;
  pic_email: string | null;
  pic_hp: string | null;
  aktif: boolean;
};

function mapMitraPerusahaan(row: SupabaseMitraPerusahaanRow): MitraPerusahaanItem {
  return {
    id: row.id,
    namaPerusahaan: row.nama_perusahaan,
    alamat: row.alamat,
    npwp: row.npwp,
    picNama: row.pic_nama,
    picJabatan: row.pic_jabatan,
    picEmail: row.pic_email,
    picHp: row.pic_hp,
    aktif: row.aktif,
  };
}

export async function getMitraPerusahaanData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as MitraPerusahaanItem[];
  }

  const { data, error } = await supabase
    .from("mitra_perusahaan")
    .select("id,nama_perusahaan,alamat,npwp,pic_nama,pic_jabatan,pic_email,pic_hp,aktif")
    .order("nama_perusahaan", { ascending: true });

  if (error || !data) {
    return [] as MitraPerusahaanItem[];
  }

  return (data as SupabaseMitraPerusahaanRow[]).map(mapMitraPerusahaan);
}

export async function getMitraPerusahaanById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("mitra_perusahaan")
    .select("id,nama_perusahaan,alamat,npwp,pic_nama,pic_jabatan,pic_email,pic_hp,aktif")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return mapMitraPerusahaan(data as SupabaseMitraPerusahaanRow);
}
