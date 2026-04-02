import Link from "next/link";
import { OpsShell } from "@/components/ops-shell";
import styles from "@/app/anggota/page.module.css";

const masterCards = [
  {
    href: "/master/jenis-simpanan",
    title: "Jenis Simpanan",
    description:
      "Atur kategori, model pencatatan, frekuensi, dan sifat dasar tiap jenis simpanan.",
  },
  {
    href: "/master/pengaturan-simpanan",
    title: "Pengaturan Simpanan",
    description:
      "Kelola nominal dan periode berlaku master simpanan umum yang jadi acuan operasional.",
  },
  {
    href: "/master/pengaturan-simpanan-anggota",
    title: "Pengaturan Simpanan Anggota",
    description:
      "Simpan nominal wajib variabel per anggota berikut masa berlaku dan histori pengaturannya.",
  },
];

export default function MasterPage() {
  return (
    <OpsShell
      actionHref="/dashboard"
      actionLabel="Ke Dashboard"
      badge="Master Data"
      currentPath="/master"
      description="Semua tabel referensi inti dikelola di sini supaya generate, pembayaran, dan laporan tetap konsisten dari satu sumber data yang rapi."
      title="Pusat Master Koperasi"
    >
      <section className={styles.listPanel}>
          <div className={styles.managementStack}>
            {masterCards.map((card) => (
              <article className={styles.managementCard} key={card.href}>
                <div className={styles.sectionHeader}>
                  <h2>{card.title}</h2>
                  <Link className={styles.saveButton} href={card.href}>
                    Buka Modul
                  </Link>
                </div>
                <p className={styles.hint}>{card.description}</p>
              </article>
            ))}
          </div>
      </section>
    </OpsShell>
  );
}
