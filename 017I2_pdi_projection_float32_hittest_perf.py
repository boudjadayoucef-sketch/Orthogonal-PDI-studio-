# -*- coding: utf-8 -*-
# PATCH 017I2 - PD&I : performance de la projection isometrique
# 1. Constantes trigonometriques hissees au module (plus de Math.cos/Math.sin
#    recalcules a chaque appel de isoProjectV4 / isoUnprojectV4).
# 2. Cache de projection en tableau type Float32Array, memoise sur
#    [nodes, viewport], avec index id -> position.
# 3. Selection par fenetre : lecture du cache + Map d index des noeuds
#    (fin du nodes.find() imbrique, O(n*m) -> O(n+m)).
# 4. Commande PERF : declaree ET dispatchee (R8), mesure reelle du cache.
# S applique APRES 017I. Idempotent (R1). Sauvegardes .before017I2. Rapport.
import io, os, sys, shutil

ROOT = os.getcwd()
ENG = os.path.join(ROOT, "src/pdi/isometric/engine/IsometrieModuleV48d.tsx")
REG = os.path.join(ROOT, "src/pdi/isometric/engine/CadAutocadEngine.ts")
REPORT = os.path.join(ROOT, "017I2_projection_float32_hittest_perf_REPORT.md")

for p in (ENG, REG):
    if not os.path.exists(p):
        print("ECHEC : fichier absent " + p)
        sys.exit(1)

log = []
checks = []


def backup(path):
    b = path + ".before017I2"
    if not os.path.exists(b):
        shutil.copy2(path, b)
        log.append("BACKUP : " + os.path.basename(b))
    else:
        log.append("DEJA : backup " + os.path.basename(b))


def read(p):
    return io.open(p, "r", encoding="utf-8").read()


def write(p, s):
    io.open(p, "w", encoding="utf-8").write(s)


backup(ENG)
backup(REG)
eng = read(ENG)
reg = read(REG)

if "017I" not in eng or "pdi-save-badge-017i" not in eng:
    print("ECHEC : le patch 017I doit etre applique avant 017I2")
    sys.exit(1)

# =======================================================================
# 1. Constantes trigonometriques hissees au module
# =======================================================================
OLD_PROJ = "\n".join([
    "const isoProjectV4 = (x:number,y:number,z:number,zoom:number,panX:number,panY:number) => {",
    "  const scale=28*zoom, a=Math.PI/6;",
    "  return {",
    "    x:310+panX+(x-y)*Math.cos(a)*scale,",
    "    y:210+panY+(x+y)*Math.sin(a)*scale-z*scale",
    "  };",
    "};",
])

NEW_PROJ = "\n".join([
    "// PATCH 017I2 : l angle isometrique est constant (30 degres). Le calculer a",
    "// chaque projection coutait deux appels trigonometriques par point et par",
    "// rendu. Il est desormais evalue une seule fois au chargement du module.",
    "const PDI_ISO_ANGLE_017I2 = Math.PI / 6;",
    "const PDI_ISO_COS_017I2 = Math.cos(PDI_ISO_ANGLE_017I2);",
    "const PDI_ISO_SIN_017I2 = Math.sin(PDI_ISO_ANGLE_017I2);",
    "",
    "const isoProjectV4 = (x:number,y:number,z:number,zoom:number,panX:number,panY:number) => {",
    "  const scale=28*zoom;",
    "  return {",
    "    x:310+panX+(x-y)*PDI_ISO_COS_017I2*scale,",
    "    y:210+panY+(x+y)*PDI_ISO_SIN_017I2*scale-z*scale",
    "  };",
    "};",
])

if "PDI_ISO_COS_017I2" in eng:
    log.append("DEJA : constantes trigonometriques hissees")
elif OLD_PROJ in eng:
    eng = eng.replace(OLD_PROJ, NEW_PROJ, 1)
    log.append("APPLIQUE : constantes trigonometriques hissees (isoProjectV4)")
else:
    print("ECHEC : ancre isoProjectV4 introuvable")
    sys.exit(1)

OLD_UNPROJ = "\n".join([
    "  const scale=Math.max(1,28*zoom), a=Math.PI/6;",
    "  const u=(sx-310-panX)/(Math.cos(a)*scale);",
    "  const v=(sy+targetZ*scale-210-panY)/(Math.sin(a)*scale);",
])
NEW_UNPROJ = "\n".join([
    "  const scale=Math.max(1,28*zoom);",
    "  const u=(sx-310-panX)/(PDI_ISO_COS_017I2*scale);",
    "  const v=(sy+targetZ*scale-210-panY)/(PDI_ISO_SIN_017I2*scale);",
])
if OLD_UNPROJ in eng:
    eng = eng.replace(OLD_UNPROJ, NEW_UNPROJ, 1)
    log.append("APPLIQUE : constantes reutilisees (isoUnprojectV4)")
else:
    log.append("DEJA : isoUnprojectV4 optimisee")
checks.append(("constantes trigonometriques au module", "PDI_ISO_COS_017I2" in eng))
checks.append(("isoUnprojectV4 sans trigonometrie", "const scale=Math.max(1,28*zoom);" in eng))

# =======================================================================
# 2. Cache de projection Float32Array + index des noeuds
# =======================================================================
ANCHOR_MEMO = "  const projectJoints=useMemo(()=>deriveProjectJoints(nodes,segments),[nodes,segments]);"

CACHE = "\n".join([
    ANCHOR_MEMO,
    "  // PATCH 017I2 : projection des noeuds stockee dans un Float32Array.",
    "  // Un objet {x,y} par noeud et par rendu saturait le ramasse-miettes ;",
    "  // ici deux flottants contigus par noeud, recalcules seulement quand les",
    "  // noeuds ou le viewport changent.",
    "  const projCacheStats017I2 = useRef({ count: 0, bytes: 0, ms: 0, builds: 0 });",
    "  const nodeById017I2 = useMemo(() => {",
    "    const m = new Map<string, IsoNode>();",
    "    for (let i = 0; i < nodes.length; i += 1) m.set(nodes[i].id, nodes[i]);",
    "    return m;",
    "  }, [nodes]);",
    "  const nodeProjection017I2 = useMemo(() => {",
    '    const t0 = typeof performance !== "undefined" ? performance.now() : 0;',
    "    const buffer = new Float32Array(nodes.length * 2);",
    "    const index = new Map<string, number>();",
    "    for (let i = 0; i < nodes.length; i += 1) {",
    "      const n = nodes[i];",
    "      const p = isoProjectV4(n.x, n.y, n.z || 0, viewport.zoom, viewport.panX, viewport.panY);",
    "      buffer[i * 2] = p.x;",
    "      buffer[i * 2 + 1] = p.y;",
    "      index.set(n.id, i);",
    "    }",
    '    const t1 = typeof performance !== "undefined" ? performance.now() : 0;',
    "    projCacheStats017I2.current = {",
    "      count: nodes.length,",
    "      bytes: buffer.byteLength,",
    "      ms: Number((t1 - t0).toFixed(3)),",
    "      builds: projCacheStats017I2.current.builds + 1,",
    "    };",
    "    return { buffer, index };",
    "  }, [nodes, viewport]);",
    "  const projectNodeCached017I2 = (node: IsoNode) => {",
    "    const i = nodeProjection017I2.index.get(node.id);",
    "    if (i === undefined) return isoProjectV4(node.x, node.y, node.z || 0, viewport.zoom, viewport.panX, viewport.panY);",
    "    return { x: nodeProjection017I2.buffer[i * 2], y: nodeProjection017I2.buffer[i * 2 + 1] };",
    "  };",
])

if "nodeProjection017I2" in eng:
    log.append("DEJA : cache Float32Array")
elif ANCHOR_MEMO in eng:
    eng = eng.replace(ANCHOR_MEMO, CACHE, 1)
    log.append("APPLIQUE : cache de projection Float32Array + index des noeuds")
else:
    print("ECHEC : ancre projectJoints introuvable")
    sys.exit(1)
checks.append(("cache Float32Array", "new Float32Array(nodes.length * 2)" in eng))
checks.append(("index nodeById017I2", "nodeById017I2" in eng))

# =======================================================================
# 3. Selection par fenetre : lecture du cache et fin du nodes.find imbrique
# =======================================================================
OLD_HIT_NODE = "\n".join([
    "      const boxedNodeIds = nodes.filter(n => {",
    "        const p = isoProjectV4(n.x, n.y, n.z || 0, viewport.zoom, viewport.panX, viewport.panY);",
])
NEW_HIT_NODE = "\n".join([
    "      // PATCH 017I2 : lecture du cache Float32Array au lieu de reprojeter.",
    "      const boxedNodeIds = nodes.filter(n => {",
    "        const p = projectNodeCached017I2(n);",
])
if "projectNodeCached017I2(n)" in eng:
    log.append("DEJA : selection fenetre sur cache")
elif OLD_HIT_NODE in eng:
    eng = eng.replace(OLD_HIT_NODE, NEW_HIT_NODE, 1)
    log.append("APPLIQUE : selection par fenetre lit le cache")
else:
    print("ECHEC : ancre selection noeuds introuvable")
    sys.exit(1)
checks.append(("selection fenetre sur cache", "projectNodeCached017I2(n)" in eng))

OLD_FIND = "\n".join([
    "        const a = nodes.find(n => n.id === s.fromNodeId);",
    "        const b = nodes.find(n => n.id === s.toNodeId);",
])
NEW_FIND = "\n".join([
    "        // PATCH 017I2 : recherche indexee, plus de balayage complet par troncon.",
    "        const a = nodeById017I2.get(s.fromNodeId);",
    "        const b = nodeById017I2.get(s.toNodeId);",
])
if "nodeById017I2.get(s.fromNodeId)" in eng:
    log.append("DEJA : recherche indexee des extremites")
elif OLD_FIND in eng:
    eng = eng.replace(OLD_FIND, NEW_FIND, 1)
    log.append("APPLIQUE : recherche indexee des extremites de troncon")
else:
    print("ECHEC : ancre nodes.find introuvable")
    sys.exit(1)
checks.append(("recherche indexee des extremites", "nodeById017I2.get(s.fromNodeId)" in eng))

# =======================================================================
# 4. Commande PERF : registre + dispatch (R8)
# =======================================================================
ANCHOR_REG = "\n".join([
    '    description: "Ouvre la derniere sauvegarde locale pour restauration",',
    '    category: "Donn\u00e9es",',
    '    shortcut: "RESTORE",',
    '    icon: "History",',
    "  },",
    "];",
])
NEW_REG = "\n".join([
    '    description: "Ouvre la derniere sauvegarde locale pour restauration",',
    '    category: "Donn\u00e9es",',
    '    shortcut: "RESTORE",',
    '    icon: "History",',
    "  },",
    "  // PATCH 017I2 : mesure du cache de projection.",
    "  {",
    '    id: "perf",',
    '    name: "PERF",',
    '    aliases: ["PERF", "PERFORMANCE", "DIAG", "STATS"],',
    '    description: "Affiche l etat du cache de projection et le cout du dernier calcul",',
    '    category: "Affichage",',
    '    shortcut: "PERF",',
    '    icon: "Activity",',
    "  },",
    "];",
])

if 'id: "perf"' in reg:
    log.append("DEJA : registre PERF")
elif ANCHOR_REG in reg:
    reg = reg.replace(ANCHOR_REG, NEW_REG, 1)
    write(REG, reg)
    log.append("APPLIQUE : registre PERF")
else:
    print("ECHEC : ancre registre 017I introuvable (appliquer 017I d abord)")
    sys.exit(1)
checks.append(("registre PERF declare", 'id: "perf"' in reg))

ANCHOR_DISP = "\n".join([
    "    } else {",
    "      const plant3dCommand = PDI_PLANT3D_COMMAND_TABLE?.find((item) =>",
])
DISPATCH = "\n".join([
    '    } else if (cmdId === "perf") {',
    "      // PATCH 017I2 : mesure reelle, pour comparer avant et apres optimisation.",
    "      const st017I2 = projCacheStats017I2.current;",
    "      setAutocadPrompt(",
    '        "COMMANDE [PERF] : " + st017I2.count + " noeud(s) en cache Float32Array, " +',
    '        st017I2.bytes + " octets, " + st017I2.builds + " reprojection(s), " +',
    '        "derniere en " + st017I2.ms + " ms.",',
    "      );",
    '      setStatusMessage("PERF : cache " + st017I2.bytes + " octets, " + st017I2.ms + " ms");',
    ANCHOR_DISP,
])

if 'cmdId === "perf"' in eng:
    log.append("DEJA : dispatch PERF")
elif ANCHOR_DISP in eng:
    eng = eng.replace(ANCHOR_DISP, DISPATCH, 1)
    log.append("APPLIQUE : dispatch PERF (R8 respectee)")
else:
    print("ECHEC : ancre dispatcher introuvable")
    sys.exit(1)
checks.append(("dispatch PERF", 'cmdId === "perf"' in eng))

write(ENG, eng)

# =======================================================================
# RAPPORT
# =======================================================================
R = []
R.append("# PATCH 017I2 - projection Float32Array, selection indexee, PERF")
R.append("")
R.append("## Operations")
for line in log:
    R.append("- " + line)
R.append("")
R.append("## Verifications")
for name, okv in checks:
    R.append("- [%s] %s" % ("x" if okv else " ", name))
R.append("")
R.append("## Mesures qui ont motive ce patch")
R.append("- `isoProjectV4` recalculait `Math.PI/6`, `Math.cos` et `Math.sin` a **chaque")
R.append("  appel**, soit deux appels trigonometriques par point et par rendu.")
R.append("- La selection par fenetre executait `nodes.find()` **deux fois par troncon**,")
R.append("  a chaque mouvement de souris : complexite O(n x m).")
R.append("- Aucun `requestAnimationFrame` et aucun `useCallback` dans le moteur : la")
R.append("  suite du travail de performance est identifiee, mais hors de ce patch.")
R.append("")
R.append("## Ce que fait le patch")
R.append("1. Constantes `PDI_ISO_COS_017I2` et `PDI_ISO_SIN_017I2` evaluees une fois au")
R.append("   chargement du module, reutilisees par la projection et la reprojection.")
R.append("2. Cache `Float32Array` de deux flottants par noeud, memoise sur")
R.append("   `[nodes, viewport]`, avec index `id -> position`. Un plan de 500 noeuds tient")
R.append("   dans 4 000 octets contigus au lieu de 500 objets a recollecter par rendu.")
R.append("3. La selection par fenetre lit le cache et utilise une `Map` d index :")
R.append("   O(n x m) devient O(n + m).")
R.append("4. Commande `PERF`, declaree **et** dispatchee (R8), qui affiche le nombre de")
R.append("   noeuds en cache, sa taille en octets, le nombre de reprojections et le cout")
R.append("   de la derniere. C est la mesure, pas une impression.")
R.append("")
R.append("## Reporte, volontairement")
R.append("Le lissage des mises a jour de `viewport` par `requestAnimationFrame` et la")
R.append("separation du panoramique et du zoom dans un `<g transform>` unique (pour ne")
R.append("plus reprojeter du tout au zoom) touchent la boucle de rendu et la modale de")
R.append("cotation. A traiter **apres 017M**, quand la structure d interface sera figee.")
R.append("")
R.append("## Tests")
R.append("1. Le plan s affiche a l identique : la projection est mathematiquement la meme,")
R.append("   seules les constantes changent de place. **Aucun decalage ne doit apparaitre.**")
R.append("2. Zoom molette, Ctrl+molette, Maj+molette, panoramique : comportement inchange.")
R.append("3. Selection par fenetre de gauche a droite (englobante) puis de droite a gauche")
R.append("   (secante) : les noeuds et troncons attendus sont bien captures.")
R.append("4. Tapez `PERF` : le nombre de noeuds annonce correspond a la barre d etat, et la")
R.append("   duree annoncee est de l ordre de quelques centiemes de milliseconde.")
R.append("5. Tapez `PERF` apres plusieurs zooms : le compteur de reprojections augmente.")
R.append("6. Cotations et alignements (AX, AY, AZ) : toujours corrects, car ils passent par")
R.append("   la meme projection.")
write(REPORT, "\n".join(R) + "\n")

print("=== PATCH 017I2 ===")
for line in log:
    print("  " + line)
nb = sum(1 for _, v in checks if v)
print("VERIFICATIONS : %d/%d" % (nb, len(checks)))
for name, okv in checks:
    print("  [%s] %s" % ("x" if okv else " ", name))
print("RAPPORT : " + REPORT)
if nb != len(checks):
    sys.exit(1)
