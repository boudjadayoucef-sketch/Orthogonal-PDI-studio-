// PD&I - Moteur de tagging industriel (PATCH 017A)
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
