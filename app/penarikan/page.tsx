import { OpsShell } from "@/components/ops-shell";
import { PenarikanSimpananPanel } from "@/components/penarikan-simpanan-panel";
import { getPenarikanSimpananData } from "@/lib/penarikan-data";
import styles from "@/app/anggota/page.module.css";

export default async function PenarikanPage() {
  const penarikan = await getPenarikanSimpananData();

  return (
    <OpsShell
      actionHref="/dashboard"
      actionLabel="Ke Dashboard"
      badge="Penarikan Simpanan"
      currentPath="/penarikan"
      description="Modul ini dipakai untuk menindaklanjuti draft penarikan simpanan, terutama setelah anggota keluar atau saat ada permintaan pengembalian yang sudah disetujui pengurus."
      title="Approval & Realisasi"
    >
      <section className={styles.listPanel}>
          <PenarikanSimpananPanel penarikan={penarikan} />
      </section>
    </OpsShell>
  );
}
