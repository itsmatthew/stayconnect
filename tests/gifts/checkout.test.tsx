import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AppClient } from "@/app/intro/app-client";
import { demoData } from "@/app/intro/app-data";
import { openArchiveStore } from "@/app/intro/archive/archive-store";
import { openPhotoStore } from "@/app/intro/daily5/photo-store";
import type { Gift } from "@/app/intro/gifts/gift";
import type { GiftDelivery } from "@/app/intro/gifts/gift-delivery";
import { giftsKey } from "@/app/intro/gifts/local-gift-store";
import { betaPayment, type PaymentService } from "@/app/intro/gifts/payment";
import { localPayment } from "@/app/intro/gifts/local-payment";
import { openOrnamentStore } from "@/app/intro/ornaments/ornament-store";

const NOW = new Date(2026, 10, 9, 12).getTime();
const OLD = new Date(2021, 4, 1).getTime();
let n = 0;
let dbName = "";
beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:x");
  URL.revokeObjectURL = vi.fn();
  dbName = `checkout-${++n}`;
});
afterEach(cleanup);

const seedPhotos = async () => {
  const store = await openPhotoStore(`${dbName}-photos`);
  await store.add({ pool: "mine", fileKey: "m0", takenAt: OLD, image: new Blob(["m0"]) });
  store.close();
};
const renderMe = (payment: PaymentService = localPayment({ wait: async () => {} }), giftDelivery?: () => GiftDelivery) =>
  render(
    <AppClient
      initialTab="Me"
      data={demoData}
      now={() => NOW}
      openStore={() => openPhotoStore(`${dbName}-photos`)}
      openArchive={() => openArchiveStore(`${dbName}-archive`)}
      openOrnaments={() => openOrnamentStore(dbName)}
      hasFace={async () => true}
      payment={() => payment}
      {...(giftDelivery ? { giftDelivery } : {})}
    />,
  );
const tap = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const saved = (): Gift[] => JSON.parse(localStorage.getItem(giftsKey(".demo")) ?? "[]");
const toWrap = async (who = "Leo") => {
  await seedPhotos();
  tap("gifts");
  tap("send a gift");
  await screen.findByRole("heading", { name: "Who's it for?" });
  tap(who);
  tap(/^Next: photo/);
  fireEvent.click((await screen.findAllByRole("button", { name: /^Photo from / }))[0]);
  tap(/^Next: frame/);
  tap(/^Next: note/);
  tap(/^Next: wrap/);
};
const checkout = () => screen.getByRole("dialog", { name: "Ready to send" });

describe("checkout (GIFT-14)", () => {
  it("opens from Send on Wrap, with the gift, who it's for, when it opens and the price", async () => {
    renderMe();
    await toWrap();
    tap(/^Send to Leo/);
    const sheet = checkout();
    expect(sheet.textContent).toContain("Leo");
    expect(sheet.textContent).toContain("right away");
    expect(await within(sheet).findByRole("button", { name: "Send to Leo · $0.99" })).toBeTruthy();
    expect(within(sheet).getByRole("button", { name: "Cancel" }).style.minHeight).toBe("44px");
  });

  it("says free during beta when that's the price", async () => {
    renderMe(betaPayment());
    await toWrap();
    tap(/^Send to Leo/);
    expect(await within(checkout()).findByRole("button", { name: "Send to Leo · free during beta" })).toBeTruthy();
  });

  it("names one price for a whole group", async () => {
    renderMe();
    await toWrap("Hoops Since ’14");
    tap(/^Send to Hoops/);
    expect(checkout().textContent).toContain("one price for the whole group");
  });

  it("shows sending while it pays, then the sent screen", async () => {
    let finish = () => {};
    const slow = localPayment({ wait: () => new Promise<void>((r) => (finish = r)) });
    renderMe(slow);
    await toWrap();
    tap(/^Send to Leo/);
    fireEvent.click(await within(checkout()).findByRole("button", { name: "Send to Leo · $0.99" }));
    const busy = await within(checkout()).findByRole("button", { name: "Sending…" });
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    finish();
    expect(await screen.findByRole("heading", { name: "On its way to Leo" })).toBeTruthy();
    expect(screen.getByText("It’s under Leo’s tree now, shaking until they open it.")).toBeTruthy();
    expect(saved()[0].status).toBe("sent");
  });

  it("keeps the gift when payment fails, says so, and sends on a retry", async () => {
    const payment = localPayment({ wait: async () => {} });
    payment.failNext();
    renderMe(payment);
    await toWrap();
    tap(/^Send to Leo/);
    fireEvent.click(await within(checkout()).findByRole("button", { name: "Send to Leo · $0.99" }));
    expect(await within(checkout()).findByText("Payment didn’t go through. Your gift is saved.")).toBeTruthy();
    expect(saved()[0].status).toBe("draft");
    fireEvent.click(within(checkout()).getByRole("button", { name: "Try again · $0.99" }));
    expect(await screen.findByRole("heading", { name: "On its way to Leo" })).toBeTruthy();
  });

  it("keeps a paid gift when delivery fails, and retries without charging", async () => {
    let fail = true;
    const payment = localPayment({ wait: async () => {} });
    renderMe(payment, () => ({
      deliver: async () => {
        if (fail) throw new Error("offline");
      },
    }));
    await toWrap();
    tap(/^Send to Leo/);
    fireEvent.click(await within(checkout()).findByRole("button", { name: "Send to Leo · $0.99" }));
    expect(await within(checkout()).findByText("It’s paid for, but it didn’t send. Your gift is saved.")).toBeTruthy();
    fail = false;
    fireEvent.click(within(checkout()).getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "On its way to Leo" })).toBeTruthy();
    expect(payment.charges()).toBe(1);
  });

  it("Cancel goes back to the gift", async () => {
    renderMe();
    await toWrap();
    tap(/^Send to Leo/);
    fireEvent.click(within(checkout()).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog", { name: "Ready to send" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Wrap it up" })).toBeTruthy();
  });
});

describe("the sent screen (GIFT-16)", () => {
  const send = async (who = "Leo") => {
    renderMe();
    await toWrap(who);
    tap(new RegExp(`^Send to ${who.split(" ")[0]}`));
    fireEvent.click(await within(checkout()).findByRole("button", { name: /· \$0\.99$/ }));
  };

  it("says when a chosen day is coming", async () => {
    renderMe();
    await toWrap();
    tap("on a day");
    fireEvent.change(screen.getByLabelText("Opens on"), { target: { value: "2026-11-12" } });
    tap(/^Send to Leo/);
    expect(checkout().textContent).toContain("Thu, Nov 12");
    fireEvent.click(await within(checkout()).findByRole("button", { name: "Send to Leo · $0.99" }));
    expect(await screen.findByText("It’ll sit under Leo’s tree, wrapped, until Thursday, Nov 12.")).toBeTruthy();
  });

  it("names the group, and every tree in it", async () => {
    await send("Hoops Since ’14");
    expect(await screen.findByRole("heading", { name: "On its way to Hoops Since ’14" })).toBeTruthy();
    expect(screen.getByText("It’s under every tree in Hoops Since ’14 now, shaking until they open it.")).toBeTruthy();
  });

  it("flies the gift into the tree and shakes it there, all of it off under reduced motion", async () => {
    await send();
    await screen.findByRole("heading", { name: "On its way to Leo" });
    const flight = document.querySelector("[data-sent-gift]")!;
    expect(flight.className).toContain("gf-send");
    expect(flight.firstElementChild!.className).toContain("gf-shake");
    const css = readFileSync(path.join(__dirname, "../../src/components/gifts/gifts.css"), "utf8");
    const reduced = css.slice(css.indexOf("prefers-reduced-motion"));
    for (const c of ["gf-send", "gf-shake", "gf-twinkle", "gf-glow", "gf-rise"]) expect(reduced).toContain(c);
  });

  it("Done goes back to the shelf, and the next gift starts fresh", async () => {
    await send();
    tap(await screen.findByRole("button", { name: "Done" }).then(() => "Done"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("region", { name: "Your shelf" })).toBeTruthy();
    tap("send a gift");
    expect(await screen.findByRole("heading", { name: "A gift" })).toBeTruthy();
  });
});
