import Link from "next/link";
import { MasterFilterBar } from "@/components/master-filter-bar";
import { MasterDeleteButton } from "@/components/master-delete-button";
import { OpsShell } from "@/components/ops-shell";
import { getJenisSimpananData, type JenisSimpananItem } from "@/lib/jenis-simpanan-data";
import styles from "@/app/anggota/page.module.css";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    aktif?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 8;

function buildPageHref(params: { q: string; aktif: string }, page: number) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.aktif) search.set("aktif", params.aktif);
  search.set("page", String(page));

  return `/master/jenis-simpanan?${search.toString()}`;
}

function getStatusLabel(item: JenisSimpananItem) {
  return item.aktif ? "AKTIF" : "NONAKTIF";
}

export default async function JenisSimpananPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const q = params.q?.trim() ?? "";
  const aktif = params.aktif ?? "";
  const page = Math.max(Number(params.page ?? "1") || 1, 1);

  const items = await getJenisSimpananData();
  const filtered = items.filter((item) => {
    const keyword = q.toLowerCase();
    const matchKeyword =
      keyword.length === 0 ||
      item.kode.toLowerCase().includes(keyword) ||
      item.nama.toLowerCase().includes(keyword) ||
      item.kategori.toLowerCase().includes(keyword) ||
      item.modelPencatatan.toLowerCase().includes(keyword);

    const matchAktif =
      aktif.length === 0 || (aktif === "AKTIF" ? item.aktif : !item.aktif);

    return matchKeyword && matchAktif;
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(startIndex, startIndex + PAGE_SIZE);
  const firstItem = totalItems === 0 ? 0 : startIndex + 1;
  const lastItem = totalItems === 0 ? 0 : Math.min(startIndex + PAGE_SIZE, totalItems);
  const currentParams = { q, aktif };

  return (
    <OpsShell
      badge="Master"
      currentPath="/master/jenis-simpanan"
      description="Kelola struktur dasar simpanan koperasi, mulai dari kategori, frekuensi, model pencatatan, sampai perilaku penarikan."
      title="Jenis Simpanan"
    >
      <section className={styles.listPanel}>
          <div className={styles.listActions}>
            <div className={styles.summaryBadge}>{totalItems} jenis simpanan</div>
            <div className={styles.actionsGroup}>
              <Link className={styles.secondaryAction} href="/master">
                Semua Master
              </Link>
              <Link className={styles.primaryListAction} href="/master/jenis-simpanan/tambah">
                Tambah Jenis
              </Link>
            </div>
          </div>

          <MasterFilterBar
            actionPath="/master/jenis-simpanan"
            aktif={aktif}
            q={q}
            searchPlaceholder="Cari kode, nama, kategori, model"
          />

          <div className={styles.tableMeta}>
            <span>
              Menampilkan {firstItem}-{lastItem} dari {totalItems} data
            </span>
            <span>
              Halaman {currentPage} / {totalPages}
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama</th>
                  <th>Kategori</th>
                  <th>Frekuensi</th>
                  <th>Model</th>
                  <th>Default</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td className={styles.emptyCell} colSpan={8}>
                      Belum ada jenis simpanan yang cocok dengan filter ini.
                    </td>
                  </tr>
                ) : (
                  visible.map((item) => (
                    <tr key={item.id}>
                      <td>{item.kode}</td>
                      <td className={styles.nameCell}>{item.nama}</td>
                      <td>{item.kategori}</td>
                      <td>{item.frekuensi}</td>
                      <td>{item.modelPencatatan}</td>
                      <td>Rp{item.nominalDefault.toLocaleString("id-ID")}</td>
                      <td>
                        <span
                          className={`${styles.statusChip} ${
                            item.aktif ? styles.statusAktif : styles.statusKeluar
                          }`}
                        >
                          {getStatusLabel(item)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <Link
                            className={styles.editAction}
                            href={`/master/jenis-simpanan/${item.id}/edit`}
                          >
                            Edit
                          </Link>
                          <MasterDeleteButton
                            deleteUrl={`/api/master/jenis-simpanan/${item.id}`}
                            entityLabel="jenis simpanan"
                            entityName={item.nama}
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
            {visible.length === 0 ? (
              <div className={styles.mobileEmpty}>
                Belum ada jenis simpanan yang cocok dengan filter ini.
              </div>
            ) : (
              visible.map((item) => (
                <article className={styles.mobileCard} key={item.id}>
                  <div className={styles.mobileCardTop}>
                    <div>
                      <strong>{item.nama}</strong>
                      <span>{item.kode}</span>
                    </div>
                    <span
                      className={`${styles.statusChip} ${
                        item.aktif ? styles.statusAktif : styles.statusKeluar
                      }`}
                    >
                      {getStatusLabel(item)}
                    </span>
                  </div>
                  <div className={styles.mobileMeta}>
                    <span>Kategori: {item.kategori}</span>
                    <span>Frekuensi: {item.frekuensi}</span>
                    <span>Model: {item.modelPencatatan}</span>
                    <span>Default: Rp{item.nominalDefault.toLocaleString("id-ID")}</span>
                  </div>
                  <div className={styles.mobileActions}>
                    <Link className={styles.editAction} href={`/master/jenis-simpanan/${item.id}/edit`}>
                      Edit
                    </Link>
                    <MasterDeleteButton
                      deleteUrl={`/api/master/jenis-simpanan/${item.id}`}
                      entityLabel="jenis simpanan"
                      entityName={item.nama}
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
              href={currentPage >= totalPages ? "#" : buildPageHref(currentParams, currentPage + 1)}
            >
              Berikutnya
            </Link>
          </div>
      </section>
    </OpsShell>
  );
}
