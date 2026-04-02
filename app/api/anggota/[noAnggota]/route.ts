import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    noAnggota: string;
  }>;
};

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase belum terkonfigurasi di environment aplikasi." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const { noAnggota } = await context.params;
  const currentNoAnggota = decodeURIComponent(noAnggota);

  if (!body) {
    return NextResponse.json({ error: "Payload anggota tidak valid." }, { status: 400 });
  }

  const noAnggotaBaru = String(body.noAnggota ?? "").trim();
  const namaLengkap = String(body.namaLengkap ?? "").trim();
  const jenisKelamin = String(body.jenisKelamin ?? "").trim();
  const jenisAnggota = String(body.jenisAnggota ?? "").trim();
  const statusAnggota = String(body.statusAnggota ?? "").trim();
  const tanggalMasukKoperasi = String(body.tanggalMasukKoperasi ?? "").trim();

  if (
    !noAnggotaBaru ||
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
    no_anggota: noAnggotaBaru,
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
    .update(payload)
    .eq("no_anggota", currentNoAnggota)
    .select("id,no_anggota")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Gagal memperbarui anggota." },
      { status: 400 },
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase belum terkonfigurasi di environment aplikasi." },
      { status: 500 },
    );
  }

  const { noAnggota } = await context.params;
  const currentNoAnggota = decodeURIComponent(noAnggota);

  const { error } = await supabase.from("anggota").delete().eq("no_anggota", currentNoAnggota);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Gagal menghapus anggota." },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
