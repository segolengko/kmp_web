import Link from "next/link";
import { notFound } from "next/navigation";
import { KoperasiLogo } from "@/components/koperasi-logo";
import { AnggotaKeanggotaanPanel } from "@/components/anggota-keanggotaan-panel";
import { getAnggotaByNoAnggota } from "@/lib/anggota-data";
import { getRiwayatKeanggotaan } from "@/lib/keanggotaan-data";
import styles from "@/app/anggota/page.module.css";

type KeanggotaanPageProps = {
  params: Promise<{
    noAnggota: string;
  }>;
};

export default async function KeanggotaanPage({ params }: KeanggotaanPageProps) {
  const { noAnggota } = await params;
  const decodedNoAnggota = decodeURIComponent(noAnggota);
  const anggota = await getAnggotaByNoAnggota(decodedNoAnggota);

  if (!anggota) {
    notFound();
  }

  const riwayat = await getRiwayatKeanggotaan(decodedNoAnggota);

  return (
    <main className={`page-shell ${styles.page}`}>
      <div className="container">
        <section className={styles.listPanel}>
          <div className={styles.topbar}>
            <Link className={styles.back} href="/anggota">
              Kembali ke daftar anggota
            </Link>
          </div>

          <div className={styles.listHeading}>
            <div className={styles.headingBadge}>Manajemen Keanggotaan</div>
            <div className={styles.headingBrand}>
              <KoperasiLogo compact iconOnly />
              <h2>{anggota.namaLengkap}</h2>
            </div>
            <p>
              Halaman ini dipakai untuk mengelola perubahan jenis anggota, perubahan
              status, sampai proses keluar anggota lengkap beserta histori.
            </p>
          </div>

          <AnggotaKeanggotaanPanel anggota={anggota} riwayat={riwayat} />
        </section>
      </div>
    </main>
  );
}
