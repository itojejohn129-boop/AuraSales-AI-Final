import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
];

const PROTECTED_API_ROUTES = ["/api/upload-sales", "/api/sales/upload"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const shouldRedirectAuthedToDashboard = pathname === "/" || pathname === "/login";

  const isProtectedApiRoute = PROTECTED_API_ROUTES.some((route) => pathname.startsWith(route));

  if (pathname.startsWith("/api/") && !isProtectedApiRoute) {
    return NextResponse.next();
  }

  if (isPublicRoute && !shouldRedirectAuthedToDashboard) {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  const cookieHandlers = {
    getAll: () => request.cookies.getAll(),
    setAll: (
      cookiesToSet: Array<{
        name: string;
        value: string;
        options?: Parameters<typeof response.cookies.set>[2];
      }>
    ) => {
      try {
        const requestCookies = request.cookies as typeof request.cookies & {
          set?: (name: string, value: string) => void;
        };
        for (const c of cookiesToSet) {
          try {
            requestCookies.set?.(c.name, c.value);
          } catch {
            // ignore if not supported
          }
        }
      } catch {
        // ignore
      }

      response = NextResponse.next({ request });

      for (const c of cookiesToSet) {
        const { name, value, options } = c;
        try {
          if (options) {
            response.cookies.set(name, value, options);
          } else {
            response.cookies.set(name, value);
          }
        } catch {
          // ignore cookie set errors
        }
      }
    },
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { request, response, cookies: cookieHandlers }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && shouldRedirectAuthedToDashboard) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && pathname === "/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/signin";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && (pathname.startsWith("/dashboard") || isProtectedApiRoute)) {
    if (isProtectedApiRoute) {
      try {
        const authHeader = request.headers.get("authorization") || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (token) {
          const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          if (SUPABASE_URL && ANON_KEY) {
            const userRes = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                apikey: ANON_KEY,
              } as HeadersInit,
            });

            if (userRes.ok) {
              return NextResponse.next();
            }
          }
        }
      } catch {
        // fall through
      }

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/signin";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
