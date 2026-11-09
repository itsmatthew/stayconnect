import type { Share } from "./mail";

/** The browser's share sheet, or the clipboard where there isn't one. */
export const browserShare: Share = {
  async share({ url, text }) {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ url, text });
        return "shared";
      } catch {
        return "cancelled";
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      return "copied";
    } catch {
      return "cancelled";
    }
  },
};
