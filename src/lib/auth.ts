// import { betterAuth } from "better-auth";

// type AuthInstance = ReturnType<typeof betterAuth>;

// let cachedAuth: AuthInstance | undefined;

// const createAuth = (env: Env): AuthInstance =>
//     betterAuth({
//         baseURL: env.BETTER_AUTH_URL || env.PUBLIC_BETTER_AUTH_URL || "http://localhost:4321/ca/api/auth",
//         basePath: "/ca/api/auth",
//         // Stateless mode - no database configuration (cookies only)
//         socialProviders: {
//             google: {
//                 clientId: env.GOOGLE_CLIENT_ID || "",
//                 clientSecret: env.GOOGLE_CLIENT_SECRET || "",
//             },
//         },
//         secret: env.BETTER_AUTH_SECRET,
//         trustedOrigins: [
//             env.ORIGIN || env.ORIGIN_DEV || "http://localhost:4321",
//         ],
//     });

// export const getAuth = (env: Env): AuthInstance => {
//     if (!cachedAuth) {
//         cachedAuth = createAuth(env);
//     }

//     return cachedAuth;
// };

import { betterAuth } from "better-auth";

type AuthInstance = ReturnType<typeof betterAuth>;

// Whatever your Env shape is, make sure these exist:
type Env = {
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    BETTER_AUTH_SECRET?: string;
    BETTER_AUTH_URL?: string;
    PUBLIC_BETTER_AUTH_URL?: string;
    ORIGIN?: string;
    ORIGIN_DEV?: string;
};

let cachedAuth: AuthInstance | undefined;

const createAuth = (rawEnv?: Env): AuthInstance => {
    const env = rawEnv ?? {};

    // Force a baseURL so Google redirect uses jscss.webflow.io
    const baseURL =
        env.BETTER_AUTH_URL ||
        env.PUBLIC_BETTER_AUTH_URL ||
        "http://localhost:4321/ca/api/auth";

    // Make sure secret is *never* empty in prod to avoid Better Auth throwing
    const secret =
        env.BETTER_AUTH_SECRET || "better-auth-secret-123456789"; // TODO: set a real secret in Webflow Cloud

    return betterAuth({
        baseURL,
        // basePath is fine; if baseURL already has /api/auth, Better Auth will let baseURL win
        basePath: "/api/auth",

        // Stateless mode - no database configuration (cookies only)
        socialProviders: {
            google: {
                clientId: env.GOOGLE_CLIENT_ID || "",
                clientSecret: env.GOOGLE_CLIENT_SECRET || "",
            },
        },

        secret,

        trustedOrigins: [
            env.ORIGIN || env.ORIGIN_DEV || "http://localhost:4321",
        ],
    });
};

export const getAuth = (env?: Env): AuthInstance => {
    if (!cachedAuth) {
        cachedAuth = createAuth(env);
    }
    return cachedAuth;
};
