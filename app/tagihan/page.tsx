import Link from "next/link";
import { OpsShell } from "@/components/ops-shell";
import styles from "@/app/anggota/page.module.css";

const tagihanCards = [
  {
    href: "/tagihan/unit-bisnis",
    title: "Unit Bisnis",
    description: "Master unit internal seperti Dagum, Mining, atau unit lain yang memakai proses tagihan yang sama.",
  },
  {
    href: "/tagihan/mitra-perusahaan",
    title: "Mitra Perusahaan",
    description: "Daftar PT pemberi kerja berikut PIC yang nanti dipakai di SR, penawaran, dan monitoring.",
  },
  {
    href: "/tagihan/sr",
    title: "Referensi SR",
    description: "Catat nomor SR dari mitra sebagai pintu awal pembuatan penawaran dan dokumen proyek.",
  },
  {
    href: "/tagihan/penawaran",
    title: "Penawaran",
    description: "Input dokumen penawaran sekali, lengkap dengan item pekerjaan dan nilai, agar bisa diturunkan ke dokumen lain.",
  },
];

export default function TagihanPage() {
  return (
    <OpsShell
      badge="Tagihan Project"
      currentPath="/tagihan"
      description="Modul ini dipakai untuk alur SR, penawaran, dan penagihan project ke mitra eksternal tanpa bercampur dengan simpanan."
      title="Workspace Tagihan"
    >
      <section className={styles.listPanel}>
        <div className={styles.managementStack}>
          {tagihanCards.map((card) => (
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
