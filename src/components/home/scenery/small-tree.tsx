export type SmallTreePalette = { canopy: string; shade: string; dark: string; light: string };

/** The scene's little background tree, as fractions of the canopy radius (same recipe as home-background.svg). */
export function SmallTree({ cx, cy, r, palette, clipId }: { cx: number; cy: number; r: number; palette: SmallTreePalette; clipId: string }) {
  const foot = cy + 2.1 * r;
  return (
    <g data-small-tree="" data-cx={cx} data-cy={cy} data-r={r}>
      <ellipse cx={cx + 0.25 * r} cy={foot - 1} rx={0.95 * r} ry={0.22 * r} fill="#2F5A24" opacity=".32" />
      <path d={`M${cx - 0.16 * r} ${cy + 0.6 * r}L${cx - 0.3 * r} ${foot}H${cx + 0.3 * r}L${cx + 0.16 * r} ${cy + 0.6 * r}Z`} fill="#8C4A2B" />
      <path d={`M${cx + 0.02 * r} ${cy + 0.6 * r}L${cx + 0.08 * r} ${foot}H${cx + 0.3 * r}L${cx + 0.16 * r} ${cy + 0.6 * r}Z`} fill="#5E2F18" />
      <clipPath id={clipId}>
        <circle cx={cx} cy={cy} r={r} />
      </clipPath>
      <circle cx={cx} cy={cy} r={r} fill={palette.canopy} />
      <g clipPath={`url(#${clipId})`}>
        <circle cx={cx + 0.45 * r} cy={cy + 0.5 * r} r={r} fill={palette.shade} opacity=".75" />
        <ellipse cx={cx - 0.1 * r} cy={cy + 0.95 * r} rx={r} ry={0.35 * r} fill={palette.dark} opacity=".6" />
        <circle cx={cx - 0.35 * r} cy={cy - 0.4 * r} r={0.55 * r} fill={palette.light} opacity=".7" />
      </g>
      <ellipse
        cx={cx - 0.38 * r}
        cy={cy - 0.48 * r}
        rx={0.26 * r}
        ry={0.14 * r}
        fill="#fff"
        opacity=".55"
        transform={`rotate(-25 ${cx - 0.38 * r} ${cy - 0.48 * r})`}
      />
    </g>
  );
}
