import React, { useEffect, useRef, useState } from "react";
import { recordCommercialVisit } from "../../lib/firebase";
import PdiInfoModals, { ModalType } from "../modals/PdiInfoModals";

// High-resolution industrial 3D piping & engineering renders
import isoPiping3D from "../../assets/images/pdi_iso_piping_3d_1787006532562.jpg";
import valve3D from "../../assets/images/pdi_valve_3d_1787006543831.jpg";
import plantScan3D from "../../assets/images/pdi_plant_scan_3d_1787006555680.jpg";
import cadSpool3D from "../../assets/images/pdi_cad_spool_3d_1787006567003.jpg";
import gasStationValves from "../../assets/images/gazoduc_station_valves_1783427984252.jpg";
import pipelineSunset from "../../assets/images/gazoduc_desert_sunset_1783427970931.jpg";

export type PdiLandingV4Props = {
  /** Appelé pour entrer dans le logiciel (connexion / démarrage). */
  onEnter: (target?: string) => void;
  onOpenAuth?: (tab?: "login" | "register" | "activation") => void;
  initialScreen?: "landing" | "home" | "launcher";
};

// Chapitres de la démonstration vidéo produit (3 minutes)
const VIDEO_CHAPTERS = [
  {
    id: 1,
    timeRange: "0:00 - 0:45",
    startTime: 0,
    endTime: 45,
    title: "1. Routage Isométrique & Nœuds",
    subtitle: "Tracé vectoriel assisté sur grille 30° / 60° avec magnétisme DN intelligent",
    image: isoPiping3D,
    tag: "CS-A106 · DN200 · SCH40",
    comment: "Définition automatique des élévations et routage instantané des lignes critiques sans freeze.",
  },
  {
    id: 2,
    timeRange: "0:45 - 1:30",
    startTime: 45,
    endTime: 90,
    title: "2. Robinetterie & Brides ANSI/DIN",
    subtitle: "Placement de vannes papillon, soupapes PSV et attribution automatique des repères W00x",
    image: valve3D,
    tag: "VALVE-GATE-DN200 · CL300",
    comment: "Insertion paramétrique des organes de sectionnement avec orientation 3D de la tige de manœuvre.",
  },
  {
    id: 3,
    timeRange: "1:30 - 2:15",
    startTime: 90,
    endTime: 135,
    title: "3. Spooling & Découpage Atelier",
    subtitle: "Génération des tronçons transportables, cotes d'encombrement et vérification de gabarit",
    image: cadSpool3D,
    tag: "SPOOL-04 · L=3420mm",
    comment: "Contrôle automatique des longueurs d'expédition et repérage des soudures atelier vs chantier.",
  },
  {
    id: 4,
    timeRange: "2:15 - 3:00",
    startTime: 135,
    endTime: 180,
    title: "4. Nomenclature (BOM) & Export DXF",
    subtitle: "Calcul exact des métrés linéaires, quantité de raccords et export certifié A3/A4",
    image: plantScan3D,
    tag: "BOM AUTO · EXCEL / PDF / DXF",
    comment: "Génération de la cartouche normalisée et des listes d'approvisionnement en 1 clic.",
  },
];

export default function PdiLandingV4({ onEnter, onOpenAuth }: PdiLandingV4Props) {
  // References for JS-driven animations
  const isoFieldRef = useRef<HTMLDivElement>(null);
  const mockWrapRef = useRef<HTMLDivElement>(null);
  const mockScreenRef = useRef<HTMLDivElement>(null);
  const globeCanvasRef = useRef<HTMLCanvasElement>(null);

  // État de la vidéo de démonstration
  const [activeVideoModal, setActiveVideoModal] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<ModalType>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoSeconds, setVideoSeconds] = useState(12);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);

  // Horloge de lecture vidéo (0s -> 180s = 3:00)
  useEffect(() => {
    if (!activeVideoModal || !isPlaying) return;
    const interval = window.setInterval(() => {
      setVideoSeconds((prev) => {
        const next = prev + 1;
        if (next >= 180) {
          return 0; // Boucle
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activeVideoModal, isPlaying]);

  // Synchronisation du chapitre en fonction de la seconde de lecture
  useEffect(() => {
    const idx = VIDEO_CHAPTERS.findIndex(
      (c) => videoSeconds >= c.startTime && videoSeconds < c.endTime
    );
    if (idx !== -1 && idx !== currentChapterIdx) {
      setCurrentChapterIdx(idx);
    }
  }, [videoSeconds, currentChapterIdx]);

  // ---------- 1. Parallax fluide optimisé avec requestAnimationFrame ----------
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (isoFieldRef.current) {
            const y = window.scrollY;
            if (y < 900) {
              isoFieldRef.current.style.transform = `translate3d(0, ${y * 0.3}px, 0)`;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ---------- 2. Tilt 3D optimisé avec requestAnimationFrame ----------
  useEffect(() => {
    const wrap = mockWrapRef.current;
    const screen = mockScreenRef.current;
    if (!wrap || !screen) return;

    let rafId: number | null = null;
    let targetX = 8;
    let targetY = 0;

    const applyTransform = () => {
      screen.style.transform = `rotateX(${targetX}deg) rotateY(${targetY}deg)`;
      rafId = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      targetX = 8 - py * 14;
      targetY = px * 16;
      if (!rafId) {
        rafId = window.requestAnimationFrame(applyTransform);
      }
    };

    const handleMouseLeave = () => {
      targetX = 8;
      targetY = 0;
      if (!rafId) {
        rafId = window.requestAnimationFrame(applyTransform);
      }
    };

    wrap.addEventListener("mousemove", handleMouseMove, { passive: true });
    wrap.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    return () => {
      wrap.removeEventListener("mousemove", handleMouseMove);
      wrap.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // ---------- 3. Globe wireframe rotatif avec IntersectionObserver ----------
  useEffect(() => {
    const canvas = globeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 280;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    const R = 105;
    const cx = size / 2;
    const cy = size / 2;

    // 160 points optimisés pour la fluidité (Fibonacci)
    const N = 160;
    const pts: [number, number, number][] = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = 2.399963 * i;
      pts.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
    }

    // Marqueurs "sites projet"
    const markers: [number, number, number][] = [
      [0.55, 0.35, 0.55],
      [-0.4, -0.2, 0.7],
      [0.1, 0.75, -0.4],
      [-0.7, 0.1, -0.3],
    ];

    let phi = 0;
    let animId: number | null = null;
    let isVisible = false;

    function project(p: [number, number, number]): [number, number, number] {
      const cos = Math.cos(phi);
      const sin = Math.sin(phi);
      const x = p[0] * cos - p[2] * sin;
      const z = p[0] * sin + p[2] * cos;
      return [x, p[1], z];
    }

    function draw() {
      if (!ctx || !isVisible) return;
      ctx.clearRect(0, 0, size, size);

      // Sphère de fond
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Méridiens et parallèles
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 0.95, R * 0.35, phi, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(44,224,255,0.08)";
      ctx.stroke();

      // Points sphère
      for (let i = 0; i < pts.length; i++) {
        const [x, y, z] = project(pts[i]);
        if (z < -0.15) continue;
        const sx = cx + x * R;
        const sy = cy - y * R;
        const depth = (z + 1) / 2;
        ctx.beginPath();
        ctx.arc(sx, sy, 0.8 + depth * 1.0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(125,125,118,${0.25 + depth * 0.5})`;
        ctx.fill();
      }

      // Marqueurs pulsants
      const now = Date.now();
      for (let i = 0; i < markers.length; i++) {
        const [x, y, z] = project(markers[i]);
        if (z < -0.1) continue;
        const sx = cx + x * R;
        const sy = cy - y * R;
        const pulse = 0.5 + 0.5 * Math.sin(now / 450 + i);
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ff8a1f";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(sx, sy, 3 + pulse * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,138,31,${0.5 - pulse * 0.4})`;
        ctx.stroke();
      }

      phi += 0.005;
      animId = requestAnimationFrame(draw);
    }

    // Observer pour ne faire tourner l'animation QUE lorsque visible à l'écran
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          isVisible = true;
          if (!animId) {
            animId = requestAnimationFrame(draw);
          }
        } else {
          isVisible = false;
          if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
          }
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(canvas);

    return () => {
      observer.disconnect();
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // Enregistrement de la visite commercial
  useEffect(() => {
    void recordCommercialVisit({
      path: "/commercial-landing",
      section: "Spec V4 Ultra-Fast",
      action: "Consultation vitrine optimisée",
      device: typeof navigator !== "undefined" && navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop",
      timestamp: new Date().toISOString(),
    });
  }, []);

  const handleOpenAuth = (tab: "login" | "register" | "activation" = "login") => {
    void recordCommercialVisit({
      path: "/commercial-landing",
      section: "Auth Button",
      action: `Ouverture onglet ${tab}`,
      timestamp: new Date().toISOString(),
    });
    if (onOpenAuth) {
      onOpenAuth(tab);
    } else {
      onEnter("isometric");
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const jumpToChapter = (chapterIndex: number) => {
    setCurrentChapterIdx(chapterIndex);
    setVideoSeconds(VIDEO_CHAPTERS[chapterIndex].startTime);
    setIsPlaying(true);
  };

  const activeChapter = VIDEO_CHAPTERS[currentChapterIdx] || VIDEO_CHAPTERS[0];

  return (
    <div className="pdi-landing-container">
      {/* ============ STYLES SPEC-COMPLIANT ET HAUTE PERFORMANCE ============ */}
      <style>{`
        :root {
          --black: #000000;
          --card: #0a0a0a;
          --card-hi: #111111;
          --line: rgba(255, 255, 255, .07);
          --line-hi: rgba(255, 255, 255, .14);
          --text: #f3f2ec;
          --muted: #7d7d76;
          --amber: #ff8a1f;
          --amber-dim: rgba(255, 138, 31, .22);
          --cyan: #2ce0ff;
          --cyan-dim: rgba(44, 224, 255, .18);
          --display: 'Space Grotesk', system-ui, -apple-system, sans-serif;
          --mono: 'JetBrains Mono', monospace;
          --body: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .pdi-landing-container {
          background: var(--black);
          color: var(--text);
          font-family: var(--body);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          position: relative;
          min-height: 100vh;
        }

        .pdi-landing-container * {
          box-sizing: border-box;
        }

        .pdi-landing-container ::selection {
          background: var(--amber);
          color: #000;
        }

        @media (prefers-reduced-motion: reduce) {
          .pdi-landing-container * {
            animation-duration: .001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .001ms !important;
          }
        }

        .container {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ============ ISO GRID BACKDROP ============ */
        .iso-field {
          position: absolute;
          inset: 0;
          height: 850px;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
          -webkit-mask-image: linear-gradient(to bottom, black 0%, black 50%, transparent 100%);
          mask-image: linear-gradient(to bottom, black 0%, black 50%, transparent 100%);
          will-change: transform;
          transform: translate3d(0, 0, 0);
        }

        .iso-field svg {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          width: 1600px;
          max-width: none;
          opacity: .9;
        }

        .pipe-run {
          fill: none;
          stroke: var(--line-hi);
          stroke-width: 1.6;
        }

        .pipe-run.warm {
          stroke: rgba(255, 138, 31, .35);
        }

        .pipe-run.cool {
          stroke: rgba(44, 224, 255, .28);
        }

        .flow {
          fill: none;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-dasharray: 4 14;
          animation: flow-move 3.2s linear infinite;
        }

        .flow.amber {
          stroke: var(--amber);
        }

        .flow.cyan {
          stroke: var(--cyan);
          animation-duration: 4.4s;
        }

        @keyframes flow-move {
          to {
            stroke-dashoffset: -160;
          }
        }

        .node {
          fill: #050505;
          stroke: var(--line-hi);
          stroke-width: 1.4;
        }

        .node.pulse {
          animation: node-pulse 2.6s ease-in-out infinite;
        }

        .node.pulse.c2 {
          animation-delay: .6s;
        }

        .node.pulse.c3 {
          animation-delay: 1.3s;
        }

        @keyframes node-pulse {
          0%, 100% {
            stroke: var(--line-hi);
          }
          50% {
            stroke: var(--amber);
          }
        }

        .tag {
          font-family: var(--mono);
          font-size: 10.5px;
          letter-spacing: .03em;
          fill: var(--muted);
          opacity: 0;
          animation: tag-in .6s ease forwards;
        }

        .tag.t1 { animation-delay: .4s; }
        .tag.t2 { animation-delay: 1.1s; }
        .tag.t3 { animation-delay: 1.8s; }
        .tag.t4 { animation-delay: 2.4s; }

        @keyframes tag-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: .85;
            transform: translateY(0);
          }
        }

        /* ============ HEADER ============ */
        header.pdi-header {
          position: relative;
          z-index: 10;
          padding: 24px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--line);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--display);
          font-weight: 700;
          font-size: 1.15rem;
          letter-spacing: -.2px;
          text-decoration: none;
          color: var(--text);
          cursor: pointer;
        }

        .brand-mark {
          width: 34px;
          height: 34px;
          border: 1.5px solid var(--amber);
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--mono);
          font-size: .7rem;
          font-weight: 600;
          color: var(--amber);
          position: relative;
          background: rgba(255, 138, 31, 0.04);
        }

        .brand-mark::after {
          content: '';
          position: absolute;
          inset: -5px;
          border: 1px solid rgba(255, 138, 31, .25);
          border-radius: 5px;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nav-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--mono);
          font-size: .72rem;
          color: var(--muted);
          letter-spacing: .04em;
        }

        .dot-live {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3ddc84;
          box-shadow: 0 0 0 0 rgba(61, 220, 132, .6);
          animation: ping 2s infinite;
        }

        @keyframes ping {
          0% {
            box-shadow: 0 0 0 0 rgba(61, 220, 132, .55);
          }
          70% {
            box-shadow: 0 0 0 7px rgba(61, 220, 132, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(61, 220, 132, 0);
          }
        }

        .nav-auth-btn {
          background: transparent;
          color: var(--text);
          border: 1px solid var(--line-hi);
          padding: 8px 16px;
          border-radius: 3px;
          font-weight: 600;
          font-size: .82rem;
          cursor: pointer;
          font-family: var(--body);
          transition: all .15s ease;
        }

        .nav-auth-btn:hover {
          border-color: var(--cyan);
          color: var(--cyan);
          background: rgba(44, 224, 255, 0.05);
        }

        .nav-cta {
          background: var(--amber);
          color: #000;
          padding: 9px 18px;
          border-radius: 3px;
          font-weight: 700;
          font-size: .85rem;
          text-decoration: none;
          font-family: var(--body);
          border: 0;
          cursor: pointer;
          transition: filter .15s ease, transform .15s ease;
        }

        .nav-cta:hover {
          filter: brightness(1.12);
          transform: translateY(-1px);
        }

        /* ============ HERO ============ */
        .hero {
          position: relative;
          z-index: 2;
          padding: 90px 0 60px 0;
          max-width: 840px;
          margin: 0 auto;
          text-align: center;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--mono);
          font-size: .72rem;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--amber);
          border: 1px solid rgba(255, 138, 31, .3);
          background: rgba(255, 138, 31, .06);
          padding: 7px 14px;
          border-radius: 2px;
          margin-bottom: 24px;
        }

        .eyebrow .sep {
          color: rgba(255, 138, 31, .4);
        }

        .hero h1 {
          font-family: var(--display);
          font-weight: 700;
          letter-spacing: -1.6px;
          font-size: clamp(2.2rem, 5vw, 3.8rem);
          line-height: 1.08;
          margin-bottom: 20px;
          color: var(--text);
        }

        .hero h1 em {
          font-style: normal;
          color: var(--amber);
        }

        .hero p {
          font-size: 1.1rem;
          color: var(--muted);
          max-width: 620px;
          margin: 0 auto 34px;
        }

        .hero-ctas {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: var(--amber);
          color: #000;
          padding: 13px 26px;
          border-radius: 3px;
          font-weight: 700;
          text-decoration: none;
          font-size: .92rem;
          border: 0;
          cursor: pointer;
          transition: filter .15s ease, transform .15s ease;
        }

        .btn-primary:hover {
          filter: brightness(1.12);
          transform: translateY(-1px);
        }

        .btn-secondary {
          border: 1px solid var(--line-hi);
          color: var(--text);
          background: #000;
          padding: 13px 26px;
          border-radius: 3px;
          font-weight: 600;
          text-decoration: none;
          font-size: .92rem;
          font-family: var(--mono);
          cursor: pointer;
          transition: border-color .15s ease, background .15s ease;
        }

        .btn-secondary:hover {
          border-color: var(--cyan);
          background: rgba(44, 224, 255, .05);
          color: var(--cyan);
        }

        /* ============ BENTO SECTION ============ */
        .bento-section {
          position: relative;
          z-index: 2;
          padding: 40px 0 90px 0;
        }

        .section-header {
          margin-bottom: 40px;
          max-width: 640px;
        }

        .section-header .kicker {
          font-family: var(--mono);
          font-size: .7rem;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: var(--cyan);
          display: block;
          margin-bottom: 10px;
        }

        .section-header h2 {
          font-family: var(--display);
          font-size: 1.65rem;
          font-weight: 600;
          letter-spacing: -.4px;
          color: var(--text);
        }

        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1px;
          background: var(--line);
          border: 1px solid var(--line);
        }

        .bento-card {
          background: var(--card);
          padding: 30px;
          position: relative;
          overflow: hidden;
          transition: background .2s ease;
        }

        .bento-card::before,
        .bento-card::after {
          content: '';
          position: absolute;
          width: 10px;
          height: 10px;
          border: 1.5px solid transparent;
          transition: border-color .2s ease;
          pointer-events: none;
        }

        .bento-card::before {
          top: 10px;
          left: 10px;
          border-top-color: var(--amber);
          border-left-color: var(--amber);
          opacity: 0;
        }

        .bento-card::after {
          bottom: 10px;
          right: 10px;
          border-bottom-color: var(--amber);
          border-right-color: var(--amber);
          opacity: 0;
        }

        .bento-card:hover {
          background: var(--card-hi);
        }

        .bento-card:hover::before,
        .bento-card:hover::after {
          opacity: 1;
        }

        .col-8 { grid-column: span 8; }
        .col-4 { grid-column: span 4; }
        .col-6 { grid-column: span 6; }

        .card-tag {
          font-family: var(--mono);
          font-size: .7rem;
          font-weight: 600;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--amber);
          margin-bottom: 12px;
          display: block;
        }

        .bento-card h3 {
          font-family: var(--display);
          font-size: 1.28rem;
          font-weight: 600;
          margin-bottom: 10px;
          letter-spacing: -.3px;
        }

        .bento-card p {
          color: var(--muted);
          font-size: .93rem;
          line-height: 1.6;
        }

        .ui-mockup {
          margin-top: 22px;
          background: #000;
          border: 1px solid var(--line);
          border-radius: 2px;
          padding: 14px 16px;
          font-family: var(--mono);
          font-size: .8rem;
          color: var(--cyan);
          position: relative;
        }

        .ui-mockup .ln {
          opacity: 0;
          animation: type-in .4s ease forwards;
        }

        .ui-mockup .ln:nth-child(1) { animation-delay: .1s; }
        .ui-mockup .ln:nth-child(2) { animation-delay: .5s; }
        .ui-mockup .ln:nth-child(3) { animation-delay: .9s; color: #3ddc84; }

        @keyframes type-in {
          from {
            opacity: 0;
            transform: translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .ui-mockup .cursor {
          display: inline-block;
          width: 6px;
          height: 12px;
          background: var(--cyan);
          margin-left: 2px;
          vertical-align: middle;
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          50% { opacity: 0; }
        }

        .flex-stats {
          display: flex;
          gap: 32px;
          margin-top: 24px;
        }

        .stat-item h4 {
          font-family: var(--display);
          font-size: 1.85rem;
          color: var(--text);
          font-weight: 700;
        }

        .stat-item span {
          font-size: .78rem;
          color: var(--muted);
          font-family: var(--mono);
        }

        .bar-viz {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 32px;
          margin-top: 20px;
        }

        .bar-viz i {
          flex: 1;
          background: linear-gradient(to top, var(--amber-dim), var(--amber));
          border-radius: 1px;
          animation: bar-grow 1.4s ease forwards;
          transform-origin: bottom;
          transform: scaleY(0);
        }

        @keyframes bar-grow {
          to {
            transform: scaleY(1);
          }
        }

        /* ============ PHOTO EMBED IN BENTO ============ */
        .bento-photo-backdrop {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 45%;
          object-fit: cover;
          opacity: 0.16;
          mask-image: linear-gradient(to left, black 0%, transparent 100%);
          -webkit-mask-image: linear-gradient(to left, black 0%, transparent 100%);
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .bento-card:hover .bento-photo-backdrop {
          opacity: 0.28;
        }

        /* ============ FEATURES SECTION ============ */
        .features-section {
          position: relative;
          z-index: 2;
          padding: 20px 0 110px 0;
        }

        .features-section .section-header {
          margin-left: auto;
          margin-right: auto;
          text-align: center;
          max-width: 680px;
        }

        .features-section .section-header h2 {
          font-size: clamp(1.65rem, 3.2vw, 2.2rem);
        }

        .features-section .section-header p {
          color: var(--muted);
          margin-top: 12px;
          font-size: .98rem;
        }

        .feat-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1px;
          background: var(--line);
          border: 1px solid var(--line);
          margin-top: 40px;
          border-radius: 6px;
          overflow: hidden;
        }

        .feat-card {
          background: var(--card);
          position: relative;
          overflow: hidden;
          padding: 28px 28px 0 28px;
          display: flex;
          flex-direction: column;
        }

        .feat-4 { grid-column: span 4; }
        .feat-3 { grid-column: span 3; }
        .feat-2 { grid-column: span 2; }

        .feat-card h3 {
          font-family: var(--display);
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: -.2px;
          color: var(--text);
        }

        .feat-card p {
          color: var(--muted);
          font-size: .88rem;
          margin: 6px 0 0;
          max-width: 38ch;
        }

        .feat-skel {
          flex: 1;
          margin-top: 20px;
          min-height: 220px;
          position: relative;
        }

        /* --- Card 1 : Mockup écran avec tilt parallax souris & photo --- */
        .mock-wrap {
          perspective: 1000px;
          height: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-top: 10px;
          cursor: crosshair;
        }

        .mock-screen {
          width: 100%;
          max-width: 480px;
          background: #050505;
          border: 1px solid var(--line-hi);
          border-radius: 8px 8px 0 0;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, .8);
          transform: rotateX(8deg) rotateY(0deg);
          transform-style: preserve-3d;
          transition: transform .06s ease-out;
          overflow: hidden;
          position: relative;
        }

        .mock-bar {
          display: flex;
          gap: 6px;
          padding: 10px 14px;
          border-bottom: 1px solid var(--line);
          background: #0c0c0c;
        }

        .mock-bar i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--line-hi);
        }

        .mock-body {
          padding: 18px;
          position: relative;
          min-height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mock-body-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.32;
        }

        .mock-body svg {
          position: relative;
          z-index: 2;
          width: 100%;
          height: auto;
          display: block;
        }

        /* --- Card 2 : Pile de fiches specs en éventail --- */
        .spec-stack {
          position: relative;
          height: 210px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spec-bg-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.14;
          mask-image: radial-gradient(circle, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle, black 30%, transparent 80%);
          pointer-events: none;
        }

        .spec-card {
          position: absolute;
          width: 130px;
          padding: 10px 12px;
          background: #070707;
          border: 1px solid var(--line-hi);
          border-radius: 6px;
          font-family: var(--mono);
          font-size: .68rem;
          color: var(--muted);
          transition: transform .3s cubic-bezier(.2, .8, .2, 1), border-color .3s ease;
          user-select: none;
        }

        .spec-card b {
          display: block;
          font-size: .8rem;
          color: var(--text);
          margin-bottom: 3px;
          font-family: var(--display);
          font-weight: 600;
        }

        .spec-stack:hover .spec-card {
          border-color: rgba(255, 138, 31, .4);
        }

        /* --- Card 3 : Démo Vidéo avec Photo 3D de Vanne --- */
        .video-card {
          position: relative;
          height: 210px;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          background: #050505;
          border: 1px solid var(--line-hi);
        }

        .video-card-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.42;
          transition: filter .25s ease, opacity .25s ease, transform .3s ease;
        }

        .video-card:hover .video-card-photo {
          filter: blur(4px) brightness(0.7);
          opacity: .32;
          transform: scale(1.04);
        }

        .video-card .iso-mini {
          position: absolute;
          inset: 0;
          opacity: .5;
          z-index: 2;
          transition: filter .25s ease, opacity .25s ease;
        }

        .video-card:hover .iso-mini {
          filter: blur(5px);
          opacity: .2;
        }

        .play-btn {
          position: relative;
          z-index: 5;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--amber);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform .2s ease;
          box-shadow: 0 4px 16px rgba(255, 138, 31, 0.4);
        }

        .video-card:hover .play-btn {
          transform: scale(1.12);
        }

        .play-btn::after {
          content: '';
          border-style: solid;
          border-width: 8px 0 8px 14px;
          border-color: transparent transparent transparent #000;
          margin-left: 3px;
        }

        /* --- Card 4 : Globe déploiement multi-sites --- */
        .globe-wrap {
          position: relative;
          height: 250px;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }

        .globe-wrap canvas {
          width: 280px;
          height: 280px;
          max-width: 100%;
        }

        /* ============ FOOTER ============ */
        footer.pdi-footer {
          border-top: 1px solid var(--line);
          padding: 50px 0 34px;
          position: relative;
          z-index: 2;
          background: #020202;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 36px;
          margin-bottom: 36px;
        }

        .footer-brand p {
          color: var(--muted);
          font-size: .88rem;
          margin-top: 12px;
          max-width: 320px;
        }

        .footer-col h5 {
          font-family: var(--mono);
          font-size: .72rem;
          color: var(--text);
          text-transform: uppercase;
          letter-spacing: .1em;
          margin-bottom: 14px;
        }

        .footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-col a {
          color: var(--muted);
          text-decoration: none;
          font-size: .85rem;
          transition: color .15s ease;
          cursor: pointer;
        }

        .footer-col a:hover {
          color: var(--cyan);
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
          border-top: 1px solid var(--line);
          font-family: var(--mono);
          font-size: .75rem;
          color: var(--muted);
        }

        @media (max-width: 900px) {
          .col-8, .col-4, .col-6 { grid-column: span 12; }
          .feat-4, .feat-3, .feat-2 { grid-column: span 6; }
          .footer-grid { grid-template-columns: 1fr; gap: 26px; }
          .hero { padding: 60px 0 35px 0; }
          .iso-field { height: 500px; }
          .nav-right .nav-status { display: none; }
        }

        /* ============ LECTEUR VIDÉO DÉMO PROFESSIONNEL ============ */
        .pdi-video-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(12px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: modal-fade .2s ease-out;
        }

        @keyframes modal-fade {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        .pdi-video-player-card {
          background: #080808;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          width: 100%;
          max-width: 880px;
          overflow: hidden;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 138, 31, 0.2);
          display: flex;
          flex-direction: column;
        }

        .video-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 18px;
          background: #0d0d0d;
          border-bottom: 1px solid var(--line);
        }

        .video-stage {
          position: relative;
          height: 420px;
          background: #000;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .video-bg-frame {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.72;
          transition: opacity 0.4s ease;
        }

        .video-hud-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 20px;
        }

        .hud-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .hud-tag {
          background: rgba(0, 0, 0, 0.75);
          border: 1px solid var(--cyan);
          color: var(--cyan);
          padding: 4px 10px;
          font-family: var(--mono);
          font-size: 11px;
          border-radius: 3px;
          letter-spacing: 0.05em;
        }

        .hud-telemetry {
          font-family: var(--mono);
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          text-align: right;
          background: rgba(0, 0, 0, 0.6);
          padding: 4px 8px;
          border-radius: 3px;
        }

        .hud-bottom-comment {
          background: rgba(8, 8, 8, 0.88);
          border-left: 3px solid var(--amber);
          padding: 10px 14px;
          border-radius: 0 4px 4px 0;
          backdrop-filter: blur(6px);
          max-width: 600px;
        }

        .hud-bottom-comment b {
          display: block;
          color: var(--amber);
          font-size: 12px;
          font-family: var(--mono);
          margin-bottom: 2px;
        }

        .hud-bottom-comment p {
          margin: 0;
          color: var(--text);
          font-size: 12.5px;
          line-height: 1.4;
        }

        .video-controls-bar {
          background: #0d0d0d;
          border-top: 1px solid var(--line);
          padding: 12px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .timeline-container {
          position: relative;
          height: 6px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 3px;
          cursor: pointer;
        }

        .timeline-progress {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          background: linear-gradient(to right, var(--cyan), var(--amber));
          border-radius: 3px;
          transition: width 0.2s linear;
        }

        .video-actions-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ctrl-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--line-hi);
          color: var(--text);
          border-radius: 4px;
          padding: 6px 12px;
          font-family: var(--mono);
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }

        .ctrl-btn:hover {
          background: rgba(255, 255, 255, 0.14);
          border-color: var(--amber);
          color: var(--amber);
        }

        .chapter-pill {
          background: transparent;
          border: 1px solid var(--line);
          color: var(--muted);
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 11px;
          font-family: var(--mono);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .chapter-pill.active {
          border-color: var(--amber);
          color: var(--amber);
          background: rgba(255, 138, 31, 0.12);
          font-weight: 700;
        }

        .chapter-pill:hover {
          color: var(--text);
          border-color: var(--line-hi);
        }
      `}</style>

      {/* ============ ISO GRID BACKDROP (PARALLAX + FLOWS) ============ */}
      <div className="iso-field" ref={isoFieldRef}>
        <svg viewBox="0 0 1600 760" width="1600" height="760">
          <path className="pipe-run" d="M -40 420 L 260 420 L 400 340 L 700 340 L 820 420 L 1120 420 L 1260 340 L 1640 340" />
          <path className="pipe-run warm" d="M 120 620 L 340 620 L 460 540 L 780 540 L 900 460 L 1200 460" />
          <path className="pipe-run cool" d="M 60 220 L 300 220 L 420 140 L 760 140 L 880 220 L 1180 220 L 1300 140 L 1560 140" />
          <path className="pipe-run" d="M 400 340 L 400 460 L 520 540" />
          <path className="pipe-run" d="M 820 420 L 820 300 L 940 220" />
          <path className="pipe-run cool" d="M 760 140 L 760 260 L 880 340" />

          {/* Animated Flows */}
          <path className="flow amber" d="M -40 420 L 260 420 L 400 340 L 700 340 L 820 420 L 1120 420 L 1260 340 L 1640 340" />
          <path className="flow cyan" d="M 60 220 L 300 220 L 420 140 L 760 140 L 880 220 L 1180 220 L 1300 140 L 1560 140" />
          <path className="flow amber" d="M 120 620 L 340 620 L 460 540 L 780 540 L 900 460 L 1200 460" />

          {/* Pulsing Nodes */}
          <circle className="node pulse" cx="400" cy="340" r="7" />
          <circle className="node pulse c2" cx="820" cy="420" r="7" />
          <circle className="node pulse c3" cx="1260" cy="340" r="7" />
          <circle className="node" cx="700" cy="340" r="5" />
          <circle className="node" cx="760" cy="140" r="6" />
          <circle className="node" cx="880" cy="220" r="6" />
          <circle className="node" cx="460" cy="540" r="6" />

          {/* Sequential Animated Tags */}
          <text className="tag t1" x="410" y="325">TAG-104 · DN200</text>
          <text className="tag t2" x="1130" y="405">CS-A106 · SCH40</text>
          <text className="tag t3" x="770" y="125">FE-2201</text>
          <text className="tag t4" x="470" y="525">PSV-118</text>
        </svg>
      </div>

      <div className="container">
        {/* ============ HEADER ============ */}
        <header className="pdi-header">
          <div className="brand" onClick={() => handleOpenAuth("login")}>
            <div className="brand-mark">PD</div>
            <span>PD &amp; I</span>
          </div>
          <div className="nav-right">
            <div className="nav-status">
              <span className="dot-live" />
              SYSTÈME OPÉRATIONNEL
            </div>
            <button type="button" className="nav-auth-btn" onClick={() => handleOpenAuth("login")}>
              Connexion
            </button>
            <button type="button" className="nav-cta" onClick={() => handleOpenAuth("register")}>
              Accès Bêta
            </button>
          </div>
        </header>

        {/* ============ HERO SECTION ============ */}
        <section className="hero">
          <div className="eyebrow">
            PIPING &amp; ISOMETRIC DESIGN <span className="sep">/</span> 100% CLOUD
          </div>
          <h1>
            Vos isométriques prennent forme <em>directement</em> dans le navigateur.
          </h1>
          <p>
            Plus d'installations de 15&nbsp;Go, plus de licence verrouillée sur un poste fixe.
            PD&nbsp;&amp;&nbsp;I fait circuler vos données de tuyauterie comme un réseau bien conçu : sans friction, du bureau d'études jusqu'au chantier.
          </p>
          <div className="hero-ctas">
            <button type="button" className="btn-primary" onClick={() => handleOpenAuth("register")}>
              Démarrer un projet
            </button>
            <button type="button" className="btn-secondary" onClick={() => setActiveVideoModal(true)}>
              &gt; voir la démo vidéo
            </button>
          </div>
        </section>

        {/* ============ BENTO SECTION ============ */}
        <section className="bento-section">
          <div className="section-header">
            <span className="kicker">Pourquoi migrer</span>
            <h2>Conçu pour libérer les bureaux d'études des contraintes matérielles.</h2>
          </div>

          <div className="bento-grid">
            {/* Card 1: Architecture Web-Native */}
            <div className="bento-card col-8">
              <img
                src={plantScan3D}
                alt="Point Cloud Plant Scan"
                className="bento-photo-backdrop"
                loading="lazy"
                decoding="async"
              />
              <span className="card-tag">Architecture Web-Native</span>
              <h3>Déploiement instantané. Zéro configuration.</h3>
              <p>
                Ouvrez votre navigateur, connectez-vous à votre espace projet et commencez à tracer vos réseaux et vos lignes isométriques. PD&nbsp;&amp;&nbsp;I fonctionne sur n'importe quelle machine — Windows, macOS, Linux — sans installation ni privilèges administrateur.
              </p>
              <div className="ui-mockup">
                <div className="ln">&gt; Initialisation de l'environnement WebGL... OK</div>
                <div className="ln">&gt; Chargement de la spécification [CS300-ANSI]... OK</div>
                <div className="ln">&gt; Espace de travail prêt en 0.8s<span className="cursor" /></div>
              </div>
            </div>

            {/* Card 2: Modèle OPEX flexible */}
            <div className="bento-card col-4">
              <span className="card-tag">Modèle OPEX flexible</span>
              <h3>Payez selon vos projets</h3>
              <p>
                Fini les licences perpétuelles à 2&nbsp;000$+ inutilisées la moitié de l'année. Adaptez vos accès mensuels à votre charge réelle.
              </p>
              <div className="flex-stats">
                <div className="stat-item">
                  <h4>-70%</h4>
                  <span>COÛT D'ENTRÉE</span>
                </div>
                <div className="stat-item">
                  <h4>0$</h4>
                  <span>MAINTENANCE IT</span>
                </div>
              </div>
            </div>

            {/* Card 3: Données centralisées */}
            <div className="bento-card col-6">
              <img
                src={gasStationValves}
                alt="Station Valves"
                className="bento-photo-backdrop"
                loading="lazy"
                decoding="async"
              />
              <span className="card-tag">Données centralisées</span>
              <h3>Continuum bureau / chantier</h3>
              <p>
                Vos données de tuyauterie ne sont plus isolées dans un fichier .dwg ou .pcf sur un disque local. Partagez instantanément les révisions avec vos équipes terrain via une simple URL sécurisée.
              </p>
            </div>

            {/* Card 4: Génération automatique BOM */}
            <div className="bento-card col-6">
              <img
                src={cadSpool3D}
                alt="CAD Spool 3D"
                className="bento-photo-backdrop"
                loading="lazy"
                decoding="async"
              />
              <span className="card-tag">Génération automatique</span>
              <h3>Isométriques &amp; métrés (BOM)</h3>
              <p>
                Générez automatiquement les nomenclatures de composants, les métrés de tuyaux, vannes et raccords — prêts pour Excel ou vos processus d'achats.
              </p>
              <div className="bar-viz">
                <i style={{ height: "40%", animationDelay: ".1s" }} />
                <i style={{ height: "65%", animationDelay: ".2s" }} />
                <i style={{ height: "35%", animationDelay: ".3s" }} />
                <i style={{ height: "80%", animationDelay: ".4s" }} />
                <i style={{ height: "55%", animationDelay: ".5s" }} />
                <i style={{ height: "70%", animationDelay: ".6s" }} />
                <i style={{ height: "45%", animationDelay: ".7s" }} />
                <i style={{ height: "90%", animationDelay: ".8s" }} />
              </div>
            </div>
          </div>
        </section>

        {/* ============ FEATURES & PARALLAX SHOWCASE ============ */}
        <section className="features-section">
          <div className="section-header">
            <span className="kicker">Fonctionnalités</span>
            <h2>Des dizaines de fonctionnalités pensées pour la tuyauterie</h2>
            <p>
              De l'esquisse au métré, chaque écran de PD&nbsp;&amp;&nbsp;I est construit pour un bureau d'études qui travaille vite, et parfois à plusieurs, sur le même réseau.
            </p>
          </div>

          <div className="feat-grid">
            {/* Card 1 : Mockup écran avec tilt parallax souris & photo 3D */}
            <div className="feat-card feat-4">
              <h3>Repérez chaque ligne en un coup d'œil</h3>
              <p>Une vue isométrique claire de tout votre réseau, avec surbrillance instantanée des lignes critiques.</p>
              <div className="feat-skel">
                <div className="mock-wrap" ref={mockWrapRef}>
                  <div className="mock-screen" ref={mockScreenRef} data-tilt>
                    <div className="mock-bar">
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="mock-body">
                      {/* Photo 3D piping en fond du mockup parallax */}
                      <img
                        src={isoPiping3D}
                        alt="Piping 3D Isometric CAD"
                        className="mock-body-photo"
                        loading="lazy"
                        decoding="async"
                      />
                      <svg viewBox="0 0 420 200">
                        <path d="M 10 150 L 90 150 L 140 110 L 260 110 L 310 150 L 400 150" fill="none" stroke="rgba(255,255,255,.24)" strokeWidth="2" />
                        <path d="M 60 60 L 150 60 L 190 90 L 320 90" fill="none" stroke="rgba(44,224,255,.45)" strokeWidth="2" />
                        <path d="M 10 150 L 90 150 L 140 110 L 260 110" fill="none" stroke="#ff8a1f" strokeWidth="2" strokeDasharray="2 10">
                          <animate attributeName="stroke-dashoffset" from="0" to="-120" dur="2.6s" repeatCount="indefinite" />
                        </path>
                        <circle cx="140" cy="110" r="5" fill="#050505" stroke="#ff8a1f" strokeWidth="1.5" />
                        <circle cx="190" cy="90" r="4" fill="#050505" stroke="rgba(44,224,255,.8)" strokeWidth="1.5" />
                        <text x="150" y="100" fontFamily="JetBrains Mono" fontSize="9" fill="#ff8a1f" fontWeight="bold">DN200 · CS-A106</text>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 : Pile de fiches specs en éventail */}
            <div className="feat-card feat-2">
              <h3>Bibliothèque de spécifications</h3>
              <p>Composants, brides et vannes classés par norme, prêts à glisser sur votre plan.</p>
              <div className="feat-skel">
                <div className="spec-stack">
                  <img
                    src={pipelineSunset}
                    alt="Pipeline Technical Abaque"
                    className="spec-bg-photo"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="spec-card" style={{ transform: "rotate(-11deg) translate(-38px,6px)" }}>
                    <b>DN200</b>CS · A106 · SCH40
                  </div>
                  <div className="spec-card" style={{ transform: "rotate(-3deg) translate(-8px,-6px)" }}>
                    <b>PSV-118</b>Soupape sécurité
                  </div>
                  <div className="spec-card" style={{ transform: "rotate(6deg) translate(20px,4px)" }}>
                    <b>FE-2201</b>Débitmètre
                  </div>
                  <div className="spec-card" style={{ transform: "rotate(14deg) translate(46px,-4px)" }}>
                    <b>TAG-104</b>Vanne isolement
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 : Démo vidéo avec photo de vanne 3D (Ouvre la vidéo démo 3min) */}
            <div className="feat-card feat-3">
              <h3>Regardez PD&nbsp;&amp;&nbsp;I en action</h3>
              <p>Trois minutes pour voir un isométrique complet généré de bout en bout.</p>
              <div className="feat-skel">
                <div
                  className="video-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveVideoModal(true)}
                >
                  <img
                    src={valve3D}
                    alt="Industrial Valve 3D"
                    className="video-card-photo"
                    loading="lazy"
                    decoding="async"
                  />
                  <svg className="iso-mini" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
                    <path d="M -10 180 L 100 180 L 150 140 L 280 140 L 330 180 L 420 180" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="2" />
                    <path d="M 40 70 L 140 70 L 180 100 L 320 100" fill="none" stroke="rgba(44,224,255,.4)" strokeWidth="2" />
                    <circle cx="150" cy="140" r="6" fill="none" stroke="#ff8a1f" strokeWidth="1.5" />
                  </svg>
                  <div className="play-btn" />
                </div>
              </div>
            </div>

            {/* Card 4 : Globe wireframe déploiement multi-sites */}
            <div className="feat-card feat-3">
              <h3>Déployé sur tous vos sites</h3>
              <p>Un même projet, des équipes réparties sur plusieurs continents, une seule source de vérité.</p>
              <div className="feat-skel">
                <div className="globe-wrap">
                  <canvas ref={globeCanvasRef} width={280} height={280} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ============ FOOTER ============ */}
      <footer className="pdi-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="brand" onClick={() => handleOpenAuth("login")}>
                <div className="brand-mark">PD</div>
                <span>PD &amp; I</span>
              </div>
              <p>
                Conception de tuyauterie et isométriques industriels nativement cloud. Un modèle unique, du relevé terrain au dossier de fabrication certifié.
              </p>
            </div>

            <div className="footer-col">
              <h5>Produit</h5>
              <ul>
                <li><a onClick={() => handleOpenAuth("login")}>Éditeur isométrique</a></li>
                <li><a onClick={() => handleOpenAuth("login")}>Impression &amp; export</a></li>
                <li><a onClick={() => handleOpenAuth("login")}>Sketch to ISO</a></li>
                <li><a onClick={() => handleOpenAuth("login")}>Import CAO / DXF</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h5>Ingénierie</h5>
              <ul>
                <li><a onClick={() => handleOpenAuth("login")}>Modèle JSON central</a></li>
                <li><a onClick={() => handleOpenAuth("login")}>Soudures W00x</a></li>
                <li><a onClick={() => handleOpenAuth("login")}>Métré &amp; BOM</a></li>
                <li><a onClick={() => handleOpenAuth("login")}>QA Engineering</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h5>Accès &amp; Contact</h5>
              <ul>
                <li><a onClick={() => handleOpenAuth("login")}>Se connecter</a></li>
                <li><a onClick={() => handleOpenAuth("register")}>Créer un compte</a></li>
                <li><a onClick={() => setActiveVideoModal(true)}>Voir la vidéo démo</a></li>
                <li><a onClick={() => handleOpenAuth("activation")}>Activer une clé</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h5>Normes &amp; Légal</h5>
              <ul>
                <li><a role="button" tabIndex={0} onClick={() => setActiveInfoModal("legal")}>Mentions Légales &amp; Confidentialité</a></li>
                <li><a role="button" tabIndex={0} onClick={() => setActiveInfoModal("tech_ref")}>Références Techniques (ISO / ASME)</a></li>
                <li><a role="button" tabIndex={0} onClick={() => setActiveInfoModal("payment_terms")}>Modalités de Paiement &amp; Passerelles</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>PD&amp;I — Piping Design &amp; Isometrics © 2026</span>
            <span style={{ fontWeight: 800, color: "#FFFFFF" }}>Powered by ORTHOGONAL - ENG</span>
          </div>
        </div>
      </footer>

      {/* ============ LECTEUR VIDÉO DÉMO PROFESSIONNEL (3 MINUTES) ============ */}
      {activeVideoModal && (
        <div className="pdi-video-modal" onClick={() => setActiveVideoModal(false)}>
          <div className="pdi-video-player-card" onClick={(e) => e.stopPropagation()}>
            {/* Topbar du lecteur */}
            <div className="video-topbar">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)", display: "inline-block" }} />
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--text)", letterSpacing: "0.04em" }}>
                  PD&amp;I · DÉMONSTRATION PRODUIT
                </span>
                <span style={{ background: "rgba(44,224,255,0.12)", color: "var(--cyan)", border: "1px solid rgba(44,224,255,0.3)", borderRadius: 3, padding: "2px 6px", fontSize: 10, fontFamily: "var(--mono)" }}>
                  4K 60FPS
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoModal(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "var(--muted)",
                  fontSize: 22,
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: "0 4px",
                }}
                title="Fermer la vidéo"
              >
                ×
              </button>
            </div>

            {/* Zone d'affichage vidéo avec HUD technique */}
            <div className="video-stage">
              <img
                src={activeChapter.image}
                alt={activeChapter.title}
                className="video-bg-frame"
              />

              {/* Réticule et calque vectoriel animé */}
              <svg viewBox="0 0 880 420" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                <line x1="40" y1="210" x2="840" y2="210" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 6" />
                <line x1="440" y1="20" x2="440" y2="400" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 6" />
                <circle cx="440" cy="210" r="45" fill="none" stroke="rgba(44,224,255,0.25)" strokeWidth="1" />
                <circle cx="440" cy="210" r="3" fill="#ff8a1f" />
                {/* Ligne animée */}
                <path d="M 120 310 L 260 310 L 360 230 L 580 230 L 680 150 L 760 150" fill="none" stroke="#2ce0ff" strokeWidth="2.5" strokeDasharray="6 12">
                  <animate attributeName="stroke-dashoffset" from="0" to="-140" dur="3s" repeatCount="indefinite" />
                </path>
              </svg>

              {/* Télémétrie et sous-titres techniques */}
              <div className="video-hud-overlay">
                <div className="hud-top">
                  <div className="hud-tag">
                    {activeChapter.tag}
                  </div>
                  <div className="hud-telemetry">
                    <div>MODULE: ISO_CORE_V4</div>
                    <div>FPS: 60.0 · LATENCY: 12ms</div>
                    <div>TIMECODE: {formatTime(videoSeconds)} / 03:00</div>
                  </div>
                </div>

                <div className="hud-bottom-comment">
                  <b>{activeChapter.title}</b>
                  <p>{activeChapter.comment}</p>
                </div>
              </div>
            </div>

            {/* Barre de contrôle et timeline */}
            <div className="video-controls-bar">
              {/* Timeline interactive */}
              <div
                className="timeline-container"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  setVideoSeconds(Math.floor(pct * 180));
                }}
              >
                <div
                  className="timeline-progress"
                  style={{ width: `${(videoSeconds / 180) * 100}%` }}
                />
              </div>

              {/* Rangée des boutons et chapitres */}
              <div className="video-actions-row">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    className="ctrl-btn"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? "❚❚ Pause" : "▶ Lecture"}
                  </button>
                  <button
                    type="button"
                    className="ctrl-btn"
                    onClick={() => setVideoSeconds(0)}
                  >
                    ↺ Début
                  </button>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>
                    {formatTime(videoSeconds)} / 03:00
                  </span>
                </div>

                {/* Sélecteur rapide de chapitres */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {VIDEO_CHAPTERS.map((chap, idx) => (
                    <button
                      key={chap.id}
                      type="button"
                      className={`chapter-pill ${currentChapterIdx === idx ? "active" : ""}`}
                      onClick={() => jumpToChapter(idx)}
                    >
                      {chap.title.split(" ")[0]} {chap.title.split(" ")[1]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pied du lecteur */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)" }}>
                  💡 Présentation technique du workflow PD&amp;I pour bureaux d'études
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setActiveVideoModal(false)}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--line-hi)",
                      color: "var(--muted)",
                      borderRadius: 4,
                      padding: "6px 14px",
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "var(--body)",
                    }}
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveVideoModal(false);
                      handleOpenAuth("register");
                    }}
                    style={{
                      background: "var(--amber)",
                      border: 0,
                      color: "#000",
                      borderRadius: 4,
                      padding: "6px 14px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "var(--body)",
                    }}
                  >
                    Demander un accès →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODALS D'INFORMATION LÉGALE, TECHNIQUE & PAIEMENT ============ */}
      <PdiInfoModals
        activeModal={activeInfoModal}
        onClose={() => setActiveInfoModal(null)}
      />
    </div>
  );
}
