import { describe, expect, it } from "vitest";
import { encodeInvite, joinedCircle, readInvite } from "@/app/intro/onboarding/invite";
import { localCircleInvites } from "@/app/intro/onboarding/local-circle-invites";
import { circleGroup, validCircles } from "@/app/intro/onboarding/my-circles";

const NOW = new Date(2026, 10, 9, 17).getTime();

describe("the invite link (ONB-19)", () => {
  it("reads back what a made link carries, emoji and all", async () => {
    const { link } = await localCircleInvites("https://x.test").create({ id: "mine-1", name: "Röd Robin 🌲", colorId: "red", from: "Maya" });
    const token = new URL(link).searchParams.get("invite")!;
    expect(readInvite(token)).toEqual({ id: "mine-1", name: "Röd Robin 🌲", colorId: "red", from: "Maya" });
  });

  it("a link without a name has no from", () => {
    expect(readInvite(encodeInvite({ id: "c", name: "Lake Week", colorId: "teal" }))).toEqual({ id: "c", name: "Lake Week", colorId: "teal" });
  });

  it("anything it can't read is no invite", () => {
    expect(readInvite("")).toBeNull();
    expect(readInvite("not base64 ~~")).toBeNull();
    expect(readInvite(encodeInvite({ id: "c", name: "", colorId: "red" }))).toBeNull();
    expect(readInvite(btoa(JSON.stringify({ id: 4, name: "x", colorId: "red" })))).toBeNull();
    expect(readInvite(btoa("[1,2]"))).toBeNull();
  });

  it("an unknown color is no invite", () => {
    expect(readInvite(encodeInvite({ id: "c", name: "Lake Week", colorId: "plaid" }))).toBeNull();
  });
});

describe("joining (ONB-20)", () => {
  it("a joined circle says who saved you a spot, with you and them as friends", () => {
    const c = joinedCircle({ id: "c", name: "Red Robin", colorId: "red", from: "Maya" }, NOW);
    expect(c).toEqual({ id: "c", name: "Red Robin", colorId: "red", createdAt: NOW, from: "Maya", joined: true });
    expect(circleGroup(c)).toMatchObject({ lastMemory: "you joined just now · Maya saved you a spot", friendCount: 2 });
  });

  it("with no name, just that you joined", () => {
    expect(circleGroup(joinedCircle({ id: "c", name: "Red Robin", colorId: "red" }, NOW)).lastMemory).toBe("you joined just now");
  });

  it("a circle you started still says so", () => {
    expect(circleGroup({ id: "c", name: "Red Robin", colorId: "red", createdAt: NOW })).toMatchObject({ lastMemory: "you started it", friendCount: 1 });
  });

  it("saved joined circles load back", () => {
    const c = joinedCircle({ id: "c", name: "Red Robin", colorId: "red", from: "Maya" }, NOW);
    expect(validCircles(JSON.parse(JSON.stringify([c])))).toEqual([c]);
  });
});
