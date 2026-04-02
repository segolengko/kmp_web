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

export type PenarikanAnggotaOption = {
  anggotaId: number;
  noAnggota: string;
  namaLengkap: string;
};

export type PenarikanSaldoOption = {
  anggotaId: number;
  jenisSimpananId: number;
  kodeSimpanan: string;
  namaSimpanan: string;
  saldoTersedia: number;
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

type SupabaseSaldoRow = {
  anggota_id: number;
  jenis_simpanan_id: number;
  saldo_terbentuk: number | string | null;
  saldo_tersedia: number | string | null;
  anggota: {
    no_anggota: string;
    nama_lengkap: string;
  } | null;
  jenis_simpanan: {
    kode: string;
    nama: string;
    kategori: string | null;
    model_pencatatan: string | null;
    bisa_ditarik: boolean | null;
  } | null;
};

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export async function getPenarikanSimpananData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      penarikan: [] as PenarikanItem[],
      anggotaOptions: [] as PenarikanAnggotaOption[],
      saldoOptions: [] as PenarikanSaldoOption[],
    };
  }

  const { data, error } = await supabase
    .from("penarikan_simpanan")
    .select(
      "id,no_penarikan,anggota_id,tanggal_pengajuan,tanggal_persetujuan,tanggal_realisasi,nominal_pengajuan,nominal_disetujui,status_penarikan,alasan_penarikan,catatan,diajukan_oleh,disetujui_oleh,direalisasi_oleh,anggota:anggota_id(no_anggota,nama_lengkap),jenis_simpanan:jenis_simpanan_id(kode,nama)",
    )
    .order("id", { ascending: false });

  if (error || !data) {
    return {
      penarikan: [] as PenarikanItem[],
      anggotaOptions: [] as PenarikanAnggotaOption[],
      saldoOptions: [] as PenarikanSaldoOption[],
    };
  }

  const penarikan = (data as unknown as SupabasePenarikanRow[]).map((row) => ({
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

  const { data: saldoData } = await supabase
    .from("saldo_simpanan_anggota")
    .select(
      "anggota_id,jenis_simpanan_id,saldo_terbentuk,saldo_tersedia,anggota:anggota_id(no_anggota,nama_lengkap),jenis_simpanan:jenis_simpanan_id(kode,nama,kategori,model_pencatatan,bisa_ditarik)",
    )
    .order("anggota_id", { ascending: true });

  const { data: titipanData } = await supabase
    .from("titipan_simpanan_anggota")
    .select("anggota_id,jenis_simpanan_id,saldo_titipan");

  const titipanMap = new Map<string, number>();

  (titipanData ?? []).forEach((row) => {
    const item = row as {
      anggota_id: number;
      jenis_simpanan_id: number;
      saldo_titipan: number | string | null;
    };

    titipanMap.set(
      `${item.anggota_id}-${item.jenis_simpanan_id}`,
      toNumber(item.saldo_titipan),
    );
  });

  const saldoOptions = ((saldoData ?? []) as unknown as SupabaseSaldoRow[])
    .map((row) => {
      const kodeSimpanan = row.jenis_simpanan?.kode ?? "";
      const kategori = row.jenis_simpanan?.kategori ?? "";
      const modelPencatatan = row.jenis_simpanan?.model_pencatatan ?? "";
      const saldoTitipan =
        titipanMap.get(`${row.anggota_id}-${row.jenis_simpanan_id}`) ?? 0;
      const saldoTersedia =
        kodeSimpanan === "SS"
          ? toNumber(row.saldo_tersedia)
          : modelPencatatan === "TAGIHAN"
            ? toNumber(row.saldo_terbentuk) + saldoTitipan
            : toNumber(row.saldo_terbentuk);

      return {
        anggotaId: row.anggota_id,
        jenisSimpananId: row.jenis_simpanan_id,
        kodeSimpanan,
        namaSimpanan: row.jenis_simpanan?.nama ?? "-",
        saldoTersedia,
        noAnggota: row.anggota?.no_anggota ?? "-",
        namaLengkap: row.anggota?.nama_lengkap ?? "-",
        kategori,
      };
    })
    .filter((row) => row.kategori !== "PENYERTAAN");

  const anggotaMap = new Map<number, PenarikanAnggotaOption>();

  saldoOptions.forEach((row) => {
    if (!anggotaMap.has(row.anggotaId)) {
      anggotaMap.set(row.anggotaId, {
        anggotaId: row.anggotaId,
        noAnggota: row.noAnggota,
        namaLengkap: row.namaLengkap,
      });
    }
  });

  return {
    penarikan,
    anggotaOptions: Array.from(anggotaMap.values()),
    saldoOptions: saldoOptions.map((row) => ({
      anggotaId: row.anggotaId,
      jenisSimpananId: row.jenisSimpananId,
      kodeSimpanan: row.kodeSimpanan,
      namaSimpanan: row.namaSimpanan,
      saldoTersedia: row.saldoTersedia,
    })),
  };
}
