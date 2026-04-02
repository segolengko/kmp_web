"use client";

import type { FormEvent } from "react";
import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DarkSelect } from "@/components/dark-select";
import { NumericInput } from "@/components/numeric-input";
import type {
  JenisSimpananOption,
  PembayaranTagihanItem,
  PembayaranOption,
  TagihanTerbukaItem,
  TransaksiSimpananItem,
} from "@/lib/pembayaran-simpanan-data";
import styles from "@/app/anggota/page.module.css";

type Props = {
  anggotaOptions: PembayaranOption[];
  jenisSimpananOptions: JenisSimpananOption[];
  tagihanTerbuka: TagihanTerbukaItem[];
  pembayaranTerbaru: PembayaranTagihanItem[];
  transaksiTerbaru: TransaksiSimpananItem[];
  mode?: "INPUT" | "DATA";
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

type DataView = "TAGIHAN" | "PEMBAYARAN" | "TRANSAKSI";

type CancellationState = {
  noTransaksi: string;
  tanggalBatal: string;
  dibatalkanOleh: string;
  catatan: string;
};

const DATA_PAGE_SIZE = 8;

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
  pembayaranTerbaru,
  transaksiTerbaru,
  mode = "INPUT",
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCancellation, setActiveCancellation] = useState<string | null>(null);
  const [cancellationForm, setCancellationForm] = useState<CancellationState | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [dataView, setDataView] = useState<DataView>("PEMBAYARAN");
  const [dataQuery, setDataQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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
      totalPembayaran: pembayaranTerbaru.length,
      totalNominalPembayaran: pembayaranTerbaru.reduce((total, item) => total + item.nominal, 0),
      totalTransaksi: transaksiTerbaru.length,
      totalNominalTransaksi: transaksiTerbaru.reduce((total, item) => total + item.nominal, 0),
    };
  }, [tagihanTerbuka, pembayaranTerbaru, transaksiTerbaru]);

  const normalizedDataQuery = normalizeLookup(dataQuery);

  const filteredTagihanData = useMemo(() => {
    if (!normalizedDataQuery) {
      return tagihanTerbuka;
    }

    return tagihanTerbuka.filter((item) =>
      normalizeLookup(
        [
          item.noTagihan,
          item.noAnggota,
          item.namaLengkap,
          item.kodeSimpanan,
          item.namaSimpanan,
          item.periodeLabel ?? "",
          item.statusTagihan,
        ].join(" "),
      ).includes(normalizedDataQuery),
    );
  }, [normalizedDataQuery, tagihanTerbuka]);

  const filteredPembayaranData = useMemo(() => {
    if (!normalizedDataQuery) {
      return pembayaranTerbaru;
    }

    return pembayaranTerbaru.filter((item) =>
      normalizeLookup(
        [
          item.noTransaksi,
          item.tanggalTransaksi ?? "",
          item.noAnggota,
          item.namaLengkap,
          item.kodeSimpanan,
          item.namaSimpanan,
          item.metodeBayar ?? "",
          item.keterangan ?? "",
        ].join(" "),
      ).includes(normalizedDataQuery),
    );
  }, [normalizedDataQuery, pembayaranTerbaru]);

  const filteredTransaksiData = useMemo(() => {
    if (!normalizedDataQuery) {
      return transaksiTerbaru;
    }

    return transaksiTerbaru.filter((item) =>
      normalizeLookup(
        [
          item.noTransaksi,
          item.tanggalTransaksi ?? "",
          item.noAnggota,
          item.namaLengkap,
          item.kodeSimpanan,
          item.namaSimpanan,
          item.modelTransaksi,
          item.tipeTransaksi,
          item.metodeBayar ?? "",
          item.keterangan ?? "",
        ].join(" "),
      ).includes(normalizedDataQuery),
    );
  }, [normalizedDataQuery, transaksiTerbaru]);

  const activeDataCount = useMemo(() => {
    switch (dataView) {
      case "TAGIHAN":
        return filteredTagihanData.length;
      case "TRANSAKSI":
        return filteredTransaksiData.length;
      default:
        return filteredPembayaranData.length;
    }
  }, [dataView, filteredPembayaranData.length, filteredTagihanData.length, filteredTransaksiData.length]);

  const totalPages = Math.max(1, Math.ceil(activeDataCount / DATA_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedTagihanData = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * DATA_PAGE_SIZE;
    return filteredTagihanData.slice(startIndex, startIndex + DATA_PAGE_SIZE);
  }, [filteredTagihanData, safeCurrentPage]);

  const pagedPembayaranData = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * DATA_PAGE_SIZE;
    return filteredPembayaranData.slice(startIndex, startIndex + DATA_PAGE_SIZE);
  }, [filteredPembayaranData, safeCurrentPage]);

  const pagedTransaksiData = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * DATA_PAGE_SIZE;
    return filteredTransaksiData.slice(startIndex, startIndex + DATA_PAGE_SIZE);
  }, [filteredTransaksiData, safeCurrentPage]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }, [totalPages]);

  const isInputMode = mode === "INPUT";
  const isDataMode = mode === "DATA";
  const selectedCancellationItem = useMemo(() => {
    if (!cancellationForm) {
      return null;
    }

    return pembayaranTerbaru.find((item) => item.noTransaksi === cancellationForm.noTransaksi) ?? null;
  }, [cancellationForm, pembayaranTerbaru]);

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

  function handleChangeDataView(nextView: DataView) {
    setDataView(nextView);
    setCurrentPage(1);
  }

  function handleChangeDataQuery(value: string) {
    setDataQuery(value);
    setCurrentPage(1);
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

  async function handleCancelPembayaran(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!cancellationForm) {
      setErrorMessage("Pilih transaksi pembayaran yang ingin dibatalkan lebih dulu.");
      return;
    }

    setActiveCancellation(cancellationForm.noTransaksi);

    try {
      const response = await fetch(
        `/api/pembayaran-simpanan/${encodeURIComponent(cancellationForm.noTransaksi)}/batalkan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tanggalBatal: cancellationForm.tanggalBatal,
            dibatalkanOleh: cancellationForm.dibatalkanOleh,
            catatan: cancellationForm.catatan,
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Pembatalan pembayaran gagal diproses.");
      }

      setMessage(`Pembayaran ${cancellationForm.noTransaksi} berhasil dibatalkan.`);
      setCancellationForm(null);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi kendala saat membatalkan pembayaran.",
      );
    } finally {
      setActiveCancellation(null);
    }
  }

  function openCancellationForm(item: PembayaranTagihanItem) {
    setMessage("");
    setErrorMessage("");
    setCancellationForm({
      noTransaksi: item.noTransaksi,
      tanggalBatal: todayValue(),
      dibatalkanOleh: "admin",
      catatan: `Pembatalan pembayaran ${item.noTransaksi} untuk koreksi salah input.`,
    });
  }

  function closeCancellationForm() {
    setCancellationForm(null);
  }

  function patchCancellationField<K extends keyof CancellationState>(
    field: K,
    value: CancellationState[K],
  ) {
    setCancellationForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });
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
        <div className={styles.rowActions}>
          <Link
            className={`${styles.pageButton} ${isInputMode ? styles.pageNumberActive : ""}`}
            href="/pembayaran-simpanan/input"
          >
            Input
          </Link>
          <Link
            className={`${styles.pageButton} ${isDataMode ? styles.pageNumberActive : ""}`}
            href="/pembayaran-simpanan/data"
          >
            Data
          </Link>
        </div>
      </section>

      {isInputMode ? (
      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Input Pembayaran</h2>
          <span>Bayar tagihan atau catat transaksi simpanan langsung</span>
        </div>
        <form className={styles.managementForm} onSubmit={handleSubmit}>
          <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
            <legend className={styles.formSectionLegend}>Transaksi</legend>
            <div className={styles.formSectionIntro}>
              <h2>Detail Pembayaran</h2>
              <span>Pilih model, anggota, simpanan, dan nominal yang akan diproses</span>
            </div>

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
                <NumericInput
                  currency
                  id="nominal-pembayaran"
                  onChange={(value) => updateField("nominal", value)}
                  placeholder="0"
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
            </div>
          </fieldset>

          <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
            <legend className={styles.formSectionLegend}>Catatan</legend>
            <div className={styles.formSectionIntro}>
              <h2>Administrasi Proses</h2>
              <span>Isi operator dan catatan agar histori transaksi tetap rapi</span>
            </div>

            <div className={styles.gridCompact}>
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
          </fieldset>

          <div className={styles.formActions}>
            <button className={styles.saveButton} disabled={isSubmitting} type="submit">
              {isSubmitting ? "Memproses..." : "Simpan Pembayaran"}
            </button>
          </div>
        </form>
      </section>
      ) : null}

      {isDataMode ? (
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
            <span>Pembayaran Terbaru</span>
            <strong>{summary.totalPembayaran}</strong>
          </div>
          <div className={styles.summaryTile}>
            <span>Total Nominal Pembayaran</span>
            <strong>{toCurrency(summary.totalNominalPembayaran)}</strong>
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
      ) : null}

      {isDataMode ? (
      <section className={styles.managementCard}>
        <div className={styles.sectionHeader}>
          <h2>Page Data</h2>
          <span>Data operasional pembayaran dengan pola cari dan paginasi yang seragam</span>
        </div>
        <div className={styles.rowActions}>
          <button
            className={`${styles.pageButton} ${dataView === "PEMBAYARAN" ? styles.pageNumberActive : ""}`}
            onClick={() => handleChangeDataView("PEMBAYARAN")}
            type="button"
          >
            Pembayaran
          </button>
          <button
            className={`${styles.pageButton} ${dataView === "TAGIHAN" ? styles.pageNumberActive : ""}`}
            onClick={() => handleChangeDataView("TAGIHAN")}
            type="button"
          >
            Tagihan Terbuka
          </button>
          <button
            className={`${styles.pageButton} ${dataView === "TRANSAKSI" ? styles.pageNumberActive : ""}`}
            onClick={() => handleChangeDataView("TRANSAKSI")}
            type="button"
          >
            Semua Transaksi
          </button>
        </div>
        <div className={styles.filterBarCompact}>
          <div className={styles.field}>
            <label htmlFor="data-query-pembayaran">Cari Data</label>
            <input
              id="data-query-pembayaran"
              onChange={(event) => handleChangeDataQuery(event.target.value)}
              placeholder="Cari no transaksi, anggota, simpanan, periode, atau catatan"
              type="text"
              value={dataQuery}
            />
          </div>
          <div className={styles.filterActions}>
            <button
              className={styles.resetButton}
              onClick={() => handleChangeDataQuery("")}
              type="button"
            >
              Reset
            </button>
          </div>
        </div>
        <div className={styles.tableMeta}>
          <span>
            {activeDataCount} data ditemukan
          </span>
          <span>
            Halaman {safeCurrentPage} dari {totalPages}
          </span>
        </div>
        {dataView === "PEMBAYARAN" && cancellationForm && selectedCancellationItem ? (
          <form className={styles.managementForm} onSubmit={handleCancelPembayaran}>
            <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
              <legend className={styles.formSectionLegend}>Pembatalan</legend>
              <div className={styles.formSectionIntro}>
                <h2>Batalkan Pembayaran</h2>
                <span>Gunakan alur ini untuk salah input pembayaran manual tanpa menghapus histori transaksi</span>
              </div>
              <div className={styles.resultSummary}>
                <div className={styles.summaryTile}>
                  <span>No. Transaksi</span>
                  <strong>{selectedCancellationItem.noTransaksi}</strong>
                </div>
                <div className={styles.summaryTile}>
                  <span>Anggota</span>
                  <strong>{selectedCancellationItem.noAnggota}</strong>
                </div>
                <div className={styles.summaryTile}>
                  <span>Simpanan</span>
                  <strong>{selectedCancellationItem.kodeSimpanan}</strong>
                </div>
                <div className={styles.summaryTile}>
                  <span>Nominal</span>
                  <strong>{toCurrency(selectedCancellationItem.nominal)}</strong>
                </div>
              </div>
              <div className={styles.gridCompact}>
                <div className={styles.field}>
                  <label htmlFor="tanggal-batal-pembayaran">Tanggal Batal</label>
                  <input
                    id="tanggal-batal-pembayaran"
                    onChange={(event) => patchCancellationField("tanggalBatal", event.target.value)}
                    type="date"
                    value={cancellationForm.tanggalBatal}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="dibatalkan-oleh-pembayaran">Dibatalkan Oleh</label>
                  <input
                    id="dibatalkan-oleh-pembayaran"
                    onChange={(event) =>
                      patchCancellationField("dibatalkanOleh", event.target.value)
                    }
                    type="text"
                    value={cancellationForm.dibatalkanOleh}
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label htmlFor="catatan-batal-pembayaran">Catatan Pembatalan</label>
                  <textarea
                    id="catatan-batal-pembayaran"
                    onChange={(event) => patchCancellationField("catatan", event.target.value)}
                    placeholder="Jelaskan alasan pembatalan transaksi"
                    value={cancellationForm.catatan}
                  />
                </div>
              </div>
            </fieldset>
            <div className={styles.formActions}>
              <button
                className={styles.deleteAction}
                disabled={activeCancellation === cancellationForm.noTransaksi}
                type="submit"
              >
                {activeCancellation === cancellationForm.noTransaksi
                  ? "Membatalkan..."
                  : "Simpan Pembatalan"}
              </button>
              <button
                className={styles.resetButton}
                onClick={closeCancellationForm}
                type="button"
              >
                Tutup
              </button>
            </div>
          </form>
        ) : null}
        <div className={styles.tableWrap}>
          {dataView === "PEMBAYARAN" ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No. Transaksi</th>
                  <th>Tanggal</th>
                  <th>No. Anggota</th>
                  <th>Nama</th>
                  <th>Simpanan</th>
                  <th>Status</th>
                  <th>Metode</th>
                  <th>Nominal</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pagedPembayaranData.length === 0 ? (
                  <tr>
                    <td className={styles.emptyCell} colSpan={10}>
                      Belum ada data pembayaran tagihan.
                    </td>
                  </tr>
                ) : (
                  pagedPembayaranData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.noTransaksi}</td>
                      <td>{item.tanggalTransaksi ?? "-"}</td>
                      <td>{item.noAnggota}</td>
                      <td className={styles.nameCell}>{item.namaLengkap}</td>
                      <td>
                        {item.kodeSimpanan} - {item.namaSimpanan}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusChip} ${
                            item.statusPembayaran === "DIBATALKAN"
                              ? styles.statusKeluar
                              : styles.statusAktif
                          }`}
                        >
                          {item.statusPembayaran}
                        </span>
                      </td>
                      <td>{item.metodeBayar ?? "-"}</td>
                      <td>{toCurrency(item.nominal)}</td>
                      <td>{item.keterangan ?? "-"}</td>
                      <td>
                        {item.bisaDibatalkan ? (
                          <button
                            className={styles.deleteAction}
                            disabled={activeCancellation === item.noTransaksi}
                            onClick={() => openCancellationForm(item)}
                            type="button"
                          >
                            Batalkan
                          </button>
                        ) : (
                          <span className={styles.helperText}>
                            {item.statusPembayaran === "DIBATALKAN"
                              ? "Sudah dibatalkan"
                              : "Tidak tersedia"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : null}

          {dataView === "TAGIHAN" ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No. Tagihan</th>
                  <th>No. Anggota</th>
                  <th>Nama</th>
                  <th>Simpanan</th>
                  <th>Periode</th>
                  <th>Nominal</th>
                  <th>Terbayar</th>
                  <th>Sisa</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedTagihanData.length === 0 ? (
                  <tr>
                    <td className={styles.emptyCell} colSpan={9}>
                      Tidak ada tagihan terbuka saat ini.
                    </td>
                  </tr>
                ) : (
                  pagedTagihanData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.noTagihan}</td>
                      <td>{item.noAnggota}</td>
                      <td className={styles.nameCell}>{item.namaLengkap}</td>
                      <td>
                        {item.kodeSimpanan} - {item.namaSimpanan}
                      </td>
                      <td>{item.periodeLabel ?? "-"}</td>
                      <td>{toCurrency(item.nominalTagihan)}</td>
                      <td>{toCurrency(item.nominalTerbayar)}</td>
                      <td>{toCurrency(item.sisaTagihan)}</td>
                      <td>
                        <span className={`${styles.statusChip} ${styles.statusPasif}`}>
                          {item.statusTagihan}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : null}

          {dataView === "TRANSAKSI" ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No. Transaksi</th>
                  <th>Tanggal</th>
                  <th>No. Anggota</th>
                  <th>Nama</th>
                  <th>Simpanan</th>
                  <th>Model</th>
                  <th>Tipe</th>
                  <th>Metode</th>
                  <th>Nominal</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {pagedTransaksiData.length === 0 ? (
                  <tr>
                    <td className={styles.emptyCell} colSpan={10}>
                      Belum ada transaksi simpanan.
                    </td>
                  </tr>
                ) : (
                  pagedTransaksiData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.noTransaksi}</td>
                      <td>{item.tanggalTransaksi ?? "-"}</td>
                      <td>{item.noAnggota}</td>
                      <td className={styles.nameCell}>{item.namaLengkap}</td>
                      <td>
                        {item.kodeSimpanan} - {item.namaSimpanan}
                      </td>
                      <td>{item.modelTransaksi}</td>
                      <td>
                        <span className={`${styles.statusChip} ${styles.statusAktif}`}>
                          {item.tipeTransaksi}
                        </span>
                      </td>
                      <td>{item.metodeBayar ?? "-"}</td>
                      <td>{toCurrency(item.nominal)}</td>
                      <td>{item.keterangan ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : null}
        </div>
        <div className={styles.pagination}>
          <button
            className={`${styles.pageButton} ${safeCurrentPage <= 1 ? styles.pageButtonDisabled : ""}`}
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
            type="button"
          >
            Sebelumnya
          </button>
          <div className={styles.pageNumbers}>
            {pageNumbers.map((page) => (
              <button
                className={`${styles.pageNumber} ${page === safeCurrentPage ? styles.pageNumberActive : ""}`}
                key={page}
                onClick={() => setCurrentPage(page)}
                type="button"
              >
                {page}
              </button>
            ))}
          </div>
          <button
            className={`${styles.pageButton} ${safeCurrentPage >= totalPages ? styles.pageButtonDisabled : ""}`}
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
            type="button"
          >
            Berikutnya
          </button>
        </div>
      </section>
      ) : null}
    </div>
  );
}
