// Checks WCAG contrast of every pair listed in tokens.json "contrast", in both themes,
// for the default accent and every preset. Text pairs need 4.5:1, UI pairs 3:1.
import { loadTokens, resolveTheme, accents, contrast } from './lib/tokens.mjs';

export function checkContrast(tokens) {
  const failures = [];
  const rows = [];
  for (const accent of accents(tokens)) {
    for (const themeKey of Object.keys(tokens.themes)) {
      const colors = resolveTheme(tokens, themeKey, accent);
      for (const [kind, min] of [['text', 4.5], ['ui', 3]]) {
        for (const [fg, bg] of tokens.contrast[kind]) {
          const ratio = contrast(colors[fg], colors[bg]);
          const row = { accent: accent.id, theme: themeKey, fg, bg, ratio, min };
          rows.push(row);
          if (ratio < min) failures.push(row);
        }
      }
    }
  }
  return { rows, failures };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { rows, failures } = checkContrast(loadTokens());
  for (const f of failures) {
    console.error(`✗ ${f.accent} / ${f.theme}: ${f.fg} на ${f.bg} = ${f.ratio.toFixed(2)}:1, нужно ${f.min}:1`);
  }
  if (failures.length) process.exit(1);
  const worst = rows.reduce((a, b) => (b.ratio / b.min < a.ratio / a.min ? b : a));
  console.log(`Контраст: ${rows.length} пар в порядке. Ближе всего к границе: ${worst.accent} / ${worst.theme}, ${worst.fg} на ${worst.bg} = ${worst.ratio.toFixed(2)}:1`);
}
