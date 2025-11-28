import { betterAuth } from "better-auth";

type AuthInstance = ReturnType<typeof betterAuth>;

let cachedAuth: AuthInstance | undefined;

const createAuth = (env: Env): AuthInstance =>
    betterAuth({
        // Stateless mode - no database configuration (cookies only)
        socialProviders: {
            google: {
                clientId: env.GOOGLE_CLIENT_ID || "",
                clientSecret: env.GOOGLE_CLIENT_SECRET || "",
            },
        },
        secret: env.BETTER_AUTH_SECRET,
        basePath: "/ca/api/auth",
        trustedOrigins: [
            env.ORIGIN || env.ORIGIN_DEV || "http://localhost:4321",
        ],
    });

export const getAuth = (env: Env): AuthInstance => {
    if (!cachedAuth) {
        cachedAuth = createAuth(env);
    }

    return cachedAuth;
};
