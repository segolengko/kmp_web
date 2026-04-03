import { notFound } from "next/navigation";
import { getTagihanWorkflowContext } from "@/lib/tagihan-workflow-data";
import { isWorkflowStepSlug, workflowStepLabels } from "@/lib/tagihan-workflow-shared";
import { toTerbilangRupiah } from "@/lib/terbilang";
import styles from "./page.module.css";

type PageProps = {
  params: Promise<{ id: string; step: string }>;
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

function formatCurrencyPlain(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

const scoreScale = ["2", "4", "6", "8", "10"];
const technicalAspects = [
  "Duration of Work",
  "Quality of Work",
  "Standard Operating Procedure",
  "Competence",
  "Responsibility",
];
const k4lmAspects = [
  "Safety Device",
  "Used of Safety Device",
  "House Keeping",
  "Discipline",
];
const guidelineRows = [
  { score: "2", label: "Never" },
  { score: "4", label: "Sometimes" },
  { score: "6", label: "Confirmed" },
  { score: "8", label: "Better" },
  { score: "10", label: "Best" },
];

export default async function CetakWorkflowStepPage({ params }: PageProps) {
  const { id, step } = await params;

  if (!isWorkflowStepSlug(step)) {
    notFound();
  }

  const data = await getTagihanWorkflowContext(id);

  if (!data) {
    notFound();
  }

  const label = workflowStepLabels[step];

  if (step === "jcpr") {
    const rows = data.penawaranItems.length > 0 ? data.penawaranItems : [];
    const totalAmount = rows.reduce((sum, row) => sum + row.jumlah, 0);
    const payableTotal = Math.max(totalAmount + data.nilaiPpn - data.nilaiPph, 0);
    const payableTerbilang = toTerbilangRupiah(payableTotal);

    return (
      <main className={`${styles.printPage} ${styles.jcprLandscape}`}>
        <div className={`${styles.printCard} ${styles.jcprCard}`}>
          <table className={styles.jcprTable}>
            <thead>
              <tr>
                <th className={styles.jcprTitleCell} colSpan={4}>
                  JOB COMPLETION PROGRESS REPORT
                </th>
                <th colSpan={3}>JOB ORDER NO JO : {data.jo.noJo ?? "-"}</th>
                <th colSpan={4}>FINANCE ACCOUNTING</th>
              </tr>
              <tr>
                <th colSpan={2}>NO. JCPR : {data.documents.JCPR?.noDokumen ?? "-"}</th>
                <th colSpan={2}>DATE : {formatDate(data.documents.JCPR?.tanggalDokumen)}</th>
                <th colSpan={3}>SERVICE REQ NO SR : {data.noSr ?? "-"}</th>
                <th colSpan={4}>CONTRACTOR : {data.jcprSigners.contractor ?? "-"}</th>
              </tr>
              <tr>
                <th rowSpan={2}>NO</th>
                <th rowSpan={2} className={styles.jcprItemCol}>WORK / SUPPLY ITEMS</th>
                <th rowSpan={2}>UNIT</th>
                <th rowSpan={2}>UNIT COST</th>
                <th colSpan={2}>CURRENT COMPLETION</th>
                <th colSpan={2}>CURRENT COMPLETION</th>
                <th colSpan={2}>CURRENT COMPLETION</th>
              </tr>
              <tr>
                <th>QTY</th>
                <th>AMOUNT</th>
                <th>QTY</th>
                <th>AMOUNT PAID</th>
                <th>QTY</th>
                <th>AMOUNT PAYABLE</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td className={styles.jcprItemCol}>
                      <strong>{row.namaItem}</strong>
                      {row.deskripsiItem ? <span>{row.deskripsiItem}</span> : null}
                    </td>
                    <td>{row.satuan ?? "-"}</td>
                    <td className={styles.jcprAmountCell}>{formatCurrency(row.hargaSatuan)}</td>
                    <td className={styles.jcprQtyCell}>{new Intl.NumberFormat("id-ID").format(row.qty)}</td>
                    <td className={styles.jcprAmountCell}>{formatCurrency(row.jumlah)}</td>
                    <td className={styles.jcprQtyCell} />
                    <td className={styles.jcprAmountCell}>{formatCurrency(0)}</td>
                    <td className={styles.jcprQtyCell}>{new Intl.NumberFormat("id-ID").format(row.qty)}</td>
                    <td className={styles.jcprAmountCell}>{formatCurrency(row.jumlah)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className={styles.jcprEmpty}>Belum ada item penawaran untuk ditampilkan.</td>
                </tr>
              )}
              <tr className={styles.jcprBlankRow}>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
              <tr className={styles.jcprBlankRow}>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
              <tr className={styles.jcprSummaryRow}>
                <td colSpan={8} className={styles.jcprSummaryLabel}>SUBTOTAL</td>
                <td colSpan={2} className={styles.jcprSummaryValue}>{formatCurrency(totalAmount)}</td>
              </tr>
              <tr className={styles.jcprSummaryRow}>
                <td colSpan={8} className={styles.jcprSummaryLabel}>PPN</td>
                <td colSpan={2} className={styles.jcprSummaryValue}>{formatCurrency(data.nilaiPpn)}</td>
              </tr>
              <tr className={styles.jcprSummaryRow}>
                <td colSpan={8} className={styles.jcprSummaryLabel}>TOTAL</td>
                <td colSpan={2} className={styles.jcprSummaryValue}>{formatCurrency(payableTotal)}</td>
              </tr>
              <tr className={styles.jcprPayableSentenceRow}>
                <td colSpan={10} className={styles.jcprPayableCell}>
                  <div className={styles.jcprPayableBlock}>
                    <span className={styles.jcprPayableLabel}>CURRENT PAYABLE, TOTAL AMOUNT</span>
                    <span className={styles.jcprPayableColon}>:</span>
                    <em>{payableTerbilang}</em>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <section className={styles.jcprReviewSection}>
            <div className={styles.jcprReviewBlock}>
              <h2>JOB REVIEW</h2>
              <div className={styles.jcprReviewGrid}>
                <div className={styles.jcprReviewTax}>
                  <h3>1. TAX PAYMENT</h3>
                  <div className={styles.jcprTaxContent}>
                    <div className={styles.jcprTaxLabels}>
                      <span>a. PPN</span>
                      <span>b. PPH</span>
                    </div>
                    <div className={styles.jcprTaxMatrix}>
                      <span>YES</span>
                      <span>NO</span>
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>

                  <div className={styles.jcprScoreBlock}>
                    <div className={styles.jcprScoreTopRow}>
                      <h3>2. TECHNICAL ASPECTS</h3>
                      <span className={styles.jcprScoreValuesTitle}>SCORE</span>
                    </div>
                    <div className={styles.jcprScoreTable}>
                    {technicalAspects.map((aspect, index) => (
                      <div className={styles.jcprScoreRow} key={aspect}>
                        <span>{String.fromCharCode(97 + index)}. {aspect}</span>
                        <div className={styles.jcprScoreValues}>
                          {scoreScale.map((score) => (
                            <span key={`${aspect}-${score}`}>{score}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                  <div className={styles.jcprScoreBlock}>
                    <div className={styles.jcprScoreTopRow}>
                      <h3>3. K4LM ASPECTS</h3>
                      <span className={styles.jcprScoreValuesTitle}>SCORE</span>
                    </div>
                    <div className={styles.jcprScoreTable}>
                    {k4lmAspects.map((aspect, index) => (
                      <div className={styles.jcprScoreRow} key={aspect}>
                        <span>{String.fromCharCode(97 + index)}. {aspect}</span>
                        <div className={styles.jcprScoreValues}>
                          {scoreScale.map((score) => (
                            <span key={`${aspect}-${score}`}>{score}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.jcprGuidelineBlock}>
                  <span className={styles.jcprGuidelineTitle}>GUIDELINE</span>
                  <div className={styles.jcprGuidelineTable}>
                    {guidelineRows.map((row) => (
                      <div className={styles.jcprGuidelineRow} key={row.score}>
                        <span>{row.score}</span>
                        <span>{row.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.jcprCommentSection}>
            <div className={styles.jcprCommentSignatureBox}>
              <h2>COMMENT &amp; RECOMMENDATION</h2>
              <div className={styles.jcprCommentSpacer} />
              <div className={styles.jcprSignatureArea}>
                <div className={styles.jcprSignatureBox}>
                  <h2>AUTHORIZED NAMES &amp; SIGNATURES</h2>
                  <div className={styles.jcprSignatureGrid}>
                    <div>
                      <strong>{data.jcprSigners.contractor ?? "-"}</strong>
                      <span>CONTRACTOR</span>
                    </div>
                    <div>
                      <strong>{data.jcprSigners.jobInspector ?? "-"}</strong>
                      <span>JOB INSPECTOR</span>
                    </div>
                    <div>
                      <strong>{data.jcprSigners.sectionChief ?? "-"}</strong>
                      <span>SECTION CHIEF</span>
                    </div>
                    <div>
                      <strong>{data.jcprSigners.serviceDepartment ?? "-"}</strong>
                      <span>SERVICE DEPARTMENT</span>
                    </div>
                  </div>
                </div>
                <div className={styles.jcprAcceptedBox}>
                  <h2>ACCEPTED BY</h2>
                  <div className={styles.jcprAcceptedSlot}>
                    <strong>{data.jcprSigners.requestingDepartment ?? "-"}</strong>
                    <span>REQUESTING DEPARTMENT</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (step === "invoice") {
    const rows = data.penawaranItems.length > 0 ? data.penawaranItems : [];
    const invoiceRows = [
      ...rows.map((row, index) => ({
        no: index + 1,
        deskripsi: [row.namaItem, row.deskripsiItem].filter(Boolean).join(" "),
        hargaSatuan: row.hargaSatuan,
        jumlah: row.jumlah,
      })),
      ...(data.documents.JCPR?.noDokumen
        ? [
            {
              no: rows.length + 1,
              deskripsi: data.documents.JCPR.noDokumen,
              hargaSatuan: null,
              jumlah: null,
            },
          ]
        : []),
    ];
    const blankRowCount = Math.max(0, 8 - invoiceRows.length);
    const subtotal = data.subtotal || data.penawaranSubtotal;
    const nilaiPpn = data.nilaiPpn || data.penawaranNilaiPpn;
    const total = data.nilaiTotal || data.penawaranNilaiTotal || subtotal + nilaiPpn;
    const terbilang = toTerbilangRupiah(total);
    const recipientName = data.mitraPerusahaanNama ?? "-";
    const recipientAddress = data.mitraPerusahaanAlamat
      ? data.mitraPerusahaanAlamat.split(/\r?\n/).filter(Boolean)
      : [];

    return (
      <main className={`${styles.printPage} ${styles.invoicePage}`}>
        <div className={`${styles.printCard} ${styles.invoiceCard}`}>
          <header className={styles.invoiceHeader}>
            <div className={styles.invoiceHeaderLeft}>
              <h1>KOPERASI KARYAWAN MANUNGGAL PERKASA</h1>
              <strong>PT. INDOCEMENT TUNGGAL PRAKARSA Tbk.</strong>
              <span>BADAN HUKUM NO. 8112/BH/PAD/KWK.10/VI/96 TGL 17 JULI 1996</span>
              <span>JL. RAYA CIREBON - BANDUNG KM 20</span>
              <span>Telp/Fax. (0231) 343419</span>
            </div>
            <div className={styles.invoiceHeaderRight}>Supplier</div>
          </header>

          <section className={styles.invoiceTitleSection}>
            <h2>INVOICE</h2>
          </section>

          <section className={styles.invoiceMetaSection}>
            <div className={styles.invoiceRecipient}>
              <span>Kepada Yth :</span>
              <strong>{recipientName}</strong>
              {recipientAddress.length > 0 ? (
                recipientAddress.map((line) => <span key={line}>{line}</span>)
              ) : (
                <span>-</span>
              )}
            </div>
            <div className={styles.invoiceMeta}>
              <div><span>Nomor Invoice</span><strong>: {data.documents.INVOICE?.noDokumen ?? "-"}</strong></div>
              <div><span>Tanggal Invoice</span><strong>: {formatDate(data.documents.INVOICE?.tanggalDokumen)}</strong></div>
              <div><span>Nomor SPK</span><strong>: {data.jo.noJo ?? "-"}</strong></div>
              <div><span>NPWP</span><strong>: {data.mitraPerusahaanNpwp ?? "-"}</strong></div>
            </div>
          </section>

          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th className={styles.invoiceNoCol}>No.</th>
                <th>Barang / Jasa</th>
                <th className={styles.invoicePriceCol}>Harga Persatuan (Rp)</th>
                <th className={styles.invoiceAmountCol}>Jumlah (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {invoiceRows.map((row) => (
                <tr key={`${row.no}-${row.deskripsi}`}>
                  <td className={styles.invoiceNoCell}>{row.no}</td>
                  <td>{row.deskripsi || "-"}</td>
                  <td className={styles.invoiceNumericCell}>
                    {row.hargaSatuan !== null ? formatCurrencyPlain(row.hargaSatuan) : ""}
                  </td>
                  <td className={styles.invoiceNumericCell}>
                    {row.jumlah !== null ? formatCurrencyPlain(row.jumlah) : ""}
                  </td>
                </tr>
              ))}
              {Array.from({ length: blankRowCount }).map((_, index) => (
                <tr key={`blank-${index}`} className={styles.invoiceBlankRow}>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} className={styles.invoiceSummaryLabel}>Jumlah harga barang / jasa</td>
                <td className={styles.invoiceNumericCell}>{formatCurrencyPlain(subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={3} className={styles.invoiceSummaryLabel}>Dasar Pengenaan Pajak</td>
                <td className={styles.invoiceNumericCell}>{formatCurrencyPlain(subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={3} className={styles.invoiceSummaryLabel}>Ppn = 11% Dasar Pengenaan Pajak</td>
                <td className={styles.invoiceNumericCell}>{formatCurrencyPlain(nilaiPpn)}</td>
              </tr>
              <tr>
                <td colSpan={3} className={styles.invoiceSummaryLabel}>Total Per Faktur</td>
                <td className={`${styles.invoiceNumericCell} ${styles.invoiceTotalCell}`}>{formatCurrencyPlain(total)}</td>
              </tr>
              <tr>
                <td colSpan={4} className={styles.invoiceTerbilangCell}>
                  <strong>Terbilang</strong>
                  <em>{terbilang}</em>
                </td>
              </tr>
            </tbody>
          </table>

          <section className={styles.invoiceSignatureSection}>
            <div className={styles.invoiceSignatureBlock}>
              <span>Koperasi Karyawan Manunggal Perkasa</span>
              <div className={styles.invoiceSignatureSpace} />
              <strong>{data.jcprSigners.contractor ?? data.penandatanganNama ?? "-"}</strong>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (step === "berita-acara") {
    const rows = data.penawaranItems.length > 0 ? data.penawaranItems : [];
    const subtotal = data.subtotal || data.penawaranSubtotal;
    const nilaiPpn = data.nilaiPpn || data.penawaranNilaiPpn;
    const total = data.nilaiTotal || data.penawaranNilaiTotal || subtotal + nilaiPpn;
    const terbilang = toTerbilangRupiah(total);
    const pekerjaanUtama = rows[0]
      ? [rows[0].namaItem, rows[0].deskripsiItem].filter(Boolean).join(" ")
      : data.namaTagihan ?? "-";
    const approverName =
      data.jcprSigners.deptHead ??
      data.jcprSigners.requestingDepartment ??
      data.jcprSigners.sectionChief ??
      "-";

    return (
      <main className={`${styles.printPage} ${styles.beritaAcaraPage}`}>
        <div className={`${styles.printCard} ${styles.beritaAcaraCard}`}>
          <header className={styles.beritaAcaraHeader}>
            <div className={styles.beritaAcaraHeaderText}>
              <h1>KOPERASI KARYAWAN MANUNGGAL PERKASA</h1>
              <strong>Badan Hukum : NO.8112 / BH / PAD / KWK 10 / VII / 1996 Tanggal 17-07-1996</strong>
              <span>Jl. Raya Cirebon Bandung KM 20 Cirebon</span>
              <span>Telepon (0231) 343419 / 343417</span>
            </div>
          </header>

          <section className={styles.beritaAcaraTitleSection}>
            <h2>BERITA ACARA</h2>
          </section>

          <section className={styles.beritaAcaraIntro}>
            <p>
              Telah dilakukan pekerjaan rental kendaraan di {data.mitraPerusahaanNama ?? "-"} oleh
              Koperasi Karyawan Manunggal Perkasa sesuai dengan Nomor Invoice {data.documents.INVOICE?.noDokumen ?? "-"}
              {" "}dengan rincian sebagai berikut :
            </p>
          </section>

          <section className={styles.beritaAcaraMeta}>
            <div><span>No. Kontrak</span><strong>: {data.documents.BERITA_ACARA?.noKontrak ?? "-"}</strong></div>
            <div><span>No.J.O</span><strong>: {data.jo.noJo ?? "-"}</strong></div>
            <div><span>Pekerjaan</span><strong>: {pekerjaanUtama}</strong></div>
          </section>

          <table className={styles.beritaAcaraTable}>
            <thead>
              <tr>
                <th>PEKERJAAN</th>
                <th className={styles.beritaAcaraProgressCol}>PROGRES</th>
                <th className={styles.beritaAcaraAmountCol}>JUMLAH</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{pekerjaanUtama}</td>
                <td className={styles.beritaAcaraCenterCell}>1</td>
                <td className={styles.beritaAcaraAmountCell}>{formatCurrency(total - nilaiPpn)}</td>
              </tr>
              <tr>
                <td className={styles.beritaAcaraSummaryLabel}>PPN 11%</td>
                <td />
                <td className={styles.beritaAcaraAmountCell}>{formatCurrency(nilaiPpn)}</td>
              </tr>
              <tr>
                <td className={styles.beritaAcaraSummaryLabel}>Total</td>
                <td />
                <td className={`${styles.beritaAcaraAmountCell} ${styles.beritaAcaraTotalCell}`}>{formatCurrency(total)}</td>
              </tr>
            </tbody>
          </table>

          <section className={styles.beritaAcaraTerbilang}>
            <span>Terbilang:</span>
            <strong>{terbilang}</strong>
          </section>

          <section className={styles.beritaAcaraClosing}>
            <p>Demikian Berita Acara ini dibuat.</p>
          </section>

          <section className={styles.beritaAcaraSignatureSection}>
            <div className={styles.beritaAcaraSignatureCol}>
              <span>Gempol, {formatDate(data.documents.BERITA_ACARA?.tanggalDokumen)}</span>
              <span>Kopkar Manunggal Perkasa</span>
              <div className={styles.beritaAcaraSignatureSpace} />
              <strong>{data.jcprSigners.contractor ?? "-"}</strong>
              <span>Ketua</span>
            </div>
            <div className={styles.beritaAcaraSignatureCol}>
              <span>Mengetahui</span>
              <span>{data.mitraPerusahaanNama ?? "-"}</span>
              <div className={styles.beritaAcaraSignatureSpace} />
              <strong>{approverName}</strong>
              <span>Dept. Head</span>
            </div>
          </section>
        </div>
      </main>
    );
  }

  let nomor = "-";
  let tanggal = "-";
  let extraRows: Array<{ label: string; value: string }> = [];

  if (step === "jo") {
    nomor = data.jo.noJo ?? "-";
    tanggal = formatDate(data.jo.tanggalJo);
    extraRows = [
      { label: "Cost Center", value: data.jo.costCenter ?? "-" },
      { label: "Departemen Mitra", value: data.jo.departemenMitra ?? "-" },
    ];
  }

  if (step === "faktur-pajak") {
    nomor = data.documents.FAKTUR_PAJAK?.noDokumen ?? "-";
    tanggal = formatDate(data.documents.FAKTUR_PAJAK?.tanggalDokumen);
  }

  if (step === "jpr") {
    nomor = data.jpr.noJpr ?? "-";
    tanggal = formatDate(data.jpr.tanggalJpr);
    extraRows = [
      { label: "Estimasi Cair", value: formatDate(data.jpr.estimasiCairAt) },
    ];
  }

  if (step === "pencairan") {
    nomor = data.noTagihan;
    tanggal = formatDate(data.pencairan.tanggalPencairan);
    extraRows = [
      { label: "Nilai PPh", value: formatCurrency(data.nilaiPph) },
      { label: "Nominal Pencairan", value: formatCurrency(data.pencairan.nominalPencairan) },
      { label: "Catatan", value: data.pencairan.catatan ?? "-" },
    ];
  }

  return (
    <main className={styles.printPage}>
      <div className={styles.printCard}>
        <header className={styles.header}>
          <span className={styles.kicker}>Dokumen Timeline Tagihan</span>
          <h1>{label}</h1>
          <p>{data.namaTagihan || "-"} / {data.noTagihan}</p>
        </header>

        <section className={styles.section}>
          <div className={styles.grid}>
            <div className={styles.item}>
              <span>Unit Bisnis</span>
              <strong>{data.unitBisnisNama}</strong>
            </div>
            <div className={styles.item}>
              <span>Nomor Dokumen</span>
              <strong>{nomor}</strong>
            </div>
            <div className={styles.item}>
              <span>Tanggal Dokumen</span>
              <strong>{tanggal}</strong>
            </div>
            <div className={styles.item}>
              <span>Nomor Penawaran</span>
              <strong>{data.noPenawaran ?? "-"}</strong>
            </div>
          </div>
        </section>

        {extraRows.length > 0 ? (
          <section className={styles.section}>
            <h2>Rincian</h2>
            <div className={styles.grid}>
              {extraRows.map((row) => (
                <div className={styles.item} key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
