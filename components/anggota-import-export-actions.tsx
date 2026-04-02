"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/anggota/page.module.css";

export function AnggotaImportExportActions() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  function handleExport() {
    window.location.href = "/api/anggota/export";
  }

  function handlePickFile() {
    fileInputRef.current?.click();
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

      const response = await fetch("/api/anggota/import", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Import Excel gagal diproses.");
      }

      window.alert(result?.message ?? "Import anggota berhasil diproses.");
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Terjadi kendala saat import anggota.",
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
      <button className={styles.secondaryAction} onClick={handlePickFile} type="button">
        {isImporting ? "Mengimport..." : "Import Excel"}
      </button>
      <button className={styles.secondaryAction} onClick={handleExport} type="button">
        Export Excel
      </button>
    </div>
  );
}
