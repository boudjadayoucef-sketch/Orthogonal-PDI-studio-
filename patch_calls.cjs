const fs = require('fs');
let code = fs.readFileSync('src/pdi/isometric/engine/IsometrieModuleV48d.tsx', 'utf8');

// 1. Update segmentEndpoints signature and calls
code = code.replace(/function segmentEndpoints\(segment: IsoSegment, nodes: IsoNode\[\]\) \{/g, 'function segmentEndpoints(segment: IsoSegment, nodes: IsoNode[], segments: IsoSegment[] = []) {');

code = code.replace(/fromPos = portWorldPosition\(fromNode, segment\.fromPortId\);/g, 'fromPos = portWorldPosition(fromNode, segment.fromPortId, nodes, segments);');
code = code.replace(/toPos = portWorldPosition\(toNode, segment\.toPortId\);/g, 'toPos = portWorldPosition(toNode, segment.toPortId, nodes, segments);');

code = code.replace(/segmentEndpoints\(segment, nodes\)/g, 'segmentEndpoints(segment, nodes, segments)');
code = code.replace(/segmentEndpoints\(s, nodes\)/g, 'segmentEndpoints(s, nodes, segments)');
code = code.replace(/segmentEndpoints\(seg, clonedNodes\)/g, 'segmentEndpoints(seg, clonedNodes, clonedSegments)');

// 2. Update other portWorldPosition calls
code = code.replace(/const anchor=project\(portWorldPosition\(node,joint\.portId\)\),center=project\(node\);/g, 'const anchor=project(portWorldPosition(node,joint.portId, nodes, segments)),center=project(node);');

code = code.replace(/const wp = portWorldPosition\(node, port\.id\);/g, 'const wp = portWorldPosition(node, port.id, nodes, segments);');

code = code.replace(/if \(anchor\.kind === "port" && anchor\.portId\) return portWorldPosition\(node, anchor\.portId\);/g, 'if (anchor.kind === "port" && anchor.portId) return portWorldPosition(node, anchor.portId, nodes, segments);');

code = code.replace(/const nativePorts=\(n\.ports\|\|\[\]\)\.map\(port=>\{const w=portWorldPosition\(n,port\.id\),sp=isoProjectV4\(w\.x,w\.y,w\.z,viewport\.zoom,viewport\.panX,viewport\.panY\);return \{\.\.\.port,sx:sp\.x-p\.x,sy:sp\.y-p\.y\};\}\);/g, 'const nativePorts=(n.ports||[]).map(port=>{const w=portWorldPosition(n,port.id,nodes,segments),sp=isoProjectV4(w.x,w.y,w.z,viewport.zoom,viewport.panX,viewport.panY);return {...port,sx:sp.x-p.x,sy:sp.y-p.y};});');

code = code.replace(/const start=portWorldPosition\(fromN,branchDrawing\.fromPortId\);/g, 'const start=portWorldPosition(fromN,branchDrawing.fromPortId,nodes,segments);');

fs.writeFileSync('src/pdi/isometric/engine/IsometrieModuleV48d.tsx', code);
console.log('done');
