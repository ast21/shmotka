// Builds css/shmotka.css from tokens/tokens.json.
//   node scripts/build.mjs          write the file
//   node scripts/build.mjs --check  fail if the committed file is out of date
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadTokens } from './lib/tokens.mjs';

const OUT = join(ROOT, 'css', 'shmotka.css');

export function build(tokens) {
  const L = [];
  L.push('/* Shmotka — сгенерировано из tokens/tokens.json скриптом scripts/build.mjs. Не править руками. */');
  L.push('/* Подключение: @import "tailwindcss"; @plugin "daisyui" { themes: false; } @import "shmotka"; */');
  L.push('');

  // Accent: default and presets.
  const def = tokens.accent.presets[tokens.accent.default];
  L.push('/* Акцент проекта. Свой цвет: :root { --shm-accent: #...; --shm-accent-light: #...; } (второй по желанию),');
  L.push('   цвет текста на акценте — --shm-accent-fg (по желанию). Telegram Mini App: shmotka/telegram.js.');
  L.push('   Готовые акценты: <html data-accent="ideahub|iskra|finance|inbox">. */');
  L.push(`:where(:root) { --shm-accent: ${def.dark}; }`);
  for (const [id, p] of Object.entries(tokens.accent.presets)) {
    L.push(`[data-accent="${id}"] { --shm-accent: ${p.dark}; --shm-accent-light: ${p.light}; } /* ${p.name} */`);
  }
  L.push('');

  const rule = tokens.accent.lightFromDark;
  for (const [key, theme] of Object.entries(tokens.themes)) {
    L.push('@plugin "daisyui/theme" {');
    L.push(`  name: "${theme.name}";`);
    L.push(`  default: ${theme.default};`);
    L.push(`  prefersdark: ${theme.prefersdark};`);
    L.push(`  color-scheme: ${theme.colorScheme};`);
    L.push('');
    for (const [name, c] of Object.entries(theme.colors)) L.push(`  --shm-${name}: ${c.value};`);
    L.push(key === 'dark'
      ? '  --shm-primary: var(--shm-accent);'
      : `  --shm-primary: var(--shm-accent-light, color-mix(in oklab, var(--shm-accent) ${rule.percent}%, ${rule.with}));`);
    for (const [name, d] of Object.entries(theme.derived)) {
      let v = d.value ?? `color-mix(in oklab, ${cssRef(d.mix)} ${d.percent}%, ${cssRef(d.with)})`;
      // Text on the accent can come from the project too (Telegram: button_text_color).
      if (name === 'primary-fg') v = `var(--shm-accent-fg, ${v})`;
      L.push(`  --shm-${name}: ${v};`);
    }
    for (const [name, v] of Object.entries(theme.shadows)) L.push(`  --shm-${name}: ${v};`);
    L.push('');
    for (const [name, c] of Object.entries(theme.colors)) {
      if (c.daisy) L.push(`  --color-${c.daisy}: var(--shm-${name});`);
    }
    // One accent: secondary and accent of daisyUI mirror primary.
    for (const slot of ['primary', 'secondary', 'accent']) {
      L.push(`  --color-${slot}: var(--shm-primary);`);
      L.push(`  --color-${slot}-content: var(--shm-primary-fg);`);
    }
    for (const slot of ['success', 'warning', 'error', 'info']) L.push(`  --color-${slot}-content: var(--shm-on-color);`);
    for (const [name, v] of Object.entries(tokens.daisy)) {
      if (name !== 'about') L.push(`  --${name}: ${resolveRef(tokens, v)};`);
    }
    L.push('}');
    L.push('');
  }

  // Tailwind utilities for what daisyUI does not name: text-muted, border-line, bg-primary-soft, rounded-lg…
  const dark = tokens.themes.dark;
  const extra = [
    ['muted', 'fg-muted'], ['subtle', 'fg-subtle'], ['line', 'border'], ['line-strong', 'border-strong'],
    ['primary-soft', 'primary-soft'], ['primary-text', 'primary-text'],
    ...Object.keys(dark.colors).filter((n) => n.endsWith('-soft') || n.startsWith('heat-') || n.startsWith('status-')).map((n) => [n, n]),
  ];
  L.push('@theme inline {');
  for (const [name, v] of Object.entries(tokens.fonts)) {
    if (name !== 'googleFontsUrl') L.push(`  --font-${name}: ${v};`);
  }
  for (const [util, token] of extra) L.push(`  --color-${util}: var(--shm-${token});`);
  for (const [name, r] of Object.entries(tokens.radius)) L.push(`  --radius-${name}: ${r.value};`);
  L.push('  --shadow-sm: var(--shm-shadow-sm);');
  L.push('  --shadow-lg: var(--shm-shadow-lg);');
  L.push('}');
  L.push('');

  // Theme tuning, not a new class: a plain daisyUI button gets the system's control border
  // (daisyUI derives it from the button's own fill, which disappears on a white surface).
  const coloured = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error', 'ghost', 'link', 'soft', 'outline', 'dash', 'active']
    .map((m) => `.btn-${m}`).join(', ');
  L.push('/* Доводка daisyUI под правила системы. */');
  L.push('@layer utilities {');
  L.push(`  .btn:where(:not(${coloured}, :disabled, [disabled])) { border-color: var(--shm-border-strong); }`);
  L.push('  /* Активный пункт меню — мягкая подложка акцента, а не тёмная заливка neutral. */');
  L.push('  .menu { --menu-active-bg: var(--shm-primary-soft); --menu-active-fg: var(--shm-primary-text); }');
  L.push('}');
  L.push('');

  L.push(':root {');
  for (const [name, s] of Object.entries(tokens.size)) L.push(`  --shm-${name}: ${s.value};`);
  L.push('}');
  return L.join('\n') + '\n';
}

const cssRef = (v) => (v.startsWith('#') ? v : `var(--shm-${v})`);

function resolveRef(tokens, v) {
  const m = /^\{(\w+)\.(\w+)\}$/.exec(v);
  if (!m) return v;
  const t = tokens[m[1]]?.[m[2]];
  if (!t) throw new Error(`Unknown token reference: ${v}`);
  return t.value;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const css = build(loadTokens());
  if (process.argv.includes('--check')) {
    let current = '';
    try { current = readFileSync(OUT, 'utf8'); } catch {}
    if (current !== css) {
      console.error('css/shmotka.css устарел: запустите npm run build и закоммитьте результат.');
      process.exit(1);
    }
    console.log('css/shmotka.css актуален');
  } else {
    mkdirSync(join(ROOT, 'css'), { recursive: true });
    writeFileSync(OUT, css);
    console.log(`Записан ${OUT}`);
  }
}
