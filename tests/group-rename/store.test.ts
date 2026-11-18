import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { GroupNameStore } from "@/app/intro/group-names/group-names";
import { groupNamesKey, localGroupNameStore } from "@/app/intro/group-names/local-group-names";
import { useGroupNames } from "@/app/intro/group-names/use-group-names";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("local store (RENAME-8)", () => {
  it("round-trips", async () => {
    await localGroupNameStore("").save({ a: "Hoops" });
    expect(await localGroupNameStore("").load()).toEqual({ a: "Hoops" });
  });

  it("keeps demo and real names apart (DEMO-3)", async () => {
    expect(groupNamesKey("")).toBe("nowandthen.groupNames.v1");
    expect(groupNamesKey(".demo")).toBe("nowandthen.groupNames.v1.demo");
    await localGroupNameStore(".demo").save({ a: "Hoops" });
    expect(await localGroupNameStore("").load()).toEqual({});
  });

  it("treats missing or corrupt data as no renames", async () => {
    expect(await localGroupNameStore("").load()).toEqual({});
    localStorage.setItem(groupNamesKey(""), "{not json");
    expect(await localGroupNameStore("").load()).toEqual({});
  });

  it("fails the save when storage is blocked, so no rename is claimed", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    await expect(localGroupNameStore("").save({ a: "Hoops" })).rejects.toThrow();
  });
});

describe("useGroupNames (RENAME-4)", () => {
  const fake = (saved = {}): GroupNameStore & { saves: unknown[] } => {
    const saves: unknown[] = [];
    return { saves, load: async () => saved, save: async (n) => void saves.push(n) };
  };

  it("loads what's saved", async () => {
    const { result } = renderHook(() => useGroupNames(fake({ a: "Hoops" })));
    await waitFor(() => expect(result.current[0]).toEqual({ a: "Hoops" }));
  });

  it("applies a name only after it's saved, keeping earlier renames", async () => {
    const store = fake({ a: "Hoops" });
    const { result } = renderHook(() => useGroupNames(store));
    await waitFor(() => expect(result.current[0]).toEqual({ a: "Hoops" }));
    await act(() => result.current[1]("b", "Lake"));
    expect(result.current[0]).toEqual({ a: "Hoops", b: "Lake" });
    expect(store.saves).toEqual([{ a: "Hoops", b: "Lake" }]);
  });

  it("changes nothing when the save fails, and passes the failure on", async () => {
    const store: GroupNameStore = { load: async () => ({}), save: async () => Promise.reject(new Error("offline")) };
    const { result } = renderHook(() => useGroupNames(store));
    await act(async () => {
      await expect(result.current[1]("a", "Hoops")).rejects.toThrow("offline");
    });
    expect(result.current[0]).toEqual({});
  });
});
