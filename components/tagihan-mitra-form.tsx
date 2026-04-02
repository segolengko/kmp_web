"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DarkSelect } from "@/components/dark-select";
import type { MitraPerusahaanItem } from "@/lib/tagihan-mitra-data";
import styles from "@/app/anggota/page.module.css";

type Props = {
  mode: "create" | "edit";
  initialData?: MitraPerusahaanItem | null;
};

type FormState = {
  namaPerusahaan: string;
  alamat: string;
  npwp: string;
  picNama: string;
  picJabatan: string;
  picEmail: string;
  picHp: string;
  aktif: "true" | "false";
};

function getInitialState(initialData?: MitraPerusahaanItem | null): FormState {
  return {
    namaPerusahaan: initialData?.namaPerusahaan ?? "",
    alamat: initialData?.alamat ?? "",
    npwp: initialData?.npwp ?? "",
    picNama: initialData?.picNama ?? "",
    picJabatan: initialData?.picJabatan ?? "",
    picEmail: initialData?.picEmail ?? "",
    picHp: initialData?.picHp ?? "",
    aktif: initialData?.aktif === false ? "false" : "true",
  };
}

export function TagihanMitraForm({ mode, initialData = null }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => getInitialState(initialData));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const endpoint =
    mode === "create"
      ? "/api/tagihan/mitra-perusahaan"
      : `/api/tagihan/mitra-perusahaan/${initialData?.id}`;
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
        throw new Error(result?.error ?? "Gagal menyimpan mitra perusahaan.");
      }

      router.push("/tagihan/mitra-perusahaan");
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
              <Link className={styles.back} href="/tagihan/mitra-perusahaan">
                Kembali ke daftar mitra
              </Link>
            </div>

            <div className={styles.header}>
              <h1>{mode === "create" ? "Tambah Mitra Perusahaan" : "Edit Mitra Perusahaan"}</h1>
              <p>Master ini dipakai untuk semua PT pemberi kerja, lengkap dengan PIC yang paling sering dipakai di dokumen.</p>
            </div>

            {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

            <form className={styles.formStack} onSubmit={handleSubmit}>
              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Profil Mitra</legend>
                <div className={styles.formSectionIntro}>
                  <h2>Identitas dan PIC</h2>
                  <span>Data ini nanti ditarik ke SR, penawaran, dan monitoring tagihan.</span>
                </div>
                <div className={styles.gridCompact}>
                  <div className={styles.field}>
                    <label htmlFor="namaPerusahaan">Nama Perusahaan</label>
                    <input
                      id="namaPerusahaan"
                      onChange={(event) => updateField("namaPerusahaan", event.target.value)}
                      type="text"
                      value={form.namaPerusahaan}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="npwp">NPWP</label>
                    <input
                      id="npwp"
                      onChange={(event) => updateField("npwp", event.target.value)}
                      type="text"
                      value={form.npwp}
                    />
                  </div>
                  <div className={styles.fieldFull}>
                    <label htmlFor="alamat">Alamat</label>
                    <textarea
                      id="alamat"
                      onChange={(event) => updateField("alamat", event.target.value)}
                      value={form.alamat}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="picNama">PIC Nama</label>
                    <input
                      id="picNama"
                      onChange={(event) => updateField("picNama", event.target.value)}
                      type="text"
                      value={form.picNama}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="picJabatan">PIC Jabatan</label>
                    <input
                      id="picJabatan"
                      onChange={(event) => updateField("picJabatan", event.target.value)}
                      type="text"
                      value={form.picJabatan}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="picEmail">PIC Email</label>
                    <input
                      id="picEmail"
                      onChange={(event) => updateField("picEmail", event.target.value)}
                      type="email"
                      value={form.picEmail}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="picHp">PIC No. HP</label>
                    <input
                      id="picHp"
                      onChange={(event) => updateField("picHp", event.target.value)}
                      type="text"
                      value={form.picHp}
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
                <Link className={styles.resetButton} href="/tagihan/mitra-perusahaan">
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
