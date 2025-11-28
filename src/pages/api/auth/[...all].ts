import { getAuth, type AuthEnv } from "../../../lib/auth";
import type { APIRoute } from "astro";

export const ALL: APIRoute = async (ctx) => {
    const runtimeEnv = ctx.locals.runtime.env;
    const authEnv: AuthEnv = {
        GOOGLE_CLIENT_ID: runtimeEnv.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: runtimeEnv.GOOGLE_CLIENT_SECRET,
        BETTER_AUTH_SECRET: runtimeEnv.BETTER_AUTH_SECRET,
        BETTER_AUTH_URL: runtimeEnv.BETTER_AUTH_URL,
        PUBLIC_BETTER_AUTH_URL: runtimeEnv.PUBLIC_BETTER_AUTH_URL,
        ORIGIN: runtimeEnv.ORIGIN,
        ORIGIN_DEV: runtimeEnv.ORIGIN_DEV,
    };

    const auth = getAuth(authEnv);

    return auth.handler(ctx.request);
};
