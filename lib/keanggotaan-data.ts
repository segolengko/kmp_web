import { createSupabaseServerClient } from "./supabase/server";

export type RiwayatKeanggotaanItem = {
  id: number;
  tanggalPerubahan: string;
  tanggalBerlaku: string;
  jenisAnggotaLama: string | null;
  jenisAnggotaBaru: string | null;
  statusAnggotaLama: string | null;
  statusAnggotaBaru: string | null;
  alasanPerubahan: string | null;
  keterangan: string | null;
  dibuatOleh: string | null;
};

export async function getRiwayatKeanggotaan(noAnggota: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data: anggota, error: anggotaError } = await supabase
    .from("anggota")
    .select("id")
    .eq("no_anggota", noAnggota)
    .single();

  if (anggotaError || !anggota) {
    return [];
  }

  const { data, error } = await supabase
    .from("riwayat_keanggotaan")
    .select(
      "id,tanggal_perubahan,tanggal_berlaku,jenis_anggota_lama,jenis_anggota_baru,status_anggota_lama,status_anggota_baru,alasan_perubahan,keterangan,dibuat_oleh",
    )
    .eq("anggota_id", anggota.id)
    .order("id", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(
    (item): RiwayatKeanggotaanItem => ({
      id: item.id as number,
      tanggalPerubahan: String(item.tanggal_perubahan ?? ""),
      tanggalBerlaku: String(item.tanggal_berlaku ?? ""),
      jenisAnggotaLama: (item.jenis_anggota_lama as string | null) ?? null,
      jenisAnggotaBaru: (item.jenis_anggota_baru as string | null) ?? null,
      statusAnggotaLama: (item.status_anggota_lama as string | null) ?? null,
      statusAnggotaBaru: (item.status_anggota_baru as string | null) ?? null,
      alasanPerubahan: (item.alasan_perubahan as string | null) ?? null,
      keterangan: (item.keterangan as string | null) ?? null,
      dibuatOleh: (item.dibuat_oleh as string | null) ?? null,
    }),
  );
}
