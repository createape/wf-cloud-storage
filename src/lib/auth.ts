import { betterAuth } from "better-auth";

// Auth Env interface for type safety
interface AuthEnv {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    BETTER_AUTH_SECRET?: string;
    ORIGIN: string;
}

/**
 * Create a Better Auth instance with runtime environment variables.
 * Uses stateless mode (no database) - sessions stored in cookies.
 */
export function createAuth(env: AuthEnv) {
    return betterAuth({
        baseURL: env.ORIGIN,
        basePath: "/ca/api/auth",
        secret: env.BETTER_AUTH_SECRET,
        trustedOrigins: [env.ORIGIN],
        socialProviders: {
            google: {
                clientId: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
        },
        session: {
            cookieCache: {
                enabled: true,
                maxAge: 7 * 24 * 60 * 60, // 7 days
            },
        },
        account: {
            accountLinking: {
                enabled: true,
            },
            // Store account data in cookie for stateless mode
            storeAccountCookie: true,
        },
    });
}

export type Auth = ReturnType<typeof createAuth>;
