// A new circle's logo, made from its name (docs/specs/onboarding.md, ONB-9), from WelcomeLetter.dc.html.
// One SVG string, so the same drawing is shown in the flow and saved as the circle's logo image (ONB-13).

export type LogoStyle = "crest" | "badge" | "varsity";
export const LOGO_STYLES: readonly { id: LogoStyle; label: string }[] = [
  { id: "crest", label: "Crest" },
  { id: "badge", label: "Badge" },
  { id: "varsity", label: "Varsity" },
];

const NIGHT = "#1E2547";
const PAPER = "#FBF2D6";
const STAR = "M50 12l1.8 4 4.2.4-3.2 2.8 1 4.2L50 21l-3.8 2.4 1-4.2-3.2-2.8 4.2-.4z";
/** Fonts the app loads; an image of the logo can't reach them, so each falls back to a close system face. */
const SERIF = "Fraunces, var(--font-fraunces), Georgia, serif";
const SANS = "Karla, var(--font-karla), 'Arial Black', sans-serif";

const words = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);

/** First letters of the first two words, or the first two characters of one ("Red Robin" → RR, "Family" → FA). */
export function monogram(name: string): string {
  const w = words(name);
  return (w.length >= 2 ? w[0][0] + w[1][0] : (w[0] ?? "?").slice(0, 2)).toUpperCase();
}

/** The name's first letter, for the crest. */
export const crestLetter = (name: string) => (words(name)[0]?.[0] ?? "?").toUpperCase();

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The logo as a 100×100 SVG: `color` is the circle's canopy, `year` goes on the badge, `id` keeps gradient ids unique on a page. */
export function circleLogoSvg(style: LogoStyle, name: string, color: string, year: number, id = "l"): string {
  const body = (() => {
    switch (style) {
      case "crest": {
        const c = esc(crestLetter(name));
        return (
          `<circle cx="50" cy="50" r="50" fill="${NIGHT}"/>` +
          `<circle cx="50" cy="50" r="44" fill="none" stroke="${color}" stroke-width="2"/>` +
          `<circle cx="50" cy="50" r="39.5" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="1.5 4" stroke-linecap="round"/>` +
          `<path d="M22 80Q50 88 80 76" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>` +
          `<path d="${STAR}" fill="${color}"/>` +
          `<g transform="translate(50 67) skewX(-8)" font-family="${SERIF}" font-weight="800" font-size="50" text-anchor="middle">` +
          `<text x="7" y="4" fill="${color}">${c}</text>` +
          `<text x="0" y="0" fill="#FFF6DA" stroke="${NIGHT}" stroke-width="5.4" paint-order="stroke" stroke-linejoin="round">${c}</text></g>`
        );
      }
      case "badge":
        return (
          `<defs><radialGradient id="${id}-shine" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></radialGradient></defs>` +
          `<circle cx="50" cy="50" r="50" fill="${color}"/><circle cx="50" cy="50" r="50" fill="url(#${id}-shine)"/>` +
          `<circle cx="50" cy="50" r="43" fill="none" stroke="${PAPER}" stroke-width="2.4"/>` +
          `<circle cx="50" cy="50" r="38.5" fill="none" stroke="${PAPER}" stroke-width="1" stroke-dasharray="1.2 3.2" stroke-linecap="round"/>` +
          `<path d="${STAR}" transform="translate(19 50) scale(0.55) translate(-50 -16.5)" fill="${PAPER}"/>` +
          `<path d="${STAR}" transform="translate(81 50) scale(0.55) translate(-50 -16.5)" fill="${PAPER}"/>` +
          `<text x="50" y="80" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="6.5" letter-spacing="1.6" fill="${PAPER}">EST · ${year}</text>` +
          `<text x="50" y="59" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-weight="800" font-size="36" letter-spacing="-1" fill="#FFF6DA">${esc(monogram(name))}</text>`
        );
      case "varsity":
        return (
          `<circle cx="50" cy="50" r="50" fill="${PAPER}"/>` +
          `<circle cx="50" cy="50" r="45" fill="none" stroke="${color}" stroke-width="9"/>` +
          `<circle cx="50" cy="50" r="39" fill="none" stroke="${NIGHT}" stroke-width="1.6"/>` +
          `<path d="${STAR}" transform="translate(38 23) scale(0.42) translate(-50 -16.5)" fill="${NIGHT}"/>` +
          `<path d="${STAR}" transform="translate(50 20) scale(0.5) translate(-50 -16.5)" fill="${NIGHT}"/>` +
          `<path d="${STAR}" transform="translate(62 23) scale(0.42) translate(-50 -16.5)" fill="${NIGHT}"/>` +
          `<path d="M24 72H76" stroke="${color}" stroke-width="3" stroke-linecap="round"/>` +
          `<text x="50" y="62" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="34" letter-spacing="-.6" fill="${color}" stroke="${NIGHT}" stroke-width="3.4" paint-order="stroke" stroke-linejoin="round">${esc(monogram(name))}</text>`
        );
    }
  })();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${body}</svg>`;
}
