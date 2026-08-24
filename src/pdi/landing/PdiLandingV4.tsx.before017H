// PATCH 011 — commercial landing restored
// PATCH 010 — gated auth landing
// PATCH 004c — PD&I landing v4.
// Page publicitaire publique : AUCUNE barre laterale (la coquille applicative
// n'est montee qu'apres l'entree dans le logiciel), banniere d'information
// pleine largeur, "PD&I en 4 temps", bento minimaliste, pied de page minimaliste.
//
// Ce composant est purement presentationnel : il ne connait ni le moteur V4.8d,
// ni le graphe, ni la topologie. Il expose une seule sortie : onEnter().

import React, { useEffect, useMemo, useState } from "react";
import PdiBrandMark from "../app/PdiBrandMark";
import "./pdiLandingV4.css";

export type PdiLandingV4Props = {
  /** Appele pour entrer dans le logiciel (connexion / demarrage). */
  onEnter: (target?: string) => void;
  initialScreen?: PdiOpeningScreen;
};


// PATCH 004d — landing opening repair.
// Séquence complète : splash -> accueil -> boot -> launcher -> module.
// PATCH 005 : flow d'ouverture stabilise.
export type PdiOpeningScreen = "landing" | "home" | "loading" | "launcher";
const PDI_DEFAULT_ENTRY = "isometric";

const BOOT_STEPS = [
  "Authentification de la session PD&I",
  "Chargement du moteur isométrique V4.8d",
  "Initialisation du JSON central",
  "Montage des calculs Python déterministes",
  "Réveil des agents IA spécialisés",
  "Chargement du catalogue tuyauterie",
  "Vérification ISO / ASME B31.3",
  "Espace de travail prêt",
];

const ENTRY_POINTS = [
  { id: "isometric", title: "Nouveau Plan", sub: "Dessin isométrique manuel", badge: "Recommandé", icon: "ISO", color: "#4db8d4", text: "Créer un projet vierge : nœuds, tubes, accessoires, cotations et alignements." },
  { id: "cad", title: "CAD to ISO", sub: "DXF / DWG → isométrique", badge: "DXF · DWG", icon: "CAD", color: "#4db8d4", text: "Convertir un dessin CAO en modèle PD&I puis en planche isométrique normée." },
  { id: "vision", title: "Vision AI — Photo to ISO", sub: "Photo réelle → JSON → ISO", badge: "IA", icon: "VIS", color: "#e8a838", text: "Reconnaissance IA de la tuyauterie sur photo de site, validation puis génération ISO." },
  { id: "sketch", title: "Croquis to ISO", sub: "Croquis main → isométrique", badge: "Croquis", icon: "CRQ", color: "#e8a838", text: "Redresser un croquis, détecter lignes et symboles, produire un ISO propre." },
  { id: "json", title: "Importer JSON", sub: "JSON PD&I existant", badge: "Reprise", icon: "{}", color: "#4caf7d", text: "Reprendre un modèle PD&I : graphe, soudures, cotes et métré restaurés à l’identique." },
  { id: "cad", title: "Importer CAD / PDF", sub: "Import de fond de plan", badge: "Import", icon: "PDF", color: "#4db8d4", text: "Charger un DXF/DWG/PDF comme support de tracé avec mapping des calques." },
  { id: "home", title: "Ouvrir un projet", sub: "Projets récents du compte", badge: "Récents", icon: "CLK", color: "#888888", text: "Reprendre un projet existant là où il s’est arrêté, avec son historique." },
  { id: "pdf", title: "Exports & BOM", sub: "PDF / DXF / nomenclature", badge: "Export", icon: "OUT", color: "#4caf7d", text: "Produire planches A4→A1, cartouche, nomenclature matériaux et métré." },
];

const NAV_LINKS = [
  { id: "fonctions", label: "Fonctions" },
  { id: "temps", label: "4 temps" },
  { id: "modules", label: "Modules" },
  { id: "contact", label: "Contact" },
];

const BAND = [
  { key: "iso", cls: "pdiL-band-iso", title: "Isométrique", tag: "Moteur ISO V4.8d", icon: "📐", text: "Nœuds, tubes DN, organes, cotations réelles, élévations Z et soudures W00x." },
  { key: "vision", cls: "pdiL-band-vision", title: "Vision IA", tag: "Photo to ISO", icon: "✨", text: "Photo, scan ou plan 2D reconnu automatiquement et converti en JSON piping vérifiable." },
  { key: "sketch", cls: "pdiL-band-sketch", title: "Croquis", tag: "Croquis to ISO", icon: "✏️", text: "Un dessin à main levée devient un réseau topologique industriel normé et exploitable." },
  { key: "json", cls: "pdiL-band-json", title: "JSON Central", tag: "Vérité Technique", icon: "⚡", text: "Un seul modèle de référence unique pour le 2D, le 3D, l'ISO et le métré BOM." },
];

const STEPS = [
  { n: "01", cls: "pdiL-step-1", title: "Capturer", text: "Photo, scan, PDF, plan 2D ou donnees CAO : toute source devient un point de depart." },
  { n: "02", cls: "pdiL-step-2", title: "Reconnaitre", text: "La vision IA identifie la tuyauterie et produit un JSON piping structure." },
  { n: "03", cls: "pdiL-step-3", title: "Construire", text: "Modele topologique, 2D et 3D synchronises, edition professionnelle temps reel." },
  { n: "04", cls: "pdiL-step-4", title: "Livrer", text: "ISO, cotations, DN, W00x, BOM, metre, QA engineering et export documentaire." },
];

const BENTO = [
  { span: "pdiL-sp2", title: "Editeur isometrique professionnel", text: "Clic droit, proprietes reelles X / Y / Z, copier-coller a nouveaux IDs, undo par operation logique." },
  { span: "", title: "Cotations", text: "Selection multiple, unites m / mm, ancrage sur noeud ou sur port." },
  { span: "", title: "Soudures W00x", text: "Numerotation automatique et recalcul apres chaque modification." },
  { span: "", title: "Metre & BOM", text: "Longueurs, poids, volumes et nomenclature toujours a jour." },
  { span: "pdiL-sp2", title: "2D et 3D synchronises", text: "Le plan tuyauterie et l'isometrique partagent le meme graphe : aucune double saisie." },
  { span: "", title: "QA engineering", text: "Controle du reseau, ports orphelins, incoherences DN signalees." },
  { span: "", title: "Trackpad & raccourcis", text: "Pan et pincement Mac, raccourcis Cmd et Ctrl, rotation R / Shift+R." },
  { span: "pdiL-sp3", title: "Export documentaire", text: "Planches A4 a A1, cartouche, PDF, DXF et dossier de fabrication." },
];

const FOOT_COLS = [
  { title: "Produit", links: ["Editeur isometrique", "Vision IA", "Croquis vers ISO", "Import CAO"] },
  { title: "Ingenierie", links: ["Modele JSON", "Soudures W00x", "Metre & BOM", "QA engineering"] },
  { title: "Ressources", links: ["Documentation", "Historique des patchs", "Regles de l'art", "Journal des versions"] },
  { title: "Societe", links: ["A propos", "Contact", "Mentions legales", "Confidentialite"] },
];

export default function PdiLandingV4({ onEnter, initialScreen = "landing" }: PdiLandingV4Props) {
  const [screen, setScreen] = useState<PdiOpeningScreen>(initialScreen);
  const [stuck, setStuck] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bootIndex, setBootIndex] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(PDI_DEFAULT_ENTRY);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register" | "activation">("login");
  const [authDraft, setAuthDraft] = useState({ name: "", email: "", password: "", company: "", plan: "pro" });
  const [simulatedToken, setSimulatedToken] = useState<string | null>(null);
  const [authMsg, setAuthMsg] = useState<string | null>(null);

  // Parallaxe interactive en temps réel (souris, trackpad, gyroscope)
  const [parallax, setParallax] = useState({ x: 0, y: 0, tiltX: 0, tiltY: 0, spotX: 50, spotY: 50 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (initialScreen) {
      setScreen(initialScreen);
    }
  }, [initialScreen]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setStuck(y > 12);
      setScrollY(y);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let reqId: number;
    let targetX = 0;
    let targetY = 0;
    let currX = 0;
    let currY = 0;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e && e.touches.length > 0 ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e && e.touches.length > 0 ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const w = window.innerWidth || 1000;
      const h = window.innerHeight || 800;
      targetX = (clientX / w - 0.5) * 2; // -1 à +1
      targetY = (clientY / h - 0.5) * 2; // -1 à +1
    };

    const loop = () => {
      currX += (targetX - currX) * 0.08;
      currY += (targetY - currY) * 0.08;
      const spotX = 50 + currX * 25;
      const spotY = 50 + currY * 25;
      const tiltX = -currY * 12; // Degrés d'inclinaison 3D
      const tiltY = currX * 14;

      setParallax({
        x: Number(currX.toFixed(4)),
        y: Number(currY.toFixed(4)),
        tiltX: Number(tiltX.toFixed(2)),
        tiltY: Number(tiltY.toFixed(2)),
        spotX: Number(spotX.toFixed(1)),
        spotY: Number(spotY.toFixed(1)),
      });
      reqId = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    reqId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      cancelAnimationFrame(reqId);
    };
  }, []);

  useEffect(() => {
    if (screen !== "loading") return;
    if (bootIndex >= BOOT_STEPS.length - 1) {
      const done = window.setTimeout(() => setScreen("launcher"), 950);
      return () => window.clearTimeout(done);
    }
    const timer = window.setTimeout(() => setBootIndex((v) => v + 1), 520);
    return () => window.clearTimeout(timer);
  }, [screen, bootIndex]);

  const goto = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openAuth = (tab: "login" | "register" = "login") => {
    setMenuOpen(false);
    setAuthTab(tab);
    setAuthModalOpen(true);
    setAuthMsg(null);
  };

  const beginWithDemo = () => {
    setAuthModalOpen(false);
    try {
      window.localStorage.setItem("pdi.auth.mode.v1", "demo");
    } catch {}
    begin();
  };

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authDraft.email || !authDraft.password) {
      setAuthMsg("Veuillez saisir votre email et mot de passe.");
      return;
    }
    try {
      window.localStorage.setItem("pdi.auth.mode.v1", "client");
      window.localStorage.setItem("pdi.auth.user.v1", JSON.stringify({ email: authDraft.email, name: authDraft.email.split("@")[0], plan: "pro" }));
    } catch {}
    setAuthModalOpen(false);
    begin();
  };

  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authDraft.email || !authDraft.name) {
      setAuthMsg("Veuillez renseigner au minimum votre nom et votre adresse email.");
      return;
    }
    const token = `PDI-ACT-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    setSimulatedToken(token);
    setAuthTab("activation");
    setAuthMsg("Compte créé ! Un token d'activation a été simulé.");
  };

  const activateAccount = () => {
    try {
      window.localStorage.setItem("pdi.auth.mode.v1", "client");
      window.localStorage.setItem("pdi.auth.user.v1", JSON.stringify({ email: authDraft.email, name: authDraft.name || "Utilisateur", plan: authDraft.plan }));
    } catch {}
    setAuthModalOpen(false);
    begin();
  };

  const begin = () => {
    setMenuOpen(false);
    setSelectedEntry(PDI_DEFAULT_ENTRY);
    setBootIndex(0);
    setScreen("loading");
  };

  const openEntry = (id?: string | null) => {
    const target = id || "home";
    const known = target === "home" || ENTRY_POINTS.some((entry) => entry.id === target);
    onEnter(known ? target : PDI_DEFAULT_ENTRY);
  };
  const progress = useMemo(() => Math.round(((bootIndex + 1) / BOOT_STEPS.length) * 100), [bootIndex]);

  if (screen === "loading") {
    return (
      <div className="pdiL-boot">
        <button className="pdiL-boot-skip" onClick={() => setScreen("launcher")} title="Passer">×</button>
        <div className="pdiL-boot-glow" />
        <div className="pdiL-boot-brand flex flex-col items-center gap-2">
          <PdiBrandMark variant="horizontal" size="md" />
          <small className="text-slate-400 text-xs">Pipeline Design &amp; Isometrics</small>
        </div>
        <div className="pdiL-boot-steps">
          {BOOT_STEPS.map((step, i) => <div key={step} className={i < bootIndex ? "done" : i === bootIndex ? "now" : "todo"}><span>{i < bootIndex ? "✓" : i === bootIndex ? "◌" : "•"}</span><b>{step}</b></div>)}
        </div>
        <div className="pdiL-bootbar"><i style={{ width: `${progress}%` }} /></div>
        <div className="pdiL-bootpct">{progress}% · ouverture du logiciel</div>
        <div className="pdiL-powered">Powered by DZ-YSB-DEV</div>
      </div>
    );
  }

  if (screen === "launcher") {
    return (
      <div className="pdiL-launcher">
        <header className="pdiL-launcher-head">
          <PdiBrandMark variant="horizontal" size="sm" onClick={() => setScreen("home")} className="cursor-pointer" />
          <span className="pdiL-session"><i /> Session connectée</span>
          <button onClick={() => setScreen("home")}>Retour</button>
        </header>
        <main className="pdiL-launcher-body">
          <span className="pdiL-kicker">Ouverture du logiciel</span>
          <h1>Par où commence votre isométrique&nbsp;?</h1>
          <p>Choisissez un point d’entrée. Toutes les voies aboutissent au même JSON PD&amp;I — la vérité technique du projet.</p>
          <div className="pdiL-entry-grid">
            {ENTRY_POINTS.map((entry) => <button key={`${entry.id}-${entry.title}`} className={selectedEntry === entry.id ? "pdiL-entry selected" : "pdiL-entry"} style={{ "--entry": entry.color } as React.CSSProperties} onClick={() => setSelectedEntry(entry.id)} onDoubleClick={() => openEntry(entry.id)}><span className="pdiL-entry-top"><b>{entry.icon}</b><em>{entry.badge}</em></span><strong>{entry.title}</strong><small>{entry.sub}</small><p>{entry.text}</p><span className="pdiL-entry-go">Choisir →</span></button>)}
          </div>
          <div className="pdiL-launch-actions"><button className="pdiL-btn pdiL-btn-primary pdiL-btn-lg" onClick={() => openEntry(selectedEntry)}>Préparer · {ENTRY_POINTS.find((x) => x.id === selectedEntry)?.title || "Accueil"}</button><span>Astuce : double-cliquez une carte pour ouvrir directement</span></div>
        </main>
        <footer className="pdiL-launcher-foot">ISO / ASME B31.3 · Calculs Python déterministes · JSON central · Powered by DZ-YSB-DEV</footer>
      </div>
    );
  }

  if (screen === "home") {
    return (
      <div className="pdiL-root">
        <div className="pdiL-navhost">
          <nav className={stuck ? "pdiL-nav is-stuck" : "pdiL-nav"} aria-label="Navigation PD&I">
            <PdiBrandMark variant="horizontal" size="sm" onClick={() => setScreen("landing")} className="cursor-pointer" title="Retour à l'écran de présentation" />
            <div className="pdiL-navlinks">{NAV_LINKS.map((link) => <button key={link.id} type="button" className="pdiL-navlink" onClick={() => goto(link.id)}>{link.label}</button>)}</div>
            <div className="pdiL-navactions"><button type="button" className="pdiL-btn pdiL-btn-ghost" onClick={() => openAuth("login")}>Connexion</button><button type="button" className="pdiL-btn pdiL-btn-primary" onClick={() => openAuth("register")}>Créer compte</button></div>
            <button type="button" className="pdiL-burger" aria-label="Ouvrir le menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>{menuOpen ? "×" : "☰"}</button>
          </nav>
          <div className={menuOpen ? "pdiL-mobilemenu is-open" : "pdiL-mobilemenu"}>{NAV_LINKS.map((link) => <button key={link.id} type="button" className="pdiL-navlink" onClick={() => goto(link.id)}>{link.label}</button>)}<button type="button" className="pdiL-btn pdiL-btn-ghost" onClick={() => openAuth("login")}>Connexion</button><button type="button" className="pdiL-btn pdiL-btn-primary" onClick={() => openAuth("register")}>Créer compte</button></div>
        </div>
        <header className="pdiL-homehero"><div><span className="pdiL-kicker">Accueil PD&amp;I</span><h1>Construire vos plans isométriques depuis toutes vos sources.</h1><p>Le logiciel principal : dessin manuel, Vision PD&amp;I photo/croquis, import CAO/DXF/PDF, JSON central, exports et validation engineering.</p><div className="flex flex-wrap items-center justify-center gap-3"><button className="pdiL-btn pdiL-btn-primary pdiL-btn-lg" onClick={() => openAuth("login")}>Se connecter au logiciel</button><button className="pdiL-btn pdiL-btn-ghost pdiL-btn-lg" onClick={beginWithDemo}>Mode démo immédiat →</button></div></div></header>
        {landingSections(() => openAuth("login"))}

        {authModalOpen && (
          <div className="pdiL-modal-overlay" onClick={() => setAuthModalOpen(false)}>
            <div className="pdiL-modal-card" onClick={(e) => e.stopPropagation()}>
              <button className="pdiL-modal-close" onClick={() => setAuthModalOpen(false)} title="Fermer">×</button>
              <div className="flex items-center gap-2 mb-3">
                <PdiBrandMark variant="horizontal" size="sm" />
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Authentification</span>
              </div>
              
              <div className="pdiL-auth-tabs">
                <button type="button" className={authTab === "login" ? "active" : ""} onClick={() => { setAuthTab("login"); setAuthMsg(null); }}>Se connecter</button>
                <button type="button" className={authTab === "register" ? "active" : ""} onClick={() => { setAuthTab("register"); setAuthMsg(null); }}>Nouveau compte</button>
                <button type="button" className={authTab === "activation" ? "active" : ""} onClick={() => { setAuthTab("activation"); setAuthMsg(null); }}>Activation</button>
              </div>

              {authMsg && <div className="pdiL-auth-alert">{authMsg}</div>}

              {authTab === "login" && (
                <form onSubmit={submitLogin} className="pdiL-auth-form">
                  <label>Email professionnel
                    <input type="email" placeholder="votre.nom@entreprise.com" value={authDraft.email} onChange={(e) => setAuthDraft({ ...authDraft, email: e.target.value })} required />
                  </label>
                  <label>Mot de passe
                    <input type="password" placeholder="••••••••" value={authDraft.password} onChange={(e) => setAuthDraft({ ...authDraft, password: e.target.value })} required />
                  </label>
                  <button type="submit" className="pdiL-btn pdiL-btn-primary pdiL-btn-block">Se connecter →</button>
                  <button type="button" className="pdiL-btn pdiL-btn-ghost pdiL-btn-block mt-2" onClick={beginWithDemo}>⚡ Accès direct session démo</button>
                </form>
              )}

              {authTab === "register" && (
                <form onSubmit={submitRegister} className="pdiL-auth-form">
                  <div className="pdiL-form-grid">
                    <label>Nom complet
                      <input type="text" placeholder="Prénom Nom" value={authDraft.name} onChange={(e) => setAuthDraft({ ...authDraft, name: e.target.value })} required />
                    </label>
                    <label>Entreprise / Organisation
                      <input type="text" placeholder="Société ou Indépendant" value={authDraft.company} onChange={(e) => setAuthDraft({ ...authDraft, company: e.target.value })} />
                    </label>
                  </div>
                  <label>Email
                    <input type="email" placeholder="nom@domaine.com" value={authDraft.email} onChange={(e) => setAuthDraft({ ...authDraft, email: e.target.value })} required />
                  </label>
                  <label>Mot de passe
                    <input type="password" placeholder="Min. 8 caractères" value={authDraft.password} onChange={(e) => setAuthDraft({ ...authDraft, password: e.target.value })} required />
                  </label>
                  <label>Formule souhaitée
                    <select value={authDraft.plan} onChange={(e) => setAuthDraft({ ...authDraft, plan: e.target.value })}>
                      <option value="demo">Essai 30 jours — Découverte ISO</option>
                      <option value="pro">Professionnel — Solo &amp; PME</option>
                      <option value="team">Équipe — Multi-utilisateurs &amp; Calculs</option>
                      <option value="enterprise">Entreprise &amp; Sur-mesure</option>
                    </select>
                  </label>
                  <button type="submit" className="pdiL-btn pdiL-btn-primary pdiL-btn-block">Créer mon compte et recevoir le token</button>
                </form>
              )}

              {authTab === "activation" && (
                <div className="pdiL-auth-form">
                  <p className="text-sm text-slate-300">
                    Un token d'activation unique a été émis pour <strong>{authDraft.email || "votre compte"}</strong>.
                  </p>
                  <div className="pdiL-token-box">
                    <small>Token de confirmation sécurisé :</small>
                    <code>{simulatedToken || "PDI-ACT-DEMO-READY"}</code>
                  </div>
                  <button type="button" className="pdiL-btn pdiL-btn-primary pdiL-btn-block" onClick={activateAccount}>
                    Confirmer et ouvrir l'espace de travail →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="pdiL-hero-shell"
      style={{
        "--px": parallax.x,
        "--py": parallax.y,
        "--tiltX": `${parallax.tiltX}deg`,
        "--tiltY": `${parallax.tiltY}deg`,
        "--spotX": `${parallax.spotX}%`,
        "--spotY": `${parallax.spotY}%`,
      } as React.CSSProperties}
    >
      <div className="pdiL-hero-spotlight" />
      <div className="pdiL-hero-bg">
        <span className="pdiL-p1" />
        <span className="pdiL-p2" />
        <span className="pdiL-p3" />
        <span className="pdiL-p4" />
        <span className="pdiL-p5" />
        <span className="pdiL-p6" />
      </div>
      <div className="pdiL-hero-grid" />
      <section className="pdiL-splash">
        <div className="flex flex-col items-center justify-center gap-1.5 mb-2">
          <PdiBrandMark variant="horizontal" size="lg" />
          <small className="text-cyan-300 font-bold uppercase tracking-widest text-[11px]">Pipeline Design &amp; Isometrics</small>
        </div>
        <h1>Du croquis à l’isométrique normé,<br /><em>PD&amp;I dessine votre tuyauterie.</em></h1>
        <p>Photo, P&amp;ID ou croquis → reconnaissance IA, topologie, soudures, cotations, métré et BOM. Un seul JSON comme vérité technique, un ISO prêt à signer.</p>
        <div className="pdiL-hero-visual" aria-hidden="true">
          <img src="/assets/pdi/landing/hero-dashboard.png" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}} />
          <div className="pdiL-hero-fallback flex flex-col items-center justify-center gap-2 p-4">
            <PdiBrandMark variant="horizontal" size="md" />
            <span>ISO · CAD 2D · Vision · JSON</span>
          </div>
          <div className="pdiL-card-glare" />
        </div>
        <button className="pdiL-hero-button" onClick={() => setScreen("home")}>Découvrir PD&I →</button>
        <div className="pdiL-hero-meta"><span>ISO / ASME B31.3</span><i /><span>Calculs Python déterministes</span><i /><span>JSON central</span><i /><span>Agents IA spécialisés</span></div>
      </section>
      <div className="pdiL-powered">Powered by DZ-YSB-DEV</div>
    </div>
  );
}

function landingSections(begin: () => void) {
  return <>
    <div className="pdiL-wrap" id="fonctions">
      <div className="pdiL-band">
        {BAND.map((cell) => (
          <div key={cell.key} className={"pdiL-bandcell " + cell.cls} role="button" tabIndex={0} onClick={begin}>
            <div className="pdiL-band-head">
              <span className="pdiL-band-icon">{cell.icon}</span>
              <span className="pdiL-band-tag">{cell.tag}</span>
            </div>
            <b>{cell.title}</b>
            <span>{cell.text}</span>
            <div className="pdiL-band-foot">Découvrir le module →</div>
          </div>
        ))}
      </div>
    </div>
    <section className="pdiL-sec" id="temps"><div className="pdiL-wrap"><div className="pdiL-seclabel">Méthode</div><h2>PD&amp;I en 4 temps</h2><p className="pdiL-lead">Une chaîne unique, de la source réelle jusqu'au dossier d'exécution.</p><div className="pdiL-steps">{STEPS.map((step) => <div key={step.n} className={"pdiL-step " + step.cls}><div className="pdiL-stepnum">{step.n}</div><h3>{step.title}</h3><p>{step.text}</p></div>)}</div></div></section>
    <section className="pdiL-sec" id="modules"><div className="pdiL-wrap"><div className="pdiL-seclabel">Capacités</div><h2>Ce que fait le logiciel</h2><p className="pdiL-lead">Un moteur isométrique professionnel, et un seul modèle de données.</p><div className="pdiL-bento">{BENTO.map((cell) => <div key={cell.title} className={cell.span ? "pdiL-cell " + cell.span : "pdiL-cell"}><h4>{cell.title}</h4><p>{cell.text}</p></div>)}</div></div></section>
    <footer className="pdiL-foot" id="contact">
      <div className="pdiL-wrap">
        <div className="pdiL-footgrid">
          <div className="pdiL-footbrand">
            <PdiBrandMark variant="horizontal" size="sm" />
            <p className="mt-3">Conception de tuyauterie et isométriques industriels. Un modèle unique, du relevé terrain au dossier de fabrication.</p>
            <small>Powered by DZ-YSB-DEV</small>
          </div>
          {FOOT_COLS.map((col) => <div key={col.title} className="pdiL-footcol"><b>{col.title}</b>{col.links.map((label) => <a key={label} onClick={begin} role="button" tabIndex={0}>{label}</a>)}</div>)}
        </div>
        <div className="pdiL-footbar"><span>PD&amp;I — Piping Design &amp; Isometrics</span><span>Tous droits réservés</span></div>
      </div>
    </footer>
  </>;
}
