import Link from "next/link";
import { OpsShell } from "@/components/ops-shell";
import { getLaporanSimpananData } from "@/lib/laporan-data";
import styles from "@/app/anggota/page.module.css";

function toCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type LaporanPageProps = {
  searchParams?: Promise<{
    tahun?: string;
  }>;
};

export default async function LaporanPage({ searchParams }: LaporanPageProps) {
  const currentYear = new Date().getFullYear();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedYear = Number(resolvedSearchParams?.tahun);
  const laporanYear =
    Number.isInteger(selectedYear) && selectedYear >= 2000 && selectedYear <= 2100
      ? selectedYear
      : currentYear;
  const { saldoItems, tunggakanItems, annualItems } = await getLaporanSimpananData(laporanYear);

  const totalSaldoTersedia = saldoItems.reduce((total, item) => total + item.saldoTersedia, 0);
  const totalSaldoTitipan = saldoItems.reduce((total, item) => total + item.saldoTitipan, 0);
  const totalTunggakan = tunggakanItems.reduce((total, item) => total + item.sisaTunggakan, 0);
  const totalSaldoRows = saldoItems.length;
  const totalAnggotaMenunggak = new Set(tunggakanItems.map((item) => item.noAnggota)).size;
  const totalTahunanPokok = annualItems.reduce((total, item) => total + item.simpananPokok, 0);
  const totalTahunanWajib = annualItems.reduce(
    (total, item) => total + item.wajibBulanan.reduce((subtotal, value) => subtotal + value, 0),
    0,
  );
  const totalTahunanIuran = annualItems.reduce((total, item) => total + item.total, 0);

  return (
    <OpsShell
      actionHref="/dashboard"
      actionLabel="Ke Dashboard"
      badge="Laporan Simpanan"
      currentPath="/laporan"
      description="Modul ini merangkum saldo simpanan anggota, total tunggakan aktif, dan daftar detail tagihan wajib yang belum lunas."
      title="Saldo & Tunggakan"
    >
      <section className={styles.listPanel}>
          <section className={styles.managementCard}>
            <div className={styles.sectionHeader}>
              <h2>Laporan SP + SW Tahunan</h2>
              <span>Realisasi simpanan pokok dan wajib per anggota untuk tahun {laporanYear}</span>
            </div>
            <form className={styles.filterBarCompact}>
              <div className={styles.field}>
                <label htmlFor="laporan-tahun">Tahun Laporan</label>
                <input id="laporan-tahun" name="tahun" defaultValue={laporanYear} type="number" />
              </div>
              <div className={styles.filterActions}>
                <button className={styles.primaryListAction} type="submit">
                  Terapkan Tahun
                </button>
              </div>
              <div className={styles.compactFilterInfo}>
                <span>
                  Kolom bulanan memakai realisasi pembayaran `SW` per periode, sedangkan `Simpanan
                  Pokok` memakai realisasi `SP` di tahun yang sama.
                </span>
              </div>
            </form>
            <div className={styles.resultSummary}>
              <div className={styles.summaryTile}>
                <span>Baris Laporan</span>
                <strong>{annualItems.length}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Total Simpanan Pokok</span>
                <strong>{toCurrency(totalTahunanPokok)}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Total Simpanan Wajib</span>
                <strong>{toCurrency(totalTahunanWajib)}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Total Keseluruhan</span>
                <strong>{toCurrency(totalTahunanIuran)}</strong>
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Dept</th>
                    <th>No. Anggota</th>
                    <th>Nama</th>
                    <th>Simpanan Pokok</th>
                    <th>Jan</th>
                    <th>Feb</th>
                    <th>Mar</th>
                    <th>Apr</th>
                    <th>Mei</th>
                    <th>Jun</th>
                    <th>Jul</th>
                    <th>Agu</th>
                    <th>Sep</th>
                    <th>Okt</th>
                    <th>Nov</th>
                    <th>Des</th>
                    <th>Jumlah Total</th>
                  </tr>
                </thead>
                <tbody>
                  {annualItems.length === 0 ? (
                    <tr>
                      <td className={styles.emptyCell} colSpan={17}>
                        Belum ada realisasi simpanan pokok dan wajib untuk tahun {laporanYear}.
                      </td>
                    </tr>
                  ) : (
                    annualItems.map((item) => (
                      <tr key={item.anggotaId}>
                        <td>{item.departemen}</td>
                        <td>
                          <Link
                            className={styles.secondaryInlineAction}
                            href={`/laporan/${encodeURIComponent(item.noAnggota)}`}
                          >
                            {item.noAnggota}
                          </Link>
                        </td>
                        <td className={styles.nameCell}>
                          <Link
                            className={styles.editAction}
                            href={`/laporan/${encodeURIComponent(item.noAnggota)}`}
                          >
                            {item.namaLengkap}
                          </Link>
                        </td>
                        <td>{toCurrency(item.simpananPokok)}</td>
                        {item.wajibBulanan.map((value, index) => (
                          <td key={`${item.anggotaId}-${index}`}>{toCurrency(value)}</td>
                        ))}
                        <td>{toCurrency(item.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.managementCard}>
            <div className={styles.sectionHeader}>
              <h2>Ringkasan Laporan</h2>
              <span>Snapshot terbaru dari saldo dan tunggakan</span>
            </div>
            <div className={styles.resultSummary}>
              <div className={styles.summaryTile}>
                <span>Total Baris Saldo</span>
                <strong>{totalSaldoRows}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Total Saldo Tersedia</span>
                <strong>{toCurrency(totalSaldoTersedia)}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Total Tunggakan</span>
                <strong>{toCurrency(totalTunggakan)}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Total Saldo Titipan</span>
                <strong>{toCurrency(totalSaldoTitipan)}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Anggota Menunggak</span>
                <strong>{totalAnggotaMenunggak}</strong>
              </div>
            </div>
          </section>

          <section className={styles.managementCard}>
            <div className={styles.sectionHeader}>
              <h2>Saldo Simpanan Anggota</h2>
              <span>Ringkasan per anggota per jenis simpanan</span>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>No. Anggota</th>
                    <th>Nama</th>
                    <th>Simpanan</th>
                    <th>Saldo Titipan</th>
                    <th>Saldo Tersedia</th>
                    <th>Total Setor</th>
                    <th>Total Tarik</th>
                    <th>Total Tunggakan</th>
                  </tr>
                </thead>
                <tbody>
                  {saldoItems.length === 0 ? (
                    <tr>
                      <td className={styles.emptyCell} colSpan={8}>
                        Belum ada data saldo simpanan.
                      </td>
                    </tr>
                  ) : (
                    saldoItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <Link
                            className={styles.secondaryInlineAction}
                            href={`/laporan/${encodeURIComponent(item.noAnggota)}`}
                          >
                            {item.noAnggota}
                          </Link>
                        </td>
                        <td className={styles.nameCell}>
                          <Link
                            className={styles.editAction}
                            href={`/laporan/${encodeURIComponent(item.noAnggota)}`}
                          >
                            {item.namaLengkap}
                          </Link>
                        </td>
                        <td>
                          {item.kodeSimpanan} - {item.namaSimpanan}
                        </td>
                        <td>{toCurrency(item.saldoTitipan)}</td>
                        <td>{toCurrency(item.saldoTersedia)}</td>
                        <td>{toCurrency(item.totalSetor)}</td>
                        <td>{toCurrency(item.totalTarik)}</td>
                        <td>{toCurrency(item.totalTunggakan)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.managementCard}>
            <div className={styles.sectionHeader}>
              <h2>Daftar Tunggakan Wajib</h2>
              <span>Prioritas follow up tagihan wajib yang belum lunas</span>
            </div>
            <div className={styles.historyList}>
              {tunggakanItems.length === 0 ? (
                <div className={styles.mobileEmpty}>Belum ada tunggakan simpanan wajib.</div>
              ) : (
                tunggakanItems.map((item) => (
                  <article className={styles.historyItem} key={item.tagihanId}>
                    <div className={styles.historyTop}>
                      <strong>{item.noTagihan}</strong>
                      <span className={`${styles.statusChip} ${styles.statusPasif}`}>
                        {item.umurTunggakanHari} hari
                      </span>
                    </div>
                    <div className={styles.historyBody}>
                      <span>
                        Anggota:{" "}
                        <Link
                          className={styles.secondaryInlineAction}
                          href={`/laporan/${encodeURIComponent(item.noAnggota)}`}
                        >
                          {item.noAnggota} - {item.namaLengkap}
                        </Link>
                      </span>
                      <span>
                        Jenis/Status: {item.jenisAnggota} / {item.statusAnggota}
                      </span>
                      <span>
                        Simpanan: {item.kodeSimpanan} - {item.namaSimpanan}
                      </span>
                      <span>Periode: {item.periodeLabel ?? "-"}</span>
                      <span>Nominal Tagihan: {toCurrency(item.nominalTagihan)}</span>
                      <span>Sudah Dibayar: {toCurrency(item.nominalTerbayar)}</span>
                      <span>Sisa Tunggakan: {toCurrency(item.sisaTunggakan)}</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
      </section>
    </OpsShell>
  );
}
