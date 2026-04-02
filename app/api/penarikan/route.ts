import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RequestBody = {
  anggotaId?: string;
  jenisSimpananId?: string;
  tanggalPengajuan?: string;
  nominalPengajuan?: string;
  alasanPenarikan?: string;
  catatan?: string;
  diajukanOleh?: string;
};

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function toNumber(value: unknown) {
  const normalized = String(value ?? "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function padNumber(value: number, size: number) {
  return String(value).padStart(size, "0");
}

function buildNoPenarikan(anggotaId: number, jenisSimpananId: number) {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
    String(now.getMilliseconds()).padStart(3, "0"),
  ].join("");

  return `PNR-${padNumber(anggotaId, 6)}-${padNumber(jenisSimpananId, 4)}-${stamp}`;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase belum terkonfigurasi di environment aplikasi." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as RequestBody | null;

  if (!body) {
    return NextResponse.json({ error: "Payload penarikan tidak valid." }, { status: 400 });
  }

  const anggotaId = Number(body.anggotaId ?? 0);
  const jenisSimpananId = Number(body.jenisSimpananId ?? 0);
  const nominalPengajuan = toNumber(body.nominalPengajuan);
  const tanggalPengajuan = String(body.tanggalPengajuan ?? "").trim();

  if (!anggotaId || !jenisSimpananId) {
    return NextResponse.json(
      { error: "Anggota dan jenis simpanan wajib dipilih." },
      { status: 400 },
    );
  }

  if (!tanggalPengajuan) {
    return NextResponse.json(
      { error: "Tanggal pengajuan wajib diisi." },
      { status: 400 },
    );
  }

  if (nominalPengajuan <= 0) {
    return NextResponse.json(
      { error: "Nominal pengajuan harus lebih besar dari 0." },
      { status: 400 },
    );
  }

  const { data: saldoRow, error: saldoError } = await supabase
    .from("saldo_simpanan_anggota")
    .select(
      "anggota_id,jenis_simpanan_id,saldo_terbentuk,saldo_tersedia,anggota:anggota_id(no_anggota,nama_lengkap),jenis_simpanan:jenis_simpanan_id(kode,nama,kategori,model_pencatatan,bisa_ditarik)",
    )
    .eq("anggota_id", anggotaId)
    .eq("jenis_simpanan_id", jenisSimpananId)
    .maybeSingle();

  if (saldoError || !saldoRow) {
    return NextResponse.json(
      { error: "Saldo simpanan untuk anggota dan jenis simpanan tersebut tidak ditemukan." },
      { status: 400 },
    );
  }

  const jenisSimpanan = Array.isArray(saldoRow.jenis_simpanan)
    ? saldoRow.jenis_simpanan[0]
    : saldoRow.jenis_simpanan;
  const kodeSimpanan = jenisSimpanan?.kode ?? "";
  const kategori = jenisSimpanan?.kategori ?? "";

  const { data: titipanRow } = await supabase
    .from("titipan_simpanan_anggota")
    .select("saldo_titipan")
    .eq("anggota_id", anggotaId)
    .eq("jenis_simpanan_id", jenisSimpananId)
    .maybeSingle();

  const saldoTitipan = Number(titipanRow?.saldo_titipan ?? 0);
  const saldoTersedia =
    kodeSimpanan === "SS"
      ? Number(saldoRow.saldo_tersedia ?? 0)
      : jenisSimpanan?.model_pencatatan === "TAGIHAN"
        ? Number(saldoRow.saldo_terbentuk ?? 0) + saldoTitipan
        : Number(saldoRow.saldo_terbentuk ?? 0);

  if (kategori === "PENYERTAAN") {
    return NextResponse.json(
      { error: "Simpanan penyertaan tidak dapat diajukan penarikan." },
      { status: 400 },
    );
  }

  if (nominalPengajuan > saldoTersedia) {
    return NextResponse.json(
      {
        error: `Nominal pengajuan melebihi saldo yang bisa ditarik. Maksimal ${saldoTersedia}.`,
      },
      { status: 400 },
    );
  }

  const { data: existingDraft } = await supabase
    .from("penarikan_simpanan")
    .select("id")
    .eq("anggota_id", anggotaId)
    .eq("jenis_simpanan_id", jenisSimpananId)
    .in("status_penarikan", ["DIAJUKAN", "DISETUJUI"])
    .limit(1);

  if (existingDraft && existingDraft.length > 0) {
    return NextResponse.json(
      { error: "Masih ada draft/approval penarikan aktif untuk simpanan ini." },
      { status: 400 },
    );
  }

  const payload = {
    no_penarikan: buildNoPenarikan(anggotaId, jenisSimpananId),
    anggota_id: anggotaId,
    jenis_simpanan_id: jenisSimpananId,
    tanggal_pengajuan: tanggalPengajuan,
    nominal_pengajuan: nominalPengajuan,
    status_penarikan: "DIAJUKAN",
    alasan_penarikan: toNullableString(body.alasanPenarikan),
    catatan: toNullableString(body.catatan),
    diajukan_oleh: toNullableString(body.diajukanOleh) ?? "admin",
  };

  const { data, error } = await supabase
    .from("penarikan_simpanan")
    .insert(payload)
    .select("id,no_penarikan")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Draft penarikan gagal dibuat." },
      { status: 400 },
    );
  }

  return NextResponse.json({ data });
}
