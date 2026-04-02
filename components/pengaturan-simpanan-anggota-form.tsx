"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DarkSelect } from "@/components/dark-select";
import { NumericInput } from "@/components/numeric-input";
import type { PengaturanSimpananAnggotaItem } from "@/lib/pengaturan-simpanan-anggota-data";
import styles from "@/app/anggota/page.module.css";

type Option = {
  id: number;
  label: string;
};

type Props = {
  mode: "create" | "edit";
  initialData?: PengaturanSimpananAnggotaItem | null;
  anggotaOptions: Option[];
  jenisSimpananOptions: Option[];
};

type FormState = {
  anggotaId: string;
  jenisSimpananId: string;
  namaPengaturan: string;
  nominal: string;
  berlakuMulai: string;
  berlakuSampai: string;
  aktif: "true" | "false";
  keterangan: string;
};

function getInitialState(initialData?: PengaturanSimpananAnggotaItem | null): FormState {
  return {
    anggotaId: String(initialData?.anggotaId ?? ""),
    jenisSimpananId: String(initialData?.jenisSimpananId ?? ""),
    namaPengaturan: initialData?.namaPengaturan ?? "",
    nominal: String(initialData?.nominal ?? ""),
    berlakuMulai: initialData?.berlakuMulai ?? "",
    berlakuSampai: initialData?.berlakuSampai ?? "",
    aktif: initialData?.aktif === false ? "false" : "true",
    keterangan: initialData?.keterangan ?? "",
  };
}

export function PengaturanSimpananAnggotaForm({
  mode,
  initialData = null,
  anggotaOptions,
  jenisSimpananOptions,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => getInitialState(initialData));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const endpoint =
    mode === "create"
      ? "/api/master/pengaturan-simpanan-anggota"
      : `/api/master/pengaturan-simpanan-anggota/${initialData?.id}`;
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
        throw new Error(result?.error ?? "Gagal menyimpan pengaturan simpanan anggota.");
      }

      router.push("/master/pengaturan-simpanan-anggota");
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
              <Link className={styles.back} href="/master/pengaturan-simpanan-anggota">
                Kembali ke daftar pengaturan anggota
              </Link>
            </div>

            <div className={styles.header}>
              <h1>{mode === "create" ? "Tambah Pengaturan Simpanan Anggota" : "Edit Pengaturan Simpanan Anggota"}</h1>
              <p>Atur nominal wajib variabel per anggota sesuai keputusan koperasi.</p>
            </div>

            {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

            <form className={styles.formStack} onSubmit={handleSubmit}>
              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Pengaturan per Anggota</legend>
                <div className={styles.formSectionIntro}>
                  <h2>Parameter Anggota</h2>
                  <span>Pilih anggota, jenis simpanan, nominal, dan periode pengaturan</span>
                </div>
                <div className={styles.gridCompact}>
                  <div className={styles.field}>
                    <label htmlFor="anggotaId">Anggota</label>
                    <DarkSelect
                      id="anggotaId"
                      onChange={(value) => updateField("anggotaId", value)}
                      options={anggotaOptions.map((item) => ({
                        label: item.label,
                        value: String(item.id),
                      }))}
                      value={form.anggotaId}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="jenisSimpananId">Jenis Simpanan</label>
                    <DarkSelect
                      id="jenisSimpananId"
                      onChange={(value) => updateField("jenisSimpananId", value)}
                      options={jenisSimpananOptions.map((item) => ({
                        label: item.label,
                        value: String(item.id),
                      }))}
                      value={form.jenisSimpananId}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="namaPengaturan">Nama Pengaturan</label>
                    <input id="namaPengaturan" onChange={(e) => updateField("namaPengaturan", e.target.value)} type="text" value={form.namaPengaturan} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="nominal">Nominal</label>
                    <NumericInput
                      currency
                      id="nominal"
                      onChange={(value) => updateField("nominal", value)}
                      value={form.nominal}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="berlakuMulai">Berlaku Mulai</label>
                    <input id="berlakuMulai" onChange={(e) => updateField("berlakuMulai", e.target.value)} type="date" value={form.berlakuMulai} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="berlakuSampai">Berlaku Sampai</label>
                    <input id="berlakuSampai" onChange={(e) => updateField("berlakuSampai", e.target.value)} type="date" value={form.berlakuSampai} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="aktif">Aktif</label>
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
                  <div className={styles.fieldFull}>
                    <label htmlFor="keterangan">Keterangan</label>
                    <textarea id="keterangan" onChange={(e) => updateField("keterangan", e.target.value)} value={form.keterangan} />
                  </div>
                </div>
              </fieldset>

              <div className={styles.formActions}>
                <Link className={styles.resetButton} href="/master/pengaturan-simpanan-anggota">
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
