import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

// Auth Env interface for type safety
interface AuthEnv {
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    BETTER_AUTH_SECRET?: string;
    ORIGIN: string;
    DB: D1Database;
}

/**
 * Create a Better Auth instance with runtime environment variables.
 * Uses D1 database for user/session storage.
 */
export function createAuth(env: AuthEnv) {
    const db = drizzle(env.DB, { schema });
    
    return betterAuth({
        baseURL: env.ORIGIN,
        basePath: "/ca/api/auth",
        secret: env.BETTER_AUTH_SECRET,
        trustedOrigins: [env.ORIGIN],
        database: drizzleAdapter(db, {
            provider: "sqlite",
        }),
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
        },
    });
}

export type Auth = ReturnType<typeof createAuth>;
