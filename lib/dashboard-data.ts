import { createSupabaseServerClient } from "./supabase/server";

export type DashboardStatItem = {
  label: string;
  value: string;
};

export type DashboardActivityItem = {
  title: string;
  description: string;
  value: string;
};

export type DashboardAlertItem = {
  title: string;
  description: string;
  warning: boolean;
};

function toCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

export async function getDashboardData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      stats: [
        { label: "Total Anggota Aktif", value: "0" },
        { label: "Tagihan Bulan Ini", value: toCurrency(0) },
        { label: "Tunggakan Terbuka", value: toCurrency(0) },
        { label: "Kas Sukarela Hari Ini", value: toCurrency(0) },
      ] as DashboardStatItem[],
      activities: [] as DashboardActivityItem[],
      alerts: [] as DashboardAlertItem[],
    };
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.toISOString().slice(0, 10);

  const [
    anggotaAktifResult,
    tagihanBulanIniResult,
    tunggakanResult,
    kasSukarelaHariIniResult,
    batchResult,
    transaksiResult,
    penarikanResult,
  ] = await Promise.all([
    supabase.from("anggota").select("id").eq("status_anggota", "AKTIF"),
    supabase
      .from("tagihan_simpanan")
      .select("nominal_tagihan,nominal_terbayar,jenis_simpanan:jenis_simpanan_id!inner(kode)")
      .eq("jenis_simpanan.kode", "SW")
      .eq("periode_tahun", year)
      .eq("periode_bulan", month),
    supabase
      .from("v_tunggakan_simpanan_wajib")
      .select("no_anggota,sisa_tunggakan,umur_tunggakan_hari"),
    supabase
      .from("transaksi_simpanan")
      .select("nominal,jenis_simpanan:jenis_simpanan_id!inner(kode)")
      .eq("jenis_simpanan.kode", "SS")
      .eq("tanggal_transaksi", today)
      .in("tipe_transaksi", ["SETOR", "KOREKSI_MASUK"]),
    supabase
      .from("batch_generate_tagihan_simpanan")
      .select("kode_batch,total_tagihan_terbentuk,status_batch")
      .order("tanggal_proses", { ascending: false })
      .limit(1),
    supabase
      .from("transaksi_simpanan")
      .select(
        "tanggal_transaksi,nominal,tipe_transaksi,jenis_simpanan:jenis_simpanan_id(kode,nama),anggota:anggota_id(no_anggota,nama_lengkap)",
      )
      .order("tanggal_transaksi", { ascending: false })
      .limit(2),
    supabase
      .from("penarikan_simpanan")
      .select("status_penarikan,nominal_pengajuan,anggota:anggota_id(no_anggota,nama_lengkap)")
      .order("tanggal_pengajuan", { ascending: false })
      .limit(2),
  ]);

  const totalAnggotaAktif = anggotaAktifResult.data?.length ?? 0;
  const totalTagihanBulanIni = (tagihanBulanIniResult.data ?? []).reduce(
    (total, item) => total + toNumber((item as { nominal_tagihan: number | string }).nominal_tagihan),
    0,
  );
  const totalTunggakan = (tunggakanResult.data ?? []).reduce(
    (total, item) => total + toNumber((item as { sisa_tunggakan: number | string }).sisa_tunggakan),
    0,
  );
  const kasSukarelaHariIni = (kasSukarelaHariIniResult.data ?? []).reduce(
    (total, item) => total + toNumber((item as { nominal: number | string }).nominal),
    0,
  );

  const stats: DashboardStatItem[] = [
    { label: "Total Anggota Aktif", value: String(totalAnggotaAktif) },
    { label: "Tagihan Bulan Ini", value: toCurrency(totalTagihanBulanIni) },
    { label: "Tunggakan Terbuka", value: toCurrency(totalTunggakan) },
    { label: "Kas Sukarela Hari Ini", value: toCurrency(kasSukarelaHariIni) },
  ];

  const activities: DashboardActivityItem[] = [];

  const lastBatch = batchResult.data?.[0];
  if (lastBatch) {
    activities.push({
      title: `Generate batch ${lastBatch.kode_batch}`,
      description: `Status ${lastBatch.status_batch} dengan ${lastBatch.total_tagihan_terbentuk} tagihan terbentuk.`,
      value: `${lastBatch.total_tagihan_terbentuk} tagihan`,
    });
  }

  for (const row of transaksiResult.data ?? []) {
    const typed = row as {
      nominal: number | string;
      tipe_transaksi: string;
      jenis_simpanan: Array<{ kode: string; nama: string }> | null;
      anggota: Array<{ no_anggota: string; nama_lengkap: string }> | null;
    };

    activities.push({
      title: `${typed.tipe_transaksi} ${typed.jenis_simpanan?.[0]?.nama ?? "Simpanan"}`,
      description: `${typed.anggota?.[0]?.nama_lengkap ?? "Anggota"} mencatat transaksi ${typed.jenis_simpanan?.[0]?.kode ?? "-"}.`,
      value: toCurrency(toNumber(typed.nominal)),
    });
  }

  const alerts: DashboardAlertItem[] = [];
  const anggotaMenunggak = new Set(
    (tunggakanResult.data ?? []).map(
      (item) => (item as { no_anggota: string }).no_anggota,
    ),
  ).size;

  alerts.push({
    title: `${anggotaMenunggak} anggota menunggak`,
    description:
      anggotaMenunggak > 0
        ? "Prioritaskan follow up anggota dengan tagihan wajib yang sudah melewati jatuh tempo."
        : "Belum ada tunggakan simpanan wajib yang perlu ditindaklanjuti.",
    warning: anggotaMenunggak > 0,
  });

  const draftPenarikan = (penarikanResult.data ?? []).filter(
    (item) => (item as { status_penarikan: string }).status_penarikan === "DIAJUKAN",
  );

  alerts.push({
    title: `${draftPenarikan.length} draft penarikan menunggu proses`,
    description:
      draftPenarikan.length > 0
        ? "Cek approval atau realisasi penarikan simpanan yang masih berstatus diajukan."
        : "Tidak ada draft penarikan yang tertunda saat ini.",
    warning: draftPenarikan.length > 0,
  });

  return {
    stats,
    activities,
    alerts,
  };
}
