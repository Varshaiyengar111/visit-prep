// Builds the free online demo for GitHub Pages into ./docs.
// The online copy only shows the built-in example. It never calls the AI and contains no key.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import task from "./task.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const docs = path.join(here, "docs");
fs.mkdirSync(docs, { recursive: true });
fs.copyFileSync(path.join(here, "public", "index.html"), path.join(docs, "index.html"));

const sample = task.sampleInput;
const result = task.postCheck ? task.postCheck(sample, structuredClone(task.demoOutput)) : task.demoOutput;
const demo = {
  status: { live: false, model: null, sample },
  run: { demo: true, ...(task.checks ? task.checks(sample) : {}), result },
  ...(task.urgentWords ? { urgentWords: task.urgentWords } : {}),
};
fs.writeFileSync(path.join(docs, "demo.json"), JSON.stringify(demo, null, 2));
fs.writeFileSync(path.join(docs, ".nojekyll"), "");
console.log("Online demo built in docs/");
