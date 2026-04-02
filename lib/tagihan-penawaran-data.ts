import { createSupabaseServerClient } from "./supabase/server";

export type PenawaranStatus = "DRAFT" | "TERKIRIM" | "MENANG" | "KALAH" | "BATAL";

export type PenawaranProjectItem = {
  id?: number;
  urutan: number;
  namaItem: string;
  deskripsiItem: string | null;
  qty: number;
  satuan: string | null;
  hargaSatuan: number;
  jumlah: number;
};

export type PenawaranItemTemplateOption = {
  value: string;
  label: string;
  namaItem: string;
  deskripsiItem: string;
  satuan: string;
  hargaSatuan: string;
};

export type PenawaranProjectListItem = {
  id: number;
  referensiSrId: number;
  noPenawaran: string;
  tanggalPenawaran: string;
  perihal: string;
  nilaiTotal: number;
  statusPenawaran: PenawaranStatus;
  noSr: string;
  unitBisnisNama: string;
  mitraPerusahaanNama: string;
};

export type PenawaranProjectDetail = {
  id: number;
  referensiSrId: number;
  noPenawaran: string;
  tanggalPenawaran: string;
  perihal: string;
  pembukaSurat: string | null;
  subtotal: number;
  nilaiPpn: number;
  nilaiTotal: number;
  terbilang: string | null;
  tempatTtd: string | null;
  tanggalTtd: string | null;
  pejabatTtdId: number | null;
  penandatanganNama: string | null;
  penandatanganJabatan: string | null;
  pejabatTtd2Id: number | null;
  penandatanganNama2: string | null;
  penandatanganJabatan2: string | null;
  pejabatTtd3Id: number | null;
  penandatanganNama3: string | null;
  penandatanganJabatan3: string | null;
  statusPenawaran: PenawaranStatus;
  catatan: string | null;
  noSr: string;
  unitBisnisNama: string;
  mitraPerusahaanNama: string;
  items: PenawaranProjectItem[];
};

type SupabasePenawaranProjectListRow = {
  id: number;
  referensi_sr_id: number;
  no_penawaran: string;
  tanggal_penawaran: string;
  perihal: string;
  nilai_total: number | string;
  status_penawaran: PenawaranStatus;
  referensi_sr:
    | {
        no_sr: string;
        unit_bisnis: { nama_unit: string } | { nama_unit: string }[] | null;
        mitra_perusahaan:
          | { nama_perusahaan: string }
          | { nama_perusahaan: string }[]
          | null;
      }
    | {
        no_sr: string;
        unit_bisnis: { nama_unit: string } | { nama_unit: string }[] | null;
        mitra_perusahaan:
          | { nama_perusahaan: string }
          | { nama_perusahaan: string }[]
          | null;
      }[]
    | null;
};

type SupabasePenawaranProjectDetailRow = {
  id: number;
  referensi_sr_id: number;
  no_penawaran: string;
  tanggal_penawaran: string;
  perihal: string;
  pembuka_surat: string | null;
  subtotal: number | string;
  nilai_ppn: number | string;
  nilai_total: number | string;
  terbilang: string | null;
  tempat_ttd: string | null;
  tanggal_ttd: string | null;
  pejabat_ttd_id: number | null;
  penandatangan_nama: string | null;
  penandatangan_jabatan: string | null;
  pejabat_ttd_2_id: number | null;
  penandatangan_nama_2: string | null;
  penandatangan_jabatan_2: string | null;
  pejabat_ttd_3_id: number | null;
  penandatangan_nama_3: string | null;
  penandatangan_jabatan_3: string | null;
  status_penawaran: PenawaranStatus;
  catatan: string | null;
  referensi_sr:
    | {
        no_sr: string;
        unit_bisnis: { nama_unit: string } | { nama_unit: string }[] | null;
        mitra_perusahaan:
          | { nama_perusahaan: string }
          | { nama_perusahaan: string }[]
          | null;
      }
    | {
        no_sr: string;
        unit_bisnis: { nama_unit: string } | { nama_unit: string }[] | null;
        mitra_perusahaan:
          | { nama_perusahaan: string }
          | { nama_perusahaan: string }[]
          | null;
      }[]
    | null;
};

type SupabasePenawaranProjectItemRow = {
  id: number;
  urutan: number;
  nama_item: string;
  deskripsi_item: string | null;
  qty: number | string;
  satuan: string | null;
  harga_satuan: number | string;
  jumlah: number | string;
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

function mapPenawaranList(row: SupabasePenawaranProjectListRow): PenawaranProjectListItem {
  const referensiSr = firstRelation(row.referensi_sr);
  const unitBisnis = firstRelation(referensiSr?.unit_bisnis);
  const mitraPerusahaan = firstRelation(referensiSr?.mitra_perusahaan);

  return {
    id: row.id,
    referensiSrId: row.referensi_sr_id,
    noPenawaran: row.no_penawaran,
    tanggalPenawaran: row.tanggal_penawaran,
    perihal: row.perihal,
    nilaiTotal: toNumber(row.nilai_total),
    statusPenawaran: row.status_penawaran,
    noSr: referensiSr?.no_sr ?? "-",
    unitBisnisNama: unitBisnis?.nama_unit ?? "-",
    mitraPerusahaanNama: mitraPerusahaan?.nama_perusahaan ?? "-",
  };
}

function mapPenawaranItem(row: SupabasePenawaranProjectItemRow): PenawaranProjectItem {
  return {
    id: row.id,
    urutan: row.urutan,
    namaItem: row.nama_item,
    deskripsiItem: row.deskripsi_item,
    qty: toNumber(row.qty),
    satuan: row.satuan,
    hargaSatuan: toNumber(row.harga_satuan),
    jumlah: toNumber(row.jumlah),
  };
}

export async function getPenawaranProjectData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as PenawaranProjectListItem[];
  }

  const { data, error } = await supabase
    .from("penawaran_project")
    .select(
      "id,referensi_sr_id,no_penawaran,tanggal_penawaran,perihal,nilai_total,status_penawaran,referensi_sr:referensi_sr_id(no_sr,unit_bisnis:unit_bisnis_id(nama_unit),mitra_perusahaan:mitra_perusahaan_id(nama_perusahaan))",
    )
    .order("tanggal_penawaran", { ascending: false })
    .order("no_penawaran", { ascending: false });

  if (error || !data) {
    return [] as PenawaranProjectListItem[];
  }

  return (data as unknown as SupabasePenawaranProjectListRow[]).map(mapPenawaranList);
}

export async function getPenawaranProjectById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("penawaran_project")
    .select(
      "id,referensi_sr_id,no_penawaran,tanggal_penawaran,perihal,pembuka_surat,subtotal,nilai_ppn,nilai_total,terbilang,tempat_ttd,tanggal_ttd,pejabat_ttd_id,penandatangan_nama,penandatangan_jabatan,pejabat_ttd_2_id,penandatangan_nama_2,penandatangan_jabatan_2,pejabat_ttd_3_id,penandatangan_nama_3,penandatangan_jabatan_3,status_penawaran,catatan,referensi_sr:referensi_sr_id(no_sr,unit_bisnis:unit_bisnis_id(nama_unit),mitra_perusahaan:mitra_perusahaan_id(nama_perusahaan))",
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from("penawaran_project_item")
    .select("id,urutan,nama_item,deskripsi_item,qty,satuan,harga_satuan,jumlah")
    .eq("penawaran_project_id", id)
    .order("urutan", { ascending: true })
    .order("id", { ascending: true });

  if (itemsError) {
    return null;
  }

  const row = data as unknown as SupabasePenawaranProjectDetailRow;
  const referensiSr = firstRelation(row.referensi_sr);
  const unitBisnis = firstRelation(referensiSr?.unit_bisnis);
  const mitraPerusahaan = firstRelation(referensiSr?.mitra_perusahaan);

  return {
    id: row.id,
    referensiSrId: row.referensi_sr_id,
    noPenawaran: row.no_penawaran,
    tanggalPenawaran: row.tanggal_penawaran,
    perihal: row.perihal,
    pembukaSurat: row.pembuka_surat,
    subtotal: toNumber(row.subtotal),
    nilaiPpn: toNumber(row.nilai_ppn),
    nilaiTotal: toNumber(row.nilai_total),
    terbilang: row.terbilang,
    tempatTtd: row.tempat_ttd,
    tanggalTtd: row.tanggal_ttd,
    pejabatTtdId: row.pejabat_ttd_id,
    penandatanganNama: row.penandatangan_nama,
    penandatanganJabatan: row.penandatangan_jabatan,
    pejabatTtd2Id: row.pejabat_ttd_2_id,
    penandatanganNama2: row.penandatangan_nama_2,
    penandatanganJabatan2: row.penandatangan_jabatan_2,
    pejabatTtd3Id: row.pejabat_ttd_3_id,
    penandatanganNama3: row.penandatangan_nama_3,
    penandatanganJabatan3: row.penandatangan_jabatan_3,
    statusPenawaran: row.status_penawaran,
    catatan: row.catatan,
    noSr: referensiSr?.no_sr ?? "-",
    unitBisnisNama: unitBisnis?.nama_unit ?? "-",
    mitraPerusahaanNama: mitraPerusahaan?.nama_perusahaan ?? "-",
    items: ((items ?? []) as SupabasePenawaranProjectItemRow[]).map(mapPenawaranItem),
  } satisfies PenawaranProjectDetail;
}

export async function getPenawaranItemTemplateOptions() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as PenawaranItemTemplateOption[];
  }

  const { data, error } = await supabase
    .from("penawaran_project_item")
    .select("nama_item,deskripsi_item,satuan,harga_satuan,updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error || !data) {
    return [] as PenawaranItemTemplateOption[];
  }

  const seen = new Set<string>();
  const results: PenawaranItemTemplateOption[] = [];

  for (const row of data as Array<{
    nama_item: string;
    deskripsi_item: string | null;
    satuan: string | null;
    harga_satuan: number | string;
  }>) {
    const namaItem = String(row.nama_item ?? "").trim();
    const deskripsiItem = String(row.deskripsi_item ?? "").trim();
    const satuan = String(row.satuan ?? "").trim();
    const hargaSatuan = String(toNumber(row.harga_satuan));

    if (!namaItem) {
      continue;
    }

    const key = `${namaItem}|${deskripsiItem}|${satuan}|${hargaSatuan}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    results.push({
      value: key,
      label: `${namaItem}${deskripsiItem ? ` - ${deskripsiItem}` : ""}${satuan ? ` (${satuan})` : ""}`,
      namaItem,
      deskripsiItem,
      satuan,
      hargaSatuan,
    });

    if (results.length >= 30) {
      break;
    }
  }

  return results;
}
