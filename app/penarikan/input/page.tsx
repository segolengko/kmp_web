import { OpsShell } from "@/components/ops-shell";
import { PenarikanSimpananPanel } from "@/components/penarikan-simpanan-panel";
import { getPenarikanSimpananData } from "@/lib/penarikan-data";
import styles from "@/app/anggota/page.module.css";

export default async function PenarikanInputPage() {
  const { penarikan, anggotaOptions, saldoOptions } = await getPenarikanSimpananData();

  return (
    <OpsShell
      actionHref="/penarikan/data"
      actionLabel="Ke Data"
      badge="Penarikan Simpanan"
      currentPath="/penarikan/input"
      description="Page input dipakai untuk membuat draft penarikan baru tanpa bercampur dengan daftar approval dan realisasi."
      title="Input Penarikan"
    >
      <section className={styles.listPanel}>
        <PenarikanSimpananPanel
          anggotaOptions={anggotaOptions}
          mode="INPUT"
          penarikan={penarikan}
          saldoOptions={saldoOptions}
        />
      </section>
    </OpsShell>
  );
}
