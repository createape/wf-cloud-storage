import type { APIRoute } from "astro";
import { API } from "../../utils/api";
import { requireAuth } from "../../lib/auth-guard";

export const DELETE: APIRoute = async (context) => {
    const { request, locals } = context;
    
    // Set the origin for the API
    API.init((locals.runtime as any).env.ORIGIN);

    // Auth check
    const authError = await requireAuth(context);
    if (authError) return authError;

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
        console.log("CORS preflight request from:", request.headers.get("Origin"));
        return API.cors(request);
    }

    try {
        // Check if bucket is available
        const bucket = locals.runtime.env.CLOUD_FILES;
        if (!bucket) {
            return API.error("Cloud storage not configured", request, 500);
        }

        const { key } = await request.json();

        if (!key || typeof key !== "string") {
            return API.error("Missing or invalid file key", request, 400);
        }

        // Delete from R2 bucket
        await bucket.delete(key);

        return API.success(
            {
                success: true,
                key,
                message: "File deleted successfully",
            },
            request
        );
    } catch (error) {
        console.error("Delete error:", error);
        return API.error("Delete failed", request, 500);
    }
};
