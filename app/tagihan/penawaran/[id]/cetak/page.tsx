import { notFound } from "next/navigation";
import { DocumentPrintActions } from "@/components/document-print-actions";
import { getPenawaranProjectById } from "@/lib/tagihan-penawaran-data";
import styles from "./page.module.css";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(dateString: string | null | undefined) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default async function CetakPenawaranPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getPenawaranProjectById(id);

  if (!data) {
    notFound();
  }

  return (
    <main className={`page-shell ${styles.page}`}>
      <div className="container">
        <div className={styles.shell}>
          <DocumentPrintActions backHref={`/tagihan/penawaran/${data.id}/edit`} />

          <article className={styles.paper}>
            <section className={styles.meta}>
              <div className={styles.metaRow}>
                <strong>Nomor</strong>
                <span>:</span>
                <span>{data.noPenawaran}</span>
              </div>
              <div className={styles.metaRow}>
                <strong>Tanggal</strong>
                <span>:</span>
                <span>{formatDate(data.tanggalPenawaran)}</span>
              </div>
              <div className={styles.metaRow}>
                <strong>SR No.</strong>
                <span>:</span>
                <span>{data.noSr}</span>
              </div>
            </section>

            <p className={styles.opening}>{data.pembukaSurat}</p>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>No</th>
                  <th>Nama Item</th>
                  <th style={{ width: "62px" }}>Qty</th>
                  <th style={{ width: "70px" }}>Satuan</th>
                  <th style={{ width: "118px" }}>Harga Satuan</th>
                  <th style={{ width: "118px" }}>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={item.id ?? `${item.namaItem}-${index}`}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{item.namaItem}</strong>
                      {item.deskripsiItem ? <div>{item.deskripsiItem}</div> : null}
                    </td>
                    <td className={styles.cellQty}>{formatCurrency(item.qty)}</td>
                    <td>{item.satuan ?? "-"}</td>
                    <td className={styles.cellCurrency}>{formatCurrency(item.hargaSatuan)}</td>
                    <td className={styles.cellCurrency}>{formatCurrency(item.jumlah)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <section className={styles.totals}>
              <div className={styles.totalRow}>
                <strong>Subtotal</strong>
                <span>:</span>
                <span className={styles.cellCurrency}>{formatCurrency(data.subtotal)}</span>
              </div>
              <div className={styles.totalRow}>
                <strong>PPN 11%</strong>
                <span>:</span>
                <span className={styles.cellCurrency}>{formatCurrency(data.nilaiPpn)}</span>
              </div>
              <div className={styles.totalRow}>
                <strong>Total</strong>
                <span>:</span>
                <span className={styles.cellCurrency}>{formatCurrency(data.nilaiTotal)}</span>
              </div>
            </section>

            <p className={styles.terbilang}>
              <strong>Terbilang:</strong> {data.terbilang}
            </p>

            <div className={styles.signatureWrap}>
              {data.penandatanganNama3 ? (
                <div className={styles.signatureGridThree}>
                  <div className={styles.signatureBox}>
                    <span>
                      {data.tempatTtd || "-"}, {formatDate(data.tanggalTtd)}
                    </span>
                    <span>Koperasi Karyawan Manunggal Perkasa</span>
                    <div className={styles.signatureSpace} />
                    <span className={styles.signatureName}>
                      {data.penandatanganNama || "(.................................)"}
                    </span>
                    <span>{data.penandatanganJabatan || ""}</span>
                  </div>
                  <div className={styles.signatureBox}>
                    <span>&nbsp;</span>
                    <span>&nbsp;</span>
                    <div className={styles.signatureSpace} />
                    <span className={styles.signatureName}>
                      {data.penandatanganNama2 || "(.................................)"}
                    </span>
                    <span>{data.penandatanganJabatan2 || ""}</span>
                  </div>
                  <div className={styles.signatureBox}>
                    <span>&nbsp;</span>
                    <span>&nbsp;</span>
                    <div className={styles.signatureSpace} />
                    <span className={styles.signatureName}>{data.penandatanganNama3}</span>
                    <span>{data.penandatanganJabatan3 || ""}</span>
                  </div>
                </div>
              ) : data.penandatanganNama2 ? (
                <div className={styles.signatureGrid}>
                  <div className={styles.signatureBox}>
                    <span>
                      {data.tempatTtd || "-"}, {formatDate(data.tanggalTtd)}
                    </span>
                    <span>Koperasi Karyawan Manunggal Perkasa</span>
                    <div className={styles.signatureSpace} />
                    <span className={styles.signatureName}>
                      {data.penandatanganNama || "(.................................)"}
                    </span>
                    <span>{data.penandatanganJabatan || ""}</span>
                  </div>
                  <div className={styles.signatureBox}>
                    <span>&nbsp;</span>
                    <span>&nbsp;</span>
                    <div className={styles.signatureSpace} />
                    <span className={styles.signatureName}>{data.penandatanganNama2}</span>
                    <span>{data.penandatanganJabatan2 || ""}</span>
                  </div>
                </div>
              ) : (
                <div className={styles.signatureBox}>
                  <span>
                    {data.tempatTtd || "-"}, {formatDate(data.tanggalTtd)}
                  </span>
                  <span>Koperasi Karyawan Manunggal Perkasa</span>
                  <div className={styles.signatureSpace} />
                  <span className={styles.signatureName}>
                    {data.penandatanganNama || "(.................................)"}
                  </span>
                  <span>{data.penandatanganJabatan || ""}</span>
                </div>
              )}
            </div>
          </article>

          <p className={styles.note}>
            Halaman ini disiapkan untuk cetak browser atau simpan PDF. Layout sudah dibuat seperti
            surat penawaran kerja.
          </p>
        </div>
      </div>
    </main>
  );
}
