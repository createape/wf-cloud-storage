import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
    baseURL: typeof window !== "undefined"
        ? `${window.location.origin}/ca/api/auth`
        : "/ca/api/auth",
});
