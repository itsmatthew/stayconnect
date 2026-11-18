import { describe, expect, it } from "vitest";
import { emptyInbox, inboxReducer, keptGroups, mailboxLabel, newCount, welcomeDue, welcomeIsNew, withInboxDefaults, type InboxState } from "@/app/intro/mail/inbox";

const NOW = new Date(2026, 10, 8, 9).getTime();
const DAY = 86_400_000;

describe("the welcome letter arrives once (ONB-1)", () => {
  it("is due for someone with no circles who never got one", () => {
    expect(welcomeDue(emptyInbox, 0)).toBe(true);
  });

  it("isn't due once you have circles, or once it came", () => {
    expect(welcomeDue(emptyInbox, 2)).toBe(false);
    const got = inboxReducer(emptyInbox, { type: "welcome", at: NOW });
    expect(welcomeDue(got, 0)).toBe(false);
    expect(welcomeDue(inboxReducer(got, { type: "readWelcome" }), 0)).toBe(false);
  });

  it("arrives new, on its day, and only the first time", () => {
    const got = inboxReducer(emptyInbox, { type: "welcome", at: NOW });
    expect(got.welcome).toEqual({ at: NOW, status: "new" });
    expect(inboxReducer(got, { type: "welcome", at: NOW + DAY })).toBe(got);
  });

  it("is kept once read, and stays kept", () => {
    const got = inboxReducer(emptyInbox, { type: "welcome", at: NOW });
    const read = inboxReducer(got, { type: "readWelcome" });
    expect(read.welcome).toEqual({ at: NOW, status: "kept" });
    expect(inboxReducer(read, { type: "readWelcome" })).toBe(read);
    expect(inboxReducer(emptyInbox, { type: "readWelcome" })).toBe(emptyInbox);
  });

  it("mail saved before the letter existed has none", () => {
    const old = { letters: [], blocked: [], reports: [], seen: [], birthdayGifts: [] } as unknown as InboxState;
    expect(withInboxDefaults(old).welcome).toBeUndefined();
  });
});

describe("on your tree (ONB-3)", () => {
  it("is new mail until read, and isn't a photo", () => {
    const got = inboxReducer(emptyInbox, { type: "welcome", at: NOW });
    expect(welcomeIsNew(got)).toBe(true);
    expect(newCount(got)).toBe(0);
    expect(welcomeIsNew(inboxReducer(got, { type: "readWelcome" }))).toBe(false);
    expect(welcomeIsNew(emptyInbox)).toBe(false);
  });

  it("says a welcome letter, with whatever else is new", () => {
    expect(mailboxLabel(0, 0, true)).toBe("Your mailbox, a welcome letter");
    expect(mailboxLabel(2, 0, true)).toBe("Your mailbox, a welcome letter and 2 new photos");
    expect(mailboxLabel(0, 1, true)).toBe("Your mailbox, a welcome letter and 1 birthday coming up");
    expect(mailboxLabel(1, 2, true)).toBe("Your mailbox, a welcome letter, 1 new photo and 2 birthdays");
    expect(mailboxLabel(2, 0)).toBe("Your mailbox, 2 new photos");
  });
});

describe("kept (ONB-6)", () => {
  it("joins the group of the week it arrived, once read", () => {
    const got = inboxReducer(emptyInbox, { type: "welcome", at: NOW });
    expect(keptGroups(got, NOW + DAY)).toEqual([]);
    const read = inboxReducer(got, { type: "readWelcome" });
    expect(keptGroups(read, NOW + DAY)).toEqual([{ label: "this week", letters: [], reminders: [], welcome: true }]);
    expect(keptGroups(read, NOW + 40 * DAY)[0]).toMatchObject({ label: "november", welcome: true });
  });
});
