import { createSupabaseServerClient } from "./supabase/server";
import type { WorkflowDocumentType } from "./tagihan-workflow-shared";
export type { WorkflowStepSlug, WorkflowDocumentType } from "./tagihan-workflow-shared";
export { isWorkflowStepSlug, mapWorkflowStepToDocumentType, workflowStepLabels } from "./tagihan-workflow-shared";

export type TagihanWorkflowContext = {
  id: number;
  noTagihan: string;
  namaTagihan: string | null;
  statusTagihan: string;
  unitBisnisId: number | null;
  unitBisnisNama: string;
  tanggalTagihan: string;
  noSr: string | null;
  mitraPerusahaanId: number | null;
  mitraPerusahaanNama: string | null;
  mitraPerusahaanAlamat: string | null;
  mitraPerusahaanNpwp: string | null;
  subtotal: number;
  nilaiPpn: number;
  nilaiPph: number;
  nilaiTotal: number;
  noPenawaran: string | null;
  penandatanganNama: string | null;
  penawaranId: number | null;
  penawaranSubtotal: number;
  penawaranNilaiPpn: number;
  penawaranNilaiTotal: number;
  penawaranItems: Array<{
    id: number;
    urutan: number;
    namaItem: string;
    deskripsiItem: string | null;
    qty: number;
    satuan: string | null;
    hargaSatuan: number;
    jumlah: number;
  }>;
  jcprSigners: {
    contractor: string | null;
    jobInspector: string | null;
    sectionChief: string | null;
    serviceDepartment: string | null;
    requestingDepartment: string | null;
    deptHead: string | null;
  };
  jo: {
    id: number | null;
    noJo: string | null;
    tanggalJo: string | null;
    costCenter: string | null;
    departemenMitra: string | null;
  };
  documents: Partial<
    Record<
      WorkflowDocumentType,
      {
        id: number;
        noDokumen: string | null;
        noKontrak: string | null;
        tanggalDokumen: string | null;
        fileUrl: string | null;
      }
    >
  >;
  jpr: {
    id: number | null;
    noJpr: string | null;
    tanggalJpr: string | null;
    estimasiCairAt: string | null;
  };
  pencairan: {
    id: number | null;
    tanggalPencairan: string | null;
    nominalPencairan: number;
    catatan: string | null;
  };
};

type SupabaseTagihanWorkflowRow = {
  id: number;
  no_tagihan: string;
  nama_tagihan: string | null;
  status_tagihan: string;
  tanggal_tagihan: string;
  subtotal: number | string | null;
  nilai_ppn: number | string | null;
  nilai_pph: number | string | null;
  nilai_total: number | string | null;
  no_penawaran: string | null;
  no_jo: string | null;
  no_jpr: string | null;
  tanggal_jpr: string | null;
  estimasi_cair_at: string | null;
  unit_bisnis_id: number | null;
  unit_bisnis: { nama_unit: string } | { nama_unit: string }[] | null;
};

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getTagihanWorkflowContext(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("tagihan_project")
    .select(
      "id,no_tagihan,nama_tagihan,status_tagihan,tanggal_tagihan,subtotal,nilai_ppn,nilai_pph,nilai_total,no_penawaran,no_jo,no_jpr,tanggal_jpr,estimasi_cair_at,unit_bisnis_id,unit_bisnis:unit_bisnis_id(nama_unit)",
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as SupabaseTagihanWorkflowRow;
  const unitBisnis = firstRelation(row.unit_bisnis);

  let penawaranId: number | null = null;
  let noSr: string | null = null;
  let mitraPerusahaanId: number | null = null;
  let mitraPerusahaanNama: string | null = null;
  let mitraPerusahaanAlamat: string | null = null;
  let mitraPerusahaanNpwp: string | null = null;
  let penandatanganNama: string | null = null;
  let penawaranSubtotal = 0;
  let penawaranNilaiPpn = 0;
  let penawaranNilaiTotal = 0;
  let penawaranItems: TagihanWorkflowContext["penawaranItems"] = [];

  if (row.no_penawaran) {
    const { data: penawaranRow } = await supabase
      .from("penawaran_project")
      .select(
        "id,subtotal,nilai_ppn,nilai_total,penandatangan_nama,referensi_sr:referensi_sr_id(no_sr,mitra_perusahaan_id,mitra_perusahaan:mitra_perusahaan_id(nama_perusahaan,alamat,npwp))",
      )
      .eq("no_penawaran", row.no_penawaran)
      .maybeSingle();

    penawaranId = penawaranRow?.id ? Number(penawaranRow.id) : null;

    const referensiSr = Array.isArray(penawaranRow?.referensi_sr)
      ? penawaranRow?.referensi_sr[0]
      : penawaranRow?.referensi_sr;
    const mitraPerusahaan = Array.isArray(referensiSr?.mitra_perusahaan)
      ? referensiSr?.mitra_perusahaan[0]
      : referensiSr?.mitra_perusahaan;

    noSr = referensiSr?.no_sr ?? null;
    mitraPerusahaanId = referensiSr?.mitra_perusahaan_id ? Number(referensiSr.mitra_perusahaan_id) : null;
    mitraPerusahaanNama = mitraPerusahaan?.nama_perusahaan ?? null;
    mitraPerusahaanAlamat = mitraPerusahaan?.alamat ?? null;
    mitraPerusahaanNpwp = mitraPerusahaan?.npwp ?? null;
    penandatanganNama = penawaranRow?.penandatangan_nama ?? null;
    penawaranSubtotal = toNumber(penawaranRow?.subtotal);
    penawaranNilaiPpn = toNumber(penawaranRow?.nilai_ppn);
    penawaranNilaiTotal = toNumber(penawaranRow?.nilai_total);

    if (penawaranId) {
      const { data: itemRows } = await supabase
        .from("penawaran_project_item")
        .select("id,urutan,nama_item,deskripsi_item,qty,satuan,harga_satuan,jumlah")
        .eq("penawaran_project_id", penawaranId)
        .order("urutan", { ascending: true })
        .order("id", { ascending: true });

      penawaranItems = (itemRows ?? []).map((itemRow) => ({
        id: Number(itemRow.id),
        urutan: Number(itemRow.urutan),
        namaItem: String(itemRow.nama_item ?? ""),
        deskripsiItem: itemRow.deskripsi_item ?? null,
        qty: toNumber(itemRow.qty),
        satuan: itemRow.satuan ?? null,
        hargaSatuan: toNumber(itemRow.harga_satuan),
        jumlah: toNumber(itemRow.jumlah),
      }));
    }
  }

  const jcprSigners = {
    contractor: null as string | null,
    jobInspector: null as string | null,
    sectionChief: null as string | null,
    serviceDepartment: null as string | null,
    requestingDepartment: null as string | null,
    deptHead: null as string | null,
  };

  if (row.unit_bisnis_id) {
    const { data: signerRows } = await supabase
      .from("pejabat_ttd")
      .select("nama_pejabat,jabatan_pejabat,mitra_perusahaan_id,modul")
      .eq("unit_bisnis_id", row.unit_bisnis_id)
      .eq("aktif", true);

    const signerList = signerRows ?? [];

    const normalizeJabatan = (value: string) =>
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const normalizeModul = (value: string | null | undefined) => (value ?? "").trim().toUpperCase();

    const findSigner = (matcher: (jabatan: string) => boolean) => {
      const matches = signerList
        .filter((item) => matcher(normalizeJabatan(String(item.jabatan_pejabat ?? ""))))
        .map((item) => {
          const signerMitraId = item.mitra_perusahaan_id ? Number(item.mitra_perusahaan_id) : null;
          const signerModul = normalizeModul(item.modul);
          let score = 0;

          if (signerMitraId && signerMitraId === mitraPerusahaanId) {
            score += 100;
          } else if (!signerMitraId) {
            score += 50;
          }

          if (signerModul === "JCPR") {
            score += 20;
          } else if (!signerModul) {
            score += 10;
          }

          return { item, score };
        })
        .sort((left, right) => right.score - left.score);

      return matches[0]?.item?.nama_pejabat ?? null;
    };

    jcprSigners.contractor = findSigner(
      (jabatan) =>
        jabatan === "ketua" ||
        jabatan.includes("ketua") ||
        jabatan.includes("chairman") ||
        jabatan.includes("contractor"),
    );
    jcprSigners.jobInspector = findSigner(
      (jabatan) =>
        jabatan === "job inspector" ||
        jabatan.includes("job inspector") ||
        jabatan === "inspector" ||
        jabatan.includes("inspector"),
    );
    jcprSigners.sectionChief = findSigner(
      (jabatan) =>
        jabatan === "section chief" ||
        jabatan.includes("section chief") ||
        jabatan === "section head" ||
        jabatan.includes("section head") ||
        jabatan === "dept head" ||
        jabatan.includes("dept head"),
    );
    jcprSigners.serviceDepartment = findSigner(
      (jabatan) =>
        jabatan === "service department" ||
        jabatan.includes("service department") ||
        jabatan === "service" ||
        jabatan.includes("service"),
    );
    jcprSigners.requestingDepartment = findSigner(
      (jabatan) =>
        jabatan === "requesting department" ||
        jabatan.includes("requesting department") ||
        jabatan === "requesting dept" ||
        jabatan.includes("requesting dept") ||
        jabatan === "requesting" ||
        jabatan.includes("requesting"),
    );
    jcprSigners.deptHead = findSigner(
      (jabatan) => jabatan === "dept head" || jabatan.includes("dept head"),
    );
  }

  let jo = {
    id: null as number | null,
    noJo: row.no_jo ?? null,
    tanggalJo: null as string | null,
    costCenter: null as string | null,
    departemenMitra: null as string | null,
  };

  if (row.no_jo) {
    const { data: joRow } = await supabase
      .from("referensi_jo")
      .select("id,no_jo,tanggal_jo,cost_center,departemen_mitra")
      .eq("no_jo", row.no_jo)
      .maybeSingle();

    if (joRow) {
      jo = {
        id: Number(joRow.id),
        noJo: joRow.no_jo ?? row.no_jo,
        tanggalJo: joRow.tanggal_jo ?? null,
        costCenter: joRow.cost_center ?? null,
        departemenMitra: joRow.departemen_mitra ?? null,
      };
    }
  }

  const documents: TagihanWorkflowContext["documents"] = {};
  const { data: documentRows } = await supabase
    .from("dokumen_tagihan_project")
    .select("id,jenis_dokumen,no_dokumen,no_kontrak,tanggal_dokumen,file_url")
    .eq("tagihan_project_id", id);

  for (const documentRow of documentRows ?? []) {
    const jenisDokumen = String(documentRow.jenis_dokumen ?? "") as WorkflowDocumentType;
    documents[jenisDokumen] = {
      id: Number(documentRow.id),
      noDokumen: documentRow.no_dokumen ?? null,
      noKontrak: documentRow.no_kontrak ?? null,
      tanggalDokumen: documentRow.tanggal_dokumen ?? null,
      fileUrl: documentRow.file_url ?? null,
    };
  }

  const { data: pencairanRow } = await supabase
    .from("pencairan_tagihan_project")
    .select("id,tanggal_pencairan,nominal_pencairan,catatan")
    .eq("tagihan_project_id", id)
    .order("tanggal_pencairan", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    id: row.id,
    noTagihan: row.no_tagihan,
    namaTagihan: row.nama_tagihan,
    statusTagihan: row.status_tagihan,
    unitBisnisId: row.unit_bisnis_id,
    unitBisnisNama: unitBisnis?.nama_unit ?? "-",
    tanggalTagihan: row.tanggal_tagihan,
    noSr,
    mitraPerusahaanId,
    mitraPerusahaanNama,
    mitraPerusahaanAlamat,
    mitraPerusahaanNpwp,
    subtotal: toNumber(row.subtotal),
    nilaiPpn: toNumber(row.nilai_ppn),
    nilaiPph: toNumber(row.nilai_pph),
    nilaiTotal: toNumber(row.nilai_total),
    noPenawaran: row.no_penawaran,
    penandatanganNama,
    penawaranId,
    penawaranSubtotal,
    penawaranNilaiPpn,
    penawaranNilaiTotal,
    penawaranItems,
    jcprSigners,
    jo,
    documents,
    jpr: {
      id: documents.JPR?.id ?? null,
      noJpr: row.no_jpr ?? documents.JPR?.noDokumen ?? null,
      tanggalJpr: row.tanggal_jpr ?? documents.JPR?.tanggalDokumen ?? null,
      estimasiCairAt: row.estimasi_cair_at ?? null,
    },
    pencairan: {
      id: pencairanRow?.id ? Number(pencairanRow.id) : null,
      tanggalPencairan: pencairanRow?.tanggal_pencairan ?? null,
      nominalPencairan: toNumber(pencairanRow?.nominal_pencairan),
      catatan: pencairanRow?.catatan ?? null,
    },
  } satisfies TagihanWorkflowContext;
}
