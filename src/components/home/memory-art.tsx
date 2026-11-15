import type { ArtKind } from "./types";

/**
 * Stand-in "photo" for a memory, drawn in the 2R square centered on (cx, cy).
 * The caller clips it to a circle. Proportions are the reference's, as fractions of R.
 */
export function MemoryArt({ kind, cx, cy, R }: { kind: ArtKind; cx: number; cy: number; R: number }) {
  const bg = (fill: string) => <rect x={cx - R} y={cy - R} width={2 * R} height={2 * R} fill={fill} />;
  switch (kind) {
    case "city":
      return (
        <>
          {bg("#7C9BE0")}
          <rect x={cx - 0.7 * R} y={cy} width={0.4 * R} height={R} fill="#4A62B0" />
          <rect x={cx - 0.2 * R} y={cy - 0.3 * R} width={0.45 * R} height={1.3 * R} fill="#3F56A2" />
          <rect x={cx + 0.35 * R} y={cy + 0.1 * R} width={0.4 * R} height={R} fill="#4A62B0" />
          <g fill="#FFE27A">
            {[
              [-0.55, 0.15],
              [-0.08, -0.12],
              [0.08, 0.2],
              [0.48, 0.3],
            ].map(([x, y]) => (
              <rect key={`${x},${y}`} x={cx + x * R} y={cy + y * R} width={0.12 * R} height={0.14 * R} />
            ))}
            <circle cx={cx + 0.45 * R} cy={cy - 0.5 * R} r={0.16 * R} />
          </g>
        </>
      );
    case "churro":
      return (
        <>
          {bg("#FFF1C9")}
          <circle cx={cx} cy={cy} r={0.62 * R} fill="#EBA548" />
          <g stroke="#FCEBC0" strokeWidth={0.16 * R} strokeLinecap="round">
            <path
              d={`M${cx - 0.32 * R} ${cy - 0.22 * R}h${0.64 * R}M${cx - 0.38 * R} ${cy + 0.02 * R}h${0.76 * R}M${cx - 0.32 * R} ${cy + 0.26 * R}h${0.64 * R}`}
            />
          </g>
        </>
      );
    case "faces":
      return (
        <>
          {bg("#FFDCCB")}
          <circle cx={cx - 0.32 * R} cy={cy - 0.08 * R} r={0.42 * R} fill="#3A2A22" />
          <circle cx={cx - 0.32 * R} cy={cy + 0.05 * R} r={0.32 * R} fill="#EDB98F" />
          <circle cx={cx + 0.36 * R} cy={cy} r={0.44 * R} fill="#1F1A1A" />
          <circle cx={cx + 0.36 * R} cy={cy + 0.12 * R} r={0.32 * R} fill="#B9825A" />
          <rect x={cx - R} y={cy + 0.5 * R} width={2 * R} height={0.5 * R} fill="#C8432B" />
        </>
      );
    case "people":
      return (
        <>
          {bg("#CFE3D6")}
          <g fill="#EDB98F">
            <circle cx={cx - 0.45 * R} cy={cy + 0.05 * R} r={0.26 * R} />
            <circle cx={cx + 0.45 * R} cy={cy + 0.05 * R} r={0.26 * R} />
          </g>
          <circle cx={cx} cy={cy - 0.05 * R} r={0.3 * R} fill="#B9825A" />
          <rect x={cx - R} y={cy + 0.4 * R} width={2 * R} height={0.6 * R} fill="#3F6FA8" />
        </>
      );
    case "cookie":
      return (
        <>
          {bg("#F4E9C8")}
          <circle cx={cx} cy={cy} r={0.6 * R} fill="#C98A3C" />
          <g fill="#5A2C17">
            <circle cx={cx - 0.2 * R} cy={cy - 0.18 * R} r={0.1 * R} />
            <circle cx={cx + 0.22 * R} cy={cy - 0.05 * R} r={0.1 * R} />
            <circle cx={cx - 0.05 * R} cy={cy + 0.25 * R} r={0.1 * R} />
          </g>
        </>
      );
    case "sunset":
      return (
        <>
          {bg("#F3B98C")}
          <circle cx={cx + 0.2 * R} cy={cy - 0.1 * R} r={0.3 * R} fill="#F7CB4D" />
          <rect x={cx - R} y={cy + 0.15 * R} width={2 * R} height={R} fill="#5F9CC6" />
          <rect x={cx - R} y={cy + 0.6 * R} width={2 * R} height={R} fill="#EAD49C" />
        </>
      );
    case "basketball":
      return (
        <>
          {bg("#F6DFA6")}
          <circle cx={cx} cy={cy} r={0.62 * R} fill="#E8792E" />
          <path
            d={`M${cx - 0.62 * R} ${cy}h${1.24 * R}M${cx} ${cy - 0.62 * R}v${1.24 * R}`}
            stroke="#27305A"
            strokeWidth={0.1 * R}
          />
        </>
      );
  }
}
