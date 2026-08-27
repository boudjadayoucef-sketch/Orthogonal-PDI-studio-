# PATCH 017P3 - PDI Sketch-to-ISO - VOLET A : socle + module d axes
# Objet : noeuds simples sans dimension, triedre X Y Z en haut a droite,
#         rayon de noeud borne, metre exact affiche par convention.
# Regles : R1 idempotent + backup + rapport, R26 volets separes puis cat.
import os
import re
import sys
import shutil
import hashlib

TAG = '017P3'
FILE_TSX = os.path.join('src', 'pdi', 'isometric', 'engine', 'IsometrieModuleV48d.tsx')
FILE_MOD = os.path.join('src', 'pdi', 'isometric', 'engine', 'pdiAxes017P3.ts')

JOURNAL = []
OK_ALL = True

def log(kind, msg):
    line = kind + ' : ' + msg
    JOURNAL.append(line)
    print(line)

def md5(path):
    h = hashlib.md5()
    with open(path, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write(path, txt):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(txt)

# --- R1 : jamais de chemin absolu en dur, on retrouve la racine du projet ---
def _score(root):
    m = re.findall(r'pdi(\d+)', root)
    n = int(m[-1]) if m else -1
    return (n, os.path.getmtime(os.path.join(root, 'package.json')))

def find_root():
    here = os.path.dirname(os.path.abspath(__file__))
    for c in (here, os.getcwd()):
        if os.path.isfile(os.path.join(c, 'package.json')):
            return c
    found = []
    for base in (here, os.getcwd()):
        if not os.path.isdir(base):
            continue
        for root, dirs, files in os.walk(base):
            depth = root[len(base):].count(os.sep)
            if depth >= 3:
                dirs[:] = []
                continue
            dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'dist')]
            if 'package.json' in files and os.path.isdir(os.path.join(root, 'src')):
                found.append(root)
    if not found:
        return None
    return max(found, key=_score)

def backup(path):
    dst = path + '.before' + TAG
    if os.path.exists(dst):
        log('DEJA', 'backup present ' + os.path.basename(dst))
        return dst
    shutil.copy2(path, dst)
    log('APPLIQUE', 'backup cree ' + os.path.basename(dst))
    return dst

# --- Module d axes : une seule source de verite pour les directions ecran ---
# Les directions sont DERIVEES de isoProjectV4 (jamais reecrites en dur) :
#   ecran.x = (x - y) * cos * scale
#   ecran.y = (x + y) * sin * scale - z * scale
# donc une unite monde donne, a l ecran :
#   X+ -> ( +cos, +sin )   Y+ -> ( -cos, +sin )   Z+ -> ( 0, -1 )
MODULE_LINES = [
    '// PATCH 017P3 : reperes d axes, rayon de noeud et convention de metre.',
    '// Les directions ecran sont derivees de la projection isometrique du moteur :',
    '//   ecran.x = (x - y) * cos * scale ; ecran.y = (x + y) * sin * scale - z * scale',
    '// Ce module sera reutilise par l orbite 3D (jalon 018) : meme base de triedre.',
    '',
    'export type PdiAxisKey017P3 = "X" | "Y" | "Z";',
    '',
    'export type PdiAxisDir017P3 = {',
    '  key: PdiAxisKey017P3;',
    '  sx: number;',
    '  sy: number;',
    '  color: string;',
    '  legende: string;',
    '};',
    '',
    'export const PDI_AXIS_COLORS_017P3: Record<PdiAxisKey017P3, string> = {',
    '  X: "#f87171",',
    '  Y: "#4ade80",',
    '  Z: "#60a5fa",',
    '};',
    '',
    'export const pdiIsoAxisDirs017P3 = (cos: number, sin: number): PdiAxisDir017P3[] => [',
    '  { key: "X", sx: cos, sy: sin, color: PDI_AXIS_COLORS_017P3.X, legende: "Abscisse" },',
    '  { key: "Y", sx: -cos, sy: sin, color: PDI_AXIS_COLORS_017P3.Y, legende: "Ordonnee" },',
    '  { key: "Z", sx: 0, sy: -1, color: PDI_AXIS_COLORS_017P3.Z, legende: "Altitude" },',
    '];',
    '',
    '// Rayon du cercle de noeud : suit le zoom mais reste lisible.',
    'export const PDI_NODE_RADIUS_MIN_017P3 = 3;',
    'export const PDI_NODE_RADIUS_MAX_017P3 = 10;',
    '',
    'export const pdiNodeRadius017P3 = (zoom: number, isSel?: boolean, isHov?: boolean) => {',
    '  const base = isSel ? 7 : isHov ? 6 : 5;',
    '  const z = Math.max(0.1, Number.isFinite(zoom) ? zoom : 1);',
    '  const scaled = base * Math.sqrt(z);',
    '  const borne = Math.min(PDI_NODE_RADIUS_MAX_017P3, Math.max(PDI_NODE_RADIUS_MIN_017P3, scaled));',
    '  return Number(borne.toFixed(2));',
    '};',
    '',
    '// Regle metier ISO : un changement de direction est un POINT, pas une piece.',
    '// Seuls les vrais composants (equipement, te) ont une cote centre-a-face.',
    'export const pdiNodeHasFaceOffset017P3 = (',
    '  node: { equipmentType?: string | null; type?: string } | null | undefined,',
    ') => Boolean(node && (node.equipmentType || node.type === "tee"));',
    '',
    'export const PDI_METRE_CONVENTION_017P3 =',
    '  "Metre centre a centre (noeuds) et centre a face (composants)";',
    '',
]

def write_module(root):
    path = os.path.join(root, FILE_MOD)
    body = '\n'.join(MODULE_LINES)
    if os.path.exists(path) and read(path) == body:
        log('DEJA', 'module pdiAxes017P3.ts identique')
        return True
    write(path, body)
    log('APPLIQUE', 'module pdiAxes017P3.ts ecrit (' + str(len(body)) + ' octets)')
    return True

# ------------------------------------------------------------------
# VOLET B : les 7 editions dans IsometrieModuleV48d.tsx
# ------------------------------------------------------------------

# Triedre place en HAUT A DROITE du viewBox "0 0 620 400" (demande utilisateur),
# et non centre comme l ancienne rose des vents.
TRIEDRE = (
    '<g transform="translate(566 44)">'
    '{pdiIsoAxisDirs017P3(PDI_ISO_COS_017I2,PDI_ISO_SIN_017I2).map(a=>('
    '<g key={a.key}>'
    '<line x1="0" y1="0" x2={a.sx*24} y2={a.sy*24} stroke={a.color} strokeWidth="1.8" strokeLinecap="round"/>'
    '<text x={a.sx*34} y={a.sy*34+3} fill={a.color} fontSize="9" fontWeight="bold" textAnchor="middle">{a.key}</text>'
    '</g>))}'
    '<circle r="2.2" fill="#e2e8f0"/>'
    '</g>'
)

IMPORT_LINE = (
    'import { pdiIsoAxisDirs017P3, pdiNodeRadius017P3, '
    'pdiNodeHasFaceOffset017P3, PDI_METRE_CONVENTION_017P3 } from "./pdiAxes017P3";'
)

# (label, mode, ancre, charge, sentinelle d idempotence)
EDITS = [
    (
        'E1 import du module d axes',
        'after',
        'from "./pdiPorts017P2";',
        IMPORT_LINE,
        'from "./pdiAxes017P3";',
    ),
    (
        'E2 noeud simple sans dimension (tube au centre)',
        'after',
        'if(!port) return {x:node.x,y:node.y,z:node.z};',
        'if(!pdiNodeHasFaceOffset017P3(node)) return {x:node.x,y:node.y,z:node.z};',
        'pdiNodeHasFaceOffset017P3(node)',
    ),
    (
        'E3 rayon de noeud mis a l echelle et borne 3-10 px',
        'inline',
        'r={isSel?7:isHov?6:5}',
        'r={pdiNodeRadius017P3(viewport.zoom,isSel,isHov)}',
        'pdiNodeRadius017P3(viewport.zoom',
    ),
    (
        'E4 triedre X Y Z en haut a droite (remplace la rose des vents ecran)',
        'line',
        '<g transform="translate(550 45)">',
        TRIEDRE,
        'pdiIsoAxisDirs017P3(',
    ),
    (
        'E5 convention de metre sous le BOM',
        'after',
        '<strong className="text-lg font-mono text-cyan-300">{totalLength.toFixed(2)} m</strong>',
        '<span data-pdi-metre="017p3-bom" className="text-[8px] text-slate-500 block normal-case leading-tight mt-1">{PDI_METRE_CONVENTION_017P3}</span>',
        'data-pdi-metre="017p3-bom"',
    ),
    (
        'E6 convention de metre sous le panneau lateral',
        'after',
        '<strong className="text-cyan-300 font-mono text-sm">{totalLength.toFixed(2)} m</strong>',
        '<span data-pdi-metre="017p3-panneau" className="text-[7px] text-slate-500 block normal-case leading-tight">{PDI_METRE_CONVENTION_017P3}</span>',
        'data-pdi-metre="017p3-panneau"',
    ),
    (
        'E7 convention de metre sur la planche imprimee',
        'inline',
        '<b>Poids :</b> ${totalWeight.toFixed(1)} kg</div>',
        '<b>Poids :</b> ${totalWeight.toFixed(1)} kg | <b>Convention :</b> ${PDI_METRE_CONVENTION_017P3}</div>',
        '<b>Convention :</b> ${PDI_METRE_CONVENTION_017P3}',
    ),
]


def apply_edit(txt, label, mode, anchor, payload, sentinel):
    global OK_ALL
    if sentinel in txt:
        log('DEJA', label)
        return txt
    lines = txt.split('\n')
    hits = [i for i, l in enumerate(lines) if anchor in l]
    if len(hits) != 1:
        log('ECHEC', label + ' (lignes trouvees = ' + str(len(hits)) + ')')
        OK_ALL = False
        return txt
    i = hits[0]
    raw = lines[i]
    indent = raw[:len(raw) - len(raw.lstrip())]
    if mode == 'inline':
        lines[i] = raw.replace(anchor, payload)
    elif mode == 'line':
        lines[i] = indent + payload
    elif mode == 'after':
        lines.insert(i + 1, indent + payload)
    else:
        log('ECHEC', label + ' (mode inconnu)')
        OK_ALL = False
        return txt
    log('APPLIQUE', label)
    return '\n'.join(lines)


def apply_all(root):
    path = os.path.join(root, FILE_TSX)
    before = md5(path)
    backup(path)
    txt = read(path)
    n0 = len(txt.split('\n'))
    for (label, mode, anchor, payload, sentinel) in EDITS:
        txt = apply_edit(txt, label, mode, anchor, payload, sentinel)
    write(path, txt)
    after = md5(path)
    n1 = len(txt.split('\n'))
    log('MESURE', 'lignes ' + str(n0) + ' -> ' + str(n1))
    log('MESURE', 'md5 avant ' + before)
    log('MESURE', 'md5 apres ' + after)
    return txt

# ------------------------------------------------------------------
# VOLET C : verifications, rapport, point d entree
# ------------------------------------------------------------------

def controles(root, tsx):
    mod_path = os.path.join(root, FILE_MOD)
    mod = read(mod_path) if os.path.exists(mod_path) else ''
    checks = []
    checks.append((
        'module pdiAxes017P3.ts present',
        os.path.exists(mod_path),
    ))
    checks.append((
        'module expose les 5 utilitaires attendus',
        all(k in mod for k in (
            'pdiIsoAxisDirs017P3',
            'pdiNodeRadius017P3',
            'pdiNodeHasFaceOffset017P3',
            'PDI_METRE_CONVENTION_017P3',
            'PDI_AXIS_COLORS_017P3',
        )),
    ))
    checks.append((
        'import branche dans le moteur',
        'from "./pdiAxes017P3";' in tsx,
    ))
    checks.append((
        'noeud simple ramene au centre dans portWorldPosition',
        'if(!pdiNodeHasFaceOffset017P3(node)) return {x:node.x,y:node.y,z:node.z};' in tsx,
    ))
    checks.append((
        'plus aucun rayon de noeud en pixels figes',
        'r={isSel?7:isHov?6:5}' not in tsx,
    ))
    checks.append((
        'rayon borne effectivement appele',
        'pdiNodeRadius017P3(viewport.zoom,isSel,isHov)' in tsx,
    ))
    checks.append((
        'rose des vents supprimee de l ecran',
        'translate(550 45)' not in tsx,
    ))
    checks.append((
        'triedre X Y Z present en haut a droite',
        'translate(566 44)' in tsx and 'pdiIsoAxisDirs017P3(PDI_ISO_COS_017I2' in tsx,
    ))
    checks.append((
        'triedre derive de la projection (aucune direction en dur)',
        'PDI_ISO_SIN_017I2).map(a=>(' in tsx,
    ))
    checks.append((
        'rose des vents conservee sur la planche imprimee',
        '>N</text>' in tsx,
    ))
    checks.append((
        'convention de metre affichee 3 fois (BOM, panneau, impression)',
        tsx.count('PDI_METRE_CONVENTION_017P3') == 4,
    ))
    checks.append((
        'aucune alert() navigateur introduite',
        'alert(' not in TRIEDRE and 'window.alert' not in tsx,
    ))
    checks.append((
        'backup du moteur present',
        os.path.exists(os.path.join(root, FILE_TSX) + '.before' + TAG),
    ))
    return checks


RAPPORT_ENTETE = [
    '# RAPPORT PATCH 017P3 - Noeuds, triedre X Y Z et metre par convention',
    '',
    '## Cause racine corrigee',
    '',
    'Deux conventions d echelle coexistaient dans le moteur :',
    '',
    '- le cercle du noeud etait dessine en PIXELS FIXES (r = 5 a 7 px),',
    '- le depart du tube etait calcule en UNITES MONDE (demi-longueur 0,20 m),',
    '- la projection vaut 28 px par metre, donc l ecart valait 0,20 x 28 x zoom :',
    '  8 px a 142 %, 24 px a 435 %, 49 px a 883 %, 130 px a 2327 %.',
    '',
    'La rotation ne creait pas le defaut : elle le revelait, en faisant pivoter',
    'les 6 faces auxiliaires d un noeud qui n aurait jamais du en avoir.',
    '',
    '## Corrections',
    '',
    '1. Un noeud simple est un POINT : le tube part de son centre. Les cotes',
    '   centre-a-face ne sont conservees que pour les vrais composants',
    '   (equipements et tes), conformement a la pratique isometrique.',
    '2. Le rayon du cercle suit le zoom, borne entre 3 et 10 px : il ne peut',
    '   plus mentir sur la position du point.',
    '3. La rose des vents N/E/S/O de l ecran (indication geographique, sans',
    '   lien avec le modele) est remplacee par un triedre X / Y / Z place en',
    '   HAUT A DROITE. Les directions sont derivees de la projection du moteur,',
    '   jamais ecrites en dur : X+ = (+cos, +sin), Y+ = (-cos, +sin), Z+ = (0, -1).',
    '   Ce meme triedre servira de base a l orbite 3D (jalon 018).',
    '4. La rose des vents reste sur la planche imprimee, ou elle a un sens.',
    '5. Le metre devient exact : les tronçons etant desormais mesures de centre',
    '   a centre pour les noeuds simples, chaque tronçon gagne les 2 x 0,20 m',
    '   qui etaient perdus. La convention est affichee sous chaque total.',
    '',
    '## Consequence a verifier au test',
    '',
    'Les valeurs de longueur totale et de poids AUGMENTENT par rapport aux',
    'anciennes valeurs (qui etaient fausses par defaut). Le BOM suit.',
    '',
    '## Journal d execution',
    '',
]


def main():
    root = find_root()
    if not root:
        print('ECHEC : racine du projet introuvable (package.json absent)')
        sys.exit(2)
    print('RACINE : ' + root)
    tsx_path = os.path.join(root, FILE_TSX)
    if not os.path.isfile(tsx_path):
        print('ECHEC : fichier introuvable ' + tsx_path)
        sys.exit(2)
    write_module(root)
    tsx = apply_all(root)
    checks = controles(root, tsx)
    passed = sum(1 for (_, ok) in checks if ok)
    print('')
    print('VERIFICATIONS : ' + str(passed) + '/' + str(len(checks)))
    for (label, ok) in checks:
        print(('[x] ' if ok else '[ ] ') + label)
    lines = list(RAPPORT_ENTETE)
    for j in JOURNAL:
        lines.append('- ' + j)
    lines.append('')
    lines.append('## Verifications : ' + str(passed) + '/' + str(len(checks)))
    lines.append('')
    for (label, ok) in checks:
        lines.append('- [' + ('x' if ok else ' ') + '] ' + label)
    lines.append('')
    rep = os.path.join(root, '017P3_noeuds_triedre_metre_REPORT.md')
    write(rep, '\n'.join(lines))
    print('')
    print('RAPPORT : ' + rep)
    if passed != len(checks) or not OK_ALL:
        print('ATTENTION : patch incomplet, voir les cases vides ci-dessus.')
        sys.exit(1)
    print('PATCH 017P3 TERMINE.')


if __name__ == '__main__':
    main()
