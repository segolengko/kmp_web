"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DarkSelect } from "@/components/dark-select";
import type { PejabatTTDItem } from "@/lib/tagihan-pejabat-ttd-data";
import styles from "@/app/anggota/page.module.css";

type Props = {
  mode: "create" | "edit";
  initialData?: PejabatTTDItem | null;
  unitOptions: Array<{ value: string; label: string }>;
  mitraOptions: Array<{ value: string; label: string }>;
};

type FormState = {
  unitBisnisId: string;
  mitraPerusahaanId: string;
  modul: string;
  namaPejabat: string;
  jabatanPejabat: string;
  aktif: "true" | "false";
};

const DEFAULT_JABATAN_OPTIONS = [
  { label: "Ketua", value: "Ketua" },
  { label: "Wakil Ketua", value: "Wakil Ketua" },
  { label: "Sekretaris", value: "Sekretaris" },
  { label: "Bendahara", value: "Bendahara" },
  { label: "Manager", value: "Manager" },
  { label: "Supervisor", value: "Supervisor" },
  { label: "Job Inspector", value: "Job Inspector" },
  { label: "Section Chief", value: "Section Chief" },
  { label: "Service Department", value: "Service Department" },
  { label: "Requesting", value: "Requesting" },
  { label: "Requesting Department", value: "Requesting Department" },
  { label: "Dept Head", value: "Dept Head" },
];

function getInitialState(initialData?: PejabatTTDItem | null): FormState {
  return {
    unitBisnisId: initialData?.unitBisnisId ? String(initialData.unitBisnisId) : "",
    mitraPerusahaanId: initialData?.mitraPerusahaanId ? String(initialData.mitraPerusahaanId) : "",
    modul: initialData?.modul ?? "PENAWARAN",
    namaPejabat: initialData?.namaPejabat ?? "",
    jabatanPejabat: initialData?.jabatanPejabat ?? "",
    aktif: initialData?.aktif === false ? "false" : "true",
  };
}

export function TagihanPejabatTTDForm({ mode, initialData = null, unitOptions, mitraOptions }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => getInitialState(initialData));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const jabatanOptions = DEFAULT_JABATAN_OPTIONS.some((option) => option.value === form.jabatanPejabat)
    ? DEFAULT_JABATAN_OPTIONS
    : form.jabatanPejabat
      ? [{ label: `${form.jabatanPejabat} (Existing)`, value: form.jabatanPejabat }, ...DEFAULT_JABATAN_OPTIONS]
      : DEFAULT_JABATAN_OPTIONS;

  const endpoint =
    mode === "create" ? "/api/tagihan/pejabat-ttd" : `/api/tagihan/pejabat-ttd/${initialData?.id}`;
  const method = mode === "create" ? "POST" : "PATCH";

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
        body: JSON.stringify(form),
      });

      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Gagal menyimpan pejabat tanda tangan.");
      }

      router.push("/tagihan/pejabat-ttd");
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
              <Link className={styles.back} href="/tagihan/pejabat-ttd">
                Kembali ke daftar pejabat
              </Link>
            </div>

            <div className={styles.header}>
              <h1>{mode === "create" ? "Tambah Pejabat TTD" : "Edit Pejabat TTD"}</h1>
              <p>Master ini dipakai agar blok tanda tangan di dokumen penawaran tidak perlu diketik berulang.</p>
              <p>Setiap pejabat sekarang ditautkan ke unit bisnis, mitra, dan modul dokumen supaya pilihan tanda tangan lebih presisi.</p>
            </div>

            {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

            <form className={styles.formStack} onSubmit={handleSubmit}>
              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Master Pejabat</legend>
                <div className={styles.formSectionIntro}>
                  <h2>Identitas Penandatangan</h2>
                  <span>Simpan nama dan jabatan yang sering dipakai, nanti tinggal dipilih saat buat penawaran.</span>
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
                    <label htmlFor="mitraPerusahaanId">Mitra</label>
                    <DarkSelect
                      id="mitraPerusahaanId"
                      onChange={(value) => updateField("mitraPerusahaanId", value)}
                      options={mitraOptions}
                      value={form.mitraPerusahaanId}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="modul">Modul</label>
                    <DarkSelect
                      id="modul"
                      onChange={(value) => updateField("modul", value)}
                      options={[
                        { label: "Penawaran", value: "PENAWARAN" },
                        { label: "JCPR", value: "JCPR" },
                        { label: "Invoice", value: "INVOICE" },
                        { label: "Berita Acara", value: "BERITA_ACARA" },
                        { label: "Faktur Pajak", value: "FAKTUR_PAJAK" },
                        { label: "JPR", value: "JPR" },
                      ]}
                      value={form.modul}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="namaPejabat">Nama Pejabat</label>
                    <input
                      id="namaPejabat"
                      onChange={(event) => updateField("namaPejabat", event.target.value)}
                      type="text"
                      value={form.namaPejabat}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="jabatanPejabat">Jabatan</label>
                    <DarkSelect
                      id="jabatanPejabat"
                      onChange={(value) => updateField("jabatanPejabat", value)}
                      options={jabatanOptions}
                      value={form.jabatanPejabat}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="aktif">Status</label>
                    <DarkSelect
                      id="aktif"
                      onChange={(value) => updateField("aktif", value as FormState["aktif"])}
                      options={[
                        { label: "Aktif", value: "true" },
                        { label: "Nonaktif", value: "false" },
                      ]}
                      value={form.aktif}
                    />
                  </div>
                </div>
              </fieldset>

              <div className={styles.formActions}>
                <Link className={styles.resetButton} href="/tagihan/pejabat-ttd">
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
