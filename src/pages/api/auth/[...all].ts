import { getAuth } from "../../../lib/auth";
import type { APIRoute } from "astro";

export const ALL: APIRoute = async (ctx) => {
    const auth = getAuth(ctx.locals.runtime.env);

    return auth.handler(ctx.request);
};
