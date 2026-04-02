import type { ReactNode } from "react";
import Link from "next/link";
import { KoperasiLogo } from "@/components/koperasi-logo";
import styles from "./ops-shell.module.css";

type OpsShellProps = {
  currentPath: string;
  badge?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
};

const anggotaMenuItems = [
  { href: "/anggota", label: "Data Anggota" },
  { href: "/master/jenis-simpanan", label: "Jenis Simpanan" },
  { href: "/master/pengaturan-simpanan", label: "Pengaturan Simpanan" },
  {
    href: "/master/pengaturan-simpanan-anggota",
    label: "Pengaturan Simpanan Anggota",
  },
  { href: "/generate-wajib", label: "Generate Wajib" },
  { href: "/pembayaran-simpanan", label: "Pembayaran" },
  { href: "/penarikan", label: "Penarikan" },
  { href: "/laporan", label: "Laporan Simpanan" },
];

function isCurrentPath(currentPath: string, href: string) {
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function OpsShell({
  currentPath,
  badge,
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: OpsShellProps) {
  return (
    <main className={`page-shell ${styles.page} ${styles.opsPage}`}>
      <div className="container">
        <div className={styles.layout}>
          <aside className={styles.sidebarShell}>
            <div className={styles.sidebar}>
              <div className={styles.logoBlock}>
                <KoperasiLogo compact />
                <div className={styles.logoMeta}>
                  <strong>KMP Workspace</strong>
                  <span>Operasional koperasi yang rapi, cepat, dan siap audit.</span>
                </div>
              </div>

              <nav className={styles.menu}>
                <Link
                  className={isCurrentPath(currentPath, "/dashboard") ? styles.menuActive : styles.menuItem}
                  href="/dashboard"
                >
                  <span className={styles.menuIcon}>DS</span>
                  <span>Dashboard</span>
                </Link>

                <div className={styles.menuSection}>
                  <div className={styles.menuHeading}>
                    <div className={styles.menuLabel}>Unit</div>
                    <span className={styles.comingSoonBadge}>Soon</span>
                  </div>
                  <div className={styles.menuComingSoon}>
                    Pengelolaan unit usaha, cabang, dan struktur organisasi akan masuk di tahap
                    berikutnya.
                  </div>
                </div>

                <div className={styles.menuSection}>
                  <div className={styles.menuHeading}>
                    <div className={styles.menuLabel}>Anggota</div>
                    <span className={styles.liveBadge}>Live</span>
                  </div>
                  <div className={styles.subMenu}>
                    {anggotaMenuItems.map((item, index) => {
                      const active = isCurrentPath(currentPath, item.href);

                      return (
                        <Link
                          className={active ? styles.subMenuItemActive : styles.subMenuItem}
                          href={item.href}
                          key={item.href}
                        >
                          <span className={styles.subMenuAccent}>
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.menuSection}>
                  <div className={styles.menuHeading}>
                    <div className={styles.menuLabel}>Finance</div>
                    <span className={styles.comingSoonBadge}>Soon</span>
                  </div>
                  <div className={styles.menuComingSoon}>
                    Cashflow, kas bank, dan kontrol saldo likuid akan dikembangkan setelah modul
                    simpanan stabil.
                  </div>
                </div>

                <div className={styles.menuSection}>
                  <div className={styles.menuHeading}>
                    <div className={styles.menuLabel}>Tagihan</div>
                    <span className={styles.comingSoonBadge}>Soon</span>
                  </div>
                  <div className={styles.menuComingSoon}>
                    Tagihan lintas modul akan dipisah agar penagihan dan monitoring jatuh tempo
                    lebih fokus.
                  </div>
                </div>

                <div className={styles.menuSection}>
                  <div className={styles.menuHeading}>
                    <div className={styles.menuLabel}>Accounting</div>
                    <span className={styles.comingSoonBadge}>Soon</span>
                  </div>
                  <div className={styles.menuComingSoon}>
                    Jurnal, buku besar, dan posting akuntansi akan diposisikan sebagai tahap integrasi
                    berikutnya.
                  </div>
                </div>
              </nav>

              <div className={styles.quickActions}>
                <div className={styles.quickActionsTitle}>Quick Actions</div>
                <div className={styles.quickActionGrid}>
                  <Link className={styles.quickActionPrimary} href="/anggota/tambah">
                    Tambah Anggota
                  </Link>
                  <Link className={styles.quickActionSecondary} href="/generate-wajib">
                    Generate Wajib
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          <section className={styles.mainPanel}>
            <div className={styles.pageHeader}>
              <div className={styles.pageHeaderContent}>
                {badge ? <div className={styles.pageHeaderBadge}>{badge}</div> : null}
                <div className={styles.pageHeaderTitleRow}>
                  <KoperasiLogo compact iconOnly />
                  <h1>{title}</h1>
                </div>
                <p>{description}</p>
              </div>
              {actionHref && actionLabel ? (
                <Link className={styles.pageHeaderAction} href={actionHref}>
                  {actionLabel}
                </Link>
              ) : null}
            </div>

            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
