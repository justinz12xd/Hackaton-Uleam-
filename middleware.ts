import createMiddleware from 'next-intl/middleware';
import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"
import { routing } from './lib/i18n/routing';

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // First handle i18n
  const response = intlMiddleware(request);
  
  // Then update the session
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
