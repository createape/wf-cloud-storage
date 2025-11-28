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

    const rangeHeader = request.headers.get("range");
    let rangeSpec: ByteRange | null = null;
    let objectSize: number | undefined;

    if (rangeHeader) {
      const metadata = await bucket.head(key);
      if (!metadata) {
        return API.error("Not found", request, 404);
      }

      rangeSpec = parseRangeHeader(rangeHeader, metadata.size);
      objectSize = metadata.size;

      if (!rangeSpec) {
        return new Response(null, {
          status: 416,
          headers: API.withCorsHeaders(request, {
            "Accept-Ranges": "bytes",
            "Content-Range": `bytes */${metadata.size}`,
          }),
        });
      }
    }

    const object = await bucket.get(
      key,
      rangeSpec
        ? {
          range: { offset: rangeSpec.start, length: rangeSpec.length },
        }
        : undefined,
    );
    if (!object) {
      return API.error("Not found", request, 404);
    }

    const data = await object.arrayBuffer();
    const contentType = object.httpMetadata?.contentType || "application/octet-stream";
    const headers = API.withCorsHeaders(request, {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    });

    if (rangeSpec) {
      headers["Content-Length"] = String(rangeSpec.length);
      headers["Content-Range"] = `bytes ${rangeSpec.start}-${rangeSpec.end}/${object.size}`;

      return new Response(data, {
        status: 206,
        headers,
      });
    }

    const totalSize = object.size ?? objectSize ?? data.byteLength;
    headers["Content-Length"] = String(totalSize);

    return new Response(data, {
      headers,
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

type ByteRange = {
  start: number;
  end: number;
  length: number;
};

const parseRangeHeader = (value: string, size: number): ByteRange | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.toLowerCase().startsWith("bytes=")) {
    return null;
  }

  const rangeValue = trimmed.substring(trimmed.indexOf("=") + 1);
  if (!rangeValue || rangeValue.includes(",")) {
    return null;
  }

  const [startPart, endPart] = rangeValue.split("-");
  if (startPart === "" && endPart === "") {
    return null;
  }

  let start = startPart ? Number(startPart) : Number.NaN;
  let end = endPart ? Number(endPart) : Number.NaN;

  if (Number.isNaN(start)) {
    if (Number.isNaN(end) || end <= 0) {
      return null;
    }

    const suffixLength = Math.min(end, size);
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else {
    if (start < 0 || start >= size) {
      return null;
    }

    if (Number.isNaN(end) || end >= size) {
      end = size - 1;
    }
  }

  if (start > end) {
    return null;
  }

  return {
    start,
    end,
    length: end - start + 1,
  };
};
