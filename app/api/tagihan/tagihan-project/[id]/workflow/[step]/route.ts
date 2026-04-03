import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isWorkflowStepSlug, mapWorkflowStepToDocumentType } from "@/lib/tagihan-workflow-shared";

type RouteContext = {
  params: Promise<{ id: string; step: string }>;
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

function injectModuleCode(baseNumber: string, moduleCode: string) {
  const parts = baseNumber.split("/").map((part) => part.trim()).filter(Boolean);

  if (parts.length < 4) {
    return baseNumber;
  }

  const monthIndex = parts.findIndex((part) => /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)$/i.test(part));

  if (monthIndex <= 0) {
    return baseNumber;
  }

  const alreadyHasModule = parts.some((part) => part.toUpperCase() === moduleCode.toUpperCase());
  if (alreadyHasModule) {
    return parts.join("/");
  }

  const nextParts = [...parts];
  nextParts.splice(monthIndex, 0, moduleCode);
  return nextParts.join("/");
}

function deriveStatus(values: {
  existingStatus?: string | null;
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
}) {
  if (values.existingStatus === "CLOSED") {
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

async function handleWorkflowUpdate(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const { id, step } = await context.params;

  if (!body) {
    return NextResponse.json({ error: "Payload workflow tidak valid." }, { status: 400 });
  }

  if (!isWorkflowStepSlug(step)) {
    return NextResponse.json({ error: "Step workflow tidak dikenali." }, { status: 404 });
  }

  const { data: existingTagihan, error: tagihanError } = await supabase
    .from("tagihan_project")
    .select(
      "id,no_tagihan,status_tagihan,no_penawaran,no_jo,no_jcpr,no_berita_acara,no_faktur_pajak,no_invoice,no_jpr,tanggal_jpr,estimasi_cair_at,subtotal,nilai_ppn,nilai_pph,nilai_total",
    )
    .eq("id", id)
    .single();

  if (tagihanError || !existingTagihan) {
    return NextResponse.json({ error: "Data tagihan tidak ditemukan." }, { status: 404 });
  }

  const nextSubtotal = toNullableNumber(body.subtotal) ?? Number(existingTagihan.subtotal ?? 0);
  const nextNilaiPpn =
    step === "jcpr"
      ? toNullableNumber(body.nilaiPpn) ?? Number(existingTagihan.nilai_ppn ?? 0)
      : Math.round(nextSubtotal * 0.11);
  const nextNilaiPph =
    step === "pencairan"
      ? toNullableNumber(body.nilaiPph) ?? Number(existingTagihan.nilai_pph ?? 0)
      : Number(existingTagihan.nilai_pph ?? 0);
  const nextNilaiTotal =
    step === "jcpr"
      ? toNullableNumber(body.nilaiTotal) ?? (nextSubtotal + nextNilaiPpn - nextNilaiPph)
      : nextSubtotal + nextNilaiPpn - nextNilaiPph;

  const headerUpdates: Record<string, unknown> = {
    subtotal: nextSubtotal,
    nilai_ppn: nextNilaiPpn,
    nilai_pph: nextNilaiPph,
    nilai_total: nextNilaiTotal,
    updated_at: new Date().toISOString(),
  };

  if (step === "jo") {
    const noJo = toNullableString(body.noDokumen);
    const tanggalJo = toNullableString(body.tanggalDokumen);

    if (!noJo || !tanggalJo) {
      return NextResponse.json({ error: "Nomor JO dan tanggal JO wajib diisi." }, { status: 400 });
    }

    if (!existingTagihan.no_penawaran) {
      return NextResponse.json({ error: "Penawaran belum dibuat. Lengkapi Penawaran dulu sebelum membuat JO." }, { status: 400 });
    }

    const { data: penawaranRow, error: penawaranError } = await supabase
      .from("penawaran_project")
      .select("id")
      .eq("no_penawaran", existingTagihan.no_penawaran)
      .maybeSingle();

    if (penawaranError || !penawaranRow) {
      return NextResponse.json({ error: "Data penawaran terkait tidak ditemukan untuk membuat JO." }, { status: 400 });
    }

    const { data: existingJo } = await supabase
      .from("referensi_jo")
      .select("id")
      .eq("penawaran_project_id", penawaranRow.id)
      .maybeSingle();

    const joPayload = {
      penawaran_project_id: penawaranRow.id,
      no_jo: noJo,
      tanggal_jo: tanggalJo,
      cost_center: toNullableString(body.costCenter),
      departemen_mitra: toNullableString(body.departemenMitra),
      updated_at: new Date().toISOString(),
    };

    const joQuery = existingJo
      ? supabase.from("referensi_jo").update(joPayload).eq("id", existingJo.id)
      : supabase.from("referensi_jo").insert(joPayload);

    const { error: joError } = await joQuery;

    if (joError) {
      return NextResponse.json({ error: joError.message ?? "Gagal menyimpan JO." }, { status: 400 });
    }

    headerUpdates.no_jo = noJo;
  }

  const documentType = mapWorkflowStepToDocumentType(step);
  if (documentType) {
    let noDokumen = toNullableString(body.noDokumen);
    const tanggalDokumen = toNullableString(body.tanggalDokumen);

    if (step === "jcpr") {
      const suffixJcpr = String(body.suffixJcpr ?? "").replace(/\D/g, "").slice(0, 2);
      const noJo = String(existingTagihan.no_jo ?? "").trim();

      if (!noJo) {
        return NextResponse.json({ error: "Nomor JO belum ada. Buat JO dulu sebelum membuat JCPR." }, { status: 400 });
      }

      if (suffixJcpr.length !== 2) {
        return NextResponse.json({ error: "2 digit JCPR wajib diisi." }, { status: 400 });
      }

      noDokumen = `${noJo}${suffixJcpr}`;
    }

    if (step === "berita-acara") {
      noDokumen = injectModuleCode(String(existingTagihan.no_tagihan ?? "").trim(), "BAK");
    }

    if (!noDokumen || !tanggalDokumen) {
      return NextResponse.json({ error: `Nomor ${documentType} dan tanggal dokumen wajib diisi.` }, { status: 400 });
    }

    const { data: existingDocument } = await supabase
      .from("dokumen_tagihan_project")
      .select("id")
      .eq("tagihan_project_id", id)
      .eq("jenis_dokumen", documentType)
      .maybeSingle();

    const documentPayload = {
      tagihan_project_id: Number(id),
      jenis_dokumen: documentType,
      no_dokumen: noDokumen,
      no_kontrak: step === "berita-acara" ? toNullableString(body.noKontrak) : null,
      tanggal_dokumen: tanggalDokumen,
      updated_at: new Date().toISOString(),
    };

    const documentQuery = existingDocument
      ? supabase.from("dokumen_tagihan_project").update(documentPayload).eq("id", existingDocument.id)
      : supabase.from("dokumen_tagihan_project").insert(documentPayload);

    const { error: documentError } = await documentQuery;

    if (documentError) {
      return NextResponse.json({ error: documentError.message ?? `Gagal menyimpan dokumen ${documentType}.` }, { status: 400 });
    }

    if (step === "jcpr") headerUpdates.no_jcpr = noDokumen;
    if (step === "invoice") headerUpdates.no_invoice = noDokumen;
    if (step === "berita-acara") headerUpdates.no_berita_acara = noDokumen;
    if (step === "faktur-pajak") headerUpdates.no_faktur_pajak = noDokumen;
    if (step === "jpr") {
      headerUpdates.no_jpr = noDokumen;
      headerUpdates.tanggal_jpr = tanggalDokumen;
      headerUpdates.estimasi_cair_at = toNullableString(body.estimasiCairAt);
    }
  }

  let hasPencairan = false;
  let pencairanNominal = 0;

  if (step === "pencairan") {
    const tanggalPencairan = toNullableString(body.tanggalPencairan);
    const nominalPencairan = toNullableNumber(body.nominalPencairan) ?? 0;

    if (!tanggalPencairan) {
      return NextResponse.json({ error: "Tanggal pencairan wajib diisi." }, { status: 400 });
    }

    const { data: existingPencairan } = await supabase
      .from("pencairan_tagihan_project")
      .select("id")
      .eq("tagihan_project_id", id)
      .order("tanggal_pencairan", { ascending: false })
      .limit(1)
      .maybeSingle();

    const pencairanPayload = {
      tagihan_project_id: Number(id),
      tanggal_pencairan: tanggalPencairan,
      nominal_pencairan: nominalPencairan,
      catatan: toNullableString(body.catatan),
      updated_at: new Date().toISOString(),
    };

    const pencairanQuery = existingPencairan
      ? supabase.from("pencairan_tagihan_project").update(pencairanPayload).eq("id", existingPencairan.id)
      : supabase.from("pencairan_tagihan_project").insert(pencairanPayload);

    const { error: pencairanError } = await pencairanQuery;

    if (pencairanError) {
      return NextResponse.json({ error: pencairanError.message ?? "Gagal menyimpan pencairan." }, { status: 400 });
    }

    hasPencairan = true;
    pencairanNominal = nominalPencairan;
  } else {
    const { data: existingPencairan } = await supabase
      .from("pencairan_tagihan_project")
      .select("nominal_pencairan")
      .eq("tagihan_project_id", id)
      .order("tanggal_pencairan", { ascending: false })
      .limit(1)
      .maybeSingle();

    hasPencairan = Boolean(existingPencairan);
    pencairanNominal = Number(existingPencairan?.nominal_pencairan ?? 0);
  }

  headerUpdates.status_tagihan = deriveStatus({
    existingStatus: String(existingTagihan.status_tagihan ?? "DRAFT"),
    noPenawaran: existingTagihan.no_penawaran,
    noJo: headerUpdates.no_jo ?? existingTagihan.no_jo,
    noJcpr: headerUpdates.no_jcpr ?? existingTagihan.no_jcpr,
    noBeritaAcara: headerUpdates.no_berita_acara ?? existingTagihan.no_berita_acara,
    noFakturPajak: headerUpdates.no_faktur_pajak ?? existingTagihan.no_faktur_pajak,
    noInvoice: headerUpdates.no_invoice ?? existingTagihan.no_invoice,
    noJpr: headerUpdates.no_jpr ?? existingTagihan.no_jpr,
    estimasiCairAt: headerUpdates.estimasi_cair_at ?? existingTagihan.estimasi_cair_at,
    hasPencairan,
    pencairanNominal,
    nilaiTotal: nextNilaiTotal,
  });

  const { error: updateTagihanError } = await supabase
    .from("tagihan_project")
    .update(headerUpdates)
    .eq("id", id);

  if (updateTagihanError) {
    return NextResponse.json({ error: updateTagihanError.message ?? "Gagal memperbarui status tagihan." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: Request, context: RouteContext) {
  return handleWorkflowUpdate(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleWorkflowUpdate(request, context);
}
