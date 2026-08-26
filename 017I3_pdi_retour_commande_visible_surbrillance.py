# -*- coding: utf-8 -*-
# PATCH 017I3 - PD&I
# 1. RETOUR DE COMMANDE VISIBLE : le texte de reponse (autocadPrompt) n etait
#    rendu que dans le bloc { cadDraftSession && ... }. Hors session de dessin,
#    AUCUNE commande n affichait sa reponse : PERF, SAUVER, RESTAURER, TAG,
#    RENUMBER... toutes muettes. Zone de retour desormais permanente.
# 2. SURBRILLANCE MOINS OPAQUE : halo de selection et de survol des troncons
#    allege (largeur et opacite), le tube et sa couleur de service restent lisibles.
# S applique APRES 017I2. Idempotent (R1). Sauvegardes .before017I3. Rapport.
import io, os, sys, shutil

ROOT = os.getcwd()
ENG = os.path.join(ROOT, "src/pdi/isometric/engine/IsometrieModuleV48d.tsx")
BAR = os.path.join(ROOT, "src/pdi/isometric/components/CadCommandLineBar.tsx")
REPORT = os.path.join(ROOT, "017I3_retour_commande_visible_surbrillance_REPORT.md")

for p in (ENG, BAR):
    if not os.path.exists(p):
        print("ECHEC : fichier absent " + p)
        sys.exit(1)

log = []
checks = []


def backup(path):
    b = path + ".before017I3"
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
backup(BAR)
eng = read(ENG)
bar = read(BAR)

if "nodeProjection017I2" not in eng:
    print("ECHEC : appliquer 017I2 avant 017I3")
    sys.exit(1)

# =======================================================================
# 1. Zone de retour de commande permanente
# =======================================================================
ANCHOR_BAR = "\n".join([
    "        {/* Dynamic prompt and active session indicator */}",
    "        {cadDraftSession && (",
])

BLOCK_BAR = "\n".join([
    "        {/* PATCH 017I3 : retour de commande permanent. Auparavant le prompt",
    "            n etait affiche que pendant une session de dessin, donc toute",
    "            commande qui repond par un texte restait muette. */}",
    "        {!cadDraftSession && prompt && (",
    "          <div",
    '            className="hidden md:flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-lg shrink-0 max-w-[42%]"',
    "            title={prompt}",
    "          >",
    '            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />',
    '            <span className="text-slate-200 truncate font-semibold text-[10px] font-mono">',
    "              {prompt}",
    "            </span>",
    "          </div>",
    "        )}",
    "",
    ANCHOR_BAR,
])

if "PATCH 017I3" in bar:
    log.append("DEJA : zone de retour de commande permanente")
elif ANCHOR_BAR in bar:
    bar = bar.replace(ANCHOR_BAR, BLOCK_BAR, 1)
    write(BAR, bar)
    log.append("APPLIQUE : zone de retour de commande permanente")
else:
    print("ECHEC : ancre CadCommandLineBar introuvable")
    sys.exit(1)
checks.append(("retour de commande permanent", "{!cadDraftSession && prompt && (" in bar))

# =======================================================================
# 2. Surbrillance de selection et de survol allegee
# =======================================================================
OLD_SEL = ('{sel&&<path d={path} stroke="#38bdf8" strokeWidth={width+8} strokeOpacity=".35" '
           'strokeLinecap="round" strokeLinejoin="round" fill="none"/>}')
NEW_SEL = ('{sel&&<path d={path} stroke="#38bdf8" strokeWidth={width+5} strokeOpacity=".16" '
           'strokeLinecap="round" strokeLinejoin="round" fill="none"/>}')

OLD_HOV = ('{hoveredEntity?.type==="segment"&&hoveredEntity.id===s.id&&!sel&&<path d={path} '
           'stroke="#67e8f9" strokeWidth={width+4} strokeOpacity=".3" strokeLinecap="round" '
           'strokeLinejoin="round" fill="none"/>}')
NEW_HOV = ('{hoveredEntity?.type==="segment"&&hoveredEntity.id===s.id&&!sel&&<path d={path} '
           'stroke="#67e8f9" strokeWidth={width+3} strokeOpacity=".12" strokeLinecap="round" '
           'strokeLinejoin="round" fill="none"/>}')

if 'strokeOpacity=".16"' in eng:
    log.append("DEJA : surbrillance selection allegee")
elif OLD_SEL in eng:
    eng = eng.replace(OLD_SEL, NEW_SEL, 1)
    log.append("APPLIQUE : surbrillance selection 0.35 -> 0.16, largeur +8 -> +5")
else:
    print("ECHEC : ancre surbrillance selection introuvable")
    sys.exit(1)
checks.append(("selection allegee", 'strokeOpacity=".16"' in eng))

if 'strokeOpacity=".12"' in eng:
    log.append("DEJA : surbrillance survol allegee")
elif OLD_HOV in eng:
    eng = eng.replace(OLD_HOV, NEW_HOV, 1)
    log.append("APPLIQUE : surbrillance survol 0.30 -> 0.12, largeur +4 -> +3")
else:
    print("ECHEC : ancre surbrillance survol introuvable")
    sys.exit(1)
checks.append(("survol allege", 'strokeOpacity=".12"' in eng))

# Halo blanc des raccords : 0.96 etait quasi opaque.
OLD_FIT = '{isFitSel&&<circle r="19" fill="#ffffff" stroke="#ffffff" strokeWidth="6" opacity=".96"/>}'
NEW_FIT = '{isFitSel&&<circle r="17" fill="#ffffff" stroke="#ffffff" strokeWidth="4" opacity=".28"/>}'
if OLD_FIT in eng:
    eng = eng.replace(OLD_FIT, NEW_FIT, 1)
    log.append("APPLIQUE : halo des raccords 0.96 -> 0.28")
else:
    log.append("DEJA : halo des raccords allege")
checks.append(("halo raccords allege", 'opacity=".28"/>}' in eng))

write(ENG, eng)

# =======================================================================
# RAPPORT
# =======================================================================
R = []
R.append("# PATCH 017I3 - retour de commande visible, surbrillance allegee")
R.append("")
R.append("## Operations")
for line in log:
    R.append("- " + line)
R.append("")
R.append("## Verifications")
for name, okv in checks:
    R.append("- [%s] %s" % ("x" if okv else " ", name))
R.append("")
R.append("## Cause du defaut PERF")
R.append("Tu n as pas mal compris : **PERF fonctionnait, sa reponse etait invisible.**")
R.append("Dans `CadCommandLineBar.tsx`, le texte `prompt` etait rendu a l interieur du")
R.append("bloc `{cadDraftSession && ( ... )}`. Hors session de dessin, aucune reponse")
R.append("n etait affichee. Le defaut ne touchait pas seulement PERF : **toutes** les")
R.append("commandes qui repondent par un texte etaient muettes (SAUVER, RESTAURER, TAG,")
R.append("RENUMBER, AUTOTAG, SPEC, SERVICE, STYLE, EPAISSEUR...). C est un manquement de")
R.append("fait a R8 : une commande dispatchee dont l utilisateur ne voit pas le resultat")
R.append("est indistinguable d une commande morte.")
R.append("")
R.append("## Correctifs")
R.append("1. Zone de retour **permanente** dans la barre de commande, a gauche du champ")
R.append("   de saisie : puce cyan + texte tronque + infobulle contenant le message")
R.append("   complet. L indicateur de session de dessin reste inchange quand une session")
R.append("   est active, il n y a donc jamais deux blocs concurrents.")
R.append("2. Surbrillance des troncons : selection `+8 px / opacite 0.35` devient")
R.append("   `+5 px / 0.16` ; survol `+4 px / 0.30` devient `+3 px / 0.12`. La couleur de")
R.append("   service du tube et les reperes de soudure redeviennent lisibles sous le halo.")
R.append("3. Halo blanc des raccords : opacite 0.96 (quasi opaque) ramenee a 0.28.")
R.append("")
R.append("## Tests")
R.append("1. Tapez `PERF` : la reponse s affiche **maintenant** a gauche du champ CMD,")
R.append("   avec le nombre de noeuds, la taille du cache en octets et la duree en ms.")
R.append("   Survolez le texte pour voir le message complet en infobulle.")
R.append("2. Tapez `SAUVER` puis `STYLE` puis `EPAISSEUR 1.5` : chaque commande affiche")
R.append("   sa reponse. Plus aucune commande muette.")
R.append("3. Selectionnez un troncon : le halo est discret, la couleur de service et les")
R.append("   reperes de soudure W001 a W005 restent parfaitement lisibles.")
R.append("4. Survolez un troncon non selectionne : le halo de survol est visible mais tres")
R.append("   leger, et se distingue nettement de la selection.")
R.append("5. Lancez une session de dessin (`T` pour un tube) : l indicateur `[SEGMENT]`")
R.append("   clignotant reapparait comme avant, sans doublon avec la zone de retour.")
write(REPORT, "\n".join(R) + "\n")

print("=== PATCH 017I3 ===")
for line in log:
    print("  " + line)
nb = sum(1 for _, v in checks if v)
print("VERIFICATIONS : %d/%d" % (nb, len(checks)))
for name, okv in checks:
    print("  [%s] %s" % ("x" if okv else " ", name))
print("RAPPORT : " + REPORT)
if nb != len(checks):
    sys.exit(1)
