import { betterAuth } from "better-auth";


export const auth = betterAuth({
    // Stateless mode - no database configuration
    // Sessions are stored in cookies only
    socialProviders: {
        google: {
            clientId: import.meta.env.GOOGLE_CLIENT_ID || "",
            clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
    secret: import.meta.env.BETTER_AUTH_SECRET,
    basePath: "/ca/api/auth",
    trustedOrigins: [
        import.meta.env.ORIGIN || "http://localhost:4321",
    ],
});
