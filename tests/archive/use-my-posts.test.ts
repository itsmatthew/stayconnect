import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ArchiveStore, NewPost } from "@/app/intro/archive/archive-store";
import type { ArchivePost } from "@/app/intro/archive/posts";
import { useMyPosts } from "@/app/intro/archive/use-my-posts";

const saved = (id: string, period: string): ArchivePost => ({ id, author: "me", period, postedAt: 1, takenAt: 1, photo: { kind: "stored", photoId: id } });

describe("your posts (ARC-3)", () => {
  it("keeps a post made while the saved ones are still loading", async () => {
    let finishLoading: (posts: ArchivePost[]) => void = () => {};
    const store: ArchiveStore = {
      posts: () => new Promise((r) => (finishLoading = r)),
      add: async (p: NewPost) => saved("new", p.period),
      image: async () => undefined,
      close: () => {},
    };
    const { result } = renderHook(() => useMyPosts(store, []));
    await act(() => result.current.add({ period: "2026-W43", postedAt: 1, takenAt: 1, image: new Blob(["x"]) }));
    // The load started before the post, and finishes after it, without the new post in it.
    await act(async () => finishLoading([saved("old", "2026-W42")]));
    await waitFor(() => expect(result.current.mine.map((p) => p.id).sort()).toEqual(["new", "old"]));
  });

  it("doesn't list a post twice when the load already has it", async () => {
    let finishLoading: (posts: ArchivePost[]) => void = () => {};
    const store: ArchiveStore = {
      posts: () => new Promise((r) => (finishLoading = r)),
      add: async (p: NewPost) => saved("new", p.period),
      image: async () => undefined,
      close: () => {},
    };
    const { result } = renderHook(() => useMyPosts(store, []));
    await act(() => result.current.add({ period: "2026-W43", postedAt: 1, takenAt: 1, image: new Blob(["x"]) }));
    await act(async () => finishLoading([saved("new", "2026-W43")]));
    expect(result.current.mine.map((p) => p.id)).toEqual(["new"]);
  });
});
