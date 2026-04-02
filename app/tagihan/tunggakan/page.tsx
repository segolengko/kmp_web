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

export default async function TunggakanWajibPage() {
  const { tunggakanItems } = await getLaporanSimpananData();
  const totalTunggakan = tunggakanItems.reduce((total, item) => total + item.sisaTunggakan, 0);
  const totalAnggotaMenunggak = new Set(tunggakanItems.map((item) => item.noAnggota)).size;

  return (
    <OpsShell
      actionHref="/laporan"
      actionLabel="Ke Laporan"
      badge="Tagihan"
      currentPath="/tagihan/tunggakan"
      description="Monitoring tunggakan wajib dipisah dari laporan utama supaya follow up operasional lebih fokus."
      title="Tunggakan Wajib"
    >
      <section className={styles.listPanel}>
        <section className={styles.managementCard}>
          <div className={styles.listActions}>
            <div className={styles.summaryGroup}>
              <div className={styles.summaryBadge}>Monitoring Tunggakan</div>
            </div>
            <div className={styles.actionsGroup}>
              <Link className={styles.secondaryAction} href="/laporan">
                Laporan Tahunan
              </Link>
              <Link className={styles.secondaryAction} href="/laporan/saldo-simpanan">
                Posisi Saldo Anggota
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.managementCard}>
          <div className={styles.sectionHeader}>
            <h2>Daftar Tunggakan Wajib</h2>
            <span>Prioritas follow up tagihan wajib yang belum lunas</span>
          </div>
          <div className={styles.resultSummary}>
            <div className={styles.summaryTile}>
              <span>Total Tunggakan</span>
              <strong>{toCurrency(totalTunggakan)}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Anggota Menunggak</span>
              <strong>{totalAnggotaMenunggak}</strong>
            </div>
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
