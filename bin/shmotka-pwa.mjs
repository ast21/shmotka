#!/usr/bin/env node
// Copies the Shmotka PWA script (js/pwa.js) into a project file served at /pwa.js.
//   npx shmotka-pwa public/pwa.js          copy
//   npx shmotka-pwa public/pwa.js --check  fail if the file differs from this Shmotka version (CI)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'js', 'pwa.js');
const args = process.argv.slice(2);
const check = args.includes('--check');
const dest = args.find((a) => !a.startsWith('--'));
if (!dest) { console.error('Укажите файл: npx shmotka-pwa public/pwa.js [--check]'); process.exit(2); }

const src = readFileSync(SRC);
const same = existsSync(dest) && readFileSync(dest).equals(src);

if (check) {
  if (!same) {
    console.error(`${dest}: не совпадает с shmotka/pwa этой версии — запустите npx shmotka-pwa ${dest}.`);
    process.exit(1);
  }
  console.log(`${dest}: shmotka/pwa актуален`);
} else {
  if (!same) { mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, src); }
  console.log(`${dest}: ${same ? 'уже актуально' : 'обновлено'}`);
}
