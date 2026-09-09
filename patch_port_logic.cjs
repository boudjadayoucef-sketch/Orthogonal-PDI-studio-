const fs = require('fs');
let code = fs.readFileSync('src/pdi/isometric/engine/IsometrieModuleV48d.tsx', 'utf8');

const targetStr = `  const angle=((node.rotation||0)*Math.PI)/180;
  const c=Math.cos(angle),sin=Math.sin(angle);`;

const replacementStr = `  let nodeAngleDeg = node.rotation || 0;
  if (segments && segments.length > 0 && nodes && nodes.length > 0) {
    const connSegs = segments.filter(s => s.fromNodeId === node.id || s.toNodeId === node.id);
    let pAdjA = null;
    let pAdjB = null;
    if (connSegs.length >= 1) {
      const otherId0 = connSegs[0].fromNodeId === node.id ? connSegs[0].toNodeId : connSegs[0].fromNodeId;
      const other0 = nodes.find(item => item.id === otherId0);
      if (other0) pAdjA = other0;
    }
    if (connSegs.length >= 2) {
      const otherId1 = connSegs[1].fromNodeId === node.id ? connSegs[1].toNodeId : connSegs[1].fromNodeId;
      const other1 = nodes.find(item => item.id === otherId1);
      if (other1) pAdjB = other1;
    }

    if (pAdjA && pAdjB) {
      const sIn = connSegs.find(s => s.toNodeId === node.id);
      const sOut = connSegs.find(s => s.fromNodeId === node.id);
      if (sIn && sOut) {
        const nIn = nodes.find(item => item.id === sIn.fromNodeId);
        const nOut = nodes.find(item => item.id === sOut.toNodeId);
        if (nIn && nOut) {
          nodeAngleDeg = Math.atan2(nOut.y - nIn.y, nOut.x - nIn.x) * 180 / Math.PI;
        } else {
          nodeAngleDeg = Math.atan2(pAdjB.y - pAdjA.y, pAdjB.x - pAdjA.x) * 180 / Math.PI;
        }
      } else {
        nodeAngleDeg = Math.atan2(pAdjB.y - pAdjA.y, pAdjB.x - pAdjA.x) * 180 / Math.PI;
      }
    } else if (pAdjA) {
      const s0 = connSegs[0];
      if (s0.toNodeId === node.id) {
        nodeAngleDeg = Math.atan2(node.y - pAdjA.y, node.x - pAdjA.x) * 180 / Math.PI;
      } else {
        nodeAngleDeg = Math.atan2(pAdjA.y - node.y, pAdjA.x - node.x) * 180 / Math.PI;
      }
    }
  }
  const angle=(nodeAngleDeg*Math.PI)/180;
  const c=Math.cos(angle),sin=Math.sin(angle);`;

if(code.indexOf(targetStr) === -1) {
    console.error("target string not found!");
} else {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/pdi/isometric/engine/IsometrieModuleV48d.tsx', code);
    console.log("patched!");
}
