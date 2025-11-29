import * as jose from 'jose'
import { AUTH_CONFIG, type SessionPayload } from './config'

/**
 * Creates a signed JWT session token
 * @param payload - The session payload containing user info
 * @param secret - The secret key for signing
 * @returns The signed JWT string
 */
export async function createSession(
    payload: SessionPayload,
    secret: string
): Promise<string> {
    const secretKey = new TextEncoder().encode(secret)

    const jwt = await new jose.SignJWT({
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer(AUTH_CONFIG.JWT_ISSUER)
        .setAudience(AUTH_CONFIG.JWT_AUDIENCE)
        .setExpirationTime(AUTH_CONFIG.JWT_EXPIRATION)
        .sign(secretKey)

    return jwt
}

/**
 * Verifies a JWT session token and returns the payload
 * @param token - The JWT token to verify
 * @param secret - The secret key for verification
 * @returns The session payload if valid, null otherwise
 */
export async function verifySession(
    token: string | undefined,
    secret: string
): Promise<SessionPayload | null> {
    if (!token) return null

    try {
        const secretKey = new TextEncoder().encode(secret)
        const { payload } = await jose.jwtVerify(token, secretKey, {
            issuer: AUTH_CONFIG.JWT_ISSUER,
            audience: AUTH_CONFIG.JWT_AUDIENCE,
        })

        // Validate required fields
        if (!payload.sub || !payload.email || !payload.name) {
            return null
        }

        return {
            sub: payload.sub as string,
            email: payload.email as string,
            name: payload.name as string,
            picture: payload.picture as string | undefined,
        }
    } catch (error) {
        // Token is invalid or expired
        return null
    }
}

/**
 * Decodes a Google ID token to extract user info
 * @param idToken - The Google ID token
 * @returns User info from the token
 */
export function decodeGoogleIdToken(idToken: string): {
    sub: string
    email: string
    name: string
    picture?: string
} | null {
    try {
        // Decode the JWT without verification (Google already verified it)
        const payload = jose.decodeJwt(idToken)

        if (!payload.sub || !payload.email || !payload.name) {
            return null
        }

        return {
            sub: payload.sub as string,
            email: payload.email as string,
            name: payload.name as string,
            picture: payload.picture as string | undefined,
        }
    } catch {
        return null
    }
}

/**
 * Checks if a user is allowed based on email/domain allowlists
 * @param email - The user's email address
 * @param allowedDomains - Comma/space separated list of allowed domains
 * @param allowedEmails - Comma/space separated list of allowed emails
 * @returns True if user is allowed
 */
export function isUserAllowed(
    email: string,
    allowedDomains?: string,
    allowedEmails?: string
): boolean {
    // If no restrictions, allow all
    if (!allowedDomains && !allowedEmails) {
        return true
    }

    const emailLower = email.toLowerCase()

    // Check allowed emails
    if (allowedEmails) {
        const emails = allowedEmails.split(/[\s,]+/).filter(Boolean).map(e => e.toLowerCase())
        if (emails.includes(emailLower)) {
            return true
        }
    }

    // Check allowed domains
    if (allowedDomains) {
        const domains = allowedDomains.split(/[\s,]+/).filter(Boolean).map(d => d.toLowerCase())
        const userDomain = emailLower.split('@')[1]
        if (userDomain && domains.includes(userDomain)) {
            return true
        }
    }

    return false
}
