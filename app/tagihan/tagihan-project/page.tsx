import Link from "next/link";
import { OpsShell } from "@/components/ops-shell";
import { TagihanProjectBoard } from "@/components/tagihan-project-board";
import {
  getTagihanProjectListData,
  getUnitBisnisTagihanOptions,
  type TagihanProjectListFilter,
} from "@/lib/tagihan-project-data";
import styles from "@/app/anggota/page.module.css";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    unit?: string;
    status?: string;
    page?: string;
  }>;
};

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function buildHref(params: {
  q?: string;
  unit?: string;
  status?: string;
  page?: string;
}) {
  const query = new URLSearchParams();

  if (params.q?.trim()) query.set("q", params.q.trim());
  if (params.unit?.trim()) query.set("unit", params.unit.trim());
  if (params.status?.trim()) query.set("status", params.status.trim());
  if (params.page?.trim() && params.page !== "1") query.set("page", params.page.trim());

  const queryString = query.toString();
  return queryString ? `/tagihan/tagihan-project?${queryString}` : "/tagihan/tagihan-project";
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pages: number[] = [];

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return pages;
}

const statusOptions: Array<{ value: TagihanProjectListFilter; label: string }> = [
  { value: "SEMUA", label: "Semua Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "DOKUMEN_SIAP", label: "Dokumen Siap" },
  { value: "TERKIRIM", label: "Terkirim" },
  { value: "JPR_TERBIT", label: "JPR Terbit" },
  { value: "MENUNGGU_CAIR", label: "Menunggu Cair" },
  { value: "TERBAYAR", label: "Terbayar" },
  { value: "LUNAS", label: "Lunas" },
  { value: "CLOSED", label: "Closed" },
];

export default async function TagihanProjectPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const q = resolvedSearchParams.q?.trim() ?? "";
  const unit = resolvedSearchParams.unit?.trim() ?? "";
  const status = (resolvedSearchParams.status?.trim() || "SEMUA") as TagihanProjectListFilter;
  const page = resolvedSearchParams.page?.trim() ?? "1";

  const [unitOptions, report] = await Promise.all([
    getUnitBisnisTagihanOptions(),
    getTagihanProjectListData({
      q,
      unitBisnisId: unit,
      status,
      page,
    }),
  ]);

  const pageNumbers = getPageNumbers(report.currentPage, report.totalPages);
  const firstItem = report.totalItems === 0 ? 0 : (report.currentPage - 1) * report.pageSize + 1;
  const lastItem = Math.min(report.totalItems, report.currentPage * report.pageSize);

  return (
    <OpsShell
      badge="Tagihan"
      currentPath="/tagihan/tagihan-project"
      description="Kelola data tagihan yang menjadi pusat alur JO, dokumen tagihan, JPR, dan pencairan."
      title="Data Tagihan"
    >
      <section className={styles.listPanel}>
        <div className={styles.listActions}>
          <div className={styles.summaryBadge}>{report.totalItems} tagihan</div>
          <div className={styles.actionsGroup}>
            <Link className={styles.primaryListAction} href="/tagihan/tagihan-project/tambah">
              Tambah Data Tagihan
            </Link>
            <Link className={styles.secondaryAction} href="/tagihan/laporan">
              Laporan Tagihan
            </Link>
          </div>
        </div>

        <form action="/tagihan/tagihan-project" className={styles.filterBarCompact}>
          <div className={styles.searchField}>
            <label htmlFor="data-tagihan-q">Pencarian</label>
            <input
              defaultValue={q}
              id="data-tagihan-q"
              name="q"
              placeholder="Cari nama tagihan, nomor, penawaran, JO, invoice..."
              type="search"
            />
          </div>
          <div className={styles.filterField}>
            <label htmlFor="data-tagihan-unit">Unit Bisnis</label>
            <select defaultValue={unit} id="data-tagihan-unit" name="unit">
              <option value="">Semua unit</option>
              {unitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterField}>
            <label htmlFor="data-tagihan-status">Status</label>
            <select defaultValue={status} id="data-tagihan-status" name="status">
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterActions}>
            <button className={styles.searchButton} type="submit">
              Cari
            </button>
            <Link className={styles.resetButton} href="/tagihan/tagihan-project">
              Reset
            </Link>
          </div>
        </form>

        <div className={styles.tableMeta}>
          <span>
            Menampilkan {firstItem}-{lastItem} dari {report.totalItems} data
          </span>
          <span>
            Filter status: {status === "SEMUA" ? "Semua Status" : formatStatusLabel(status)}
          </span>
        </div>

        <TagihanProjectBoard items={report.items} />

        <div className={styles.pagination}>
          <Link
            className={`${styles.pageButton} ${report.currentPage <= 1 ? styles.pageButtonDisabled : ""}`}
            href={buildHref({ q, unit, status, page: String(report.currentPage - 1) })}
          >
            Sebelumnya
          </Link>

          <div className={styles.pageNumbers}>
            {pageNumbers.map((pageNumber) => (
              <Link
                className={`${styles.pageNumber} ${pageNumber === report.currentPage ? styles.pageNumberActive : ""}`}
                href={buildHref({ q, unit, status, page: String(pageNumber) })}
                key={pageNumber}
              >
                {pageNumber}
              </Link>
            ))}
          </div>

          <Link
            className={`${styles.pageButton} ${report.currentPage >= report.totalPages ? styles.pageButtonDisabled : ""}`}
            href={buildHref({ q, unit, status, page: String(report.currentPage + 1) })}
          >
            Berikutnya
          </Link>
        </div>
      </section>
    </OpsShell>
  );
}
