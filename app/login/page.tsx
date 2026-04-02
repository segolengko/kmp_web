import Link from "next/link";
import { redirect } from "next/navigation";
import { KoperasiLogo } from "@/components/koperasi-logo";
import { LoginForm } from "@/components/login-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const destination =
        params.next && params.next.startsWith("/") ? params.next : "/dashboard";
      redirect(destination);
    }
  }

  return (
    <main className={`page-shell ${styles.loginPage}`}>
      <div className={`container ${styles.loginGrid}`}>
        <section className={styles.panel}>
          <KoperasiLogo />
          <Link className={styles.back} href="/">
            Kembali ke beranda
          </Link>
          <h1>Masuk dan lanjutkan operasional koperasi dengan alur yang aman.</h1>
          <p>
            Login sudah terhubung ke Supabase Auth untuk admin, operator, dan
            petugas koperasi. Setelah berhasil masuk, sistem akan mengarahkan
            Anda kembali ke halaman kerja yang tadi dituju.
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

        <LoginForm redirectTo={params.next} />
      </div>
    </main>
  );
}
