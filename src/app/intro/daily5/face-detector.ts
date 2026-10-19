// In-browser face *detection* (never recognition) for Daily 5 (docs/specs/daily5.md, D5-7).
// MediaPipe's BlazeFace short-range model, with its WASM and model served from /public: photos never leave the device.
// Browser only; checked by hand, since jsdom has no WASM or canvas (the tests inject a stand-in).

import type { FaceDetector } from "@mediapipe/tasks-vision";

let detector: Promise<FaceDetector> | null = null;

// MediaPipe's WASM runtime writes its own chatter to the console: "INFO: …" through console.error and
// glog-style "I…"/"W…" lines. Next's dev overlay counts the console.error ones as errors. While the runtime
// runs, drop exactly those lines; anything else (including glog "E…" errors) still gets through.
const RUNTIME_CHATTER = /^(INFO: |[IW]\d{4} \d{2}:\d{2}:\d{2}\.\d+ )/;
let quietDepth = 0;
let restore: (() => void) | null = null;

/** Runs `fn` with the runtime's info and warning lines filtered from the console. */
export async function quietRuntimeLogs<T>(fn: () => Promise<T>): Promise<T> {
  if (quietDepth++ === 0) {
    const { error, warn, log } = console;
    const filter =
      (write: (...args: unknown[]) => void) =>
      (...args: unknown[]) => {
        if (typeof args[0] === "string" && RUNTIME_CHATTER.test(args[0])) return;
        write.apply(console, args);
      };
    console.error = filter(error);
    console.warn = filter(warn);
    console.log = filter(log);
    restore = () => Object.assign(console, { error, warn, log });
  }
  try {
    return await fn();
  } finally {
    if (--quietDepth === 0) {
      restore?.();
      restore = null;
    }
  }
}

function load(): Promise<FaceDetector> {
  detector ??= (async () => {
    const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const wasm = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    return FaceDetector.createFromOptions(wasm, {
      baseOptions: { modelAssetPath: "/mediapipe/blaze_face_short_range.tflite" },
      runningMode: "IMAGE",
      minDetectionConfidence: 0.5,
    });
  })();
  return detector;
}

/**
 * Whether the photo has at least one face. The short-range model is tuned for faces that fill a good part
 * of the frame, so when the whole image finds none, look again at four overlapping corner tiles to catch
 * smaller faces in group shots.
 */
export function detectFaces(image: Blob): Promise<boolean> {
  return quietRuntimeLogs(() => detect(image));
}

async function detect(image: Blob): Promise<boolean> {
  const fd = await load();
  const bitmap = await createImageBitmap(image);
  try {
    if (fd.detect(bitmap).detections.length > 0) return true;
    const tw = Math.round(bitmap.width * 0.6);
    const th = Math.round(bitmap.height * 0.6);
    const canvas = new OffscreenCanvas(tw, th);
    const ctx = canvas.getContext("2d")!;
    for (const [x, y] of [
      [0, 0],
      [bitmap.width - tw, 0],
      [0, bitmap.height - th],
      [bitmap.width - tw, bitmap.height - th],
    ]) {
      ctx.clearRect(0, 0, tw, th);
      ctx.drawImage(bitmap, x, y, tw, th, 0, 0, tw, th);
      if (fd.detect(canvas).detections.length > 0) return true;
    }
    return false;
  } finally {
    bitmap.close();
  }
}
