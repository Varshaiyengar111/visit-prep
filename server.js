// A tiny web server with no framework.
// - Serves the demo page in ./public
// - POST /api/run sends the user's text to Claude (only if a key is set in .env)
// - Without a key it returns a built-in example, so the demo is free to try.
// The API key never leaves this server; the browser never sees it.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import task from "./task.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(here, ".env");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const PORT = Number(process.env.PORT) || task.port;
const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const LIVE = Boolean(process.env.ANTHROPIC_API_KEY);
const MAX_BODY = 50_000; // characters

async function runWithClaude(input) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  // Server-side fallback re-runs a declined request on another model.
  // It is not available for Haiku models, so only send it for others.
  const fallback = MODEL.includes("haiku")
    ? {}
    : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" };

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    ...fallback,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: task.schema },
    },
    system: task.system,
    messages: [{ role: "user", content: task.userMessage(input) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The AI declined this request. Try different wording.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("The answer was too long and got cut off. Try a shorter input.");
  }
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  return JSON.parse(text);
}

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > MAX_BODY) {
        reject(new Error("Input is too long."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
      const html = fs.readFileSync(path.join(here, "public", "index.html"), "utf8");
      return send(res, 200, html, "text/html; charset=utf-8");
    }
    if (req.method === "GET" && req.url === "/api/status") {
      return send(res, 200, { live: LIVE, model: LIVE ? MODEL : null, sample: task.sampleInput });
    }
    if (req.method === "POST" && req.url === "/api/run") {
      const input = JSON.parse(await readBody(req) || "{}");
      const problem = task.validate(input);
      if (problem) return send(res, 400, { error: problem });

      const extra = task.checks ? task.checks(input) : {};
      // Optional plain-code check on the AI's answer (no AI involved).
      const post = (src, result) => (task.postCheck ? task.postCheck(src, result) : result);
      if (!LIVE) {
        const demo = post(task.sampleInput, structuredClone(task.demoOutput));
        return send(res, 200, { demo: true, ...extra, result: demo });
      }
      const result = post(input, await runWithClaude(input));
      return send(res, 200, { demo: false, ...extra, result });
    }
    send(res, 404, { error: "Not found" });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: err.message || "Something went wrong." });
  }
});

server.listen(PORT, () => {
  console.log(`${task.name} is running at http://localhost:${PORT}`);
  console.log(LIVE ? `Live AI mode (${MODEL})` : "Demo mode: no API key found, showing built-in examples.");
});
