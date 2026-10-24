// Router. Static files in public/ are served before this code runs.
// The only route of our own is POST /api/read.
import { readSigns } from "./read-signs.js";

const MAX_BYTES = 4 * 1024 * 1024;
const IMAGE_PREFIX = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function handleRead(request, env) {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BYTES) return json({ error: "too_large" }, 413);

  const body = await request.text();
  if (body.length > MAX_BYTES) return json({ error: "too_large" }, 413);

  let image;
  try {
    image = JSON.parse(body).image;
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  if (typeof image !== "string" || !IMAGE_PREFIX.test(image)) {
    return json({ error: "not_an_image" }, 400);
  }

  const result = await readSigns(env, image);
  if (result.error) return json({ error: result.error }, 502);
  return json(result);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/read") return handleRead(request, env);
    return new Response("Not found", { status: 404 });
  },
};
