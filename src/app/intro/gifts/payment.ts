// Paying for a gift (docs/specs/gifts.md, GIFT-14). Plain TypeScript.
// TODO(mobile: Apple in-app purchase): the store's purchase goes behind PaymentService; prices come from the store.

/** One gift, whoever it's for (GIFT-13). Gift packs would be more skus, spent through `payWith: credit`. */
export const GIFT_SKU = "gift.single";

export type Product = { sku: string; /** Shown as is: "$0.99", or "free during beta". The store localizes it. */ displayPrice: string; free: boolean };
export type PayWith = { kind: "purchase"; sku: string } | { kind: "credit" };
/** `cancelled`: they backed out. `pending`: it needs approval first (Ask to Buy). Neither is a failure. */
export type PaymentResult = { status: "paid"; receiptId: string } | { status: "failed" } | { status: "cancelled" } | { status: "pending" };

export interface PaymentService {
  product(sku: string): Promise<Product>;
  /** Prepaid credits, for gift packs later. */
  balance(): Promise<{ credits: number }>;
  /** Paying twice with the same key charges once, and answers the same. */
  pay(req: { idempotencyKey: string; payWith: PayWith }): Promise<PaymentResult>;
  /** What happened to a payment, if anything: settles one cut off by the app closing. */
  find(idempotencyKey: string): Promise<PaymentResult | undefined>;
}

/** Free during beta: the whole flow works, and nothing is ever charged. */
export function betaPayment(): PaymentService {
  return {
    product: async (sku) => ({ sku, displayPrice: "free during beta", free: true }),
    balance: async () => ({ credits: 0 }),
    pay: async ({ idempotencyKey }) => ({ status: "paid", receiptId: `beta-${idempotencyKey}` }),
    find: async (idempotencyKey) => ({ status: "paid", receiptId: `beta-${idempotencyKey}` }),
  };
}
