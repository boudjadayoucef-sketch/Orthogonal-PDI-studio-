import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  CornerDownLeft,
  X,
  Copy,
  Clipboard,
  Square,
  Triangle,
  Hexagon,
  Disc3,
  Move,
  Trash2,
  Maximize2,
  SlidersHorizontal,
  ChevronUp,
  Check,
  Slash,
  Spline,
  Circle,
  Type,
  Ruler,
  Undo2,
  Redo2,
  LayoutGrid,
} from "lucide-react";
import { AUTOCAD_COMMANDS, searchCadCommands, CadCommandItem } from "../engine/CadAutocadEngine";

export interface CadCommandLineBarProps {
  input: string;
  setInput: (v: string) => void;
  prompt: string;
  onExecuteCommand: (cmdString: string) => void;
  cadDraftSession: any | null;
  onCancelDraft: () => void;
  onApplyNumericInput?: (val1: number, val2?: number) => void;
  onSelectCommandByName?: (cmdId: string) => void;
  className?: string;
}

export const CadCommandLineBar: React.FC<CadCommandLineBarProps> = ({
  input,
  setInput,
  prompt,
  onExecuteCommand,
  cadDraftSession,
  onCancelDraft,
  onApplyNumericInput,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [numericVal1, setNumericVal1] = useState<string>("");
  const [numericVal2, setNumericVal2] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const suggestions = searchCadCommands(input);

  useEffect(() => {
    setSelectedIndex(0);
    if (input.trim().length > 0) {
      setShowSuggestions(true);
    }
  }, [input]);

  // Reset numeric inputs when session changes
  useEffect(() => {
    setNumericVal1("");
    setNumericVal2("");
  }, [cadDraftSession?.tool, cadDraftSession?.step]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // If drafting session is waiting for numeric input
    if (cadDraftSession && (numericVal1.trim() || numericVal2.trim())) {
      const v1 = parseFloat(numericVal1);
      const v2 = numericVal2 ? parseFloat(numericVal2) : undefined;
      if (!isNaN(v1) && onApplyNumericInput) {
        onApplyNumericInput(v1, v2);
        setNumericVal1("");
        setNumericVal2("");
        return;
      }
    }

    const trimmed = input.trim();
    if (!trimmed) {
      if (suggestions.length > 0 && showSuggestions) {
        runCommandItem(suggestions[selectedIndex] || suggestions[0]);
      }
      return;
    }

    if (showSuggestions && suggestions.length > 0) {
      const target = suggestions[selectedIndex] || suggestions[0];
      runCommandItem(target);
    } else {
      setHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 10));
      onExecuteCommand(trimmed);
      setInput("");
      setShowSuggestions(false);
    }
  };

  const runCommandItem = (cmd: CadCommandItem) => {
    setHistory((prev) => [cmd.name, ...prev.filter((h) => h !== cmd.name)].slice(0, 10));
    onExecuteCommand(cmd.name);
    setInput("");
    setShowSuggestions(false);
    if (inputRef.current) inputRef.current.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, suggestions.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % Math.max(1, suggestions.length));
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowSuggestions(false);
      setInput("");
      if (cadDraftSession) {
        onCancelDraft();
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (suggestions.length > 0) {
        const top = suggestions[selectedIndex] || suggestions[0];
        setInput(top.name);
      }
    }
  };

  const getCommandIcon = (iconName: string) => {
    switch (iconName) {
      case "Copy": return <Copy className="w-3.5 h-3.5 text-cyan-400" />;
      case "Clipboard": return <Clipboard className="w-3.5 h-3.5 text-emerald-400" />;
      case "Square": return <Square className="w-3.5 h-3.5 text-amber-400" />;
      case "Triangle": return <Triangle className="w-3.5 h-3.5 text-orange-400" />;
      case "Hexagon": return <Hexagon className="w-3.5 h-3.5 text-purple-400" />;
      case "Disc3": return <Disc3 className="w-3.5 h-3.5 text-sky-400" />;
      case "Move": return <Move className="w-3.5 h-3.5 text-blue-400" />;
      case "Trash2": return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
      case "Maximize2": return <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />;
      case "Slash": return <Slash className="w-3.5 h-3.5 text-slate-400" />;
      case "Spline": return <Spline className="w-3.5 h-3.5 text-teal-400" />;
      case "Circle": return <Circle className="w-3.5 h-3.5 text-yellow-400" />;
      case "Type": return <Type className="w-3.5 h-3.5 text-pink-400" />;
      case "Ruler": return <Ruler className="w-3.5 h-3.5 text-lime-400" />;
      case "Undo2": return <Undo2 className="w-3.5 h-3.5 text-rose-400" />;
      case "Redo2": return <Redo2 className="w-3.5 h-3.5 text-cyan-400" />;
      case "LayoutGrid": return <LayoutGrid className="w-3.5 h-3.5 text-cyan-300" />;
      default: return <Terminal className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className={`pdi-cad-command-wrapper relative select-none ${className}`}>
      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 mb-1.5 w-full max-w-xl bg-slate-900/98 backdrop-blur-md border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden z-[10010] animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Terminal className="w-3 h-3" />
              COMMANDES AUTOCAD DISPONIBLES ({suggestions.length})
            </span>
            <span>Entrée pour valider &bull; &uarr;&darr; pour naviguer &bull; Échap pour fermer</span>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 p-1">
            {suggestions.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => runCommandItem(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected ? "bg-cyan-950/90 text-white border border-cyan-500/50 shadow-inner" : "hover:bg-slate-800/70 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1 rounded bg-slate-800/80 border border-slate-700/60 shrink-0">
                      {getCommandIcon(cmd.icon)}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-cyan-300 tracking-wider">
                          {cmd.name}
                        </span>
                        {cmd.aliases.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            [{cmd.aliases.join(", ")}]
                          </span>
                        )}
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {cmd.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {cmd.description}
                      </div>
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-[10px] font-mono text-cyan-300 shrink-0 font-bold">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Command Bar Container */}
      <div className="bg-slate-950/95 backdrop-blur border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-2 shadow-2xl transition-all duration-200">
        {/* Dynamic prompt and active session indicator */}
        {(prompt || cadDraftSession) && (
          <div className="flex items-center justify-between gap-2 px-2 py-1 mb-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="text-cyan-300 font-bold shrink-0">
                {cadDraftSession ? `[${cadDraftSession.tool.toUpperCase()}]` : "PROMPT :"}
              </span>
              <span className="text-slate-200 truncate font-semibold">
                {prompt || "Entrez une commande..."}
              </span>
            </div>

            {cadDraftSession && (
              <button
                type="button"
                onClick={onCancelDraft}
                className="px-2 py-0.5 rounded-md bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                title="Annuler l'action en cours (Échap)"
              >
                <X className="w-3 h-3" />
                ANNULER (Échap)
              </button>
            )}
          </div>
        )}

        {/* Input & Form Controls */}
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
          {/* AutoCAD Prompt Label */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-cyan-400 font-mono text-xs font-black shrink-0 shadow-inner">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>COMMANDE &gt;</span>
          </div>

          {/* Text Input */}
          <div className="flex-1 min-w-[200px] relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => {
                if (input.trim()) setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                cadDraftSession
                  ? "Saisir une valeur ou cliquer sur le dessin (ex: 5.0)..."
                  : "Tapez une fonction : copier, collez, rectangle, triangle, arc, polygone, deplacer..."
              }
              className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 font-mono outline-none shadow-inner transition-colors"
            />
            {input && (
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  setShowSuggestions(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Numeric Direct Input for CAD Drawing session */}
          {cadDraftSession && (
            <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-xl border border-cyan-600/40">
              <span className="text-[10px] font-mono text-cyan-300 font-bold">
                {cadDraftSession.tool === "rectangle" ? "L / l :" : "Valeur :"}
              </span>
              <input
                type="number"
                step="0.1"
                placeholder={cadDraftSession.tool === "rectangle" ? "Long." : "Dim."}
                value={numericVal1}
                onChange={(e) => setNumericVal1(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-200 font-mono outline-none text-right"
              />
              {cadDraftSession.tool === "rectangle" && (
                <input
                  type="number"
                  step="0.1"
                  placeholder="Larg."
                  value={numericVal2}
                  onChange={(e) => setNumericVal2(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-cyan-200 font-mono outline-none text-right"
                />
              )}
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-white text-[10px] font-bold"
                title="Appliquer la valeur"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white rounded-xl text-xs font-bold font-mono flex items-center gap-1 shadow-md transition-colors cursor-pointer"
          >
            <span>ENTRÉE</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </form>

        {/* Quick AutoCAD Command Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 mt-2 border-t border-slate-800/80 text-[10px] font-mono no-scrollbar">
          <span className="text-slate-500 text-[9px] uppercase font-bold shrink-0">Accès direct :</span>

          <button
            type="button"
            onClick={() => runCommandItem(AUTOCAD_COMMANDS.find((c) => c.id === "copy")!)}
            className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-cyan-300 shrink-0 flex items-center gap-1 transition-colors"
          >
            <Copy className="w-2.5 h-2.5" />
            COPIER
          </button>

          <button
            type="button"
            onClick={() => runCommandItem(AUTOCAD_COMMANDS.find((c) => c.id === "paste")!)}
            className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-emerald-950 border border-slate-700 hover:border-emerald-500 text-emerald-300 shrink-0 flex items-center gap-1 transition-colors"
          >
            <Clipboard className="w-2.5 h-2.5" />
            COLLEZ (Clic)
          </button>

          <button
            type="button"
            onClick={() => runCommandItem(AUTOCAD_COMMANDS.find((c) => c.id === "rectangle")!)}
            className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-amber-950 border border-slate-700 hover:border-amber-500 text-amber-300 shrink-0 flex items-center gap-1 transition-colors"
          >
            <Square className="w-2.5 h-2.5" />
            RECTANGLE
          </button>

          <button
            type="button"
            onClick={() => runCommandItem(AUTOCAD_COMMANDS.find((c) => c.id === "triangle")!)}
            className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-orange-950 border border-slate-700 hover:border-orange-500 text-orange-300 shrink-0 flex items-center gap-1 transition-colors"
          >
            <Triangle className="w-2.5 h-2.5" />
            TRIANGLE
          </button>

          <button
            type="button"
            onClick={() => runCommandItem(AUTOCAD_COMMANDS.find((c) => c.id === "polygon")!)}
            className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-purple-950 border border-slate-700 hover:border-purple-500 text-purple-300 shrink-0 flex items-center gap-1 transition-colors"
          >
            <Hexagon className="w-2.5 h-2.5" />
            POLYGONE
          </button>

          <button
            type="button"
            onClick={() => runCommandItem(AUTOCAD_COMMANDS.find((c) => c.id === "arc")!)}
            className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-sky-950 border border-slate-700 hover:border-sky-500 text-sky-300 shrink-0 flex items-center gap-1 transition-colors"
          >
            <Disc3 className="w-2.5 h-2.5" />
            ARC (3 pts)
          </button>

          <button
            type="button"
            onClick={() => runCommandItem(AUTOCAD_COMMANDS.find((c) => c.id === "delete")!)}
            className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-red-950 border border-slate-700 hover:border-red-500 text-red-300 shrink-0 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-2.5 h-2.5" />
            EFFACER
          </button>

          <button
            type="button"
            onClick={() => runCommandItem(AUTOCAD_COMMANDS.find((c) => c.id === "zoom_all")!)}
            className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 shrink-0 flex items-center gap-1 transition-colors"
          >
            <Maximize2 className="w-2.5 h-2.5" />
            ZOOM TOUT
          </button>
        </div>
      </div>
    </div>
  );
};
