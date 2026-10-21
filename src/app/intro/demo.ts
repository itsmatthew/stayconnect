// The app-wide demo switch (docs/specs/demo.md, DEMO-1): it alone decides whether placeholder data loads.

type DemoEnv = { flag: string | undefined; nodeEnv: string | undefined };

/** `NEXT_PUBLIC_DEMO_DATA=on|off` decides; unset, demo data is on only in development. */
export function demoDataEnabled({ flag, nodeEnv }: DemoEnv): boolean {
  if (flag === "on") return true;
  if (flag === "off") return false;
  return nodeEnv === "development";
}

// Written out in full so Next inlines both at build time (dynamic `process.env` lookups aren't inlined).
export const DEMO_DATA = demoDataEnabled({ flag: process.env.NEXT_PUBLIC_DEMO_DATA, nodeEnv: process.env.NODE_ENV });
