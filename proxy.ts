import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/anggota",
  "/generate-wajib",
  "/master",
  "/laporan",
  "/pembayaran-simpanan",
  "/penarikan",
  "/tagihan",
  "/api",
];

const AUTH_PAGES = ["/login"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAuthPage(pathname: string) {
  return AUTH_PAGES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxy(request: NextRequest) {
  const { url, key, isConfigured } = getSupabaseEnv();

  if (!isConfigured || !url || !key) {
    return NextResponse.next({
      request,
    });
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    const nextTarget = `${pathname}${search}`;

    if (nextTarget && nextTarget !== "/login") {
      loginUrl.searchParams.set("next", nextTarget);
    }

    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPage(pathname)) {
    const redirectTarget = request.nextUrl.searchParams.get("next");
    const destination =
      redirectTarget && redirectTarget.startsWith("/") ? redirectTarget : "/dashboard";

    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
