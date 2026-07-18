#!/usr/bin/env node
// Fetch a free, no-key IP→city database (DB-IP City Lite, MaxMind-DB format,
// CC-BY 4.0) into $DATA_DIR/GeoLite2-City.mmdb so location features light up.
// Re-run monthly to refresh. No account or license key required.
//
// Attribution (CC-BY 4.0): "IP Geolocation by DB-IP" — https://db-ip.com
//
// Usage (on the server):
//   DATA_DIR=/opt/sites/gallery/data /opt/local/bin/node scripts/fetch-geoip.mjs

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const DATA_DIR = path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), 'data'));
const OUT = path.join(DATA_DIR, 'GeoLite2-City.mmdb');

function months(n) {
  const out = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const m of months(4)) {
    const url = `https://download.db-ip.com/free/dbip-city-lite-${m}.mmdb.gz`;
    process.stdout.write(`Trying ${m}… `);
    const res = await fetch(url);
    if (!res.ok || !res.body) {
      console.log(`http ${res.status}`);
      continue;
    }
    const tmp = `${OUT}.tmp`;
    await pipeline(
      Readable.fromWeb(res.body),
      zlib.createGunzip(),
      fs.createWriteStream(tmp),
    );
    fs.renameSync(tmp, OUT);
    const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1);
    console.log(`OK → ${OUT} (${mb} MB)`);
    return;
  }
  console.error('Could not fetch a DB-IP City Lite database for any recent month.');
  process.exit(1);
}

main().catch((err) => {
  console.error('fetch-geoip failed:', err.message);
  process.exit(1);
});
