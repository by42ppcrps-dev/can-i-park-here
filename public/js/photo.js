// Photo Input: shrink the photo on the phone, then ask the Worker to read it.
// The photo is never stored; it only exists in memory and in one request.

const MAX_SIDE = 1280;
const QUALITY = 0.8;

export class PhotoError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new PhotoError("not_an_image"));
    img.src = url;
  });
}

// Returns { dataUrl, previewUrl } for a File chosen by the user.
export async function shrinkPhoto(file) {
  if (!file || !(file.type || "").startsWith("image/")) throw new PhotoError("not_an_image");
  const previewUrl = URL.createObjectURL(file);
  let img;
  try {
    img = await loadImage(previewUrl);
  } catch (err) {
    URL.revokeObjectURL(previewUrl);
    throw err;
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
  if (!dataUrl.startsWith("data:image/jpeg")) throw new PhotoError("not_an_image");
  return { dataUrl, previewUrl };
}

// Posts the photo to /api/read. Resolves to { signs, model, ms }.
export async function readPhoto(dataUrl, signal) {
  let res;
  try {
    res = await fetch("/api/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: dataUrl }),
      signal,
    });
  } catch (err) {
    if (err && err.name === "AbortError") throw err;
    throw new PhotoError("read_failed");
  }
  if (!res.ok) throw new PhotoError(res.status === 413 ? "too_large" : "read_failed");
  const body = await res.json().catch(() => null);
  if (!body || !Array.isArray(body.signs)) throw new PhotoError("read_failed");
  return body;
}
