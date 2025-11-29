import { defineMiddleware } from 'astro:middleware'
import { verifySession } from './lib/auth/session'
import { AUTH_CONFIG } from './lib/auth/config'

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/ca/api/asset',           // Asset serving (public files)
    '/ca/api/auth/',           // Auth endpoints (login, callback, logout)
    '/ca/login',               // Login page
  ]

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
    return next()
  }

  // For protected routes, verify session
  if (pathname.startsWith('/ca/api/') || pathname.startsWith('/ca')) {
    const sessionCookie = context.cookies.get(AUTH_CONFIG.SESSION_COOKIE)?.value
    const authSecret = context.locals.runtime?.env?.AUTH_SECRET

    if (!authSecret) {
      console.error('AUTH_SECRET not configured')
      if (pathname.startsWith('/ca/api/')) {
        return new Response(
          JSON.stringify({ error: 'Server configuration error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return context.redirect('/ca/login?error=auth_failed')
    }

    const session = await verifySession(sessionCookie, authSecret)

    if (!session) {
      // API routes return 401 Unauthorized
      if (pathname.startsWith('/ca/api/')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
      // Pages redirect to login
      return context.redirect('/ca/login?error=session_expired')
    }

    // Attach session to locals for use in pages/endpoints
    context.locals.session = session
  }

  return next()
})
