import createMiddleware from 'next-intl/middleware';
import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"
import { routing } from './lib/i18n/routing';

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing);

// Rutas públicas que no requieren autenticación
const publicRoutes = [
  '/',
  '/auth',
  '/courses',
  '/events',
  '/api',
]

// Rutas que requieren autenticación
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/instructor',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Primero manejar i18n
  const response = intlMiddleware(request);
  
  // Extraer la ruta sin el locale (ej: /es/dashboard -> /dashboard)
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}\//, '/')
  
  // Verificar si es una ruta protegida (considerando locale)
  const isProtectedRoute = 
    pathname.includes('/dashboard') || 
    pathname.includes('/admin') || 
    pathname.includes('/instructor') ||
    protectedRoutes.some(route => pathWithoutLocale.startsWith(route))
  
  // Solo verificar autenticación en rutas protegidas
  // Para rutas públicas, solo actualizamos cookies de sesión sin verificar usuario
  if (isProtectedRoute) {
    return await updateSession(request, response)
  }
  
  // Para rutas públicas, solo retornamos la respuesta del i18n
  // Esto es más rápido y no bloquea la carga con llamadas a Supabase
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
