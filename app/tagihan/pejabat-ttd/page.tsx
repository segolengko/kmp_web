import Link from "next/link";
import { MasterDeleteButton } from "@/components/master-delete-button";
import { OpsShell } from "@/components/ops-shell";
import { getPejabatTTDData } from "@/lib/tagihan-pejabat-ttd-data";
import styles from "@/app/anggota/page.module.css";

export default async function TagihanPejabatTTDPage() {
  const items = await getPejabatTTDData();

  return (
    <OpsShell
      badge="Tagihan"
      currentPath="/tagihan/pejabat-ttd"
      description="Kelola pejabat penandatangan yang sering dipakai agar blok tanda tangan di penawaran tidak perlu diisi ulang."
      title="Pejabat TTD"
    >
      <section className={styles.listPanel}>
        <div className={styles.listActions}>
          <div className={styles.summaryBadge}>{items.length} pejabat</div>
          <div className={styles.actionsGroup}>
            <Link className={styles.secondaryAction} href="/tagihan">
              Semua Modul Tagihan
            </Link>
            <Link className={styles.primaryListAction} href="/tagihan/pejabat-ttd/tambah">
              Tambah Pejabat
            </Link>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Unit</th>
                <th>Mitra</th>
                <th>Modul</th>
                <th>Nama Pejabat</th>
                <th>Jabatan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={7}>
                    Belum ada pejabat tanda tangan.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.unitBisnisNama}</td>
                    <td>{item.mitraPerusahaanNama}</td>
                    <td>{item.modul || "-"}</td>
                    <td className={styles.nameCell}>{item.namaPejabat}</td>
                    <td>{item.jabatanPejabat}</td>
                    <td>
                      <span className={`${styles.statusChip} ${item.aktif ? styles.statusAktif : styles.statusKeluar}`}>
                        {item.aktif ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <Link className={styles.editAction} href={`/tagihan/pejabat-ttd/${item.id}/edit`}>
                          Edit
                        </Link>
                        <MasterDeleteButton
                          deleteUrl={`/api/tagihan/pejabat-ttd/${item.id}`}
                          entityLabel="pejabat tanda tangan"
                          entityName={item.namaPejabat}
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
