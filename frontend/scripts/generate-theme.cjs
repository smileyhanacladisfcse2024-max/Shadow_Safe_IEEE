const fs = require('fs');
const path = require('path');

const htmlAPath = path.resolve('design/stitch_shadowsafe_journey_safety_platform/live_journey_monitor_risk_radar/code.html');
const htmlBPath = path.resolve('design/stitch_shadowsafe_journey_safety_platform/sos_emergency_help_guardian_circle/code.html');

const htmlA = fs.readFileSync(htmlAPath, 'utf8');
const htmlB = fs.readFileSync(htmlBPath, 'utf8');

function extractConfig(html) {
  const match = html.match(/tailwind\.config\s*=\s*(\{[\s\S]*?\})\s*(?:;|<\/script>)/);
  return eval('(' + match[1] + ')');
}

const configA = extractConfig(htmlA).theme.extend;
const configB = extractConfig(htmlB).theme.extend;

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const num = parseInt(hex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255].join(' ');
}

const allColors = Array.from(new Set([...Object.keys(configA.colors), ...Object.keys(configB.colors)])).sort();

const sharedColors = {};
const colorsA = {};
const colorsB = {};

for (const c of allColors) {
  const valA = configA.colors[c];
  const valB = configB.colors[c];
  if (valA === valB) {
    sharedColors[c] = hexToRgb(valA);
  } else {
    colorsA[c] = hexToRgb(valA);
    colorsB[c] = hexToRgb(valB);
  }
}

let css = `/* Shared Design Tokens across all themes */
:root {
`;
for (const [k, v] of Object.entries(sharedColors)) {
  css += `  --c-${k}: ${v};\n`;
}
css += `
  /* Common Spacing & Radii defaults */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --gutter: 1rem;
  --gutter-sm: 0.75rem;
  --margin: 1rem;
  --radius-full: 9999px;
}

/* Theme A (Journey, Factors, Reroute, Privacy) */
[data-theme="A"] {
`;
for (const [k, v] of Object.entries(colorsA)) {
  css += `  --c-${k}: ${v};\n`;
}
css += `
  /* Border Radius */
  --radius-default: 0.25rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;

  /* Spacing */
  --space-md: 0.75rem;
  --space-lg: 1rem;
  --space-xl: 1.5rem;
  --space-2xl: 2rem;
  --margin-lg: 1.5rem;
  --margin-tablet: 2rem;

  /* Typography */
  --font-headline: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-label: 'JetBrains Mono', monospace;
}

/* Theme B (Guardians, Havens) */
[data-theme="B"] {
`;
for (const [k, v] of Object.entries(colorsB)) {
  css += `  --c-${k}: ${v};\n`;
}
css += `
  /* Border Radius */
  --radius-default: 1rem;
  --radius-lg: 2rem;
  --radius-xl: 3rem;

  /* Spacing */
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2.5rem;
  --space-2xl: 2rem;
  --margin-lg: 1.5rem;
  --margin-tablet: 2rem;

  /* Typography */
  --font-headline: 'Space Grotesk', sans-serif;
  --font-body: 'Manrope', sans-serif;
  --font-label: 'JetBrains Mono', monospace;
}
`;

const stylesDir = path.resolve('frontend/src/styles');
if (!fs.existsSync(stylesDir)) {
  fs.mkdirSync(stylesDir, { recursive: true });
}
fs.writeFileSync(path.join(stylesDir, 'theme.css'), css);
console.log('theme.css generated successfully at ' + path.join(stylesDir, 'theme.css'));
