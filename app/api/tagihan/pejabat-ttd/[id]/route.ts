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
    return NextResponse.json({ error: "Payload pejabat tanda tangan tidak valid." }, { status: 400 });
  }

  const payload = {
    nama_pejabat: String(body.namaPejabat ?? "").trim(),
    jabatan_pejabat: String(body.jabatanPejabat ?? "").trim(),
    aktif: toBoolean(body.aktif),
    updated_at: new Date().toISOString(),
  };

  if (!payload.nama_pejabat || !payload.jabatan_pejabat) {
    return NextResponse.json({ error: "Nama pejabat dan jabatan wajib diisi." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pejabat_ttd")
    .update(payload)
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Gagal memperbarui pejabat tanda tangan." }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const { id } = await context.params;
  const { error } = await supabase.from("pejabat_ttd").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message ?? "Gagal menghapus pejabat tanda tangan." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
