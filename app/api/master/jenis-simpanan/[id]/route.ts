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

function toBoolean(value: unknown) {
  return value === true || value === "true";
}

function toNullableNumber(value: unknown) {
  const normalized = String(value ?? "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const { id } = await context.params;

  if (!body) {
    return NextResponse.json({ error: "Payload jenis simpanan tidak valid." }, { status: 400 });
  }

  const payload = {
    kode: String(body.kode ?? "").trim(),
    nama: String(body.nama ?? "").trim(),
    kategori: String(body.kategori ?? "").trim(),
    frekuensi: String(body.frekuensi ?? "").trim(),
    wajib: toBoolean(body.wajib),
    model_pencatatan: String(body.modelPencatatan ?? "").trim(),
    boleh_cicil: toBoolean(body.bolehCicil),
    bisa_ditarik: toBoolean(body.bisaDitarik),
    nominal_default: toNullableNumber(body.nominalDefault) ?? 0,
    aktif: toBoolean(body.aktif),
    keterangan: toNullableString(body.keterangan),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("jenis_simpanan")
    .update(payload)
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message ?? "Gagal memperbarui jenis simpanan." }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const { id } = await context.params;
  const { error } = await supabase.from("jenis_simpanan").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message ?? "Gagal menghapus jenis simpanan." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
