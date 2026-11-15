import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AppClient } from "@/app/intro/app-client";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import { chatReducer, initialChatState, type ChatState } from "@/app/intro/messages/conversations";
import { chatStorageKey } from "@/app/intro/messages/use-chat";
import { demoData } from "@/app/intro/app-data";
import { seedConversations } from "@/app/intro/placeholder-data";

const NOW = new Date(2026, 9, 14, 12).getTime();
let n = 0;

beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:photo");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

function renderMessages() {
  const name = `messages-test-${++n}`;
  return render(
    <AppClient initialTab="Messages" data={demoData} now={() => NOW} openStore={() => openPhotoStore(name)} hasFace={async () => true} />,
  );
}
function seedWithSealed(...conversationIds: string[]) {
  let s: ChatState = initialChatState(seedConversations(NOW));
  conversationIds.forEach((conversationId, i) => {
    s = chatReducer(s, {
      type: "sendMemory",
      id: `mem-${i}`,
      conversationId,
      photoId: `photo-${i}`,
      takenAt: new Date(2023, 6, 2).getTime(),
      note: "remember this?",
      at: NOW - 60_000,
    });
  });
  localStorage.setItem(chatStorageKey(demoData.storageSuffix), JSON.stringify(s));
}

const pinned = (row: string) =>
  within(screen.getByRole("group", { name: row }))
    .getAllByRole("button")
    .map((b) => b.getAttribute("aria-label"));
const chatList = () =>
  within(screen.getByRole("list", { name: "Chats" }))
    .queryAllByRole("button")
    .map((b) => b.getAttribute("aria-label"));
const open = (label: RegExp | string) => fireEvent.click(screen.getByRole("button", { name: label }));
const back = () => fireEvent.click(screen.getByRole("button", { name: "Back to messages" }));

describe("Messages — recents (MSG-1/2)", () => {
  it("pins the closest circles and closest people, then lists other chats by recent activity", () => {
    renderMessages();
    expect(screen.getByRole("heading", { name: "Messages" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "New message" })).toBeTruthy();
    expect(pinned("closest circles")).toEqual([
      "Madrid Crew, nothing new",
      "Hoops Since ’14, new messages",
      "Apt 4B, nothing new",
      "Family, nothing new",
    ]);
    expect(pinned("closest people")).toEqual(["Leo, new messages", "Priya, nothing new", "Ana, nothing new"]);
    expect(chatList()).toEqual(["Fall 24, new messages", "Sam, nothing new", "Uni Mates, nothing new", "Work Mates, nothing new"]);
  });

  it("shows each chat's last message, with the sender in groups, and its time", () => {
    renderMessages();
    const fall = screen.getByRole("button", { name: "Fall 24, new messages" });
    expect(fall.textContent).toContain("Jordan: who has the tailgate tent");
    expect(fall.textContent).toContain("11:20 am");
  });

  it("search filters pinned rows and the list by name", () => {
    renderMessages();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search messages" }), { target: { value: "MAT" } });
    expect(chatList()).toEqual(["Uni Mates, nothing new", "Work Mates, nothing new"]);
    expect(screen.queryByRole("group", { name: "closest circles" })).toBeNull();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search messages" }), { target: { value: "pri" } });
    expect(pinned("closest people")).toEqual(["Priya, nothing new"]);
  });

  it("opening a chat clears its glow", () => {
    renderMessages();
    open("Hoops Since ’14, new messages");
    back();
    expect(pinned("closest circles")[1]).toBe("Hoops Since ’14, nothing new");
  });
});

describe("Messages — thread (MSG-3)", () => {
  it("shows the header, bubbles and Delivered under my last message", () => {
    renderMessages();
    open("Madrid Crew, nothing new");
    expect(screen.getByRole("heading", { name: "Madrid Crew" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Madrid Crew now" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Madrid Crew then" })).toBeTruthy();
    const log = screen.getByRole("log", { name: "Conversation" });
    expect(log.textContent).toContain("rooftop again friday?");
    expect(within(log).getByText("Delivered")).toBeTruthy();
  });

  it("sends text from the composer, bumping the chat", () => {
    renderMessages();
    open("Work Mates, nothing new");
    expect(screen.queryByText("Delivered")).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Message Work Mates" }), { target: { value: "rematch friday" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    const log = screen.getByRole("log", { name: "Conversation" });
    expect(log.textContent).toContain("rematch friday");
    expect(within(log).getByText("Delivered")).toBeTruthy();
    back();
    expect(chatList()[0]).toBe("Work Mates, nothing new");
  });
});

describe("Messages — sealed until reply (MSG-4/5/6)", () => {
  it("a sealed memory leaves no trace: no thread entry, no glow, no bump, no Delivered", () => {
    seedWithSealed("group:work-mates", "group:apt-4b");
    renderMessages();
    expect(chatList().at(-1)).toBe("Work Mates, nothing new");
    expect(pinned("closest circles")[2]).toBe("Apt 4B, nothing new");
    open("Work Mates, nothing new");
    const log = screen.getByRole("log", { name: "Conversation" });
    expect(log.textContent).not.toContain("remember this?");
    expect(within(log).queryByRole("figure")).toBeNull();
    expect(within(log).queryByText("Delivered")).toBeNull();
  });

  it("a simulated reply reveals the memory with the reply and moves the chat to the top", () => {
    seedWithSealed("group:work-mates");
    renderMessages();
    const dev = screen.getByRole("region", { name: "Sealed memories (dev)" });
    fireEvent.click(within(dev).getByRole("button", { name: "Simulate reply in Work Mates" }));
    expect(screen.queryByRole("region", { name: "Sealed memories (dev)" })).toBeNull();
    expect(chatList()[0]).toBe("Work Mates, new messages");

    open("Work Mates, new messages");
    const log = screen.getByRole("log", { name: "Conversation" });
    const items = Array.from(log.querySelectorAll("[data-message]"));
    const memory = items.findIndex((el) => el.querySelector("figure"));
    expect(memory).toBe(items.length - 2);
    const figure = within(items[memory] as HTMLElement).getByRole("figure", { name: "Memory from Jul 2, 2023" });
    expect(figure.querySelector("figcaption")!.textContent).toBe("remember this?");
    expect(items.at(-1)!.getAttribute("data-mine")).toBe("false");
    expect(within(log).queryByText("Delivered")).toBeNull();
  });

  it("a reply to a pinned circle makes it glow", () => {
    seedWithSealed("group:madrid-crew");
    renderMessages();
    fireEvent.click(screen.getByRole("button", { name: "Simulate reply in Madrid Crew" }));
    expect(pinned("closest circles")[0]).toBe("Madrid Crew, new messages");
  });

  it("the simulate-reply strip never renders in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    seedWithSealed("group:work-mates");
    renderMessages();
    expect(screen.queryByRole("region", { name: "Sealed memories (dev)" })).toBeNull();
    expect(screen.queryByRole("button", { name: /simulate reply/i })).toBeNull();
  });
});

describe("Messages — kept (MSG-7)", () => {
  it("survives a reload", () => {
    const first = renderMessages();
    open("Work Mates, nothing new");
    fireEvent.change(screen.getByRole("textbox", { name: "Message Work Mates" }), { target: { value: "still here" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    first.unmount();
    renderMessages();
    open("Work Mates, nothing new");
    expect(screen.getByRole("log", { name: "Conversation" }).textContent).toContain("still here");
  });
});
