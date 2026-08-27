# PATCH 017P5 - PDI Sketch-to-ISO - VOLET A : socle et moteur d edition
# Objet : le glyphe du Te derive de ses ports reels (fin des pixels figes),
#         rayon borne, et convention de metre dans le cartouche imprime.
# Regles : R1 idempotent + backup + rapport, R26 volets separes puis cat.
import os
import re
import sys
import shutil
import hashlib

TAG = '017P5'
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
# VOLET B : nouveau module + editions
# ---------------------------------------------------------------

FILE_NEW = os.path.join('src', 'pdi', 'isometric', 'engine', 'pdiGlyphes017P5.ts')

# Module local : echelle des glyphes de fittings derivee des ports.
# Les glyphes de getFittingSvgGraphic sont dessines dans une plage
# nominale de +/- 7 unites (ex. te : M -7 0 H 7 M 0 0 V -7).
# L ancien scale(1.3) figeait donc la demi-branche a 9.1 px ecran,
# alors que les ports sont a 0.20 m x 28 px/m x zoom.

TS_LINES = [
    '// Echelle des glyphes de fittings, derivee de la position reelle des ports.',
    '// Corrige le decrochage du glyphe au zoom (PATCH 017P5).',
    '',
    '// Demi-taille nominale des glyphes de getFittingSvgGraphic, en unites SVG.',
    'export const PDI_GLYPHE_DEMI_NOMINALE_017P5 = 7;',
    '',
    '// Bornes de securite : lisible au dezoom, non explosif au zoom extreme.',
    'export const PDI_GLYPHE_SCALE_MIN_017P5 = 0.9;',
    'export const PDI_GLYPHE_SCALE_MAX_017P5 = 40;',
    '',
    'export type PdiGlyphPort017P5 = { sx: number; sy: number };',
    '',
    '// Retourne le facteur d echelle du glyphe pour que sa demi-taille',
    '// nominale couvre la distance ecran moyenne centre -> ports.',
    'export function pdiGlyphScale017P5(',
    '  ports: PdiGlyphPort017P5[] | null | undefined,',
    '  defaut: number = 1.3,',
    '): number {',
    '  if (!ports || ports.length === 0) return defaut;',
    '  let somme = 0;',
    '  let nb = 0;',
    '  for (const port of ports) {',
    '    const d = Math.hypot(Number(port.sx) || 0, Number(port.sy) || 0);',
    '    if (d > 0.01) {',
    '      somme += d;',
    '      nb += 1;',
    '    }',
    '  }',
    '  if (nb === 0) return defaut;',
    '  const brut = somme / nb / PDI_GLYPHE_DEMI_NOMINALE_017P5;',
    '  const borne = Math.min(',
    '    PDI_GLYPHE_SCALE_MAX_017P5,',
    '    Math.max(PDI_GLYPHE_SCALE_MIN_017P5, brut),',
    '  );',
    '  return Number(borne.toFixed(3));',
    '}',
    '',
]

IMPORT_NEUF = 'import { pdiGlyphScale017P5 } from "./pdiGlyphes017P5";'

KGLYPH_NEUF = 'const kGlyph=pdiGlyphScale017P5(nativePorts);'

# Glyphe d equipement : echelle derivee des ports + pattes de raccordement.
# Le coude reste inchange, il etait deja derive de p0/p1 (retour : Coude Ok).
GLYPHE_NEUF = (
    '{isBend&&p0&&p1?<path d={`M ${p0.sx} ${p0.sy} Q 0 0 ${p1.sx} ${p1.sy}`}'
    ' stroke="#f59e0b" strokeWidth="4" fill="none" strokeLinecap="round"/>:'
    '<g>{nativePorts.map(port=>(<line key={`patte-${port.id}`} x1="0" y1="0"'
    ' x2={port.sx} y2={port.sy} stroke="#64748b" strokeWidth="1.6"'
    ' strokeLinecap="round"/>))}<g transform={`rotate(${angle})'
    ' scale(${kGlyph} ${n.mirrored?-kGlyph:kGlyph})`}'
    ' dangerouslySetInnerHTML={{__html:getFittingSvgGraphic(n.equipmentType!,false)}}/>'
    '</g>}'
)

RECT_SEL_ANCRE = '<rect x="-15" y="-15" width="30" height="30" rx="5"'
RECT_SEL_NEUF = ('<rect x={-11.5*kGlyph} y={-11.5*kGlyph} width={23*kGlyph}'
                 ' height={23*kGlyph} rx="5"')

RECT_HOV_ANCRE = '<rect x="-14" y="-14" width="28" height="28" rx="4"'
RECT_HOV_NEUF = ('<rect x={-10.8*kGlyph} y={-10.8*kGlyph} width={21.6*kGlyph}'
                 ' height={21.6*kGlyph} rx="4"')

# (label, mode, ancre, charge, sentinelle, ancre_fin)
EDITS = [
    (
        'E1 import du module d echelle des glyphes',
        'after',
        'from "./pdiAxes017P3";',
        IMPORT_NEUF,
        'pdiGlyphes017P5";',
        None,
    ),
    (
        'E2 declaration de kGlyph dans le scope de rendu du noeud',
        'after',
        'const isBend=!!n.equipmentType&&elbowAngle(n.equipmentType)>0;',
        KGLYPH_NEUF,
        KGLYPH_NEUF,
        None,
    ),
    (
        'E3 cadre de selection a l echelle du glyphe',
        'inline',
        RECT_SEL_ANCRE,
        RECT_SEL_NEUF,
        'width={23*kGlyph}',
        None,
    ),
    (
        'E4 cadre de survol a l echelle du glyphe',
        'inline',
        RECT_HOV_ANCRE,
        RECT_HOV_NEUF,
        'width={21.6*kGlyph}',
        None,
    ),
    (
        'E5 glyphe d equipement mis a l echelle de ses ports',
        'line',
        'isBend&&p0&&p1',
        GLYPHE_NEUF,
        'patte-${port.id}',
        None,
    ),
]


def apply_all(root):
    global OK_ALL
    chemin_tsx = os.path.join(root, FILE_TSX)
    chemin_new = os.path.join(root, FILE_NEW)
    backup(chemin_tsx)
    # 1. module local (aucune dependance externe, R7)
    if os.path.exists(chemin_new):
        log('DEJA', 'module pdiGlyphes017P5.ts present')
    else:
        write(chemin_new, '\n'.join(TS_LINES))
        log('APPLIQUE', 'module pdiGlyphes017P5.ts cree')
    log('MESURE', 'module : ' + str(os.path.getsize(chemin_new)) + ' octets')
    # 2. editions du moteur
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
    ts = read(os.path.join(root, FILE_NEW))
    tests = []
    # --- le module d echelle ---
    tests.append(('module : fonction pdiGlyphScale017P5 exportee',
                  'export function pdiGlyphScale017P5(' in ts))
    tests.append(('module : demi-taille nominale 7 unites documentee',
                  'PDI_GLYPHE_DEMI_NOMINALE_017P5 = 7;' in ts))
    tests.append(('module : bornes 0.9 et 40 declarees',
                  'PDI_GLYPHE_SCALE_MIN_017P5 = 0.9;' in ts
                  and 'PDI_GLYPHE_SCALE_MAX_017P5 = 40;' in ts))
    tests.append(('module : calcul 100 pour cent local, aucun import externe (R7)',
                  'import ' not in ts))
    # --- le cablage dans le moteur ---
    tests.append(('moteur : import du module present',
                  'pdiGlyphes017P5";' in tsx))
    tests.append(('moteur : kGlyph declare une seule fois',
                  tsx.count('const kGlyph=pdiGlyphScale017P5(nativePorts);') == 1))
    # --- la correction du Te reduit (cause racine) ---
    tests.append(('CAUSE RACINE : plus aucun scale(1.3 figee',
                  'scale(1.3' not in tsx))
    tests.append(('glyphe mis a l echelle des ports : scale(${kGlyph}',
                  'scale(${kGlyph} ${n.mirrored?-kGlyph:kGlyph})' in tsx))
    tests.append(('pattes de raccordement centre -> ports',
                  'patte-${port.id}' in tsx
                  and 'x2={port.sx} y2={port.sy}' in tsx))
    # --- les cadres, en px figes eux aussi ---
    tests.append(('cadre de selection a l echelle',
                  'width={23*kGlyph}' in tsx
                  and 'x="-15" y="-15" width="30"' not in tsx))
    tests.append(('cadre de survol a l echelle',
                  'width={21.6*kGlyph}' in tsx
                  and 'x="-14" y="-14" width="28"' not in tsx))
    # --- non-regression ---
    tests.append(('non-regression coude : toujours derive de p0/p1',
                  'Q 0 0 ${p1.sx} ${p1.sy}' in tsx))
    tests.append(('non-regression 017P4 : branches du Te natif',
                  'te-branche-${port.id}' in tsx))
    tests.append(('non-regression 017P3 : rayon borne et cote centre a face',
                  'pdiNodeRadius017P3(viewport.zoom,isSel,isHov)' in tsx
                  and 'pdiNodeHasFaceOffset017P3' in tsx))
    tests.append(('non-regression 017P3 : triedre en haut a droite',
                  'translate(566 44)' in tsx))
    # --- regles permanentes ---
    tests.append(('R14 : aucun commentaire JSX dans la ligne du glyphe',
                  '/*' not in GLYPHE_NEUF))
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


RAPPORT = '017P5_glyphes_equipements_REPORT.md'


def ecrire_rapport(root, bons, total):
    lignes = []
    lignes.append('# PATCH ' + TAG + ' - glyphes d equipements a l echelle des ports')
    lignes.append('')
    lignes.append('## Symptome')
    lignes.append('')
    lignes.append('Retour utilisateur : le Te reduit reste detache des tubes a')
    lignes.append('1080 pour cent et 1439 pour cent, alors que le noeud simple')
    lignes.append('et le coude sont corrects.')
    lignes.append('')
    lignes.append('## Cause racine')
    lignes.append('')
    lignes.append('Un Te reduit porte equipmentType, il passe donc par la branche')
    lignes.append('isEquip et non par isTee corrigee au 017P4. Cette branche')
    lignes.append('dessinait le glyphe avec scale(1.3) figee, alors que les')
    lignes.append('glyphes de getFittingSvgGraphic sont nominaux a +/- 7 unites :')
    lignes.append('demi-branche de 9.1 px constants contre des ports a')
    lignes.append('0.20 m x 28 px/m x zoom, soit 60 px a 1080 pour cent.')
    lignes.append('Le coude, lui, etait deja trace de p0 a p1, d ou son exactitude.')
    lignes.append('')
    lignes.append('## Corrections')
    lignes.append('')
    lignes.append('- pdiGlyphScale017P5 : echelle derivee de la distance ecran')
    lignes.append('  moyenne centre -> ports, bornee entre 0.9 et 40.')
    lignes.append('- Pattes de raccordement du centre vers chaque port, garantie')
    lignes.append('  de continuite visuelle meme pour un glyphe non conforme.')
    lignes.append('- Cadres de selection et de survol mis a la meme echelle.')
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
    print('=== PATCH ' + TAG + ' : glyphes d equipements a l echelle des ports ===')
    print('')
    root = find_root()
    chemin_tsx = os.path.join(root, FILE_TSX)
    if not os.path.exists(chemin_tsx):
        print('ECHEC : moteur introuvable sous ' + root)
        sys.exit(2)
    tsx = read(chemin_tsx)
    # garde-fou de prerequis : la chaine 017P3 puis 017P4 doit etre en place
    if 'pdiNodeRadius017P3' not in tsx:
        print('ECHEC : le PATCH 017P3 doit etre applique avant le ' + TAG + '.')
        sys.exit(2)
    if 'te-branche-${port.id}' not in tsx:
        print('ECHEC : le PATCH 017P4 doit etre applique avant le ' + TAG + '.')
        sys.exit(2)
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
