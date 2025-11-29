import type { APIRoute } from "astro";
import { createAuth } from "../../../lib/auth";

const handleAuth: APIRoute = async ({ request, locals }) => {
    const env = (locals.runtime as any).env;

    try {
        const auth = createAuth({
            GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
            BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
            ORIGIN: env.ORIGIN,
            DB: env.DB,
        });

        return auth.handler(request);
    } catch (error) {
        console.error("Auth handler error:", error);
        return new Response("Auth error", { status: 500 });
    }
};

export const GET: APIRoute = handleAuth;
export const POST: APIRoute = handleAuth;
