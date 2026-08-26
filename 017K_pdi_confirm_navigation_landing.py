# PATCH 017K - PD&I
# A. Fenetre de confirmation PD&I (remplace window.confirm du navigateur)
# B. Fil d Ariane + bouton retour reel a partir du 2e niveau
# C. Onglets projet masques hors contexte projet
# D. Landing : Vision retiree, Croquis renomme Sketch to ISO, impression/export mis en avant
# Idempotent. Cree des sauvegardes .before017K. Ne touche pas server.ts (R20).

import os
import sys

def find_root():
    here = os.path.dirname(os.path.abspath(__file__))
    for cand in (here, os.getcwd()):
        if os.path.exists(os.path.join(cand, "package.json")):
            return cand
    return here

ROOT = find_root()
APP = os.path.join(ROOT, "src/pdi/app/PdiUnifiedApp.tsx")
LAND = os.path.join(ROOT, "src/pdi/landing/PdiLandingV4.tsx")
UIDIR = os.path.join(ROOT, "src/pdi/ui")
CONFIRM = os.path.join(UIDIR, "PdiConfirm.tsx")

print("=== PATCH 017K ===")
print("  RACINE : " + ROOT)

for f in (APP, LAND):
    if not os.path.exists(f):
        print("ERREUR : fichier introuvable : " + f)
        sys.exit(1)

log = []
warn = []
checks = []

def read(p):
    with open(p, "r", encoding="utf-8") as fh:
        return fh.read()

def write(p, s):
    with open(p, "w", encoding="utf-8") as fh:
        fh.write(s)

def backup(p):
    b = p + ".before017K"
    if os.path.exists(b):
        log.append("DEJA : backup " + os.path.basename(b))
    else:
        write(b, read(p))
        log.append("BACKUP : " + os.path.basename(b))

backup(APP)
backup(LAND)

app = read(APP)
land = read(LAND)

# =====================================================================
# A. Composant de confirmation PD&I
# =====================================================================
CONFIRM_TSX = "\n".join([
    "// PATCH 017K : fenetre de confirmation propre a PD&I.",
    "// Remplace window.confirm, qui affiche l URL du serveur et casse l identite du produit.",
    "// Usage : const ok = await pdiConfirm({ title, message, confirmLabel, destructive });",
    "import React, { useEffect, useState } from \"react\";",
    "import { createRoot } from \"react-dom/client\";",
    "",
    "export type PdiConfirmOptions = {",
    "  title: string;",
    "  message: string;",
    "  confirmLabel?: string;",
    "  cancelLabel?: string;",
    "  destructive?: boolean;",
    "};",
    "",
    "const OVERLAY: React.CSSProperties = {",
    "  position: \"fixed\", inset: 0, zIndex: 100200,",
    "  background: \"rgba(2,6,15,.72)\", backdropFilter: \"blur(3px)\",",
    "  display: \"flex\", alignItems: \"center\", justifyContent: \"center\", padding: 16,",
    "};",
    "",
    "const CARD: React.CSSProperties = {",
    "  width: \"min(460px, 94vw)\", background: \"#0B111A\",",
    "  border: \"1px solid rgba(103,232,249,.35)\", borderRadius: 18,",
    "  padding: 20, color: \"#E5EDF8\",",
    "  boxShadow: \"0 24px 60px rgba(0,0,0,.55)\",",
    "  fontFamily: \"Inter, ui-sans-serif, system-ui, sans-serif\",",
    "};",
    "",
    "function PdiConfirmDialog(props: { options: PdiConfirmOptions; onClose: (ok: boolean) => void }) {",
    "  const { options, onClose } = props;",
    "  const [busy, setBusy] = useState(false);",
    "  const danger = options.destructive === true;",
    "  useEffect(() => {",
    "    const onKey = (e: KeyboardEvent) => {",
    "      if (e.key === \"Escape\") { e.preventDefault(); onClose(false); }",
    "      if (e.key === \"Enter\") { e.preventDefault(); onClose(true); }",
    "    };",
    "    window.addEventListener(\"keydown\", onKey);",
    "    return () => window.removeEventListener(\"keydown\", onKey);",
    "  }, [onClose]);",
    "  return (",
    "    <div style={OVERLAY} onMouseDown={() => onClose(false)} role=\"presentation\">",
    "      <div style={CARD} onMouseDown={(e) => e.stopPropagation()} role=\"dialog\" aria-modal=\"true\">",
    "        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: \".1em\", textTransform: \"uppercase\", color: danger ? \"#FCA5A5\" : \"#67E8F9\" }}>",
    "          {danger ? \"Action irreversible\" : \"Confirmation\"}",
    "        </div>",
    "        <h3 style={{ margin: \"8px 0 6px\", fontSize: 18, fontWeight: 900 }}>{options.title}</h3>",
    "        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: \"#94A3B8\", fontWeight: 600 }}>{options.message}</p>",
    "        <div style={{ display: \"flex\", gap: 8, justifyContent: \"flex-end\", marginTop: 18 }}>",
    "          <button",
    "            type=\"button\"",
    "            onClick={() => onClose(false)}",
    "            style={{ padding: \"9px 14px\", borderRadius: 10, border: \"1px solid rgba(148,163,184,.35)\", background: \"transparent\", color: \"#CBD5E1\", fontSize: 12, fontWeight: 800, cursor: \"pointer\" }}",
    "          >",
    "            {options.cancelLabel || \"Annuler\"}",
    "          </button>",
    "          <button",
    "            type=\"button\"",
    "            autoFocus",
    "            disabled={busy}",
    "            onClick={() => { setBusy(true); onClose(true); }}",
    "            style={{ padding: \"9px 16px\", borderRadius: 10, border: danger ? \"1px solid #7F1D1D\" : \"1px solid rgba(103,232,249,.5)\", background: danger ? \"#7F1D1D\" : \"#0E7490\", color: \"#FFFFFF\", fontSize: 12, fontWeight: 900, cursor: \"pointer\" }}",
    "          >",
    "            {options.confirmLabel || \"Confirmer\"}",
    "          </button>",
    "        </div>",
    "        <div style={{ marginTop: 12, fontSize: 10, fontWeight: 700, color: \"#64748B\" }}>Entree pour confirmer, Echap pour annuler.</div>",
    "      </div>",
    "    </div>",
    "  );",
    "}",
    "",
    "export function pdiConfirm(options: PdiConfirmOptions): Promise<boolean> {",
    "  if (typeof document === \"undefined\") return Promise.resolve(false);",
    "  return new Promise<boolean>((resolve) => {",
    "    const host = document.createElement(\"div\");",
    "    host.setAttribute(\"data-pdi-confirm\", \"017k\");",
    "    document.body.appendChild(host);",
    "    const root = createRoot(host);",
    "    const close = (ok: boolean) => {",
    "      try { root.unmount(); } catch (e) { void e; }",
    "      try { host.remove(); } catch (e) { void e; }",
    "      resolve(ok);",
    "    };",
    "    root.render(<PdiConfirmDialog options={options} onClose={close} />);",
    "  });",
    "}",
    "",
    "export default pdiConfirm;",
    "",
])

if os.path.exists(CONFIRM) and "PATCH 017K" in read(CONFIRM):
    log.append("DEJA : composant PdiConfirm.tsx")
else:
    if not os.path.isdir(UIDIR):
        os.makedirs(UIDIR)
    write(CONFIRM, CONFIRM_TSX)
    log.append("APPLIQUE : src/pdi/ui/PdiConfirm.tsx")
checks.append(("composant de confirmation present", os.path.exists(CONFIRM)))

# =====================================================================
# B. Import du composant dans PdiUnifiedApp
# =====================================================================
IMP_MARK = 'import { pdiConfirm } from "../ui/PdiConfirm";'
if IMP_MARK in app:
    log.append("DEJA : import pdiConfirm")
else:
    lines = app.split("\n")
    last = -1
    for i, ln in enumerate(lines[:80]):
        if ln.startswith("import "):
            last = i
    if last < 0:
        warn.append("aucune ligne import trouvee dans PdiUnifiedApp")
    else:
        lines.insert(last + 1, "// PATCH 017K\n" + IMP_MARK)
        app = "\n".join(lines)
        log.append("APPLIQUE : import pdiConfirm")
checks.append(("import pdiConfirm", IMP_MARK in app))

# =====================================================================
# C. Remplacement du window.confirm de suppression de projet
# =====================================================================
OLD_DEL = 'onClick={() => { if (window.confirm("Supprimer definitivement le projet \\"" + entry.title + "\\" et sa sauvegarde locale ?")) { pdiRemoveProject(entry.projectId); closeTabsForProject(entry.projectId); setProjectsRefresh((v) => v + 1); } }}'
NEW_DEL = 'onClick={() => { pdiConfirm({ title: "Supprimer le projet", message: "Le projet \\"" + entry.title + "\\" et sa sauvegarde locale seront definitivement supprimes. Cette action ne peut pas etre annulee.", confirmLabel: "Supprimer le projet", destructive: true }).then((ok) => { if (!ok) return; pdiRemoveProject(entry.projectId); closeTabsForProject(entry.projectId); setProjectsRefresh((v) => v + 1); }); }}'

if NEW_DEL in app:
    log.append("DEJA : suppression de projet en fenetre PD&I")
elif OLD_DEL in app:
    app = app.replace(OLD_DEL, NEW_DEL, 1)
    log.append("APPLIQUE : suppression de projet en fenetre PD&I")
else:
    warn.append("ancre de suppression de projet non trouvee")
checks.append(("plus de window.confirm sur la suppression", NEW_DEL in app))

# =====================================================================
# D. Pile de navigation + retour reel
# =====================================================================
STACK_DECL = "\n".join([
    "// PATCH 017K : pile de navigation et contextes projet.",
    "const PDI_NAV_STACK_017K: string[] = [];",
    "let pdiPrevModule017K: string | null = null;",
    'const PDI_PROJECT_CONTEXT_017K: string[] = ["isometric", "cad", "json", "pdf", "sketch", "vision", "drive"];',
    "",
])
ANCHOR_NAV = "const navItems: Array<{ id: PdiModule; label: string; icon: string; title: string }> = ["
if "PDI_NAV_STACK_017K" in app:
    log.append("DEJA : pile de navigation")
elif ANCHOR_NAV in app:
    app = app.replace(ANCHOR_NAV, STACK_DECL + ANCHOR_NAV, 1)
    log.append("APPLIQUE : pile de navigation")
else:
    warn.append("ancre navItems non trouvee")

BACK_FN = "\n".join([
    "  // PATCH 017K : retour reel, alimente par la pile de navigation.",
    "  useEffect(() => {",
    "    if (pdiPrevModule017K && pdiPrevModule017K !== activeModule) PDI_NAV_STACK_017K.push(pdiPrevModule017K);",
    "    pdiPrevModule017K = activeModule;",
    "  }, [activeModule]);",
    "  const pdiGoBack017K = () => {",
    "    const prev = PDI_NAV_STACK_017K.pop();",
    '    setActiveModule((prev && prev !== activeModule ? prev : "home") as PdiModule);',
    "  };",
    "",
])
ANCHOR_TITLE = "  const moduleTitle = useMemo("
if "pdiGoBack017K" in app:
    log.append("DEJA : fonction de retour")
elif ANCHOR_TITLE in app:
    app = app.replace(ANCHOR_TITLE, BACK_FN + ANCHOR_TITLE, 1)
    log.append("APPLIQUE : fonction de retour")
else:
    warn.append("ancre moduleTitle non trouvee")
checks.append(("fonction de retour presente", "pdiGoBack017K" in app))

# =====================================================================
# E. Fil d Ariane (2e niveau de profondeur uniquement)
# =====================================================================
CRUMB = "\n".join([
    "      {/* PATCH 017K : fil d Ariane et retour, a partir du 2e niveau seulement. */}",
    '      {activeModule !== "home" && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 14px", background: "#070B12", borderBottom: "1px solid rgba(148,163,184,.14)" }}>',
    '        <button type="button" onClick={pdiGoBack017K} title="Retour au niveau precedent" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(103,232,249,.35)", background: "#0B111A", color: "#67E8F9", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>',
    "          {\"\\u2190 Retour\"}",
    "        </button>",
    '        <button type="button" onClick={() => setActiveModule("home")} style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 11, fontWeight: 800, cursor: "pointer", padding: 0 }}>Accueil</button>',
    '        <span style={{ color: "#334155", fontSize: 11, fontWeight: 900 }}>/</span>',
    '        <strong style={{ color: "#E5EDF8", fontSize: 11, fontWeight: 900 }}>{moduleTitle}</strong>',
    "      </div>}",
    "",
])
ANCHOR_MAINNAV = '      <nav className="pdi-main-nav" aria-label="Navigation PD&I">'
if "fil d Ariane et retour" in app:
    log.append("DEJA : fil d Ariane")
elif ANCHOR_MAINNAV in app:
    app = app.replace(ANCHOR_MAINNAV, CRUMB + ANCHOR_MAINNAV, 1)
    log.append("APPLIQUE : fil d Ariane")
else:
    warn.append("ancre pdi-main-nav non trouvee")
checks.append(("fil d Ariane present", "fil d Ariane et retour" in app))

# =====================================================================
# F. Onglets projet masques hors contexte projet
# =====================================================================
OLD_TABS = '      <div className="pdi-tabsbar">'
NEW_TABS = "\n".join([
    "      {/* PATCH 017K : les onglets projet ne s affichent que dans un contexte projet. */}",
    '      {PDI_PROJECT_CONTEXT_017K.includes(activeModule) && <div className="pdi-tabsbar">',
])
OLD_TABS_END = '      </div>\n      <main className="pdi-content">'
NEW_TABS_END = '      </div>}\n      <main className="pdi-content">'

if "PDI_PROJECT_CONTEXT_017K.includes(activeModule)" in app:
    log.append("DEJA : onglets conditionnels")
else:
    if OLD_TABS in app and OLD_TABS_END in app:
        app = app.replace(OLD_TABS, NEW_TABS, 1)
        app = app.replace(OLD_TABS_END, NEW_TABS_END, 1)
        log.append("APPLIQUE : onglets projet masques hors contexte projet")
    else:
        warn.append("ancres de la barre d onglets non trouvees")
checks.append(("onglets conditionnels", "PDI_PROJECT_CONTEXT_017K.includes(activeModule)" in app))

write(APP, app)

# =====================================================================
# G. Landing : Vision retiree, Sketch to ISO, impression et BOM en avant
# =====================================================================
land_lines = land.split("\n")
kept = []
removed = 0
for ln in land_lines:
    if 'id: "vision", title: "Vision AI' in ln:
        removed += 1
        continue
    if 'key: "vision", cls: "pdiL-band-vision"' in ln:
        removed += 1
        continue
    kept.append(ln)
land = "\n".join(kept)
if removed:
    log.append("APPLIQUE : entrees Vision retirees (%d)" % removed)
else:
    log.append("DEJA : entrees Vision retirees")
checks.append(("plus de carte Vision", 'title: "Vision AI' not in land and 'pdiL-band-vision"' not in land))

SWAPS = [
    # Sketch to ISO, mis en avant comme traitement 100 % local
    ('title: "Croquis to ISO", sub: "Croquis main \u2192 isom\u00e9trique", badge: "Croquis"',
     'title: "Sketch to ISO", sub: "Croquis papier \u2192 isom\u00e9trique", badge: "100 % local"'),
    # Le moteur interne V4.8d disparait, l impression et l export prennent sa place
    ('title: "Isom\u00e9trique", tag: "Moteur ISO V4.8d", icon: "\U0001F4D0", text: "N\u0153uds, tubes DN, organes, cotations r\u00e9elles, \u00e9l\u00e9vations Z et soudures W00x."',
     'title: "Impression & export", tag: "A5 \u2192 A0 \u00b7 PDF vectoriel", icon: "\U0001F5A8", text: "Planches A5 \u00e0 A0, cartouche ISO 7200, \u00e9chelles 1:1 \u00e0 1:200, PDF vectoriel et DXF."'),
    ('title: "Croquis", tag: "Croquis to ISO"',
     'title: "Sketch to ISO", tag: "Traitement 100 % local"'),
    ('{ title: "Produit", links: ["Editeur isometrique", "Vision IA", "Croquis vers ISO", "Import CAO"] }',
     '{ title: "Produit", links: ["Editeur isometrique", "Impression & export", "Sketch to ISO", "Import CAO"] }'),
    ('title: "Export documentaire", text: "Planches A4 a A1, cartouche, PDF, DXF et dossier de fabrication."',
     'title: "Impression & export", text: "Planches A5 a A0, cartouche ISO 7200, PDF vectoriel, DXF et dossier de fabrication."'),
    ('title: "Reconnaitre", text: "La vision IA identifie la tuyauterie et produit un JSON piping structure."',
     'title: "Reconnaitre", text: "Le traitement local redresse les lignes et identifie les symboles, sans aucun envoi sur internet."'),
]
swap_new = 0
swap_ok = 0
for old, new in SWAPS:
    if new in land:
        swap_ok += 1
    elif old in land:
        land = land.replace(old, new, 1)
        swap_ok += 1
        swap_new += 1
    else:
        warn.append("ancre landing non trouvee : " + old[:52])
if swap_ok != len(SWAPS):
    log.append("PARTIEL : landing %d/%d" % (swap_ok, len(SWAPS)))
elif swap_new == 0:
    log.append("DEJA : landing a jour")
else:
    log.append("APPLIQUE : landing, %d libelles mis a jour" % swap_new)
checks.append(("Sketch to ISO en landing", 'title: "Sketch to ISO"' in land))
checks.append(("impression mise en avant", 'tag: "A5 \u2192 A0 \u00b7 PDF vectoriel"' in land))

# Bande nomenclature ajoutee apres la bande JSON
BOM_BAND = '  { key: "bom", cls: "pdiL-band-json", title: "Nomenclature & m\u00e9tr\u00e9", tag: "BOM par tag", icon: "\U0001F4CB", text: "Boulonnerie ASME B16.5, joints B16.20, supports et consommables de soudure compt\u00e9s automatiquement." },'
JSON_BAND_KEY = '  { key: "json", cls: "pdiL-band-json"'
if 'key: "bom"' in land:
    log.append("DEJA : bande nomenclature")
else:
    idx = land.find(JSON_BAND_KEY)
    if idx < 0:
        warn.append("ancre bande JSON non trouvee")
    else:
        end = land.find("\n", idx)
        land = land[:end + 1] + BOM_BAND + "\n" + land[end + 1:]
        log.append("APPLIQUE : bande nomenclature & metre")
checks.append(("bande nomenclature", 'key: "bom"' in land))

write(LAND, land)

# =====================================================================
# Rapport
# =====================================================================
ok = sum(1 for _, v in checks if v)
for line in log:
    print("  " + line)
for w in warn:
    print("  ATTENTION : " + w)
print("VERIFICATIONS : %d/%d" % (ok, len(checks)))
for label, val in checks:
    print("  [%s] %s" % ("x" if val else " ", label))

rep = os.path.join(ROOT, "017K_confirm_navigation_landing_REPORT.md")
lines = []
lines.append("# PATCH 017K - confirmation PD&I, navigation, landing")
lines.append("")
lines.append("## Operations")
for line in log:
    lines.append("- " + line)
if warn:
    lines.append("")
    lines.append("## Avertissements")
    for w in warn:
        lines.append("- " + w)
lines.append("")
lines.append("## Verifications : %d/%d" % (ok, len(checks)))
for label, val in checks:
    lines.append("- [%s] %s" % ("x" if val else " ", label))
lines.append("")
lines.append("## Tests")
lines.append("1. Mes projets PD&I, bouton Supprimer : fenetre PD&I sombre, sans URL du serveur.")
lines.append("2. Echap annule, Entree confirme, clic sur le fond annule.")
lines.append("3. Ouvrir un module : fil d Ariane visible, Accueil : fil d Ariane absent.")
lines.append("4. Bouton Retour : revient au module precedent reel, puis a l accueil.")
lines.append("5. Ecran Mes projets et Profil : barre d onglets masquee.")
lines.append("6. Editeur ISO : barre d onglets presente.")
lines.append("7. Landing : plus de Vision ni de V4.8d, Sketch to ISO et Impression & export presents.")
lines.append("")
lines.append("## Hors perimetre assume")
lines.append("- 8 window.confirm restants et 41 alert() : patch 017K2.")
lines.append("- Ecran Profil & societe : patch 017K2.")
write(rep, "\n".join(lines) + "\n")
print("RAPPORT : " + rep)

if ok != len(checks):
    sys.exit(1)
