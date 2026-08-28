import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <span className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          stayconnect
        </span>
        <Show when="signed-in">
          <UserButton />
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="text-sm font-medium text-zinc-950 hover:underline dark:text-zinc-50">
              Sign in
            </button>
          </SignInButton>
        </Show>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
          Stay connected with the people who knew you when.
        </h1>
        <p className="mt-6 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          A lightweight way to keep up with old friends — high school,
          college, wherever life pulled you apart.
        </p>
        <Link
          href="/dashboard"
          className="mt-10 rounded-full bg-zinc-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Get started
        </Link>
      </main>
    </div>
  );
}
