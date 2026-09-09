const fs = require('fs');
const content = fs.readFileSync('src/pdi/isometric/engine/IsometrieModuleV48d.tsx', 'utf8');
const lines = content.split('\n');
let pwpLines = [];
let capture = false;
for (let line of lines) {
  if (line.includes('function portWorldPosition')) capture = true;
  if (capture) pwpLines.push(line);
  if (capture && line === '}') break;
}
console.log(pwpLines.join('\n'));
