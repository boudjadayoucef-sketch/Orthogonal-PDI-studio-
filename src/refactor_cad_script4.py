import sys

with open('src/components/Calculators.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

pos1 = code.find('{/* SVG Blueprint Canvas */}')
pos2 = code.find('{/* Quantitatif Estimatif Section Summary */}', pos1)

if pos1 == -1 or pos2 == -1:
    print("ERROR: Anchors not found! pos1:", pos1, "pos2:", pos2)
    sys.exit(1)

svg_replacement = """{/* SVG Blueprint Canvas */}
                    <div className="flex flex-col gap-3">
                      {/* Top Bar Controls for Canvas */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 text-white p-3 rounded-t-xl border-b border-slate-700 shadow-md">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            Format A3 (1189 x 841 mm)
                          </span>
                          <span className="text-sm font-semibold text-slate-200">
                            Croquis Multi-Ouvrages & Blocs ({ouvrages.length})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCroquisZoom(prev => Math.min(prev + 0.15, 2.5))}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition text-xs font-medium flex items-center gap-1"
                            title="Zoom avant"
                          >
                            <ZoomIn className="w-4 h-4 text-amber-400" />
                            <span>Zoom +</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCroquisZoom(prev => Math.max(prev - 0.15, 0.4))}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition text-xs font-medium flex items-center gap-1"
                            title="Zoom arrière"
                          >
                            <ZoomOut className="w-4 h-4 text-amber-400" />
                            <span>Zoom -</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCroquisZoom(1.0)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition text-xs font-medium flex items-center gap-1"
                            title="Réinitialiser Zoom"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                            <span>100%</span>
                          </button>
                          <div className="h-4 w-px bg-slate-700 my-auto"></div>
                          <button
                            type="button"
                            onClick={() => setActiveCadModal("ouvrages")}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-xs shadow transition flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Ajouter / Gérer Ouvrages</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs shadow transition flex items-center gap-1.5"
                          >
                            <Printer className="w-4 h-4" />
                            <span>Imprimer A3</span>
                          </button>
                        </div>
                      </div>

                      {/* Interactive SVG Canvas Container */}
                      <div 
                        className="relative w-full overflow-hidden bg-slate-950 rounded-b-xl border border-slate-800 shadow-2xl min-h-[580px] flex items-center justify-center p-2 select-none"
                        onMouseMove={(e) => {
                          if (!draggingOuvrageId && !draggingSlabId && !draggingAbriId && !draggingMassifId) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const mouseX = e.clientX - rect.left;
                          const mouseY = e.clientY - rect.top;
                          
                          // Canvas reference center scale
                          const scale = 12 * croquisZoom;

                          if (draggingOuvrageId) {
                            const deltaX = (mouseX - dragStartPos.pointerX) / scale;
                            const deltaY = (mouseY - dragStartPos.pointerY) / scale;
                            setOuvrages(prev => prev.map(ov => ov.id === draggingOuvrageId ? {
                              ...ov,
                              xOffset: Math.round((ov.xOffset + deltaX) * 10) / 10,
                              yOffset: Math.round((ov.yOffset + deltaY) * 10) / 10
                            } : ov));
                            setDragStartPos({ pointerX: mouseX, pointerY: mouseY, initX: 0, initY: 0 });
                          } else if (draggingSlabId) {
                            const deltaX = (mouseX - dragStartPos.pointerX) / scale;
                            const deltaY = (mouseY - dragStartPos.pointerY) / scale;
                            setSlabs(prev => prev.map(s => s.id === draggingSlabId ? {
                              ...s,
                              xOffset: Math.round((s.xOffset + deltaX) * 10) / 10,
                              yOffset: Math.round((s.yOffset + deltaY) * 10) / 10
                            } : s));
                            setDragStartPos({ pointerX: mouseX, pointerY: mouseY, initX: 0, initY: 0 });
                          }
                        }}
                        onMouseUp={() => {
                          setDraggingOuvrageId(null);
                          setDraggingSlabId(null);
                          setDraggingAbriId(null);
                          setDraggingMassifId(null);
                        }}
                      >
                        {(() => {
                          // Standard A3 Blueprint dimensions (1189 x 841 ratio)
                          const svgW = 1189;
                          const svgH = 841;
                          const cX = svgW / 2;
                          const cY = svgH / 2;

                          // Compute bounding box of all ouvrages for auto-scaling
                          const maxDim = Math.max(
                            ...ouvrages.map(o => Math.max(o.length, o.width, Math.abs(o.xOffset) + o.length, Math.abs(o.yOffset) + o.width)),
                            40
                          );
                          const scale = Math.min(18, Math.max(6, 600 / maxDim)) * croquisZoom;

                          // Style helper for Slab Type & Status
                          const getSlabStyle = (type: SlabType, status?: "nouveau" | "ancien") => {
                            const isNew = status === "nouveau";
                            const strokeDash = isNew ? "5 3" : "none";
                            switch (type) {
                              case "poste_detente":
                                return { fill: isNew ? "#0284c7" : "#1e3a8a", fillOpacity: 0.55, stroke: isNew ? "#38bdf8" : "#60a5fa", strokeWidth: 2, dash: strokeDash };
                              case "rechaffeur":
                                return { fill: isNew ? "#d97706" : "#854d0e", fillOpacity: 0.55, stroke: isNew ? "#fbbf24" : "#f59e0b", strokeWidth: 2, dash: strokeDash };
                              case "gare_racleur_arrivee":
                              case "gare_racleur_depart":
                                return { fill: isNew ? "#9333ea" : "#581c87", fillOpacity: 0.55, stroke: isNew ? "#c084fc" : "#a855f7", strokeWidth: 2, dash: strokeDash };
                              case "epandage_assiette":
                                return { fill: isNew ? "#059669" : "#064e3b", fillOpacity: 0.55, stroke: isNew ? "#34d399" : "#10b981", strokeWidth: 2, dash: strokeDash };
                              case "abri_tele":
                                return { fill: isNew ? "#475569" : "#1e293b", fillOpacity: 0.65, stroke: isNew ? "#94a3b8" : "#64748b", strokeWidth: 2, dash: strokeDash };
                              default:
                                return { fill: isNew ? "#2563eb" : "#1e293b", fillOpacity: 0.55, stroke: isNew ? "#60a5fa" : "#3b82f6", strokeWidth: 2, dash: strokeDash };
                            }
                          };

                          return (
                            <svg
                              viewBox={`0 0 ${svgW} ${svgH}`}
                              className="w-full h-auto max-h-[750px] object-contain drop-shadow-xl"
                              style={{ background: "#090d16" }}
                            >
                              <defs>
                                {/* Grid Blueprint Pattern */}
                                <pattern id="blueprintGrid" width={10 * croquisZoom} height={10 * croquisZoom} patternUnits="userSpaceOnUse">
                                  <path d={`M ${10 * croquisZoom} 0 L 0 0 0 ${10 * croquisZoom}`} fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
                                </pattern>
                                <pattern id="blueprintGridMajor" width={50 * croquisZoom} height={50 * croquisZoom} patternUnits="userSpaceOnUse">
                                  <rect width={50 * croquisZoom} height={50 * croquisZoom} fill="url(#blueprintGrid)" />
                                  <path d={`M ${50 * croquisZoom} 0 L 0 0 0 ${50 * croquisZoom}`} fill="none" stroke="#334155" strokeWidth="1" strokeOpacity="0.6" />
                                </pattern>

                                {/* Patterns for Voile & Gabion Hatching */}
                                <pattern id="hatchGabion" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                                  <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" strokeWidth="1.5" />
                                </pattern>
                                <pattern id="hatchVoile" width="6" height="6" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                                  <line x1="0" y1="0" x2="0" y2="6" stroke="#0ea5e9" strokeWidth="1.2" />
                                </pattern>
                              </defs>

                              {/* Canvas Background Grid */}
                              <rect width={svgW} height={svgH} fill="#090d16" />
                              <rect width={svgW} height={svgH} fill="url(#blueprintGridMajor)" />

                              {/* Outer A3 Paper Border Accent */}
                              <rect x="12" y="12" width={svgW - 24} height={svgH - 24} fill="none" stroke="#334155" strokeWidth="1.5" rx="4" />
                              <rect x="18" y="18" width={svgW - 36} height={svgH - 36} fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />

                              {/* Center axes */}
                              <line x1={cX} y1="20" x2={cX} y2={svgH - 20} stroke="#1e293b" strokeWidth="1" strokeDasharray="2 4" />
                              <line x1="20" y1={cY} x2={svgW - 20} y2={cY} stroke="#1e293b" strokeWidth="1" strokeDasharray="2 4" />

                              {/* North Compass Rose */}
                              <g transform={`translate(${svgW - 80}, 65)`}>
                                <circle cx="0" cy="0" r="22" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                                <polygon points="0,-18 5,0 0,-4 -5,0" fill="#f59e0b" />
                                <polygon points="0,18 5,0 0,4 -5,0" fill="#475569" />
                                <text x="0" y="-24" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">N</text>
                                <text x="26" y="4" fill="#94a3b8" fontSize="9" textAnchor="start">E</text>
                                <text x="-26" y="4" fill="#94a3b8" fontSize="9" textAnchor="end">O</text>
                                <text x="0" y="32" fill="#64748b" fontSize="9" textAnchor="middle">S</text>
                              </g>

                              {/* Scale Indicator Bar */}
                              <g transform="translate(35, 45)">
                                <rect x="0" y="0" width="120" height="20" fill="#0f172a" stroke="#334155" strokeWidth="1" rx="3" />
                                <line x1="10" y1="12" x2="110" y2="12" stroke="#38bdf8" strokeWidth="2" />
                                <line x1="10" y1="8" x2="10" y2="16" stroke="#38bdf8" strokeWidth="2" />
                                <line x1="60" y1="9" x2="60" y2="15" stroke="#38bdf8" strokeWidth="1.5" />
                                <line x1="110" y1="8" x2="110" y2="16" stroke="#38bdf8" strokeWidth="2" />
                                <text x="10" y="-4" fill="#94a3b8" fontSize="9" fontWeight="bold">0m</text>
                                <text x="60" y="-4" fill="#94a3b8" fontSize="9" fontWeight="bold">5m</text>
                                <text x="110" y="-4" fill="#94a3b8" fontSize="9" fontWeight="bold">10m</text>
                              </g>

                              {/* ==================== RENDERING ALL OUVRAGES / BLOCS ==================== */}
                              {ouvrages.map((ov, idx) => {
                                const isSelected = selectedOuvrageId === ov.id;
                                const isNew = ov.status === "nouveau";

                                // Screen position calculation based on offset
                                const fW = ov.length * scale;
                                const fH = ov.width * scale;
                                const fX = cX + (ov.xOffset * scale) - (fW / 2);
                                const fY = cY + (ov.yOffset * scale) - (fH / 2);

                                // Main color palette
                                const strokeColor = isNew ? "#f59e0b" : "#3b82f6";
                                const badgeBg = isNew ? "#78350f" : "#1e3a8a";
                                const badgeText = isNew ? "#fef3c7" : "#dbeafe";
                                const badgeLabel = isNew ? "Nouveau (Extension)" : "Ancien (Existant)";

                                return (
                                  <g 
                                    key={ov.id} 
                                    className="cursor-move transition-all"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedOuvrageId(ov.id);
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      setSelectedOuvrageId(ov.id);
                                      setDraggingOuvrageId(ov.id);
                                      const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                                      if (rect) {
                                        setDragStartPos({
                                          pointerX: e.clientX - rect.left,
                                          pointerY: e.clientY - rect.top,
                                          initX: 0,
                                          initY: 0
                                        });
                                      }
                                    }}
                                  >
                                    {/* Ouvrage Perimeter Area Fill */}
                                    <rect
                                      x={fX}
                                      y={fY}
                                      width={fW}
                                      height={fH}
                                      fill={isNew ? "#312e81" : "#0f172a"}
                                      fillOpacity={isNew ? "0.25" : "0.4"}
                                      stroke={strokeColor}
                                      strokeWidth={isSelected ? 3 : 2}
                                      strokeDasharray={isNew ? "6 3" : "none"}
                                      rx="2"
                                    />

                                    {/* Selected highlight glow */}
                                    {isSelected && (
                                      <rect
                                        x={fX - 4}
                                        y={fY - 4}
                                        width={fW + 8}
                                        height={fH + 8}
                                        fill="none"
                                        stroke="#38bdf8"
                                        strokeWidth="1.5"
                                        strokeDasharray="4 2"
                                        rx="4"
                                      />
                                    )}

                                    {/* Gabions Protection Walls around Ouvrage */}
                                    {ov.hasGabions && ov.gabionSides && (
                                      <g>
                                        {(Object.keys(ov.gabionSides) as Array<"nord" | "sud" | "est" | "ouest">).map((side) => {
                                          const gConf = ov.gabionSides?.[side];
                                          if (!gConf || !gConf.enabled) return null;
                                          const gDepth = (gConf.width || 1) * scale;
                                          let gx = fX, gy = fY, gw = fW, gh = fH;
                                          if (side === "nord") { gy = fY - gDepth - 4; gh = gDepth; }
                                          else if (side === "sud") { gy = fY + fH + 4; gh = gDepth; }
                                          else if (side === "ouest") { gx = fX - gDepth - 4; gw = gDepth; }
                                          else if (side === "est") { gx = fX + fW + 4; gw = gDepth; }

                                          return (
                                            <g key={`gabion-${ov.id}-${side}`}>
                                              <rect
                                                x={gx}
                                                y={gy}
                                                width={gw}
                                                height={gh}
                                                fill="url(#hatchGabion)"
                                                stroke="#f59e0b"
                                                strokeWidth="1.2"
                                                rx="1"
                                              />
                                              <text
                                                x={gx + gw / 2}
                                                y={gy + gh / 2 + 3}
                                                fill="#fbbf24"
                                                fontSize="8"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                              >
                                                Gabion ({gConf.etages} ET)
                                              </text>
                                            </g>
                                          );
                                        })}
                                      </g>
                                    )}

                                    {/* Voile Béton Armé Périmétrique */}
                                    {ov.hasVoile && (
                                      <rect
                                        x={fX - 3}
                                        y={fY - 3}
                                        width={fW + 6}
                                        height={fH + 6}
                                        fill="none"
                                        stroke="#0ea5e9"
                                        strokeWidth="2.5"
                                        strokeDasharray="2 2"
                                      />
                                    )}

                                    {/* Clôture Périmétrique Fence Mesh */}
                                    {ov.hasFence && (
                                      <rect
                                        x={fX + 2}
                                        y={fY + 2}
                                        width={Math.max(1, fW - 4)}
                                        height={Math.max(1, fH - 4)}
                                        fill="none"
                                        stroke={isNew ? "#fbbf24" : "#64748b"}
                                        strokeWidth="1"
                                        strokeDasharray="3 3"
                                      />
                                    )}

                                    {/* Block Label & Badge Header */}
                                    <g transform={`translate(${fX + 8}, ${fY + 16})`}>
                                      <rect
                                        x="0"
                                        y="-12"
                                        width={Math.min(220, fW - 16)}
                                        height="22"
                                        fill={badgeBg}
                                        stroke={strokeColor}
                                        strokeWidth="1"
                                        rx="4"
                                      />
                                      <text x="8" y="2" fill={badgeText} fontSize="10" fontWeight="bold">
                                        {ov.name || `Bloc ${idx + 1}`} • {ov.length}m x {ov.width}m
                                      </text>
                                    </g>

                                    {/* Status Badge Tag */}
                                    <g transform={`translate(${fX + fW - 110}, ${fY + 16})`}>
                                      <rect
                                        x="0"
                                        y="-12"
                                        width="102"
                                        height="18"
                                        fill={isNew ? "#15803d" : "#1e293b"}
                                        stroke={isNew ? "#4ade80" : "#64748b"}
                                        strokeWidth="1"
                                        rx="9"
                                      />
                                      <circle cx="10" cy="-3" r="3" fill={isNew ? "#22c55e" : "#3b82f6"} />
                                      <text x="18" y="1" fill="#ffffff" fontSize="8.5" fontWeight="bold">
                                        {badgeLabel}
                                      </text>
                                    </g>

                                    {/* Dimension Cotes (A & B) */}
                                    <text x={fX + fW / 2} y={fY - 6} fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">
                                      A = {ov.length} m
                                    </text>
                                    <text x={fX - 8} y={fY + fH / 2} fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="end" transform={`rotate(-90 ${fX - 8} ${fY + fH / 2})`}>
                                      B = {ov.width} m
                                    </text>
                                  </g>
                                );
                              })}

                              {/* ==================== RENDERING PARAMETRIC SLABS ==================== */}
                              {slabs.map((slab) => {
                                const st = getSlabStyle(slab.type, slab.status);
                                const isSelected = selectedSlabId === slab.id;
                                const isNew = slab.status === "nouveau" || slab.isExtension;

                                // Position relative to primary canvas or coordinates
                                const sW = slab.length * scale;
                                const sH = slab.width * scale;
                                const sX = cX + (slab.xOffset * scale) - (sW / 2);
                                const sY = cY + (slab.yOffset * scale) - (sH / 2);

                                return (
                                  <g
                                    key={slab.id}
                                    className="cursor-grab active:cursor-grabbing hover:opacity-95"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSlabId(slab.id);
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      setSelectedSlabId(slab.id);
                                      setDraggingSlabId(slab.id);
                                      const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                                      if (rect) {
                                        setDragStartPos({
                                          pointerX: e.clientX - rect.left,
                                          pointerY: e.clientY - rect.top,
                                          initX: 0,
                                          initY: 0
                                        });
                                      }
                                    }}
                                  >
                                    {/* Slab Geometry Body */}
                                    <rect
                                      x={sX}
                                      y={sY}
                                      width={sW}
                                      height={sH}
                                      fill={st.fill}
                                      fillOpacity={st.fillOpacity}
                                      stroke={isSelected ? "#38bdf8" : st.stroke}
                                      strokeWidth={isSelected ? 2.5 : st.strokeWidth}
                                      strokeDasharray={st.dash}
                                      rx="2"
                                    />

                                    {/* Diagonal cross for structural slab identification */}
                                    <line x1={sX} y1={sY} x2={sX + sW} y2={sY + sH} stroke={st.stroke} strokeWidth="0.5" strokeOpacity="0.4" />
                                    <line x1={sX + sW} y1={sY} x2={sX} y2={sY + sH} stroke={st.stroke} strokeWidth="0.5" strokeOpacity="0.4" />

                                    {/* Slab Title & Dimensions */}
                                    <text x={sX + sW / 2} y={sY + sH / 2 - 2} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                                      {slab.name}
                                    </text>
                                    <text x={sX + sW / 2} y={sY + sH / 2 + 10} fill="#cbd5e1" fontSize="8" textAnchor="middle">
                                      {slab.length}x{slab.width}m (e={slab.thickness}m)
                                    </text>

                                    {/* Status Badge */}
                                    <rect
                                      x={sX + 2}
                                      y={sY + 2}
                                      width="38"
                                      height="12"
                                      fill={isNew ? "#15803d" : "#334155"}
                                      rx="2"
                                    />
                                    <text x={sX + 21} y={sY + 10} fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                                      {isNew ? "NOUVEAU" : "ANCIEN"}
                                    </text>
                                  </g>
                                );
                              })}

                              {/* ==================== RENDERING PARAMETRIC ABRIS & MASSIFS ==================== */}
                              {abris.map((abri) => {
                                const aW = abri.length * scale;
                                const aH = abri.width * scale;
                                const aX = cX + (abri.xOffset * scale) - (aW / 2);
                                const aY = cY + (abri.yOffset * scale) - (aH / 2);
                                const isNew = abri.status === "nouveau";

                                return (
                                  <g key={abri.id} className="cursor-pointer">
                                    <rect
                                      x={aX}
                                      y={aY}
                                      width={aW}
                                      height={aH}
                                      fill="#1e293b"
                                      stroke={isNew ? "#f59e0b" : "#94a3b8"}
                                      strokeWidth="2"
                                      rx="2"
                                    />
                                    <text x={aX + aW / 2} y={aY + aH / 2 + 3} fill="#f8fafc" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                                      {abri.name} ({abri.type === "01_porte" ? "1P" : "2P"})
                                    </text>
                                  </g>
                                );
                              })}

                              {massifs.map((m) => {
                                const mW = m.length * scale;
                                const mH = m.width * scale;
                                const mX = cX + (m.xOffset * scale) - (mW / 2);
                                const mY = cY + (m.yOffset * scale) - (mH / 2);

                                return (
                                  <g key={m.id}>
                                    <rect
                                      x={mX}
                                      y={mY}
                                      width={mW}
                                      height={mH}
                                      fill="#451a03"
                                      stroke="#d97706"
                                      strokeWidth="1.5"
                                      rx="1"
                                    />
                                    <text x={mX + mW / 2} y={mY + mH / 2 + 3} fill="#fef3c7" fontSize="8" fontWeight="bold" textAnchor="middle">
                                      {m.name}
                                    </text>
                                  </g>
                                );
                              })}

                              {/* ==================== A3 FORMAT TITLE BLOCK / CARTOUCHE ==================== */}
                              <g transform={`translate(${svgW - 460}, ${svgH - 220})`}>
                                {/* Outer Cartouche Frame */}
                                <rect x="0" y="0" width="435" height="195" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" rx="4" />

                                {/* Header Strip */}
                                <rect x="0" y="0" width="435" height="32" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                                <text x="12" y="20" fill="#38bdf8" fontSize="12" fontWeight="bold" letterSpacing="0.5">
                                  PD&I • GAZ TRANSPORT & DISTRIBUTION
                                </text>
                                <text x="420" y="20" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="end">
                                  FORMAT A3
                                </text>

                                {/* Project Name & Location */}
                                <line x1="0" y1="32" x2="435" y2="32" stroke="#334155" strokeWidth="1" />
                                <text x="12" y="48" fill="#94a3b8" fontSize="8" fontWeight="bold" className="uppercase">
                                  PROJET / OUVRAGE:
                                </text>
                                <text x="12" y="62" fill="#ffffff" fontSize="11" fontWeight="bold">
                                  {cartoucheInfo.postName || "POSTE DE DÉTENTE & COMPTAGE GAZ"}
                                </text>

                                <text x="240" y="48" fill="#94a3b8" fontSize="8" fontWeight="bold" className="uppercase">
                                  LOCALISATION:
                                </text>
                                <text x="240" y="62" fill="#e2e8f0" fontSize="10" fontWeight="semibold">
                                  GROUPE PD&I / DZA
                                </text>

                                <line x1="0" y1="72" x2="435" y2="72" stroke="#334155" strokeWidth="1" />

                                {/* Interactive Legend Section (Légende Nouveau vs Ancien) */}
                                <text x="12" y="86" fill="#f59e0b" fontSize="9" fontWeight="bold">
                                  LÉGENDE DES ÉLÉMENTS DU CROQUIS:
                                </text>

                                <g transform="translate(12, 94)">
                                  {/* Item 1: Nouveau */}
                                  <rect x="0" y="0" width="12" height="10" fill="#15803d" stroke="#4ade80" strokeWidth="1" rx="1" />
                                  <text x="16" y="8" fill="#e2e8f0" fontSize="8.5">Extension / Nouveau (Projet)</text>

                                  {/* Item 2: Ancien */}
                                  <rect x="145" y="0" width="12" height="10" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" rx="1" />
                                  <text x="161" y="8" fill="#e2e8f0" fontSize="8.5">Ouvrage Ancien / Existant</text>

                                  {/* Item 3: Dalle */}
                                  <rect x="0" y="16" width="12" height="10" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" rx="1" />
                                  <text x="16" y="24" fill="#e2e8f0" fontSize="8.5">Dalles Béton Armé</text>

                                  {/* Item 4: Gabion / Voile */}
                                  <rect x="145" y="16" width="12" height="10" fill="#d97706" stroke="#fbbf24" strokeWidth="1" rx="1" />
                                  <text x="161" y="24" fill="#e2e8f0" fontSize="8.5">Gabions & Voiles Béton</text>
                                </g>

                                <line x1="0" y1="130" x2="435" y2="130" stroke="#334155" strokeWidth="1" />

                                {/* Bottom Metadata Grid */}
                                <g transform="translate(12, 144)">
                                  <text x="0" y="0" fill="#64748b" fontSize="8">ÉCHELLE:</text>
                                  <text x="0" y="11" fill="#38bdf8" fontSize="9" fontWeight="bold">{cartoucheInfo.scale || "1 / 100"}</text>

                                  <text x="80" y="0" fill="#64748b" fontSize="8">BLOCS/OUVRAGES:</text>
                                  <text x="80" y="11" fill="#ffffff" fontSize="9" fontWeight="bold">{ouvrages.length} Blocs</text>

                                  <text x="180" y="0" fill="#64748b" fontSize="8">DATE & ÉDITION:</text>
                                  <text x="180" y="11" fill="#ffffff" fontSize="9" fontWeight="bold">{cartoucheInfo.date || "2026"}</text>

                                  <text x="290" y="0" fill="#64748b" fontSize="8">ENTREPRISE / DESSIN:</text>
                                  <text x="290" y="11" fill="#f59e0b" fontSize="9" fontWeight="bold">{cartoucheInfo.editorName || "PD&I"}</text>
                                </g>

                                <rect x="0" y="168" width="435" height="27" fill="#0284c7" fillOpacity="0.2" rx="2" />
                                <text x="217" y="185" fill="#38bdf8" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                                  CROQUIS DE MÉTRAGE TECHNIQUE & IMPLANTATION CAD
                                </text>
                              </g>
                            </svg>
                          );
                        })()}
                      </div>
                    </div>
"""

new_code = code[:pos1] + svg_replacement + code[pos2:]

with open('src/components/Calculators.tsx', 'w', encoding='utf-8') as f:
    f.write(new_code)

print("SUCCESSFULLY REPLACED SVG BLUEPRINT CANVAS BLOCK WITH CORRECTED VARIABLES!")
