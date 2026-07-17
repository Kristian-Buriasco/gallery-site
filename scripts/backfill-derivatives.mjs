#!/usr/bin/env node
// Backfill the `md` (1280px) derivative for photos processed before it existed.
// Idempotent: skips photos that already have an md file. Generates md by
// downscaling the existing `web` derivative, so any baked-in watermark is
// preserved and no original/watermark reprocessing is needed. Anything this
// misses is covered by the lazy generator in /img/[photoId]/[variant].
//
// Usage (on the mini, from the deploy dir):
//   DATA_DIR=/opt/sites/gallery/data /opt/local/bin/node scripts/backfill-derivatives.mjs

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import sharp from 'sharp';

const DATA_DIR = path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), 'data'));
const DB_PATH = path.join(DATA_DIR, 'gallery.db');

function webpBasename(filename) {
  const ext = path.extname(filename);
  return `${filename.slice(0, filename.length - ext.length)}.webp`;
}
function variantPath(galleryId, filename, variant) {
  return path.join(DATA_DIR, 'photos', galleryId, variant, webpBasename(filename));
}

if (!fs.existsSync(DB_PATH)) {
  console.error(`No DB at ${DB_PATH} (set DATA_DIR)`);
  process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });
const rows = db
  .prepare("SELECT id, gallery_id AS galleryId, filename FROM photos WHERE status = 'ready'")
  .all();
db.close();

let made = 0;
let skipped = 0;
let missingWeb = 0;

for (const p of rows) {
  const mdOut = variantPath(p.galleryId, p.filename, 'md');
  if (fs.existsSync(mdOut)) {
    skipped++;
    continue;
  }
  const webSrc = variantPath(p.galleryId, p.filename, 'web');
  if (!fs.existsSync(webSrc)) {
    missingWeb++;
    continue;
  }
  try {
    fs.mkdirSync(path.dirname(mdOut), { recursive: true });
    await sharp(webSrc)
      .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(mdOut);
    made++;
  } catch (err) {
    console.error(`md failed for ${p.id}:`, err.message);
  }
}

console.log(
  `Backfill done — ${rows.length} ready photos: ${made} md generated, ${skipped} already present, ${missingWeb} missing web (skipped).`,
);
