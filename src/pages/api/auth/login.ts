import type { APIRoute } from 'astro'
import { createGoogleProvider, generateState, generateCodeVerifier } from '../../../lib/auth/arctic'
import { AUTH_CONFIG } from '../../../lib/auth/config'

export const GET: APIRoute = async ({ cookies, redirect, locals }) => {
  const env = locals.runtime.env

  // Get Google credentials from environment
  const clientId = env.GOOGLE_CLIENT_ID
  const clientSecret = env.GOOGLE_CLIENT_SECRET
  const origin = env.ORIGIN

  if (!clientId || !clientSecret || !origin) {
    return new Response(
      JSON.stringify({ error: 'Missing OAuth configuration' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Create Google provider
  const google = createGoogleProvider(clientId, clientSecret, origin)

  // Generate state and code verifier for PKCE
  const state = generateState()
  const codeVerifier = generateCodeVerifier()

  // Create authorization URL with PKCE
  const url = google.createAuthorizationURL(state, codeVerifier, AUTH_CONFIG.GOOGLE_SCOPES)

  // Request refresh token for long-lived sessions
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')

  // Store state and code verifier in cookies for callback verification
  cookies.set(AUTH_CONFIG.STATE_COOKIE, state, AUTH_CONFIG.OAUTH_COOKIE_OPTIONS)
  cookies.set(AUTH_CONFIG.CODE_VERIFIER_COOKIE, codeVerifier, AUTH_CONFIG.OAUTH_COOKIE_OPTIONS)

  // Redirect to Google OAuth
  return redirect(url.toString())
}
