import { createAuthClient } from "better-auth/react";

type RuntimeEnv = {
    BETTER_AUTH_URL?: string;
    PUBLIC_BETTER_AUTH_URL?: string;
    ORIGIN?: string;
    ORIGIN_DEV?: string;
};

declare global {
    // eslint-disable-next-line no-var
    var __WF_RUNTIME_ENV__: RuntimeEnv | undefined;
    interface Window {
        __WF_RUNTIME_ENV__?: RuntimeEnv;
    }
}

const getRuntimeEnv = (): RuntimeEnv => {
    if (typeof globalThis !== "undefined" && globalThis.__WF_RUNTIME_ENV__) {
        return globalThis.__WF_RUNTIME_ENV__;
    }

    return {};
};

const ensureAbsoluteUrl = (url: string, env: RuntimeEnv): string => {
    if (!url) {
        return url;
    }

    try {
        return new URL(url).toString();
    } catch (error) {
        const { ORIGIN, ORIGIN_DEV } = env;
        const locationOrigin = typeof location !== "undefined" ? location.origin : undefined;
        const fallbackOrigin = "http://localhost:4321";
        const candidates = [ORIGIN, ORIGIN_DEV, locationOrigin, fallbackOrigin];

        for (const candidate of candidates) {
            if (!candidate) {
                continue;
            }

            try {
                return new URL(url, candidate).toString();
            } catch (nestedError) {
                // Ignore and continue trying other candidates
            }
        }
    }

    throw new Error(`Failed to resolve absolute URL for '${url}'.`);
};

const resolveBaseURL = (): string => {
    const env = getRuntimeEnv();
    const configured = env.PUBLIC_BETTER_AUTH_URL || env.BETTER_AUTH_URL;
    const fallbackPath = "/ca/api/auth";

    if (configured) {
        return ensureAbsoluteUrl(configured, env);
    }

    return ensureAbsoluteUrl(fallbackPath, env);
};

export const authClient = createAuthClient({
    baseURL: resolveBaseURL(),
});

export const { signIn, signOut, useSession } = authClient;

export {};
