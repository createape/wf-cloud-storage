import { Google } from 'arctic'

/**
 * Creates a Google OAuth provider instance
 * @param clientId - Google OAuth client ID
 * @param clientSecret - Google OAuth client secret
 * @param origin - The origin URL for the redirect URI
 */
export function createGoogleProvider(
    clientId: string,
    clientSecret: string,
    origin: string
): Google {
    const redirectUri = `${origin}/ca/api/auth/callback`
    return new Google(clientId, clientSecret, redirectUri)
}

// Re-export arctic utilities
export { generateState, generateCodeVerifier } from 'arctic'
export { Google } from 'arctic'
