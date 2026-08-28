#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PATCH 017L - PD&I
  1. Saisies d exemple supprimees (8" Constantine, ligne par defaut)
  2. Impression sans CDN externe : la fenetre reutilise la feuille de style
     de l application au lieu de telecharger Tailwind 2.2.19 chez un tiers
  3. Porte des droits pdiCan() introduite
  4. Route /api/gemini/chat protegee par requireAuth
  5. Dernier plancher silencieux de la saisie de longueur
Idempotent. Sauvegarde .before017L. Socle d integrite R29.
"""
import os, sys, hashlib, tempfile, zlib

PATCH = "017L"
SUFFIXE = ".before017L"
OK = [0]
KO = [0]

def note(cond, libelle):
    if cond:
        OK[0] += 1
        print("  OK    " + libelle)
    else:
        KO[0] += 1
        print("  ECHEC " + libelle)

# ---------------------------------------------------------------- socle R29
ENTETES_ZLIB = (b"\x78\x01", b"\x78\x5e", b"\x78\x9c", b"\x78\xda")

def _reparer(data):
    """Recolle un fichier dont la queue a ete transformee en flux zlib."""
    try:
        return data.decode("utf-8"), False
    except UnicodeDecodeError as e:
        base = e.start
    for delta in range(-16, 17):
        pos = base + delta
        if pos < 0 or pos + 2 > len(data):
            continue
        if data[pos:pos + 2] not in ENTETES_ZLIB:
            continue
        try:
            out = zlib.decompressobj(15).decompress(data[pos:])
            txt = (data[:pos] + out).decode("utf-8")
            return txt, True
        except Exception:
            continue
    raise SystemExit("ARRET : fichier illisible et non reparable.")

def lire(chemin):
    with open(chemin, "rb") as f:
        data = f.read()
    txt, repare = _reparer(data)
    if repare:
        sauv = chemin + ".beforerepair"
        if not os.path.exists(sauv):
            with open(sauv, "wb") as f:
                f.write(data)
        ecrire(chemin, txt)
        print("  REPARATION " + os.path.basename(chemin))
    return txt

def ecrire(chemin, texte):
    d = os.path.dirname(os.path.abspath(chemin))
    fd, tmp = tempfile.mkstemp(dir=d, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as f:
            f.write(texte)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, chemin)
    except Exception:
        if os.path.exists(tmp):
            os.remove(tmp)
        raise
    with open(chemin, "r", encoding="utf-8", newline="") as f:
        if f.read() != texte:
            raise SystemExit("ARRET : relecture differente de l ecriture.")

def sauvegarder(chemin):
    s = chemin + SUFFIXE
    if not os.path.exists(s):
        with open(chemin, "rb") as a, open(s, "wb") as b:
            b.write(a.read())

def md5(chemin):
    with open(chemin, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()

def remplacer(txt, avant, apres, libelle, attendu=1):
    """Remplacement idempotent : si 'apres' est deja la, on ne touche a rien."""
    if avant not in txt and apres in txt:
        note(True, libelle + " (deja applique)")
        return txt
    n = txt.count(avant)
    if n != attendu:
        note(False, libelle + " : %d occurrence(s), %d attendue(s)" % (n, attendu))
        return txt
    note(True, libelle)
    return txt.replace(avant, apres)

# ------------------------------------------------- modules TypeScript crees

MODULE_IMPRESSION = '''// PATCH 017L - feuille de style d impression sans dependance externe
//
// Avant : les fenetres d impression telechargeaient Tailwind 2.2.19 chez
// cdn.jsdelivr.net. Trois problemes : dependance a un tiers dans le chemin
// d impression, derive de version (2.2.19 contre la version de l application),
// et impression impossible hors ligne - bloquant pour la cible desktop.
//
// Apres : la fenetre reutilise la feuille de style DEJA CHARGEE par
// l application. Meme version, aucun telechargement, fonctionne hors ligne.

/**
 * Concatene les regles CSS du document courant.
 * Les feuilles d origine externe levent une SecurityError a la lecture de
 * cssRules : elles sont ignorees sans casser la collecte.
 */
export function pdiFeuilleImpression017L(): string {
  const morceaux: string[] = [];
  const feuilles = Array.from(document.styleSheets || []);
  for (const feuille of feuilles) {
    try {
      const regles = (feuille as CSSStyleSheet).cssRules;
      if (!regles) continue;
      for (let i = 0; i < regles.length; i++) morceaux.push(regles[i].cssText);
    } catch {
      // feuille inaccessible (origine differente) : ignoree volontairement
    }
  }
  return morceaux.join("\\n");
}

/** Style de base applique en plus, commun a toutes les impressions. */
export const PDI_STYLE_IMPRESSION_017L = [
  "@media print { .pdi-no-print { display: none !important; } }",
  "body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
].join("\\n");
'''

MODULE_DROITS = '''// PATCH 017L - porte des droits centrale
//
// Avance du 023. Un seul point de decision pour savoir si un module est
// accessible, au lieu de conditions dispersees. Aujourd hui la porte laisse
// tout passer sauf ce qui est explicitement desactive : elle ne change donc
// aucun comportement existant. Le 023 y branchera les licences.

export type PdiModule017L =
  | "iso"
  | "bom"
  | "impression"
  | "croquis"
  | "vision"
  | "genie_civil"
  | "pack_regional";

/** Modules desactives par defaut. Le pack regional est isole, jamais efface (R22). */
const DESACTIVES_PAR_DEFAUT: PdiModule017L[] = ["pack_regional", "vision"];

const CLE_STOCKAGE = "pdi.droits.v1";

function lireDerogations(): Record<string, boolean> {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    return brut ? (JSON.parse(brut) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

/**
 * Le module est-il accessible ?
 * Regle : autorise, sauf desactivation par defaut non levee explicitement.
 */
export function pdiCan(module: PdiModule017L): boolean {
  const derogations = lireDerogations();
  if (Object.prototype.hasOwnProperty.call(derogations, module)) {
    return derogations[module] === true;
  }
  return !DESACTIVES_PAR_DEFAUT.includes(module);
}

/** Active ou desactive un module pour ce poste. */
export function pdiSetCan017L(module: PdiModule017L, actif: boolean): void {
  try {
    const d = lireDerogations();
    d[module] = actif;
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(d));
  } catch {
    // stockage indisponible : la porte retombe sur les valeurs par defaut
  }
}

/** Liste des modules actuellement ouverts, pour affichage de diagnostic. */
export function pdiModulesOuverts017L(): PdiModule017L[] {
  const tous: PdiModule017L[] = [
    "iso", "bom", "impression", "croquis", "vision", "genie_civil", "pack_regional",
  ];
  return tous.filter(pdiCan);
}
'''

# ------------------------------------------------------------------ chemins
REL_MOTEUR = "src/pdi/isometric/engine/IsometrieModuleV48d.tsx"
REL_PM = "src/components/ProjectManagement.tsx"
REL_CALC = "src/components/Calculators.tsx"
REL_SERVEUR = "server.ts"
REL_MOD_IMP = "src/pdi/impression/pdiImpression017L.ts"
REL_MOD_DROITS = "src/pdi/droits/pdiDroits017L.ts"

# ------------------------------------------------------------------ ancres
CDN = '<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">'
CDN_NEW = '<style>${pdiFeuilleImpression017L()}\n${PDI_STYLE_IMPRESSION_017L}</style>'
IMPORT_IMP = 'import { pdiFeuilleImpression017L, PDI_STYLE_IMPRESSION_017L } from "../pdi/impression/pdiImpression017L";\n'

GEMINI = 'app.post("/api/gemini/chat", async (req, res) => {'
GEMINI_NEW = 'app.post("/api/gemini/chat", requireAuth, async (req: AuthRequest, res) => {'

PLANCHER = 'onChange={e=>setNewLength(Number(e.target.value)||.05)}'
PLANCHER_NEW = 'onChange={e=>{const v=Number(e.target.value);setNewLength(Number.isFinite(v)?v:0);}}'

SOURCE = """const [newSourceName,setNewSourceName]=useState('8" Constantine');"""
SOURCE_NEW = 'const [newSourceName,setNewSourceName]=useState("");'

LIGNE = """lineNumber:'8" Constantine',service:"Gaz naturel",dn:200,nps:'8"',material:"Acier API 5L Gr. B\""""
LIGNE_NEW = 'lineNumber:"",service:"",dn:100,nps:\'4"\',material:""'

# Texte d aide : 8" Constantine est une reference client reelle, interdite par R15.
PLACEHOLDER = """placeholder={'Nom du pipeline / source, ex. 8" Constantine'}"""
PLACEHOLDER_NEW = 'placeholder={"Nom du pipeline ou de la source"}'
PLACEHOLDER2 = """placeholder={'Pipeline source, ex. 8" Constantine'}"""
PLACEHOLDER2_NEW = 'placeholder={"Pipeline source"}'


def ecrire_module(racine, rel, contenu, libelle):
    chemin = os.path.join(racine, rel)
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    if os.path.exists(chemin) and lire(chemin) == contenu:
        note(True, libelle + " (deja present, identique)")
        return
    ecrire(chemin, contenu)
    note(os.path.exists(chemin), libelle)


def ajouter_import(txt, ligne_import):
    if ligne_import.strip() in txt:
        return txt, False
    return ligne_import + txt, True


def main():
    racine = os.getcwd()
    print("=" * 64)
    print("  PATCH " + PATCH + " - saisies, impression, droits, endpoint")
    print("=" * 64)

    print("\n--- 1. Prerequis ---")
    for rel in (REL_MOTEUR, REL_PM, REL_CALC, REL_SERVEUR):
        p = os.path.join(racine, rel)
        if not os.path.exists(p):
            print("ARRET : fichier absent -> " + rel)
            sys.exit(1)
    note(True, "les 4 fichiers cibles sont presents")

    print("\n--- 2. Modules crees ---")
    ecrire_module(racine, REL_MOD_IMP, MODULE_IMPRESSION, "module d impression sans CDN")
    ecrire_module(racine, REL_MOD_DROITS, MODULE_DROITS, "module porte des droits pdiCan()")

    print("\n--- 3. Impression : retrait des 2 CDN externes ---")
    for rel in (REL_PM, REL_CALC):
        p = os.path.join(racine, rel)
        sauvegarder(p)
        t = lire(p)
        t = remplacer(t, CDN, CDN_NEW, "CDN retire de " + os.path.basename(rel))
        t, ajoute = ajouter_import(t, IMPORT_IMP)
        note(IMPORT_IMP.strip() in t, "import present dans " + os.path.basename(rel))
        ecrire(p, t)

    print("\n--- 4. Serveur : /api/gemini/chat protege ---")
    p = os.path.join(racine, REL_SERVEUR)
    sauvegarder(p)
    t = lire(p)
    t = remplacer(t, GEMINI, GEMINI_NEW, "requireAuth ajoute sur /api/gemini/chat")
    ecrire(p, t)

    print("\n--- 5. Moteur : saisies d exemple et plancher silencieux ---")
    p = os.path.join(racine, REL_MOTEUR)
    sauvegarder(p)
    t = lire(p)
    t = remplacer(t, LIGNE, LIGNE_NEW, "ligne d exemple 8\" Constantine neutralisee", attendu=2)
    t = remplacer(t, SOURCE, SOURCE_NEW, "champ 'nom du pipeline' vide au demarrage")
    t = remplacer(t, PLACEHOLDER, PLACEHOLDER_NEW, "texte d aide 1 sans reference client (R15)")
    t = remplacer(t, PLACEHOLDER2, PLACEHOLDER2_NEW, "texte d aide 2 sans reference client (R15)")
    t = remplacer(t, PLANCHER, PLANCHER_NEW, "dernier plancher silencieux retire")
    ecrire(p, t)

    print("\n--- 6. Verifications finales ---")
    moteur = lire(os.path.join(racine, REL_MOTEUR))
    note('8" Constantine' not in moteur, "plus aucune occurrence de 8\" Constantine")
    note('"Gaz naturel"' not in moteur, "plus aucun service 'Gaz naturel' code en dur")
    restes = [l for l in moteur.split(chr(10))
              if "||.05)" in l and not l.strip().startswith("//")]
    note(not restes, "plus aucun plancher silencieux .05 hors commentaire")
    for rel in (REL_PM, REL_CALC):
        note("cdn.jsdelivr.net" not in lire(os.path.join(racine, rel)),
             "aucun CDN dans " + os.path.basename(rel))
    srv = lire(os.path.join(racine, REL_SERVEUR))
    note(srv.count("requireAuth") >= 5, "les 5 routes sont protegees")
    note(os.path.exists(os.path.join(racine, REL_MOD_DROITS)), "pdiCan() disponible")

    print("\n--- 7. Empreintes ---")
    for rel in (REL_MOTEUR, REL_PM, REL_CALC, REL_SERVEUR, REL_MOD_IMP, REL_MOD_DROITS):
        print("  %-58s %s" % (rel, md5(os.path.join(racine, rel))))

    print("\n" + "=" * 64)
    print("  VERIFICATIONS : %d/%d" % (OK[0], OK[0] + KO[0]))
    print("=" * 64)
    sys.exit(1 if KO[0] else 0)


if __name__ == "__main__":
    main()
