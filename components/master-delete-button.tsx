"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/anggota/page.module.css";

type MasterDeleteButtonProps = {
  deleteUrl: string;
  entityLabel: string;
  entityName: string;
};

export function MasterDeleteButton({
  deleteUrl,
  entityLabel,
  entityName,
}: MasterDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(`Hapus ${entityLabel} ${entityName} dari database?`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(deleteUrl, {
        method: "DELETE",
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? `Gagal menghapus ${entityLabel}.`);
      }

      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : `Terjadi kendala saat menghapus ${entityLabel}.`,
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
