/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * COPYRIGHT (C) 2026 ORTHOGONAL - ENG. ALL RIGHTS RESERVED.
 * PROPRIETARY INDUSTRIAL PIPING CAD & ISOMETRIC ENGINE.
 * RIBBON BAR UI COMPONENT (LISTES VERTICALES ERGONOMIQUES).
 */

import React from "react";
import {
  pdiGroupesOnglet017M,
  pdiEntreesGroupe017M,
  PdiEntreeRuban017M,
} from "../engine/pdiRegistreCommandes.v1";

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
}

export const IsoRibbonBar: React.FC<IsoRibbonBarProps> = ({
  collapsed,
  activeTab,
  resolveTarget,
  resolveTooltip,
  onExecute,
}) => {
  if (collapsed) return null;

  return (
    <div className="pdi-cad-ribbon" data-pdi-ruban="017m">
      {pdiGroupesOnglet017M(activeTab).map((groupe) => {
        const entrees = pdiEntreesGroupe017M(activeTab, groupe);
        const useMultiCol = entrees.length > 3;

        return (
          <div key={groupe} className="pdi-ribbon-group">
            <div className={`pdi-ruban-boutons ${useMultiCol ? "multi-col" : "single-col"}`}>
              {entrees.map((entree) => {
                const cible = resolveTarget(entree);
                const inactif = entree.etat === "grise" || !cible || !!cible.disabled;
                const libelle = entree.suivreLibelle && cible ? cible.label : entree.nomFr;

                return (
                  <button
                    key={entree.id}
                    type="button"
                    disabled={inactif}
                    title={resolveTooltip(entree, cible ? cible.hint : undefined)}
                    onClick={() => {
                      if (cible) {
                        cible.run();
                        onExecute(entree.nomFr);
                      }
                    }}
                    className="pdi-ribbon-btn"
                  >
                    {entree.icone ? <span className="pdi-ribbon-icon">{entree.icone}</span> : null}
                    <span className="pdi-ribbon-label">{libelle}</span>
                  </button>
                );
              })}
            </div>
            <span className="pdi-ribbon-group-title">{groupe}</span>
          </div>
        );
      })}
    </div>
  );
};
