"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DarkSelect } from "@/components/dark-select";
import { NumericInput } from "@/components/numeric-input";
import type {
  TagihanProjectDetail,
  TagihanProjectStatus,
  UnitBisnisOption,
} from "@/lib/tagihan-project-data";
import styles from "@/app/anggota/page.module.css";

type Props = {
  mode: "create" | "edit";
  unitOptions: UnitBisnisOption[];
  initialData?: TagihanProjectDetail | null;
};

type FormState = {
  unitBisnisId: string;
  noTagihan: string;
  namaTagihan: string;
  tanggalTagihan: string;
  subtotal: string;
  statusTagihan: TagihanProjectStatus;
  nilaiPph: string;
  noPenawaran: string;
  noJo: string;
  noJcpr: string;
  noBeritaAcara: string;
  noFakturPajak: string;
  noInvoice: string;
  noJpr: string;
  tanggalJpr: string;
  estimasiCairAt: string;
  catatan: string;
};

function toPlainNumber(value: string) {
  const normalized = value.replace(/[^\d.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getInitialState(
  initialData: TagihanProjectDetail | null | undefined,
  unitOptions: UnitBisnisOption[],
): FormState {
  return {
    unitBisnisId: String(initialData?.unitBisnisId ?? unitOptions[0]?.value ?? ""),
    noTagihan: initialData?.noTagihan ?? "",
    namaTagihan: initialData?.namaTagihan ?? "",
    tanggalTagihan: initialData?.tanggalTagihan ?? new Date().toISOString().slice(0, 10),
    subtotal: String(initialData?.subtotal ?? ""),
    statusTagihan: initialData?.statusTagihan ?? "DRAFT",
    nilaiPph: String(initialData?.nilaiPph ?? ""),
    noPenawaran: initialData?.noPenawaran ?? "",
    noJo: initialData?.noJo ?? "",
    noJcpr: initialData?.noJcpr ?? "",
    noBeritaAcara: initialData?.noBeritaAcara ?? "",
    noFakturPajak: initialData?.noFakturPajak ?? "",
    noInvoice: initialData?.noInvoice ?? "",
    noJpr: initialData?.noJpr ?? "",
    tanggalJpr: initialData?.tanggalJpr ?? "",
    estimasiCairAt: initialData?.estimasiCairAt ?? "",
    catatan: initialData?.catatan ?? "",
  };
}

export function TagihanProjectForm({
  mode,
  unitOptions,
  initialData = null,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => getInitialState(initialData, unitOptions));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const endpoint =
    mode === "create" ? "/api/tagihan/tagihan-project" : `/api/tagihan/tagihan-project/${initialData?.id}`;
  const method = mode === "create" ? "POST" : "PATCH";

  const subtotal = toPlainNumber(form.subtotal);
  const nilaiPpn = Math.round(subtotal * 0.11);
  const nilaiPph = toPlainNumber(form.nilaiPph);
  const nilaiTotal = subtotal + nilaiPpn - nilaiPph;
  const documentsComplete = Boolean(
    form.noPenawaran && form.noJo && form.noJcpr && form.noBeritaAcara && form.noFakturPajak && form.noInvoice,
  );

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subtotal,
          nilaiPpn,
          nilaiPph,
          nilaiTotal,
        }),
      });

      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Gagal menyimpan tagihan.");
      }

      router.push("/tagihan/tagihan-project");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Terjadi kendala saat menyimpan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={`page-shell ${styles.page}`}>
      <div className="container">
        <div className={styles.formShell}>
          <section className={styles.panel}>
            <div className={styles.topbar}>
              <Link className={styles.back} href="/tagihan/tagihan-project">
                Kembali ke daftar tagihan
              </Link>
            </div>

            <div className={styles.header}>
              <h1>{mode === "create" ? "Tambah Data Tagihan" : "Edit Data Tagihan"}</h1>
              <p>Record ini jadi induk proses tagihan. Nomor penawaran, JO, JCPR, invoice, berita acara, dan faktur pajak nantinya menempel ke data tagihan ini.</p>
            </div>

            {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

            <form className={styles.formStack} onSubmit={handleSubmit}>
              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Header Tagihan</legend>
                <div className={styles.formSectionIntro}>
                  <h2>Data Utama</h2>
                  <span>Buat dulu record induknya. Nomor tagihan otomatis akan mengikuti pola per unit, bulan, dan tahun.</span>
                </div>
                <div className={styles.gridCompact}>
                  <div className={styles.field}>
                    <label htmlFor="unitBisnisId">Unit Bisnis</label>
                    <DarkSelect
                      id="unitBisnisId"
                      onChange={(value) => updateField("unitBisnisId", value)}
                      options={unitOptions}
                      value={form.unitBisnisId}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="tanggalTagihan">Tanggal Tagihan</label>
                    <input
                      id="tanggalTagihan"
                      onChange={(event) => updateField("tanggalTagihan", event.target.value)}
                      type="date"
                      value={form.tanggalTagihan}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="namaTagihan">Nama Tagihan</label>
                    <input
                      id="namaTagihan"
                      onChange={(event) => updateField("namaTagihan", event.target.value)}
                      type="text"
                      value={form.namaTagihan}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="noTagihan">Nomor Tagihan</label>
                    <input
                      disabled
                      id="noTagihan"
                      placeholder={mode === "create" ? "Otomatis saat simpan" : ""}
                      type="text"
                      value={form.noTagihan}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="statusTagihan">Status</label>
                    <input disabled id="statusTagihan" type="text" value={form.statusTagihan} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="subtotal">Subtotal</label>
                    <input
                      disabled
                      id="subtotal"
                      type="text"
                      value={`Rp ${new Intl.NumberFormat("id-ID").format(subtotal)}`}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="nilaiPpn">PPN 11%</label>
                    <input
                      disabled
                      id="nilaiPpn"
                      type="text"
                      value={`Rp ${new Intl.NumberFormat("id-ID").format(nilaiPpn)}`}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="nilaiPph">Nilai PPh</label>
                    <NumericInput
                      currency
                      id="nilaiPph"
                      onChange={(value) => updateField("nilaiPph", value)}
                      value={form.nilaiPph}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="nilaiTotal">Nilai Total</label>
                    <input
                      disabled
                      id="nilaiTotal"
                      type="text"
                      value={`Rp ${new Intl.NumberFormat("id-ID").format(nilaiTotal)}`}
                    />
                  </div>
                  <div className={styles.fieldFull}>
                    <span className={styles.hint}>
                      `Subtotal`, `PPN`, `Total`, dan `Status` mengikuti proses timeline. Untuk saat ini `Subtotal` akan terisi dari proses dokumen tagihan.
                    </span>
                  </div>
                </div>
              </fieldset>

              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Nomor Relasi Dokumen</legend>
                <div className={styles.formSectionIntro}>
                  <h2>Dokumen Turunan</h2>
                  <span>Kolom ini disiapkan untuk proses timeline. Nanti saat penawaran, JO, JCPR, invoice, berita acara, dan faktur pajak dibuat, nomornya mengisi bagian ini.</span>
                </div>
                <div className={styles.gridCompact}>
                  <div className={styles.field}>
                    <label htmlFor="noPenawaran">No. Penawaran</label>
                    <input disabled id="noPenawaran" type="text" value={form.noPenawaran} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="noJo">No. JO</label>
                    <input disabled id="noJo" type="text" value={form.noJo} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="noJcpr">No. JCPR</label>
                    <input disabled id="noJcpr" type="text" value={form.noJcpr} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="noInvoice">No. Invoice</label>
                    <input disabled id="noInvoice" type="text" value={form.noInvoice} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="noBeritaAcara">No. Berita Acara</label>
                    <input disabled id="noBeritaAcara" type="text" value={form.noBeritaAcara} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="noFakturPajak">No. Faktur Pajak</label>
                    <input disabled id="noFakturPajak" type="text" value={form.noFakturPajak} />
                  </div>
                </div>
              </fieldset>

              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>JPR dan Pencairan</legend>
                <div className={styles.formSectionIntro}>
                  <h2>Status Lanjutan</h2>
                  <span>Kalau JPR sudah terbit atau sudah ada estimasi cair, simpan di sini supaya monitoring lebih mudah.</span>
                </div>
                <div className={styles.gridCompact}>
                  <div className={styles.field}>
                    <label htmlFor="noJpr">Nomor JPR</label>
                    <input
                      disabled={!documentsComplete}
                      id="noJpr"
                      onChange={(event) => updateField("noJpr", event.target.value)}
                      type="text"
                      value={form.noJpr}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="tanggalJpr">Tanggal JPR</label>
                    <input
                      disabled={!documentsComplete}
                      id="tanggalJpr"
                      onChange={(event) => updateField("tanggalJpr", event.target.value)}
                      type="date"
                      value={form.tanggalJpr}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="estimasiCairAt">Estimasi Cair</label>
                    <input
                      disabled={!documentsComplete}
                      id="estimasiCairAt"
                      onChange={(event) => updateField("estimasiCairAt", event.target.value)}
                      type="date"
                      value={form.estimasiCairAt}
                    />
                  </div>
                  {!documentsComplete ? (
                    <div className={styles.fieldFull}>
                      <span className={styles.hint}>
                        Field JPR dan estimasi cair aktif setelah nomor penawaran, JO, JCPR, invoice, berita acara, dan faktur pajak sudah lengkap.
                      </span>
                    </div>
                  ) : null}
                  <div className={styles.fieldFull}>
                    <label htmlFor="catatan">Catatan</label>
                    <textarea
                      id="catatan"
                      onChange={(event) => updateField("catatan", event.target.value)}
                      value={form.catatan}
                    />
                  </div>
                </div>
              </fieldset>

              <div className={styles.formActions}>
                <Link className={styles.resetButton} href="/tagihan/tagihan-project">
                  Batal
                </Link>
                <button className={styles.saveButton} disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
