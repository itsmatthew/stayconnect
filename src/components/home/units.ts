// Home components are sized in design pixels times `--s`, a CSS unit set by the layout:
// the phone canvas sets it to its 390-wide scale, the wide canvas to its (optionally scaled) 1312-wide scale.
export const s = (n: number) => `calc(${n} * var(--s))`;

export const FRAUNCES = "var(--font-fraunces), Georgia, serif";
export const KARLA = "var(--font-karla), system-ui, sans-serif";

export const INK = "#27305A";
export const CREAM = "#FFF8EC";
