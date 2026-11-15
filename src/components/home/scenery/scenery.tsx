import { useId, type ReactNode } from "react";
import {
  Church, Cloud1, Cloud2, Cloud3, Clouds, Defs, Flowers, Fog, Ground, Hills, Houses, LittleTrees, Ridges, River,
  SCENE_ID_NAMES, Sky, Sun, Town,
  type SceneIds,
} from "./scene-layers";
import { SmallTree } from "./small-tree";
import { CLOUD_ANCHORS, overlaps, smallTreeBox, WIDE_CLOUDS, WIDE_SMALL_TREES, type Zone } from "./wide-props";

export type { SceneIds, Zone };

/** Per-instance SVG ids, so several scenes (and their gradients) can share a page. */
export function useSceneIds(): SceneIds {
  const prefix = `sc${useId().replace(/[^\w-]/g, "")}-`;
  return Object.fromEntries(SCENE_ID_NAMES.map((n) => [n, prefix + n])) as SceneIds;
}

const W = 390;
const H = 844;
/** Wide screens show less sky, lifting the horizon to where the desktop mockup has it. */
const WIDE_TOP = 90;
const WIDE_VIEWBOX = `0 ${WIDE_TOP} ${W} ${H - WIDE_TOP}`;
/** The wide scene's fixed-shape layers: visible scene rows and horizontal center, for mapping into it. */
export const WIDE_SCENE = { top: WIDE_TOP, height: H - WIDE_TOP, centerX: W / 2 } as const;
/** The church tower (x 259–283) moves to the center line, behind the middle tree. */
const CHURCH_SHIFT = W / 2 - 271;
/**
 * …and drops a little, so its spire peeks out between the center tree's name and canopy without
 * running into the name (docs/specs/home.md, HOME-8).
 */
const CHURCH_DROP = 25;
/** The lowered tower's box, spire tip to foot, in wide scene units. */
export const WIDE_CHURCH_BOX: Zone = { x0: 259 + CHURCH_SHIFT, x1: 283 + CHURCH_SHIFT, y0: 286 + CHURCH_DROP, y1: 378 + CHURCH_DROP };
const CLOUD_PARTS = { 1: Cloud1, 2: Cloud2, 3: Cloud3 } as const;
/** Copies either side of the original; odd copies are mirrored so the repeat doesn't read as tiling. */
const REPEATS = [-3, -2, -1, 1, 2, 3];
const repeatTransform = (k: number) => (k % 2 ? `matrix(-1 0 0 1 ${W * (k + 1)} 0)` : `translate(${W * k} 0)`);

type SceneryProps = {
  variant: "phone" | "wide";
  /** Shared ids, when trees elsewhere need the scene's gradients. */
  ids?: SceneIds;
  /** Phone only: drawn on top of the scene. */
  foreground?: ReactNode;
  /** Wide only: scene-unit areas (e.g. behind labels) where no small tree may stand. */
  clearZones?: readonly Zone[];
  className?: string;
};

export function Scenery({ variant, ids: sharedIds, foreground, clearZones = [], className }: SceneryProps) {
  const ownIds = useSceneIds();
  const ids = sharedIds ?? ownIds;

  if (variant === "phone") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className={className}>
        <Defs ids={ids} />
        <Sky ids={ids} />
        <Clouds ids={ids} />
        <Sun ids={ids} />
        <Ridges ids={ids} />
        <Town ids={ids} />
        <Ground ids={ids} />
        <Fog ids={ids} />
        <Hills ids={ids} />
        <River ids={ids} />
        <LittleTrees ids={ids} />
        <Flowers ids={ids} />
        {foreground}
      </svg>
    );
  }

  // Wide: alternate stretched layers (fill the width) with fixed-shape layers (scaled to the height,
  // centered, repeated outward). Paint order matches the phone scene.
  const stretch = (children: ReactNode) => (
    <svg viewBox={WIDE_VIEWBOX} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
      {children}
    </svg>
  );
  const fixed = (children: ReactNode) => (
    <svg
      viewBox={WIDE_VIEWBOX}
      preserveAspectRatio="xMidYMax meet"
      className="absolute inset-0 h-full w-full"
      style={{ overflow: "visible" }}
    >
      {children}
    </svg>
  );
  const repeated = (name: string, id: string, layer: ReactNode) => (
    <>
      <g id={id}>{layer}</g>
      {REPEATS.map((k) => (
        <use key={k} href={`#${id}`} transform={repeatTransform(k)} data-repeat={name} />
      ))}
    </>
  );

  return (
    <div aria-hidden="true" className={`absolute inset-0 overflow-hidden ${className ?? ""}`}>
      {stretch(
        <>
          <Defs ids={ids} />
          <Sky ids={ids} />
        </>,
      )}
      {fixed(
        <>
          <g fill="#EBD9D2" opacity=".9">
            {WIDE_CLOUDS.map((c, i) => {
              const Cloud = CLOUD_PARTS[c.kind];
              const [ax, ay] = CLOUD_ANCHORS[c.kind];
              return (
                <g
                  key={i}
                  data-cloud=""
                  data-y={c.y}
                  data-scale={c.scale}
                  transform={`translate(${c.x} ${c.y}) scale(${c.mirror ? -c.scale : c.scale} ${c.scale}) translate(${-ax} ${-ay})`}
                >
                  <Cloud ids={ids} />
                </g>
              );
            })}
          </g>
          <Sun ids={ids} />
        </>,
      )}
      {stretch(<Ridges ids={ids} />)}
      {fixed(
        <g opacity=".6">
          <g data-church="" transform={`translate(${CHURCH_SHIFT} ${CHURCH_DROP})`}>
            <Church ids={ids} />
          </g>
          {repeated("houses", `${ids.hSky}-houses`, <Houses ids={ids} />)}
        </g>,
      )}
      {stretch(
        <>
          <Ground ids={ids} />
          <Fog ids={ids} />
          <Hills ids={ids} />
        </>,
      )}
      {/* No river on wide screens (HOME-11); the phone scenery keeps its own. */}
      {fixed(
        <>
          {WIDE_SMALL_TREES.map((t, i) =>
            clearZones.some((z) => overlaps(smallTreeBox(t), z)) ? null : (
              <g key={i} opacity={t.opacity}>
                <SmallTree cx={t.cx} cy={t.cy} r={t.r} palette={t.palette} clipId={`${ids.hSky}-st${i}`} />
              </g>
            ),
          )}
          {repeated("flowers", `${ids.hSky}-flowers`, <Flowers ids={ids} />)}
        </>,
      )}
    </div>
  );
}
