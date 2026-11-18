import { describe, expect, it } from "vitest";
import { emptyInbox, envelopes, hasBirthdayGift, inboxReducer, keptGroups, mailboxLabel, newCount, newReminders, withInboxDefaults, type InboxState, type Letter } from "@/app/intro/mail/inbox";

const DAY = 86_400_000;
const NOW = new Date(2026, 10, 10, 12).getTime();
const look = { skin: "#F1C7A0", hair: "#B8562E", shirt: "#7A4E8C", bg: "#E6D3F0", ring: "#7A4E8C" };
const kate = { id: "kate", name: "Kate Morgan", look, inCircle: false };
const leo = { id: "leo", name: "Leo", look, inCircle: true };
let n = 0;
const letter = (from: Letter["from"], sentAt: number, status: Letter["status"] = "new"): Letter => ({ id: `l${++n}`, from, photo: { kind: "art", art: "city" }, takenAt: sentAt - 400 * DAY, sentAt, status });
const withLetters = (...letters: Letter[]): InboxState => ({ ...emptyInbox, letters });

describe("new mail and stacking (MAILBOX-2, MAILBOX-3)", () => {
  it("counts new photos, not envelopes", () => {
    const s = withLetters(letter(kate, NOW - 3), letter(kate, NOW - 2), letter(leo, NOW - 1), letter(leo, NOW - 9 * DAY, "kept"));
    expect(newCount(s)).toBe(3);
    expect(mailboxLabel(3)).toBe("Your mailbox, 3 new photos");
    expect(mailboxLabel(1)).toBe("Your mailbox, 1 new photo");
    expect(mailboxLabel(0)).toBe("Your mailbox, nothing new");
  });

  it("stacks one person's new drops into one envelope, oldest first, envelopes in the order they arrived", () => {
    const a = letter(kate, NOW - 5);
    const b = letter(leo, NOW - 4);
    const c = letter(kate, NOW - 3);
    const env = envelopes(withLetters(c, b, a, letter(kate, NOW - 2, "kept")));
    expect(env.map((e) => e.from.id)).toEqual(["kate", "leo"]);
    expect(env[0].letters.map((l) => l.id)).toEqual([a.id, c.id]);
  });
});

describe("Done, remove, block and report (MAILBOX-4, MAILBOX-7)", () => {
  it("Done keeps the envelope's photos", () => {
    const a = letter(kate, NOW - 2);
    const b = letter(kate, NOW - 1);
    const s = inboxReducer(withLetters(a, b), { type: "keep", ids: [a.id, b.id] });
    expect(s.letters.map((l) => l.status)).toEqual(["kept", "kept"]);
    expect(newCount(s)).toBe(0);
  });

  it("removing takes it out of the mailbox for good", () => {
    const a = letter(leo, NOW - 1, "kept");
    const s = inboxReducer(withLetters(a), { type: "remove", ids: [a.id] });
    expect(s.letters[0].status).toBe("removed");
    expect(keptGroups(s, NOW)).toEqual([]);
  });

  it("blocking removes everything from them, and their later drops never arrive", () => {
    const a = letter(kate, NOW - 2, "kept");
    const b = letter(kate, NOW - 1);
    const other = letter(leo, NOW - 1);
    let s = inboxReducer(withLetters(a, b, other), { type: "block", personId: "kate" });
    expect(s.blocked).toEqual(["kate"]);
    expect(s.letters.filter((l) => l.from.id === "kate").every((l) => l.status === "removed")).toBe(true);
    expect(s.letters.find((l) => l.id === other.id)!.status).toBe("new");
    s = inboxReducer(s, { type: "receive", letter: letter(kate, NOW) });
    expect(newCount(s)).toBe(1);
  });

  it("reporting records it and removes the photo", () => {
    const a = letter(kate, NOW - 1);
    const s = inboxReducer(withLetters(a), { type: "report", letterId: a.id, at: NOW });
    expect(s.reports).toEqual([{ letterId: a.id, personId: "kate", at: NOW }]);
    expect(s.letters[0].status).toBe("removed");
  });

  it("receiving adds a new drop once", () => {
    const a = letter(leo, NOW);
    const s = inboxReducer(inboxReducer(emptyInbox, { type: "receive", letter: a }), { type: "receive", letter: a });
    expect(s.letters).toHaveLength(1);
    expect(newCount(s)).toBe(1);
  });
});

describe("kept mail (MAILBOX-5)", () => {
  it("groups kept photos newest first: this week, then by month, with the year when it isn't this one", () => {
    const thisWeek = letter(kate, NOW - 2 * DAY, "kept");
    const oct21 = letter(leo, new Date(2026, 9, 21).getTime(), "kept");
    const oct3 = letter(leo, new Date(2026, 9, 3).getTime(), "kept");
    const lastYear = letter(leo, new Date(2025, 11, 25).getTime(), "kept");
    const s = withLetters(oct3, letter(leo, NOW, "new"), lastYear, thisWeek, oct21, letter(leo, NOW - DAY, "removed"));
    const groups = keptGroups(s, NOW);
    expect(groups.map((g) => g.label)).toEqual(["this week", "october", "december 2025"]);
    expect(groups[1].letters.map((l) => l.id)).toEqual([oct21.id, oct3.id]);
  });
});

describe("birthday reminders (MAILBOX-11 to MAILBOX-13)", () => {
  const leoBday = { personId: "leo", day: "2026-11-13", daysAway: 3 };
  const momBday = { personId: "mom", day: "2026-11-15", daysAway: 5 };

  it("a coming birthday is new mail until you've seen it, once per birthday", () => {
    let s = emptyInbox;
    expect(newReminders([leoBday, momBday], s).map((u) => u.personId)).toEqual(["leo", "mom"]);
    s = inboxReducer(s, { type: "seeReminder", personId: "leo", day: "2026-11-13", at: NOW });
    s = inboxReducer(s, { type: "seeReminder", personId: "leo", day: "2026-11-13", at: NOW + 5 });
    expect(newReminders([leoBday, momBday], s).map((u) => u.personId)).toEqual(["mom"]);
    expect(s.seen).toEqual([{ id: "bday-leo-2026-11-13", personId: "leo", day: "2026-11-13", at: NOW }]);
    // Next year's is a new one.
    expect(newReminders([{ ...leoBday, day: "2027-11-13" }], s)).toHaveLength(1);
  });

  it("the mailbox says what's new: photos and birthdays", () => {
    expect(mailboxLabel(2, 1)).toBe("Your mailbox, 2 new photos and 1 birthday");
    expect(mailboxLabel(0, 2)).toBe("Your mailbox, 2 birthdays coming up");
    expect(mailboxLabel(0, 1)).toBe("Your mailbox, 1 birthday coming up");
  });

  it("knows when you've sent someone a gift for their birthday, from anywhere", () => {
    let s = emptyInbox;
    expect(hasBirthdayGift(s, "leo", "2026-11-13")).toBe(false);
    s = inboxReducer(s, { type: "birthdayGift", personId: "leo", day: "2026-11-13" });
    s = inboxReducer(s, { type: "birthdayGift", personId: "leo", day: "2026-11-13" });
    expect(hasBirthdayGift(s, "leo", "2026-11-13")).toBe(true);
    expect(hasBirthdayGift(s, "leo", "2027-11-13")).toBe(false);
    expect(s.birthdayGifts).toHaveLength(1);
  });

  it("a seen reminder is kept with your photos, by when you saw it", () => {
    const kept = letter(kate, NOW - 2 * DAY, "kept");
    let s = withLetters(kept);
    s = inboxReducer(s, { type: "seeReminder", personId: "leo", day: "2026-11-13", at: NOW - DAY });
    const groups = keptGroups(s, NOW);
    expect(groups.map((g) => g.label)).toEqual(["this week"]);
    expect(groups[0].letters.map((l) => l.id)).toEqual([kept.id]);
    expect(groups[0].reminders.map((r) => r.id)).toEqual(["bday-leo-2026-11-13"]);
  });

  it("mail saved before birthdays existed still loads", () => {
    const old = { letters: [], blocked: [], reports: [] } as unknown as InboxState;
    expect(withInboxDefaults(old)).toEqual({ letters: [], blocked: [], reports: [], seen: [], birthdayGifts: [] });
  });
});

