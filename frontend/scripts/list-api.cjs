const fs = require('fs');
const schema = fs.readFileSync('frontend/src/api/schema.d.ts', 'utf8');
const paths = [...new Set([...schema.matchAll(/"(\/api\/[^"]+)":/g)].map(m => m[1]))];
console.log('Endpoints (' + paths.length + '):', paths);

const componentsMatch = schema.match(/export interface components \{[\s\S]*?schemas: \{([\s\S]*?)\n    \};/);
if (componentsMatch) {
  const schemas = [...componentsMatch[1].matchAll(/(\w+): \{/g)].map(m => m[1]);
  console.log('Schemas (' + schemas.length + '):', schemas);
}
