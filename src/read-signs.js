// Sign Reader: sends the photo to Workers AI, then checks the reply with validateReading().
// The image is never logged or stored; it only lives inside this request.
import { validateReading } from "../public/js/engine/validate.js";
import { READING_PROMPT, USER_TEXT, SIGNS_SCHEMA } from "./prompt.js";

export const MODELS = [
  "@cf/meta/llama-4-scout-17b-16e-instruct",
  "@cf/mistralai/mistral-small-3.1-24b-instruct",
];
const TIMEOUT_MS = 25000;

function buildInput(image) {
  return {
    messages: [
      { role: "system", content: READING_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: USER_TEXT },
          { type: "image_url", image_url: { url: image } },
        ],
      },
    ],
    response_format: { type: "json_schema", json_schema: SIGNS_SCHEMA },
    temperature: 0,
    max_tokens: 1500,
  };
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Returns { signs, model, ms, usage } or { error: "read_failed", tried }.
export async function readSigns(env, image) {
  const tried = [];
  for (const model of MODELS) {
    const t0 = Date.now();
    try {
      const out = await withTimeout(env.AI.run(model, buildInput(image)), TIMEOUT_MS);
      const raw = out && out.response !== undefined ? out.response : out;
      const checked = validateReading(raw);
      if (checked.ok) {
        return { signs: checked.signs, model, ms: Date.now() - t0, usage: out?.usage ?? null };
      }
      tried.push({ model, error: checked.error });
    } catch (err) {
      tried.push({ model, error: String(err && err.message ? err.message : err).slice(0, 200) });
    }
  }
  return { error: "read_failed", tried };
}
