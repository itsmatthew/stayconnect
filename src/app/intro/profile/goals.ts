// Next time together (docs/specs/group-profile.md, GP-7–9; docs/specs/home.md, HOME-19): at most one goal per group.
// A short label and an optional local date. It's a goal, not a calendar.

/** `date` is a local calendar day, "YYYY-MM-DD". `in` holds member ids (ME for the user), in the order they joined. */
export type Goal = { label: string; date?: string; setBy: string; in: readonly string[] };

/** Group id → its goal. */
export type GoalState = Readonly<Record<string, Goal>>;

export type GoalAction =
  | { type: "set"; groupId: string; label: string; date?: string; by: string }
  | { type: "clear"; groupId: string }
  | { type: "join"; groupId: string; who: string }
  | { type: "leave"; groupId: string; who: string }
  | { type: "load"; state: GoalState };

export const GOAL_LABEL_MAX = 32;

/** Trimmed and capped (GP-7). Blank means no goal. */
export const normalizeLabel = (raw: string) => raw.trim().slice(0, GOAL_LABEL_MAX).trim();

const without = (state: GoalState, groupId: string): GoalState => Object.fromEntries(Object.entries(state).filter(([id]) => id !== groupId));

export function goalsReducer(state: GoalState, action: GoalAction): GoalState {
  switch (action.type) {
    case "set": {
      const label = normalizeLabel(action.label);
      if (!label) return state;
      const date = action.date || undefined;
      const prev = state[action.groupId];
      // Only the date resets who's in; a label edit keeps everyone (GP-8).
      const keep = prev && prev.date === date;
      const goal: Goal = { label, ...(date ? { date } : {}), setBy: keep ? prev.setBy : action.by, in: keep ? prev.in : [action.by] };
      return { ...state, [action.groupId]: goal };
    }
    case "clear":
      return without(state, action.groupId);
    case "join": {
      const goal = state[action.groupId];
      if (!goal || goal.in.includes(action.who)) return state;
      return { ...state, [action.groupId]: { ...goal, in: [...goal.in, action.who] } };
    }
    case "leave": {
      const goal = state[action.groupId];
      if (!goal) return state;
      return { ...state, [action.groupId]: { ...goal, in: goal.in.filter((w) => w !== action.who) } };
    }
    case "load":
      return action.state;
  }
}

const DAY = 86_400_000;
const midnight = (t: number) => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
const dayOf = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
};

/** Whole local calendar days from today to `date` (negative once it's past). */
export const daysUntil = (date: string, now: number) => Math.round((dayOf(date) - midnight(now)) / DAY);

/** "46 days", "1 day", "today". */
export const dayCount = (days: number) => (days === 0 ? "today" : days === 1 ? "1 day" : `${days} days`);

/** "Dec 6". */
export const formatGoalDate = (date: string) => new Date(dayOf(date)).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** The group's goal, unless its date has passed (GP-9). */
export function activeGoal(state: GoalState, groupId: string, now: number): Goal | undefined {
  const goal = state[groupId];
  if (!goal || (goal.date && daysUntil(goal.date, now) < 0)) return undefined;
  return goal;
}

/** A dated goal whose date has passed and that nobody has answered yet: the profile asks how it went (GP-12). */
export function pastGoal(state: GoalState, groupId: string, now: number): Goal | undefined {
  const goal = state[groupId];
  return goal?.date && daysUntil(goal.date, now) < 0 ? goal : undefined;
}

/** Home's tag under the tree's name (HOME-19): "46 days · lake weekend". Undated goals have none. */
export function countdownTag(goal: Goal | undefined, now: number): string | undefined {
  if (!goal?.date) return undefined;
  const days = daysUntil(goal.date, now);
  return days < 0 ? undefined : `${dayCount(days)} · ${goal.label}`;
}

/** Today as "YYYY-MM-DD", for date inputs and seeds. */
export function localDay(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
