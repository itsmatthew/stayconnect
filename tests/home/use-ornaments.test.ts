import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { openOrnamentStore, type OrnamentStore } from "@/app/intro/ornaments/ornament-store";
import { ornamentKey } from "@/app/intro/ornaments/ornaments";
import { useOrnaments } from "@/app/intro/ornaments/use-ornaments";

URL.createObjectURL = vi.fn(() => "blob:ornament");
URL.revokeObjectURL = vi.fn();

describe("closing mid-write (HOME-17)", () => {
  it("an undo still deletes the image it made unreachable when the screen closes while saving", async () => {
    const store = await openOrnamentStore("use-ornaments-close");
    let release: (() => void) | null = null;
    let hold = false;
    const save = store.save;
    const gated: OrnamentStore = {
      ...store,
      save: async (state) => {
        if (hold) await new Promise<void>((r) => (release = r));
        return save(state);
      },
      deleteImage: vi.fn(store.deleteImage),
      close: vi.fn(store.close),
    };
    const open = async () => gated;
    const { result, unmount } = renderHook(() => useOrnaments(open));
    await waitFor(() => expect(result.current.urls).toEqual({}));

    await act(() => result.current.change("g", 0, { image: new Blob(["a"]), caption: "a" }, "me", 1));
    await act(() => result.current.change("g", 0, { image: new Blob(["b"]), caption: "b" }, "me", 2));
    const b = result.current.state[ornamentKey("g", 0)]!.current.photoId!;

    hold = true;
    let undone!: Promise<void>;
    act(() => {
      undone = result.current.undo("g", 0);
    });
    await waitFor(() => expect(release).not.toBeNull());
    unmount();
    release!();

    await expect(undone).resolves.toBeUndefined();
    expect(gated.deleteImage).toHaveBeenCalledWith(b);
    await waitFor(() => expect(gated.close).toHaveBeenCalled());
    const reopened = await openOrnamentStore("use-ornaments-close");
    expect(await reopened.image(b)).toBeUndefined();
    reopened.close();
  });
});
