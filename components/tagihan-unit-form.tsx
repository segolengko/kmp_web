"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DarkSelect } from "@/components/dark-select";
import type { UnitBisnisItem } from "@/lib/tagihan-unit-data";
import styles from "@/app/anggota/page.module.css";

type Props = {
  mode: "create" | "edit";
  initialData?: UnitBisnisItem | null;
};

type FormState = {
  kodeUnit: string;
  namaUnit: string;
  aktif: "true" | "false";
};

function getInitialState(initialData?: UnitBisnisItem | null): FormState {
  return {
    kodeUnit: initialData?.kodeUnit ?? "",
    namaUnit: initialData?.namaUnit ?? "",
    aktif: initialData?.aktif === false ? "false" : "true",
  };
}

export function TagihanUnitForm({ mode, initialData = null }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => getInitialState(initialData));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const endpoint =
    mode === "create" ? "/api/tagihan/unit-bisnis" : `/api/tagihan/unit-bisnis/${initialData?.id}`;
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
        throw new Error(result?.error ?? "Gagal menyimpan unit bisnis.");
      }

      router.push("/tagihan/unit-bisnis");
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
              <Link className={styles.back} href="/tagihan/unit-bisnis">
                Kembali ke daftar unit
              </Link>
            </div>

            <div className={styles.header}>
              <h1>{mode === "create" ? "Tambah Unit Bisnis" : "Edit Unit Bisnis"}</h1>
              <p>Unit bisnis dipakai untuk membedakan jalur tagihan, monitoring, dan dokumen per unit kerja.</p>
            </div>

            {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

            <form className={styles.formStack} onSubmit={handleSubmit}>
              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Master Unit Bisnis</legend>
                <div className={styles.formSectionIntro}>
                  <h2>Data Dasar Unit</h2>
                  <span>Gunakan kode singkat yang stabil karena nanti bisa dipakai di nomor dokumen.</span>
                </div>
                <div className={styles.gridCompact}>
                  <div className={styles.field}>
                    <label htmlFor="kodeUnit">Kode Unit</label>
                    <input
                      id="kodeUnit"
                      onChange={(event) => updateField("kodeUnit", event.target.value)}
                      type="text"
                      value={form.kodeUnit}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="namaUnit">Nama Unit</label>
                    <input
                      id="namaUnit"
                      onChange={(event) => updateField("namaUnit", event.target.value)}
                      type="text"
                      value={form.namaUnit}
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
                <Link className={styles.resetButton} href="/tagihan/unit-bisnis">
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
