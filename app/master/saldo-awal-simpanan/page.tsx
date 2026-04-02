import Link from "next/link";
import { OpsShell } from "@/components/ops-shell";
import { SaldoAwalSimpananActions } from "@/components/saldo-awal-simpanan-actions";
import { getSaldoAwalSimpananData } from "@/lib/saldo-awal-simpanan-data";
import styles from "@/app/anggota/page.module.css";

type SaldoAwalPageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 10;

function buildPageHref(q: string, page: number) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  params.set("page", String(page));

  return `/master/saldo-awal-simpanan?${params.toString()}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function SaldoAwalSimpananPage({ searchParams }: SaldoAwalPageProps) {
  const params = (await searchParams) ?? {};
  const q = params.q?.trim() ?? "";
  const page = Math.max(Number(params.page ?? "1") || 1, 1);

  const items = await getSaldoAwalSimpananData();
  const keyword = q.toLowerCase();
  const filteredItems = items.filter((item) => {
    if (!keyword) {
      return true;
    }

    return (
      item.noAnggota.toLowerCase().includes(keyword) ||
      item.namaLengkap.toLowerCase().includes(keyword) ||
      item.kodeSimpanan.toLowerCase().includes(keyword) ||
      item.namaSimpanan.toLowerCase().includes(keyword)
    );
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleItems = filteredItems.slice(startIndex, startIndex + PAGE_SIZE);
  const firstItem = totalItems === 0 ? 0 : startIndex + 1;
  const lastItem = totalItems === 0 ? 0 : Math.min(startIndex + PAGE_SIZE, totalItems);
  const totalSaldoTerbentuk = filteredItems.reduce(
    (sum, item) => sum + item.saldoTerbentukAwal,
    0,
  );
  const totalSaldoTitipan = filteredItems.reduce((sum, item) => sum + item.saldoTitipanAwal, 0);

  return (
    <OpsShell
      badge="Setup Saldo"
      currentPath="/master/saldo-awal-simpanan"
      description="Import saldo awal simpanan dari Excel agar posisi saldo, titipan, dan total historis bisa menjadi basis awal sebelum transaksi harian berjalan."
      title="Saldo Awal Simpanan"
    >
      <section className={styles.listPanel}>
        <section className="grid gap-4 rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02)),rgba(8,14,22,0.78)] p-5 shadow-[var(--shadow)]">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="grid gap-2">
              <div className={styles.summaryGroup}>
                <div className={styles.summaryBadge}>{totalItems} saldo awal tersimpan</div>
              </div>
              <p className={styles.helperText}>
                Gunakan template Excel resmi, lalu import saldo awal per anggota dan per jenis
                simpanan. Setelah import, sistem akan refresh saldo dan titipan otomatis.
              </p>
            </div>
            <SaldoAwalSimpananActions />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <article className="grid gap-1 rounded-2xl border border-white/7 bg-white/3 px-4 py-3">
              <span>Total Baris</span>
              <strong>{totalItems}</strong>
            </article>
            <article className="grid gap-1 rounded-2xl border border-white/7 bg-white/3 px-4 py-3">
              <span>Saldo Terbentuk Awal</span>
              <strong>{formatCurrency(totalSaldoTerbentuk)}</strong>
            </article>
            <article className="grid gap-1 rounded-2xl border border-white/7 bg-white/3 px-4 py-3">
              <span>Saldo Titipan Awal</span>
              <strong>{formatCurrency(totalSaldoTitipan)}</strong>
            </article>
          </div>

          <form
            className={`${styles.filterBarCompact} rounded-[18px] border border-white/6 bg-[rgba(10,16,24,0.78)] p-3`}
            method="get"
          >
            <div className={styles.searchField}>
              <label htmlFor="q">Pencarian</label>
              <input
                defaultValue={q}
                id="q"
                name="q"
                placeholder="Cari no anggota, nama, atau kode simpanan"
                type="search"
              />
            </div>
            <div className={styles.filterActions}>
              <button className={styles.searchButton} type="submit">
                Terapkan
              </button>
              <Link className={styles.resetButton} href="/master/saldo-awal-simpanan">
                Reset
              </Link>
            </div>
          </form>
        </section>

        <section className="grid gap-4 rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015)),rgba(8,14,22,0.86)] p-4 shadow-[var(--shadow)]">
          <div className={`${styles.tableMeta} px-1 text-[0.84rem] uppercase tracking-[0.04em]`}>
            <span>
              Menampilkan {firstItem}-{lastItem} dari {totalItems} saldo awal
            </span>
            <span>
              Halaman {currentPage} / {totalPages}
            </span>
          </div>

          <div className={`${styles.tableWrap} rounded-2xl bg-[rgba(7,12,19,0.82)]`}>
            <table className={`${styles.table} min-w-[1280px]`}>
              <thead>
                <tr>
                  <th>No. Anggota</th>
                  <th>Nama</th>
                  <th>Simpanan</th>
                  <th>Tanggal</th>
                  <th>Saldo Terbentuk</th>
                  <th>Titipan</th>
                  <th>Total Setor</th>
                  <th>Total Tarik</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.length === 0 ? (
                  <tr>
                    <td className={styles.emptyCell} colSpan={9}>
                      Belum ada saldo awal yang cocok dengan filter saat ini.
                    </td>
                  </tr>
                ) : (
                  visibleItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.noAnggota}</td>
                      <td className={styles.nameCell}>
                        <div className={styles.tableIdentity}>
                          <strong>{item.namaLengkap}</strong>
                          <span>{item.kodeSimpanan}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.tableIdentity}>
                          <strong>{item.namaSimpanan}</strong>
                          <span>{item.kodeSimpanan}</span>
                        </div>
                      </td>
                      <td>{item.tanggalSaldoAwal}</td>
                      <td>{formatCurrency(item.saldoTerbentukAwal)}</td>
                      <td>{formatCurrency(item.saldoTitipanAwal)}</td>
                      <td>{formatCurrency(item.totalSetorAwal)}</td>
                      <td>{formatCurrency(item.totalTarikAwal)}</td>
                      <td>{item.catatan ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileCards}>
            {visibleItems.length === 0 ? (
              <div className={styles.mobileEmpty}>
                Belum ada saldo awal yang cocok dengan filter saat ini.
              </div>
            ) : (
              visibleItems.map((item) => (
                <article className={styles.mobileCard} key={item.id}>
                  <div className={styles.mobileCardTop}>
                    <div className={styles.mobileIdentity}>
                      <div className={styles.mobilePhotoFallback}>
                        {item.kodeSimpanan.slice(0, 2)}
                      </div>
                      <div>
                        <strong>{item.namaLengkap}</strong>
                        <span>{item.noAnggota}</span>
                      </div>
                    </div>
                    <span className={`${styles.statusChip} ${styles.statusAktif}`}>
                      {item.kodeSimpanan}
                    </span>
                  </div>
                  <div className={styles.mobileMeta}>
                    <span>Simpanan: {item.namaSimpanan}</span>
                    <span>Tanggal: {item.tanggalSaldoAwal}</span>
                    <span>Saldo Terbentuk: {formatCurrency(item.saldoTerbentukAwal)}</span>
                    <span>Titipan: {formatCurrency(item.saldoTitipanAwal)}</span>
                    <span>Total Setor: {formatCurrency(item.totalSetorAwal)}</span>
                    <span>Total Tarik: {formatCurrency(item.totalTarikAwal)}</span>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className={styles.pagination}>
            <Link
              aria-disabled={currentPage <= 1}
              className={`${styles.pageButton} ${currentPage <= 1 ? styles.pageButtonDisabled : ""}`}
              href={currentPage <= 1 ? "#" : buildPageHref(q, currentPage - 1)}
            >
              Sebelumnya
            </Link>

            <div className={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <Link
                  className={`${styles.pageNumber} ${
                    pageNumber === currentPage ? styles.pageNumberActive : ""
                  }`}
                  href={buildPageHref(q, pageNumber)}
                  key={pageNumber}
                >
                  {pageNumber}
                </Link>
              ))}
            </div>

            <Link
              aria-disabled={currentPage >= totalPages}
              className={`${styles.pageButton} ${currentPage >= totalPages ? styles.pageButtonDisabled : ""}`}
              href={currentPage >= totalPages ? "#" : buildPageHref(q, currentPage + 1)}
            >
              Berikutnya
            </Link>
          </div>
        </section>
      </section>
    </OpsShell>
  );
}
