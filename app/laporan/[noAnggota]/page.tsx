import Link from "next/link";
import { OpsShell } from "@/components/ops-shell";
import { getDetailSimpananAnggota } from "@/lib/detail-simpanan-data";
import styles from "@/app/anggota/page.module.css";

function toCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type DetailPageProps = {
  params: Promise<{
    noAnggota: string;
  }>;
};

export default async function DetailSimpananAnggotaPage({ params }: DetailPageProps) {
  const { noAnggota } = await params;
  const detail = await getDetailSimpananAnggota(noAnggota);

  return (
    <OpsShell
      badge="Laporan Simpanan"
      currentPath="/laporan"
      description="Detail saldo, tagihan, dan mutasi simpanan per anggota untuk kebutuhan audit dan penelusuran operasional."
      title={`Detail Simpanan ${detail.anggota?.namaLengkap ?? noAnggota}`}
    >
      <section className={styles.listPanel}>
        <div className={styles.listActions}>
          <div className={styles.summaryGroup}>
            <div className={styles.summaryBadge}>
              {detail.anggota?.noAnggota ?? noAnggota}
            </div>
            {detail.anggota ? (
              <div className={styles.sourceBadge}>
                {detail.anggota.jenisAnggota} / {detail.anggota.statusAnggota}
              </div>
            ) : null}
          </div>
          <div className={styles.actionsGroup}>
            <Link className={styles.secondaryAction} href="/laporan">
              Kembali ke Laporan
            </Link>
          </div>
        </div>

        {detail.anggota ? (
          <section className={styles.managementCard}>
            <div className={styles.sectionHeader}>
              <h2>Profil Anggota</h2>
              <span>Ringkasan identitas singkat</span>
            </div>
            <div className={styles.profileSummary}>
              <div className={styles.summaryTile}>
                <span>Nama</span>
                <strong>{detail.anggota.namaLengkap}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Departemen</span>
                <strong>{detail.anggota.departemen}</strong>
              </div>
              <div className={styles.summaryTile}>
                <span>Jabatan</span>
                <strong>{detail.anggota.jabatan}</strong>
              </div>
            </div>
          </section>
        ) : (
          <section className={styles.managementCard}>
            <div className={styles.mobileEmpty}>
              Data anggota tidak ditemukan atau belum bisa dibaca dari Supabase.
            </div>
          </section>
        )}

        <section className={styles.managementCard}>
          <div className={styles.sectionHeader}>
            <h2>Posisi Saldo Simpanan</h2>
            <span>Saldo per jenis simpanan milik anggota</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Simpanan</th>
                  <th>Saldo Terbentuk</th>
                  <th>Saldo Titipan</th>
                  <th>Saldo Ditahan</th>
                  <th>Saldo Tersedia</th>
                  <th>Total Setor</th>
                  <th>Total Tarik</th>
                  <th>Total Tunggakan</th>
                </tr>
              </thead>
              <tbody>
                {detail.saldoItems.length === 0 ? (
                  <tr>
                    <td className={styles.emptyCell} colSpan={8}>
                      Belum ada saldo simpanan untuk anggota ini.
                    </td>
                  </tr>
                ) : (
                  detail.saldoItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.kodeSimpanan} - {item.namaSimpanan}
                      </td>
                      <td>{toCurrency(item.saldoTerbentuk)}</td>
                      <td>{toCurrency(item.saldoTitipan)}</td>
                      <td>{toCurrency(item.saldoDitahan)}</td>
                      <td>{toCurrency(item.saldoTersedia)}</td>
                      <td>{toCurrency(item.totalSetor)}</td>
                      <td>{toCurrency(item.totalTarik)}</td>
                      <td>{toCurrency(item.totalTunggakan)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.managementCard}>
          <div className={styles.sectionHeader}>
            <h2>Tagihan Simpanan</h2>
            <span>Histori tagihan per periode</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No. Tagihan</th>
                  <th>Simpanan</th>
                  <th>Periode</th>
                  <th>Nominal</th>
                  <th>Terbayar</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {detail.tagihanItems.length === 0 ? (
                  <tr>
                    <td className={styles.emptyCell} colSpan={6}>
                      Belum ada tagihan simpanan untuk anggota ini.
                    </td>
                  </tr>
                ) : (
                  detail.tagihanItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.noTagihan}</td>
                      <td>
                        {item.kodeSimpanan} - {item.namaSimpanan}
                      </td>
                      <td>{item.periodeLabel ?? "-"}</td>
                      <td>{toCurrency(item.nominalTagihan)}</td>
                      <td>{toCurrency(item.nominalTerbayar)}</td>
                      <td>
                        <span
                          className={`${styles.statusChip} ${
                            item.statusTagihan === "LUNAS"
                              ? styles.statusAktif
                              : item.statusTagihan === "SEBAGIAN"
                                ? styles.statusPasif
                                : styles.statusKeluar
                          }`}
                        >
                          {item.statusTagihan}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.managementCard}>
          <div className={styles.sectionHeader}>
            <h2>Mutasi Simpanan</h2>
            <span>Transaksi terbaru anggota ini</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No. Transaksi</th>
                  <th>Tanggal</th>
                  <th>Simpanan</th>
                  <th>Model / Tipe</th>
                  <th>Metode</th>
                  <th>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {detail.transaksiItems.length === 0 ? (
                  <tr>
                    <td className={styles.emptyCell} colSpan={6}>
                      Belum ada mutasi simpanan untuk anggota ini.
                    </td>
                  </tr>
                ) : (
                  detail.transaksiItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.noTransaksi}</td>
                      <td>{item.tanggalTransaksi}</td>
                      <td>
                        {item.kodeSimpanan} - {item.namaSimpanan}
                      </td>
                      <td>
                        {item.modelTransaksi} / {item.tipeTransaksi}
                      </td>
                      <td>{item.metodeBayar ?? "-"}</td>
                      <td>{toCurrency(item.nominal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.managementCard}>
          <div className={styles.sectionHeader}>
            <h2>Mutasi Titipan</h2>
            <span>Riwayat dana titipan yang masuk dan terpakai</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No. Mutasi</th>
                  <th>Tanggal</th>
                  <th>Simpanan</th>
                  <th>Tipe</th>
                  <th>Nominal</th>
                  <th>Referensi</th>
                </tr>
              </thead>
              <tbody>
                {detail.mutasiTitipanItems.length === 0 ? (
                  <tr>
                    <td className={styles.emptyCell} colSpan={6}>
                      Belum ada mutasi titipan untuk anggota ini.
                    </td>
                  </tr>
                ) : (
                  detail.mutasiTitipanItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.noMutasi}</td>
                      <td>{item.tanggalMutasi}</td>
                      <td>
                        {item.kodeSimpanan} - {item.namaSimpanan}
                      </td>
                      <td>{item.tipeMutasi}</td>
                      <td>{toCurrency(item.nominal)}</td>
                      <td>
                        {item.referensiTransaksiSimpananId
                          ? `TRX #${item.referensiTransaksiSimpananId}`
                          : item.referensiTagihanSimpananId
                            ? `TAG #${item.referensiTagihanSimpananId}`
                            : item.keterangan ?? "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </OpsShell>
  );
}
