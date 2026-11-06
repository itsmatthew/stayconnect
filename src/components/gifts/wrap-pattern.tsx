/** The wrapping papers (docs/specs/gifts.md, GIFT-8), as SVG patterns: CSS repeating gradients have no React Native equivalent. */
export function WrapPattern({ id, pattern }: { id: string; pattern: string }) {
  switch (pattern) {
    case "dots":
      return (
        <pattern id={id} width="26" height="26" patternUnits="userSpaceOnUse">
          <rect width="26" height="26" fill="#27305A" />
          <circle cx="6" cy="6" r="3" fill="#E8B93A" />
          <circle cx="19" cy="19" r="3" fill="#F3EAD3" />
        </pattern>
      );
    case "kraft":
      return (
        <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill="#B98A52" />
          <path d="M0 4H14M0 11H14" stroke="#A67845" strokeWidth=".8" />
          <path d="M5 0V14" stroke="#C69A63" strokeWidth=".6" />
        </pattern>
      );
    case "gingham":
      return (
        <pattern id={id} width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="30" height="30" fill="#F3F0DC" />
          <rect width="15" height="30" fill="#6F9B4E" opacity=".5" />
          <rect width="30" height="15" fill="#6F9B4E" opacity=".5" />
        </pattern>
      );
    case "newsprint":
      return (
        <pattern id={id} width="60" height="44" patternUnits="userSpaceOnUse">
          <rect width="60" height="44" fill="#E9E4D3" />
          <path d="M3 5H27M3 10H27M3 15H27M3 20H21M3 27H27M3 32H27M3 37H17M33 5H57M33 10H57M33 15H51M33 22H57M33 27H57M33 32H57M33 37H45" stroke="#9C988A" strokeWidth="1.6" />
        </pattern>
      );
    case "stars":
      return (
        <pattern id={id} width="44" height="44" patternUnits="userSpaceOnUse">
          <rect width="44" height="44" fill="#1C2546" />
          <circle cx="8" cy="10" r="1.4" fill="#F3EAD3" />
          <circle cx="30" cy="6" r="1" fill="#F3EAD3" />
          <circle cx="20" cy="26" r="1.6" fill="#E8B93A" />
          <circle cx="38" cy="32" r="1.1" fill="#F3EAD3" />
          <circle cx="7" cy="37" r="1" fill="#F3EAD3" />
        </pattern>
      );
    default:
      return (
        <pattern id={id} width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <rect width="34" height="34" fill="#B73420" />
          <rect width="15" height="34" fill="#CC4A34" />
          <rect x="24" width="2.4" height="34" fill="#F3D9CB" />
        </pattern>
      );
  }
}
