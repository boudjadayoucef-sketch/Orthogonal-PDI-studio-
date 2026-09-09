const fs = require('fs');
let code = fs.readFileSync('src/pdi/isometric/engine/IsometrieModuleV48d.tsx', 'utf8');

const newBanner = `      <div className={\`\${leftPanelOpen?"lg:col-span-3":"hidden"} \${workspaceFullscreen ? "h-full min-h-0 overflow-y-auto pr-1" : "space-y-3 lg:sticky lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pr-1"} space-y-3\`}>
        {/* En-tête de la barre latérale gauche */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700/80 p-3 shadow-lg flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-200 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              Panneau d'Inspection
            </h3>
            <button
              type="button"
              onClick={() => setLeftPanelOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
              title="Fermer le panneau gauche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setLibraryRightOpen(prev => !prev)}
            className={\`w-full py-1.5 px-3 rounded-xl border flex items-center justify-between text-[10px] font-bold transition-all shadow-sm \${
              libraryRightOpen
                ? "bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-cyan-950/50"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }\`}
          >
            <span className="flex items-center gap-2">
              <span className="text-sm">📦</span>
              <span>{libraryRightOpen ? "Masquer Biblio CAO" : "Ouvrir Biblio CAO (Droite)"}</span>
            </span>
          </button>
        </div>`;

code = code.replace(
  `      <div className={\`\${leftPanelOpen?"lg:col-span-3":"hidden"} \${workspaceFullscreen ? "h-full min-h-0 overflow-y-auto pr-1" : "space-y-3 lg:sticky lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pr-1"} space-y-3\`}>`,
  newBanner
);

const oldBlock = `        <div className="bg-slate-900 rounded-2xl border border-slate-700/80 p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Bibliothèque & Catalogue
            </h3>
            <span className="text-[9px] text-cyan-300 font-bold bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded">
              Barre droite
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLibraryRightOpen(prev => !prev)}
            className={\`w-full py-2 px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm \${
              libraryRightOpen
                ? "bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-cyan-950/50"
                : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
            }\`}
          >
            <span className="flex items-center gap-2">
              <span className="text-base">📦</span>
              <span>{libraryRightOpen ? "Masquer Bibliothèque" : "Ouvrir Bibliothèque (Droite)"}</span>
            </span>
            <span className="text-[10px] bg-slate-950/80 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
              {FITTING_TYPES.length + 12} items
            </span>
          </button>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => { setLibraryRightOpen(true); setLibraryCategoryTab("vannes"); }}
              className="px-2 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-cyan-400 hover:bg-slate-800 text-left font-semibold truncate"
            >
              🚰 Vannes & Robinets
            </button>
            <button
              type="button"
              onClick={() => { setLibraryRightOpen(true); setLibraryCategoryTab("raccords"); }}
              className="px-2 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-amber-400 hover:bg-slate-800 text-left font-semibold truncate"
            >
              🔄 Coudes & Tés
            </button>
            <button
              type="button"
              onClick={() => { setLibraryRightOpen(true); setLibraryCategoryTab("equipements"); }}
              className="px-2 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-purple-400 hover:bg-slate-800 text-left font-semibold truncate"
            >
              🏭 Équipements 3D
            </button>
            <button
              type="button"
              onClick={() => { setLibraryRightOpen(true); setLibraryCategoryTab("gc"); }}
              className="px-2 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-emerald-400 hover:bg-slate-800 text-left font-semibold truncate"
            >
              🏗️ Génie Civil & SP-58
            </button>
            <button
              type="button"
              onClick={() => { setLibraryRightOpen(true); setLibraryCategoryTab("trouvay"); }}
              className="px-2 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-blue-400 hover:bg-slate-800 text-left font-semibold truncate col-span-2"
            >
              📦 Trouvay & Cauvin (Catalogue ASTM/ASME)
            </button>
          </div>
        </div>`;

code = code.replace(oldBlock, '');

fs.writeFileSync('src/pdi/isometric/engine/IsometrieModuleV48d.tsx', code);
console.log('done');
