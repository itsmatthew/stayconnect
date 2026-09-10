export async function register() {
  // Middleware also triggers instrumentation on the edge runtime; skip it so
  // this check runs once, in the Node.js server instance.
  if (process.env.NEXT_RUNTIME === "edge") return;
  if (process.env.NODE_ENV !== "development") return;

  const required = ["CLERK_SECRET_KEY", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}\n` +
        "Copy .env.example to .env.local and fill in the missing value(s).",
    );
  }

  if (!process.env.DATABASE_URL) {
    console.warn(
      "[env] DATABASE_URL is not set — /dashboard will fail when visited. See .env.example.",
    );
  }
}
