import { OpsShell } from "@/components/ops-shell";
import { PembayaranSimpananPanel } from "@/components/pembayaran-simpanan-panel";
import { getPembayaranSimpananData } from "@/lib/pembayaran-simpanan-data";
import styles from "@/app/anggota/page.module.css";

export default async function PembayaranSimpananPage() {
  const data = await getPembayaranSimpananData();

  return (
    <OpsShell
      actionHref="/dashboard"
      actionLabel="Ke Dashboard"
      badge="Pembayaran Simpanan"
      currentPath="/pembayaran-simpanan"
      description="Halaman ini dipakai operator untuk melunasi tagihan simpanan atau mencatat transaksi langsung seperti setor dan tarik simpanan sukarela."
      title="Pembayaran & Transaksi"
    >
      <section className={styles.listPanel}>
          <PembayaranSimpananPanel
            anggotaOptions={data.anggotaOptions}
            jenisSimpananOptions={data.jenisSimpananOptions}
            tagihanTerbuka={data.tagihanTerbuka}
            transaksiTerbaru={data.transaksiTerbaru}
          />
      </section>
    </OpsShell>
  );
}
