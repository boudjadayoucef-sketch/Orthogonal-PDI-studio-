import React, { useState } from "react";
import {
  FileText,
  Scan,
  Grid,
  Camera,
  FolderOpen,
  Sparkles,
  X,
  ArrowRight,
  Layers,
  CheckCircle2,
  Cpu,
  Compass
} from "lucide-react";

export type PdiProjectMode = "sketch" | "blank" | "vision" | "cad" | "assistant";

export interface PdiNewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (params: {
    name: string;
    service: string;
    dn: number;
    pressureClass: string;
    material: string;
    mode: "sketch" | "blank" | "vision" | "cad" | "assistant";
  }) => void;
}

export const PdiNewProjectModal: React.FC<PdiNewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState(`L-${Math.floor(100 + Math.random() * 900)}-PROC-01`);
  const [service, setService] = useState("Procédé Chimique (PROC)");
  const [dn, setDn] = useState<number>(100);
  const [pressureClass, setPressureClass] = useState("300#");
  const [material, setMaterial] = useState("A106-B (Acier Carbone)");
  const [selectedMethod, setSelectedMethod] = useState<"sketch" | "blank" | "vision" | "cad" | "assistant">("sketch");

  if (!isOpen) return null;

  const handleSubmit = (method: "sketch" | "blank" | "vision" | "cad" | "assistant") => {
    onCreateProject({
      name: name.trim() || "Nouveau plan ISO",
      service,
      dn,
      pressureClass,
      material,
      mode: method,
    });
    onClose();
  };

  return (
    <div
      className="pdi-modal-backdrop fixed inset-0 z-[100100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#0b0f19] border border-cyan-900/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200 my-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 25px 60px -15px rgba(6, 182, 212, 0.15), 0 0 40px rgba(0, 0, 0, 0.8)",
        }}
      >
        {/* MODAL HEADER */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-slate-900 via-[#0d1527] to-slate-900 border-b border-cyan-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                PD&I ISOMETRIC STUDIO · NOUVEAU PLAN
              </div>
              <h2 className="text-base sm:text-lg font-black text-white m-0 tracking-tight">
                Nouveau Projet &amp; Ligne de Tuyauterie
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
            title="Fermer (Échap)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* SECTION 1: SPÉCIFICATIONS DE LA LIGNE */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              1. Paramètres &amp; Spécifications de la Ligne
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="space-y-1.5 sm:col-span-2">
                <span className="text-[11px] font-semibold text-slate-400">Nom / Tag de la Ligne</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: L-100-PROC-01"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Diamètre Nominal (DN)</span>
                <select
                  value={dn}
                  onChange={(e) => setDn(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm font-bold text-cyan-300 outline-none"
                >
                  <option value={25}>DN 25 (1")</option>
                  <option value={50}>DN 50 (2")</option>
                  <option value={80}>DN 80 (3")</option>
                  <option value={100}>DN 100 (4")</option>
                  <option value={150}>DN 150 (6")</option>
                  <option value={200}>DN 200 (8")</option>
                  <option value={250}>DN 250 (10")</option>
                  <option value={300}>DN 300 (12")</option>
                  <option value={400}>DN 400 (16")</option>
                  <option value={500}>DN 500 (20")</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Service / Fluide</span>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-semibold text-slate-200 outline-none"
                >
                  <option value="Procédé Chimique (PROC)">Procédé Chimique (PROC)</option>
                  <option value="Hydrocarbures Liquides (HC)">Hydrocarbures Liquides (HC)</option>
                  <option value="Gaz Naturel Haute Pression (NG)">Gaz Naturel HP (NG)</option>
                  <option value="Vapeur Haute Pression (STM-HP)">Vapeur Haute Pression (STM-HP)</option>
                  <option value="Eau de Refroidissement (CW)">Eau de Refroidissement (CW)</option>
                  <option value="Air Comprimé Service (IA)">Air Comprimé (IA)</option>
                  <option value="Réseau Incendie (FW)">Réseau Incendie (FW)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Classe de Pression</span>
                <select
                  value={pressureClass}
                  onChange={(e) => setPressureClass(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-semibold text-slate-200 outline-none"
                >
                  <option value="150#">Classe 150# (PN 20)</option>
                  <option value="300#">Classe 300# (PN 50)</option>
                  <option value="600#">Classe 600# (PN 100)</option>
                  <option value="900#">Classe 900# (PN 150)</option>
                  <option value="1500#">Classe 1500# (PN 250)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Matériau / Nuance</span>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-semibold text-slate-200 outline-none"
                >
                  <option value="A106-B (Acier Carbone)">A106 Gr.B (Acier Carbone)</option>
                  <option value="A312-TP316L (Inox Chimique)">A312-TP316L (Inox Chimique)</option>
                  <option value="A312-TP304L (Inox Standard)">A312-TP304L (Inox Standard)</option>
                  <option value="A333-Gr6 (Basse Température)">A333-Gr6 (Basse Temp.)</option>
                  <option value="Inconel 625 (Alliage Nickel)">Inconel 625</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: MÉTHODES DE CRÉATION */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                2. Choisissez le Mode de Création
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">ÉTAPE 5 · PASSERELLE ISO</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* OPTION 1 : CRÉER VIA CROQUIS / SCAN A4-A3 (EN VEDETTE) */}
              <div
                onClick={() => setSelectedMethod("sketch")}
                className={`relative sm:col-span-2 p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  selectedMethod === "sketch"
                    ? "bg-gradient-to-r from-cyan-950/80 via-slate-900 to-emerald-950/40 border-cyan-400 shadow-lg shadow-cyan-950/50"
                    : "bg-slate-900/80 border-cyan-800/40 hover:border-cyan-600/70 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/30">
                    <Scan className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white">
                        Créer via Croquis / Scan A4-A3
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-400/40 text-[10px] font-bold text-cyan-300">
                        ⭐ Recommandé Chantier &amp; Relevé
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      Numérisez ou téléchargez un croquis papier A4/A3, étalonnez l'échelle métrique, vectorisez la tuyauterie et injectez instantanément l'isométrie cotée 2D et le solide 3D.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubmit("sketch");
                    }}
                    className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white text-xs font-black shadow-md shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                  >
                    <span>Démarrer via Croquis / Scan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* OPTION 2 : PLAN ISOMÉTRIQUE VIERGE */}
              <div
                onClick={() => setSelectedMethod("blank")}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedMethod === "blank"
                    ? "bg-slate-900 border-cyan-400 shadow-md"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                    <Grid className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Plan Isométrique Vierge</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Dessinez directement dans l'éditeur CAO ISO 2D/3D avec grille orthogonale 30° et palette d'accessoires.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubmit("blank");
                    }}
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    Ouvrir éditeur vierge <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* OPTION 3 : VISION IA (PHOTO CHANTIER) */}
              <div
                onClick={() => setSelectedMethod("vision")}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedMethod === "vision"
                    ? "bg-slate-900 border-cyan-400 shadow-md"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Vision IA (Photo Chantier)</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Reconnaissance optique automatique des lignes et équipements sur photos réelles sur site.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubmit("vision");
                    }}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    Lancer Vision IA <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* OPTION 4 : IMPORTER FICHIER CAD / DXF / PDF */}
              <div
                onClick={() => setSelectedMethod("cad")}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedMethod === "cad"
                    ? "bg-slate-900 border-cyan-400 shadow-md"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <FolderOpen className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Importer CAD / DXF / PDF</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Charger un plan DXF, DWG ou PDF d'ingénierie et convertir en modèle ISO déterministe.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubmit("cad");
                    }}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    Importer fichier <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* OPTION 5 : ASSISTANT IA TUYAUTERIE */}
              <div
                onClick={() => setSelectedMethod("assistant")}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  selectedMethod === "assistant"
                    ? "bg-slate-900 border-cyan-400 shadow-md"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Assistant IA Spécialisé</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Générez votre réseau en décrivant vos piquages, spools et élévations en langage naturel.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubmit("assistant");
                    }}
                    className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    Ouvrir Assistant <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Passerelle d'injection automatique vers le moteur ISO V4.8d</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(selectedMethod)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white text-xs font-black shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 transition-all"
            >
              <span>{selectedMethod === "sketch" ? "Créer via Croquis / Scan A4-A3" : "Valider & Ouvrir le Projet"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
