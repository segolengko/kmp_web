import Link from "next/link";
import { MasterDeleteButton } from "@/components/master-delete-button";
import { OpsShell } from "@/components/ops-shell";
import { getUnitBisnisData } from "@/lib/tagihan-unit-data";
import styles from "@/app/anggota/page.module.css";

export default async function TagihanUnitBisnisPage() {
  const items = await getUnitBisnisData();

  return (
    <OpsShell
      badge="Tagihan"
      currentPath="/tagihan/unit-bisnis"
      description="Kelola unit internal yang akan memakai modul tagihan project dengan pola dokumen yang sama."
      title="Unit Bisnis"
    >
      <section className={styles.listPanel}>
        <div className={styles.listActions}>
          <div className={styles.summaryBadge}>{items.length} unit bisnis</div>
          <div className={styles.actionsGroup}>
            <Link className={styles.secondaryAction} href="/tagihan">
              Semua Modul Tagihan
            </Link>
            <Link className={styles.primaryListAction} href="/tagihan/unit-bisnis/tambah">
              Tambah Unit
            </Link>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Unit</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={4}>
                    Belum ada unit bisnis untuk modul tagihan.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.kodeUnit}</td>
                    <td className={styles.nameCell}>{item.namaUnit}</td>
                    <td>
                      <span className={`${styles.statusChip} ${item.aktif ? styles.statusAktif : styles.statusKeluar}`}>
                        {item.aktif ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <Link className={styles.editAction} href={`/tagihan/unit-bisnis/${item.id}/edit`}>
                          Edit
                        </Link>
                        <MasterDeleteButton
                          deleteUrl={`/api/tagihan/unit-bisnis/${item.id}`}
                          entityLabel="unit bisnis"
                          entityName={item.namaUnit}
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
