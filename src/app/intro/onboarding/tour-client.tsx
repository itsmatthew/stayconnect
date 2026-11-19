"use client";

import { useEffect, useState } from "react";
import { TourDone, TourStop, type TourRect } from "@/components/onboarding/tour-overlay";
import { tourView, type TourAction, type TourState, type TourTab } from "./tour";

/** The first `[data-tour=…]` on screen for these names: the nav has a phone and a wide copy, and only one shows. */
function find(targets: readonly string[]): HTMLElement | null {
  for (const name of targets) {
    for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${CSS.escape(name)}"]`)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
  }
  return null;
}

/** Its rect on screen, cut to the screen (a long feed would run off it). */
function measure(el: HTMLElement | null): TourRect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const top = Math.max(r.top, 8);
  const bottom = Math.min(r.bottom, window.innerHeight - 8);
  if (bottom <= top) return null;
  return { x: r.left, y: top, w: r.width, h: bottom - top };
}

const same = (a: TourRect | null, b: TourRect | null) => a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h);

/** How often to look again: tabs load their stores after they show, so what's spotlit can move. */
const LOOK_MS = 200;

/**
 * The tour over the app (docs/specs/onboarding.md, ONB-14 to ONB-18). `AppClient` holds its state and shows the stop's tab;
 * this finds what each stop points at (`data-tour` on the screens) and draws it with the views in `components/onboarding`.
 */
export function TourClient({ state, dispatch, onNavigate }: { state: TourState; dispatch: (a: TourAction) => void; onNavigate: (to: TourTab) => void }) {
  const view = tourView(state);
  const targets = view?.kind === "stop" ? view.targets.join("|") : "";
  const [rect, setRect] = useState<TourRect | null>(null);
  const [viewport, setViewport] = useState({ w: 390, h: 844 });

  useEffect(() => {
    if (!targets) return;
    const names = targets.split("|");
    let scrolled = false;
    const look = () => {
      const el = find(names);
      if (el && !scrolled) {
        scrolled = true;
        el.scrollIntoView?.({ block: "nearest" });
      }
      const next = measure(el);
      setRect((r) => (same(r, next) ? r : next));
      setViewport((v) => (v.w === window.innerWidth && v.h === window.innerHeight ? v : { w: window.innerWidth, h: window.innerHeight }));
    };
    look();
    const id = setInterval(look, LOOK_MS);
    window.addEventListener("resize", look);
    return () => {
      clearInterval(id);
      window.removeEventListener("resize", look);
      setRect(null);
    };
  }, [targets]);

  if (!view) return null;
  if (view.kind === "done") return <TourDone title={view.title} body={view.body} onEnd={() => dispatch({ type: "end" })} />;
  return (
    <TourStop
      rect={rect}
      viewport={viewport}
      title={view.title}
      body={view.body}
      count={view.count}
      tap={view.tap}
      onGotIt={() => dispatch({ type: "gotIt" })}
      onTap={() => {
        if (view.tap) onNavigate(view.tap.to);
        dispatch({ type: "tap" });
      }}
    />
  );
}
