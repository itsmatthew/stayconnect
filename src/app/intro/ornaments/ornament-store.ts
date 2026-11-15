// Ornament changes and their photos, kept in this browser (docs/specs/home.md, HOME-15).
// TODO(re-evaluate when ornaments come from the database): this stands in for the server, so only this
// browser's user sees and makes changes.

import type { OrnamentState } from "./ornaments";

export const ORNAMENT_DB = "nowandthen-ornaments";
const EDITS = "edits";
const IMAGES = "images";
const STATE_KEY = "state";

export type OrnamentStore = {
  load(): Promise<OrnamentState>;
  save(state: OrnamentState): Promise<void>;
  /** Stores an image under a new id. */
  putImage(image: Blob): Promise<string>;
  image(id: string): Promise<Blob | undefined>;
  deleteImage(id: string): Promise<void>;
  close(): void;
};

const request = <T>(r: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
const done = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error ?? new Error("transaction aborted"));
  });

export async function openOrnamentStore(name = ORNAMENT_DB): Promise<OrnamentStore> {
  const open = indexedDB.open(name, 1);
  open.onupgradeneeded = () => {
    open.result.createObjectStore(EDITS);
    open.result.createObjectStore(IMAGES);
  };
  const db = await request(open);

  const write = (store: string, fn: (s: IDBObjectStore) => void) => {
    const tx = db.transaction(store, "readwrite");
    fn(tx.objectStore(store));
    return done(tx);
  };

  return {
    async load() {
      const state = await request<OrnamentState | undefined>(db.transaction(EDITS, "readonly").objectStore(EDITS).get(STATE_KEY));
      return state ?? {};
    },
    save: (state) => write(EDITS, (s) => s.put(state, STATE_KEY)),
    async putImage(image) {
      const id = crypto.randomUUID();
      await write(IMAGES, (s) => s.put(image, id));
      return id;
    },
    image: (id) => request<Blob | undefined>(db.transaction(IMAGES, "readonly").objectStore(IMAGES).get(id)),
    deleteImage: (id) => write(IMAGES, (s) => s.delete(id)),
    close: () => db.close(),
  };
}
