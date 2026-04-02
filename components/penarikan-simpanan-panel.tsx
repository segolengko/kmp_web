"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DarkSelect } from "@/components/dark-select";
import { NumericInput } from "@/components/numeric-input";
import type {
  PenarikanAnggotaOption,
  PenarikanItem,
  PenarikanSaldoOption,
} from "@/lib/penarikan-data";
import styles from "@/app/anggota/page.module.css";

type Props = {
  anggotaOptions: PenarikanAnggotaOption[];
  penarikan: PenarikanItem[];
  saldoOptions: PenarikanSaldoOption[];
  mode?: "INPUT" | "DATA";
};

type ActionState = {
  statusBaru: "DISETUJUI" | "DITOLAK" | "DIBATALKAN" | "DIREALISASIKAN";
  tanggalProses: string;
  nominalDisetujui: string;
  catatan: string;
  diprosesOleh: string;
};

type DraftState = {
  anggotaId: string;
  jenisSimpananId: string;
  tanggalPengajuan: string;
  nominalPengajuan: string;
  alasanPenarikan: string;
  catatan: string;
  diajukanOleh: string;
};

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function toCurrency(value: number | null) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function toStatusTone(status: PenarikanItem["statusPenarikan"]) {
  switch (status) {
    case "DIAJUKAN":
      return styles.statusPasif;
    case "DISETUJUI":
      return styles.statusAktif;
    case "DIREALISASIKAN":
      return styles.statusAktif;
    default:
      return styles.statusKeluar;
  }
}

function getInitialActionState(item: PenarikanItem): ActionState {
  return {
    statusBaru:
      item.statusPenarikan === "DISETUJUI" ? "DIREALISASIKAN" : "DISETUJUI",
    tanggalProses: "",
    nominalDisetujui: item.nominalDisetujui ? String(item.nominalDisetujui) : "",
    catatan: item.catatan ?? "",
    diprosesOleh: "admin",
  };
}

export function PenarikanSimpananPanel({
  anggotaOptions,
  penarikan,
  saldoOptions,
  mode = "INPUT",
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeNoPenarikan, setActiveNoPenarikan] = useState<string | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [forms, setForms] = useState<Record<string, ActionState>>({});
  const [draftForm, setDraftForm] = useState<DraftState>({
    anggotaId: String(anggotaOptions[0]?.anggotaId ?? ""),
    jenisSimpananId: "",
    tanggalPengajuan: todayValue(),
    nominalPengajuan: "",
    alasanPenarikan: "",
    catatan: "",
    diajukanOleh: "admin",
  });

  const summary = useMemo(() => {
    return {
      diajukan: penarikan.filter((item) => item.statusPenarikan === "DIAJUKAN").length,
      disetujui: penarikan.filter((item) => item.statusPenarikan === "DISETUJUI").length,
      direalisasikan: penarikan.filter((item) => item.statusPenarikan === "DIREALISASIKAN")
        .length,
      nominalDraft: penarikan
        .filter((item) => item.statusPenarikan === "DIAJUKAN")
        .reduce((total, item) => total + item.nominalPengajuan, 0),
    };
  }, [penarikan]);

  const isInputMode = mode === "INPUT";
  const isDataMode = mode === "DATA";

  const filteredSaldoOptions = useMemo(
    () =>
      saldoOptions.filter((item) =>
        draftForm.anggotaId ? item.anggotaId === Number(draftForm.anggotaId) : true,
      ),
    [draftForm.anggotaId, saldoOptions],
  );

  const selectedSaldoOption = useMemo(
    () =>
      filteredSaldoOptions.find(
        (item) => item.jenisSimpananId === Number(draftForm.jenisSimpananId),
      ) ?? null,
    [draftForm.jenisSimpananId, filteredSaldoOptions],
  );

  function getFormState(item: PenarikanItem) {
    return forms[item.noPenarikan] ?? getInitialActionState(item);
  }

  function patchForm(noPenarikan: string, patch: Partial<ActionState>) {
    setForms((current) => ({
      ...current,
      [noPenarikan]: {
        ...(current[noPenarikan] ?? getInitialActionState(
          penarikan.find((item) => item.noPenarikan === noPenarikan)!,
        )),
        ...patch,
      },
    }));
  }

  function updateDraftField<K extends keyof DraftState>(field: K, value: DraftState[K]) {
    setDraftForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "anggotaId") {
        const nextJenis =
          saldoOptions.find((item) => item.anggotaId === Number(value))?.jenisSimpananId ?? null;
        next.jenisSimpananId = nextJenis ? String(nextJenis) : "";
        next.nominalPengajuan = "";
      }

      return next;
    });
  }

  async function handleCreateDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!draftForm.anggotaId || !draftForm.jenisSimpananId) {
      setErrorMessage("Pilih anggota dan jenis simpanan sebelum membuat draft penarikan.");
      return;
    }

    setIsCreatingDraft(true);

    try {
      const response = await fetch("/api/penarikan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draftForm),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Draft penarikan gagal dibuat.");
      }

      setMessage("Draft penarikan berhasil dibuat dan siap diproses.");
      setDraftForm((current) => ({
        ...current,
        nominalPengajuan: "",
        alasanPenarikan: "",
        catatan: "",
      }));
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi kendala saat membuat draft penarikan.",
      );
    } finally {
      setIsCreatingDraft(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>, noPenarikan: string) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setActiveNoPenarikan(noPenarikan);

    const form = forms[noPenarikan] ?? {
      statusBaru: "DISETUJUI" as const,
      tanggalProses: "",
      nominalDisetujui: "",
      catatan: "",
      diprosesOleh: "admin",
    };

    try {
      const response = await fetch(`/api/penarikan/${encodeURIComponent(noPenarikan)}/proses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Proses penarikan simpanan gagal.");
      }

      setMessage(`Penarikan ${noPenarikan} berhasil diproses.`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi kendala saat memproses penarikan.",
      );
    } finally {
      setActiveNoPenarikan(null);
    }
  }

  return (
    <div className={styles.managementStack}>
      {message ? <div className={styles.successBanner}>{message}</div> : null}
      {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

      <section className={styles.managementCard}>
        <div className={styles.rowActions}>
          <Link
            className={`${styles.pageButton} ${isInputMode ? styles.pageNumberActive : ""}`}
            href="/penarikan/input"
          >
            Input
          </Link>
          <Link
            className={`${styles.pageButton} ${isDataMode ? styles.pageNumberActive : ""}`}
            href="/penarikan/data"
          >
            Data
          </Link>
        </div>
      </section>

      {isInputMode ? (
      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Buat Draft Penarikan</h2>
          <span>Ajukan penarikan manual untuk simpanan yang bisa ditarik</span>
        </div>
        <form className={styles.managementForm} onSubmit={handleCreateDraft}>
          <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
            <legend className={styles.formSectionLegend}>Draft</legend>
            <div className={styles.formSectionIntro}>
              <h2>Input Pengajuan</h2>
              <span>Pilih anggota, jenis simpanan, nominal, dan alasan pengajuan</span>
            </div>

            <div className={styles.gridCompact}>
              <div className={styles.field}>
                <label htmlFor="anggota-penarikan-baru">Anggota</label>
                <DarkSelect
                  id="anggota-penarikan-baru"
                  onChange={(value) => updateDraftField("anggotaId", value)}
                  options={anggotaOptions.map((item) => ({
                    label: `${item.noAnggota} - ${item.namaLengkap}`,
                    value: String(item.anggotaId),
                  }))}
                  value={draftForm.anggotaId}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="jenis-penarikan-baru">Jenis Simpanan</label>
                <DarkSelect
                  id="jenis-penarikan-baru"
                  onChange={(value) => updateDraftField("jenisSimpananId", value)}
                  options={filteredSaldoOptions.map((item) => ({
                    label: `${item.kodeSimpanan} - ${item.namaSimpanan} | Saldo Simpanan ${toCurrency(item.saldoTersedia)}`,
                    value: String(item.jenisSimpananId),
                  }))}
                  value={draftForm.jenisSimpananId}
                />
                <small className={styles.helperText}>
                  {selectedSaldoOption
                    ? `Saldo Simpanan yang dapat ditarik: ${toCurrency(selectedSaldoOption.saldoTersedia)}`
                    : "Pilih anggota lebih dulu untuk melihat semua saldo simpanan non-penyertaan, termasuk yang nilainya masih Rp 0."}
                </small>
              </div>
              <div className={styles.field}>
                <label htmlFor="tanggal-penarikan-baru">Tanggal Pengajuan</label>
                <input
                  id="tanggal-penarikan-baru"
                  onChange={(event) => updateDraftField("tanggalPengajuan", event.target.value)}
                  type="date"
                  value={draftForm.tanggalPengajuan}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="nominal-penarikan-baru">Nominal Pengajuan</label>
                <NumericInput
                  currency
                  id="nominal-penarikan-baru"
                  onChange={(value) => updateDraftField("nominalPengajuan", value)}
                  placeholder="0"
                  value={draftForm.nominalPengajuan}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="diajukan-oleh-penarikan">Diajukan Oleh</label>
                <input
                  id="diajukan-oleh-penarikan"
                  onChange={(event) => updateDraftField("diajukanOleh", event.target.value)}
                  type="text"
                  value={draftForm.diajukanOleh}
                />
              </div>
              <div className={styles.fieldFull}>
                <label htmlFor="alasan-penarikan-baru">Alasan Penarikan</label>
                <textarea
                  id="alasan-penarikan-baru"
                  onChange={(event) => updateDraftField("alasanPenarikan", event.target.value)}
                  placeholder="Contoh: pengembalian simpanan, kebutuhan khusus, atau penutupan keanggotaan"
                  value={draftForm.alasanPenarikan}
                />
              </div>
              <div className={styles.fieldFull}>
                <label htmlFor="catatan-penarikan-baru">Catatan</label>
                <textarea
                  id="catatan-penarikan-baru"
                  onChange={(event) => updateDraftField("catatan", event.target.value)}
                  placeholder="Catatan tambahan bila diperlukan"
                  value={draftForm.catatan}
                />
              </div>
            </div>
          </fieldset>

          <div className={styles.formActions}>
            <button className={styles.saveButton} disabled={isCreatingDraft} type="submit">
              {isCreatingDraft ? "Menyimpan..." : "Simpan Draft"}
            </button>
          </div>
        </form>
      </section>
      ) : null}

      {isDataMode ? (
      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Ringkasan Penarikan</h2>
          <span>Approval dan realisasi draft pengembalian simpanan</span>
        </div>
        <div className={styles.resultSummary}>
          <div className={styles.summaryTile}>
            <span>Draft Diajukan</span>
            <strong>{summary.diajukan}</strong>
          </div>
          <div className={styles.summaryTile}>
            <span>Sudah Disetujui</span>
            <strong>{summary.disetujui}</strong>
          </div>
          <div className={styles.summaryTile}>
            <span>Sudah Direalisasi</span>
            <strong>{summary.direalisasikan}</strong>
          </div>
          <div className={styles.summaryTile}>
            <span>Nominal Draft Aktif</span>
            <strong>{toCurrency(summary.nominalDraft)}</strong>
          </div>
        </div>
      </section>
      ) : null}

      {isDataMode ? (
      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Daftar Penarikan</h2>
          <span>Kerjakan approval atau realisasi per permintaan</span>
        </div>
        <div className={styles.historyList}>
          {penarikan.length === 0 ? (
            <div className={styles.mobileEmpty}>Belum ada draft penarikan simpanan.</div>
          ) : (
            penarikan.map((item) => {
              const form = getFormState(item);
              const canApprove = item.statusPenarikan === "DIAJUKAN";
              const canFinalize = item.statusPenarikan === "DISETUJUI";
              const actionOptions = canFinalize
                ? [
                    { label: "DIREALISASIKAN", value: "DIREALISASIKAN" },
                    { label: "DIBATALKAN", value: "DIBATALKAN" },
                  ]
                : [
                    { label: "DISETUJUI", value: "DISETUJUI" },
                    { label: "DITOLAK", value: "DITOLAK" },
                    { label: "DIBATALKAN", value: "DIBATALKAN" },
                  ];

              return (
                <article className={styles.historyItem} key={item.noPenarikan}>
                  <div className={styles.historyTop}>
                    <strong>{item.noPenarikan}</strong>
                    <span className={`${styles.statusChip} ${toStatusTone(item.statusPenarikan)}`}>
                      {item.statusPenarikan}
                    </span>
                  </div>

                  <div className={styles.historyBody}>
                    <span>
                      Anggota: {item.noAnggota} - {item.namaLengkap}
                    </span>
                    <span>
                      Jenis Simpanan: {item.kodeSimpanan} - {item.jenisSimpanan}
                    </span>
                    <span>Nominal Pengajuan: {toCurrency(item.nominalPengajuan)}</span>
                    <span>
                      Nominal Disetujui: {item.nominalDisetujui ? toCurrency(item.nominalDisetujui) : "-"}
                    </span>
                    <span>Tanggal Pengajuan: {item.tanggalPengajuan ?? "-"}</span>
                    <span>Catatan: {item.catatan ?? "-"}</span>
                  </div>

                  {item.statusPenarikan === "DIREALISASIKAN" ||
                  item.statusPenarikan === "DITOLAK" ||
                  item.statusPenarikan === "DIBATALKAN" ? null : (
                  <form
                      className={styles.managementForm}
                      onSubmit={(event) => handleSubmit(event, item.noPenarikan)}
                    >
                      <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                        <legend className={styles.formSectionLegend}>Aksi</legend>
                        <div className={styles.formSectionIntro}>
                          <h2>Form Proses Penarikan</h2>
                          <span>
                            {canFinalize
                              ? "Selesaikan realisasi atau batalkan approval yang sudah ada"
                              : "Tentukan approval, penolakan, atau pembatalan permintaan"}
                          </span>
                        </div>

                        <div className={styles.gridCompact}>
                          <div className={styles.field}>
                            <label htmlFor={`status-${item.noPenarikan}`}>Aksi</label>
                            <DarkSelect
                              id={`status-${item.noPenarikan}`}
                              name="statusBaru"
                              onChange={(value) =>
                                patchForm(item.noPenarikan, {
                                  statusBaru: value as ActionState["statusBaru"],
                                })
                              }
                              options={actionOptions}
                              value={form.statusBaru}
                            />
                          </div>
                          <div className={styles.field}>
                            <label htmlFor={`tanggal-${item.noPenarikan}`}>Tanggal Proses</label>
                            <input
                              id={`tanggal-${item.noPenarikan}`}
                              onChange={(event) =>
                                patchForm(item.noPenarikan, { tanggalProses: event.target.value })
                              }
                              type="date"
                              value={form.tanggalProses}
                            />
                          </div>
                          <div className={styles.field}>
                            <label htmlFor={`nominal-${item.noPenarikan}`}>Nominal Disetujui</label>
                            <NumericInput
                              currency
                              disabled={!canApprove}
                              id={`nominal-${item.noPenarikan}`}
                              onChange={(value) =>
                                patchForm(item.noPenarikan, {
                                  nominalDisetujui: value,
                                })
                              }
                              placeholder={String(item.nominalPengajuan)}
                              value={form.nominalDisetujui}
                            />
                          </div>
                          <div className={styles.field}>
                            <label htmlFor={`oleh-${item.noPenarikan}`}>Diproses Oleh</label>
                            <input
                              id={`oleh-${item.noPenarikan}`}
                              onChange={(event) =>
                                patchForm(item.noPenarikan, { diprosesOleh: event.target.value })
                              }
                              type="text"
                              value={form.diprosesOleh}
                            />
                          </div>
                          <div className={styles.fieldFull}>
                            <label htmlFor={`catatan-${item.noPenarikan}`}>Catatan Proses</label>
                            <textarea
                              id={`catatan-${item.noPenarikan}`}
                              onChange={(event) =>
                                patchForm(item.noPenarikan, { catatan: event.target.value })
                              }
                              placeholder="Catatan approval, penolakan, atau realisasi"
                              value={form.catatan}
                            />
                          </div>
                        </div>
                      </fieldset>

                      <div className={styles.formActions}>
                        <button
                          className={
                            form.statusBaru === "DISETUJUI" || form.statusBaru === "DIREALISASIKAN"
                              ? styles.saveButton
                              : styles.deleteAction
                          }
                          disabled={activeNoPenarikan === item.noPenarikan}
                          type="submit"
                        >
                          {activeNoPenarikan === item.noPenarikan ? "Memproses..." : "Simpan Aksi"}
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
      ) : null}
    </div>
  );
}
