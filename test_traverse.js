const fs = require('fs');
const content = fs.readFileSync('src/pdi/viewer3d/pdi3dSceneManager.ts', 'utf8');
console.log(content.includes('this.modelRoot.traverse'));
