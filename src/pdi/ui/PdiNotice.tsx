// PATCH 017K2 : fenetre d information propre a PD&I.
// Remplace alert(), qui affiche l URL du serveur et bloque le thread.
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";

export type PdiNoticeTone = "info" | "success" | "warning" | "error";

const TONES: Record<PdiNoticeTone, { color: string; label: string }> = {
  info: { color: "#67E8F9", label: "Information" },
  success: { color: "#4ADE80", label: "Operation reussie" },
  warning: { color: "#FBBF24", label: "Attention" },
  error: { color: "#FCA5A5", label: "Erreur" },
};

function guessTone(message: string): PdiNoticeTone {
  const m = message.toLowerCase();
  if (m.includes("erreur") || m.includes("impossible") || m.includes("echec") || m.includes("\u00e9chec")) return "error";
  if (m.includes("attention") || m.includes("\u26a0")) return "warning";
  if (m.includes("succ") || m.includes("r\u00e9ussi") || m.includes("enregistr")) return "success";
  return "info";
}

function PdiNoticeDialog(props: { message: string; title?: string; tone: PdiNoticeTone; onClose: () => void }) {
  const { message, title, tone, onClose } = props;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const t = TONES[tone];
  return (
    <div
      role="presentation"
      onMouseDown={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 100200, background: "rgba(2,6,15,.72)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ width: "min(460px, 94vw)", background: "#0B111A", border: "1px solid rgba(103,232,249,.32)", borderRadius: 18, padding: 20, color: "#E5EDF8", boxShadow: "0 24px 60px rgba(0,0,0,.55)", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
      >
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: t.color }}>{title || t.label}</div>
        <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.55, fontWeight: 600, whiteSpace: "pre-wrap" }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid rgba(103,232,249,.5)", background: "#0E7490", color: "#FFFFFF", fontSize: 12, fontWeight: 900, cursor: "pointer" }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export function pdiAlert(message: unknown, title?: string, tone?: PdiNoticeTone): Promise<void> {
  const text = typeof message === "string" ? message : String(message);
  if (typeof document === "undefined") return Promise.resolve();
  return new Promise<void>((resolve) => {
    const host = document.createElement("div");
    host.setAttribute("data-pdi-notice", "017k2");
    document.body.appendChild(host);
    const root = createRoot(host);
    const close = () => {
      try { root.unmount(); } catch (e) { void e; }
      try { host.remove(); } catch (e) { void e; }
      resolve();
    };
    root.render(<PdiNoticeDialog message={text} title={title} tone={tone || guessTone(text)} onClose={close} />);
  });
}

export default pdiAlert;
