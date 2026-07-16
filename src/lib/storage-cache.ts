import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './env';
import { dirSizeBytes, formatBytes, volumeUsage, type DiskUsage } from './disk';
import { galleryDir } from './paths';
import { getDb, schema } from '@/db';
import { asc, eq, sql } from 'drizzle-orm';

export type GalleryStorageRow = {
  id: string;
  title: string;
  type: string;
  photoCount: number;
  sizeBytes: number;
};

export type StorageSnapshot = {
  computedAt: number;
  disk: DiskUsage;
  dataDirBytes: number;
  galleries: GalleryStorageRow[];
};

const CACHE_TTL_MS = 60 * 60 * 1000;

const globalCache = globalThis as unknown as {
  __storageSnapshot?: StorageSnapshot;
};

export function getStorageSnapshot(force = false): StorageSnapshot {
  const cached = globalCache.__storageSnapshot;
  if (!force && cached && Date.now() - cached.computedAt < CACHE_TTL_MS) {
    return cached;
  }

  const db = getDb();
  const galleries = db
    .select()
    .from(schema.galleries)
    .orderBy(asc(schema.galleries.sortOrder))
    .all();

  const rows: GalleryStorageRow[] = galleries.map((g) => ({
    id: g.id,
    title: g.title,
    type: g.type,
    photoCount:
      db
        .select({ c: sql<number>`count(*)` })
        .from(schema.photos)
        .where(eq(schema.photos.galleryId, g.id))
        .get()?.c ?? 0,
    sizeBytes: dirSizeBytes(galleryDir(g.id)),
  }));

  const snap: StorageSnapshot = {
    computedAt: Date.now(),
    disk: volumeUsage(),
    dataDirBytes: dirSizeBytes(DATA_DIR),
    galleries: rows,
  };
  globalCache.__storageSnapshot = snap;
  return snap;
}

export { formatBytes };
