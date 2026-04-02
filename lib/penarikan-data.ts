import { createSupabaseServerClient } from "./supabase/server";

export type PenarikanItem = {
  id: number;
  noPenarikan: string;
  anggotaId: number;
  noAnggota: string;
  namaLengkap: string;
  jenisSimpanan: string;
  kodeSimpanan: string;
  tanggalPengajuan: string | null;
  tanggalPersetujuan: string | null;
  tanggalRealisasi: string | null;
  nominalPengajuan: number;
  nominalDisetujui: number | null;
  statusPenarikan: "DIAJUKAN" | "DISETUJUI" | "DITOLAK" | "DIREALISASIKAN" | "DIBATALKAN";
  alasanPenarikan: string | null;
  catatan: string | null;
  diajukanOleh: string | null;
  disetujuiOleh: string | null;
  direalisasiOleh: string | null;
};

type SupabasePenarikanRow = {
  id: number;
  no_penarikan: string;
  anggota_id: number;
  tanggal_pengajuan: string | null;
  tanggal_persetujuan: string | null;
  tanggal_realisasi: string | null;
  nominal_pengajuan: number | string;
  nominal_disetujui: number | string | null;
  status_penarikan: PenarikanItem["statusPenarikan"];
  alasan_penarikan: string | null;
  catatan: string | null;
  diajukan_oleh: string | null;
  disetujui_oleh: string | null;
  direalisasi_oleh: string | null;
  anggota: {
    no_anggota: string;
    nama_lengkap: string;
  } | null;
  jenis_simpanan: {
    kode: string;
    nama: string;
  } | null;
};

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export async function getPenarikanSimpananData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as PenarikanItem[];
  }

  const { data, error } = await supabase
    .from("penarikan_simpanan")
    .select(
      "id,no_penarikan,anggota_id,tanggal_pengajuan,tanggal_persetujuan,tanggal_realisasi,nominal_pengajuan,nominal_disetujui,status_penarikan,alasan_penarikan,catatan,diajukan_oleh,disetujui_oleh,direalisasi_oleh,anggota:anggota_id(no_anggota,nama_lengkap),jenis_simpanan:jenis_simpanan_id(kode,nama)",
    )
    .order("id", { ascending: false });

  if (error || !data) {
    return [] as PenarikanItem[];
  }

  return (data as unknown as SupabasePenarikanRow[]).map((row) => ({
    id: row.id,
    noPenarikan: row.no_penarikan,
    anggotaId: row.anggota_id,
    noAnggota: row.anggota?.no_anggota ?? "-",
    namaLengkap: row.anggota?.nama_lengkap ?? "-",
    jenisSimpanan: row.jenis_simpanan?.nama ?? "-",
    kodeSimpanan: row.jenis_simpanan?.kode ?? "-",
    tanggalPengajuan: row.tanggal_pengajuan,
    tanggalPersetujuan: row.tanggal_persetujuan,
    tanggalRealisasi: row.tanggal_realisasi,
    nominalPengajuan: toNumber(row.nominal_pengajuan),
    nominalDisetujui:
      row.nominal_disetujui === null ? null : toNumber(row.nominal_disetujui),
    statusPenarikan: row.status_penarikan,
    alasanPenarikan: row.alasan_penarikan,
    catatan: row.catatan,
    diajukanOleh: row.diajukan_oleh,
    disetujuiOleh: row.disetujui_oleh,
    direalisasiOleh: row.direalisasi_oleh,
  }));
}
