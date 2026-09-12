import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PATHS = ["/login", "/sign-up"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Direct pass-through for public landing page, marketing, and public API routes
  if (path === "/" || path === "/about" || path.startsWith("/api/stt") || path.startsWith("/api/tts")) {
    return NextResponse.next();
  }

  const isAuthPath = AUTH_PATHS.includes(path);
  const isProtectedPath =
    path.startsWith("/app") ||
    path.startsWith("/profile") ||
    path.startsWith("/settings") ||
    path.startsWith("/admin");

  // Check for presence of any Supabase session cookies
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));

  // 2. Fast-path: If user has no cookies:
  if (!hasAuthCookie) {
    if (isProtectedPath) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("next", path);
      return NextResponse.redirect(redirectUrl);
    }
    // Public or auth path without cookies — allow through
    return NextResponse.next();
  }

  // 3. User has cookies, verify session safely
  let response = NextResponse.next({ request: { headers: request.headers } });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // Missing env vars fallback: don't crash or loop
      if (isProtectedPath) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return response;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isProtectedPath && !user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("next", path);
      return NextResponse.redirect(redirectUrl);
    }

    if (isAuthPath && user) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
  } catch {
    // If auth verification fails, redirect only protected routes
    if (isProtectedPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons, and static assets (.png, .jpg, .svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav|ogg)$).*)",
  ],
};
