"use client";

import { useState } from "react";
import Link from "next/link";
import type { TagihanTimelineItem } from "@/lib/tagihan-monitoring-data";
import styles from "@/app/anggota/page.module.css";

type Props = {
  items: TagihanTimelineItem[];
};

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

function getStepClass(state: "done" | "current" | "pending") {
  if (state === "done") {
    return `${styles.workflowStep} ${styles.workflowStepDone}`;
  }

  if (state === "current") {
    return `${styles.workflowStep} ${styles.workflowStepCurrent}`;
  }

  return `${styles.workflowStep} ${styles.workflowStepPending}`;
}

export function TagihanMonitoringBoard({ items }: Props) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  if (items.length === 0) {
    return (
      <article className={styles.managementCard}>
        <p className={styles.hint}>
          Belum ada alur tagihan yang bisa divisualisasikan. Mulai dari input penawaran, lalu
          lanjutkan JO dan data tagihan.
        </p>
      </article>
    );
  }

  return (
    <div className={styles.managementStack}>
      {items.map((item) => {
        const isActive = activeId === item.id;

        return (
          <article className={`${styles.workflowCard} ${isActive ? styles.workflowCardActive : ""}`} key={item.id}>
            <button
              className={styles.workflowCardButton}
              onClick={() => setActiveId((current) => (current === item.id ? null : item.id))}
              type="button"
            >
              <div className={styles.workflowCardHeader}>
                <div className={styles.tableIdentity}>
                  <strong>
                    {item.anchorLabel}: {item.anchorNumber}
                  </strong>
                  <span>{item.perihal}</span>
                </div>
                <div className={styles.workflowCardHeaderSide}>
                  <span className={styles.summaryBadge}>Rp {formatCurrency(item.nilaiTagihan)}</span>
                  <span className={styles.workflowToggle}>{isActive ? "Tutup Detail" : "Buka Detail"}</span>
                </div>
              </div>

              <div className={styles.workflowPreviewGrid}>
                <div className={styles.summaryTile}>
                  <span>Mitra</span>
                  <strong>{item.mitraPerusahaanNama}</strong>
                </div>
                <div className={styles.summaryTile}>
                  <span>Unit</span>
                  <strong>{item.unitBisnisNama}</strong>
                </div>
                <div className={styles.summaryTile}>
                  <span>Ref Ringkas</span>
                  <strong>
                    {item.noSr}
                    <br />
                    {item.noTagihan ?? item.noPenawaran}
                  </strong>
                </div>
              </div>
            </button>

            {isActive ? (
              <div className={styles.workflowDetailPanel}>
                <div className={styles.workflowMetaGrid}>
                  <div className={styles.summaryTile}>
                    <span>SR / Penawaran / JO</span>
                    <strong>
                      {item.noSr}
                      <br />
                      {item.noPenawaran}
                      <br />
                      {item.noJo ?? "-"}
                    </strong>
                  </div>
                  <div className={styles.summaryTile}>
                    <span>No. Tagihan / JPR</span>
                    <strong>
                      {item.noTagihan ?? "-"}
                      <br />
                      {item.noJpr ?? "-"}
                    </strong>
                  </div>
                  <div className={styles.summaryTile}>
                    <span>Estimasi Cair</span>
                    <strong>{formatDate(item.estimasiCairAt)}</strong>
                  </div>
                  <div className={styles.summaryTile}>
                    <span>Pencairan</span>
                    <strong>
                      {item.pencairanTotal > 0 ? `Rp ${formatCurrency(item.pencairanTotal)}` : "-"}
                      <br />
                      {formatDate(item.pencairanTerakhirAt)}
                    </strong>
                  </div>
                </div>

                <div className={styles.workflowFlow}>
                  {item.steps.map((step, index) => (
                    <div className={styles.workflowFlowSegment} key={`${item.id}-${step.label}`}>
                      <div className={getStepClass(step.state)}>
                        <strong>{step.label}</strong>
                        <span>{step.detail}</span>
                      </div>
                      {index < item.steps.length - 1 ? <div className={styles.workflowArrow}>→</div> : null}
                    </div>
                  ))}
                </div>

                <div className={styles.workflowDocumentGrid}>
                  {item.documents.length === 0 ? (
                    <p className={styles.hint}>Belum ada dokumen tagihan yang tercatat.</p>
                  ) : (
                    item.documents.map((document) => (
                      <div className={styles.summaryTile} key={`${item.id}-${document.label}`}>
                        <span>{document.label}</span>
                        <strong>{document.nomor ?? "-"}</strong>
                        <span>{formatDate(document.tanggal)}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className={styles.workflowActionRow}>
                  <Link className={styles.editAction} href={`/tagihan/penawaran/${item.penawaranId}/edit`}>
                    Lihat Penawaran
                  </Link>
                  <span className={styles.helperText}>
                    Klik kartu untuk buka/tutup detail timeline. Form JO, tagihan, dokumen, dan pencairan bisa kita sambungkan berikutnya.
                  </span>
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
