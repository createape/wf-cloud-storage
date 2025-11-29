import type { APIRoute } from "astro";
import { API } from "../../utils/api";
import { requireAuth } from "../../lib/auth-guard";

export const POST: APIRoute = async (context) => {
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

    const formData = await request.formData();
    const file = formData.get("file");
    const requestedKey = formData.get("key");

    if (!file || !(file instanceof File)) {
      return API.error("Missing or invalid file", request, 400);
    }

    const normalizedKey =
      typeof requestedKey === "string" && requestedKey.trim().length > 0
        ? requestedKey.trim()
        : undefined;

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "";
    const filename = normalizedKey || `${timestamp}-${file.name}.${extension}`;

    // Upload to R2 bucket
    const object = await bucket.put(filename, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    if (!object) {
      return API.error("Failed to upload file", request, 500);
    }

    return API.success(
      {
        success: true,
        filename,
        key: object.key,
        size: file.size,
        type: file.type,
        replaced: Boolean(normalizedKey),
      },
      request
    );
  } catch (error) {
    console.error("Upload error:", error);
    return API.error("Upload failed", request, 500);
  }
};
