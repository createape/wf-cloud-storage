import type { APIRoute } from 'astro'
import { createGoogleProvider } from '../../../lib/auth/arctic'
import { AUTH_CONFIG } from '../../../lib/auth/config'
import { createSession, decodeGoogleIdToken, isUserAllowed } from '../../../lib/auth/session'

export const GET: APIRoute = async ({ url, cookies, redirect, locals }) => {
    const env = locals.runtime.env

    // Get OAuth parameters from query string
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    // Handle OAuth errors from Google
    if (error) {
        console.error('OAuth error from Google:', error)
        return redirect('/ca/login?error=oauth_error')
    }

    if (!code || !state) {
        return redirect('/ca/login?error=missing_params')
    }

    // Get stored state and code verifier from cookies
    const storedState = cookies.get(AUTH_CONFIG.STATE_COOKIE)?.value
    const codeVerifier = cookies.get(AUTH_CONFIG.CODE_VERIFIER_COOKIE)?.value

    // Clear OAuth cookies
    cookies.delete(AUTH_CONFIG.STATE_COOKIE, { path: '/ca' })
    cookies.delete(AUTH_CONFIG.CODE_VERIFIER_COOKIE, { path: '/ca' })

    // Verify state matches
    if (!storedState || state !== storedState) {
        console.error('State mismatch:', { received: state, stored: storedState })
        return redirect('/ca/login?error=state_mismatch')
    }

    if (!codeVerifier) {
        console.error('Missing code verifier')
        return redirect('/ca/login?error=missing_verifier')
    }

    // Get Google credentials
    const clientId = env.GOOGLE_CLIENT_ID
    const clientSecret = env.GOOGLE_CLIENT_SECRET
    const origin = env.ORIGIN
    const authSecret = env.AUTH_SECRET

    if (!clientId || !clientSecret || !origin || !authSecret) {
        console.error('Missing environment configuration')
        return new Response(
            JSON.stringify({ error: 'Missing configuration' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }

    try {
        // Create Google provider and exchange code for tokens
        const google = createGoogleProvider(clientId, clientSecret, origin)
        const tokens = await google.validateAuthorizationCode(code, codeVerifier)

        // Get ID token which contains user info
        const idToken = tokens.idToken()
        if (!idToken) {
            console.error('No ID token received')
            return redirect('/ca/login?error=no_id_token')
        }

        // Decode ID token to get user info
        const userInfo = decodeGoogleIdToken(idToken)
        if (!userInfo) {
            console.error('Failed to decode ID token')
            return redirect('/ca/login?error=invalid_id_token')
        }

        // Check if user is allowed (domain/email restrictions)
        const allowedDomains = env.ALLOWED_DOMAINS
        const allowedEmails = env.ALLOWED_EMAILS
        if (!isUserAllowed(userInfo.email, allowedDomains, allowedEmails)) {
            console.error('User not allowed:', userInfo.email)
            return redirect('/ca/login?error=unauthorized')
        }

        // Create session JWT
        const sessionToken = await createSession(userInfo, authSecret)

        // Set session cookie (for same-origin page requests)
        cookies.set(AUTH_CONFIG.SESSION_COOKIE, sessionToken, AUTH_CONFIG.COOKIE_OPTIONS)

        // Redirect to main app with token in URL fragment (for cross-origin API calls)
        // The client will extract this and store in localStorage
        return redirect(`/ca/?token=${sessionToken}#auth`)
    } catch (error) {
        console.error('OAuth callback error:', error)
        return redirect('/ca/login?error=auth_failed')
    }
}
