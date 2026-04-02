import Link from "next/link";
import { MasterDeleteButton } from "@/components/master-delete-button";
import { OpsShell } from "@/components/ops-shell";
import { getReferensiSRData } from "@/lib/tagihan-sr-data";
import styles from "@/app/anggota/page.module.css";

export default async function ReferensiSRPage() {
  const items = await getReferensiSRData();

  return (
    <OpsShell
      badge="Tagihan"
      currentPath="/tagihan/sr"
      description="Daftar SR dari mitra yang menjadi basis awal penawaran project per unit bisnis."
      title="Referensi SR"
    >
      <section className={styles.listPanel}>
        <div className={styles.listActions}>
          <div className={styles.summaryBadge}>{items.length} referensi SR</div>
          <div className={styles.actionsGroup}>
            <Link className={styles.secondaryAction} href="/tagihan">
              Semua Modul Tagihan
            </Link>
            <Link className={styles.primaryListAction} href="/tagihan/sr/tambah">
              Tambah SR
            </Link>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No. SR</th>
                <th>Tanggal</th>
                <th>Unit</th>
                <th>Mitra</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={5}>
                    Belum ada referensi SR.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.nameCell}>
                      <strong>{item.noSr}</strong>
                      <div className={styles.hint}>{item.deskripsi || "Deskripsi belum diisi"}</div>
                    </td>
                    <td>{new Date(item.tanggalSr).toLocaleDateString("id-ID")}</td>
                    <td>{item.unitBisnisNama}</td>
                    <td>{item.mitraPerusahaanNama}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <Link className={styles.editAction} href={`/tagihan/sr/${item.id}/edit`}>
                          Edit
                        </Link>
                        <MasterDeleteButton
                          deleteUrl={`/api/tagihan/sr/${item.id}`}
                          entityLabel="referensi SR"
                          entityName={item.noSr}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </OpsShell>
  );
}
