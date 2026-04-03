import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function toNullableNumber(value: unknown) {
  const normalized = String(value ?? "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
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

function toRomanMonth(month: number) {
  const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return romans[month - 1] ?? String(month);
}

async function generateNoTagihan(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  unitBisnisId: number,
  tanggalTagihan: string,
) {
  const { data: unitRow, error: unitError } = await supabase
    .from("unit_bisnis")
    .select("kode_unit")
    .eq("id", unitBisnisId)
    .single();

  if (unitError || !unitRow) {
    throw new Error("Kode unit bisnis tidak ditemukan untuk membuat nomor tagihan.");
  }

  const date = new Date(`${tanggalTagihan}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Tanggal tagihan tidak valid.");
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndDate = new Date(year, month, 0);
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(monthEndDate.getDate()).padStart(2, "0")}`;
  const suffix = `/KMP/${String(unitRow.kode_unit ?? "").trim().toUpperCase()}/${toRomanMonth(month)}/${year}`;

  const { data: existingRows, error: existingError } = await supabase
    .from("tagihan_project")
    .select("no_tagihan")
    .eq("unit_bisnis_id", unitBisnisId)
    .gte("tanggal_tagihan", monthStart)
    .lte("tanggal_tagihan", monthEnd);

  if (existingError) {
    throw new Error(existingError.message ?? "Gagal membaca nomor tagihan yang sudah ada.");
  }

  const lastSequence = (existingRows ?? []).reduce((maxValue, row) => {
    const nomor = String(row.no_tagihan ?? "").trim();
    if (!nomor.endsWith(suffix)) {
      return maxValue;
    }

    const [firstPart] = nomor.split("/");
    const parsed = Number(firstPart);
    return Number.isFinite(parsed) ? Math.max(maxValue, parsed) : maxValue;
  }, 0);

  return `${String(lastSequence + 1).padStart(3, "0")}${suffix}`;
}

function isFilled(value: unknown) {
  return String(value ?? "").trim().length > 0;
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
  },
) {
  if (existingStatus === "TERBAYAR" || existingStatus === "LUNAS" || existingStatus === "CLOSED") {
    return existingStatus;
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

function buildTagihanPayload(body: Record<string, unknown>, noTagihan: string) {
  const subtotal = toNullableNumber(body.subtotal) ?? 0;
  const nilaiPpn = Math.round(subtotal * 0.11);
  const nilaiPph = toNullableNumber(body.nilaiPph) ?? 0;
  const nilaiTotal = subtotal + nilaiPpn - nilaiPph;
  const statusTagihan = deriveStatus(undefined, {
    noPenawaran: body.noPenawaran,
    noJo: body.noJo,
    noJcpr: body.noJcpr,
    noBeritaAcara: body.noBeritaAcara,
    noFakturPajak: body.noFakturPajak,
    noInvoice: body.noInvoice,
    noJpr: body.noJpr,
    estimasiCairAt: body.estimasiCairAt,
  });

  return {
    unit_bisnis_id: toNullableNumber(body.unitBisnisId),
    no_tagihan: noTagihan,
    nama_tagihan: toNullableString(body.namaTagihan),
    tanggal_tagihan: String(body.tanggalTagihan ?? "").trim(),
    subtotal,
    nilai_ppn: nilaiPpn,
    nilai_pph: nilaiPph,
    nilai_total: nilaiTotal,
    status_tagihan: statusTagihan,
    no_penawaran: toNullableString(body.noPenawaran),
    no_jo: toNullableString(body.noJo),
    no_jcpr: toNullableString(body.noJcpr),
    no_berita_acara: toNullableString(body.noBeritaAcara),
    no_faktur_pajak: toNullableString(body.noFakturPajak),
    no_invoice: toNullableString(body.noInvoice),
    no_jpr: toNullableString(body.noJpr),
    tanggal_jpr: toNullableString(body.tanggalJpr),
    estimasi_cair_at: toNullableString(body.estimasiCairAt),
    catatan: toNullableString(body.catatan),
    updated_at: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: "Payload tagihan tidak valid." }, { status: 400 });
  }

  const unitBisnisId = toNullableNumber(body.unitBisnisId);
  const tanggalTagihan = String(body.tanggalTagihan ?? "").trim();

  if (!unitBisnisId || !tanggalTagihan || !isFilled(body.namaTagihan)) {
    return NextResponse.json({ error: "Field wajib tagihan belum lengkap." }, { status: 400 });
  }

  try {
    await validateUnitBisnisId(supabase, unitBisnisId);
    const generatedNoTagihan = await generateNoTagihan(supabase, unitBisnisId, tanggalTagihan);
    const payload = buildTagihanPayload(body, generatedNoTagihan);

    const { data, error } = await supabase
      .from("tagihan_project")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      const errorMessage =
        error?.message?.includes("uq_tagihan_project_nomor")
          ? "Nomor tagihan sudah dipakai. Coba simpan ulang."
          : error?.message ?? "Gagal menambah tagihan.";

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Validasi unit bisnis gagal." },
      { status: 400 },
    );
  }
}
