import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
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

function isFilled(value: unknown) {
  return String(value ?? "").trim().length > 0;
}

async function validateUnitBisnisId(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  unitBisnisId: number,
) {
  const { data, error } = await supabase.from("unit_bisnis").select("id").eq("id", unitBisnisId).single();

  if (error || !data) {
    throw new Error("Unit bisnis tidak ditemukan. Pilih unit yang valid dulu.");
  }
}

function deriveStatus(
  existingStatus: string | null | undefined,
  values: {
    noPenawaran?: unknown;
    noJo?: unknown;
    noJcpr?: unknown;
    noBeritaAcara?: unknown;
    noFakturPajak?: unknown;
    noInvoice?: unknown;
    noJpr?: unknown;
    estimasiCairAt?: unknown;
    hasPencairan?: boolean;
    pencairanNominal?: number;
    nilaiTotal?: number;
  },
) {
  if (existingStatus === "CLOSED") {
    return "CLOSED";
  }

  if (values.hasPencairan && (values.pencairanNominal ?? 0) > 0) {
    return "TERBAYAR";
  }

  const documentsComplete =
    isFilled(values.noPenawaran) &&
    isFilled(values.noJo) &&
    isFilled(values.noJcpr) &&
    isFilled(values.noBeritaAcara) &&
    isFilled(values.noFakturPajak) &&
    isFilled(values.noInvoice);

  if (isFilled(values.noJpr) && isFilled(values.estimasiCairAt)) {
    return "MENUNGGU_CAIR";
  }

  if (isFilled(values.noJpr)) {
    return "JPR_TERBIT";
  }

  if (documentsComplete) {
    return "DOKUMEN_SIAP";
  }

  return "DRAFT";
}

function pickValue(bodyValue: unknown, existingValue: unknown) {
  return bodyValue === undefined ? existingValue : bodyValue;
}

function buildTagihanPayload(
  body: Record<string, unknown>,
  existingRow: Record<string, unknown>,
  hasPencairan: boolean,
  pencairanNominal: number,
) {
  const subtotal = toNullableNumber(pickValue(body.subtotal, existingRow.subtotal)) ?? 0;
  const nilaiPpn = Math.round(subtotal * 0.11);
  const nilaiPph = toNullableNumber(pickValue(body.nilaiPph, existingRow.nilai_pph)) ?? 0;
  const nilaiTotal = subtotal + nilaiPpn - nilaiPph;
  const existingStatus = String(existingRow.status_tagihan ?? "").trim() || "DRAFT";
  const statusTagihan = deriveStatus(existingStatus, {
    noPenawaran: pickValue(body.noPenawaran, existingRow.no_penawaran),
    noJo: pickValue(body.noJo, existingRow.no_jo),
    noJcpr: pickValue(body.noJcpr, existingRow.no_jcpr),
    noBeritaAcara: pickValue(body.noBeritaAcara, existingRow.no_berita_acara),
    noFakturPajak: pickValue(body.noFakturPajak, existingRow.no_faktur_pajak),
    noInvoice: pickValue(body.noInvoice, existingRow.no_invoice),
    noJpr: pickValue(body.noJpr, existingRow.no_jpr),
    estimasiCairAt: pickValue(body.estimasiCairAt, existingRow.estimasi_cair_at),
    hasPencairan,
    pencairanNominal,
    nilaiTotal,
  });

  return {
    unit_bisnis_id:
      toNullableNumber(pickValue(body.unitBisnisId, existingRow.unit_bisnis_id)) ?? null,
    no_tagihan: String(existingRow.no_tagihan ?? ""),
    nama_tagihan: toNullableString(pickValue(body.namaTagihan, existingRow.nama_tagihan)),
    tanggal_tagihan: String(
      pickValue(body.tanggalTagihan, existingRow.tanggal_tagihan) ?? "",
    ).trim(),
    subtotal,
    nilai_ppn: nilaiPpn,
    nilai_pph: nilaiPph,
    nilai_total: nilaiTotal,
    status_tagihan: statusTagihan,
    no_penawaran: toNullableString(pickValue(body.noPenawaran, existingRow.no_penawaran)),
    no_jo: toNullableString(pickValue(body.noJo, existingRow.no_jo)),
    no_jcpr: toNullableString(pickValue(body.noJcpr, existingRow.no_jcpr)),
    no_berita_acara: toNullableString(
      pickValue(body.noBeritaAcara, existingRow.no_berita_acara),
    ),
    no_faktur_pajak: toNullableString(
      pickValue(body.noFakturPajak, existingRow.no_faktur_pajak),
    ),
    no_invoice: toNullableString(pickValue(body.noInvoice, existingRow.no_invoice)),
    no_jpr: toNullableString(pickValue(body.noJpr, existingRow.no_jpr)),
    tanggal_jpr: toNullableString(pickValue(body.tanggalJpr, existingRow.tanggal_jpr)),
    estimasi_cair_at: toNullableString(
      pickValue(body.estimasiCairAt, existingRow.estimasi_cair_at),
    ),
    catatan: toNullableString(pickValue(body.catatan, existingRow.catatan)),
    updated_at: new Date().toISOString(),
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const { id } = await context.params;

  if (!body) {
    return NextResponse.json({ error: "Payload tagihan tidak valid." }, { status: 400 });
  }

  const { data: existingRow, error: existingRowError } = await supabase
    .from("tagihan_project")
    .select(
      "id,no_tagihan,status_tagihan,unit_bisnis_id,nama_tagihan,tanggal_tagihan,subtotal,nilai_pph,no_penawaran,no_jo,no_jcpr,no_berita_acara,no_faktur_pajak,no_invoice,no_jpr,tanggal_jpr,estimasi_cair_at,catatan",
    )
    .eq("id", id)
    .single();

  if (existingRowError || !existingRow) {
    return NextResponse.json({ error: "Data tagihan tidak ditemukan." }, { status: 404 });
  }

  const { data: pencairanRow } = await supabase
    .from("pencairan_tagihan_project")
    .select("nominal_pencairan")
    .eq("tagihan_project_id", id)
    .order("tanggal_pencairan", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = buildTagihanPayload(
    body,
    existingRow as Record<string, unknown>,
    Boolean(pencairanRow),
    Number(pencairanRow?.nominal_pencairan ?? 0),
  );

  if (!payload.unit_bisnis_id || !payload.tanggal_tagihan || !payload.nama_tagihan) {
    return NextResponse.json({ error: "Field wajib tagihan belum lengkap." }, { status: 400 });
  }

  try {
    await validateUnitBisnisId(supabase, payload.unit_bisnis_id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Validasi unit bisnis gagal." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("tagihan_project")
    .update(payload)
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    const errorMessage =
      error?.message?.includes("uq_tagihan_project_nomor")
        ? "Nomor tagihan sudah dipakai. Coba simpan ulang."
        : error?.message ?? "Gagal memperbarui tagihan.";

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const { id } = await context.params;
  const { error } = await supabase.from("tagihan_project").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message ?? "Gagal menghapus tagihan." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
