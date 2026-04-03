"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NumericInput } from "@/components/numeric-input";
import type { TagihanWorkflowContext } from "@/lib/tagihan-workflow-data";
import type { WorkflowStepSlug } from "@/lib/tagihan-workflow-shared";
import { workflowStepLabels } from "@/lib/tagihan-workflow-shared";
import styles from "@/app/anggota/page.module.css";

type Props = {
  step: WorkflowStepSlug;
  data: TagihanWorkflowContext;
};

type FormState = {
  noDokumen: string;
  noKontrak: string;
  suffixJcpr: string;
  tanggalDokumen: string;
  costCenter: string;
  departemenMitra: string;
  subtotal: string;
  nilaiPpn: string;
  nilaiTotal: string;
  nilaiPph: string;
  estimasiCairAt: string;
  tanggalPencairan: string;
  nominalPencairan: string;
  catatan: string;
};

function formatCurrency(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

function toPlainNumber(value: string) {
  const normalized = value.replace(/[^\d.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function injectModuleCode(baseNumber: string, moduleCode: string) {
  const parts = baseNumber.split("/").map((part) => part.trim()).filter(Boolean);

  if (parts.length < 4) {
    return baseNumber;
  }

  const monthIndex = parts.findIndex((part) => /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)$/i.test(part));

  if (monthIndex <= 0) {
    return baseNumber;
  }

  if (parts.some((part) => part.toUpperCase() === moduleCode.toUpperCase())) {
    return parts.join("/");
  }

  const nextParts = [...parts];
  nextParts.splice(monthIndex, 0, moduleCode);
  return nextParts.join("/");
}

function buildInitialState(step: WorkflowStepSlug, data: TagihanWorkflowContext): FormState {
  const baseJoNumber = data.jo.noJo ?? "";
  const existingJcprNumber = data.documents.JCPR?.noDokumen ?? "";
  const derivedSuffixJcpr =
    step === "jcpr" && baseJoNumber && existingJcprNumber.startsWith(baseJoNumber)
      ? existingJcprNumber.slice(baseJoNumber.length).replace(/\D/g, "").slice(-2)
      : "";

  if (step === "jo") {
    return {
      noDokumen: data.jo.noJo ?? "",
      noKontrak: data.documents.BERITA_ACARA?.noKontrak ?? "",
      suffixJcpr: "",
      tanggalDokumen: data.jo.tanggalJo ?? "",
      costCenter: data.jo.costCenter ?? "",
      departemenMitra: data.jo.departemenMitra ?? "",
      subtotal: String(data.subtotal || ""),
      nilaiPpn: String(data.nilaiPpn || ""),
      nilaiTotal: String(data.nilaiTotal || ""),
      nilaiPph: String(data.nilaiPph || ""),
      estimasiCairAt: data.jpr.estimasiCairAt ?? "",
      tanggalPencairan: data.pencairan.tanggalPencairan ?? "",
      nominalPencairan: String(data.pencairan.nominalPencairan || ""),
      catatan: data.pencairan.catatan ?? "",
    };
  }

  if (step === "jcpr") {
    const noDokumen = baseJoNumber && derivedSuffixJcpr ? `${baseJoNumber}${derivedSuffixJcpr}` : existingJcprNumber;
    const initialSubtotal = data.subtotal > 0 ? data.subtotal : data.penawaranSubtotal;
    const initialNilaiPpn = data.nilaiPpn > 0 ? data.nilaiPpn : data.penawaranNilaiPpn;
    const initialNilaiTotal = data.nilaiTotal > 0 ? data.nilaiTotal : data.penawaranNilaiTotal;
    return {
      noDokumen,
      noKontrak: data.documents.BERITA_ACARA?.noKontrak ?? "",
      suffixJcpr: derivedSuffixJcpr,
      tanggalDokumen: data.documents.JCPR?.tanggalDokumen ?? data.tanggalTagihan,
      costCenter: "",
      departemenMitra: "",
      subtotal: String(initialSubtotal || ""),
      nilaiPpn: String(initialNilaiPpn || ""),
      nilaiTotal: String(initialNilaiTotal || ""),
      nilaiPph: String(data.nilaiPph || ""),
      estimasiCairAt: data.jpr.estimasiCairAt ?? "",
      tanggalPencairan: data.pencairan.tanggalPencairan ?? "",
      nominalPencairan: String(data.pencairan.nominalPencairan || ""),
      catatan: data.pencairan.catatan ?? "",
    };
  }

  if (step === "invoice") {
    return {
      noDokumen: data.documents.INVOICE?.noDokumen ?? data.noTagihan,
      noKontrak: data.documents.BERITA_ACARA?.noKontrak ?? "",
      suffixJcpr: "",
      tanggalDokumen: data.documents.INVOICE?.tanggalDokumen ?? data.tanggalTagihan,
      costCenter: "",
      departemenMitra: "",
      subtotal: String(data.subtotal || ""),
      nilaiPpn: String(data.nilaiPpn || ""),
      nilaiTotal: String(data.nilaiTotal || ""),
      nilaiPph: String(data.nilaiPph || ""),
      estimasiCairAt: data.jpr.estimasiCairAt ?? "",
      tanggalPencairan: data.pencairan.tanggalPencairan ?? "",
      nominalPencairan: String(data.pencairan.nominalPencairan || ""),
      catatan: data.pencairan.catatan ?? "",
    };
  }

  if (step === "berita-acara") {
    const generatedBakNumber = injectModuleCode(data.noTagihan, "BAK");
    return {
      noDokumen: data.documents.BERITA_ACARA?.noDokumen ?? generatedBakNumber,
      noKontrak: data.documents.BERITA_ACARA?.noKontrak ?? "",
      suffixJcpr: "",
      tanggalDokumen: data.documents.BERITA_ACARA?.tanggalDokumen ?? data.tanggalTagihan,
      costCenter: "",
      departemenMitra: "",
      subtotal: String(data.subtotal || ""),
      nilaiPpn: String(data.nilaiPpn || ""),
      nilaiTotal: String(data.nilaiTotal || ""),
      nilaiPph: String(data.nilaiPph || ""),
      estimasiCairAt: data.jpr.estimasiCairAt ?? "",
      tanggalPencairan: data.pencairan.tanggalPencairan ?? "",
      nominalPencairan: String(data.pencairan.nominalPencairan || ""),
      catatan: data.pencairan.catatan ?? "",
    };
  }

  if (step === "faktur-pajak") {
    return {
      noDokumen: data.documents.FAKTUR_PAJAK?.noDokumen ?? data.noTagihan,
      noKontrak: data.documents.BERITA_ACARA?.noKontrak ?? "",
      suffixJcpr: "",
      tanggalDokumen: data.documents.FAKTUR_PAJAK?.tanggalDokumen ?? data.tanggalTagihan,
      costCenter: "",
      departemenMitra: "",
      subtotal: String(data.subtotal || ""),
      nilaiPpn: String(data.nilaiPpn || ""),
      nilaiTotal: String(data.nilaiTotal || ""),
      nilaiPph: String(data.nilaiPph || ""),
      estimasiCairAt: data.jpr.estimasiCairAt ?? "",
      tanggalPencairan: data.pencairan.tanggalPencairan ?? "",
      nominalPencairan: String(data.pencairan.nominalPencairan || ""),
      catatan: data.pencairan.catatan ?? "",
    };
  }

  if (step === "jpr") {
    return {
      noDokumen: data.jpr.noJpr ?? data.documents.JPR?.noDokumen ?? "",
      noKontrak: data.documents.BERITA_ACARA?.noKontrak ?? "",
      suffixJcpr: "",
      tanggalDokumen: data.jpr.tanggalJpr ?? data.documents.JPR?.tanggalDokumen ?? "",
      costCenter: "",
      departemenMitra: "",
      subtotal: String(data.subtotal || ""),
      nilaiPpn: String(data.nilaiPpn || ""),
      nilaiTotal: String(data.nilaiTotal || ""),
      nilaiPph: String(data.nilaiPph || ""),
      estimasiCairAt: data.jpr.estimasiCairAt ?? "",
      tanggalPencairan: data.pencairan.tanggalPencairan ?? "",
      nominalPencairan: String(data.pencairan.nominalPencairan || ""),
      catatan: data.pencairan.catatan ?? "",
    };
  }

  return {
    noDokumen: "",
    noKontrak: data.documents.BERITA_ACARA?.noKontrak ?? "",
    suffixJcpr: "",
    tanggalDokumen: "",
    costCenter: "",
    departemenMitra: "",
    subtotal: String(data.subtotal || ""),
    nilaiPpn: String(data.nilaiPpn || ""),
    nilaiTotal: String(data.nilaiTotal || ""),
    nilaiPph: String(data.nilaiPph || ""),
    estimasiCairAt: data.jpr.estimasiCairAt ?? "",
    tanggalPencairan: data.pencairan.tanggalPencairan ?? "",
    nominalPencairan: String(data.pencairan.nominalPencairan || ""),
    catatan: data.pencairan.catatan ?? "",
  };
}

export function TagihanWorkflowStepForm({ step, data }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => buildInitialState(step, data));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const label = workflowStepLabels[step];
  const endpoint = `/api/tagihan/tagihan-project/${data.id}/workflow/${step}`;

  const subtotal = useMemo(() => toPlainNumber(form.subtotal), [form.subtotal]);
  const nilaiPpn = useMemo(
    () => (step === "jcpr" ? toPlainNumber(form.nilaiPpn) : Math.round(subtotal * 0.11)),
    [form.nilaiPpn, step, subtotal],
  );
  const nilaiPph = useMemo(() => toPlainNumber(form.nilaiPph), [form.nilaiPph]);
  const nilaiTotal = useMemo(
    () => (step === "jcpr" ? toPlainNumber(form.nilaiTotal) : subtotal + nilaiPpn - nilaiPph),
    [form.nilaiTotal, nilaiPph, nilaiPpn, step, subtotal],
  );
  const generatedJcprNumber =
    step === "jcpr" && data.jo.noJo
      ? `${data.jo.noJo}${form.suffixJcpr.replace(/\D/g, "").slice(0, 2).padStart(2, "0")}`
      : form.noDokumen;
  const generatedBeritaAcaraNumber =
    step === "berita-acara" ? injectModuleCode(data.noTagihan, "BAK") : form.noDokumen;

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noDokumen:
            step === "jcpr"
              ? generatedJcprNumber
              : step === "berita-acara"
                ? generatedBeritaAcaraNumber
                : form.noDokumen,
          noKontrak: form.noKontrak,
          suffixJcpr: form.suffixJcpr.replace(/\D/g, "").slice(0, 2),
          tanggalDokumen: form.tanggalDokumen,
          costCenter: form.costCenter,
          departemenMitra: form.departemenMitra,
          subtotal,
          nilaiPpn,
          nilaiPph,
          nilaiTotal,
          estimasiCairAt: form.estimasiCairAt,
          tanggalPencairan: form.tanggalPencairan,
          nominalPencairan: toPlainNumber(form.nominalPencairan),
          catatan: form.catatan,
        }),
      });

      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(result?.error ?? `Gagal menyimpan ${label}.`);
      }

      router.push("/tagihan/tagihan-project");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : `Terjadi kendala saat menyimpan ${label}.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={`page-shell ${styles.page}`}>
      <div className="container">
        <div className={styles.formShell}>
          <section className={styles.panel}>
            <div className={styles.header}>
              <h1>{label}</h1>
              <p>
                Dokumen ini terhubung ke data tagihan <strong>{data.noTagihan}</strong> untuk{" "}
                <strong>{data.namaTagihan || "-"}</strong>.
              </p>
            </div>

            {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

            <form className={styles.formStack} onSubmit={handleSubmit}>
              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Ringkasan Tagihan</legend>
                <div className={styles.gridCompact}>
                  <div className={styles.field}>
                    <label>Unit Bisnis</label>
                    <input disabled type="text" value={data.unitBisnisNama} />
                  </div>
                  <div className={styles.field}>
                    <label>No. Tagihan</label>
                    <input disabled type="text" value={data.noTagihan} />
                  </div>
                  <div className={styles.field}>
                    <label>Nama Tagihan</label>
                    <input disabled type="text" value={data.namaTagihan ?? "-"} />
                  </div>
                  <div className={styles.field}>
                    <label>No. Penawaran</label>
                    <input disabled type="text" value={data.noPenawaran ?? "-"} />
                  </div>
                </div>
              </fieldset>

              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Form {label}</legend>
                <div className={styles.gridCompact}>
                  {step === "jo" ? (
                    <>
                      <div className={styles.field}>
                        <label htmlFor="noDokumen">Nomor JO</label>
                        <input
                          id="noDokumen"
                          onChange={(event) => updateField("noDokumen", event.target.value)}
                          type="text"
                          value={form.noDokumen}
                        />
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="tanggalDokumen">Tanggal JO</label>
                        <input
                          id="tanggalDokumen"
                          onChange={(event) => updateField("tanggalDokumen", event.target.value)}
                          type="date"
                          value={form.tanggalDokumen}
                        />
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="costCenter">Cost Center</label>
                        <input
                          id="costCenter"
                          onChange={(event) => updateField("costCenter", event.target.value)}
                          type="text"
                          value={form.costCenter}
                        />
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="departemenMitra">Departemen Mitra</label>
                        <input
                          id="departemenMitra"
                          onChange={(event) => updateField("departemenMitra", event.target.value)}
                          type="text"
                          value={form.departemenMitra}
                        />
                      </div>
                    </>
                  ) : null}

                  {step === "jcpr" || step === "invoice" || step === "berita-acara" || step === "faktur-pajak" ? (
                    <>
                      {step === "jcpr" ? (
                        <>
                          <div className={styles.field}>
                            <label>Nomor JO</label>
                            <input disabled type="text" value={data.jo.noJo ?? "-"} />
                          </div>
                          <div className={styles.field}>
                            <label htmlFor="suffixJcpr">2 Digit JCPR</label>
                            <input
                              id="suffixJcpr"
                              inputMode="numeric"
                              maxLength={2}
                              onChange={(event) =>
                                updateField("suffixJcpr", event.target.value.replace(/\D/g, "").slice(0, 2))
                              }
                              placeholder="01"
                              type="text"
                              value={form.suffixJcpr}
                            />
                          </div>
                          <div className={styles.field}>
                            <label>Nomor JCPR</label>
                            <input disabled type="text" value={generatedJcprNumber || "-"} />
                          </div>
                        </>
                      ) : step === "berita-acara" ? (
                        <>
                          <div className={styles.field}>
                            <label>Nomor {label}</label>
                            <input disabled type="text" value={generatedBeritaAcaraNumber || "-"} />
                          </div>
                          <div className={styles.field}>
                            <label htmlFor="noKontrak">No. Kontrak</label>
                            <input
                              id="noKontrak"
                              onChange={(event) => updateField("noKontrak", event.target.value)}
                              type="text"
                              value={form.noKontrak}
                            />
                          </div>
                        </>
                      ) : (
                        <div className={styles.field}>
                          <label htmlFor="noDokumen">Nomor {label}</label>
                          <input
                            id="noDokumen"
                            onChange={(event) => updateField("noDokumen", event.target.value)}
                            type="text"
                            value={form.noDokumen}
                          />
                        </div>
                      )}
                      <div className={styles.field}>
                        <label htmlFor="tanggalDokumen">Tanggal {label}</label>
                        <input
                          id="tanggalDokumen"
                          onChange={(event) => updateField("tanggalDokumen", event.target.value)}
                          type="date"
                          value={form.tanggalDokumen}
                        />
                      </div>
                      {(step === "jcpr" || step === "invoice") ? (
                        <>
                          <div className={styles.field}>
                            <label htmlFor="subtotal">Subtotal Tagihan</label>
                            <NumericInput
                              currency
                              id="subtotal"
                              onChange={(value) => updateField("subtotal", value)}
                              value={form.subtotal}
                            />
                          </div>
                          <div className={styles.field}>
                            <label>PPN 11%</label>
                            {step === "jcpr" ? (
                              <NumericInput
                                currency
                                id="nilaiPpn"
                                onChange={(value) => updateField("nilaiPpn", value)}
                                value={form.nilaiPpn}
                              />
                            ) : (
                              <input disabled type="text" value={formatCurrency(nilaiPpn)} />
                            )}
                          </div>
                          <div className={styles.field}>
                            <label>Total</label>
                            {step === "jcpr" ? (
                              <NumericInput
                                currency
                                id="nilaiTotal"
                                onChange={(value) => updateField("nilaiTotal", value)}
                                value={form.nilaiTotal}
                              />
                            ) : (
                              <input disabled type="text" value={formatCurrency(nilaiTotal)} />
                            )}
                          </div>
                        </>
                      ) : null}
                    </>
                  ) : null}

                  {step === "jpr" ? (
                    <>
                      <div className={styles.field}>
                        <label htmlFor="noDokumen">Nomor JPR</label>
                        <input
                          id="noDokumen"
                          onChange={(event) => updateField("noDokumen", event.target.value)}
                          type="text"
                          value={form.noDokumen}
                        />
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="tanggalDokumen">Tanggal JPR</label>
                        <input
                          id="tanggalDokumen"
                          onChange={(event) => updateField("tanggalDokumen", event.target.value)}
                          type="date"
                          value={form.tanggalDokumen}
                        />
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="estimasiCairAt">Estimasi Cair</label>
                        <input
                          id="estimasiCairAt"
                          onChange={(event) => updateField("estimasiCairAt", event.target.value)}
                          type="date"
                          value={form.estimasiCairAt}
                        />
                      </div>
                      <div className={styles.field}>
                        <label>Subtotal</label>
                        <input disabled type="text" value={formatCurrency(data.subtotal)} />
                      </div>
                      <div className={styles.field}>
                        <label>PPN 11%</label>
                        <input disabled type="text" value={formatCurrency(data.nilaiPpn)} />
                      </div>
                      <div className={styles.field}>
                        <label>Total Tagihan</label>
                        <input disabled type="text" value={formatCurrency(data.subtotal + data.nilaiPpn)} />
                      </div>
                    </>
                  ) : null}

                  {step === "pencairan" ? (
                    <>
                      <div className={styles.field}>
                        <label htmlFor="tanggalPencairan">Tanggal Pencairan</label>
                        <input
                          id="tanggalPencairan"
                          onChange={(event) => updateField("tanggalPencairan", event.target.value)}
                          type="date"
                          value={form.tanggalPencairan}
                        />
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="nominalPencairan">Nominal Pencairan</label>
                        <NumericInput
                          currency
                          id="nominalPencairan"
                          onChange={(value) => updateField("nominalPencairan", value)}
                          value={form.nominalPencairan}
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
                        <label>Nilai Total Tagihan</label>
                        <input disabled type="text" value={formatCurrency(data.nilaiTotal)} />
                      </div>
                      <div className={styles.field}>
                        <label>Total Setelah PPh</label>
                        <input disabled type="text" value={formatCurrency(data.subtotal + data.nilaiPpn - nilaiPph)} />
                      </div>
                      <div className={styles.fieldFull}>
                        <label htmlFor="catatan">Catatan Pencairan</label>
                        <textarea
                          id="catatan"
                          onChange={(event) => updateField("catatan", event.target.value)}
                          value={form.catatan}
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </fieldset>

              <div className={styles.formActions}>
                <button
                  className={styles.resetButton}
                  onClick={() => router.push("/tagihan/tagihan-project")}
                  type="button"
                >
                  Batal
                </button>
                <button className={styles.saveButton} disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Menyimpan..." : `Simpan ${label}`}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
