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

export default async function LaporanSaldoSimpananPage() {
  const { saldoItems } = await getLaporanSimpananData();

  const totalSaldoRows = saldoItems.length;
  const totalSaldoTerbentuk = saldoItems.reduce((total, item) => total + item.saldoTerbentuk, 0);
  const totalSaldoTitipan = saldoItems.reduce((total, item) => total + item.saldoTitipan, 0);
  const totalSaldoTersedia = saldoItems.reduce((total, item) => total + item.saldoTersedia, 0);
  const totalTunggakan = saldoItems.reduce((total, item) => total + item.totalTunggakan, 0);

  return (
    <OpsShell
      actionHref="/laporan"
      actionLabel="Kembali ke Laporan"
      badge="Laporan Simpanan"
      currentPath="/laporan/saldo-simpanan"
      description="Halaman ini khusus menampilkan posisi saldo simpanan anggota supaya tidak bercampur dengan laporan tahunan."
      title="Posisi Saldo Simpanan"
    >
      <section className={styles.listPanel}>
        <section className={styles.managementCard}>
          <div className={styles.sectionHeader}>
            <h2>Ringkasan Posisi Saldo</h2>
            <span>Snapshot saldo terbaru per jenis simpanan anggota</span>
          </div>
          <div className={styles.resultSummary}>
            <div className={styles.summaryTile}>
              <span>Total Baris Saldo</span>
              <strong>{totalSaldoRows}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Total Saldo Terbentuk</span>
              <strong>{toCurrency(totalSaldoTerbentuk)}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Total Saldo Titipan</span>
              <strong>{toCurrency(totalSaldoTitipan)}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Total Saldo Tersedia</span>
              <strong>{toCurrency(totalSaldoTersedia)}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Total Tunggakan</span>
              <strong>{toCurrency(totalTunggakan)}</strong>
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
                  <th>Saldo Terbentuk</th>
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
                    <td className={styles.emptyCell} colSpan={9}>
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
                      <td>{toCurrency(item.saldoTerbentuk)}</td>
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
      </section>
    </OpsShell>
  );
}
