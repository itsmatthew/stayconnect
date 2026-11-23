// The browser's side of a remembered folder (docs/specs/daily5.md, D5-14): the File System Access API's folder picker,
// with the chosen folders kept in IndexedDB, which can hold folder handles. Only desktop Chrome and Edge have it.

import { useSyncExternalStore } from "react";
import type { PoolId } from "./daily-pick";
import type { FolderAccess, FolderHandle } from "./folders";

const DB = "nowandthen-folders";
const FOLDERS = "folders";

type Permissioned = FolderHandle & {
  queryPermission?(o: { mode: "read" }): Promise<PermissionState>;
  requestPermission?(o: { mode: "read" }): Promise<PermissionState>;
};
type Picker = (o: { id?: string; mode: "read" }) => Promise<FolderHandle>;

const request = <T>(r: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });

let opening: Promise<IDBDatabase> | undefined;
function db(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(FOLDERS);
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
  return opening;
}
const folders = async (mode: IDBTransactionMode) => (await db()).transaction(FOLDERS, mode).objectStore(FOLDERS);

/** Undefined where the browser can't keep a folder; the pools then fall back to the plain folder picker. */
export function browserFolders(): FolderAccess | undefined {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") return undefined;
  const picker = (window as unknown as { showDirectoryPicker?: Picker }).showDirectoryPicker;
  if (!picker) return undefined;
  return {
    pick: async () => {
      try {
        return await picker.call(window, { id: "nowandthen-pool", mode: "read" });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return undefined;
        throw e;
      }
    },
    load: async (pool: PoolId) => (await request((await folders("readonly")).get(pool))) as FolderHandle | undefined,
    save: async (pool, folder) => void (await request((await folders("readwrite")).put(folder, pool))),
    forget: async (pool) => void (await request((await folders("readwrite")).delete(pool))),
    allowed: async (folder) => {
      const f = folder as Permissioned;
      if (!f.queryPermission || !f.requestPermission) return true;
      if ((await f.queryPermission({ mode: "read" })) === "granted") return true;
      return (await f.requestPermission({ mode: "read" })) === "granted";
    },
  };
}

let cached: { access: FolderAccess | undefined } | undefined;
const noSubscribe = () => () => {};

/** The browser's folder access, or undefined; always undefined while rendering on the server, so hydration matches. */
export function useBrowserFolders(): FolderAccess | undefined {
  return useSyncExternalStore(
    noSubscribe,
    () => (cached ??= { access: browserFolders() }).access,
    () => undefined,
  );
}
