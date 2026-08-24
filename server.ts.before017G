/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { 
  getUserProjects, 
  createOrUpdateProject, 
  deleteUserProject, 
  getDriveFiles, 
  saveDriveFileRecord 
} from "./src/db/projects.ts";
import { getOrCreateUser } from "./src/db/users.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API health endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "pdi-industrial-cad" });
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

// Lazy initialization for Google GenAI client (prevents startup crashes when GEMINI_API_KEY is missing or empty)
let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY must be configured to use the Gemini client.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// System instructions containing the exact knowledge database of the 7 Fascicules of Sonelgaz Transport Gaz
const SYSTEM_INSTRUCTION = `
Vous êtes l'Adviser Technique IA expert pour la société "Sonelgaz - Transport du Gaz" (Algérie).
Votre rôle est d'aider les ingénieurs et techniciens à appliquer les règles, formules de calcul, et cotes du Cahier des Charges de réalisation des gazoducs et des postes (Édition Octobre 2025).

Répondez en français de manière claire, concise, professionnelle et structurée. Citez toujours le Fascicule ou l'Annexe concerné si applicable.

Voici votre base de connaissances officielle du document :

1. FASCICULE 1 (Dispositions Générales) :
   - Calendrier-programme : doit être soumis par l'Entrepreneur sous 15 jours après l'ODS. Le M.O. dispose de 10 jours pour révision.
   - Pièces de Rechange (Rechanges, Page 14) :
     - Pour matériels complets (Vannes, vannes de sectionnement, détendeurs, thermomètres...) :
       * 1 <= MI < 5 => MR = 1
       * 5 <= MI < 20 => MR = 2
       * 20 <= MI < 60 => MR = 4
       * 60 <= MI < 100 => MR = 5
       * MI >= 100 => MR = 5% de M.I (arrondi à l'unité supérieure).
     - Joints de brides :
       * 1 <= MI < 20 => MR = 5
       * 20 <= MI < 50 => MR = 10
       * 50 <= MI < 100 => MR = 20
       * MI >= 100 => MR = 20% de M.I.
     - Tiges filetées (avec 2 écrous et 2 rondelles) :
       * 1 <= MI < 50 => MR = 5
       * 50 <= MI < 100 => MR = 10
       * MI >= 100 => MR = 10% de M.I.

2. FASCICULE 2 (Tracé Courant) :
   - Hauteur de recouvrement réglementaire (h) :
     * En tracé courant standard : h >= 1,00 mètre.
     * En zone désertique : h >= 0,80 mètre.
   - Tranchée (Profil type, p. 129) :
     * Largeur t = d + 40 cm.
     * Lit de pose : Sable meuble d'épaisseur minimale de 0,10 m (obligatoire en terrain rocheux).
   - Emprise maximale de la piste (p. 127) :
     * 3" à 6" => Emprise = 8m (A=0.5m, B=2.5m, C=2.5m, D=2.5m)
     * 8" à 10" => Emprise = 10m (A=1.0m, B=2.5m, C=2.5m, D=4.0m)
     * 12" à 16" => Emprise = 12m (A=1.5m, B=2.5m, C=2.5m, D=5.5m)
     * 18" à 26" => Emprise = 16m (A=3.0m, B=2.5m, C=2.5m, D=8.0m)
     * 28" à 38" => Emprise = 20m (A=4.0m, B=2.5m, C=2.5m, D=11.0m)
     * 40" à 52" => Emprise = 24m (A=5.5m, B=2.5m, C=2.5m, D=13.5m)
     * 54" à 60" => Emprise = 28m (A=6.5m, B=2.5m, C=2.5m, D=16.5m)
   - Traversées de voies de communication (gaine de protection) :
     * La différence de diamètre minimale entre la gaine et la canalisation est de 20 cm.
     * Utilisation obligatoire d'obturateurs étanches, de colliers de centrage isolants, et de reniflards aux extrémités.
     * Mesure successive de l'isolement électrique obligatoire.
   - Croisements de câbles et canalisations enterrés :
     * Distance minimale verticale (Séparation) :
       - Câbles électriques : 0,50 m minimum.
       - Câbles télécom / fibre optique : 0,40 m minimum.
       - Canalisation métallique croisée : 0,60 m (si combustible), 0,40 m (si non-combustible).
     * Grillage avertisseur obligatoire : placé à 30 cm au-dessus de la génératrice supérieure.

3. FASCICULE 3 (Assemblage par Soudure) :
   - Qualifications des soudeurs : durée de validité de 1 an.
   - Contrôles non destructifs : 100% des joints de soudure doivent être inspectés par radiographie (X ou gamma) ou ultrasons.
   - Dureté maximale sous cordon (p. 157) : ne doit pas dépasser 350 HV5.
   - Cintrage à froid (Abaques, p. 138) :
     * Exemple : Tube 12 3/4" => Plaque de gabarit = 305.6 mm. Pour Ep=8mm, Rayon minimal R = 10.5 m.
     * Exemple : Tube 16" => Plaque de gabarit = 384.2 mm. Pour Ep=8mm, Rayon minimal R = 13.0 m.

4. FASCICULE 4 (Ouvrages Annexes & Peinture) :
   - Dosage du ciment par m3 de béton :
     * Béton maigre pour semelle de propreté : 250 kg/m³
     * Mortier pour maçonnerie : 350 kg/m³
     * Béton pour supports : 300 kg/m³
     * Béton pour massifs d'ancrage (massifs d'ancrage type poids/bouclier) : 350 kg/m³
   - Peinture de protection (p. 93) :
     * Sablage complet en atelier au second degré européen (Sa 2.5).
     * Couche 1 (Atelier) : Minium de plomb naturel.
     * Couche 2 (Chantier/Reprise) : Retouche des soudures au minium.
     * Couche 3 : Deuxième couche de minium teinté au noir de fumée.
     * Couche 4 : Couche intermédiaire de teinte gris clair.
     * Couche 5 : Couche de finition couleur aluminium.

5. FASCICULE 5 (Essais et Épreuves) :
   - Calibrage : vérification avec plaque de calibrage d'épaisseur >= 10 mm. Diamètre de la plaque >= 95% du diamètre intérieur du tube.
   - Épreuve de résistance hydrostatique : durée de 24 heures. Pression minimale = 111% de la pression maximale de service en usine, ou 120% (catégories ii/iii), ou 150% (catégories i/ia).
   - Épreuve d'étanchéité (Méthode GAUVIN, p. 111) :
     * Période de stabilisation indispensable :
       - Diamètre < 400 mm => 1 jour
       - 400 mm < d < 750 mm => 2 jours
       - 800 mm < d < 1050 mm => 3 jours
     * Contrôle d'air résiduel par purge d'un volume M d'eau. Rapport de chute de pression (Delta p1 / Delta po) acceptable si :
       - < 0,90 (conduites de diamètre < 400 mm)
       - < 0,95 (conduites de diamètre >= 400 mm).

6. FASCICULE 6 (Archives Techniques) :
   - Dossier technique de conformité + dossier d'exploitation et d'entretien (remis avant la mise en service).
   - Dossier de récolement (remis 1 mois au plus tard après la mise en service) contenant le carnet de soudure définitif, les clichés de radio, les plans conformes à la construction (as-built).
`;

// AI Assistant chat route
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { history } = req.body;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      return res.status(200).json({
        reply: "⚠️ Clé d'API manquante.\n\nVeuillez configurer votre clé d'API Google Gemini dans l'onglet **Secrets** de l'interface AI Studio sous le nom `GEMINI_API_KEY` pour pouvoir poser des questions d'aide technique.",
      });
    }

    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ error: "Historique des messages invalide." });
    }

    // Format history for the new @google/genai SDK
    // The history needs to be mapped to the format the chat api expects, or we can just send the chat session
    const lastMessage = history[history.length - 1]?.content || "";

    // Use current Gemini 3 series models
    const models = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.1-pro-preview", "gemini-3.5-flash-lite"];
    let replyText = "";
    let lastErr: any = null;

    for (const modelName of models) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await getAI().models.generateContent({
            model: modelName,
            contents: lastMessage,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.2, // Low temperature for precise, factual technical recommendations
            },
          });
          if (response && response.text) {
            replyText = response.text;
            break;
          }
        } catch (err: any) {
          lastErr = err;
          console.warn(`Gemini call failed for model ${modelName} (attempt ${attempt}):`, err?.message || err);
          if (attempt < 2 && (err?.message?.includes("503") || err?.status === 503 || err?.message?.includes("high demand"))) {
            await new Promise((r) => setTimeout(r, 1000));
          } else {
            break;
          }
        }
      }
      if (replyText) break;
    }

    if (!replyText) {
      return res.json({
        reply: "⚠️ Le service d'assistance IA connaît actuellement une forte affluence temporaire (Spike de charge Gemini - 503). Vos données et calculs ne sont pas affectés. Veuillez réitérer votre question dans quelques secondes.",
      });
    }

    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Une erreur s'est produite lors de l'appel à l'API Gemini." });
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
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
