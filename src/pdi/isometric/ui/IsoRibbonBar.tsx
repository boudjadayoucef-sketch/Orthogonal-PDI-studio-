/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * COPYRIGHT (C) 2026 ORTHOGONAL - ENG. ALL RIGHTS RESERVED.
 * PROPRIETARY INDUSTRIAL PIPING CAD & ISOMETRIC ENGINE.
 * GITHUB-STYLE MEGA-MENU POPOVER FOR CAD TOOLS & PIPING ACTIONS.
 */

import React, { useEffect } from "react";
import {
  pdiGroupesOnglet017M,
  pdiEntreesGroupe017M,
  PdiEntreeRuban017M,
  PDI_ONGLETS_RUBAN_017M,
} from "../engine/pdiRegistreCommandes.v1";
import {
  MousePointer2,
  Hand,
  Spline,
  CircleDot,
  GitFork,
  CornerDownRight,
  Anchor,
  Ruler,
  Slash,
  Square,
  Hexagon,
  Triangle,
  Circle,
  Disc3,
  Type,
  LayoutGrid,
  Trash2,
  Layers,
  SlidersHorizontal,
  FileCode,
  FolderOpen,
  X,
  Command,
  HelpCircle,
  ArrowRight,
  Eye,
  AlignLeft,
  Box,
  Compass,
} from "lucide-react";

export interface IsoRibbonQuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
  onClick: () => void;
}

export interface IsoRibbonBarProps {
  collapsed: boolean;
  activeTab: string;
  resolveTarget: (entree: PdiEntreeRuban017M) => {
    label: string;
    hint?: string;
    disabled?: boolean;
    run: () => void;
  } | undefined;
  resolveTooltip: (entree: PdiEntreeRuban017M, hint?: string) => string;
  onExecute: (name: string) => void;
  onClose?: () => void;
  onSelectTab?: (tabId: string) => void;
  quickActions?: IsoRibbonQuickAction[];
  onOpenPalette?: () => void;
  onOpenShortcuts?: () => void;
}

const getEntryIcon = (entree: PdiEntreeRuban017M) => {
  const id = (entree?.id || "").toLowerCase();
  const nom = (entree?.nomFr || "").toLowerCase();

  if (id.includes("selection") || nom.includes("selection")) {
    return <MousePointer2 className="w-4 h-4 text-blue-400" />;
  }
  if (id.includes("main") || nom.includes("main")) {
    return <Hand className="w-4 h-4 text-cyan-400" />;
  }
  if (id.includes("noeud") || nom.includes("noeud")) {
    return <CircleDot className="w-4 h-4 text-emerald-400" />;
  }
  if (id.includes("tube") || nom.includes("tube")) {
    return <Spline className="w-4 h-4 text-emerald-400" />;
  }
  if (id.includes("coude") || nom.includes("coude")) {
    return <CornerDownRight className="w-4 h-4 text-amber-400" />;
  }
  if (id.includes("te") || nom.includes("te")) {
    return <GitFork className="w-4 h-4 text-violet-400" />;
  }
  if (id.includes("ligne") || nom.includes("ligne")) {
    return <Slash className="w-4 h-4 text-cyan-400" />;
  }
  if (id.includes("polyligne") || nom.includes("polyligne")) {
    return <Spline className="w-4 h-4 text-cyan-400" />;
  }
  if (id.includes("rectangle") || nom.includes("rectangle")) {
    return <Square className="w-4 h-4 text-amber-400" />;
  }
  if (id.includes("triangle") || nom.includes("triangle")) {
    return <Triangle className="w-4 h-4 text-amber-400" />;
  }
  if (id.includes("polygone") || nom.includes("polygone")) {
    return <Hexagon className="w-4 h-4 text-cyan-300" />;
  }
  if (id.includes("cercle") || nom.includes("cercle")) {
    return <Circle className="w-4 h-4 text-sky-400" />;
  }
  if (id.includes("arc") || nom.includes("arc")) {
    return <Disc3 className="w-4 h-4 text-sky-300" />;
  }
  if (id.includes("texte") || nom.includes("texte")) {
    return <Type className="w-4 h-4 text-emerald-400" />;
  }
  if (id.includes("hachure") || nom.includes("hachure")) {
    return <LayoutGrid className="w-4 h-4 text-pink-400" />;
  }
  if (id.includes("coter") || nom.includes("coter") || id.includes("cote")) {
    return <Ruler className="w-4 h-4 text-blue-400" />;
  }
  if (id.includes("support") || nom.includes("support")) {
    return <Anchor className="w-4 h-4 text-indigo-400" />;
  }
  if (id.includes("vanne") || nom.includes("vanne")) {
    return <SlidersHorizontal className="w-4 h-4 text-teal-400" />;
  }
  if (id.includes("supprimer") || nom.includes("supprimer")) {
    return <Trash2 className="w-4 h-4 text-red-400" />;
  }
  if (id.includes("nouveau") || nom.includes("nouveau")) {
    return <FileCode className="w-4 h-4 text-emerald-400" />;
  }
  if (id.includes("ouvrir") || nom.includes("ouvrir")) {
    return <FolderOpen className="w-4 h-4 text-blue-400" />;
  }
  if (id.includes("biblio") || nom.includes("biblio")) {
    return <Layers className="w-4 h-4 text-amber-400" />;
  }
  if (id.includes("voir") || id.includes("pipelines") || id.includes("soudures")) {
    return <Eye className="w-4 h-4 text-cyan-300" />;
  }
  if (id.includes("aligner")) {
    return <AlignLeft className="w-4 h-4 text-indigo-300" />;
  }
  if (id.includes("3d") || id.includes("orbite")) {
    return <Box className="w-4 h-4 text-purple-400" />;
  }

  return <Compass className="w-4 h-4 text-zinc-400" />;
};

const getEntrySubtitle = (entree: PdiEntreeRuban017M): string => {
  const id = (entree?.id || "").toLowerCase();
  const nom = (entree?.nomFr || "").toLowerCase();

  if (id.includes("selection") || nom.includes("selection")) return "Sélectionner, éditer et manipuler les éléments";
  if (id.includes("main") || nom.includes("main")) return "Déplacer et naviguer librement sur le canevas";
  if (id.includes("noeud") || nom.includes("noeud")) return "Point de raccordement, piquage ou sommet tuyauté";
  if (id.includes("tube") || nom.includes("tube")) return "Tracer un tronçon de tuyauterie isométrique 3D";
  if (id.includes("coude") || nom.includes("coude")) return "Insérer un coude 90° de changement de direction";
  if (id.includes("te") || nom.includes("te")) return "Créer une bifurcation soudée ou dérivation";
  if (id.includes("ligne") || nom.includes("ligne")) return "Segment 2D libre avec points d'accrochage";
  if (id.includes("polyligne") || nom.includes("polyligne")) return "Polyligne continue multi-sommets AutoCAD";
  if (id.includes("rectangle") || nom.includes("rectangle")) return "Cadre défini par 2 clics diagonaux opposés";
  if (id.includes("triangle") || nom.includes("triangle")) return "Triangle équilatéral, rectangle ou isocèle";
  if (id.includes("polygone") || nom.includes("polygone")) return "Polygone régulier paramétrable 3 à 12+ faces";
  if (id.includes("cercle") || nom.includes("cercle")) return "Cercle par point central et rayon";
  if (id.includes("arc") || nom.includes("arc")) return "Arc de cercle par 3 points ou centre/angle";
  if (id.includes("texte") || nom.includes("texte")) return "Annotations, repères de ligne et cartouches";
  if (id.includes("hachure") || nom.includes("hachure")) return "Motifs de hachurage normalisés ISO/ANSI";
  if (id.includes("coter") || nom.includes("coter")) return "Ajouter des cotations linéaires et isométriques";
  if (id.includes("support")) return "Supportage normalisé MSS SP-58 & platines";
  if (id.includes("vanne")) return "Vannes, robinets et clapets industriels";
  if (id.includes("bibliotheque")) return "Catalogue complet composants & accessoires";
  if (id.includes("nouveau")) return "Créer un nouveau projet isométrique vierge";
  if (id.includes("ouvrir")) return "Importer un fichier de tuyauterie au format JSON";

  if (entree.jalon) return `Prévu au jalon ${entree.jalon}`;
  return entree.nomEn || "Outil de modélisation";
};

export const IsoRibbonBar: React.FC<IsoRibbonBarProps> = ({
  collapsed,
  activeTab,
  resolveTarget,
  resolveTooltip,
  onExecute,
  onClose,
  onSelectTab,
  quickActions,
  onOpenPalette,
  onOpenShortcuts,
}) => {
  // Fermeture par la touche Échap
  useEffect(() => {
    if (collapsed) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [collapsed, onClose]);

  if (collapsed) return null;

  const groupes = pdiGroupesOnglet017M(activeTab);

  return (
    <>
      {/* Backdrop sombre transparent pour cliquer en dehors et fermer immédiatement */}
      <div
        className="fixed inset-0 top-[54px] z-[10018] bg-black/55 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Méga-Menu GitHub flottant sous la barre de navigation */}
      <div
        className="fixed top-[56px] left-1/2 -translate-x-1/2 z-[10020] w-[min(1220px,96vw)] max-h-[calc(100vh-76px)] flex flex-col bg-[#0D1117] border border-[#30363D] rounded-2xl shadow-2xl shadow-black/95 text-white overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Menu Outils et Tuyauterie"
      >
        {/* En-tête du Méga-Menu : Onglets rapides + Bouton Fermer */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#30363D] bg-[#161B22]/90 backdrop-blur shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {PDI_ONGLETS_RUBAN_017M.map((onglet) => {
              const isActive = activeTab === onglet.id;
              return (
                <button
                  key={onglet.id}
                  type="button"
                  onClick={() => onSelectTab?.(onglet.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent"
                  }`}
                >
                  <span>{onglet.nomFr}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all ml-2 shrink-0"
            title="Fermer le menu (Échap)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps du Méga-Menu en colonnes catégorisées (comme GitHub Platform / Solutions) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            {groupes.map((groupe) => {
              const entrees = pdiEntreesGroupe017M(activeTab, groupe);

              return (
                <div key={groupe} className="flex flex-col gap-2">
                  {/* Titre de catégorie style GitHub */}
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-[10px] font-black tracking-wider uppercase text-zinc-400">
                      {groupe}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {entrees.length}
                    </span>
                  </div>

                  {/* Liste d'éléments de la colonne */}
                  <div className="flex flex-col gap-1">
                    {entrees.map((entree) => {
                      const cible = resolveTarget(entree);
                      const inactif = entree.etat === "grise" || !cible || !!cible.disabled;
                      const libelle = entree.suivreLibelle && cible ? cible.label : entree.nomFr;
                      const icon = getEntryIcon(entree);
                      const subtitle = getEntrySubtitle(entree);

                      return (
                        <button
                          key={entree.id}
                          type="button"
                          disabled={inactif}
                          title={resolveTooltip(entree, cible ? cible.hint : undefined)}
                          onClick={() => {
                            if (cible && !inactif) {
                              cible.run();
                              onExecute(entree.nomFr);
                              onClose?.();
                            }
                          }}
                          className="w-full text-left p-2 rounded-xl flex items-start gap-2.5 transition-all group hover:bg-[#161B22] border border-transparent hover:border-[#30363D] active:scale-[0.99] disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-transparent"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#161B22] border border-[#30363D] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-cyan-500/40 group-hover:bg-cyan-950/30 transition-colors">
                            {icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                                {libelle}
                              </span>
                              {entree.raccourci ? (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 group-hover:text-cyan-300 border border-zinc-700/60 shrink-0">
                                  {entree.raccourci}
                                </span>
                              ) : entree.etat === "grise" ? (
                                <span className="text-[8.5px] font-medium px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-500 shrink-0">
                                  Bientôt
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-zinc-400 group-hover:text-zinc-300 leading-tight mt-0.5 line-clamp-1">
                              {subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* 4ème colonne optionnelle : Explore & Actions rapides (comme sur GitHub) */}
            {quickActions && quickActions.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-[10px] font-black tracking-wider uppercase text-cyan-400">
                    Explore & Accès Rapide
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400/60">
                    PRO
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  {quickActions.map((qa) => (
                    <button
                      key={qa.id}
                      type="button"
                      onClick={() => {
                        qa.onClick();
                        onClose?.();
                      }}
                      className="w-full text-left p-2 rounded-xl flex items-start gap-2.5 transition-all group hover:bg-[#161B22] border border-transparent hover:border-[#30363D] active:scale-[0.99]"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#161B22] border border-[#30363D] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-cyan-500/40 group-hover:bg-cyan-950/30 transition-colors">
                        {qa.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                            {qa.title}
                          </span>
                          {qa.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-purple-800 to-indigo-800 text-purple-200 border border-purple-500/40 shrink-0">
                              {qa.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 group-hover:text-zinc-300 leading-tight mt-0.5 line-clamp-1">
                          {qa.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pied de page du Méga-Menu (style GitHub : "View all features >") */}
        <div className="px-5 py-3 border-t border-[#30363D] bg-[#161B22]/70 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onOpenPalette?.();
              }}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors"
            >
              <Command className="w-3.5 h-3.5 text-cyan-400" />
              <span>Palette de commandes <span className="font-mono text-[10px] bg-zinc-800 px-1 py-0.5 rounded text-zinc-400 border border-zinc-700">⌘K / Ctrl+K</span></span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose?.();
                onOpenShortcuts?.();
              }}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Raccourcis clavier <span className="font-mono text-[10px] bg-zinc-800 px-1 py-0.5 rounded text-zinc-400 border border-zinc-700">?</span></span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-[11px]">
              Cliquez hors du menu ou <kbd className="font-mono text-[10px] bg-zinc-800 px-1 py-0.5 rounded text-zinc-400 border border-zinc-700">Échap</kbd> pour revenir au dessin
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 font-bold text-cyan-400 hover:text-cyan-300 text-xs transition-colors"
            >
              <span>Espace de dessin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
