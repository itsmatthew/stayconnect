/** A postage stamp's picture (docs/specs/gifts.md, GIFT-7), in a 40×48 box, on a perforated edge. SVG, so it ports with react-native-svg. */
export function GiftStamp({ id, width }: { id: string; width: string }) {
  return (
    <svg data-stamp={id} viewBox="0 0 40 48" aria-hidden="true" style={{ display: "block", width, flex: "none" }}>
      <rect x="1" y="1" width="38" height="46" fill="#FFFBEF" stroke="#BCAF8C" strokeWidth="1.4" strokeDasharray="2.4 2" />
      {id === "hills" && (
        <>
          <rect x="6" y="6" width="28" height="36" fill="#CFE0F4" />
          <circle cx="27" cy="16" r="4.5" fill="#F7CB4D" />
          <path d="M6 32Q15 20 24 30T34 28V42H6Z" fill="#6F9B4E" />
        </>
      )}
      {id === "calendar" && (
        <>
          <rect x="7" y="9" width="26" height="30" rx="2" fill="#FFFFFF" stroke="#2B3350" strokeWidth="1.6" />
          <rect x="7" y="9" width="26" height="9" fill="#C8432B" />
          <text x="20" y="32" textAnchor="middle" fontSize="11" fontWeight="800" fill="#2B3350">
            365
          </text>
        </>
      )}
      {id === "heart" && <path d="M20 37C8 28 8 15 15 15c3 0 4 2 5 4 1-2 2-4 5-4 7 0 7 13-5 22Z" fill="#C8432B" />}
      {id !== "hills" && id !== "calendar" && id !== "heart" && (
        <>
          <rect x="18.5" y="28" width="3" height="11" fill="#7A4A25" />
          <circle cx="20" cy="20" r="11" fill="#6F9B4E" />
          <circle cx="20" cy="20" r="7" fill="#E8A02F" />
          <circle cx="20" cy="20" r="3.4" fill="#C8432B" />
        </>
      )}
    </svg>
  );
}
