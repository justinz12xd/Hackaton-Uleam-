import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest, intlResponse?: NextResponse) {
  // Usar la respuesta del intlMiddleware si está disponible, o crear una nueva
  let supabaseResponse = intlResponse || NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Actualizar la respuesta existente en lugar de crear una nueva
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  // Solo verificar usuario en rutas protegidas
  const pathname = request.nextUrl.pathname
  const isProtectedRoute = 
    pathname.includes('/dashboard') || 
    pathname.includes('/admin') || 
    pathname.includes('/instructor')

  if (isProtectedRoute) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Redirect unauthenticated users to login
      if (!user) {
        const url = request.nextUrl.clone()
        // Extraer locale de la ruta si existe
        const localeMatch = pathname.match(/^\/([a-z]{2})\//)
        const locale = localeMatch ? localeMatch[1] : 'es'
        url.pathname = `/${locale}/auth/login`
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // Si hay error obteniendo el usuario, permitir continuar
      // La página individual manejará la autenticación
      console.error("Error en middleware auth:", error)
    }
  }

  return supabaseResponse
}
