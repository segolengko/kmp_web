"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DarkSelect } from "@/components/dark-select";
import { NumericInput } from "@/components/numeric-input";
import type { JenisSimpananItem } from "@/lib/jenis-simpanan-data";
import type { PengaturanSimpananItem } from "@/lib/pengaturan-simpanan-data";
import styles from "@/app/anggota/page.module.css";

type Props = {
  mode: "create" | "edit";
  initialData?: PengaturanSimpananItem | null;
  jenisSimpananOptions: JenisSimpananItem[];
};

type FormState = {
  jenisSimpananId: string;
  segmenAnggota: "" | "BIASA_AKTIF" | "LUAR_BIASA_AKTIF" | "LUAR_BIASA_PASIF";
  namaPengaturan: string;
  nominal: string;
  berlakuMulai: string;
  berlakuSampai: string;
  aktif: "true" | "false";
  keterangan: string;
};

function getInitialState(initialData?: PengaturanSimpananItem | null): FormState {
  return {
    jenisSimpananId: String(initialData?.jenisSimpananId ?? ""),
    segmenAnggota: initialData?.segmenAnggota ?? "",
    namaPengaturan: initialData?.namaPengaturan ?? "",
    nominal: String(initialData?.nominal ?? ""),
    berlakuMulai: initialData?.berlakuMulai ?? "",
    berlakuSampai: initialData?.berlakuSampai ?? "",
    aktif: initialData?.aktif === false ? "false" : "true",
    keterangan: initialData?.keterangan ?? "",
  };
}

export function PengaturanSimpananForm({
  mode,
  initialData = null,
  jenisSimpananOptions,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => getInitialState(initialData));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const endpoint =
    mode === "create"
      ? "/api/master/pengaturan-simpanan"
      : `/api/master/pengaturan-simpanan/${initialData?.id}`;
  const method = mode === "create" ? "POST" : "PATCH";

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const selectedJenisSimpanan = jenisSimpananOptions.find(
      (item) => String(item.id) === form.jenisSimpananId,
    );

    if (selectedJenisSimpanan?.kode === "SW" && !form.segmenAnggota) {
      setErrorMessage("Untuk Simpanan Wajib, segmen anggota wajib dipilih.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(result?.error ?? "Gagal menyimpan pengaturan simpanan.");
      }

      router.push("/master/pengaturan-simpanan");
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
              <Link className={styles.back} href="/master/pengaturan-simpanan">
                Kembali ke daftar pengaturan simpanan
              </Link>
            </div>

            <div className={styles.header}>
              <h1>{mode === "create" ? "Tambah Pengaturan Simpanan" : "Edit Pengaturan Simpanan"}</h1>
              <p>Atur nominal dan periode berlaku master simpanan koperasi, baik untuk semua anggota maupun khusus per segmen keanggotaan.</p>
            </div>

            {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

            <form className={styles.formStack} onSubmit={handleSubmit}>
              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Pengaturan Simpanan</legend>
                <div className={styles.formSectionIntro}>
                  <h2>Parameter Berlaku</h2>
                  <span>Nominal, segmen anggota, dan periode aktif pengaturan</span>
                </div>
                <div className={styles.gridCompact}>
                  <div className={styles.field}>
                    <label htmlFor="jenisSimpananId">Jenis Simpanan</label>
                    <DarkSelect
                      id="jenisSimpananId"
                      onChange={(value) => updateField("jenisSimpananId", value)}
                      options={jenisSimpananOptions.map((item) => ({
                        label: `${item.kode} - ${item.nama}`,
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
                    <label htmlFor="segmenAnggota">Segmen Anggota</label>
                    <DarkSelect
                      id="segmenAnggota"
                      onChange={(value) => updateField("segmenAnggota", value as FormState["segmenAnggota"])}
                      options={[
                        { label: "Semua segmen anggota (Umum)", value: "" },
                        { label: "Anggota Biasa - Aktif", value: "BIASA_AKTIF" },
                        { label: "Anggota Luar Biasa - Aktif", value: "LUAR_BIASA_AKTIF" },
                        { label: "Anggota Luar Biasa - Pasif", value: "LUAR_BIASA_PASIF" },
                      ]}
                      value={form.segmenAnggota}
                    />
                    <small className={styles.helperText}>
                      Untuk Simpanan Wajib, pilih segmen anggota secara eksplisit agar nominal tidak terbaca sebagai pengaturan umum.
                    </small>
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
                <Link className={styles.resetButton} href="/master/pengaturan-simpanan">
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
