import { mockAnggota, type AnggotaItem } from "./mock-anggota";
import { createSupabaseServerClient } from "./supabase/server";
import { getSupabaseEnv } from "./supabase/env";

type AnggotaSource = "supabase" | "mock";

type AnggotaResult = {
  data: AnggotaItem[];
  source: AnggotaSource;
};

type SupabaseAnggotaRow = {
  no_anggota: string;
  nama_lengkap: string;
  jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
  jenis_anggota: "BIASA" | "LUAR_BIASA";
  status_anggota: "AKTIF" | "PASIF" | "KELUAR";
  departemen: string | null;
  jabatan: string | null;
  no_hp: string | null;
  tanggal_masuk_koperasi: string | null;
  foto_url: string | null;
  foto_storage_key: string | null;
  nik: string | null;
  email: string | null;
  alamat: string | null;
  tanggal_masuk_kerja: string | null;
  catatan: string | null;
};

function mapSupabaseRow(row: SupabaseAnggotaRow): AnggotaItem {
  return {
    noAnggota: row.no_anggota,
    namaLengkap: row.nama_lengkap,
    jenisKelamin: row.jenis_kelamin,
    jenisAnggota: row.jenis_anggota,
    statusAnggota: row.status_anggota,
    departemen: row.departemen ?? "-",
    jabatan: row.jabatan ?? "-",
    noHp: row.no_hp ?? "-",
    tanggalMasukKoperasi: row.tanggal_masuk_koperasi ?? "-",
    fotoUrl: row.foto_url,
    fotoStorageKey: row.foto_storage_key,
    nik: row.nik,
    email: row.email,
    alamat: row.alamat,
    tanggalMasukKerja: row.tanggal_masuk_kerja,
    catatan: row.catatan,
  };
}

export async function getAnggotaData(): Promise<AnggotaResult> {
  const supabase = await createSupabaseServerClient();
  const { anggotaPhotoBucket } = getSupabaseEnv();

  if (!supabase) {
    return {
      data: mockAnggota,
      source: "mock",
    };
  }

  const { data, error } = await supabase
    .from("anggota")
    .select(
      "no_anggota,nama_lengkap,jenis_kelamin,jenis_anggota,status_anggota,departemen,jabatan,no_hp,tanggal_masuk_koperasi,foto_url,foto_storage_key,nik,email,alamat,tanggal_masuk_kerja,catatan",
    )
    .order("no_anggota", { ascending: true });

  if (error || !data) {
    return {
      data: mockAnggota,
      source: "mock",
    };
  }

  const rows = data.map((row) => mapSupabaseRow(row as SupabaseAnggotaRow));
  const storageKeys = rows
    .map((row) => row.fotoStorageKey)
    .filter((value): value is string => Boolean(value));

  if (storageKeys.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from(anggotaPhotoBucket)
      .createSignedUrls(storageKeys, 60 * 60 * 24);

    if (signedUrls) {
      const signedUrlMap = new Map(
        signedUrls.map((item) => [item.path, item.signedUrl]),
      );

      rows.forEach((row) => {
        if (row.fotoStorageKey && signedUrlMap.has(row.fotoStorageKey)) {
          row.fotoUrl = signedUrlMap.get(row.fotoStorageKey) ?? row.fotoUrl;
        }
      });
    }
  }

  return {
    data: rows,
    source: "supabase",
  };
}

export async function getAnggotaByNoAnggota(noAnggota: string) {
  const anggotaResult = await getAnggotaData();
  return anggotaResult.data.find((item) => item.noAnggota === noAnggota) ?? null;
}
