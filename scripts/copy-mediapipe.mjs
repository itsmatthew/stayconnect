// Copies MediaPipe's WASM runtime into public/ so face detection is served from this app, not a CDN.
// Runs before `next dev` and `next build`; the copy is gitignored (docs/specs/daily5.md, D5-7).
import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules/@mediapipe/tasks-vision/wasm");
const to = join(root, "public/mediapipe/wasm");
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log("copied MediaPipe wasm → public/mediapipe/wasm");
