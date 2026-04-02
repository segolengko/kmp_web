import Link from "next/link";
import { KoperasiLogo } from "@/components/koperasi-logo";
import { LoginForm } from "@/components/login-form";
import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <main className={`page-shell ${styles.loginPage}`}>
      <div className={`container ${styles.loginGrid}`}>
        <section className={styles.panel}>
          <KoperasiLogo />
          <Link className={styles.back} href="/">
            Kembali ke beranda
          </Link>
          <h1>Masuk dan lanjutkan operasional koperasi tanpa ribet.</h1>
          <p>
            Halaman login ini disiapkan sebagai pintu masuk admin, operator,
            dan petugas koperasi. Nanti bisa dihubungkan ke Supabase Auth atau
            role internal sesuai kebutuhan sistem Anda.
          </p>

          <div className={styles.steps}>
            <div className={styles.step}>
              <strong>1. Login admin/operator</strong>
              <span>Masuk dengan email internal atau nomor anggota.</span>
            </div>
            <div className={styles.step}>
              <strong>2. Pantau dashboard utama</strong>
              <span>Lihat tunggakan, tagihan aktif, dan saldo penting hari ini.</span>
            </div>
            <div className={styles.step}>
              <strong>3. Jalankan transaksi</strong>
              <span>Generate wajib, catat pembayaran, dan cek laporan anggota.</span>
            </div>
          </div>
        </section>

        <LoginForm />
      </div>
    </main>
  );
}
