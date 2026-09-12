/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { Message } from "../types";
import { Send, Sparkles, MessageSquare, AlertCircle, Bot, User, CheckCircle2 } from "lucide-react";

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: "Bonjour ! Je suis votre Conseiller Technique IA spécialisé dans les normes et exigences de **PD&I — Pipeline Design & Isometrics** (Édition 2026).\n\nJe peux vous aider à vérifier les normes ASME B31.3 / EN 13480, cotes réglementaires, formules de calcul, ou vous expliquer les procédures d'épreuve (méthode GAUVIN, soudure, remblai, etc.).\n\nPosez-moi votre question !"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const presets = [
    { label: "Vitesse d'avancement soudure", q: "Quelles sont les exigences et tolérances sur la vitesse de soudage en ligne selon le Fascicule 3 ?" },
    { label: "Pression épreuve postes", q: "Quelle est la pression d'épreuve hydrostatique minimale requise pour les postes et quelle est sa durée ?" },
    { label: "Méthode GAUVIN", q: "Expliquez-moi le fonctionnement et les critères du contrôle de présence d'air selon la méthode GAUVIN (Fascicule 5)." },
    { label: "Traitement de peinture", q: "Décrivez les différentes couches de peinture exigées pour la protection anticorrosion des canalisations aériennes." }
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: [...messages, userMsg]
        })
      });

      if (!response.ok) {
        throw new Error("Impossible de joindre le Conseiller Technique IA. Veuillez vérifier vos secrets d'API.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages((prev) => [...prev, { role: "model", content: data.reply }]);
    } catch (err: any) {
      setError(err.message || "Une erreur s'est produite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-[650px]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Conseiller Technique IA PD&amp;I</h2>
            <p className="text-sm text-slate-500">Posez des questions en langage naturel sur le Cahier des Charges.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-black">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Base de connaissances chargée (Édition 2025)</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 max-w-[85%] ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`p-2.5 rounded-xl h-10 w-10 flex items-center justify-center shrink-0 ${
                msg.role === "user" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-700"
              }`}
            >
              {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div
              className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-orange-500 text-white rounded-tr-none"
                  : "bg-slate-100 text-slate-700 rounded-tl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 mr-auto max-w-[80%] items-center">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl h-10 w-10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none text-sm text-slate-500 flex items-center gap-2 font-medium">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></span>
              <span>Analyse du document et génération de la réponse technique en cours...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-2 p-4 bg-red-50 text-red-700 rounded-xl text-xs border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">Erreur de connexion :</p>
              <p className="mt-0.5">{error}</p>
              <p className="mt-1 font-medium text-slate-500">Pour corriger cela, assurez-vous de configurer votre clé d'API <code className="bg-red-100 px-1 py-0.5 rounded text-red-800 font-mono">GEMINI_API_KEY</code> dans l'onglet Secrets d'AI Studio.</p>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Preset buttons */}
      <div className="mb-4">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">Suggestions de questions :</span>
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.q)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-600 rounded-lg font-medium transition-colors text-left flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="flex gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex. Quelle est la largeur de l'emprise pour un tube de 12 pouces ?"
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors shadow-sm"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
