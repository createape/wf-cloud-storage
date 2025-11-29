import type { APIContext } from "astro";
import { createAuth } from "./auth";

/**
 * Check if the request has a valid session.
 * Returns the session if authenticated, null otherwise.
 */
export async function getSession(context: APIContext) {
    const env = (context.locals.runtime as any).env;

    try {
        const auth = createAuth({
            GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
            BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
            ORIGIN: env.ORIGIN,
        });

        const session = await auth.api.getSession({
            headers: context.request.headers,
        });

        return session;
    } catch (error) {
        console.error("Session check error:", error);
        return null;
    }
}

/**
 * Require authentication for an API route.
 * Returns a 401 response if not authenticated.
 */
export async function requireAuth(context: APIContext): Promise<Response | null> {
    const session = await getSession(context);

    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    return null; // Authenticated, proceed
}
