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
};

type FormState = {
  namaPejabat: string;
  jabatanPejabat: string;
  aktif: "true" | "false";
};

function getInitialState(initialData?: PejabatTTDItem | null): FormState {
  return {
    namaPejabat: initialData?.namaPejabat ?? "",
    jabatanPejabat: initialData?.jabatanPejabat ?? "",
    aktif: initialData?.aktif === false ? "false" : "true",
  };
}

export function TagihanPejabatTTDForm({ mode, initialData = null }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => getInitialState(initialData));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
                    <input
                      id="jabatanPejabat"
                      onChange={(event) => updateField("jabatanPejabat", event.target.value)}
                      type="text"
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
