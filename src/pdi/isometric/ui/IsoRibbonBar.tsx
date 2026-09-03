/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * COPYRIGHT (C) 2026 ORTHOGONAL - ENG. ALL RIGHTS RESERVED.
 * PROPRIETARY INDUSTRIAL PIPING CAD & ISOMETRIC ENGINE.
 * RIBBON BAR UI COMPONENT.
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
      {pdiGroupesOnglet017M(activeTab).map((groupe) => (
        <div key={groupe} className="pdi-ribbon-group">
          <div className="pdi-ruban-boutons">
            {pdiEntreesGroupe017M(activeTab, groupe).map((entree) => {
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
                >
                  {entree.icone ? entree.icone + " " : ""}
                  {libelle}
                </button>
              );
            })}
          </div>
          <span>{groupe}</span>
        </div>
      ))}
    </div>
  );
};
