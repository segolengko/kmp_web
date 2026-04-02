"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/anggota/page.module.css";

type Props = {
  actionPath: string;
  q: string;
  aktif: string;
  searchPlaceholder: string;
};

function buildHref(actionPath: string, q: string, aktif: string) {
  const params = new URLSearchParams();

  if (q.trim()) params.set("q", q.trim());
  if (aktif) params.set("aktif", aktif);

  const query = params.toString();
  return query ? `${actionPath}?${query}` : actionPath;
}

export function MasterFilterBar({ actionPath, q, aktif, searchPlaceholder }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [keyword, setKeyword] = useState(q);
  const [status, setStatus] = useState(aktif);

  function navigate(nextQ: string, nextAktif: string) {
    const href = buildHref(actionPath, nextQ, nextAktif);
    startTransition(() => {
      router.push(href);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(keyword, status);
  }

  const hasActiveFilter = keyword.trim().length > 0 || status.length > 0;

  return (
    <form className={styles.filterBarCompact} onSubmit={handleSubmit}>
      <div className={styles.searchField}>
        <label htmlFor="master-q">Pencarian</label>
        <input
          id="master-q"
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={keyword}
        />
      </div>

      <div className={styles.filterField}>
        <label htmlFor="master-status">Status</label>
        <select
          id="master-status"
          onChange={(event) => {
            const nextValue = event.target.value;
            setStatus(nextValue);
            navigate(keyword, nextValue);
          }}
          value={status}
        >
          <option value="">Semua status</option>
          <option value="AKTIF">Aktif</option>
          <option value="NONAKTIF">Nonaktif</option>
        </select>
      </div>

      <div className={styles.compactFilterInfo}>
        <span>{isPending ? "Memuat filter..." : "Tekan Enter untuk cari cepat."}</span>
        {hasActiveFilter ? (
          <button
            className={styles.compactReset}
            onClick={() => {
              setKeyword("");
              setStatus("");
              navigate("", "");
            }}
            type="button"
          >
            Reset filter
          </button>
        ) : null}
      </div>
    </form>
  );
}
