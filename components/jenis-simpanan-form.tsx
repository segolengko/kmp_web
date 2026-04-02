"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DarkSelect } from "@/components/dark-select";
import { KoperasiLogo } from "@/components/koperasi-logo";
import type { JenisSimpananItem } from "@/lib/jenis-simpanan-data";
import styles from "@/app/anggota/page.module.css";

type Props = {
  mode: "create" | "edit";
  initialData?: JenisSimpananItem | null;
};

type FormState = {
  kode: string;
  nama: string;
  kategori: JenisSimpananItem["kategori"];
  frekuensi: JenisSimpananItem["frekuensi"];
  wajib: "true" | "false";
  modelPencatatan: JenisSimpananItem["modelPencatatan"];
  bolehCicil: "true" | "false";
  bisaDitarik: "true" | "false";
  nominalDefault: string;
  aktif: "true" | "false";
  keterangan: string;
};

function getInitialState(initialData?: JenisSimpananItem | null): FormState {
  return {
    kode: initialData?.kode ?? "",
    nama: initialData?.nama ?? "",
    kategori: initialData?.kategori ?? "WAJIB",
    frekuensi: initialData?.frekuensi ?? "BULANAN",
    wajib: initialData?.wajib ? "true" : "false",
    modelPencatatan: initialData?.modelPencatatan ?? "TAGIHAN",
    bolehCicil: initialData?.bolehCicil ? "true" : "false",
    bisaDitarik: initialData?.bisaDitarik ? "true" : "false",
    nominalDefault: String(initialData?.nominalDefault ?? 0),
    aktif: initialData?.aktif === false ? "false" : "true",
    keterangan: initialData?.keterangan ?? "",
  };
}

export function JenisSimpananForm({ mode, initialData = null }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => getInitialState(initialData));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const endpoint =
    mode === "create"
      ? "/api/master/jenis-simpanan"
      : `/api/master/jenis-simpanan/${initialData?.id}`;
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
        throw new Error(result?.error ?? "Gagal menyimpan jenis simpanan.");
      }

      router.push("/master/jenis-simpanan");
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
              <Link className={styles.back} href="/master/jenis-simpanan">
                Kembali ke daftar jenis simpanan
              </Link>
            </div>

            <div className={styles.header}>
              <KoperasiLogo compact iconOnly />
              <h1>{mode === "create" ? "Tambah Jenis Simpanan" : "Edit Jenis Simpanan"}</h1>
              <p>Master ini menentukan sifat dasar simpanan di seluruh modul koperasi.</p>
            </div>

            {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

            <form className={styles.formStack} onSubmit={handleSubmit}>
              <section className={styles.section}>
                <div className={styles.gridCompact}>
                  <div className={styles.field}>
                    <label htmlFor="kode">Kode</label>
                    <input id="kode" onChange={(e) => updateField("kode", e.target.value)} type="text" value={form.kode} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="nama">Nama</label>
                    <input id="nama" onChange={(e) => updateField("nama", e.target.value)} type="text" value={form.nama} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="kategori">Kategori</label>
                    <DarkSelect
                      id="kategori"
                      onChange={(value) => updateField("kategori", value as FormState["kategori"])}
                      options={[
                        { label: "POKOK", value: "POKOK" },
                        { label: "WAJIB", value: "WAJIB" },
                        { label: "SUKARELA", value: "SUKARELA" },
                        { label: "PENYERTAAN", value: "PENYERTAAN" },
                      ]}
                      value={form.kategori}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="frekuensi">Frekuensi</label>
                    <DarkSelect
                      id="frekuensi"
                      onChange={(value) => updateField("frekuensi", value as FormState["frekuensi"])}
                      options={[
                        { label: "SEKALI", value: "SEKALI" },
                        { label: "HARIAN", value: "HARIAN" },
                        { label: "MINGGUAN", value: "MINGGUAN" },
                        { label: "BULANAN", value: "BULANAN" },
                        { label: "TAHUNAN", value: "TAHUNAN" },
                        { label: "FLEKSIBEL", value: "FLEKSIBEL" },
                      ]}
                      value={form.frekuensi}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="modelPencatatan">Model Pencatatan</label>
                    <DarkSelect
                      id="modelPencatatan"
                      onChange={(value) =>
                        updateField("modelPencatatan", value as FormState["modelPencatatan"])
                      }
                      options={[
                        { label: "TAGIHAN", value: "TAGIHAN" },
                        { label: "TRANSAKSI_LANGSUNG", value: "TRANSAKSI_LANGSUNG" },
                      ]}
                      value={form.modelPencatatan}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="nominalDefault">Nominal Default</label>
                    <input
                      id="nominalDefault"
                      onChange={(e) => updateField("nominalDefault", e.target.value)}
                      type="number"
                      value={form.nominalDefault}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="wajib">Wajib</label>
                    <DarkSelect
                      id="wajib"
                      onChange={(value) => updateField("wajib", value as FormState["wajib"])}
                      options={[
                        { label: "Ya", value: "true" },
                        { label: "Tidak", value: "false" },
                      ]}
                      value={form.wajib}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="bolehCicil">Boleh Cicil</label>
                    <DarkSelect
                      id="bolehCicil"
                      onChange={(value) => updateField("bolehCicil", value as FormState["bolehCicil"])}
                      options={[
                        { label: "Ya", value: "true" },
                        { label: "Tidak", value: "false" },
                      ]}
                      value={form.bolehCicil}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="bisaDitarik">Bisa Ditarik</label>
                    <DarkSelect
                      id="bisaDitarik"
                      onChange={(value) => updateField("bisaDitarik", value as FormState["bisaDitarik"])}
                      options={[
                        { label: "Ya", value: "true" },
                        { label: "Tidak", value: "false" },
                      ]}
                      value={form.bisaDitarik}
                    />
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
                    <textarea
                      id="keterangan"
                      onChange={(e) => updateField("keterangan", e.target.value)}
                      value={form.keterangan}
                    />
                  </div>
                </div>
              </section>

              <div className={styles.formActions}>
                <Link className={styles.resetButton} href="/master/jenis-simpanan">
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
