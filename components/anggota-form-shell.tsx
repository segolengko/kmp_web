"use client";

import type { ChangeEvent, FormEvent } from "react";
import { startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DarkSelect } from "@/components/dark-select";
import type { AnggotaItem } from "@/lib/mock-anggota";
import styles from "@/app/anggota/page.module.css";

type AnggotaFormShellProps = {
  mode: "create" | "edit";
  initialData?: AnggotaItem | null;
};

type FormState = {
  noAnggota: string;
  namaLengkap: string;
  jenisKelamin: "LAKI_LAKI" | "PEREMPUAN";
  jenisAnggota: "BIASA" | "LUAR_BIASA";
  statusAnggota: "AKTIF" | "PASIF" | "KELUAR";
  nik: string;
  departemen: string;
  jabatan: string;
  tanggalMasukKerja: string;
  tanggalMasukKoperasi: string;
  noHp: string;
  email: string;
  fotoUrl: string;
  fotoStorageKey: string;
  alamat: string;
  catatan: string;
};

const JENIS_KELAMIN_OPTIONS = [
  { label: "Laki-laki", value: "LAKI_LAKI" },
  { label: "Perempuan", value: "PEREMPUAN" },
] as const;

const JENIS_ANGGOTA_OPTIONS = [
  { label: "Anggota Biasa", value: "BIASA" },
  { label: "Anggota Luar Biasa", value: "LUAR_BIASA" },
] as const;

const STATUS_ANGGOTA_OPTIONS = [
  { label: "Aktif", value: "AKTIF" },
  { label: "Pasif", value: "PASIF" },
  { label: "Keluar", value: "KELUAR" },
] as const;

function getInitial(namaLengkap?: string) {
  if (!namaLengkap) return "A";

  return namaLengkap
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((bagian) => bagian[0]?.toUpperCase())
    .join("");
}

function getInitialFormState(initialData?: AnggotaItem | null): FormState {
  return {
    noAnggota: initialData?.noAnggota ?? "",
    namaLengkap: initialData?.namaLengkap ?? "",
    jenisKelamin: initialData?.jenisKelamin ?? "LAKI_LAKI",
    jenisAnggota: initialData?.jenisAnggota ?? "BIASA",
    statusAnggota: initialData?.statusAnggota ?? "AKTIF",
    nik: initialData?.nik ?? "",
    departemen: initialData?.departemen === "-" ? "" : initialData?.departemen ?? "",
    jabatan: initialData?.jabatan === "-" ? "" : initialData?.jabatan ?? "",
    tanggalMasukKerja: initialData?.tanggalMasukKerja ?? "",
    tanggalMasukKoperasi:
      initialData?.tanggalMasukKoperasi === "-"
        ? ""
        : initialData?.tanggalMasukKoperasi ?? "",
    noHp: initialData?.noHp === "-" ? "" : initialData?.noHp ?? "",
    email: initialData?.email ?? "",
    fotoUrl: initialData?.fotoUrl ?? "",
    fotoStorageKey: initialData?.fotoStorageKey ?? "",
    alamat: initialData?.alamat ?? "",
    catatan: initialData?.catatan ?? "",
  };
}

export function AnggotaFormShell({
  mode,
  initialData = null,
}: AnggotaFormShellProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [form, setForm] = useState<FormState>(() => getInitialFormState(initialData));
  const [photoPreview, setPhotoPreview] = useState(initialData?.fotoUrl ?? "");

  const title = mode === "create" ? "Form Anggota" : "Edit Anggota";
  const description =
    mode === "create"
      ? "Form dibuat per section supaya operator bisa isi data tanpa perlu scroll panjang ke bawah."
      : "Proses edit sekarang lebih ringkas. Data dibagi per section, foto tetap terbaca, dan tombol simpan selalu dekat.";
  const submitLabel = mode === "create" ? "Simpan Anggota" : "Simpan Perubahan";
  const endpoint =
    mode === "create"
      ? "/api/anggota"
      : `/api/anggota/${encodeURIComponent(initialData?.noAnggota ?? "")}`;
  const method = mode === "create" ? "POST" : "PATCH";

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!form.noAnggota.trim()) {
      setErrorMessage("Isi No. Anggota dulu sebelum upload foto supaya file tersimpan ke anggota yang benar.");
      event.target.value = "";
      return;
    }

    const nextPreview = URL.createObjectURL(file);

    setPhotoPreview(nextPreview);
    setErrorMessage("");
    setPhotoMessage("");
    setIsUploadingPhoto(true);

    try {
      const uploadPayload = new FormData();
      uploadPayload.append("file", file);
      uploadPayload.append("noAnggota", form.noAnggota.trim());

      const response = await fetch("/api/anggota/foto", {
        method: "POST",
        body: uploadPayload,
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; publicUrl?: string; filePath?: string }
        | null;

      if (!response.ok || !result?.publicUrl) {
        throw new Error(
          result?.error ??
            "Upload foto gagal. Pastikan bucket storage dan policy Supabase sudah siap.",
        );
      }

      setForm((current) => ({
        ...current,
        fotoUrl: result.publicUrl ?? "",
        fotoStorageKey: result.filePath ?? "",
      }));
      setPhotoPreview(result.publicUrl);
      setPhotoMessage("Foto berhasil diupload dan siap disimpan ke data anggota.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi kendala saat upload foto.",
      );
    } finally {
      event.target.value = "";
      setIsUploadingPhoto(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setPhotoMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Proses simpan anggota gagal.");
      }

      startTransition(() => {
        router.push("/anggota");
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi kendala saat menyimpan data anggota.",
      );
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
              <Link className={styles.back} href="/anggota">
                Kembali ke daftar anggota
              </Link>
            </div>

            <div className={styles.header}>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>

            {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

            <form className={styles.formStack} id="anggota-form" onSubmit={handleSubmit}>
              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Identitas</legend>
                <div className={styles.formSectionIntro}>
                  <h2>Identitas Anggota</h2>
                  <span>Data dasar keanggotaan</span>
                </div>

                <div className={styles.gridCompact}>
                  <div className={styles.field}>
                    <label htmlFor="no-anggota">No. Anggota</label>
                    <input
                      id="no-anggota"
                      name="noAnggota"
                      onChange={(event) => updateField("noAnggota", event.target.value)}
                      placeholder="Contoh: AG0004"
                      type="text"
                      value={form.noAnggota}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="nama-lengkap">Nama Lengkap</label>
                    <input
                      id="nama-lengkap"
                      name="namaLengkap"
                      onChange={(event) => updateField("namaLengkap", event.target.value)}
                      placeholder="Nama lengkap anggota"
                      type="text"
                      value={form.namaLengkap}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="jenis-kelamin">Jenis Kelamin</label>
                    <DarkSelect
                      id="jenis-kelamin"
                      name="jenisKelamin"
                      onChange={(value) =>
                        updateField("jenisKelamin", value as FormState["jenisKelamin"])
                      }
                      options={[...JENIS_KELAMIN_OPTIONS]}
                      value={form.jenisKelamin}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="jenis-anggota">Jenis Anggota</label>
                    <DarkSelect
                      id="jenis-anggota"
                      name="jenisAnggota"
                      onChange={(value) =>
                        updateField("jenisAnggota", value as FormState["jenisAnggota"])
                      }
                      options={[...JENIS_ANGGOTA_OPTIONS]}
                      value={form.jenisAnggota}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="status-anggota">Status Anggota</label>
                    <DarkSelect
                      id="status-anggota"
                      name="statusAnggota"
                      onChange={(value) =>
                        updateField("statusAnggota", value as FormState["statusAnggota"])
                      }
                      options={[...STATUS_ANGGOTA_OPTIONS]}
                      value={form.statusAnggota}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="no-ktp">No. KTP</label>
                    <input
                      id="no-ktp"
                      name="nik"
                      onChange={(event) => updateField("nik", event.target.value)}
                      placeholder="16 digit nomor KTP"
                      type="text"
                      value={form.nik}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Data Kerja</legend>
                <div className={styles.formSectionIntro}>
                  <h2>Data Kerja</h2>
                  <span>Relasi anggota dengan perusahaan</span>
                </div>

                <div className={styles.gridCompact}>
                  <div className={styles.field}>
                    <label htmlFor="departemen">Departemen</label>
                    <input
                      id="departemen"
                      name="departemen"
                      onChange={(event) => updateField("departemen", event.target.value)}
                      placeholder="Finance / HR / Operasional"
                      type="text"
                      value={form.departemen}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="jabatan">Jabatan</label>
                    <input
                      id="jabatan"
                      name="jabatan"
                      onChange={(event) => updateField("jabatan", event.target.value)}
                      placeholder="Staff / Supervisor / Officer"
                      type="text"
                      value={form.jabatan}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="tgl-masuk-kerja">Tanggal Masuk Kerja</label>
                    <input
                      id="tgl-masuk-kerja"
                      name="tanggalMasukKerja"
                      onChange={(event) => updateField("tanggalMasukKerja", event.target.value)}
                      type="date"
                      value={form.tanggalMasukKerja}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="tgl-masuk-koperasi">Tanggal Masuk Koperasi</label>
                    <input
                      id="tgl-masuk-koperasi"
                      name="tanggalMasukKoperasi"
                      onChange={(event) => updateField("tanggalMasukKoperasi", event.target.value)}
                      type="date"
                      value={form.tanggalMasukKoperasi}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Kontak & Foto</legend>
                <div className={styles.formSectionIntro}>
                  <h2>Kontak & Foto</h2>
                  <span>Akses komunikasi, alamat, dan foto anggota</span>
                </div>

                <div className={styles.inlinePhotoCard}>
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={`Foto ${form.namaLengkap || "anggota"}`}
                      className={styles.profilePhoto}
                      src={photoPreview}
                    />
                  ) : (
                    <div className={styles.avatar}>{getInitial(form.namaLengkap)}</div>
                  )}
                  <div className={styles.inlinePhotoText}>
                    <strong>Preview Foto Anggota</strong>
                    <p>
                      Isi `No. Anggota` dulu, lalu upload foto. Setelah simpan, foto akan ikut
                      tersimpan dan tampil lagi di list maupun saat edit ulang.
                    </p>
                  </div>
                </div>

                <div className={styles.gridCompact}>
                  <div className={styles.field}>
                    <label htmlFor="hp">No. HP</label>
                    <input
                      id="hp"
                      name="noHp"
                      onChange={(event) => updateField("noHp", event.target.value)}
                      placeholder="08xxxxxxxxxx"
                      type="text"
                      value={form.noHp}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      name="email"
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="nama@contoh.com"
                      type="email"
                      value={form.email}
                    />
                  </div>
                  <div className={styles.fieldFull}>
                    <label htmlFor="foto-url">Foto URL</label>
                    <input
                      id="foto-url"
                      name="fotoUrlDisplay"
                      placeholder="URL foto akan terisi otomatis setelah upload"
                      readOnly
                      type="url"
                      value={form.fotoUrl}
                    />
                  </div>
                  <div className={styles.fieldFull}>
                    <label htmlFor="foto-upload">Upload Foto</label>
                    <div className={styles.uploadInline}>
                      <input
                        accept="image/png,image/jpeg,image/webp"
                        className={styles.hiddenInput}
                        id="foto-upload"
                        onChange={handlePhotoChange}
                        ref={fileInputRef}
                        type="file"
                      />
                      <button
                        className={styles.secondaryAction}
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                      >
                        {isUploadingPhoto ? "Mengupload..." : "Pilih & Upload Foto"}
                      </button>
                      {photoMessage ? (
                        <span className={styles.photoHint}>{photoMessage}</span>
                      ) : (
                        <span className={styles.photoHint}>
                          Setelah upload selesai, klik tombol simpan agar data anggota ikut
                          tersimpan penuh.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.fieldFull}>
                    <label htmlFor="alamat">Alamat</label>
                    <textarea
                      id="alamat"
                      name="alamat"
                      onChange={(event) => updateField("alamat", event.target.value)}
                      placeholder="Alamat lengkap anggota"
                      value={form.alamat}
                    />
                  </div>
                  <div className={styles.fieldFull}>
                    <label htmlFor="catatan">Catatan</label>
                    <textarea
                      id="catatan"
                      name="catatan"
                      onChange={(event) => updateField("catatan", event.target.value)}
                      placeholder="Catatan tambahan bila diperlukan"
                      value={form.catatan}
                    />
                  </div>
                </div>
              </fieldset>

              <div className={styles.formActions}>
                <Link className={styles.resetButton} href="/anggota">
                  Batal
                </Link>
                <button
                  className={styles.saveButton}
                  disabled={isSubmitting || isUploadingPhoto}
                  type="submit"
                >
                  {isUploadingPhoto
                    ? "Menunggu Upload Foto..."
                    : isSubmitting
                      ? "Menyimpan..."
                      : submitLabel}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
