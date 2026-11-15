// Times on the recents list (docs/specs/messages.md, MSG-1), as in the reference: "2:14 pm", "Sunday", "Oct 3".

const DAY = 24 * 60 * 60 * 1000;

export function formatChatTime(at: number, now: number): string {
  const d = new Date(at);
  const today = new Date(now);
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  }
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (at >= startOfToday - 6 * DAY) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
