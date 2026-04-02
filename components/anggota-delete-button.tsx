"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/anggota/page.module.css";

type AnggotaDeleteButtonProps = {
  noAnggota: string;
  namaLengkap: string;
};

export function AnggotaDeleteButton({
  noAnggota,
  namaLengkap,
}: AnggotaDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Hapus anggota ${namaLengkap} (${noAnggota}) dari database?`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/anggota/${encodeURIComponent(noAnggota)}`, {
        method: "DELETE",
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Gagal menghapus anggota.");
      }

      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Terjadi kendala saat menghapus anggota.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      className={styles.deleteAction}
      disabled={isDeleting}
      onClick={handleDelete}
      type="button"
    >
      {isDeleting ? "Menghapus..." : "Hapus"}
    </button>
  );
}
