import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { SendSheet } from "@/components/daily5/send-sheet";
import { recipientSections } from "@/app/intro/parties";
import { friends, placeholderGroups } from "@/app/intro/placeholder-data";

afterEach(cleanup);

const recipients = recipientSections(placeholderGroups, friends);
function renderSheet() {
  const onSend = vi.fn();
  const onCancel = vi.fn();
  render(<SendSheet photo={{ src: "blob:photo", alt: "Photo from Jul 2, 2023" }} recipients={recipients} onSend={onSend} onCancel={onCancel} />);
  const sheet = screen.getByRole("dialog", { name: "Send this to…" });
  return { sheet, onSend, onCancel };
}
const sections = (sheet: HTMLElement) => within(sheet).queryAllByRole("group").map((g) => g.getAttribute("aria-label"));
const names = (sheet: HTMLElement, section: string) =>
  within(within(sheet).getByRole("group", { name: section }))
    .getAllByRole("button")
    .map((b) => b.getAttribute("aria-label")!.replace(/^Send to /, ""));
const sendButton = (sheet: HTMLElement) => within(sheet).getByRole("button", { name: "Send" }) as HTMLButtonElement;

describe("send sheet (D5-11)", () => {
  it("shows the photo, the title, Cancel and a search box", () => {
    const { sheet, onCancel } = renderSheet();
    expect(within(sheet).getByRole("img", { name: "Photo from Jul 2, 2023" })).toBeTruthy();
    expect(within(sheet).getByRole("searchbox")).toBeTruthy();
    fireEvent.click(within(sheet).getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("lists closest circles, then other groups, then people", () => {
    const { sheet } = renderSheet();
    expect(sections(sheet)).toEqual(["closest circles", "other groups", "people"]);
    expect(names(sheet, "closest circles")).toEqual(["Madrid Crew", "Hoops Since ’14", "Apt 4B", "Family"]);
    expect(names(sheet, "other groups")).toEqual(["Uni Mates", "Work Mates", "Fall 24"]);
    expect(names(sheet, "people")).toEqual(friends.map((f) => f.name));
  });

  it("filters every section by name, ignoring case, and hides empty sections", () => {
    const { sheet } = renderSheet();
    fireEvent.change(within(sheet).getByRole("searchbox"), { target: { value: "MATES" } });
    expect(sections(sheet)).toEqual(["other groups"]);
    expect(names(sheet, "other groups")).toEqual(["Uni Mates", "Work Mates"]);
    fireEvent.change(within(sheet).getByRole("searchbox"), { target: { value: friends[0].name.slice(0, 3).toLowerCase() } });
    expect(names(sheet, "people")).toContain(friends[0].name);
  });

  it("disables Send until exactly one recipient is picked", () => {
    const { sheet } = renderSheet();
    expect(sendButton(sheet).disabled).toBe(true);
    expect(within(sheet).getByText("pick a circle or a person")).toBeTruthy();
    const madrid = within(sheet).getByRole("button", { name: "Send to Madrid Crew" });
    const uni = within(sheet).getByRole("button", { name: "Send to Uni Mates" });
    fireEvent.click(madrid);
    expect(madrid.getAttribute("aria-pressed")).toBe("true");
    expect(sendButton(sheet).disabled).toBe(false);
    expect(within(sheet).getByText("tap the arrow to send")).toBeTruthy();
    fireEvent.click(uni);
    expect(madrid.getAttribute("aria-pressed")).toBe("false");
    expect(uni.getAttribute("aria-pressed")).toBe("true");
  });

  it("asks for something specific about the moment, as a visible label above the field (D5-11)", () => {
    const { sheet } = renderSheet();
    const prompt = "What’s something specific you remember from this moment or era?";
    const field = within(sheet).getByRole("textbox", { name: prompt }) as HTMLInputElement;
    expect(field.placeholder).toBe("the night we…");
    const label = within(sheet).getByText(prompt);
    expect(label.tagName).toBe("LABEL");
    expect(label.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("sends the picked recipient and the answer (D5-11)", () => {
    const { sheet, onSend } = renderSheet();
    fireEvent.click(within(sheet).getByRole("button", { name: `Send to ${friends[0].name}` }));
    fireEvent.change(within(sheet).getByRole("textbox", { name: /something specific you remember/ }), { target: { value: "remember this?" } });
    fireEvent.click(sendButton(sheet));
    expect(onSend).toHaveBeenCalledWith(`friend:${friends[0].id}`, "remember this?");
  });
});
