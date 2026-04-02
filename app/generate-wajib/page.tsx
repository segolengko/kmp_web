import Link from "next/link";
import { GenerateWajibPanel } from "@/components/generate-wajib-panel";
import { OpsShell } from "@/components/ops-shell";
import { getGenerateWajibBatches } from "@/lib/generate-wajib-data";
import styles from "@/app/anggota/page.module.css";

export default async function GenerateWajibPage() {
  const batches = await getGenerateWajibBatches();

  return (
    <OpsShell
      actionHref="/dashboard"
      actionLabel="Ke Dashboard"
      badge="Generate Simpanan Wajib"
      currentPath="/generate-wajib"
      description="Jalankan generate tagihan wajib per periode, lalu pantau hasilnya dari riwayat batch termasuk anggota yang belum punya nominal aktif di periode tersebut."
      title="Batch Tagihan Bulanan"
    >
      <section className={styles.listPanel}>
          <GenerateWajibPanel batches={batches} />
      </section>
    </OpsShell>
  );
}
