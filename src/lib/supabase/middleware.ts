import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv } from "@/lib/env";

const AUTH_PATHS = new Set(["/login", "/signup"]);
let previewWarningShown = false;

function shouldBypassForDevelopmentPreview() {
  const isDevelopment = process.env.NODE_ENV === "development";
  const missingUrl = !process.env.NEXT_PUBLIC_SUPABASE_URL;
  const missingKey = !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return isDevelopment && (missingUrl || missingKey);
}

export async function updateSession(request: NextRequest) {
  if (shouldBypassForDevelopmentPreview()) {
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

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isAuthPath = AUTH_PATHS.has(pathname);

  if (!user && !isAuthPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPath) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = "/";
    appUrl.search = "";
    return NextResponse.redirect(appUrl);
  }

  return response;
}
