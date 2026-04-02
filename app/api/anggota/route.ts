import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase belum terkonfigurasi di environment aplikasi." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: "Payload anggota tidak valid." }, { status: 400 });
  }

  const noAnggota = String(body.noAnggota ?? "").trim();
  const namaLengkap = String(body.namaLengkap ?? "").trim();
  const jenisKelamin = String(body.jenisKelamin ?? "").trim();
  const jenisAnggota = String(body.jenisAnggota ?? "").trim();
  const statusAnggota = String(body.statusAnggota ?? "").trim();
  const tanggalMasukKoperasi = String(body.tanggalMasukKoperasi ?? "").trim();

  if (
    !noAnggota ||
    !namaLengkap ||
    !jenisKelamin ||
    !jenisAnggota ||
    !statusAnggota ||
    !tanggalMasukKoperasi
  ) {
    return NextResponse.json(
      {
        error:
          "No. anggota, nama lengkap, jenis kelamin, jenis anggota, status, dan tanggal masuk koperasi wajib diisi.",
      },
      { status: 400 },
    );
  }

  const payload = {
    no_anggota: noAnggota,
    nama_lengkap: namaLengkap,
    jenis_kelamin: jenisKelamin,
    jenis_anggota: jenisAnggota,
    status_anggota: statusAnggota,
    aktif: statusAnggota === "AKTIF",
    nik: toNullableString(body.nik),
    departemen: toNullableString(body.departemen),
    jabatan: toNullableString(body.jabatan),
    tanggal_masuk_kerja: toNullableString(body.tanggalMasukKerja),
    tanggal_masuk_koperasi: tanggalMasukKoperasi,
    no_hp: toNullableString(body.noHp),
    email: toNullableString(body.email),
    foto_url: toNullableString(body.fotoUrl),
    foto_storage_key: toNullableString(body.fotoStorageKey),
    alamat: toNullableString(body.alamat),
    catatan: toNullableString(body.catatan),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("anggota")
    .insert(payload)
    .select("id,no_anggota")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Gagal menambahkan anggota." },
      { status: 400 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
