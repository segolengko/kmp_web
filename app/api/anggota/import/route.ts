import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ExcelRow = Record<string, unknown>;
type AnggotaImportPayload = {
  no_anggota: string;
  nama_lengkap: string;
  jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
  jenis_anggota: "BIASA" | "LUAR_BIASA";
  status_anggota: "AKTIF" | "PASIF" | "KELUAR";
  aktif: boolean;
  nik: string | null;
  departemen: string | null;
  jabatan: string | null;
  tanggal_masuk_kerja: string | null;
  tanggal_masuk_koperasi: string;
  no_hp: string | null;
  email: string | null;
  foto_url: string | null;
  alamat: string | null;
  catatan: string | null;
  updated_at: string;
};

function pickValue(row: ExcelRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (value !== undefined && value !== null && String(value).trim().length > 0) {
      return String(value).trim();
    }
  }

  return "";
}

function normalizeDate(value: string) {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const normalized = value.replace(/\//g, "-");
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase belum terkonfigurasi di environment aplikasi." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File Excel belum dipilih." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return NextResponse.json({ error: "Sheet Excel tidak ditemukan." }, { status: 400 });
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
    defval: "",
    raw: false,
  });

  if (rows.length === 0) {
    return NextResponse.json({ error: "File Excel tidak memiliki data." }, { status: 400 });
  }

  let payloads: AnggotaImportPayload[];

  try {
    payloads = rows.map((row, index) => {
      const noAnggota = pickValue(row, ["No Anggota", "No. Anggota", "no_anggota"]);
      const namaLengkap = pickValue(row, ["Nama Lengkap", "nama_lengkap"]);
      const jenisKelamin = pickValue(row, ["Jenis Kelamin", "jenis_kelamin"]) || "LAKI_LAKI";
      const jenisAnggota = pickValue(row, ["Jenis Anggota", "jenis_anggota"]) || "BIASA";
      const statusAnggota = pickValue(row, ["Status Anggota", "status_anggota"]) || "AKTIF";
      const tanggalMasukKoperasi = normalizeDate(
        pickValue(row, ["Tanggal Masuk Koperasi", "tanggal_masuk_koperasi"]),
      );

      if (!noAnggota || !namaLengkap || !tanggalMasukKoperasi) {
        throw new Error(
          `Baris ${index + 2} wajib memiliki No Anggota, Nama Lengkap, dan Tanggal Masuk Koperasi.`,
        );
      }

      return {
        no_anggota: noAnggota,
        nama_lengkap: namaLengkap,
        jenis_kelamin:
          jenisKelamin === "PEREMPUAN" ? "PEREMPUAN" : "LAKI_LAKI",
        jenis_anggota:
          jenisAnggota === "LUAR_BIASA" ? "LUAR_BIASA" : "BIASA",
        status_anggota:
          statusAnggota === "KELUAR"
            ? "KELUAR"
            : statusAnggota === "PASIF"
              ? "PASIF"
              : "AKTIF",
        aktif: statusAnggota === "AKTIF",
        nik: pickValue(row, ["No KTP", "NIK", "nik"]) || null,
        departemen: pickValue(row, ["Departemen", "departemen"]) || null,
        jabatan: pickValue(row, ["Jabatan", "jabatan"]) || null,
        tanggal_masuk_kerja: normalizeDate(
          pickValue(row, ["Tanggal Masuk Kerja", "tanggal_masuk_kerja"]),
        ),
        tanggal_masuk_koperasi: tanggalMasukKoperasi,
        no_hp: pickValue(row, ["No HP", "no_hp"]) || null,
        email: pickValue(row, ["Email", "email"]) || null,
        foto_url: pickValue(row, ["Foto URL", "foto_url"]) || null,
        alamat: pickValue(row, ["Alamat", "alamat"]) || null,
        catatan: pickValue(row, ["Catatan", "catatan"]) || null,
        updated_at: new Date().toISOString(),
      };
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Format file Excel tidak valid.",
      },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("anggota")
    .upsert(payloads, { onConflict: "no_anggota" });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Import anggota gagal diproses." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    imported: payloads.length,
    message: `${payloads.length} baris anggota berhasil diimport.`,
  });
}
