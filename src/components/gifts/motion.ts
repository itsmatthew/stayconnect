/** True when the viewer asked for less motion, or there's no way to tell (tests, server). Then waits are skipped. */
export const prefersLessMotion = () => typeof matchMedia !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches;
