import type { APIRoute } from "astro";
import { API } from "../../utils/api";

export const GET: APIRoute = async ({ request, locals }) => {
  API.init((locals.runtime as any).env.ORIGIN);

  try {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return API.error("Missing key", request, 400);
    }

    const bucket = locals.runtime.env.CLOUD_FILES;
    if (!bucket) {
      return API.error("Cloud storage not configured", request, 500);
    }

    const object = await bucket.get(key);
    if (!object) {
      return API.error("Not found", request, 404);
    }

    const data = await object.arrayBuffer();
    const contentType = object.httpMetadata?.contentType || "application/octet-stream";

    return new Response(data, {
      headers: API.withCorsHeaders(request, {
        "Content-Type": contentType,
      }),
    });
  } catch (error) {
    console.error("Asset retrieval error:", error);
    return API.error("Failed to retrieve asset", request, 500);
  }
};

export const OPTIONS: APIRoute = async ({ request, locals }) => {
  API.init((locals.runtime as any).env.ORIGIN);
  return API.cors(request);
};
