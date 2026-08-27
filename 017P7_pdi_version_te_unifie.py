# PATCH 017P7 - PDI Sketch-to-ISO - VOLET A : socle et moteur d edition
# Objet : le glyphe du Te derive de ses ports reels (fin des pixels figes),
#         rayon borne, et convention de metre dans le cartouche imprime.
# Regles : R1 idempotent + backup + rapport, R26 volets separes puis cat.
import os
import re
import sys
import shutil
import hashlib

TAG = '017P7'
FILE_TSX = os.path.join('src', 'pdi', 'isometric', 'engine', 'IsometrieModuleV48d.tsx')

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


# --- R1 : aucun chemin absolu en dur, on retrouve la racine du projet ---
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


# Modes d edition :
#   inline : remplace l ancre dans la ligne qui la contient
#   after  : insere les lignes de charge apres la ligne d ancre
#   line   : remplace la ligne d ancre par les lignes de charge
#   block  : remplace la plage [ancre_debut .. ancre_fin] par les lignes de charge
def apply_edit(txt, label, mode, anchor, payload, sentinel, anchor_end=None):
    global OK_ALL
    if sentinel in txt:
        log('DEJA', label)
        return txt
    lines = txt.split('\n')
    hits = [i for i, l in enumerate(lines) if anchor in l]
    if len(hits) != 1:
        log('ECHEC', label + ' (lignes ancre debut = ' + str(len(hits)) + ')')
        OK_ALL = False
        return txt
    i = hits[0]
    raw = lines[i]
    indent = raw[:len(raw) - len(raw.lstrip())]
    charge = payload if isinstance(payload, list) else [payload]
    charge = [indent + c for c in charge]
    if mode == 'inline':
        lines[i] = raw.replace(anchor, payload)
    elif mode == 'after':
        lines[i + 1:i + 1] = charge
    elif mode == 'line':
        lines[i:i + 1] = charge
    elif mode == 'block':
        ends = [k for k, l in enumerate(lines) if anchor_end and anchor_end in l and k >= i]
        if len(ends) != 1:
            log('ECHEC', label + ' (lignes ancre fin = ' + str(len(ends)) + ')')
            OK_ALL = False
            return txt
        j = ends[0]
        log('MESURE', label + ' : plage remplacee ' + str(i + 1) + '-' + str(j + 1))
        lines[i:j + 1] = charge
    else:
        log('ECHEC', label + ' (mode inconnu)')
        OK_ALL = False
        return txt
    log('APPLIQUE', label)
    return '\n'.join(lines)
# ---------------------------------------------------------------
# VOLET B : badge de version + te-equipement sur la logique du te natif
# ---------------------------------------------------------------

FILE_VER = os.path.join('src', 'pdi', 'pdiVersion.ts')

# Un seul point de verite pour la version affichee dans l interface.
# Chaque patch suivant met a jour la valeur de PDI_PATCH_VERSION.
TS_LINES = [
    '// Version de patch affichee dans l interface PD&I.',
    '// Point de verite unique : chaque patch met a jour cette valeur,',
    '// ce qui permet de verifier de visu quel patch est reellement charge.',
    '',
    'export const PDI_PATCH_VERSION = "017P7";',
    '',
    '// Date de reference du patch courant, au format ISO court.',
    'export const PDI_PATCH_DATE = "2026-08-27";',
    '',
]

IMPORT_NEUF = 'import { PDI_PATCH_VERSION } from "../../pdiVersion";'

# E2 : badge de version devant le nom du profil.
PROFIL_ANCRE = '<p className="font-bold text-slate-200 truncate">Youcef</p>'
PROFIL_NEUF = (
    '<p className="font-bold text-slate-200 truncate">'
    '<span className="text-[9px] font-mono text-cyan-300 border'
    ' border-cyan-500/40 rounded px-1 py-0.5 mr-1.5 align-middle">'
    '{PDI_PATCH_VERSION}</span>Youcef</p>'
)

# E3 : le te-equipement adopte exactement le rendu du te natif.
# Ce qui manquait : le repere central borne 3-10 px. Sans lui, un te
# dont les ports sont a 0.20 m ne mesure que 8.8 px a 158 pour cent,
# donc reste illisible et parait detache.
# La condition ne depend plus de p0/p1, comme pour le te natif.
GLYPHE_NEUF = (
    '{isBend&&p0&&p1?<path d={`M ${p0.sx} ${p0.sy} Q 0 0 ${p1.sx} ${p1.sy}`}'
    ' stroke="#f59e0b" strokeWidth="4" fill="none" strokeLinecap="round"/>:'
    'branchPort?<g data-pdi-te="017p7">'
    '<circle r={pdiNodeRadius017P3(viewport.zoom,isSel,isHov)+2} fill="#052e16"'
    ' stroke={isSel?"#facc15":"#22c55e"} strokeWidth={2}/>'
    '{nativePorts.map(port=>(<line key={`teq-branche-${port.id}`} x1="0" y1="0"'
    ' x2={port.sx} y2={port.sy} stroke="#22c55e" strokeWidth="2.5"'
    ' strokeLinecap="round"/>))}'
    '{nativePorts.map(port=>(<g key={port.id} data-iso-port="true"'
    ' data-port-node-id={n.id} data-port-idx={String(port.index)}'
    ' className="cursor-crosshair"><circle cx={port.sx} cy={port.sy}'
    ' r={port.role==="branch"?4:3}'
    ' fill={port.role==="branch"?"#22c55e":"#16a34a"} stroke="#ffffff"'
    ' strokeWidth={port.role==="branch"?1.5:1}/></g>))}'
    '</g>:'
    '<g>{nativePorts.map(port=>(<line key={`patte-${port.id}`} x1="0" y1="0"'
    ' x2={port.sx} y2={port.sy} stroke="#64748b" strokeWidth="1.6"'
    ' strokeLinecap="round"/>))}<g transform={`rotate(${angle})'
    ' scale(${kGlyph} ${n.mirrored?-kGlyph:kGlyph})`}'
    ' dangerouslySetInnerHTML={{__html:getFittingSvgGraphic(n.equipmentType!,false)}}/>'
    '</g>}'
)

# (label, mode, ancre, charge, sentinelle, ancre_fin)
EDITS = [
    (
        'E1 import du point de verite de version',
        'after',
        'from "./pdiAxes017P3";',
        IMPORT_NEUF,
        'from "../../pdiVersion";',
        None,
    ),
    (
        'E2 badge de version devant le nom du profil',
        'line',
        PROFIL_ANCRE,
        PROFIL_NEUF,
        '{PDI_PATCH_VERSION}</span>',
        None,
    ),
    (
        'E3 te-equipement rendu avec la logique du te natif',
        'line',
        'data-pdi-te="017p6"',
        GLYPHE_NEUF,
        'data-pdi-te="017p7"',
        None,
    ),
]


def apply_all(root):
    global OK_ALL
    chemin_tsx = os.path.join(root, FILE_TSX)
    chemin_ver = os.path.join(root, FILE_VER)
    backup(chemin_tsx)
    if os.path.exists(chemin_ver):
        txt_ver = read(chemin_ver)
        if 'PDI_PATCH_VERSION = "' + TAG + '"' in txt_ver:
            log('DEJA', 'pdiVersion.ts deja sur ' + TAG)
        else:
            write(chemin_ver, '\n'.join(TS_LINES))
            log('APPLIQUE', 'pdiVersion.ts mis a jour sur ' + TAG)
    else:
        write(chemin_ver, '\n'.join(TS_LINES))
        log('APPLIQUE', 'pdiVersion.ts cree sur ' + TAG)
    txt = read(chemin_tsx)
    avant = txt.count('dangerouslySetInnerHTML')
    log('MESURE', 'dangerouslySetInnerHTML avant = ' + str(avant))
    for label, mode, anchor, payload, sentinel, anchor_end in EDITS:
        txt = apply_edit(txt, label, mode, anchor, payload, sentinel, anchor_end)
    write(chemin_tsx, txt)
    apres = txt.count('dangerouslySetInnerHTML')
    log('MESURE', 'dangerouslySetInnerHTML apres = ' + str(apres))
    if apres != avant:
        log('ECHEC', 'R19 : le nombre de dangerouslySetInnerHTML a change')
        OK_ALL = False
    log('MESURE', 'md5 apres ' + md5(chemin_tsx))
    log('MESURE', 'lignes apres ' + str(len(txt.split('\n'))))
    return txt
# ---------------------------------------------------------------
# VOLET C : controles, rapport, point d entree
# ---------------------------------------------------------------


def controles(root):
    global OK_ALL
    tsx = read(os.path.join(root, FILE_TSX))
    ver = read(os.path.join(root, FILE_VER))
    tests = []
    # --- badge de version ---
    tests.append(('point de verite : PDI_PATCH_VERSION sur ' + TAG,
                  'PDI_PATCH_VERSION = "' + TAG + '"' in ver))
    tests.append(('module de version sans dependance externe (R7)',
                  'import ' not in ver))
    tests.append(('import de la version dans le moteur',
                  'from "../../pdiVersion";' in tsx))
    tests.append(('badge affiche devant le nom du profil',
                  '{PDI_PATCH_VERSION}</span>Youcef' in tsx))
    tests.append(('badge declare une seule fois',
                  tsx.count('{PDI_PATCH_VERSION}') == 1))
    # --- te-equipement sur la logique du te natif ---
    tests.append(('CAUSE RACINE : repere central borne pour le te-equipement',
                  'data-pdi-te="017p7"' in tsx
                  and tsx.count('pdiNodeRadius017P3(viewport.zoom,isSel,isHov)+2') == 2))
    tests.append(('branches du te-equipement vers tous les ports projetes',
                  'teq-branche-${port.id}' in tsx))
    tests.append(('ports du te-equipement cliquables pour le piquage',
                  tsx.count('data-port-idx={String(port.index)}') >= 3))
    tests.append(('la condition ne depend plus de p0/p1',
                  'branchPort?<g data-pdi-te' in tsx))
    tests.append(('plus aucune trace du rendu 017P6 remplace',
                  'data-pdi-te="017p6"' not in tsx))
    # --- non-regression ---
    tests.append(('non-regression coude : toujours derive de p0/p1',
                  'Q 0 0 ${p1.sx} ${p1.sy}' in tsx))
    tests.append(('non-regression 017P5 : echelle des glyphes inline',
                  'scale(${kGlyph} ${n.mirrored?-kGlyph:kGlyph})' in tsx
                  and 'scale(1.3' not in tsx))
    tests.append(('non-regression 017P4 : branches du te natif',
                  'te-branche-${port.id}' in tsx))
    tests.append(('non-regression 017P3 : cote centre a face et triedre',
                  'pdiNodeHasFaceOffset017P3' in tsx
                  and 'translate(566 44)' in tsx))
    # --- regles permanentes ---
    tests.append(('R14 : aucun commentaire JSX en attribut',
                  '/*' not in GLYPHE_NEUF and '/*' not in PROFIL_NEUF))
    tests.append(('aucun window.alert introduit',
                  'window.alert' not in tsx))
    tests.append(('backup present',
                  os.path.exists(os.path.join(root, FILE_TSX + '.before' + TAG))))
    bons = 0
    for libelle, ok in tests:
        if ok:
            bons += 1
            log('OK', libelle)
        else:
            log('ECHEC', libelle)
            OK_ALL = False
    print('')
    print('VERIFICATIONS : ' + str(bons) + '/' + str(len(tests)))
    return bons, len(tests)


RAPPORT = '017P7_version_te_unifie_REPORT.md'


def ecrire_rapport(root, bons, total):
    lignes = []
    lignes.append('# PATCH ' + TAG + ' - badge de version + te unifie')
    lignes.append('')
    lignes.append('## 1. Badge de version dans le panneau Profil')
    lignes.append('')
    lignes.append('src/pdi/pdiVersion.ts devient le point de verite unique.')
    lignes.append('La valeur est affichee devant le nom du profil, ce qui permet')
    lignes.append('de verifier de visu quel patch est reellement charge.')
    lignes.append('Chaque patch suivant met a jour PDI_PATCH_VERSION.')
    lignes.append('')
    lignes.append('## 2. Te-equipement : meme logique que le te natif')
    lignes.append('')
    lignes.append('Symptome : les tes ne marchent toujours pas.')
    lignes.append('')
    lignes.append('Cause : le rendu du 017P6 tracait bien le corps et la branche')
    lignes.append('depuis les ports, mais sans repere central. Or les ports d un')
    lignes.append('te sont a half = max(0.08, (length||0.4)/2) = 0.20 m, soit')
    lignes.append('0.20 x 28 x zoom en pixels : seulement 8.8 px a 158 pour cent.')
    lignes.append('Le te etait donc dessine juste, mais illisible et paraissant')
    lignes.append('detache du tube.')
    lignes.append('')
    lignes.append('Le te natif, lui, fonctionne parce qu il combine un cercle')
    lignes.append('central borne entre 3 et 10 px (pdiNodeRadius017P3) avec des')
    lignes.append('branches vers les ports projetes. Le te-equipement adopte')
    lignes.append('desormais exactement ce rendu, en vert, et sa condition ne')
    lignes.append('depend plus de p0/p1.')
    lignes.append('')
    lignes.append('## Reste a traiter (annonce, hors perimetre de ce patch)')
    lignes.append('')
    lignes.append('- Impression : ligne 5309, screenAngle n applique le trace')
    lignes.append('  derive des ports qu au coude. Un te imprime reste mal')
    lignes.append('  oriente. A corriger au 017P8.')
    lignes.append('- Dimension reelle du te : half est un defaut a 0.20 m et non')
    lignes.append('  la cote centre-a-face normalisee du DN. A traiter avec la')
    lignes.append('  bibliotheque parametrique (019).')
    lignes.append('')
    lignes.append('## Verifications')
    lignes.append('')
    lignes.append('VERIFICATIONS : ' + str(bons) + '/' + str(total))
    lignes.append('')
    lignes.append('## Journal')
    lignes.append('')
    for entree in JOURNAL:
        lignes.append('- ' + entree)
    lignes.append('')
    write(os.path.join(root, RAPPORT), '\n'.join(lignes))


def main():
    print('=== PATCH ' + TAG + ' : badge de version + te unifie ===')
    print('')
    root = find_root()
    chemin_tsx = os.path.join(root, FILE_TSX)
    if not os.path.exists(chemin_tsx):
        print('ECHEC : moteur introuvable sous ' + root)
        sys.exit(2)
    tsx = read(chemin_tsx)
    if 'pdiNodeRadius017P3' not in tsx:
        print('ECHEC : le PATCH 017P3 doit etre applique avant le ' + TAG + '.')
        sys.exit(2)
    if 'pdiGlyphScale017P5' not in tsx:
        print('ECHEC : le PATCH 017P5 doit etre applique avant le ' + TAG + '.')
        sys.exit(2)
    if 'const branchPort=nativePorts.find' not in tsx:
        print('ECHEC : le PATCH 017P6 doit etre applique avant le ' + TAG + '.')
        sys.exit(2)
    log('MESURE', 'racine retenue ' + root)
    log('MESURE', 'md5 avant ' + md5(chemin_tsx))
    apply_all(root)
    print('')
    bons, total = controles(root)
    ecrire_rapport(root, bons, total)
    print('')
    if OK_ALL:
        print('PATCH ' + TAG + ' TERMINE.')
        sys.exit(0)
    print('PATCH ' + TAG + ' INCOMPLET : voir les lignes ECHEC.')
    sys.exit(1)


if __name__ == '__main__':
    main()
