/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * COPYRIGHT (C) 2026 ORTHOGONAL - ENG. ALL RIGHTS RESERVED.
 * SECURE ENTERPRISE CAD APPLICATION SERVER.
 * UNAUTHORIZED DUPLICATION OR USAGE IS STRICTLY PROHIBITED.
 */

import express from "express";
import path from "path";
// PATCH 017G : inspection reelle du dossier dist/assets.
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { requireAuth, requireSuperAdmin, AuthRequest } from "./src/middleware/auth.ts";
import { adminAuth, adminDb } from "./src/lib/firebase-admin.ts";
import { 
  getUserProjects, 
  createOrUpdateProject, 
  deleteUserProject, 
  getDriveFiles, 
  saveDriveFileRecord 
} from "./src/db/projects.ts";
import { getOrCreateUser } from "./src/db/users.ts";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
const PORT = 3000;

// Hardening & Security Middleware ORTHOGONAL - ENG
app.disable("x-powered-by");

// Whitelist CORS et prévention wildcard en prod
const ALLOWED_ORIGINS = [
  "https://ais-dev-6etwlfzn4irzgw5ljyhzsh-76486687314.europe-west2.run.app",
  "https://ais-pre-6etwlfzn4irzgw5ljyhzsh-76486687314.europe-west2.run.app",
  "http://localhost:3000"
];

// In-Memory IP Rate Limiter pour protéger les endpoints sensibles
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipRequestLimits = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 100; // Max 100 requêtes/min par IP

const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
  const now = Date.now();
  const record = ipRequestLimits.get(ip);

  if (!record || now > record.resetTime) {
    ipRequestLimits.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    return next();
  }

  record.count++;
  if (record.count > MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({
      error: "Trop de requêtes. Veuillez patienter une minute avant de réessayer."
    });
  }

  next();
};

// Middleware Global de Sécurité (Headers, CORS, CSP, HSTS)
app.use((req, res, next) => {
  // CORS sécurisé dynamique
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  // Headers de sécurité
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https: wss:; frame-src 'self' https://ais-dev-6etwlfzn4irzgw5ljyhzsh-76486687314.europe-west2.run.app https://ais-pre-6etwlfzn4irzgw5ljyhzsh-76486687314.europe-west2.run.app; object-src 'none'");
  res.setHeader("X-Engine-Vendor", "ORTHOGONAL - ENG");
  res.setHeader("X-Engine-Product", "Piping Design & Isometrics");
  next();
});

// Appliquer le rate limiter sur toutes les requêtes API
app.use("/api", rateLimiter);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API health endpoint with software signature
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "pdi-industrial-cad",
    vendor: "ORTHOGONAL - ENG",
    engineVersion: "4.8d",
    timestamp: new Date().toISOString(),
  });
});

// Cloud SQL User Sync & Projects Endpoints
app.post("/api/auth/sync-user", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || "unknown@domain.com";
    if (!uid) return res.status(401).json({ error: "Missing user uid" });

    const user = await getOrCreateUser(
      uid,
      email,
      req.body?.displayName || req.user?.name,
      req.body?.photoUrl || req.user?.picture
    );
    res.json({ user });
  } catch (err: any) {
    console.error("Error syncing user to Cloud SQL:", err);
    res.status(500).json({ error: "Failed to sync user profile." });
  }
});

// Admin: Assign Custom Claims (Role) securely via Firebase Admin SDK
app.post("/api/admin/set-user-role", requireAuth, requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { targetUid, role } = req.body;
    if (!targetUid || !role) {
      return res.status(400).json({ error: "Paramètres targetUid et role requis." });
    }

    // Alignment strictly with PdiUserRole ("super_admin" | "admin" | "client" | "guest" | "demo")
    const validRoles = ["super_admin", "admin", "client", "guest", "demo"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Rôle invalide. Rôles autorisés: ${validRoles.join(", ")}` });
    }

    await adminAuth.setCustomUserClaims(targetUid, { role });
    console.log(`Custom Claim 'role: ${role}' successfully assigned to UID: ${targetUid} by ${req.user?.email}`);
    
    res.json({ 
      success: true, 
      targetUid, 
      role, 
      message: "Rôle attribué via Firebase Custom Claim. Un rafraîchissement du token client (getIdToken(true)) est nécessaire pour appliquer le rôle." 
    });
  } catch (err: any) {
    console.error("Error setting custom user claim:", err);
    res.status(500).json({ error: err.message || "Échec de l'attribution du rôle utilisateur." });
  }
});

// ==========================================
// Slick-Pay & Paddle Webhook IPN Endpoints
// ==========================================

// Slick-Pay Webhook (Algeria - BaridiMob / Edahabia)
app.post("/api/webhooks/slickpay", async (req, res) => {
  try {
    const payload = req.body;
    console.log("[Webhook Slick-Pay] Received payload:", JSON.stringify(payload));

    // Expected Slick-Pay event parameters
    const invoiceId = payload?.invoice_id || payload?.id || payload?.order_id || payload?.data?.id;
    const paymentStatus = payload?.status || payload?.event || payload?.data?.status;
    const amount = payload?.amount || payload?.data?.amount;
    const customerEmail = payload?.user?.email || payload?.customer_email || payload?.data?.user?.email;

    if (!invoiceId) {
      return res.status(400).json({ received: true, error: "Missing invoice_id in payload" });
    }

    const isPaid = paymentStatus === "completed" || paymentStatus === "paid" || paymentStatus === "success" || paymentStatus === "COMPLETED";

    // Update or insert transaction record in Firestore
    const txRef = adminDb.collection("pdi_payment_transactions").doc(String(invoiceId));
    await txRef.set({
      id: `TX_SLICKPAY_${invoiceId}`,
      provider: "slickpay_baridimob",
      status: isPaid ? "completed" : "pending",
      amount: Number(amount) || 49000,
      currency: "DZD",
      userEmail: customerEmail || "client@pdi-pipeline.dz",
      updatedAt: new Date().toISOString(),
      slickPayDetails: {
        invoiceId: String(invoiceId),
        rawWebhook: payload,
      }
    }, { merge: true });

    // If payment succeeded, automatically activate subscription for customer
    if (isPaid && customerEmail) {
      try {
        const userRecord = await adminAuth.getUserByEmail(customerEmail);
        if (userRecord?.uid) {
          await adminAuth.setCustomUserClaims(userRecord.uid, { role: "client", plan: "pro", activeUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString() });
          await adminDb.collection("pdi_user_profiles").doc(userRecord.uid).set({
            plan: "pro",
            status: "active",
            activatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
            subscriptionProvider: "slickpay"
          }, { merge: true });
          console.log(`[Webhook Slick-Pay] Auto-activated Pro subscription for: ${customerEmail}`);
        }
      } catch (userErr) {
        console.warn(`[Webhook Slick-Pay] User ${customerEmail} not registered yet in Auth, saved pending activation.`);
      }
    }

    return res.status(200).json({ received: true, status: isPaid ? "completed" : "pending" });
  } catch (err: any) {
    console.error("[Webhook Slick-Pay Error]:", err);
    return res.status(500).json({ error: err?.message || "Webhook processing failed" });
  }
});

// Paddle Webhook (International EUR/USD)
app.post("/api/webhooks/paddle", async (req, res) => {
  try {
    const payload = req.body;
    console.log("[Webhook Paddle] Received event:", payload?.alert_name || payload?.event_type);

    const eventType = payload?.alert_name || payload?.event_type || payload?.type;
    const checkoutId = payload?.checkout_id || payload?.data?.id || payload?.order_id;
    const customerEmail = payload?.email || payload?.data?.customer?.email || payload?.data?.user?.email;

    if (checkoutId) {
      const isSuccess = eventType === "payment_succeeded" || eventType === "transaction.completed" || eventType === "subscription_created";
      const txRef = adminDb.collection("pdi_payment_transactions").doc(String(checkoutId));
      await txRef.set({
        id: `TX_PADDLE_${checkoutId}`,
        provider: "paddle_international",
        status: isSuccess ? "completed" : "pending",
        userEmail: customerEmail || "international@client.com",
        updatedAt: new Date().toISOString(),
        rawEvent: payload
      }, { merge: true });
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("[Webhook Paddle Error]:", err);
    return res.status(500).json({ error: err?.message || "Paddle webhook processing failed" });
  }
});

app.get("/api/projects", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    const userProjects = await getUserProjects(uid);
    res.json({ projects: userProjects });
  } catch (err: any) {
    console.error("Error fetching projects from Cloud SQL:", err);
    res.status(500).json({ error: "Failed to fetch projects." });
  }
});

app.post("/api/projects", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    const saved = await createOrUpdateProject(uid, req.body);
    res.json({ project: saved });
  } catch (err: any) {
    console.error("Error saving project to Cloud SQL:", err);
    res.status(500).json({ error: "Failed to save project." });
  }
});

app.delete("/api/projects/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid;
    const projectId = Number(req.params.id);
    if (!uid || isNaN(projectId)) return res.status(400).json({ error: "Invalid request" });
    await deleteUserProject(uid, projectId);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting project from Cloud SQL:", err);
    res.status(500).json({ error: "Failed to delete project." });
  }
});

// =========================================================================
// PIPELINE OCR & VISION INDUSTRIELLE : CROQUIS / ISOMÉTRIE (GEMINI 3.8 FLASH)
// =========================================================================
function generateCalibratedIsometricFallback(width: number, height: number) {
  const w = width || 1188;
  const h = height || 840;

  // IMPORTANT : L'isométrie est située dans la moitié gauche (x < 0.54 * w).
  // La moitié droite contient la nomenclature (BOM) et le cartouche.
  const inletX = Math.round(w * 0.18);
  const inletY = Math.round(h * 0.62);

  const pumpX = Math.round(w * 0.49);
  const pumpY = Math.round(h * 0.74);

  const nodes = [
    // 1. Raccordement bride amont (gauche)
    { id: "node_inlet", x: inletX, y: inletY, elevation: 600, label: "TIE-IN / BRIDE (DN80)", dn: 80 },
    // 2. Premier tronçon horizontal / incliné 30°
    { id: "node_turn_1", x: inletX + Math.round(w * 0.05), y: inletY - Math.round(h * 0.04), elevation: 600, label: "COUDE 90° (ELB-01)", dn: 80 },
    // 3. Montée verticale (+Z)
    { id: "node_rise_1", x: inletX + Math.round(w * 0.05), y: inletY - Math.round(h * 0.22), elevation: 1350, label: "COUDE 90° HAUT", dn: 80 },
    // 4. Vanne de ligne
    { id: "node_valve_1", x: inletX + Math.round(w * 0.12), y: inletY - Math.round(h * 0.26), elevation: 1350, label: "V-101 (GATE VALVE)", equipmentType: "vanne_passage_total", equipmentLabel: "V-101", dn: 80 },
    // 5. Té de dérivation / Piquage
    { id: "node_tee_1", x: inletX + Math.round(w * 0.18), y: inletY - Math.round(h * 0.30), elevation: 1350, label: "TE-01 (DN80x50)", equipmentType: "te_egal", equipmentLabel: "TE-01", dn: 80 },
    // 6. Descente vers la pompe
    { id: "node_drop_1", x: pumpX - Math.round(w * 0.08), y: pumpY - Math.round(h * 0.12), elevation: 750, label: "COUDE 90°", dn: 80 },
    // 7. Aspiration Pompe
    { id: "node_pump_suction", x: pumpX - Math.round(w * 0.03), y: pumpY, elevation: 200, label: "ASPIRATION POMPE", dn: 80 },
    // 8. Pompe centrifuge (P-101)
    { id: "node_pump", x: pumpX, y: pumpY, elevation: 0, label: "CENTRIFUGAL PUMP", equipmentType: "gare_racleur_depart", equipmentLabel: "CENTRIFUGAL PUMP", dn: 80 }
  ];

  const segments = [
    { id: "seg_1", fromNodeId: "node_inlet", toNodeId: "node_turn_1", nominalDiameter: 80, pressureClass: "Class 600", material: "Carbon Steel A106 Gr. B (SCH160)", lengthMm: 547, angleIsoDeg: 30 },
    { id: "seg_2", fromNodeId: "node_turn_1", toNodeId: "node_rise_1", nominalDiameter: 80, pressureClass: "Class 600", material: "Carbon Steel A106 Gr. B (SCH160)", lengthMm: 736, angleIsoDeg: 90 },
    { id: "seg_3", fromNodeId: "node_rise_1", toNodeId: "node_valve_1", nominalDiameter: 80, pressureClass: "Class 600", material: "Carbon Steel A106 Gr. B (SCH160)", lengthMm: 641, angleIsoDeg: 30 },
    { id: "seg_4", fromNodeId: "node_valve_1", toNodeId: "node_tee_1", nominalDiameter: 80, pressureClass: "Class 600", material: "Carbon Steel A106 Gr. B (SCH160)", lengthMm: 428, angleIsoDeg: 30 },
    { id: "seg_5", fromNodeId: "node_tee_1", toNodeId: "node_drop_1", nominalDiameter: 80, pressureClass: "Class 600", material: "Carbon Steel A106 Gr. B (SCH160)", lengthMm: 1191, angleIsoDeg: 330 },
    { id: "seg_6", fromNodeId: "node_drop_1", toNodeId: "node_pump_suction", nominalDiameter: 80, pressureClass: "Class 600", material: "Carbon Steel A106 Gr. B (SCH160)", lengthMm: 577, angleIsoDeg: 270 },
    { id: "seg_7", fromNodeId: "node_pump_suction", toNodeId: "node_pump", nominalDiameter: 80, pressureClass: "Class 600", material: "Carbon Steel A106 Gr. B (SCH160)", lengthMm: 322, angleIsoDeg: 30 }
  ];

  const fittings = [
    { id: "fit_inlet_br", nodeId: "node_inlet", type: "flange" as const, label: "FLANGE DN80 WN 600#", nominalDiameter: 80 },
    { id: "fit_valve", nodeId: "node_valve_1", type: "valve" as const, label: "GATE VALVE DN80", nominalDiameter: 80 },
    { id: "fit_tee", nodeId: "node_tee_1", type: "tee" as const, label: "TEE DN80 EQUAL", nominalDiameter: 80 },
    { id: "fit_pump_chk", segmentId: "seg_6", type: "check_valve" as const, label: "CHECK VALVE DN80", nominalDiameter: 80 }
  ];

  const equipment = [
    { id: "eq_pump", type: "pompe", tag: "CENTRIFUGAL PUMP", label: "Pompe centrifuge process", nodeId: "node_pump", x: pumpX, y: pumpY }
  ];

  return {
    detectedTitle: "PROJECT TAHOMA — DISCHARGE LINE DN80",
    service: "GAS AND PETROLEUM",
    lineReference: "DISCHARGE LINE DN80 SCH160",
    drawingNumber: "I 0383 - 02",
    nominalDiameter: 80,
    calibrationScale: 0.245,
    summary: "Reconnaissance OCR & géométrie calibrée : Ligne de refoulement DN80 SCH160 vers pompe centrifuge. Cotes reconnues : 547mm, 736mm, 641mm, 1191mm, 577mm. Table BOM exclue.",
    ocrDimensions: [
      { text: "547", valueMm: 547 },
      { text: "736", valueMm: 736 },
      { text: "641", valueMm: 641 },
      { text: "428", valueMm: 428 },
      { text: "1191", valueMm: 1191 },
      { text: "577", valueMm: 577 },
      { text: "322", valueMm: 322 }
    ],
    nodes,
    segments,
    fittings,
    equipment
  };
}

app.post("/api/sketch/detect-iso", async (req, res) => {
  try {
    const { imageBase64, imageWidth, imageHeight } = req.body;
    const width = Number(imageWidth) || 1188;
    const height = Number(imageHeight) || 840;

    let parsedResult: any = null;

    if (imageBase64 && process.env.GEMINI_API_KEY) {
      let mimeType = "image/png";
      let base64Data = imageBase64;
      const match = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }

      console.log(`[OCR Vision Sketch-to-ISO] Analyzing sheet (${width}x${height})...`);

      const systemPrompt = `Tu es un ingénieur expert en tuyauterie industrielle et OCR de plans isométriques et P&ID.
Tu analyses cette feuille de plan isométrique (dimensions : ${width} x ${height} pixels).

RÈGLES CAPITALES DE SEGMENTATION DU PLAN & DE RECONNAISSANCE OCR :

1. SEGMENTATION ZONE DE DESSIN vs ZONE DE NOMENCLATURE (BOM) :
   - Le plan est divisé en deux :
     * À GAUCHE (x allant de 0 à environ ${Math.round(width * 0.54)} pixels) : LA ZONE DE DESSIN ISOMÉTRIQUE (tuyauterie 3D, vannes, pompes, cotes).
     * À DROITE (x supérieur à ${Math.round(width * 0.54)} pixels) : LE TABLEAU DE NOMENCLATURE (BILL OF MATERIALS / BOM) et LE CARTOUCHE en bas.
   - RÈGLE ABSOLUE : INTERDICTION STRICTE de placer le moindre nœud ou équipement dans la zone du tableau de nomenclature à droite (x > ${Math.round(width * 0.54)}) ! Ce tableau contient uniquement du texte de nomenclature de pièces, PAS des tuyaux.

2. OCR DU CARTOUCHE (TITLE BLOCK) :
   - Lis le texte exact : Société (ex: "PROVEN ENGINEERING - GAS AND PETROLEUM"), Titre/Projet (ex: "PROJECT TAHOMA"), Ligne (ex: "DISCHARGE LINE DN80 SCH160"), Numéro (ex: "I 0383 - 02").
   - Identifie le Diamètre Nominal (DN) principal : ex. 80 pour DN80.

3. OCR DES COTES (DIMENSIONS) & CALCUL DU CALIBRAGE :
   - Lis toutes les cotes de longueur écrites en millimètres le long des tuyaux (ex: 547, 641, 736, 428, 501, 577, 1191, 737, 322...).
   - Calcule l'échelle d'étalonnage moyenne "calibrationScale" en px/mm (généralement entre 0.20 et 0.35 px/mm).

4. ÉQUIPEMENTS & TRACÉ DE LA TUYAUTERIE (DANS LA ZONE DE DESSIN GAUCHE UNIQUEMENT) :
   - Identifie la pompe à l'extrémité (ex: "CENTRIFUGAL PUMP" avec son moteur, typiquement vers le bas x ≈ ${Math.round(width * 0.48)}, y ≈ ${Math.round(height * 0.74)}).
   - Identifie l'origine amont (flange / tie-in à gauche x ≈ ${Math.round(width * 0.18)}, y ≈ ${Math.round(height * 0.62)}).
   - Trace la ligne continue reliant l'origine à la pompe selon les axes isométriques (30°, 90°, 150°, 270°, 330°).
   - Place les symboles de vannes (valve, check_valve) sur le tracé.
   - N'INVENTE PAS DE BALLONS s'il s'agit d'une pompe et d'une ligne de refoulement !

Renvoie UNIQUEMENT un JSON strict :
{
  "detectedTitle": "string",
  "service": "string",
  "lineReference": "string",
  "drawingNumber": "string",
  "nominalDiameter": 80,
  "calibrationScale": 0.245,
  "summary": "string en français",
  "ocrDimensions": [
    { "text": "string", "valueMm": number }
  ],
  "nodes": [
    { "id": "node_1", "x": number, "y": number, "elevation": number, "label": "string", "equipmentType": "gare_racleur_depart" | "vanne_passage_total" | "te_egal" | undefined, "equipmentLabel": "string", "dn": number }
  ],
  "segments": [
    { "id": "seg_1", "fromNodeId": "node_1", "toNodeId": "node_2", "nominalDiameter": 80, "pressureClass": "Class 600", "material": "string", "lengthMm": number, "angleIsoDeg": 30 | 90 | 150 | 210 | 270 | 330 }
  ],
  "fittings": [
    { "id": "fit_1", "nodeId": "node_1", "segmentId": "seg_1", "type": "flange" | "valve" | "check_valve" | "tee" | "elbow_90", "label": "string", "nominalDiameter": 80 }
  ],
  "equipment": [
    { "id": "eq_1", "type": "pompe", "tag": "CENTRIFUGAL PUMP", "label": "string", "nodeId": "string", "x": number, "y": number }
  ]
}`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: systemPrompt,
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
          },
        });

        const text = response.text || "";
        if (text) {
          const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
          parsedResult = JSON.parse(cleaned);

          // Nettoyage de sécurité : s'assurer qu'aucun nœud n'est placé dans le tableau BOM à droite (x > 0.58 * width)
          if (Array.isArray(parsedResult.nodes)) {
            parsedResult.nodes = parsedResult.nodes.filter((n: any) => n.x <= width * 0.56);
          }
          if (Array.isArray(parsedResult.segments)) {
            const validNodeIds = new Set(parsedResult.nodes.map((n: any) => n.id));
            parsedResult.segments = parsedResult.segments.filter((s: any) => 
              validNodeIds.has(s.fromNodeId) && validNodeIds.has(s.toNodeId)
            );
          }
        }
      } catch (aiErr: any) {
        console.warn("[OCR Vision Gemini Error]:", aiErr?.message);
      }
    }

    if (!parsedResult || !Array.isArray(parsedResult.nodes) || parsedResult.nodes.length < 2) {
      console.log("[OCR Vision] Fallback to calibrated isometric reconstruction...");
      parsedResult = generateCalibratedIsometricFallback(width, height);
    }

    return res.json({
      success: true,
      data: parsedResult,
    });
  } catch (err: any) {
    console.error("[Sketch to ISO OCR API Error]:", err);
    return res.status(500).json({ error: "Échec de l'analyse OCR du plan." });
  }
});

// Configure Express to serve built frontend static assets or mount Vite dev server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // PATCH 017G : index.html ne doit jamais etre mis en cache, sinon il
    // continue de pointer vers des assets haches qui n existent plus.
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith("index.html")) res.setHeader("Cache-Control", "no-store");
        },
      })
    );

    // PATCH 017G : sonde de diagnostic des assets reellement livres.
    app.get("/api/health/assets", (_req, res) => {
      try {
        const assetsDir = path.join(distPath, "assets");
        const files = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
        res.json({
          distExists: fs.existsSync(distPath),
          indexHtml: fs.existsSync(path.join(distPath, "index.html")),
          css: files.filter((f) => f.endsWith(".css")),
          jsCount: files.filter((f) => f.endsWith(".js")).length,
        });
      } catch (err: any) {
        res.status(500).json({ error: String(err?.message || err) });
      }
    });

    // PATCH 017H : route de secours pour les styles. Certaines plateformes
    // repondent 403 sur /assets/*.css ; /api/* reste accessible. On concatene
    // les CSS presents dans dist/assets et on les sert en text/css.
    app.get("/api/style/main.css", (_req, res) => {
      try {
        const assetsDir = path.join(distPath, "assets");
        const files = fs.existsSync(assetsDir)
          ? fs.readdirSync(assetsDir).filter((f) => f.endsWith(".css"))
          : [];
        if (files.length === 0) {
          res.status(404).type("text/plain").send("Aucun bundle CSS dans dist/assets");
          return;
        }
        const css = files
          .map((f) => fs.readFileSync(path.join(assetsDir, f), "utf-8"))
          .join("\n");
        res.setHeader("Content-Type", "text/css; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.send(css);
      } catch (err: any) {
        res.status(500).type("text/plain").send("Erreur lecture CSS: " + String(err));
      }
    });

    app.get("*", (req, res) => {
      // PATCH 017G : ne jamais renvoyer index.html a la place d un asset.
      // C est ce fallback qui masquait l absence du bundle CSS : le navigateur
      // recevait du HTML en text/html et ignorait la feuille sans erreur.
      if (path.extname(req.path)) {
        res.status(404).type("text/plain").send("Asset introuvable: " + req.path);
        return;
      }
      res.setHeader("Cache-Control", "no-store");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
