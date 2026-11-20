"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { circleLogoSvg, type LogoStyle } from "@/components/onboarding/circle-logo";
import { StartCircleScreen } from "@/components/onboarding/start-circle-screen";
import type { ViewerGroup } from "../colors/group-colors";
import { GROUP_COLORS, groupPalette } from "../colors/palette";
import type { Share } from "../mail/mail";
import type { MyCircle } from "./my-circles";
import { cleanName, colorClash, inviteMessage, nameReady, startDraft, startReducer } from "./start-circle";

/** A circle's invite link. TODO(server): issue #26's invites; the local fake carries the circle in the link. */
export interface CircleInvites {
  create(circle: { id: string; name: string; colorId: string; from?: string }): Promise<{ link: string }>;
}

/** What starting a circle hands back: the circle, its logo as an image, and the photos picked for its header (ONB-13). */
export type NewCircle = { circle: MyCircle; logo: Blob; now?: File; then?: File };

type Props = {
  /** Your circles as you see them, for the suggested color and the shade note (ONB-8). */
  mine: readonly (ViewerGroup & { name: string })[];
  me?: string;
  now: () => number;
  invites: CircleInvites;
  share: Share;
  /** Makes the circle: called once it's shared or copied (ONB-11). */
  onCreate: (made: NewCircle) => void;
  /** Step 1's back arrow (ONB-7): back to the letter, or closing, as `leaveLabel` says. */
  onBackToLetter: () => void;
  /** Step 1's back arrow's name: "Back to the letter" (the default) or "Close" (HOME-24). */
  leaveLabel?: string;
  /** "Go to my circle" (ONB-12). */
  onDone: (circleId: string) => void;
};

type Picked = { file: File; url: string };

/** Starting a circle (docs/specs/onboarding.md, ONB-7 to ONB-12): the steps' state, the share, and making the circle. */
export function StartCircleClient({ mine, me, now, invites, share, onCreate, onBackToLetter, leaveLabel, onDone }: Props) {
  const [draft, dispatch] = useReducer(startReducer<Picked>, mine, (m) => startDraft<Picked>(m.map((g) => g.colorId)));
  const [id] = useState(() => `mine-${crypto.randomUUID()}`);
  const [created] = useState(() => now());
  const sharing = useRef(false);
  const year = new Date(created).getFullYear();

  // Picked photos are shown from object URLs, revoked when they're replaced or the flow closes.
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const all = urls.current;
    return () => all.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const clash = colorClash(draft.colorId, mine, created);
  const color = groupPalette(draft.colorId, clash?.shade ?? 0).canopy;
  const shown = cleanName(draft.name) || "Your circle";
  const logos = useMemo(
    () => Object.fromEntries((["crest", "badge", "varsity"] as const).map((l) => [l, circleLogoSvg(l, shown, color, year, `${l}-${draft.step}`)])) as Record<LogoStyle, string>,
    [shown, color, year, draft.step],
  );
  const swatches = GROUP_COLORS.map((c) => {
    const on = c.id === draft.colorId;
    return { id: c.id, label: `${c.label}${on && clash ? `, used by ${clash.name}` : ""}`, hex: on ? color : groupPalette(c.id, 0).canopy, on };
  });

  const shareInvite = async () => {
    if (sharing.current) return;
    sharing.current = true;
    try {
      const name = cleanName(draft.name);
      const { link } = await invites.create({ id, name, colorId: draft.colorId, from: me });
      const how = await share.share({ url: link, text: inviteMessage(name) });
      if (how === "cancelled") return;
      onCreate({
        circle: { id, name, colorId: draft.colorId, createdAt: created },
        logo: new Blob([circleLogoSvg(draft.logo, name, color, year)], { type: "image/svg+xml" }),
        now: draft.now?.file,
        then: draft.then?.file,
      });
      dispatch({ type: "shared", how });
    } finally {
      sharing.current = false;
    }
  };

  return (
    <StartCircleScreen
      firstBackLabel={leaveLabel}
      step={draft.step}
      name={draft.name}
      shown={shown}
      color={color}
      swatches={swatches}
      clash={clash && { circle: clash.name, colorName: GROUP_COLORS.find((c) => c.id === draft.colorId)!.label.toLowerCase(), was: groupPalette(draft.colorId, 0).canopy }}
      ready={nameReady(draft.name)}
      logo={draft.logo}
      logos={logos}
      photos={{ now: draft.now?.url, then: draft.then?.url }}
      me={me}
      message={inviteMessage(shown)}
      liveLine={draft.shared === "copied" ? "Link copied. Paste it in your group chat." : "Your people are on their way."}
      onName={(name) => dispatch({ type: "name", name })}
      onColor={(colorId) => dispatch({ type: "color", colorId })}
      onLogo={(logo) => dispatch({ type: "logo", logo })}
      onPhoto={(slot, file) => {
        const old = draft[slot];
        if (old) {
          URL.revokeObjectURL(old.url);
          urls.current.delete(old.url);
        }
        const url = URL.createObjectURL(file);
        urls.current.add(url);
        dispatch({ type: "photo", slot, photo: { file, url } });
      }}
      onNext={() => dispatch({ type: "next" })}
      onBack={() => (draft.step === 1 ? onBackToLetter() : dispatch({ type: "back" }))}
      onShare={() => void shareInvite()}
      onDone={() => onDone(id)}
    />
  );
}
