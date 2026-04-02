import { OpsShell } from "@/components/ops-shell";
import { PembayaranSimpananPanel } from "@/components/pembayaran-simpanan-panel";
import { getPembayaranSimpananData } from "@/lib/pembayaran-simpanan-data";
import styles from "@/app/anggota/page.module.css";

export default async function PembayaranSimpananDataPage() {
  const data = await getPembayaranSimpananData();

  return (
    <OpsShell
      actionHref="/pembayaran-simpanan/input"
      actionLabel="Ke Page Input"
      badge="Pembayaran Simpanan"
      currentPath="/pembayaran-simpanan/data"
      description="Page data dipakai operator untuk menelusuri tagihan, riwayat pembayaran, seluruh transaksi, serta membatalkan pembayaran manual yang salah input."
      title="Data Pembayaran"
    >
      <section className={styles.listPanel}>
        <PembayaranSimpananPanel
          anggotaOptions={data.anggotaOptions}
          jenisSimpananOptions={data.jenisSimpananOptions}
          mode="DATA"
          pembayaranTerbaru={data.pembayaranTerbaru}
          tagihanTerbuka={data.tagihanTerbuka}
          transaksiTerbaru={data.transaksiTerbaru}
        />
      </section>
    </OpsShell>
  );
}
