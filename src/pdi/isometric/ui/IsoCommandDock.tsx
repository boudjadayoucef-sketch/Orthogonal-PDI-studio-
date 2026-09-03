/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * COPYRIGHT (C) 2026 ORTHOGONAL - ENG. ALL RIGHTS RESERVED.
 * PROPRIETARY INDUSTRIAL PIPING CAD & ISOMETRIC ENGINE.
 * COMMAND DOCK UI COMPONENT.
 */

import React from "react";
import { CadCommandLineBar } from "../components/CadCommandLineBar";
import { CadDraftSession } from "../types/isoGraphTypes";

export interface IsoCommandDockProps {
  hidden: boolean;
  modalOpen: boolean;
  cmdInput: string;
  setCmdInput: (input: string) => void;
  prompt: string;
  onExecuteCommand: (cmd: string) => void;
  cadDraftSession: CadDraftSession | null;
  onCancelDraft: () => void;
  onApplyNumericInput: (value: number) => void;
  pipeStrokeScale: number;
  setPipeStrokeScale: (scale: number) => void;
}

export const IsoCommandDock: React.FC<IsoCommandDockProps> = ({
  hidden,
  modalOpen,
  cmdInput,
  setCmdInput,
  prompt,
  onExecuteCommand,
  cadDraftSession,
  onCancelDraft,
  onApplyNumericInput,
  pipeStrokeScale,
  setPipeStrokeScale,
}) => {
  if (hidden || modalOpen) return null;

  return (
    <div className="pdi-cmd-dock-017d fixed left-[92px] right-3 bottom-2 z-[10030] rounded-xl border border-zinc-800 bg-[#09090B]/95 shadow-2xl backdrop-blur-md px-2 py-1 flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <CadCommandLineBar
          input={cmdInput}
          setInput={setCmdInput}
          prompt={prompt}
          onExecuteCommand={onExecuteCommand}
          cadDraftSession={cadDraftSession}
          onCancelDraft={onCancelDraft}
          onApplyNumericInput={onApplyNumericInput}
        />
      </div>
      <label
        className="hidden lg:flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-0.5 h-7 text-[10px] font-black text-zinc-200"
        title="Épaisseur graphique des lignes de tuyauterie"
      >
        <span className="text-zinc-400 text-[9px]">Ép.</span>
        <input
          type="range"
          min="0.35"
          max="3"
          step="0.05"
          value={pipeStrokeScale}
          onChange={(e) => setPipeStrokeScale(Number(e.target.value))}
          className="w-16 accent-white"
        />
        <span className="w-8 text-right text-white text-[10px] font-mono">
          {pipeStrokeScale.toFixed(2)}×
        </span>
      </label>
    </div>
  );
};
