#!/usr/bin/env python3
# PATCH 017A - Project Setup + Tagging industriel PD&I
import os, shutil, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.join(ROOT, "src", "pdi", "isometric", "engine", "IsometrieModuleV48d.tsx")
TAGGING = os.path.join(ROOT, "src", "pdi", "isometric", "engine", "pdiTagging.ts")
REPORT = os.path.join(ROOT, "017A_project_setup_tagging_REPORT.md")
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
TAGGING_SRC = '''// PD&I - Moteur de tagging industriel (PATCH 017A)
// Format standard : Diametre - Fluide - Numero - Classe   ex: 100-HC-001-CS300

export interface PdiTagPart {
  field: "NominalDiameter" | "Service" | "Number" | "Spec" | "Free";
  literal?: string;
  pad?: number;
}

export interface PdiTagFormat {
  name: string;
  separator: string;
  parts: PdiTagPart[];
  appliesTo: "line" | "equipment" | "instrument";
}

export interface PdiService {
  code: string;
  label: string;
  color: string;
}

export interface PdiSpec {
  code: string;
  material: string;
  pressureClass: string;
  minDn: number;
  maxDn: number;
}

export interface PdiProjectSetup {
  projectName: string;
  projectCode: string;
  client: string;
  unit: "mm" | "inch";
  standard: "ANSI" | "DIN";
  tagFormatName: string;
  formats: PdiTagFormat[];
  services: PdiService[];
  specs: PdiSpec[];
}

export const PDI_DEFAULT_SERVICES: PdiService[] = [
  { code: "HC", label: "Hydrocarbure", color: "#F59E0B" },
  { code: "WA", label: "Eau", color: "#0EA5E9" },
  { code: "ST", label: "Vapeur", color: "#F87171" },
  { code: "AI", label: "Air instrument", color: "#A5B4FC" },
  { code: "N2", label: "Azote", color: "#34D399" },
  { code: "FG", label: "Gaz combustible", color: "#FBBF24" },
  { code: "CW", label: "Eau de refroidissement", color: "#22D3EE" },
  { code: "FW", label: "Eau incendie", color: "#EF4444" },
];

export const PDI_DEFAULT_SPECS: PdiSpec[] = [
  { code: "CS150", material: "Acier carbone", pressureClass: "Class 150", minDn: 15, maxDn: 600 },
  { code: "CS300", material: "Acier carbone", pressureClass: "Class 300", minDn: 15, maxDn: 600 },
  { code: "CS600", material: "Acier carbone", pressureClass: "Class 600", minDn: 15, maxDn: 400 },
  { code: "SS150", material: "Acier inoxydable 316L", pressureClass: "Class 150", minDn: 15, maxDn: 300 },
  { code: "SS300", material: "Acier inoxydable 316L", pressureClass: "Class 300", minDn: 15, maxDn: 300 },
  { code: "GRE", material: "Composite GRE", pressureClass: "PN16", minDn: 50, maxDn: 600 },
  { code: "PE100", material: "Polyethylene PE100", pressureClass: "PN16", minDn: 20, maxDn: 400 },
];

export const PDI_TAG_FORMAT_STANDARD: PdiTagFormat = {
  name: "Tag_Ligne_Standard",
  separator: "-",
  appliesTo: "line",
  parts: [
    { field: "NominalDiameter" },
    { field: "Service" },
    { field: "Number", pad: 3 },
    { field: "Spec" },
  ],
};

export const PDI_DEFAULT_PROJECT_SETUP: PdiProjectSetup = {
  projectName: "Projet PD&I",
  projectCode: "PDI",
  client: "",
  unit: "mm",
  standard: "ANSI",
  tagFormatName: "Tag_Ligne_Standard",
  formats: [PDI_TAG_FORMAT_STANDARD],
  services: PDI_DEFAULT_SERVICES,
  specs: PDI_DEFAULT_SPECS,
};

export interface PdiTagFields {
  nominalDiameter?: number;
  service?: string;
  number?: number;
  spec?: string;
}

export function pdiBuildTag(fields: PdiTagFields, format: PdiTagFormat): string {
  const chunks: string[] = [];
  for (const part of format.parts) {
    if (part.field === "NominalDiameter") chunks.push(String(fields.nominalDiameter || ""));
    else if (part.field === "Service") chunks.push(fields.service || "");
    else if (part.field === "Number") chunks.push(String(fields.number || 0).padStart(part.pad || 3, "0"));
    else if (part.field === "Spec") chunks.push(fields.spec || "");
    else chunks.push(part.literal || "");
  }
  return chunks.filter(c => c.length > 0).join(format.separator);
}

export function pdiParseTag(tag: string, format: PdiTagFormat): PdiTagFields {
  const chunks = (tag || "").split(format.separator);
  const out: PdiTagFields = {};
  format.parts.forEach((part, i) => {
    const value = chunks[i];
    if (value === undefined) return;
    if (part.field === "NominalDiameter") out.nominalDiameter = Number(value) || undefined;
    else if (part.field === "Service") out.service = value;
    else if (part.field === "Number") out.number = Number(value) || undefined;
    else if (part.field === "Spec") out.spec = value;
  });
  return out;
}

export function pdiNextTagNumber(existing: string[], service: string, dn: number, format: PdiTagFormat): number {
  const used = new Set<number>();
  for (const tag of existing) {
    const f = pdiParseTag(tag, format);
    if (f.service === service && f.nominalDiameter === dn && f.number) used.add(f.number);
  }
  let n = 1;
  while (used.has(n)) n += 1;
  return n;
}

export function pdiValidateTag(tag: string, allTags: string[], format: PdiTagFormat): { ok: boolean; reason?: string } {
  if (!tag || tag.trim().length === 0) return { ok: false, reason: "Tag vide" };
  const fields = pdiParseTag(tag, format);
  if (!fields.nominalDiameter) return { ok: false, reason: "Diametre manquant" };
  if (!fields.service) return { ok: false, reason: "Fluide / service manquant" };
  if (!fields.number) return { ok: false, reason: "Numero manquant" };
  if (!fields.spec) return { ok: false, reason: "Spec manquante" };
  if (allTags.filter(t => t === tag).length > 1) return { ok: false, reason: "Tag en doublon" };
  return { ok: true };
}

export function pdiSpecAllowsDn(spec: PdiSpec | undefined, dn: number): boolean {
  if (!spec) return true;
  return dn >= spec.minDn && dn <= spec.maxDn;
}

export function pdiFindSpec(setup: PdiProjectSetup, code: string): PdiSpec | undefined {
  return setup.specs.find(s => s.code.toUpperCase() === (code || "").toUpperCase());
}

export function pdiFindService(setup: PdiProjectSetup, code: string): PdiService | undefined {
  return setup.services.find(s => s.code.toUpperCase() === (code || "").toUpperCase());
}

export function pdiActiveFormat(setup: PdiProjectSetup): PdiTagFormat {
  return setup.formats.find(f => f.name === setup.tagFormatName) || PDI_TAG_FORMAT_STANDARD;
}
'''
TYPE_NODE_OLD = '''  ports?: IsoPort[];
  lineId?: string;
}'''
TYPE_NODE_NEW = '''  ports?: IsoPort[];
  lineId?: string;
  // PATCH 017A : tagging industriel.
  tag?: string;
  tagFormatName?: string;
  service?: string;
  spec?: string;
  tagNumber?: number;
}'''

TYPE_SEG_OLD = '''  // V4.7 : rattachement obligatoire après normalisation.
  lineId?: string;
}'''
TYPE_SEG_NEW = '''  // V4.7 : rattachement obligatoire après normalisation.
  lineId?: string;
  // PATCH 017A : tagging industriel.
  tag?: string;
  tagFormatName?: string;
  service?: string;
  spec?: string;
  tagNumber?: number;
  pressureClass?: string;
  insulation?: boolean;
  lineFunction?: string;
}'''

STATE_OLD = '''  useEffect(() => {
    try { window.localStorage.setItem("pdi.workspaceVisualStyle.v1", JSON.stringify(workspaceVisualStyle)); } catch {}
  }, [workspaceVisualStyle]);'''
STATE_NEW = STATE_OLD + '''

  // PATCH 017A : Project Setup PD&I persistant (projet, format de tag, services, specs).
  const [projectSetup, setProjectSetup] = useState<PdiProjectSetup>(() => {
    try {
      const raw = window.localStorage.getItem("pdi.projectSetup.v1");
      if (raw) return { ...PDI_DEFAULT_PROJECT_SETUP, ...JSON.parse(raw) };
    } catch {}
    return PDI_DEFAULT_PROJECT_SETUP;
  });
  const [projectSetupOpen, setProjectSetupOpen] = useState(false);
  useEffect(() => {
    try { window.localStorage.setItem("pdi.projectSetup.v1", JSON.stringify(projectSetup)); } catch {}
  }, [projectSetup]);'''

HELPERS_ANCHOR = '''  const executeCadCommand = (cmdInput: CadCommandItem | string) => {'''
HELPERS_NEW = '''  // ----- PATCH 017A : moteur de tagging industriel -----
  const activeTagFormat = pdiActiveFormat(projectSetup);
  const defaultService = projectSetup.services[0] ? projectSetup.services[0].code : "HC";
  const defaultSpec = projectSetup.specs[0] ? projectSetup.specs[0].code : "CS150";

  const targetSegmentIds = () => {
    if (selectedSegmentIds.length > 0) return selectedSegmentIds;
    if (selectedSegmentId) return [selectedSegmentId];
    return [];
  };

  const applyTagToSelection = (service?: string, spec?: string) => {
    const ids = targetSegmentIds();
    if (ids.length === 0) {
      setAutocadPrompt("TAG : selectionnez au moins un troncon de tuyauterie.");
      return;
    }
    setSegments(prev => {
      const known = prev.map(x => x.tag || "").filter(t => t.length > 0);
      let offset = 0;
      return prev.map(s => {
        if (!ids.includes(s.id)) return s;
        const svc = (service || s.service || defaultService).toUpperCase();
        const sp = (spec || s.spec || defaultSpec).toUpperCase();
        const num = s.tagNumber || (pdiNextTagNumber(known, svc, s.dn, activeTagFormat) + offset);
        offset += 1;
        const specObj = pdiFindSpec(projectSetup, sp);
        const tag = pdiBuildTag({ nominalDiameter: s.dn, service: svc, number: num, spec: sp }, activeTagFormat);
        known.push(tag);
        return {
          ...s,
          service: svc,
          spec: sp,
          tagNumber: num,
          tagFormatName: activeTagFormat.name,
          tag,
          material: specObj ? specObj.material : s.material,
          pressureClass: specObj ? specObj.pressureClass : s.pressureClass,
        };
      });
    });
    setAutocadPrompt("TAG : " + ids.length + " troncon(s) tagge(s) au format " + activeTagFormat.name + ".");
    setStatusMessage("Tagging applique (" + ids.length + ")");
  };

  const autoTagAllSegments = () => {
    setSegments(prev => {
      const known: string[] = [];
      return prev.map(s => {
        const svc = (s.service || defaultService).toUpperCase();
        const sp = (s.spec || defaultSpec).toUpperCase();
        const num = pdiNextTagNumber(known, svc, s.dn, activeTagFormat);
        const specObj = pdiFindSpec(projectSetup, sp);
        const tag = pdiBuildTag({ nominalDiameter: s.dn, service: svc, number: num, spec: sp }, activeTagFormat);
        known.push(tag);
        return { ...s, service: svc, spec: sp, tagNumber: num, tagFormatName: activeTagFormat.name, tag, material: specObj ? specObj.material : s.material, pressureClass: specObj ? specObj.pressureClass : s.pressureClass };
      });
    });
    setAutocadPrompt("AUTOTAG : tous les troncons ont recu un tag " + activeTagFormat.name + ".");
  };

  const tagIssues = segments.filter(s => s.tag && !pdiValidateTag(s.tag, segments.map(x => x.tag || ""), activeTagFormat).ok).length;

''' + HELPERS_ANCHOR

CMD_OLD = '''    if (["rotation", "rotate", "ro", "tourner"].includes(rawVerb)) {
      startGuidedCommand("rotate");
      return;
    }'''
CMD_NEW = CMD_OLD + '''

    // PATCH 017A : commandes de tagging et Project Setup.
    if (["projectsetup", "ps", "setup", "projet"].includes(rawVerb)) {
      setProjectSetupOpen(true);
      setAutocadPrompt("PROJECT SETUP : configuration projet, formats de tag, services et specs.");
      return;
    }
    if (["tagformat", "tf"].includes(rawVerb)) {
      setProjectSetupOpen(true);
      setAutocadPrompt("TAG FORMAT ACTIF : " + activeTagFormat.name + " (" + activeTagFormat.parts.map(p => p.field).join(" " + activeTagFormat.separator + " ") + ").");
      return;
    }
    if (["tag"].includes(rawVerb)) {
      applyTagToSelection(rawParts[1], rawParts[2]);
      return;
    }
    if (["service", "fluide"].includes(rawVerb)) {
      if (!rawArg) { setAutocadPrompt("SERVICE : indiquez un code (" + projectSetup.services.map(s => s.code).join(", ") + ")."); return; }
      applyTagToSelection(rawArg, undefined);
      return;
    }
    if (["spec", "classe"].includes(rawVerb)) {
      if (!rawArg) { setAutocadPrompt("SPEC : indiquez un code (" + projectSetup.specs.map(s => s.code).join(", ") + ")."); return; }
      applyTagToSelection(undefined, rawArg);
      return;
    }
    if (["autotag"].includes(rawVerb)) {
      autoTagAllSegments();
      return;
    }'''
INSP_OLD = '''                      <div>
                        <label className="text-[8px] font-bold text-slate-400 block mb-0.5">Pipeline / Source</label>'''
INSP_NEW = '''                      <div className="p-2 rounded-lg bg-slate-950 border border-amber-700/50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-amber-300 uppercase">Tag industriel</span>
                          <span className="text-[8px] text-slate-500 font-mono">{activeTagFormat.name}</span>
                        </div>
                        <input
                          value={selectedSeg.tag || ""}
                          placeholder="100-HC-001-CS300"
                          onChange={e => setSegments(prev => prev.map(s => s.id === selectedSeg.id ? { ...s, tag: e.target.value, tagFormatName: activeTagFormat.name } : s))}
                          className="w-full bg-slate-900 border border-amber-700/60 rounded px-2 py-1 text-[11px] font-mono font-bold text-amber-200 outline-none"
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <select
                            value={selectedSeg.service || ""}
                            onChange={e => applyTagToSelection(e.target.value, undefined)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[9px] font-bold text-white outline-none"
                          >
                            <option value="">Service…</option>
                            {projectSetup.services.map(sv => (
                              <option key={sv.code} value={sv.code}>{sv.code} — {sv.label}</option>
                            ))}
                          </select>
                          <select
                            value={selectedSeg.spec || ""}
                            onChange={e => applyTagToSelection(undefined, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[9px] font-bold text-white outline-none"
                          >
                            <option value="">Spec…</option>
                            {projectSetup.specs.map(sp => (
                              <option key={sp.code} value={sp.code}>{sp.code} — {sp.pressureClass}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => applyTagToSelection()} className="flex-1 py-1 rounded bg-amber-950/70 hover:bg-amber-900 border border-amber-700/70 text-amber-200 text-[9px] font-black">Generer le tag</button>
                          <button type="button" onClick={() => setProjectSetupOpen(true)} className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-black">Setup</button>
                        </div>
                        {selectedSeg.tag && !pdiValidateTag(selectedSeg.tag, segments.map(x => x.tag || ""), activeTagFormat).ok && (
                          <div className="text-[9px] font-bold text-red-400">
                            Tag invalide : {pdiValidateTag(selectedSeg.tag, segments.map(x => x.tag || ""), activeTagFormat).reason}
                          </div>
                        )}
                      </div>
''' + INSP_OLD

MODAL_ANCHOR = '''    {/* PATCH 016A'''
MODAL_NEW = '''    {/* PATCH 017A : Project Setup PD&I */}
    {projectSetupOpen && <div className="fixed inset-0 z-[10060] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setProjectSetupOpen(false)}>
      <div className="w-full max-w-3xl max-h-[86vh] overflow-auto rounded-2xl border border-cyan-600/50 bg-slate-950 p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <div className="text-sm font-black text-cyan-300 uppercase">Project Setup PD&amp;I</div>
            <div className="text-[10px] text-slate-500">Projet, formats de tag, services et specs — base du BOM et du 3D</div>
          </div>
          <button type="button" onClick={() => setProjectSetupOpen(false)} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-black">Fermer</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase">Nom du projet</span>
            <input value={projectSetup.projectName} onChange={e => setProjectSetup(p => ({ ...p, projectName: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-bold text-white outline-none" />
          </label>
          <label className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase">Code projet</span>
            <input value={projectSetup.projectCode} onChange={e => setProjectSetup(p => ({ ...p, projectCode: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono font-bold text-cyan-300 outline-none" />
          </label>
          <label className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase">Client</span>
            <input value={projectSetup.client} onChange={e => setProjectSetup(p => ({ ...p, client: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-bold text-white outline-none" />
          </label>
          <label className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase">Standard</span>
            <select value={projectSetup.standard} onChange={e => setProjectSetup(p => ({ ...p, standard: e.target.value as "ANSI" | "DIN" }))} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-bold text-white outline-none">
              <option value="ANSI">ANSI</option>
              <option value="DIN">DIN</option>
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-amber-700/50 bg-slate-900/60 p-3 space-y-2">
          <div className="text-[10px] font-black text-amber-300 uppercase">Format de tag actif</div>
          <div className="flex items-center gap-2">
            <select value={projectSetup.tagFormatName} onChange={e => setProjectSetup(p => ({ ...p, tagFormatName: e.target.value }))} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-bold text-white outline-none">
              {projectSetup.formats.map(f => (<option key={f.name} value={f.name}>{f.name}</option>))}
            </select>
            <span className="font-mono text-[11px] text-amber-200 font-bold">
              {activeTagFormat.parts.map(p => p.field).join(" " + activeTagFormat.separator + " ")}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">Exemple : <span className="font-mono text-amber-300 font-bold">100-HC-001-CS300</span></div>
          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={autoTagAllSegments} className="px-3 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-700/70 text-amber-200 text-[10px] font-black">Tagger tous les troncons</button>
            <span className="text-[10px] text-slate-500">{segments.filter(s => s.tag).length}/{segments.length} tagges · {tagIssues} anomalie(s)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
            <div className="text-[10px] font-black text-cyan-300 uppercase mb-1.5">Services / fluides</div>
            <div className="space-y-1 max-h-48 overflow-auto">
              {projectSetup.services.map(sv => (
                <div key={sv.code} className="flex items-center justify-between text-[10px] text-slate-300">
                  <span className="font-mono font-bold" style={{ color: sv.color }}>{sv.code}</span>
                  <span className="text-slate-400">{sv.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
            <div className="text-[10px] font-black text-cyan-300 uppercase mb-1.5">Specs tuyauterie</div>
            <div className="space-y-1 max-h-48 overflow-auto">
              {projectSetup.specs.map(sp => (
                <div key={sp.code} className="flex items-center justify-between text-[10px] text-slate-300">
                  <span className="font-mono font-bold text-cyan-300">{sp.code}</span>
                  <span className="text-slate-400">{sp.material} · {sp.pressureClass} · DN{sp.minDn}-{sp.maxDn}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>}

''' + MODAL_ANCHOR

def insert_import(s):
    marker = "import {\n  PDI_DEFAULT_PROJECT_SETUP,"
    if marker in s:
        notes.append("DEJA APPLIQUE : import du moteur de tagging")
        return s
    lines = s.split("\n")
    last = -1
    for i, ln in enumerate(lines[:200]):
        if ln.startswith("import ") or (ln.startswith("} from ") and last >= 0):
            last = i
    if last < 0:
        notes.append("NON TROUVE : zone d'import")
        return s
    block = (
        "import {\n"
        "  PDI_DEFAULT_PROJECT_SETUP,\n"
        "  pdiActiveFormat,\n"
        "  pdiBuildTag,\n"
        "  pdiFindSpec,\n"
        "  pdiNextTagNumber,\n"
        "  pdiValidateTag,\n"
        "} from \"./pdiTagging\";\n"
        "import type { PdiProjectSetup } from \"./pdiTagging\";"
    )
    lines.insert(last + 1, block)
    notes.append("Import du moteur de tagging ajoute")
    return "\n".join(lines)


def main():
    if not os.path.isfile(ENGINE):
        print("ERREUR : fichier moteur introuvable :", ENGINE)
        return 1

    if not os.path.isfile(TAGGING):
        with open(TAGGING, "w", encoding="utf-8") as f:
            f.write(TAGGING_SRC)
        notes.append("Module pdiTagging.ts cree")
    else:
        notes.append("DEJA APPLIQUE : module pdiTagging.ts present")

    backup = ENGINE + ".before017A"
    if not os.path.isfile(backup):
        shutil.copyfile(ENGINE, backup)

    s = open(ENGINE, encoding="utf-8").read()

    s = insert_import(s)
    s = sub(s, TYPE_NODE_OLD, TYPE_NODE_NEW, "Champs de tag ajoutes sur IsoNode")
    s = sub(s, TYPE_SEG_OLD, TYPE_SEG_NEW, "Champs de tag ajoutes sur IsoSegment")
    s = sub(s, STATE_OLD, STATE_NEW, "Etat projectSetup + persistance ajoutes")
    s = sub(s, HELPERS_ANCHOR, HELPERS_NEW, "Moteur de tagging ajoute")
    s = sub(s, CMD_OLD, CMD_NEW, "Commandes PROJECTSETUP / TAGFORMAT / TAG / SERVICE / SPEC / AUTOTAG")
    s = sub(s, INSP_OLD, INSP_NEW, "Bloc Tag industriel ajoute dans l inspecteur")
    s = sub(s, MODAL_ANCHOR, MODAL_NEW, "Fenetre Project Setup ajoutee")

    open(ENGINE, "w", encoding="utf-8").write(s)

    with open(REPORT, "w", encoding="utf-8") as f:
        f.write("# PATCH 017A - Project Setup + Tagging industriel\n\n")
        f.write("Date : " + datetime.datetime.now().isoformat(timespec="seconds") + "\n\n")
        f.write("## Modifications\n")
        for n in notes:
            f.write("- " + n + "\n")
        f.write("\n## Tests\n")
        f.write("1. Taper PROJECTSETUP (ou PS) : la fenetre Project Setup doit s ouvrir.\n")
        f.write("2. Verifier le format actif Tag_Ligne_Standard et l exemple 100-HC-001-CS300.\n")
        f.write("3. Selectionner un troncon, ouvrir l inspecteur : bloc Tag industriel visible.\n")
        f.write("4. Choisir un service puis une spec : le tag se genere, le materiau suit la spec.\n")
        f.write("5. Taper TAG HC CS300 sur une selection : tag applique sans doublon.\n")
        f.write("6. Taper AUTOTAG : tous les troncons recoivent un tag numerote.\n")
        f.write("7. Recharger la page : le Project Setup doit etre conserve.\n")
        f.write("8. npm run lint puis npm run build.\n")

    print("PATCH 017A applique localement.")
    for n in notes:
        print("- " + n)
    print("Rapport : " + REPORT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
