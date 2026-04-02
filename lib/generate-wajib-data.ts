import { createSupabaseServerClient } from "./supabase/server";

export type GenerateWajibBatchItem = {
  id: number;
  kodeBatch: string;
  periodeTahun: number;
  periodeBulan: number;
  tanggalProses: string | null;
  totalAnggota: number;
  totalTagihanTerbentuk: number;
  statusBatch: "DRAFT" | "PROSES" | "SELESAI" | "GAGAL" | "DIBATALKAN";
  catatan: string | null;
  dibuatOleh: string | null;
};

type SupabaseBatchRow = {
  id: number;
  kode_batch: string;
  periode_tahun: number;
  periode_bulan: number;
  tanggal_proses: string | null;
  total_anggota: number | string;
  total_tagihan_terbentuk: number | string;
  status_batch: GenerateWajibBatchItem["statusBatch"];
  catatan: string | null;
  dibuat_oleh: string | null;
};

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export async function getGenerateWajibBatches() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as GenerateWajibBatchItem[];
  }

  const { data, error } = await supabase
    .from("batch_generate_tagihan_simpanan")
    .select(
      "id,kode_batch,periode_tahun,periode_bulan,tanggal_proses,total_anggota,total_tagihan_terbentuk,status_batch,catatan,dibuat_oleh,jenis_simpanan:jenis_simpanan_id!inner(kode)",
    )
    .eq("jenis_simpanan.kode", "SW")
    .order("tanggal_proses", { ascending: false })
    .limit(12);

  if (error || !data) {
    return [] as GenerateWajibBatchItem[];
  }

  return (data as unknown as SupabaseBatchRow[]).map((row) => ({
    id: row.id,
    kodeBatch: row.kode_batch,
    periodeTahun: row.periode_tahun,
    periodeBulan: row.periode_bulan,
    tanggalProses: row.tanggal_proses,
    totalAnggota: toNumber(row.total_anggota),
    totalTagihanTerbentuk: toNumber(row.total_tagihan_terbentuk),
    statusBatch: row.status_batch,
    catatan: row.catatan,
    dibuatOleh: row.dibuat_oleh,
  }));
}
