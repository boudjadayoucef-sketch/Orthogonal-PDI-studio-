# -*- coding: utf-8 -*-
# PATCH 017J - PD&I : palette Ctrl+K lisible + debranding categorie A
# A. Palette de commandes Ctrl+K et modale Raccourcis passees en theme sombre.
#    Les pastilles claires (bg-white, bg-slate-50, bg-amber-50, bg-cyan-50,
#    bg-emerald-50, bg-red-50) etaient illisibles sur fond sombre.
# B. Nouveau module src/pdi/branding/pdiBranding.ts (cle pdi.branding.v1).
# C. Cartouche et entetes d impression debrandes (R15) + note normative.
# D. Mot de passe en dur supprime (R18) : variable d environnement au build.
# E. Migration sonelgaz_user_profile -> pdi.userProfile.v1 avec repli lecture.
# S applique APRES 017I3. Idempotent (R1). Sauvegardes .before017J. Rapport.
import io, os, sys, shutil

ROOT = os.getcwd()
ENG = os.path.join(ROOT, "src/pdi/isometric/engine/IsometrieModuleV48d.tsx")
LEG = os.path.join(ROOT, "src/GuideLegacyApp.tsx")
BRD_DIR = os.path.join(ROOT, "src/pdi/branding")
BRD = os.path.join(BRD_DIR, "pdiBranding.ts")
REPORT = os.path.join(ROOT, "017J_palette_lisible_branding_secret_REPORT.md")

for p in (ENG, LEG):
    if not os.path.exists(p):
        print("ECHEC : fichier absent " + p)
        sys.exit(1)

log = []
checks = []
warn = []


def backup(path):
    b = path + ".before017J"
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
backup(LEG)
eng = read(ENG)
leg = read(LEG)

if "PATCH 017I3" not in read(os.path.join(ROOT, "src/pdi/isometric/components/CadCommandLineBar.tsx")):
    print("ECHEC : appliquer 017I3 avant 017J")
    sys.exit(1)

# =======================================================================
# A. Palette Ctrl+K et modale Raccourcis : theme sombre
# =======================================================================
SLICE_START = '{commandPaletteOpen&&<div className="fixed inset-0 z-[10000]'
SLICE_END = '    <div className={`${workspaceFullscreen?"hidden":""} bg-slate-950'

i0 = eng.find(SLICE_START)
i1 = eng.find(SLICE_END, i0 + 1) if i0 >= 0 else -1
if i0 < 0 or i1 < 0:
    print("ECHEC : tranche palette introuvable")
    sys.exit(1)

sl = eng[i0:i1]

PALETTE_SWAPS = [
    # Conteneur de la palette
    ('bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden',
     'bg-slate-900 text-slate-100 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden'),
    ('className="px-4 py-3 border-b"', 'className="px-4 py-3 border-b border-slate-700"'),
    ('text-[10px] font-black text-blue-600 uppercase', 'text-[10px] font-black text-cyan-400 uppercase'),
    ('className="text-sm font-bold mt-1"', 'className="text-sm font-bold mt-1 text-slate-100"'),
    # Pastilles d actions
    ('bg-slate-50 hover:bg-blue-50',
     'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'),
    ('bg-cyan-50 hover:bg-cyan-100',
     'bg-cyan-950 hover:bg-cyan-900 text-cyan-100 border border-cyan-800'),
    ('bg-amber-50 hover:bg-amber-100',
     'bg-amber-950 hover:bg-amber-900 text-amber-100 border border-amber-800'),
    ('bg-emerald-50 hover:bg-emerald-100',
     'bg-emerald-950 hover:bg-emerald-900 text-emerald-100 border border-emerald-800'),
    ('bg-red-50 hover:bg-red-100',
     'bg-red-950 hover:bg-red-900 text-red-100 border border-red-800'),
    # Modale Raccourcis
    ('bg-white rounded-2xl shadow-2xl border w-[min(720px,95vw)] p-5',
     'bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700 w-[min(720px,95vw)] p-5'),
    ('className="flex items-center gap-2 p-2 rounded-lg bg-slate-50"',
     'className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 border border-slate-700"'),
    ('className="px-2 py-1 bg-white border rounded font-mono font-black"',
     'className="px-2 py-1 bg-slate-950 border border-slate-700 text-cyan-300 rounded font-mono font-black"'),
    ('className="text-slate-500"', 'className="text-slate-300 hover:text-white"'),
]

if "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700" in sl:
    log.append("DEJA : palette Ctrl+K en theme sombre")
else:
    total = 0
    for old, new in PALETTE_SWAPS:
        n = sl.count(old)
        if n:
            sl = sl.replace(old, new)
            total += n
    if total == 0:
        print("ECHEC : aucune classe claire trouvee dans la palette")
        sys.exit(1)
    eng = eng[:i0] + sl + eng[i1:]
    log.append("APPLIQUE : palette Ctrl+K et modale Raccourcis, %d classes claires remplacees" % total)

checks.append(("palette en theme sombre", 'bg-slate-800 hover:bg-slate-700 text-slate-100' in eng))
# Verification limitee a la tranche de la palette : les panneaux lateraux clairs
# sont un autre chantier (017M), ils ne doivent pas faire echouer ce contexte.
checks.append(("plus de pastille claire dans la palette", "bg-white" not in sl))

# =======================================================================
# B. Module de branding
# =======================================================================
B = []
B.append("// PATCH 017J - Identite du produit et des cartouches.")
B.append("// PD&I est un produit generique a standards internationaux : aucune marque")
B.append("// client ne doit etre ecrite en dur dans le code (regle R15).")
B.append("")
B.append('export const PDI_BRANDING_KEY = "pdi.branding.v1";')
B.append('export const PDI_BRANDING_FALLBACK_COMPANY = "Societe non renseignee";')
B.append("")
B.append("export type PdiBranding = {")
B.append("  companyName: string;")
B.append("  companyLogo: string;")
B.append("  projectOwner: string;")
B.append("  approverLabel: string;")
B.append("  documentPrefix: string;")
B.append("  standardsNote: string;")
B.append("};")
B.append("")
B.append("export const PDI_DEFAULT_BRANDING: PdiBranding = {")
B.append('  companyName: "",')
B.append('  companyLogo: "",')
B.append('  projectOwner: "",')
B.append('  approverLabel: "Approuve par",')
B.append('  documentPrefix: "PDI",')
B.append('  standardsNote: "ASME B31.3 / B31.8 - EN 13480 - ISO 6708",')
B.append("};")
B.append("")
B.append("export function pdiLoadBranding(): PdiBranding {")
B.append("  try {")
B.append("    const raw = localStorage.getItem(PDI_BRANDING_KEY);")
B.append("    if (!raw) return { ...PDI_DEFAULT_BRANDING };")
B.append("    const parsed = JSON.parse(raw) as Partial<PdiBranding>;")
B.append("    return { ...PDI_DEFAULT_BRANDING, ...parsed };")
B.append("  } catch {")
B.append("    return { ...PDI_DEFAULT_BRANDING };")
B.append("  }")
B.append("}")
B.append("")
B.append("export function pdiSaveBranding(next: Partial<PdiBranding>): PdiBranding {")
B.append("  const merged = { ...pdiLoadBranding(), ...next };")
B.append("  try {")
B.append("    localStorage.setItem(PDI_BRANDING_KEY, JSON.stringify(merged));")
B.append("  } catch {")
B.append("    // Stockage indisponible : l identite reste celle de la session.")
B.append("  }")
B.append("  return merged;")
B.append("}")
B.append("")
B.append("// Nom a imprimer dans un cartouche ISO 7200. Jamais de chaine vide :")
B.append("// un cartouche sans proprietaire est non conforme.")
B.append("export function pdiCompanyName(): string {")
B.append("  const name = pdiLoadBranding().companyName.trim();")
B.append("  return name || PDI_BRANDING_FALLBACK_COMPANY;")
B.append("}")
B.append("")
B.append("export function pdiStandardsNote(): string {")
B.append("  const note = pdiLoadBranding().standardsNote.trim();")
B.append("  return note || PDI_DEFAULT_BRANDING.standardsNote;")
B.append("}")
B.append("")
B.append("export function pdiDocumentPrefix(): string {")
B.append("  const p = pdiLoadBranding().documentPrefix.trim();")
B.append('  return p || PDI_DEFAULT_BRANDING.documentPrefix;')
B.append("}")

if not os.path.isdir(BRD_DIR):
    os.makedirs(BRD_DIR)
if os.path.exists(BRD) and "PDI_BRANDING_KEY" in read(BRD):
    log.append("DEJA : module pdiBranding.ts")
else:
    write(BRD, "\n".join(B) + "\n")
    log.append("APPLIQUE : module src/pdi/branding/pdiBranding.ts")
checks.append(("module de branding present", os.path.exists(BRD) and "pdiCompanyName" in read(BRD)))

# =======================================================================
# C. Import + cartouche debrandee
# =======================================================================
ANCHOR_IMPORT = 'import { onAuthStateChanged } from "firebase/auth";'
NEW_IMPORT = "\n".join([
    ANCHOR_IMPORT,
    "// PATCH 017J : identite de cartouche parametrable (R15).",
    'import { pdiCompanyName, pdiStandardsNote } from "../../branding/pdiBranding";',
])
if "pdiBranding" in eng:
    log.append("DEJA : import du module de branding")
elif ANCHOR_IMPORT in eng:
    eng = eng.replace(ANCHOR_IMPORT, NEW_IMPORT, 1)
    log.append("APPLIQUE : import du module de branding")
else:
    print("ECHEC : ancre d import introuvable")
    sys.exit(1)
checks.append(("import branding", 'from "../../branding/pdiBranding"' in eng))

BRAND_SWAPS = [
    ('<h1>SONELGAZ \u2014 SCH\u00c9MA ISOM\u00c9TRIQUE M\u00c9CANIQUE</h1>',
     '<h1>${pdiCompanyName()} \u2014 SCH\u00c9MA ISOM\u00c9TRIQUE M\u00c9CANIQUE</h1>'),
    ('<div class="cartouche-title">SONELGAZ \u2014 GAZODUC</div>',
     '<div class="cartouche-title">${pdiCompanyName()}</div>'),
    ('\u00c9diteur isom\u00e9trique tuyauterie \u00b7 Conforme standards Sonelgaz \u00b7 Format A3 paysage',
     '\u00c9diteur isom\u00e9trique tuyauterie \u00b7 ${pdiStandardsNote()} \u00b7 Format A3 paysage'),
]
brand_done = 0
brand_new = 0
for old, new in BRAND_SWAPS:
    if new in eng:
        brand_done += 1
    elif old in eng:
        eng = eng.replace(old, new, 1)
        brand_done += 1
        brand_new += 1
    else:
        warn.append("ancre de cartouche non trouvee : " + old[:48])
if brand_done != len(BRAND_SWAPS):
    log.append("PARTIEL : cartouche debrandee %d/%d" % (brand_done, len(BRAND_SWAPS)))
elif brand_new == 0:
    log.append("DEJA : cartouche, entete et pied de planche debrandes")
else:
    log.append("APPLIQUE : cartouche, entete et pied de planche debrandes (3/3)")
checks.append(("cartouche debrandee", '${pdiCompanyName()}</div>' in eng))
checks.append(("entete de planche debrandee", 'SONELGAZ \u2014 SCH\u00c9MA' not in eng))
checks.append(("pied de planche normatif", '${pdiStandardsNote()}' in eng))

# =======================================================================
# E1. Migration de la cle de profil dans le moteur
# =======================================================================
OLD_PROF = 'const raw=localStorage.getItem("sonelgaz_user_profile");'
NEW_PROF = ('const raw=localStorage.getItem("pdi.userProfile.v1")'
            '||localStorage.getItem("sonelgaz_user_profile");')
if 'localStorage.getItem("pdi.userProfile.v1")' in eng:
    log.append("DEJA : lecture de profil migree (moteur)")
elif OLD_PROF in eng:
    eng = eng.replace(OLD_PROF, NEW_PROF, 1)
    log.append("APPLIQUE : lecture de profil migree avec repli (moteur)")
else:
    warn.append("ancre de profil non trouvee dans le moteur")
checks.append(("profil migre (moteur)", 'localStorage.getItem("pdi.userProfile.v1")' in eng))

write(ENG, eng)

# =======================================================================
# D. Secret en dur + E2. profil dans GuideLegacyApp
# =======================================================================
OLD_PWD = 'const isSuperAdminPassword = password === "Sonelgaz2026!" || password === "Sonelgaz2026";'
NEW_PWD = "\n".join([
    "    // PATCH 017J : plus aucun mot de passe en dur (R18). Le compte de secours",
    "    // n existe que si VITE_PDI_ADMIN_PASSWORD est fourni au moment du build,",
    "    // et il doit faire au moins 12 caracteres.",
    "    const pdiAdminSecret017J = String(",
    "      ((import.meta as unknown as { env?: Record<string, string> }).env || {})",
    "        .VITE_PDI_ADMIN_PASSWORD || \"\",",
    "    ).trim();",
    "    const isSuperAdminPassword =",
    "      pdiAdminSecret017J.length >= 12 && password === pdiAdminSecret017J;",
])
if "pdiAdminSecret017J" in leg:
    log.append("DEJA : mot de passe en dur supprime")
elif OLD_PWD in leg:
    leg = leg.replace(OLD_PWD, NEW_PWD.lstrip(), 1)
    log.append("APPLIQUE : mot de passe en dur supprime (R18)")
else:
    warn.append("ancre du mot de passe en dur non trouvee")

# Message d aide qui divulguait les identifiants.
OLD_MSG = "l'adresse boudjada.youcef@gmail.com avec le mot de passe Sonelgaz2026!."
NEW_MSG = "un compte administrateur declare dans votre console Firebase."
if NEW_MSG in leg:
    log.append("DEJA : message d aide sans identifiants")
elif OLD_MSG in leg:
    leg = leg.replace(OLD_MSG, NEW_MSG, 1)
    log.append("APPLIQUE : message d aide sans identifiants")
elif "Sonelgaz2026" in leg:
    leg = leg.replace("Sonelgaz2026!", "[defini au deploiement]")
    leg = leg.replace("Sonelgaz2026", "[defini au deploiement]")
    log.append("APPLIQUE : mentions residuelles du secret neutralisees")
else:
    log.append("DEJA : aucune mention du secret")

# Domaine de messagerie client en dur.
OLD_DOM = 'targetEmail = targetEmail + "@sonelgaz.dz";'
NEW_DOM = "\n".join([
    "      // PATCH 017J : domaine de messagerie parametrable, plus de domaine client.",
    "      const pdiMailDomain017J = String(",
    "        ((import.meta as unknown as { env?: Record<string, string> }).env || {})",
    "          .VITE_PDI_EMAIL_DOMAIN || \"\",",
    "      ).trim();",
    "      targetEmail = pdiMailDomain017J ? targetEmail + \"@\" + pdiMailDomain017J : targetEmail;",
])
if "pdiMailDomain017J" in leg:
    log.append("DEJA : domaine de messagerie parametrable")
elif OLD_DOM in leg:
    leg = leg.replace(OLD_DOM, NEW_DOM.lstrip(), 1)
    log.append("APPLIQUE : domaine de messagerie parametrable")
else:
    warn.append("ancre du domaine de messagerie non trouvee")

# Cle de profil.
if 'localStorage.getItem("pdi.userProfile.v1")' in leg:
    log.append("DEJA : cle de profil migree (plateforme)")
else:
    leg = leg.replace(
        'const saved = localStorage.getItem("sonelgaz_user_profile");',
        'const saved = localStorage.getItem("pdi.userProfile.v1")\n'
        '        || localStorage.getItem("sonelgaz_user_profile");',
        1,
    )
    leg = leg.replace(
        'localStorage.setItem("sonelgaz_user_profile", JSON.stringify(userProfile));',
        'localStorage.setItem("pdi.userProfile.v1", JSON.stringify(userProfile));',
        1,
    )
    leg = leg.replace(
        'localStorage.removeItem("sonelgaz_user_profile");',
        'localStorage.removeItem("pdi.userProfile.v1");\n'
        '        localStorage.removeItem("sonelgaz_user_profile");',
        1,
    )
    log.append("APPLIQUE : cle de profil migree vers pdi.userProfile.v1")

checks.append(("secret supprime", "Sonelgaz2026" not in leg))
checks.append(("profil migre (plateforme)", 'localStorage.setItem("pdi.userProfile.v1"' in leg))
checks.append(("domaine parametrable", '"@sonelgaz.dz"' not in leg))

write(LEG, leg)

# =======================================================================
# RAPPORT
# =======================================================================
R = []
R.append("# PATCH 017J - palette Ctrl+K lisible, debranding categorie A, secret supprime")
R.append("")
R.append("## Operations")
for line in log:
    R.append("- " + line)
if warn:
    R.append("")
    R.append("## Avertissements")
    for w in warn:
        R.append("- " + w)
R.append("")
R.append("## Verifications")
for name, okv in checks:
    R.append("- [%s] %s" % ("x" if okv else " ", name))
R.append("")
R.append("## A. Palette Ctrl+K")
R.append("La palette etait un panneau **blanc** herite de la V4.6, avec des pastilles")
R.append("`bg-slate-50`, `bg-cyan-50`, `bg-amber-50`, `bg-emerald-50` et `bg-red-50` :")
R.append("du texte sombre sur fond quasi blanc, dans une application desormais sombre.")
R.append("Ces pastilles n etaient pas desactivees, seulement **illisibles**. Tout est")
R.append("passe en theme sombre avec bordures explicites, y compris la modale Raccourcis")
R.append("et ses touches clavier.")
R.append("")
R.append("## B, C. Identite parametrable")
R.append("`src/pdi/branding/pdiBranding.ts` centralise l identite sous `pdi.branding.v1` :")
R.append("nom de societe, logo, maitre d ouvrage, libelle d approbation, prefixe de")
R.append("document, note normative. Repli **ISO 7200** : un cartouche ne peut pas etre")
R.append("vide, il affiche `Societe non renseignee` tant que rien n est saisi.")
R.append("Les trois mentions en dur de l impression ISO passent par ce module.")
R.append("")
R.append("## D. Secret retire")
R.append("`password === \"Sonelgaz2026!\"` etait un mot de passe super-administrateur en")
R.append("clair dans le source livre au navigateur : n importe qui pouvait le lire dans")
R.append("le bundle. Il est remplace par `VITE_PDI_ADMIN_PASSWORD`, exigee a 12")
R.append("caracteres minimum, **absente par defaut** : sans variable, aucun compte de")
R.append("secours n existe. Le message d aide qui affichait l adresse et le mot de passe")
R.append("est neutralise, et le domaine `@sonelgaz.dz` devient `VITE_PDI_EMAIL_DOMAIN`.")
R.append("")
R.append("## E. Migration de profil")
R.append("`sonelgaz_user_profile` devient `pdi.userProfile.v1`. La lecture tente la")
R.append("nouvelle cle puis **retombe sur l ancienne** : aucune session existante n est")
R.append("perdue. L ecriture n utilise plus que la nouvelle cle, la suppression nettoie")
R.append("les deux.")
R.append("")
R.append("## Hors perimetre, assume")
R.append("L ecran de saisie *Identite et cartouche* n est pas inclus : construire un")
R.append("formulaire maintenant, puis le redeplacer dans le ruban en 017M, serait faire")
R.append("le travail deux fois. Les valeurs sont deja lues et respectees ; seule la")
R.append("saisie graphique arrive avec le ruban. Categorie B (134 occurrences metier)")
R.append("reste traitee en 017K selon R22 : debrander sans desactiver.")
R.append("")
R.append("## Tests")
R.append("1. `Ctrl+K` : toutes les pastilles sont lisibles, fond sombre et texte clair.")
R.append("   Verifier notamment `M - Cotation 2 ancrages`, `AT - Equipement sur tube`,")
R.append("   `// - Rendre parallele`, `ISO - Redresser ISO` et `Suppr. derniere cote`.")
R.append("2. `?` ou le bouton Raccourcis : la modale est sombre, les touches lisibles.")
R.append("3. Chaque bouton de la palette declenche toujours son action.")
R.append("4. `P` ou Impression : le cartouche affiche `Societe non renseignee` au lieu")
R.append("   d une marque, et le pied de page la note normative ASME / EN / ISO.")
R.append("5. Console : `localStorage.setItem(\"pdi.branding.v1\", JSON.stringify({companyName:")
R.append("   \"Ma Societe\"}))` puis reimprimer : le cartouche affiche Ma Societe.")
R.append("6. Deconnexion / reconnexion : la session est conservee, la cle")
R.append("   `pdi.userProfile.v1` apparait dans le stockage local.")
R.append("7. Recherche `Sonelgaz2026` dans les sources : plus aucun resultat.")
write(REPORT, "\n".join(R) + "\n")

print("=== PATCH 017J ===")
for line in log:
    print("  " + line)
for w in warn:
    print("  ATTENTION : " + w)
nb = sum(1 for _, v in checks if v)
print("VERIFICATIONS : %d/%d" % (nb, len(checks)))
for name, okv in checks:
    print("  [%s] %s" % ("x" if okv else " ", name))
print("RAPPORT : " + REPORT)
if nb != len(checks):
    sys.exit(1)
