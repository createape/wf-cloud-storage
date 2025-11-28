import { auth } from "./lib/auth";
import { defineMiddleware } from "astro:middleware";

// Base path from astro config
const basePath = "/ca";

// Protected routes that require authentication (relative to base)
const protectedRoutes = ["/", "/files"];
const protectedApiRoutes = ["/api/upload", "/api/multipart-upload", "/api/list-assets"];

export const onRequest = defineMiddleware(async (context, next) => {
    // Get session from Better Auth
    const session = await auth.api.getSession({
        headers: context.request.headers,
    });

    if (session) {
        context.locals.user = session.user;
        context.locals.session = session.session;
    } else {
        context.locals.user = null;
        context.locals.session = null;
    }

    const pathname = context.url.pathname;

    // Remove base path for route matching
    const pathWithoutBase = pathname.startsWith(basePath)
        ? pathname.slice(basePath.length) || "/"
        : pathname;

    // Check if route is protected
    const isProtectedPage = protectedRoutes.some(
        (route) => pathWithoutBase === route || pathWithoutBase === route + "/"
    );

    const isProtectedApi = protectedApiRoutes.some(
        (route) => pathWithoutBase.startsWith(route)
    );

    // Redirect to login if accessing protected route without session
    if (isProtectedPage && !session) {
        return context.redirect(`${basePath}/login`);
    }

    // Return 401 for protected API routes without session
    if (isProtectedApi && !session) {
        return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            {
                status: 401,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    return next();
});
