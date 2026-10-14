// TODO(re-evaluate when search, notifications and accounts exist): these buttons do nothing yet.
import Image from "next/image";
import { BellIcon, SearchIcon } from "./icons";
import { CREAM, FRAUNCES, INK, s } from "./units";

/** Search, notifications (1 new) and the account avatar. */
export function HeaderActions({ avatarSize = 40, iconSize = 22, color = CREAM }: { avatarSize?: number; iconSize?: number; color?: string }) {
  const iconButton = { width: s(44), height: s(44), border: 0, background: "none", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color, cursor: "pointer" } as const;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: s(2) }}>
      <button type="button" aria-label="Search" style={iconButton}>
        <SearchIcon size={s(iconSize)} />
      </button>
      <button type="button" aria-label="Notifications, 1 new" style={{ ...iconButton, position: "relative" }}>
        <BellIcon size={s(iconSize)} />
        <span
          style={{
            position: "absolute",
            right: s(9),
            top: s(8),
            width: s(9),
            height: s(9),
            borderRadius: "50%",
            background: "#E0482B",
            border: `${s(1.5)} solid ${CREAM}`,
          }}
        />
      </button>
      <button
        type="button"
        aria-label="Your account"
        style={{
          width: s(avatarSize),
          height: s(avatarSize),
          marginLeft: s(4),
          borderRadius: "50%",
          border: `${s(2)} solid ${INK}`,
          background: "#F0BE50",
          color: INK,
          fontFamily: FRAUNCES,
          fontWeight: 800,
          fontSize: s(avatarSize * 0.4),
          padding: 0,
          cursor: "pointer",
        }}
      >
        J
      </button>
    </div>
  );
}

/** The 365 logo, then "Now & Then", the logo as tall as the wordmark's line. */
export function Wordmark({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: s(size * 0.3) }}>
      <Image src="/logo-365.png" alt="" width={887} height={995} sizes="96px" style={{ height: s(size), width: "auto" }} loading="eager" />
      <div
        style={{
          fontFamily: FRAUNCES,
          fontWeight: 800,
          fontSize: s(size),
          lineHeight: 1,
          letterSpacing: s(-0.5),
          color: CREAM,
          textShadow: "0 2px 6px rgba(39,48,90,.45)",
          whiteSpace: "nowrap",
        }}
      >
        Now &amp; Then
      </div>
    </div>
  );
}
