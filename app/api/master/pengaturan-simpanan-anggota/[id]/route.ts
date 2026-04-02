import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function toNullableNumber(value: unknown) {
  const normalized = String(value ?? "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value: unknown) {
  return value === true || value === "true";
}

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const { id } = await context.params;
  if (!body) {
    return NextResponse.json({ error: "Payload pengaturan simpanan anggota tidak valid." }, { status: 400 });
  }

  const payload = {
    anggota_id: toNullableNumber(body.anggotaId),
    jenis_simpanan_id: toNullableNumber(body.jenisSimpananId),
    nama_pengaturan: String(body.namaPengaturan ?? "").trim(),
    nominal: toNullableNumber(body.nominal),
    berlaku_mulai: String(body.berlakuMulai ?? "").trim(),
    berlaku_sampai: toNullableString(body.berlakuSampai),
    aktif: toBoolean(body.aktif),
    keterangan: toNullableString(body.keterangan),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("pengaturan_simpanan_anggota")
    .update(payload)
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message ?? "Gagal memperbarui pengaturan simpanan anggota." }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const { id } = await context.params;
  const { error } = await supabase.from("pengaturan_simpanan_anggota").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message ?? "Gagal menghapus pengaturan simpanan anggota." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
