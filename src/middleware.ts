import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/cron/deadline-cleanup") {
    return NextResponse.next({ request });
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
