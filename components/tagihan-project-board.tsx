"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MasterDeleteButton } from "@/components/master-delete-button";
import type { TagihanProjectListItem } from "@/lib/tagihan-project-data";
import styles from "@/app/anggota/page.module.css";

type Props = {
  items: TagihanProjectListItem[];
};

type TimelineStepKey =
  | "penawaran"
  | "jo"
  | "jcpr"
  | "invoice"
  | "beritaAcara"
  | "fakturPajak"
  | "jpr"
  | "pencairan";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

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
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function getStepState(item: TagihanProjectListItem, step: TimelineStepKey, activeStep: TimelineStepKey) {
  if (stepDone(item, step)) {
    return "done" as const;
  }

  if (activeStep === step) {
    return "active" as const;
  }

  return "pending" as const;
}

function TimelineStepIcon({ state }: { state: "done" | "active" | "pending" }) {
  if (state === "done") {
    return (
      <span className={`${styles.timelineStatusIcon} ${styles.timelineStatusIconDone}`} aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" />
          <path d="M6 10.2 8.6 12.8 14 7.4" />
        </svg>
      </span>
    );
  }

  if (state === "active") {
    return (
      <span className={`${styles.timelineStatusIcon} ${styles.timelineStatusIconActive}`} aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" />
          <path d="M10 5.7v4.7l3 1.8" />
        </svg>
      </span>
    );
  }

  return (
    <span className={`${styles.timelineStatusIcon} ${styles.timelineStatusIconPending}`} aria-hidden="true">
      <svg viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" />
      </svg>
    </span>
  );
}

function stepDone(item: TagihanProjectListItem, step: TimelineStepKey) {
  switch (step) {
    case "penawaran":
      return Boolean(item.noPenawaran);
    case "jo":
      return Boolean(item.noJo);
    case "jcpr":
      return Boolean(item.noJcpr);
    case "invoice":
      return Boolean(item.noInvoice);
    case "beritaAcara":
      return Boolean(item.noBeritaAcara);
    case "fakturPajak":
      return Boolean(item.noFakturPajak);
    case "jpr":
      return Boolean(item.noJpr);
    case "pencairan":
      return Boolean(item.pencairanTanggal);
  }
}

export function TagihanProjectBoard({ items }: Props) {
  const router = useRouter();
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<TimelineStepKey>("penawaran");
  const timelineRows: TimelineStepKey[][] = [
    ["penawaran", "jo", "jcpr", "invoice"],
    ["beritaAcara", "fakturPajak", "jpr", "pencairan"],
  ];

  const stepLabels: Record<TimelineStepKey, string> = {
    penawaran: "Penawaran",
    jo: "JO",
    jcpr: "JCPR",
    invoice: "Invoice",
    beritaAcara: "Berita Acara",
    fakturPajak: "Faktur Pajak",
    jpr: "JPR",
    pencairan: "Pencairan",
  };

  function getStepValue(item: TagihanProjectListItem, step: TimelineStepKey) {
    if (step === "penawaran") return item.noPenawaran || "-";
    if (step === "jo") return item.noJo || "-";
    if (step === "jcpr") return item.noJcpr || "-";
    if (step === "invoice") return item.noInvoice || "-";
    if (step === "beritaAcara") return item.noBeritaAcara || "-";
    if (step === "fakturPajak") return item.noFakturPajak || "-";
    if (step === "jpr") return item.noJpr || "-";
    return item.pencairanTanggal ? formatDate(item.pencairanTanggal) : "-";
  }

  function getWorkflowPath(item: TagihanProjectListItem, step: TimelineStepKey) {
    if (step === "jo") return `/tagihan/tagihan-project/${item.id}/workflow/jo`;
    if (step === "jcpr") return `/tagihan/tagihan-project/${item.id}/workflow/jcpr`;
    if (step === "invoice") return `/tagihan/tagihan-project/${item.id}/workflow/invoice`;
    if (step === "beritaAcara") return `/tagihan/tagihan-project/${item.id}/workflow/berita-acara`;
    if (step === "fakturPajak") return `/tagihan/tagihan-project/${item.id}/workflow/faktur-pajak`;
    if (step === "jpr") return `/tagihan/tagihan-project/${item.id}/workflow/jpr`;
    if (step === "pencairan") return `/tagihan/tagihan-project/${item.id}/workflow/pencairan`;
    return `/tagihan/tagihan-project/${item.id}`;
  }

  function openProcessForm(item: TagihanProjectListItem, step: TimelineStepKey) {
    if (step === "penawaran") {
      router.push(`/tagihan/penawaran/tambah?tagihanId=${item.id}`);
      return;
    }

    router.push(getWorkflowPath(item, step));
  }

  function toggleDetails(itemId: number) {
    setActiveCardId((current) => (current === itemId ? null : itemId));
    setActiveStep("penawaran");
  }

  if (items.length === 0) {
    return (
      <article className={styles.managementCard}>
        <p className={styles.hint}>Belum ada data tagihan. Buat record tagihan dulu, lalu timeline prosesnya akan muncul di sini.</p>
      </article>
    );
  }

  return (
    <div className={styles.managementStack}>
      {items.map((item) => {
        const isActive = activeCardId === item.id;
        const isReadOnly = item.statusTagihan === "TERBAYAR";

        return (
          <article className={`${styles.workflowCard} ${isActive ? styles.workflowCardActive : ""}`} key={item.id}>
            <div className={styles.workflowCardButton}>
              <div className={styles.workflowCardHeader}>
                <div className={styles.tableIdentity}>
                  <strong>{item.unitBisnisNama}</strong>
                  <span>Unit Bisnis</span>
                </div>
                <div className={styles.workflowCardHeaderSide}>
                  <span className={styles.summaryBadge}>{formatStatusLabel(item.statusTagihan)}</span>
                </div>
              </div>

              <div className={styles.workflowPreviewGrid}>
                <div className={styles.workflowPreviewItem}>
                  <span>Nama Tagihan</span>
                  <strong>{item.namaTagihan || "-"}</strong>
                  <p className={styles.summaryMeta}>{item.noTagihan}</p>
                </div>
                <div className={styles.workflowPreviewItem}>
                  <span>Tanggal</span>
                  <strong>{formatDate(item.tanggalTagihan)}</strong>
                </div>
                <div className={styles.workflowPreviewItem}>
                  <span>Nilai Total</span>
                  <strong>Rp {formatCurrency(item.nilaiTotal)}</strong>
                </div>
                <div className={styles.workflowPreviewItem}>
                  <span>Status Tagihan</span>
                  <strong>{formatStatusLabel(item.statusTagihan)}</strong>
                  <div className={styles.rowActions}>
                    {isReadOnly ? (
                      <span className={`${styles.editAction} ${styles.actionReadonly}`}>Edit Header</span>
                    ) : (
                      <Link className={styles.editAction} href={`/tagihan/tagihan-project/${item.id}/edit`}>
                        Edit Header
                      </Link>
                    )}
                    <MasterDeleteButton
                      deleteUrl={`/api/tagihan/tagihan-project/${item.id}`}
                      entityLabel="tagihan"
                      entityName={item.noTagihan}
                    />
                    <button
                      className={styles.secondaryInlineAction}
                      onClick={() => toggleDetails(item.id)}
                      type="button"
                    >
                      {isActive ? "Tutup Details" : "Details"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {isActive ? (
              <div className={styles.workflowDetailPanel}>
                <div className={styles.timelineBoard}>
                  {timelineRows.map((row, rowIndex) => (
                    <div className={styles.timelineRow} key={`${item.id}-row-${rowIndex}`}>
                      {row.map((step, index) => {
                        const state = getStepState(item, step, activeStep);
                        const isDone = state === "done";
                        return (
                        <div className={styles.timelineNodeWrap} key={`${item.id}-${step}`}>
                          <button
                            className={`${styles.timelineNode} ${state === "active" ? styles.timelineNodeActive : ""} ${isDone ? styles.timelineNodeDone : ""} ${state === "pending" ? styles.timelineNodePending : ""}`}
                            onClick={() => setActiveStep(step)}
                            type="button"
                          >
                            <div className={styles.timelineNodeTop}>
                              <TimelineStepIcon state={state} />
                              <strong>{stepLabels[step]}</strong>
                            </div>
                            <span>{getStepValue(item, step)}</span>
                          </button>
                          {index < row.length - 1 ? (
                            <div className={`${styles.timelineConnector} ${isDone ? styles.timelineConnectorDone : ""}`} aria-hidden="true">
                              <span className={styles.timelineConnectorLine} />
                              <span className={styles.timelineConnectorIcon}>
                                <svg viewBox="0 0 24 24" fill="none">
                                  <path d="M5 12h12" />
                                  <path d="m13 7 5 5-5 5" />
                                </svg>
                              </span>
                            </div>
                          ) : null}
                        </div>
                      )})}
                    </div>
                  ))}
                </div>

                <div className={styles.timelineEditor}>
                  <div className={styles.workflowActionRow}>
                    <div className={styles.sectionHeader}>
                      <h2>Proses {stepLabels[activeStep]}</h2>
                      <span>
                        {isReadOnly
                          ? "Tagihan sudah terbayar, jadi perubahan data dikunci. Cetak tetap bisa dipakai."
                          : "Klik step lalu buka form prosesnya."}
                      </span>
                    </div>
                  </div>

                  <div className={styles.managementCard}>
                    <div className={styles.sectionHeader}>
                      <h2>{stepLabels[activeStep]}</h2>
                      <span>{getStepValue(item, activeStep)}</span>
                    </div>
                    <p className={styles.hint}>
                      {activeStep === "penawaran"
                        ? "Step ini akan membuka form Penawaran yang proper, bukan edit mini di dalam timeline."
                        : "Step ini sudah memakai form proses sendiri. Setelah disimpan, nomor dan statusnya akan kembali mengisi Data Tagihan."}
                    </p>
                    <div className={styles.workflowActionRow}>
                      {activeStep === "penawaran" ? (
                        <div className={styles.rowActions}>
                          <button
                            className={styles.saveButton}
                            disabled={isReadOnly}
                            onClick={() => openProcessForm(item, activeStep)}
                            type="button"
                          >
                            Tambah Penawaran
                          </button>
                          {item.penawaranId && isReadOnly ? (
                            <span className={`${styles.editAction} ${styles.actionReadonly}`}>Edit</span>
                          ) : null}
                          {item.penawaranId && !isReadOnly ? (
                            <Link
                              className={styles.editAction}
                              href={`/tagihan/penawaran/${item.penawaranId}/edit?tagihanId=${item.id}`}
                            >
                              Edit
                            </Link>
                          ) : null}
                          {item.penawaranId ? (
                            <Link
                              className={styles.secondaryAction}
                              href={`/tagihan/penawaran/${item.penawaranId}/cetak`}
                              target="_blank"
                            >
                              Cetak
                            </Link>
                          ) : null}
                        </div>
                      ) : (
                        <div className={styles.rowActions}>
                          <button
                            className={styles.saveButton}
                            disabled={isReadOnly}
                            onClick={() => openProcessForm(item, activeStep)}
                            type="button"
                          >
                            {`Tambah ${stepLabels[activeStep]}`}
                          </button>
                          {isReadOnly ? (
                            <span className={`${styles.editAction} ${styles.actionReadonly}`}>Edit</span>
                          ) : (
                            <Link className={styles.editAction} href={getWorkflowPath(item, activeStep)}>
                              Edit
                            </Link>
                          )}
                          <Link
                            className={styles.secondaryAction}
                            href={`${getWorkflowPath(item, activeStep)}/cetak`}
                            target="_blank"
                          >
                            Cetak
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
