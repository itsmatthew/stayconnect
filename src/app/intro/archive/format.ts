// When a post went up, as on the reference's cards: "Tuesday · 2:40 pm"; monthly and yearly cards: "Sep 30 · 2:40 pm".
import type { Period } from "./periods";

export function postTime(postedAt: number, period: Period): string {
  const d = new Date(postedAt);
  const day =
    period.kind === "week" || period.kind === "bonus"
      ? d.toLocaleDateString("en-US", { weekday: "long" })
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  return `${day} · ${time}`;
}
