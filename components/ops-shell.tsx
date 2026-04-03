import type { ReactNode } from "react";
import Link from "next/link";
import { KoperasiLogo } from "@/components/koperasi-logo";
import { LogoutButton } from "@/components/logout-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OpsShellProps = {
  currentPath: string;
  badge?: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
};

const topNavGroups = [
  {
    label: "Dashboard",
    short: "DS",
    href: "/dashboard",
    items: [{ href: "/dashboard", label: "Overview" }],
  },
  {
    label: "Anggota",
    short: "AG",
    href: "/anggota",
    items: [{ href: "/anggota", label: "Data Anggota" }],
  },
  {
    label: "Simpanan",
    short: "SP",
    href: "/master/jenis-simpanan",
    items: [
      { href: "/master/jenis-simpanan", label: "Jenis Simpanan" },
      { href: "/master/pengaturan-simpanan", label: "Pengaturan Simpanan" },
      { href: "/master/pengaturan-simpanan-anggota", label: "Pengaturan per Anggota" },
      { href: "/master/saldo-awal-simpanan", label: "Saldo Awal" },
      { href: "/generate-wajib", label: "Generate Wajib" },
      { href: "/pembayaran-simpanan", label: "Pembayaran" },
      { href: "/penarikan", label: "Penarikan" },
      { href: "/tagihan/tunggakan", label: "Tunggakan Wajib" },
      { href: "/laporan/saldo-simpanan", label: "Posisi Saldo" },
      { href: "/laporan", label: "Laporan Simpanan" },
    ],
  },
  {
    label: "Tagihan",
    short: "TG",
    href: "/tagihan/unit-bisnis",
    items: [
      { href: "/tagihan/unit-bisnis", label: "Unit Bisnis" },
      { href: "/tagihan/mitra-perusahaan", label: "Mitra Perusahaan" },
      { href: "/tagihan/sr", label: "Referensi SR" },
      { href: "/tagihan/pejabat-ttd", label: "Pejabat TTD" },
      { href: "/tagihan/tagihan-project", label: "Data Tagihan" },
      { href: "/tagihan/laporan", label: "Laporan Tagihan" },
    ],
  },
  {
    label: "Finance",
    short: "FN",
    href: "#",
    soon: true,
    items: [{ href: "#", label: "Kas & Bank" }],
  },
  {
    label: "Accounting",
    short: "AC",
    href: "#",
    soon: true,
    items: [{ href: "#", label: "Jurnal & Buku Besar" }],
  },
];

const primaryActionClass =
  "inline-flex items-center justify-center rounded-2xl border border-transparent bg-[linear-gradient(135deg,var(--accent)_0%,var(--accent-strong)_100%)] px-4 py-3 text-sm font-extrabold text-[#032826] shadow-[0_12px_26px_rgba(20,184,166,0.18)] transition duration-200 hover:-translate-y-px hover:shadow-[0_16px_30px_rgba(20,184,166,0.24)]";

const secondaryActionClass =
  "inline-flex items-center justify-center rounded-2xl border border-[rgba(154,170,183,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] px-4 py-3 text-sm font-bold text-[var(--text)] transition duration-200 hover:-translate-y-px hover:border-[rgba(51,209,198,0.24)] hover:bg-[linear-gradient(180deg,rgba(51,209,198,0.08),rgba(255,255,255,0.03))]";

function isCurrentPath(currentPath: string, href: string) {
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function getGroupActive(currentPath: string, group: (typeof topNavGroups)[number]) {
  return (
    !group.soon &&
    group.items.some((item) => item.href !== "#" && isCurrentPath(currentPath, item.href))
  );
}

function getDisplayUserName(email: string | null | undefined, fullName: string | null | undefined) {
  if (fullName && fullName.trim().length > 0) {
    return fullName.trim();
  }

  if (email && email.includes("@")) {
    return email.split("@")[0];
  }

  return "Admin Koperasi";
}

export async function OpsShell({
  currentPath,
  badge,
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: OpsShellProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const userName = getDisplayUserName(
    user?.email,
    typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
  );
  const userEmail = user?.email ?? "Belum login via Supabase";

  return (
    <main className="page-shell overflow-visible py-4">
      <div className="container">
        <div className="grid gap-4">
          <header className="relative z-40 rounded-[28px] border border-[rgba(133,151,168,0.12)] bg-[linear-gradient(180deg,rgba(9,14,21,0.98),rgba(12,18,27,0.96))] p-4 shadow-[0_18px_38px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.035] px-4 py-3">
                    <KoperasiLogo compact />
                  </div>
                  <div className="grid gap-1">
                    <strong className="text-base tracking-[0.02em] text-[var(--text)]">
                      KMP Workspace
                    </strong>
                    <span className="text-sm leading-6 text-[var(--muted)]">
                      Sistem operasional koperasi untuk admin harian, tanpa sidebar, fokus ke area
                      kerja.
                    </span>
                  </div>
                </div>

                <div className="ml-auto flex items-center justify-end gap-2">
                  <div className="flex min-w-[260px] items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <div className="grid min-w-0 gap-0.5">
                      <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-[rgba(255,236,186,0.72)]">
                        Login User
                      </span>
                      <strong className="truncate text-sm text-[var(--text)]">{userName}</strong>
                      <span className="truncate text-[0.74rem] text-[var(--muted)]">
                        {userEmail}
                      </span>
                    </div>
                    <LogoutButton className={secondaryActionClass} />
                  </div>
                </div>
              </div>

              <nav className="relative z-50 grid gap-3">
                <div className="hidden items-center gap-2 rounded-[22px] border border-[rgba(133,151,168,0.12)] bg-[linear-gradient(180deg,rgba(7,12,19,0.82),rgba(10,16,24,0.78))] p-2 md:flex md:flex-wrap xl:flex-nowrap">
                  {topNavGroups.map((group) => {
                    const groupActive = getGroupActive(currentPath, group);

                    return (
                      <div
                        className="group relative"
                        key={group.label}
                      >
                        <Link
                          className={
                            group.soon
                              ? "inline-flex min-h-11 cursor-default items-center gap-2 rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-2 text-sm font-extrabold text-[var(--muted)]"
                              : groupActive
                                ? "inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[rgba(51,209,198,0.18)] bg-[linear-gradient(135deg,rgba(51,209,198,0.14),rgba(255,236,186,0.06))] px-4 py-2 text-sm font-extrabold text-[#f5f1e6] shadow-[inset_0_-2px_0_rgba(255,236,186,0.26)]"
                                : "inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-2 text-sm font-extrabold text-[var(--text)] transition duration-200 hover:border-[rgba(51,209,198,0.22)] hover:bg-[rgba(51,209,198,0.06)]"
                          }
                          href={group.soon ? "#" : group.href}
                        >
                          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white/6 text-[0.68rem] font-extrabold uppercase tracking-[0.08em]">
                            {group.short}
                          </span>
                          <span>{group.label}</span>
                          <span className="text-[0.7rem] text-[var(--muted)] transition duration-200 group-hover:text-[#ffe8b3]">
                            ▼
                          </span>
                        </Link>

                        <div className="invisible absolute left-0 top-full z-50 min-w-[240px] pt-2 opacity-0 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                          <div className="grid gap-1.5 rounded-[20px] border border-[rgba(133,151,168,0.14)] bg-[linear-gradient(180deg,rgba(9,14,21,0.99),rgba(13,20,29,0.97))] p-3 shadow-[0_22px_44px_rgba(0,0,0,0.34)] backdrop-blur-xl">
                            <div className="flex items-center justify-between gap-3 px-1 pb-1">
                              <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.08em] text-[var(--muted)]">
                                {group.label}
                              </span>
                              {group.soon ? (
                                <span className="inline-flex items-center justify-center rounded-full bg-[rgba(255,236,186,0.1)] px-2 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.08em] text-[#ffe3a1]">
                                  Soon
                                </span>
                              ) : null}
                            </div>

                            {group.items.map((item) => {
                              const itemActive =
                                !group.soon &&
                                item.href !== "#" &&
                                isCurrentPath(currentPath, item.href);

                              if (group.soon) {
                                return (
                                  <span
                                    className="rounded-xl border border-dashed border-white/8 bg-white/[0.015] px-3 py-2.5 text-[0.8rem] text-[var(--muted)]"
                                    key={`${group.label}-${item.label}`}
                                  >
                                    {item.label}
                                  </span>
                                );
                              }

                              return (
                                <Link
                                  className={
                                    itemActive
                                      ? "rounded-xl border border-[rgba(255,236,186,0.18)] bg-[rgba(255,236,186,0.1)] px-3 py-2.5 text-[0.82rem] font-bold text-[#ffe8b3]"
                                      : "rounded-xl border border-white/6 bg-white/[0.015] px-3 py-2.5 text-[0.82rem] font-medium text-[var(--muted)] transition duration-200 hover:border-[rgba(51,209,198,0.18)] hover:bg-[rgba(51,209,198,0.06)] hover:text-[var(--text)]"
                                  }
                                  href={item.href}
                                  key={item.href}
                                >
                                  {item.label}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid gap-2 md:hidden">
                  <div className="flex flex-wrap gap-2">
                    {topNavGroups.map((group) => {
                      const groupActive = getGroupActive(currentPath, group);

                      return (
                        <Link
                          className={
                            group.soon
                              ? "inline-flex items-center gap-2 rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-2 text-sm font-extrabold text-[var(--muted)]"
                              : groupActive
                                ? "inline-flex items-center gap-2 rounded-2xl border border-[rgba(51,209,198,0.18)] bg-[linear-gradient(135deg,rgba(51,209,198,0.14),rgba(255,236,186,0.06))] px-4 py-2 text-sm font-extrabold text-[#f5f1e6]"
                                : "inline-flex items-center gap-2 rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-2 text-sm font-extrabold text-[var(--text)]"
                          }
                          href={group.soon ? "#" : group.href}
                          key={`mobile-${group.label}`}
                        >
                          <span>{group.label}</span>
                          {group.soon ? (
                            <span className="text-[0.66rem] uppercase tracking-[0.08em] text-[#ffe3a1]">
                              Soon
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>

                  {topNavGroups
                    .filter((group) => getGroupActive(currentPath, group))
                    .map((group) => (
                      <div
                        className="grid gap-1.5 rounded-[18px] border border-[rgba(133,151,168,0.12)] bg-[linear-gradient(180deg,rgba(7,12,19,0.82),rgba(10,16,24,0.78))] p-3"
                        key={`mobile-items-${group.label}`}
                      >
                        {group.items.map((item) => (
                          <Link
                            className={
                              item.href !== "#" && isCurrentPath(currentPath, item.href)
                                ? "rounded-xl border border-[rgba(255,236,186,0.18)] bg-[rgba(255,236,186,0.1)] px-3 py-2.5 text-[0.82rem] font-bold text-[#ffe8b3]"
                                : "rounded-xl border border-white/6 bg-white/[0.015] px-3 py-2.5 text-[0.82rem] font-medium text-[var(--muted)]"
                            }
                            href={item.href}
                            key={`mobile-item-${item.href}`}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                </div>
              </nav>
            </div>
          </header>

          <section className="relative z-10 grid gap-[18px] rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(16,24,35,0.96),rgba(21,30,42,0.92))] p-[18px] shadow-[0_18px_38px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <div className="flex flex-col items-start justify-between gap-5 lg:flex-row">
              <div className="grid gap-2">
                {badge ? (
                  <div className="w-fit rounded-full border border-[rgba(255,236,186,0.18)] bg-[rgba(255,236,186,0.12)] px-3 py-2 text-[0.76rem] font-extrabold uppercase tracking-[0.08em] text-[#ffe3a1]">
                    {badge}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-3 text-[var(--muted)]">
                  <h1 className="m-0 font-[var(--font-display)] text-[clamp(1.28rem,2.1vw,1.85rem)] leading-tight tracking-[-0.04em] text-[var(--text)]">
                    {title}
                  </h1>
                  <span className="hidden text-[1.45rem] font-light leading-none text-[rgba(255,255,255,0.3)] sm:inline">
                    |
                  </span>
                  <span className="max-w-[68ch] text-[0.88rem] leading-[1.65] text-[var(--muted)]">
                    {description}
                  </span>
                </div>
              </div>
              {actionHref && actionLabel ? (
                <Link
                  className={primaryActionClass}
                  href={actionHref}
                >
                  {actionLabel}
                </Link>
              ) : null}
            </div>

            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
