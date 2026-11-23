// A pool's remembered folder (docs/specs/daily5.md, D5-14). Plain TypeScript: the browser's folder handles are
// described by the little they need to do here, so tests and a later app can hand in their own.

import type { PoolId } from "./daily-pick";

export type FolderFile = { kind: "file"; name: string; getFile(): Promise<File> };
export type FolderHandle = { kind: "directory"; name: string; values(): AsyncIterable<FolderItem> };
export type FolderItem = FolderFile | FolderHandle;

/** Where a pool's folder is picked, kept and allowed. Missing where the browser can't keep a folder (Safari, Firefox, phones). */
export type FolderAccess = {
  /** Undefined when the pick was cancelled. */
  pick(): Promise<FolderHandle | undefined>;
  load(pool: PoolId): Promise<FolderHandle | undefined>;
  save(pool: PoolId, folder: FolderHandle): Promise<void>;
  forget(pool: PoolId): Promise<void>;
  /** Whether the folder may be read now, asking the browser if it needs to (only from a tap). */
  allowed(folder: FolderHandle): Promise<boolean>;
};

/** Every file in a folder and its subfolders, skipping hidden ones (".DS_Store", ".thumbnails"). */
export async function* filesIn(folder: FolderHandle): AsyncGenerator<File> {
  for await (const item of folder.values()) {
    if (item.name.startsWith(".")) continue;
    if (item.kind === "directory") yield* filesIn(item);
    else yield await item.getFile();
  }
}
