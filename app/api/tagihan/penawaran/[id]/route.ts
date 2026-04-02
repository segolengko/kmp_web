import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toTerbilangRupiah } from "@/lib/terbilang";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PenawaranItemPayload = {
  urutan: number;
  nama_item: string;
  deskripsi_item: string | null;
  qty: number;
  satuan: string | null;
  harga_satuan: number;
  jumlah: number;
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

async function validatePejabatIds(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  pejabatIds: Array<number | null>,
) {
  const ids = Array.from(new Set(pejabatIds.filter((value): value is number => value !== null)));

  if (ids.length === 0) {
    return;
  }

  const { data, error } = await supabase.from("pejabat_ttd").select("id").in("id", ids);

  if (error) {
    throw new Error(error.message ?? "Gagal memeriksa pejabat tanda tangan.");
  }

  const foundIds = new Set((data ?? []).map((item) => item.id));
  const invalidIds = ids.filter((id) => !foundIds.has(id));

  if (invalidIds.length > 0) {
    throw new Error("Pejabat TTD yang dipilih tidak ditemukan. Simpan dulu master pejabatnya atau pilih ulang.");
  }
}

function normalizeItems(rawItems: unknown): PenawaranItemPayload[] {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item, index) => {
      const row = (item ?? {}) as Record<string, unknown>;

      return {
        urutan: index + 1,
        nama_item: String(row.namaItem ?? "").trim(),
        deskripsi_item: toNullableString(row.deskripsiItem),
        qty: toNullableNumber(row.qty) ?? 0,
        satuan: toNullableString(row.satuan),
        harga_satuan: toNullableNumber(row.hargaSatuan) ?? 0,
        jumlah: (toNullableNumber(row.qty) ?? 0) * (toNullableNumber(row.hargaSatuan) ?? 0),
      };
    })
    .filter((item) => item.nama_item.length > 0);
}

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const { id } = await context.params;

  if (!body) {
    return NextResponse.json({ error: "Payload penawaran tidak valid." }, { status: 400 });
  }

  const items = normalizeItems(body.items);

  if (items.length === 0) {
    return NextResponse.json({ error: "Minimal harus ada satu item penawaran." }, { status: 400 });
  }

  const requestedNoPenawaran = String(body.noPenawaran ?? "").trim();
  const subtotal = items.reduce((total, item) => total + item.jumlah, 0);
  const nilaiPpn = Math.round(subtotal * 0.11);
  const nilaiTotal = subtotal + nilaiPpn;
  const terbilang = toTerbilangRupiah(nilaiTotal);
  const pejabatTtdId = toNullableNumber(body.pejabatTtdId);
  const pejabatTtd2Id = toNullableNumber(body.pejabatTtd2Id);
  const pejabatTtd3Id = toNullableNumber(body.pejabatTtd3Id);

  const { data: existingRow, error: existingRowError } = await supabase
    .from("penawaran_project")
    .select("id,no_penawaran")
    .eq("id", id)
    .single();

  if (existingRowError || !existingRow) {
    return NextResponse.json({ error: "Data penawaran tidak ditemukan." }, { status: 404 });
  }

  const payload = {
    referensi_sr_id: toNullableNumber(body.referensiSrId),
    no_penawaran: requestedNoPenawaran || existingRow.no_penawaran,
    tanggal_penawaran: String(body.tanggalPenawaran ?? "").trim(),
    perihal: String(body.perihal ?? "").trim(),
    pembuka_surat: toNullableString(body.pembukaSurat),
    subtotal,
    nilai_ppn: nilaiPpn,
    nilai_total: nilaiTotal,
    terbilang,
    tempat_ttd: toNullableString(body.tempatTtd),
    tanggal_ttd: toNullableString(body.tanggalTtd),
    pejabat_ttd_id: pejabatTtdId,
    penandatangan_nama: toNullableString(body.penandatanganNama),
    penandatangan_jabatan: toNullableString(body.penandatanganJabatan),
    pejabat_ttd_2_id: pejabatTtd2Id,
    penandatangan_nama_2: toNullableString(body.penandatanganNama2),
    penandatangan_jabatan_2: toNullableString(body.penandatanganJabatan2),
    pejabat_ttd_3_id: pejabatTtd3Id,
    penandatangan_nama_3: toNullableString(body.penandatanganNama3),
    penandatangan_jabatan_3: toNullableString(body.penandatanganJabatan3),
    status_penawaran: String(body.statusPenawaran ?? "DRAFT").trim() || "DRAFT",
    catatan: toNullableString(body.catatan),
    updated_at: new Date().toISOString(),
  };

  if (!payload.referensi_sr_id || !payload.no_penawaran || !payload.tanggal_penawaran || !payload.perihal) {
    return NextResponse.json({ error: "Field wajib penawaran belum lengkap." }, { status: 400 });
  }

  try {
    await validatePejabatIds(supabase, [pejabatTtdId, pejabatTtd2Id, pejabatTtd3Id]);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Validasi pejabat tanda tangan gagal." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("penawaran_project")
    .update(payload)
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Gagal memperbarui penawaran." }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("penawaran_project_item")
    .delete()
    .eq("penawaran_project_id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message ?? "Gagal menyegarkan item penawaran." }, { status: 400 });
  }

  const itemPayload = items.map((item) => ({
    penawaran_project_id: data.id,
    ...item,
    updated_at: new Date().toISOString(),
  }));

  const { error: itemError } = await supabase.from("penawaran_project_item").insert(itemPayload);

  if (itemError) {
    return NextResponse.json({ error: itemError.message ?? "Gagal menyimpan item penawaran." }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const { id } = await context.params;
  const { error } = await supabase.from("penawaran_project").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message ?? "Gagal menghapus penawaran." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
