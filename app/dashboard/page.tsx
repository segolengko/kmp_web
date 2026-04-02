import Link from "next/link";
import { OpsShell } from "@/components/ops-shell";
import { getDashboardData } from "@/lib/dashboard-data";
import styles from "./page.module.css";

export default async function DashboardPage() {
  const { stats, activities, alerts } = await getDashboardData();

  return (
    <OpsShell
      actionHref="/login"
      actionLabel="Ganti akun"
      badge="Dashboard Operasional"
      currentPath="/dashboard"
      description="Ringkasan pagi ini menampilkan saldo, aktivitas terbaru, dan fokus tindak lanjut agar tim koperasi bisa bergerak lebih cepat."
      title="Dashboard koperasi yang lebih hidup."
    >
          <div className={styles.stats}>
            {stats.map((item) => (
              <article className={styles.statCard} key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>

          <div className={styles.contentGrid}>
            <section className={styles.sectionCard}>
              <div className={styles.sectionTitle}>
                <h2>Aktivitas Hari Ini</h2>
                <span>Realtime operasional</span>
              </div>
              <div className={styles.activityList}>
                {activities.length === 0 ? (
                  <div className={styles.activityItem}>
                    <div>
                      <b>Belum ada aktivitas</b>
                      <span>Aktivitas operasional akan muncul di sini setelah data terbaca dari Supabase.</span>
                    </div>
                    <div className={styles.activityValue}>-</div>
                  </div>
                ) : (
                  activities.map((activity) => (
                    <div className={styles.activityItem} key={activity.title}>
                      <div>
                        <b>{activity.title}</b>
                        <span>{activity.description}</span>
                      </div>
                      <div className={styles.activityValue}>{activity.value}</div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={styles.sectionCard}>
              <div className={styles.sectionTitle}>
                <h2>Fokus Operator</h2>
                <span>Tindak lanjut prioritas</span>
              </div>
              <div className={styles.alertList}>
                {alerts.map((alert) => (
                  <div
                    className={`${styles.alertItem} ${alert.warning ? styles.warning : ""}`}
                    key={alert.title}
                  >
                    <b>{alert.title}</b>
                    <span>{alert.description}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
    </OpsShell>
  );
}
