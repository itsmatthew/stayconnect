import { auth, currentUser } from "@clerk/nextjs/server";
import { incrementAndGetVisits } from "@/lib/db";

export default async function Dashboard() {
  await auth.protect();

  const [user, visits] = await Promise.all([
    currentUser(),
    incrementAndGetVisits(),
  ]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Welcome, {user?.firstName ?? user?.primaryEmailAddress?.emailAddress}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        This page has been visited {visits} time{visits === 1 ? "" : "s"} —
        proof that Clerk auth and the Neon database are both wired up.
      </p>
    </div>
  );
}
