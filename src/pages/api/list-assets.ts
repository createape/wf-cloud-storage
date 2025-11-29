import type { APIRoute } from "astro";
import { API } from "../../utils/api";
import { requireAuth } from "../../lib/auth-guard";

export const GET: APIRoute = async (context) => {
  const { locals, request } = context;

  try {
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
    // Check if bucket is available
    const bucket = locals.runtime.env.CLOUD_FILES;
    if (!bucket) {
      return new Response("Cloud storage not configured", { status: 500 });
    }

    const options = { limit: 500 };
    const listed = await bucket.list(options);
    let truncated = listed.truncated;

    // Paging through the files
    // @ts-ignore
    let cursor = truncated ? listed.cursor : undefined;

    while (truncated) {
      const next = await bucket.list({
        ...options,
        cursor: cursor,
      });
      listed.objects.push(...next.objects);

      truncated = next.truncated;
      // @ts-ignore
      cursor = next.cursor;
    }

    // Return the files as a JSON object
    return new Response(JSON.stringify(listed.objects), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error listing assets:", error);
    return new Response("Failed to list assets", { status: 500 });
  }
};
