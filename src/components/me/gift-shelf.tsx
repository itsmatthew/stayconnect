import { CREAM, FRAUNCES, NAVY, s } from "../home/units";

/** The gifts view on Me (docs/specs/gifts.md, GIFT-1). Empty for now: gifts you keep go here once they can be unwrapped. */
export function GiftShelf({ onSendGift }: { onSendGift?: () => void }) {
  return (
    <section aria-label="Your shelf" style={{ margin: `0 ${s(14)}`, padding: s(14), borderRadius: s(10), border: `${s(2)} solid ${NAVY}`, background: "#8A5226", display: "flex", flexDirection: "column", alignItems: "center", gap: s(14) }}>
      <p style={{ margin: `${s(26)} 0`, textAlign: "center", fontFamily: FRAUNCES, fontStyle: "italic", fontSize: s(15), color: "#F6ECCD" }}>Gifts you keep will sit here.</p>
      <button type="button" onClick={onSendGift} style={{ minHeight: 44, padding: `0 ${s(22)}`, borderRadius: s(22), border: `${s(2)} solid ${NAVY}`, background: "#F7CB4D", color: NAVY, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 800, fontSize: s(15), cursor: "pointer", boxShadow: `0 ${s(2)} 0 ${CREAM}` }}>
        send a gift
      </button>
    </section>
  );
}
