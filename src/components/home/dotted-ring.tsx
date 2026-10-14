/** The ring of lights on the grass under the selected tree. */
export function DottedRing({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return (
    <g data-ring="">
      <ellipse className="hm-anim" cx={cx} cy={cy} rx={rx} ry={ry} fill="#F7CB4D" opacity=".18" />
      <ellipse
        className="hm-anim"
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke="#FFE9A8"
        strokeWidth="4"
        strokeDasharray="1 9"
        strokeLinecap="round"
        style={{ animation: "hm-ring 2.6s ease-in-out infinite" }}
      />
    </g>
  );
}
