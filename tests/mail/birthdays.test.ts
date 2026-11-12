import { describe, expect, it } from "vitest";
import { birthdayFor, birthdayLong, birthdayShort, countdown, nextBirthday, reminderId, upcomingBirthdays, WEEK } from "@/app/intro/mail/birthdays";

describe("the next birthday (MAILBOX-11)", () => {
  it("is this year's, or next year's once it has passed", () => {
    expect(nextBirthday("11-16", "2026-11-12")).toBe("2026-11-16");
    expect(nextBirthday("11-12", "2026-11-12")).toBe("2026-11-12");
    expect(nextBirthday("03-01", "2026-11-12")).toBe("2027-03-01");
  });

  it("crosses the new year", () => {
    expect(nextBirthday("01-02", "2026-12-30")).toBe("2027-01-02");
  });

  it("a Feb 29 birthday falls on Feb 28 in other years", () => {
    expect(nextBirthday("02-29", "2027-01-10")).toBe("2027-02-28");
    expect(nextBirthday("02-29", "2028-01-10")).toBe("2028-02-29");
  });
});

describe("who's coming up: your whole circle, a week ahead (MAILBOX-11)", () => {
  const birthdays = { leo: "11-16", grandma: "12-02", mom: "11-12", priya: "11-19", stranger: "11-13" };
  const circle = ["leo", "grandma", "mom", "priya"];

  it("everyone in your circle with a birthday within 7 days, soonest first", () => {
    expect(upcomingBirthdays(birthdays, circle, "2026-11-12")).toEqual([
      { personId: "mom", day: "2026-11-12", daysAway: 0 },
      { personId: "leo", day: "2026-11-16", daysAway: 4 },
      { personId: "priya", day: "2026-11-19", daysAway: 7 },
    ]);
    expect(WEEK).toBe(7);
  });

  it("never someone outside your circle, or without a birthday", () => {
    const ids = upcomingBirthdays(birthdays, [...circle, "nobirthday"], "2026-11-12").map((u) => u.personId);
    expect(ids).not.toContain("stranger");
    expect(ids).not.toContain("nobirthday");
  });

  it("across the new year", () => {
    expect(upcomingBirthdays({ a: "01-02" }, ["a"], "2026-12-30")).toEqual([{ personId: "a", day: "2027-01-02", daysAway: 3 }]);
  });
});

describe("how a birthday reads (MAILBOX-11)", () => {
  it("counts down: in N days, tomorrow, today", () => {
    expect(countdown(7)).toBe("in 7 days");
    expect(countdown(3)).toBe("in 3 days");
    expect(countdown(1)).toBe("tomorrow");
    expect(countdown(0)).toBe("today");
  });

  it("names the day long on the card and short on a badge", () => {
    expect(birthdayLong("2026-11-16")).toBe("Monday, Nov 16");
    expect(birthdayShort("2026-11-16")).toBe("Mon");
  });

  it("one reminder per person per birthday", () => {
    expect(reminderId("leo", "2026-11-16")).toBe("bday-leo-2026-11-16");
    expect(reminderId("leo", "2027-11-16")).not.toBe(reminderId("leo", "2026-11-16"));
  });
});

describe("a gift for their birthday (MAILBOX-12)", () => {
  it("is one that opens on their next birthday, or is sent on the day itself", () => {
    expect(birthdayFor("11-13", "2026-11-13", "2026-11-10")).toBe("2026-11-13");
    expect(birthdayFor("11-13", "2026-11-14", "2026-11-10")).toBeUndefined();
    expect(birthdayFor("11-10", "2026-11-10", "2026-11-10")).toBe("2026-11-10");
    expect(birthdayFor(undefined, "2026-11-13", "2026-11-10")).toBeUndefined();
  });
});

