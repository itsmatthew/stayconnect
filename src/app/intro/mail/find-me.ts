// "Let people find me by name" (docs/specs/mail.md, MAIL-7). Plain TypeScript.

/** TODO(server): only the fake in `local-find-me.ts` exists, so the setting doesn't reach anyone's search yet. */
export interface FindMeSetting {
  /** On unless turned off. */
  load(): Promise<boolean>;
  save(on: boolean): Promise<void>;
}
