import Link from "next/link";
import { MasterDeleteButton } from "@/components/master-delete-button";
import { OpsShell } from "@/components/ops-shell";
import { getMitraPerusahaanData } from "@/lib/tagihan-mitra-data";
import styles from "@/app/anggota/page.module.css";

export default async function TagihanMitraPerusahaanPage() {
  const items = await getMitraPerusahaanData();

  return (
    <OpsShell
      badge="Tagihan"
      currentPath="/tagihan/mitra-perusahaan"
      description="Master mitra eksternal untuk semua project, lengkap dengan identitas perusahaan dan PIC utamanya."
      title="Mitra Perusahaan"
    >
      <section className={styles.listPanel}>
        <div className={styles.listActions}>
          <div className={styles.summaryBadge}>{items.length} mitra perusahaan</div>
          <div className={styles.actionsGroup}>
            <Link className={styles.secondaryAction} href="/tagihan">
              Semua Modul Tagihan
            </Link>
            <Link className={styles.primaryListAction} href="/tagihan/mitra-perusahaan/tambah">
              Tambah Mitra
            </Link>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Perusahaan</th>
                <th>PIC</th>
                <th>Kontak</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={5}>
                    Belum ada mitra perusahaan.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.nameCell}>
                      <strong>{item.namaPerusahaan}</strong>
                      <div className={styles.hint}>{item.npwp || "NPWP belum diisi"}</div>
                    </td>
                    <td>
                      <div>{item.picNama || "-"}</div>
                      <div className={styles.hint}>{item.picJabatan || "Jabatan belum diisi"}</div>
                    </td>
                    <td>
                      <div>{item.picEmail || "-"}</div>
                      <div className={styles.hint}>{item.picHp || "No. HP belum diisi"}</div>
                    </td>
                    <td>
                      <span className={`${styles.statusChip} ${item.aktif ? styles.statusAktif : styles.statusKeluar}`}>
                        {item.aktif ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <Link className={styles.editAction} href={`/tagihan/mitra-perusahaan/${item.id}/edit`}>
                          Edit
                        </Link>
                        <MasterDeleteButton
                          deleteUrl={`/api/tagihan/mitra-perusahaan/${item.id}`}
                          entityLabel="mitra perusahaan"
                          entityName={item.namaPerusahaan}
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
