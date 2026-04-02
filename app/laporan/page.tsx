import Link from "next/link";
import { DarkSelect } from "@/components/dark-select";
import { OpsShell } from "@/components/ops-shell";
import { getLaporanSimpananData } from "@/lib/laporan-data";
import styles from "@/app/anggota/page.module.css";

function toCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type LaporanPageProps = {
  searchParams?: Promise<{
    tahun?: string;
    departemen?: string;
  }>;
};

export default async function LaporanPage({ searchParams }: LaporanPageProps) {
  const currentYear = new Date().getFullYear();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedYear = Number(resolvedSearchParams?.tahun);
  const selectedDepartemen = resolvedSearchParams?.departemen?.trim() ?? "";
  const laporanYear =
    Number.isInteger(selectedYear) && selectedYear >= 2000 && selectedYear <= 2100
      ? selectedYear
      : currentYear;
  const {
    annualItems,
    departemenOptions,
  } = await getLaporanSimpananData(laporanYear);
  const filteredAnnualItems =
    selectedDepartemen.length > 0
      ? annualItems.filter((item) => item.departemen === selectedDepartemen)
      : annualItems;

  const totalTahunanPokok = filteredAnnualItems.reduce((total, item) => total + item.simpananPokok, 0);
  const totalTahunanWajib = filteredAnnualItems.reduce(
    (total, item) => total + item.wajibBulanan.reduce((subtotal, value) => subtotal + value, 0),
    0,
  );
  const totalTahunanIuran = filteredAnnualItems.reduce((total, item) => total + item.total, 0);
  const totalTahunanBulanan = Array.from({ length: 12 }, (_, monthIndex) =>
    filteredAnnualItems.reduce((total, item) => total + (item.wajibBulanan[monthIndex] ?? 0), 0),
  );

  return (
    <OpsShell
      actionHref="/dashboard"
      actionLabel="Ke Dashboard"
      badge="Laporan Simpanan"
      currentPath="/laporan"
      description="Modul ini merangkum saldo simpanan anggota, total tunggakan aktif, dan daftar detail tagihan wajib yang belum lunas."
      title="Laporan Simpanan"
    >
      <section className={styles.listPanel}>
        <section className={styles.managementCard}>
          <div className={styles.listActions}>
            <div className={styles.summaryGroup}>
              <div className={styles.summaryBadge}>Laporan Tahunan</div>
            </div>
            <div className={styles.actionsGroup}>
              <Link className={styles.secondaryAction} href="/laporan/saldo-simpanan">
                Posisi Saldo Anggota
              </Link>
              <Link className={styles.secondaryAction} href="/tagihan/tunggakan">
                Tunggakan Wajib
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.managementCard}>
          <div className={styles.sectionHeader}>
              <h2>Laporan SP + SW Tahunan</h2>
              <span>Realisasi simpanan pokok dan wajib per anggota untuk tahun {laporanYear}</span>
          </div>
          <form className={styles.filterBarCompact}>
            <div className={styles.field}>
              <label htmlFor="laporan-tahun">Tahun Laporan</label>
              <input id="laporan-tahun" name="tahun" defaultValue={laporanYear} type="number" />
            </div>
            <div className={styles.field}>
              <label htmlFor="laporan-departemen">Departemen</label>
              <DarkSelect
                id="laporan-departemen"
                name="departemen"
                options={[
                  { label: "Semua departemen", value: "" },
                  ...departemenOptions.map((option) => ({
                    label: option,
                    value: option,
                  })),
                ]}
                value={selectedDepartemen}
              />
            </div>
            <div className={styles.filterActions}>
              <button className={styles.primaryListAction} type="submit">
                Terapkan Filter
              </button>
            </div>
            <div className={styles.compactFilterInfo}>
              <span>
                Kolom bulanan memakai realisasi pembayaran `SW` per periode, sedangkan `Simpanan
                Pokok` memakai realisasi `SP` di tahun yang sama.
                {selectedDepartemen ? ` Filter aktif: ${selectedDepartemen}.` : ""}
              </span>
            </div>
          </form>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Dept</th>
                  <th>No. Anggota</th>
                  <th>Nama</th>
                  <th>Simpanan Pokok</th>
                  <th>Jan</th>
                  <th>Feb</th>
                  <th>Mar</th>
                  <th>Apr</th>
                  <th>Mei</th>
                  <th>Jun</th>
                  <th>Jul</th>
                  <th>Agu</th>
                  <th>Sep</th>
                  <th>Okt</th>
                  <th>Nov</th>
                  <th>Des</th>
                  <th>Jumlah Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnnualItems.length === 0 ? (
                  <tr>
                    <td className={styles.emptyCell} colSpan={17}>
                      Belum ada realisasi simpanan pokok dan wajib untuk tahun {laporanYear}
                      {selectedDepartemen ? ` pada departemen ${selectedDepartemen}` : ""}.
                    </td>
                  </tr>
                ) : (
                  filteredAnnualItems.map((item) => (
                    <tr key={item.anggotaId}>
                      <td>{item.departemen}</td>
                      <td>
                        <Link
                          className={styles.secondaryInlineAction}
                          href={`/laporan/${encodeURIComponent(item.noAnggota)}`}
                        >
                          {item.noAnggota}
                        </Link>
                      </td>
                      <td className={styles.nameCell}>
                        <Link
                          className={styles.editAction}
                          href={`/laporan/${encodeURIComponent(item.noAnggota)}`}
                        >
                          {item.namaLengkap}
                        </Link>
                      </td>
                      <td>{toCurrency(item.simpananPokok)}</td>
                      {item.wajibBulanan.map((value, index) => (
                        <td key={`${item.anggotaId}-${index}`}>{toCurrency(value)}</td>
                      ))}
                      <td>{toCurrency(item.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredAnnualItems.length > 0 ? (
                <tfoot>
                  <tr className="border-t border-white/10 bg-[rgba(255,255,255,0.045)]">
                    <td className={styles.nameCell} colSpan={3}>
                      Total
                    </td>
                    <td className={styles.nameCell}>{toCurrency(totalTahunanPokok)}</td>
                    {totalTahunanBulanan.map((value, index) => (
                      <td className={styles.nameCell} key={`total-bulan-${index}`}>
                        {toCurrency(value)}
                      </td>
                    ))}
                    <td className={styles.nameCell}>{toCurrency(totalTahunanIuran)}</td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
          <div className={styles.resultSummary}>
            <div className={styles.summaryTile}>
              <span>Baris Laporan</span>
              <strong>{filteredAnnualItems.length}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Total Simpanan Pokok</span>
              <strong>{toCurrency(totalTahunanPokok)}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Total Simpanan Wajib</span>
              <strong>{toCurrency(totalTahunanWajib)}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Total Keseluruhan</span>
              <strong>{toCurrency(totalTahunanIuran)}</strong>
            </div>
          </div>
        </section>

      </section>
    </OpsShell>
  );
}
