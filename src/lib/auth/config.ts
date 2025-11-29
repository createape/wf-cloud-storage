// Auth configuration constants

export const AUTH_CONFIG = {
    // Cookie names
    SESSION_COOKIE: 'session',
    STATE_COOKIE: 'oauth_state',
    CODE_VERIFIER_COOKIE: 'oauth_code_verifier',

    // JWT settings
    JWT_ISSUER: 'wf-cloud-storage',
    JWT_AUDIENCE: 'wf-cloud-storage',
    JWT_EXPIRATION: '7d',

    // Cookie settings
    COOKIE_OPTIONS: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax' as const,
        path: '/ca',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    },

    // OAuth temp cookie settings (short-lived)
    OAUTH_COOKIE_OPTIONS: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax' as const,
        path: '/ca',
        maxAge: 60 * 10, // 10 minutes
    },

    // Google OAuth scopes
    GOOGLE_SCOPES: ['openid', 'profile', 'email'] as string[],
} as const

// Session payload interface
export interface SessionPayload {
    sub: string       // User ID (from Google)
    email: string     // User email
    name: string      // User name
    picture?: string  // Profile picture URL
}
