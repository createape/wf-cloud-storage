// API Response utilities for consistent handling across endpoints
export const API = {
  // Allowed origins - always includes localhost for development
  allowedOrigins: ["https://jscss.webflow.io", "http://localhost:4321", "http://localhost:8787"],

  // CORS headers
  corsHeaders: {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    // "Access-Control-Allow-Origin": "*",
  },

  // Merge provided headers with CORS defaults and dynamic origin handling
  withCorsHeaders: (
    request?: Request,
    extraHeaders: Record<string, string> = {}
  ): Record<string, string> => {
    const headers: Record<string, string> = {
      ...API.corsHeaders,
      ...extraHeaders,
    };

    if (request) {
      const origin = request.headers.get("Origin");
      if (origin && API.isAllowedOrigin(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
      }
    }

    return headers;
  },

  // Create JSON response with automatic CORS origin handling
  json: (data: any, request?: Request, status: number = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: API.withCorsHeaders(request, {
        "Content-Type": "application/json",
      }),
    });
  },

  // Create error response
  error: (message: string, request?: Request, status: number = 500) => {
    return API.json({ error: message }, request, status);
  },

  // Create success response
  success: (data: any, request?: Request) => {
    return API.json({ success: true, ...data }, request);
  },

  // Handle CORS preflight with dynamic origin
  cors: (request?: Request) => {
    if (request) {
      const origin = request.headers.get("Origin");
      console.log("CORS check - Request origin:", origin);
      console.log("CORS check - Allowed origins:", API.allowedOrigins);
      console.log(
        "CORS check - Is allowed:",
        API.isAllowedOrigin(origin || "")
      );

      if (origin && API.isAllowedOrigin(origin)) {
        console.log("CORS check - Allowing origin:", origin);
        return new Response(null, {
          status: 200,
          headers: API.withCorsHeaders(request),
        });
      }
    }

    console.log("CORS check - Using default headers");
    return new Response(null, {
      status: 200,
      headers: API.withCorsHeaders(),
    });
  },

  // Add origin to allowed list
  addOrigin: (origin: string) => {
    if (!API.allowedOrigins.includes(origin)) {
      API.allowedOrigins.push(origin);
    }
  },

  // Check if origin is allowed
  isAllowedOrigin: (origin: string): boolean => {
    return API.allowedOrigins.includes(origin);
  },

  // Initialize API with base URL from environment
  init: (baseUrl?: string) => {
    console.log("API.init called with baseUrl:", baseUrl);
    console.log("Initial allowed origins:", API.allowedOrigins);

    // Add the base URL to allowed origins if provided
    if (baseUrl && !API.allowedOrigins.includes(baseUrl)) {
      console.log("Adding baseUrl to allowed origins:", baseUrl);
      API.addOrigin(baseUrl);
    }

    console.log("Final allowed origins:", API.allowedOrigins);
  },

  // Create API route handler with automatic CORS
  route: (handler: (request: Request, locals: any) => Promise<Response>) => {
    return async ({ request, locals }: { request: Request; locals: any }) => {
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return API.cors(request);
      }

      try {
        return await handler(request, locals);
      } catch (error) {
        console.error("API Error:", error);
        return API.error("Internal server error", request, 500);
      }
    };
  },
};
