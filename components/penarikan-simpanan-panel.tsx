"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DarkSelect } from "@/components/dark-select";
import type { PenarikanItem } from "@/lib/penarikan-data";
import styles from "@/app/anggota/page.module.css";

type Props = {
  penarikan: PenarikanItem[];
};

type ActionState = {
  statusBaru: "DISETUJUI" | "DITOLAK" | "DIBATALKAN" | "DIREALISASIKAN";
  tanggalProses: string;
  nominalDisetujui: string;
  catatan: string;
  diprosesOleh: string;
};

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

export function PenarikanSimpananPanel({ penarikan }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeNoPenarikan, setActiveNoPenarikan] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, ActionState>>({});

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
                          <input
                            disabled={!canApprove}
                            id={`nominal-${item.noPenarikan}`}
                            onChange={(event) =>
                              patchForm(item.noPenarikan, {
                                nominalDisetujui: event.target.value,
                              })
                            }
                            placeholder={String(item.nominalPengajuan)}
                            type="number"
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
    </div>
  );
}
