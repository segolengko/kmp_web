"use client";

import type { FormEvent } from "react";
import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DarkSelect } from "@/components/dark-select";
import type {
  JenisSimpananOption,
  PembayaranOption,
  TagihanTerbukaItem,
  TransaksiSimpananItem,
} from "@/lib/pembayaran-simpanan-data";
import styles from "@/app/anggota/page.module.css";

type Props = {
  anggotaOptions: PembayaranOption[];
  jenisSimpananOptions: JenisSimpananOption[];
  tagihanTerbuka: TagihanTerbukaItem[];
  transaksiTerbaru: TransaksiSimpananItem[];
};

type FormState = {
  model: "TAGIHAN" | "TRANSAKSI_LANGSUNG";
  noAnggota: string;
  kodeSimpanan: string;
  tanggalTransaksi: string;
  nominal: string;
  metodeBayar: string;
  tipeTransaksi: "SETOR" | "TARIK" | "KOREKSI_MASUK" | "KOREKSI_KELUAR";
  keterangan: string;
  dibuatOleh: string;
};

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function toCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeLookup(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function PembayaranSimpananPanel({
  anggotaOptions,
  jenisSimpananOptions,
  tagihanTerbuka,
  transaksiTerbaru,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const initialNoAnggota = anggotaOptions[0]?.noAnggota ?? "";
  const initialSelectedAnggota =
    anggotaOptions.find((item) => item.noAnggota === initialNoAnggota) ?? null;
  const [form, setForm] = useState<FormState>({
    model: "TAGIHAN",
    noAnggota: initialNoAnggota,
    kodeSimpanan:
      jenisSimpananOptions.find((item) => item.modelPencatatan === "TAGIHAN")?.kode ??
      jenisSimpananOptions[0]?.kode ??
      "",
    tanggalTransaksi: todayValue(),
    nominal: "",
    metodeBayar: "TRANSFER",
    tipeTransaksi: "SETOR",
    keterangan: "",
    dibuatOleh: "admin",
  });
  const [anggotaQuery, setAnggotaQuery] = useState(
    initialSelectedAnggota
      ? `${initialSelectedAnggota.noAnggota} - ${initialSelectedAnggota.namaLengkap}`
      : "",
  );
  const deferredAnggotaQuery = useDeferredValue(anggotaQuery);

  const filteredJenisOptions = useMemo(() => {
    return jenisSimpananOptions.filter((item) => item.modelPencatatan === form.model);
  }, [form.model, jenisSimpananOptions]);

  const selectedJenisSimpanan = useMemo(() => {
    return jenisSimpananOptions.find((item) => item.kode === form.kodeSimpanan) ?? null;
  }, [form.kodeSimpanan, jenisSimpananOptions]);

  const filteredAnggotaOptions = useMemo(() => {
    const keyword = deferredAnggotaQuery.trim().toLowerCase();

    if (!keyword) {
      return anggotaOptions.slice(0, 8);
    }

    return anggotaOptions
      .filter((item) => {
        const directLabel = `${item.noAnggota} - ${item.namaLengkap}`;
        const compactLabel = `${item.noAnggota} ${item.namaLengkap}`;
        const normalizedKeyword = normalizeLookup(keyword);

        return (
          item.noAnggota.toLowerCase().includes(keyword) ||
          item.namaLengkap.toLowerCase().includes(keyword) ||
          directLabel.toLowerCase().includes(keyword) ||
          normalizeLookup(compactLabel).includes(normalizedKeyword)
        );
      })
      .slice(0, 8);
  }, [anggotaOptions, deferredAnggotaQuery]);

  const selectedAnggota = useMemo(() => {
    return anggotaOptions.find((item) => item.noAnggota === form.noAnggota) ?? null;
  }, [anggotaOptions, form.noAnggota]);

  const selectedAnggotaLabel = selectedAnggota
    ? `${selectedAnggota.noAnggota} - ${selectedAnggota.namaLengkap}`
    : "";

  const isSelectedLookup =
    !!selectedAnggota &&
    normalizeLookup(anggotaQuery) === normalizeLookup(selectedAnggotaLabel);
  const showAnggotaLookupMenu = !isSelectedLookup && anggotaQuery.trim().length > 0;

  const summary = useMemo(() => {
    return {
      totalTagihanTerbuka: tagihanTerbuka.length,
      totalNominalTagihan: tagihanTerbuka.reduce((total, item) => total + item.sisaTagihan, 0),
      totalTransaksi: transaksiTerbaru.length,
      totalNominalTransaksi: transaksiTerbaru.reduce((total, item) => total + item.nominal, 0),
    };
  }, [tagihanTerbuka, transaksiTerbaru]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "model") {
        const nextJenis =
          jenisSimpananOptions.find((item) => item.modelPencatatan === value)?.kode ?? "";
        next.kodeSimpanan = nextJenis;
        next.metodeBayar = value === "TAGIHAN" ? "TRANSFER" : "TUNAI";
        next.tipeTransaksi = "SETOR";
      }

      if (field === "kodeSimpanan") {
        const selectedJenis = jenisSimpananOptions.find((item) => item.kode === value);

        if (selectedJenis) {
          next.model = selectedJenis.modelPencatatan;
          next.metodeBayar = selectedJenis.modelPencatatan === "TAGIHAN" ? "TRANSFER" : "TUNAI";
          next.tipeTransaksi = "SETOR";
        }
      }

      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!form.noAnggota) {
      setErrorMessage("Pilih anggota dulu dari hasil pencarian sebelum menyimpan pembayaran.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/pembayaran-simpanan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Pembayaran simpanan gagal diproses.");
      }

      setMessage(
        form.model === "TAGIHAN"
          ? "Pembayaran tagihan berhasil dicatat dan dialokasikan."
          : "Transaksi simpanan langsung berhasil dicatat.",
      );
      setForm((current) => ({
        ...current,
        nominal: "",
        keterangan: "",
      }));
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi kendala saat memproses pembayaran.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAnggotaQueryChange(value: string) {
    setAnggotaQuery(value);

    if (selectedAnggota && normalizeLookup(value) !== normalizeLookup(selectedAnggotaLabel)) {
      setForm((current) => ({ ...current, noAnggota: "" }));
    }
  }

  function handleSelectAnggota(option: PembayaranOption) {
    setForm((current) => ({ ...current, noAnggota: option.noAnggota }));
    setAnggotaQuery(`${option.noAnggota} - ${option.namaLengkap}`);
  }

  return (
    <div className={styles.managementStack}>
      {message ? <div className={styles.successBanner}>{message}</div> : null}
      {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Input Pembayaran</h2>
          <span>Bayar tagihan atau catat transaksi simpanan langsung</span>
        </div>
        <form className={styles.managementForm} onSubmit={handleSubmit}>
          <div className={styles.gridCompact}>
            <div className={styles.field}>
              <label htmlFor="model-pembayaran">Model</label>
              <DarkSelect
                id="model-pembayaran"
                onChange={(value) => updateField("model", value as FormState["model"])}
                options={[
                  { label: "Pembayaran Tagihan", value: "TAGIHAN" },
                  { label: "Transaksi Langsung", value: "TRANSAKSI_LANGSUNG" },
                ]}
                value={form.model}
              />
              <small className={styles.helperText}>
                {form.model === "TAGIHAN"
                  ? "Pakai model ini untuk melunasi tagihan yang sudah tergenerate. Khusus SW, sisa bayar di atas tagihan terbuka akan masuk titipan."
                  : "Pakai model ini hanya untuk setor atau tarik simpanan non-tagihan seperti SS/SP."}
              </small>
            </div>
            <div className={styles.field}>
              <label htmlFor="anggota-pembayaran">Anggota</label>
              <div className={styles.lookupField}>
                <input
                  id="anggota-pembayaran"
                  autoComplete="off"
                  onChange={(event) => handleAnggotaQueryChange(event.target.value)}
                  placeholder="Cari no anggota atau nama anggota"
                  type="text"
                  value={anggotaQuery}
                />
                {showAnggotaLookupMenu ? (
                  <div className={styles.lookupMenu}>
                    {filteredAnggotaOptions.length === 0 ? (
                      <div className={styles.lookupEmpty}>Anggota tidak ditemukan.</div>
                    ) : (
                      filteredAnggotaOptions.map((item) => (
                        <button
                          className={`${styles.lookupOption} ${
                            item.noAnggota === form.noAnggota ? styles.lookupOptionActive : ""
                          }`}
                          key={item.noAnggota}
                          onClick={() => handleSelectAnggota(item)}
                          type="button"
                        >
                          <strong>{item.noAnggota}</strong>
                          <span>{item.namaLengkap}</span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
              <small className={styles.helperText}>
                {selectedAnggota
                  ? `Terpilih: ${selectedAnggotaLabel}`
                  : "Ketik no anggota atau nama, lalu pilih hasil yang sesuai."}
              </small>
            </div>
            <div className={styles.field}>
              <label htmlFor="jenis-simpanan-pembayaran">Jenis Simpanan</label>
              <DarkSelect
                id="jenis-simpanan-pembayaran"
                onChange={(value) => updateField("kodeSimpanan", value)}
                options={filteredJenisOptions.map((item) => ({
                  label: `${item.kode} - ${item.nama}`,
                  value: item.kode,
                }))}
                value={form.kodeSimpanan}
              />
              <small className={styles.helperText}>
                {selectedJenisSimpanan
                  ? selectedJenisSimpanan.modelPencatatan === "TAGIHAN"
                    ? `${selectedJenisSimpanan.kode} diproses sebagai pembayaran tagihan.`
                    : `${selectedJenisSimpanan.kode} diproses sebagai transaksi simpanan langsung.`
                  : "Pilih jenis simpanan yang ingin diproses."}
              </small>
            </div>
            <div className={styles.field}>
              <label htmlFor="tanggal-transaksi-pembayaran">Tanggal</label>
              <input
                id="tanggal-transaksi-pembayaran"
                onChange={(event) => updateField("tanggalTransaksi", event.target.value)}
                type="date"
                value={form.tanggalTransaksi}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="nominal-pembayaran">Nominal</label>
              <input
                id="nominal-pembayaran"
                onChange={(event) => updateField("nominal", event.target.value)}
                placeholder="0"
                type="number"
                value={form.nominal}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="metode-bayar-pembayaran">Metode Bayar</label>
              <DarkSelect
                id="metode-bayar-pembayaran"
                onChange={(value) => updateField("metodeBayar", value)}
                options={[
                  { label: "TUNAI", value: "TUNAI" },
                  { label: "TRANSFER", value: "TRANSFER" },
                  { label: "POTONG_GAJI", value: "POTONG_GAJI" },
                ]}
                value={form.metodeBayar}
              />
            </div>
            {form.model === "TRANSAKSI_LANGSUNG" ? (
              <div className={styles.field}>
                <label htmlFor="tipe-transaksi-pembayaran">Tipe Transaksi</label>
                <DarkSelect
                  id="tipe-transaksi-pembayaran"
                  onChange={(value) =>
                    updateField("tipeTransaksi", value as FormState["tipeTransaksi"])
                  }
                  options={[
                    { label: "SETOR", value: "SETOR" },
                    { label: "TARIK", value: "TARIK" },
                    { label: "KOREKSI_MASUK", value: "KOREKSI_MASUK" },
                    { label: "KOREKSI_KELUAR", value: "KOREKSI_KELUAR" },
                  ]}
                  value={form.tipeTransaksi}
                />
              </div>
            ) : null}
            <div className={styles.field}>
              <label htmlFor="dibuat-oleh-pembayaran">Diproses Oleh</label>
              <input
                id="dibuat-oleh-pembayaran"
                onChange={(event) => updateField("dibuatOleh", event.target.value)}
                type="text"
                value={form.dibuatOleh}
              />
            </div>
            <div className={styles.fieldFull}>
              <label htmlFor="keterangan-pembayaran">Keterangan</label>
              <textarea
                id="keterangan-pembayaran"
                onChange={(event) => updateField("keterangan", event.target.value)}
                placeholder="Catatan pembayaran atau transaksi"
                value={form.keterangan}
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button className={styles.saveButton} disabled={isSubmitting} type="submit">
              {isSubmitting ? "Memproses..." : "Simpan Pembayaran"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Ringkasan Operasional</h2>
          <span>Snapshot tagihan terbuka dan transaksi terbaru</span>
        </div>
        <div className={styles.resultSummary}>
          <div className={styles.summaryTile}>
            <span>Tagihan Terbuka</span>
            <strong>{summary.totalTagihanTerbuka}</strong>
          </div>
          <div className={styles.summaryTile}>
            <span>Total Sisa Tagihan</span>
            <strong>{toCurrency(summary.totalNominalTagihan)}</strong>
          </div>
          <div className={styles.summaryTile}>
            <span>Transaksi Terbaru</span>
            <strong>{summary.totalTransaksi}</strong>
          </div>
          <div className={styles.summaryTile}>
            <span>Total Nominal Transaksi</span>
            <strong>{toCurrency(summary.totalNominalTransaksi)}</strong>
          </div>
        </div>
      </section>

      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Tagihan Terbuka</h2>
          <span>Referensi cepat sebelum pembayaran diproses</span>
        </div>
        <div className={styles.historyList}>
          {tagihanTerbuka.length === 0 ? (
            <div className={styles.mobileEmpty}>Tidak ada tagihan terbuka saat ini.</div>
          ) : (
            tagihanTerbuka.map((item) => (
              <article className={styles.historyItem} key={item.id}>
                <div className={styles.historyTop}>
                  <strong>{item.noTagihan}</strong>
                  <span className={`${styles.statusChip} ${styles.statusPasif}`}>
                    {item.statusTagihan}
                  </span>
                </div>
                <div className={styles.historyBody}>
                  <span>
                    Anggota: {item.noAnggota} - {item.namaLengkap}
                  </span>
                  <span>
                    Simpanan: {item.kodeSimpanan} - {item.namaSimpanan}
                  </span>
                  <span>Periode: {item.periodeLabel ?? "-"}</span>
                  <span>Nominal Tagihan: {toCurrency(item.nominalTagihan)}</span>
                  <span>Sudah Dibayar: {toCurrency(item.nominalTerbayar)}</span>
                  <span>Sisa Tagihan: {toCurrency(item.sisaTagihan)}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Transaksi Terbaru</h2>
          <span>Jejak pembayaran dan transaksi simpanan terakhir</span>
        </div>
        <div className={styles.historyList}>
          {transaksiTerbaru.length === 0 ? (
            <div className={styles.mobileEmpty}>Belum ada transaksi simpanan.</div>
          ) : (
            transaksiTerbaru.map((item) => (
              <article className={styles.historyItem} key={item.id}>
                <div className={styles.historyTop}>
                  <strong>{item.noTransaksi}</strong>
                  <span className={`${styles.statusChip} ${styles.statusAktif}`}>
                    {item.tipeTransaksi}
                  </span>
                </div>
                <div className={styles.historyBody}>
                  <span>Tanggal: {item.tanggalTransaksi ?? "-"}</span>
                  <span>
                    Anggota: {item.noAnggota} - {item.namaLengkap}
                  </span>
                  <span>
                    Simpanan: {item.kodeSimpanan} - {item.namaSimpanan}
                  </span>
                  <span>Model: {item.modelTransaksi}</span>
                  <span>Metode: {item.metodeBayar ?? "-"}</span>
                  <span>Nominal: {toCurrency(item.nominal)}</span>
                  <span>Catatan: {item.keterangan ?? "-"}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
