#!/usr/bin/env node
// Copies the Shmotka font files (fonts/*.woff2 + OFL licences) into a project folder served at /fonts/.
//   npx shmotka-fonts public/fonts          copy
//   npx shmotka-fonts public/fonts --check  fail if the folder differs from this Shmotka version (CI)
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'fonts');
const args = process.argv.slice(2);
const check = args.includes('--check');
const dest = args.find((a) => !a.startsWith('--'));
if (!dest) { console.error('Укажите папку: npx shmotka-fonts public/fonts [--check]'); process.exit(2); }

const files = readdirSync(SRC).sort();
const extra = existsSync(dest) ? readdirSync(dest).filter((f) => !files.includes(f)) : [];
const stale = files.filter((f) => !existsSync(join(dest, f)) || !readFileSync(join(dest, f)).equals(readFileSync(join(SRC, f))));

if (check) {
  if (stale.length || extra.length) {
    console.error(`${dest}: шрифты не совпадают с Shmotka (${[...stale, ...extra].join(', ')}) — запустите npx shmotka-fonts ${dest}.`);
    process.exit(1);
  }
  console.log(`${dest}: шрифты Shmotka актуальны`);
} else {
  mkdirSync(dest, { recursive: true });
  for (const f of stale) writeFileSync(join(dest, f), readFileSync(join(SRC, f)));
  console.log(`${dest}: ${stale.length ? `обновлено файлов — ${stale.length}` : 'уже актуально'}`);
  if (extra.length) console.log(`Лишние файлы, не из Shmotka: ${extra.join(', ')}`);
}
