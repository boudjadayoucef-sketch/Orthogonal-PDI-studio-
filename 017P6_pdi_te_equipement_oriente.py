# PATCH 017P6 - PDI Sketch-to-ISO - VOLET A : socle et moteur d edition
# Objet : le glyphe du Te derive de ses ports reels (fin des pixels figes),
#         rayon borne, et convention de metre dans le cartouche imprime.
# Regles : R1 idempotent + backup + rapport, R26 volets separes puis cat.
import os
import re
import sys
import shutil
import hashlib

TAG = '017P6'
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
    with open(path, 'r', encoding='utf-8', errors='surrogateescape') as f:
        return f.read()


def write(path, txt):
    with open(path, 'w', encoding='utf-8', errors='surrogateescape') as f:
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
# VOLET B : les tes-equipements traces depuis leurs ports
# ---------------------------------------------------------------

# Cause racine : rotate(angle) n aligne le glyphe que sur l axe
# inline (p0 -> p1). La branche du glyphe est peinte en dur a
# M 0 0 V -7, soit 90 degres dans le plan ecran, alors qu en
# projection isometrique deux axes orthogonaux du monde
# apparaissent a environ 120 degres. Une rotation plane unique
# ne peut donc pas placer trois directions.
# Methode retenue : celle qui marche deja pour le coude (path Q
# sur p0/p1) et pour le Te natif (017P4) : tracer depuis les
# ports projetes, sans aucune rotation.

BRANCH_NEUF = 'const branchPort=nativePorts.find(port=>port.role==="branch");'

GLYPHE_NEUF = (
    '{isBend&&p0&&p1?<path d={`M ${p0.sx} ${p0.sy} Q 0 0 ${p1.sx} ${p1.sy}`}'
    ' stroke="#f59e0b" strokeWidth="4" fill="none" strokeLinecap="round"/>:'
    'branchPort&&p0&&p1?<g data-pdi-te="017p6">'
    '<line x1={p0.sx} y1={p0.sy} x2={p1.sx} y2={p1.sy} stroke="#22c55e"'
    ' strokeWidth="3.5" strokeLinecap="round"/>'
    '<line x1="0" y1="0" x2={branchPort.sx} y2={branchPort.sy} stroke="#22c55e"'
    ' strokeWidth="3.5" strokeLinecap="round"/>'
    '<circle cx={branchPort.sx} cy={branchPort.sy} r="2.5" fill="#22c55e"/>'
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
        'E1 reperage du port de branche du fitting',
        'after',
        'const kGlyph=pdiGlyphScale017P5(nativePorts);',
        BRANCH_NEUF,
        'const branchPort=nativePorts.find',
        None,
    ),
    (
        'E2 te-equipement trace depuis ses ports, sans rotation',
        'line',
        'patte-${port.id}',
        GLYPHE_NEUF,
        'data-pdi-te="017p6"',
        None,
    ),
]


def apply_all(root):
    global OK_ALL
    chemin_tsx = os.path.join(root, FILE_TSX)
    backup(chemin_tsx)
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
    tests = []
    # --- la correction du jour ---
    tests.append(('port de branche repere une seule fois',
                  tsx.count('const branchPort=nativePorts.find') == 1))
    tests.append(('CAUSE RACINE : te-equipement trace sans rotation',
                  'data-pdi-te="017p6"' in tsx))
    tests.append(('corps du te : de p0 a p1',
                  '<line x1={p0.sx} y1={p0.sy} x2={p1.sx} y2={p1.sy}' in tsx))
    tests.append(('branche du te : du centre au port de branche',
                  'x2={branchPort.sx} y2={branchPort.sy}' in tsx))
    tests.append(('le te-equipement ne passe plus par la fabrique de glyphes',
                  'branchPort&&p0&&p1?<g data-pdi-te' in tsx))
    tests.append(('le glyphe tournant reste reserve aux fittings inline',
                  'branchPort&&p0&&p1?' in tsx))
    # --- non-regression ---
    tests.append(('non-regression coude : toujours derive de p0/p1',
                  'Q 0 0 ${p1.sx} ${p1.sy}' in tsx))
    tests.append(('non-regression 017P5 : echelle des glyphes conservee',
                  'scale(${kGlyph} ${n.mirrored?-kGlyph:kGlyph})' in tsx
                  and 'scale(1.3' not in tsx))
    tests.append(('non-regression 017P5 : pattes de raccordement conservees',
                  'patte-${port.id}' in tsx))
    tests.append(('non-regression 017P5 : cadres a l echelle',
                  'width={23*kGlyph}' in tsx and 'width={21.6*kGlyph}' in tsx))
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


RAPPORT = '017P6_te_equipement_oriente_REPORT.md'


def ecrire_rapport(root, bons, total):
    lignes = []
    lignes.append('# PATCH ' + TAG + ' - te-equipement oriente par ses ports')
    lignes.append('')
    lignes.append('## Symptome')
    lignes.append('')
    lignes.append('Retour utilisateur : zoom corrige, coude correct, mais le Te')
    lignes.append('reste mal oriente apres rotation.')
    lignes.append('')
    lignes.append('## Cause racine')
    lignes.append('')
    lignes.append('angle = atan2(p1.sy - p0.sy, p1.sx - p0.sx) n aligne le glyphe')
    lignes.append('que sur l axe inline. La branche est peinte en dur a M 0 0 V -7,')
    lignes.append('soit 90 degres dans le plan ecran, alors qu en projection')
    lignes.append('isometrique deux axes orthogonaux du monde apparaissent a')
    lignes.append('environ 120 degres. Une rotation plane unique ne peut pas')
    lignes.append('placer trois directions : le defaut est structurel.')
    lignes.append('')
    lignes.append('## Correction')
    lignes.append('')
    lignes.append('Tout fitting portant un port de role branch est desormais')
    lignes.append('trace depuis ses ports projetes : corps de p0 a p1, branche du')
    lignes.append('centre vers le port de branche, sans aucune rotation. Meme')
    lignes.append('methode que le coude (path Q) et que le Te natif du 017P4.')
    lignes.append('Les fittings inline (vannes, brides, JMI) conservent le glyphe')
    lignes.append('tournant : pour eux rotate est exact car leurs ports sont')
    lignes.append('colineaires.')
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
    print('=== PATCH ' + TAG + ' : te-equipement oriente par ses ports ===')
    print('')
    root = find_root()
    chemin_tsx = os.path.join(root, FILE_TSX)
    if not os.path.exists(chemin_tsx):
        print('ECHEC : moteur introuvable sous ' + root)
        sys.exit(2)
    tsx = read(chemin_tsx)
    # garde-fou : la chaine 017P3 -> 017P4 -> 017P5 doit etre en place
    if 'pdiNodeRadius017P3' not in tsx:
        print('ECHEC : le PATCH 017P3 doit etre applique avant le ' + TAG + '.')
        sys.exit(2)
    if 'te-branche-${port.id}' not in tsx:
        print('ECHEC : le PATCH 017P4 doit etre applique avant le ' + TAG + '.')
        sys.exit(2)
    if 'pdiGlyphScale017P5' not in tsx:
        print('ECHEC : le PATCH 017P5 doit etre applique avant le ' + TAG + '.')
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
