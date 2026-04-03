import { createSupabaseServerClient } from "./supabase/server";

type PenawaranRow = {
  id: number;
  no_penawaran: string;
  tanggal_penawaran: string;
  perihal: string;
  status_penawaran: string;
  nilai_total: number | string;
  referensi_sr:
    | {
        no_sr: string;
        tanggal_sr: string;
        unit_bisnis: { nama_unit: string } | { nama_unit: string }[] | null;
        mitra_perusahaan: { nama_perusahaan: string } | { nama_perusahaan: string }[] | null;
      }
    | {
        no_sr: string;
        tanggal_sr: string;
        unit_bisnis: { nama_unit: string } | { nama_unit: string }[] | null;
        mitra_perusahaan: { nama_perusahaan: string } | { nama_perusahaan: string }[] | null;
      }[]
    | null;
};

type JORow = {
  id: number;
  penawaran_project_id: number;
  no_jo: string;
  tanggal_jo: string;
  cost_center: string | null;
  departemen_mitra: string | null;
};

type TagihanRow = {
  id: number;
  referensi_jo_id: number;
  no_tagihan: string;
  tanggal_tagihan: string;
  status_tagihan: string;
  no_jpr: string | null;
  tanggal_jpr: string | null;
  estimasi_cair_at: string | null;
  nilai_total: number | string;
};

type DokumenRow = {
  tagihan_project_id: number;
  jenis_dokumen: "JCPR" | "INVOICE" | "BERITA_ACARA" | "FAKTUR_PAJAK" | "JPR";
  no_dokumen: string | null;
  tanggal_dokumen: string | null;
};

type PencairanRow = {
  tagihan_project_id: number;
  tanggal_pencairan: string;
  nominal_pencairan: number | string;
};

type TimelineStep = {
  label: string;
  state: "done" | "current" | "pending";
  detail: string;
};

export type TagihanTimelineItem = {
  id: string;
  penawaranId: number;
  anchorNumber: string;
  anchorLabel: string;
  mitraPerusahaanNama: string;
  unitBisnisNama: string;
  perihal: string;
  noSr: string;
  noPenawaran: string;
  noJo: string | null;
  noTagihan: string | null;
  noJpr: string | null;
  nilaiTagihan: number;
  estimasiCairAt: string | null;
  pencairanTerakhirAt: string | null;
  pencairanTotal: number;
  steps: TimelineStep[];
  documents: Array<{ label: string; nomor: string | null; tanggal: string | null }>;
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

function formatDate(dateString: string | null | undefined) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function buildStep(
  label: string,
  doneCondition: boolean,
  detailDone: string,
  detailPending: string,
  current = false,
): TimelineStep {
  if (doneCondition) {
    return { label, state: "done", detail: detailDone };
  }

  if (current) {
    return { label, state: "current", detail: detailPending };
  }

  return { label, state: "pending", detail: detailPending };
}

export async function getTagihanTimelineData() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as TagihanTimelineItem[];
  }

  const [penawaranResult, joResult, tagihanResult, dokumenResult, pencairanResult] = await Promise.all([
    supabase
      .from("penawaran_project")
      .select(
        "id,no_penawaran,tanggal_penawaran,perihal,status_penawaran,nilai_total,referensi_sr:referensi_sr_id(no_sr,tanggal_sr,unit_bisnis:unit_bisnis_id(nama_unit),mitra_perusahaan:mitra_perusahaan_id(nama_perusahaan))",
      )
      .order("tanggal_penawaran", { ascending: false })
      .order("no_penawaran", { ascending: false }),
    supabase
      .from("referensi_jo")
      .select("id,penawaran_project_id,no_jo,tanggal_jo,cost_center,departemen_mitra")
      .order("tanggal_jo", { ascending: false }),
    supabase
      .from("tagihan_project")
      .select("id,referensi_jo_id,no_tagihan,tanggal_tagihan,status_tagihan,no_jpr,tanggal_jpr,estimasi_cair_at,nilai_total")
      .order("tanggal_tagihan", { ascending: false }),
    supabase
      .from("dokumen_tagihan_project")
      .select("tagihan_project_id,jenis_dokumen,no_dokumen,tanggal_dokumen")
      .order("tanggal_dokumen", { ascending: false }),
    supabase
      .from("pencairan_tagihan_project")
      .select("tagihan_project_id,tanggal_pencairan,nominal_pencairan")
      .order("tanggal_pencairan", { ascending: false }),
  ]);

  if (
    penawaranResult.error ||
    joResult.error ||
    tagihanResult.error ||
    dokumenResult.error ||
    pencairanResult.error
  ) {
    return [] as TagihanTimelineItem[];
  }

  const penawaranRows = (penawaranResult.data ?? []) as unknown as PenawaranRow[];
  const joRows = (joResult.data ?? []) as JORow[];
  const tagihanRows = (tagihanResult.data ?? []) as TagihanRow[];
  const dokumenRows = (dokumenResult.data ?? []) as DokumenRow[];
  const pencairanRows = (pencairanResult.data ?? []) as PencairanRow[];

  const joByPenawaran = new Map<number, JORow[]>();
  for (const row of joRows) {
    const current = joByPenawaran.get(row.penawaran_project_id) ?? [];
    current.push(row);
    joByPenawaran.set(row.penawaran_project_id, current);
  }

  const tagihanByJo = new Map<number, TagihanRow[]>();
  for (const row of tagihanRows) {
    const current = tagihanByJo.get(row.referensi_jo_id) ?? [];
    current.push(row);
    tagihanByJo.set(row.referensi_jo_id, current);
  }

  const dokumenByTagihan = new Map<number, DokumenRow[]>();
  for (const row of dokumenRows) {
    const current = dokumenByTagihan.get(row.tagihan_project_id) ?? [];
    current.push(row);
    dokumenByTagihan.set(row.tagihan_project_id, current);
  }

  const pencairanByTagihan = new Map<number, PencairanRow[]>();
  for (const row of pencairanRows) {
    const current = pencairanByTagihan.get(row.tagihan_project_id) ?? [];
    current.push(row);
    pencairanByTagihan.set(row.tagihan_project_id, current);
  }

  const results: TagihanTimelineItem[] = [];

  for (const penawaran of penawaranRows) {
    const sr = firstRelation(penawaran.referensi_sr);
    const unitBisnis = firstRelation(sr?.unit_bisnis);
    const mitraPerusahaan = firstRelation(sr?.mitra_perusahaan);
    const joList = joByPenawaran.get(penawaran.id) ?? [];

    if (joList.length === 0) {
      results.push({
        id: `penawaran-${penawaran.id}`,
        penawaranId: penawaran.id,
        anchorNumber: penawaran.no_penawaran,
        anchorLabel: "Penawaran",
        mitraPerusahaanNama: mitraPerusahaan?.nama_perusahaan ?? "-",
        unitBisnisNama: unitBisnis?.nama_unit ?? "-",
        perihal: penawaran.perihal,
        noSr: sr?.no_sr ?? "-",
        noPenawaran: penawaran.no_penawaran,
        noJo: null,
        noTagihan: null,
        noJpr: null,
        nilaiTagihan: toNumber(penawaran.nilai_total),
        estimasiCairAt: null,
        pencairanTerakhirAt: null,
        pencairanTotal: 0,
        steps: [
          buildStep("SR", true, sr?.no_sr ? `${sr.no_sr} • ${formatDate(sr.tanggal_sr)}` : "SR tercatat", "Menunggu SR"),
          buildStep("Penawaran", true, `${penawaran.no_penawaran} • ${formatDate(penawaran.tanggal_penawaran)}`, "Menunggu penawaran"),
          buildStep("JO", false, "", "Menunggu JO", true),
          buildStep("Dokumen Tagihan", false, "", "Belum ada paket tagihan"),
          buildStep("JPR", false, "", "Belum ada JPR"),
          buildStep("Pencairan", false, "", "Belum ada pencairan"),
        ],
        documents: [],
      });
      continue;
    }

    for (const jo of joList) {
      const tagihanList = tagihanByJo.get(jo.id) ?? [];

      if (tagihanList.length === 0) {
        results.push({
          id: `jo-${jo.id}`,
          penawaranId: penawaran.id,
          anchorNumber: jo.no_jo,
          anchorLabel: "JO",
          mitraPerusahaanNama: mitraPerusahaan?.nama_perusahaan ?? "-",
          unitBisnisNama: unitBisnis?.nama_unit ?? "-",
          perihal: penawaran.perihal,
          noSr: sr?.no_sr ?? "-",
          noPenawaran: penawaran.no_penawaran,
          noJo: jo.no_jo,
          noTagihan: null,
          noJpr: null,
          nilaiTagihan: toNumber(penawaran.nilai_total),
          estimasiCairAt: null,
          pencairanTerakhirAt: null,
          pencairanTotal: 0,
          steps: [
            buildStep("SR", true, sr?.no_sr ? `${sr.no_sr} • ${formatDate(sr.tanggal_sr)}` : "SR tercatat", "Menunggu SR"),
            buildStep("Penawaran", true, `${penawaran.no_penawaran} • ${formatDate(penawaran.tanggal_penawaran)}`, "Menunggu penawaran"),
            buildStep("JO", true, `${jo.no_jo} • ${formatDate(jo.tanggal_jo)}`, "Menunggu JO"),
            buildStep("Dokumen Tagihan", false, "", "Belum ada paket tagihan", true),
            buildStep("JPR", false, "", "Belum ada JPR"),
            buildStep("Pencairan", false, "", "Belum ada pencairan"),
          ],
          documents: [],
        });
        continue;
      }

      for (const tagihan of tagihanList) {
        const documents = dokumenByTagihan.get(tagihan.id) ?? [];
        const documentMap = new Map(documents.map((item) => [item.jenis_dokumen, item]));
        const pencairan = pencairanByTagihan.get(tagihan.id) ?? [];
        const pencairanTotal = pencairan.reduce((total, item) => total + toNumber(item.nominal_pencairan), 0);
        const latestPencairan = pencairan[0] ?? null;
        const hasCoreDocs = ["JCPR", "INVOICE", "BERITA_ACARA", "FAKTUR_PAJAK"].every((jenis) =>
          documentMap.has(jenis as DokumenRow["jenis_dokumen"]),
        );
        const jprDocument = documentMap.get("JPR");
        const noJpr = tagihan.no_jpr ?? jprDocument?.no_dokumen ?? null;
        const tanggalJpr = tagihan.tanggal_jpr ?? jprDocument?.tanggal_dokumen ?? null;

        results.push({
          id: `tagihan-${tagihan.id}`,
          penawaranId: penawaran.id,
          anchorNumber: tagihan.no_tagihan,
          anchorLabel: "Tagihan",
          mitraPerusahaanNama: mitraPerusahaan?.nama_perusahaan ?? "-",
          unitBisnisNama: unitBisnis?.nama_unit ?? "-",
          perihal: penawaran.perihal,
          noSr: sr?.no_sr ?? "-",
          noPenawaran: penawaran.no_penawaran,
          noJo: jo.no_jo,
          noTagihan: tagihan.no_tagihan,
          noJpr: noJpr,
          nilaiTagihan: toNumber(tagihan.nilai_total),
          estimasiCairAt: tagihan.estimasi_cair_at,
          pencairanTerakhirAt: latestPencairan?.tanggal_pencairan ?? null,
          pencairanTotal,
          steps: [
            buildStep("SR", true, sr?.no_sr ? `${sr.no_sr} • ${formatDate(sr.tanggal_sr)}` : "SR tercatat", "Menunggu SR"),
            buildStep("Penawaran", true, `${penawaran.no_penawaran} • ${formatDate(penawaran.tanggal_penawaran)}`, "Menunggu penawaran"),
            buildStep("JO", true, `${jo.no_jo} • ${formatDate(jo.tanggal_jo)}`, "Menunggu JO"),
            buildStep(
              "Dokumen Tagihan",
              hasCoreDocs,
              `${tagihan.no_tagihan} • ${documents.length} dokumen`,
              `Tagihan ${tagihan.no_tagihan} belum lengkap`,
              !hasCoreDocs,
            ),
            buildStep(
              "JPR",
              Boolean(noJpr),
              `${noJpr} • ${formatDate(tanggalJpr)}`,
              "Menunggu JPR",
              hasCoreDocs && !noJpr,
            ),
            buildStep(
              "Pencairan",
              pencairanTotal > 0,
              `${formatDate(latestPencairan?.tanggal_pencairan)} • Rp ${new Intl.NumberFormat("id-ID").format(pencairanTotal)}`,
              tagihan.estimasi_cair_at
                ? `Estimasi cair ${formatDate(tagihan.estimasi_cair_at)}`
                : "Menunggu pencairan",
              Boolean(noJpr) && pencairanTotal === 0,
            ),
          ],
          documents: ["JCPR", "INVOICE", "BERITA_ACARA", "FAKTUR_PAJAK", "JPR"].map((label) => {
            const doc = documentMap.get(label as DokumenRow["jenis_dokumen"]);
            return {
              label,
              nomor: doc?.no_dokumen ?? null,
              tanggal: doc?.tanggal_dokumen ?? null,
            };
          }),
        });
      }
    }
  }

  return results;
}
