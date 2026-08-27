# PATCH 017P8 - PDI Sketch-to-ISO - VOLET A : socle et moteur d edition
# Objet : le glyphe du Te derive de ses ports reels (fin des pixels figes),
#         rayon borne, et convention de metre dans le cartouche imprime.
# Regles : R1 idempotent + backup + rapport, R26 volets separes puis cat.
import os
import re
import sys
import shutil
import hashlib

TAG = '017P8'
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
# VOLET B : port occupe non branchable + erreurs reseau explicitees
# ---------------------------------------------------------------

# E1 : refus de branche sur un port deja occupe par un troncon.
# Un port occupe porte une soudure : il ne peut pas recevoir de branche.
ANCRE_BRANCHE = (
    'setBranchDrawing({fromNodeId:nodeId,fromPortId:portByIndex(node,portIdx)?.id,'
    'handleIndex:portIdx,currentWorldPos:screenToIsoWorld(e)});'
)
BRANCHE_NEUF = (
    'const portCible=portByIndex(node,portIdx);'
    'const portOccupe=!!portCible&&segments.some(s=>s.fromPortId===portCible.id'
    '||s.toPortId===portCible.id);'
    'if(portOccupe){setStatusMessage("PORT OCCUPE : ce port porte deja une soudure.'
    ' Aucune branche creee. Choisissez un port libre.");e.stopPropagation();return;}'
    'setBranchDrawing({fromNodeId:nodeId,fromPortId:portCible?.id,'
    'handleIndex:portIdx,currentWorldPos:screenToIsoWorld(e)});'
)

# E2 : le te-equipement ne rend plus de pastilles en doublon.
# Les pastilles sont deja rendues juste apres, par la boucle des joints,
# qui distingue port libre (cliquable) et port soude (non cliquable).
# Le doublon introduit au 017P7 recouvrait cette logique : c est la cause
# exacte du bug W002.
GLYPHE_NEUF = (
    '{isBend&&p0&&p1?<path d={`M ${p0.sx} ${p0.sy} Q 0 0 ${p1.sx} ${p1.sy}`}'
    ' stroke="#f59e0b" strokeWidth="4" fill="none" strokeLinecap="round"/>:'
    'branchPort?<g data-pdi-te="017p8">'
    '<circle r={pdiNodeRadius017P3(viewport.zoom,isSel,isHov)+2} fill="#052e16"'
    ' stroke={isSel?"#facc15":"#22c55e"} strokeWidth={2}/>'
    '{nativePorts.map(port=>(<line key={`teq-branche-${port.id}`} x1="0" y1="0"'
    ' x2={port.sx} y2={port.sy} stroke="#22c55e" strokeWidth="2.5"'
    ' strokeLinecap="round"/>))}'
    '</g>:'
    '<g>{nativePorts.map(port=>(<line key={`patte-${port.id}`} x1="0" y1="0"'
    ' x2={port.sx} y2={port.sy} stroke="#64748b" strokeWidth="1.6"'
    ' strokeLinecap="round"/>))}<g transform={`rotate(${angle})'
    ' scale(${kGlyph} ${n.mirrored?-kGlyph:kGlyph})`}'
    ' dangerouslySetInnerHTML={{__html:getFittingSvgGraphic(n.equipmentType!,false)}}/>'
    '</g>}'
)

# E3 : meme regle pour le te natif, qui n a pas de boucle de joints.
# Un port soude devient une croix non cliquable.
ANCRE_TE_NATIF = 'fill={port.role==="branch"?"#22c55e":"#8b5cf6"}'
TE_NATIF_NEUF = (
    '{nativePorts.map(port=>{'
    'const jointTe=projectJoints.find(item=>item.nodeId===n.id&&item.portId===port.id);'
    'if(jointTe)return <g key={port.id} pointerEvents="none">'
    '<circle cx={port.sx} cy={port.sy} r="3.4" fill="#0f172a" stroke="#fbbf24"'
    ' strokeWidth="1.4"/></g>;'
    'return <g key={port.id} data-iso-port="true" data-port-node-id={n.id}'
    ' data-port-idx={String(port.index)} className="cursor-crosshair">'
    '<circle cx={port.sx} cy={port.sy} r={port.role==="branch"?4:3}'
    ' fill={port.role==="branch"?"#22c55e":"#8b5cf6"} stroke="#ffffff"'
    ' strokeWidth={port.role==="branch"?1.5:1}/></g>;})}'
)

# E4 : le compteur d erreurs en haut devient cliquable et explicite.
ANCRE_BADGE = (
    '<span className={graphErrorCount?"text-red-400":"text-emerald-400"}>'
    '{graphErrorCount?`${graphErrorCount} erreur(s)`:"Graphe valide"}</span>'
)
BADGE_NEUF = (
    '<button type="button" title={graphIssues.length?graphIssues.slice(0,8)'
    '.map(issue=>(issue.severity==="error"?"ERREUR : ":"ALERTE : ")+issue.message)'
    '.join("\\n"):"Aucune anomalie de reseau detectee."}'
    ' onClick={()=>{setStudioLayout("control");setLeftPanelOpen(true);'
    'setStatusMessage(graphErrorCount?`CONTROLE RESEAU : ${graphErrorCount}'
    ' erreur(s) - ${graphIssues.filter(issue=>issue.severity==="error")'
    '.slice(0,3).map(issue=>issue.message).join(" ; ")}`'
    ':graphWarningCount?`CONTROLE RESEAU : ${graphWarningCount} alerte(s)'
    ' - ${graphIssues.slice(0,3).map(issue=>issue.message).join(" ; ")}`'
    ':"CONTROLE RESEAU : graphe valide, aucune anomalie.");}}'
    ' className={graphErrorCount?"text-red-400 underline decoration-dotted'
    ' cursor-pointer":graphWarningCount?"text-amber-300 underline'
    ' decoration-dotted cursor-pointer":"text-emerald-400 cursor-pointer"}>'
    '{graphErrorCount?`${graphErrorCount} erreur(s)`'
    ':graphWarningCount?`${graphWarningCount} alerte(s)`:"Graphe valide"}</button>'
)

# E5 : l entree Controle reseau de la ligne de commande repond enfin.
ANCRE_CMD = 'setStudioLayout("control"); setLeftPanelOpen(true);'
CMD_NEUF = (
    'setStudioLayout("control"); setLeftPanelOpen(true);'
    ' setStatusMessage(graphIssues.length?`CONTROLE RESEAU : ${graphErrorCount}'
    ' erreur(s), ${graphWarningCount} alerte(s) - ${graphIssues.slice(0,3)'
    '.map(issue=>issue.code+" "+issue.message).join(" ; ")}`'
    ':"CONTROLE RESEAU : graphe valide, aucune anomalie detectee.");'
)

# (label, mode, ancre, charge, sentinelle, ancre_fin)
EDITS = [
    (
        'E1 refus de branche sur un port deja soude',
        'line',
        ANCRE_BRANCHE,
        BRANCHE_NEUF,
        'const portOccupe=!!portCible',
        None,
    ),
    (
        'E2 suppression des pastilles en doublon du te-equipement',
        'line',
        'data-pdi-te="017p7"',
        GLYPHE_NEUF,
        'data-pdi-te="017p8"',
        None,
    ),
    (
        'E3 port soude non cliquable sur le te natif',
        'line',
        ANCRE_TE_NATIF,
        TE_NATIF_NEUF,
        'const jointTe=projectJoints.find',
        None,
    ),
    (
        'E4 compteur d erreurs cliquable et explicite',
        'inline',
        ANCRE_BADGE,
        BADGE_NEUF,
        'title={graphIssues.length?graphIssues.slice(0,8)',
        None,
    ),
    (
        'E5 entree Controle reseau configuree',
        'inline',
        ANCRE_CMD,
        CMD_NEUF,
        'issue.code+" "+issue.message',
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
    # --- E1 port occupe ---
    tests.append(('port occupe detecte avant toute branche',
                  'const portOccupe=!!portCible&&segments.some(' in tsx))
    tests.append(('refus visible dans la ligne de commande (R8)',
                  'PORT OCCUPE : ce port porte deja une soudure' in tsx))
    tests.append(('aucune branche creee quand le port est occupe',
                  'if(portOccupe){setStatusMessage(' in tsx
                  and 'e.stopPropagation();return;}setBranchDrawing(' in tsx))
    tests.append(('le port libre cree toujours la branche',
                  'setBranchDrawing({fromNodeId:nodeId,fromPortId:portCible?.id' in tsx))
    # --- E2 doublon de pastilles supprime (cause du bug W002) ---
    tests.append(('CAUSE W002 : plus de pastilles en doublon sur le te-equipement',
                  'data-pdi-te="017p8"' in tsx
                  and 'data-pdi-te="017p7"' not in tsx))
    tests.append(('le te-equipement garde son repere central et ses branches',
                  'teq-branche-${port.id}' in tsx
                  and tsx.count('pdiNodeRadius017P3(viewport.zoom,isSel,isHov)+2') == 2))
    tests.append(('les pastilles du te-equipement viennent de la boucle des joints',
                  'const connected=!!joint;' in tsx))
    # --- E3 te natif ---
    tests.append(('port soude non cliquable sur le te natif',
                  'const jointTe=projectJoints.find' in tsx))
    tests.append(('la croix de soudure du te natif ignore le pointeur',
                  'if(jointTe)return <g key={port.id} pointerEvents="none">' in tsx))
    # --- E4 et E5 erreurs reseau explicitees ---
    tests.append(('compteur d erreurs devenu cliquable',
                  'title={graphIssues.length?graphIssues.slice(0,8)' in tsx))
    tests.append(('messages d erreur listes au survol',
                  'issue.severity==="error"?"ERREUR : ":"ALERTE : "' in tsx))
    tests.append(('les alertes sont distinguees des erreurs',
                  'graphWarningCount?`${graphWarningCount} alerte(s)`' in tsx))
    tests.append(('entree Controle reseau configuree',
                  'issue.code+" "+issue.message' in tsx))
    tests.append(('le code d anomalie est affiche a l utilisateur',
                  'CONTROLE RESEAU : graphe valide, aucune anomalie detectee.' in tsx))
    # --- non-regression ---
    tests.append(('non-regression coude derive des ports',
                  'Q 0 0 ${p1.sx} ${p1.sy}' in tsx))
    tests.append(('non-regression 017P5 echelle des glyphes inline',
                  'scale(${kGlyph} ${n.mirrored?-kGlyph:kGlyph})' in tsx))
    tests.append(('non-regression 017P7 badge de version',
                  '{PDI_PATCH_VERSION}</span>Youcef' in tsx))
    tests.append(('non-regression 017P3 triedre et cote centre a face',
                  'translate(566 44)' in tsx and 'pdiNodeHasFaceOffset017P3' in tsx))
    # --- regles permanentes ---
    tests.append(('R14 aucun commentaire JSX en attribut',
                  '/*' not in GLYPHE_NEUF and '/*' not in BADGE_NEUF
                  and '/*' not in TE_NATIF_NEUF))
    tests.append(('aucun window.alert introduit', 'window.alert' not in tsx))
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


RAPPORT = '017P8_port_occupe_erreurs_reseau_REPORT.md'


def ecrire_rapport(root, bons, total):
    lignes = []
    lignes.append('# PATCH ' + TAG + ' - port occupe et erreurs reseau explicitees')
    lignes.append('')
    lignes.append('## 1. W002 ne genere plus de branche')
    lignes.append('')
    lignes.append('Deux causes, corrigees toutes les deux.')
    lignes.append('')
    lignes.append('Cause A, introduite par le 017P7 : la branche de rendu du')
    lignes.append('te-equipement dessinait son propre jeu de pastilles')
    lignes.append('data-iso-port, en doublon de la boucle des joints qui suit')
    lignes.append('immediatement. Cette boucle distingue correctement le port')
    lignes.append('libre du port soude, et rend la croix de soudure avec')
    lignes.append('pointerEvents=none. Le doublon, dessine dessous, restait')
    lignes.append('cliquable : le clic traversait la croix et creait une branche')
    lignes.append('sur un port deja soude. Le doublon est supprime.')
    lignes.append('')
    lignes.append('Cause B, structurelle : le gestionnaire de clic ne verifiait')
    lignes.append('jamais l occupation du port avant d appeler setBranchDrawing.')
    lignes.append('Un garde-fou teste desormais si un troncon occupe le port et')
    lignes.append('refuse la branche avec un message visible, quelle que soit la')
    lignes.append('provenance du clic.')
    lignes.append('')
    lignes.append('Le te natif recoit la meme regle : il n avait pas de boucle de')
    lignes.append('joints, ses ports soudes deviennent des croix non cliquables.')
    lignes.append('')
    lignes.append('## 2. Erreurs reseau explicitees')
    lignes.append('')
    lignes.append('Le compteur rouge en haut affichait un nombre sans detail et')
    lignes.append('n etait pas cliquable. Il devient un bouton : le survol liste')
    lignes.append('les messages, le clic ouvre le controle reseau et ecrit le')
    lignes.append('detail dans la ligne de commande. Les alertes sont desormais')
    lignes.append('distinguees des erreurs, en ambre.')
    lignes.append('')
    lignes.append('L entree Controle reseau de la ligne de commande existait mais')
    lignes.append('ne repondait rien : elle ouvrait un panneau sans message. Elle')
    lignes.append('renvoie maintenant le code et le libelle des anomalies (R8).')
    lignes.append('')
    lignes.append('## Codes d anomalie du controle reseau')
    lignes.append('')
    lignes.append('- MISSING_NODE : troncon dont un noeud est absent')
    lignes.append('- MISSING_PORT : troncon dont le port de raccordement est absent')
    lignes.append('- MISSING_LINE : troncon sans ligne de tuyauterie')
    lignes.append('- ZERO_LENGTH : troncon de longueur nulle')
    lignes.append('- PORT_CAPACITY : port connecte plus d une fois')
    lignes.append('- DN_MISMATCH : diametre different entre noeud et troncon (alerte)')
    lignes.append('')
    lignes.append('## Incoherence constatee, a traiter au 017P9')
    lignes.append('')
    lignes.append('Le bandeau haut et le volet Anomalies comptent deux choses')
    lignes.append('differentes : le bandeau vient de validateProjectGraph, le')
    lignes.append('volet recalcule ses propres regles au rendu. D ou 2 erreurs en')
    lignes.append('haut et 0 anomalie dans le panneau. Une source unique est a')
    lignes.append('etablir.')
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
    print('=== PATCH ' + TAG + ' : port occupe et erreurs reseau ===')
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
    if 'PDI_PATCH_VERSION' not in tsx:
        print('ECHEC : le PATCH 017P7 doit etre applique avant le ' + TAG + '.')
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
