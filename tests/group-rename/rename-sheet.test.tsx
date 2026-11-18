import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { canRename, renameError } from "@/app/intro/group-names/group-names";
import { RenameSheet } from "@/components/profile/rename-sheet";

afterEach(cleanup);

const setup = (onSave: (raw: string) => Promise<void> = async () => {}) => {
  const onCancel = vi.fn();
  render(<RenameSheet current="Madrid Crew" canSave={(raw) => canRename(raw, "Madrid Crew")} errorFor={renameError} onSave={onSave} onCancel={onCancel} />);
  return { onCancel };
};
const field = () => screen.getByLabelText("Group name") as HTMLInputElement;
const save = () => screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
const type = (value: string) => fireEvent.change(field(), { target: { value } });

describe("rename sheet (RENAME-3)", () => {
  it("opens on the current name, with Save off", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "Rename group" })).toBeTruthy();
    expect(field().value).toBe("Madrid Crew");
    expect(save().disabled).toBe(true);
  });

  it("turns Save on for a valid new name, and off for empty, spaces or the same name", () => {
    setup();
    type("Lisbon Crew");
    expect(save().disabled).toBe(false);
    for (const value of ["", "   ", "  Madrid Crew "]) {
      type(value);
      expect(save().disabled).toBe(true);
    }
  });

  it("says when a name is too long, without cutting it off", () => {
    setup();
    expect(field().hasAttribute("maxlength")).toBe(false);
    type("a".repeat(41));
    expect(screen.getByText("Keep it to 40 characters.")).toBeTruthy();
    expect(save().disabled).toBe(true);
    expect(field().value).toHaveLength(41);
  });

  it("keeps the field at least 44px on any phone", () => {
    setup();
    expect(field().style.minHeight).toBe("44px");
    expect(save().style.minHeight).toBe("44px");
    expect((screen.getByRole("button", { name: "Cancel" }) as HTMLElement).style.minHeight).toBe("44px");
  });
});

describe("saving (RENAME-4)", () => {
  it("sends what was typed", async () => {
    const onSave = vi.fn(async () => {});
    setup(onSave);
    type("  Lisbon Crew ");
    fireEvent.click(save());
    await waitFor(() => expect(onSave).toHaveBeenCalledWith("  Lisbon Crew "));
  });

  it("can't be sent twice while saving", async () => {
    let finish = () => {};
    const onSave = vi.fn(() => new Promise<void>((r) => (finish = r)));
    setup(onSave);
    type("Lisbon Crew");
    fireEvent.click(save());
    await waitFor(() => expect(save().disabled).toBe(true));
    fireEvent.submit(field().form!);
    expect(onSave).toHaveBeenCalledTimes(1);
    finish();
  });

  it("stays open with a message when the save fails, and can try again", async () => {
    setup(async () => Promise.reject(new Error("offline")));
    type("Lisbon Crew");
    fireEvent.click(save());
    expect(await screen.findByText("Couldn't save. Try again.")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Rename group" })).toBeTruthy();
    expect(save().disabled).toBe(false);
  });
});
