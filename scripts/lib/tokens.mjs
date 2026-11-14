// Shared helpers for build.mjs and check-contrast.mjs: reading tokens.json and colour maths.
// Colour mixing mirrors CSS `color-mix(in oklab, A p%, B)` for opaque colours, so the
// contrast check sees the same colours the browser will compute from the generated CSS.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function loadTokens(path = join(ROOT, 'tokens', 'tokens.json')) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// ---------- colour maths ----------

export function parseHex(hex) {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex);
  if (!m) throw new Error(`Not a #rrggbb colour: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
}

export function toHex(rgb) {
  return '#' + rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('');
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

function srgbToOklab(rgb) {
  const [r, g, b] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToSrgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(fromLinear);
}

/** CSS color-mix(in oklab, a percent%, b) for opaque #rrggbb colours. */
export function mixOklab(a, percent, b) {
  const p = percent / 100;
  const A = srgbToOklab(parseHex(a));
  const B = srgbToOklab(parseHex(b));
  return toHex(oklabToSrgb(A.map((v, i) => v * p + B[i] * (1 - p))));
}

export function luminance(hex) {
  const [r, g, b] = parseHex(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(fg, bg) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ---------- resolving a theme to concrete colours ----------

/**
 * Concrete colours of one theme for one accent, exactly as the browser computes them
 * from css/shmotka.css. `accent` is {dark, light?}; a missing light value is derived.
 */
export function resolveTheme(tokens, themeKey, accent) {
  const theme = tokens.themes[themeKey];
  const colors = Object.fromEntries(Object.entries(theme.colors).map(([k, v]) => [k, v.value]));
  const rule = tokens.accent.lightFromDark;
  colors.primary = themeKey === 'dark'
    ? accent.dark
    : accent.light ?? mixOklab(accent.dark, rule.percent, rule.with);
  for (const [name, d] of Object.entries(theme.derived)) {
    colors[name] = d.value ?? mixOklab(ref(colors, d.mix), d.percent, ref(colors, d.with));
  }
  return colors;
}

function ref(colors, v) {
  if (v.startsWith('#')) return v;
  if (!(v in colors)) throw new Error(`Unknown colour reference: ${v}`);
  return colors[v];
}

/** Every accent the system ships: the default (light derived) and each preset. */
export function accents(tokens) {
  const def = tokens.accent.presets[tokens.accent.default];
  return [
    { id: 'default', name: `по умолчанию (${def.name}, светлый выведен)`, dark: def.dark },
    ...Object.entries(tokens.accent.presets).map(([id, p]) => ({ id, name: p.name, dark: p.dark, light: p.light })),
  ];
}
