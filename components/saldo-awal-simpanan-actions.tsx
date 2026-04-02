"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/anggota/page.module.css";

export function SaldoAwalSimpananActions() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  function handlePickFile() {
    fileInputRef.current?.click();
  }

  function handleDownloadTemplate() {
    window.location.href = "/api/master/saldo-awal-simpanan/template";
  }

  async function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/master/saldo-awal-simpanan/import", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Import saldo awal gagal diproses.");
      }

      window.alert(result?.message ?? "Import saldo awal berhasil diproses.");
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Terjadi kendala saat import saldo awal.",
      );
    } finally {
      event.target.value = "";
      setIsImporting(false);
    }
  }

  return (
    <div className={styles.excelActions}>
      <input
        accept=".xlsx,.xls"
        className={styles.hiddenInput}
        onChange={handleImportChange}
        ref={fileInputRef}
        type="file"
      />
      <button className={styles.secondaryAction} onClick={handleDownloadTemplate} type="button">
        Download Template
      </button>
      <button className={styles.primaryListAction} onClick={handlePickFile} type="button">
        {isImporting ? "Mengimport..." : "Import Excel"}
      </button>
    </div>
  );
}
