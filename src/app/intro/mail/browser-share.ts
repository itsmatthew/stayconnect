import type { Share } from "./mail";

/** The browser's share sheet, or the clipboard where there isn't one. */
export const browserShare: Share = {
  async share({ url, text }) {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(url ? { url, text } : { text });
        return "shared";
      } catch {
        return "cancelled";
      }
    }
    try {
      await navigator.clipboard.writeText(url ? `${text} ${url}` : text);
      return "copied";
    } catch {
      return "cancelled";
    }
  },
};
