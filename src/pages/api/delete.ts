import type { APIRoute } from "astro";
import { API } from "../../utils/api";

export const DELETE: APIRoute = async ({ request, locals }) => {
    // Set the origin for the API
    API.init((locals.runtime as any).env.ORIGIN);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
        console.log("CORS preflight request from:", request.headers.get("Origin"));
        return API.cors(request);
    }

    try {
        const url = new URL(request.url);
        const key = url.searchParams.get("key");

        if (!key) {
            return API.error("Missing key", request, 400);
        }

        // Check if bucket is available
        const bucket = locals.runtime.env.CLOUD_FILES;
        if (!bucket) {
            return API.error("Cloud storage not configured", request, 500);
        }

        // Delete from R2 bucket
        await bucket.delete(key);

        return API.success(
            {
                success: true,
                message: "File deleted successfully",
                key,
            },
            request
        );
    } catch (error) {
        console.error("Delete error:", error);
        return API.error("Delete failed", request, 500);
    }
};

export const OPTIONS: APIRoute = async ({ request, locals }) => {
    API.init((locals.runtime as any).env.ORIGIN);
    return API.cors(request);
};
