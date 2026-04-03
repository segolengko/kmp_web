import Link from "next/link";
import { OpsShell } from "@/components/ops-shell";
import {
  getTagihanReportData,
  getUnitBisnisTagihanOptions,
  type TagihanReportFilter,
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

function formatDate(dateString: string) {
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function getAgeToneClass(umurHari: number) {
  if (umurHari >= 60) {
    return styles.statusKeluar;
  }

  if (umurHari >= 30) {
    return styles.statusPasif;
  }

  return styles.statusAktif;
}

function getStatusToneClass(status: TagihanReportFilter | string) {
  if (status === "TERBAYAR") {
    return styles.statusAktif;
  }

  if (status === "MENUNGGU_CAIR" || status === "JPR_TERBIT") {
    return styles.statusPasif;
  }

  return styles.statusKeluar;
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
  return queryString ? `/tagihan/laporan?${queryString}` : "/tagihan/laporan";
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

const statusOptions: Array<{ value: TagihanReportFilter; label: string }> = [
  { value: "BELUM_TERTAGIH", label: "Belum Tertagih" },
  { value: "SEMUA", label: "Semua Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "DOKUMEN_SIAP", label: "Dokumen Siap" },
  { value: "TERKIRIM", label: "Terkirim" },
  { value: "JPR_TERBIT", label: "JPR Terbit" },
  { value: "MENUNGGU_CAIR", label: "Menunggu Cair" },
  { value: "TERBAYAR", label: "Terbayar" },
];

export default async function LaporanTagihanPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const q = resolvedSearchParams.q?.trim() ?? "";
  const unit = resolvedSearchParams.unit?.trim() ?? "";
  const status = (resolvedSearchParams.status?.trim() || "BELUM_TERTAGIH") as TagihanReportFilter;
  const page = resolvedSearchParams.page?.trim() ?? "1";

  const [unitOptions, report] = await Promise.all([
    getUnitBisnisTagihanOptions(),
    getTagihanReportData({
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
      currentPath="/tagihan/laporan"
      description="Pantau data tagihan per unit dengan fokus status yang belum tertagih, umur tagihan, dan progres penagihannya."
      title="Laporan Tagihan"
    >
      <section className={styles.listPanel}>
        <div className={styles.listActions}>
          <div className={styles.summaryBadge}>{report.totalItems} data</div>
          <div className={styles.actionsGroup}>
            <Link className={styles.secondaryAction} href="/tagihan/tagihan-project">
              Data Tagihan
            </Link>
          </div>
        </div>

        {report.summaries.length > 0 ? (
          <div className={styles.profileSummary}>
            {report.summaries.map((summary) => (
              <article className={styles.managementCard} key={`${summary.unitBisnisId ?? "unit"}-${summary.unitBisnisNama}`}>
                <div className={styles.sectionHeader}>
                  <h2>{summary.unitBisnisNama}</h2>
                  <span className={styles.summaryBadge}>{summary.jumlahTagihan} tagihan</span>
                </div>
                <p className={styles.hint}>Outstanding per unit berdasarkan filter laporan saat ini.</p>
                <strong>Rp {formatCurrency(summary.totalNilai)}</strong>
              </article>
            ))}
          </div>
        ) : null}

        <form action="/tagihan/laporan" className={styles.filterBar}>
          <div className={styles.searchField}>
            <label htmlFor="tagihan-q">Pencarian</label>
            <input
              defaultValue={q}
              id="tagihan-q"
              name="q"
              placeholder="Cari nama tagihan, nomor, penawaran, JO, invoice..."
              type="search"
            />
          </div>
          <div className={styles.filterField}>
            <label htmlFor="tagihan-unit">Unit Bisnis</label>
            <select defaultValue={unit} id="tagihan-unit" name="unit">
              <option value="">Semua unit</option>
              {unitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterField}>
            <label htmlFor="tagihan-status">Status</label>
            <select defaultValue={status} id="tagihan-status" name="status">
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
            <Link className={styles.resetButton} href="/tagihan/laporan">
              Reset
            </Link>
          </div>
        </form>

        <div className={styles.tableMeta}>
          <span>
            Menampilkan {firstItem}-{lastItem} dari {report.totalItems} data
          </span>
          <span>
            Fokus default: {status === "BELUM_TERTAGIH" ? "Belum Tertagih" : formatStatusLabel(status)}
          </span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama / No. Tagihan</th>
                <th>Unit</th>
                <th>Tanggal</th>
                <th>Umur Hari</th>
                <th>Dokumen</th>
                <th>Nilai Total</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {report.items.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={8}>
                    Tidak ada data tagihan untuk filter ini.
                  </td>
                </tr>
              ) : (
                report.items.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.nameCell}>
                      <strong>{item.namaTagihan || "-"}</strong>
                      <div className={styles.hint}>{item.noTagihan}</div>
                    </td>
                    <td>{item.unitBisnisNama}</td>
                    <td>{formatDate(item.tanggalTagihan)}</td>
                    <td>
                      <span className={`${styles.statusChip} ${styles.ageChip} ${getAgeToneClass(item.umurTagihanHari)}`}>
                        {item.umurTagihanHari} hari
                      </span>
                    </td>
                    <td>
                      <div>{item.noPenawaran || "-"}</div>
                      <div className={styles.hint}>{item.noJo || item.noInvoice || "-"}</div>
                    </td>
                    <td>Rp {formatCurrency(item.nilaiTotal)}</td>
                    <td>
                      <span className={`${styles.statusChip} ${getStatusToneClass(item.statusTagihan)}`}>
                        {formatStatusLabel(item.statusTagihan)}
                      </span>
                    </td>
                    <td>
                      <div className={`${styles.rowActions} ${styles.reportActionStack}`}>
                        <Link
                          className={styles.secondaryInlineAction}
                          href={`/tagihan/tagihan-project/${item.id}/edit`}
                        >
                          Edit Header
                        </Link>
                        <Link className={styles.editAction} href="/tagihan/tagihan-project">
                          Data Tagihan
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
