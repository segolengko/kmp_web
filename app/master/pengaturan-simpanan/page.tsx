import Link from "next/link";
import { MasterFilterBar } from "@/components/master-filter-bar";
import { MasterDeleteButton } from "@/components/master-delete-button";
import { OpsShell } from "@/components/ops-shell";
import { getPengaturanSimpananData } from "@/lib/pengaturan-simpanan-data";
import styles from "@/app/anggota/page.module.css";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    aktif?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 8;

function toSegmenAnggotaLabel(
  value: "BIASA_AKTIF" | "LUAR_BIASA_AKTIF" | "LUAR_BIASA_PASIF" | null,
) {
  if (value === "BIASA_AKTIF") return "Anggota Biasa - Aktif";
  if (value === "LUAR_BIASA_AKTIF") return "Anggota Luar Biasa - Aktif";
  if (value === "LUAR_BIASA_PASIF") return "Anggota Luar Biasa - Pasif";
  return "Umum";
}

function buildPageHref(params: { q: string; aktif: string }, page: number) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.aktif) search.set("aktif", params.aktif);
  search.set("page", String(page));

  return `/master/pengaturan-simpanan?${search.toString()}`;
}

export default async function PengaturanSimpananPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const q = params.q?.trim() ?? "";
  const aktif = params.aktif ?? "";
  const page = Math.max(Number(params.page ?? "1") || 1, 1);

  const items = await getPengaturanSimpananData();
  const filtered = items.filter((item) => {
    const keyword = q.toLowerCase();
    const matchKeyword =
      keyword.length === 0 ||
      item.namaPengaturan.toLowerCase().includes(keyword) ||
      item.kodeSimpanan.toLowerCase().includes(keyword) ||
      item.namaSimpanan.toLowerCase().includes(keyword) ||
      toSegmenAnggotaLabel(item.segmenAnggota).toLowerCase().includes(keyword);

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
      currentPath="/master/pengaturan-simpanan"
      description="Nilai nominal umum dan periode berlakunya dikelola di sini supaya batch generate, tagihan awal, dan referensi operasional tetap sinkron."
      title="Pengaturan Simpanan"
    >
      <section className={styles.listPanel}>
          <div className={styles.listActions}>
            <div className={styles.summaryBadge}>{totalItems} pengaturan simpanan</div>
            <div className={styles.actionsGroup}>
              <Link className={styles.secondaryAction} href="/master">
                Semua Master
              </Link>
              <Link
                className={styles.primaryListAction}
                href="/master/pengaturan-simpanan/tambah"
              >
                Tambah Pengaturan
              </Link>
            </div>
          </div>

          <MasterFilterBar
            actionPath="/master/pengaturan-simpanan"
            aktif={aktif}
            q={q}
            searchPlaceholder="Cari nama pengaturan atau jenis simpanan"
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
                  <th>Jenis</th>
                  <th>Segmen Anggota</th>
                  <th>Nama Pengaturan</th>
                  <th>Nominal</th>
                  <th>Berlaku Mulai</th>
                  <th>Berlaku Sampai</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td className={styles.emptyCell} colSpan={8}>
                      Belum ada pengaturan simpanan yang cocok dengan filter ini.
                    </td>
                  </tr>
                ) : (
                  visible.map((item) => (
                    <tr key={item.id}>
                      <td>{item.kodeSimpanan} - {item.namaSimpanan}</td>
                      <td>{toSegmenAnggotaLabel(item.segmenAnggota)}</td>
                      <td className={styles.nameCell}>{item.namaPengaturan}</td>
                      <td>Rp{item.nominal.toLocaleString("id-ID")}</td>
                      <td>{item.berlakuMulai}</td>
                      <td>{item.berlakuSampai ?? "-"}</td>
                      <td>
                        <span
                          className={`${styles.statusChip} ${
                            item.aktif ? styles.statusAktif : styles.statusKeluar
                          }`}
                        >
                          {item.aktif ? "AKTIF" : "NONAKTIF"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <Link
                            className={styles.editAction}
                            href={`/master/pengaturan-simpanan/${item.id}/edit`}
                          >
                            Edit
                          </Link>
                          <MasterDeleteButton
                            deleteUrl={`/api/master/pengaturan-simpanan/${item.id}`}
                            entityLabel="pengaturan simpanan"
                            entityName={item.namaPengaturan}
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
                Belum ada pengaturan simpanan yang cocok dengan filter ini.
              </div>
            ) : (
              visible.map((item) => (
                <article className={styles.mobileCard} key={item.id}>
                  <div className={styles.mobileCardTop}>
                    <div>
                      <strong>{item.namaPengaturan}</strong>
                      <span>{item.kodeSimpanan} - {item.namaSimpanan}</span>
                    </div>
                    <span
                      className={`${styles.statusChip} ${
                        item.aktif ? styles.statusAktif : styles.statusKeluar
                      }`}
                    >
                      {item.aktif ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </div>
                  <div className={styles.mobileMeta}>
                    <span>Segmen Anggota: {toSegmenAnggotaLabel(item.segmenAnggota)}</span>
                    <span>Nominal: Rp{item.nominal.toLocaleString("id-ID")}</span>
                    <span>Mulai: {item.berlakuMulai}</span>
                    <span>Sampai: {item.berlakuSampai ?? "-"}</span>
                  </div>
                  <div className={styles.mobileActions}>
                    <Link
                      className={styles.editAction}
                      href={`/master/pengaturan-simpanan/${item.id}/edit`}
                    >
                      Edit
                    </Link>
                    <MasterDeleteButton
                      deleteUrl={`/api/master/pengaturan-simpanan/${item.id}`}
                      entityLabel="pengaturan simpanan"
                      entityName={item.namaPengaturan}
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
