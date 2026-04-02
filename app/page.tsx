import Link from "next/link";
import { KoperasiLogo } from "@/components/koperasi-logo";
import { LoginForm } from "@/components/login-form";
import styles from "./page.module.css";

const modules = [
  {
    code: "AG",
    title: "Data Anggota",
    description: "Kelola profil, status anggota, dan histori dasar tanpa pindah-pindah layar.",
  },
  {
    code: "SW",
    title: "Generate Wajib",
    description: "Bentuk tagihan simpanan wajib per periode dengan pola yang konsisten.",
  },
  {
    code: "BY",
    title: "Pembayaran",
    description: "Catat pelunasan, titipan, dan koreksi pembayaran dalam alur operasional yang rapi.",
  },
  {
    code: "PN",
    title: "Penarikan",
    description: "Proses draft, approval, dan realisasi penarikan dari page data yang terpisah.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Siapkan Master",
    description: "Jenis simpanan, pengaturan simpanan, dan pengaturan per anggota menjadi fondasi data.",
  },
  {
    step: "02",
    title: "Jalankan Operasional",
    description: "Generate wajib, terima pembayaran, lalu tindak lanjuti penarikan secara bertahap.",
  },
  {
    step: "03",
    title: "Pantau Posisi",
    description: "Tunggakan, saldo simpanan, dan laporan bisa dipakai untuk kontrol harian pengurus.",
  },
];

const stats = [
  { label: "Modul Inti", value: "Anggota, Wajib, Bayar, Tarik" },
  { label: "Mode Kerja", value: "Input dan Data Dipisah" },
  { label: "Fokus", value: "Operasional Harian Koperasi" },
];

export default function Home() {
  return (
    <main className="page-shell">
      <section className={styles.hero}>
        <div className={`container ${styles.topbar}`}>
          <div className={styles.brand}>
            <KoperasiLogo />
            <div className={styles.brandText}>
              <strong>KMP Workspace</strong>
              <span>Portal operasional koperasi untuk admin harian</span>
            </div>
          </div>

          <div className={styles.topActions}>
            <Link className={styles.ghostButton} href="/dashboard">
              Dashboard
            </Link>
            <Link className={styles.primaryButton} href="/login">
              Login
            </Link>
          </div>
        </div>

        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.copy}>
            <div className={styles.heroBadgeRow}>
              <span className={styles.eyebrow}>Sistem Koperasi Karyawan</span>
              <span className={styles.livePill}>Siap dipakai untuk flow operasional</span>
            </div>

            <p className={styles.lead}>
              Halaman depan ini kami arahkan untuk operator yang ingin langsung paham:
              di mana mengelola anggota, kapan generate simpanan wajib, bagaimana mencatat
              pembayaran, dan bagaimana memantau saldo serta tunggakan dalam satu produk yang
              konsisten.
            </p>

            <div className={styles.ctaRow}>
              <Link className={styles.primaryButton} href="/login">
                Masuk ke Sistem
              </Link>
              <Link className={styles.ghostButton} href="/dashboard">
                Lihat Ringkasan
              </Link>
            </div>

            <div className={styles.metricStrip}>
              {stats.map((item) => (
                <article className={styles.metricCard} key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>

            <div className={styles.moduleBoard}>
              <div className={styles.boardHeader}>
                <h2>Modul yang paling sering dipakai</h2>
                <span>Disusun mengikuti alur data: master, operasional, monitoring</span>
              </div>
              <div className={styles.moduleGrid}>
                {modules.map((item) => (
                  <article className={styles.moduleCard} key={item.title}>
                    <div className={styles.moduleCode}>{item.code}</div>
                    <div className={styles.moduleBody}>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.sideStack}>
            <LoginForm />
            <div className={styles.snapshotCard}>
              <div className={styles.snapshotHeader}>
                <h2>Alur Harian Admin</h2>
                <span>Ringkas, padat, dan mudah diikuti</span>
              </div>
              <div className={styles.timeline}>
                {workflow.map((item) => (
                  <article className={styles.timelineItem} key={item.step}>
                    <div className={styles.timelineStep}>{item.step}</div>
                    <div className={styles.timelineBody}>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.storySection}>
        <div className="container">
          <div className={styles.storyHeader}>
            <div>
              <span className={styles.sectionLabel}>Kenapa Halaman Ini Diubah</span>
              <h2>Biar sejak halaman pertama, produknya sudah terasa serius dan operasional.</h2>
            </div>
            <p>
              Fokusnya bukan landing page marketing biasa, melainkan pintu masuk yang menjelaskan
              bentuk kerja aplikasi: admin tahu apa yang harus dilakukan, dan pengurus merasa data
              keuangan ditangani dengan disiplin.
            </p>
          </div>

          <div className={styles.storyGrid}>
            <article className={styles.storyCard}>
              <span className={styles.storyAccent}>Input</span>
              <strong>Form dibuat fokus ke aksi</strong>
              <p>
                Halaman input dipakai untuk memasukkan transaksi baru tanpa kebisingan daftar data
                di bawahnya.
              </p>
            </article>
            <article className={styles.storyCard}>
              <span className={styles.storyAccent}>Data</span>
              <strong>List dipakai untuk kontrol dan koreksi</strong>
              <p>
                Page data menampung pencarian, paginasi, status transaksi, dan alur pembatalan
                yang lebih aman.
              </p>
            </article>
            <article className={styles.storyCard}>
              <span className={styles.storyAccent}>Kontrol</span>
              <strong>Laporan tetap dekat dengan operasional</strong>
              <p>
                Setelah transaksi berjalan, admin tinggal memantau tunggakan, saldo, dan posisi
                anggota dari modul monitoring.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
