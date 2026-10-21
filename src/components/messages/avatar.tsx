import type { FriendLook, Party } from "../home/types";
import { FRAUNCES, s } from "../home/units";

const initials = (name: string) =>
  name
    .replace(/[’']\d+/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

/** A friend's face as layered radial gradients, like the reference's avatars. */
export const faceGradient = ({ skin, hair, shirt, bg }: FriendLook) =>
  `radial-gradient(circle at 50% 44%, ${skin} 0 25%, transparent 27%), radial-gradient(circle at 50% 36%, ${hair} 0 34%, transparent 36%), radial-gradient(ellipse at 50% 108%, ${shirt} 0 42%, transparent 44%), ${bg}`;

/** A circle's logo (its canopy colour and initials) or a friend's face, ringed like the reference's avatars. */
export function PartyAvatar({ party, size }: { party: Party; size: number }) {
  const common = { display: "block", width: s(size), height: s(size), borderRadius: "50%", flex: "none" } as const;
  if (party.kind === "friend") {
    return (
      <span
        role="img"
        aria-label={party.name}
        style={{
          ...common,
          background: faceGradient(party.look),
          boxShadow: `0 0 0 ${s(2.5)} #F6ECCD, 0 0 0 ${s(5)} ${party.look.ring}`,
        }}
      />
    );
  }
  const { canopy, shade, highlight } = party.palette;
  return (
    <span
      role="img"
      aria-label={`${party.name} logo`}
      style={{
        ...common,
        background: `radial-gradient(circle at 35% 30%, ${highlight} 0 8%, ${canopy} 40%, ${shade})`,
        boxShadow: `0 0 0 ${s(2.5)} #F6ECCD, 0 0 0 ${s(5)} ${canopy}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#FFF6DA",
        fontFamily: FRAUNCES,
        fontWeight: 800,
        fontSize: s(size * 0.38),
        letterSpacing: s(-0.5),
      }}
    >
      <span aria-hidden="true">{initials(party.name)}</span>
    </span>
  );
}
