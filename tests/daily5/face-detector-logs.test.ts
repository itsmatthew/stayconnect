import { afterEach, describe, expect, it, vi } from "vitest";
import { quietRuntimeLogs } from "@/app/intro/daily5/face-detector";

afterEach(() => vi.restoreAllMocks());

describe("face detection runtime logs (D5-7)", () => {
  it("drops the runtime's own INFO and glog-style warning lines, keeps real errors", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await quietRuntimeLogs(async () => {
      console.error("INFO: Created TensorFlow Lite XNNPACK delegate for CPU.");
      console.warn("W1014 23:44:56.592000 2191552 gl_context.cc:1135] OpenGL error checking is disabled");
      console.error("I0000 00:00:00.000000 1 something.cc:1] info line");
      console.error("real failure", new Error("boom"));
      return 42;
    });
    expect(result).toBe(42);
    expect(error.mock.calls.map((c) => c[0])).toEqual(["real failure"]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("puts the console back afterwards, even when the call throws", async () => {
    const original = console.error;
    await expect(quietRuntimeLogs(async () => { throw new Error("x"); })).rejects.toThrow("x");
    expect(console.error).toBe(original);
  });
});
