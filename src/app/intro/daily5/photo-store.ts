// The photo pools, kept only in this browser's IndexedDB (docs/specs/daily5.md, D5-2/3/7/8).
// Metadata and image bytes live in separate stores so listing thousands of photos never loads the images.

import type { PhotoMeta, PoolId } from "./daily-pick";

export type StoredPhoto = PhotoMeta & { fileKey: string; hasFace?: boolean };
export type NewPhoto = Omit<StoredPhoto, "id" | "hasFace"> & { image: Blob };

export type PhotoStore = {
  add(photo: NewPhoto): Promise<string>;
  has(pool: PoolId, fileKey: string): Promise<boolean>;
  list(): Promise<StoredPhoto[]>;
  counts(): Promise<Record<PoolId, number>>;
  image(id: string): Promise<Blob | undefined>;
  setHasFace(id: string, hasFace: boolean): Promise<void>;
  getDay(dateKey: string): Promise<string[] | undefined>;
  setDay(dateKey: string, ids: readonly string[]): Promise<void>;
  close(): void;
};

export const PHOTO_DB = "nowandthen-photos";
const PHOTOS = "photos";
const IMAGES = "images";
const DAYS = "days";

const request = <T>(r: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
const done = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error);
  });

export async function openPhotoStore(name = PHOTO_DB): Promise<PhotoStore> {
  const open = indexedDB.open(name, 1);
  open.onupgradeneeded = () => {
    const db = open.result;
    const photos = db.createObjectStore(PHOTOS, { keyPath: "id" });
    photos.createIndex("poolFile", ["pool", "fileKey"], { unique: true });
    db.createObjectStore(IMAGES);
    db.createObjectStore(DAYS);
  };
  const db = await request(open);

  const read = <T>(store: string, fn: (s: IDBObjectStore) => IDBRequest<T>) =>
    request(fn(db.transaction(store, "readonly").objectStore(store)));

  const store: PhotoStore = {
    async add({ image, ...meta }) {
      const id = crypto.randomUUID();
      const tx = db.transaction([PHOTOS, IMAGES], "readwrite");
      tx.objectStore(PHOTOS).add({ ...meta, id });
      tx.objectStore(IMAGES).put(image, id);
      await done(tx);
      return id;
    },
    async has(pool, fileKey) {
      const n = await read(PHOTOS, (s) => s.index("poolFile").count([pool, fileKey]));
      return n > 0;
    },
    list: () => read<StoredPhoto[]>(PHOTOS, (s) => s.getAll()),
    async counts() {
      const all = await store.list();
      return { mine: all.filter((p) => p.pool === "mine").length, family: all.filter((p) => p.pool === "family").length };
    },
    image: (id) => read<Blob | undefined>(IMAGES, (s) => s.get(id)),
    async setHasFace(id, hasFace) {
      const tx = db.transaction(PHOTOS, "readwrite");
      const s = tx.objectStore(PHOTOS);
      const p = await request<StoredPhoto | undefined>(s.get(id));
      if (p) s.put({ ...p, hasFace });
      await done(tx);
    },
    getDay: (dateKey) => read<string[] | undefined>(DAYS, (s) => s.get(dateKey)),
    async setDay(dateKey, ids) {
      const tx = db.transaction(DAYS, "readwrite");
      tx.objectStore(DAYS).put([...ids], dateKey);
      await done(tx);
    },
    close: () => db.close(),
  };
  return store;
}
