import Link from "next/link";
import { MasterDeleteButton } from "@/components/master-delete-button";
import { OpsShell } from "@/components/ops-shell";
import { getPenawaranProjectData } from "@/lib/tagihan-penawaran-data";
import styles from "@/app/anggota/page.module.css";

export default async function PenawaranProjectPage() {
  const items = await getPenawaranProjectData();

  return (
    <OpsShell
      badge="Tagihan"
      currentPath="/tagihan/penawaran"
      description="Kelola penawaran project berdasarkan SR, lengkap dengan item harga yang nanti menjadi basis dokumen tagihan."
      title="Penawaran"
    >
      <section className={styles.listPanel}>
        <div className={styles.listActions}>
          <div className={styles.summaryBadge}>{items.length} penawaran</div>
          <div className={styles.actionsGroup}>
            <Link className={styles.secondaryAction} href="/tagihan">
              Semua Modul Tagihan
            </Link>
            <Link className={styles.primaryListAction} href="/tagihan/penawaran/tambah">
              Tambah Penawaran
            </Link>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No. Penawaran</th>
                <th>Tanggal</th>
                <th>No. SR</th>
                <th>Mitra</th>
                <th>Total</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={7}>
                    Belum ada penawaran project.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.nameCell}>
                      <strong>{item.noPenawaran}</strong>
                      <div className={styles.hint}>{item.perihal}</div>
                    </td>
                    <td>{new Date(item.tanggalPenawaran).toLocaleDateString("id-ID")}</td>
                    <td>{item.noSr}</td>
                    <td>
                      <div>{item.mitraPerusahaanNama}</div>
                      <div className={styles.hint}>{item.unitBisnisNama}</div>
                    </td>
                    <td>Rp {item.nilaiTotal.toLocaleString("id-ID")}</td>
                    <td>
                      <span className={styles.statusChip}>{item.statusPenawaran}</span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <Link
                          className={styles.secondaryInlineAction}
                          href={`/tagihan/penawaran/${item.id}/cetak`}
                          target="_blank"
                        >
                          Cetak
                        </Link>
                        <Link className={styles.editAction} href={`/tagihan/penawaran/${item.id}/edit`}>
                          Edit
                        </Link>
                        <MasterDeleteButton
                          deleteUrl={`/api/tagihan/penawaran/${item.id}`}
                          entityLabel="penawaran"
                          entityName={item.noPenawaran}
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
