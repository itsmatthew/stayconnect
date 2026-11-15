// Line icons from the reference, 24×24 viewBox, drawn in currentColor.
import type { ReactNode } from "react";

function Icon({ size, strokeWidth, children }: { size: string; strokeWidth: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {children}
    </svg>
  );
}

type IconProps = { size: string };

export const SearchIcon = ({ size }: IconProps) => (
  <Icon size={size} strokeWidth={2.4}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Icon>
);
export const BellIcon = ({ size }: IconProps) => (
  <Icon size={size} strokeWidth={2.4}>
    <path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z" />
    <path d="M10 21h4" />
  </Icon>
);
export const CirclesIcon = ({ size }: IconProps) => (
  <Icon size={size} strokeWidth={2.2}>
    <circle cx="12" cy="9" r="6" />
    <path d="M12 15v6M9 21h6" />
  </Icon>
);
export const DailyIcon = ({ size }: IconProps) => (
  <Icon size={size} strokeWidth={2.2}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <rect x="7" y="6" width="10" height="9" />
  </Icon>
);
export const ArchiveIcon = ({ size }: IconProps) => (
  <Icon size={size} strokeWidth={2.2}>
    <rect x="3" y="7" width="15" height="13" rx="2" />
    <path d="M7 4h12a2 2 0 0 1 2 2v10" />
    <path d="M3 17l5-5 4 4 2-2 4 4" />
  </Icon>
);
export const MessagesIcon = ({ size }: IconProps) => (
  <Icon size={size} strokeWidth={2.2}>
    <path d="M4 5h16v11H10l-4 4v-4H4z" />
  </Icon>
);
export const MeIcon = ({ size }: IconProps) => (
  <Icon size={size} strokeWidth={2.2}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);
export const ChevronLeft = ({ size }: IconProps) => (
  <Icon size={size} strokeWidth={3}>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
);
export const ChevronRight = ({ size }: IconProps) => (
  <Icon size={size} strokeWidth={3}>
    <path d="M9 5l7 7-7 7" />
  </Icon>
);
