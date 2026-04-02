"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DarkSelect } from "@/components/dark-select";
import type { ReferensiSRItem } from "@/lib/tagihan-sr-data";
import styles from "@/app/anggota/page.module.css";

type Option = {
  value: string;
  label: string;
};

type Props = {
  mode: "create" | "edit";
  unitOptions: Option[];
  mitraOptions: Option[];
  initialData?: ReferensiSRItem | null;
};

type FormState = {
  unitBisnisId: string;
  mitraPerusahaanId: string;
  noSr: string;
  tanggalSr: string;
  deskripsi: string;
};

function getInitialState(
  initialData: ReferensiSRItem | null | undefined,
  unitOptions: Option[],
  mitraOptions: Option[],
): FormState {
  return {
    unitBisnisId: String(initialData?.unitBisnisId ?? unitOptions[0]?.value ?? ""),
    mitraPerusahaanId: String(initialData?.mitraPerusahaanId ?? mitraOptions[0]?.value ?? ""),
    noSr: initialData?.noSr ?? "",
    tanggalSr: initialData?.tanggalSr ?? new Date().toISOString().slice(0, 10),
    deskripsi: initialData?.deskripsi ?? "",
  };
}

export function TagihanSRForm({
  mode,
  unitOptions,
  mitraOptions,
  initialData = null,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => getInitialState(initialData, unitOptions, mitraOptions));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const endpoint = mode === "create" ? "/api/tagihan/sr" : `/api/tagihan/sr/${initialData?.id}`;
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
        throw new Error(result?.error ?? "Gagal menyimpan SR.");
      }

      router.push("/tagihan/sr");
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
              <Link className={styles.back} href="/tagihan/sr">
                Kembali ke daftar SR
              </Link>
            </div>

            <div className={styles.header}>
              <h1>{mode === "create" ? "Tambah Referensi SR" : "Edit Referensi SR"}</h1>
              <p>SR dicatat sebagai referensi masuk dari mitra, lalu menjadi pintu awal untuk membuat penawaran.</p>
            </div>

            {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

            <form className={styles.formStack} onSubmit={handleSubmit}>
              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Data SR</legend>
                <div className={styles.formSectionIntro}>
                  <h2>Referensi Pekerjaan</h2>
                  <span>Simpan hanya data inti supaya input cepat dan tidak berulang.</span>
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
                    <label htmlFor="mitraPerusahaanId">Mitra Perusahaan</label>
                    <DarkSelect
                      id="mitraPerusahaanId"
                      onChange={(value) => updateField("mitraPerusahaanId", value)}
                      options={mitraOptions}
                      value={form.mitraPerusahaanId}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="noSr">Nomor SR</label>
                    <input
                      id="noSr"
                      onChange={(event) => updateField("noSr", event.target.value)}
                      type="text"
                      value={form.noSr}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="tanggalSr">Tanggal SR</label>
                    <input
                      id="tanggalSr"
                      onChange={(event) => updateField("tanggalSr", event.target.value)}
                      type="date"
                      value={form.tanggalSr}
                    />
                  </div>
                  <div className={styles.fieldFull}>
                    <label htmlFor="deskripsi">Deskripsi</label>
                    <textarea
                      id="deskripsi"
                      onChange={(event) => updateField("deskripsi", event.target.value)}
                      value={form.deskripsi}
                    />
                  </div>
                </div>
              </fieldset>

              <div className={styles.formActions}>
                <Link className={styles.resetButton} href="/tagihan/sr">
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
