import Link from "next/link";
import { AnggotaDeleteButton } from "@/components/anggota-delete-button";
import { AnggotaImportExportActions } from "@/components/anggota-import-export-actions";
import { DarkSelect } from "@/components/dark-select";
import { OpsShell } from "@/components/ops-shell";
import type { AnggotaItem } from "@/lib/mock-anggota";
import { getAnggotaData } from "@/lib/anggota-data";
import styles from "./page.module.css";

type AnggotaPageProps = {
  searchParams?: Promise<{
    q?: string;
    jenis?: string;
    status?: string;
    departemen?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 6;

function toLabelJenis(jenis: AnggotaItem["jenisAnggota"]) {
  return jenis === "BIASA" ? "Biasa" : "Luar Biasa";
}

function getInitials(namaLengkap: string) {
  return namaLengkap
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase())
    .join("");
}

function buildPageHref(
  currentParams: {
    q: string;
    jenis: string;
    status: string;
    departemen: string;
  },
  page: number,
) {
  const params = new URLSearchParams();

  if (currentParams.q) params.set("q", currentParams.q);
  if (currentParams.jenis) params.set("jenis", currentParams.jenis);
  if (currentParams.status) params.set("status", currentParams.status);
  if (currentParams.departemen) params.set("departemen", currentParams.departemen);
  params.set("page", String(page));

  return `/anggota?${params.toString()}`;
}

export default async function AnggotaPage({ searchParams }: AnggotaPageProps) {
  const params = (await searchParams) ?? {};
  const q = params.q?.trim() ?? "";
  const jenis = params.jenis ?? "";
  const status = params.status ?? "";
  const departemen = params.departemen ?? "";
  const page = Math.max(Number(params.page ?? "1") || 1, 1);

  const anggotaResult = await getAnggotaData();
  const anggotaItems = anggotaResult.data;

  const departemenOptions = Array.from(
    new Set(anggotaItems.map((item) => item.departemen)),
  ).sort((a, b) => a.localeCompare(b));

  const filteredAnggota = anggotaItems.filter((item) => {
    const keyword = q.toLowerCase();
    const matchesKeyword =
      keyword.length === 0 ||
      item.noAnggota.toLowerCase().includes(keyword) ||
      item.namaLengkap.toLowerCase().includes(keyword) ||
      item.departemen.toLowerCase().includes(keyword) ||
      item.jabatan.toLowerCase().includes(keyword);

    const matchesJenis = jenis.length === 0 || item.jenisAnggota === jenis;
    const matchesStatus = status.length === 0 || item.statusAnggota === status;
    const matchesDepartemen =
      departemen.length === 0 || item.departemen === departemen;

    return matchesKeyword && matchesJenis && matchesStatus && matchesDepartemen;
  });

  const totalItems = filteredAnggota.length;
  const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleAnggota = filteredAnggota.slice(startIndex, startIndex + PAGE_SIZE);
  const firstItem = totalItems === 0 ? 0 : startIndex + 1;
  const lastItem = totalItems === 0 ? 0 : Math.min(startIndex + PAGE_SIZE, totalItems);

  const currentParams = { q, jenis, status, departemen };

  return (
    <OpsShell
      badge="Master Anggota"
      currentPath="/anggota"
      description="Pusat data anggota untuk operasional harian. Operator bisa cari, filter, edit, hapus, import Excel, dan export laporan tanpa pindah-pindah halaman."
      title="Daftar Anggota"
    >
      <section className={styles.listPanel}>
          <div className={styles.listActions}>
            <div className={styles.summaryGroup}>
              <div className={styles.summaryBadge}>{totalItems} anggota ditemukan</div>
              <div
                className={`${styles.sourceBadge} ${
                  anggotaResult.source === "supabase" ? styles.sourceLive : styles.sourceMock
                }`}
              >
                {anggotaResult.source === "supabase" ? "Supabase Live" : "Mode Demo"}
              </div>
            </div>
            <div className={styles.actionsGroup}>
              <AnggotaImportExportActions />
              <Link className={styles.primaryListAction} href="/anggota/tambah">
                Tambah Anggota
              </Link>
            </div>
          </div>

          <form className={styles.filterBar} method="get">
            <div className={styles.searchField}>
              <label htmlFor="q">Pencarian</label>
              <input
                defaultValue={q}
                id="q"
                name="q"
                placeholder="Cari no anggota, nama, departemen, jabatan"
                type="search"
              />
            </div>
            <div className={styles.filterField}>
              <label htmlFor="jenis-filter">Jenis</label>
              <DarkSelect
                id="jenis-filter"
                name="jenis"
                options={[
                  { label: "Semua jenis", value: "" },
                  { label: "Biasa", value: "BIASA" },
                  { label: "Luar Biasa", value: "LUAR_BIASA" },
                ]}
                value={jenis}
              />
            </div>
            <div className={styles.filterField}>
              <label htmlFor="status-filter">Status</label>
              <DarkSelect
                id="status-filter"
                name="status"
                options={[
                  { label: "Semua status", value: "" },
                  { label: "Aktif", value: "AKTIF" },
                  { label: "Pasif", value: "PASIF" },
                  { label: "Keluar", value: "KELUAR" },
                ]}
                value={status}
              />
            </div>
            <div className={styles.filterField}>
              <label htmlFor="departemen-filter">Departemen</label>
              <DarkSelect
                id="departemen-filter"
                name="departemen"
                options={[
                  { label: "Semua departemen", value: "" },
                  ...departemenOptions.map((option) => ({
                    label: option,
                    value: option,
                  })),
                ]}
                value={departemen}
              />
            </div>
            <div className={styles.filterActions}>
              <button className={styles.searchButton} type="submit">
                Terapkan
              </button>
              <Link className={styles.resetButton} href="/anggota">
                Reset
              </Link>
            </div>
          </form>

          <div className={styles.tableMeta}>
            <span>
              Menampilkan {firstItem}-{lastItem} dari {totalItems} anggota
            </span>
            <span>
              Halaman {currentPage} / {totalPages}
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>No. Anggota</th>
                  <th>Nama</th>
                  <th>Jenis</th>
                  <th>Status</th>
                  <th>Departemen</th>
                  <th>No. HP</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visibleAnggota.length === 0 ? (
                  <tr>
                    <td className={styles.emptyCell} colSpan={8}>
                      Tidak ada anggota yang cocok dengan filter saat ini.
                    </td>
                  </tr>
                ) : (
                  visibleAnggota.map((item) => (
                    <tr key={item.noAnggota}>
                      <td>
                        <div className={styles.photoCell}>
                          {item.fotoUrl ? (
                            <img
                              alt={`Foto ${item.namaLengkap}`}
                              className={styles.photoThumb}
                              src={item.fotoUrl}
                            />
                          ) : (
                            <div className={styles.photoFallback}>
                              {getInitials(item.namaLengkap)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{item.noAnggota}</td>
                      <td className={styles.nameCell}>{item.namaLengkap}</td>
                      <td>{toLabelJenis(item.jenisAnggota)}</td>
                      <td>
                        <span
                          className={`${styles.statusChip} ${
                            item.statusAnggota === "AKTIF"
                              ? styles.statusAktif
                              : item.statusAnggota === "PASIF"
                                ? styles.statusPasif
                                : styles.statusKeluar
                          }`}
                        >
                          {item.statusAnggota}
                        </span>
                      </td>
                      <td>{item.departemen}</td>
                      <td>{item.noHp}</td>
                      <td>
                        <div className={styles.rowActions}>
                          <Link
                            className={styles.secondaryInlineAction}
                            href={`/anggota/${encodeURIComponent(item.noAnggota)}/keanggotaan`}
                          >
                            Keanggotaan
                          </Link>
                          <Link
                            className={styles.editAction}
                            href={`/anggota/${encodeURIComponent(item.noAnggota)}/edit`}
                          >
                            Edit
                          </Link>
                          <AnggotaDeleteButton
                            namaLengkap={item.namaLengkap}
                            noAnggota={item.noAnggota}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileCards}>
            {visibleAnggota.length === 0 ? (
              <div className={styles.mobileEmpty}>
                Tidak ada anggota yang cocok dengan filter saat ini.
              </div>
            ) : (
              visibleAnggota.map((item) => (
                <article className={styles.mobileCard} key={item.noAnggota}>
                  <div className={styles.mobileCardTop}>
                    <div className={styles.mobileIdentity}>
                      {item.fotoUrl ? (
                        <img
                          alt={`Foto ${item.namaLengkap}`}
                          className={styles.mobilePhoto}
                          src={item.fotoUrl}
                        />
                      ) : (
                        <div className={styles.mobilePhotoFallback}>
                          {getInitials(item.namaLengkap)}
                        </div>
                      )}
                      <div>
                        <strong>{item.namaLengkap}</strong>
                        <span>{item.noAnggota}</span>
                      </div>
                    </div>
                    <span
                      className={`${styles.statusChip} ${
                        item.statusAnggota === "AKTIF"
                          ? styles.statusAktif
                          : item.statusAnggota === "PASIF"
                            ? styles.statusPasif
                            : styles.statusKeluar
                      }`}
                    >
                      {item.statusAnggota}
                    </span>
                  </div>
                  <div className={styles.mobileMeta}>
                    <span>Jenis: {toLabelJenis(item.jenisAnggota)}</span>
                    <span>Departemen: {item.departemen}</span>
                    <span>HP: {item.noHp}</span>
                  </div>
                  <div className={styles.mobileActions}>
                    <Link
                      className={styles.secondaryInlineAction}
                      href={`/anggota/${encodeURIComponent(item.noAnggota)}/keanggotaan`}
                    >
                      Keanggotaan
                    </Link>
                    <Link
                      className={styles.editAction}
                      href={`/anggota/${encodeURIComponent(item.noAnggota)}/edit`}
                    >
                      Edit
                    </Link>
                    <AnggotaDeleteButton
                      namaLengkap={item.namaLengkap}
                      noAnggota={item.noAnggota}
                    />
                  </div>
                </article>
              ))
            )}
          </div>

          <div className={styles.pagination}>
            <Link
              aria-disabled={currentPage <= 1}
              className={`${styles.pageButton} ${currentPage <= 1 ? styles.pageButtonDisabled : ""}`}
              href={currentPage <= 1 ? "#" : buildPageHref(currentParams, currentPage - 1)}
            >
              Sebelumnya
            </Link>

            <div className={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <Link
                  className={`${styles.pageNumber} ${
                    pageNumber === currentPage ? styles.pageNumberActive : ""
                  }`}
                  href={buildPageHref(currentParams, pageNumber)}
                  key={pageNumber}
                >
                  {pageNumber}
                </Link>
              ))}
            </div>

            <Link
              aria-disabled={currentPage >= totalPages}
              className={`${styles.pageButton} ${currentPage >= totalPages ? styles.pageButtonDisabled : ""}`}
              href={
                currentPage >= totalPages ? "#" : buildPageHref(currentParams, currentPage + 1)
              }
            >
              Berikutnya
            </Link>
          </div>
      </section>
    </OpsShell>
  );
}
