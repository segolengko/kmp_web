"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DarkSelect } from "@/components/dark-select";
import { NumericInput } from "@/components/numeric-input";
import type { PejabatTTDOption } from "@/lib/tagihan-pejabat-ttd-data";
import type {
  PenawaranItemTemplateOption,
  PenawaranProjectDetail,
  PenawaranStatus,
} from "@/lib/tagihan-penawaran-data";
import { toTerbilangRupiah } from "@/lib/terbilang";
import styles from "@/app/anggota/page.module.css";

type Option = {
  value: string;
  label: string;
};

type Props = {
  mode: "create" | "edit";
  srOptions: Option[];
  itemTemplates: PenawaranItemTemplateOption[];
  pejabatOptions: PejabatTTDOption[];
  initialData?: PenawaranProjectDetail | null;
};

type ItemState = {
  templateKey: string;
  namaItem: string;
  deskripsiItem: string;
  qty: string;
  satuan: string;
  hargaSatuan: string;
};

type FormState = {
  referensiSrId: string;
  noPenawaran: string;
  tanggalPenawaran: string;
  perihal: string;
  pembukaSurat: string;
  tempatTtd: string;
  tanggalTtd: string;
  pejabatTtdId: string;
  penandatanganNama: string;
  penandatanganJabatan: string;
  pejabatTtd2Id: string;
  penandatanganNama2: string;
  penandatanganJabatan2: string;
  pejabatTtd3Id: string;
  penandatanganNama3: string;
  penandatanganJabatan3: string;
  statusPenawaran: PenawaranStatus;
  catatan: string;
  items: ItemState[];
};

function toPlainNumber(value: string) {
  const normalized = value.replace(/[^\d.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatQty(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}

function buildInitialItems(initialData?: PenawaranProjectDetail | null): ItemState[] {
  if (!initialData?.items?.length) {
    return [
      { templateKey: "", namaItem: "", deskripsiItem: "", qty: "1", satuan: "Unit", hargaSatuan: "" },
    ];
  }

  return initialData.items.map((item) => ({
    templateKey: "",
    namaItem: item.namaItem,
    deskripsiItem: item.deskripsiItem ?? "",
    qty: formatQty(item.qty),
    satuan: item.satuan ?? "",
    hargaSatuan: String(item.hargaSatuan || ""),
  }));
}

function getInitialState(
  initialData: PenawaranProjectDetail | null | undefined,
  srOptions: Option[],
): FormState {
  const defaultPembukaSurat =
    'Dengan Hormat,\nDengan ini Kami "Koperasi Karyawan Manunggal Perkasa" mengajukan Penawaran harga, dengan rincian sebagai berikut:';

  return {
    referensiSrId: String(initialData?.referensiSrId ?? srOptions[0]?.value ?? ""),
    noPenawaran: initialData?.noPenawaran ?? "",
    tanggalPenawaran: initialData?.tanggalPenawaran ?? new Date().toISOString().slice(0, 10),
    perihal: initialData?.perihal ?? "Penawaran Harga",
    pembukaSurat: initialData?.pembukaSurat ?? defaultPembukaSurat,
    tempatTtd: initialData?.tempatTtd ?? "",
    tanggalTtd: initialData?.tanggalTtd ?? new Date().toISOString().slice(0, 10),
    pejabatTtdId: String(initialData?.pejabatTtdId ?? ""),
    penandatanganNama: initialData?.penandatanganNama ?? "",
    penandatanganJabatan: initialData?.penandatanganJabatan ?? "",
    pejabatTtd2Id: String(initialData?.pejabatTtd2Id ?? ""),
    penandatanganNama2: initialData?.penandatanganNama2 ?? "",
    penandatanganJabatan2: initialData?.penandatanganJabatan2 ?? "",
    pejabatTtd3Id: String(initialData?.pejabatTtd3Id ?? ""),
    penandatanganNama3: initialData?.penandatanganNama3 ?? "",
    penandatanganJabatan3: initialData?.penandatanganJabatan3 ?? "",
    statusPenawaran: initialData?.statusPenawaran ?? "DRAFT",
    catatan: initialData?.catatan ?? "",
    items: buildInitialItems(initialData),
  };
}

export function TagihanPenawaranForm({
  mode,
  srOptions,
  itemTemplates,
  pejabatOptions,
  initialData = null,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => getInitialState(initialData, srOptions));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const endpoint =
    mode === "create" ? "/api/tagihan/penawaran" : `/api/tagihan/penawaran/${initialData?.id}`;
  const method = mode === "create" ? "POST" : "PATCH";

  const itemsWithAmount = form.items.map((item) => {
    const qty = toPlainNumber(item.qty);
    const harga = toPlainNumber(item.hargaSatuan);
    return { ...item, jumlah: qty * harga };
  });
  const subtotal = itemsWithAmount.reduce((total, item) => total + item.jumlah, 0);
  const nilaiPpn = Math.round(subtotal * 0.11);
  const nilaiTotal = subtotal + nilaiPpn;
  const terbilang = toTerbilangRupiah(nilaiTotal);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateItem(index: number, field: keyof ItemState, value: string) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addItem() {
    setForm((current) => ({
      ...current,
      items: [
        ...current.items,
        { templateKey: "", namaItem: "", deskripsiItem: "", qty: "1", satuan: "Unit", hargaSatuan: "" },
      ],
    }));
  }

  function duplicateItem(index: number) {
    setForm((current) => {
      const target = current.items[index];
      if (!target) {
        return current;
      }

      const nextItems = [...current.items];
      nextItems.splice(index + 1, 0, { ...target });
      return { ...current, items: nextItems };
    });
  }

  function removeItem(index: number) {
    setForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function applyTemplate(index: number, templateKey: string) {
    const template = itemTemplates.find((item) => item.value === templateKey);
    if (!template) {
      return;
    }

    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              templateKey,
              namaItem: template.namaItem,
              deskripsiItem: template.deskripsiItem,
              satuan: template.satuan || item.satuan || "Unit",
              hargaSatuan: template.hargaSatuan,
            }
          : item,
      ),
    }));
  }

  function applyPejabat(field: "pejabatTtdId" | "pejabatTtd2Id" | "pejabatTtd3Id", value: string) {
    const selected = pejabatOptions.find((item) => item.value === value);

    setForm((current) => {
      if (field === "pejabatTtdId") {
        return {
          ...current,
          pejabatTtdId: value,
          penandatanganNama: selected?.namaPejabat ?? "",
          penandatanganJabatan: selected?.jabatanPejabat ?? "",
        };
      }

      if (field === "pejabatTtd2Id") {
        return {
          ...current,
          pejabatTtd2Id: value,
          penandatanganNama2: selected?.namaPejabat ?? "",
          penandatanganJabatan2: selected?.jabatanPejabat ?? "",
        };
      }

      return {
        ...current,
        pejabatTtd3Id: value,
        penandatanganNama3: selected?.namaPejabat ?? "",
        penandatanganJabatan3: selected?.jabatanPejabat ?? "",
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          nilaiPpn,
          subtotal,
          nilaiTotal,
          terbilang,
          items: itemsWithAmount.map((item) => ({
            ...item,
            qty: item.qty,
            hargaSatuan: item.hargaSatuan,
            jumlah: item.jumlah,
          })),
        }),
      });

      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Gagal menyimpan penawaran.");
      }

      router.push("/tagihan/penawaran");
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
              <Link className={styles.back} href="/tagihan/penawaran">
                Kembali ke daftar penawaran
              </Link>
              {mode === "edit" && initialData?.id ? (
                <Link
                  className={styles.secondaryAction}
                  href={`/tagihan/penawaran/${initialData.id}/cetak`}
                  target="_blank"
                >
                  Cetak Penawaran
                </Link>
              ) : null}
            </div>

            <div className={styles.header}>
              <h1>{mode === "create" ? "Tambah Penawaran" : "Edit Penawaran"}</h1>
              <p>Input penawaran cukup sekali di sini supaya nanti dokumen turunan tinggal menarik data yang sama.</p>
            </div>

            {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}

            <form className={styles.formStack} onSubmit={handleSubmit}>
              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Header Penawaran</legend>
                <div className={styles.formSectionIntro}>
                  <h2>Data Utama Dokumen</h2>
                  <span>Header ini dipakai ulang untuk cetak surat penawaran dan basis dokumen tagihan berikutnya.</span>
                </div>
                <div className={styles.gridCompact}>
                  <div className={styles.field}>
                    <label htmlFor="referensiSrId">Referensi SR</label>
                    <DarkSelect
                      id="referensiSrId"
                      onChange={(value) => updateField("referensiSrId", value)}
                      options={srOptions}
                      value={form.referensiSrId}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="noPenawaran">Nomor Penawaran</label>
                    <input
                      disabled={mode === "create"}
                      id="noPenawaran"
                      onChange={(event) => updateField("noPenawaran", event.target.value)}
                      placeholder={mode === "create" ? "Otomatis saat simpan" : ""}
                      type="text"
                      value={form.noPenawaran}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="tanggalPenawaran">Tanggal Penawaran</label>
                    <input
                      id="tanggalPenawaran"
                      onChange={(event) => updateField("tanggalPenawaran", event.target.value)}
                      type="date"
                      value={form.tanggalPenawaran}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="statusPenawaran">Status</label>
                    <DarkSelect
                      id="statusPenawaran"
                      onChange={(value) => updateField("statusPenawaran", value as PenawaranStatus)}
                      options={[
                        { label: "DRAFT", value: "DRAFT" },
                        { label: "TERKIRIM", value: "TERKIRIM" },
                        { label: "MENANG", value: "MENANG" },
                        { label: "KALAH", value: "KALAH" },
                        { label: "BATAL", value: "BATAL" },
                      ]}
                      value={form.statusPenawaran}
                    />
                  </div>
                  <div className={styles.fieldFull}>
                    <label htmlFor="perihal">Perihal</label>
                    <input
                      id="perihal"
                      onChange={(event) => updateField("perihal", event.target.value)}
                      type="text"
                      value={form.perihal}
                    />
                  </div>
                  <div className={styles.fieldFull}>
                    <label htmlFor="pembukaSurat">Pembuka Surat</label>
                    <textarea
                      id="pembukaSurat"
                      onChange={(event) => updateField("pembukaSurat", event.target.value)}
                      value={form.pembukaSurat}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Item Penawaran</legend>
                <div className={styles.formSectionIntro}>
                  <h2>Rincian Harga</h2>
                  <span>Baris item di sini akan menjadi sumber subtotal, PPN, dan total penawaran.</span>
                </div>
                <div className={styles.managementStack}>
                  {itemsWithAmount.map((item, index) => (
                    <article className={styles.managementCard} key={`item-${index}`}>
                      <div className={styles.sectionHeader}>
                        <h2>Item {index + 1}</h2>
                        <div className={styles.rowActions}>
                          <button className={styles.secondaryInlineAction} onClick={() => duplicateItem(index)} type="button">
                            Duplikat
                          </button>
                          <button className={styles.deleteAction} onClick={() => removeItem(index)} type="button">
                            Hapus
                          </button>
                        </div>
                      </div>
                      <div className={styles.managementForm}>
                        {itemTemplates.length > 0 ? (
                          <div className={`${styles.field} ${styles.itemTemplateField}`}>
                            <label htmlFor={`templateItem-${index}`}>Item Tersimpan</label>
                            <select
                              id={`templateItem-${index}`}
                              onChange={(event) => applyTemplate(index, event.target.value)}
                              value={item.templateKey}
                            >
                              <option value="">Pilih item yang pernah dipakai</option>
                              {itemTemplates.map((template) => (
                                <option key={template.value} value={template.value}>
                                  {template.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : null}
                        <div className={styles.itemInlineGrid}>
                          <div className={styles.field}>
                          <label htmlFor={`namaItem-${index}`}>Nama Item</label>
                          <input
                            id={`namaItem-${index}`}
                            onChange={(event) => updateItem(index, "namaItem", event.target.value)}
                            type="text"
                            value={item.namaItem}
                          />
                          </div>
                          <div className={`${styles.field} ${styles.itemQtyField}`}>
                            <label htmlFor={`qty-${index}`}>Qty</label>
                            <input
                              id={`qty-${index}`}
                              min="0"
                              onChange={(event) => updateItem(index, "qty", event.target.value)}
                              step="0.01"
                              type="number"
                              value={item.qty}
                            />
                          </div>
                          <div className={`${styles.field} ${styles.itemSatuanField}`}>
                            <label htmlFor={`satuan-${index}`}>Satuan</label>
                            <input
                              id={`satuan-${index}`}
                              onChange={(event) => updateItem(index, "satuan", event.target.value)}
                              type="text"
                              value={item.satuan}
                            />
                          </div>
                          <div className={`${styles.field} ${styles.itemHargaField}`}>
                            <label htmlFor={`hargaSatuan-${index}`}>Harga Satuan</label>
                            <NumericInput
                              currency
                              id={`hargaSatuan-${index}`}
                              onChange={(value) => updateItem(index, "hargaSatuan", value)}
                              value={item.hargaSatuan}
                            />
                          </div>
                          <div className={`${styles.field} ${styles.itemJumlahField}`}>
                            <label htmlFor={`jumlah-${index}`}>Jumlah</label>
                            <input
                              disabled
                              id={`jumlah-${index}`}
                              type="text"
                              value={new Intl.NumberFormat("id-ID").format(item.jumlah)}
                            />
                          </div>
                        </div>
                        <div className={styles.fieldFull}>
                          <label htmlFor={`deskripsiItem-${index}`}>Deskripsi Item</label>
                          <textarea
                            id={`deskripsiItem-${index}`}
                            onChange={(event) => updateItem(index, "deskripsiItem", event.target.value)}
                            value={item.deskripsiItem}
                          />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className={styles.formActions}>
                  <button className={styles.secondaryAction} onClick={addItem} type="button">
                    Tambah Item
                  </button>
                </div>
              </fieldset>

              <fieldset className={`${styles.section} ${styles.formSectionCard}`}>
                <legend className={styles.formSectionLegend}>Nilai dan Tanda Tangan</legend>
                <div className={styles.formSectionIntro}>
                  <h2>Rekap Akhir</h2>
                  <span>Subtotal dihitung dari item, PPN 11% dibuat otomatis, dan terbilang mengikuti total akhir.</span>
                </div>
                <div className={styles.gridCompact}>
                  <div className={styles.field}>
                    <label htmlFor="subtotal">Subtotal</label>
                    <input
                      disabled
                      id="subtotal"
                      type="text"
                      value={`Rp ${new Intl.NumberFormat("id-ID").format(subtotal)}`}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="nilaiPpn">Nilai PPN</label>
                    <input
                      disabled
                      id="nilaiPpn"
                      type="text"
                      value={`Rp ${new Intl.NumberFormat("id-ID").format(nilaiPpn)}`}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="nilaiTotal">Nilai Total</label>
                    <input
                      disabled
                      id="nilaiTotal"
                      type="text"
                      value={`Rp ${new Intl.NumberFormat("id-ID").format(nilaiTotal)}`}
                    />
                  </div>
                  <div className={styles.fieldFull}>
                    <label htmlFor="terbilang">Terbilang</label>
                    <textarea
                      disabled
                      id="terbilang"
                      value={terbilang}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="tempatTtd">Tempat TTD</label>
                    <input
                      id="tempatTtd"
                      onChange={(event) => updateField("tempatTtd", event.target.value)}
                      type="text"
                      value={form.tempatTtd}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="tanggalTtd">Tanggal TTD</label>
                    <input
                      id="tanggalTtd"
                      onChange={(event) => updateField("tanggalTtd", event.target.value)}
                      type="date"
                      value={form.tanggalTtd}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="pejabatTtdId">Pejabat TTD 1</label>
                    <select
                      id="pejabatTtdId"
                      onChange={(event) => applyPejabat("pejabatTtdId", event.target.value)}
                      value={form.pejabatTtdId}
                    >
                      <option value="">Pilih pejabat</option>
                      {pejabatOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="penandatanganNama">Penandatangan</label>
                    <input
                      id="penandatanganNama"
                      onChange={(event) => updateField("penandatanganNama", event.target.value)}
                      type="text"
                      value={form.penandatanganNama}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="penandatanganJabatan">Jabatan</label>
                    <input
                      id="penandatanganJabatan"
                      onChange={(event) => updateField("penandatanganJabatan", event.target.value)}
                      type="text"
                      value={form.penandatanganJabatan}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="pejabatTtd2Id">Pejabat TTD 2</label>
                    <select
                      id="pejabatTtd2Id"
                      onChange={(event) => applyPejabat("pejabatTtd2Id", event.target.value)}
                      value={form.pejabatTtd2Id}
                    >
                      <option value="">Pilih pejabat</option>
                      {pejabatOptions.map((option) => (
                        <option key={`${option.value}-2`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="penandatanganNama2">Penandatangan 2</label>
                    <input
                      id="penandatanganNama2"
                      onChange={(event) => updateField("penandatanganNama2", event.target.value)}
                      type="text"
                      value={form.penandatanganNama2}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="penandatanganJabatan2">Jabatan 2</label>
                    <input
                      id="penandatanganJabatan2"
                      onChange={(event) => updateField("penandatanganJabatan2", event.target.value)}
                      type="text"
                      value={form.penandatanganJabatan2}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="pejabatTtd3Id">Pejabat TTD 3</label>
                    <select
                      id="pejabatTtd3Id"
                      onChange={(event) => applyPejabat("pejabatTtd3Id", event.target.value)}
                      value={form.pejabatTtd3Id}
                    >
                      <option value="">Pilih pejabat</option>
                      {pejabatOptions.map((option) => (
                        <option key={`${option.value}-3`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="penandatanganNama3">Penandatangan 3</label>
                    <input
                      id="penandatanganNama3"
                      onChange={(event) => updateField("penandatanganNama3", event.target.value)}
                      type="text"
                      value={form.penandatanganNama3}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="penandatanganJabatan3">Jabatan 3</label>
                    <input
                      id="penandatanganJabatan3"
                      onChange={(event) => updateField("penandatanganJabatan3", event.target.value)}
                      type="text"
                      value={form.penandatanganJabatan3}
                    />
                  </div>
                  <div className={styles.fieldFull}>
                    <label htmlFor="catatan">Catatan</label>
                    <textarea
                      id="catatan"
                      onChange={(event) => updateField("catatan", event.target.value)}
                      value={form.catatan}
                    />
                  </div>
                </div>
              </fieldset>

              <div className={styles.formActions}>
                <Link className={styles.resetButton} href="/tagihan/penawaran">
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
