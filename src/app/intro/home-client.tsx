"use client";

import { useState } from "react";
import type { CirclesView } from "@/components/home/circle-toggle";
import { HomeScreen } from "@/components/home/home-screen";
import type { CircleGroup } from "@/components/home/types";
import { rotate, visibleAround } from "./circle-carousel";
import { INITIAL_CENTER_ID, placeholderGroups } from "./placeholder-groups";

type HomeClientProps = { groups?: readonly CircleGroup[]; initialCenterId?: string };

export function HomeClient({ groups = placeholderGroups, initialCenterId = INITIAL_CENTER_ID }: HomeClientProps) {
  const [center, setCenter] = useState(() => Math.max(0, groups.findIndex((g) => g.id === initialCenterId)));
  // TODO(re-evaluate when the "your circle" view is designed): the toggle only changes its own state for now.
  const [view, setView] = useState<CirclesView>("circles");

  return (
    <HomeScreen
      phone={visibleAround(groups, center, 1) as [CircleGroup, CircleGroup, CircleGroup]}
      wide={visibleAround(groups, center, 2) as [CircleGroup, CircleGroup, CircleGroup, CircleGroup, CircleGroup]}
      view={view}
      onViewChange={setView}
      onPrevious={() => setCenter((c) => rotate(c, -1, groups.length))}
      onNext={() => setCenter((c) => rotate(c, +1, groups.length))}
    />
  );
}
