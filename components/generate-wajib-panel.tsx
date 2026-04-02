"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { GenerateWajibBatchItem } from "@/lib/generate-wajib-data";
import styles from "@/app/anggota/page.module.css";

type Props = {
  batches: GenerateWajibBatchItem[];
};

type GenerateResult = {
  batch_id: number;
  periode_tahun: number;
  periode_bulan: number;
  total_anggota: number;
  total_tagihan_terbentuk: number;
  status_batch: string;
};

function toMonthInputValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function toStatusTone(status: GenerateWajibBatchItem["statusBatch"]) {
  switch (status) {
    case "SELESAI":
      return styles.statusAktif;
    case "PROSES":
    case "DRAFT":
      return styles.statusPasif;
    default:
      return styles.statusKeluar;
  }
}

export function GenerateWajibPanel({ batches }: Props) {
  const router = useRouter();
  const [tanggalProses, setTanggalProses] = useState(toMonthInputValue());
  const [dibuatOleh, setDibuatOleh] = useState("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);

  const summary = useMemo(() => {
    return {
      totalBatch: batches.length,
      batchSelesai: batches.filter((item) => item.statusBatch === "SELESAI").length,
      totalTagihan: batches.reduce((total, item) => total + item.totalTagihanTerbentuk, 0),
      totalAnggota: batches.reduce((total, item) => total + item.totalAnggota, 0),
    };
  }, [batches]);

  const existingBatch = useMemo(() => {
    const [year, month] = tanggalProses.split("-");

    return (
      batches.find(
        (item) =>
          item.periodeTahun === Number(year) &&
          item.periodeBulan === Number(month) &&
          item.statusBatch !== "DIBATALKAN",
      ) ?? null
    );
  }, [batches, tanggalProses]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (existingBatch) {
      setErrorMessage(
        `Periode ${toMonthLabel(
          existingBatch.periodeTahun,
          existingBatch.periodeBulan,
        )} sudah pernah digenerate pada batch ${existingBatch.kodeBatch}.`,
      );
      setMessage("");
      return;
    }

    setMessage("");
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const [year, month] = tanggalProses.split("-");
      const requestDate = `${year}-${month}-01`;

      const response = await fetch("/api/generate-wajib", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tanggalProses: requestDate,
          dibuatOleh,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; data?: GenerateResult[] }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Generate simpanan wajib gagal diproses.");
      }

      const nextResult = payload?.data?.[0] ?? null;
      setResult(nextResult);
      setMessage("Generate simpanan wajib berhasil dijalankan.");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi kendala saat generate simpanan wajib.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.managementStack}>
      {message ? <div className={styles.successBanner}>{message}</div> : null}
      {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}
      {existingBatch ? (
        <div className={styles.errorBanner}>
          Periode {toMonthLabel(existingBatch.periodeTahun, existingBatch.periodeBulan)} sudah
          pernah digenerate pada batch {existingBatch.kodeBatch}. Jika ingin memproses ulang,
          kosongkan dulu data generate/tagihan periode tersebut.
        </div>
      ) : null}

      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Jalankan Generate</h2>
          <span>Buat tagihan simpanan wajib untuk satu periode</span>
        </div>
        <form className={styles.managementForm} onSubmit={handleSubmit}>
          <div className={styles.gridCompact}>
            <div className={styles.field}>
              <label htmlFor="periode-generate">Periode Generate</label>
              <input
                id="periode-generate"
                onChange={(event) => setTanggalProses(event.target.value)}
                type="month"
                value={tanggalProses}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="dibuat-oleh-generate">Diproses Oleh</label>
              <input
                id="dibuat-oleh-generate"
                onChange={(event) => setDibuatOleh(event.target.value)}
                type="text"
                value={dibuatOleh}
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.saveButton} disabled={isSubmitting} type="submit">
              {isSubmitting
                ? "Memproses..."
                : existingBatch
                  ? "Periode Sudah Digenerate"
                  : "Generate Simpanan Wajib"}
            </button>
          </div>
        </form>
      </section>

      {result ? (
        <section className={styles.managementCard}>
          <div className={styles.sectionHeader}>
            <h2>Hasil Generate Terakhir</h2>
            <span>Ringkasan hasil dari proses terbaru</span>
          </div>
          <div className={styles.resultSummary}>
            <div className={styles.summaryTile}>
              <span>Periode</span>
              <strong>{toMonthLabel(result.periode_tahun, result.periode_bulan)}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Total Anggota</span>
              <strong>{result.total_anggota}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Tagihan Terbentuk</span>
              <strong>{result.total_tagihan_terbentuk}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Status Batch</span>
              <strong>{result.status_batch}</strong>
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Ringkasan Batch</h2>
          <span>Snapshot dari riwayat generate simpanan wajib</span>
        </div>
        <div className={styles.resultSummary}>
          <div className={styles.summaryTile}>
            <span>Total Batch</span>
            <strong>{summary.totalBatch}</strong>
          </div>
          <div className={styles.summaryTile}>
            <span>Batch Selesai</span>
            <strong>{summary.batchSelesai}</strong>
          </div>
          <div className={styles.summaryTile}>
            <span>Total Tagihan Terbentuk</span>
            <strong>{summary.totalTagihan}</strong>
          </div>
          <div className={styles.summaryTile}>
            <span>Total Anggota Terproses</span>
            <strong>{summary.totalAnggota}</strong>
          </div>
        </div>
      </section>

      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Riwayat Generate</h2>
          <span>Cek catatan batch, jumlah anggota, dan status proses</span>
        </div>
        <div className={styles.historyList}>
          {batches.length === 0 ? (
            <div className={styles.mobileEmpty}>Belum ada riwayat generate simpanan wajib.</div>
          ) : (
            batches.map((item) => (
              <article className={styles.historyItem} key={item.id}>
                <div className={styles.historyTop}>
                  <strong>{item.kodeBatch}</strong>
                  <span className={`${styles.statusChip} ${toStatusTone(item.statusBatch)}`}>
                    {item.statusBatch}
                  </span>
                </div>
                <div className={styles.historyBody}>
                  <span>Periode: {toMonthLabel(item.periodeTahun, item.periodeBulan)}</span>
                  <span>Tanggal Proses: {item.tanggalProses ?? "-"}</span>
                  <span>Total Anggota: {item.totalAnggota}</span>
                  <span>Tagihan Terbentuk: {item.totalTagihanTerbentuk}</span>
                  <span>Dibuat Oleh: {item.dibuatOleh ?? "-"}</span>
                  <span>Catatan: {item.catatan ?? "-"}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
