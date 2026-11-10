// Uploaded images, videos and audio are kept in the browser's IndexedDB (localStorage is too small for media).
import { useEffect, useState } from "react";

import { uid } from "./project-factory";
import type { MediaItem, MediaKind } from "./types";

const DB_NAME = "vexaro-media";
const STORE = "files";

interface StoredFile {
  id: string;
  blob: Blob;
  name: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = run(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export function kindFromMime(mime: string): MediaKind | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return null;
}

export async function saveMediaFile(file: File): Promise<MediaItem> {
  const kind = kindFromMime(file.type);
  if (!kind) throw new Error(`${file.name} is not an image, video or audio file.`);
  const id = uid("med");
  await tx("readwrite", (s) => s.put({ id, blob: file, name: file.name } satisfies StoredFile));
  return { id, name: file.name, kind, mimeType: file.type, size: file.size, createdAt: Date.now() };
}

export async function getMediaBlob(id: string): Promise<StoredFile | undefined> {
  return tx<StoredFile | undefined>("readonly", (s) => s.get(id) as IDBRequest<StoredFile | undefined>);
}

export async function deleteMediaFile(id: string) {
  await tx("readwrite", (s) => s.delete(id));
}

export function useMediaUrl(id: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!id) {
      setUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    getMediaBlob(id)
      .then((file) => {
        if (cancelled || !file) return;
        objectUrl = URL.createObjectURL(file.blob);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(null));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  return url;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
