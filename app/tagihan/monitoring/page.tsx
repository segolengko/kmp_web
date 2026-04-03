import { OpsShell } from "@/components/ops-shell";
import { TagihanMonitoringBoard } from "@/components/tagihan-monitoring-board";
import { getTagihanTimelineData } from "@/lib/tagihan-monitoring-data";
import styles from "@/app/anggota/page.module.css";

export default async function TagihanMonitoringPage() {
  const items = await getTagihanTimelineData();

  return (
    <OpsShell
      badge="Tagihan Project"
      currentPath="/tagihan/monitoring"
      description="Pantau alur SR sampai pencairan dalam satu timeline kerja. Klik satu kartu untuk membuka detail proses dan dokumen turunannya."
      title="Monitoring Timeline"
    >
      <section className={styles.listPanel}>
        <div className={styles.listActions}>
          <div className={styles.summaryBadge}>{items.length} alur tagihan</div>
        </div>

        <TagihanMonitoringBoard items={items} />
      </section>
    </OpsShell>
  );
}
