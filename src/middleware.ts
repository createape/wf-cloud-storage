import { defineMiddleware } from "astro:middleware";
import { createAuth } from "./lib/auth";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/ca/api/auth", // Auth endpoints
  "/ca/api/asset", // Public asset access
  "/ca/login", // Login page
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const env = (context.locals.runtime as any)?.env;
  const pathname = new URL(context.request.url).pathname;

  // Skip auth check if env is not available (build time)
  if (!env?.GOOGLE_CLIENT_ID || !env?.GOOGLE_CLIENT_SECRET) {
    return next();
  }

  // Allow public routes without auth
  if (isPublicRoute(pathname)) {
    return next();
  }

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

    if (session) {
      (context.locals as any).user = session.user;
      (context.locals as any).session = session.session;
    } else {
      (context.locals as any).user = null;
      (context.locals as any).session = null;

      // Redirect to login for protected pages (not API routes)
      if (!pathname.startsWith("/ca/api/")) {
        return context.redirect("/ca/login");
      }
    }
  } catch (error) {
    console.error("Middleware auth error:", error);
    (context.locals as any).user = null;
    (context.locals as any).session = null;
  }

  return next();
});
