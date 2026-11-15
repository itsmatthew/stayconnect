// Your own Archive posts, kept only in this browser (docs/specs/archive.md, ARC-3/12).
// Its own IndexedDB, apart from Daily 5's photos. Posts are keyed by period, so IndexedDB itself
// refuses a second post for the same week, month or year: a post can never be replaced.
// TODO(re-evaluate when posts come from the database): this stands in for the server.

import { ME } from "../messages/conversations";
import type { ArchivePost } from "./posts";

export const ARCHIVE_DB = "nowandthen-archive";
const POSTS = "posts";
const IMAGES = "images";

type StoredPost = { id: string; period: string; postedAt: number; takenAt: number; caption?: string };
export type NewPost = Omit<StoredPost, "id"> & { image: Blob };

export type ArchiveStore = {
  /** Your posts, oldest first. */
  posts(): Promise<ArchivePost[]>;
  /** Rejects if you've already posted for that period. There is deliberately no way to change a post (ARC-3, ARC-13). */
  add(post: NewPost): Promise<ArchivePost>;
  image(photoId: string): Promise<Blob | undefined>;
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

const toPost = ({ id, period, postedAt, takenAt, caption }: StoredPost): ArchivePost => ({
  id,
  author: ME,
  period,
  postedAt,
  takenAt,
  photo: { kind: "stored", photoId: id },
  ...(caption ? { caption } : {}),
});

export async function openArchiveStore(name = ARCHIVE_DB): Promise<ArchiveStore> {
  const open = indexedDB.open(name, 1);
  open.onupgradeneeded = () => {
    open.result.createObjectStore(POSTS, { keyPath: "period" });
    open.result.createObjectStore(IMAGES);
  };
  const db = await request(open);

  return {
    async posts() {
      const all = await request<StoredPost[]>(db.transaction(POSTS, "readonly").objectStore(POSTS).getAll());
      return all.map(toPost).sort((a, b) => a.postedAt - b.postedAt);
    },
    async add({ image, ...meta }) {
      const { caption, ...rest } = meta;
      const stored: StoredPost = { ...rest, ...(caption ? { caption } : {}), id: crypto.randomUUID() };
      const tx = db.transaction([POSTS, IMAGES], "readwrite");
      // `add`, not `put`: a second post for the same period fails and aborts the whole transaction.
      tx.objectStore(POSTS).add(stored);
      tx.objectStore(IMAGES).put(image, stored.id);
      await done(tx);
      return toPost(stored);
    },
    image: (photoId) => request<Blob | undefined>(db.transaction(IMAGES, "readonly").objectStore(IMAGES).get(photoId)),
    close: () => db.close(),
  };
}
