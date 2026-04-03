import { createSupabaseServerClient } from "./supabase/server";

export type TagihanProjectStatus =
  | "DRAFT"
  | "DOKUMEN_SIAP"
  | "TERKIRIM"
  | "JPR_TERBIT"
  | "MENUNGGU_CAIR"
  | "TERBAYAR"
  | "LUNAS"
  | "CLOSED";

export type UnitBisnisOption = {
  value: string;
  label: string;
};

export type TagihanProjectListItem = {
  id: number;
  unitBisnisId: number | null;
  noTagihan: string;
  namaTagihan: string | null;
  tanggalTagihan: string;
  unitBisnisNama: string;
  penawaranId: number | null;
  noPenawaran: string | null;
  noJo: string | null;
  noJcpr: string | null;
  noBeritaAcara: string | null;
  noFakturPajak: string | null;
  noInvoice: string | null;
  nilaiTotal: number;
  nilaiPph: number;
  statusTagihan: TagihanProjectStatus;
  noJpr: string | null;
  tanggalJpr: string | null;
  estimasiCairAt: string | null;
  pencairanId: number | null;
  pencairanTanggal: string | null;
  pencairanNominal: number;
};

export type TagihanProjectDetail = {
  id: number;
  unitBisnisId: number | null;
  noTagihan: string;
  namaTagihan: string | null;
  tanggalTagihan: string;
  subtotal: number;
  nilaiPpn: number;
  nilaiPph: number;
  nilaiTotal: number;
  statusTagihan: TagihanProjectStatus;
  noPenawaran: string | null;
  noJo: string | null;
  noJcpr: string | null;
  noBeritaAcara: string | null;
  noFakturPajak: string | null;
  noInvoice: string | null;
  noJpr: string | null;
  tanggalJpr: string | null;
  estimasiCairAt: string | null;
  catatan: string | null;
  unitBisnisNama: string;
};

export type TagihanReportFilter =
  | "BELUM_TERTAGIH"
  | "SEMUA"
  | TagihanProjectStatus;

export type TagihanProjectListFilter = "SEMUA" | TagihanProjectStatus;

export type TagihanReportItem = TagihanProjectListItem & {
  umurTagihanHari: number;
};

export type TagihanReportSummary = {
  unitBisnisId: number | null;
  unitBisnisNama: string;
  jumlahTagihan: number;
  totalNilai: number;
};

export type TagihanReportResult = {
  items: TagihanReportItem[];
  summaries: TagihanReportSummary[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

export type TagihanProjectListResult = {
  items: TagihanProjectListItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

type SupabaseTagihanRow = {
  id: number;
  unit_bisnis_id: number | null;
  no_tagihan: string;
  nama_tagihan: string | null;
  tanggal_tagihan: string;
  subtotal?: number | string;
  nilai_ppn?: number | string;
  nilai_pph?: number | string;
  nilai_total: number | string;
  status_tagihan: TagihanProjectStatus;
  no_penawaran: string | null;
  no_jo: string | null;
  no_jcpr: string | null;
  no_berita_acara: string | null;
  no_faktur_pajak: string | null;
  no_invoice: string | null;
  no_jpr: string | null;
  tanggal_jpr?: string | null;
  estimasi_cair_at?: string | null;
  catatan?: string | null;
  unit_bisnis: { nama_unit: string } | { nama_unit: string }[] | null;
};

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getUnitBisnisTagihanOptions() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as UnitBisnisOption[];
  }

  const { data, error } = await supabase
    .from("unit_bisnis")
    .select("id,kode_unit,nama_unit,aktif")
    .eq("aktif", true)
    .order("kode_unit", { ascending: true });

  if (error || !data) {
    return [] as UnitBisnisOption[];
  }

  return (data as Array<{ id: number; kode_unit: string; nama_unit: string }>).map((row) => ({
    value: String(row.id),
    label: `${row.kode_unit} - ${row.nama_unit}`,
  }));
}

export async function getTagihanProjectData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as TagihanProjectListItem[];
  }

  const { data, error } = await supabase
    .from("tagihan_project")
    .select(
      "id,unit_bisnis_id,no_tagihan,nama_tagihan,tanggal_tagihan,nilai_total,nilai_pph,status_tagihan,no_penawaran,no_jo,no_jcpr,no_berita_acara,no_faktur_pajak,no_invoice,no_jpr,tanggal_jpr,estimasi_cair_at,unit_bisnis:unit_bisnis_id(nama_unit)",
    )
    .order("tanggal_tagihan", { ascending: false })
    .order("no_tagihan", { ascending: false });

  if (error || !data) {
    return [] as TagihanProjectListItem[];
  }

  const rows = data as unknown as SupabaseTagihanRow[];
  const nomorPenawaran = Array.from(
    new Set(
      rows
        .map((row) => row.no_penawaran)
        .filter((value): value is string => Boolean(value && value.trim())),
    ),
  );

  const penawaranMap = new Map<string, number>();
  const pencairanMap = new Map<
    number,
    {
      id: number;
      tanggalPencairan: string | null;
      nominalPencairan: number;
    }
  >();

  if (nomorPenawaran.length > 0) {
    const { data: penawaranRows } = await supabase
      .from("penawaran_project")
      .select("id,no_penawaran")
      .in("no_penawaran", nomorPenawaran);

    for (const row of penawaranRows ?? []) {
      penawaranMap.set(String(row.no_penawaran), Number(row.id));
    }
  }

  const tagihanIds = rows.map((row) => row.id);
  if (tagihanIds.length > 0) {
    const { data: pencairanRows } = await supabase
      .from("pencairan_tagihan_project")
      .select("id,tagihan_project_id,tanggal_pencairan,nominal_pencairan")
      .in("tagihan_project_id", tagihanIds)
      .order("tanggal_pencairan", { ascending: false });

    for (const row of pencairanRows ?? []) {
      const tagihanId = Number(row.tagihan_project_id);
      if (pencairanMap.has(tagihanId)) {
        continue;
      }

      pencairanMap.set(tagihanId, {
        id: Number(row.id),
        tanggalPencairan: row.tanggal_pencairan ?? null,
        nominalPencairan: toNumber(row.nominal_pencairan),
      });
    }
  }

  return rows.map((row) => {
    const unitBisnis = firstRelation(row.unit_bisnis);
    const pencairan = pencairanMap.get(row.id);

    return {
      id: row.id,
      unitBisnisId: row.unit_bisnis_id,
      noTagihan: row.no_tagihan,
      namaTagihan: row.nama_tagihan,
      tanggalTagihan: row.tanggal_tagihan,
      unitBisnisNama: unitBisnis?.nama_unit ?? "-",
      penawaranId: row.no_penawaran ? (penawaranMap.get(row.no_penawaran) ?? null) : null,
      noPenawaran: row.no_penawaran,
      noJo: row.no_jo,
      noJcpr: row.no_jcpr,
      noBeritaAcara: row.no_berita_acara,
      noFakturPajak: row.no_faktur_pajak,
      noInvoice: row.no_invoice,
      nilaiTotal: toNumber(row.nilai_total),
      nilaiPph: toNumber(row.nilai_pph),
      statusTagihan: row.status_tagihan,
      noJpr: row.no_jpr,
      tanggalJpr: row.tanggal_jpr ?? null,
      estimasiCairAt: row.estimasi_cair_at ?? null,
      pencairanId: pencairan?.id ?? null,
      pencairanTanggal: pencairan?.tanggalPencairan ?? null,
      pencairanNominal: pencairan?.nominalPencairan ?? 0,
    } satisfies TagihanProjectListItem;
  });
}

export async function getTagihanProjectById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("tagihan_project")
    .select(
      "id,unit_bisnis_id,no_tagihan,nama_tagihan,tanggal_tagihan,subtotal,nilai_ppn,nilai_pph,nilai_total,status_tagihan,no_penawaran,no_jo,no_jcpr,no_berita_acara,no_faktur_pajak,no_invoice,no_jpr,tanggal_jpr,estimasi_cair_at,catatan,unit_bisnis:unit_bisnis_id(nama_unit)",
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as SupabaseTagihanRow;
  const unitBisnis = firstRelation(row.unit_bisnis);

  return {
    id: row.id,
    unitBisnisId: row.unit_bisnis_id,
    noTagihan: row.no_tagihan,
    namaTagihan: row.nama_tagihan,
    tanggalTagihan: row.tanggal_tagihan,
    subtotal: toNumber(row.subtotal),
    nilaiPpn: toNumber(row.nilai_ppn),
    nilaiPph: toNumber(row.nilai_pph),
    nilaiTotal: toNumber(row.nilai_total),
    statusTagihan: row.status_tagihan,
    noPenawaran: row.no_penawaran,
    noJo: row.no_jo,
    noJcpr: row.no_jcpr,
    noBeritaAcara: row.no_berita_acara,
    noFakturPajak: row.no_faktur_pajak,
    noInvoice: row.no_invoice,
    noJpr: row.no_jpr,
    tanggalJpr: row.tanggal_jpr ?? null,
    estimasiCairAt: row.estimasi_cair_at ?? null,
    catatan: row.catatan ?? null,
    unitBisnisNama: unitBisnis?.nama_unit ?? "-",
  } satisfies TagihanProjectDetail;
}

function normalizeSearch(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function parseDateOnly(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getOutstandingStatusSet() {
  return new Set<TagihanProjectStatus>([
    "DRAFT",
    "DOKUMEN_SIAP",
    "TERKIRIM",
    "JPR_TERBIT",
    "MENUNGGU_CAIR",
  ]);
}

export async function getTagihanProjectListData(params: {
  q?: string;
  unitBisnisId?: string;
  status?: string;
  page?: string;
  pageSize?: number;
}) {
  const allItems = await getTagihanProjectData();
  const keyword = normalizeSearch(params.q);
  const unitBisnisId = params.unitBisnisId?.trim() ?? "";
  const selectedStatus = (params.status?.trim() || "SEMUA") as TagihanProjectListFilter;
  const pageSize = params.pageSize ?? 8;
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const filteredItems = allItems.filter((item) => {
    if (unitBisnisId && String(item.unitBisnisId ?? "") !== unitBisnisId) {
      return false;
    }

    if (selectedStatus !== "SEMUA" && item.statusTagihan !== selectedStatus) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const haystack = [
      item.noTagihan,
      item.namaTagihan,
      item.unitBisnisNama,
      item.noPenawaran,
      item.noJo,
      item.noInvoice,
      item.noJpr,
      item.noJcpr,
      item.noBeritaAcara,
      item.noFakturPajak,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(keyword);
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const items = filteredItems.slice(startIndex, startIndex + pageSize);

  return {
    items,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
  } satisfies TagihanProjectListResult;
}

export async function getTagihanReportData(params: {
  q?: string;
  unitBisnisId?: string;
  status?: string;
  page?: string;
  pageSize?: number;
}) {
  const allItems = await getTagihanProjectData();
  const keyword = normalizeSearch(params.q);
  const unitBisnisId = params.unitBisnisId?.trim() ?? "";
  const selectedStatus = (params.status?.trim() || "BELUM_TERTAGIH") as TagihanReportFilter;
  const pageSize = params.pageSize ?? 10;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const outstandingStatuses = getOutstandingStatusSet();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredItems = allItems
    .filter((item) => {
      if (unitBisnisId && String(item.unitBisnisId ?? "") !== unitBisnisId) {
        return false;
      }

      if (selectedStatus === "BELUM_TERTAGIH") {
        if (!outstandingStatuses.has(item.statusTagihan)) {
          return false;
        }
      } else if (selectedStatus !== "SEMUA" && item.statusTagihan !== selectedStatus) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const haystack = [
        item.noTagihan,
        item.namaTagihan,
        item.unitBisnisNama,
        item.noPenawaran,
        item.noJo,
        item.noInvoice,
        item.noJpr,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    })
    .map((item) => {
      const tanggalTagihan = parseDateOnly(item.tanggalTagihan);
      const umurTagihanHari = tanggalTagihan
        ? Math.max(0, Math.floor((today.getTime() - tanggalTagihan.getTime()) / 86_400_000))
        : 0;

      return {
        ...item,
        umurTagihanHari,
      } satisfies TagihanReportItem;
    })
    .sort((left, right) => {
      if (right.umurTagihanHari !== left.umurTagihanHari) {
        return right.umurTagihanHari - left.umurTagihanHari;
      }

      return left.tanggalTagihan.localeCompare(right.tanggalTagihan);
    });

  const summariesMap = new Map<string, TagihanReportSummary>();
  for (const item of filteredItems) {
    const key = String(item.unitBisnisId ?? "0");
    const current = summariesMap.get(key) ?? {
      unitBisnisId: item.unitBisnisId,
      unitBisnisNama: item.unitBisnisNama,
      jumlahTagihan: 0,
      totalNilai: 0,
    };

    current.jumlahTagihan += 1;
    current.totalNilai += item.nilaiTotal;
    summariesMap.set(key, current);
  }

  const summaries = Array.from(summariesMap.values()).sort((left, right) =>
    left.unitBisnisNama.localeCompare(right.unitBisnisNama),
  );

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const items = filteredItems.slice(startIndex, startIndex + pageSize);

  return {
    items,
    summaries,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
  } satisfies TagihanReportResult;
}
