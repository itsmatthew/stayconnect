import { CAVEAT, KARLA, s } from "../home/units";
import { MailPicture } from "./mail-picture";
import type { MailItemView } from "./mail-types";
import { Cross, MoreButton } from "./mail-viewer";
import "./mail.css";

/** A photo, big (docs/specs/mailbox.md, MAILBOX-6), from MailOpen.dc.html: nearly black, the photo edge to edge, its date and who it's from. */
export function PhotoZoom({ item, onClose, onMenu }: { item: MailItemView; onClose: () => void; onMenu: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={`Photo from ${item.fromName}`} className="fixed inset-0 z-[60] overflow-hidden [--s:min(calc(100vw/390),calc(100dvh/844))]" style={{ fontFamily: KARLA }}>
      <button type="button" aria-label="Close the big photo" onClick={onClose} className="mb-fade" style={{ position: "absolute", inset: 0, padding: 0, border: 0, background: "rgba(8,9,16,.96)", cursor: "zoom-out" }} />
      <div style={{ position: "relative", width: s(390), height: s(844), margin: "0 auto", pointerEvents: "none" }}>
        <div className="mb-zoom" style={{ position: "absolute", left: 0, top: s(200), width: s(390) }}>
          <MailPicture art={item.art} label={`Photo from ${item.fromName}, taken ${item.photoDate}`} height={s(293)} />
        </div>
        <div className="mb-fade" style={{ position: "absolute", left: 0, top: s(520), width: s(390), boxSizing: "border-box", padding: `0 ${s(22)}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: CAVEAT, fontWeight: 700, fontSize: s(28), color: "#FFF6DA" }}>{item.photoDate}</span>
          <span style={{ fontSize: s(13), fontWeight: 800, color: "#C9BE9E" }}>from {item.fromName} · Daily 5</span>
        </div>
        <MoreButton onClick={onMenu} style={{ position: "absolute", left: s(14), top: s(52), pointerEvents: "auto" }} />
        <button type="button" aria-label="Close" onClick={onClose} style={{ position: "absolute", right: s(14), top: s(52), width: 44, height: 44, padding: 0, borderRadius: "50%", border: "2px solid #FFF6DA", background: "rgba(43,51,80,.6)", color: "#FFF6DA", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto", cursor: "pointer" }}>
          <Cross />
        </button>
      </div>
    </div>
  );
}
