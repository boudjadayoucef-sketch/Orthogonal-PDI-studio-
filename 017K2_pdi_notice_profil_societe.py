# PATCH 017K2 - PD&I
# A. Fenetre d information PD&I (pdiAlert) : remplace les 41 alert() du navigateur
# B. Ecran Profil & societe editable, branche sur pdi.branding.v1
# Idempotent. Sauvegardes .before017K2. Ne touche pas server.ts (R20).

import os
import re
import sys

def find_root():
    here = os.path.dirname(os.path.abspath(__file__))
    for cand in (here, os.getcwd()):
        if os.path.exists(os.path.join(cand, "package.json")):
            return cand
    return here

ROOT = find_root()
SRC = os.path.join(ROOT, "src")
APP = os.path.join(ROOT, "src/pdi/app/PdiUnifiedApp.tsx")
UIDIR = os.path.join(ROOT, "src/pdi/ui")
NOTICE = os.path.join(UIDIR, "PdiNotice.tsx")
COMPANY = os.path.join(UIDIR, "PdiCompanyPanel.tsx")
BRANDING = os.path.join(ROOT, "src/pdi/branding/pdiBranding.ts")

print("=== PATCH 017K2 ===")
print("  RACINE : " + ROOT)

for f in (APP, BRANDING):
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
    b = p + ".before017K2"
    if not os.path.exists(b):
        write(b, read(p))

if not os.path.isdir(UIDIR):
    os.makedirs(UIDIR)

# =====================================================================
# A. Composant d information PD&I
# =====================================================================
NOTICE_TSX = "\n".join([
    "// PATCH 017K2 : fenetre d information propre a PD&I.",
    "// Remplace alert(), qui affiche l URL du serveur et bloque le thread.",
    "import React, { useEffect } from \"react\";",
    "import { createRoot } from \"react-dom/client\";",
    "",
    "export type PdiNoticeTone = \"info\" | \"success\" | \"warning\" | \"error\";",
    "",
    "const TONES: Record<PdiNoticeTone, { color: string; label: string }> = {",
    "  info: { color: \"#67E8F9\", label: \"Information\" },",
    "  success: { color: \"#4ADE80\", label: \"Operation reussie\" },",
    "  warning: { color: \"#FBBF24\", label: \"Attention\" },",
    "  error: { color: \"#FCA5A5\", label: \"Erreur\" },",
    "};",
    "",
    "function guessTone(message: string): PdiNoticeTone {",
    "  const m = message.toLowerCase();",
    "  if (m.includes(\"erreur\") || m.includes(\"impossible\") || m.includes(\"echec\") || m.includes(\"\\u00e9chec\")) return \"error\";",
    "  if (m.includes(\"attention\") || m.includes(\"\\u26a0\")) return \"warning\";",
    "  if (m.includes(\"succ\") || m.includes(\"r\\u00e9ussi\") || m.includes(\"enregistr\")) return \"success\";",
    "  return \"info\";",
    "}",
    "",
    "function PdiNoticeDialog(props: { message: string; title?: string; tone: PdiNoticeTone; onClose: () => void }) {",
    "  const { message, title, tone, onClose } = props;",
    "  useEffect(() => {",
    "    const onKey = (e: KeyboardEvent) => {",
    "      if (e.key === \"Escape\" || e.key === \"Enter\") { e.preventDefault(); onClose(); }",
    "    };",
    "    window.addEventListener(\"keydown\", onKey);",
    "    return () => window.removeEventListener(\"keydown\", onKey);",
    "  }, [onClose]);",
    "  const t = TONES[tone];",
    "  return (",
    "    <div",
    "      role=\"presentation\"",
    "      onMouseDown={onClose}",
    "      style={{ position: \"fixed\", inset: 0, zIndex: 100200, background: \"rgba(2,6,15,.72)\", backdropFilter: \"blur(3px)\", display: \"flex\", alignItems: \"center\", justifyContent: \"center\", padding: 16 }}",
    "    >",
    "      <div",
    "        role=\"dialog\"",
    "        aria-modal=\"true\"",
    "        onMouseDown={(e) => e.stopPropagation()}",
    "        style={{ width: \"min(460px, 94vw)\", background: \"#0B111A\", border: \"1px solid rgba(103,232,249,.32)\", borderRadius: 18, padding: 20, color: \"#E5EDF8\", boxShadow: \"0 24px 60px rgba(0,0,0,.55)\", fontFamily: \"Inter, ui-sans-serif, system-ui, sans-serif\" }}",
    "      >",
    "        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: \".1em\", textTransform: \"uppercase\", color: t.color }}>{title || t.label}</div>",
    "        <p style={{ margin: \"10px 0 0\", fontSize: 13, lineHeight: 1.55, fontWeight: 600, whiteSpace: \"pre-wrap\" }}>{message}</p>",
    "        <div style={{ display: \"flex\", justifyContent: \"flex-end\", marginTop: 18 }}>",
    "          <button",
    "            type=\"button\"",
    "            autoFocus",
    "            onClick={onClose}",
    "            style={{ padding: \"9px 18px\", borderRadius: 10, border: \"1px solid rgba(103,232,249,.5)\", background: \"#0E7490\", color: \"#FFFFFF\", fontSize: 12, fontWeight: 900, cursor: \"pointer\" }}",
    "          >",
    "            Fermer",
    "          </button>",
    "        </div>",
    "      </div>",
    "    </div>",
    "  );",
    "}",
    "",
    "export function pdiAlert(message: unknown, title?: string, tone?: PdiNoticeTone): Promise<void> {",
    "  const text = typeof message === \"string\" ? message : String(message);",
    "  if (typeof document === \"undefined\") return Promise.resolve();",
    "  return new Promise<void>((resolve) => {",
    "    const host = document.createElement(\"div\");",
    "    host.setAttribute(\"data-pdi-notice\", \"017k2\");",
    "    document.body.appendChild(host);",
    "    const root = createRoot(host);",
    "    const close = () => {",
    "      try { root.unmount(); } catch (e) { void e; }",
    "      try { host.remove(); } catch (e) { void e; }",
    "      resolve();",
    "    };",
    "    root.render(<PdiNoticeDialog message={text} title={title} tone={tone || guessTone(text)} onClose={close} />);",
    "  });",
    "}",
    "",
    "export default pdiAlert;",
    "",
])

if os.path.exists(NOTICE) and "PATCH 017K2" in read(NOTICE):
    log.append("DEJA : composant PdiNotice.tsx")
else:
    write(NOTICE, NOTICE_TSX)
    log.append("APPLIQUE : src/pdi/ui/PdiNotice.tsx")
checks.append(("composant d information present", os.path.exists(NOTICE)))

# =====================================================================
# B. Conversion mecanique des alert() en fenetres PD&I
# =====================================================================
ALERT_RE = re.compile(r"(?<![\w.$])(?:window\.)?alert\s*\(")
converted = 0
touched = []

for dirpath, dirnames, filenames in os.walk(SRC):
    dirnames[:] = [d for d in dirnames if d not in ("node_modules", "ui")]
    for name in filenames:
        if not name.endswith(".tsx"):
            continue
        if ".before" in name:
            continue
        path = os.path.join(dirpath, name)
        text = read(path)
        if not ALERT_RE.search(text):
            continue
        backup(path)
        new_text, count = ALERT_RE.subn("void pdiAlert(", text)
        rel = os.path.relpath(NOTICE, dirpath).replace(os.sep, "/")[:-4]
        if not rel.startswith("."):
            rel = "./" + rel
        imp = 'import { pdiAlert } from "' + rel + '";'
        if imp not in new_text:
            lines = new_text.split("\n")
            last = -1
            for i, ln in enumerate(lines[:120]):
                if ln.startswith("import "):
                    last = i
            if last < 0:
                warn.append("import impossible dans " + name)
            else:
                lines.insert(last + 1, "// PATCH 017K2\n" + imp)
                new_text = "\n".join(lines)
        write(path, new_text)
        converted += count
        touched.append(name + " (" + str(count) + ")")

if converted:
    log.append("APPLIQUE : %d alert() converties en fenetres PD&I -> %s" % (converted, ", ".join(touched)))
else:
    log.append("DEJA : plus aucune alert() du navigateur")

# La verification est scopee au perimetre du patch : les composants PD&I de
# src/pdi/ui sont exclus, leurs commentaires citent alert() sans l appeler.
remaining = 0
for dirpath, dirnames, filenames in os.walk(SRC):
    dirnames[:] = [d for d in dirnames if d not in ("node_modules", "ui")]
    for name in filenames:
        if name.endswith(".tsx") and ".before" not in name:
            remaining += len(ALERT_RE.findall(read(os.path.join(dirpath, name))))
checks.append(("plus aucune alert() du navigateur", remaining == 0))
if remaining:
    warn.append("%d alert() encore presentes" % remaining)

# =====================================================================
# C. Panneau Profil & societe
# =====================================================================
COMPANY_TSX = "\n".join([
    "// PATCH 017K2 : ecran Profil & societe. Source unique de l identite affichee",
    "// dans les cartouches, entetes et pieds de planche (pdi.branding.v1).",
    "import React, { useState } from \"react\";",
    "import { pdiLoadBranding, pdiSaveBranding, PdiBranding } from \"../branding/pdiBranding\";",
    "import { pdiAlert } from \"./PdiNotice\";",
    "",
    "const FIELDS: Array<{ key: keyof PdiBranding; label: string; hint: string }> = [",
    "  { key: \"companyName\", label: \"Societe\", hint: \"Apparait dans le cartouche de chaque planche\" },",
    "  { key: \"projectOwner\", label: \"Maitre d ouvrage\", hint: \"Client ou donneur d ordre du projet\" },",
    "  { key: \"approverLabel\", label: \"Libelle d approbation\", hint: \"Exemple : Approuve par, Verifie par\" },",
    "  { key: \"documentPrefix\", label: \"Prefixe document\", hint: \"Exemple : PDI, ACME-PIP\" },",
    "  { key: \"standardsNote\", label: \"Normes en pied de planche\", hint: \"Referentiel imprime sous la planche\" },",
    "];",
    "",
    "const LABEL: React.CSSProperties = { fontSize: 10, fontWeight: 900, letterSpacing: \".08em\", textTransform: \"uppercase\", color: \"#67E8F9\" };",
    "const INPUT: React.CSSProperties = { width: \"100%\", height: 34, borderRadius: 10, border: \"1px solid rgba(148,163,184,.3)\", background: \"#070B12\", color: \"#E5EDF8\", fontSize: 12, fontWeight: 700, padding: \"0 10px\", outline: \"none\" };",
    "",
    "export function PdiCompanyPanel() {",
    "  const [draft, setDraft] = useState<PdiBranding>(() => pdiLoadBranding());",
    "  const [saved, setSaved] = useState(false);",
    "  const set = (key: keyof PdiBranding, value: string) => { setDraft({ ...draft, [key]: value }); setSaved(false); };",
    "  const save = () => {",
    "    pdiSaveBranding(draft);",
    "    setSaved(true);",
    "    void pdiAlert(\"Identite enregistree. Les cartouches, entetes et pieds de planche utilisent desormais ces valeurs.\", \"Profil & societe\", \"success\");",
    "  };",
    "  return (",
    "    <section style={{ marginTop: 18, border: \"1px solid rgba(103,232,249,.28)\", borderRadius: 16, padding: 16, background: \"#0B111A\" }}>",
    "      <div style={LABEL}>Profil &amp; societe</div>",
    "      <h3 style={{ margin: \"6px 0 4px\", fontSize: 16, fontWeight: 900, color: \"#E5EDF8\" }}>Identite imprimee sur vos plans</h3>",
    "      <p style={{ margin: \"0 0 14px\", fontSize: 12, fontWeight: 600, color: \"#94A3B8\" }}>",
    "        Ces champs alimentent le cartouche, l entete et le pied de chaque planche. Aucune marque n est codee en dur dans le logiciel.",
    "      </p>",
    "      <div style={{ display: \"grid\", gap: 12, gridTemplateColumns: \"repeat(auto-fit, minmax(240px, 1fr))\" }}>",
    "        {FIELDS.map((field) => (",
    "          <label key={String(field.key)} style={{ display: \"grid\", gap: 5 }}>",
    "            <span style={LABEL}>{field.label}</span>",
    "            <input",
    "              style={INPUT}",
    "              value={String(draft[field.key] || \"\")}",
    "              placeholder={field.hint}",
    "              onChange={(e) => set(field.key, e.target.value)}",
    "            />",
    "            <small style={{ fontSize: 10, fontWeight: 600, color: \"#64748B\" }}>{field.hint}</small>",
    "          </label>",
    "        ))}",
    "      </div>",
    "      <div style={{ display: \"flex\", alignItems: \"center\", gap: 10, marginTop: 16, flexWrap: \"wrap\" }}>",
    "        <button",
    "          type=\"button\"",
    "          onClick={save}",
    "          style={{ padding: \"9px 16px\", borderRadius: 10, border: \"1px solid rgba(103,232,249,.5)\", background: \"#0E7490\", color: \"#FFFFFF\", fontSize: 12, fontWeight: 900, cursor: \"pointer\" }}",
    "        >",
    "          Enregistrer l identite",
    "        </button>",
    "        <button",
    "          type=\"button\"",
    "          onClick={() => { setDraft(pdiLoadBranding()); setSaved(false); }}",
    "          style={{ padding: \"9px 14px\", borderRadius: 10, border: \"1px solid rgba(148,163,184,.35)\", background: \"transparent\", color: \"#CBD5E1\", fontSize: 12, fontWeight: 800, cursor: \"pointer\" }}",
    "        >",
    "          Annuler les modifications",
    "        </button>",
    "        {saved && <span style={{ fontSize: 11, fontWeight: 900, color: \"#4ADE80\" }}>Enregistre</span>}",
    "      </div>",
    "    </section>",
    "  );",
    "}",
    "",
    "export default PdiCompanyPanel;",
    "",
])

if os.path.exists(COMPANY) and "PATCH 017K2" in read(COMPANY):
    log.append("DEJA : composant PdiCompanyPanel.tsx")
else:
    write(COMPANY, COMPANY_TSX)
    log.append("APPLIQUE : src/pdi/ui/PdiCompanyPanel.tsx")
checks.append(("panneau societe present", os.path.exists(COMPANY)))

# =====================================================================
# D. Branchement du panneau dans l ecran Profil
# =====================================================================
backup(APP)
app = read(APP)
IMP_C = 'import { PdiCompanyPanel } from "../ui/PdiCompanyPanel";'
if IMP_C in app:
    log.append("DEJA : import PdiCompanyPanel")
else:
    lines = app.split("\n")
    last = -1
    for i, ln in enumerate(lines[:90]):
        if ln.startswith("import "):
            last = i
    if last < 0:
        warn.append("import impossible dans PdiUnifiedApp")
    else:
        lines.insert(last + 1, "// PATCH 017K2\n" + IMP_C)
        app = "\n".join(lines)
        log.append("APPLIQUE : import PdiCompanyPanel")

if "<PdiCompanyPanel />" in app:
    log.append("DEJA : panneau societe branche sur l ecran Profil")
else:
    lines = app.split("\n")
    start = -1
    for i, ln in enumerate(lines):
        if 'activeModule === "profile"' in ln:
            start = i
            break
    end = -1
    if start >= 0:
        for j in range(start + 1, min(start + 60, len(lines))):
            if lines[j].strip() == "</ComingSoonPanel>}":
                end = j
                break
    if end < 0:
        warn.append("bloc de l ecran Profil non trouve")
    else:
        lines.insert(end, "          {/* PATCH 017K2 : identite societe editable, remplace toute marque codee en dur. */}")
        lines.insert(end + 1, "          <PdiCompanyPanel />")
        app = "\n".join(lines)
        log.append("APPLIQUE : panneau societe branche sur l ecran Profil")

write(APP, app)
checks.append(("panneau societe branche", "<PdiCompanyPanel />" in app))
checks.append(("import du panneau", IMP_C in app))

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

rep = os.path.join(ROOT, "017K2_notice_profil_societe_REPORT.md")
out = []
out.append("# PATCH 017K2 - fenetres d information PD&I et ecran Profil & societe")
out.append("")
out.append("## Operations")
for line in log:
    out.append("- " + line)
if warn:
    out.append("")
    out.append("## Avertissements")
    for w in warn:
        out.append("- " + w)
out.append("")
out.append("## Verifications : %d/%d" % (ok, len(checks)))
for label, val in checks:
    out.append("- [%s] %s" % ("x" if val else " ", label))
out.append("")
out.append("## Tests")
out.append("1. Declencher une action en erreur : fenetre PD&I sombre, sans URL de serveur.")
out.append("2. Echap ou Entree ferme la fenetre d information.")
out.append("3. Menu compte, Voir profil : section Profil & societe visible.")
out.append("4. Saisir une societe, Enregistrer, puis ouvrir Planche ISO : le cartouche affiche cette societe.")
out.append("5. Recharger la page : la valeur saisie est conservee.")
out.append("")
out.append("## Hors perimetre assume")
out.append("- 8 window.confirm restants : patch 017K3, chaque appelant doit passer en async.")
out.append("- Refonte visuelle bento de la landing : patch 017K3.")
out.append("- Precision geometrique (snap, rotation, alignement, parallele) : patch 017P.")
write(rep, "\n".join(out) + "\n")
print("RAPPORT : " + rep)

if ok != len(checks):
    sys.exit(1)
