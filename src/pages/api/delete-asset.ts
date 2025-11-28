import type { APIRoute } from "astro";
import { API } from "../../utils/api";

const getKeyFromRequest = async (request: Request): Promise<string | null> => {
    const contentType = request.headers.get("Content-Type") || "";

    if (contentType.includes("application/json")) {
        try {
            const payload = await request.json();
            if (payload && typeof payload.key === "string" && payload.key.trim().length > 0) {
                return payload.key.trim();
            }
        } catch (error) {
            console.error("Failed to parse delete request payload:", error);
            return null;
        }
    }

    const url = new URL(request.url);
    const urlKey = url.searchParams.get("key");
    return urlKey && urlKey.trim().length > 0 ? urlKey.trim() : null;
};

export const DELETE: APIRoute = async ({ request, locals }) => {
    API.init((locals.runtime as any).env.ORIGIN);

    if (request.method === "OPTIONS") {
        return API.cors(request);
    }

    try {
        const bucket = locals.runtime.env.CLOUD_FILES;
        if (!bucket) {
            return API.error("Cloud storage not configured", request, 500);
        }

        const key = await getKeyFromRequest(request);
        if (!key) {
            return API.error("Missing key", request, 400);
        }

        const exists = await bucket.head(key);
        if (!exists) {
            return API.error("File not found", request, 404);
        }

        await bucket.delete(key);

        return API.success({ key, deleted: true }, request);
    } catch (error) {
        console.error("Delete asset error:", error);
        return API.error("Failed to delete asset", request, 500);
    }
};

export const OPTIONS: APIRoute = async ({ request, locals }) => {
    API.init((locals.runtime as any).env.ORIGIN);
    return API.cors(request);
};
