import type { ReactNode } from "react";

/**
 * The wrapping papers, as in the design, drawn as SVG patterns: the design's CSS repeating gradients have no
 * React Native equivalent, react-native-svg's Pattern does. `PaperFill` paints a shape with a paper.
 */
export function WrapPattern({ id, pattern }: { id: string; pattern: string }) {
  switch (pattern) {
    case "dots":
      return (
        <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#2B3350" />
          <circle cx="8" cy="8" r="2.6" fill="#F7CB4D" />
          <circle cx="0" cy="0" r="1.5" fill="#F4E9C8" />
          <circle cx="16" cy="0" r="1.5" fill="#F4E9C8" />
          <circle cx="0" cy="16" r="1.5" fill="#F4E9C8" />
          <circle cx="16" cy="16" r="1.5" fill="#F4E9C8" />
        </pattern>
      );
    case "kraft":
      return (
        <pattern id={id} width="7" height="9" patternUnits="userSpaceOnUse">
          <rect width="7" height="9" fill="#B88A57" />
          <rect width="2" height="9" fill="rgba(90,55,25,.09)" />
          <rect width="7" height="1" fill="rgba(255,240,210,.12)" />
        </pattern>
      );
    case "gingham":
      return (
        <pattern id={id} width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#F4E9C8" />
          <rect width="20" height="10" fill="rgba(79,122,54,.42)" />
          <rect width="10" height="20" fill="rgba(79,122,54,.42)" />
        </pattern>
      );
    case "newsprint":
      return (
        <pattern id={id} width="64" height="5" patternUnits="userSpaceOnUse">
          <rect width="64" height="5" fill="#EDE4CC" />
          <rect width="64" height="1.5" fill="rgba(43,51,80,.3)" />
          <rect x="56" width="8" height="5" fill="#EDE4CC" />
        </pattern>
      );
    case "stars":
      return (
        <pattern id={id} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="11" cy="11" r="1.6" fill="#FBD964" />
          <circle cx="0" cy="18" r="1.2" fill="rgba(255,246,218,.8)" />
          <circle cx="22" cy="18" r="1.2" fill="rgba(255,246,218,.8)" />
        </pattern>
      );
    default:
      return (
        <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="12" height="24" fill="#B43A2A" />
          <rect x="12" width="12" height="24" fill="#C9503A" />
          <rect x="11" width="1.5" height="24" fill="rgba(255,240,210,.6)" />
        </pattern>
      );
  }
}

/** Night sky sits on a gradient, with its stars on top. */
export function PaperDefs({ id, pattern }: { id: string; pattern: string }) {
  return (
    <>
      <WrapPattern id={id} pattern={pattern} />
      {pattern === "stars" && (
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1E2440" />
          <stop offset="1" stopColor="#2B3350" />
        </linearGradient>
      )}
    </>
  );
}

/** Paints `children` (one shape, given as a function of its fill) with a paper. */
export function PaperFill({ id, pattern, shape }: { id: string; pattern: string; shape: (fill: string) => ReactNode }) {
  return (
    <>
      {pattern === "stars" && shape(`url(#${id}-sky)`)}
      {shape(`url(#${id})`)}
    </>
  );
}
