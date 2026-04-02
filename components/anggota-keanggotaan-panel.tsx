"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DarkSelect } from "@/components/dark-select";
import type { AnggotaItem } from "@/lib/mock-anggota";
import type { RiwayatKeanggotaanItem } from "@/lib/keanggotaan-data";
import styles from "@/app/anggota/page.module.css";

type Props = {
  anggota: AnggotaItem;
  riwayat: RiwayatKeanggotaanItem[];
};

type ProsesKeluarResult = {
  anggota_id: number;
  riwayat_id: number;
  total_simpanan_dapat_ditarik: number;
  total_tagihan_terbuka: number;
  total_bersih_pengembalian: number;
  total_draft_terbentuk: number;
  total_nominal_pengajuan: number;
};

function toCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AnggotaKeanggotaanPanel({ anggota, riwayat }: Props) {
  const router = useRouter();
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);
  const [isSubmittingKeluar, setIsSubmittingKeluar] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [jenisAnggotaBaru, setJenisAnggotaBaru] = useState(anggota.jenisAnggota);
  const [statusAnggotaBaru, setStatusAnggotaBaru] = useState(anggota.statusAnggota);
  const [keluarResult, setKeluarResult] = useState<ProsesKeluarResult | null>(null);

  async function handlePerubahan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setIsSubmittingChange(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(
        `/api/anggota/${encodeURIComponent(anggota.noAnggota)}/keanggotaan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jenisAnggotaBaru: String(formData.get("jenisAnggotaBaru") ?? ""),
            statusAnggotaBaru: String(formData.get("statusAnggotaBaru") ?? ""),
            tanggalBerlaku: String(formData.get("tanggalBerlaku") ?? ""),
            alasanPerubahan: String(formData.get("alasanPerubahan") ?? ""),
            keterangan: String(formData.get("keterangan") ?? ""),
            dibuatOleh: String(formData.get("dibuatOleh") ?? "admin"),
          }),
        },
      );

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Perubahan keanggotaan gagal diproses.");
      }

      setMessage("Perubahan jenis/status anggota berhasil disimpan.");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi kendala saat memproses perubahan.",
      );
    } finally {
      setIsSubmittingChange(false);
    }
  }

  async function handleKeluar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setIsSubmittingKeluar(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(
        `/api/anggota/${encodeURIComponent(anggota.noAnggota)}/keluar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tanggalKeluar: String(formData.get("tanggalKeluar") ?? ""),
            alasanKeluar: String(formData.get("alasanKeluar") ?? ""),
            keterangan: String(formData.get("keteranganKeluar") ?? ""),
            dibuatOleh: String(formData.get("dibuatOlehKeluar") ?? "admin"),
          }),
        },
      );

      const result = (await response.json().catch(() => null)) as
        | { error?: string; data?: ProsesKeluarResult[] }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Proses keluar anggota gagal diproses.");
      }

      setKeluarResult(result?.data?.[0] ?? null);
      setMessage("Proses keluar anggota dan draft penarikan berhasil dibuat.");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi kendala saat memproses keluar anggota.",
      );
    } finally {
      setIsSubmittingKeluar(false);
    }
  }

  return (
    <div className={styles.managementStack}>
      {message ? <div className={styles.successBanner}>{message}</div> : null}
      {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Profil Keanggotaan</h2>
          <span>Kondisi aktif saat ini</span>
        </div>
        <div className={styles.profileSummary}>
          <div className={styles.summaryTile}>
            <span>No. Anggota</span>
            <strong>{anggota.noAnggota}</strong>
          </div>
          <div className={styles.summaryTile}>
            <span>Jenis Saat Ini</span>
            <strong>{anggota.jenisAnggota}</strong>
          </div>
          <div className={styles.summaryTile}>
            <span>Status Saat Ini</span>
            <strong>{anggota.statusAnggota}</strong>
          </div>
        </div>
      </section>

      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Ubah Jenis / Status</h2>
          <span>Catat perubahan tanpa menghapus histori</span>
        </div>
        <form className={styles.managementForm} onSubmit={handlePerubahan}>
          <div className={styles.gridCompact}>
            <div className={styles.field}>
              <label htmlFor="jenis-anggota-baru">Jenis Anggota Baru</label>
              <DarkSelect
                id="jenis-anggota-baru"
                name="jenisAnggotaBaru"
                onChange={(value) => setJenisAnggotaBaru(value as AnggotaItem["jenisAnggota"])}
                options={[
                  { label: "BIASA", value: "BIASA" },
                  { label: "LUAR_BIASA", value: "LUAR_BIASA" },
                ]}
                value={jenisAnggotaBaru}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="status-anggota-baru">Status Anggota Baru</label>
              <DarkSelect
                id="status-anggota-baru"
                name="statusAnggotaBaru"
                onChange={(value) => setStatusAnggotaBaru(value as AnggotaItem["statusAnggota"])}
                options={[
                  { label: "AKTIF", value: "AKTIF" },
                  { label: "PASIF", value: "PASIF" },
                  { label: "KELUAR", value: "KELUAR" },
                ]}
                value={statusAnggotaBaru}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="tanggal-berlaku">Tanggal Berlaku</label>
              <input id="tanggal-berlaku" name="tanggalBerlaku" type="date" />
            </div>
            <div className={styles.field}>
              <label htmlFor="dibuat-oleh">Diproses Oleh</label>
              <input defaultValue="admin" id="dibuat-oleh" name="dibuatOleh" type="text" />
            </div>
            <div className={styles.fieldFull}>
              <label htmlFor="alasan-perubahan">Alasan Perubahan</label>
              <input id="alasan-perubahan" name="alasanPerubahan" placeholder="Contoh: pindah menjadi anggota luar biasa" type="text" />
            </div>
            <div className={styles.fieldFull}>
              <label htmlFor="keterangan-perubahan">Keterangan</label>
              <textarea id="keterangan-perubahan" name="keterangan" placeholder="Catatan tambahan perubahan keanggotaan" />
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.saveButton} disabled={isSubmittingChange} type="submit">
              {isSubmittingChange ? "Memproses..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Proses Anggota Keluar</h2>
          <span>Ubah status ke keluar dan buat draft penarikan otomatis</span>
        </div>
        <form className={styles.managementForm} onSubmit={handleKeluar}>
          <div className={styles.gridCompact}>
            <div className={styles.field}>
              <label htmlFor="tanggal-keluar">Tanggal Keluar</label>
              <input id="tanggal-keluar" name="tanggalKeluar" type="date" />
            </div>
            <div className={styles.field}>
              <label htmlFor="dibuat-oleh-keluar">Diproses Oleh</label>
              <input defaultValue="admin" id="dibuat-oleh-keluar" name="dibuatOlehKeluar" type="text" />
            </div>
            <div className={styles.fieldFull}>
              <label htmlFor="alasan-keluar">Alasan Keluar</label>
              <input id="alasan-keluar" name="alasanKeluar" placeholder="Contoh: mengundurkan diri dari koperasi" type="text" />
            </div>
            <div className={styles.fieldFull}>
              <label htmlFor="keterangan-keluar">Keterangan</label>
              <textarea id="keterangan-keluar" name="keteranganKeluar" placeholder="Catatan proses keluar dan pengembalian simpanan" />
            </div>
          </div>
          <div className={styles.formActions}>
            <button
              className={styles.deleteAction}
              disabled={isSubmittingKeluar}
              type="submit"
            >
              {isSubmittingKeluar ? "Memproses..." : "Proses Keluar Lengkap"}
            </button>
          </div>
        </form>
      </section>

      {keluarResult ? (
        <section className={styles.managementCard}>
          <div className={styles.sectionHeader}>
            <h2>Ringkasan Proses Keluar</h2>
            <span>Hasil terakhir yang baru diproses</span>
          </div>
          <div className={styles.resultSummary}>
            <div className={styles.summaryTile}>
              <span>Simpanan Dapat Ditarik</span>
              <strong>{toCurrency(keluarResult.total_simpanan_dapat_ditarik)}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Tagihan Terbuka</span>
              <strong>{toCurrency(keluarResult.total_tagihan_terbuka)}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Bersih Pengembalian</span>
              <strong>{toCurrency(keluarResult.total_bersih_pengembalian)}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Total Draft</span>
              <strong>{keluarResult.total_draft_terbentuk}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Nominal Pengajuan</span>
              <strong>{toCurrency(keluarResult.total_nominal_pengajuan)}</strong>
            </div>
            <div className={styles.summaryTile}>
              <span>Riwayat Tercatat</span>
              <strong>#{keluarResult.riwayat_id}</strong>
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Riwayat Keanggotaan</h2>
          <span>Jejak perubahan status dan jenis anggota</span>
        </div>
        <div className={styles.historyList}>
          {riwayat.length === 0 ? (
            <div className={styles.mobileEmpty}>Belum ada riwayat perubahan keanggotaan.</div>
          ) : (
            riwayat.map((item) => (
              <article className={styles.historyItem} key={item.id}>
                <div className={styles.historyTop}>
                  <strong>{item.tanggalBerlaku || "-"}</strong>
                  <span>Dicatat: {item.tanggalPerubahan || "-"}</span>
                </div>
                <div className={styles.historyBody}>
                  <span>
                    Jenis: {item.jenisAnggotaLama ?? "-"} {"->"}{" "}
                    {item.jenisAnggotaBaru ?? "-"}
                  </span>
                  <span>
                    Status: {item.statusAnggotaLama ?? "-"} {"->"}{" "}
                    {item.statusAnggotaBaru ?? "-"}
                  </span>
                  <span>Alasan: {item.alasanPerubahan ?? "-"}</span>
                  <span>Catatan: {item.keterangan ?? "-"}</span>
                  <span>Oleh: {item.dibuatOleh ?? "-"}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
