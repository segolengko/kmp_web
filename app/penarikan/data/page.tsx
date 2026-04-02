import { OpsShell } from "@/components/ops-shell";
import { PenarikanSimpananPanel } from "@/components/penarikan-simpanan-panel";
import { getPenarikanSimpananData } from "@/lib/penarikan-data";
import styles from "@/app/anggota/page.module.css";

export default async function PenarikanDataPage() {
  const { penarikan, anggotaOptions, saldoOptions } = await getPenarikanSimpananData();

  return (
    <OpsShell
      actionHref="/penarikan/input"
      actionLabel="Ke Input"
      badge="Penarikan Simpanan"
      currentPath="/penarikan/data"
      description="Page data dipakai untuk melihat ringkasan penarikan, lalu memproses approval, penolakan, pembatalan, dan realisasi."
      title="Data Penarikan"
    >
      <section className={styles.listPanel}>
        <PenarikanSimpananPanel
          anggotaOptions={anggotaOptions}
          mode="DATA"
          penarikan={penarikan}
          saldoOptions={saldoOptions}
        />
      </section>
    </OpsShell>
  );
}
