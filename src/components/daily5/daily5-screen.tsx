import { useCallback, useState } from "react";
import "./daily5.css";
import { HeaderActions, Wordmark } from "../home/header-actions";
import type { NavProps } from "../home/main-nav";
import { FRAUNCES, NAVY, s } from "../home/units";
import { TabFrame } from "../shell/tab-frame";
import { PhotoPools } from "./photo-pools";
import { Polaroid } from "./polaroid";
import { SendSheet } from "./send-sheet";
import { SentFlight } from "./sent-flight";
import type { Daily5Card, PoolId, PoolView, RecipientSections } from "./types";

export type Daily5ScreenProps = {
  todayLabel: string;
  cards: readonly Daily5Card[];
  pools: readonly PoolView[];
  recipients: RecipientSections;
  onAddFiles: (pool: PoolId, files: File[]) => void;
  onSend: (send: { cardId: string; recipientId: string; note: string }) => void;
  nav: NavProps;
  /** While today's set is still being picked. */
  loading?: boolean;
};

/** Daily 5 (docs/specs/daily5.md): today's five polaroids, the send sheet, and the photo pools. */
export function Daily5Screen({ todayLabel, cards, pools, recipients, onAddFiles, onSend, nav, loading }: Daily5ScreenProps) {
  const [sending, setSending] = useState<Daily5Card | null>(null);
  const [flying, setFlying] = useState<{ key: number; src: string; color?: string } | null>(null);
  const landed = useCallback(() => setFlying(null), []);

  return (
    <TabFrame nav={nav}>
      {/* Phones only: wide screens have the header in the frame. Display lives in the classes so md:hidden wins. */}
      <div className="flex items-center justify-between md:hidden" style={{ padding: `${s(44)} ${s(20)} 0` }}>
        <Wordmark size={28} ink={NAVY} />
        <HeaderActions color={NAVY} />
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: `${s(10)} ${s(20)} ${s(12)}` }}>
        <h1 style={{ margin: 0, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(24) }}>Daily 5</h1>
        <span style={{ fontSize: s(13), fontWeight: 700, color: "#3F4664" }}>{todayLabel}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: s(30), padding: `0 ${s(14)} ${s(30)}` }}>
        {cards.map((card, i) => (
          <Polaroid key={card.id} card={card} index={i} onSend={() => setSending(card)} />
        ))}
        {!loading && cards.length === 0 && (
          <p style={{ margin: `${s(8)} ${s(6)} 0`, fontFamily: FRAUNCES, fontStyle: "italic", fontSize: s(16), lineHeight: 1.4, color: "#3F4664" }}>
            Add your photos and the family computer’s below. Each day, five photos at least a year old will appear here.
          </p>
        )}
        <PhotoPools pools={pools} onAddFiles={onAddFiles} />
      </div>

      {sending && (
        <SendSheet
          photo={sending}
          recipients={recipients}
          onCancel={() => setSending(null)}
          onSend={(recipientId, note) => {
            onSend({ cardId: sending.id, recipientId, note });
            const to = [...recipients.closest, ...recipients.others, ...recipients.people].find((p) => p.id === recipientId);
            setFlying({ key: Date.now(), src: sending.src, color: to?.kind === "group" ? to.palette.canopy : undefined });
            setSending(null);
          }}
        />
      )}
      {flying && <SentFlight key={flying.key} src={flying.src} color={flying.color} onDone={landed} />}
    </TabFrame>
  );
}
