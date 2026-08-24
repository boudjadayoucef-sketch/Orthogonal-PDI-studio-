#!/usr/bin/env python3
# PATCH 017C - Registre complet des commandes (autocompletion) + TAGDISPLAY
#              + RENUMBER + DATAMANAGER
import os, shutil, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.join(ROOT, "src", "pdi", "isometric", "engine", "IsometrieModuleV48d.tsx")
CATALOG = os.path.join(ROOT, "src", "pdi", "isometric", "engine", "CadAutocadEngine.ts")
BAR = os.path.join(ROOT, "src", "pdi", "isometric", "components", "CadCommandLineBar.tsx")
REPORT = os.path.join(ROOT, "017C_command_registry_tagdisplay_renumber_datamanager_REPORT.md")
notes = []


def sub(s, old, new, note):
    if new in s:
        notes.append("DEJA APPLIQUE : " + note)
        return s
    if old not in s:
        notes.append("NON TROUVE : " + note)
        return s
    notes.append(note)
    return s.replace(old, new, 1)


# ------------------------------------------------------- CATALOGUE ----------
CAT_OLD = '''    icon: "Eye",
  },
];'''
CAT_NEW = '''    icon: "Eye",
  },
  // PATCH 017C : les commandes PD&I etaient executables mais absentes du
  // catalogue, donc invisibles dans l autocompletion de la ligne de commande.
  {
    id: "projectsetup",
    name: "PROJECTSETUP",
    aliases: ["PS", "PROJECTSETUP", "SETUP", "PROJET"],
    description: "Ouvre Project Setup PD&I : projet, formats de tag, services, specs",
    category: "Donn\u00e9es",
    shortcut: "PS",
    icon: "SlidersHorizontal",
  },
  {
    id: "tagformat",
    name: "TAGFORMAT",
    aliases: ["TF", "TAGFORMAT", "FORMATTAG"],
    description: "Affiche et modifie le format de tag actif (Tag_Ligne_Standard)",
    category: "Donn\u00e9es",
    shortcut: "TF",
    icon: "Type",
  },
  {
    id: "tag",
    name: "TAG",
    aliases: ["TAG", "BALISE", "REPERE"],
    description: "Tague la selection : TAG [service] [spec], ex TAG HC CS300",
    category: "Donn\u00e9es",
    shortcut: "TAG",
    icon: "Type",
  },
  {
    id: "service",
    name: "SERVICE",
    aliases: ["SERVICE", "FLUIDE"],
    description: "Affecte le service/fluide a la selection, ex SERVICE HC",
    category: "Donn\u00e9es",
    shortcut: "SERVICE",
    icon: "Disc3",
  },
  {
    id: "spec",
    name: "SPEC",
    aliases: ["SPEC", "CLASSE", "SPECIFICATION"],
    description: "Affecte la spec tuyauterie a la selection, ex SPEC CS300",
    category: "Donn\u00e9es",
    shortcut: "SPEC",
    icon: "Square",
  },
  {
    id: "autotag",
    name: "AUTOTAG",
    aliases: ["AUTOTAG", "TAGALL", "TAGTOUT"],
    description: "Tague automatiquement tous les troncons du plan",
    category: "Donn\u00e9es",
    shortcut: "AUTOTAG",
    icon: "Check",
  },
  {
    id: "tagdisplay",
    name: "TAGDISPLAY",
    aliases: ["TAGDISPLAY", "TD", "AFFICHETAG", "TAGON"],
    description: "Affiche ou masque les tags directement sur le plan (ON/OFF)",
    category: "Affichage",
    shortcut: "TD",
    icon: "Type",
  },
  {
    id: "renumber",
    name: "RENUMBER",
    aliases: ["RENUMBER", "RN", "RENUMEROTER"],
    description: "Renumerote les tags en serie par service, ex RENUMBER HC 10",
    category: "Donn\u00e9es",
    shortcut: "RN",
    icon: "Ruler",
  },
  {
    id: "datamanager",
    name: "DATAMANAGER",
    aliases: ["DATAMANAGER", "DM", "DONNEES", "TABLEAU"],
    description: "Vue tabulaire de tous les elements tagges (base du BOM)",
    category: "Donn\u00e9es",
    shortcut: "DM",
    icon: "FileText",
  },
  {
    id: "hide",
    name: "HIDE",
    aliases: ["HIDE", "MASQUER", "PLEINECRAN"],
    description: "Masque la ligne de commande pour maximiser le plan de travail",
    category: "Affichage",
    shortcut: "HIDE",
    icon: "Maximize2",
  },
  {
    id: "epaisseur",
    name: "EPAISSEUR",
    aliases: ["LW", "EPAISSEUR", "LINEWEIGHT"],
    description: "Regle l epaisseur graphique globale, ex EPAISSEUR 1.5",
    category: "Affichage",
    shortcut: "LW",
    icon: "Slash",
  },
  {
    id: "couleur",
    name: "COULEUR",
    aliases: ["COLOR", "COULEUR", "COL"],
    description: "Couleur active : cyan, rouge, vert, jaune, blanc, gris ou #RRGGBB",
    category: "Affichage",
    shortcut: "COLOR",
    icon: "Circle",
  },
  {
    id: "style",
    name: "STYLE",
    aliases: ["STYLE", "APPARENCE"],
    description: "Affiche le style graphique actif du plan de travail",
    category: "Affichage",
    shortcut: "STYLE",
    icon: "SlidersHorizontal",
  },
  {
    id: "raccourcis",
    name: "RACCOURCIS",
    aliases: ["SHORTCUTS", "RACCOURCIS", "RACCOURCI"],
    description: "Active ou desactive les raccourcis clavier a une touche",
    category: "Affichage",
    shortcut: "?",
    icon: "LayoutGrid",
  },
];'''

SEARCH_OLD = '''export function searchCadCommands(query: string): CadCommandItem[] {
  const clean = query.trim().toUpperCase();
  if (!clean) return AUTOCAD_COMMANDS.slice(0, 10);
  return AUTOCAD_COMMANDS.filter((cmd) => {
    if (cmd.name.toUpperCase().includes(clean)) return true;
    if (cmd.aliases.some((alias) => alias.toUpperCase().startsWith(clean) || alias.toUpperCase().includes(clean))) return true;
    if (cmd.description.toUpperCase().includes(clean)) return true;
    return false;
  });
}'''
SEARCH_NEW = '''// PATCH 017C : normalisation (accents, casse) et classement par pertinence.
const pdiNormalizeCmd = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-zA-Z0-9?]/g, "")
    .toUpperCase();

export function searchCadCommands(query: string): CadCommandItem[] {
  const clean = pdiNormalizeCmd(query);
  if (!clean) return AUTOCAD_COMMANDS.slice(0, 12);
  const scored: Array<{ cmd: CadCommandItem; score: number }> = [];
  AUTOCAD_COMMANDS.forEach((cmd) => {
    const name = pdiNormalizeCmd(cmd.name);
    const id = pdiNormalizeCmd(cmd.id);
    const aliases = cmd.aliases.map(pdiNormalizeCmd);
    const description = pdiNormalizeCmd(cmd.description);
    let score = -1;
    if (name === clean || aliases.includes(clean) || id === clean) score = 100;
    else if (name.startsWith(clean) || id.startsWith(clean)) score = 80;
    else if (aliases.some((a) => a.startsWith(clean))) score = 70;
    else if (name.includes(clean) || id.includes(clean)) score = 50;
    else if (aliases.some((a) => a.includes(clean))) score = 40;
    else if (description.includes(clean)) score = 20;
    if (score >= 0) scored.push({ cmd, score });
  });
  return scored
    .sort((a, b) => (b.score - a.score) || a.cmd.name.localeCompare(b.cmd.name))
    .map((entry) => entry.cmd);
}'''


# ------------------------------------------------------------- BARRE --------
BAR_OLD = '  const suggestions = input.trim().length > 0 ? searchCadCommands(input) : [];'
BAR_NEW = '''  // PATCH 017C : la liste ne doit jamais etre vide quand l utilisateur tape.
  // Si aucune commande du catalogue ne correspond, on propose l execution
  // directe de la saisie, comme dans AutoCAD.
  const catalogMatches = input.trim().length > 0 ? searchCadCommands(input) : [];
  const rawFallback: CadCommandItem[] =
    input.trim().length > 0 && catalogMatches.length === 0
      ? [{
          id: "__pdi_raw__",
          name: input.trim().toUpperCase(),
          aliases: [],
          description: "Executer cette saisie comme commande PD&I",
          category: "Direct",
          shortcut: "Entree",
          icon: "Terminal",
        } as CadCommandItem]
      : [];
  const suggestions = catalogMatches.length > 0 ? catalogMatches : rawFallback;'''

BAR_RUN_OLD = '''  const runCommandItem = (cmd: CadCommandItem) => {
    setHistory((prev) => [cmd.name, ...prev.filter((h) => h !== cmd.name)].slice(0, 10));
    onExecuteCommand(cmd.name);'''
BAR_RUN_NEW = '''  const runCommandItem = (cmd: CadCommandItem) => {
    // PATCH 017C : la ligne de repli execute la saisie complete (arguments inclus).
    const payload = cmd.id === "__pdi_raw__" ? input.trim() : cmd.name;
    setHistory((prev) => [payload, ...prev.filter((h) => h !== payload)].slice(0, 10));
    onExecuteCommand(payload);'''

BAR_Z_OLD = 'z-[10010] animate-in'
BAR_Z_NEW = 'z-[10060] animate-in'


# ------------------------------------------------------------ MOTEUR --------
STATE_OLD = '  const [projectSetupOpen, setProjectSetupOpen] = useState(false);'
STATE_NEW = STATE_OLD + '''
  // PATCH 017C : affichage des tags sur le plan + gestionnaire de donnees.
  const [tagDisplay, setTagDisplay] = useState<boolean>(() => {
    try { return window.localStorage.getItem("pdi.tagDisplay.v1") === "1"; } catch { return false; }
  });
  const [dataManagerOpen, setDataManagerOpen] = useState(false);
  useEffect(() => {
    try { window.localStorage.setItem("pdi.tagDisplay.v1", tagDisplay ? "1" : "0"); } catch {}
  }, [tagDisplay]);'''

RENUM_OLD = '''  const segmentStrokeColor = (seg: IsoSegment) => {'''
RENUM_NEW = '''  // PATCH 017C : renumerotation en serie des tags, par service.
  const renumberTags = (serviceFilter?: string, startAt?: number) => {
    const svcFilter = serviceFilter ? serviceFilter.toUpperCase() : "";
    const start = startAt && startAt > 0 ? Math.floor(startAt) : 1;
    let touched = 0;
    setSegments(prev => {
      const counters = new Map<string, number>();
      return prev.map(s => {
        const svc = (s.service || defaultService).toUpperCase();
        if (svcFilter && svc !== svcFilter) return s;
        const sp = (s.spec || defaultSpec).toUpperCase();
        const next = counters.has(svc) ? (counters.get(svc) as number) + 1 : start;
        counters.set(svc, next);
        touched += 1;
        const specObj = pdiFindSpec(projectSetup, sp);
        const tag = pdiBuildTag({ nominalDiameter: s.dn, service: svc, number: next, spec: sp }, activeTagFormat);
        return {
          ...s,
          service: svc,
          spec: sp,
          tagNumber: next,
          tagFormatName: activeTagFormat.name,
          tag,
          material: specObj ? specObj.material : s.material,
          pressureClass: specObj ? specObj.pressureClass : s.pressureClass,
        };
      });
    });
    setAutocadPrompt(
      "RENUMBER : " + (svcFilter ? "service " + svcFilter : "tous services") +
      ", numerotation a partir de " + start + " (" + touched + " troncon(s))."
    );
    setStatusMessage("Renumerotation des tags effectuee");
  };

  const segmentStrokeColor = (seg: IsoSegment) => {'''

CMD_OLD = '''    if (["style"].includes(rawVerb)) {'''
CMD_NEW = '''    // PATCH 017C : affichage des tags, renumerotation, gestionnaire de donnees.
    if (["tagdisplay", "td", "affichetag", "tagon"].includes(rawVerb)) {
      const arg = (rawArg || "").toLowerCase();
      const on = ["on", "1", "oui", "true"].includes(arg);
      const off = ["off", "0", "non", "false"].includes(arg);
      const next = off ? false : on ? true : !tagDisplay;
      setTagDisplay(next);
      setAutocadPrompt("AFFICHAGE DES TAGS : " + (next ? "ON" : "OFF") + ".");
      setStatusMessage("Tags sur le plan " + (next ? "affiches" : "masques"));
      return;
    }
    if (["renumber", "rn", "renumeroter"].includes(rawVerb)) {
      const first = (rawParts[1] || "").toUpperCase();
      const isNumberFirst = first !== "" && !isNaN(Number(first));
      const svc = isNumberFirst ? undefined : (first || undefined);
      const start = isNumberFirst ? Number(first) : Number(rawParts[2] || "1");
      renumberTags(svc, isNaN(start) ? 1 : start);
      return;
    }
    if (["datamanager", "dm", "donnees", "tableau"].includes(rawVerb)) {
      setDataManagerOpen(true);
      setAutocadPrompt("DATA MANAGER : liste des elements tagges du projet.");
      return;
    }
    if (["style"].includes(rawVerb)) {'''

LABEL_OLD = '''                      <path d={path} stroke={segmentStrokeColor(s)} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </>; })()}'''
LABEL_NEW = '''                      <path d={path} stroke={segmentStrokeColor(s)} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </>; })()}
                    {/* PATCH 017C : tag industriel affiche sur le plan */}
                    {tagDisplay && s.tag && viewport.zoom > 0.35 && (
                      <text x={mx} y={my - (width / 2) - 5} fill="#fcd34d" fontSize="9" fontWeight="bold"
                        textAnchor="middle" paintOrder="stroke" stroke="#0f172a" strokeWidth="3" pointerEvents="none">
                        {s.tag}
                      </text>
                    )}'''

DM_ANCHOR = '    {/* PATCH 017B : modal Project Setup repositionne au niveau racine */}'
DM_NEW = '''    {/* PATCH 017C : Data Manager - vue tabulaire des elements tagges */}
    {dataManagerOpen && <div className="fixed inset-0 z-[10065] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setDataManagerOpen(false)}>
      <div className="w-full max-w-5xl max-h-[86vh] overflow-auto rounded-2xl border border-cyan-600/50 bg-slate-950 p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <div className="text-sm font-black text-cyan-300 uppercase">Data Manager PD&amp;I</div>
            <div className="text-[10px] text-slate-400">{segments.filter(s => s.tag).length}/{segments.length} troncon(s) tagge(s) · {tagIssues} anomalie(s) · format {activeTagFormat.name}</div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={autoTagAllSegments} className="px-3 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-700/70 text-amber-200 text-[10px] font-black">Tagger tout</button>
            <button type="button" onClick={() => renumberTags(undefined, 1)} className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-black">Renumeroter</button>
            <button type="button" onClick={() => setDataManagerOpen(false)} className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-black">Fermer</button>
          </div>
        </div>
        <div className="overflow-auto rounded-xl border border-slate-800">
          <table className="w-full text-[11px]">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="text-left px-2 py-1.5 font-black uppercase text-[9px]">Tag</th>
                <th className="text-left px-2 py-1.5 font-black uppercase text-[9px]">DN</th>
                <th className="text-left px-2 py-1.5 font-black uppercase text-[9px]">Service</th>
                <th className="text-left px-2 py-1.5 font-black uppercase text-[9px]">Spec</th>
                <th className="text-left px-2 py-1.5 font-black uppercase text-[9px]">Materiau</th>
                <th className="text-left px-2 py-1.5 font-black uppercase text-[9px]">Classe</th>
                <th className="text-right px-2 py-1.5 font-black uppercase text-[9px]">Longueur (m)</th>
              </tr>
            </thead>
            <tbody>
              {segments.map(s => (
                <tr key={s.id}
                  onClick={() => { selectSegmentV44(s.id, false); setDataManagerOpen(false); }}
                  className="border-t border-slate-800 hover:bg-slate-900/70 cursor-pointer">
                  <td className="px-2 py-1 font-mono font-bold text-amber-300">{s.tag || "-"}</td>
                  <td className="px-2 py-1 text-slate-200">DN{s.dn}</td>
                  <td className="px-2 py-1 text-cyan-300 font-bold">{s.service || "-"}</td>
                  <td className="px-2 py-1 text-slate-300">{s.spec || "-"}</td>
                  <td className="px-2 py-1 text-slate-400">{s.material || "-"}</td>
                  <td className="px-2 py-1 text-slate-400">{s.pressureClass || "-"}</td>
                  <td className="px-2 py-1 text-right text-slate-200">{(s.length || 0).toFixed(3)}</td>
                </tr>
              ))}
              {segments.length === 0 && (
                <tr><td colSpan={7} className="px-2 py-4 text-center text-slate-500">Aucun troncon dans le plan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="text-[10px] text-slate-500">Clic sur une ligne : selection du troncon sur le plan. Cette table est la base directe du futur export BOM.</div>
      </div>
    </div>}

''' + DM_ANCHOR


def main():
    for path in (ENGINE, CATALOG, BAR):
        if not os.path.isfile(path):
            print("ERREUR : fichier introuvable :", path)
            return 1
        backup = path + ".before017C"
        if not os.path.isfile(backup):
            shutil.copyfile(path, backup)

    c = open(CATALOG, encoding="utf-8").read()
    c = sub(c, CAT_OLD, CAT_NEW, "13 commandes PD&I ajoutees au catalogue d autocompletion")
    c = sub(c, SEARCH_OLD, SEARCH_NEW, "Recherche de commandes normalisee et classee par pertinence")
    open(CATALOG, "w", encoding="utf-8").write(c)

    b = open(BAR, encoding="utf-8").read()
    b = sub(b, BAR_OLD, BAR_NEW, "Liste de suggestions jamais vide (execution directe en repli)")
    b = sub(b, BAR_RUN_OLD, BAR_RUN_NEW, "Execution de la saisie brute avec ses arguments")
    b = sub(b, BAR_Z_OLD, BAR_Z_NEW, "Liste de commandes remontee au premier plan")
    open(BAR, "w", encoding="utf-8").write(b)

    e = open(ENGINE, encoding="utf-8").read()
    e = sub(e, STATE_OLD, STATE_NEW, "Etats tagDisplay et dataManagerOpen ajoutes")
    e = sub(e, RENUM_OLD, RENUM_NEW, "Moteur de renumerotation des tags ajoute")
    e = sub(e, CMD_OLD, CMD_NEW, "Commandes TAGDISPLAY / RENUMBER / DATAMANAGER ajoutees")
    e = sub(e, LABEL_OLD, LABEL_NEW, "Tags affiches sur le plan de travail")
    e = sub(e, DM_ANCHOR, DM_NEW, "Fenetre Data Manager ajoutee")
    open(ENGINE, "w", encoding="utf-8").write(e)

    with open(REPORT, "w", encoding="utf-8") as f:
        f.write("# PATCH 017C - Registre de commandes, TAGDISPLAY, RENUMBER, DATAMANAGER\n\n")
        f.write("Date : " + datetime.datetime.now().isoformat(timespec="seconds") + "\n\n")
        f.write("## Cause racine : commandes invisibles\n")
        f.write("- Les commandes PD&I (PROJECTSETUP, TAG, TAGFORMAT, SERVICE, SPEC, AUTOTAG, HIDE...)\n")
        f.write("  etaient traitees par executeCadCommand mais absentes de AUTOCAD_COMMANDS.\n")
        f.write("- La liste de suggestions n affiche que le catalogue : 0 resultat = liste masquee,\n")
        f.write("  d ou l impression que les commandes n existent pas (saisies project / color).\n")
        f.write("- La recherche ignorait les accents, les id et ne classait pas les resultats.\n\n")
        f.write("## Modifications\n")
        for n in notes:
            f.write("- " + n + "\n")
        f.write("\n## Tests\n")
        f.write("1. Taper project : PROJECTSETUP doit apparaitre en tete de liste, Entree ouvre la fenetre.\n")
        f.write("2. Taper color : COULEUR et COULEURSERVICE apparaissent.\n")
        f.write("3. Taper tag : TAG, TAGFORMAT, TAGDISPLAY, AUTOTAG apparaissent.\n")
        f.write("4. Taper une commande inconnue : ligne Executer cette saisie, jamais de liste vide.\n")
        f.write("5. TAG HC CS300 sur un troncon, puis TAGDISPLAY ON : le tag s affiche sur le plan.\n")
        f.write("6. RENUMBER HC 10 : les tags HC repartent de 010.\n")
        f.write("7. DATAMANAGER ou DM : table de tous les troncons, clic sur une ligne = selection.\n")
        f.write("8. npm run lint puis npm run build.\n")

    print("PATCH 017C applique localement.")
    for n in notes:
        print("- " + n)
    print("Rapport : " + REPORT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
