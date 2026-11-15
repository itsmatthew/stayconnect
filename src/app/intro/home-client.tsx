"use client";

import { useState } from "react";
import type { CirclesView } from "@/components/home/circle-toggle";
import { HomeEmpty } from "@/components/home/home-empty";
import { HomeScreen } from "@/components/home/home-screen";
import type { NavProps } from "@/components/home/main-nav";
import type { CircleGroup } from "@/components/home/types";
import { openingCenter, rotate, visibleAround } from "./circle-carousel";

type HomeClientProps = { groups: readonly CircleGroup[]; nav?: NavProps };

export function HomeClient({ groups, nav = { current: "Circles" } }: HomeClientProps) {
  const [center, setCenter] = useState(() => openingCenter(groups));
  // TODO(re-evaluate when the "your circle" view is designed): the toggle only changes its own state for now.
  const [view, setView] = useState<CirclesView>("circles");
  const turn = (delta: number) => setCenter((c) => rotate(c, delta, groups.length));

  // HOME-12: no circles yet.
  if (!groups.length) return <HomeEmpty nav={nav} onDaily5={() => nav.onNavigate?.("Daily 5")} />;

  return (
    <HomeScreen
      phone={visibleAround(groups, center, 1) as [CircleGroup, CircleGroup, CircleGroup]}
      wide={visibleAround(groups, center, 2) as [CircleGroup, CircleGroup, CircleGroup, CircleGroup, CircleGroup]}
      view={view}
      onViewChange={setView}
      onPrevious={() => turn(-1)}
      onNext={() => turn(+1)}
      nav={nav}
    />
  );
}
