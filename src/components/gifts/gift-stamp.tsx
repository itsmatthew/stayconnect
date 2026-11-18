/** A stamp's picture in a 40×48 box, as drawn in the design. SVG, so it ports with react-native-svg. */
export function StampArt({ id }: { id: string }) {
  switch (id) {
    case "sunrise":
      return (
        <>
          <rect width="40" height="48" fill="#F6ECCD" />
          <circle cx="26" cy="17" r="7" fill="#F2BE4A" />
          <path d="M0 32c10-6 22-6 40 0v16H0z" fill="#9DB255" />
          <path d="M0 39c14-5 26-3 40 2v7H0z" fill="#89A64A" />
        </>
      );
    case "calendar":
      return (
        <>
          <rect width="40" height="48" fill="#F4E9C8" />
          <rect x="7" y="9" width="26" height="30" rx="2" fill="#FFFFFF" stroke="#2B3350" strokeWidth="2" />
          <rect x="7" y="9" width="26" height="9" fill="#B43A2A" />
          <text x="20" y="33" textAnchor="middle" fontFamily="Karla, sans-serif" fontWeight="800" fontSize="10" fill="#2B3350">
            365
          </text>
        </>
      );
    case "heart":
      return (
        <>
          <rect width="40" height="48" fill="#F4CDB8" />
          <path d="M20 36C8 28 6 20 10 16c4-4 9-2 10 2 1-4 6-6 10-2 4 4 2 12-10 20z" fill="#B43A2A" />
        </>
      );
    default:
      return (
        <>
          <rect width="40" height="48" fill="#F6ECCD" />
          <rect x="18" y="30" width="4" height="12" fill="#8C4A2B" />
          <circle cx="20" cy="21" r="13" fill="#6F9B4E" />
          <circle cx="20" cy="21" r="8.5" fill="#E49B2E" />
          <circle cx="20" cy="21" r="4.5" fill="#B43A2A" />
          <path d="M6 43h28" stroke="#89A64A" strokeWidth="3" />
        </>
      );
  }
}

const EDGE = Array.from({ length: 8 }, (_, i) => i);

/** The stamp on a postcard: the picture on white with a perforated edge (paper-colored bites), 50×60. */
export function PostageStamp({ id, width, paper }: { id: string; width: string; paper: string }) {
  return (
    <svg data-stamp={id} viewBox="0 0 50 60" aria-hidden="true" style={{ display: "block", width, flex: "none" }}>
      <rect x="0.5" y="1.5" width="50" height="60" fill="#4A2C14" opacity=".18" />
      <rect width="50" height="60" fill="#FFFFFF" />
      {EDGE.map((i) => (
        <g key={i} fill={paper}>
          <circle cx={3.5 + i * 6.2} cy="0" r="2.2" />
          <circle cx={3.5 + i * 6.2} cy="60" r="2.2" />
          <circle cx="0" cy={3.5 + i * 7.6} r="2.2" />
          <circle cx="50" cy={3.5 + i * 7.6} r="2.2" />
        </g>
      ))}
      <g transform="translate(5 5) scale(1 1.0417)">
        <StampArt id={id} />
      </g>
    </svg>
  );
}
