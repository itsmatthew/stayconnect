import { ChevronLeft, ChevronRight } from "./icons";
import { CREAM, INK, s } from "./units";

type CarouselArrowProps = { direction: "previous" | "next"; onClick: () => void; size?: number };

/** Round previous/next circle button (44 design px). */
export function CarouselArrow({ direction, onClick, size = 44 }: CarouselArrowProps) {
  return (
    <button
      type="button"
      aria-label={direction === "previous" ? "Previous circle" : "Next circle"}
      onClick={onClick}
      style={{
        width: s(size),
        height: s(size),
        padding: 0,
        borderRadius: "50%",
        border: `${s(2)} solid ${INK}`,
        background: CREAM,
        color: INK,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      {direction === "previous" ? <ChevronLeft size={s(16)} /> : <ChevronRight size={s(16)} />}
    </button>
  );
}
