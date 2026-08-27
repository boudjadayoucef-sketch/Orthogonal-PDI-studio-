# PATCH 017P4 - PDI Sketch-to-ISO - VOLET A : socle et moteur d edition
# Objet : le glyphe du Te derive de ses ports reels (fin des pixels figes),
#         rayon borne, et convention de metre dans le cartouche imprime.
# Regles : R1 idempotent + backup + rapport, R26 volets separes puis cat.
import os
import re
import sys
import shutil
import hashlib

TAG = '017P4'
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

# ------------------------------------------------------------------
# VOLET B : les 2 editions dans IsometrieModuleV48d.tsx
# ------------------------------------------------------------------

# Le scope du rendu fournit deja, pour TOUT noeud, la liste nativePorts :
#   nativePorts = (n.ports||[]).map(port => { w = portWorldPosition(n, port.id);
#                 sp = isoProjectV4(w...); return {...port, sx: sp.x-p.x, sy: sp.y-p.y}; })
# Les offsets sx / sy sont donc deja en pixels ecran, zoom compris, et suivent
# la rotation. Le Te est reconstruit sur cette base : plus aucune coordonnee
# peinte en dur. Le trace en pixels figes n est conserve qu en repli, pour un
# Te ancien qui n aurait aucun port declare.
TE_BLOC = [
    '<circle r={pdiNodeRadius017P3(viewport.zoom,isSel,isHov)+2} fill="#1e1b4b" stroke={isSel?"#facc15":"#a78bfa"} strokeWidth={2}/>',
    '{nativePorts.length?nativePorts.map(port=>(<line key={`te-branche-${port.id}`} x1="0" y1="0" x2={port.sx} y2={port.sy} stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round"/>)):(<path d="M -10 0 L 10 0 M 0 0 L 0 -12" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round"/>)}',
    '{nativePorts.map(port=>(<g key={port.id} data-iso-port="true" data-port-node-id={n.id} data-port-idx={String(port.index)} className="cursor-crosshair"><circle cx={port.sx} cy={port.sy} r={port.role==="branch"?4:3} fill={port.role==="branch"?"#22c55e":"#8b5cf6"} stroke="#ffffff" strokeWidth={port.role==="branch"?1.5:1}/></g>))}',
]

CARTOUCHE_ANCRE = (
    'M\u00e9tr\u00e9 total :</b> <span style="color:#0f172a;font-weight:bold;">'
    '${totalLength.toFixed(2)} m</span>'
)
CARTOUCHE_NEUF = (
    CARTOUCHE_ANCRE
    + '<br/><span style="font-size:7px;color:#64748b;">'
    + '${PDI_METRE_CONVENTION_017P3}</span>'
)

# (label, mode, ancre, charge, sentinelle, ancre_fin)
EDITS = [
    (
        'E1 glyphe du Te derive de ses ports reels',
        'block',
        'r={isSel?9:7} fill="#1e1b4b"',
        TE_BLOC,
        'te-branche-${port.id}',
        'cx="0" cy="-14" r="5"',
    ),
    (
        'E2 convention de metre dans le cartouche imprime',
        'inline',
        CARTOUCHE_ANCRE,
        CARTOUCHE_NEUF,
        'font-size:7px;color:#64748b;">${PDI_METRE_CONVENTION_017P3}',
        None,
    ),
]


def apply_all(root):
    path = os.path.join(root, FILE_TSX)
    before = md5(path)
    backup(path)
    txt = read(path)
    n0 = len(txt.split('\n'))
    for (label, mode, anchor, payload, sentinel, anchor_end) in EDITS:
        txt = apply_edit(txt, label, mode, anchor, payload, sentinel, anchor_end)
    write(path, txt)
    n1 = len(txt.split('\n'))
    log('MESURE', 'lignes ' + str(n0) + ' -> ' + str(n1))
    log('MESURE', 'md5 avant ' + before)
    log('MESURE', 'md5 apres ' + md5(path))
    return txt

# ------------------------------------------------------------------
# VOLET C : verifications, rapport, point d entree
# ------------------------------------------------------------------

def controles(root, tsx):
    checks = []
    checks.append((
        'plus aucun rayon de Te en pixels figes',
        'r={isSel?9:7}' not in tsx,
    ))
    checks.append((
        'rayon du Te borne par le module d axes',
        'pdiNodeRadius017P3(viewport.zoom,isSel,isHov)+2' in tsx,
    ))
    checks.append((
        'branches du Te tracees vers les ports projetes',
        'x2={port.sx} y2={port.sy}' in tsx,
    ))
    checks.append((
        'plus aucune pastille de port du Te en dur',
        'cx="-12"' not in tsx and 'cx="12"' not in tsx and 'cy="-14"' not in tsx,
    ))
    checks.append((
        'repli conserve pour un Te sans port declare',
        'M -10 0 L 10 0 M 0 0 L 0 -12' in tsx,
    ))
    checks.append((
        'ports du Te restent cliquables (piquage preserve)',
        tsx.count('data-port-idx={String(port.index)}') >= 2,
    ))
    checks.append((
        'convention de metre presente dans le cartouche',
        'font-size:7px;color:#64748b;">${PDI_METRE_CONVENTION_017P3}' in tsx,
    ))
    checks.append((
        'convention de metre desormais affichee 5 fois',
        tsx.count('PDI_METRE_CONVENTION_017P3') == 5,
    ))
    checks.append((
        'acquis 017P3 intact : noeud simple au centre',
        'if(!pdiNodeHasFaceOffset017P3(node)) return {x:node.x,y:node.y,z:node.z};' in tsx,
    ))
    checks.append((
        'acquis 017P3 intact : triedre en haut a droite',
        'translate(566 44)' in tsx,
    ))
    checks.append((
        'rose des vents toujours reservee a l impression',
        'translate(550 45)' not in tsx and '>N</text>' in tsx,
    ))
    checks.append((
        'aucune alert() navigateur introduite',
        'window.alert' not in tsx,
    ))
    checks.append((
        'aucun commentaire JSX en attribut (R14)',
        '/* PATCH' not in ''.join(TE_BLOC),
    ))
    checks.append((
        'backup du moteur present',
        os.path.exists(os.path.join(root, FILE_TSX) + '.before' + TAG),
    ))
    return checks


RAPPORT = [
    '# RAPPORT PATCH 017P4 - Te collé et convention au cartouche',
    '',
    '## Defaut corrige',
    '',
    'Le 017P3 avait ramene les noeuds simples a leur centre, mais le Te est un',
    'glyphe COMPOSITE qui restait peint en pixels figes (lignes 7022-7026) :',
    '',
    '- cercle r = 7 a 9 px fixes,',
    '- branches ecrites M -10 0 L 10 0 M 0 0 L 0 -12, soit 10 et 12 px en dur,',
    '- trois pastilles de port placees a cx = -12, cx = 12, cy = -14.',
    '',
    'Or un Te conserve volontairement sa cote centre-a-face (0,20 m), qui vaut',
    'a l ecran 0,20 x 28 x zoom. A 182 pour cent cela fait environ 10 px face a',
    'une pastille peinte a 12 px, et l ecart grandit avec le zoom. Surtout, ces',
    'coordonnees en dur NE TOURNENT PAS : apres une rotation, le glyphe restait',
    'couche alors que les ports avaient pivote.',
    '',
    '## Correction',
    '',
    'Le scope de rendu calculait deja, pour tout noeud, nativePorts avec des',
    'offsets ecran sx / sy issus de portWorldPosition puis isoProjectV4. Le Te',
    'est desormais construit sur cette seule source : ses trois branches vont du',
    'centre vers ses ports reels, ses pastilles se posent sur ces ports. Echelle',
    'et orientation deviennent donc justes par construction, a tout zoom et',
    'apres toute rotation. Un Te ancien depourvu de ports garde le trace de',
    'repli, pour ne jamais disparaitre du plan.',
    '',
    'Le rayon du cercle passe sous la borne 3-10 px du module d axes, et la',
    'convention de metre manquait au cartouche imprime : elle y figure a present',
    'sous le metre total.',
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
    tsx = read(tsx_path)
    if 'pdiNodeRadius017P3' not in tsx:
        print('ECHEC : le PATCH 017P3 doit etre applique avant le 017P4.')
        sys.exit(2)
    tsx = apply_all(root)
    checks = controles(root, tsx)
    passed = sum(1 for (_, ok) in checks if ok)
    print('')
    print('VERIFICATIONS : ' + str(passed) + '/' + str(len(checks)))
    for (label, ok) in checks:
        print(('[x] ' if ok else '[ ] ') + label)
    lines = list(RAPPORT)
    for j in JOURNAL:
        lines.append('- ' + j)
    lines.append('')
    lines.append('## Verifications : ' + str(passed) + '/' + str(len(checks)))
    lines.append('')
    for (label, ok) in checks:
        lines.append('- [' + ('x' if ok else ' ') + '] ' + label)
    lines.append('')
    rep = os.path.join(root, '017P4_te_ports_cartouche_REPORT.md')
    write(rep, '\n'.join(lines))
    print('')
    print('RAPPORT : ' + rep)
    if passed != len(checks) or not OK_ALL:
        print('ATTENTION : patch incomplet, voir les cases vides ci-dessus.')
        sys.exit(1)
    print('PATCH 017P4 TERMINE.')


if __name__ == '__main__':
    main()
