import { defineMiddleware } from 'astro:middleware'
import { verifySession } from './lib/auth/session'
import { AUTH_CONFIG } from './lib/auth/config'

// Allowed origin patterns for Webflow domains
const allowedOriginPatterns = [
    /^https:\/\/.*\.webflow\.io$/,
    /^https:\/\/.*\.webflow\.services$/,
]

const allowedOrigins = ['http://localhost:4321', 'http://localhost:8787']

function isAllowedOrigin(origin: string): boolean {
    if (allowedOrigins.includes(origin)) return true
    return allowedOriginPatterns.some(pattern => pattern.test(origin))
}

function getCorsHeaders(request: Request): Record<string, string> {
    const origin = request.headers.get('Origin')
    const headers: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    }
    if (origin && isAllowedOrigin(origin)) {
        headers['Access-Control-Allow-Origin'] = origin
    }
    return headers
}

// Extract token from cookie or Authorization header
function getToken(context: { cookies: any; request: Request }): string | undefined {
    // First try cookie (for same-origin requests)
    const cookieToken = context.cookies.get(AUTH_CONFIG.SESSION_COOKIE)?.value
    if (cookieToken) return cookieToken

    // Then try Authorization header (for cross-origin API requests)
    const authHeader = context.request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7)
    }

    return undefined
}

export const onRequest = defineMiddleware(async (context, next) => {
    const { pathname } = context.url
    const { request } = context

    // Allow CORS preflight requests to pass through to endpoint handlers
    if (request.method === 'OPTIONS') {
        return next()
    }

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
        const token = getToken(context)
        const authSecret = context.locals.runtime?.env?.AUTH_SECRET

        if (!authSecret) {
            console.error('AUTH_SECRET not configured')
            if (pathname.startsWith('/ca/api/')) {
                return new Response(
                    JSON.stringify({ error: 'Server configuration error' }),
                    { 
                        status: 500, 
                        headers: { 
                            'Content-Type': 'application/json',
                            ...getCorsHeaders(request)
                        } 
                    }
                )
            }
            return context.redirect('/ca/login?error=auth_failed')
        }

        const session = await verifySession(token, authSecret)

        if (!session) {
            // API routes return 401 Unauthorized with CORS headers
            if (pathname.startsWith('/ca/api/')) {
                return new Response(
                    JSON.stringify({ error: 'Unauthorized' }),
                    { 
                        status: 401, 
                        headers: { 
                            'Content-Type': 'application/json',
                            ...getCorsHeaders(request)
                        } 
                    }
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
