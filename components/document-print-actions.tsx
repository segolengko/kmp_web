"use client";

import Link from "next/link";

type Props = {
  backHref: string;
};

export function DocumentPrintActions({ backHref }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <Link
        className="inline-flex items-center justify-center rounded-xl border border-[rgba(154,170,183,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] px-4 py-2.5 text-sm font-bold text-[var(--text)] transition duration-200 hover:-translate-y-px hover:border-[rgba(51,209,198,0.24)] hover:bg-[linear-gradient(180deg,rgba(51,209,198,0.08),rgba(255,255,255,0.03))]"
        href={backHref}
      >
        Kembali
      </Link>
      <button
        className="inline-flex items-center justify-center rounded-xl border border-transparent bg-[linear-gradient(135deg,var(--accent)_0%,var(--accent-strong)_100%)] px-4 py-2.5 text-sm font-extrabold text-[#032826] shadow-[0_12px_26px_rgba(20,184,166,0.18)] transition duration-200 hover:-translate-y-px hover:shadow-[0_16px_30px_rgba(20,184,166,0.24)]"
        onClick={() => window.print()}
        type="button"
      >
        Cetak / Simpan PDF
      </button>
    </div>
  );
}
