import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { HOME_PATH, SIGN_IN_PATH, isAuthPage, isPublicPath } from "@/lib/auth/paths";
import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";

/**
 * Refreshes the Supabase session cookie on every request and applies route-level
 * redirects. This is a UX gate only: pages and actions re-check the user themselves.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const env = publicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          // No-store headers so a CDN never serves one user's refreshed session to another.
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
        },
      },
    },
  );

  // getClaims verifies the JWT; getSession would trust the cookie as-is.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims.sub);
  const { pathname, search } = request.nextUrl;

  if (!signedIn && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = SIGN_IN_PATH;
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return redirectKeepingSession(url, response);
  }

  if (signedIn && isAuthPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = HOME_PATH;
    url.search = "";
    return redirectKeepingSession(url, response);
  }

  return response;
}

// A redirect must carry any refreshed cookies, or the browser keeps the stale session.
function redirectKeepingSession(url: URL, from: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}
