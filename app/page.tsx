import Link from "next/link";
import { KoperasiLogo } from "@/components/koperasi-logo";
import { LoginForm } from "@/components/login-form";
import styles from "./page.module.css";

const features = [
  {
    title: "Data Anggota Lebih Rapi",
    description:
      "Profil anggota, jenis anggota, status aktif, dan jejak simpanan tampil dalam satu alur kerja yang bersih.",
    icon: "A",
  },
  {
    title: "Generate Simpanan Wajib Sekali Klik",
    description:
      "Tagihan bulanan untuk anggota aktif maupun pasif lebih mudah dikelola tanpa pencatatan manual yang melelahkan.",
    icon: "W",
  },
  {
    title: "Laporan Tunggakan Cepat Dibaca",
    description:
      "Operator bisa langsung tahu anggota mana yang tertib, mana yang menunggak, dan berapa saldo yang harus dipantau.",
    icon: "L",
  },
];

export default function Home() {
  return (
    <main className="page-shell">
      <section className={styles.hero}>
        <div className={`container ${styles.topbar}`}>
          <div className={styles.brand}>
            <KoperasiLogo />
          </div>

          <div className={styles.topActions}>
            <Link className={styles.ghostButton} href="/dashboard">
              Lihat Dashboard
            </Link>
            <Link className={styles.primaryButton} href="/login">
              Form Login
            </Link>
          </div>
        </div>

        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.copy}>
            <span className={styles.eyebrow}>Fresh, ringan, dan siap dipakai</span>
            <h1>Sistem koperasi yang terasa modern sejak halaman pertama.</h1>
            <p>
              Web app ini dirancang untuk kebutuhan koperasi karyawan: anggota,
              tagihan simpanan, pembayaran, saldo, dan tunggakan. Fokusnya bukan
              cuma rapi di data, tapi juga nyaman dipakai operator setiap hari.
            </p>

            <div className={styles.ctaRow}>
              <Link className={styles.primaryButton} href="/login">
                Mulai dari Login
              </Link>
              <Link className={styles.ghostButton} href="/dashboard">
                Preview Dashboard
              </Link>
            </div>

            <div className={styles.metricStrip}>
              <div className={styles.metricCard}>
                <span>Jenis Simpanan</span>
                <strong>4</strong>
              </div>
              <div className={styles.metricCard}>
                <span>Alur Inti Siap</span>
                <strong>6+</strong>
              </div>
              <div className={styles.metricCard}>
                <span>Target Pengguna</span>
                <strong>Web + Mobile</strong>
              </div>
            </div>
          </div>

          <LoginForm />
        </div>
      </section>

      <section className={styles.featureSection}>
        <div className="container">
          <div className={styles.featureHeader}>
            <div>
              <h2>Dirancang untuk operasional yang sibuk.</h2>
            </div>
            <p>
              Tampilan sengaja dibuat hangat dan tegas supaya data keuangan tidak
              terasa kaku, tapi tetap profesional untuk admin koperasi.
            </p>
          </div>

          <div className={styles.featureGrid}>
            {features.map((feature) => (
              <article className={styles.featureCard} key={feature.title}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <b>{feature.title}</b>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
