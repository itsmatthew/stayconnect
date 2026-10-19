import type { CSSProperties, ReactNode } from "react";
import { HeaderActions, Wordmark } from "../home/header-actions";
import { BottomNav, TopNav, type NavProps } from "../home/main-nav";
import { KARLA, NAVY, s } from "../home/units";

/**
 * The cream-paper tabs (Daily 5, Messages): content in one 390-design-px column.
 * Phones scale the column to the screen and keep the bottom nav; wide screens put the nav across the top.
 */
export function TabFrame({ nav, children }: { nav: NavProps; children: ReactNode }) {
  return (
    <div
      className="absolute inset-0 flex flex-col [--s:calc(min(100vw,480px)/390)] md:[--s:1.1px]"
      style={{ background: "linear-gradient(#F6ECCD, #F1E2B8)", fontFamily: KARLA, color: NAVY } as CSSProperties}
    >
      <header
        className="hidden flex-none items-center md:grid"
        style={{ height: s(84), gridTemplateColumns: "1fr auto 1fr", padding: `0 ${s(22)}` }}
      >
        <Wordmark size={30} ink={NAVY} />
        <TopNav {...nav} />
        <div style={{ justifySelf: "end" }}>
          <HeaderActions avatarSize={46} iconSize={22} color={NAVY} />
        </div>
      </header>
      <main className="relative min-h-0 flex-1 overflow-y-auto">
        <div style={{ width: s(390), margin: "0 auto" }}>{children}</div>
      </main>
      <div className="flex-none md:hidden" style={{ height: s(78) }}>
        <BottomNav {...nav} />
      </div>
    </div>
  );
}
