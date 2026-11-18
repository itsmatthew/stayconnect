import type { PaymentResult, PaymentService } from "./payment";

const KEY = "nowandthen.fakePayment.v1";

/**
 * TODO(mobile: Apple in-app purchase): a fake that "charges" $0.99 after a short wait. Charges are kept in localStorage
 * by idempotency key, so a retry never charges twice and `find` works after a reload. `failNext` makes the next one fail.
 */
export function localPayment({ wait = () => new Promise<void>((r) => setTimeout(r, 1200)) }: { wait?: () => Promise<void> } = {}) {
  let failing = false;
  const read = (): Record<string, PaymentResult> => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, PaymentResult>;
    } catch {
      return {};
    }
  };
  const service: PaymentService & { failNext: () => void; charges: () => number } = {
    product: async (sku) => ({ sku, displayPrice: "$0.99", free: false }),
    balance: async () => ({ credits: 0 }),
    async pay({ idempotencyKey }) {
      await wait();
      const done = read()[idempotencyKey];
      if (done) return done;
      if (failing) {
        failing = false;
        return { status: "failed" };
      }
      const paid: PaymentResult = { status: "paid", receiptId: `fake-${idempotencyKey}` };
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...read(), [idempotencyKey]: paid }));
      } catch {
        // Storage blocked: the charge stands, but find() won't know it after a reload.
      }
      return paid;
    },
    find: async (idempotencyKey) => read()[idempotencyKey],
    failNext: () => {
      failing = true;
    },
    charges: () => Object.keys(read()).length,
  };
  return service;
}
