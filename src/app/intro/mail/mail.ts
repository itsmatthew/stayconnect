// Dropping a photo in someone's mailbox (docs/specs/mail.md). Plain TypeScript.
import type { DropRecord } from "./drop-limits";

export type DropRequest = {
  to: { kind: "person"; id: string } | { kind: "phone"; phone: string };
  /** A photo from Daily 5's pools. */
  photoId: string;
  takenAt: number;
  from: string;
  at: number;
  /** Outside your circle: it counts toward the limits (MAIL-6). */
  outside: boolean;
};

/** Where it went. Only known after the drop, never while typing a number (MAIL-4). */
/** `notAccepting`: their "Who can drop in my mailbox" leaves you out (MAIL-10). Nothing is sent or counted. */
export type DropOutcome = { kind: "mailbox" } | { kind: "invite"; link: string } | { kind: "invitesUnavailable" } | { kind: "notAccepting" };

/** TODO(server): only the fake in `local-mail.ts` exists, so a drop stays on this device. Free: drops never touch payment. */
export interface Mail {
  drop(req: DropRequest): Promise<DropOutcome>;
  /** Your drops, for the limits. */
  history(): Promise<DropRecord[]>;
}

/** TODO(server): an invite carrying a drop, so the photo is waiting in their mailbox when they join (issue #26). */
export interface Invites {
  create(carries: { phone: string; dropId: string }): Promise<{ link: string }>;
}

/** The system share sheet: the Web Share API on the web, React Native's Share on mobile. */
export interface Share {
  share(req: { url: string; text: string }): Promise<"shared" | "copied" | "cancelled">;
}
