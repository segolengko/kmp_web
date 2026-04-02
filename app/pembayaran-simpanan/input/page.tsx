import { OpsShell } from "@/components/ops-shell";
import { PembayaranSimpananPanel } from "@/components/pembayaran-simpanan-panel";
import { getPembayaranSimpananData } from "@/lib/pembayaran-simpanan-data";
import styles from "@/app/anggota/page.module.css";

export default async function PembayaranSimpananInputPage() {
  const data = await getPembayaranSimpananData();

  return (
    <OpsShell
      actionHref="/pembayaran-simpanan/data"
      actionLabel="Ke Page Data"
      badge="Pembayaran Simpanan"
      currentPath="/pembayaran-simpanan/input"
      description="Page input dipakai operator untuk melunasi tagihan simpanan atau mencatat transaksi langsung tanpa bercampur dengan daftar data."
      title="Input Pembayaran"
    >
      <section className={styles.listPanel}>
        <PembayaranSimpananPanel
          anggotaOptions={data.anggotaOptions}
          jenisSimpananOptions={data.jenisSimpananOptions}
          mode="INPUT"
          pembayaranTerbaru={data.pembayaranTerbaru}
          tagihanTerbuka={data.tagihanTerbuka}
          transaksiTerbaru={data.transaksiTerbaru}
        />
      </section>
    </OpsShell>
  );
}
