const fs = require('fs');
let code = fs.readFileSync('src/pdi/isometric/engine/IsometrieModuleV48d.tsx', 'utf8');

const regex = /function portWorldPosition\(node: IsoNode, portId\?: string\) \{/;
code = code.replace(regex, 'function portWorldPosition(node: IsoNode, portId?: string, nodes: IsoNode[] = [], segments: IsoSegment[] = []) {');

fs.writeFileSync('src/pdi/isometric/engine/IsometrieModuleV48d.tsx', code);
console.log('done');
