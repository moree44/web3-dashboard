import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv, isDevelopmentPreview } from "@/lib/env";

const AUTH_PATHS = new Set(["/login", "/signup"]);
let previewWarningShown = false;

export async function updateSession(request: NextRequest) {
  if (isDevelopmentPreview()) {
    if (!previewWarningShown) {
      console.warn(
        "[Web3 Hunting OS] Development preview auth bypass is active because Supabase environment variables are missing. Production remains fail-closed.",
      );
      previewWarningShown = true;
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const hasSession = Boolean(data?.claims?.sub && !error);
  const pathname = request.nextUrl.pathname;
  const isAuthPath = AUTH_PATHS.has(pathname);

  if (!hasSession && !isAuthPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && isAuthPath) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = "/";
    appUrl.search = "";
    return NextResponse.redirect(appUrl);
  }

  return response;
}
