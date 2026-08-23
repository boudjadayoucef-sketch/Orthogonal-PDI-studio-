// PATCH 012 — license keys and deployment fallback
// PATCH 011 — Super admin shell and landing restore
// PATCH 010 — simulated auth activation
// PATCH 009 — User profile account space
// PATCH 008 — SaaS tabs flow
// PATCH 007e — compact floating props landing restore
import React, { useEffect, useMemo, useState } from "react";
import PdiBrandMark from "./PdiBrandMark";
import PdiIsometricEditor from "../isometric/PdiIsometricEditor";
// PATCH 004c : page publicitaire publique, montee AVANT la coquille applicative.
import PdiLandingV4 from "../landing/PdiLandingV4";
import { GoogleDriveWorkspace } from "../../components/GoogleDriveWorkspace";
import isoPiping3D from "../../assets/images/pdi_iso_piping_3d_1787006532562.jpg";
import valve3D from "../../assets/images/pdi_valve_3d_1787006543831.jpg";
import plantScan3D from "../../assets/images/pdi_plant_scan_3d_1787006555680.jpg";
import cadSpool3D from "../../assets/images/pdi_cad_spool_3d_1787006567003.jpg";

type PdiModule = "home" | "isometric" | "drive" | "vision" | "sketch" | "cad" | "json" | "pdf" | "projects" | "assistant" | "profile" | "subscription" | "security" | "super_admin_console" | "license_keys";
type PdiWorkspaceTab = { id: string; title: string; module: PdiModule; projectId: string; dirty?: boolean; createdAt: string };

// PATCH 004c : cle de session de l'etape publique.
const PDI_STAGE_KEY = "pdi.stage.v4";
const PDI_TABS_KEY = "pdi.tabs.v1";
const PDI_ACTIVE_TAB_KEY = "pdi.activeTabId.v1";
const PDI_AUTH_KEY = "pdi.auth.mode.v1";

type LaunchCard = {
  id: PdiModule;
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  ready?: boolean;
};

const launchCards: LaunchCard[] = [
  { id: "isometric", title: "Dessin isométrique", subtitle: "Créer un projet manuel avec nœuds, tubes, équipements, cotations et alignements.", badge: "V4.8d1", icon: "ISO", ready: true },
  { id: "drive", title: "Google Drive & Cloud SQL", subtitle: "Synchroniser, archiver et exporter vos plans et projets ISO sur Google Drive et PostgreSQL.", badge: "Drive & SQL", icon: "DRV", ready: true },
  { id: "vision", title: "Vision PD&I", subtitle: "Transformer une photo de plant réel en JSON piping puis en ISO après validation.", badge: "Photo → ISO", icon: "VIS" },
  { id: "sketch", title: "Croquis → ISO", subtitle: "Importer un dessin à la main, extraire le réseau, valider le JSON puis générer l’ISO.", badge: "Croquis", icon: "CRQ" },
  { id: "cad", title: "Importer CAO / DXF", subtitle: "Lire un DXF/PDF, extraire calques/lignes/blocs et convertir vers JSON PD&I.", badge: "DXF/PDF", icon: "DX" },
  { id: "json", title: "Ouvrir JSON PD&I", subtitle: "Charger ou vérifier le modèle central : lignes, nœuds, équipements, soudures, cotations.", badge: "JSON", icon: "{}" },
  { id: "pdf", title: "Impression / exports", subtitle: "Préparer PDF, DXF, planches A4/A3/A2/A1, cartouche et nomenclature.", badge: "PDF/DXF", icon: "OUT" },
];

const showcase = [
  {
    title: "Dessin isométrique 3D",
    text: "Moteur vectoriel temps-réel, tubes DN, robinetterie, cotations automatiques et alignements spatiaux.",
    tag: "ISO 3D",
    color: "#0ea5e9",
    image: isoPiping3D,
    caption: "Réseau tuyauterie inox & collecteurs haute fidélité",
  },
  {
    title: "Vision PD&I Réelle",
    text: "Photo d'installation réelle → segmentation 3D → JSON piping → validation industrielle.",
    tag: "VISION 3D",
    color: "#f97316",
    image: plantScan3D,
    caption: "Scan & détection des composants de tuyauterie",
  },
  {
    title: "Croquis & Modèle CAO",
    text: "Reconnaissance de tracés main, génération instantanée du spool 3D et cotations.",
    tag: "CROQUIS 3D",
    color: "#8b5cf6",
    image: cadSpool3D,
    caption: "Spool préfabriqué avec cotes isométriques",
  },
  {
    title: "Organes & Robinets 3D",
    text: "Vannes à passage direct, papillons, brides et by-pass intégrés en bibliothèque standard.",
    tag: "EQUIP 3D",
    color: "#22c55e",
    image: valve3D,
    caption: "Robinetterie industrielle & instrumentation",
  },
  {
    title: "Plans & Cartouches ISO",
    text: "Exportation PDF/DXF normalisée A4/A3/A2/A1 avec nomenclature automatique (BOM).",
    tag: "EXPORT",
    color: "#eab308",
    image: isoPiping3D,
    caption: "Planche d'exécution et dossier de fabrication",
  },
  {
    title: "Jumeau Numérique & IA",
    text: "Agents spécialisés pipeline-design-skill pour l'assistance et la vérification des règles de l'art.",
    tag: "DIGITAL TWIN",
    color: "#06b6d4",
    image: plantScan3D,
    caption: "Modélisation intelligente assistée par IA",
  },
];

const navItems: Array<{ id: PdiModule; label: string; icon: string; title: string }> = [
  { id: "home", label: "Accueil", icon: "⌂", title: "Accueil PD&I" },
  { id: "isometric", label: "ISO", icon: "ISO", title: "Dessin isométrique" },
  { id: "drive", label: "Drive", icon: "DRV", title: "Google Drive & Cloud SQL" },
  { id: "vision", label: "Vision", icon: "VIS", title: "Vision PD&I — Photo vers ISO" },
  { id: "sketch", label: "Croquis", icon: "CRQ", title: "Croquis vers JSON/ISO" },
  { id: "cad", label: "CAO", icon: "DX", title: "Import CAD/DXF/PDF" },
  { id: "json", label: "JSON", icon: "{}", title: "Modèle JSON PD&I" },
  { id: "pdf", label: "Export", icon: "PDF", title: "PDF / DXF / Impression" },
  { id: "assistant", label: "IA", icon: "AI", title: "Assistant et agents spécialisés" },
];

function ComingSoonPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="pdi-module-panel"><div className="pdi-panel-kicker">Module préparé</div><h1>{title}</h1><div className="pdi-panel-body">{children}</div></section>;
}

export default function PdiUnifiedApp() {
  const [activeModule, setActiveModule] = useState<PdiModule>("home");
  const [authMode, setAuthMode] = useState<"guest" | "demo" | "pending_email" | "client" | "admin" | "super_admin">(() => { try { return (window.localStorage.getItem(PDI_AUTH_KEY) as any) || "demo"; } catch { return "demo"; } });
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [authPanelMode, setAuthPanelMode] = useState<"login" | "register" | "activation">("login");
  const [authDraft, setAuthDraft] = useState({ name: "", email: "", company: "", password: "", plan: "demo" });
  const [activationToken, setActivationToken] = useState<string | null>(() => { try { return window.localStorage.getItem("pdi.activation.pendingToken.v1"); } catch { return null; } });
  const startDemoSession = () => { setAuthMode("demo"); try { window.localStorage.setItem(PDI_AUTH_KEY,"demo"); window.sessionStorage.setItem(PDI_STAGE_KEY,"app"); window.localStorage.setItem("pdi.force.app.v1","1"); } catch {} setStage("app"); setActiveModule("home"); };
  const submitRegisterSimulated = () => {
    if (!authDraft.email || !authDraft.name || authDraft.password.length < 6) { setAuthPanelMode("register"); return; }
    const token = `pdi-act-${Date.now().toString(36)}`;
    setActivationToken(token);
    setAuthMode("pending_email");
    try { window.localStorage.setItem("pdi.activation.pendingToken.v1", token); window.localStorage.setItem("pdi.auth.pendingUser.v1", JSON.stringify({ ...authDraft, password: undefined, status:"pending_email" })); } catch {}
    setAuthPanelMode("activation");
  };
  const activateSimulatedAccount = () => { setAuthMode("client"); try { window.localStorage.removeItem("pdi.activation.pendingToken.v1"); window.localStorage.setItem(PDI_AUTH_KEY,"client"); window.sessionStorage.setItem(PDI_STAGE_KEY,"app"); window.localStorage.setItem("pdi.force.app.v1","1"); } catch {} setStage("app"); setActiveModule("home"); };

  const pdiUserProfile = {
    name: "Youcef Seif Eddine Boudjada",
    email: "boudjada.youcef@gmail.com",
    role: authMode,
    company: "PD&I Vision DZ",
    country: "Algérie",
    plan: authMode === "guest" ? "Guest" : authMode === "demo" ? "Demo" : "Pro",
    emailStatus: "confirmé",
    createdAt: "2026-08-20",
  };

  const [licenseKeys, setLicenseKeys] = useState<Array<{ id:string; code:string; type:string; plan:string; status:string; email:string; createdAt:string; expiresAt:string }>>(() => {
    try { return JSON.parse(window.localStorage.getItem("pdi.license.keys.v1") || "[]"); } catch { return []; }
  });
  const [licenseDraft, setLicenseDraft] = useState({ type:"TRIAL_30", plan:"PRO", email:"" });
  const persistLicenseKeys = (keys: typeof licenseKeys) => { setLicenseKeys(keys); try { window.localStorage.setItem("pdi.license.keys.v1", JSON.stringify(keys)); } catch {} };
  const generateLicenseKey = () => {
    const id = `lic-${Date.now().toString(36)}`;
    const code = `PDI-${licenseDraft.type}-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const days = licenseDraft.type.includes("7") ? 7 : licenseDraft.type.includes("30") ? 30 : licenseDraft.type.includes("YEAR") ? 365 : 90;
    const expiresAt = new Date(Date.now()+days*86400000).toISOString().slice(0,10);
    persistLicenseKeys([{ id, code, type:licenseDraft.type, plan:licenseDraft.plan, status:"generated", email:licenseDraft.email, createdAt:new Date().toISOString().slice(0,10), expiresAt }, ...licenseKeys]);
  };
  const revokeLicenseKey = (id:string) => persistLicenseKeys(licenseKeys.map(k=>k.id===id?{...k,status:"revoked"}:k));

  const [workspaceTabs, setWorkspaceTabs] = useState<PdiWorkspaceTab[]>(() => { try { return JSON.parse(window.localStorage.getItem(PDI_TABS_KEY) || "[]"); } catch { return []; } });
  const [activeTabId, setActiveTabId] = useState<string | null>(() => { try { return window.localStorage.getItem(PDI_ACTIVE_TAB_KEY); } catch { return null; } });
  const persistTabs = (tabs: PdiWorkspaceTab[], id: string | null) => { try { window.localStorage.setItem(PDI_TABS_KEY, JSON.stringify(tabs)); if(id) window.localStorage.setItem(PDI_ACTIVE_TAB_KEY,id); } catch {} };
  const canOpenWorkspaceModule = authMode === "demo" || authMode === "client" || authMode === "admin" || authMode === "super_admin";
  const openModuleInTab = (module: PdiModule, title?: string) => {
    if (!canOpenWorkspaceModule && module !== "home") { setAuthPanelMode("login"); setActiveModule("home"); return; }
    if (module === "home") { setActiveModule("home"); return; }
    const id = `tab-${Date.now().toString(36)}`;
    const next: PdiWorkspaceTab = { id, title: title || navItems.find(x=>x.id===module)?.title || "Projet PD&I", module, projectId: `project-${Date.now().toString(36)}`, dirty: false, createdAt: new Date().toISOString() };
    const tabs = [...workspaceTabs, next]; setWorkspaceTabs(tabs); setActiveTabId(id); setActiveModule(module); persistTabs(tabs,id);
  };
  const switchTab = (id: string) => { const tab = workspaceTabs.find(t=>t.id===id); if(!tab) return; setActiveTabId(id); setActiveModule(tab.module); persistTabs(workspaceTabs,id); };
  const closeTab = (id: string) => { const tabs = workspaceTabs.filter(t=>t.id!==id); const next = tabs[tabs.length-1] || null; setWorkspaceTabs(tabs); setActiveTabId(next?.id || null); setActiveModule(next?.module || "home"); persistTabs(tabs,next?.id || null); };

  // PATCH 004c : etape "landing" par defaut a chaque ouverture/rechargement,
  // puis "app" (coquille + modules) lorsque l'utilisateur clique pour entrer.
  const [stage, setStage] = useState<"landing" | "app">("landing");
  const [landingScreen, setLandingScreen] = useState<"landing" | "home" | "launcher">("landing");

  const enterApp = React.useCallback((target?: string) => {
    try {
      window.sessionStorage.setItem(PDI_STAGE_KEY, "app");
    } catch {
      /* stockage indisponible : l'entree reste valable pour l'affichage courant */
    }
    setStage("app");

    // PATCH 004d : la landing / page d'ouverture peut maintenant envoyer
    // directement vers le module choisi, sans casser le comportement existant.
    const allowed: PdiModule[] = [
      "home",
      "isometric",
      "drive",
      "vision",
      "sketch",
      "cad",
      "json",
      "pdf",
      "projects",
      "assistant",
      "profile",
      "subscription",
      "security",
    ];

    setActiveModule(allowed.includes(target as PdiModule) ? (target as PdiModule) : "home");
    window.scrollTo(0, 0);
  }, []);

  const handleLogoutToHome = React.useCallback(() => {
    try {
      window.sessionStorage.removeItem(PDI_STAGE_KEY);
      window.localStorage.removeItem("pdi.force.app.v1");
      window.localStorage.setItem(PDI_AUTH_KEY, "guest");
    } catch {}
    setAuthMode("guest");
    setLandingScreen("home");
    setStage("landing");
    setActiveModule("home");
    setAccountMenuOpen(false);
  }, []);

  useEffect(() => {
    const onNavigate = (event: Event) => {
      const detail = (event as CustomEvent<PdiModule | "landing" | "launcher" | "logout" | "landing_home" | string>).detail;
      // PATCH 005 : navigation ciblee stabilisee.
      const allowed: PdiModule[] = [
        "home",
        "isometric",
        "drive",
        "vision",
        "sketch",
        "cad",
        "json",
        "pdf",
        "projects",
        "assistant",
        "profile",
        "subscription",
        "security",
      ];
      if (detail === "landing") {
        try { window.sessionStorage.removeItem(PDI_STAGE_KEY); window.localStorage.removeItem("pdi.force.app.v1"); } catch {}
        setLandingScreen("landing");
        setStage("landing");
        setActiveModule("home");
        return;
      }
      if (detail === "logout" || detail === "landing_home") {
        handleLogoutToHome();
        return;
      }
      if (detail === "launcher") {
        try { window.sessionStorage.removeItem(PDI_STAGE_KEY); } catch {}
        setLandingScreen("launcher");
        setStage("landing");
        setActiveModule("home");
        return;
      }
      setStage("app");
      try { window.sessionStorage.setItem(PDI_STAGE_KEY, "app"); } catch {}
      setActiveModule(allowed.includes(detail as PdiModule) ? (detail as PdiModule) : "home");
    };
    window.addEventListener("pdi:navigate", onNavigate as EventListener);
    return () => window.removeEventListener("pdi:navigate", onNavigate as EventListener);
  }, [handleLogoutToHome]);

  useEffect(() => { try { window.localStorage.setItem(PDI_AUTH_KEY, authMode); } catch {} }, [authMode]);
  useEffect(() => { const tab = workspaceTabs.find(t=>t.id===activeTabId); if(tab && activeModule === "home") setActiveModule(tab.module); }, []);

  const moduleTitle = useMemo(() => navItems.find((x) => x.id === activeModule)?.title || "PD&I", [activeModule]);

  // PATCH 004c : la page publicitaire est rendue seule, sans barre laterale ni
  // barre superieure. Une navigation externe (pdi:navigate) entre directement
  // dans le logiciel, ce qui preserve le comportement existant.
  if (stage === "landing") return <PdiLandingV4 onEnter={enterApp} initialScreen={landingScreen} />;

  if (activeModule === "isometric") return <PdiIsometricEditor />;

  return (
    <div className="pdi-unified-root">
      <style>{`
        .pdi-unified-root{height:100vh;width:100vw;overflow:hidden;background:#070B12;color:#E5EDF8;font-family:Inter,ui-sans-serif,system-ui,sans-serif;display:grid;grid-template-columns:96px 1fr;grid-template-rows:72px 1fr}.pdi-unified-topbar{grid-column:1/3;display:flex;align-items:center;gap:18px;padding:8px 16px;background:linear-gradient(180deg,#111827,#0B1019);border-bottom:1px solid rgba(148,163,184,.22);box-shadow:0 8px 24px rgba(0,0,0,.28);min-width:0}.pdi-unified-brand{display:flex;align-items:center;gap:14px;min-width:260px}.pdi-project-title{min-width:0;border-left:1px solid rgba(148,163,184,.28);padding-left:14px;line-height:1.1}.pdi-project-title small{display:block;color:#8EA3C2;font-size:10px;text-transform:uppercase;font-weight:900}.pdi-project-title strong{display:block;color:#F8FAFC;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pdi-top-actions{margin-left:auto;display:flex;align-items:center;gap:8px;color:#93A4BD;font-size:12px}.pdi-search{height:36px;width:min(340px,24vw);border:1px solid rgba(148,163,184,.22);background:#0A1220;color:#E5EDF8;border-radius:10px;padding:0 12px;font-weight:800}.pdi-account{height:36px;border:1px solid rgba(34,211,238,.35);background:#0A1220;color:#F8FAFC;border-radius:10px;padding:0 12px;font-weight:900}.pdi-main-nav{grid-row:2;display:flex;flex-direction:column;gap:10px;padding:14px 10px;background:linear-gradient(180deg,#0D1420,#090E17);border-right:1px solid rgba(148,163,184,.18);overflow:auto}.pdi-main-nav button{height:58px;border:1px solid rgba(148,163,184,.16);background:#111827;color:#BBD0EA;border-radius:14px;font-weight:1000;font-size:13px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer}.pdi-main-nav button.active{background:linear-gradient(135deg,#0284C7,#0EA5E9);color:white;border-color:#67E8F9;box-shadow:0 0 0 1px rgba(103,232,249,.55),0 16px 35px rgba(14,165,233,.25)}.pdi-main-nav small{font-size:8px;letter-spacing:.06em;text-transform:uppercase;opacity:.82}.pdi-content{grid-column:2;grid-row:2;min-width:0;min-height:0;overflow:auto;padding:22px;background:radial-gradient(circle at 18% 8%,rgba(14,165,233,.16),transparent 32%),radial-gradient(circle at 86% 12%,rgba(249,115,22,.13),transparent 28%),#070B12}.pdi-home-hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(330px,.8fr);gap:20px;align-items:stretch}.pdi-hero-card,.pdi-module-panel,.pdi-launch-card,.pdi-showcase-card{border:1px solid rgba(148,163,184,.18);background:linear-gradient(180deg,rgba(15,23,42,.94),rgba(8,13,24,.98));border-radius:24px;box-shadow:0 24px 70px rgba(0,0,0,.28)}.pdi-hero-card{padding:28px}.pdi-hero-card h1,.pdi-module-panel h1{font-size:clamp(28px,4vw,54px);line-height:.95;margin:0;color:#F8FAFC;letter-spacing:-.04em}.pdi-hero-card p{color:#B9C8DD;font-weight:700;max-width:760px}.pdi-badge-row{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}.pdi-badge{border:1px solid rgba(103,232,249,.28);background:rgba(8,145,178,.12);color:#67E8F9;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:1000;text-transform:uppercase}.pdi-launch-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:20px}.pdi-launch-card{padding:18px;text-align:left;color:#E5EDF8;cursor:pointer;transition:.18s transform,.18s border-color}.pdi-launch-card:hover{transform:translateY(-2px);border-color:#38BDF8}.pdi-launch-card .icon{width:54px;height:54px;border-radius:16px;display:grid;place-items:center;background:#0EA5E9;color:white;font-weight:1000;margin-bottom:12px}.pdi-launch-card h3{margin:0 0 8px;font-size:18px}.pdi-launch-card p{margin:0;color:#9FB0C8;font-size:12px;font-weight:700}.pdi-launch-card .badge{display:inline-block;margin-top:12px;color:#FDE68A;font-size:10px;font-weight:1000;text-transform:uppercase}.pdi-showcase{height:calc(100vh - 132px);overflow:hidden;position:relative;border-radius:24px;border:1px solid rgba(148,163,184,.14);background:rgba(10,18,32,.5);padding:10px}.pdi-showcase:hover .pdi-showcase-track{animation-play-state:paused}.pdi-showcase-track{display:flex;flex-direction:column;gap:16px;animation:pdiShowcaseScroll 32s linear infinite}.pdi-showcase-card{padding:14px;position:relative;overflow:hidden;transition:transform .2s ease,border-color .2s ease;border:1px solid rgba(148,163,184,.2)}.pdi-showcase-card:hover{transform:translateY(-3px);border-color:var(--accent)}.pdi-showcase-card::before{content:"";position:absolute;inset:auto -30px -45px auto;width:140px;height:140px;border-radius:999px;background:var(--accent);opacity:.2;filter:blur(10px);pointer-events:none}.pdi-showcase-img-box{position:relative;width:100%;height:140px;border-radius:14px;overflow:hidden;border:1px solid rgba(148,163,184,.22);background:#070C15;margin-bottom:12px}.pdi-showcase-img{width:100%;height:100%;object-fit:cover;transition:transform .4s cubic-bezier(0.16,1,0.3,1)}.pdi-showcase-card:hover .pdi-showcase-img{transform:scale(1.06)}.pdi-showcase-img-overlay{position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(7,11,18,.85) 100%)}.pdi-showcase-img-caption{position:absolute;bottom:6px;left:8px;right:8px;font-size:10px;font-weight:800;color:#F1F5F9;text-shadow:0 1px 3px rgba(0,0,0,.9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pdi-showcase-card .tag{display:inline-grid;place-items:center;min-width:64px;padding:0 8px;height:24px;border-radius:8px;background:var(--accent);color:white;font-size:10px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}.pdi-showcase-card h3{margin:0 0 6px;font-size:16px;color:#F8FAFC;font-weight:800}.pdi-showcase-card p{margin:0;color:#94A3B8;font-weight:600;font-size:12px;line-height:1.45}@keyframes pdiShowcaseScroll{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}.pdi-module-panel{padding:28px;min-height:calc(100vh - 128px)}.pdi-panel-kicker{color:#67E8F9;font-size:11px;text-transform:uppercase;font-weight:1000;margin-bottom:10px}.pdi-panel-body{margin-top:20px;color:#B9C8DD;font-weight:750;line-height:1.75;max-width:980px}.pdi-panel-body code{background:#111827;border:1px solid rgba(148,163,184,.18);border-radius:8px;padding:3px 6px;color:#FDE68A}.pdi-start-primary{border:0;background:linear-gradient(135deg,#0284C7,#22D3EE);color:white;border-radius:16px;padding:14px 18px;font-weight:1000;cursor:pointer;box-shadow:0 18px 45px rgba(14,165,233,.28)}.pdi-auth-badge{border:1px solid rgba(103,232,249,.35);background:rgba(14,165,233,.14);color:#67E8F9;border-radius:999px;padding:6px 10px;font-size:10px;font-weight:1000}.pdi-account{position:relative;background:linear-gradient(180deg,#123044,#0A1824)!important;border-color:#38BDF8!important}.pdi-account-menu{position:absolute;right:12px;top:58px;z-index:80;width:190px;background:#0B111A;border:1px solid rgba(103,232,249,.32);border-radius:14px;padding:7px;box-shadow:0 24px 60px rgba(0,0,0,.5)}.pdi-account-menu button{display:block;width:100%;height:34px;text-align:left;border:0;background:transparent;color:#DCEBFA;border-radius:8px;padding:0 10px;font-weight:800}.pdi-account-menu button:hover{background:#123044;color:white}.pdi-tabsbar{grid-column:2;grid-row:2;align-self:start;z-index:8;display:flex;gap:6px;padding:8px 14px;background:#080D14;border-bottom:1px solid rgba(148,163,184,.18);overflow:auto}.pdi-tabsbar button{height:30px;border-radius:8px;border:1px solid #263241;background:linear-gradient(180deg,#1E293B,#111827);color:#CBD5E1;font-size:11px;font-weight:900;padding:0 9px;display:flex;align-items:center;gap:8px;animation:pdiTabIn .2s ease}.pdi-tabsbar button.active{background:linear-gradient(135deg,#0284C7,#22D3EE);color:white;border-color:#67E8F9}.pdi-tabsbar button span{opacity:.65}.pdi-tabsbar .plus{min-width:34px;justify-content:center}.pdi-launch-card{background:linear-gradient(180deg,#1B2430,#101722)!important;border-color:rgba(77,184,212,.36)!important;box-shadow:0 16px 38px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04)!important}.pdi-launch-card:hover{transform:translateY(-3px) scale(1.01);border-color:#67E8F9!important;box-shadow:0 24px 50px rgba(14,165,233,.18)!important}@keyframes pdiTabIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}.pdi-profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pdi-profile-card{border:1px solid rgba(148,163,184,.22);background:linear-gradient(180deg,#111827,#0B111A);border-radius:18px;padding:16px}.pdi-profile-card.wide{grid-column:1/-1}.pdi-profile-card h3{margin:0 0 12px;color:#67E8F9}.pdi-profile-card p{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(148,163,184,.12);padding:8px 0;margin:0}.pdi-profile-card b{color:#94A3B8}.pdi-profile-card span{color:#F8FAFC;font-weight:900}.pdi-profile-actions{display:flex;flex-wrap:wrap;gap:8px}.pdi-profile-actions button{border:1px solid rgba(103,232,249,.35);background:#0A1824;color:#E0F2FE;border-radius:10px;padding:9px 12px;font-weight:900}.pdi-security-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.pdi-security-list span{border:1px solid rgba(148,163,184,.18);background:#0B111A;border-radius:10px;padding:9px;color:#D1E7F8;font-weight:800;font-size:12px}.pdi-auth-gateway{grid-column:1/-1;display:grid;place-items:center;min-height:calc(100vh - 170px);animation:pdiAuthIn .35s ease}.pdi-auth-card{width:min(760px,92vw);border:1px solid rgba(103,232,249,.35);background:linear-gradient(180deg,#111C2A,#08111C);border-radius:26px;padding:28px;box-shadow:0 30px 90px rgba(0,0,0,.45)}.pdi-auth-card h1{font-size:clamp(30px,4vw,52px);margin:0 0 10px;color:#F8FAFC}.pdi-auth-card p{color:#AFC4DD;font-weight:700}.pdi-auth-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}.pdi-auth-tabs button,.pdi-auth-form button{border:1px solid rgba(103,232,249,.38);background:linear-gradient(180deg,#183349,#0C1A27);color:#E0F2FE;border-radius:12px;padding:10px 13px;font-weight:1000;cursor:pointer}.pdi-auth-tabs button.active,.pdi-auth-form button:hover{background:linear-gradient(135deg,#0284C7,#22D3EE);color:white}.pdi-auth-form{display:grid;gap:10px}.pdi-auth-form input,.pdi-auth-form select{height:40px;border-radius:12px;background:#07111D!important;color:#E6F4FF!important;border:1px solid rgba(148,163,184,.28)!important;padding:0 12px;font-weight:800}.pdi-auth-form code{display:block;background:#050B12;border:1px solid rgba(103,232,249,.25);border-radius:10px;padding:10px;color:#A7F3D0}.pdi-auth-form button:disabled{opacity:.45;cursor:not-allowed}.pdi-launch-card,.pdi-main-nav button,.pdi-account,.pdi-start-primary{background:linear-gradient(180deg,#1B2A3A,#0F1A27)!important;color:#EAF6FF!important;border-color:rgba(77,184,212,.42)!important}.pdi-launch-card .icon{background:linear-gradient(135deg,#0284C7,#22D3EE)!important;color:white!important}.pdi-main-nav button.active{background:linear-gradient(135deg,#0284C7,#22D3EE)!important}.pdi-start-primary{box-shadow:0 18px 45px rgba(14,165,233,.28)!important}@keyframes pdiAuthIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}.pdi-super-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.pdi-super-card{min-height:112px;border:1px solid rgba(103,232,249,.28);background:linear-gradient(180deg,#142033,#0A101A);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:8px;box-shadow:0 18px 40px rgba(0,0,0,.25);animation:pdiTabIn .25s ease both}.pdi-super-card b{color:#67E8F9;font-size:13px}.pdi-super-card span{color:#C7D2FE;font-size:12px;font-weight:700}.pdi-license-panel{display:grid;grid-template-columns:minmax(260px,.34fr) 1fr;gap:14px}.pdi-license-form,.pdi-license-list{border:1px solid rgba(103,232,249,.25);background:linear-gradient(180deg,#111827,#0B111A);border-radius:18px;padding:16px}.pdi-license-form h3,.pdi-license-list h3{margin:0 0 12px;color:#67E8F9}.pdi-license-form{display:grid;gap:10px}.pdi-license-form label{display:grid;gap:4px;color:#94A3B8;font-size:11px;font-weight:900;text-transform:uppercase}.pdi-license-form input,.pdi-license-form select{height:36px;border-radius:10px;background:#07111D!important;color:#E6F4FF!important;border:1px solid rgba(148,163,184,.28)!important;padding:0 10px}.pdi-license-form button,.pdi-license-row button{border:1px solid rgba(103,232,249,.35);background:linear-gradient(135deg,#0284C7,#22D3EE);color:white;border-radius:10px;padding:8px 10px;font-weight:1000}.pdi-license-list{display:grid;gap:8px;align-content:start}.pdi-license-row{display:grid;grid-template-columns:1.8fr .8fr .7fr 1.2fr .7fr .8fr auto auto;gap:7px;align-items:center;border:1px solid rgba(148,163,184,.16);background:#0B111A;border-radius:12px;padding:8px;font-size:10px}.pdi-license-row code{color:#A7F3D0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:900px){.pdi-unified-root{grid-template-columns:1fr;grid-template-rows:72px auto 1fr}.pdi-unified-topbar{grid-column:1}.pdi-project-title,.pdi-search{display:none}.pdi-main-nav{grid-row:2;flex-direction:row;overflow-x:auto;padding:8px}.pdi-main-nav button{min-width:72px;height:54px}.pdi-content{grid-column:1;grid-row:3;padding:12px}.pdi-home-hero{grid-template-columns:1fr}.pdi-launch-grid{grid-template-columns:1fr}.pdi-showcase{height:420px}}
      `}</style>
      <header className="pdi-unified-topbar"><div className="pdi-unified-brand"><PdiBrandMark variant="horizontal" size="sm" /></div><div className="pdi-project-title"><small>Projet actif</small><strong>{moduleTitle}</strong></div><div className="pdi-top-actions"><input className="pdi-search" placeholder="Rechercher une commande…" /><span className="pdi-auth-badge">{authMode.toUpperCase()}</span><button className="pdi-account" onClick={() => setAccountMenuOpen(v=>!v)}>Youcef ▾</button>{accountMenuOpen && <div className="pdi-account-menu"><button onClick={()=>{setActiveModule("home"); setAccountMenuOpen(false);}}>Accueil</button><button onClick={()=>{setActiveModule("profile"); setAccountMenuOpen(false);}}>Voir profil</button><button onClick={()=>{setActiveModule("projects"); setAccountMenuOpen(false);}}>Mes projets</button><button onClick={()=>{setActiveModule("subscription"); setAccountMenuOpen(false);}}>Abonnement</button><button onClick={()=>{setActiveModule("security"); setAccountMenuOpen(false);}}>Sécurité</button><button onClick={()=>{setAuthMode("super_admin"); setActiveModule("super_admin_console"); setAccountMenuOpen(false);}}>Super Admin</button><button onClick={()=>{setAuthMode("super_admin"); setActiveModule("license_keys"); setAccountMenuOpen(false);}}>Clés SaaS</button><button onClick={()=>{setAuthMode("guest"); setAccountMenuOpen(false);}}>Mode guest</button><button onClick={()=>{try{window.localStorage.removeItem(PDI_STAGE_KEY); window.localStorage.removeItem("pdi.force.app.v1")}catch{}; setLandingScreen("landing"); setStage("landing"); setAccountMenuOpen(false);}}>Présentation Landing</button><button className="pdi-menu-logout" onClick={handleLogoutToHome} style={{ color: "#f87171", borderTop: "1px solid rgba(248,113,113,0.2)", marginTop: "4px", paddingTop: "6px" }}>⎋ Déconnexion</button></div>}</div></header>
      <nav className="pdi-main-nav" aria-label="Navigation PD&I">{navItems.map((item) => <button key={item.id} className={activeModule === item.id ? "active" : ""} onClick={() => item.id === "home" ? setActiveModule("home") : openModuleInTab(item.id, item.title)} title={item.title}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav>
      {workspaceTabs.length>0 && <div className="pdi-tabsbar">{workspaceTabs.map(tab=><button key={tab.id} className={activeTabId===tab.id?"active":""} onClick={()=>switchTab(tab.id)}>{tab.title}<span onClick={(e)=>{e.stopPropagation(); closeTab(tab.id)}}>×</span></button>)}<button className="plus" onClick={()=>openModuleInTab("isometric","Nouveau plan ISO")}>+</button></div>}
      <main className="pdi-content">
        {activeModule === "home" && (authMode === "guest" || authMode === "pending_email") && <div className="pdi-auth-gateway">
          <section className="pdi-auth-card"><div className="pdi-panel-kicker">Accès PD&I sécurisé</div><h1>Connexion requise</h1><p>Pour ouvrir ISO, Vision, CAD ou créer un nouveau plan, passez par Connexion, Création compte ou Mode démo. L'accès direct par bouton Commencer est désactivé.</p><div className="pdi-auth-tabs"><button className={authPanelMode==="login"?"active":""} onClick={()=>setAuthPanelMode("login")}>Connexion</button><button className={authPanelMode==="register"?"active":""} onClick={()=>setAuthPanelMode("register")}>Créer compte</button><button className={authPanelMode==="activation"?"active":""} onClick={()=>setAuthPanelMode("activation")}>Activation</button></div>
            {authPanelMode === "login" && <div className="pdi-auth-form"><input placeholder="Email" value={authDraft.email} onChange={e=>setAuthDraft({...authDraft,email:e.target.value})}/><input placeholder="Mot de passe" type="password" value={authDraft.password} onChange={e=>setAuthDraft({...authDraft,password:e.target.value})}/><button onClick={startDemoSession}>Continuer en mode démo</button><small>Message unique : identifiants invalides ou compte non activé.</small></div>}
            {authPanelMode === "register" && <div className="pdi-auth-form"><input placeholder="Nom complet" value={authDraft.name} onChange={e=>setAuthDraft({...authDraft,name:e.target.value})}/><input placeholder="Email" value={authDraft.email} onChange={e=>setAuthDraft({...authDraft,email:e.target.value})}/><input placeholder="Entreprise" value={authDraft.company} onChange={e=>setAuthDraft({...authDraft,company:e.target.value})}/><input placeholder="Mot de passe min. 6" type="password" value={authDraft.password} onChange={e=>setAuthDraft({...authDraft,password:e.target.value})}/><select value={authDraft.plan} onChange={e=>setAuthDraft({...authDraft,plan:e.target.value})}><option value="demo">Demo</option><option value="pro">Pro</option><option value="team">Team</option></select><button onClick={submitRegisterSimulated}>Générer email d’activation</button></div>}
            {authPanelMode === "activation" && <div className="pdi-auth-form"><p><b>Email simulé :</b> cliquez sur le lien unique pour confirmer l’email.</p><code>{activationToken || "Aucun token — créez un compte d’abord"}</code><button disabled={!activationToken} onClick={activateSimulatedAccount}>Activer le compte</button></div>}
          </section>
        </div>}
        {activeModule === "home" && <div className="pdi-home-hero">
          <section className="pdi-hero-card">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div className="pdi-badge-row my-0"><span className="pdi-badge">SaaS autonome</span><span className="pdi-badge">JSON central</span><span className="pdi-badge">Python calculs</span><span className="pdi-badge">Agents spécialisés</span></div>
              <div className="hidden sm:block shrink-0 rounded-2xl overflow-hidden border border-slate-700/60 shadow-lg bg-black/40 p-1">
                <PdiBrandMark variant="square" size="md" />
              </div>
            </div>
            <h1>Construire vos plans isométriques depuis toutes vos sources.</h1>
            <p>PD&I devient le logiciel principal : dessin manuel, Vision PD&I photo/croquis, import CAO/DXF/PDF, JSON central, exports et validation engineering.</p>
            <button className="pdi-start-primary" onClick={() => openModuleInTab("isometric", "Nouveau plan ISO")}>{canOpenWorkspaceModule ? "Nouveau projet isométrique" : "Connexion requise"}</button>
            <div className="pdi-launch-grid">
              {launchCards.map((card) => (
                <button key={card.id} className="pdi-launch-card" onClick={() => openModuleInTab(card.id, card.title)} title={card.title}>
                  <div className="icon">{card.icon}</div>
                  <h3>{card.title}</h3>
                  <p>{card.subtitle}</p>
                  <span className="badge">{card.ready ? "Disponible" : card.badge}</span>
                </button>
              ))}
            </div>
          </section>
          <aside className="pdi-showcase">
            <div className="pdi-showcase-track">
              {[...showcase, ...showcase].map((item, index) => (
                <div key={`${item.tag}-${index}`} className="pdi-showcase-card" style={{ "--accent": item.color } as React.CSSProperties}>
                  <div className="pdi-showcase-img-box">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="pdi-showcase-img"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="pdi-showcase-img-overlay" />
                    <div className="pdi-showcase-img-caption">{item.caption}</div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="tag">{item.tag}</span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">3D CAD ENGINE</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>}
        {activeModule === "drive" && <GoogleDriveWorkspace onLoadProjectToEditor={(data, name) => { openModuleInTab("isometric", name); }} />}
        {activeModule === "vision" && <ComingSoonPanel title="Vision PD&I"><p><b>Vision PD&I</b> préparera le flux <code>photo réelle → analyse agent → scripts Python → JSON PD&I → validation → ISO</code>. Les images restent en cache local temporaire navigateur.</p></ComingSoonPanel>}
        {activeModule === "sketch" && <ComingSoonPanel title="Croquis → JSON / ISO"><p>Import croquis main, reconnaissance lignes/symboles, conversion vers JSON central, validation humaine, puis génération ISO.</p></ComingSoonPanel>}
        {activeModule === "cad" && <ComingSoonPanel title="Import CAO / DXF / PDF"><p>Import DXF/PDF, lecture des calques et entités, conversion déterministe Python vers JSON PD&I.</p></ComingSoonPanel>}
        {activeModule === "json" && <ComingSoonPanel title="Modèle JSON PD&I"><p>Le JSON devient la source de vérité : lignes, nœuds, équipements, ports, soudures, cotations, niveaux Z, massifs, dalle, exports.</p></ComingSoonPanel>}
        {activeModule === "pdf" && <ComingSoonPanel title="Impression / Exports"><p>Préparation V4.8e : A4/A3/A2/A1, portrait/paysage, PDF, DXF/CAD, cartouche, nomenclature.</p></ComingSoonPanel>}

        {activeModule === "profile" && <ComingSoonPanel title="Profil utilisateur">
          <div className="pdi-profile-grid">
            <section className="pdi-profile-card"><h3>Identité</h3><p><b>Nom</b><span>{pdiUserProfile.name}</span></p><p><b>Email</b><span>{pdiUserProfile.email}</span></p><p><b>Entreprise</b><span>{pdiUserProfile.company}</span></p><p><b>Pays</b><span>{pdiUserProfile.country}</span></p></section>
            <section className="pdi-profile-card"><h3>Compte</h3><p><b>Rôle</b><span>{String(pdiUserProfile.role).toUpperCase()}</span></p><p><b>Plan</b><span>{pdiUserProfile.plan}</span></p><p><b>Email</b><span>{pdiUserProfile.emailStatus}</span></p><p><b>Créé le</b><span>{pdiUserProfile.createdAt}</span></p></section>
            <section className="pdi-profile-card wide"><h3>Actions</h3><div className="pdi-profile-actions"><button onClick={()=>setActiveModule("projects")}>Mes projets</button><button onClick={()=>setActiveModule("subscription")}>Mon abonnement</button><button onClick={()=>setActiveModule("security")}>Sécurité</button><button onClick={handleLogoutToHome} style={{ color: "#f87171", borderColor: "rgba(248,113,113,0.4)" }}>⎋ Déconnexion</button></div></section>
          </div>
        </ComingSoonPanel>}
        {activeModule === "subscription" && <ComingSoonPanel title="Abonnement"><p>Plan actuel : <b>{pdiUserProfile.plan}</b>. Les clés SaaS, paiements et renouvellements seront reliés au Super Admin dans les patchs 011 à 016.</p></ComingSoonPanel>}
        {activeModule === "security" && <ComingSoonPanel title="Sécurité du compte"><div className="pdi-security-list">{['clés API dans .env','.env dans .gitignore','rate limiting login','règles sécurité base','mots de passe hashés','droits serveur','HTTPS','sessions expirantes','inputs validés','uploads limités','type fichier vérifié','CORS','erreurs détaillées coupées','console.log clean','message erreur unique','webhooks signés','dépendances à jour','email confirmé','backup auto'].map((item,i)=><span key={item}>{i+1}. {item}</span>)}</div></ComingSoonPanel>}


        {activeModule === "super_admin_console" && <ComingSoonPanel title="Super Admin Console">
          <div className="pdi-super-grid">
            {[
              ["Demandes", "Réception demande → paiement → compte"],
              ["Clés", "Trial, Guest, Pro, Team, Enterprise"],
              ["Comptes", "Créer, suspendre, activer, inviter"],
              ["Paiements", "Simulation avant intégration réelle"],
              ["Emails", "Activation unique et confirmation"],
              ["Firebase", "Auth, Firestore, Storage, règles"],
              ["Migration", "Provider prêt Supabase/Postgres"],
              ["Rapports", "Journalier + sécurité + assets PNG"]
            ].map(([title,txt])=><section key={title} className="pdi-super-card"><b>{title}</b><span>{txt}</span></section>)}
          </div>
        </ComingSoonPanel>}


        {activeModule === "license_keys" && <ComingSoonPanel title="Générateur de clés SaaS">
          <div className="pdi-license-panel">
            <section className="pdi-license-form"><h3>Créer une clé</h3><label>Type<select value={licenseDraft.type} onChange={e=>setLicenseDraft({...licenseDraft,type:e.target.value})}><option>TRIAL_7</option><option>TRIAL_30</option><option>GUEST</option><option>SOLO_MONTHLY</option><option>SOLO_YEARLY</option><option>PRO_MONTHLY</option><option>PRO_YEARLY</option><option>TEAM_MONTHLY</option><option>TEAM_YEARLY</option><option>ENTERPRISE</option><option>ADMIN_INVITE</option><option>SUPER_ADMIN</option></select></label><label>Plan<select value={licenseDraft.plan} onChange={e=>setLicenseDraft({...licenseDraft,plan:e.target.value})}><option>DEMO</option><option>GUEST</option><option>SOLO</option><option>PRO</option><option>TEAM</option><option>ENTERPRISE</option></select></label><label>Email assigné<input value={licenseDraft.email} onChange={e=>setLicenseDraft({...licenseDraft,email:e.target.value})} placeholder="client@email.com" /></label><button onClick={generateLicenseKey}>Générer clé</button><small>Flux futur : demande → paiement → génération compte → email activation unique.</small></section>
            <section className="pdi-license-list"><h3>Clés générées</h3>{licenseKeys.length===0?<p>Aucune clé générée.</p>:licenseKeys.map(k=><div key={k.id} className="pdi-license-row"><code>{k.code}</code><span>{k.type}</span><span>{k.plan}</span><span>{k.email || "non assignée"}</span><span>{k.status}</span><span>exp. {k.expiresAt}</span><button onClick={()=>navigator.clipboard?.writeText(k.code)}>Copier</button><button onClick={()=>revokeLicenseKey(k.id)}>Révoquer</button></div>)}</section>
          </div>
        </ComingSoonPanel>}

        {activeModule === "assistant" && <ComingSoonPanel title="Assistant et agents spécialisés"><p>PD&I orchestrera le repo <code>pipeline-design-skill</code> : agents Vision, Croquis, CAO, JSON, ISO, QA. Les agents proposent ; Python calcule.</p></ComingSoonPanel>}
      </main>
    </div>
  );
}
