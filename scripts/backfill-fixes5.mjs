#!/usr/bin/env node
/**
 * Backfill FIXES-5 columns: photos.placeholder, photos.content_hash
 * Streams originals from disk — does not load full files into memory at once.
 *
 * Usage: DATA_DIR=./data node scripts/backfill-fixes5.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import sharp from 'sharp';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'gallery.db');
const PHOTOS_ROOT = path.join(DATA_DIR, 'photos');

if (!fs.existsSync(DB_PATH)) {
  console.error('No database at', DB_PATH);
  process.exit(1);
}

const db = new Database(DB_PATH);

async function placeholderFor(src) {
  const buf = await sharp(src)
    .rotate()
    .resize(24, 24, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 40 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

const rows = db
  .prepare(
    `SELECT id, gallery_id, filename, placeholder, content_hash FROM photos`,
  )
  .all();

let updated = 0;
for (const row of rows) {
  const original = path.join(
    PHOTOS_ROOT,
    row.gallery_id,
    'originals',
    row.filename,
  );
  if (!fs.existsSync(original)) continue;

  const patch = {};
  if (!row.content_hash) {
    patch.content_hash = await hashFile(original);
  }
  if (!row.placeholder) {
    try {
      patch.placeholder = await placeholderFor(original);
    } catch (e) {
      console.warn('placeholder failed', row.id, e.message);
    }
  }

  if (Object.keys(patch).length === 0) continue;
  const sets = Object.keys(patch)
    .map((k) => `${k} = @${k}`)
    .join(', ');
  db.prepare(`UPDATE photos SET ${sets}, updated_at = @updated_at WHERE id = @id`).run({
    ...patch,
    updated_at: Date.now(),
    id: row.id,
  });
  updated++;
  if (updated % 50 === 0) console.log('updated', updated);
}

console.log('Done. Updated', updated, 'photos.');
db.close();
