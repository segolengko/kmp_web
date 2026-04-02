import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
    return NextResponse.json({ error: "Payload unit bisnis tidak valid." }, { status: 400 });
  }

  const payload = {
    kode_unit: String(body.kodeUnit ?? "").trim(),
    nama_unit: String(body.namaUnit ?? "").trim(),
    aktif: toBoolean(body.aktif),
    updated_at: new Date().toISOString(),
  };

  if (!payload.kode_unit || !payload.nama_unit) {
    return NextResponse.json({ error: "Kode unit dan nama unit wajib diisi." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("unit_bisnis")
    .update(payload)
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message ?? "Gagal memperbarui unit bisnis." }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const { id } = await context.params;
  const { error } = await supabase.from("unit_bisnis").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message ?? "Gagal menghapus unit bisnis." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
