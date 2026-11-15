import { useState } from "react";
import "./archive.css";
import type { NavProps } from "../home/main-nav";
import { FRAUNCES, NAVY, s } from "../home/units";
import { TabFrame } from "../shell/tab-frame";
import { Explainer } from "./explainer";
import { FeedSection } from "./feed-section";
import { MySlots } from "./my-slots";
import { PostPicker } from "./post-picker";
import type { FeedSectionView, PickerView, SlotView } from "./types";

type ArchiveScreenProps = {
  slots: readonly SlotView[];
  sections: readonly FeedSectionView[];
  showExplainer: boolean;
  onDismissExplainer: () => void;
  onPost: (slotKey: string) => void;
  picker: PickerView | null;
  onPick: (file: File) => void;
  onConfirmPost: (caption: string) => void;
  onCancelPost: () => void;
  nav: NavProps;
};

/** Periods shown at first, and added by each "Show earlier" (ARC-8). */
export const FEED_PAGE = 8;

/** The 65 Archive (docs/specs/archive.md): your slots at the top, then the feed, period by period. */
export function ArchiveScreen({ slots, sections, showExplainer, onDismissExplainer, onPost, picker, onPick, onConfirmPost, onCancelPost, nav }: ArchiveScreenProps) {
  const [shown, setShown] = useState(FEED_PAGE);
  return (
    <TabFrame nav={nav}>
      <h1 style={{ margin: 0, padding: `${s(44)} ${s(20)} 0`, fontFamily: FRAUNCES, fontWeight: 800, fontSize: s(28), letterSpacing: s(-0.5) }}>65 Archive</h1>
      {showExplainer && <Explainer onDismiss={onDismissExplainer} />}
      <MySlots slots={slots} onPost={onPost} />
      <div style={{ paddingBottom: s(28) }}>
        {sections.slice(0, shown).map((section) => (
          <FeedSection key={section.key} section={section} />
        ))}
        {sections.length > shown && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: s(22) }}>
            <button
              type="button"
              onClick={() => setShown((n) => n + FEED_PAGE)}
              style={{ height: s(40), padding: `0 ${s(20)}`, borderRadius: s(20), border: `${s(2)} solid ${NAVY}`, background: "#FFF8EC", color: NAVY, fontFamily: FRAUNCES, fontStyle: "italic", fontWeight: 700, fontSize: s(15), cursor: "pointer" }}
            >
              Show earlier
            </button>
          </div>
        )}
      </div>
      {picker && <PostPicker picker={picker} onPick={onPick} onPost={onConfirmPost} onCancel={onCancelPost} />}
    </TabFrame>
  );
}
