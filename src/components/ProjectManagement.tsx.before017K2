import defaultLogo from "../assets/images/sonelgaz_logo_1783415417090.jpg";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { db, createNotification } from "../lib/firebase";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  Calendar, 
  Layers, 
  FileText, 
  Calculator,
  CheckSquare, 
  Archive, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Eye,
  Edit3, 
  Save, 
  X, 
  FileCheck, 
  MapPin, 
  Building, 
  Activity, 
  FolderOpen,
  CheckCircle,
  Clock,
  Briefcase,
  Sliders,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Shield,
  FilePlus,
  ArrowRight,
  RefreshCw,
  Info,
  AlertTriangle,
  Check,
  Search,
  Globe,
  Download,
  ExternalLink,
  Printer,
  Maximize2,
  Minimize2,
  Presentation,
  Thermometer,
  Radio,
  ArrowRightLeft,
  Wrench,
  Package,
  EyeOff,
  HardHat
} from "lucide-react";

import ProjectMapViewer from "./ProjectMapViewer";
import ProjectAltitudeProfile from "./ProjectAltitudeProfile";

// Project Interface structure matched with Sonelgaz requirements
export interface PlanDeControleItemStatus {
  dateControle: string;
  resultat: "C" | "NC" | "/";
  etalonnage: string;
  action: string;
  dateNouveauControle: string;
  resultatNouveau: "C" | "NC" | "/";
  observation: string;
}

export interface FicheSuivi {
  capPoste: string;
  ligneMl: string;
  typePoste: string;
  typeProgramme: "OC et MEG" | "OC" | "MEG" | "Hors programme" | "";
  demandeGefDate: string;
  gefCabinet: string;
  natureTerrain: string;
  depotDossierType: string;
  impactAssujettis: "Oui" | "Non" | "";
  impactBetOds: string;
  impactDepotEtude: string;
  impactOuvertureEnqueteDate: string;
  choixTerrainDate: string;
  choixTerrainPv: "Oui" | "Non" | "";
  etudeBetStatut: "Oui" | "Non" | "";
  etudeBetCabinet: string;
  depotPcDate: string;
  depotAsDate: string;
  rappels: string[];
  reserves: string[];
  servitudeEnquetePv: "Oui" | "Non" | "";
  servitudeEnqueteDate: string;
  servitudeJournaux: "Oui" | "Non" | "";
  servitudeQuittancesPv: "Oui" | "Non" | "";
  servitudeQuittancesDate: string;
  servitudeArreteStatus: string;
  servitudeArreteDate: string;
  servitudeArreteRef: string;
  autresInformations: string[];
  
  // New fields for Expertise & Servitudes
  expertiseArreteEnqueteRef?: string;
  expertiseArreteEnqueteDate?: string;
  expertiseArreteConsignationRef?: string;
  expertiseArreteConsignationDate?: string;
  servitudeEnqueteUtilitePubliquePv?: "Oui" | "Non" | "";
  servitudeEnqueteUtilitePubliqueDate?: string;
  servitudeEnqueteUtilitePubliqueRef?: string;

  // New fields for Arrêté de servitude (AS) & Impact Environnement tracking
  asDateDemande?: string;
  asOuvertureEnqueteDate?: string;
  asPubJournauxDate?: string;
  asQuittanceDate?: string;
  impactDemandeAutExploitDate?: string;
  impactPubJournauxDate?: string;
  impactQuittanceDate?: string;

  // New fields for Levée de réserves & Action (Studies and Expertise)
  etudeLeveeReserveDate?: string;
  etudeLeveeReserveStatus?: string;
  etudeActionStatus?: string;
  expertiseLeveeReserveDate?: string;
  expertiseLeveeReserveStatus?: string;
  expertiseActionStatus?: string;
}

export interface ContractDetails {
  nom: string;
  ref: string;
  montant: string;
  date: string;
  ods: string;
  avancement: number;
  delai?: string;
  postesAffectes?: string;
}

export interface ProjectLot {
  id: string;
  name: string;
  phase: "Étude" | "Travaux" | "Mise en Gaz" | "Clôturé";
  avancementPhysique: number;
  avancementGC?: number;
  avancementMeca?: number;
  contrats?: {
    bureauEtude: ContractDetails;
    expert: ContractDetails;
    etbGC: ContractDetails;
    etbMeca: ContractDetails;
    betEnvironnement?: ContractDetails;
  };
  pkStart?: string;
  pkEnd?: string;
  longueur?: string;
  postesAffectes?: string[];
  wilaya?: string;
  travauxLigne?: any[];
  travauxPostes?: any[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: any;
  updatedAt: any;
  
  chefDeProjetUid?: string;
  chefDeProjetName?: string;
  chefDeProjetEmail?: string;
  chefDeProjetStructure?: string;

  chefDeProjetEtudeUid?: string;
  chefDeProjetEtudeName?: string;
  chefDeProjetEtudeEmail?: string;
  chefDeProjetEtudeStructure?: string;

  chefsDeProjetTravaux?: Array<{ uid: string; name: string; email?: string; structure?: string }>;
  chefsDeProjetEtude?: Array<{ uid: string; name: string; email?: string; structure?: string }>;
  chefsDeProjetExpertise?: Array<{ uid: string; name: string; email?: string; structure?: string }>;
  superviseurs?: Array<{ uid: string; name: string; email?: string; structure?: string }>;

  superviseurUid?: string;
  superviseurName?: string;
  superviseurEmail?: string;
  superviseurStructure?: string;
  updatedByEmail?: string;
  updatedByName?: string;
  updatedByUid?: string;
  createdByEmail?: string;
  createdByName?: string;
  createdByUid?: string;
  
  // Phase 00: Dates Planifiées (Début & Fin) pour le graphique Gantt
  planning: {
    etudeStart: string;
    etudeEnd: string;
    travauxStart: string;
    travauxEnd: string;
    essaisStart: string;
    essaisEnd: string;
    gazStart: string;
    gazEnd: string;
  };

  // Phase 01: Identité du projet
  identity: {
    region: string; // Direction de Région TG
    pole: string; // Pôle TG
    wilaya: string;
    district: string;
    phase: "Étude" | "Travaux" | "Mise en Gaz" | "Clôturé";
    cadreInscription: string;
    planificationComment: string;
    structureChargee: string;
    caracteristiques: {
      diametre: string;
      longueur: string;
      pression: string;
      typeTuyau: string;
      capacitePoste?: string;
      // Composition elements (checkboxes)
      hasPiquage?: boolean;
      hasGareRacleurDepart?: boolean;
      hasGareRacleurArrivee?: boolean;
      hasPosteCoupure?: boolean;
      hasPosteSectionnement?: boolean;
      nbPostesCoupure?: number;
      nbPostesSectionnement?: number;
      hasPosteDetente?: boolean;
      pointRaccordement?: string;
      typeOuvrage?: string;
      pipelineSequence?: { id: string; type: "racc" | "gr_dep" | "gr_arr" | "coup" | "sect" | "det"; label?: string; pk?: string }[];
    };
    contraintes?: string;
    contraintesAction?: string;
    kmzUrl?: string;
    kmzFileName?: string;
    kmzFileData?: string;
  };

  // Phase 02: Phase Étude et Autorisation
  etudeAutorisation: {
    statutEtude: "Non lancée" | "En cours" | "Approuvée";
    datePermisConstruire: string;
    statutPermisConstruire: "Non déposé" | "Déposé - En cours" | "Reçu";
    statutArreteServitude: "Non lancé" | "En cours de signature" | "Signé & Publié";
    arreteServitudeRef: string;
    expertiseFonciere: {
      gefDesignated: boolean;
      gefIdentity: string;
      acquisitionDemandEstablished: boolean;
      acquisitionComment: string;
    };
  };

  // Phase 03: Phase Travaux - Planification
  travauxPlanification: {
    avancementPhysique: number;
    avancementGC?: number;
    avancementMeca?: number;
    essaisReglementaires: {
      epreuveResistance: "Non faite" | "En cours" | "Réussie";
      epreuveEtancheite: "Non faite" | "En cours" | "Réussie";
      organismeControleur: string;
    };
    controleQualiteChecklist: {
      abaqueSoudageValide: boolean;
      radiographieCND: boolean;
      enrobageVerifie: boolean;
      litPoseSableux: boolean;
      protectionCathodique: boolean;
    };
  };

  // Phase 04: Mise en gaz et archive documentaire
  miseEnGazArchive: {
    statutMiseEnGaz: "Non planifiée" | "Planifiée" | "Prête" | "Réalisée";
    dateEffectiveMiseEnGaz: string;
    documentsArchives: Array<{
      id: string;
      name: string;
      category: string;
      addedAt: string;
    }>;
  };

  // Contracts and Multi-lot support
  contrats?: {
    bureauEtude: ContractDetails;
    expert: ContractDetails;
    etbGC: ContractDetails;
    etbMeca: ContractDetails;
    betEnvironnement?: ContractDetails;
  };
  nombreLots?: number;
  lots?: ProjectLot[];
  travauxLigne?: any[];
  travauxPostes?: any[];

  // Detailed templates
  ficheSuivi?: FicheSuivi;
  planDeControle?: Record<string, PlanDeControleItemStatus>;
  disponibiliteMateriel?: {
    tube: { statut: string; quantite: string; commentaire: string };
    posteRechauffeur: { statut: string; quantite: string; commentaire: string };
    raccorderie: { statut: string; quantite: string; commentaire: string };
    posteSectionnement: { statut: string; quantite: string; commentaire: string };
    gareRacleur: { statut: string; quantite: string; commentaire: string };
    autre: { statut: string; quantite: string; commentaire: string };
  };
}

export const DEFAULT_TRAVAUX_LIGNE = [
  { phase: "Piste", ponderation: 5, anterieur: 0, quotidien: 0 },
  { phase: "Bardage", ponderation: 5, anterieur: 0, quotidien: 0 },
  { phase: "Tranchée", ponderation: 15, anterieur: 0, quotidien: 0 },
  { phase: "Soudage", ponderation: 20, anterieur: 0, quotidien: 0 },
  { phase: "Radiographie", ponderation: 10, anterieur: 0, quotidien: 0 },
  { phase: "Enrobage", ponderation: 10, anterieur: 0, quotidien: 0 },
  { phase: "Mise en fouille", ponderation: 25, anterieur: 0, quotidien: 0 },
  { phase: "Essais", ponderation: 10, anterieur: 0, quotidien: 0 }
];

export const DEFAULT_TRAVAUX_POSTES = [
  { phase: "Préfabrication", ponderation: 35, quotidien: 0, global: 0 },
  { phase: "Montage, soudure, essais et finition", ponderation: 30, quotidien: 0, global: 0 },
  { phase: "Génie civil", ponderation: 10, quotidien: 0, global: 0 },
  { phase: "Clôture barreaudée", ponderation: 23, quotidien: 0, global: 0 },
  { phase: "Chemin d'exploitation", ponderation: 2, quotidien: 0, global: 0 }
];

export const computeProgressFromCanvas = (
  tLigne: any[],
  tPostes: any[],
  totalLengthKm: number,
  isPosteDetenteSeul: boolean = false
) => {
  const lenKm = totalLengthKm > 0 ? totalLengthKm : 10;
  const totLenM = lenKm * 1000;

  let gcLigneSum = 0;
  let mecaLigneSum = 0;
  let totalLigneSum = 0;

  const gcLigneNames = ["Piste", "Bardage", "Tranchée", "Mise en fouille"];

  (tLigne || DEFAULT_TRAVAUX_LIGNE).forEach(item => {
    const name = item.phase || item.label || "";
    const ant = parseFloat(String(item.anterieur)) || 0;
    const quot = parseFloat(String(item.quotidien)) || 0;
    const pond = parseFloat(String(item.ponderation)) || 0;
    const itemPct = Math.min(100, Math.max(0, ((ant + quot) / (totLenM || 1)) * 100));
    totalLigneSum += itemPct * (pond / 100);

    if (gcLigneNames.includes(name)) {
      gcLigneSum += itemPct * pond;
    } else {
      mecaLigneSum += itemPct * pond;
    }
  });

  const gcLignePct = Math.min(100, Math.max(0, gcLigneSum / 50));
  const mecaLignePct = Math.min(100, Math.max(0, mecaLigneSum / 50));
  const totalLignePct = Math.min(100, Math.max(0, totalLigneSum));

  let gcPostesSum = 0;
  let mecaPostesSum = 0;
  let totalPostesSum = 0;

  const gcPostesNames = ["Génie civil", "Clôture barreaudée", "Chemin d'exploitation"];

  (tPostes || DEFAULT_TRAVAUX_POSTES).forEach(item => {
    const name = item.phase || item.label || "";
    const ant = item.anterieur !== undefined 
      ? (parseFloat(String(item.anterieur)) || 0) 
      : Math.max(0, (parseFloat(String(item.global)) || 0) - (parseFloat(String(item.quotidien)) || 0));
    const quot = parseFloat(String(item.quotidien)) || 0;
    const itemPct = Math.min(100, Math.max(0, ant + quot));
    const pond = parseFloat(String(item.ponderation)) || 0;
    totalPostesSum += itemPct * (pond / 100);

    if (gcPostesNames.includes(name)) {
      gcPostesSum += itemPct * pond;
    } else {
      mecaPostesSum += itemPct * pond;
    }
  });

  const gcPostesPct = Math.min(100, Math.max(0, gcPostesSum / 35));
  const mecaPostesPct = Math.min(100, Math.max(0, mecaPostesSum / 65));
  const totalPostesPct = Math.min(100, Math.max(0, totalPostesSum));

  let finalGC = 0;
  let finalMeca = 0;
  let finalGlobal = 0;

  if (isPosteDetenteSeul) {
    finalGC = Math.round(gcPostesPct);
    finalMeca = Math.round(mecaPostesPct);
    finalGlobal = Math.round(totalPostesPct);
  } else {
    finalGC = Math.round((gcLignePct * 0.8) + (gcPostesPct * 0.2));
    finalMeca = Math.round((mecaLignePct * 0.8) + (mecaPostesPct * 0.2));
    finalGlobal = Math.round((totalLignePct * 0.8) + (totalPostesPct * 0.2));
  }

  return {
    avancementGC: Math.min(100, Math.max(0, finalGC)),
    avancementMeca: Math.min(100, Math.max(0, finalMeca)),
    avancementPhysique: Math.min(100, Math.max(0, finalGlobal))
  };
};

export function getProjectDisplayLength(project: any): string {
  if (!project || !project.identity || !project.identity.caracteristiques) {
    return "0";
  }
  const isSeul = project.identity.caracteristiques.typeOuvrage === "Poste de détente seul" || 
                 (project.identity.caracteristiques.hasPosteDetente && parseFloat(project.identity.caracteristiques.longueur || "10") === 0);
  if (isSeul) return "0";
  
  const hasLots = project.lots && project.lots.length > 0;
  if (hasLots) {
    const sum = project.lots.reduce((acc: number, l: any) => acc + (parseFloat(l.longueur) || 0), 0);
    if (sum > 0) return String(sum);
  }
  
  const len = project.identity.caracteristiques.longueur;
  return len && len !== "0" ? len : "10";
}

export function createDefaultFicheSuivi(): FicheSuivi {
  return {
    capPoste: "",
    ligneMl: "",
    typePoste: "",
    typeProgramme: "",
    demandeGefDate: "",
    gefCabinet: "",
    natureTerrain: "",
    depotDossierType: "",
    impactAssujettis: "",
    impactBetOds: "",
    impactDepotEtude: "",
    impactOuvertureEnqueteDate: "",
    choixTerrainDate: "",
    choixTerrainPv: "",
    etudeBetStatut: "",
    etudeBetCabinet: "",
    depotPcDate: "",
    depotAsDate: "",
    rappels: ["", "", "", "", ""],
    reserves: ["", "", "", "", ""],
    servitudeEnquetePv: "",
    servitudeEnqueteDate: "",
    servitudeJournaux: "",
    servitudeQuittancesPv: "",
    servitudeQuittancesDate: "",
    servitudeArreteStatus: "",
    servitudeArreteDate: "",
    servitudeArreteRef: "",
    autresInformations: ["", "", "", "", "", "", "", ""],
    expertiseArreteEnqueteRef: "",
    expertiseArreteEnqueteDate: "",
    expertiseArreteConsignationRef: "",
    expertiseArreteConsignationDate: "",
    servitudeEnqueteUtilitePubliquePv: "",
    servitudeEnqueteUtilitePubliqueDate: "",
    servitudeEnqueteUtilitePubliqueRef: "",
    asDateDemande: "",
    asOuvertureEnqueteDate: "",
    asPubJournauxDate: "",
    asQuittanceDate: "",
    impactDemandeAutExploitDate: "",
    impactPubJournauxDate: "",
    impactQuittanceDate: "",
    etudeLeveeReserveDate: "",
    etudeLeveeReserveStatus: "",
    etudeActionStatus: "",
    expertiseLeveeReserveDate: "",
    expertiseLeveeReserveStatus: "",
    expertiseActionStatus: ""
  };
}

export interface PlanDeControleItem {
  ord: string;
  tache: string;
  mode: string;
  ref: string;
  etalonnage: string;
  critere: string;
}

export const STATIC_PLAN_DE_CONTROLE_TASKS: PlanDeControleItem[] = [
  {
    ord: "01",
    tache: "Mobilisation du chantier",
    mode: "Visuel",
    ref: "Contrat d'exécution",
    etalonnage: "/",
    critere: "Installation conforme par rapport aux exigences du contrat de travaux"
  },
  {
    ord: "02",
    tache: "Réception des tubes en acier sur site",
    mode: "Visuel + mesure physique",
    ref: "Plans BPE + Contrat + Bordereau d'expédition",
    etalonnage: "Mètre à ruban, Pied à coulisse",
    critere: "Diamètre, Épaisseur, n° de Coulée, longueur et état d'enrobage physique conformes aux bordereaux"
  },
  {
    ord: "03",
    tache: "Réception des postes de coupure / détente + rechanges",
    mode: "Visuel + examen dimensionnel",
    ref: "Plans BPE + Contrat + PV de transfert matériel",
    etalonnage: "/",
    critere: "État de conservation physique conforme aux documents et PV de remise de matériel"
  },
  {
    ord: "04",
    tache: "Mise à disposition des ressources humaines qualifiées",
    mode: "Examen documentaire",
    ref: "Contrat + SP TEC + Certificats d'aptitude",
    etalonnage: "/",
    critere: "Qualifications et habilitations en cours de validité selon l'activité de pose"
  },
  {
    ord: "05",
    tache: "Réception des accessoires des postes sur site",
    mode: "Visuel et inventaire",
    ref: "Plans BPE + Contrat + PV de remise matériel",
    etalonnage: "/",
    critere: "État physique et colisage conformes aux listes de pièces jointes"
  },
  {
    ord: "06",
    tache: "Vérification de l'étalonnage des appareils de mesure",
    mode: "Examen des certificats",
    ref: "Liste des appareils de mesure à utiliser",
    etalonnage: "Justificatifs de calibrage COFRAC / ONML",
    critere: "Certificats d'étalonnage valides pour les manomètres, enregistreurs, balais électriques, etc."
  },
  {
    ord: "07",
    tache: "Réception géométrique du tracé",
    mode: "Levé topographique & Visuel",
    ref: "Contrat + Plans BPE approuvés",
    etalonnage: "/",
    critere: "Piquets de tracé conformes aux plans d'exécution et au profil en long validé"
  },
  {
    ord: "08",
    tache: "Ouverture de la piste",
    mode: "Visuel + mesure de largeur",
    ref: "Contrat + Plans BPE",
    etalonnage: "Mètre de chantier",
    critere: "Largeur de piste nettoyée conforme au diamètre nominal, praticabilité assurée"
  },
  {
    ord: "09",
    tache: "Bardage et pré-alignement des tubes acier",
    mode: "Visuel de sécurité",
    ref: "Contrat + Spécification Technique (SP TEC)",
    etalonnage: "/",
    critere: "Tubes alignés de manière stable, reposant sur cales en bois ou sacs de terre meuble"
  },
  {
    ord: "10",
    tache: "Mise à disposition du dossier technique de soudage",
    mode: "Vérification documentaire",
    ref: "Procédures qualifiées (PQR + WPS) selon SP TEC",
    etalonnage: "/",
    critere: "Dossier de soudage dûment approuvé et contresigné avant début de fabrication"
  },
  {
    ord: "11",
    tache: "Mise à disposition et qualification des soudeurs",
    mode: "Contrôle d'habilitation",
    ref: "Contrat + Procédure WPS + Licences de soudure",
    etalonnage: "/",
    critere: "Soudeurs qualifiés et homologués sur éprouvettes réelles selon le type de raccordement"
  },
  {
    ord: "12",
    tache: "Mise à disposition des outillages matériels de soudage",
    mode: "Visuel et contrôle technique",
    ref: "SP TEC + Dossier de soudage",
    etalonnage: "/",
    critere: "Générateurs, pinces de centrage et étuves à électrodes conformes et fonctionnels"
  },
  {
    ord: "13",
    tache: "Soudage de la canalisation",
    mode: "Visuel + mesure des paramètres",
    ref: "SP TEC + Fiche de spécification de soudage (WPS)",
    etalonnage: "Pince ampèremétrique, Pyromètre de contact",
    critere: "Paramètres de passe de pénétration et remplissage respectés. Prêt pour contrôle non destructif"
  },
  {
    ord: "14",
    tache: "Creusement de la tranchée",
    mode: "Visuel + mesure de section",
    ref: "Contrat + SP TEC + Plans d'exécution",
    etalonnage: "Mètre de chantier, Jauge",
    critere: "Profondeur de couverture réglementaire et largeur de fouille conformes au cahier des charges"
  },
  {
    ord: "15",
    tache: "Sablage des joints soudés",
    mode: "Visuel avant revêtement",
    ref: "Contrat + SP TEC de sablage",
    etalonnage: "/",
    critere: "Rugosité et propreté de surface métallique conformes au standard Sa 2 1/2"
  },
  {
    ord: "16",
    tache: "Revêtement isolant des joints soudés & raccords",
    mode: "Visuel + mesure d'épaisseur & continuité",
    ref: "Contrat + SP TEC + Procédure revêtement",
    etalonnage: "Jauge d'épaisseur, Détecteur de porosité (balai électrique)",
    critere: "Adhérence parfaite, aucune porosité détectée sous la tension d'épreuve réglementaire"
  },
  {
    ord: "17",
    tache: "Mise en place du lit de pose en sable",
    mode: "Visuel + mesure d'épaisseur",
    ref: "Contrat + SP TEC de pose",
    etalonnage: "Mètre",
    critere: "Épaisseur de sable doux de lit de pose ≥ 10 cm, fond de fouille exempt de pierres blessantes"
  },
  {
    ord: "18",
    tache: "Mise en place du pré-remblai de protection",
    mode: "Visuel de conformité",
    ref: "Contrat + SP TEC",
    etalonnage: "/",
    critere: "Recouvrement initial de la canalisation en sable doux sur au moins 20 cm au-dessus de la génératrice supérieure"
  },
  {
    ord: "19",
    tache: "Pose de câble à fibre optique sous gaine & chambres",
    mode: "Visuel + mesure de distance",
    ref: "Contrat + Procédure pose câble FO approuvée",
    etalonnage: "/",
    critere: "Alignement parallèle de la gaine, profondeur, pose de grillage avertisseur vert et chambres de tirage"
  },
  {
    ord: "20",
    tache: "Remblai définitif de la tranchée",
    mode: "Visuel et contrôle de compactage",
    ref: "Contrat + SP TEC de terrassement",
    etalonnage: "/",
    critere: "Compactage par couches successives, aucun élément rocheux de taille excessive admis"
  },
  {
    ord: "21",
    tache: "Mise en fouille des tronçons assemblés & raccordement",
    mode: "Visuel + détection électrique de défaut",
    ref: "Contrat + SP TEC de pose",
    etalonnage: "Balai électrique haute tension",
    critere: "Absence de défaut d'isolement lors de la descente en fouille. Alignement des tubes sans contraintes"
  },
  {
    ord: "22",
    tache: "Réalisation des points spéciaux (Traversées de routes / oueds)",
    mode: "Visuel + mesure topographique",
    ref: "Contrat + Plans BPE de détails",
    etalonnage: "/",
    critere: "Pose de gaines de protection en béton ou acier, lestages et signalisation spécifiques conformes"
  },
  {
    ord: "23",
    tache: "Réalisation des points particuliers (Coudes, piquages)",
    mode: "Visuel + mesure d'angles",
    ref: "Contrat + SP TEC + Plans de montage",
    etalonnage: "Rapporteur d'angle, Niveau",
    critere: "Rayon de courbure des coudes cintrés à froid ou préfabriqués conforme aux tolérances"
  },
  {
    ord: "24",
    tache: "Ferraillage des ouvrages de génie civil",
    mode: "Visuel + mesure d'espacement",
    ref: "Plans de ferraillage BPE approuvés",
    etalonnage: "Mètre",
    critere: "Diamètre des aciers, espacement des cadres et recouvrements conformes aux notes de calculs"
  },
  {
    ord: "25",
    tache: "Bétonnage des massifs et dalles",
    mode: "Visuel + prélèvement d'échantillons",
    ref: "Contrat + Spécifications Bétons",
    etalonnage: "Éprouvettes béton, thermomètre de cure",
    critere: "Résistance à la compression validée à 28 jours, vibrage correct, absence de nids de cailloux"
  },
  {
    ord: "26",
    tache: "Fourniture matériel Protection Cathodique (PC) provisoire & définitive",
    mode: "Visuel + examen de fiches techniques",
    ref: "Contrat + SP TEC + Plans d'ingénierie PC",
    etalonnage: "/",
    critere: "Anodes sacrificielles, déversoirs, soutirages et câbles de liaison conformes aux spécifications"
  },
  {
    ord: "27",
    tache: "Exécution des travaux de Protection Cathodique",
    mode: "Mesures électriques de potentiel",
    ref: "Contrat + Spécifications PC",
    etalonnage: "Multimètre de précision, Électrode cuivre/sulfate de cuivre",
    critere: "Continuité électrique assurée, potentiel de protection structure/sol dans la plage réglementaire"
  },
  {
    ord: "28",
    tache: "Ramonage mécanique de nettoyage de la ligne",
    mode: "Contrôle visuel de l'exutoire",
    ref: "Contrat + Procédure d'essais hydrostatiques",
    etalonnage: "/",
    critere: "Piston racleur récupéré entier à la gare de réception, absence de débris solides résiduels"
  },
  {
    ord: "29",
    tache: "Calibrage géométrique de la ligne",
    mode: "Examen de la plaque témoin",
    ref: "Contrat + Procédure d'essais hydrostatiques",
    etalonnage: "Plaque de calibrage en aluminium",
    critere: "Plaque de calibrage extraite saine, sans pliure ni encoche supérieure aux tolérances de l'épaisseur"
  },
  {
    ord: "30",
    tache: "Essais hydrostatiques globaux (Épreuves réglementaires)",
    mode: "Mesure de pression de résistance et étanchéité",
    ref: "Fascicules de réglementation en vigueur + SP TEC",
    etalonnage: "Balance manométrique étalonnée, Enregistreur de pression",
    critere: "Épreuve réussie : tenue à la pression de calcul minimale pendant 24h sans baisse inexpliquée"
  },
  {
    ord: "31",
    tache: "Essuyage et séchage préliminaire",
    mode: "Visuel",
    ref: "Procédure de séchage approuvée",
    etalonnage: "/",
    critere: "Piston mousse propulsé jusqu'à obtention d'une mousse ne présentant aucun signe d'humidité"
  },
  {
    ord: "32",
    tache: "Séchage final de la canalisation",
    mode: "Mesure d'humidité résiduelle",
    ref: "Procédure de séchage approuvée",
    etalonnage: "Hygromètre de point de rosée",
    critere: "Point de rosée de l'air ou de l'azote de balayage ≤ -20°C (ou conforme à la spécification)"
  },
  {
    ord: "33",
    tache: "Soufflage et nettoyage des tuyauteries de postes",
    mode: "Visuel (témoin papier/chiffon)",
    ref: "Contrat + SP TEC de pré-commissioning",
    etalonnage: "/",
    critere: "Aucun débris ni humidité résiduelle projetée sur le témoin lors du soufflage sous pression"
  },
  {
    ord: "34",
    tache: "Réception sur touret du câble fibre optique avant pose",
    mode: "Réflectométrie de contrôle",
    ref: "Contrat + Procédure de raccordement FO",
    etalonnage: "Réflectomètre optique étalonné (OTDR)",
    critere: "Rapport de test d'usine vérifié, absence de contraintes ou de cassures physiques de la fibre"
  },
  {
    ord: "35",
    tache: "Mise à disposition et vérification des équipements de pose FO",
    mode: "Examen mécanique",
    ref: "Contrat + Procédure de tirage FO",
    etalonnage: "Tensiomètre de tirage",
    critere: "Limiteur de tension mécanique étalonné pour éviter tout étirement de la fibre optique"
  },
  {
    ord: "36",
    tache: "Réception finale des liaisons fibre optique posées",
    mode: "Réflectométrie bilatérale",
    ref: "Contrat + Procédure de tirage FO",
    etalonnage: "Réflectomètre optique (OTDR)",
    critere: "Affaiblissement linéique et pertes aux épissures conformes aux seuils contractuels (dB/km)"
  }
];


// Lists of official Algerian regions, poles, and wilayas for project registration
const POLES_ALGERIE = [
  "Pôle ACO (Alger - Constantine - Ouargla)",
  "Pôle BBO (Blida - Béchar - Oran)"
];

const REGIONS_ALGERIE = [
  "Région de transport gaz Constantine",
  "Région de transport gaz Ouargla",
  "Région de transport gaz Alger",
  "Région de transport gaz Oran",
  "Région de transport gaz Blida",
  "Région de transport gaz Béchar"
];

const WILAYAS_ALGERIE = [
  "01 - Adrar",
  "02 - Chlef",
  "03 - Laghouat",
  "04 - Oum El Bouaghi",
  "05 - Batna",
  "06 - Béjaïa",
  "07 - Biskra",
  "08 - Béchar",
  "09 - Blida",
  "10 - Bouira",
  "11 - Tamanrasset",
  "12 - Tébessa",
  "13 - Tlemcen",
  "14 - Tiaret",
  "15 - Tizi Ouzou",
  "16 - Alger",
  "17 - Djelfa",
  "18 - Jijel",
  "19 - Sétif",
  "20 - Saïda",
  "21 - Skikda",
  "22 - Sidi Bel Abbès",
  "23 - Annaba",
  "24 - Guelma",
  "25 - Constantine",
  "26 - Médéa",
  "27 - Mostaganem",
  "28 - M'Sila",
  "29 - Mascara",
  "30 - Ouargla",
  "31 - Oran",
  "32 - El Bayadh",
  "33 - Illizi",
  "34 - Bordj Bou Arreridj",
  "35 - Boumerdès",
  "36 - El Tarf",
  "37 - Tindouf",
  "38 - Tissemsilt",
  "39 - El Oued",
  "40 - Khenchela",
  "41 - Souk Ahras",
  "42 - Tipaza",
  "43 - Mila",
  "44 - Aïn Defla",
  "45 - Naâma",
  "46 - Aïn Témouchent",
  "47 - Ghardaïa",
  "48 - Relizane",
  "49 - El M'Ghair",
  "50 - El Meniaa",
  "51 - Ouled Djellal",
  "52 - Bordj Badji Mokhtar",
  "53 - Béni Abbès",
  "54 - Timimoun",
  "55 - Touggourt",
  "56 - Djanet",
  "57 - In Salah",
  "58 - In Guezzam",
  "59 - Aflou",
  "60 - Ain Oussera",
  "61 - Barika",
  "62 - Bou Saâda",
  "63 - Chelghoum Laïd",
  "64 - El Abiodh Sidi Cheikh",
  "65 - El Eulma",
  "66 - Frenda",
  "67 - Maghnia",
  "68 - Messaad",
  "69 - Sour El Ghozlane"
];

// Helper to find latitude/longitude coordinates of Algerian Wilayas for KMZ/KML generation
function getWilayaCoordinates(wilayaName: string): { lat: number; lng: number } {
  if (!wilayaName) return { lat: 36.7538, lng: 3.0588 }; // Default Algiers
  const cleanName = wilayaName.replace(/^\d+\s*-\s*/, "").trim().toLowerCase();
  
  const coords: Record<string, { lat: number; lng: number }> = {
    "alger": { lat: 36.7538, lng: 3.0588 },
    "oran": { lat: 35.6971, lng: -0.6308 },
    "constantine": { lat: 36.3650, lng: 6.6147 },
    "annaba": { lat: 36.9000, lng: 7.7667 },
    "blida": { lat: 36.4700, lng: 2.8300 },
    "jijel": { lat: 36.8205, lng: 5.7661 },
    "setif": { lat: 36.1900, lng: 5.4137 },
    "sétif": { lat: 36.1900, lng: 5.4137 },
    "ouargla": { lat: 31.9493, lng: 5.3250 },
    "hassi messaoud": { lat: 31.6804, lng: 6.0728 },
    "béchar": { lat: 31.6167, lng: -2.2167 },
    "bechar": { lat: 31.6167, lng: -2.2167 },
    "biskra": { lat: 34.8500, lng: 5.7333 },
    "tamanrasset": { lat: 22.7850, lng: 5.5228 },
    "adrar": { lat: 27.8742, lng: -0.2864 },
    "chlef": { lat: 36.1647, lng: 1.3317 },
    "laghouat": { lat: 33.8000, lng: 2.8651 },
    "batna": { lat: 35.5500, lng: 6.1667 },
    "bejaia": { lat: 36.7511, lng: 5.0643 },
    "béjaïa": { lat: 36.7511, lng: 5.0643 },
    "djelfa": { lat: 34.6667, lng: 3.2500 },
    "tiaret": { lat: 35.3711, lng: 1.3169 },
    "tizi ouzou": { lat: 36.7119, lng: 4.0458 },
    "medea": { lat: 36.2642, lng: 2.7539 },
    "médéa": { lat: 36.2642, lng: 2.7539 },
    "mascara": { lat: 35.3964, lng: 0.1403 },
    "mostaganem": { lat: 35.9311, lng: 0.1250 },
    "m'sila": { lat: 35.7058, lng: 4.5419 },
    "sidi bel abbes": { lat: 35.1914, lng: -0.6417 },
    "sidi bel abbès": { lat: 35.1914, lng: -0.6417 },
    "skikda": { lat: 36.8792, lng: 6.9044 },
    "guelma": { lat: 36.4622, lng: 7.4294 },
    "bordj bou arreridj": { lat: 36.0711, lng: 4.7594 },
    "boumerdes": { lat: 36.7594, lng: 3.4731 },
    "boumerdès": { lat: 36.7594, lng: 3.4731 },
    "el oued": { lat: 33.3678, lng: 6.8516 },
    "khenchela": { lat: 35.4358, lng: 7.1433 },
    "souk ahras": { lat: 36.2864, lng: 7.9511 },
    "tipaza": { lat: 36.5892, lng: 2.4475 },
    "mila": { lat: 36.4503, lng: 6.2644 },
    "ain defla": { lat: 36.2644, lng: 1.9678 },
    "aïn defla": { lat: 36.2644, lng: 1.9678 },
    "naama": { lat: 33.2667, lng: -0.3167 },
    "naâma": { lat: 33.2667, lng: -0.3167 },
    "ghardaia": { lat: 32.4900, lng: 3.6700 },
    "ghardaïa": { lat: 32.4900, lng: 3.6700 },
    "relizane": { lat: 35.7372, lng: 0.5558 },
    "el tarf": { lat: 36.7672, lng: 8.3136 },
    "tindouf": { lat: 27.6711, lng: -8.1478 },
    "tissemsilt": { lat: 35.6072, lng: 1.8106 },
    "illizi": { lat: 26.4833, lng: 8.4667 },
    "touggourt": { lat: 33.1000, lng: 6.0667 },
    "djanet": { lat: 24.5500, lng: 9.4833 },
    "in salah": { lat: 27.1935, lng: 2.4607 },
    "in guezzam": { lat: 19.5705, lng: 5.7694 }
  };

  for (const key of Object.keys(coords)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return coords[key];
    }
  }

  // Fallback: deterministic coordinates from hashing the Wilaya name
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = (Math.abs(hash % 100) / 100) * 4; // 0 to 4 degrees
  const lngOffset = ((hash % 100) / 100) * 6 - 3; // -3 to 3 degrees
  return {
    lat: 34.0 + latOffset,
    lng: 3.0 + lngOffset
  };
}

// Generates a complete and beautiful KML document for a project dynamically
function generateKMLString(project: Project): string {
  const lengthKm = parseFloat(getProjectDisplayLength(project)) || 40;
  const baseCoords = getWilayaCoordinates(project.identity.wilaya);
  
  // Direct pipeline slightly northeast
  const angle = 0.5; // radians (approx 30 degrees)
  const degPerKm = 1 / 111.32;
  const totalDeg = lengthKm * degPerKm;
  const latDiff = totalDeg * Math.sin(angle);
  const lngDiff = (totalDeg * Math.cos(angle)) / Math.cos((baseCoords.lat * Math.PI) / 180);
  
  const startLat = baseCoords.lat;
  const startLng = baseCoords.lng;
  
  // Build path points
  const numSegments = 6;
  const pathPoints: { lat: number; lng: number }[] = [];
  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;
    const currentLat = startLat + latDiff * t;
    const currentLng = startLng + lngDiff * t;
    
    // Add realistic bend to pipeline path (0 at ends)
    const deviation = 0.015 * Math.sin(t * Math.PI) * (lengthKm > 20 ? 1 : 0.4);
    const devAngle = angle + Math.PI / 2;
    
    pathPoints.push({
      lat: currentLat + deviation * Math.sin(devAngle),
      lng: currentLng + deviation * Math.cos(devAngle)
    });
  }
  
  const pathCoordsString = pathPoints.map(p => `${p.lng},${p.lat},0`).join(" ");
  
  let placemarks = `
    <Placemark>
      <name>Gazoduc: ${project.name}</name>
      <description>Tracé principal du gazoduc (${lengthKm} km, DN ${project.identity.caracteristiques.diametre || 'N/A'})</description>
      <Style>
        <LineStyle>
          <color>ff0000ff</color> <!-- Red line -->
          <width>5</width>
        </LineStyle>
      </Style>
      <LineString>
        <extrude>1</extrude>
        <tessellate>1</tessellate>
        <altitudeMode>relativeToGround</altitudeMode>
        <coordinates>${pathCoordsString}</coordinates>
      </LineString>
    </Placemark>
  `;
  
  // Start Placemark (Scraper)
  placemarks += `
    <Placemark>
      <name>Gare de Racleur - Départ</name>
      <description>Station de départ du gazoduc ${project.name}</description>
      <Point>
        <coordinates>${pathPoints[0].lng},${pathPoints[0].lat},0</coordinates>
      </Point>
    </Placemark>
  `;
  
  // Sectioning Valves
  const nbCoupure = project.identity.caracteristiques.nbPostesCoupure || 1;
  for (let j = 1; j <= nbCoupure; j++) {
    const fraction = j / (nbCoupure + 1);
    const idx = Math.floor(fraction * pathPoints.length);
    const p = pathPoints[idx] || pathPoints[Math.floor(pathPoints.length / 2)];
    placemarks += `
      <Placemark>
        <name>Poste de Coupure PC ${j}</name>
        <description>Vanne de sectionnement de sécurité PC ${j}</description>
        <Point>
          <coordinates>${p.lng},${p.lat},0</coordinates>
        </Point>
      </Placemark>
    `;
  }
  
  // End Placemark (Scraper)
  placemarks += `
    <Placemark>
      <name>Gare de Racleur - Arrivée</name>
      <description>Station de réception de racleur finale pour le projet ${project.name}</description>
      <Point>
        <coordinates>${pathPoints[pathPoints.length - 1].lng},${pathPoints[pathPoints.length - 1].lat},0</coordinates>
      </Point>
    </Placemark>
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${project.name.replace(/[<>&"]/g, "")} - Tracé GRTG</name>
    <description>Tracé technique officiel généré pour le gazoduc ${project.name.replace(/[<>&"]/g, "")} - Wilaya: ${project.identity.wilaya.replace(/[<>&"]/g, "")}</description>
    ${placemarks}
  </Document>
</kml>`;
}


// Hardcoded initial sample projects to populate empty firestore database automatically with realistic Sonelgaz data
const SAMPLE_PROJECTS: Omit<Project, "id">[] = [
  {
    name: "Gazoduc d'Alimentation Centrale Électrique JIJEL (20\")",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    planning: {
      etudeStart: "2026-01-10",
      etudeEnd: "2026-03-25",
      travauxStart: "2026-04-01",
      travauxEnd: "2026-09-15",
      essaisStart: "2026-09-16",
      essaisEnd: "2026-10-15",
      gazStart: "2026-10-16",
      gazEnd: "2026-10-30"
    },
    identity: {
      region: "Région de transport gaz Constantine",
      pole: "Pôle ACO (Alger - Constantine - Ouargla)",
      wilaya: "18 - Jijel",
      district: "18 - Jijel District Gaz",
      phase: "Travaux",
      cadreInscription: "Programme d'Urgence National (PUN)",
      planificationComment: "Travaux en cours de terrassement et cintrage sur l'essentiel du tracé. Progression conforme au planning initial.",
      structureChargee: "Division Engineering Transport Gaz",
      caracteristiques: {
        diametre: "20\" (DN 500)",
        longueur: "42",
        pression: "70 bar (HP)",
        typeTuyau: "Acier API 5L X60 - Enrobé PE extrudé"
      },
      contraintes: "Opposition résolue au PK 12+500. Retard de livraison des vannes de sectionnement."
    },
    etudeAutorisation: {
      statutEtude: "Approuvée",
      datePermisConstruire: "2026-03-10",
      statutPermisConstruire: "Reçu",
      statutArreteServitude: "Signé & Publié",
      arreteServitudeRef: "Arrêté n° 245/Jijel/2026",
      expertiseFonciere: {
        gefDesignated: true,
        gefIdentity: "Bureau d'Expertise Foncière SADAOUI, Constantine",
        acquisitionDemandEstablished: true,
        acquisitionComment: "Dossiers d'expropriation déposés au niveau des APC de Jijel et Kaous. Indemnisation en cours."
      }
    },
    travauxPlanification: {
      avancementPhysique: 55,
      essaisReglementaires: {
        epreuveResistance: "Non faite",
        epreuveEtancheite: "Non faite",
        organismeControleur: "VERITAL SpA"
      },
      controleQualiteChecklist: {
        abaqueSoudageValide: true,
        radiographieCND: true,
        enrobageVerifie: false,
        litPoseSableux: true,
        protectionCathodique: false
      }
    },
    miseEnGazArchive: {
      statutMiseEnGaz: "Planifiée",
      dateEffectiveMiseEnGaz: "2026-10-25",
      documentsArchives: [
        { id: "1", name: "Etude de Desserte et d'Impact Hydraulique_Jijel.pdf", category: "Étude d'Impact", addedAt: "2026-02-15" },
        { id: "2", name: "Procédure d'Abaque de Soudage Qualifiée.pdf", category: "Soudure", addedAt: "2026-04-10" }
      ]
    }
  },
  {
    name: "Interconnexion Gazoduc Ouest ALGER - BLIDA (30\")",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    planning: {
      etudeStart: "2025-08-01",
      etudeEnd: "2025-11-15",
      travauxStart: "2025-12-01",
      travauxEnd: "2026-05-30",
      essaisStart: "2026-06-01",
      essaisEnd: "2026-06-25",
      gazStart: "2026-07-01",
      gazEnd: "2026-07-10"
    },
    identity: {
      region: "Région de transport gaz Alger",
      pole: "Pôle ACO (Alger - Constantine - Ouargla)",
      wilaya: "09 - Blida",
      district: "09 - Blida District Gaz",
      phase: "Mise en Gaz",
      cadreInscription: "Plan de Développement Inter-Régional (PDIR)",
      planificationComment: "Tous les essais de pression hydraulique de résistance et d'étanchéité ont été validés par VERITAL. Phase finale de rinçage et de mise en gaz.",
      structureChargee: "Département Travaux Neufs - TG Alger",
      caracteristiques: {
        diametre: "30\" (DN 750)",
        longueur: "28",
        pression: "70 bar (HP)",
        typeTuyau: "Acier API 5L X70 - Haute Résistance"
      },
      contraintes: "Aucune contrainte majeure. Traversée de l'Oued Chiffa finalisée sans incident."
    },
    etudeAutorisation: {
      statutEtude: "Approuvée",
      datePermisConstruire: "2025-11-02",
      statutPermisConstruire: "Reçu",
      statutArreteServitude: "Signé & Publié",
      arreteServitudeRef: "Arrêté n° 1087/Blida/2025",
      expertiseFonciere: {
        gefDesignated: true,
        gefIdentity: "Cabinet de Géomètre-Expert BELHADJ, Alger",
        acquisitionDemandEstablished: true,
        acquisitionComment: "Expertise foncière finalisée à 100%. Accords amiables signés avec l'ensemble des propriétaires agricoles."
      }
    },
    travauxPlanification: {
      avancementPhysique: 100,
      essaisReglementaires: {
        epreuveResistance: "Réussie",
        epreuveEtancheite: "Réussie",
        organismeControleur: "ALGERAC"
      },
      controleQualiteChecklist: {
        abaqueSoudageValide: true,
        radiographieCND: true,
        enrobageVerifie: true,
        litPoseSableux: true,
        protectionCathodique: true
      }
    },
    miseEnGazArchive: {
      statutMiseEnGaz: "Réalisée",
      dateEffectiveMiseEnGaz: "2026-07-05",
      documentsArchives: [
        { id: "1", name: "Rapport d'épreuve hydrostatique validé_VERITAL.pdf", category: "PV d'essais", addedAt: "2026-06-20" },
        { id: "2", name: "Dossier Technique Final de Recollement (As-Built).zip", category: "Dossier Technique Final", addedAt: "2026-07-02" },
        { id: "3", name: "Certificat de tarage des soupapes de sécurité du poste.pdf", category: "PV d'essais", addedAt: "2026-06-28" }
      ]
    }
  }
];

const getPipelineSequence = (caracteristiques: any) => {
  if (caracteristiques?.pipelineSequence && Array.isArray(caracteristiques.pipelineSequence) && caracteristiques.pipelineSequence.length > 0) {
    return caracteristiques.pipelineSequence;
  }
  
  // Build a default sequence based on the individual fields
  const sequence: { id: string; type: "racc" | "gr_dep" | "gr_arr" | "coup" | "sect" | "det"; label?: string; pk?: string }[] = [];
  
  if (caracteristiques?.hasPiquage || caracteristiques?.pointRaccordement) {
    sequence.push({
      id: "racc-auto",
      type: "racc",
      label: caracteristiques?.pointRaccordement || "Piquage / Raccordement",
      pk: "Départ"
    });
  }
  
  if (caracteristiques?.hasGareRacleurDepart) {
    sequence.push({
      id: "gr_dep-auto",
      type: "gr_dep",
      label: "Gare Racleur Départ (GRD)"
    });
  }
  
  if (caracteristiques?.hasPosteCoupure) {
    const nb = caracteristiques?.nbPostesCoupure || 1;
    for (let i = 0; i < nb; i++) {
      sequence.push({
        id: `coup-auto-${i}`,
        type: "coup",
        label: nb > 1 ? `Poste de Coupure ${i + 1}` : "Poste de Coupure"
      });
    }
  }
  
  if (caracteristiques?.hasPosteSectionnement) {
    const nb = caracteristiques?.nbPostesSectionnement || 1;
    for (let i = 0; i < nb; i++) {
      sequence.push({
        id: `sect-auto-${i}`,
        type: "sect",
        label: nb > 1 ? `Poste Sectionnement ${i + 1}` : "Poste Sectionnement"
      });
    }
  }
  
  if (caracteristiques?.hasGareRacleurArrivee) {
    sequence.push({
      id: "gr_arr-auto",
      type: "gr_arr",
      label: "Gare Racleur Arrivée (GRA)"
    });
  }
  
  if (caracteristiques?.hasPosteDetente) {
    sequence.push({
      id: "det-auto",
      type: "det",
      label: "Poste Détente (DP)",
      pk: caracteristiques?.capacitePoste ? `Capacité: ${caracteristiques.capacitePoste}` : "DP"
    });
  }
  
  if (sequence.length === 0) {
    const L = caracteristiques?.longueur || "42";
    return [
      { id: "racc-def", type: "racc", label: "Piquage / Raccordement principal", pk: "0" },
      { id: "gr_dep-def", type: "gr_dep", label: "Gare Racleur Départ (GRD)", pk: "0" },
      { id: "coup-def", type: "coup", label: "Poste de Coupure de ligne", pk: `${Math.round(parseFloat(L) * 0.35) || 15}` },
      { id: "sect-def", type: "sect", label: "Poste de Sectionnement de sécurité", pk: `${Math.round(parseFloat(L) * 0.7) || 30}` },
      { id: "gr_arr-def", type: "gr_arr", label: "Gare Racleur Arrivée (GRA)", pk: L },
      { id: "det-def", type: "det", label: "Poste Détente Terminal (DP)", pk: L }
    ];
  }
  
  return sequence;
};

const isUserPolesMatched = (userPoles: string[], projectPole: string) => {
  if (!userPoles || userPoles.length === 0) return true;
  if (userPoles.includes("Tous") || userPoles.includes("all")) return true;
  return userPoles.some(p => {
    if (!p || !projectPole) return false;
    const cleanUser = p.toLowerCase().replace(/ô/g, "o").trim();
    const cleanProj = projectPole.toLowerCase().replace(/ô/g, "o").trim();
    return cleanProj.includes(cleanUser) || cleanUser.includes(cleanProj) || 
           (cleanUser.includes("aco") && cleanProj.includes("aco")) ||
           (cleanUser.includes("bbo") && cleanProj.includes("bbo"));
  });
};

const isUserDirectionsMatched = (userDirections: string[], projectRegion: string) => {
  if (!userDirections || userDirections.length === 0) return true;
  if (userDirections.includes("Tous") || userDirections.includes("all")) return true;
  return userDirections.some(d => {
    if (!d || !projectRegion) return false;
    const keywords = ["constantine", "ouargla", "alger", "oran", "blida", "bechar"];
    const matchedKeywordUser = keywords.find(k => d.toLowerCase().includes(k));
    const matchedKeywordProj = keywords.find(k => projectRegion.toLowerCase().includes(k));
    if (matchedKeywordUser && matchedKeywordProj) {
      return matchedKeywordUser === matchedKeywordProj;
    }
    const cleanUser = d.toLowerCase().replace(/dr/g, "").replace(/tg/g, "").replace(/region de transport/g, "").trim();
    const cleanProj = projectRegion.toLowerCase().replace(/dr/g, "").replace(/tg/g, "").replace(/region de transport/g, "").trim();
    return cleanProj.includes(cleanUser) || cleanUser.includes(cleanProj);
  });
};

const AVAILABLE_COLUMNS = [
  { key: "wilaya", label: "Wilaya" },
  { key: "pole", label: "Pôle" },
  { key: "region", label: "Direction / Région" },
  { key: "phase", label: "Phase du Projet" },
  { key: "objective", label: "Objectif / Date" },
  { key: "diametre", label: "Diamètre" },
  { key: "longueur", label: "Longueur" },
  { key: "capacite", label: "Capacité Poste" },
  { key: "avGC", label: "Avancement GC" },
  { key: "avMeca", label: "Avancement Méca" },
  { key: "avGlobal", label: "Avancement Global" },
  { key: "contraintes", label: "Contraintes Majeures" }
];

interface ProjectManagementProps {
  isAdmin: boolean;
  currentUser: any;
  userProfile?: any;
}

export default function ProjectManagement({ isAdmin, currentUser, userProfile }: ProjectManagementProps) {
  const hasPrivilege = (privilegeKey: string): boolean => {
    // Super Administrateur automatically has all privileges
    if (userProfile?.role === "Super Administrateur" || currentUser?.email === "boudjada.youcef@gmail.com") {
      return true;
    }
    // Normal Administrateurs automatically have all standard privileges, but restricted by pole/direction
    if (userProfile?.role === "Administrateur") {
      return true;
    }
    // For regular users, check their specific assigned privileges
    if (userProfile?.privileges) {
      return userProfile.privileges[privilegeKey] !== false;
    }
    // Default fallback to true for backward compatibility or if privileges are not specified yet
    return true;
  };

  const canEditProject = (project: any): boolean => {
    if (!project) return false;
    
    const isSuperAdmin = userProfile?.role === "Super Administrateur" || currentUser?.email === "boudjada.youcef@gmail.com";
    if (isSuperAdmin) {
      return true;
    }
    
    // Check multi-pole & direction matching
    const userPoles = userProfile?.assignedPoles || (userProfile?.pole ? [userProfile.pole] : []);
    const userDirections = userProfile?.assignedDirections || (userProfile?.direction ? [userProfile.direction] : []);
    
    const hasPoleAccess = userPoles.length === 0 || userPoles.includes("Tous") || isUserPolesMatched(userPoles, project.identity?.pole);
    const hasDirectionAccess = userDirections.length === 0 || userDirections.includes("Tous") || isUserDirectionsMatched(userDirections, project.identity?.region);
    
    if (!hasPoleAccess || !hasDirectionAccess) {
      return false;
    }
    
    // Normal Administrateur has edit privilege for projects in their assigned poles and directions
    if (userProfile?.role === "Administrateur") {
      return true;
    }
    
    const mode = userProfile?.privileges?.project_privilege || "all";
    if (mode === "readonly") {
      return false;
    }
    if (mode === "assigned") {
      const uid = currentUser?.uid || userProfile?.uid || userProfile?.id;
      const email = currentUser?.email || userProfile?.email;
      
      const isCPTravaux = (project.chefsDeProjetTravaux || []).some((c: any) => c.uid === uid || (email && c.email?.toLowerCase() === email.toLowerCase())) || project.chefDeProjetUid === uid || (email && project.chefDeProjetEmail?.toLowerCase() === email.toLowerCase());
      const isCPEtude = (project.chefsDeProjetEtude || []).some((c: any) => c.uid === uid || (email && c.email?.toLowerCase() === email.toLowerCase())) || project.chefDeProjetEtudeUid === uid || (email && project.chefDeProjetEtudeEmail?.toLowerCase() === email.toLowerCase());
      
      return !!(isCPTravaux || isCPEtude);
    }
    return true; // "all" but restricted to their assigned poles/directions (checked above)
  };
  const [projects, setProjects] = useState<Project[]>([]);
  const [profilesList, setProfilesList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync user profiles from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "profiles"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setProfilesList(list);
    });
    return () => unsubscribe();
  }, []);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Tabs within project viewer
  const [activeSubTab, setActiveSubTab] = useState<"planning" | "identity" | "etude" | "expertise" | "travaux" | "gaz" | "bordereau">("planning");
  const [editingLotContractsId, setEditingLotContractsId] = useState<string | null>(null);
  const [isGenesisExpanded, setIsGenesisExpanded] = useState<boolean>(false);

  // Navigation module state (Plan de charge, Gestion, Tableau de bord, Rapport mensuel, Bordereau des prix)
  const [activeModule, setActiveModule] = useState<"charge" | "gestion" | "dashboard" | "report" | "bordereau">("charge");
  const [planDeChargeSearch, setPlanDeChargeSearch] = useState<string>("");
  const [planDeChargeFilter, setPlanDeChargeFilter] = useState<string>("Tous");
  
  // Advanced Plan de Charge filters
  const [planDeChargeAnnee, setPlanDeChargeAnnee] = useState<string>("Tous");
  const [planDeChargePole, setPlanDeChargePole] = useState<string>("Tous");
  const [planDeChargeWilaya, setPlanDeChargeWilaya] = useState<string>("Tous");
  const [planDeChargeDirection, setPlanDeChargeDirection] = useState<string>("Tous");
  const [planDeChargeContrainte, setPlanDeChargeContrainte] = useState<string>("Tous");
  const [planDeChargeObjectif, setPlanDeChargeObjectif] = useState<string>("Tous");
  const [isFullscreenPlanDeCharge, setIsFullscreenPlanDeCharge] = useState<boolean>(false);
  const [planDeChargeFullscreenMode, setPlanDeChargeFullscreenMode] = useState<"normal" | "reunion">("normal");
  const [meetingSelectedProject, setMeetingSelectedProject] = useState<Project | null>(null);
  const [showFullscreenMenu, setShowFullscreenMenu] = useState<boolean>(false);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [showColumnSelector, setShowColumnSelector] = useState<boolean>(false);
  const [isEditingMateriel, setIsEditingMateriel] = useState<boolean>(false);
  const [tempMateriel, setTempMateriel] = useState<any>(null);
  const [travauxProgressTab, setTravauxProgressTab] = useState<"ligne" | "postes">("ligne");
  const [activeTravauxLotId, setActiveTravauxLotId] = useState<string | null>(null);
  const [isEditingTravauxProgress, setIsEditingTravauxProgress] = useState<boolean>(false);
  const [tempTravauxLigne, setTempTravauxLigne] = useState<any[] | null>(null);
  const [tempTravauxPostes, setTempTravauxPostes] = useState<any[] | null>(null);
  const [tempLongueur, setTempLongueur] = useState<string>("");

  useEffect(() => {
    if (isFullscreenPlanDeCharge) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreenPlanDeCharge) {
        setIsFullscreenPlanDeCharge(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreenPlanDeCharge]);

  // Advanced Gestion de Projet filters
  const [gestionFilterAnnee, setGestionFilterAnnee] = useState<string>("Tous");
  const [gestionFilterPole, setGestionFilterPole] = useState<string>("Tous");
  const [gestionFilterDirection, setGestionFilterDirection] = useState<string>("Tous");
  const [gestionFilterWilaya, setGestionFilterWilaya] = useState<string>("Tous");
  const [gestionSearchProjet, setGestionSearchProjet] = useState<string>("");

  // Download KMZ/KML for a project
  const handleDownloadKMZ = (project: Project) => {
    try {
      let content: string | Uint8Array;
      let filename = `Trace_${project.name.replace(/\s+/g, "_")}.kml`;
      let mimeType = "application/vnd.google-earth.kml+xml";

      if (project.identity.kmzFileData) {
        const base64Data = project.identity.kmzFileData;
        const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          const rawBase64 = matches[2];
          const binString = atob(rawBase64);
          const len = binString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binString.charCodeAt(i);
          }
          content = bytes;
          if (project.identity.kmzFileName) {
            filename = project.identity.kmzFileName;
          } else {
            filename = mimeType.includes("zip") || mimeType.includes("kmz") 
              ? `Trace_${project.name.replace(/\s+/g, "_")}.kmz` 
              : `Trace_${project.name.replace(/\s+/g, "_")}.kml`;
          }
        } else {
          content = generateKMLString(project);
        }
      } else {
        content = generateKMLString(project);
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading KML:", err);
      alert("Erreur lors de la génération ou du téléchargement du fichier.");
    }
  };

  // Helper to download content as Microsoft Word document
  const downloadAsWord = (htmlContent: string, filename: string) => {
    const documentTemplate = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${filename}</title>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.4;
            color: #1e293b;
            padding: 20px;
          }
          h1 {
            color: #1e3a8a;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 6px;
            margin-top: 25px;
            margin-bottom: 15px;
            font-size: 20pt;
            font-weight: bold;
          }
          h2 {
            color: #2563eb;
            border-bottom: 1.5px solid #cbd5e1;
            padding-bottom: 4px;
            margin-top: 22px;
            margin-bottom: 12px;
            font-size: 15pt;
            font-weight: bold;
          }
          h3 {
            color: #0f172a;
            margin-top: 15px;
            margin-bottom: 8px;
            font-size: 12pt;
            font-weight: bold;
          }
          h4 {
            color: #1e3a8a;
            margin-top: 12px;
            margin-bottom: 6px;
            font-size: 10.5pt;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
          }
          th, td {
            border: 1px solid #94a3b8;
            padding: 6px 10px;
            font-size: 9pt;
            text-align: left;
          }
          th {
            background-color: #f1f5f9;
            font-weight: bold;
            color: #1e293b;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .font-mono { font-family: 'Courier New', Courier, monospace; }
          .page-break {
            page-break-before: always;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
    const blob = new Blob([documentTemplate], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to determine the main objective (Mise en gaz or Ouverture de chantier) for a project
  const getProjectObjective = (p: Project) => {
    if (p.identity.phase === "Étude") {
      return {
        label: "Ouverture chantier",
        date: p.planning?.travauxStart || "",
        type: "ouverture"
      };
    } else if (p.identity.phase === "Travaux" || p.identity.phase === "Mise en Gaz") {
      return {
        label: "Mise en gaz",
        date: p.planning?.gazStart || "",
        type: "misengaz"
      };
    } else {
      return {
        label: "Clôturé",
        date: p.planning?.gazEnd || "",
        type: "cloture"
      };
    }
  };

  // Helper to generate Plan de charge HTML
  const generatePlanDeChargeHtml = (filteredProjects: Project[], filters: {
    annee: string;
    pole: string;
    direction: string;
    wilaya: string;
    phase: string;
    search: string;
    objectif: string;
  }) => {
    let html = `
      <div style="text-align: center; margin-bottom: 25px; border-bottom: 3px double #1e3a8a; padding-bottom: 15px;">
        <h1 style="color: #1e3a8a; font-size: 22pt; margin: 0; font-weight: bold; text-transform: uppercase; border: none; padding: 0;">SONELGAZ - TRANSPORT GAZ</h1>
        <h2 style="color: #475569; font-size: 14pt; margin: 5px 0 0 0; font-weight: bold; text-transform: uppercase; border: none; padding: 0;">PLAN DE CHARGE D'INGÉNIERIE & TRAVAUX</h2>
        <p style="font-size: 10pt; color: #64748b; margin: 5px 0 0 0;">Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 11pt; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Filtres actifs pour la réunion :</h3>
        <table style="width: 100%; border: none; margin: 0; border-collapse: collapse;">
          <tr style="border: none;">
            <td style="border: none; padding: 4px; font-size: 9pt; width: 33%;"><strong style="color: #475569;">Année :</strong> ${filters.annee}</td>
            <td style="border: none; padding: 4px; font-size: 9pt; width: 33%;"><strong style="color: #475569;">Pôle TG :</strong> ${filters.pole}</td>
            <td style="border: none; padding: 4px; font-size: 9pt; width: 33%;"><strong style="color: #475569;">Direction/Région :</strong> ${filters.direction}</td>
          </tr>
          <tr style="border: none;">
            <td style="border: none; padding: 4px; font-size: 9pt;"><strong style="color: #475569;">Wilaya :</strong> ${filters.wilaya}</td>
            <td style="border: none; padding: 4px; font-size: 9pt;"><strong style="color: #475569;">Phase Actuelle :</strong> ${filters.phase}</td>
            <td style="border: none; padding: 4px; font-size: 9pt;"><strong style="color: #475569;">Objectif :</strong> ${filters.objectif === "Tous" ? "Tous les objectifs" : filters.objectif === "Ouverture" ? "Ouverture de chantier" : "Mise en gaz"}</td>
          </tr>
        </table>
      </div>

      <h3 style="color: #1e3a8a; font-size: 12pt; font-weight: bold; margin-bottom: 10px;">Liste des Ouvrages (${filteredProjects.length})</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #1e3a8a; color: #ffffff;">
            <th style="border: 1px solid #94a3b8; padding: 6px; font-size: 8.5pt; text-align: left; color: white; background-color: #1e3a8a;">Ouvrage</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; font-size: 8.5pt; text-align: left; color: white; background-color: #1e3a8a;">Wilaya</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; font-size: 8.5pt; text-align: left; color: white; background-color: #1e3a8a;">Pôle</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; font-size: 8.5pt; text-align: left; color: white; background-color: #1e3a8a;">Région / Direction</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; font-size: 8.5pt; text-align: left; color: white; background-color: #1e3a8a;">Phase</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; font-size: 8.5pt; text-align: left; color: white; background-color: #1e3a8a;">Objectif Prévu</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; font-size: 8.5pt; text-align: left; color: white; background-color: #1e3a8a;">Diamètre</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; font-size: 8.5pt; text-align: left; color: white; background-color: #1e3a8a;">Longueur</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; font-size: 8.5pt; text-align: left; color: white; background-color: #1e3a8a;">Capacité Poste</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; font-size: 8.5pt; text-align: center; color: white; background-color: #1e3a8a;">Av. GC</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; font-size: 8.5pt; text-align: center; color: white; background-color: #1e3a8a;">Av. Méca</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; font-size: 8.5pt; text-align: center; color: white; background-color: #1e3a8a;">Av. Global</th>
            <th style="border: 1px solid #94a3b8; padding: 6px; font-size: 8.5pt; text-align: left; color: white; background-color: #1e3a8a;">Contrainte Majeure</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredProjects.forEach(p => {
      const hasConstraint = p.identity.contraintes && p.identity.contraintes.trim().length > 0;
      const gc = p.travauxPlanification?.avancementGC !== undefined ? `${p.travauxPlanification.avancementGC}%` : "0%";
      const meca = p.travauxPlanification?.avancementMeca !== undefined ? `${p.travauxPlanification.avancementMeca}%` : "0%";
      const global = p.travauxPlanification?.avancementPhysique !== undefined ? `${p.travauxPlanification.avancementPhysique}%` : "0%";
      const cap = p.identity.caracteristiques?.capacitePoste || p.ficheSuivi?.capPoste || "N/A";
      
      const obj = getProjectObjective(p);
      const formattedObjDate = obj.date ? new Date(obj.date).toLocaleDateString("fr-FR") : "Non défini";
      const objCellText = `<strong style="color: ${obj.type === "ouverture" ? "#b45309" : obj.type === "misengaz" ? "#047857" : "#475569"}; font-size: 8.5pt;">${obj.label}</strong><br/><span style="font-size: 7.5pt; font-family: monospace; color: #64748b;">${formattedObjDate}</span>`;

      html += `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8pt; font-weight: bold; color: #1e293b;">${p.name}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8pt; color: #475569;">${p.identity.wilaya || "N/A"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8pt; color: #475569;">${p.identity.pole || "N/A"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8pt; color: #475569;">${p.identity.region || "N/A"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8pt; font-weight: bold; text-align: center;">${p.identity.phase}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8pt; text-align: left;">${objCellText}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8pt; font-family: monospace; color: #334155;">${p.identity.caracteristiques?.diametre || "N/A"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8pt; font-family: monospace; color: #334155;">${getProjectDisplayLength(p) !== "0" ? `${getProjectDisplayLength(p)} km` : "N/A"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8pt; font-family: monospace; color: #334155;">${cap}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8pt; font-family: monospace; text-align: center; color: #1e3a8a; font-weight: bold;">${gc}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8pt; font-family: monospace; text-align: center; color: #047857; font-weight: bold;">${meca}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8pt; font-family: monospace; text-align: center; color: #2563eb; font-weight: bold; background-color: #eff6ff;">${global}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8pt; color: ${hasConstraint ? "#be123c" : "#047857"};">
            ${hasConstraint ? p.identity.contraintes : "Aucune contrainte"}
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
      <div style="margin-top: 30px; text-align: center; font-size: 8pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        Document confidentiel • Sonelgaz Division Engineering et Travaux Neufs (DETN)
      </div>
    `;

    return html;
  };

  const handlePrintPlanDeCharge = (filteredProjects: Project[]) => {
    const filters = {
      annee: planDeChargeAnnee,
      pole: planDeChargePole,
      direction: planDeChargeDirection,
      wilaya: planDeChargeWilaya,
      phase: planDeChargeFilter,
      search: planDeChargeSearch,
      objectif: planDeChargeObjectif
    };
    const htmlContent = generatePlanDeChargeHtml(filteredProjects, filters);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Plan de Charge Sonelgaz</title>
            <style>
              body { padding: 30px; font-family: 'Segoe UI', system-ui, sans-serif; background-color: #fff; color: #1e293b; }
              table { border-collapse: collapse; width: 100%; margin-top: 15px; margin-bottom: 15px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 8.5pt; }
              th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .text-right { text-align: right; }
            </style>
          </head>
          <body>
            ${htmlContent}
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      win.document.close();
    } else {
      alert("Veuillez autoriser les popups pour pouvoir imprimer le plan de charge.");
    }
  };

  const handleExportPlanDeChargeWord = (filteredProjects: Project[]) => {
    const filters = {
      annee: planDeChargeAnnee,
      pole: planDeChargePole,
      direction: planDeChargeDirection,
      wilaya: planDeChargeWilaya,
      phase: planDeChargeFilter,
      search: planDeChargeSearch,
      objectif: planDeChargeObjectif
    };
    const htmlContent = generatePlanDeChargeHtml(filteredProjects, filters);
    downloadAsWord(htmlContent, `Plan_de_Charge_Sonelgaz_${new Date().toISOString().split('T')[0]}.doc`);
  };

  const safeHtml2Canvas = async (element: HTMLElement, options: any = {}) => {
    const convertOklchToRgb = (oklchStr: string): string => {
      return oklchStr.replace(/oklch\(([^)]+)\)/g, (match, content) => {
        try {
          const parts = content.trim().split(/[\s+/]+/);
          if (parts.length > 0) {
            const lStr = parts[0];
            let lightness = 0.5;
            if (lStr.endsWith('%')) {
              lightness = parseFloat(lStr) / 100;
            } else {
              lightness = parseFloat(lStr);
              if (lightness > 1) {
                lightness = lightness / 100;
              }
            }
            lightness = Math.max(0, Math.min(1, lightness));
            const grayVal = Math.round(lightness * 255);
            
            let alpha = '1';
            if (parts.length >= 4) {
              const aStr = parts[3];
              if (aStr.endsWith('%')) {
                alpha = String(parseFloat(aStr) / 100);
              } else {
                alpha = aStr;
              }
            } else if (content.includes('/')) {
              const slashParts = content.split('/');
              if (slashParts.length > 1) {
                const aStr = slashParts[1].trim();
                if (aStr.endsWith('%')) {
                  alpha = String(parseFloat(aStr) / 100);
                } else {
                  alpha = aStr;
                }
              }
            }
            
            if (alpha !== '1' && alpha !== '') {
              return `rgba(${grayVal}, ${grayVal}, ${grayVal}, ${alpha})`;
            } else {
              return `rgb(${grayVal}, ${grayVal}, ${grayVal})`;
            }
          }
        } catch (e) {
          // fallback
        }
        return 'rgb(120, 120, 120)';
      });
    };

    const originalOnClone = options.onclone;
    
    options.onclone = (clonedDoc: Document, clonedEl: HTMLElement) => {
      // 1. Sanitize style attributes on all elements
      try {
        const allElements = clonedDoc.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          if (el.style) {
            const inlineStyle = el.getAttribute('style');
            if (inlineStyle && inlineStyle.includes('oklch')) {
              el.setAttribute('style', convertOklchToRgb(inlineStyle));
            }
          }
        }
      } catch (e) {
        console.warn("Failed to sanitize inline styles:", e);
      }

      // 2. Sanitize style tags
      try {
        const styleTags = clonedDoc.getElementsByTagName('style');
        for (let i = 0; i < styleTags.length; i++) {
          const style = styleTags[i];
          if (style.textContent && style.textContent.includes('oklch')) {
            style.textContent = convertOklchToRgb(style.textContent);
          }
        }
      } catch (e) {
        console.warn("Failed to sanitize style tags:", e);
      }

      // 3. Sanitize styleSheets cssRules
      try {
        for (let i = 0; i < clonedDoc.styleSheets.length; i++) {
          const sheet = clonedDoc.styleSheets[i];
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (rules) {
              for (let j = 0; j < rules.length; j++) {
                const rule = rules[j] as CSSStyleRule;
                if (rule.style && rule.style.cssText) {
                  if (rule.style.cssText.includes('oklch')) {
                    try {
                      rule.style.cssText = convertOklchToRgb(rule.style.cssText);
                    } catch (err) {
                      // ignore write error
                    }
                  }
                }
              }
            }
          } catch (e) {
            // CORS error, ignore
          }
        }
      } catch (e) {
        console.warn("Failed to sanitize styleSheets:", e);
      }

      // 4. Override getComputedStyle on the cloned window
      try {
        if (clonedDoc.defaultView) {
          const originalGetComputedStyle = clonedDoc.defaultView.getComputedStyle;
          clonedDoc.defaultView.getComputedStyle = function(el: Element, pseudoElt?: string) {
            const style = originalGetComputedStyle.call(clonedDoc.defaultView, el, pseudoElt);
            return new Proxy(style, {
              get(target: any, prop: string | symbol, receiver: any) {
                if (prop === 'getPropertyValue') {
                  return function(propertyName: string) {
                    const val = target.getPropertyValue(propertyName);
                    if (typeof val === 'string' && val.includes('oklch')) {
                      return convertOklchToRgb(val);
                    }
                    return val;
                  };
                }
                const val = Reflect.get(target, prop, receiver);
                if (typeof val === 'string' && val.includes('oklch')) {
                  return convertOklchToRgb(val);
                }
                return val;
              }
            }) as CSSStyleDeclaration;
          };
        }
      } catch (e) {
        console.warn("Failed to override getComputedStyle:", e);
      }

      if (originalOnClone) {
        originalOnClone(clonedDoc, clonedEl);
      }
    };

    return html2canvas(element, options);
  };

  const handleExportPlanDeChargePDF = async (filteredProjects: Project[]) => {
    const filters = {
      annee: planDeChargeAnnee,
      pole: planDeChargePole,
      direction: planDeChargeDirection,
      wilaya: planDeChargeWilaya,
      phase: planDeChargeFilter,
      search: planDeChargeSearch,
      objectif: planDeChargeObjectif
    };
    const htmlContent = generatePlanDeChargeHtml(filteredProjects, filters);
    
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.style.width = "800px";
    tempDiv.style.padding = "30px";
    tempDiv.style.backgroundColor = "#ffffff";
    tempDiv.style.color = "#1e293b";
    tempDiv.style.fontFamily = "'Segoe UI', system-ui, sans-serif";
    
    tempDiv.innerHTML = `
      <style>
        table { border-collapse: collapse; width: 100%; margin-top: 15px; margin-bottom: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 8.5pt; }
        th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-right { text-align: right; }
        h1, h2, h3, h4 { color: #1e3a8a; }
      </style>
      ${htmlContent}
    `;
    
    document.body.appendChild(tempDiv);
    
    try {
      const canvas = await safeHtml2Canvas(tempDiv, {
        scale: 1.8,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Plan_de_Charge_Sonelgaz_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const handleExportActivePanePDF = async () => {
    const element = document.getElementById("current-content-pane");
    if (!element) {
      alert("Impossible de trouver la section de contenu active à exporter.");
      return;
    }
    
    const activeModuleNames: Record<string, string> = {
      charge: "Plan_de_Charge",
      gestion: "Gestion_Projet",
      dashboard: "Tableau_de_Bord",
      report: "Rapport_Mensuel",
      bordereau: "Bordereau_Prix"
    };
    
    const moduleName = activeModuleNames[activeModule] || "Page";
    const fileName = `${moduleName}_Sonelgaz_${new Date().toISOString().split('T')[0]}.pdf`;
    
    try {
      const canvas = await safeHtml2Canvas(element, {
        scale: 1.8,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 1200
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating page PDF:", error);
      alert("Une erreur est survenue lors de la génération du PDF de la page.");
    }
  };

  // Helper to generate full single project sheet (Fiche Projet)
  const generateFicheProjetHtml = (p: Project) => {
    const formatFrDate = (dStr: string) => {
      if (!dStr) return "Non planifiée / Non renseignée";
      try {
        const parts = dStr.split("-");
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dStr;
      } catch {
        return dStr;
      }
    };

    const getContractHtml = (title: string, c?: ContractDetails) => {
      if (!c || !c.nom) return `<p style="font-size: 9.5pt; font-style: italic; color: #64748b; margin: 5px 0;">Aucun contrat affecté pour ${title}.</p>`;
      return `
        <table style="width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 10px;">
          <tr style="background-color: #f8fafc;">
            <th colspan="2" style="border: 1px solid #cbd5e1; padding: 5px; font-size: 9pt; text-align: left; color: #1e3a8a;">Contrat : ${title}</th>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 5px; font-size: 8.5pt; width: 35%;"><strong style="color: #475569;">Prestataire / Entreprise :</strong></td>
            <td style="border: 1px solid #cbd5e1; padding: 5px; font-size: 8.5pt; font-weight: bold; color: #1e293b;">${c.nom}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Référence contrat :</strong></td>
            <td style="border: 1px solid #cbd5e1; padding: 5px; font-size: 8.5pt; font-family: monospace;">${c.ref || "N/A"}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Montant :</strong></td>
            <td style="border: 1px solid #cbd5e1; padding: 5px; font-size: 8.5pt; font-weight: bold;">${c.montant || "N/A"}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Date signature :</strong></td>
            <td style="border: 1px solid #cbd5e1; padding: 5px; font-size: 8.5pt;">${formatFrDate(c.date)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Date ODS (Ordre de Service) :</strong></td>
            <td style="border: 1px solid #cbd5e1; padding: 5px; font-size: 8.5pt;">${formatFrDate(c.ods)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Taux d'avancement :</strong></td>
            <td style="border: 1px solid #cbd5e1; padding: 5px; font-size: 8.5pt; font-weight: bold; color: #2563eb;">${c.avancement || 0}%</td>
          </tr>
        </table>
      `;
    };

    const hasPiquage = p.identity.caracteristiques?.hasPiquage ? "Oui" : "Non";
    const hasGareDep = p.identity.caracteristiques?.hasGareRacleurDepart ? "Oui" : "Non";
    const hasGareArr = p.identity.caracteristiques?.hasGareRacleurArrivee ? "Oui" : "Non";
    const hasCoupure = p.identity.caracteristiques?.hasPosteCoupure ? `Oui (${p.identity.caracteristiques?.nbPostesCoupure || 1} poste(s))` : "Non";
    const hasSect = p.identity.caracteristiques?.hasPosteSectionnement ? `Oui (${p.identity.caracteristiques?.nbPostesSectionnement || 1} poste(s))` : "Non";
    const hasDet = p.identity.caracteristiques?.hasPosteDetente ? "Oui" : "Non";

    // Docs archives list
    let docsHtml = "";
    if (p.miseEnGazArchive.documentsArchives && p.miseEnGazArchive.documentsArchives.length > 0) {
      docsHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: left;">Nom du Document</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: left;">Catégorie</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: left;">Date d'ajout</th>
            </tr>
          </thead>
          <tbody>
      `;
      p.miseEnGazArchive.documentsArchives.forEach(doc => {
        docsHtml += `
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-weight: bold; color: #1e293b;">📄 ${doc.name}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; color: #475569;">${doc.category}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-family: monospace; color: #64748b;">${formatFrDate(doc.addedAt?.substring(0, 10) || "")}</td>
          </tr>
        `;
      });
      docsHtml += `</tbody></table>`;
    } else {
      docsHtml = `<p style="font-size: 9pt; font-style: italic; color: #64748b;">Aucun document archivé dans le dossier technique.</p>`;
    }

    // Follow-up administrative card (Fiche de suivi) details if present
    let ficheSuiviHtml = "";
    if (p.ficheSuivi) {
      const fs = p.ficheSuivi;
      ficheSuiviHtml = `
        <div style="background-color: #fafafa; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-top: 10px;">
          <h4 style="margin-top: 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; color: #1e3a8a; font-size: 10pt; font-weight: bold;">📋 Données Complémentaires de Suivi (DETN)</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt; width: 30%;"><strong style="color: #475569;">Type de Programme :</strong></td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;">${fs.typeProgramme || "Non spécifié"}</td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt; width: 30%;"><strong style="color: #475569;">Type de Poste :</strong></td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;">${fs.typePoste || "Non spécifié"}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Ligne en ML :</strong></td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;">${fs.ligneMl || "Non spécifié"}</td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Nature du Terrain :</strong></td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;">${fs.natureTerrain || "Non spécifié"}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Demande GEF :</strong></td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;">Date: ${formatFrDate(fs.demandeGefDate)} / Cabinet: ${fs.gefCabinet || "N/A"}</td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Choix Terrain :</strong></td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;">${formatFrDate(fs.choixTerrainDate)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Type de dépôt dossier :</strong></td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;">${fs.depotDossierType || "N/A"}</td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Date d'enquête publique :</strong></td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;">${formatFrDate(fs.impactOuvertureEnqueteDate)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Impact Assujettis :</strong></td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;">${fs.impactAssujettis || "N/A"}</td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Dépôt d'étude impact :</strong></td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;">${fs.impactDepotEtude || "N/A"}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">ODS Bureau d'Étude :</strong></td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;">${fs.impactBetOds || "N/A"}</td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Indemnisation cultures :</strong></td>
              <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;">Quittances PV: ${fs.servitudeQuittancesPv || "N/A"} / Date: ${formatFrDate(fs.servitudeQuittancesDate)}</td>
            </tr>
          </table>
        </div>
      `;
    }

    // Quality checks status
    const qc = p.travauxPlanification?.controleQualiteChecklist;
    let qcHtml = "";
    if (qc) {
      qcHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background-color: #f8fafc;">
            <th style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: left; width: 70%;">Point de Contrôle Qualité</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: center;">Statut de Conformité</th>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">Abaque de soudage validé par l'organisme de contrôle</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: center; font-weight: bold; color: ${qc.abaqueSoudageValide ? "#047857" : "#be123c"}">${qc.abaqueSoudageValide ? "CONFORME" : "NON VALIDÉ"}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">Contrôles Non Destructifs (CND / Radiographie 100% des joints)</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: center; font-weight: bold; color: ${qc.radiographieCND ? "#047857" : "#be123c"}">${qc.radiographieCND ? "EFFECTUÉ & OK" : "EN ATTENTE / REJET"}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">Vérification de l'enrobage de la conduite au balai électrique</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: center; font-weight: bold; color: ${qc.enrobageVerifie ? "#047857" : "#be123c"}">${qc.enrobageVerifie ? "VÉRIFIÉ (SANS DÉFAUT)" : "NON VÉRIFIÉ"}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">Lit de pose sableux et remblayage conformément aux normes</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: center; font-weight: bold; color: ${qc.litPoseSableux ? "#047857" : "#be123c"}">${qc.litPoseSableux ? "RÉALISÉ" : "NON CONFORME"}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">Installation du système de protection cathodique (provisoire/définitif)</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: center; font-weight: bold; color: ${qc.protectionCathodique ? "#047857" : "#be123c"}">${qc.protectionCathodique ? "OPÉRATIONNEL" : "NON VALIDÉ / MANQUANT"}</td>
          </tr>
        </table>
      `;
    }

    return `
      <!-- PAGE 1: PAGE DE GARDE -->
      <div style="height: 800px; border: 4px double #1e3a8a; padding: 40px; margin-bottom: 40px;">
        <div style="text-align: center;">
          <h3 style="color: #1e3a8a; font-size: 14pt; font-weight: bold; margin: 0; text-transform: uppercase;">SONELGAZ - TRANSPORT GAZ</h3>
          <p style="font-size: 10pt; color: #475569; margin: 5px 0 0 0; font-weight: bold;">DIVISION ENGINEERING ET TRAVAUX NEUFS (DETN)</p>
          <p style="font-size: 9pt; color: #64748b; margin: 2px 0 0 0;">Département de Suivi d'Ingénierie & de Réalisation</p>
        </div>
        
        <div style="text-align: center; margin-top: 150px; margin-bottom: 150px;">
          <p style="font-size: 11pt; color: #ef4444; font-weight: bold; text-transform: uppercase; margin: 0 0 10px 0;">FICHE PROJET DE L'OUVRAGE</p>
          <h1 style="color: #1e3a8a; font-size: 26pt; font-weight: bold; line-height: 1.2; border: none; padding: 0; margin: 0;">${p.name}</h1>
          <div style="width: 150px; height: 3px; background-color: #2563eb; margin: 20px auto;"></div>
          <p style="font-size: 12pt; font-weight: bold; color: #475569; margin: 0;">DOSSIER TECHNIQUE CENTRALISÉ MULTI-PHASES</p>
          <p style="font-size: 10pt; font-style: italic; color: #64748b; margin-top: 5px;">De la Planification jusqu'à la Mise en Gaz</p>
        </div>

        <div style="border-top: 2px solid #cbd5e1; padding-top: 20px;">
          <table style="width: 100%; border: none; margin: 0; border-collapse: collapse;">
            <tr style="border: none;">
              <td style="border: none; padding: 4px; font-size: 10pt; width: 50%;"><strong style="color: #1e3a8a;">Pôle TG :</strong> ${p.identity.pole || "N/A"}</td>
              <td style="border: none; padding: 4px; font-size: 10pt; width: 50%;"><strong style="color: #1e3a8a;">Région / Direction :</strong> ${p.identity.region || "N/A"}</td>
            </tr>
            <tr style="border: none;">
              <td style="border: none; padding: 4px; font-size: 10pt;"><strong style="color: #1e3a8a;">Wilaya d'implantation :</strong> ${p.identity.wilaya || "N/A"}</td>
              <td style="border: none; padding: 4px; font-size: 10pt;"><strong style="color: #1e3a8a;">Phase Actuelle :</strong> ${p.identity.phase}</td>
            </tr>
            <tr style="border: none;">
              <td style="border: none; padding: 4px; font-size: 10pt;"><strong style="color: #1e3a8a;">Chef de Projet (Travaux) :</strong> ${p.chefDeProjetName || "Non spécifié"}</td>
              <td style="border: none; padding: 4px; font-size: 10pt;"><strong style="color: #1e3a8a;">Superviseur :</strong> ${p.superviseurName || "Non spécifié"}</td>
            </tr>
          </table>
          <p style="font-size: 8.5pt; color: #94a3b8; text-align: center; margin-top: 40px;">Document édité par la plateforme numérique • Généré le ${new Date().toLocaleDateString('fr-FR')} • Traçabilité par base de données Firestore</p>
        </div>
      </div>

      <!-- PAGE BREAK -->
      <div style="page-break-before: always;"></div>

      <!-- PAGE 2: PLANIFICATION & PLANNING -->
      <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; margin-top: 0; font-size: 15pt;">00. Planification Temporelle & Calendrier</h2>
      
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
        <table style="width: 100%; border: none; margin: 0; border-collapse: collapse;">
          <tr style="border: none;">
            <td style="border: none; padding: 2px; font-size: 9.5pt; width: 33%;"><strong style="color: #1e3a8a;">Avancement Physique Global :</strong> <span style="font-size: 12pt; font-weight: bold; color: #2563eb;">${p.travauxPlanification?.avancementPhysique || 0}%</span></td>
            <td style="border: none; padding: 2px; font-size: 9.5pt; width: 33%;"><strong style="color: #047857;">Avancement Génie Civil :</strong> <span style="font-size: 12pt; font-weight: bold; color: #047857;">${p.travauxPlanification?.avancementGC || 0}%</span></td>
            <td style="border: none; padding: 2px; font-size: 9.5pt; width: 33%;"><strong style="color: #7c3aed;">Avancement Mécanique :</strong> <span style="font-size: 12pt; font-weight: bold; color: #7c3aed;">${p.travauxPlanification?.avancementMeca || 0}%</span></td>
          </tr>
        </table>
      </div>

      <h3 style="color: #1e293b; font-size: 11pt; font-weight: bold; margin-bottom: 5px;">Dates Planifiées de Réalisation</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: left; width: 40%;">Phase de l'Ouvrage</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: left; width: 30%;">Date de Début Prévue</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: left; width: 30%;">Date de Fin Prévue</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-weight: bold;">01 • Phase Étude & Approuvage</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-family: monospace;">${formatFrDate(p.planning?.etudeStart)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-family: monospace;">${formatFrDate(p.planning?.etudeEnd)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-weight: bold;">02 • Travaux de Construction & Pose</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-family: monospace;">${formatFrDate(p.planning?.travauxStart)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-family: monospace;">${formatFrDate(p.planning?.travauxEnd)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-weight: bold;">03 • Essais Réglementaires (Résistance/Étanchéité)</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-family: monospace;">${formatFrDate(p.planning?.essaisStart)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-family: monospace;">${formatFrDate(p.planning?.essaisEnd)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-weight: bold;">04 • Mise en Gaz et Commissioning</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-family: monospace;">${formatFrDate(p.planning?.gazStart)}</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-family: monospace;">${formatFrDate(p.planning?.gazEnd)}</td>
          </tr>
        </tbody>
      </table>

      <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; margin-top: 30px; font-size: 15pt;">01. Identité Technique & Consistance Physique</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; width: 30%; background-color: #f8fafc;"><strong style="color: #475569;">Wilaya :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">${p.identity.wilaya || "N/A"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; width: 30%; background-color: #f8fafc;"><strong style="color: #475569;">Pôle d'Appartenance :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">${p.identity.pole || "N/A"}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; background-color: #f8fafc;"><strong style="color: #475569;">Direction de transport :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">${p.identity.region || "N/A"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; background-color: #f8fafc;"><strong style="color: #475569;">District d'Exploitation :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">${p.identity.district || "N/A"}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; background-color: #f8fafc;"><strong style="color: #475569;">Cadre d'Inscription :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">${p.identity.cadreInscription || "N/A"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; background-color: #f8fafc;"><strong style="color: #475569;">Structure Chargée :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">${p.identity.structureChargee || "N/A"}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; background-color: #f8fafc;"><strong style="color: #475569;">Diamètre Conduite :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-weight: bold;">${p.identity.caracteristiques?.diametre || "N/A"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; background-color: #f8fafc;"><strong style="color: #475569;">Longueur Linéaire :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-weight: bold;">${getProjectDisplayLength(p) !== "0" ? `${getProjectDisplayLength(p)} km` : "N/A"}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; background-color: #f8fafc;"><strong style="color: #475569;">Pression de calcul (MOP) :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-family: monospace;">${p.identity.caracteristiques?.pression || "N/A"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; background-color: #f8fafc;"><strong style="color: #475569;">Type de Conduite :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">${p.identity.caracteristiques?.typeTuyau || "Acier revêtu"}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; background-color: #f8fafc;"><strong style="color: #475569;">Capacité de Poste (Débit) :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-family: monospace;" colspan="3">${p.identity.caracteristiques?.capacitePoste || "N/A"}</td>
        </tr>
      </table>

      <h3 style="color: #1e293b; font-size: 11pt; font-weight: bold; margin-top: 15px; margin-bottom: 5px;">Composition & Organes Accessoires de l'Ouvrage</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: left; width: 70%;">Élément de Réseau / Organe de Sécurité</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: center; width: 30%;">Présence effective</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">Piquage sur Conduite existante</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: center; font-weight: bold; color: ${p.identity.caracteristiques?.hasPiquage ? "#2563eb" : "#64748b"}">${hasPiquage}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">Gare de Racleur de Départ</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: center; font-weight: bold; color: ${p.identity.caracteristiques?.hasGareRacleurDepart ? "#2563eb" : "#64748b"}">${hasGareDep}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">Gare de Racleur d'Arrivée</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: center; font-weight: bold; color: ${p.identity.caracteristiques?.hasGareRacleurArrivee ? "#2563eb" : "#64748b"}">${hasGareArr}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">Poste(s) de Coupure de Ligne</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: center; font-weight: bold; color: ${p.identity.caracteristiques?.hasPosteCoupure ? "#2563eb" : "#64748b"}">${hasCoupure}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">Poste(s) de Sectionnement Intermédiaire</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: center; font-weight: bold; color: ${p.identity.caracteristiques?.hasPosteSectionnement ? "#2563eb" : "#64748b"}">${hasSect}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">Poste de Détente / Livraison de Gaz</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; text-align: center; font-weight: bold; color: ${p.identity.caracteristiques?.hasPosteDetente ? "#2563eb" : "#64748b"}">${hasDet}</td>
          </tr>
        </tbody>
      </table>

      <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="margin-top: 0; margin-bottom: 5px; color: #9f1239; font-size: 9.5pt; font-weight: bold;">🚨 Contrainte Majeure Répertoriée :</h4>
        <p style="margin: 0; font-size: 9pt; color: #be123c;">
          ${p.identity.contraintes && p.identity.contraintes.trim().length > 0 ? p.identity.contraintes : "Aucune contrainte majeure à ce jour. Le passage est libre et les accès sécurisés."}
        </p>
      </div>

      <!-- PAGE BREAK -->
      <div style="page-break-before: always;"></div>

      <!-- PAGE 3: ÉTUDE & AUTORISATIONS -->
      <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; margin-top: 0; font-size: 15pt;">02. Section Études & Autorisations Administratives</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; width: 30%; background-color: #f8fafc;"><strong style="color: #475569;">Statut d'Approbation de l'Étude :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-weight: bold; color: #1e3a8a;">${p.etudeAutorisation?.statutEtude || "En cours"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; width: 30%; background-color: #f8fafc;"><strong style="color: #475569;">Permis de Construire :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-weight: bold;">
            ${p.etudeAutorisation?.statutPermisConstruire || "Non déposé"} ${p.etudeAutorisation?.datePermisConstruire ? `(reçu le ${formatFrDate(p.etudeAutorisation.datePermisConstruire)})` : ""}
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; background-color: #f8fafc;"><strong style="color: #475569;">Arrêté de Servitude :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">${p.etudeAutorisation?.statutArreteServitude || "Non lancé"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; background-color: #f8fafc;"><strong style="color: #475569;">Référence Arrêté :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-family: monospace;">${p.etudeAutorisation?.arreteServitudeRef || "N/A"}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; background-color: #f8fafc;"><strong style="color: #475569;">Cabinet Expert Foncier (GEF) :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">
            ${p.etudeAutorisation?.expertiseFonciere?.gefDesignated ? `Désigné : ${p.etudeAutorisation.expertiseFonciere.gefIdentity || "N/A"}` : "Non désigné"}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; background-color: #f8fafc;"><strong style="color: #475569;">Demande d'Acquisition :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt;">
            ${p.etudeAutorisation?.expertiseFonciere?.acquisitionDemandEstablished ? "Établie & En cours" : "Non établie"}
          </td>
        </tr>
      </table>

      ${ficheSuiviHtml}

      <h3 style="color: #1e293b; font-size: 11pt; font-weight: bold; margin-top: 20px; margin-bottom: 5px;">Bureau d'Études & Experts Foncier Contractés</h3>
      <div style="margin-bottom: 20px;">
        ${getContractHtml("Bureau d'Étude Technique", p.contrats?.bureauEtude)}
        ${getContractHtml("Expert Foncier Mandataire", p.contrats?.expert)}
      </div>

      <!-- PAGE BREAK -->
      <div style="page-break-before: always;"></div>

      <!-- PAGE 4: SECTION TRAVAUX -->
      <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; margin-top: 0; font-size: 15pt;">03. Section Travaux & Entreprises de Réalisation</h2>
      
      <h3 style="color: #1e293b; font-size: 11pt; font-weight: bold; margin-top: 15px; margin-bottom: 5px;">Entreprises de Construction (Génie Civil & Mécanique)</h3>
      <div style="margin-bottom: 15px;">
        ${getContractHtml("Entreprise Génie Civil (Pose Conduites)", p.contrats?.etbGC)}
        ${getContractHtml("Entreprise Pose Mécanique & Équipement Postes", p.contrats?.etbMeca)}
      </div>

      <h3 style="color: #1e293b; font-size: 11pt; font-weight: bold; margin-top: 20px; margin-bottom: 5px;">Contrôle Qualité & Conformité Technique</h3>
      ${qcHtml}

      <div style="background-color: #fafafa; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-top: 20px;">
        <h4 style="margin-top: 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; color: #1e3a8a; font-size: 10pt; font-weight: bold;">🔬 Essais d'Épreuves Hydrauliques & Organisme de Contrôle</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt; width: 40%;"><strong style="color: #475569;">Organisme Contrôleur Agréé :</strong></td>
            <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt; font-weight: bold;">${p.travauxPlanification?.essaisReglementaires?.organismeControleur || "VERITAL / Autre"}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Épreuve de Résistance (Hydraulique) :</strong></td>
            <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt; font-weight: bold; color: ${p.travauxPlanification?.essaisReglementaires?.epreuveResistance === "Réussie" ? "#047857" : "#d97706"}">
              ${p.travauxPlanification?.essaisReglementaires?.epreuveResistance || "Non faite"}
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt;"><strong style="color: #475569;">Épreuve d'Étanchéité (Gaz/Air sous pression) :</strong></td>
            <td style="border: 1px solid #e2e8f0; padding: 5px; font-size: 8.5pt; font-weight: bold; color: ${p.travauxPlanification?.essaisReglementaires?.epreuveEtancheite === "Réussie" ? "#047857" : "#d97706"}">
              ${p.travauxPlanification?.essaisReglementaires?.epreuveEtancheite || "Non faite"}
            </td>
          </tr>
        </table>
      </div>

      <!-- PAGE BREAK -->
      <div style="page-break-before: always;"></div>

      <!-- PAGE 5: MISE EN GAZ & ARCHIVE -->
      <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; margin-top: 0; font-size: 15pt;">04. Mise en Gaz (Mise en Service) & Archivage</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; width: 45%; background-color: #f8fafc;"><strong style="color: #475569;">Statut Opérationnel de Mise en Gaz :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-weight: bold; color: #1565c0;">${p.miseEnGazArchive?.statutMiseEnGaz || "Non planifiée"}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; background-color: #f8fafc;"><strong style="color: #475569;">Date Effective de la Mise en Service :</strong></td>
          <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8.5pt; font-weight: bold; color: #1e293b;">${formatFrDate(p.miseEnGazArchive?.dateEffectiveMiseEnGaz)}</td>
        </tr>
      </table>

      <h3 style="color: #1e293b; font-size: 11pt; font-weight: bold; margin-bottom: 5px;">Dossier As-Built / Archives Techniques Numériques</h3>
      ${docsHtml}

      <div style="margin-top: 100px; border-top: 1px solid #cbd5e1; padding-top: 20px;">
        <table style="width: 100%; border: none; border-collapse: collapse;">
          <tr style="border: none;">
            <td style="border: none; text-align: left; font-size: 9pt; width: 50%;">
              <p style="margin: 0;"><strong style="color: #475569;">Signature du Chef de Projet :</strong></p>
              <br><br><br>
              <p style="margin: 0; font-size: 8.5pt; color: #64748b;">M. ${p.chefDeProjetName || "..................................."}</p>
            </td>
            <td style="border: none; text-align: right; font-size: 9pt; width: 50%;">
              <p style="margin: 0;"><strong style="color: #475569;">Signature du Chef de Département (DETN) :</strong></p>
              <br><br><br>
              <p style="margin: 0; font-size: 8.5pt; color: #64748b;">Pour approbation officielle</p>
            </td>
          </tr>
        </table>
      </div>
    `;
  };

  const handlePrintFicheProjet = (project: Project) => {
    const htmlContent = generateFicheProjetHtml(project);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Fiche Projet - ${project.name}</title>
            <style>
              body { padding: 40px; font-family: 'Segoe UI', system-ui, sans-serif; background-color: #fff; color: #1e293b; line-height: 1.4; }
              table { border-collapse: collapse; width: 100%; margin-top: 12px; margin-bottom: 12px; }
              th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; font-size: 8.5pt; }
              th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .text-right { text-align: right; }
              .page-break { page-break-before: always; }
              @media print {
                .page-break { page-break-before: always; }
              }
            </style>
          </head>
          <body>
            ${htmlContent}
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      win.document.close();
    } else {
      alert("Veuillez autoriser les popups pour pouvoir imprimer la fiche projet.");
    }
  };

  const handleExportFicheProjetWord = (project: Project) => {
    const htmlContent = generateFicheProjetHtml(project);
    downloadAsWord(htmlContent, `Fiche_Projet_${project.name.replace(/\s+/g, "_")}.doc`);
  };

  const handleExportFicheProjetPDF = async (project: Project) => {
    const htmlContent = generateFicheProjetHtml(project);
    
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.style.width = "800px";
    tempDiv.style.padding = "30px";
    tempDiv.style.backgroundColor = "#ffffff";
    tempDiv.style.color = "#1e293b";
    tempDiv.style.fontFamily = "'Segoe UI', system-ui, sans-serif";
    
    tempDiv.innerHTML = `
      <style>
        table { border-collapse: collapse; width: 100%; margin-top: 15px; margin-bottom: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 8.5pt; }
        th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-right { text-align: right; }
        h1, h2, h3, h4 { color: #1e3a8a; }
      </style>
      ${htmlContent}
    `;
    
    document.body.appendChild(tempDiv);
    
    try {
      const canvas = await safeHtml2Canvas(tempDiv, {
        scale: 1.8,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Fiche_Projet_${project.name.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const updateProjectContractField = async (contractKey: 'bureauEtude' | 'betEnvironnement' | 'expert' | 'etbGC' | 'etbMeca', field: string, value: any, lotId?: string) => {
    if (!selectedProject?.id) return;
    const emptyContractObj = { nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0, delai: "", postesAffectes: "" };
    const currentContrats = selectedProject.contrats || {};
    const currentContractKeyObj = (currentContrats as any)[contractKey] || emptyContractObj;
    
    const updatedContrats = {
      ...currentContrats,
      [contractKey]: {
        ...currentContractKeyObj,
        [field]: value
      }
    };

    const updatePayload: any = {
      contrats: updatedContrats,
      updatedAt: new Date().toISOString()
    };

    if (contractKey === 'expert' && field === 'nom') {
      updatePayload.ficheSuivi = {
        ...(selectedProject.ficheSuivi || {}),
        gefCabinet: value
      };
      updatePayload.etudeAutorisation = {
        ...(selectedProject.etudeAutorisation || {}),
        expertiseFonciere: {
          ...(selectedProject.etudeAutorisation?.expertiseFonciere || {}),
          gefIdentity: value,
          gefDesignated: !!value
        }
      };
    } else if (contractKey === 'bureauEtude' && field === 'nom') {
      updatePayload.ficheSuivi = {
        ...(selectedProject.ficheSuivi || {}),
        etudeBetCabinet: value
      };
    }

    if (selectedProject.lots && selectedProject.lots.length > 0) {
      const updatedLots = selectedProject.lots.map(l => {
        if (!lotId || l.id === lotId) {
          const lContrats = l.contrats || {};
          const newContractKeyObj = {
            ...((lContrats as any)[contractKey] || emptyContractObj),
            [field]: value
          };
          const updatedLContrats = {
            ...lContrats,
            [contractKey]: newContractKeyObj
          };

          const avGC = contractKey === 'etbGC' && field === 'avancement' ? Number(value) : ((updatedLContrats as any).etbGC?.avancement ?? l.avancementGC ?? 0);
          const avMeca = contractKey === 'etbMeca' && field === 'avancement' ? Number(value) : ((updatedLContrats as any).etbMeca?.avancement ?? l.avancementMeca ?? 0);
          const avPhys = Math.round((avGC + avMeca) / 2);

          return {
            ...l,
            avancementGC: avGC,
            avancementMeca: avMeca,
            avancementPhysique: avPhys,
            contrats: updatedLContrats
          };
        }
        return l;
      });

      const totalLength = updatedLots.reduce((sum, l) => sum + (parseFloat(l.longueur || "0") || 1), 0);
      let weightedGC = 0, weightedMeca = 0, weightedPhys = 0;
      updatedLots.forEach(l => {
        const w = (parseFloat(l.longueur || "0") || 1) / totalLength;
        weightedGC += (l.avancementGC || 0) * w;
        weightedMeca += (l.avancementMeca || 0) * w;
        weightedPhys += (l.avancementPhysique || 0) * w;
      });

      updatePayload.travauxPlanification = {
        ...(selectedProject.travauxPlanification || {}),
        avancementGC: Math.round(weightedGC),
        avancementMeca: Math.round(weightedMeca),
        avancementPhysique: Math.round(weightedPhys)
      };

      updatePayload.lots = updatedLots;
    } else {
      const avGC = contractKey === 'etbGC' && field === 'avancement' ? Number(value) : ((updatedContrats as any).etbGC?.avancement || 0);
      const avMeca = contractKey === 'etbMeca' && field === 'avancement' ? Number(value) : ((updatedContrats as any).etbMeca?.avancement || 0);
      updatePayload.travauxPlanification = {
        ...(selectedProject.travauxPlanification || {}),
        avancementGC: avGC,
        avancementMeca: avMeca,
        avancementPhysique: Math.round((avGC + avMeca) / 2)
      };
    }

    try {
      await setDoc(doc(db, "projects", selectedProject.id), updatePayload, { merge: true });
    } catch (err) {
      console.error("Error updating contract field:", err);
    }
  };

  const generateGenesisHtml = (p: Project): string => {
    const milestones = getGenesisMilestones(p);
    let html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 3px solid #e30613; padding-bottom: 15px; margin-bottom: 25px;">
          <h1 style="color: #004d9a; margin: 0; font-size: 22pt; font-weight: bold; text-transform: uppercase;">SONELGAZ</h1>
          <h2 style="color: #475569; margin: 5px 0 0 0; font-size: 14pt; font-weight: bold;">Genèse & Chronologie de l'Ouvrage</h2>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse; border: none;">
            <tr style="border: none;">
              <td style="border: none; font-weight: bold; color: #64748b; font-size: 10pt; width: 25%; padding: 4px 0;">Ouvrage :</td>
              <td style="border: none; font-weight: bold; color: #0f172a; font-size: 11pt; padding: 4px 0;">${p.name}</td>
            </tr>
            <tr style="border: none;">
              <td style="border: none; font-weight: bold; color: #64748b; font-size: 10pt; padding: 4px 0;">Wilaya / Pôle :</td>
              <td style="border: none; color: #334155; font-size: 10pt; padding: 4px 0;">${p.identity?.wilaya || 'N/A'} / ${p.identity?.pole || 'N/A'}</td>
            </tr>
            <tr style="border: none;">
              <td style="border: none; font-weight: bold; color: #64748b; font-size: 10pt; padding: 4px 0;">Direction de Région :</td>
              <td style="border: none; color: #334155; font-size: 10pt; padding: 4px 0;">${p.identity?.region || 'N/A'}</td>
            </tr>
            <tr style="border: none;">
              <td style="border: none; font-weight: bold; color: #64748b; font-size: 10pt; padding: 4px 0;">Phase Actuelle :</td>
              <td style="border: none; color: #334155; font-size: 10pt; padding: 4px 0;">
                <span style="background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; border-radius: 6px; padding: 2px 8px; font-size: 9pt; font-weight: bold;">
                  ${p.identity?.phase || 'N/A'}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <h3 style="color: #004d9a; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 20px; font-size: 14pt; font-weight: bold;">
          Étapes Chronologiques (Timeline)
        </h3>
    `;

    milestones.forEach((m: any, idx: number) => {
      const isCompleted = m.status === "completed";
      const isCurrent = m.status === "current";
      const statusLabel = isCompleted ? "Validé" : (isCurrent ? "En cours" : "En attente");
      const statusColor = isCompleted ? "#16a34a" : (isCurrent ? "#2563eb" : "#64748b");
      const statusBg = isCompleted ? "#f0fdf4" : (isCurrent ? "#eff6ff" : "#f8fafc");
      const statusBorder = isCompleted ? "#bbf7d0" : (isCurrent ? "#bfdbfe" : "#e2e8f0");

      html += `
        <div style="margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #f1f5f9; padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">
            <table style="width: 100%; border: none; border-collapse: collapse;">
              <tr style="border: none;">
                <td style="border: none; font-size: 11pt; font-weight: bold; color: #1e3a8a; padding: 0;">
                  ${idx + 1}. ${m.title}
                </td>
                <td style="border: none; text-align: right; padding: 0;">
                  <span style="background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; border-radius: 6px; padding: 2px 8px; font-size: 8.5pt; font-weight: bold;">
                    ${statusLabel} ${m.date && m.date !== "Non renseignée" ? ` - Le ${formatDateFrench(m.date)}` : ''}
                  </span>
                </td>
              </tr>
            </table>
          </div>
          <div style="padding: 15px;">
            <p style="margin: 0 0 12px 0; font-size: 9.5pt; color: #475569; line-height: 1.5; font-style: italic;">
              ${m.description}
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
              <thead>
                <tr style="background-color: #f8fafc;">
                  <th style="border: 1px solid #e2e8f0; padding: 6px 10px; font-size: 8.5pt; text-align: left; font-weight: bold; color: #475569; width: 40%;">Indicateur / Attribut</th>
                  <th style="border: 1px solid #e2e8f0; padding: 6px 10px; font-size: 8.5pt; text-align: left; font-weight: bold; color: #475569;">Valeur Enregistrée</th>
                </tr>
              </thead>
              <tbody>
      `;

      m.details.forEach((det: any) => {
        const hasVal = det.value && det.value !== "Non renseignée" && det.value !== "Non spécifiée" && det.value !== "Non défini" && det.value !== "Non définie" && det.value !== "Non lancée" && det.value !== "Non déposé" && det.value !== "Non déposée" && det.value !== "Non obtenue" && det.value !== "Non désigné";
        const displayVal = hasVal ? det.value : "Non renseigné (N/A)";
        html += `
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 6px 10px; font-size: 9pt; color: #64748b; font-weight: bold;">${det.label}</td>
            <td style="border: 1px solid #e2e8f0; padding: 6px 10px; font-size: 9pt; color: #0f172a; font-weight: ${hasVal ? 'bold' : 'normal'};">${displayVal}</td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    });

    html += `
        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #cbd5e1; padding-top: 10px;">
          <p style="font-size: 8pt; color: #94a3b8; margin: 0;">Rapport d'avancement généré automatiquement - Direction de Transport de Gaz (TG)</p>
        </div>
      </div>
    `;
    return html;
  };

  const handleExportGenesisWord = (project: Project) => {
    const htmlContent = generateGenesisHtml(project);
    downloadAsWord(htmlContent, `Genese_Projet_${project.name.replace(/\s+/g, "_")}.doc`);
  };

  const handleExportGenesisPDF = async (project: Project) => {
    const htmlContent = generateGenesisHtml(project);
    
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.style.width = "800px";
    tempDiv.style.padding = "30px";
    tempDiv.style.backgroundColor = "#ffffff";
    tempDiv.style.color = "#1e293b";
    tempDiv.style.fontFamily = "'Segoe UI', system-ui, sans-serif";
    
    tempDiv.innerHTML = `
      <style>
        table { border-collapse: collapse; width: 100%; margin-top: 15px; margin-bottom: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 8.5pt; }
        th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .text-right { text-align: right; }
        h1, h2, h3, h4 { color: #1e3a8a; }
      </style>
      ${htmlContent}
    `;
    
    document.body.appendChild(tempDiv);
    
    try {
      const canvas = await safeHtml2Canvas(tempDiv, {
        scale: 1.8,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Genese_Projet_${project.name.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Error exporting Genesis PDF:", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  // Upload custom KML/KMZ file for a project
  const handleUploadKMZ = async (e: React.ChangeEvent<HTMLInputElement>, project: Project) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canEditProject(project)) {
      alert("Accès refusé: Vous n'avez pas le privilège de modification pour cet ouvrage (Projet non pris en charge ou compte en lecture seule).");
      return;
    }

    if (file.size > 800 * 1024) {
      alert("Le fichier est trop volumineux. La taille maximale autorisée est de 800 Ko.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      try {
        const projectRef = doc(db, "projects", project.id);
        const updatedProject = {
          ...project,
          identity: {
            ...project.identity,
            kmzFileName: file.name,
            kmzFileData: result
          }
        };
        // Remove id from document body before setDoc
        delete (updatedProject as any).id;

        await setDoc(projectRef, updatedProject);
        alert(`Le fichier ${file.name} a été chargé avec succès !`);
      } catch (err) {
        console.error("Error uploading KML/KMZ:", err);
        alert("Une erreur s'est produite lors de l'enregistrement du fichier.");
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete custom KML/KMZ file and revert to auto-generated KML
  const handleDeleteKMZ = async (project: Project) => {
    if (!canEditProject(project)) {
      alert("Accès refusé: Vous n'avez pas le privilège de modification pour cet ouvrage (Projet non pris en charge ou compte en lecture seule).");
      return;
    }
    const confirmDelete = window.confirm(
      "Êtes-vous sûr de vouloir supprimer le fichier KMZ/KML personnalisé ? Le système utilisera à nouveau le tracé automatique."
    );
    if (!confirmDelete) return;

    try {
      const projectRef = doc(db, "projects", project.id);
      const updatedProject = {
        ...project,
        identity: {
          ...project.identity,
          kmzFileName: "",
          kmzFileData: "",
          kmzUrl: ""
        }
      };
      // Remove id from document body before setDoc
      delete (updatedProject as any).id;

      await setDoc(projectRef, updatedProject);
      alert("Le fichier KMZ/KML personnalisé a été supprimé. Retour au tracé automatique.");
    } catch (err) {
      console.error("Error deleting KML/KMZ:", err);
      alert("Une erreur s'est produite lors de la suppression du fichier.");
    }
  };

  // Contract Details Modal
  const [showContractsModal, setShowContractsModal] = useState<boolean>(false);
  const [contractsModalProjectId, setContractsModalProjectId] = useState<string | null>(null);

  // Print Preview Modal for Bordereau des Prix
  const [showPrintBordereauModal, setShowPrintBordereauModal] = useState<boolean>(false);

  // Bordereau des prix Generator State
  const [bordereauActivePart, setBordereauActivePart] = useState<"01" | "02" | "03">("01");
  const [bordereauSelectedProjectId, setBordereauSelectedProjectId] = useState<string>("all");
  
  // Custom unit prices for Bordereau des prix
  const [bePrices, setBePrices] = useState<Record<string, number>>({
    impact: 1500000,
    topo: 45000,
    ing: 3000000,
    dup: 800000
  });
  const [gefPrices, setGefPrices] = useState<Record<string, number>>({
    enq: 150000,
    exp: 80000,
    assist: 250000
  });
  const [travauxPrices, setTravauxPrices] = useState<Record<string, number>>({
    piste: 12000,
    fouille: 3500,
    soudage: 18000,
    enrobage: 85000,
    lit: 4000,
    protection: 3500000
  });

  // Quick edit constraints state
  const [editingConstraintsProjectId, setEditingConstraintsProjectId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [tempConstraintsText, setTempConstraintsText] = useState<string>("");
  const [isSavingConstraints, setIsSavingConstraints] = useState<boolean>(false);

  // Dashboard state
  const [dashboardPeriod, setDashboardPeriod] = useState<"mensuel" | "trimestriel" | "semestriel" | "annuel">("trimestriel");
  const [selectedIndicatorTab, setSelectedIndicatorTab] = useState<"permis" | "servitude" | "etude" | "travaux" | null>(null);
  const [checkedImprovementActions, setCheckedImprovementActions] = useState<Record<string, boolean>>({
    "action_1": true,
    "action_2": false,
    "action_3": false,
    "action_4": true,
    "action_5": false,
  });

  // Report state
  const [reportMonth, setReportMonth] = useState<string>("07");
  const [reportYear, setReportYear] = useState<string>("2026");
  const [selectedReportProjects, setSelectedReportProjects] = useState<string[]>([]);
  const [reportHighlights, setReportHighlights] = useState<string>(
    "• Avancement global satisfaisant sur l'ensemble du réseau de transport.\n• Le projet de gazoduc de Jijel a atteint 55% d'avancement avec finalisation de la première phase réglementaire.\n• Des réunions d'arbitrage positives se sont déroulées au niveau des wilayas pour débloquer les emprises foncières."
  );
  const [reportObstacles, setReportObstacles] = useState<string>(
    "• Des oppositions mineures persistent sur le tronçon de Jijel (PK 12+500), gérées conjointement avec les collectivités locales.\n• Retard mineur sur les approvisionnements des vannes de sécurité HP en raison des contraintes logistiques maritimes."
  );
  const [reportNextSteps, setReportNextSteps] = useState<string>(
    "1. Lancement des épreuves hydrostatiques sur le tronçon libéré de Jijel.\n2. Archivage final des documents d'as-built du gazoduc Alger-Blida.\n3. Programmation de la mise en gaz officielle pour Blida."
  );
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [showReportPreview, setShowReportPreview] = useState<boolean>(false);
  
  // Editing state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editProjectData, setEditProjectData] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // States for CP search modal
  const [isCPSearchOpen, setIsCPSearchOpen] = useState<boolean>(false);
  const [cpSearchType, setCpSearchType] = useState<"travaux" | "etude" | "expertise" | "superviseurs">("travaux");
  const [cpSearchQuery, setCpSearchQuery] = useState<string>("");

  // New archive document temp state
  const [newDocName, setNewDocName] = useState<string>("");
  const [newDocCat, setNewDocCat] = useState<string>("Plan de recollement");

  // Detailed Fiche de Suivi State
  const [isEditingFicheSuivi, setIsEditingFicheSuivi] = useState<boolean>(false);
  const [ficheSuiviForm, setFicheSuiviForm] = useState<FicheSuivi>(createDefaultFicheSuivi());
  const [isSavingFicheSuivi, setIsSavingFicheSuivi] = useState<boolean>(false);
  const [bureauEtudeContractForm, setBureauEtudeContractForm] = useState<ContractDetails>({ nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0 });
  const [betEnvironnementContractForm, setBetEnvironnementContractForm] = useState<ContractDetails>({ nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0 });
  const [expertContractForm, setExpertContractForm] = useState<ContractDetails>({ nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0 });

  // Plan de Contrôle Interactive Table States
  const [expandedPlanDeControleItem, setExpandedPlanDeControleItem] = useState<string | null>(null);
  const [editPlanItemFields, setEditPlanItemFields] = useState<PlanDeControleItemStatus>({
    dateControle: "",
    resultat: "/",
    etalonnage: "",
    action: "",
    dateNouveauControle: "",
    resultatNouveau: "/",
    observation: ""
  });
  const [isSavingPlanItem, setIsSavingPlanItem] = useState<boolean>(false);
  const [planDeControleSearch, setPlanDeControleSearch] = useState<string>("");
  const [planDeControleFilter, setPlanDeControleFilter] = useState<string>("Tous");

  // Redirect to identity if active subtab is denied by privileges
  useEffect(() => {
    if ((activeSubTab === "etude" || activeSubTab === "expertise") && !hasPrivilege("section_etude")) {
      setActiveSubTab("identity");
    } else if (activeSubTab === "travaux" && !hasPrivilege("section_travaux")) {
      setActiveSubTab("identity");
    } else if (activeSubTab === "bordereau" && !hasPrivilege("acces_bordereau")) {
      setActiveSubTab("identity");
    }
  }, [activeSubTab, userProfile]);

  // Reset editing of Fiche de Suivi when switching subtabs or projects
  useEffect(() => {
    setIsEditingFicheSuivi(false);
  }, [activeSubTab, selectedProjectId]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const isPosteDetenteSeul = selectedProject 
    ? (selectedProject.identity?.caracteristiques?.typeOuvrage === "Poste de détente seul" || 
       (selectedProject.identity?.caracteristiques?.hasPosteDetente && parseFloat(selectedProject.identity?.caracteristiques?.longueur || "10") === 0))
    : false;

  useEffect(() => {
    if (isPosteDetenteSeul && travauxProgressTab === "ligne") {
      setTravauxProgressTab("postes");
    }
  }, [isPosteDetenteSeul, travauxProgressTab]);

  const formatDateFrench = (dateStr?: string) => {
    if (!dateStr || dateStr.trim() === "") return "Non renseignée";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  const getGenesisMilestones = (p: any) => {
    const milestones = [];
    if (!p) return [];

    // 1. Création de l'affaire
    let creationDate = "Non renseignée";
    if (p.createdAt) {
      if (typeof p.createdAt === "string") {
        creationDate = p.createdAt.substring(0, 10);
      } else if (p.createdAt.toDate) {
        creationDate = p.createdAt.toDate().toISOString().substring(0, 10);
      } else if (p.createdAt.seconds) {
        creationDate = new Date(p.createdAt.seconds * 1000).toISOString().substring(0, 10);
      }
    } else if (p.planning?.etudeStart) {
      creationDate = p.planning.etudeStart;
    }
    
    milestones.push({
      key: "creation",
      title: "Création de l'Affaire",
      date: creationDate,
      status: "completed",
      color: "bg-blue-500",
      description: "Enregistrement officiel de l'ouvrage gazoduc dans le portefeuille d'investissement de Sonelgaz.",
      details: [
        { label: "Nom de l'affaire", value: p.name },
        { label: "Cadre d'inscription", value: p.identity?.cadreInscription },
        { label: "Direction / Région", value: p.identity?.region }
      ]
    });

    // 2. Lancement des Études
    const studyStart = p.planning?.etudeStart || null;
    const isStudyApprouved = p.etudeAutorisation?.statutEtude === "Approuvée";
    const isStudyInProgress = p.etudeAutorisation?.statutEtude === "En cours";
    milestones.push({
      key: "etudes",
      title: "Lancement & Approbation des Études",
      date: studyStart,
      status: isStudyApprouved ? "completed" : (isStudyInProgress || studyStart ? "current" : "pending"),
      color: "bg-amber-500",
      description: "Élaboration des plans d'exécution et étude d'impact environnemental par le BET désigné.",
      details: [
        { label: "BET Exécution", value: p.ficheSuivi?.etudeBetCabinet },
        { label: "Statut Étude", value: p.etudeAutorisation?.statutEtude },
        { label: "Dépôt d'étude d'Impact", value: p.ficheSuivi?.impactDepotEtude }
      ]
    });

    // 3. Permis de Construire (PC)
    const hasPC = p.etudeAutorisation?.statutPermisConstruire === "Reçu";
    const isPCInProgress = p.etudeAutorisation?.statutPermisConstruire === "Déposé - En cours";
    milestones.push({
      key: "permis",
      title: "Dossier Permis de Construire (PC)",
      date: p.etudeAutorisation?.datePermisConstruire || p.ficheSuivi?.depotPcDate || null,
      status: hasPC ? "completed" : (isPCInProgress ? "current" : "pending"),
      color: "bg-indigo-500",
      description: "Dépôt du dossier administratif de permis de construire au niveau des APC compétentes.",
      details: [
        { label: "Statut Permis", value: p.etudeAutorisation?.statutPermisConstruire },
        { label: "Date Dépôt aux APC", value: p.ficheSuivi?.depotPcDate },
        { label: "Date de Réception", value: p.etudeAutorisation?.datePermisConstruire }
      ]
    });

    // 4. Expertise Foncière (GEF)
    const gefDesignated = p.etudeAutorisation?.expertiseFonciere?.gefDesignated || !!p.ficheSuivi?.gefCabinet;
    milestones.push({
      key: "expertise",
      title: "Désignation de l'Expert Foncier (GEF)",
      date: p.ficheSuivi?.demandeGefDate || null,
      status: gefDesignated ? "completed" : "pending",
      color: "bg-emerald-500",
      description: "Désignation officielle du cabinet d'expertise foncière pour l'identification parcellaire et l'état des lieux.",
      details: [
        { label: "Cabinet GEF désigné", value: p.etudeAutorisation?.expertiseFonciere?.gefIdentity || p.ficheSuivi?.gefCabinet },
        { label: "Date de Demande GEF", value: p.ficheSuivi?.demandeGefDate },
        { label: "Nature du Terrain", value: p.ficheSuivi?.natureTerrain }
      ]
    });

    // 5. Arrêté de Servitude (AS)
    const asStatus = p.etudeAutorisation?.statutArreteServitude || "Non lancé";
    const isASSigned = asStatus === "Signé & Publié" || !!p.ficheSuivi?.servitudeArreteDate;
    const isASInProgress = asStatus === "En cours de signature" || !!p.ficheSuivi?.depotAsDate;
    milestones.push({
      key: "servitude",
      title: "Arrêté de Servitude (AS) par la Wilaya",
      date: p.ficheSuivi?.servitudeArreteDate || p.ficheSuivi?.depotAsDate || null,
      status: isASSigned ? "completed" : (isASInProgress ? "current" : "pending"),
      color: "bg-orange-500",
      description: "Validation et signature de l'Arrêté de Servitude par les services de la Wilaya pour occupation réglementaire.",
      details: [
        { label: "Statut de l'Arrêté", value: p.ficheSuivi?.servitudeArreteStatus || asStatus },
        { label: "Référence Arrêté", value: p.etudeAutorisation?.arreteServitudeRef || p.ficheSuivi?.servitudeArreteRef },
        { label: "Date de Signature", value: p.ficheSuivi?.servitudeArreteDate }
      ]
    });

    // 6. Indemnisation des Cultures & Libération
    const isPaid = p.ficheSuivi?.servitudeQuittancesPv === "Oui";
    milestones.push({
      key: "indemnisation",
      title: "Dépôt du Chèque d'Indemnisation",
      date: p.ficheSuivi?.servitudeQuittancesDate || null,
      status: isPaid ? "completed" : "pending",
      color: "bg-rose-500",
      description: "Vérification des barèmes d'indemnisation des cultures, dépôt des chèques et établissement des PV de quittances.",
      details: [
        { label: "Quittances payées", value: p.ficheSuivi?.servitudeQuittancesPv === "Oui" ? "Oui (Libéré)" : "Non (En attente)" },
        { label: "Date de Règlement", value: p.ficheSuivi?.servitudeQuittancesDate },
        { label: "Dépôt Chèque", value: p.ficheSuivi?.servitudeQuittancesPv === "Oui" ? "Effectué" : "En cours/Non déposé" }
      ]
    });

    // 7. Travaux par entreprise / lot s'il y a
    const hasLots = p.lots && p.lots.length > 0;
    const isTravauxPhase = p.identity?.phase === "Travaux" || p.identity?.phase === "Mise en Gaz" || p.identity?.phase === "Clôturé";
    const worksDate = p.planning?.travauxStart || null;
    
    const worksDetails: { label: string; value: any }[] = [];
    if (hasLots) {
      p.lots.forEach((lot: any, index: number) => {
        const gcCompany = lot.contrats?.etbGC?.nom || "Non désigné";
        const gcAv = lot.avancementGC !== undefined ? `${lot.avancementGC}%` : "0%";
        const mecaCompany = lot.contrats?.etbMeca?.nom || "Non désigné";
        const mecaAv = lot.avancementMeca !== undefined ? `${lot.avancementMeca}%` : "0%";
        worksDetails.push({ label: `Lot ${lot.name || index + 1} (Génie Civil)`, value: `${gcCompany} (Av. ${gcAv})` });
        worksDetails.push({ label: `Lot ${lot.name || index + 1} (Génie Méc.)`, value: `${mecaCompany} (Av. ${mecaAv})` });
      });
    } else {
      const gcCompany = p.contrats?.etbGC?.nom || "Non désigné";
      const gcAv = p.travauxPlanification?.avancementGC !== undefined ? `${p.travauxPlanification.avancementGC}%` : "0%";
      const mecaCompany = p.contrats?.etbMeca?.nom || "Non désigné";
      const mecaAv = p.travauxPlanification?.avancementMeca !== undefined ? `${p.travauxPlanification.avancementMeca}%` : "0%";
      worksDetails.push({ label: "Entreprise Génie Civil", value: `${gcCompany} (Av. ${gcAv})` });
      worksDetails.push({ label: "Entreprise Génie Mécanique", value: `${mecaCompany} (Av. ${mecaAv})` });
    }
    // Add global progress as 3rd detail
    worksDetails.push({ label: "Avancement Physique Global", value: `${p.travauxPlanification?.avancementPhysique || 0}%` });

    milestones.push({
      key: "travaux_lots",
      title: "Travaux par Lot & Entreprise",
      date: worksDate,
      status: isTravauxPhase ? "completed" : (p.identity?.phase === "Étude" ? "pending" : "current"),
      color: "bg-blue-600",
      description: "Suivi physique de la pose et montage des équipements par lot et par entreprise (Génie Civil, Génie Mécanique).",
      details: worksDetails
    });

    // 8. Contraintes & Actions
    const hasContraintes = !!p.identity?.contraintes && p.identity.contraintes !== "Aucune" && p.identity.contraintes !== "Néant";
    milestones.push({
      key: "contraintes_actions",
      title: "Contraintes Réseau & Actions Correctives",
      date: null,
      status: hasContraintes ? "current" : "completed",
      color: "bg-rose-600",
      description: "Visualisation des obstacles bloquant le chantier (oppositions, traversées complexes) et des actions correctives engagées.",
      details: [
        { label: "Contraintes du projet", value: p.identity?.contraintes || "Aucune contrainte majeure signalée" },
        { label: "Actions engagées", value: p.identity?.contraintesAction || "Aucune action spécifique requise" }
      ]
    });

    return milestones;
  };

  // Determine active project for Bordereau des prix (supports both standalone module and project details tab)
  const activeBordereauProject = activeModule === "bordereau"
    ? (projects.find(p => p.id === bordereauSelectedProjectId) || projects[0])
    : selectedProject;

  // Dynamic characteristics and item arrays for BPU des Prix Generator
  const diamNum = activeBordereauProject ? parseFloat(activeBordereauProject.identity.caracteristiques?.diametre?.replace(/[^0-9.]/g, '')) || 12 : 12;
  const longNum = activeBordereauProject ? parseFloat(activeBordereauProject.identity.caracteristiques?.longueur?.replace(/[^0-9.]/g, '')) || 15 : 15;

  // 1. Études items
  const etudeItems = activeBordereauProject ? [
    {
      id: "impact",
      code: "1.1",
      designation: "Étude d'impact sur l'environnement (EIE) et notice d'impact hydraulique réglementaire",
      unit: "FF",
      qty: 1,
      price: bePrices.impact ?? 1500000,
      formula: "Forfait global réglementaire pour étude environnementale"
    },
    {
      id: "topo",
      code: "1.2",
      designation: "Levé topographique de précision, délimitation fine du tracé et piquetage de l'axe de l'ouvrage",
      unit: "km",
      qty: longNum,
      price: bePrices.topo ?? 45000,
      formula: `${longNum} km linéaires de conduite à arpenter`
    },
    {
      id: "geo",
      code: "1.3",
      designation: "Étude géotechnique de la plate-forme (Points de sondages, résistivité de sol et essais de laboratoire)",
      unit: "U",
      qty: Math.max(3, Math.ceil(longNum / 2)),
      price: bePrices.geo ?? 120000,
      formula: `1 point de sondage tous les 2 km (min. 3) pour ${longNum} km`
    },
    {
      id: "ing",
      code: "1.4",
      designation: "Calculs d'ingénierie détaillée, dimensionnement hydraulique, mécanique et plans d'exécution",
      unit: "FF",
      qty: 1,
      price: bePrices.ing ?? 3000000,
      formula: `Ingénierie de détail pour canalisation DN ${diamNum}"`
    },
    {
      id: "dup",
      code: "1.5",
      designation: "Établissement du dossier de Déclaration d'Utilité Publique (DUP) et dossier d'autorisation",
      unit: "FF",
      qty: 1,
      price: bePrices.dup ?? 800000,
      formula: "Instruction administrative réglementaire"
    }
  ] : [];

  // 2. Expertise items
  const expertItems = activeBordereauProject ? [
    {
      id: "enq",
      code: "2.1",
      designation: "Enquête foncière parcellaire et identification minutieuse des propriétaires de l'emprise",
      unit: "U (Prop.)",
      qty: Math.max(5, Math.round(longNum * 4)),
      price: gefPrices.enq ?? 150000,
      formula: `Estimation de 4 parcelles/propriétaires par km de tracé`
    },
    {
      id: "exp",
      code: "2.2",
      designation: "Établissement des états d'expertise contradictoires et barèmes réglementaires d'indemnisation des cultures",
      unit: "U (Dossier)",
      qty: Math.max(5, Math.round(longNum * 4)),
      price: gefPrices.exp ?? 80000,
      formula: "Un dossier d'expertise par parcelle identifiée"
    },
    {
      id: "assist",
      code: "2.3",
      designation: "Assistance d'expertise foncière pour servitudes de passage et constitution de l'arrêté de servitude",
      unit: "FF",
      qty: 1,
      price: gefPrices.assist ?? 250000,
      formula: "Suivi foncier global avec les collectivités locales"
    },
    {
      id: "cnd",
      code: "2.4",
      designation: "Contrôle non destructif (CND) systématique et radiographie intégrale (100%) des joints soudés",
      unit: "U (Joint)",
      qty: Math.round(longNum * 85),
      price: gefPrices.cnd ?? 4500,
      formula: `Estimation de 85 joints de soudure par km pour DN ${diamNum}"`
    },
    {
      id: "audit",
      code: "2.5",
      designation: "Contrôle technique de conformité des aciers (tubes et raccords), audit documentaire et certifications",
      unit: "HJ",
      qty: Math.max(10, Math.round(longNum * 2)),
      price: gefPrices.audit ?? 65000,
      formula: `Suivi d'expertise tierce-partie (2 HJ par km de tracé)`
    }
  ] : [];

  // 3. Travaux items
  const travauxItems = activeBordereauProject ? [
    {
      id: "piste",
      code: "3.1",
      designation: "Ouverture de piste, décapage de terre végétale et excavation de la tranchée (terrains divers)",
      unit: "m³",
      qty: Math.round(longNum * 1000 * (diamNum * 0.0254 + 0.6) * 1.5),
      price: travauxPrices.piste ?? 12000,
      formula: `Tranchée de section (DN + 0.6m) × Profondeur 1.5m sur ${longNum} km`
    },
    {
      id: "lit",
      code: "3.2",
      designation: "Fourniture, transport et mise en œuvre du lit de pose sablonneux d'épaisseur 20cm (protection de conduite)",
      unit: "m³",
      qty: Math.round(longNum * 1000 * (diamNum * 0.0254 + 0.6) * 0.2),
      price: travauxPrices.lit ?? 4000,
      formula: `Épaisseur de sable de 20cm dans le fond de la fouille`
    },
    {
      id: "soudage",
      code: "3.3",
      designation: "Cintrage à froid, alignement rigoureux et soudage HP (procédé homologué) de la conduite en acier",
      unit: "U (Joint)",
      qty: Math.round(longNum * 85),
      price: travauxPrices.soudage ?? 18000,
      formula: `Soudures HP qualifiées de tubes en acier (85 joints par km)`
    },
    {
      id: "enrobage",
      code: "3.4",
      designation: "Contrôle de l'enrobage isolant (Holiday detector), retouches et étanchéité de la conduite",
      unit: "FF",
      qty: 1,
      price: travauxPrices.enrobage ?? 85000,
      formula: "Revêtement anticorrosion et essais électriques d'enrobage"
    },
    {
      id: "gr_dep",
      code: "3.5",
      designation: "Génie Civil et montage mécanique de la Gare de Racleur de Départ (y compris robinetterie HP et bypass)",
      unit: "U",
      qty: activeBordereauProject.identity.caracteristiques?.hasGareRacleurDepart ? 1 : 0,
      price: travauxPrices.gr_dep ?? 4500000,
      formula: activeBordereauProject.identity.caracteristiques?.hasGareRacleurDepart ? "Inclus dans l'identité technique de l'ouvrage" : "Non configuré"
    },
    {
      id: "gr_arr",
      code: "3.6",
      designation: "Génie Civil et montage mécanique de la Gare de Racleur d'Arrivée (y compris filtres récepteurs et purges)",
      unit: "U",
      qty: activeBordereauProject.identity.caracteristiques?.hasGareRacleurArrivee ? 1 : 0,
      price: travauxPrices.gr_arr ?? 4500000,
      formula: activeBordereauProject.identity.caracteristiques?.hasGareRacleurArrivee ? "Inclus dans l'identité technique de l'ouvrage" : "Non configuré"
    },
    {
      id: "poste_coup",
      code: "3.7",
      designation: "Réalisation complète du Génie Civil, clôture de sécurité et équipements de Poste de Coupure ou Sectionnement",
      unit: "U",
      qty: (activeBordereauProject.identity.caracteristiques?.hasPosteCoupure ? (activeBordereauProject.identity.caracteristiques?.nbPostesCoupure || 1) : 0) + (activeBordereauProject.identity.caracteristiques?.hasPosteSectionnement ? (activeBordereauProject.identity.caracteristiques?.nbPostesSectionnement || 1) : 0),
      price: travauxPrices.poste_coup ?? 3500000,
      formula: `Postes configurés : Sectionnement (${activeBordereauProject.identity.caracteristiques?.hasPosteSectionnement ? (activeBordereauProject.identity.caracteristiques?.nbPostesSectionnement || 1) : 0}) + Coupure (${activeBordereauProject.identity.caracteristiques?.hasPosteCoupure ? (activeBordereauProject.identity.caracteristiques?.nbPostesCoupure || 1) : 0})`
    },
    {
      id: "poste_det",
      code: "3.8",
      designation: "Génie Civil, installation mécanique des skids de régulation, détendeurs et compteurs du Poste de Détente",
      unit: "U",
      qty: activeBordereauProject.identity.caracteristiques?.hasPosteDetente ? 1 : 0,
      price: travauxPrices.poste_det ?? 15000000,
      formula: activeBordereauProject.identity.caracteristiques?.hasPosteDetente ? "Inclus dans l'identité technique de l'ouvrage" : "Non configuré"
    },
    {
      id: "raccord",
      code: "3.9",
      designation: "Raccordement physique final sur piquage HP en service (vannes HP de garde, piquages de décharge)",
      unit: "FF",
      qty: activeBordereauProject.identity.caracteristiques?.pointRaccordement ? 1 : 0,
      price: travauxPrices.raccord ?? 2500000,
      formula: activeBordereauProject.identity.caracteristiques?.pointRaccordement ? `Point désigné : ${activeBordereauProject.identity.caracteristiques?.pointRaccordement}` : "Aucun point de raccordement désigné"
    },
    {
      id: "protection",
      code: "3.10",
      designation: "Fourniture et mise en œuvre du système de protection cathodique (Soutirage actif d'anodes et coffret de mesure)",
      unit: "FF",
      qty: 1,
      price: travauxPrices.protection ?? 3500000,
      formula: "Système de protection active anticorrosion"
    },
    {
      id: "epreuve",
      code: "3.11",
      designation: "Épreuves hydrauliques réglementaires de résistance et d'étanchéité sous enregistreur agréé (durée 24h + 24h)",
      unit: "km",
      qty: longNum,
      price: travauxPrices.epreuve ?? 150000,
      formula: `Maintien réglementaire sous pression d'eau pour ${longNum} km`
    }
  ] : [];

  // Dynamic lookup arrays derived from active projects data
  const uniqueYears = Array.from(new Set(projects.map(p => {
    if (p.planning?.etudeStart && p.planning.etudeStart.length >= 4) {
      return p.planning.etudeStart.substring(0, 4);
    }
    if (p.createdAt && p.createdAt.length >= 4) {
      return p.createdAt.substring(0, 4);
    }
    return "2026";
  }))).filter(Boolean).sort();

  const uniquePoles = Array.from(new Set(projects.map(p => p.identity?.pole))).filter(Boolean).sort();
  const uniqueWilayas = Array.from(new Set(projects.map(p => p.identity?.wilaya))).filter(Boolean).sort();
  const uniqueDirections = Array.from(new Set(projects.map(p => p.identity?.region))).filter(Boolean).sort();

  // Sync Fiche de Suivi when selected project changes
  useEffect(() => {
    if (selectedProject) {
      if (selectedProject.ficheSuivi) {
        const parsed = JSON.parse(JSON.stringify(selectedProject.ficheSuivi));
        setFicheSuiviForm({
          ...createDefaultFicheSuivi(),
          ...parsed,
          rappels: parsed.rappels || createDefaultFicheSuivi().rappels,
          reserves: parsed.reserves || createDefaultFicheSuivi().reserves,
          autresInformations: parsed.autresInformations || createDefaultFicheSuivi().autresInformations,
        });
      } else {
        setFicheSuiviForm(createDefaultFicheSuivi());
      }
    }
  }, [selectedProjectId, selectedProject?.ficheSuivi]);

  // Sync Plan de Contrôle item edit fields when a row is expanded
  const handleToggleExpandPlanItem = (ord: string) => {
    if (expandedPlanDeControleItem === ord) {
      setExpandedPlanDeControleItem(null);
    } else {
      setExpandedPlanDeControleItem(ord);
      const existingStatus = selectedProject?.planDeControle?.[ord];
      if (existingStatus) {
        setEditPlanItemFields({ ...existingStatus });
      } else {
        setEditPlanItemFields({
          dateControle: new Date().toISOString().split("T")[0],
          resultat: "/",
          etalonnage: "",
          action: "",
          dateNouveauControle: "",
          resultatNouveau: "/",
          observation: ""
        });
      }
    }
  };

  // Save or update the Fiche de Suivi
  const handleSaveFicheSuivi = async () => {
    if (!selectedProject) return;
    if (!hasPrivilege("section_etude")) {
      alert("Accès refusé: Vous ne disposez pas du privilège requis pour modifier la section étude.");
      return;
    }
    if (!canEditProject(selectedProject)) {
      alert("Accès refusé: Vous n'avez pas le privilège de modification pour cet ouvrage (Projet non pris en charge ou compte en lecture seule).");
      return;
    }
    setIsSavingFicheSuivi(true);
    try {
      const projectRef = doc(db, "projects", selectedProject.id);
      
      const gefVal = ficheSuiviForm.gefCabinet || "";
      const betVal = ficheSuiviForm.etudeBetCabinet || "";

      const updatedEtudeAutorisation = {
        ...(selectedProject.etudeAutorisation || {}),
        expertiseFonciere: {
          ...(selectedProject.etudeAutorisation?.expertiseFonciere || {}),
          gefIdentity: gefVal,
          gefDesignated: !!gefVal
        }
      };

      const emptyContractObj = { nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0, delai: "" };
      const updatedLots = (selectedProject.lots || []).map(lot => {
        const lotContrats = lot.contrats || {
          bureauEtude: emptyContractObj,
          expert: emptyContractObj,
          etbGC: emptyContractObj,
          etbMeca: emptyContractObj
        };
        return {
          ...lot,
          contrats: {
            ...lotContrats,
            expert: {
              ...(lotContrats.expert || emptyContractObj),
              nom: gefVal
            },
            bureauEtude: {
              ...(lotContrats.bureauEtude || emptyContractObj),
              nom: betVal
            }
          }
        };
      });

      const updatedContrats = {
        ...(selectedProject.contrats || {}),
        expert: {
          ...(selectedProject.contrats?.expert || emptyContractObj),
          nom: gefVal
        },
        bureauEtude: {
          ...(selectedProject.contrats?.bureauEtude || emptyContractObj),
          nom: betVal
        }
      };

      await setDoc(projectRef, {
        ficheSuivi: ficheSuiviForm,
        etudeAutorisation: updatedEtudeAutorisation,
        lots: updatedLots,
        contrats: updatedContrats,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setIsEditingFicheSuivi(false);
    } catch (err) {
      console.error("Error saving Fiche de Suivi:", err);
      alert("Erreur lors de la sauvegarde de la fiche de suivi administrative.");
    } finally {
      setIsSavingFicheSuivi(false);
    }
  };

  // Save or update an item in Plan de Contrôle
  const handleSavePlanDeControleItem = async (ord: string) => {
    if (!selectedProject) return;
    if (!hasPrivilege("section_travaux")) {
      alert("Accès refusé: Vous ne disposez pas du privilège requis pour modifier la section travaux.");
      return;
    }
    if (!canEditProject(selectedProject)) {
      alert("Accès refusé: Vous n'avez pas le privilège de modification pour cet ouvrage (Projet non pris en charge ou compte en lecture seule).");
      return;
    }
    setIsSavingPlanItem(true);
    try {
      const projectRef = doc(db, "projects", selectedProject.id);
      const currentPlan = selectedProject.planDeControle || {};
      const updatedPlan = {
        ...currentPlan,
        [ord]: {
          ...editPlanItemFields
        }
      };

      await setDoc(projectRef, {
        planDeControle: updatedPlan,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setExpandedPlanDeControleItem(null);
    } catch (err) {
      console.error("Error saving Plan de Contrôle item:", err);
      alert("Erreur lors de la sauvegarde du point de contrôle.");
    } finally {
      setIsSavingPlanItem(false);
    }
  };

  // Sync projects from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "projects"), async (snapshot) => {
      const projectsList: Project[] = [];
      snapshot.forEach((doc) => {
        const rawData = doc.data() as any;
        const data = { ...rawData };
        if (data.identity) {
          // Map old poles to new ones
          if (!data.identity.pole || data.identity.pole === "Pôle Est - Constantine" || data.identity.pole === "Pôle Centre - Alger" || data.identity.pole === "Pôle Est") {
            data.identity.pole = "Pôle ACO (Alger - Constantine - Ouargla)";
          } else if (data.identity.pole === "Pôle Ouest - Oran" || data.identity.pole === "Pôle Sud - Ouargla" || data.identity.pole === "Pôle Ouest") {
            data.identity.pole = "Pôle BBO (Blida - Béchar - Oran)";
          } else if (!POLES_ALGERIE.includes(data.identity.pole)) {
            data.identity.pole = "Pôle ACO (Alger - Constantine - Ouargla)";
          }
          
          // Map old regions to new ones
          if (data.identity.region === "DR Constantine") {
            data.identity.region = "Région de transport gaz Constantine";
          } else if (data.identity.region === "DR Alger" || data.identity.region === "Direction de Région TG" || data.identity.region === "DR Centre") {
            data.identity.region = "Région de transport gaz Alger";
          } else if (data.identity.region === "DR Blida") {
            data.identity.region = "Région de transport gaz Blida";
          } else if (data.identity.region === "DR Oran") {
            data.identity.region = "Région de transport gaz Oran";
          } else if (data.identity.region === "DR Béchar") {
            data.identity.region = "Région de transport gaz Béchar";
          } else if (data.identity.region === "DR Ouargla") {
            data.identity.region = "Région de transport gaz Ouargla";
          } else if (!REGIONS_ALGERIE.includes(data.identity.region)) {
            data.identity.region = "Région de transport gaz Alger";
          }

          // Map old plain wilayas to numbered ones
          if (data.identity.wilaya) {
            const rawWilaya = data.identity.wilaya;
            if (!/^\d+ - /.test(rawWilaya)) {
              const matched = WILAYAS_ALGERIE.find(w => w.toLowerCase().endsWith(rawWilaya.toLowerCase()) || w.toLowerCase().includes(rawWilaya.toLowerCase()));
              if (matched) {
                data.identity.wilaya = matched;
                data.identity.district = `${matched} District Gaz`;
              }
            }
          }
        }
        projectsList.push({ id: doc.id, ...data } as Project);
      });
      
      // Auto-seed if empty
      if (projectsList.length === 0 && snapshot.metadata.fromCache === false) {
        console.log("Seeding project collection with default sample Sonelgaz data...");
        try {
          for (const sample of SAMPLE_PROJECTS) {
            await addDoc(collection(db, "projects"), sample);
          }
        } catch (err) {
          console.error("Error seeding projects:", err);
        }
      } else {
        setProjects(projectsList);
        // Automatically select the first project if none is selected
        if (projectsList.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projectsList[0].id);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error loading projects from firestore:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedProjectId]);

  // Trigger edit mode
  const startEditing = () => {
    if (selectedProject) {
      if (!canEditProject(selectedProject)) {
        alert("Accès refusé: Vous n'avez pas le privilège d'édition pour cet ouvrage (Projet non pris en charge ou compte en lecture seule).");
        return;
      }
      setEditProjectData(JSON.parse(JSON.stringify(selectedProject))); // Deep copy
      setIsEditing(true);
    }
  };

  // Save changes to Firestore
  const saveProjectChanges = async () => {
    if (!editProjectData) return;
    if (!canEditProject(editProjectData)) {
      alert("Accès refusé: Vous n'avez pas le privilège de modification pour cet ouvrage.");
      return;
    }
    try {
      const projectRef = doc(db, "projects", editProjectData.id);
      
      const gefVal = editProjectData.etudeAutorisation?.expertiseFonciere?.gefIdentity || "";
      const betVal = editProjectData.ficheSuivi?.etudeBetCabinet || "";

      // Ensure Fiche de Suivi and general/lot contracts are synchronized
      const updatedFicheSuivi = {
        ...(editProjectData.ficheSuivi || {}),
        gefCabinet: gefVal
      };

      const emptyContractObj = { nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0, delai: "" };
      let updatedLots = (editProjectData.lots || []).map(lot => {
        const lotContrats = lot.contrats || {
          bureauEtude: emptyContractObj,
          expert: emptyContractObj,
          etbGC: emptyContractObj,
          etbMeca: emptyContractObj
        };
        const finalLotContrats = {
          ...lotContrats,
          expert: {
            ...(lotContrats.expert || emptyContractObj),
            nom: gefVal
          },
          bureauEtude: {
            ...(lotContrats.bureauEtude || emptyContractObj),
            nom: betVal || lotContrats.bureauEtude?.nom || ""
          }
        };
        const avGC = finalLotContrats.etbGC?.avancement || 0;
        const avMeca = finalLotContrats.etbMeca?.avancement || 0;
        return {
          ...lot,
          contrats: finalLotContrats,
          avancementGC: avGC,
          avancementMeca: avMeca,
          avancementPhysique: Math.round((avGC + avMeca) / 2)
        };
      });

      const updatedContrats = {
        ...(editProjectData.contrats || {}),
        expert: {
          ...(editProjectData.contrats?.expert || emptyContractObj),
          nom: gefVal
        },
        bureauEtude: {
          ...(editProjectData.contrats?.bureauEtude || emptyContractObj),
          nom: betVal || editProjectData.contrats?.bureauEtude?.nom || ""
        }
      };

      // Compile overall progress metrics based on multi-lot vs single-lot
      const finalTravauxPlanification = {
        ...(editProjectData.travauxPlanification || {
          avancementPhysique: 0,
          avancementGC: 0,
          avancementMeca: 0,
          essaisReglementaires: { epreuveResistance: "Non faite", epreuveEtancheite: "Non faite", organismeControleur: "" },
          controleQualiteChecklist: { abaqueSoudageValide: false, radiographieCND: false, enrobageVerifie: false, litPoseSableux: false, protectionCathodique: false }
        })
      };

      if (updatedLots && updatedLots.length > 0) {
        const totalLots = updatedLots.length;
        const totalGC = updatedLots.reduce((sum, l) => sum + (l.avancementGC || 0), 0);
        const totalMeca = updatedLots.reduce((sum, l) => sum + (l.avancementMeca || 0), 0);
        const totalPhys = updatedLots.reduce((sum, l) => sum + (l.avancementPhysique || 0), 0);

        finalTravauxPlanification.avancementGC = Math.round(totalGC / totalLots);
        finalTravauxPlanification.avancementMeca = Math.round(totalMeca / totalLots);
        finalTravauxPlanification.avancementPhysique = Math.round(totalPhys / totalLots);
      } else {
        const avGC = updatedContrats.etbGC?.avancement || 0;
        const avMeca = updatedContrats.etbMeca?.avancement || 0;
        finalTravauxPlanification.avancementGC = avGC;
        finalTravauxPlanification.avancementMeca = avMeca;
        finalTravauxPlanification.avancementPhysique = Math.round((avGC + avMeca) / 2);
      }

      const firstSuperviseur = editProjectData.superviseurs?.[0];
      const superviseurUid = firstSuperviseur?.uid || "";
      const superviseurName = firstSuperviseur?.name || "";
      const superviseurEmail = firstSuperviseur?.email || "";
      const superviseurStructure = firstSuperviseur?.structure || "";

      const firstCPTravaux = editProjectData.chefsDeProjetTravaux?.[0];
      const chefDeProjetUid = firstCPTravaux?.uid || "";
      const chefDeProjetName = firstCPTravaux?.name || "";
      const chefDeProjetEmail = firstCPTravaux?.email || "";
      const chefDeProjetStructure = firstCPTravaux?.structure || "";

      const firstCPEtude = editProjectData.chefsDeProjetEtude?.[0];
      const chefDeProjetEtudeUid = firstCPEtude?.uid || "";
      const chefDeProjetEtudeName = firstCPEtude?.name || "";
      const chefDeProjetEtudeEmail = firstCPEtude?.email || "";
      const chefDeProjetEtudeStructure = firstCPEtude?.structure || "";

      const updatedData = {
        ...editProjectData,
        superviseurUid,
        superviseurName,
        superviseurEmail,
        superviseurStructure,
        chefDeProjetUid,
        chefDeProjetName,
        chefDeProjetEmail,
        chefDeProjetStructure,
        chefDeProjetEtudeUid,
        chefDeProjetEtudeName,
        chefDeProjetEtudeEmail,
        chefDeProjetEtudeStructure,
        ficheSuivi: updatedFicheSuivi,
        lots: updatedLots,
        contrats: updatedContrats,
        travauxPlanification: finalTravauxPlanification,
        updatedAt: new Date().toISOString(),
        updatedByEmail: userProfile?.email || currentUser?.email || "",
        updatedByName: userProfile?.name || currentUser?.displayName || "Ingénieur Sonelgaz",
        updatedByUid: userProfile?.uid || currentUser?.uid || ""
      };
      // Remove id from document body before setDoc
      delete (updatedData as any).id;
      
      await setDoc(projectRef, updatedData);

      try {
        const oldProject = projects.find(p => p.id === editProjectData.id);
        const author = userProfile?.name || currentUser?.displayName || "un superviseur";
        const projName = editProjectData.name || oldProject?.name || "Ouvrage";
        
        let category: "update" | "assignment" | "status_change" = "update";
        const changesList: string[] = [];

        if (oldProject) {
          // 1. Phase
          const oldP = oldProject.identity?.phase || "";
          const newP = editProjectData.identity?.phase || "";
          if (oldP !== newP && newP) {
            changesList.push(`Phase : "${oldP || 'N/A'}" ➔ "${newP}"`);
            category = "status_change";
          }

          // 2. Statut / Étape
          const oldS = (oldProject.identity as any)?.statut || "";
          const newS = (editProjectData.identity as any)?.statut || "";
          if (oldS !== newS && newS) {
            changesList.push(`Étape/Statut : "${oldS || 'N/A'}" ➔ "${newS}"`);
            if (category !== "status_change") category = "status_change";
          }

          // 3. État d'avancement
          const oldE = (oldProject.identity as any)?.etatAvancement || "";
          const newE = (editProjectData.identity as any)?.etatAvancement || "";
          if (oldE !== newE && newE) {
            changesList.push(`État : "${oldE || 'N/A'}" ➔ "${newE}"`);
            if (category !== "status_change") category = "status_change";
          }

          // 4. Avancement physique
          const oldAvPhys = oldProject.travauxPlanification?.avancementPhysique ?? 0;
          const newAvPhys = finalTravauxPlanification?.avancementPhysique ?? 0;
          if (oldAvPhys !== newAvPhys) {
            changesList.push(`Avancement Phys. Global : ${oldAvPhys}% ➔ ${newAvPhys}%`);
          }

          const oldAvGC = oldProject.travauxPlanification?.avancementGC ?? 0;
          const newAvGC = finalTravauxPlanification?.avancementGC ?? 0;
          if (oldAvGC !== newAvGC) {
            changesList.push(`Avancement Génie Civil : ${oldAvGC}% ➔ ${newAvGC}%`);
          }

          const oldAvMeca = oldProject.travauxPlanification?.avancementMeca ?? 0;
          const newAvMeca = finalTravauxPlanification?.avancementMeca ?? 0;
          if (oldAvMeca !== newAvMeca) {
            changesList.push(`Avancement Tuyauterie/Méca : ${oldAvMeca}% ➔ ${newAvMeca}%`);
          }

          // 5. Équipe / Affectation
          const oldSup = oldProject.superviseurName || "";
          const newSup = superviseurName || "";
          if (oldSup !== newSup) {
            changesList.push(`Superviseur : "${oldSup || 'Non affecté'}" ➔ "${newSup || 'Non affecté'}"`);
            category = "assignment";
          }

          const oldCPT = oldProject.chefDeProjetName || "";
          const newCPT = chefDeProjetName || "";
          if (oldCPT !== newCPT) {
            changesList.push(`CP Travaux : "${oldCPT || 'Non affecté'}" ➔ "${newCPT || 'Non affecté'}"`);
            category = "assignment";
          }

          const oldCPE = oldProject.chefDeProjetEtudeName || "";
          const newCPE = chefDeProjetEtudeName || "";
          if (oldCPE !== newCPE) {
            changesList.push(`CP Étude : "${oldCPE || 'Non affecté'}" ➔ "${newCPE || 'Non affecté'}"`);
            category = "assignment";
          }

          // 6. Délais & Ordres de service
          const oldODV = (oldProject.identity as any)?.odv || "";
          const newODV = (editProjectData.identity as any)?.odv || "";
          if (newODV && oldODV !== newODV) {
            changesList.push(`Date Ordre de Service (ODV) : "${oldODV || 'N/A'}" ➔ "${newODV}"`);
          }

          const oldDelai = (oldProject.identity as any)?.delaiContractuel || "";
          const newDelai = (editProjectData.identity as any)?.delaiContractuel || "";
          if (newDelai && oldDelai !== newDelai) {
            changesList.push(`Délai contractuel : ${oldDelai || 'N/A'} ➔ ${newDelai} mois`);
          }

          // 7. Budget / Montant
          const oldM = (oldProject.identity as any)?.montantTotal || (oldProject.identity as any)?.coutEstimatif || "";
          const newM = (editProjectData.identity as any)?.montantTotal || (editProjectData.identity as any)?.coutEstimatif || "";
          if (newM && oldM !== newM) {
            changesList.push(`Montant / Budget : ${oldM || 'N/A'} ➔ ${newM}`);
          }

          // 8. Entreprises
          const oldEntGC = oldProject.contrats?.etbGC?.nom || "";
          const newEntGC = updatedContrats?.etbGC?.nom || "";
          if (newEntGC && oldEntGC !== newEntGC) {
            changesList.push(`Entreprise GC : "${oldEntGC || 'N/A'}" ➔ "${newEntGC}"`);
          }

          const oldEntMeca = oldProject.contrats?.etbMeca?.nom || "";
          const newEntMeca = updatedContrats?.etbMeca?.nom || "";
          if (newEntMeca && oldEntMeca !== newEntMeca) {
            changesList.push(`Entreprise Méca : "${oldEntMeca || 'N/A'}" ➔ "${newEntMeca}"`);
          }

          // 9. Remarques / Suivi
          const oldComms = (oldProject.ficheSuivi as any)?.commentaires || "";
          const newComms = (updatedFicheSuivi as any)?.commentaires || "";
          if (newComms && oldComms !== newComms) {
            changesList.push(`Observations / Remarques de suivi réactualisées`);
          }
        }

        let message = "";
        if (changesList.length > 0) {
          message = `Modification de l'ouvrage "${projName}" par ${author} :\n• ` + changesList.join("\n• ");
        } else {
          message = `Le projet "${projName}" a été mis à jour par ${author} (Validation générale des informations).`;
        }

        await createNotification({
          projectId: editProjectData.id,
          projectName: editProjectData.name || "Ouvrage",
          message: message,
          category: category,
          authorName: userProfile?.name || currentUser?.displayName || "Ingénieur Sonelgaz",
          authorEmail: userProfile?.email || currentUser?.email || "",
          authorRole: userProfile?.role || "",
          pole: editProjectData.identity?.pole || "",
          region: editProjectData.identity?.region || ""
        });
      } catch (notifErr) {
        console.warn("Error creating update notification:", notifErr);
      }

      setIsEditing(false);
      setEditProjectData(null);
    } catch (err) {
      console.error("Error saving project changes:", err);
      alert("Erreur lors de la sauvegarde du projet. Veuillez vérifier vos autorisations.");
    }
  };

  // Delete project from Firestore
  const deleteProject = async (id: string) => {
    const targetProj = projects.find(p => p.id === id);
    if (!canEditProject(targetProj)) {
      alert("Accès refusé: Vous n'avez pas le droit de supprimer cet ouvrage.");
      return;
    }
    try {
      await deleteDoc(doc(db, "projects", id));
      if (selectedProjectId === id) {
        setSelectedProjectId(projects.find(p => p.id !== id)?.id || null);
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("Impossible de supprimer le projet. Vérifiez vos accès d'administrateur.");
    }
  };

  // Initialize form for a brand new project
  const openCreateDialog = () => {
    const emptyContract = () => ({ nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0 });
    
    // Determine initial pole & direction from user's assignments
    const userPoles = userProfile?.assignedPoles || (userProfile?.pole ? [userProfile.pole] : []);
    const userDirections = userProfile?.assignedDirections || (userProfile?.direction ? [userProfile.direction] : []);
    
    const initialPole = POLES_ALGERIE.find(p => isUserPolesMatched(userPoles, p)) || POLES_ALGERIE[0];
    const initialRegion = REGIONS_ALGERIE.find(r => isUserDirectionsMatched(userDirections, r)) || REGIONS_ALGERIE[0];

    const template: Omit<Project, "id"> = {
      name: "Nouveau Projet Gazoduc (Saisir le nom)",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chefsDeProjetTravaux: [],
      chefsDeProjetEtude: [],
      chefsDeProjetExpertise: [],
      superviseurs: [],
      planning: {
        etudeStart: new Date().toISOString().split('T')[0],
        etudeEnd: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        travauxStart: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        travauxEnd: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        essaisStart: new Date(Date.now() + 181 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        essaisEnd: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        gazStart: new Date(Date.now() + 201 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        gazEnd: new Date(Date.now() + 210 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      identity: {
        region: initialRegion,
        pole: initialPole,
        wilaya: "16 - Alger",
        district: "16 - Alger District Gaz",
        phase: "Étude",
        cadreInscription: "Programme d'Urgence",
        planificationComment: "Planification préliminaire établie. Phase d'étude en cours de lancement.",
        structureChargee: "Division Transport Gaz",
        caracteristiques: {
          diametre: "20\" (DN 500)",
          longueur: "15",
          pression: "70 bar",
          typeTuyau: "Acier API 5L X60",
          capacitePoste: "",
          hasPiquage: false,
          hasGareRacleurDepart: false,
          hasGareRacleurArrivee: false,
          hasPosteCoupure: false,
          hasPosteSectionnement: false,
          nbPostesCoupure: 0,
          nbPostesSectionnement: 0,
          hasPosteDetente: false,
          pointRaccordement: "",
          pipelineSequence: []
        },
        contraintes: "",
        kmzUrl: "",
        kmzFileName: "",
        kmzFileData: ""
      },
      etudeAutorisation: {
        statutEtude: "Non lancée",
        datePermisConstruire: "",
        statutPermisConstruire: "Non déposé",
        statutArreteServitude: "Non lancé",
        arreteServitudeRef: "",
        expertiseFonciere: {
          gefDesignated: false,
          gefIdentity: "Non désigné",
          acquisitionDemandEstablished: false,
          acquisitionComment: ""
        }
      },
      travauxPlanification: {
        avancementPhysique: 0,
        avancementGC: 0,
        avancementMeca: 0,
        essaisReglementaires: {
          epreuveResistance: "Non faite",
          epreuveEtancheite: "Non faite",
          organismeControleur: "VERITAL SpA"
        },
        controleQualiteChecklist: {
          abaqueSoudageValide: false,
          radiographieCND: false,
          enrobageVerifie: false,
          litPoseSableux: false,
          protectionCathodique: false
        }
      },
      miseEnGazArchive: {
        statutMiseEnGaz: "Non planifiée",
        dateEffectiveMiseEnGaz: "",
        documentsArchives: []
      },
      contrats: {
        bureauEtude: emptyContract(),
        expert: emptyContract(),
        etbGC: emptyContract(),
        etbMeca: emptyContract(),
        betEnvironnement: emptyContract()
      },
      nombreLots: 1,
      lots: []
    };
    
    setEditProjectData({ id: "temp-id", ...template });
    setIsCreating(true);
    setIsEditing(true);
  };

  // Confirm project creation
  const handleCreateProject = async () => {
    if (!editProjectData) return;
    try {
      const firstSuperviseur = editProjectData.superviseurs?.[0];
      const superviseurUid = firstSuperviseur?.uid || "";
      const superviseurName = firstSuperviseur?.name || "";
      const superviseurEmail = firstSuperviseur?.email || "";
      const superviseurStructure = firstSuperviseur?.structure || "";

      const firstCPTravaux = editProjectData.chefsDeProjetTravaux?.[0];
      const chefDeProjetUid = firstCPTravaux?.uid || "";
      const chefDeProjetName = firstCPTravaux?.name || "";
      const chefDeProjetEmail = firstCPTravaux?.email || "";
      const chefDeProjetStructure = firstCPTravaux?.structure || "";

      const firstCPEtude = editProjectData.chefsDeProjetEtude?.[0];
      const chefDeProjetEtudeUid = firstCPEtude?.uid || "";
      const chefDeProjetEtudeName = firstCPEtude?.name || "";
      const chefDeProjetEtudeEmail = firstCPEtude?.email || "";
      const chefDeProjetEtudeStructure = firstCPEtude?.structure || "";

      const payload = { 
        ...editProjectData, 
        superviseurUid,
        superviseurName,
        superviseurEmail,
        superviseurStructure,
        chefDeProjetUid,
        chefDeProjetName,
        chefDeProjetEmail,
        chefDeProjetStructure,
        chefDeProjetEtudeUid,
        chefDeProjetEtudeName,
        chefDeProjetEtudeEmail,
        chefDeProjetEtudeStructure,
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString(),
        createdByEmail: userProfile?.email || currentUser?.email || "",
        createdByName: userProfile?.name || currentUser?.displayName || "Ingénieur Sonelgaz",
        createdByUid: userProfile?.uid || currentUser?.uid || "",
        updatedByEmail: userProfile?.email || currentUser?.email || "",
        updatedByName: userProfile?.name || currentUser?.displayName || "Ingénieur Sonelgaz",
        updatedByUid: userProfile?.uid || currentUser?.uid || ""
      };
      delete (payload as any).id; // Remove temp-id
      
      const docRef = await addDoc(collection(db, "projects"), payload);
      
      try {
        await createNotification({
          projectId: docRef.id,
          projectName: payload.name || "Nouveau Projet",
          message: `Le projet "${payload.name}" a été créé par ${userProfile?.name || currentUser?.displayName || userProfile?.email || "un superviseur"}.`,
          category: "creation",
          authorName: userProfile?.name || currentUser?.displayName || "Ingénieur Sonelgaz",
          authorEmail: userProfile?.email || currentUser?.email || "",
          authorRole: userProfile?.role || "",
          pole: payload.identity?.pole || "",
          region: payload.identity?.region || ""
        });
      } catch (notifErr) {
        console.warn("Error creating creation notification:", notifErr);
      }

      setSelectedProjectId(docRef.id);
      setIsEditing(false);
      setIsCreating(false);
      setEditProjectData(null);
    } catch (err) {
      console.error("Error creating project:", err);
      alert("Une erreur s'est produite lors de l'ajout du projet.");
    }
  };

  // Add document reference inside final tab
  const addArchiveDocument = async () => {
    if (!newDocName.trim() || !selectedProject) return;
    const documentObj = {
      id: Date.now().toString(),
      name: newDocName.trim(),
      category: newDocCat,
      addedAt: new Date().toISOString().split("T")[0]
    };

    try {
      const updatedDocs = [...(selectedProject.miseEnGazArchive.documentsArchives || []), documentObj];
      const projectRef = doc(db, "projects", selectedProject.id);
      
      await setDoc(projectRef, {
        ...selectedProject,
        miseEnGazArchive: {
          ...selectedProject.miseEnGazArchive,
          documentsArchives: updatedDocs
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setNewDocName("");
    } catch (err) {
      console.error("Error adding document reference:", err);
    }
  };

  // Remove archive document reference
  const removeArchiveDocument = async (docId: string) => {
    if (!selectedProject) return;
    try {
      const updatedDocs = (selectedProject.miseEnGazArchive.documentsArchives || []).filter(d => d.id !== docId);
      const projectRef = doc(db, "projects", selectedProject.id);
      
      await setDoc(projectRef, {
        ...selectedProject,
        miseEnGazArchive: {
          ...selectedProject.miseEnGazArchive,
          documentsArchives: updatedDocs
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Error removing document reference:", err);
    }
  };

  // Helper to determine phase color
  const getPhaseBadgeColor = (phase: string) => {
    switch (phase) {
      case "Étude": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Travaux": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Mise en Gaz": return "bg-green-100 text-green-800 border-green-200 animate-pulse";
      case "Clôturé": return "bg-slate-100 text-slate-800 border-slate-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const renderContractsAndOdsSummary = () => {
    if (!selectedProject) return null;

    const lotsToRender = (selectedProject.lots && selectedProject.lots.length > 0)
      ? selectedProject.lots
      : [
          {
            id: "lot-1",
            name: "Lot Unique (Général)",
            contrats: selectedProject.contrats
          }
        ];

    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider font-mono">Suivi Contractuel</span>
            <h5 className="font-black text-sm text-slate-800">Synthèse des Contrats, Prestataires & Ordres de Service (ODS)</h5>
          </div>
          <button
            onClick={() => {
              setActiveSubTab("travaux");
              if (lotsToRender[0]?.id) {
                setEditingLotContractsId(lotsToRender[0].id);
              }
              setTimeout(() => {
                document.getElementById("multi-lot-management-section")?.scrollIntoView({ behavior: "smooth" });
              }, 150);
            }}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100/50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Gérer / Modifier les Contrats & ODS</span>
          </button>
        </div>

        <div className="space-y-6">
          {lotsToRender.map((lot, idx) => {
            const contrats = lot.contrats || {
              bureauEtude: { nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0 },
              expert: { nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0 },
              etbGC: { nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0 },
              etbMeca: { nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0 }
            };

            const betName = contrats.bureauEtude?.nom || selectedProject.ficheSuivi?.etudeBetCabinet || selectedProject.ficheSuivi?.impactBetOds || "";
            const expertName = contrats.expert?.nom || selectedProject.ficheSuivi?.gefCabinet || "";

            return (
              <div key={lot.id || idx} className="space-y-3">
                {lotsToRender.length > 1 && (
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    <span className="font-bold text-xs text-slate-700">{lot.name}</span>
                    {lot.wilaya && (
                      <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black border border-indigo-100/50">
                        {lot.wilaya}
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Bureau d'Étude */}
                  <div className="bg-slate-50/45 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-3 shadow-xs hover:border-slate-200 transition-colors">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-blue-600 font-mono tracking-wide">1. Bureau d'Études (BET)</span>
                        <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md font-mono font-bold">
                          Av. {contrats.bureauEtude?.avancement || 0}%
                        </span>
                      </div>
                      <h6 className="font-black text-slate-800 text-[11px] mt-2 leading-tight min-h-[2.2rem] line-clamp-2" title={betName || "Non désigné"}>
                        {betName || <span className="text-slate-400 italic font-medium">Non renseigné</span>}
                      </h6>
                      
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600">
                        <p className="flex justify-between">
                          <span className="font-bold text-slate-400">Réf :</span>
                          <span className="font-mono font-extrabold text-slate-700 truncate max-w-[120px]">{contrats.bureauEtude?.ref || "N/A"}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-bold text-slate-400">Signature :</span>
                          <span className="font-mono font-extrabold text-slate-700">{formatDateFrench(contrats.bureauEtude?.date)}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-bold text-slate-400">Montant :</span>
                          <span className="font-extrabold text-slate-700">{contrats.bureauEtude?.montant ? `${contrats.bureauEtude.montant}` : "N/A"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50 flex flex-col gap-0.5 text-center">
                      <span className="text-[8px] font-bold text-blue-600 uppercase tracking-wide">Date ODS du BET</span>
                      <span className="font-mono font-black text-[11px] text-blue-800">
                        {contrats.bureauEtude?.ods ? formatDateFrench(contrats.bureauEtude.ods) : "Non notifiée"}
                      </span>
                    </div>
                  </div>

                  {/* Géomètre Expert Foncier */}
                  <div className="bg-slate-50/45 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-3 shadow-xs hover:border-slate-200 transition-colors">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-amber-600 font-mono tracking-wide">2. Cabinet d'Expertise (GEF)</span>
                        <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md font-mono font-bold">
                          Av. {contrats.expert?.avancement || 0}%
                        </span>
                      </div>
                      <h6 className="font-black text-slate-800 text-[11px] mt-2 leading-tight min-h-[2.2rem] line-clamp-2" title={expertName || "Non désigné"}>
                        {expertName || <span className="text-slate-400 italic font-medium">Non renseigné</span>}
                      </h6>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600">
                        <p className="flex justify-between">
                          <span className="font-bold text-slate-400">Réf :</span>
                          <span className="font-mono font-extrabold text-slate-700 truncate max-w-[120px]">{contrats.expert?.ref || "N/A"}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-bold text-slate-400">Signature :</span>
                          <span className="font-mono font-extrabold text-slate-700">{formatDateFrench(contrats.expert?.date)}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-bold text-slate-400">Montant :</span>
                          <span className="font-extrabold text-slate-700">{contrats.expert?.montant ? `${contrats.expert.montant}` : "N/A"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/50 flex flex-col gap-0.5 text-center">
                      <span className="text-[8px] font-bold text-amber-600 uppercase tracking-wide">Date ODS du GEF</span>
                      <span className="font-mono font-black text-[11px] text-amber-800">
                        {contrats.expert?.ods ? formatDateFrench(contrats.expert.ods) : "Non notifiée"}
                      </span>
                    </div>
                  </div>

                  {/* Entreprise Génie Civil */}
                  <div className="bg-slate-50/45 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-3 shadow-xs hover:border-slate-200 transition-colors">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-emerald-600 font-mono tracking-wide">3. Entreprise Génie Civil (GC)</span>
                        <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-mono font-bold">
                          Av. {contrats.etbGC?.avancement || 0}%
                        </span>
                      </div>
                      <h6 className="font-black text-slate-800 text-[11px] mt-2 leading-tight min-h-[2.2rem] line-clamp-2" title={contrats.etbGC?.nom || "Non désignée"}>
                        {contrats.etbGC?.nom || <span className="text-slate-400 italic font-medium">Non renseignée</span>}
                      </h6>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600">
                        <p className="flex justify-between">
                          <span className="font-bold text-slate-400">Réf :</span>
                          <span className="font-mono font-extrabold text-slate-700 truncate max-w-[120px]">{contrats.etbGC?.ref || "N/A"}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-bold text-slate-400">Signature :</span>
                          <span className="font-mono font-extrabold text-slate-700">{formatDateFrench(contrats.etbGC?.date)}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-bold text-slate-400">Montant :</span>
                          <span className="font-extrabold text-slate-700">{contrats.etbGC?.montant ? `${contrats.etbGC.montant}` : "N/A"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50 flex flex-col gap-0.5 text-center">
                      <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wide">Date ODS GC</span>
                      <span className="font-mono font-black text-[11px] text-emerald-800">
                        {contrats.etbGC?.ods ? formatDateFrench(contrats.etbGC.ods) : "Non notifiée"}
                      </span>
                    </div>
                  </div>

                  {/* Entreprise Mécanique */}
                  <div className="bg-slate-50/45 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-3 shadow-xs hover:border-slate-200 transition-colors">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-purple-600 font-mono tracking-wide">4. Entreprise Mécanique</span>
                        <span className="text-[9px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md font-mono font-bold">
                          Av. {contrats.etbMeca?.avancement || 0}%
                        </span>
                      </div>
                      <h6 className="font-black text-slate-800 text-[11px] mt-2 leading-tight min-h-[2.2rem] line-clamp-2" title={contrats.etbMeca?.nom || "Non désignée"}>
                        {contrats.etbMeca?.nom || <span className="text-slate-400 italic font-medium">Non renseignée</span>}
                      </h6>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600">
                        <p className="flex justify-between">
                          <span className="font-bold text-slate-400">Réf :</span>
                          <span className="font-mono font-extrabold text-slate-700 truncate max-w-[120px]">{contrats.etbMeca?.ref || "N/A"}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-bold text-slate-400">Signature :</span>
                          <span className="font-mono font-extrabold text-slate-700">{formatDateFrench(contrats.etbMeca?.date)}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-bold text-slate-400">Montant :</span>
                          <span className="font-extrabold text-slate-700">{contrats.etbMeca?.montant ? `${contrats.etbMeca.montant}` : "N/A"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/50 flex flex-col gap-0.5 text-center">
                      <span className="text-[8px] font-bold text-purple-600 uppercase tracking-wide">Date ODS Mécanique</span>
                      <span className="font-mono font-black text-[11px] text-purple-800">
                        {contrats.etbMeca?.ods ? formatDateFrench(contrats.etbMeca.ods) : "Non notifiée"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper to parse dates and render the beginning-to-end horizontal visual Gantt block
  const calculateDurationDays = (start: string, end: string) => {
    const s = new Date(start || Date.now());
    const e = new Date(end || Date.now());
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  // Global project span date calculations for visual percentage width scaling
  const getGlobalProjectBoundary = (proj: Project) => {
    const dates = [
      new Date(proj.planning.etudeStart),
      new Date(proj.planning.etudeEnd),
      new Date(proj.planning.travauxStart),
      new Date(proj.planning.travauxEnd),
      new Date(proj.planning.essaisStart),
      new Date(proj.planning.essaisEnd),
      new Date(proj.planning.gazStart),
      new Date(proj.planning.gazEnd)
    ].filter(d => !isNaN(d.getTime()));

    if (dates.length === 0) return { min: Date.now(), max: Date.now() + 1000 * 60 * 60 * 24 * 30 };
    const min = Math.min(...dates.map(d => d.getTime()));
    const max = Math.max(...dates.map(d => d.getTime()));
    return { min, max };
  };

  const renderVisualGantt = (proj: Project) => {
    const { min, max } = getGlobalProjectBoundary(proj);
    const totalSpan = max - min || 1;

    const phases = [
      { key: "Étude", start: proj.planning.etudeStart, end: proj.planning.etudeEnd, color: "bg-blue-500", text: "Étude & Autorisations", textCol: "text-blue-700" },
      { key: "Travaux", start: proj.planning.travauxStart, end: proj.planning.travauxEnd, color: "bg-orange-500", text: "Travaux de Pose & Génie Civil", textCol: "text-orange-700" },
      { key: "Essais", start: proj.planning.essaisStart, end: proj.planning.essaisEnd, color: "bg-yellow-500", text: "Essais & Épreuves Réglementaires", textCol: "text-yellow-700" },
      { key: "Mise en Gaz", start: proj.planning.gazStart, end: proj.planning.gazEnd, color: "bg-green-500", text: "Mise en Gaz & Réception", textCol: "text-green-700" },
    ];

    return (
      <div className="space-y-6 bg-slate-900 text-white rounded-2xl p-6 border border-slate-800">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider">Phase 00 • Calendrier d'Exécution</span>
            <h4 className="font-extrabold text-base">Planification Graphique (Début / Fin)</h4>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>Période globale : {new Date(min).toLocaleDateString("fr-FR")} au {new Date(max).toLocaleDateString("fr-FR")}</span>
          </div>
        </div>

        {/* Visual Timetable Grid */}
        <div className="space-y-4 pt-2">
          {phases.map((ph, idx) => {
            const startMs = new Date(ph.start).getTime();
            const endMs = new Date(ph.end).getTime();
            const days = calculateDurationDays(ph.start, ph.end);

            // Compute percentage positions
            const leftPercent = Math.max(0, Math.min(95, ((startMs - min) / totalSpan) * 100));
            const widthPercent = Math.max(5, Math.min(100 - leftPercent, ((endMs - startMs) / totalSpan) * 100));

            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${ph.color}`} />
                    <span className="text-white">{ph.text}</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-md font-mono text-orange-400">{days} Jours</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {new Date(ph.start).toLocaleDateString("fr-FR")} — {new Date(ph.end).toLocaleDateString("fr-FR")}
                  </span>
                </div>

                {/* Progress bar line */}
                <div className="h-6 w-full bg-slate-950 rounded-lg relative overflow-hidden border border-slate-800">
                  <div
                    className={`absolute top-0 bottom-0 ${ph.color} rounded-md shadow-lg transition-all duration-500 flex items-center justify-center`}
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                  >
                    <span className="text-[9px] font-black tracking-wider uppercase drop-shadow px-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {ph.key}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Key explanations */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/60 text-[11px] text-slate-400">
          <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
            <span className="text-blue-500 mt-0.5">⬤</span>
            <div>
              <p className="font-bold text-white uppercase tracking-wider text-[9px]">Étape 1 : Études</p>
              <p>Tracé, permis de construire et arrêtés d'occupation.</p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
            <span className="text-orange-500 mt-0.5">⬤</span>
            <div>
              <p className="font-bold text-white uppercase tracking-wider text-[9px]">Étape 2 : Travaux</p>
              <p>Fouille, cintrage, soudage, enrobage et pose.</p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
            <span className="text-yellow-500 mt-0.5">⬤</span>
            <div>
              <p className="font-bold text-white uppercase tracking-wider text-[9px]">Étape 3 : Épreuves</p>
              <p>Essais sous pression (résistance & étanchéité).</p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
            <span className="text-green-500 mt-0.5">⬤</span>
            <div>
              <p className="font-bold text-white uppercase tracking-wider text-[9px]">Étape 4 : Mise en Gaz</p>
              <p>Purges, injection de gaz et livraison définitive.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Quick save constraints
  const handleSaveConstraintsQuickly = async () => {
    if (!editingConstraintsProjectId) return;
    setIsSavingConstraints(true);
    try {
      const projectRef = doc(db, "projects", editingConstraintsProjectId);
      const targetProj = projects.find(p => p.id === editingConstraintsProjectId);
      await setDoc(projectRef, {
        identity: {
          ...targetProj?.identity,
          contraintes: tempConstraintsText
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setEditingConstraintsProjectId(null);
    } catch (err) {
      console.error("Error saving constraints quickly:", err);
      alert("Une erreur s'est produite lors de la mise à jour des contraintes.");
    } finally {
      setIsSavingConstraints(false);
    }
  };

  const renderPlanDeCharge = () => {
    const filteredProjects = projects.filter(p => {
      const searchLower = planDeChargeSearch.toLowerCase();
      const matchesSearch = 
        p.name.toLowerCase().includes(searchLower) ||
        p.identity.wilaya.toLowerCase().includes(searchLower) ||
        p.identity.pole.toLowerCase().includes(searchLower) ||
        p.identity.structureChargee.toLowerCase().includes(searchLower);
      
      const pYear = p.planning?.etudeStart ? p.planning.etudeStart.substring(0, 4) : (p.createdAt ? p.createdAt.substring(0, 4) : "2026");
      const matchesAnnee = planDeChargeAnnee === "Tous" || pYear === planDeChargeAnnee;
      const matchesPole = planDeChargePole === "Tous" || p.identity.pole === planDeChargePole;
      const matchesWilaya = planDeChargeWilaya === "Tous" || p.identity.wilaya === planDeChargeWilaya;
      const matchesDirection = planDeChargeDirection === "Tous" || p.identity.region === planDeChargeDirection;
      const matchesPhase = planDeChargeFilter === "Tous" || p.identity.phase === planDeChargeFilter;

      const hasConstraint = p.identity.contraintes && p.identity.contraintes.trim().length > 0;
      const matchesContrainte = 
        planDeChargeContrainte === "Tous" ||
        (planDeChargeContrainte === "Avec" && hasConstraint) ||
        (planDeChargeContrainte === "Sans" && !hasConstraint);

      const obj = getProjectObjective(p);
      const matchesObjectif = 
        planDeChargeObjectif === "Tous" ||
        (planDeChargeObjectif === "Ouverture" && obj.type === "ouverture") ||
        (planDeChargeObjectif === "MiseEnGaz" && obj.type === "misengaz");

      // Filter by user's assigned poles and directions for non-Super Admins
      const isSuperAdmin = userProfile?.role === "Super Administrateur" || currentUser?.email === "boudjada.youcef@gmail.com";
      const userPoles = userProfile?.assignedPoles || (userProfile?.pole ? [userProfile.pole] : []);
      const userDirections = userProfile?.assignedDirections || (userProfile?.direction ? [userProfile.direction] : []);
      
      const hasPoleAccess = isSuperAdmin || userPoles.length === 0 || userPoles.includes("Tous") || isUserPolesMatched(userPoles, p.identity.pole);
      const hasDirectionAccess = isSuperAdmin || userDirections.length === 0 || userDirections.includes("Tous") || isUserDirectionsMatched(userDirections, p.identity.region);

      return matchesSearch && matchesAnnee && matchesPole && matchesWilaya && matchesDirection && matchesPhase && matchesContrainte && matchesObjectif && hasPoleAccess && hasDirectionAccess;
    });

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className={isFullscreenPlanDeCharge ? "fixed inset-0 z-[50000] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 md:p-8" : "space-y-6"}
      >
        <div className={isFullscreenPlanDeCharge ? "bg-white w-full h-full rounded-2xl shadow-2xl border border-slate-200 p-6 md:p-8 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative" : "bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 relative"}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider text-left block font-mono">Plan de charge centralisé</span>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-0.5 text-left">Suivi d'Ingénierie & Travaux</h2>
              <p className="text-xs text-slate-400 mt-1 text-left">
                Visualisation globale de l'état d'avancement physique, des caractéristiques techniques et des contraintes opérationnelles.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un ouvrage, wilaya..."
                  value={planDeChargeSearch}
                  onChange={e => setPlanDeChargeSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-xs outline-none w-52 font-medium text-slate-700 transition-all"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <button
                onClick={() => handlePrintPlanDeCharge(filteredProjects)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title="Imprimer le plan de charge filtré"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Imprimer</span>
              </button>

              <button
                onClick={() => handleExportPlanDeChargeWord(filteredProjects)}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title="Exporter le plan de charge filtré sous format Word"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Exporter Word</span>
              </button>

              <button
                onClick={() => handleExportPlanDeChargePDF(filteredProjects)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title="Exporter le plan de charge filtré sous format PDF"
              >
                <FileText className="w-4 h-4 text-rose-600" />
                <span>Exporter PDF</span>
              </button>

              {/* Columns Masking Dropdown Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${
                    showColumnSelector
                      ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                  title="Afficher/Masquer des colonnes de la table"
                >
                  <EyeOff className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>Masquer Colonnes ({AVAILABLE_COLUMNS.length - hiddenColumns.length} visibles)</span>
                </button>

                {showColumnSelector && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowColumnSelector(false)} 
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 text-left space-y-3 max-h-[350px] overflow-y-auto">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Colonnes de la table</span>
                        <button 
                          type="button"
                          onClick={() => setHiddenColumns([])}
                          className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer"
                        >
                          Tout réinitialiser
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {AVAILABLE_COLUMNS.map((col) => {
                          const isHidden = hiddenColumns.includes(col.key);
                          return (
                            <label 
                              key={col.key} 
                              className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-xs font-medium text-slate-700 transition-colors"
                            >
                              <input 
                                type="checkbox" 
                                checked={!isHidden}
                                onChange={() => {
                                  if (isHidden) {
                                    setHiddenColumns(hiddenColumns.filter(c => c !== col.key));
                                  } else {
                                    setHiddenColumns([...hiddenColumns, col.key]);
                                  }
                                }}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                              />
                              <span>{col.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (isFullscreenPlanDeCharge) {
                      setIsFullscreenPlanDeCharge(false);
                      setMeetingSelectedProject(null);
                    } else {
                      setShowFullscreenMenu(!showFullscreenMenu);
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${
                    isFullscreenPlanDeCharge
                      ? "bg-slate-900 hover:bg-slate-800 text-white border border-slate-700"
                      : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100"
                  }`}
                  title={isFullscreenPlanDeCharge ? "Quitter le mode plein écran" : "Passer en mode plein écran"}
                >
                  {isFullscreenPlanDeCharge ? (
                    <>
                      <Minimize2 className="w-4 h-4" />
                      <span>Mode Réduit ({planDeChargeFullscreenMode === "reunion" ? "Réunion" : "Normal"})</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4 text-indigo-600" />
                      <span>Plein Écran</span>
                    </>
                  )}
                </button>

                {/* Dropdown for choosing Fullscreen Mode */}
                {!isFullscreenPlanDeCharge && showFullscreenMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowFullscreenMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 block font-mono">Options d'affichage</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPlanDeChargeFullscreenMode("normal");
                          setIsFullscreenPlanDeCharge(true);
                          setShowFullscreenMenu(false);
                        }}
                        className="w-full flex items-start gap-2.5 p-2 hover:bg-slate-50 rounded-xl transition-all cursor-pointer text-left"
                      >
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-700">Mode Normal</div>
                          <div className="text-[9px] text-slate-400 mt-0.5 font-medium leading-tight">Plein écran classique du tableau de suivi.</div>
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setPlanDeChargeFullscreenMode("reunion");
                          setIsFullscreenPlanDeCharge(true);
                          setShowFullscreenMenu(false);
                        }}
                        className="w-full flex items-start gap-2.5 p-2 hover:bg-slate-50 rounded-xl transition-all cursor-pointer text-left mt-1"
                      >
                        <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0 mt-0.5">
                          <Presentation className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-700">Mode Réunion</div>
                          <div className="text-[9px] text-slate-400 mt-0.5 font-medium leading-tight">Tableau interactif + volet d'étapes en split 50/50.</div>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {hasPrivilege("ajout_projet") && (
                <button
                  onClick={() => {
                    openCreateDialog();
                    setActiveModule("gestion"); // Auto switch to edit view
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau Ouvrage</span>
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filtres d'utilisabilité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 pt-4 pb-2 border-b border-slate-100 text-xs text-left">
            <div className="space-y-1">
              <label className="font-bold text-slate-400 text-[10px] uppercase tracking-wider font-mono">Année</label>
              <select
                value={planDeChargeAnnee}
                onChange={e => setPlanDeChargeAnnee(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="Tous">Toutes les années</option>
                {uniqueYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-400 text-[10px] uppercase tracking-wider font-mono">Pôle TG</label>
              <select
                value={planDeChargePole}
                onChange={e => setPlanDeChargePole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="Tous">Tous les pôles</option>
                {uniquePoles.map(pole => (
                  <option key={pole} value={pole}>{pole}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-400 text-[10px] uppercase tracking-wider font-mono">Direction / Région</label>
              <select
                value={planDeChargeDirection}
                onChange={e => setPlanDeChargeDirection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="Tous">Toutes les directions</option>
                {uniqueDirections.map(dir => (
                  <option key={dir} value={dir}>{dir}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-400 text-[10px] uppercase tracking-wider font-mono">Wilaya</label>
              <select
                value={planDeChargeWilaya}
                onChange={e => setPlanDeChargeWilaya(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="Tous">Toutes les wilayas</option>
                {uniqueWilayas.map(wilaya => (
                  <option key={wilaya} value={wilaya}>{wilaya}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-400 text-[10px] uppercase tracking-wider font-mono">Phase Actuelle</label>
              <select
                value={planDeChargeFilter}
                onChange={e => setPlanDeChargeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="Tous">Toutes les phases</option>
                <option value="Étude">Étude</option>
                <option value="Travaux">Travaux</option>
                <option value="Mise en Gaz">Mise en Gaz</option>
                <option value="Clôturé">Clôturé</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-400 text-[10px] uppercase tracking-wider font-mono">Contraintes</label>
              <select
                value={planDeChargeContrainte}
                onChange={e => setPlanDeChargeContrainte(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="Tous">Toutes les contraintes</option>
                <option value="Avec">Avec contraintes ⚠️</option>
                <option value="Sans">Sans contraintes ✅</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-400 text-[10px] uppercase tracking-wider font-mono">Objectif Ouvrage</label>
              <select
                value={planDeChargeObjectif}
                onChange={e => setPlanDeChargeObjectif(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="Tous">Tous les objectifs</option>
                <option value="Ouverture">Ouverture chantier 🏗️</option>
                <option value="MiseEnGaz">Mise en gaz ⚡</option>
              </select>
            </div>
          </div>

          <div className={`mt-6 flex-1 min-h-0 ${isFullscreenPlanDeCharge && planDeChargeFullscreenMode === "reunion" && meetingSelectedProject ? "flex gap-6 overflow-hidden" : ""}`}>
            {/* Table Container Column */}
            <div className={`min-w-0 ${isFullscreenPlanDeCharge && planDeChargeFullscreenMode === "reunion" && meetingSelectedProject ? "w-[45%] flex flex-col overflow-hidden border-r border-slate-150 pr-4" : "w-full"}`}>
              <div className={`w-full ${isFullscreenPlanDeCharge ? "overflow-auto flex-1 min-h-0" : "overflow-x-auto"}`}>
                <table className="w-full text-left border-collapse text-xs min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-50/50">
                      {isFullscreenPlanDeCharge && planDeChargeFullscreenMode === "reunion" && (
                        <th className="py-3 px-3 rounded-l-xl text-center w-12">Réunion</th>
                      )}
                      <th className={`py-3 px-4 ${isFullscreenPlanDeCharge && planDeChargeFullscreenMode === "reunion" ? "" : "rounded-l-xl"}`}>Ouvrage</th>
                      {!hiddenColumns.includes("wilaya") && <th className="py-3 px-3">Wilaya</th>}
                      {!hiddenColumns.includes("pole") && <th className="py-3 px-3">Pôle</th>}
                      {!hiddenColumns.includes("region") && <th className="py-3 px-3">Direction</th>}
                      {!hiddenColumns.includes("phase") && <th className="py-3 px-3">Phase</th>}
                      {!hiddenColumns.includes("objective") && <th className="py-3 px-3 text-left">Objectif</th>}
                      {!hiddenColumns.includes("diametre") && <th className="py-3 px-3">Diamètre</th>}
                      {!hiddenColumns.includes("longueur") && <th className="py-3 px-3">Longueur</th>}
                      {!hiddenColumns.includes("capacite") && <th className="py-3 px-3">Capacité Poste</th>}
                      {!hiddenColumns.includes("avGC") && <th className="py-3 px-3">Av. GC</th>}
                      {!hiddenColumns.includes("avMeca") && <th className="py-3 px-3">Av. Méca</th>}
                      {!hiddenColumns.includes("avGlobal") && <th className="py-3 px-3">Av. Global</th>}
                      {!hiddenColumns.includes("contraintes") && <th className="py-3 px-3">Contrainte Majeure</th>}
                      <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredProjects.map((p) => {
                      const hasConstraint = p.identity.contraintes && p.identity.contraintes.trim().length > 0;
                      return (
                        <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors group ${meetingSelectedProject?.id === p.id ? "bg-amber-50/40 hover:bg-amber-50/50" : ""}`}>
                          {isFullscreenPlanDeCharge && planDeChargeFullscreenMode === "reunion" && (
                            <td className="py-4 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => setMeetingSelectedProject(p)}
                                className={`p-1.5 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
                                  meetingSelectedProject?.id === p.id
                                    ? "bg-amber-500 text-white shadow-xs"
                                    : "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                                }`}
                                title="Afficher le détail de la réunion"
                              >
                                <Presentation className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                          <td className="py-4 px-4 font-extrabold text-slate-800 leading-normal max-w-xs text-left">
                            <div className="flex items-center gap-2">
                              {/* Tooltip trigger container */}
                              <div className="relative group/info inline-block shrink-0">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-blue-600 hover:bg-blue-50 border border-slate-200/60 flex items-center justify-center font-bold font-serif text-[11px] cursor-pointer shadow-xs transition-all">
                                  i
                                </span>
                                
                                {/* Floating Tooltip Card */}
                                <div className="absolute left-0 top-full mt-2 w-64 bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 hidden group-hover/info:block z-[99] animate-in fade-in slide-in-from-top-1 duration-200 text-left font-normal normal-case">
                                  <div className="space-y-3 text-xs">
                                    <div className="border-b border-slate-800 pb-2 flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                      <span className="font-extrabold text-[10px] uppercase text-blue-400 tracking-wider font-mono">Traçabilité du projet</span>
                                    </div>
                                    <div className="space-y-2">
                                      <div>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Dernière Modification</p>
                                        <p className="font-semibold text-slate-200 mt-0.5">
                                          Modifié par <strong className="text-white font-extrabold">{p.updatedByName || "Ingénieur Sonelgaz"}</strong>
                                        </p>
                                        {p.updatedByEmail && (
                                          <p className="text-[9px] text-slate-500 font-mono">{p.updatedByEmail}</p>
                                        )}
                                        <p className="text-[10px] text-slate-400 font-mono mt-1 font-semibold">
                                          le {p.updatedAt ? new Date(p.updatedAt).toLocaleString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Non spécifié"}
                                        </p>
                                      </div>

                                      {p.createdAt && (
                                        <div className="border-t border-slate-800/60 pt-2">
                                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Création Initiale</p>
                                          <p className="font-semibold text-slate-300 mt-0.5">
                                            Créé par <strong className="text-white font-semibold">{p.createdByName || "Ingénieur Sonelgaz"}</strong>
                                          </p>
                                          {p.createdByEmail && (
                                            <p className="text-[9px] text-slate-500 font-mono">{p.createdByEmail}</p>
                                          )}
                                          <p className="text-[10px] text-slate-400 font-mono mt-1">
                                            le {p.createdAt ? new Date(p.createdAt).toLocaleString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Non spécifié"}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <span className="truncate">{p.name}</span>
                            </div>
                          </td>
                          {!hiddenColumns.includes("wilaya") && <td className="py-4 px-3 font-semibold text-slate-500 text-left">{p.identity.wilaya || "N/A"}</td>}
                          {!hiddenColumns.includes("pole") && <td className="py-4 px-3 font-medium text-slate-500 text-left">{p.identity.pole || "N/A"}</td>}
                          {!hiddenColumns.includes("region") && <td className="py-4 px-3 font-mono text-[11px] text-slate-600 text-left">{p.identity.region || "N/A"}</td>}
                          {!hiddenColumns.includes("phase") && (
                            <td className="py-4 px-3 text-left">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border inline-block ${getPhaseBadgeColor(p.identity.phase)}`}>
                                {p.identity.phase}
                              </span>
                            </td>
                          )}
                          {!hiddenColumns.includes("objective") && (
                            <td className="py-4 px-3 text-left">
                              {(() => {
                                const obj = getProjectObjective(p);
                                return (
                                  <div className="space-y-0.5">
                                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold block w-max uppercase tracking-wider ${
                                      obj.type === "ouverture"
                                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                                        : obj.type === "misengaz"
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                        : "bg-slate-100 text-slate-500 border border-slate-200"
                                    }`}>
                                      {obj.label}
                                    </span>
                                    {obj.date ? (
                                      <span className="text-[10px] font-mono text-slate-500 font-bold block">
                                        {new Date(obj.date).toLocaleDateString("fr-FR")}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic block">Non défini</span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                          )}
                          {/* New Columns */}
                          {!hiddenColumns.includes("diametre") && <td className="py-4 px-3 font-mono text-slate-700 font-bold">{p.identity.caracteristiques?.diametre || "N/A"}</td>}
                          {!hiddenColumns.includes("longueur") && (
                            <td className="py-4 px-3 font-mono text-slate-700 font-bold">
                              {getProjectDisplayLength(p) !== "0" ? `${getProjectDisplayLength(p)} km` : "N/A"}
                            </td>
                          )}
                          {!hiddenColumns.includes("capacite") && (
                            <td className="py-4 px-3 font-mono text-slate-600">
                              {p.identity.caracteristiques?.capacitePoste || p.ficheSuivi?.capPoste || "N/A"}
                            </td>
                          )}
                          {!hiddenColumns.includes("avGC") && (
                            <td className="py-4 px-3 font-mono font-bold text-blue-600 align-top">
                              <div>{p.travauxPlanification?.avancementGC !== undefined ? `${p.travauxPlanification.avancementGC}%` : "0%"}</div>
                              {p.lots && p.lots.length > 0 && (
                                <div className="mt-1 space-y-0.5 pt-1 border-t border-slate-100 text-[9px] font-normal text-slate-500">
                                  {p.lots.map((l, lIdx) => (
                                    <div key={l.id || lIdx} className="truncate" title={`${l.name || `Lot ${lIdx + 1}`}: ${l.avancementGC || 0}%`}>
                                      <span className="font-semibold text-slate-700">{l.name ? (l.name.length > 10 ? l.name.substring(0, 10) + '...' : l.name) : `L${lIdx + 1}`}:</span> {l.avancementGC || 0}%
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          )}
                          {!hiddenColumns.includes("avMeca") && (
                            <td className="py-4 px-3 font-mono font-bold text-emerald-600 align-top">
                              <div>{p.travauxPlanification?.avancementMeca !== undefined ? `${p.travauxPlanification.avancementMeca}%` : "0%"}</div>
                              {p.lots && p.lots.length > 0 && (
                                <div className="mt-1 space-y-0.5 pt-1 border-t border-slate-100 text-[9px] font-normal text-slate-500">
                                  {p.lots.map((l, lIdx) => (
                                    <div key={l.id || lIdx} className="truncate" title={`${l.name || `Lot ${lIdx + 1}`}: ${l.avancementMeca || 0}%`}>
                                      <span className="font-semibold text-slate-700">{l.name ? (l.name.length > 10 ? l.name.substring(0, 10) + '...' : l.name) : `L${lIdx + 1}`}:</span> {l.avancementMeca || 0}%
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          )}
                          {!hiddenColumns.includes("avGlobal") && (
                            <td className="py-4 px-3 align-top">
                              <div className="flex items-center gap-2 w-24">
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${p.travauxPlanification?.avancementPhysique || 0}%` }}
                                  />
                                </div>
                                <span className="font-black text-slate-700 w-8 text-right font-mono text-[11px]">
                                  {p.travauxPlanification?.avancementPhysique || 0}%
                                </span>
                              </div>
                              {p.lots && p.lots.length > 0 && (
                                <div className="mt-1 space-y-0.5 pt-1 border-t border-slate-100 font-mono text-[9px] font-normal text-slate-500">
                                  {p.lots.map((l, lIdx) => (
                                    <div key={l.id || lIdx} className="flex items-center justify-between gap-1" title={`${l.name || `Lot ${lIdx + 1}`}: ${l.avancementPhysique || 0}%`}>
                                      <span className="font-semibold text-slate-700 truncate max-w-[60px]">{l.name ? (l.name.length > 8 ? l.name.substring(0, 8) + '...' : l.name) : `L${lIdx + 1}`}:</span>
                                      <span className="font-bold text-slate-800">{l.avancementPhysique || 0}%</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          )}
                          {!hiddenColumns.includes("contraintes") && (
                            <td className="py-4 px-3 max-w-xs text-left">
                              {hasConstraint ? (
                                <div className="flex items-start gap-1.5 p-2 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                  <span className="text-[10px] font-medium leading-relaxed line-clamp-2">
                                    {p.identity.contraintes}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-emerald-700">
                                  <Check className="w-4 h-4 text-emerald-500 animate-pulse" />
                                  <span className="text-[10px] font-semibold">Aucune contrainte</span>
                                </div>
                              )}
                            </td>
                          )}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProjectId(p.id);
                                  setActiveModule("gestion");
                                  setActiveSubTab("identity");
                                  setIsFullscreenPlanDeCharge(false);
                                }}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold transition-all flex items-center justify-center cursor-pointer active:scale-90"
                                title="Voir détail (Fiche d'identité)"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProjectId(p.id);
                                  setActiveModule("gestion");
                                  setActiveSubTab("planning");
                                  setIsFullscreenPlanDeCharge(false);
                                }}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold transition-all flex items-center justify-center cursor-pointer active:scale-90"
                                title="Consulter planning & avancement"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingConstraintsProjectId(p.id);
                                  setTempConstraintsText(p.identity.contraintes || "");
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-all flex items-center justify-center cursor-pointer active:scale-90"
                                title="Modifier contraintes"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {hasPrivilege("ajout_projet") && (
                                <button
                                  type="button"
                                  onClick={() => setProjectToDelete(p.id)}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold transition-all flex items-center justify-center cursor-pointer active:scale-90"
                                  title="Supprimer définitivement ce projet"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredProjects.length === 0 && (
                      <tr>
                        <td colSpan={15 - hiddenColumns.length + (isFullscreenPlanDeCharge && planDeChargeFullscreenMode === "reunion" ? 1 : 0)} className="text-center py-8 text-slate-400 italic">
                          Aucun projet correspondant aux critères.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column (Mode Réunion project details) */}
            {isFullscreenPlanDeCharge && planDeChargeFullscreenMode === "reunion" && (
              <div className={`transition-all duration-300 ${meetingSelectedProject ? "w-[55%] flex flex-col" : "w-0 hidden"} bg-slate-50/70 border-l border-slate-200 rounded-r-2xl overflow-hidden`}>
                {meetingSelectedProject ? (
                  <div className="h-full flex flex-col overflow-hidden">
                    {/* Header of details panel */}
                    <div className="p-4 bg-white border-b border-slate-200/80 flex items-center justify-between shadow-xs shrink-0">
                      <div className="min-w-0 flex-1 pr-3">
                        <span className="text-[9px] font-black uppercase text-amber-600 tracking-wider block font-mono">Fiche Réunion de Chantier</span>
                        <h3 className="text-sm font-black text-slate-800 truncate leading-tight mt-0.5">{meetingSelectedProject.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${getPhaseBadgeColor(meetingSelectedProject.identity.phase)}`}>
                            {meetingSelectedProject.identity.phase}
                          </span>
                          <span className="text-[10px] text-slate-450 font-bold">{meetingSelectedProject.identity.pole} • {meetingSelectedProject.identity.wilaya}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMeetingSelectedProject(null)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black transition-all cursor-pointer active:scale-95 shadow-xs shrink-0"
                        title="Réduire pour repasser en plein écran"
                      >
                        <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Réduire</span>
                      </button>
                    </div>

                    {/* Content of details panel */}
                    <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-750">
                      {/* Step 1: Études & Autorisations Administratives */}
                      <div className="bg-white border border-slate-200/65 p-4 rounded-2xl space-y-3 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold">
                              <Layers className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider">1. Étude & Autorisations Administratives</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase ${
                            meetingSelectedProject.etudeAutorisation?.statutEtude === "Approuvée"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : meetingSelectedProject.etudeAutorisation?.statutEtude === "En cours"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            Étude : {meetingSelectedProject.etudeAutorisation?.statutEtude || "Non commencée"}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider font-mono">Permis de Construire</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${
                                meetingSelectedProject.etudeAutorisation?.statutPermisConstruire === "Reçu" 
                                  ? "bg-emerald-500 animate-pulse" 
                                  : meetingSelectedProject.etudeAutorisation?.statutPermisConstruire?.includes("En cours") 
                                  ? "bg-amber-500 animate-pulse" 
                                  : "bg-slate-350"
                              }`} />
                              <span className="font-extrabold text-slate-700">
                                {meetingSelectedProject.etudeAutorisation?.statutPermisConstruire || "Non déposé"}
                              </span>
                            </div>
                            {meetingSelectedProject.etudeAutorisation?.datePermisConstruire && (
                              <span className="text-[10px] text-slate-400 font-bold block">
                                Date d'obtention : {meetingSelectedProject.etudeAutorisation.datePermisConstruire}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider font-mono">Arrêté de Servitude (DUP)</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${
                                meetingSelectedProject.etudeAutorisation?.statutArreteServitude?.includes("Signé") 
                                  ? "bg-emerald-500 animate-pulse" 
                                  : meetingSelectedProject.etudeAutorisation?.statutArreteServitude?.includes("En cours") 
                                  ? "bg-amber-500 animate-pulse" 
                                  : "bg-slate-350"
                              }`} />
                              <span className="font-extrabold text-slate-700">
                                {meetingSelectedProject.etudeAutorisation?.statutArreteServitude || "Non lancé"}
                              </span>
                            </div>
                            {meetingSelectedProject.etudeAutorisation?.arreteServitudeRef && (
                              <span className="text-[10px] text-slate-450 font-bold block truncate" title={meetingSelectedProject.etudeAutorisation.arreteServitudeRef}>
                                Réf : {meetingSelectedProject.etudeAutorisation.arreteServitudeRef}
                              </span>
                            )}
                          </div>

                          <div className="sm:col-span-2 border-t border-slate-100 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider font-mono">Expertise Foncière (GEF)</span>
                              <span className="font-bold text-slate-700 block">
                                {meetingSelectedProject.etudeAutorisation?.expertiseFonciere?.gefDesignated 
                                  ? `✓ Désigné : ${meetingSelectedProject.etudeAutorisation.expertiseFonciere.gefIdentity || "Oui"}` 
                                  : "✗ Géomètre Expert non désigné"}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider font-mono">Dossier d'acquisition</span>
                              <span className="font-bold text-slate-700 block">
                                {meetingSelectedProject.etudeAutorisation?.expertiseFonciere?.acquisitionDemandEstablished 
                                  ? "✓ Dossier d'acquisition établi" 
                                  : "✗ Dossier d'acquisition non établi"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 2: Planification Temporelle */}
                      <div className="bg-white border border-slate-200/65 p-4 rounded-2xl space-y-3 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                          <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg font-bold">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider">2. Planification & Dates Clés</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[9px] font-black uppercase text-slate-400 block font-mono">Phase Études</span>
                            <div className="font-bold text-slate-700 mt-1">
                              {meetingSelectedProject.planning?.etudeStart ? `Du ${new Date(meetingSelectedProject.planning.etudeStart).toLocaleDateString("fr-FR")}` : "Non spécifié"}
                            </div>
                            <div className="font-bold text-slate-700">
                              {meetingSelectedProject.planning?.etudeEnd ? `Au ${new Date(meetingSelectedProject.planning.etudeEnd).toLocaleDateString("fr-FR")}` : "Non spécifié"}
                            </div>
                          </div>

                          <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[9px] font-black uppercase text-slate-400 block font-mono">Phase Travaux</span>
                            <div className="font-bold text-slate-700 mt-1">
                              {meetingSelectedProject.planning?.travauxStart ? `Du ${new Date(meetingSelectedProject.planning.travauxStart).toLocaleDateString("fr-FR")}` : "Non spécifié"}
                            </div>
                            <div className="font-bold text-slate-700">
                              {meetingSelectedProject.planning?.travauxEnd ? `Au ${new Date(meetingSelectedProject.planning.travauxEnd).toLocaleDateString("fr-FR")}` : "Non spécifié"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 3: Avancement Physique & Génie Civil */}
                      <div className="bg-white border border-slate-200/65 p-4 rounded-2xl space-y-4 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg font-bold">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider">3. Avancement Physique & Travaux</span>
                          </div>
                          
                          <div className="flex items-center gap-1 bg-blue-50 text-blue-800 font-black text-xs font-mono px-2.5 py-1 rounded-lg">
                            Global : {meetingSelectedProject.travauxPlanification?.avancementPhysique || 0}%
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                              <span>Avancement Génie Civil (GC)</span>
                              <span className="font-mono">{meetingSelectedProject.travauxPlanification?.avancementGC || 0}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${meetingSelectedProject.travauxPlanification?.avancementGC || 0}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                              <span>Avancement Montage Mécanique</span>
                              <span className="font-mono">{meetingSelectedProject.travauxPlanification?.avancementMeca || 0}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${meetingSelectedProject.travauxPlanification?.avancementMeca || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Quality Assurance Checklist */}
                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-2">
                          <span className="text-[9px] font-black uppercase text-slate-400 block font-mono">Assurance Qualité & Conformité</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex items-center gap-1.5 font-bold">
                              {meetingSelectedProject.travauxPlanification?.controleQualiteChecklist?.abaqueSoudageValide ? (
                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <X className="w-4 h-4 text-slate-350 shrink-0" />
                              )}
                              <span>Abaque de soudage validé</span>
                            </div>

                            <div className="flex items-center gap-1.5 font-bold">
                              {meetingSelectedProject.travauxPlanification?.controleQualiteChecklist?.radiographieCND ? (
                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <X className="w-4 h-4 text-slate-350 shrink-0" />
                              )}
                              <span>Contrôle non destructif (Radio/CND)</span>
                            </div>

                            <div className="flex items-center gap-1.5 font-bold">
                              {meetingSelectedProject.travauxPlanification?.controleQualiteChecklist?.enrobageVerifie ? (
                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <X className="w-4 h-4 text-slate-350 shrink-0" />
                              )}
                              <span>Contrôle de l'enrobage</span>
                            </div>

                            <div className="flex items-center gap-1.5 font-bold">
                              {meetingSelectedProject.travauxPlanification?.controleQualiteChecklist?.litPoseSableux ? (
                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <X className="w-4 h-4 text-slate-350 shrink-0" />
                              )}
                              <span>Lit de pose sableux vérifié</span>
                            </div>

                            <div className="flex items-center gap-1.5 sm:col-span-2 border-t border-slate-200/50 pt-1.5 mt-0.5 font-bold">
                              {meetingSelectedProject.travauxPlanification?.controleQualiteChecklist?.protectionCathodique ? (
                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <X className="w-4 h-4 text-slate-350 shrink-0" />
                              )}
                              <span>Protection cathodique en place</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 4: Essais Réglementaires */}
                      <div className="bg-white border border-slate-200/65 p-4 rounded-2xl space-y-3 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg font-bold">
                            <FileCheck className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider">4. Épreuves & Essais Réglementaires</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider font-mono">Épreuve de Résistance</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                              meetingSelectedProject.travauxPlanification?.essaisReglementaires?.epreuveResistance === "Réussie"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : meetingSelectedProject.travauxPlanification?.essaisReglementaires?.epreuveResistance === "En cours"
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}>
                              {meetingSelectedProject.travauxPlanification?.essaisReglementaires?.epreuveResistance || "Non faite"}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider font-mono">Épreuve d'Étanchéité</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                              meetingSelectedProject.travauxPlanification?.essaisReglementaires?.epreuveEtancheite === "Réussie"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : meetingSelectedProject.travauxPlanification?.essaisReglementaires?.epreuveEtancheite === "En cours"
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}>
                              {meetingSelectedProject.travauxPlanification?.essaisReglementaires?.epreuveEtancheite || "Non faite"}
                            </span>
                          </div>

                          {meetingSelectedProject.travauxPlanification?.essaisReglementaires?.organismeControleur && (
                            <div className="sm:col-span-2 border-t border-slate-100 pt-2 text-slate-500 font-bold text-[11px]">
                              Organisme de contrôle : <span className="text-slate-800 font-extrabold">{meetingSelectedProject.travauxPlanification.essaisReglementaires.organismeControleur}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 5: Mise en Gaz */}
                      <div className="bg-white border border-slate-200/65 p-4 rounded-2xl space-y-3 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                          <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg font-bold">
                            <Archive className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider">5. Mise en Gaz & Clôture</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider font-mono">Statut de Mise en Gaz</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase ${
                              meetingSelectedProject.miseEnGazArchive?.statutMiseEnGaz === "Réalisée"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : meetingSelectedProject.miseEnGazArchive?.statutMiseEnGaz === "Prête"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : meetingSelectedProject.miseEnGazArchive?.statutMiseEnGaz === "Planifiée"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}>
                              {meetingSelectedProject.miseEnGazArchive?.statutMiseEnGaz || "Non planifiée"}
                            </span>
                          </div>

                          {meetingSelectedProject.miseEnGazArchive?.dateEffectiveMiseEnGaz && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider font-mono">Date Effective</span>
                              <span className="font-extrabold text-slate-700 block text-[11px]">
                                {new Date(meetingSelectedProject.miseEnGazArchive.dateEffectiveMiseEnGaz).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400 text-center space-y-2">
                    <Presentation className="w-10 h-10 text-slate-300 animate-pulse" />
                    <p className="text-xs font-black uppercase tracking-wider">Aucun ouvrage sélectionné</p>
                    <p className="text-[11px] text-slate-400 max-w-xs leading-normal">
                      Veuillez cliquer sur le bouton de réunion d'un ouvrage dans le tableau pour afficher son résumé d'étapes.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Constraint Quick Edit Modal */}
        {editingConstraintsProjectId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-left">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <h3 className="font-black text-sm uppercase tracking-wide">Mise à Jour des Contraintes</h3>
                </div>
                <button 
                  onClick={() => setEditingConstraintsProjectId(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <p className="text-xs font-black text-slate-700 mb-1">
                  Ouvrage : {projects.find(p => p.id === editingConstraintsProjectId)?.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  Saisissez les oppositions de tiers, contraintes d'emprises, retards de livraison ou obstacles administratifs. Laissez vide s'il n'y a plus de contrainte.
                </p>
              </div>

              <textarea
                value={tempConstraintsText}
                onChange={e => setTempConstraintsText(e.target.value)}
                placeholder="Opposition de propriétaire parcelle PK 12, retards de signature de l'arrêté par la wilaya..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none min-h-[100px] focus:border-rose-500 font-medium text-slate-700"
              />

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setEditingConstraintsProjectId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveConstraintsQuickly}
                  disabled={isSavingConstraints}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-55 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingConstraints ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderTableauDeBord = () => {
    const totalCount = projects.length;
    const studiesApproved = projects.filter(p => p.etudeAutorisation.statutEtude === "Approuvée").length;
    const totalProgressSum = projects.reduce((sum, p) => sum + (p.travauxPlanification.avancementPhysique || 0), 0);
    const avgProgress = totalCount > 0 ? Math.round(totalProgressSum / totalCount) : 0;
    
    const activeConstraintsCount = projects.filter(p => p.identity.contraintes && p.identity.contraintes.trim().length > 0).length;
    
    let totalChecksCount = 0;
    let passedChecksCount = 0;
    projects.forEach(p => {
      const chk = p.travauxPlanification.controleQualiteChecklist;
      if (chk) {
        totalChecksCount += 5;
        if (chk.abaqueSoudageValide) passedChecksCount++;
        if (chk.radiographieCND) passedChecksCount++;
        if (chk.enrobageVerifie) passedChecksCount++;
        if (chk.litPoseSableux) passedChecksCount++;
        if (chk.protectionCathodique) passedChecksCount++;
      }
    });
    const qualityComplianceRate = totalChecksCount > 0 ? Math.round((passedChecksCount / totalChecksCount) * 100) : 0;

    const phaseCounts = {
      "Étude": projects.filter(p => p.identity.phase === "Étude").length,
      "Travaux": projects.filter(p => p.identity.phase === "Travaux").length,
      "Mise en Gaz": projects.filter(p => p.identity.phase === "Mise en Gaz").length,
      "Clôturé": projects.filter(p => p.identity.phase === "Clôturé").length,
    };

    const etudePct = totalCount > 0 ? Math.round((phaseCounts["Étude"] / totalCount) * 100) : 0;
    const travauxPct = totalCount > 0 ? Math.round((phaseCounts["Travaux"] / totalCount) * 100) : 0;
    const gazPct = totalCount > 0 ? Math.round((phaseCounts["Mise en Gaz"] / totalCount) * 100) : 0;
    const cloturePct = totalCount > 0 ? Math.round((phaseCounts["Clôturé"] / totalCount) * 100) : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="space-y-6 text-left"
      >
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Tableau de bord de performance</span>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-0.5">Analyses & Amélioration Continue</h2>
            <p className="text-xs text-slate-400 mt-1">
              Gouvernance opérationnelle SONELGAZ basée sur les KPIs de conformité, d'avancement physique et d'ingénierie.
            </p>
          </div>
          <div className="flex bg-slate-50 border border-slate-100 rounded-2xl p-1 shrink-0 self-start md:self-center">
            {(["mensuel", "trimestriel", "semestriel", "annuel"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setDashboardPeriod(period)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  dashboardPeriod === period
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-2.5 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Avancement Physique Moyen</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-blue-700 tracking-tight font-mono">{avgProgress}%</span>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full" style={{ width: `${avgProgress}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-2.5 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Conformité Qualité (Chantier)</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-emerald-700 tracking-tight font-mono">{qualityComplianceRate}%</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full" style={{ width: `${qualityComplianceRate}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-2.5 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Contraintes Actives</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-rose-700 tracking-tight font-mono">{activeConstraintsCount}</span>
              <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[10px] font-bold text-rose-600 bg-rose-50/50 px-2.5 py-1 rounded-lg border border-rose-100 inline-block">
              {activeConstraintsCount > 0 ? "⚠️ Libération des emprises requise" : "✓ Flux opérationnel optimal"}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-2.5 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Études Approuvées</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-amber-700 tracking-tight font-mono">
                {studiesApproved}/{totalCount}
              </span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[10px] font-bold text-amber-600 bg-amber-50/50 px-2.5 py-1 rounded-lg border border-amber-100 inline-block">
              {totalCount > 0 ? `${Math.round((studiesApproved / totalCount) * 100)}% de validation` : "0%"}
            </div>
          </div>
        </div>

        {/* ================= TABLEAU DE BORD OFFICIEL & INDICATEURS STRATÉGIQUES (02 TR 2026) ================= */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 text-left">
            <div>
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">SONELGAZ • Direction de l'Énergie</span>
              <h3 className="text-lg font-black text-slate-800 tracking-tight mt-0.5">Tableau de Bord Officiel & Indicateurs Clés (02 TR 2026)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Calculé automatiquement en temps réel sur la base des livrables et des arrêtés obtenus.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  // Print-friendly rendering or export
                  window.print();
                }}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer les Indicateurs</span>
              </button>
            </div>
          </div>

          {/* KPI Circular Dials Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* KPI 1: Taux d'obtention Permis */}
            {(() => {
              const pcObtained = projects.filter(p => p.etudeAutorisation?.statutPermisConstruire === "Reçu" || p.etudeAutorisation?.datePermisConstruire).length;
              const pct = totalCount > 0 ? Math.round((pcObtained / totalCount) * 100) : 0;
              const strokeDash = 2 * Math.PI * 30;
              const strokeOffset = strokeDash - (pct / 100) * strokeDash;
              const isSelected = selectedIndicatorTab === "permis";
              
              return (
                <button
                  type="button"
                  onClick={() => setSelectedIndicatorTab(isSelected ? null : "permis")}
                  className={`p-5 rounded-2xl border transition-all text-left flex flex-col items-center justify-center space-y-3 cursor-pointer outline-none ${
                    isSelected ? "bg-blue-50/50 border-blue-200 shadow-sm ring-1 ring-blue-100" : "bg-slate-50/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50/70"
                  }`}
                >
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider text-center block">Taux Obtention Permis (PC)</span>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="30" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="40" 
                        cy="40" 
                        r="30" 
                        stroke="#2563eb" 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray={strokeDash}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute text-base font-black text-slate-800 font-mono">{pct}%</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-black text-slate-700 block">{pcObtained} / {totalCount} Obtenus</span>
                    <span className="text-[9px] text-slate-400 font-bold">Cible officielle : 85%</span>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${pct >= 85 ? "bg-green-100 text-green-800" : pct >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                    {pct >= 85 ? "Objectif Atteint" : pct >= 50 ? "En Attention" : "Retard Critique"}
                  </span>
                </button>
              );
            })()}

            {/* KPI 2: Taux Arrêté de Servitude */}
            {(() => {
              const asObtained = projects.filter(p => p.etudeAutorisation?.statutArreteServitude === "Signé & Publié" || !!p.etudeAutorisation?.arreteServitudeRef).length;
              const pct = totalCount > 0 ? Math.round((asObtained / totalCount) * 100) : 0;
              const strokeDash = 2 * Math.PI * 30;
              const strokeOffset = strokeDash - (pct / 100) * strokeDash;
              const isSelected = selectedIndicatorTab === "servitude";
              
              return (
                <button
                  type="button"
                  onClick={() => setSelectedIndicatorTab(isSelected ? null : "servitude")}
                  className={`p-5 rounded-2xl border transition-all text-left flex flex-col items-center justify-center space-y-3 cursor-pointer outline-none ${
                    isSelected ? "bg-orange-50/50 border-orange-200 shadow-sm ring-1 ring-orange-100" : "bg-slate-50/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50/70"
                  }`}
                >
                  <div className="text-center space-y-0.5">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider text-center block">Taux Arrêté de Servitude (AS)</span>
                    <span className="text-[8px] text-slate-400/80 leading-tight block text-center max-w-[150px] font-medium">(Droit de passage / Section Permis & AS)</span>
                  </div>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="30" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="40" 
                        cy="40" 
                        r="30" 
                        stroke="#ea580c" 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray={strokeDash}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute text-base font-black text-slate-800 font-mono">{pct}%</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-black text-slate-700 block">{asObtained} / {totalCount} Obtenus</span>
                    <span className="text-[9px] text-slate-400 font-bold">Cible officielle : 75%</span>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${pct >= 75 ? "bg-green-100 text-green-800" : pct >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                    {pct >= 75 ? "Objectif Atteint" : pct >= 50 ? "En Attention" : "Retard Critique"}
                  </span>
                </button>
              );
            })()}

            {/* KPI 3: Taux Réalisation Étude */}
            {(() => {
              const etudeApproved = projects.filter(p => p.etudeAutorisation?.statutEtude === "Approuvée" || p.ficheSuivi?.etudeBetStatut === "Oui").length;
              const pct = totalCount > 0 ? Math.round((etudeApproved / totalCount) * 100) : 0;
              const strokeDash = 2 * Math.PI * 30;
              const strokeOffset = strokeDash - (pct / 100) * strokeDash;
              const isSelected = selectedIndicatorTab === "etude";
              
              return (
                <button
                  type="button"
                  onClick={() => setSelectedIndicatorTab(isSelected ? null : "etude")}
                  className={`p-5 rounded-2xl border transition-all text-left flex flex-col items-center justify-center space-y-3 cursor-pointer outline-none ${
                    isSelected ? "bg-emerald-50/50 border-emerald-200 shadow-sm ring-1 ring-emerald-100" : "bg-slate-50/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50/70"
                  }`}
                >
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider text-center block">Réalisation Étude (Approuvée)</span>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="30" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="40" 
                        cy="40" 
                        r="30" 
                        stroke="#059669" 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray={strokeDash}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute text-base font-black text-slate-800 font-mono">{pct}%</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-black text-slate-700 block">{etudeApproved} / {totalCount} Approuvées</span>
                    <span className="text-[9px] text-slate-400 font-bold">Cible officielle : 90%</span>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${pct >= 90 ? "bg-green-100 text-green-800" : pct >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                    {pct >= 90 ? "Objectif Atteint" : pct >= 60 ? "En Attention" : "Retard Critique"}
                  </span>
                </button>
              );
            })()}

            {/* KPI 4: Réalisation Travaux */}
            {(() => {
              const pct = avgProgress;
              const strokeDash = 2 * Math.PI * 30;
              const strokeOffset = strokeDash - (pct / 100) * strokeDash;
              const isSelected = selectedIndicatorTab === "travaux";
              
              return (
                <button
                  type="button"
                  onClick={() => setSelectedIndicatorTab(isSelected ? null : "travaux")}
                  className={`p-5 rounded-2xl border transition-all text-left flex flex-col items-center justify-center space-y-3 cursor-pointer outline-none ${
                    isSelected ? "bg-purple-50/50 border-purple-200 shadow-sm ring-1 ring-purple-100" : "bg-slate-50/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50/70"
                  }`}
                >
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider text-center block">Réalisation Travaux (Physique)</span>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="30" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="40" 
                        cy="40" 
                        r="30" 
                        stroke="#7c3aed" 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray={strokeDash}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute text-base font-black text-slate-800 font-mono">{pct}%</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-black text-slate-700 block">Avancement Moyen</span>
                    <span className="text-[9px] text-slate-400 font-bold">Cible officielle : 80%</span>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${pct >= 80 ? "bg-green-100 text-green-800" : pct >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                    {pct >= 80 ? "Objectif Atteint" : pct >= 50 ? "En Progression" : "Retard Modéré"}
                  </span>
                </button>
              );
            })()}
          </div>

          {/* Drill-down Detail Panel */}
          <AnimatePresence mode="wait">
            {selectedIndicatorTab && (
              <motion.div
                key={selectedIndicatorTab}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-50/60 rounded-2xl border border-slate-150 p-5 mt-2 space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-800"></span>
                      <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">
                        Détail Analytique : {
                          selectedIndicatorTab === "permis" ? "Permis de Construire (PC)" :
                          selectedIndicatorTab === "servitude" ? "Arrêté de Servitude (AS)" :
                          selectedIndicatorTab === "etude" ? "Approbation de l'Étude Technique" :
                          "Avancement Physique des Travaux"
                        }
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedIndicatorTab(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                    >
                      Masquer ✕
                    </button>
                  </div>

                  {/* Tabular details list of projects */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-black tracking-wider">
                          <th className="py-2.5 px-3">Gazoduc / Projet</th>
                          <th className="py-2.5 px-3">Pôle / Wilaya</th>
                          <th className="py-2.5 px-3">Cabinet / BE</th>
                          <th className="py-2.5 px-3">Statut Actuel</th>
                          <th className="py-2.5 px-3">Levée de Réserve</th>
                          <th className="py-2.5 px-3">Actions Correctives</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((p) => {
                          let isGreen = false;
                          let statusText = "";
                          let subText = "";
                          let bName = "";
                          let leveeText = "Aucune";
                          let actionText = "Aucune action requise";

                          if (selectedIndicatorTab === "permis") {
                            isGreen = !!(p.etudeAutorisation?.statutPermisConstruire === "Reçu" || p.etudeAutorisation?.datePermisConstruire);
                            statusText = p.etudeAutorisation?.statutPermisConstruire || (p.etudeAutorisation?.datePermisConstruire ? "Obtenu" : "Non déposé");
                            subText = p.etudeAutorisation?.datePermisConstruire ? "Obtenu le " + formatDateFrench(p.etudeAutorisation.datePermisConstruire) : p.ficheSuivi?.depotPcDate ? "Déposé le " + formatDateFrench(p.ficheSuivi.depotPcDate) : "Non démarré";
                            bName = p.ficheSuivi?.etudeBetCabinet || "Cabinet non renseigné";
                            leveeText = p.ficheSuivi?.etudeLeveeReserveStatus || (p.ficheSuivi?.etudeLeveeReserveDate ? "Levée" : "Aucune");
                            actionText = p.ficheSuivi?.etudeActionStatus || "N/A";
                          } else if (selectedIndicatorTab === "servitude") {
                            isGreen = p.etudeAutorisation?.statutArreteServitude === "Signé & Publié" || !!p.etudeAutorisation?.arreteServitudeRef;
                            statusText = p.etudeAutorisation?.statutArreteServitude || "Non lancé";
                            subText = p.etudeAutorisation?.arreteServitudeRef ? "Arrêté n° " + p.etudeAutorisation.arreteServitudeRef : (p.ficheSuivi?.depotAsDate ? "Déposé le " + formatDateFrench(p.ficheSuivi.depotAsDate) : "Non déposé");
                            bName = p.ficheSuivi?.etudeBetCabinet || "Cabinet non renseigné";
                            leveeText = p.ficheSuivi?.etudeLeveeReserveStatus || (p.ficheSuivi?.etudeLeveeReserveDate ? "Levée" : "Aucune");
                            actionText = p.ficheSuivi?.etudeActionStatus || "N/A";
                          } else if (selectedIndicatorTab === "etude") {
                            isGreen = !!(p.etudeAutorisation?.statutEtude === "Approuvée" || p.ficheSuivi?.etudeBetStatut === "Oui");
                            statusText = p.etudeAutorisation?.statutEtude || (p.ficheSuivi?.etudeBetStatut === "Oui" ? "Approuvée" : "En cours");
                            subText = p.ficheSuivi?.etudeBetCabinet ? `Cabinet: ${p.ficheSuivi.etudeBetCabinet}` : "Non démarrée";
                            bName = p.ficheSuivi?.etudeBetCabinet || "Non désigné";
                            leveeText = p.ficheSuivi?.etudeLeveeReserveStatus || (p.ficheSuivi?.etudeLeveeReserveDate ? "Levée" : "Aucune");
                            actionText = p.ficheSuivi?.etudeActionStatus || "N/A";
                          } else {
                            isGreen = (p.travauxPlanification?.avancementPhysique || 0) === 100;
                            statusText = `Avancement: ${p.travauxPlanification?.avancementPhysique || 0}%`;
                            subText = p.travauxPlanification?.essaisReglementaires?.organismeControleur ? `Contrôle: ${p.travauxPlanification.essaisReglementaires.organismeControleur}` : "Pas d'organisme";
                            bName = "Travaux";
                            leveeText = p.ficheSuivi?.expertiseLeveeReserveStatus || "Aucune";
                            actionText = p.ficheSuivi?.expertiseActionStatus || "N/A";
                          }

                          return (
                            <tr key={p.id} className="border-b border-slate-150 hover:bg-slate-100/50 transition-colors">
                              <td className="py-2.5 px-3 font-extrabold text-slate-800">{p.name}</td>
                              <td className="py-2.5 px-3 text-slate-500 font-medium">{p.identity?.pole || "N/A"} / {p.identity?.region || "N/A"}</td>
                              <td className="py-2.5 px-3 text-slate-600 font-bold">{bName}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] inline-block ${isGreen ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                                  {statusText}
                                </span>
                                <span className="block text-[9px] text-slate-400 mt-0.5">{subText}</span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px] max-w-[120px] truncate" title={leveeText}>{leveeText}</td>
                              <td className="py-2.5 px-3 text-slate-600 font-medium max-w-[150px] truncate" title={actionText}>{actionText}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* KPI Simulator Section */}
          <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/60 text-left">
            <h4 className="font-extrabold text-xs text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              <span>Générateur Automatique de Plan d'Action d'Urgence</span>
            </h4>
            <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
              Le système a analysé les points de blocage fonciers et administratifs et recommande les actions prioritaires immédiates suivantes pour maximiser les indicateurs de performance SONELGAZ :
            </p>
            <div className="mt-3.5 space-y-2 text-[11px] font-medium text-slate-700">
              {(() => {
                const pendingPc = projects.filter(p => p.etudeAutorisation?.statutPermisConstruire !== "Reçu" && !p.etudeAutorisation?.datePermisConstruire);
                const pendingAs = projects.filter(p => p.etudeAutorisation?.statutArreteServitude !== "Signé & Publié" && !p.etudeAutorisation?.arreteServitudeRef);
                
                return (
                  <>
                    {pendingPc.map((p, idx) => (
                      <div key={`rec-pc-${idx}`} className="p-2.5 bg-white rounded-xl border border-indigo-100 flex items-start gap-2 shadow-xs">
                        <span className="text-indigo-600 font-black">🎯 Action PC #{idx + 1} :</span>
                        <p className="flex-1 leading-tight text-slate-800">
                          Relancer d'urgence le dépôt du dossier de Permis de Construire pour <strong>{p.name}</strong> avec le cabinet <strong>{p.ficheSuivi?.etudeBetCabinet || "non désigné"}</strong>. Date de dépôt initiale : {p.ficheSuivi?.depotPcDate ? formatDateFrench(p.ficheSuivi.depotPcDate) : "non déposé"}.
                        </p>
                      </div>
                    ))}
                    {pendingAs.map((p, idx) => (
                      <div key={`rec-as-${idx}`} className="p-2.5 bg-white rounded-xl border border-indigo-100 flex items-start gap-2 shadow-xs">
                        <span className="text-orange-600 font-black">⚡ Action AS #{idx + 1} :</span>
                        <p className="flex-1 leading-tight text-slate-800">
                          Relancer d'urgence l'obtention de l'Arrêté de Servitude d'octroi du droit de servitude pour <strong>{p.name}</strong> auprès de la Wilaya. Suivi par le bureau d'études (BET) : <strong>{p.ficheSuivi?.etudeBetCabinet || "non désigné"}</strong>. Demande d'AS déposée le {p.ficheSuivi?.depotAsDate ? formatDateFrench(p.ficheSuivi.depotAsDate) : "en attente"}.
                        </p>
                      </div>
                    ))}
                    {pendingPc.length === 0 && pendingAs.length === 0 && (
                      <p className="text-green-700 font-bold italic">✓ Félicitations ! Tous les dossiers réglementaires (PC et AS) sont validés pour l'intégralité du programme.</p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Distribution des Projets par Phase</h3>
            <p className="text-[11px] text-slate-400">Positionnement des ouvrages dans le cycle de vie de développement de la SONELGAZ.</p>
            
            <div className="space-y-4">
              <div className="w-full h-8 bg-slate-100 rounded-2xl overflow-hidden flex text-white text-[10px] font-black shadow-inner">
                {etudePct > 0 && (
                  <div className="bg-blue-600 h-full flex items-center justify-center transition-all" style={{ width: `${etudePct}%` }} title={`Étude: ${phaseCounts["Étude"]} projets`}>
                    {etudePct}%
                  </div>
                )}
                {travauxPct > 0 && (
                  <div className="bg-orange-500 h-full flex items-center justify-center transition-all" style={{ width: `${travauxPct}%` }} title={`Travaux: ${phaseCounts["Travaux"]} projets`}>
                    {travauxPct}%
                  </div>
                )}
                {gazPct > 0 && (
                  <div className="bg-emerald-500 h-full flex items-center justify-center transition-all" style={{ width: `${gazPct}%` }} title={`Mise en Gaz: ${phaseCounts["Mise en Gaz"]} projets`}>
                    {gazPct}%
                  </div>
                )}
                {cloturePct > 0 && (
                  <div className="bg-slate-400 h-full flex items-center justify-center transition-all" style={{ width: `${cloturePct}%` }} title={`Clôturé: ${phaseCounts["Clôturé"]} projets`}>
                    {cloturePct}%
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-700">Étude</p>
                    <p className="text-[10px] text-slate-400 font-mono">{phaseCounts["Étude"]} projets</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-700">Travaux</p>
                    <p className="text-[10px] text-slate-400 font-mono">{phaseCounts["Travaux"]} projets</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-700">Mise en Gaz</p>
                    <p className="text-[10px] text-slate-400 font-mono">{phaseCounts["Mise en Gaz"]} projets</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-700">Clôturé</p>
                    <p className="text-[10px] text-slate-400 font-mono">{phaseCounts["Clôturé"]} projets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">Avancement Physique Comparatif</h3>
            <p className="text-[11px] text-slate-400">Progression individuelle des gazoducs par rapport à la cible de livraison (100%).</p>

            <div className="space-y-3.5 max-h-[140px] overflow-y-auto pr-1">
              {projects.map(p => (
                <div key={p.id} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-700">
                    <span className="truncate max-w-[200px]">{p.name}</span>
                    <span className="font-mono text-slate-500 text-[11px]">{p.travauxPlanification.avancementPhysique}%</span>
                  </div>
                  <div className="w-full bg-slate-50 border border-slate-100 h-2 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        p.travauxPlanification.avancementPhysique === 100 
                          ? "bg-emerald-500" 
                          : p.travauxPlanification.avancementPhysique > 50 
                            ? "bg-blue-600" 
                            : "bg-orange-500"
                      }`}
                      style={{ width: `${p.travauxPlanification.avancementPhysique}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest font-mono">
              Amélioration Continue — Plan d'action {dashboardPeriod}
            </span>
            <h3 className="text-lg md:text-xl font-black tracking-tight mt-0.5">
              {dashboardPeriod === "mensuel" && "Analyse Mensuelle : Opérations & Tranchées"}
              {dashboardPeriod === "trimestriel" && "Analyse Trimestrielle : Ingénierie & Foncier"}
              {dashboardPeriod === "semestriel" && "Analyse Semestrielle : Campagnes de Tests & Soudage"}
              {dashboardPeriod === "annuel" && "Analyse Annuelle : Alignement Stratégique & Réseau"}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {dashboardPeriod === "mensuel" && "Vérification des jalons opérationnels à court terme, libération ponctuelle des oppositions de tiers et coordination étroite avec l'organisme d'inspection agréé (VERITAL)."}
              {dashboardPeriod === "trimestriel" && "Optimisation des processus administratifs de PC et d'AS avec les GEF, réconciliation logistique du matériel tubulaire sous-douane et évaluation des livrables techniques."}
              {dashboardPeriod === "semestriel" && "Suivi de la certification de soudage des entrepreneurs agréés, audits périodiques d'enrobage et de protection cathodique, et préparation du plan hivernal d'approvisionnement gazier."}
              {dashboardPeriod === "annuel" && "Bilan consolidé des extensions de réseaux haute pression SONELGAZ, développement des compétences des équipes d'ingénieurs régionaux, et planification budgétaire décennale."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <h4 className="font-extrabold text-orange-400 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>Recommandations d'Ingénierie</span>
              </h4>
              <ul className="space-y-3 text-slate-300 pl-1 text-left">
                {dashboardPeriod === "mensuel" && (
                  <>
                    <li className="leading-relaxed">• <strong>Contrôle Verital :</strong> Programmer les audits de résistance au moins 5 jours à l'avance pour éviter la saturation opérationnelle de l'organisme.</li>
                    <li className="leading-relaxed">• <strong>Levée d'oppositions :</strong> Engager le médiateur régional pour les deux points de blocages signalés au niveau des propriétaires agricoles.</li>
                  </>
                )}
                {dashboardPeriod === "trimestriel" && (
                  <>
                    <li className="leading-relaxed">• <strong>Performance GEF :</strong> Mettre en demeure les cabinets de géomètres affichant un taux de retard supérieur à 20% sur la constitution des dossiers fonciers.</li>
                    <li className="leading-relaxed">• <strong>Abaques de soudage :</strong> Imposer la requalification systématique des abaques pour tout changement de lot de métal d'apport.</li>
                  </>
                )}
                {dashboardPeriod === "semestriel" && (
                  <>
                    <li className="leading-relaxed">• <strong>Campagne Cathodique :</strong> Procéder à la mesure de potentiel d'arrêt sur l'intégralité du tronçon enterré de Jijel avant remblaiement complet.</li>
                    <li className="leading-relaxed">• <strong>Contrôles non destructifs :</strong> Augmenter le taux de contrôle radiographique à 100% sur les zones à forte densité urbaine.</li>
                  </>
                )}
                {dashboardPeriod === "annuel" && (
                  <>
                    <li className="leading-relaxed">• <strong>Standardisation d'Acier :</strong> Migrer l'ensemble des futurs cahiers des charges vers la nuance d'acier API 5L X70 pour optimiser l'épaisseur de paroi.</li>
                    <li className="leading-relaxed">• <strong>Numérisation :</strong> Obliger les bureaux d'études à soumettre les plans de recollement au format d'archive structuré interopérable SIG.</li>
                  </>
                )}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-extrabold text-orange-400 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>Actions Correctives Planifiées ({Object.values(checkedImprovementActions).filter(Boolean).length}/5)</span>
              </h4>
              <div className="space-y-2.5 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left">
                {[
                  { id: "action_1", text: "Vérifier la conformité de l'étalonnage des appareils de radiographie" },
                  { id: "action_2", text: "Relancer le Wali pour la signature urgente de l'arrêté de servitude de Jijel" },
                  { id: "action_3", text: "Organiser un atelier technique de recyclage des soudeurs agréés" },
                  { id: "action_4", text: "Mettre à jour l'annuaire des cabinets GEF autorisés par pôle" },
                  { id: "action_5", text: "Établir la notice d'impact environnemental pour les traversées d'oued" }
                ].map((act) => (
                  <label key={act.id} className="flex items-start gap-2.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={checkedImprovementActions[act.id] || false}
                      onChange={() => setCheckedImprovementActions({
                        ...checkedImprovementActions,
                        [act.id]: !checkedImprovementActions[act.id]
                      })}
                      className="mt-0.5 rounded border-slate-800 bg-slate-900 text-orange-500 focus:ring-0"
                    />
                    <span className="leading-tight">{act.text}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderRapportMensuel = () => {
    const handleToggleReportProject = (id: string) => {
      if (selectedReportProjects.includes(id)) {
        setSelectedReportProjects(selectedReportProjects.filter(pId => pId !== id));
      } else {
        setSelectedReportProjects([...selectedReportProjects, id]);
      }
    };

    const reportSelectedObjects = projects.filter(p => selectedReportProjects.includes(p.id));

    const handleDownloadReportWord = (customFileName?: string) => {
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px;">
            <p style="font-weight: bold; font-size: 14pt; margin: 0; text-transform: uppercase; color: #1e3a8a;">SOCIÉTÉ ALGÉRIENNE DE L'ÉLECTRICITÉ ET DU GAZ (SONELGAZ)</p>
            <p style="font-weight: bold; font-size: 11pt; margin: 5px 0 0 0; color: #f97316;">DIRECTION RÉGIONALE DU TRANSPORT GAZ</p>
            <p style="font-size: 9pt; color: #64748b; margin: 2px 0 0 0;">Division Engineering et Travaux Neufs</p>
          </div>
          
          <h1 style="text-align: center; color: #1e3a8a; font-size: 20pt; margin-top: 30px; text-transform: uppercase;">Rapport d'Activité Mensuel des Projets Gazoducs</h1>
          <h3 style="text-align: center; color: #f97316; font-size: 14pt; margin-bottom: 30px;">Période : ${currentMonthName} ${reportYear}</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left;">Ouvrage (Nom de l'Installation)</th>
              <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left;">Wilaya</th>
              <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left;">Phase Actuelle</th>
              <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: center;">Avancement Physique</th>
              <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left;">Statut Qualité CND</th>
            </tr>
            ${reportSelectedObjects.map(p => `
              <tr>
                <td style="border: 1px solid #cbd5e1; padding: 10px; font-weight: bold;">${p.name}</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px;">${p.identity.wilaya}</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px; font-weight: bold; color: #475569;">${p.identity.phase}</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-weight: bold; color: #1d4ed8;">${p.travauxPlanification.avancementPhysique}%</td>
                <td style="border: 1px solid #cbd5e1; padding: 10px;">${p.travauxPlanification.controleQualiteChecklist.radiographieCND ? "Réussi" : "En cours"}</td>
              </tr>
            `).join("")}
          </table>

          <h2 style="color: #1e3a8a; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin-top: 25px;">1. Faits Marquants & Réalisations</h2>
          <p style="white-space: pre-line; line-height: 1.5; color: #334155;">${reportHighlights || "Aucun fait marquant enregistré pour cette période."}</p>

          <h2 style="color: #b91c1c; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin-top: 25px;">2. Contraintes & Blocages</h2>
          <p style="white-space: pre-line; line-height: 1.5; color: #991b1b;">${reportObstacles || "Aucune contrainte majeure enregistrée pour cette période."}</p>

          <h2 style="color: #1e3a8a; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin-top: 25px;">3. Actions Prioritaires (Mois Suivant)</h2>
          <p style="white-space: pre-line; line-height: 1.5; color: #334155;">${reportNextSteps || "Aucune action définie pour le mois suivant."}</p>
        </div>
      `;
      const fn = customFileName || `Rapport_Activite_Mensuel_${currentMonthName}_${reportYear}.doc`;
      downloadAsWord(htmlBody, fn);
    };

    const handleDownloadReportPDF = async (customFileName?: string) => {
      setIsGeneratingReport(true);
      try {
        const htmlBody = `
          <div style="font-family: 'Segoe UI', system-ui, sans-serif; padding: 30px; background-color: #ffffff; color: #1e293b; max-width: 800px; width: 800px;">
            <style>
              table { border-collapse: collapse; width: 100%; margin-top: 15px; margin-bottom: 15px; }
              th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 8.5pt; }
              th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
              h1, h2, h3, h4 { color: #1e3a8a; }
            </style>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000000; padding-bottom: 15px; margin-bottom: 20px;">
              <div>
                <p style="font-weight: 800; font-size: 10pt; margin: 0; text-transform: uppercase;">Société Algérienne de l'Électricité et du Gaz</p>
                <p style="font-weight: 900; font-size: 14pt; margin: 3px 0; color: #f97316; letter-spacing: 1px;">SONELGAZ</p>
                <p style="font-size: 8.5pt; font-weight: bold; color: #475569; margin: 0;">Direction Régionale du Transport Gaz</p>
                <p style="font-size: 8pt; color: #64748b; margin: 0;">Division Engineering et Travaux Neufs</p>
              </div>
              <div style="text-align: right; font-family: monospace; font-size: 8pt; color: #64748b;">
                <p style="margin: 0;">Réf: SNG/DRTG/DETN/${reportYear}-${reportMonth}</p>
                <p style="margin: 3px 0 0 0;">Date: ${new Date().toLocaleDateString("fr-FR")}</p>
              </div>
            </div>

            <div style="text-align: center; margin: 25px 0 20px 0;">
              <h1 style="font-size: 14pt; font-weight: 950; text-transform: uppercase; border-top: 1px solid #1e3a8a; border-bottom: 1px solid #1e3a8a; padding: 8px 0; margin: 0;">
                Rapport d'Activité Mensuel des Projets Gazoducs
              </h1>
              <p style="font-size: 9.5pt; font-weight: 900; color: #ea580c; margin: 5px 0 0 0; text-transform: uppercase;">
                Période d'évaluation : ${currentMonthName} ${reportYear}
              </p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background-color: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center; margin-bottom: 20px;">
              <div>
                <p style="font-size: 8pt; color: #64748b; margin: 0; text-transform: uppercase; font-weight: bold;">Ouvrages Suivis</p>
                <p style="font-size: 14pt; font-weight: 900; color: #0f172a; margin: 3px 0 0 0;">${reportSelectedObjects.length}</p>
              </div>
              <div>
                <p style="font-size: 8pt; color: #64748b; margin: 0; text-transform: uppercase; font-weight: bold;">Avancement Moyen</p>
                <p style="font-size: 14pt; font-weight: 900; color: #0f172a; margin: 3px 0 0 0;">
                  ${reportSelectedObjects.length > 0 
                    ? `${Math.round(reportSelectedObjects.reduce((sum, p) => sum + p.travauxPlanification.avancementPhysique, 0) / reportSelectedObjects.length)}%`
                    : "0%"}
                </p>
              </div>
              <div>
                <p style="font-size: 8pt; color: #64748b; margin: 0; text-transform: uppercase; font-weight: bold;">Statut Foncier</p>
                <p style="font-size: 14pt; font-weight: 900; color: #0f172a; margin: 3px 0 0 0;">
                  ${reportSelectedObjects.filter(p => p.etudeAutorisation.statutArreteServitude === "Signé & Publié").length} AS
                </p>
              </div>
            </div>

            <h4 style="font-size: 9pt; font-weight: 900; text-transform: uppercase; border-left: 3px solid #f97316; padding-left: 6px; margin: 20px 0 10px 0;">
              1. État d'avancement des ouvrages
            </h4>
            <table>
              <thead>
                <tr>
                  <th>Ouvrage (Nom de l'Installation)</th>
                  <th>Wilaya</th>
                  <th>Phase Actuelle</th>
                  <th style="text-align: center;">Avancement Physique</th>
                  <th>Statut Qualité CND</th>
                </tr>
              </thead>
              <tbody>
                ${reportSelectedObjects.map(p => `
                  <tr>
                    <td style="font-weight: bold;">${p.name}</td>
                    <td style="color: #475569;">${p.identity.wilaya}</td>
                    <td>${p.identity.phase}</td>
                    <td style="text-align: center; font-weight: bold; color: #1e3a8a;">${p.travauxPlanification.avancementPhysique}%</td>
                    <td style="font-size: 7.5pt; color: #64748b;">${p.travauxPlanification.controleQualiteChecklist.radiographieCND ? "Réussi" : "En cours"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div style="background-color: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0;">
                <p style="font-size: 8pt; font-weight: bold; color: #4f46e5; margin: 0 0 5px 0; text-transform: uppercase;">Faits Marquants & Réalisations</p>
                <p style="font-size: 8pt; color: #334155; margin: 0; white-space: pre-line;">${reportHighlights || "Aucun fait marquant."}</p>
              </div>
              <div style="background-color: #fef2f2; padding: 10px; border-radius: 10px; border: 1px solid #fee2e2;">
                <p style="font-size: 8pt; font-weight: bold; color: #b91c1c; margin: 0 0 5px 0; text-transform: uppercase;">Contraintes & Blocages</p>
                <p style="font-size: 8pt; color: #991b1b; margin: 0; white-space: pre-line;">${reportObstacles || "Aucun blocage."}</p>
              </div>
            </div>

            <h4 style="font-size: 9pt; font-weight: 900; text-transform: uppercase; border-left: 3px solid #f97316; padding-left: 6px; margin: 20px 0 10px 0;">
              2. Plan d'actions prioritaires (Mois M+1)
            </h4>
            <div style="background-color: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0;">
              <p style="font-size: 8pt; color: #334155; margin: 0; white-space: pre-line;">${reportNextSteps || "Aucune action définie."}</p>
            </div>
          </div>
        `;

        const tempDiv = document.createElement("div");
        tempDiv.style.position = "absolute";
        tempDiv.style.left = "-9999px";
        tempDiv.style.top = "-9999px";
        tempDiv.style.width = "800px";
        tempDiv.style.padding = "30px";
        tempDiv.style.backgroundColor = "#ffffff";
        tempDiv.innerHTML = htmlBody;
        document.body.appendChild(tempDiv);

        const canvas = await safeHtml2Canvas(tempDiv, {
          scale: 1.8,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const fn = customFileName || `Rapport_Activite_Mensuel_${currentMonthName}_${reportYear}.pdf`;
        pdf.save(fn);
        document.body.removeChild(tempDiv);
      } catch (err) {
        console.error("Error generating report PDF:", err);
        alert("Erreur lors de la génération du PDF.");
      } finally {
        setIsGeneratingReport(false);
      }
    };

    const triggerMonthlyArchivingArchiveAndNotify = async () => {
      handleDownloadReportWord(`ARCHIVE_Etat_Avancement_${currentMonthName}_${reportYear}.doc`);
      await handleDownloadReportPDF(`ARCHIVE_Etat_Avancement_${currentMonthName}_${reportYear}.pdf`);
      
      try {
        const filters = {
          annee: planDeChargeAnnee,
          pole: planDeChargePole,
          direction: planDeChargeDirection,
          wilaya: planDeChargeWilaya,
          phase: "all",
          search: planDeChargeSearch,
          objectif: planDeChargeObjectif
        };
        const chargeHtml = generatePlanDeChargeHtml(projects, filters);
        downloadAsWord(chargeHtml, `ARCHIVE_Plan_de_Charge_${currentMonthName}_${reportYear}.doc`);
        await handleExportPlanDeChargePDF(projects);
      } catch (pcErr) {
        console.warn("Could not archive plan de charge automatically:", pcErr);
      }

      try {
        const { createNotification } = await import("../lib/firebase");
        await createNotification({
          projectId: `backup_${reportYear}_${reportMonth}`,
          projectName: "Sauvegarde Générale d'Archivage",
          category: "status_change",
          message: `📂 [ARCHIVAGE DE SÉCURITÉ COMPLET] L'utilisateur habilité (${currentUser?.email || "Superviseur"}) a généré, téléchargé et archivé localement la copie officielle de sauvegarde de l'État d'avancement des ouvrages et du Plan de Charge Mensuel pour ${currentMonthName} ${reportYear}.`,
          authorName: userProfile?.name || "Administrateur Système",
          authorEmail: currentUser?.email || "admin@sonelgaz.dz",
          authorRole: userProfile?.role || "Superviseur",
          readBy: []
        });
        alert(`Sauvegarde mensuelle effectuée avec succès ! Les états d'avancement et le plan de charge au format Word et PDF ont été téléchargés de manière sécurisée.`);
      } catch (notifErr) {
        console.warn("Could not log archiving notification:", notifErr);
        alert(`Sauvegarde réussie ! Vos documents d'archivage mensuels ont été enregistrés localement.`);
      }
    };

    const monthsFR = [
      { code: "01", name: "Janvier" },
      { code: "02", name: "Février" },
      { code: "03", name: "Mars" },
      { code: "04", name: "Avril" },
      { code: "05", name: "Mai" },
      { code: "06", name: "Juin" },
      { code: "07", name: "Juillet" },
      { code: "08", name: "Août" },
      { code: "09", name: "Septembre" },
      { code: "10", name: "Octobre" },
      { code: "11", name: "Novembre" },
      { code: "12", name: "Décembre" },
    ];

    const currentMonthName = monthsFR.find(m => m.code === reportMonth)?.name || "Juillet";

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="space-y-6 text-left"
      >
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Générateur automatisé de rapports</span>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-0.5">Rapports d'Activité Mensuels</h2>
            <p className="text-xs text-slate-400 mt-1">
              Générez, assainissez et consolidez des synthèses formelles d'ingénierie et d'avancement pour la Direction de Région SONELGAZ.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            <div className="lg:col-span-1 space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs text-left">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">Configurations du Rapport</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Mois d'activité</label>
                  <select
                    value={reportMonth}
                    onChange={e => setReportMonth(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 outline-none font-bold text-slate-800"
                  >
                    {monthsFR.map(m => (
                      <option key={m.code} value={m.code}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Année d'activité</label>
                  <select
                    value={reportYear}
                    onChange={e => setReportYear(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 outline-none font-bold text-slate-800"
                  >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-slate-600 block">Projets à inclure ({selectedReportProjects.length})</label>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto bg-white border border-slate-200 rounded-xl p-3 text-left">
                  {projects.map(p => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedReportProjects.includes(p.id)}
                        onChange={() => handleToggleReportProject(p.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                      />
                      <span className="truncate">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Faits Marquants (Highlights)</label>
                  <textarea
                    value={reportHighlights}
                    onChange={e => setReportHighlights(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none min-h-[80px] font-medium text-slate-700 text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Contraintes & Points de Blocage</label>
                  <textarea
                    value={reportObstacles}
                    onChange={e => setReportObstacles(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none min-h-[80px] font-medium text-slate-700 text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Actions Prioritaires Mois Suivant</label>
                  <textarea
                    value={reportNextSteps}
                    onChange={e => setReportNextSteps(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none min-h-[80px] font-medium text-slate-700 text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Aperçu du Rapport d'Activité Officiel</span>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">Sauvegardez en format certifié et notifiez la direction</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDownloadReportWord()}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold rounded-lg text-[11px] transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                    title="Télécharger l'avancement au format Word (.doc)"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Word (DOC)</span>
                  </button>
                  <button
                    onClick={() => handleDownloadReportPDF()}
                    disabled={isGeneratingReport}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-950 text-white font-extrabold rounded-lg text-[11px] transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Télécharger l'avancement au format PDF"
                  >
                    {isGeneratingReport ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <FileText className="w-3 h-3" />
                    )}
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={triggerMonthlyArchivingArchiveAndNotify}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[11px] transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                    title="Sauvegarde l'état d'avancement + le plan de charge en format Word + PDF et notifie Firestore"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Sauvegarde Mensuelle Globale</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm font-sans space-y-6 min-h-[600px] relative overflow-hidden text-left">
                <div className="flex justify-between items-start border-b-2 border-slate-950 pb-5 text-slate-800">
                  <div className="space-y-1 text-left">
                    <p className="font-extrabold text-[11px] uppercase tracking-wider text-slate-950">Société Algérienne de l'Électricité et du Gaz</p>
                    <p className="font-black text-xs text-orange-500 uppercase tracking-widest">SONELGAZ</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Direction Régionale du Transport Gaz</p>
                    <p className="text-[9px] font-medium text-slate-400">Division Engineering et Travaux Neufs</p>
                  </div>
                  <div className="text-right space-y-0.5 text-[9px] font-mono text-slate-400">
                    <p>Réf: SNG/DRTG/DETN/{reportYear}-{reportMonth}</p>
                    <p>Date: {new Date().toLocaleDateString("fr-FR")}</p>
                    <p>Lieu: Alger, Algérie</p>
                  </div>
                </div>

                <div className="text-center py-2 space-y-1">
                  <h1 className="text-base md:text-lg font-black text-slate-950 uppercase tracking-wide border-y border-slate-900 py-1.5">
                    Rapport d'Activité Mensuel des Projets Gazoducs
                  </h1>
                  <p className="text-[11px] font-black uppercase text-orange-600 tracking-wider">
                    Période d'évaluation : {currentMonthName} {reportYear}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center text-xs">
                  <div>
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Ouvrages Suivis</p>
                    <p className="font-black text-slate-900 text-lg">{reportSelectedObjects.length}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Avancement Moyen</p>
                    <p className="font-black text-slate-900 text-lg">
                      {reportSelectedObjects.length > 0 
                        ? `${Math.round(reportSelectedObjects.reduce((sum, p) => sum + p.travauxPlanification.avancementPhysique, 0) / reportSelectedObjects.length)}%`
                        : "0%"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Statut Foncier (Approved)</p>
                    <p className="font-black text-slate-900 text-lg">
                      {reportSelectedObjects.filter(p => p.etudeAutorisation.statutArreteServitude === "Signé & Publié").length} AS
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-black text-xs text-slate-950 uppercase tracking-wide border-l-2 border-orange-500 pl-1.5">
                    1. État d'avancement des ouvrages
                  </h4>
                  <table className="w-full text-left border-collapse border border-slate-200 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-black text-slate-700">
                        <th className="py-2 px-2.5">Ouvrage (Nom de l'Installation)</th>
                        <th className="py-2 px-2.5">Wilaya</th>
                        <th className="py-2 px-2.5">Phase Actuelle</th>
                        <th className="py-2 px-2.5 text-center">Avancement Physique</th>
                        <th className="py-2 px-2.5">Statut Qualité CND</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {reportSelectedObjects.map(p => (
                        <tr key={p.id}>
                          <td className="py-2 px-2.5 font-bold">{p.name}</td>
                          <td className="py-2 px-2.5 text-slate-600">{p.identity.wilaya}</td>
                          <td className="py-2 px-2.5">
                            <span className="font-semibold text-slate-600">{p.identity.phase}</span>
                          </td>
                          <td className="py-2 px-2.5 text-center font-bold text-blue-800 font-mono">
                            {p.travauxPlanification.avancementPhysique}%
                          </td>
                          <td className="py-2 px-2.5 font-mono text-[9px] text-slate-500">
                            {p.travauxPlanification.controleQualiteChecklist.radiographieCND ? "Réussi" : "En cours"}
                          </td>
                        </tr>
                      ))}
                      {reportSelectedObjects.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-4 italic text-slate-400">Aucun ouvrage inclus.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-left">
                    <h5 className="font-black text-slate-950 uppercase tracking-wide text-[9px] text-indigo-700">Faits Marquants & Réalisations</h5>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line font-medium">{reportHighlights}</p>
                  </div>

                  <div className="space-y-1.5 bg-rose-50/40 p-3 rounded-2xl border border-rose-100 text-left">
                    <h5 className="font-black text-rose-950 uppercase tracking-wide text-[9px] text-rose-700">Contraintes & Blocages</h5>
                    <p className="text-rose-900 leading-relaxed whitespace-pre-line font-medium">{reportObstacles}</p>
                  </div>
                </div>

                <div className="space-y-2 text-[11px] text-left">
                  <h4 className="font-black text-xs text-slate-950 uppercase tracking-wide border-l-2 border-orange-500 pl-1.5">
                    2. Plan d'actions prioritaires (Mois M+1)
                  </h4>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line font-medium">{reportNextSteps}</p>
                  </div>
                </div>

                <div className="pt-6 grid grid-cols-2 text-center text-[10px] font-bold text-slate-800 border-t border-slate-100">
                  <div className="space-y-12">
                    <p className="uppercase text-slate-500">L'Ingénieur Chef de Projet (Engineering)</p>
                    <p className="font-extrabold text-slate-950">Visa & Signature</p>
                  </div>
                  <div className="space-y-12">
                    <p className="uppercase text-slate-500">Le Directeur de Région (Approbation)</p>
                    <p className="font-extrabold text-slate-950">Visa & Signature</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderBordereauPrixContent = (project: Project) => {
    if (!project) {
      return (
        <div className="text-center text-slate-500 font-bold p-8">
          Aucun ouvrage sélectionné.
        </div>
      );
    }

    const currentItems = 
      bordereauActivePart === "01" ? etudeItems : 
      bordereauActivePart === "02" ? expertItems : 
      travauxItems;

    const totalHT = currentItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
    const tva = totalHT * 0.19;
    const totalTTC = totalHT + tva;

    const formatDALocal = (val: number) => {
      return new Intl.NumberFormat("fr-DZ", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val) + " DA";
    };

    const handlePriceChange = (itemId: string, newPrice: number) => {
      if (bordereauActivePart === "01") {
        setBePrices(prev => ({ ...prev, [itemId]: newPrice }));
      } else if (bordereauActivePart === "02") {
        setGefPrices(prev => ({ ...prev, [itemId]: newPrice }));
      } else {
        setTravauxPrices(prev => ({ ...prev, [itemId]: newPrice }));
      }
    };

    const resetPrices = () => {
      if (bordereauActivePart === "01") {
        setBePrices({
          impact: 1500000,
          topo: 45000,
          ing: 3000000,
          dup: 800000,
          geo: 120000
        });
      } else if (bordereauActivePart === "02") {
        setGefPrices({
          enq: 150000,
          exp: 80000,
          assist: 250000,
          cnd: 4500,
          audit: 65000
        });
      } else {
        setTravauxPrices({
          piste: 12000,
          lit: 4000,
          soudage: 18000,
          enrobage: 85000,
          gr_dep: 4500000,
          gr_arr: 4500000,
          poste_coup: 3500000,
          poste_det: 15000000,
          raccord: 2500000,
          protection: 3500000,
          epreuve: 150000
        });
      }
    };

    return (
      <div className="space-y-6">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider font-mono">Estimation Budgétaire Automatique</span>
            <h4 className="font-extrabold text-base text-slate-800">Détails d'estimation de l'ouvrage : {project.name}</h4>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetPrices}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600 cursor-pointer transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Réinitialiser les prix
            </button>
            <button
              onClick={() => setShowPrintBordereauModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1.5 active:scale-95 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              Imprimer le Bordereau
            </button>
          </div>
        </div>

        {/* Parametres de calcul */}
        <div className="bg-slate-900 text-slate-200 p-4.5 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Dimensions principales</span>
            <div className="flex gap-4">
              <div>
                <span className="text-slate-400">Longueur :</span> <span className="font-mono font-black text-white">{longNum} km</span>
              </div>
              <div>
                <span className="text-slate-400">Diamètre :</span> <span className="font-mono font-black text-white">{diamNum}" (DN)</span>
              </div>
            </div>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Éléments de structure actifs détectés</span>
            <div className="flex flex-wrap gap-1.5">
              {project.identity.caracteristiques?.hasGareRacleurDepart && (
                <span className="bg-slate-800 border border-slate-700 text-[10px] px-2 py-0.5 rounded font-bold text-blue-400">🚀 Gare Racleur Départ</span>
              )}
              {project.identity.caracteristiques?.hasGareRacleurArrivee && (
                <span className="bg-slate-800 border border-slate-700 text-[10px] px-2 py-0.5 rounded font-bold text-blue-400">🏁 Gare Racleur Arrivée</span>
              )}
              {project.identity.caracteristiques?.hasPosteDetente && (
                <span className="bg-slate-800 border border-slate-700 text-[10px] px-2 py-0.5 rounded font-bold text-emerald-400">🔥 Poste Détente</span>
              )}
              {project.identity.caracteristiques?.hasPosteCoupure && (
                <span className="bg-slate-800 border border-slate-700 text-[10px] px-2 py-0.5 rounded font-bold text-yellow-400">🔌 Poste Coupure</span>
              )}
              {project.identity.caracteristiques?.hasPosteSectionnement && (
                <span className="bg-slate-800 border border-slate-700 text-[10px] px-2 py-0.5 rounded font-bold text-yellow-400">🛡️ Poste Sectionnement</span>
              )}
              {project.identity.caracteristiques?.pointRaccordement && (
                <span className="bg-slate-800 border border-slate-700 text-[10px] px-2 py-0.5 rounded font-bold text-purple-400">🔌 Raccordement</span>
              )}
              {!project.identity.caracteristiques?.hasGareRacleurDepart && 
               !project.identity.caracteristiques?.hasGareRacleurArrivee && 
               !project.identity.caracteristiques?.hasPosteDetente && 
               !project.identity.caracteristiques?.hasPosteCoupure && 
               !project.identity.caracteristiques?.hasPosteSectionnement && 
               !project.identity.caracteristiques?.pointRaccordement && (
                <span className="text-slate-500 italic text-[11px]">Aucun poste ou équipement configuré dans l'identité technique.</span>
              )}
            </div>
          </div>
        </div>

        {/* Bordereau Type Selector */}
        <div className="flex bg-slate-50 p-1 rounded-2xl gap-1 border border-slate-200/50">
          <button
            onClick={() => setBordereauActivePart("01")}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              bordereauActivePart === "01" 
                ? "bg-white text-rose-600 shadow-sm border border-slate-200" 
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Partie 01 • Études (BE)
          </button>
          <button
            onClick={() => setBordereauActivePart("02")}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              bordereauActivePart === "02" 
                ? "bg-white text-rose-600 shadow-sm border border-slate-200" 
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Partie 02 • Expertise & CND
          </button>
          <button
            onClick={() => setBordereauActivePart("03")}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              bordereauActivePart === "03" 
                ? "bg-white text-rose-600 shadow-sm border border-slate-200" 
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Partie 03 • Travaux (GC & Méca)
          </button>
        </div>

        {/* Table of items */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-inner">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[9px] tracking-wide">
                <th className="py-3 px-3 w-12 text-center">N°</th>
                <th className="py-3 px-3 min-w-[280px]">Désignation des Prestations</th>
                <th className="py-3 px-2 w-14 text-center">Unité</th>
                <th className="py-3 px-3 w-20 text-center">Quantité</th>
                <th className="py-3 px-3 w-32 text-right">Prix Unitaire (DA)</th>
                <th className="py-3 px-3 w-32 text-right">Total HT (DA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {currentItems.map((item) => {
                const totalItem = item.qty * item.price;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-3 px-3 font-mono font-black text-slate-400 text-center">{item.code}</td>
                    <td className="py-3 px-3">
                      <p className="font-extrabold text-slate-800 leading-tight">{item.designation}</p>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5 block italic">Formule : {item.formula}</span>
                    </td>
                    <td className="py-3 px-2 font-bold text-center text-slate-500">{item.unit}</td>
                    <td className="py-3 px-3 font-mono font-bold text-center text-slate-800">{item.qty}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1 select-all">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            const p = Math.max(0, parseInt(e.target.value) || 0);
                            handlePriceChange(item.id, p);
                          }}
                          className="w-20 font-mono text-right font-black text-slate-800 outline-none border-none p-0 text-[11px]"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">DA</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-right text-slate-900">
                      {formatDALocal(totalItem)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 flex flex-col justify-center space-y-1 text-left">
            <p className="font-bold uppercase text-[9px] text-slate-400">Notice légale & d'estimation :</p>
            <p className="leading-relaxed">
              Ce bordereau est une estimation automatisée fournie par la <strong>Division Engineering et Travaux Neufs (DETN)</strong>. Les quantités et prix sont sujets à réajustements contradictoires lors des réunions d'ouverture de plis ou d'avenants techniques.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 divide-y divide-slate-200/60 text-xs space-y-3.5">
            <div className="flex justify-between items-center pb-2.5">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Total Partiel HT :</span>
              <span className="font-mono font-black text-slate-800 text-sm">{formatDALocal(totalHT)}</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="font-bold text-slate-500 uppercase text-[10px]">TVA Réglementaire (19%) :</span>
              <span className="font-mono font-black text-slate-800 text-sm">{formatDALocal(tva)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 text-slate-950 font-black">
              <span className="uppercase tracking-wider">Montant Estimé TTC :</span>
              <span className="font-mono text-base text-rose-600 bg-rose-50 border border-rose-100 px-3.5 py-1.5 rounded-xl">{formatDALocal(totalTTC)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBordereauPrixModule = () => {
    if (projects.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500 font-medium text-left">
          Aucun ouvrage/projet enregistré pour générer un bordereau.
        </div>
      );
    }

    const activeProject = projects.find(p => p.id === bordereauSelectedProjectId) || projects[0];

    return (
      <motion.div
        key="bordereau-module"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="space-y-6"
      >
        {/* Project Selector Header */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider font-mono">Module Transport Gaz</span>
            <h3 className="font-extrabold text-lg text-slate-800">Édition & Chiffrage du Bordereau des Prix (BPU)</h3>
            <p className="text-xs text-slate-500 font-medium">Sélectionnez un ouvrage gaz pour générer et éditer son BPU officiel.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 shrink-0">Ouvrage :</span>
            <select
              value={bordereauSelectedProjectId === "all" ? activeProject?.id : bordereauSelectedProjectId}
              onChange={(e) => setBordereauSelectedProjectId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-black rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer min-w-[240px]"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} ({proj.identity?.wilaya || "N/A"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* The beautiful BPU container */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          {renderBordereauPrixContent(activeProject)}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 font-bold">Synchronisation des projets Sonelgaz avec Firebase Firestore...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sidebar Navigation Module selector */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Module Sidebar */}
        <div className="xl:w-64 shrink-0 flex flex-col gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
            <div className="border-b border-slate-100 pb-3 text-left">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Module Transport Gaz</h4>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => {
                  setActiveModule("charge");
                  setIsEditing(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-black transition-all border cursor-pointer ${
                  activeModule === "charge"
                    ? "bg-gradient-to-r from-blue-700 to-blue-800 text-white border-blue-900 shadow-md shadow-blue-500/10 scale-[1.02]"
                    : "bg-slate-50/70 hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700"
                }`}
              >
                <Sliders className="w-4 h-4 shrink-0" />
                <span>Plan de charge</span>
              </button>

              <button
                onClick={() => setActiveModule("gestion")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-black transition-all border cursor-pointer ${
                  activeModule === "gestion"
                    ? "bg-gradient-to-r from-blue-700 to-blue-800 text-white border-blue-900 shadow-md shadow-blue-500/10 scale-[1.02]"
                    : "bg-slate-50/70 hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700"
                }`}
              >
                <Briefcase className="w-4 h-4 shrink-0" />
                <span>Gestion de projet</span>
              </button>

              <button
                onClick={() => {
                  setActiveModule("dashboard");
                  setIsEditing(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-black transition-all border cursor-pointer ${
                  activeModule === "dashboard"
                    ? "bg-gradient-to-r from-blue-700 to-blue-800 text-white border-blue-900 shadow-md shadow-blue-500/10 scale-[1.02]"
                    : "bg-slate-50/70 hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700"
                }`}
              >
                <Activity className="w-4 h-4 shrink-0" />
                <span>Tableau de bord</span>
              </button>

              <button
                onClick={() => {
                  setActiveModule("report");
                  setIsEditing(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-black transition-all border cursor-pointer ${
                  activeModule === "report"
                    ? "bg-gradient-to-r from-blue-700 to-blue-800 text-white border-blue-900 shadow-md shadow-blue-500/10 scale-[1.02]"
                    : "bg-slate-50/70 hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700"
                }`}
              >
                <FileCheck className="w-4 h-4 shrink-0" />
                <span>Rapport mensuel</span>
              </button>


            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-4.5 space-y-3 shadow-md border border-slate-800 hidden xl:block text-left">
            <div className="flex gap-2 items-center text-orange-400">
              <Shield className="w-4 h-4 text-orange-400" />
              <span className="font-black text-[9px] uppercase tracking-wider">Gouvernance</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed font-semibold">
              Ce système centralise la planification, l'avancement physique et les contraintes des ouvrages de transport gaz SONELGAZ.
            </p>
          </div>
        </div>

        {/* Content pane */}
        <div id="current-content-pane" className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeModule === "charge" && renderPlanDeCharge()}
            {activeModule === "dashboard" && renderTableauDeBord()}
            {activeModule === "bordereau" && renderBordereauPrixModule()}
            {activeModule === "report" && renderRapportMensuel()}
            {activeModule === "gestion" && (() => {
              const filteredGestionProjects = projects.filter(p => {
                const searchLower = gestionSearchProjet.toLowerCase();
                const matchesSearch = p.name.toLowerCase().includes(searchLower);

                const pYear = p.planning?.etudeStart ? p.planning.etudeStart.substring(0, 4) : (p.createdAt ? p.createdAt.substring(0, 4) : "2026");
                const matchesAnnee = gestionFilterAnnee === "Tous" || pYear === gestionFilterAnnee;
                const matchesPole = gestionFilterPole === "Tous" || p.identity.pole === gestionFilterPole;
                const matchesDirection = gestionFilterDirection === "Tous" || p.identity.region === gestionFilterDirection;
                const matchesWilaya = gestionFilterWilaya === "Tous" || p.identity.wilaya === gestionFilterWilaya;

                return matchesSearch && matchesAnnee && matchesPole && matchesDirection && matchesWilaya;
              });

              return (
                <motion.div
                  key="gestion-content"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {/* Gestion de projet Search & Advanced Filter Header */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider font-mono">Module d'Ingénierie</span>
                        <h3 className="text-lg font-black text-slate-800">Gestion de projet détaillée</h3>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Rechercher par nom d'ouvrage..."
                          value={gestionSearchProjet}
                          onChange={e => setGestionSearchProjet(e.target.value)}
                          className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl text-xs outline-none w-64 font-medium text-slate-700 transition-all"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400 text-[10px] uppercase tracking-wider font-mono">Année</label>
                        <select
                          value={gestionFilterAnnee}
                          onChange={e => setGestionFilterAnnee(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                        >
                          <option value="Tous">Toutes les années</option>
                          {uniqueYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-400 text-[10px] uppercase tracking-wider font-mono">Pôle TG</label>
                        <select
                          value={gestionFilterPole}
                          onChange={e => setGestionFilterPole(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                        >
                          <option value="Tous">Tous les pôles</option>
                          {uniquePoles.map(pole => (
                            <option key={pole} value={pole}>{pole}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-400 text-[10px] uppercase tracking-wider font-mono">Direction / Région</label>
                        <select
                          value={gestionFilterDirection}
                          onChange={e => setGestionFilterDirection(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                        >
                          <option value="Tous">Toutes les directions</option>
                          {uniqueDirections.map(dir => (
                            <option key={dir} value={dir}>{dir}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-400 text-[10px] uppercase tracking-wider font-mono">Wilaya</label>
                        <select
                          value={gestionFilterWilaya}
                          onChange={e => setGestionFilterWilaya(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                        >
                          <option value="Tous">Toutes les wilayas</option>
                          {uniqueWilayas.map(wilaya => (
                            <option key={wilaya} value={wilaya}>{wilaya}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Projets Filtrés Horizontal Bar */}
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                        Ouvrages Sélectionnés ({filteredGestionProjects.length})
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold italic">Faites défiler horizontalement ➔</span>
                    </div>

                    <div className="flex overflow-x-auto whitespace-nowrap gap-3 pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-200 scroll-smooth">
                      {filteredGestionProjects.map((p) => {
                        const isActive = selectedProjectId === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              if (!isEditing) {
                                setSelectedProjectId(p.id);
                                setActiveSubTab("planning");
                              }
                            }}
                            className={`inline-flex flex-col justify-between gap-2 p-3.5 rounded-2xl cursor-pointer transition-all border text-left min-w-[240px] max-w-[280px] group relative ${
                              isActive
                                ? "bg-gradient-to-br from-blue-700 to-blue-800 text-white border-blue-950 shadow-md scale-[1.01]"
                                : "bg-slate-50 hover:bg-slate-100/80 border-slate-200/60"
                            } ${isEditing ? "opacity-40 cursor-not-allowed" : ""}`}
                          >
                            <div className="truncate">
                              <h5 className={`font-black text-xs leading-tight truncate ${isActive ? "text-white" : "text-slate-800"}`} title={p.name}>
                                {p.name}
                              </h5>
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                                  isActive ? "bg-white/10 text-white border-white/20" : getPhaseBadgeColor(p.identity.phase)
                                }`}>
                                  {p.identity.phase}
                                </span>
                                <span className={`text-[9px] font-mono font-bold uppercase truncate ${isActive ? "text-blue-200" : "text-slate-400"}`}>
                                  {p.identity.region}
                                </span>
                              </div>
                            </div>

                            {/* Actions for Admins on list */}
                            {hasPrivilege("ajout_projet") && !isEditing && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectToDelete(p.id);
                                }}
                                className={`absolute top-2 right-2 p-1 rounded-md transition-colors ${
                                  isActive ? "text-white/60 hover:text-red-300 hover:bg-white/10" : "text-slate-400 hover:text-red-500 hover:bg-slate-100"
                                } opacity-0 group-hover:opacity-100 z-10`}
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {filteredGestionProjects.length === 0 && (
                        <p className="text-xs text-slate-400 italic py-3 w-full text-center">Aucun ouvrage ne correspond à vos filtres.</p>
                      )}
                    </div>
                  </div>

                  {/* Main Area - Project Details with Phase Tabs (Full-Width) */}
                  <div className="w-full space-y-6">
        {isEditing && editProjectData ? (
          /* ================= EDITING / CREATING MODE ================= */
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                  {isCreating ? "Création de projet" : "Édition de projet"}
                </span>
                <input
                  type="text"
                  value={editProjectData.name}
                  onChange={(e) => setEditProjectData({ ...editProjectData, name: e.target.value })}
                  className="block w-full text-base sm:text-lg font-extrabold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:border-blue-600 focus:outline-none focus:ring-0 mt-1 max-w-2xl"
                  placeholder="Nom du projet Gazoduc"
                />
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                    setEditProjectData(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Annuler</span>
                </button>
                <button
                  onClick={isCreating ? handleCreateProject : saveProjectChanges}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-orange-500/20 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isCreating ? "Créer" : "Enregistrer"}</span>
                </button>
              </div>
            </div>

            {/* Editing Form Grid divided into the standard project sections */}
            <div className="space-y-6 divide-y divide-slate-100">
              {/* Phase 00: Planning Calendrier */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-blue-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Phase 00 : Planification des dates (Graphique Gantt)</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Début Phase Étude</label>
                    <input
                      type="date"
                      value={editProjectData.planning.etudeStart}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        planning: { ...editProjectData.planning, etudeStart: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Fin Phase Étude</label>
                    <input
                      type="date"
                      value={editProjectData.planning.etudeEnd}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        planning: { ...editProjectData.planning, etudeEnd: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Début Phase Travaux</label>
                    <input
                      type="date"
                      value={editProjectData.planning.travauxStart}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        planning: { ...editProjectData.planning, travauxStart: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Fin Phase Travaux</label>
                    <input
                      type="date"
                      value={editProjectData.planning.travauxEnd}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        planning: { ...editProjectData.planning, travauxEnd: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Début Essais Réglementaires</label>
                    <input
                      type="date"
                      value={editProjectData.planning.essaisStart}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        planning: { ...editProjectData.planning, essaisStart: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Fin Essais Réglementaires</label>
                    <input
                      type="date"
                      value={editProjectData.planning.essaisEnd}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        planning: { ...editProjectData.planning, essaisEnd: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Début Mise en Gaz</label>
                    <input
                      type="date"
                      value={editProjectData.planning.gazStart}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        planning: { ...editProjectData.planning, gazStart: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Fin Mise en Gaz</label>
                    <input
                      type="date"
                      value={editProjectData.planning.gazEnd}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        planning: { ...editProjectData.planning, gazEnd: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Phase 01: Identité du projet */}
              <div className="space-y-4 pt-4">
                <h4 className="font-extrabold text-sm text-blue-700 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Phase 01 : Identité & Caractéristiques du Projet</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Direction de transport gaz</label>
                    <select
                      value={editProjectData.identity.region}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        identity: { ...editProjectData.identity, region: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-800 cursor-pointer focus:bg-white focus:border-blue-500 transition-all"
                    >
                      <option value="">Sélectionner une direction de transport gaz</option>
                      {editProjectData.identity.region && !REGIONS_ALGERIE.includes(editProjectData.identity.region) && (
                        <option value={editProjectData.identity.region}>{editProjectData.identity.region}</option>
                      )}
                      {REGIONS_ALGERIE.map(reg => (
                        <option key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Pôle TG</label>
                    <select
                      value={editProjectData.identity.pole}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        identity: { ...editProjectData.identity, pole: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-800 cursor-pointer focus:bg-white focus:border-blue-500 transition-all"
                    >
                      <option value="">Sélectionner un pôle</option>
                      {editProjectData.identity.pole && !POLES_ALGERIE.includes(editProjectData.identity.pole) && (
                        <option value={editProjectData.identity.pole}>{editProjectData.identity.pole}</option>
                      )}
                      {POLES_ALGERIE.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Phase Actuelle</label>
                    <select
                      value={editProjectData.identity.phase}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        identity: { ...editProjectData.identity, phase: e.target.value as any }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-800 cursor-pointer focus:bg-white focus:border-blue-500 transition-all"
                    >
                      <option value="Étude">Étude</option>
                      <option value="Travaux">Travaux</option>
                      <option value="Mise en Gaz">Mise en Gaz</option>
                      <option value="Clôturé">Clôturé</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Wilaya</label>
                    <select
                      value={editProjectData.identity.wilaya}
                      onChange={(e) => {
                        const selectedWilaya = e.target.value;
                        setEditProjectData({
                          ...editProjectData,
                          identity: { 
                            ...editProjectData.identity, 
                            wilaya: selectedWilaya,
                            district: selectedWilaya ? `${selectedWilaya} District Gaz` : ""
                          }
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-800 cursor-pointer focus:bg-white focus:border-blue-500 transition-all"
                    >
                      <option value="">Sélectionner une wilaya</option>
                      {editProjectData.identity.wilaya && !WILAYAS_ALGERIE.includes(editProjectData.identity.wilaya) && (
                        <option value={editProjectData.identity.wilaya}>{editProjectData.identity.wilaya}</option>
                      )}
                      {WILAYAS_ALGERIE.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">District</label>
                    <select
                      value={editProjectData.identity.district}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        identity: { ...editProjectData.identity, district: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-800 cursor-pointer focus:bg-white focus:border-blue-500 transition-all"
                    >
                      <option value="">Sélectionner un district</option>
                      {editProjectData.identity.district && !WILAYAS_ALGERIE.map(w => `${w} District Gaz`).includes(editProjectData.identity.district) && (
                        <option value={editProjectData.identity.district}>{editProjectData.identity.district}</option>
                      )}
                      {WILAYAS_ALGERIE.map(w => {
                        const distVal = `${w} District Gaz`;
                        return (
                          <option key={distVal} value={distVal}>District Gaz {w}</option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Cadre d'Inscription</label>
                    <input
                      type="text"
                      value={editProjectData.identity.cadreInscription}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        identity: { ...editProjectData.identity, cadreInscription: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                      placeholder="e.g., Programme d'Urgence"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Structure Chargée</label>
                    <input
                      type="text"
                      value={editProjectData.identity.structureChargee}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        identity: { ...editProjectData.identity, structureChargee: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                      placeholder="e.g., Division Transport"
                    />
                  </div>
                </div>

                {/* Superviseurs du Projet */}
                <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider font-mono">Superviseurs & Hiérarchie (Lien aux comptes)</span>
                  <div className="space-y-2 border border-slate-150 p-3 rounded-xl bg-white shadow-sm max-w-md">
                    <label className="font-bold text-slate-600 block">Superviseurs du Projet (Groupe/Membres)</label>
                    
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {((editProjectData.superviseurs || [])).map((item, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 bg-amber-50/50 px-3 py-1.5 rounded-lg border border-amber-100 text-[11px]">
                          <div className="truncate min-w-0">
                            <p className="font-extrabold text-amber-700 truncate">{item.name}</p>
                            {item.structure && (
                              <p className="text-[10px] text-slate-500 font-bold truncate">🏢 {item.structure}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newList = (editProjectData.superviseurs || []).filter((_, i) => i !== index);
                              setEditProjectData({
                                ...editProjectData,
                                superviseurs: newList,
                                superviseurUid: newList[0]?.uid || "",
                                superviseurName: newList[0]?.name || "",
                                superviseurEmail: newList[0]?.email || "",
                                superviseurStructure: newList[0]?.structure || ""
                              });
                            }}
                            className="text-red-500 hover:text-red-700 font-extrabold hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
                            title="Retirer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {(!editProjectData.superviseurs || editProjectData.superviseurs.length === 0) && (
                        <p className="text-[10px] text-slate-400 italic font-medium">Aucun Superviseur sélectionné</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1">
                      <select
                        value=""
                        onChange={(e) => {
                          const uid = e.target.value;
                          if (!uid) return;
                          const found = profilesList.find(u => u.id === uid);
                          if (found) {
                            const currentList = editProjectData.superviseurs || [];
                            if (currentList.some(item => item.uid === uid)) return;
                            
                            const newItem = {
                              uid: found.id,
                              name: found.name,
                              email: found.email || "",
                              structure: found.structure || ""
                            };
                            const newList = [...currentList, newItem];
                            setEditProjectData({
                              ...editProjectData,
                              superviseurs: newList,
                              superviseurUid: newList[0]?.uid || "",
                              superviseurName: newList[0]?.name || "",
                              superviseurEmail: newList[0]?.email || "",
                              superviseurStructure: newList[0]?.structure || ""
                            });
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none text-[11px] font-bold text-slate-700 cursor-pointer focus:border-blue-500"
                      >
                        <option value="">+ Superviseur (Compte)</option>
                        {profilesList.map(prof => (
                          <option key={prof.id} value={prof.id}>
                            {prof.name} {prof.structure ? `[${prof.structure}]` : ""} ({prof.email})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setCpSearchType("superviseurs");
                          setCpSearchQuery("");
                          setIsCPSearchOpen(true);
                        }}
                        className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold text-[11px] rounded-xl border border-amber-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
                        title="Recherche avancée de superviseur"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Rechercher</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Characteristics nested */}
                <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Caractéristiques techniques du Gazoduc</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="space-y-1 col-span-2 md:col-span-4">
                      <label className="font-bold text-slate-600">Type de Projet</label>
                      <select
                        value={editProjectData.identity.caracteristiques.typeOuvrage || "Standard"}
                        onChange={(e) => {
                          const val = e.target.value;
                          const isSeul = val === "Poste de détente seul";
                          setEditProjectData({
                            ...editProjectData,
                            identity: {
                              ...editProjectData.identity,
                              caracteristiques: {
                                ...editProjectData.identity.caracteristiques,
                                typeOuvrage: val,
                                longueur: isSeul ? "0" : (editProjectData.identity.caracteristiques.longueur === "0" ? "10" : editProjectData.identity.caracteristiques.longueur),
                                hasPosteDetente: isSeul ? true : editProjectData.identity.caracteristiques.hasPosteDetente
                              }
                            }
                          });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700 outline-none focus:border-blue-500"
                      >
                        <option value="Standard">Standard (Gazoduc Ligne + Postes)</option>
                        <option value="Poste de détente seul">Poste de détente seul</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Diamètre de la conduite</label>
                      <input
                        type="text"
                        value={editProjectData.identity.caracteristiques.diametre}
                        onChange={(e) => setEditProjectData({
                          ...editProjectData,
                          identity: { 
                            ...editProjectData.identity, 
                            caracteristiques: { ...editProjectData.identity.caracteristiques, diametre: e.target.value } 
                          }
                        })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2"
                        placeholder="e.g., 20 pouces (DN 500)"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Longueur (km)</label>
                      <input
                        type="text"
                        value={editProjectData.identity.caracteristiques.longueur}
                        onChange={(e) => setEditProjectData({
                          ...editProjectData,
                          identity: { 
                            ...editProjectData.identity, 
                            caracteristiques: { ...editProjectData.identity.caracteristiques, longueur: e.target.value } 
                          }
                        })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2"
                        placeholder="e.g., 42"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Pression réglementaire</label>
                      <input
                        type="text"
                        value={editProjectData.identity.caracteristiques.pression}
                        onChange={(e) => setEditProjectData({
                          ...editProjectData,
                          identity: { 
                            ...editProjectData.identity, 
                            caracteristiques: { ...editProjectData.identity.caracteristiques, pression: e.target.value } 
                          }
                        })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2"
                        placeholder="e.g., 70 bar"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Qualité / Type d'acier</label>
                      <input
                        type="text"
                        value={editProjectData.identity.caracteristiques.typeTuyau}
                        onChange={(e) => setEditProjectData({
                          ...editProjectData,
                          identity: { 
                            ...editProjectData.identity, 
                            caracteristiques: { ...editProjectData.identity.caracteristiques, typeTuyau: e.target.value } 
                          }
                        })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2"
                        placeholder="e.g., Acier API 5L X60"
                      />
                    </div>
                  </div>

                  {/* Consistances & Composition de l'Ouvrage (Schéma Synoptique) */}
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 space-y-3 mt-4">
                    <h5 className="font-extrabold text-xs uppercase text-slate-700 tracking-wider">Consistance & Composition (Schéma Synoptique)</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={!!editProjectData.identity.caracteristiques.hasPiquage}
                          onChange={(e) => setEditProjectData({
                            ...editProjectData,
                            identity: {
                              ...editProjectData.identity,
                              caracteristiques: { ...editProjectData.identity.caracteristiques, hasPiquage: e.target.checked }
                            }
                          })}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <span>Piquage</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={!!editProjectData.identity.caracteristiques.hasGareRacleurDepart}
                          onChange={(e) => setEditProjectData({
                            ...editProjectData,
                            identity: {
                              ...editProjectData.identity,
                              caracteristiques: { ...editProjectData.identity.caracteristiques, hasGareRacleurDepart: e.target.checked }
                            }
                          })}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <span>Gare Racleur Départ</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={!!editProjectData.identity.caracteristiques.hasGareRacleurArrivee}
                          onChange={(e) => setEditProjectData({
                            ...editProjectData,
                            identity: {
                              ...editProjectData.identity,
                              caracteristiques: { ...editProjectData.identity.caracteristiques, hasGareRacleurArrivee: e.target.checked }
                            }
                          })}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <span>Gare Racleur Arrivée</span>
                      </label>

                      <div className="flex flex-col gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={!!editProjectData.identity.caracteristiques.hasPosteCoupure}
                            onChange={(e) => setEditProjectData({
                              ...editProjectData,
                              identity: {
                                ...editProjectData.identity,
                                caracteristiques: { 
                                  ...editProjectData.identity.caracteristiques, 
                                  hasPosteCoupure: e.target.checked,
                                  nbPostesCoupure: e.target.checked ? (editProjectData.identity.caracteristiques.nbPostesCoupure || 1) : 0
                                }
                              }
                            })}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <span>Poste de Coupure</span>
                        </label>
                        {!!editProjectData.identity.caracteristiques.hasPosteCoupure && (
                          <div className="flex items-center gap-1.5 pl-6 mt-0.5 text-[11px]">
                            <span className="text-slate-500">Nombre de postes:</span>
                            <input
                              type="number"
                              min={1}
                              value={editProjectData.identity.caracteristiques.nbPostesCoupure || 1}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setEditProjectData({
                                  ...editProjectData,
                                  identity: {
                                    ...editProjectData.identity,
                                    caracteristiques: {
                                      ...editProjectData.identity.caracteristiques,
                                      nbPostesCoupure: val
                                    }
                                  }
                                });
                              }}
                              className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold text-slate-800 outline-none font-mono"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={!!editProjectData.identity.caracteristiques.hasPosteSectionnement}
                            onChange={(e) => setEditProjectData({
                              ...editProjectData,
                              identity: {
                                ...editProjectData.identity,
                                caracteristiques: { 
                                  ...editProjectData.identity.caracteristiques, 
                                  hasPosteSectionnement: e.target.checked,
                                  nbPostesSectionnement: e.target.checked ? (editProjectData.identity.caracteristiques.nbPostesSectionnement || 1) : 0
                                }
                              }
                            })}
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <span>Poste de Sectionnement</span>
                        </label>
                        {!!editProjectData.identity.caracteristiques.hasPosteSectionnement && (
                          <div className="flex items-center gap-1.5 pl-6 mt-0.5 text-[11px]">
                            <span className="text-slate-500">Nombre de postes:</span>
                            <input
                              type="number"
                              min={1}
                              value={editProjectData.identity.caracteristiques.nbPostesSectionnement || 1}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setEditProjectData({
                                  ...editProjectData,
                                  identity: {
                                    ...editProjectData.identity,
                                    caracteristiques: {
                                      ...editProjectData.identity.caracteristiques,
                                      nbPostesSectionnement: val
                                    }
                                  }
                                });
                              }}
                              className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold text-slate-800 outline-none font-mono"
                            />
                          </div>
                        )}
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={!!editProjectData.identity.caracteristiques.hasPosteDetente}
                          onChange={(e) => setEditProjectData({
                            ...editProjectData,
                            identity: {
                              ...editProjectData.identity,
                              caracteristiques: { ...editProjectData.identity.caracteristiques, hasPosteDetente: e.target.checked }
                            }
                          })}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <span>Poste de Détente</span>
                      </label>
                    </div>
                    
                    {/* Incremental Pipeline Sequence Builder */}
                    <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 space-y-3 mt-4 text-left">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <div>
                          <h5 className="font-extrabold text-xs uppercase text-slate-300 tracking-wider">Séquence de Construction du Gazoduc (Incrémentale)</h5>
                          <p className="text-[10px] text-slate-400">Configurez l'ordre des ouvrages de manière incrémentale (ex: Piquage → GRD → Postes → GRA → DP)</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            // Initialize with current active sequence if empty
                            const currentSeq = getPipelineSequence(editProjectData.identity.caracteristiques);
                            const updatedSeq = [
                              ...currentSeq,
                              { id: `elem-${Date.now()}`, type: "coup", label: "Nouveau Poste de Coupure", pk: "" }
                            ];
                            setEditProjectData({
                              ...editProjectData,
                              identity: {
                                ...editProjectData.identity,
                                caracteristiques: {
                                  ...editProjectData.identity.caracteristiques,
                                  pipelineSequence: updatedSeq
                                }
                              }
                            });
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] uppercase rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-blue-900/40"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Ajouter Ouvrage
                        </button>
                      </div>

                      {/* Display current sequence list */}
                      {(() => {
                        const seq = editProjectData.identity.caracteristiques.pipelineSequence || getPipelineSequence(editProjectData.identity.caracteristiques);
                        
                        if (seq.length === 0) {
                          return (
                            <div className="py-6 text-center text-slate-500 text-xs font-bold border border-dashed border-slate-300 rounded-xl">
                              Aucun ouvrage dans la séquence de construction. Cliquez sur "Ajouter Ouvrage".
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                            {seq.map((node: any, idx: number) => (
                              <div key={node.id || idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/60 shadow-inner">
                                {/* Type selector */}
                                <select
                                  value={node.type}
                                  onChange={(e) => {
                                    const updated = [...seq];
                                    updated[idx] = { ...updated[idx], type: e.target.value as any };
                                    setEditProjectData({
                                      ...editProjectData,
                                      identity: {
                                        ...editProjectData.identity,
                                        caracteristiques: {
                                          ...editProjectData.identity.caracteristiques,
                                          pipelineSequence: updated
                                        }
                                      }
                                    });
                                  }}
                                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs outline-none focus:border-blue-500 font-bold"
                                >
                                  <option value="racc">Piquage / Raccordement</option>
                                  <option value="gr_dep">Gare Racleur Départ (GRD)</option>
                                  <option value="coup">Poste de Coupure</option>
                                  <option value="sect">Poste de Sectionnement</option>
                                  <option value="gr_arr">Gare Racleur Arrivée (GRA)</option>
                                  <option value="det">Poste Détente (DP)</option>
                                </select>

                                {/* Label input */}
                                <input
                                  type="text"
                                  value={node.label || ""}
                                  onChange={(e) => {
                                    const updated = [...seq];
                                    updated[idx] = { ...updated[idx], label: e.target.value };
                                    setEditProjectData({
                                      ...editProjectData,
                                      identity: {
                                        ...editProjectData.identity,
                                        caracteristiques: {
                                          ...editProjectData.identity.caracteristiques,
                                          pipelineSequence: updated
                                        }
                                      }
                                    });
                                  }}
                                  placeholder="Nom / Libellé de l'ouvrage"
                                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs outline-none focus:border-blue-500 font-medium"
                                />

                                {/* PK location input */}
                                <input
                                  type="text"
                                  value={node.pk || ""}
                                  onChange={(e) => {
                                    const updated = [...seq];
                                    updated[idx] = { ...updated[idx], pk: e.target.value };
                                    setEditProjectData({
                                      ...editProjectData,
                                      identity: {
                                        ...editProjectData.identity,
                                        caracteristiques: {
                                          ...editProjectData.identity.caracteristiques,
                                          pipelineSequence: updated
                                        }
                                      }
                                    });
                                  }}
                                  placeholder="PK / Capacité"
                                  className="w-24 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs text-center outline-none focus:border-blue-500 font-mono"
                                />

                                {/* Action Buttons (Up, Down, Delete) */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => {
                                      if (idx === 0) return;
                                      const updated = [...seq];
                                      const temp = updated[idx];
                                      updated[idx] = updated[idx - 1];
                                      updated[idx - 1] = temp;
                                      setEditProjectData({
                                        ...editProjectData,
                                        identity: {
                                          ...editProjectData.identity,
                                          caracteristiques: {
                                            ...editProjectData.identity.caracteristiques,
                                            pipelineSequence: updated
                                          }
                                        }
                                      });
                                    }}
                                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded transition-colors"
                                    title="Monter"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === seq.length - 1}
                                    onClick={() => {
                                      if (idx === seq.length - 1) return;
                                      const updated = [...seq];
                                      const temp = updated[idx];
                                      updated[idx] = updated[idx + 1];
                                      updated[idx + 1] = temp;
                                      setEditProjectData({
                                        ...editProjectData,
                                        identity: {
                                          ...editProjectData.identity,
                                          caracteristiques: {
                                            ...editProjectData.identity.caracteristiques,
                                            pipelineSequence: updated
                                          }
                                        }
                                      });
                                    }}
                                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded transition-colors"
                                    title="Descendre"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = seq.filter((_: any, i: number) => i !== idx);
                                      setEditProjectData({
                                        ...editProjectData,
                                        identity: {
                                          ...editProjectData.identity,
                                          caracteristiques: {
                                            ...editProjectData.identity.caracteristiques,
                                            pipelineSequence: updated
                                          }
                                        }
                                      });
                                    }}
                                    className="p-1.5 bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-red-300 rounded transition-colors ml-1"
                                    title="Supprimer"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-600">Point de raccordement (Saisie libre)</label>
                        <input
                          type="text"
                          value={editProjectData.identity.caracteristiques.pointRaccordement || ""}
                          onChange={(e) => setEditProjectData({
                            ...editProjectData,
                            identity: {
                              ...editProjectData.identity,
                              caracteristiques: { ...editProjectData.identity.caracteristiques, pointRaccordement: e.target.value }
                            }
                          })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                          placeholder="e.g., Vanne d'interconnexion PK 22"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-600">Capacité du Poste (M3/h)</label>
                        <input
                          type="text"
                          value={editProjectData.identity.caracteristiques.capacitePoste || ""}
                          onChange={(e) => setEditProjectData({
                            ...editProjectData,
                            identity: {
                              ...editProjectData.identity,
                              caracteristiques: { ...editProjectData.identity.caracteristiques, capacitePoste: e.target.value }
                        }
                          })}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                          placeholder="e.g., 20 000 m³/h"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="font-bold text-slate-600">Nombre de Lots (Travaux)</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={1}
                            value={editProjectData.nombreLots || 1}
                            onChange={(e) => {
                              const numLots = parseInt(e.target.value) || 1;
                              let newLots = [...(editProjectData.lots || [])];
                              if (newLots.length < numLots) {
                                for (let i = newLots.length; i < numLots; i++) {
                                  newLots.push({
                                    id: `lot-${i + 1}`,
                                    name: `Lot ${i + 1}`,
                                    phase: "Étude",
                                    avancementPhysique: 0,
                                    avancementGC: 0,
                                    avancementMeca: 0,
                                    contrats: {
                                      bureauEtude: { nom: editProjectData.ficheSuivi?.etudeBetCabinet || "", ref: "", montant: "", date: "", ods: "", avancement: 0 },
                                      expert: { nom: editProjectData.etudeAutorisation?.expertiseFonciere?.gefIdentity || "", ref: "", montant: "", date: "", ods: "", avancement: 0 },
                                      etbGC: { nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0 },
                                      etbMeca: { nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0 },
                                      betEnvironnement: { nom: editProjectData.ficheSuivi?.impactBetOds || "", ref: "", montant: "", date: "", ods: "", avancement: 0 }
                                    }
                                  });
                                }
                              } else if (newLots.length > numLots) {
                                newLots = newLots.slice(0, numLots);
                              }

                              setEditProjectData({
                                ...editProjectData,
                                nombreLots: numLots,
                                lots: newLots
                              });
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const numLots = (editProjectData.nombreLots || 1) + 1;
                              const newLots = [...(editProjectData.lots || [])];
                              newLots.push({
                                id: `lot-${numLots}`,
                                name: `Lot ${numLots}`,
                                phase: "Étude",
                                avancementPhysique: 0,
                                avancementGC: 0,
                                avancementMeca: 0,
                                contrats: {
                                  bureauEtude: { nom: editProjectData.ficheSuivi?.etudeBetCabinet || "", ref: "", montant: "", date: "", ods: "", avancement: 0 },
                                  expert: { nom: editProjectData.etudeAutorisation?.expertiseFonciere?.gefIdentity || "", ref: "", montant: "", date: "", ods: "", avancement: 0 },
                                  etbGC: { nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0 },
                                  etbMeca: { nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0 },
                                  betEnvironnement: { nom: editProjectData.ficheSuivi?.impactBetOds || "", ref: "", montant: "", date: "", ods: "", avancement: 0 }
                                }
                              });

                              setEditProjectData({
                                ...editProjectData,
                                nombreLots: numLots,
                                lots: newLots
                              });
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all whitespace-nowrap shadow-xs"
                          >
                            <span>+ Ajouter un Lot</span>
                          </button>
                        </div>
                      </div>

                      {/* Configuration individuelle de chaque lot : longueurs et PK */}
                      <div className="col-span-2 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-3">
                        {(editProjectData.lots || []).map((lot, idx) => (
                          <div key={lot.id || idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Configuration {lot.name}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-[11px]">
                              <div className="space-y-0.5">
                                <label className="font-bold text-slate-500">Nom du Lot</label>
                                <input
                                  type="text"
                                  value={lot.name}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updatedLots = (editProjectData.lots || []).map(l =>
                                      l.id === lot.id ? { ...l, name: val } : l
                                    );
                                    setEditProjectData({
                                      ...editProjectData,
                                      lots: updatedLots
                                    });
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 outline-none"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="font-bold text-slate-500">Longueur du lot (km)</label>
                                <input
                                  type="text"
                                  value={lot.longueur || ""}
                                  placeholder="e.g. 15"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updatedLots = (editProjectData.lots || []).map(l =>
                                      l.id === lot.id ? { ...l, longueur: val } : l
                                    );
                                    setEditProjectData({
                                      ...editProjectData,
                                      lots: updatedLots
                                    });
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 outline-none"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="font-bold text-slate-500">Wilaya du Lot</label>
                                <select
                                  value={lot.wilaya || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updatedLots = (editProjectData.lots || []).map(l =>
                                      l.id === lot.id ? { ...l, wilaya: val } : l
                                    );
                                    setEditProjectData({
                                      ...editProjectData,
                                      lots: updatedLots
                                    });
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 outline-none text-xs"
                                >
                                  <option value="">Sélectionner une wilaya...</option>
                                  {WILAYAS_ALGERIE.map(w => (
                                    <option key={w} value={w}>{w}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-0.5">
                                  <label className="font-bold text-slate-500">PK Début</label>
                                  <input
                                    type="text"
                                    value={lot.pkStart || ""}
                                    placeholder="0+000"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const updatedLots = (editProjectData.lots || []).map(l =>
                                        l.id === lot.id ? { ...l, pkStart: val } : l
                                      );
                                      setEditProjectData({
                                        ...editProjectData,
                                        lots: updatedLots
                                      });
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono text-slate-700 outline-none"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <label className="font-bold text-slate-500">PK Fin</label>
                                  <input
                                    type="text"
                                    value={lot.pkEnd || ""}
                                    placeholder="15+000"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const updatedLots = (editProjectData.lots || []).map(l =>
                                        l.id === lot.id ? { ...l, pkEnd: val } : l
                                      );
                                      setEditProjectData({
                                        ...editProjectData,
                                        lots: updatedLots
                                      });
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono text-slate-700 outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Commentaire / Notes de Planification Globale</label>
                    <textarea
                      value={editProjectData.identity.planificationComment}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        identity: { ...editProjectData.identity, planificationComment: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none min-h-[80px]"
                      placeholder="Saisir un commentaire sur l'état d'avancement global..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Contraintes / Obstacles de Réalisation</label>
                    <textarea
                      value={editProjectData.identity.contraintes || ""}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        identity: { ...editProjectData.identity, contraintes: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none min-h-[80px]"
                      placeholder="Opposition de riverains, retard matériel, traversée d'Oued, etc..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Actions Correctives Entreprises</label>
                    <textarea
                      value={editProjectData.identity.contraintesAction || ""}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        identity: { ...editProjectData.identity, contraintesAction: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none min-h-[80px]"
                      placeholder="Actions d'évitement ou déblocage, réunion Wilaya, etc..."
                    />
                  </div>
                </div>
              </div>

              {/* Phase 02: Etudes & Autorisations */}
              <div className="space-y-4 pt-4">
                <h4 className="font-extrabold text-sm text-blue-700 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Phase 02 : Étude & Autorisations</span>
                </h4>

                {/* Chef de Projet Étude */}
                <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider font-mono">Chargé de Projet Étude (Lien aux comptes)</span>
                  <div className="space-y-2 border border-slate-150 p-3 rounded-xl bg-white shadow-sm max-w-md">
                    <label className="font-bold text-slate-600 block">Chargés de Projet (Partie Étude)</label>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {((editProjectData.chefsDeProjetEtude || [])).map((item, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-100 text-[11px]">
                          <div className="truncate min-w-0">
                            <p className="font-extrabold text-emerald-700 truncate">{item.name}</p>
                            {item.structure && (
                              <p className="text-[10px] text-slate-500 font-bold truncate">🏢 {item.structure}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newList = (editProjectData.chefsDeProjetEtude || []).filter((_, i) => i !== index);
                              setEditProjectData({
                                ...editProjectData,
                                chefsDeProjetEtude: newList,
                                chefDeProjetEtudeUid: newList[0]?.uid || "",
                                chefDeProjetEtudeName: newList[0]?.name || "",
                                chefDeProjetEtudeEmail: newList[0]?.email || "",
                                chefDeProjetEtudeStructure: newList[0]?.structure || ""
                              });
                            }}
                            className="text-red-500 hover:text-red-700 font-extrabold hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
                            title="Retirer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {(!editProjectData.chefsDeProjetEtude || editProjectData.chefsDeProjetEtude.length === 0) && (
                        <p className="text-[10px] text-slate-400 italic font-medium">Aucun CP Étude sélectionné</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1">
                      <select
                        value=""
                        onChange={(e) => {
                          const uid = e.target.value;
                          if (!uid) return;
                          const found = profilesList.find(u => u.id === uid);
                          if (found) {
                            const currentList = editProjectData.chefsDeProjetEtude || [];
                            if (currentList.some(item => item.uid === uid)) return;
                            
                            const newItem = {
                              uid: found.id,
                              name: found.name,
                              email: found.email || "",
                              structure: found.structure || ""
                            };
                            const newList = [...currentList, newItem];
                            setEditProjectData({
                              ...editProjectData,
                              chefsDeProjetEtude: newList,
                              chefDeProjetEtudeUid: newList[0]?.uid || "",
                              chefDeProjetEtudeName: newList[0]?.name || "",
                              chefDeProjetEtudeEmail: newList[0]?.email || "",
                              chefDeProjetEtudeStructure: newList[0]?.structure || ""
                            });
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none text-[11px] font-bold text-slate-700 cursor-pointer focus:border-blue-500"
                      >
                        <option value="">+ CP Étude (Compte)</option>
                        {profilesList.map(prof => (
                          <option key={prof.id} value={prof.id}>
                            {prof.name} {prof.structure ? `[${prof.structure}]` : ""} ({prof.email})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setCpSearchType("etude");
                          setCpSearchQuery("");
                          setIsCPSearchOpen(true);
                        }}
                        className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[11px] rounded-xl border border-emerald-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
                        title="Recherche avancée de chargé de projet"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Rechercher</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Statut de l'Étude d'Exécution</label>
                    <select
                      value={editProjectData.etudeAutorisation.statutEtude}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        etudeAutorisation: { ...editProjectData.etudeAutorisation, statutEtude: e.target.value as any }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                    >
                      <option value="Non lancée">Non lancée</option>
                      <option value="En cours">En cours</option>
                      <option value="Approuvée">Approuvée</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Statut Permis de Construire</label>
                    <select
                      value={editProjectData.etudeAutorisation.statutPermisConstruire}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        etudeAutorisation: { ...editProjectData.etudeAutorisation, statutPermisConstruire: e.target.value as any }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                    >
                      <option value="Non déposé">Non déposé</option>
                      <option value="Déposé - En cours">Déposé - En cours</option>
                      <option value="Reçu">Reçu</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Date du Permis de Construire (ou dépôt)</label>
                    <input
                      type="text"
                      value={editProjectData.etudeAutorisation.datePermisConstruire}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        etudeAutorisation: { ...editProjectData.etudeAutorisation, datePermisConstruire: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                      placeholder="e.g., 2026-03-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Statut de l'Arrêté de Servitude</label>
                    <select
                      value={editProjectData.etudeAutorisation.statutArreteServitude}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        etudeAutorisation: { ...editProjectData.etudeAutorisation, statutArreteServitude: e.target.value as any }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                    >
                      <option value="Non lancé">Non lancé</option>
                      <option value="En cours de signature">En cours de signature</option>
                      <option value="Signé & Publié">Signé & Publié</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Référence de l'Arrêté de Servitude</label>
                    <input
                      type="text"
                      value={editProjectData.etudeAutorisation.arreteServitudeRef}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        etudeAutorisation: { ...editProjectData.etudeAutorisation, arreteServitudeRef: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                      placeholder="e.g., Arrêté n° 245/2026"
                    />
                  </div>
                </div>

                {/* Expertise fonciere */}
                <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 space-y-3">
                  <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider">Expertise Foncière & GEF</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editProjectData.etudeAutorisation.expertiseFonciere.gefDesignated}
                        onChange={(e) => setEditProjectData({
                          ...editProjectData,
                          etudeAutorisation: {
                            ...editProjectData.etudeAutorisation,
                            expertiseFonciere: { 
                              ...editProjectData.etudeAutorisation.expertiseFonciere, 
                              gefDesignated: e.target.checked 
                            }
                          }
                        })}
                        id="check-gef"
                        className="w-4 h-4 text-orange-500 rounded"
                      />
                      <label htmlFor="check-gef" className="font-bold text-slate-700 cursor-pointer">Géomètre-Expert Foncier (GEF) Désigné</label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editProjectData.etudeAutorisation.expertiseFonciere.acquisitionDemandEstablished}
                        onChange={(e) => setEditProjectData({
                          ...editProjectData,
                          etudeAutorisation: {
                            ...editProjectData.etudeAutorisation,
                            expertiseFonciere: { 
                              ...editProjectData.etudeAutorisation.expertiseFonciere, 
                              acquisitionDemandEstablished: e.target.checked 
                            }
                          }
                        })}
                        id="check-acquisition"
                        className="w-4 h-4 text-orange-500 rounded"
                      />
                      <label htmlFor="check-acquisition" className="font-bold text-slate-700 cursor-pointer">Demande d'acquisition d'assiette établie</label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Identité / Cabinet du GEF</label>
                      <input
                        type="text"
                        value={editProjectData.etudeAutorisation.expertiseFonciere.gefIdentity}
                        onChange={(e) => setEditProjectData({
                          ...editProjectData,
                          etudeAutorisation: {
                            ...editProjectData.etudeAutorisation,
                            expertiseFonciere: { 
                              ...editProjectData.etudeAutorisation.expertiseFonciere, 
                              gefIdentity: e.target.value 
                            }
                          }
                        })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 outline-none"
                        placeholder="Cabinet du Géomètre, etc."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Commentaire acquisition d'assiette</label>
                      <input
                        type="text"
                        value={editProjectData.etudeAutorisation.expertiseFonciere.acquisitionComment}
                        onChange={(e) => setEditProjectData({
                          ...editProjectData,
                          etudeAutorisation: {
                            ...editProjectData.etudeAutorisation,
                            expertiseFonciere: { 
                              ...editProjectData.etudeAutorisation.expertiseFonciere, 
                              acquisitionComment: e.target.value 
                            }
                          }
                        })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 outline-none"
                        placeholder="Suivi parcellaire..."
                      />
                    </div>
                  </div>

                  {/* Charger Expertise & Indemnisation */}
                  <div className="space-y-2 border border-orange-100 p-3.5 rounded-xl bg-white shadow-xs max-w-md mt-4 text-xs">
                    <label className="font-bold text-orange-800 text-[11px] block">Chargé Expertise & Indemnisation</label>
                    
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {((editProjectData.chefsDeProjetExpertise || [])).map((item, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 bg-orange-50/50 px-3 py-1.5 rounded-lg border border-orange-100 text-[11px]">
                          <div className="truncate min-w-0">
                            <p className="font-extrabold text-orange-700 truncate">{item.name}</p>
                            {item.structure && (
                              <p className="text-[10px] text-slate-500 font-bold truncate">🏢 {item.structure}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newList = (editProjectData.chefsDeProjetExpertise || []).filter((_, i) => i !== index);
                              setEditProjectData({
                                ...editProjectData,
                                chefsDeProjetExpertise: newList
                              });
                            }}
                            className="text-red-500 hover:text-red-700 font-extrabold hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
                            title="Retirer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {(!editProjectData.chefsDeProjetExpertise || editProjectData.chefsDeProjetExpertise.length === 0) && (
                        <p className="text-[10px] text-slate-400 italic font-medium">Aucun Chargé Expertise sélectionné</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1">
                      <select
                        value=""
                        onChange={(e) => {
                          const uid = e.target.value;
                          if (!uid) return;
                          const found = profilesList.find(u => u.id === uid);
                          if (found) {
                            const currentList = editProjectData.chefsDeProjetExpertise || [];
                            if (currentList.some(item => item.uid === uid)) return;
                            
                            const newItem = {
                              uid: found.id,
                              name: found.name,
                              email: found.email || "",
                              structure: found.structure || ""
                            };
                            const newList = [...currentList, newItem];
                            setEditProjectData({
                              ...editProjectData,
                              chefsDeProjetExpertise: newList
                            });
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none text-[11px] font-bold text-slate-700 cursor-pointer focus:border-blue-500"
                      >
                        <option value="">+ Chargé Expertise (Compte)</option>
                        {profilesList.map(prof => (
                          <option key={prof.id} value={prof.id}>
                            {prof.name} {prof.structure ? `[${prof.structure}]` : ""} ({prof.email})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setCpSearchType("expertise");
                          setCpSearchQuery("");
                          setIsCPSearchOpen(true);
                        }}
                        className="w-full py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold text-[11px] rounded-xl border border-orange-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
                        title="Recherche avancée de chargé expertise"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Rechercher</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 03: Travaux & Contrôles */}
              <div className="space-y-4 pt-4">
                <h4 className="font-extrabold text-sm text-blue-700 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>Phase 03 : Phase Travaux & Contrôle Qualité</span>
                </h4>

                {/* Chef de Projet Travaux */}
                <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider font-mono">Chargé de Projet Travaux (Lien aux comptes)</span>
                  <div className="space-y-2 border border-slate-150 p-3 rounded-xl bg-white shadow-sm max-w-md">
                    <label className="font-bold text-slate-600 block">Chargés de Projet (Partie Travaux)</label>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {((editProjectData.chefsDeProjetTravaux || [])).map((item, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100 text-[11px]">
                          <div className="truncate min-w-0">
                            <p className="font-extrabold text-blue-700 truncate">{item.name}</p>
                            {item.structure && (
                              <p className="text-[10px] text-slate-500 font-bold truncate">🏢 {item.structure}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newList = (editProjectData.chefsDeProjetTravaux || []).filter((_, i) => i !== index);
                              setEditProjectData({
                                ...editProjectData,
                                chefsDeProjetTravaux: newList,
                                chefDeProjetUid: newList[0]?.uid || "",
                                chefDeProjetName: newList[0]?.name || "",
                                chefDeProjetEmail: newList[0]?.email || "",
                                chefDeProjetStructure: newList[0]?.structure || ""
                              });
                            }}
                            className="text-red-500 hover:text-red-700 font-extrabold hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
                            title="Retirer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {(!editProjectData.chefsDeProjetTravaux || editProjectData.chefsDeProjetTravaux.length === 0) && (
                        <p className="text-[10px] text-slate-400 italic font-medium">Aucun CP Travaux sélectionné</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1">
                      <select
                        value=""
                        onChange={(e) => {
                          const uid = e.target.value;
                          if (!uid) return;
                          const found = profilesList.find(u => u.id === uid);
                          if (found) {
                            const currentList = editProjectData.chefsDeProjetTravaux || [];
                            if (currentList.some(item => item.uid === uid)) return;
                            
                            const newItem = {
                              uid: found.id,
                              name: found.name,
                              email: found.email || "",
                              structure: found.structure || ""
                            };
                            const newList = [...currentList, newItem];
                            setEditProjectData({
                              ...editProjectData,
                              chefsDeProjetTravaux: newList,
                              chefDeProjetUid: newList[0]?.uid || "",
                              chefDeProjetName: newList[0]?.name || "",
                              chefDeProjetEmail: newList[0]?.email || "",
                              chefDeProjetStructure: newList[0]?.structure || ""
                            });
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none text-[11px] font-bold text-slate-700 cursor-pointer focus:border-blue-500"
                      >
                        <option value="">+ CP Travaux (Compte)</option>
                        {profilesList.map(prof => (
                          <option key={prof.id} value={prof.id}>
                            {prof.name} {prof.structure ? `[${prof.structure}]` : ""} ({prof.email})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setCpSearchType("travaux");
                          setCpSearchQuery("");
                          setIsCPSearchOpen(true);
                        }}
                        className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] rounded-xl border border-blue-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
                        title="Recherche avancée de chargé de projet"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Rechercher</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Avancement Physique Global des Travaux</span>
                    <span className="text-orange-600">{editProjectData.travauxPlanification.avancementPhysique}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editProjectData.travauxPlanification.avancementPhysique}
                    onChange={(e) => setEditProjectData({
                      ...editProjectData,
                      travauxPlanification: {
                        ...editProjectData.travauxPlanification,
                        avancementPhysique: parseInt(e.target.value)
                      }
                    })}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Épreuve de Résistance Hydraulique</label>
                    <select
                      value={editProjectData.travauxPlanification.essaisReglementaires.epreuveResistance}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        travauxPlanification: {
                          ...editProjectData.travauxPlanification,
                          essaisReglementaires: {
                            ...editProjectData.travauxPlanification.essaisReglementaires,
                            epreuveResistance: e.target.value as any
                          }
                        }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                    >
                      <option value="Non faite">Non faite</option>
                      <option value="En cours">En cours</option>
                      <option value="Réussie">Réussie</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Épreuve d'Étanchéité</label>
                    <select
                      value={editProjectData.travauxPlanification.essaisReglementaires.epreuveEtancheite}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        travauxPlanification: {
                          ...editProjectData.travauxPlanification,
                          essaisReglementaires: {
                            ...editProjectData.travauxPlanification.essaisReglementaires,
                            epreuveEtancheite: e.target.value as any
                          }
                        }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                    >
                      <option value="Non faite">Non faite</option>
                      <option value="En cours">En cours</option>
                      <option value="Réussie">Réussie</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Organisme Contrôleur Agréé</label>
                    <input
                      type="text"
                      value={editProjectData.travauxPlanification.essaisReglementaires.organismeControleur}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        travauxPlanification: {
                          ...editProjectData.travauxPlanification,
                          essaisReglementaires: {
                            ...editProjectData.travauxPlanification.essaisReglementaires,
                            organismeControleur: e.target.value
                          }
                        }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                      placeholder="e.g., VERITAL SpA"
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Plan de Contrôle & Conformité Technique</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                      <input
                        type="checkbox"
                        checked={editProjectData.travauxPlanification.controleQualiteChecklist.abaqueSoudageValide}
                        onChange={(e) => setEditProjectData({
                          ...editProjectData,
                          travauxPlanification: {
                            ...editProjectData.travauxPlanification,
                            controleQualiteChecklist: {
                              ...editProjectData.travauxPlanification.controleQualiteChecklist,
                              abaqueSoudageValide: e.target.checked
                            }
                          }
                        })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>Abaque de soudage qualifié</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                      <input
                        type="checkbox"
                        checked={editProjectData.travauxPlanification.controleQualiteChecklist.radiographieCND}
                        onChange={(e) => setEditProjectData({
                          ...editProjectData,
                          travauxPlanification: {
                            ...editProjectData.travauxPlanification,
                            controleQualiteChecklist: {
                              ...editProjectData.travauxPlanification.controleQualiteChecklist,
                              radiographieCND: e.target.checked
                            }
                          }
                        })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>Contrôle non destructif (radiographie)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                      <input
                        type="checkbox"
                        checked={editProjectData.travauxPlanification.controleQualiteChecklist.enrobageVerifie}
                        onChange={(e) => setEditProjectData({
                          ...editProjectData,
                          travauxPlanification: {
                            ...editProjectData.travauxPlanification,
                            controleQualiteChecklist: {
                              ...editProjectData.travauxPlanification.controleQualiteChecklist,
                              enrobageVerifie: e.target.checked
                            }
                          }
                        })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>Enrobage vérifié (balai électrique)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                      <input
                        type="checkbox"
                        checked={editProjectData.travauxPlanification.controleQualiteChecklist.litPoseSableux}
                        onChange={(e) => setEditProjectData({
                          ...editProjectData,
                          travauxPlanification: {
                            ...editProjectData.travauxPlanification,
                            controleQualiteChecklist: {
                              ...editProjectData.travauxPlanification.controleQualiteChecklist,
                              litPoseSableux: e.target.checked
                            }
                          }
                        })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>Lit de pose sablonneux & fouille</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                      <input
                        type="checkbox"
                        checked={editProjectData.travauxPlanification.controleQualiteChecklist.protectionCathodique}
                        onChange={(e) => setEditProjectData({
                          ...editProjectData,
                          travauxPlanification: {
                            ...editProjectData.travauxPlanification,
                            controleQualiteChecklist: {
                              ...editProjectData.travauxPlanification.controleQualiteChecklist,
                              protectionCathodique: e.target.checked
                            }
                          }
                        })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>Protection cathodique en place</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Phase 04: Mise en gaz */}
              <div className="space-y-4 pt-4">
                <h4 className="font-extrabold text-sm text-blue-700 flex items-center gap-2">
                  <Archive className="w-4 h-4" />
                  <span>Phase 04 : Mise en Gaz & Archives Documentaires</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Statut de la Mise en Gaz</label>
                    <select
                      value={editProjectData.miseEnGazArchive.statutMiseEnGaz}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        miseEnGazArchive: { ...editProjectData.miseEnGazArchive, statutMiseEnGaz: e.target.value as any }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold"
                    >
                      <option value="Non planifiée">Non planifiée</option>
                      <option value="Planifiée">Planifiée</option>
                      <option value="Prête">Prête</option>
                      <option value="Réalisée">Réalisée</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Date Effective ou Programmée de Mise en Gaz</label>
                    <input
                      type="text"
                      value={editProjectData.miseEnGazArchive.dateEffectiveMiseEnGaz}
                      onChange={(e) => setEditProjectData({
                        ...editProjectData,
                        miseEnGazArchive: { ...editProjectData.miseEnGazArchive, dateEffectiveMiseEnGaz: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none"
                      placeholder="e.g., 2026-10-25"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setIsCreating(false);
                  setEditProjectData(null);
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Annuler
              </button>
              <button
                onClick={isCreating ? handleCreateProject : saveProjectChanges}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/10"
              >
                Sauvegarder le Projet
              </button>
            </div>
          </div>
        ) : selectedProject ? (
          /* ================= VIEWING / INTERACTIVE PHASES MODE ================= */
          <div className="space-y-6">
            {/* Genèse du Projet Collapsible Section */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left">
              <button
                onClick={() => setIsGenesisExpanded(!isGenesisExpanded)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-all text-left outline-none cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 tracking-tight">Genèse du Projet</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Visualiser l'enchaînement et historique de l'affaire depuis sa création (études, permis, expertise, indemnisation)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {(() => {
                    const milestones = getGenesisMilestones(selectedProject);
                    const completedCount = milestones.filter(m => m.status === "completed").length;
                    return (
                      <span className="text-[10px] font-extrabold px-2.5 py-1 bg-slate-50 border border-slate-150 text-slate-600 rounded-lg uppercase tracking-wider font-mono">
                        {completedCount} / {milestones.length} validés
                      </span>
                    );
                  })()}
                  <div className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors">
                    {isGenesisExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>
              </button>

              {isGenesisExpanded && (
                <div className="p-6 md:p-8 bg-slate-50/40 border-t border-slate-100 space-y-6">
                  {/* Export Buttons for Genesis */}
                  <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-100/70">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 mr-auto tracking-wider">Export de document</span>
                    <button
                      type="button"
                      onClick={() => handleExportGenesisWord(selectedProject)}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 border border-blue-100/50"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Exporter en Word (.doc)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportGenesisPDF(selectedProject)}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 border border-rose-100/50"
                    >
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                      <span>Exporter en PDF (.pdf)</span>
                    </button>
                  </div>

                  <div className="relative border-l-2 border-slate-200 ml-3.5 pl-6 space-y-8 py-2">
                    {getGenesisMilestones(selectedProject).map((m: any) => {
                      const isCompleted = m.status === "completed";
                      const isCurrent = m.status === "current";
                      return (
                        <div key={m.key} className="relative group text-xs text-left">
                          {/* Timeline Dot/Icon Bubble */}
                          <div className={`absolute -left-[37px] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-xs z-10 ${
                            isCompleted 
                              ? "bg-green-500 border-white text-white" 
                              : isCurrent
                              ? "bg-blue-600 border-white text-white animate-pulse"
                              : "bg-white border-slate-200 text-slate-400"
                          }`}>
                            {isCompleted ? (
                              <Check className="w-3 h-3 stroke-[3]" />
                            ) : (
                              <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? "bg-white" : "bg-slate-300"}`} />
                            )}
                          </div>

                          {/* Content Card */}
                          <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-xs hover:shadow-sm transition-all space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <h5 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${m.color}`}></span>
                                {m.title}
                              </h5>
                              <span className={`px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold tracking-wider self-start sm:self-center ${
                                isCompleted 
                                  ? "bg-green-50 text-green-700 border border-green-100"
                                  : isCurrent
                                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}>
                                {m.date && m.date !== "Non renseignée" && m.date !== "Non obtenue" && m.date !== "Non signée" && m.date !== "Non payées" ? `Le ${formatDateFrench(m.date)}` : "En attente"}
                              </span>
                            </div>

                            <p className="text-slate-500 leading-relaxed font-medium">
                              {m.description}
                            </p>

                            {/* Key Fields Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100/85">
                              {m.details.map((det: any, dIdx: number) => (
                                <div key={dIdx} className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{det.label}</span>
                                  <span className="font-extrabold text-slate-700 mt-0.5 break-words">
                                    {det.value && det.value !== "Non renseignée" && det.value !== "Non spécifiée" && det.value !== "Non défini" && det.value !== "Non définie" && det.value !== "Non lancée" && det.value !== "Non déposé" && det.value !== "Non déposée" && det.value !== "Non obtenue" && det.value !== "Non désigné" ? det.value : "N/A"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Project Banner Header */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-2.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getPhaseBadgeColor(selectedProject.identity.phase)}`}>
                      Phase Actuelle : {selectedProject.identity.phase}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 uppercase tracking-wide">
                      {selectedProject.identity.region}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-tight break-words">
                    {selectedProject.name}
                  </h3>
                </div>

                <div className="flex flex-col gap-2 shrink-0 w-full md:w-52">
                  <button
                    onClick={() => handlePrintFicheProjet(selectedProject)}
                    className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 shadow-xs cursor-pointer active:scale-95"
                    title="Imprimer le dossier complet du projet"
                  >
                    <Printer className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Imprimer Fiche</span>
                  </button>
                  <button
                    onClick={() => handleExportFicheProjetWord(selectedProject)}
                    className="w-full px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 shadow-xs cursor-pointer active:scale-95"
                    title="Exporter le dossier complet du projet sous format Word"
                  >
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Exporter Word</span>
                  </button>
                  <button
                    onClick={() => handleExportFicheProjetPDF(selectedProject)}
                    className="w-full px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 shadow-xs cursor-pointer active:scale-95"
                    title="Exporter le dossier complet du projet sous format PDF"
                  >
                    <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Exporter PDF</span>
                  </button>
                  {hasPrivilege("ajout_projet") && (
                    <button
                      onClick={startEditing}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 shadow-md shadow-blue-600/10 cursor-pointer active:scale-95"
                    >
                      <Edit3 className="w-4 h-4 text-white shrink-0" />
                      <span>Modifier les fiches</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Technical summary pill cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Diamètre</p>
                    <p className="font-extrabold text-slate-800">{selectedProject.identity.caracteristiques.diametre || "N/A"}</p>
                  </div>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-orange-600 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Longueur</p>
                    <p className="font-extrabold text-slate-800">{getProjectDisplayLength(selectedProject) !== "0" ? `${getProjectDisplayLength(selectedProject)} km` : "N/A"}</p>
                  </div>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                  <Sliders className="w-5 h-5 text-yellow-600 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Pression</p>
                    <p className="font-extrabold text-slate-800">{selectedProject.identity.caracteristiques.pression || "N/A"}</p>
                  </div>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400">Cadre</p>
                    <p className="font-extrabold text-slate-800 line-clamp-1">{selectedProject.identity.cadreInscription || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Tabs Navigators inside the Project details */}
            <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto gap-1">
              <button
                onClick={() => setActiveSubTab("planning")}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                  activeSubTab === "planning" ? "bg-white text-blue-800 shadow-sm" : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <Calendar className="w-4 h-4 text-orange-500" />
                <span>00- Planification</span>
              </button>
              <button
                onClick={() => setActiveSubTab("identity")}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                  activeSubTab === "identity" ? "bg-white text-blue-800 shadow-sm" : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <Briefcase className="w-4 h-4 text-blue-500" />
                <span>01- Identité</span>
              </button>
              {hasPrivilege("section_etude") && (
                <>
                  <button
                    onClick={() => setActiveSubTab("etude")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                      activeSubTab === "etude" ? "bg-white text-blue-800 shadow-sm" : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    <Layers className="w-4 h-4 text-yellow-500" />
                    <span>02- Études & Permis</span>
                  </button>
                  <button
                    onClick={() => setActiveSubTab("expertise")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                      activeSubTab === "expertise" ? "bg-white text-blue-800 shadow-sm" : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    <FileCheck className="w-4 h-4 text-emerald-500" />
                    <span>03- Expertise & Indemnisation</span>
                  </button>
                </>
              )}
              {hasPrivilege("section_travaux") && (
                <button
                  onClick={() => setActiveSubTab("travaux")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                    activeSubTab === "travaux" ? "bg-white text-blue-800 shadow-sm" : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span>04- Travaux & Épreuves</span>
                </button>
              )}
              <button
                onClick={() => setActiveSubTab("gaz")}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                  activeSubTab === "gaz" ? "bg-white text-blue-800 shadow-sm" : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <Archive className="w-4 h-4 text-green-500" />
                <span>05- Mise en Gaz</span>
              </button>
            </div>

            {/* Sub-Tab Contents */}
            <motion.div
              layoutId="projectSubTabContent"
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm min-h-[300px] flex flex-col justify-between"
            >
              {/* ================= PHASE 00: PLANNING GANTT ================= */}
              {activeSubTab === "planning" && renderVisualGantt(selectedProject)}

              {/* ================= PHASE 01: IDENTITY DETAILS ================= */}
              {activeSubTab === "identity" && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Phase 01 • Renseignements Généraux</span>
                    <h4 className="font-extrabold text-base text-slate-800">Fiche d'Identité administrative et technique</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-3.5">
                      <div className="flex justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-bold">Direction Régionale TG :</span>
                        <span className="font-black text-slate-800">{selectedProject.identity.region || "Non renseigné"}</span>
                      </div>
                      <div className="flex justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-bold">Pôle de rattachement TG :</span>
                        <span className="font-black text-slate-800">{selectedProject.identity.pole || "Non renseigné"}</span>
                      </div>
                      <div className="flex justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-bold">Wilaya d'implantation :</span>
                        <span className="font-black text-slate-800">{selectedProject.identity.wilaya || "Non renseigné"}</span>
                      </div>
                      <div className="flex justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-bold">District Transport Gaz :</span>
                        <span className="font-black text-slate-800">{selectedProject.identity.district || "Non renseigné"}</span>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-bold">Cadre d'Inscription :</span>
                        <span className="font-black text-slate-800">{selectedProject.identity.cadreInscription || "Non renseigné"}</span>
                      </div>
                      <div className="flex justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-bold">Structure Chargée :</span>
                        <span className="font-black text-slate-800">{selectedProject.identity.structureChargee || "Non renseigné"}</span>
                      </div>
                      <div className="flex justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-bold">Type / Qualité Acier :</span>
                        <span className="font-black text-slate-800">{selectedProject.identity.caracteristiques.typeTuyau || "N/A"}</span>
                      </div>
                      <div className="flex justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                        <span className="text-slate-500 font-bold">Longueur Conduite :</span>
                        <span className="font-black text-slate-800">{getProjectDisplayLength(selectedProject) !== "0" ? `${getProjectDisplayLength(selectedProject)} km` : "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Synthèse des contrats et ODS */}
                  {renderContractsAndOdsSummary()}

                  {/* Responsables du projet */}
                  <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-xs space-y-3">
                    <p className="font-extrabold text-slate-800 flex items-center gap-1.5 border-b border-slate-200/50 pb-2">
                      <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Équipe de Gestion du Projet & Hiérarchie</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Partie Travaux */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-100 flex flex-col gap-2.5">
                        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                            <Briefcase className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">CP - Partie Travaux</span>
                        </div>
                        <div className="space-y-3 divide-y divide-slate-100/60">
                          {selectedProject.chefsDeProjetTravaux && selectedProject.chefsDeProjetTravaux.length > 0 ? (
                            selectedProject.chefsDeProjetTravaux.map((item, idx) => (
                              <div key={idx} className="text-left min-w-0 pt-2 first:pt-0">
                                <p className="font-extrabold text-slate-800 text-[11px] truncate">
                                  {item.name}
                                </p>
                                {item.structure && (
                                  <p className="text-[10px] text-blue-600 font-extrabold flex items-center gap-1 mt-0.5" title="Structure d'appartenance">
                                    <span>🏢</span> <span>{item.structure}</span>
                                  </p>
                                )}
                                {item.email && (
                                  <p className="text-[9px] text-slate-400 font-mono font-medium truncate mt-0.5">{item.email}</p>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-left min-w-0">
                              <p className="font-extrabold text-slate-800 text-[11px] truncate">
                                {selectedProject.chefDeProjetName || "Non assigné"}
                              </p>
                              {selectedProject.chefDeProjetStructure && (
                                <p className="text-[10px] text-blue-600 font-extrabold flex items-center gap-1 mt-0.5" title="Structure d'appartenance">
                                  <span>🏢</span> <span>{selectedProject.chefDeProjetStructure}</span>
                                </p>
                              )}
                              {selectedProject.chefDeProjetEmail && (
                                <p className="text-[9px] text-slate-400 font-mono font-medium truncate mt-0.5">{selectedProject.chefDeProjetEmail}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Partie Étude */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-100 flex flex-col gap-2.5">
                        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Briefcase className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">CP - Partie Étude</span>
                        </div>
                        <div className="space-y-3 divide-y divide-slate-100/60">
                          {selectedProject.chefsDeProjetEtude && selectedProject.chefsDeProjetEtude.length > 0 ? (
                            selectedProject.chefsDeProjetEtude.map((item, idx) => (
                              <div key={idx} className="text-left min-w-0 pt-2 first:pt-0">
                                <p className="font-extrabold text-slate-800 text-[11px] truncate">
                                  {item.name}
                                </p>
                                {item.structure && (
                                  <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-0.5" title="Structure d'appartenance">
                                    <span>🏢</span> <span>{item.structure}</span>
                                  </p>
                                )}
                                {item.email && (
                                  <p className="text-[9px] text-slate-400 font-mono font-medium truncate mt-0.5">{item.email}</p>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-left min-w-0">
                              <p className="font-extrabold text-slate-800 text-[11px] truncate">
                                {selectedProject.chefDeProjetEtudeName || "Non assigné"}
                              </p>
                              {selectedProject.chefDeProjetEtudeStructure && (
                                <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-0.5" title="Structure d'appartenance">
                                  <span>🏢</span> <span>{selectedProject.chefDeProjetEtudeStructure}</span>
                                </p>
                              )}
                              {selectedProject.chefDeProjetEtudeEmail && (
                                <p className="text-[9px] text-slate-400 font-mono font-medium truncate mt-0.5">{selectedProject.chefDeProjetEtudeEmail}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Superviseur */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-100 flex flex-col gap-2.5">
                        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                            <Shield className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Superviseur Projet</span>
                        </div>
                        <div className="space-y-3 divide-y divide-slate-100/60">
                          {selectedProject.superviseurs && selectedProject.superviseurs.length > 0 ? (
                            selectedProject.superviseurs.map((item, idx) => (
                              <div key={idx} className="text-left min-w-0 pt-2 first:pt-0">
                                <p className="font-extrabold text-slate-800 text-[11px] truncate">
                                  {item.name}
                                </p>
                                {item.structure && (
                                  <p className="text-[10px] text-amber-600 font-extrabold flex items-center gap-1 mt-0.5" title="Structure d'appartenance">
                                    <span>🏢</span> <span>{item.structure}</span>
                                  </p>
                                )}
                                {item.email && (
                                  <p className="text-[9px] text-slate-400 font-mono font-medium truncate mt-0.5">{item.email}</p>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-left min-w-0">
                              <p className="font-extrabold text-slate-800 text-[11px] truncate">
                                {selectedProject.superviseurName || "Non assigné"}
                              </p>
                              {selectedProject.superviseurStructure && (
                                <p className="text-[10px] text-amber-600 font-extrabold flex items-center gap-1 mt-0.5" title="Structure d'appartenance">
                                  <span>🏢</span> <span>{selectedProject.superviseurStructure}</span>
                                </p>
                              )}
                              {selectedProject.superviseurEmail && (
                                <p className="text-[9px] text-slate-400 font-mono font-medium truncate mt-0.5">{selectedProject.superviseurEmail}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Chargé Expertise & Indemnisation */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-100 flex flex-col gap-2.5">
                        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                          <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                            <Briefcase className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Expertise & Indemnisation</span>
                        </div>
                        <div className="space-y-3 divide-y divide-slate-100/60">
                          {selectedProject.chefsDeProjetExpertise && selectedProject.chefsDeProjetExpertise.length > 0 ? (
                            selectedProject.chefsDeProjetExpertise.map((item, idx) => (
                              <div key={idx} className="text-left min-w-0 pt-2 first:pt-0">
                                <p className="font-extrabold text-slate-800 text-[11px] truncate">
                                  {item.name}
                                </p>
                                {item.structure && (
                                  <p className="text-[10px] text-orange-600 font-extrabold flex items-center gap-1 mt-0.5" title="Structure d'appartenance">
                                    <span>🏢</span> <span>{item.structure}</span>
                                  </p>
                                )}
                                {item.email && (
                                  <p className="text-[9px] text-slate-400 font-mono font-medium truncate mt-0.5">{item.email}</p>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">Aucun chargé assigné</p>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {selectedProject.identity.planificationComment && (
                    <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl text-xs space-y-1.5">
                      <p className="font-extrabold text-blue-800 flex items-center gap-1.5">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>Notes de Planification & Suivi</span>
                      </p>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        {selectedProject.identity.planificationComment}
                      </p>
                    </div>
                  )}

                  {/* Fiche Technique des Caractéristiques */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4 text-left">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Caractéristiques Techniques Principales</h5>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Diamètre DN</span>
                        <span className="font-mono font-black text-sm text-slate-800">
                          {selectedProject.identity.caracteristiques.diametre ? `${selectedProject.identity.caracteristiques.diametre}"` : "Non spécifié"}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Longueur</span>
                        <span className="font-mono font-black text-sm text-slate-800">
                          {getProjectDisplayLength(selectedProject) !== "0" ? `${getProjectDisplayLength(selectedProject)} km` : "Non spécifié"}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Pression de Service</span>
                        <span className="font-mono font-black text-sm text-slate-800">
                          {selectedProject.identity.caracteristiques.pression || "Non spécifié"}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Capacité de Transit</span>
                        <span className="font-mono font-black text-sm text-slate-800">
                          {selectedProject.identity.caracteristiques.capacitePoste || "Non spécifié"}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Raccordement</span>
                        <span className="font-black text-xs text-slate-800 truncate block" title={selectedProject.identity.caracteristiques.pointRaccordement || ""}>
                          {selectedProject.identity.caracteristiques.pointRaccordement || "Non spécifié"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tracé Géographique (KMZ / Google Earth) */}
                  <div className="bg-gradient-to-r from-blue-50/40 via-indigo-50/30 to-slate-50/20 rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                          <Globe className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Tracé Géographique Interactif (SIG)</h5>
                          <p className="text-[10px] text-slate-500 font-medium">Visualisation en temps réel de l'ouvrage sur fond de carte satellite ou standard</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-50/50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-100/60 self-start sm:self-center animate-pulse">
                        Carte Intégrée
                      </span>
                    </div>

                    {/* Carte SIG Interactive NATIVE */}
                    <ProjectMapViewer project={selectedProject} />

                    {/* Profil en Travers de l'Altitude du Tracé */}
                    <ProjectAltitudeProfile project={selectedProject} />

                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-inner">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${selectedProject.identity.kmzFileData ? "bg-emerald-500 animate-pulse" : "bg-blue-400 animate-pulse"}`}></span>
                          <p className="font-extrabold text-slate-800 text-xs">
                            {selectedProject.identity.kmzFileName || `Tracé_${selectedProject.name.replace(/\s+/g, "_")}.kml`}
                          </p>
                          {selectedProject.identity.kmzFileData ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-md border border-emerald-100 uppercase tracking-wider">
                              Fichier personnalisé
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black rounded-md border border-blue-100 uppercase tracking-wider">
                              Généré automatiquement
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 leading-relaxed">
                          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>
                            {selectedProject.identity.kmzFileData 
                              ? "Fichier personnalisé chargé pour ce projet." 
                              : `Fichier de tracé SIG généré d'après la longueur (${getProjectDisplayLength(selectedProject)} km) et la Wilaya (${selectedProject.identity.wilaya}) du projet.`}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleDownloadKMZ(selectedProject)}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer shrink-0"
                        >
                          <Download className="w-4 h-4" />
                          <span>Télécharger KMZ/KML</span>
                        </button>
                        <a
                          href="https://earth.google.com/web/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-2 cursor-pointer shrink-0"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Ouvrir Google Earth</span>
                        </a>
                      </div>
                    </div>

                    {/* Zone de chargement pour modification du tracé */}
                    {hasPrivilege("modifier_projet") && (
                      <div className="text-[10px] text-slate-500 bg-slate-50/60 p-3 rounded-xl border border-dashed border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-700">
                            {selectedProject.identity.kmzFileData 
                              ? "Remplacer ou supprimer le tracé SIG du projet :" 
                              : "Charger un tracé KML/KMZ personnalisé pour ce projet :"}
                          </p>
                          <p className="text-[9px] text-slate-400">Glissez-déposez ou sélectionnez un fichier .kml ou .kmz officiel (max. 800 Ko)</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold cursor-pointer transition-colors text-xs text-center shrink-0">
                            <input
                              type="file"
                              accept=".kml,.kmz"
                              className="hidden"
                              onChange={(e) => handleUploadKMZ(e, selectedProject)}
                            />
                            {selectedProject.identity.kmzFileData ? "Remplacer le fichier" : "Charger un fichier"}
                          </label>
                          {selectedProject.identity.kmzFileData && (
                            <button
                              onClick={() => handleDeleteKMZ(selectedProject)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg font-bold cursor-pointer transition-colors text-xs text-center flex items-center gap-1 shrink-0"
                              title="Supprimer le tracé personnalisé"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Supprimer</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Schéma Synoptique Automatique */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider font-mono">Visualisation Technique</span>
                        <h5 className="font-black text-sm text-slate-800">Schéma Synoptique Automatique de l'Ouvrage</h5>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-mono">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></span> Actif / Présent</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-200 border border-slate-300 rounded-full"></span> Non configuré</span>
                      </div>
                    </div>

                    {/* SVG Pipeline Diagram */}
                    <div className="relative overflow-x-auto py-8 px-4 bg-gradient-to-r from-slate-900 to-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                      {(() => {
                        const { caracteristiques } = selectedProject.identity;
                        const isLongueurZero = parseFloat(getProjectDisplayLength(selectedProject)) === 0;

                        if (isLongueurZero) {
                          return (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-slate-900 rounded-xl border border-slate-800 text-slate-100">
                              {/* Illustration Technique à Gauche */}
                              <div className="relative w-full md:w-1/2 h-48 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:14px_24px] opacity-20" />
                                
                                <svg className="w-full h-full p-4" viewBox="0 0 300 150">
                                  {/* Feed line vertical (yellow) */}
                                  <line x1="60" y1="10" x2="60" y2="140" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
                                  <text x="45" y="75" fill="#f59e0b" className="text-[9px] font-mono font-black" transform="rotate(-90 45 75)" textAnchor="middle">
                                    Gazoduc Existant (Alimentation)
                                  </text>

                                  {/* Direct Piquage line */}
                                  <line x1="60" y1="75" x2="140" y2="75" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
                                  <circle cx="60" cy="75" r="5" fill="#f59e0b" />
                                  
                                  <text x="100" y="65" fill="#38bdf8" className="text-[10px] font-black" textAnchor="middle">
                                    Piquage
                                  </text>

                                  {/* Post Card */}
                                  <g transform="translate(140, 40)">
                                    <rect x="0" y="0" width="120" height="70" rx="8" fill="#1e1b4b" stroke="#f43f5e" strokeWidth="2.5" />
                                    
                                    {/* Detente delivery symbol inside circle */}
                                    <circle cx="35" cy="35" r="16" stroke="#f43f5e" strokeWidth="2" fill="#881337" />
                                    <path d="M29 27 L43 35 L29 43 Z" fill="#f43f5e" />
                                    
                                    <text x="85" y="32" fill="#f43f5e" className="text-[11px] font-black" textAnchor="middle">
                                      Poste DP
                                    </text>
                                    <text x="85" y="48" fill="#fda4af" className="text-[9px] font-mono font-bold" textAnchor="middle">
                                      Au Piquage
                                    </text>
                                  </g>
                                </svg>
                              </div>

                              {/* Détails techniques à droite */}
                              <div className="w-full md:w-1/2 space-y-4 text-xs text-left">
                                <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl">
                                  <p className="text-amber-400 font-extrabold flex items-center gap-1.5 mb-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                                    Poste Installé au Niveau du Piquage (L = 0 km)
                                  </p>
                                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                    Étant donné que la longueur de la conduite d'interconnexion est de 0 km, aucun tronçon de ligne n'est construit. Le poste de détente (DP) est physiquement implanté à l'emplacement immédiat du piquage d'alimentation.
                                  </p>
                                </div>

                                <div className="space-y-2.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <span className="text-slate-400 font-bold font-mono text-[10px] uppercase">Point de raccordement</span>
                                    <span className="text-white font-black font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 truncate max-w-[180px]">
                                      {caracteristiques.pointRaccordement || "Non spécifié"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <span className="text-slate-400 font-bold font-mono text-[10px] uppercase">Capacité du Poste (Q)</span>
                                    <span className="text-rose-400 font-black font-mono text-sm">
                                      {caracteristiques.capacitePoste || "Non spécifiée"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 font-bold font-mono text-[10px] uppercase">Pression de Service</span>
                                    <span className="text-blue-400 font-bold font-mono">
                                      {caracteristiques.pression || "Non spécifiée"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Get sequence from the helper function
                        const activeNodes = getPipelineSequence(caracteristiques);

                        if (activeNodes.length === 0) {
                          return (
                            <div className="py-12 text-center text-slate-500 font-bold text-xs bg-slate-900/60 rounded-xl border border-slate-800">
                              Aucun élément ou poste n'est activé dans les caractéristiques techniques du projet.
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-6">
                            {/* Top technical stats summary */}
                            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-950/70 rounded-xl border border-slate-800 text-xs font-mono">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-bold uppercase text-[9px]">Longueur de ligne:</span>
                                <span className="text-emerald-400 font-black">L = {getProjectDisplayLength(selectedProject)} km</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-bold uppercase text-[9px]">Diamètre DN:</span>
                                <span className="text-blue-400 font-black">DN = {caracteristiques.diametre || "Non spécifié"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-bold uppercase text-[9px]">Capacité de Transit:</span>
                                <span className="text-rose-400 font-black">Q = {caracteristiques.capacitePoste || "Non spécifiée"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-bold uppercase text-[9px]">Pression:</span>
                                <span className="text-amber-400 font-black">P = {caracteristiques.pression || "Non spécifiée"}</span>
                              </div>
                            </div>

                            {/* Horizontally Scrollable Pipeline Synoptic */}
                            <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                              <div className="relative w-max min-w-full flex items-center gap-14 px-12 py-10 min-h-[220px] bg-slate-950/40 rounded-2xl border border-slate-800/40">
                                
                                {/* Background pipeline tube representing the gas pipeline */}
                                <div className="absolute top-[82px] left-[60px] w-[calc(100%-120px)] h-3 bg-slate-900 rounded-full border border-slate-800" />
                                <div className="absolute top-[84px] left-[60px] w-[calc(100%-120px)] h-2 bg-gradient-to-r from-amber-500 via-blue-500 via-teal-400 to-emerald-500 rounded-full opacity-95 shadow-[0_0_15px_rgba(45,212,191,0.5)] animate-pulse" />
                                
                                {activeNodes.map((node, index) => {
                                  const renderSymbol = () => {
                                    switch (node.type) {
                                      case "racc":
                                        return (
                                          <svg className="w-12 h-12 text-amber-500" viewBox="0 0 48 48" fill="none">
                                            <line x1="10" y1="4" x2="10" y2="44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                            <path d="M10 24 L22 24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                            <circle cx="10" cy="24" r="5" fill="#f59e0b" />
                                            <path d="M22 18 L22 30 L32 24 Z" fill="currentColor" />
                                            <path d="M32 18 L32 30 L22 24 Z" fill="currentColor" />
                                            <circle cx="27" cy="24" r="2" fill="#0f172a" />
                                          </svg>
                                        );
                                      case "gr_dep":
                                        return (
                                          <svg className="w-12 h-12 text-blue-500" viewBox="0 0 48 48" fill="none">
                                            <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
                                            <path d="M12 16 L24 16 L32 21 L32 27 L24 32 L12 32 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
                                            <line x1="12" y1="14" x2="12" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                            <line x1="28" y1="16" x2="28" y2="10" stroke="currentColor" strokeWidth="1.5" />
                                            <circle cx="28" cy="8" r="2" fill="currentColor" />
                                          </svg>
                                        );
                                      case "coup":
                                        return (
                                          <svg className="w-12 h-12 text-cyan-400" viewBox="0 0 48 48" fill="none">
                                            <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
                                            <path d="M10 18 L10 30 L20 24 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
                                            <path d="M20 18 L20 30 L10 24 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
                                            <line x1="15" y1="24" x2="15" y2="14" stroke="currentColor" strokeWidth="2" />
                                            <line x1="12" y1="14" x2="18" y2="14" stroke="currentColor" strokeWidth="2" />
                                            <line x1="20" y1="24" x2="28" y2="24" stroke="currentColor" strokeWidth="2.5" />
                                            <path d="M28 18 L28 30 L38 24 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
                                            <path d="M38 18 L38 30 L28 24 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
                                            <line x1="33" y1="24" x2="33" y2="14" stroke="currentColor" strokeWidth="2" />
                                            <line x1="30" y1="14" x2="36" y2="14" stroke="currentColor" strokeWidth="2" />
                                          </svg>
                                        );
                                      case "sect":
                                        return (
                                          <svg className="w-12 h-12 text-orange-400" viewBox="0 0 48 48" fill="none">
                                            <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
                                            <path d="M14 16 L14 32 L34 24 Z" fill="currentColor" stroke="currentColor" strokeWidth="2" />
                                            <path d="M34 16 L34 32 L14 24 Z" fill="currentColor" stroke="currentColor" strokeWidth="2" />
                                            <line x1="24" y1="24" x2="24" y2="12" stroke="currentColor" strokeWidth="2" />
                                            <circle cx="24" cy="11" r="2.5" fill="currentColor" />
                                          </svg>
                                        );
                                      case "gr_arr":
                                        return (
                                          <svg className="w-12 h-12 text-emerald-500" viewBox="0 0 48 48" fill="none">
                                            <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
                                            <path d="M16 21 L24 16 L36 16 L36 32 L24 32 L16 27 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
                                            <line x1="36" y1="14" x2="36" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                            <line x1="20" y1="18" x2="20" y2="10" stroke="currentColor" strokeWidth="1.5" />
                                            <circle cx="20" cy="8" r="2" fill="currentColor" />
                                          </svg>
                                        );
                                      case "det":
                                        return (
                                          <svg className="w-12 h-12 text-rose-500" viewBox="0 0 48 48" fill="none">
                                            <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.05" />
                                            <path d="M18 15 L34 24 L18 33 Z" fill="currentColor" stroke="currentColor" strokeWidth="2" />
                                            <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                                          </svg>
                                        );
                                      default:
                                        return <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700" />;
                                    }
                                  };

                                  return (
                                    <div key={node.id || index} className="flex flex-col items-center relative z-10 w-32 shrink-0 text-center bg-slate-950/90 py-3.5 px-3 rounded-2xl border border-slate-800 shadow-xl transition-all hover:scale-105 hover:border-slate-700">
                                      {/* Node sequence indicator badge */}
                                      <div className="absolute -top-2.5 -left-1 text-[8px] font-bold font-mono px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">
                                        {node.pk ? `PK ${node.pk}` : `Ouvrage ${index + 1}`}
                                      </div>
                                      
                                      <div className="flex items-center justify-center mb-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                                        {renderSymbol()}
                                      </div>
                                      
                                      <span className="text-[10px] font-black text-slate-100 leading-tight block h-7 overflow-hidden text-ellipsis line-clamp-2">
                                        {node.label}
                                      </span>
                                      
                                      <span className="text-[8px] text-slate-500 font-mono block mt-1 uppercase tracking-wider font-bold">
                                        {node.type === "racc" ? "Piquage" : node.type === "gr_dep" ? "GRD (Départ)" : node.type === "gr_arr" ? "GRA (Arrivée)" : node.type === "coup" ? "Coupure" : node.type === "sect" ? "Sectionnement" : "Détente / DP"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Multi-lot Management Section */}
                  {(() => {
                    const updateProjectContractField = async (contractKey: 'bureauEtude' | 'betEnvironnement' | 'expert' | 'etbGC' | 'etbMeca', field: string, value: any, lotId?: string) => {
                      if (!selectedProject?.id) return;
                      const emptyContractObj = { nom: "", ref: "", montant: "", date: "", ods: "", avancement: 0, delai: "", postesAffectes: "" };
                      const currentContrats = selectedProject.contrats || {};
                      const currentContractKeyObj = (currentContrats as any)[contractKey] || emptyContractObj;
                      
                      const updatedContrats = {
                        ...currentContrats,
                        [contractKey]: {
                          ...currentContractKeyObj,
                          [field]: value
                        }
                      };

                      const updatePayload: any = {
                        contrats: updatedContrats,
                        updatedAt: new Date().toISOString()
                      };

                      if (contractKey === 'expert' && field === 'nom') {
                        updatePayload.ficheSuivi = {
                          ...(selectedProject.ficheSuivi || {}),
                          gefCabinet: value
                        };
                        updatePayload.etudeAutorisation = {
                          ...(selectedProject.etudeAutorisation || {}),
                          expertiseFonciere: {
                            ...(selectedProject.etudeAutorisation?.expertiseFonciere || {}),
                            gefIdentity: value,
                            gefDesignated: !!value
                          }
                        };
                      } else if (contractKey === 'bureauEtude' && field === 'nom') {
                        updatePayload.ficheSuivi = {
                          ...(selectedProject.ficheSuivi || {}),
                          etudeBetCabinet: value
                        };
                      }

                      if (selectedProject.lots && selectedProject.lots.length > 0) {
                        const updatedLots = selectedProject.lots.map(l => {
                          if (!lotId || l.id === lotId) {
                            const lContrats = l.contrats || {};
                            return {
                              ...l,
                              contrats: {
                                ...lContrats,
                                [contractKey]: {
                                  ...((lContrats as any)[contractKey] || emptyContractObj),
                                  [field]: value
                                }
                              }
                            };
                          }
                          return l;
                        });
                        updatePayload.lots = updatedLots;
                      }

                      try {
                        await setDoc(doc(db, "projects", selectedProject.id), updatePayload, { merge: true });
                      } catch (err) {
                        console.error("Error updating contract field:", err);
                      }
                    };

                    return (
                      <div id="multi-lot-management-section" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                          <div>
                            <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider font-mono">Organisation Physique</span>
                            <h5 className="font-black text-sm text-slate-800">Gestion Individuelle Multi-Lots ({selectedProject.nombreLots || 1} Lot{(selectedProject.nombreLots || 1) > 1 ? "s" : ""})</h5>
                          </div>
                          {hasPrivilege("section_travaux") && (
                            <span className="text-[10px] text-slate-400 font-mono">Vue synthétique multi-lots</span>
                          )}
                        </div>

                        {/* Defile de haut en bas lot 1 ... lot 2 ... lot 3 */}
                        <div className="space-y-6">
                          {((selectedProject.lots && selectedProject.lots.length > 0) ? selectedProject.lots : [
                            {
                              id: "lot-1",
                              name: "Lot Unique (Général)",
                              phase: selectedProject.identity.phase || "Étude",
                              avancementPhysique: selectedProject.travauxPlanification.avancementPhysique || 0,
                              avancementGC: selectedProject.travauxPlanification.avancementGC || 0,
                              avancementMeca: selectedProject.travauxPlanification.avancementMeca || 0,
                              contrats: selectedProject.contrats
                            }
                          ]).map((lot, idx) => {
                            const updateContractField = (contractKey: 'bureauEtude' | 'betEnvironnement' | 'expert' | 'etbGC' | 'etbMeca', field: string, value: any) => {
                              updateProjectContractField(contractKey, field, value, lot.id);
                            };

                        return (
                          <div key={lot.id || idx} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="bg-blue-600 text-white font-black px-2.5 py-1 rounded-lg text-[10px] uppercase font-mono tracking-wider">
                                  {lot.id?.toUpperCase() || `LOT ${idx + 1}`}
                                </span>
                                <h6 className="font-black text-xs text-slate-800">{lot.name || `Lot ${idx + 1}`}</h6>
                                {lot.wilaya && (
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[9px] font-black border border-slate-200">
                                    {lot.wilaya}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">Phase Actuelle :</span>
                                  <span className="bg-white px-2.5 py-1 rounded-full border border-slate-200 font-black text-[10px] text-blue-700">
                                    {lot.phase || "Étude"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* PK limit and assigned postes display */}
                            <div className="flex flex-col sm:flex-row justify-between gap-3 text-xs bg-white p-3 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                                <span className="font-bold">Emprise du Lot :</span>
                                <span className="font-black text-slate-900 bg-slate-100/80 px-2 py-0.5 rounded-md font-mono">
                                  Lot {idx + 1} du Point Kilométrique PK.N° {lot.pkStart || "0+000"} à PK N° {lot.pkEnd || ".+...."}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                                <span className="font-bold">Postes/Points affectés :</span>
                                <span className="font-black text-slate-900 truncate max-w-[280px]" title={lot.postesAffectes?.join(", ")}>
                                  {lot.postesAffectes && lot.postesAffectes.length > 0 ? lot.postesAffectes.join(", ") : "Aucun ouvrage affecté"}
                                </span>
                              </div>
                            </div>


                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                  {/* PK configuration */}
                                  <div className="space-y-1.5">
                                    <span className="text-slate-500 font-black text-[9px] uppercase tracking-wider block">Limites Géographiques du Lot :</span>
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1">
                                        <span className="text-slate-400 text-[10px] font-bold">PK Début :</span>
                                        <input 
                                          type="text"
                                          placeholder="0+000"
                                          value={lot.pkStart || ""}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            const updatedLots = (selectedProject.lots || []).map(l => 
                                              l.id === lot.id ? { ...l, pkStart: val } : l
                                            );
                                            setDoc(doc(db, "projects", selectedProject.id), { 
                                              lots: updatedLots,
                                              updatedAt: new Date().toISOString()
                                            }, { merge: true });
                                          }}
                                          className="w-24 bg-white border border-slate-200 rounded px-2 py-1 font-bold text-slate-800 font-mono text-[11px] outline-none"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-slate-400 text-[10px] font-bold">PK Fin :</span>
                                        <input 
                                          type="text"
                                          placeholder=".+...."
                                          value={lot.pkEnd || ""}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            const updatedLots = (selectedProject.lots || []).map(l => 
                                              l.id === lot.id ? { ...l, pkEnd: val } : l
                                            );
                                            setDoc(doc(db, "projects", selectedProject.id), { 
                                              lots: updatedLots,
                                              updatedAt: new Date().toISOString()
                                            }, { merge: true });
                                          }}
                                          className="w-24 bg-white border border-slate-200 rounded px-2 py-1 font-bold text-slate-800 font-mono text-[11px] outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Postes/Ouvrages allocation */}
                                  <div className="space-y-1.5">
                                    <span className="text-slate-500 font-black text-[9px] uppercase tracking-wider block">Affectation des Ouvrages & Points Concentrés :</span>
                                    {(() => {
                                      const availableOuvragesList = [];
                                      if (selectedProject.identity?.caracteristiques?.hasPiquage) availableOuvragesList.push("Piquage");
                                      if (selectedProject.identity?.caracteristiques?.hasGareRacleurDepart) availableOuvragesList.push("Gare Racleur Départ");
                                      if (selectedProject.identity?.caracteristiques?.hasGareRacleurArrivee) availableOuvragesList.push("Gare Racleur Arrivée");

                                      if (selectedProject.identity?.caracteristiques?.hasPosteCoupure) {
                                        const count = selectedProject.identity.caracteristiques.nbPostesCoupure || 1;
                                        for (let i = 1; i <= count; i++) {
                                          availableOuvragesList.push(`Poste de Coupure ${i}`);
                                        }
                                      }
                                      if (selectedProject.identity?.caracteristiques?.hasPosteSectionnement) {
                                        const count = selectedProject.identity.caracteristiques.nbPostesSectionnement || 1;
                                        for (let i = 1; i <= count; i++) {
                                          availableOuvragesList.push(`Poste de Sectionnement ${i}`);
                                        }
                                      }
                                      if (selectedProject.identity?.caracteristiques?.hasPosteDetente) {
                                        availableOuvragesList.push("Poste de Détente");
                                      }

                                      // Add any other pipeline sequence labels
                                      if (selectedProject.identity?.caracteristiques?.pipelineSequence) {
                                        selectedProject.identity.caracteristiques.pipelineSequence.forEach(node => {
                                          if (node.label && !availableOuvragesList.includes(node.label)) {
                                            availableOuvragesList.push(node.label);
                                          }
                                        });
                                      }

                                      const hasOuvrageDuplicate = (ov: string) => {
                                        return (selectedProject.lots || []).some(l => l.postesAffectes?.includes(ov));
                                      };

                                      return (
                                        <div className="space-y-1.5 bg-white p-3 rounded-2xl border border-slate-200">
                                          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                            <select
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                if (!val) return;
                                                
                                                const isDuplicate = hasOuvrageDuplicate(val);
                                                if (isDuplicate) {
                                                  const confirmAdd = window.confirm(`⚠️ Attention: L'ouvrage "${val}" est déjà attribué à un autre lot. Êtes-vous sûr de vouloir l'affecter également à ce lot ?`);
                                                  if (!confirmAdd) {
                                                    e.target.value = "";
                                                    return;
                                                  }
                                                }

                                                let currentList = lot.postesAffectes || [];
                                                if (!currentList.includes(val)) {
                                                  currentList = [...currentList, val];
                                                }
                                                
                                                const updatedLots = (selectedProject.lots || []).map(l => 
                                                  l.id === lot.id ? { ...l, postesAffectes: currentList } : l
                                                );
                                                setDoc(doc(db, "projects", selectedProject.id), { 
                                                  lots: updatedLots,
                                                  updatedAt: new Date().toISOString()
                                                }, { merge: true });
                                                
                                                e.target.value = "";
                                              }}
                                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-700 text-xs outline-none focus:border-indigo-500 cursor-pointer"
                                            >
                                              <option value="">➕ Affecter un Ouvrage / Point Concentré...</option>
                                              {availableOuvragesList.map((ov, oIdx) => {
                                                const isAlreadyInCurrentLot = lot.postesAffectes?.includes(ov);
                                                if (isAlreadyInCurrentLot) return null;
                                                
                                                const isDuplicate = hasOuvrageDuplicate(ov);
                                                return (
                                                  <option key={oIdx} value={ov}>
                                                    {ov} {isDuplicate ? " ⚠️ (Déjà affecté à un autre lot)" : ""}
                                                  </option>
                                                );
                                              })}
                                            </select>
                                            
                                            <div className="flex gap-1.5 items-center">
                                              <input 
                                                type="text"
                                                placeholder="Saisir manuellement..."
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const val = e.currentTarget.value.trim();
                                                    if (val) {
                                                      const isDuplicate = hasOuvrageDuplicate(val);
                                                      if (isDuplicate) {
                                                        const confirmAdd = window.confirm(`⚠️ Attention: L'ouvrage "${val}" est déjà attribué à un autre lot. Voulez-vous continuer ?`);
                                                        if (!confirmAdd) return;
                                                      }
                                                      let currentList = lot.postesAffectes || [];
                                                      if (!currentList.includes(val)) {
                                                        currentList = [...currentList, val];
                                                      }
                                                      const updatedLots = (selectedProject.lots || []).map(l => 
                                                        l.id === lot.id ? { ...l, postesAffectes: currentList } : l
                                                      );
                                                      setDoc(doc(db, "projects", selectedProject.id), { 
                                                        lots: updatedLots,
                                                        updatedAt: new Date().toISOString()
                                                      }, { merge: true });
                                                      e.currentTarget.value = "";
                                                    }
                                                  }
                                                }}
                                                className="w-40 bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800 text-xs outline-none"
                                              />
                                            </div>
                                          </div>

                                          {lot.postesAffectes && lot.postesAffectes.some(p => (selectedProject.lots || []).some(other => other.id !== lot.id && other.postesAffectes?.includes(p))) && (
                                            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-2 text-[10px] font-bold mt-1.5">
                                              ⚠️ Un ou plusieurs ouvrages ci-dessous sont également affectés à d'autres lots (double détection).
                                            </div>
                                          )}

                                          {lot.postesAffectes && lot.postesAffectes.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-2">
                                              {lot.postesAffectes.map((p, pIdx) => {
                                                const isDup = (selectedProject.lots || []).some(other => other.id !== lot.id && other.postesAffectes?.includes(p));
                                                return (
                                                  <span key={pIdx} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all ${
                                                    isDup ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs' : 'bg-slate-100 border-slate-200 text-slate-700'
                                                  }`}>
                                                    <span>{p}</span>
                                                    {isDup && <span className="text-[9px] font-mono font-black uppercase text-amber-600 bg-amber-200 px-1 rounded-sm">LOT DOUBLE</span>}
                                                    <button 
                                                      type="button" 
                                                      onClick={() => {
                                                        const updatedList = lot.postesAffectes?.filter((_, i) => i !== pIdx) || [];
                                                        const updatedLots = (selectedProject.lots || []).map(l => 
                                                          l.id === lot.id ? { ...l, postesAffectes: updatedList } : l
                                                        );
                                                        setDoc(doc(db, "projects", selectedProject.id), { 
                                                          lots: updatedLots,
                                                          updatedAt: new Date().toISOString()
                                                        }, { merge: true });
                                                      }}
                                                      className="text-red-500 hover:text-red-700 font-extrabold text-[11px] ml-1.5 focus:outline-none"
                                                    >
                                                      ×
                                                    </button>
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

              {/* ================= PHASE 02: ETUDES & AUTORISATIONS ================= */}
              {activeSubTab === "etude" && (
                <div className="space-y-6 text-left">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-yellow-600 tracking-wider font-mono">Phase 02 • Dossier Administratif</span>
                      <h4 className="font-extrabold text-base text-slate-800">Suivi des Études & Permis de Construire</h4>
                    </div>
                    {hasPrivilege("section_etude") && (
                      <button
                        onClick={() => {
                          if (selectedProject?.ficheSuivi) {
                            const parsed = JSON.parse(JSON.stringify(selectedProject.ficheSuivi));
                            setFicheSuiviForm({
                              ...createDefaultFicheSuivi(),
                              ...parsed,
                              rappels: parsed.rappels || createDefaultFicheSuivi().rappels,
                              reserves: parsed.reserves || createDefaultFicheSuivi().reserves,
                              autresInformations: parsed.autresInformations || createDefaultFicheSuivi().autresInformations,
                            });
                          } else {
                            setFicheSuiviForm(createDefaultFicheSuivi());
                          }
                          setIsEditingFicheSuivi(!isEditingFicheSuivi);
                        }}
                        className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                          isEditingFicheSuivi ? "bg-slate-200 text-slate-800 hover:bg-slate-300" : "bg-yellow-600 hover:bg-yellow-700 text-white"
                        }`}
                      >
                        {isEditingFicheSuivi ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        <span>{isEditingFicheSuivi ? "Annuler l'Édition" : "Éditer l'Étude & Permis"}</span>
                      </button>
                    )}
                  </div>

                  {isEditingFicheSuivi ? (
                    /* Fiche de Suivi - EDIT FORM */
                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6 text-xs">
                      <div className="bg-yellow-500/10 border border-yellow-200 p-3 rounded-xl text-yellow-800 font-bold mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>Mode Édition Études & Autorisations - Les modifications sont sauvegardées dans la base de données.</span>
                      </div>

                      {/* SECTION 1: CONSISTANCE */}
                      <div className="space-y-4">
                        <h5 className="font-extrabold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1 text-[11px] flex items-center gap-2">
                          <Layers className="w-4 h-4 text-yellow-600" />
                          <span>1. Consistance de l'Ouvrage</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Capacité Poste (Nm3/h) :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.capPoste || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, capPoste: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-medium"
                              placeholder="ex: 15 000 Nm3/h"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Longeur de Ligne (Ml) :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.ligneMl || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, ligneMl: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-medium"
                              placeholder="ex: 45 000 Ml"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Type de Poste :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.typePoste || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, typePoste: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-medium"
                              placeholder="ex: DP / DC / Cabine"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Type de Programme :</label>
                            <select
                              value={ficheSuiviForm.typeProgramme || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, typeProgramme: e.target.value as any })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-black"
                            >
                              <option value="">Sélectionner...</option>
                              <option value="OC et MEG">OC et MEG</option>
                              <option value="OC">OC</option>
                              <option value="MEG">MEG</option>
                              <option value="Hors programme">Hors programme</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: ETUDE D'IMPACT */}
                      <div className="space-y-4 text-left">
                        <h5 className="font-extrabold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1 text-[11px] flex items-center gap-2">
                          <Activity className="w-4 h-4 text-green-600" />
                          <span>2. Étude d'Impact sur l'Environnement</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Assujettis à l'étude :</label>
                            <select
                              value={ficheSuiviForm.impactAssujettis || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, impactAssujettis: e.target.value as any })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-black"
                            >
                              <option value="">Sélectionner...</option>
                              <option value="Oui">Oui</option>
                              <option value="Non">Non</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Cabinet d'Étude (BET) / ODS :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.impactBetOds || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, impactBetOds: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-medium"
                              placeholder="ex: BET EcoEnvironnement"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Date Dépôt de l'étude :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.impactDepotEtude || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, impactDepotEtude: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Date Demande d'Autorisation d'Exploit. :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.impactDemandeAutExploitDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, impactDemandeAutExploitDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Ouverture Enquête Publique :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.impactOuvertureEnqueteDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, impactOuvertureEnqueteDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Publication Journaux (Impact) :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.impactPubJournauxDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, impactPubJournauxDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Quittance (Impact) :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.impactQuittanceDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, impactQuittanceDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SECTION 3: DOSSIER PC & BET */}
                      <div className="space-y-4">
                        <h5 className="font-extrabold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1 text-[11px] flex items-center gap-2">
                          <Building className="w-4 h-4 text-purple-600" />
                          <span>3. Permis de Construire (PC) & Étude d'Exécution</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-slate-500 font-bold mb-1">Choix de Terrain (Date d'enquête) :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.choixTerrainDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, choixTerrainDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">PV Choix Terrain :</label>
                            <select
                              value={ficheSuiviForm.choixTerrainPv || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, choixTerrainPv: e.target.value as any })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-black"
                            >
                              <option value="">Sélectionner...</option>
                              <option value="Oui">Oui (Favorable)</option>
                              <option value="Non">Non</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Étude par BET :</label>
                            <select
                              value={ficheSuiviForm.etudeBetStatut || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, etudeBetStatut: e.target.value as any })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-black"
                            >
                              <option value="">Sélectionner...</option>
                              <option value="Oui">Oui (Finalisée)</option>
                              <option value="Non">Non</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-slate-500 font-bold mb-1">Nom Cabinet BET d'exécution :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.etudeBetCabinet || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, etudeBetCabinet: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-medium"
                              placeholder="ex: Cabinet Kanoun"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-slate-500 font-bold mb-1">Date de Dépôt du Permis de Construire (PC) :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.depotPcDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, depotPcDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-slate-500 font-bold mb-1">Date de Dépôt de l'Arrêté de Servitude (AS) :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.depotAsDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, depotAsDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SECTION 4: ARRETE DE SERVITUDE (AS) DETAIL */}
                      <div className="space-y-4">
                        <h5 className="font-extrabold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1 text-[11px] flex items-center gap-2">
                          <Layers className="w-4 h-4 text-yellow-600" />
                          <span>4. Suivi de l'Arrêté de Servitude (AS)</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Date Demande Arrêté :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.asDateDemande || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, asDateDemande: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Ouverture d'Enquête Arrêté :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.asOuvertureEnqueteDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, asOuvertureEnqueteDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Publication Journaux Arrêté :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.asPubJournauxDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, asPubJournauxDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Quittance Arrêté :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.asQuittanceDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, asQuittanceDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SECTION 5: RAPPELS, RESERVES ET NOTES (Levée de réserves & actions) */}
                      <div className="space-y-4">
                        <h5 className="font-extrabold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1 text-[11px] flex items-center gap-2">
                          <Info className="w-4 h-4 text-slate-600" />
                          <span>5. Rappels, Levée de Réserves & Actions (max 8 Notes)</span>
                        </h5>

                        <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-200/50 grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-slate-600 font-bold mb-1 text-[11px]">Date levée de réserve (Études) :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.etudeLeveeReserveDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, etudeLeveeReserveDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-bold mb-1 text-[11px]">Statut / Réf. levée de réserve (Études) :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.etudeLeveeReserveStatus || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, etudeLeveeReserveStatus: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-medium text-xs"
                              placeholder="ex: Levée totale par PV du..."
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-bold mb-1 text-[11px]">Action à mener / État de l'action (Études) :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.etudeActionStatus || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, etudeActionStatus: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-medium text-xs"
                              placeholder="ex: Relance de la DRE en cours"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <span className="font-bold text-slate-700 block text-[10px] uppercase">Rappels de procédure :</span>
                            {ficheSuiviForm.rappels.map((rap, idx) => (
                              <input
                                key={`rap-${idx}`}
                                type="text"
                                value={rap || ""}
                                onChange={e => {
                                  const newRappels = [...ficheSuiviForm.rappels];
                                  newRappels[idx] = e.target.value;
                                  setFicheSuiviForm({ ...ficheSuiviForm, rappels: newRappels });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-blue-500"
                                placeholder={`Rappel #${idx + 1}`}
                              />
                            ))}
                          </div>
                          <div className="space-y-2">
                            <span className="font-bold text-slate-700 block text-[10px] uppercase">Réserves techniques relevées :</span>
                            {ficheSuiviForm.reserves.map((res, idx) => (
                              <input
                                key={`res-${idx}`}
                                type="text"
                                value={res || ""}
                                onChange={e => {
                                  const newReserves = [...ficheSuiviForm.reserves];
                                  newReserves[idx] = e.target.value;
                                  setFicheSuiviForm({ ...ficheSuiviForm, reserves: newReserves });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-blue-500"
                                placeholder={`Réserve #${idx + 1}`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <span className="font-bold text-slate-700 block text-[10px] uppercase">Observations / Actions correctives :</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ficheSuiviForm.autresInformations.map((note, idx) => (
                              <input
                                key={`note-${idx}`}
                                type="text"
                                value={note || ""}
                                onChange={e => {
                                  const newNotes = [...ficheSuiviForm.autresInformations];
                                  newNotes[idx] = e.target.value;
                                  setFicheSuiviForm({ ...ficheSuiviForm, autresInformations: newNotes });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-blue-500"
                                placeholder={`Action / Observation #${idx + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setIsEditingFicheSuivi(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-all active:scale-95"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          disabled={isSavingFicheSuivi}
                          onClick={handleSaveFicheSuivi}
                          className="px-5 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                        >
                          {isSavingFicheSuivi ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          <span>{isSavingFicheSuivi ? "Enregistrement..." : "Sauvegarder les Données"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Fiche de Suivi - READ ONLY BEAUTIFUL BENTO GRID VIEW */
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-left">
                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block mb-2">Consistance de l'ouvrage</span>
                          <div className="space-y-2">
                            <p className="flex justify-between">
                              <span className="text-slate-500 font-bold">Capacité du Poste :</span>
                              <span className="font-black text-slate-800">{selectedProject.ficheSuivi?.capPoste || "Non renseigné"}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-500 font-bold">Ligne de transport :</span>
                              <span className="font-black text-slate-800">{selectedProject.ficheSuivi?.ligneMl ? `${selectedProject.ficheSuivi?.ligneMl} Ml` : "Non renseigné"}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-500 font-bold">Type de Poste :</span>
                              <span className="font-black text-slate-800">{selectedProject.ficheSuivi?.typePoste || "Non renseigné"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-center items-center text-center">
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block mb-3 text-left w-full">Programme d'investissement</span>
                          <div className="py-2.5">
                            {selectedProject.ficheSuivi?.typeProgramme ? (
                              <span className="text-xs font-black px-4 py-2 bg-blue-100 text-blue-900 rounded-xl border border-blue-200">
                                {selectedProject.ficheSuivi.typeProgramme}
                              </span>
                            ) : (
                              <span className="text-xs font-black px-4 py-2 bg-slate-100 text-slate-500 rounded-xl border border-slate-200">
                                Non défini dans la fiche
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* BENTO ROW 2: IMPACT & PERMIS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-left">
                        <div className="p-5 bg-green-50/45 rounded-2xl border border-green-100/70 space-y-3">
                          <h5 className="font-extrabold text-green-800 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-green-600" />
                            <span>Suivi de l'Étude d'Impact sur l'Environnement</span>
                          </h5>
                          <div className="grid grid-cols-2 gap-3.5 pt-1">
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Assujettis</p>
                              <p className="font-black text-slate-800">{selectedProject.ficheSuivi?.impactAssujettis || "Non renseigné"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Cabinet d'étude (BET)</p>
                              <p className="font-black text-slate-800 leading-tight">{selectedProject.ficheSuivi?.impactBetOds || "Non renseigné"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Date Dépôt de l'étude</p>
                              <p className="font-black text-slate-800 font-mono">{selectedProject.ficheSuivi?.impactDepotEtude ? formatDateFrench(selectedProject.ficheSuivi.impactDepotEtude) : "Non renseigné"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Demande Aut. d'Exploit.</p>
                              <p className="font-black text-slate-800 font-mono">{selectedProject.ficheSuivi?.impactDemandeAutExploitDate ? formatDateFrench(selectedProject.ficheSuivi.impactDemandeAutExploitDate) : "Non renseigné"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Enquête Publique</p>
                              <p className="font-black text-slate-800 font-mono">{selectedProject.ficheSuivi?.impactOuvertureEnqueteDate ? formatDateFrench(selectedProject.ficheSuivi.impactOuvertureEnqueteDate) : "Non ouverte"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Publication Journaux</p>
                              <p className="font-black text-slate-800 font-mono">{selectedProject.ficheSuivi?.impactPubJournauxDate ? formatDateFrench(selectedProject.ficheSuivi.impactPubJournauxDate) : "Non renseigné"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm col-span-2">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Quittance (Impact)</p>
                              <p className="font-black text-slate-800 font-mono">{selectedProject.ficheSuivi?.impactQuittanceDate ? formatDateFrench(selectedProject.ficheSuivi.impactQuittanceDate) : "Non renseigné"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 bg-purple-50/45 rounded-2xl border border-purple-100/70 space-y-3">
                          <h5 className="font-extrabold text-purple-800 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-purple-600" />
                            <span>Dossier Permis de Construire (PC) & BET</span>
                          </h5>
                          <div className="grid grid-cols-2 gap-3.5 pt-1">
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Choix de Terrain (PV)</p>
                              <p className="font-black text-slate-800 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${selectedProject.ficheSuivi?.choixTerrainPv === "Oui" ? "bg-green-500" : "bg-slate-400"}`}></span>
                                <span>{selectedProject.ficheSuivi?.choixTerrainPv === "Oui" ? "Favorable" : "Non établi/Négatif"}</span>
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Étude BET d'exécution</p>
                              <p className="font-black text-slate-800 leading-tight">
                                {selectedProject.ficheSuivi?.etudeBetStatut === "Oui" ? `✓ ${selectedProject.ficheSuivi.etudeBetCabinet}` : "En cours de réalisation"}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Dépôt Dossier PC aux APC</p>
                              <p className="font-black text-slate-800 font-mono">{selectedProject.ficheSuivi?.depotPcDate ? formatDateFrench(selectedProject.ficheSuivi.depotPcDate) : "Non déposé"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Dépôt AS (Arrêté de Servitude)</p>
                              <p className="font-black text-slate-800 font-mono">{selectedProject.ficheSuivi?.depotAsDate ? formatDateFrench(selectedProject.ficheSuivi.depotAsDate) : "Non déposé"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* BENTO ROW 3: SUIVI AS, LEVEE DE RESERVES & ACTIONS */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-left">
                        <div className="p-5 bg-yellow-50/45 rounded-2xl border border-yellow-100/70 space-y-3">
                          <h5 className="font-extrabold text-yellow-800 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-yellow-600" />
                            <span>Suivi de l'Arrêté de Servitude (AS)</span>
                          </h5>
                          <div className="grid grid-cols-2 gap-3.5 pt-1">
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Date Demande AS</p>
                              <p className="font-black text-slate-800 font-mono">{selectedProject.ficheSuivi?.asDateDemande ? formatDateFrench(selectedProject.ficheSuivi.asDateDemande) : "Non renseigné"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Ouverture Enquête AS</p>
                              <p className="font-black text-slate-800 font-mono">{selectedProject.ficheSuivi?.asOuvertureEnqueteDate ? formatDateFrench(selectedProject.ficheSuivi.asOuvertureEnqueteDate) : "Non renseigné"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Publication Journaux AS</p>
                              <p className="font-black text-slate-800 font-mono">{selectedProject.ficheSuivi?.asPubJournauxDate ? formatDateFrench(selectedProject.ficheSuivi.asPubJournauxDate) : "Non renseigné"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Quittance AS</p>
                              <p className="font-black text-slate-800 font-mono">{selectedProject.ficheSuivi?.asQuittanceDate ? formatDateFrench(selectedProject.ficheSuivi.asQuittanceDate) : "Non renseigné"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Rappels & Réserves */}
                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                          <span className="font-extrabold text-slate-700 block text-[9px] uppercase tracking-wider">Rappels de procédure & Réserves (Études) :</span>
                          <div className="space-y-2">
                            <div className="text-[11px]">
                              <span className="font-black text-slate-600 block mb-1">Rappels :</span>
                              <ul className="list-disc list-inside space-y-0.5 text-slate-700 font-medium pl-1">
                                {(() => {
                                  const list = (selectedProject.ficheSuivi?.rappels || []).filter((r: string) => r && r.trim() !== "");
                                  return list.length > 0 ? (
                                    list.map((rap: string, idx: number) => (
                                      <li key={`etude-view-rap-${idx}`}>{rap}</li>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 italic">Aucun rappel d'étude</span>
                                  );
                                })()}
                              </ul>
                            </div>
                            <div className="text-[11px] pt-1.5 border-t border-slate-200">
                              <span className="font-black text-red-600 block mb-1">Réserves Relevées :</span>
                              <ul className="list-disc list-inside space-y-0.5 text-red-700 font-medium pl-1">
                                {(() => {
                                  const list = (selectedProject.ficheSuivi?.reserves || []).filter((r: string) => r && r.trim() !== "");
                                  return list.length > 0 ? (
                                    list.map((res: string, idx: number) => (
                                      <li key={`etude-view-res-${idx}`}>{res}</li>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 italic">Aucune réserve d'étude active</span>
                                  );
                                })()}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Levée de Réserves & Plan d'Action (Études) */}
                        <div className="p-5 bg-emerald-50/45 rounded-2xl border border-emerald-100/70 space-y-3">
                          <h5 className="font-extrabold text-emerald-800 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>Levée de Réserves & Action (Études)</span>
                          </h5>
                          <div className="space-y-2 pt-1">
                            <div className="bg-white p-2.5 rounded-xl border border-emerald-100/70 shadow-xs flex justify-between items-center">
                              <div>
                                <p className="text-slate-400 text-[9px] font-bold uppercase">Date de Levée</p>
                                <p className="font-black text-slate-800 font-mono text-[11px]">
                                  {selectedProject.ficheSuivi?.etudeLeveeReserveDate ? formatDateFrench(selectedProject.ficheSuivi.etudeLeveeReserveDate) : "En cours / Non levée"}
                                </p>
                              </div>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${selectedProject.ficheSuivi?.etudeLeveeReserveDate ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                                {selectedProject.ficheSuivi?.etudeLeveeReserveDate ? "Levée" : "Active"}
                              </span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-emerald-100/70 shadow-xs">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Statut / Référence Levée</p>
                              <p className="font-black text-slate-800 text-[10px] leading-tight">{selectedProject.ficheSuivi?.etudeLeveeReserveStatus || "Aucun statut enregistré"}</p>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-emerald-100/70 shadow-xs">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Action à mener / État de l'action</p>
                              <p className="font-black text-slate-800 text-[10px] leading-tight">{selectedProject.ficheSuivi?.etudeActionStatus || "Aucune action spécifiée"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Observations & Actions Row */}
                      <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                        <span className="font-extrabold text-slate-700 block text-[9px] uppercase tracking-wider">Actions correctives & Observations d'Études :</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-1">
                          {(() => {
                            const list = (selectedProject.ficheSuivi?.autresInformations || []).filter((n: string) => n && n.trim() !== "");
                            return list.length > 0 ? (
                              list.map((note: string, idx: number) => (
                                <div key={`etude-view-note-${idx}`} className="p-2.5 bg-white rounded-xl border border-slate-100 font-medium text-slate-700 shadow-xs flex gap-2">
                                  <span className="text-blue-500 font-black">#{idx + 1}</span>
                                  <span>{note}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-slate-400 text-[11px] italic">Aucune action corrective ou observation enregistrée.</p>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Contrats & Prestataires (Études & Environnement) */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-purple-600" />
                            <span>Contrats & Prestataires (Études & Environnement)</span>
                          </h5>
                          <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100 font-mono">
                            Section 02 • Étude & Permis
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* 1. Bureau d'Étude Technique */}
                          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <span className="font-extrabold text-purple-900 text-[11px] flex items-center gap-1.5">
                                <Building className="w-3.5 h-3.5 text-purple-600" />
                                Bureau d'Étude Technique (BET)
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Nom du Bureau d'Étude :</label>
                                <input
                                  type="text"
                                  value={selectedProject.contrats?.bureauEtude?.nom || selectedProject.ficheSuivi?.etudeBetCabinet || ""}
                                  onChange={e => updateProjectContractField('bureauEtude', 'nom', e.target.value)}
                                  placeholder="ex: BET EnerGaze"
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Référence Contrat / N° Convention :</label>
                                <input
                                  type="text"
                                  value={selectedProject.contrats?.bureauEtude?.ref || ""}
                                  onChange={e => updateProjectContractField('bureauEtude', 'ref', e.target.value)}
                                  placeholder="N° Contrat"
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Montant du Contrat :</label>
                                <input
                                  type="text"
                                  value={selectedProject.contrats?.bureauEtude?.montant || ""}
                                  onChange={e => updateProjectContractField('bureauEtude', 'montant', e.target.value)}
                                  placeholder="Montant DA"
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Délai d'Étude :</label>
                                <input
                                  type="text"
                                  value={selectedProject.contrats?.bureauEtude?.delai || ""}
                                  onChange={e => updateProjectContractField('bureauEtude', 'delai', e.target.value)}
                                  placeholder="ex: 3 mois"
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Date Signature / ODS :</label>
                                <input
                                  type="date"
                                  value={selectedProject.contrats?.bureauEtude?.ods || selectedProject.contrats?.bureauEtude?.date || ""}
                                  onChange={e => updateProjectContractField('bureauEtude', 'ods', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Avancement Étude (%) :</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={selectedProject.contrats?.bureauEtude?.avancement || 0}
                                  onChange={e => updateProjectContractField('bureauEtude', 'avancement', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold font-mono text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 2. Prestataire Environnement */}
                          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <span className="font-extrabold text-emerald-900 text-[11px] flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                Prestataire Étude d'Impact Environnemental
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Nom du Prestataire :</label>
                                <input
                                  type="text"
                                  value={selectedProject.contrats?.betEnvironnement?.nom || ""}
                                  onChange={e => updateProjectContractField('betEnvironnement', 'nom', e.target.value)}
                                  placeholder="ex: Cabinet EcoConsult"
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Référence Contrat / N° Convention :</label>
                                <input
                                  type="text"
                                  value={selectedProject.contrats?.betEnvironnement?.ref || ""}
                                  onChange={e => updateProjectContractField('betEnvironnement', 'ref', e.target.value)}
                                  placeholder="N° Contrat Env."
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Montant du Contrat :</label>
                                <input
                                  type="text"
                                  value={selectedProject.contrats?.betEnvironnement?.montant || ""}
                                  onChange={e => updateProjectContractField('betEnvironnement', 'montant', e.target.value)}
                                  placeholder="Montant DA"
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Délai d'Exécution :</label>
                                <input
                                  type="text"
                                  value={selectedProject.contrats?.betEnvironnement?.delai || ""}
                                  onChange={e => updateProjectContractField('betEnvironnement', 'delai', e.target.value)}
                                  placeholder="ex: 45 jours"
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Date Signature / ODS :</label>
                                <input
                                  type="date"
                                  value={selectedProject.contrats?.betEnvironnement?.ods || selectedProject.contrats?.betEnvironnement?.date || ""}
                                  onChange={e => updateProjectContractField('betEnvironnement', 'ods', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Avancement Notice Env. (%) :</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={selectedProject.contrats?.betEnvironnement?.avancement || 0}
                                  onChange={e => updateProjectContractField('betEnvironnement', 'avancement', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold font-mono text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ================= PHASE 02.5: EXPERTISE & INDEMNISATION ================= */}
              {activeSubTab === "expertise" && (
                <div className="space-y-6 text-left">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider font-mono">Phase 02.5 • Dossier Foncier & Indemnisations</span>
                      <h4 className="font-extrabold text-base text-slate-800">Expertise Foncière & Indemnisations</h4>
                    </div>
                    {hasPrivilege("section_etude") && (
                      <button
                        onClick={() => {
                          if (selectedProject?.ficheSuivi) {
                            const parsed = JSON.parse(JSON.stringify(selectedProject.ficheSuivi));
                            setFicheSuiviForm({
                              ...createDefaultFicheSuivi(),
                              ...parsed,
                              rappels: parsed.rappels || createDefaultFicheSuivi().rappels,
                              reserves: parsed.reserves || createDefaultFicheSuivi().reserves,
                              autresInformations: parsed.autresInformations || createDefaultFicheSuivi().autresInformations,
                            });
                          } else {
                            setFicheSuiviForm(createDefaultFicheSuivi());
                          }
                          setIsEditingFicheSuivi(!isEditingFicheSuivi);
                        }}
                        className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                          isEditingFicheSuivi ? "bg-slate-200 text-slate-800 hover:bg-slate-300" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {isEditingFicheSuivi ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        <span>{isEditingFicheSuivi ? "Annuler l'Édition" : "Éditer l'Expertise & Indemnisation"}</span>
                      </button>
                    )}
                  </div>

                  {isEditingFicheSuivi ? (
                    /* Fiche de Suivi - EDIT FORM FOR EXPERTISE & INDEMNISATION */
                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6 text-xs">
                      <div className="bg-emerald-500/10 border border-emerald-200 p-3 rounded-xl text-emerald-800 font-bold mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>Mode Édition Foncier - Les modifications d'expertise et de quittances d'indemnisation sont enregistrées.</span>
                      </div>

                      {/* SECTION 1: EXPERTISE FONCIERE */}
                      <div className="space-y-4">
                        <h5 className="font-extrabold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1 text-[11px] flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>1. Expertise Foncière (Parcellaire)</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Cabinet GEF désigné :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.gefCabinet || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, gefCabinet: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-medium"
                              placeholder="ex: Cabinet Touazi"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Date Demande :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.demandeGefDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, demandeGefDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Nature de Terrain :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.natureTerrain || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, natureTerrain: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-medium"
                              placeholder="ex: Domaine Privé / Agricole"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Dépôt Dossier (Type) :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.depotDossierType || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, depotDossierType: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-medium"
                              placeholder="ex: Dépôt cadastre"
                            />
                          </div>
                        </div>

                        {/* Decrees for Expertise */}
                        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 grid grid-cols-1 sm:grid-cols-4 gap-4 mt-3">
                          <div>
                            <label className="block text-slate-600 font-bold mb-1 text-[11px]">Réf. Arrêté ouverture d'enquête publique :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.expertiseArreteEnqueteRef || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, expertiseArreteEnqueteRef: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono text-xs"
                              placeholder="ex: AOEP-2026/04"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-bold mb-1 text-[11px]">Date Arrêté ouverture d'enquête publique :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.expertiseArreteEnqueteDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, expertiseArreteEnqueteDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-bold mb-1 text-[11px]">Réf. Arrêté de consignation :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.expertiseArreteConsignationRef || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, expertiseArreteConsignationRef: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono text-xs"
                              placeholder="ex: AC-2026/12"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-bold mb-1 text-[11px]">Date Arrêté de consignation :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.expertiseArreteConsignationDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, expertiseArreteConsignationDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: ARRETE DE SERVITUDE & INDEMNISATION */}
                      <div className="space-y-4">
                        <h5 className="font-extrabold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1 text-[11px] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-orange-600" />
                          <span>2. Demande d'Arrêté de Servitude & Publication</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">PV d'Enquête Servitude :</label>
                            <select
                              value={ficheSuiviForm.servitudeEnquetePv || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, servitudeEnquetePv: e.target.value as any })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-black"
                            >
                              <option value="">Sélectionner...</option>
                              <option value="Oui">Oui (Clôturée favorable)</option>
                              <option value="Non">Non / En cours</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Date PV d'Enquête :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.servitudeEnqueteDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, servitudeEnqueteDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Publication Journaux :</label>
                            <select
                              value={ficheSuiviForm.servitudeJournaux || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, servitudeJournaux: e.target.value as any })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-black"
                            >
                              <option value="">Sélectionner...</option>
                              <option value="Oui">Oui (Publié 2 journaux)</option>
                              <option value="Non">Non</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Quittances délivrées :</label>
                            <select
                              value={ficheSuiviForm.servitudeQuittancesPv || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, servitudeQuittancesPv: e.target.value as any })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-black"
                            >
                              <option value="">Sélectionner...</option>
                              <option value="Oui">Oui</option>
                              <option value="Non">Non</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Date Quittances :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.servitudeQuittancesDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, servitudeQuittancesDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Statut Arrêté de Servitude :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.servitudeArreteStatus || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, servitudeArreteStatus: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-medium"
                              placeholder="ex: Signé par Wilaya, En attente publication"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Date de Signature :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.servitudeArreteDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, servitudeArreteDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Référence Arrêté :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.servitudeArreteRef || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, servitudeArreteRef: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono"
                              placeholder="ex: Ref. AS-2026/089"
                            />
                          </div>
                        </div>

                        {/* Public utility inquiry for servitude section */}
                        <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                          <div>
                            <label className="block text-slate-600 font-bold mb-1 text-[11px]">Ouverture d'Enquête Utilité Publique :</label>
                            <select
                              value={ficheSuiviForm.servitudeEnqueteUtilitePubliquePv || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, servitudeEnqueteUtilitePubliquePv: e.target.value as any })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-black text-xs"
                            >
                              <option value="">Sélectionner...</option>
                              <option value="Oui">Oui (Clôturée)</option>
                              <option value="Non">Non / En cours</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 font-bold mb-1 text-[11px]">Date d'Ouverture d'Enquête :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.servitudeEnqueteUtilitePubliqueDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, servitudeEnqueteUtilitePubliqueDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-bold mb-1 text-[11px]">Référence Arrêté d'Ouverture :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.servitudeEnqueteUtilitePubliqueRef || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, servitudeEnqueteUtilitePubliqueRef: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono text-xs"
                              placeholder="ex: Ref. AOUP-2026/15"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SECTION 3: RAPPELS, RESERVES ET NOTES */}
                      <div className="space-y-4">
                        <h5 className="font-extrabold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1 text-[11px] flex items-center gap-2">
                          <Info className="w-4 h-4 text-slate-600" />
                          <span>3. Rappels, Réserves & Observations (max 8 Notes)</span>
                        </h5>

                        <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-200/50 grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-slate-600 font-bold mb-1 text-[11px]">Date levée de réserve (Expertise) :</label>
                            <input
                              type="date"
                              value={ficheSuiviForm.expertiseLeveeReserveDate || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, expertiseLeveeReserveDate: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-bold mb-1 text-[11px]">Statut / Réf. levée de réserve (Expertise) :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.expertiseLeveeReserveStatus || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, expertiseLeveeReserveStatus: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-medium text-xs"
                              placeholder="ex: Réserves levées le..."
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-bold mb-1 text-[11px]">Action à mener / État de l'action (Expertise) :</label>
                            <input
                              type="text"
                              value={ficheSuiviForm.expertiseActionStatus || ""}
                              onChange={e => setFicheSuiviForm({ ...ficheSuiviForm, expertiseActionStatus: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-blue-500 font-medium text-xs"
                              placeholder="ex: PV de levée en signature"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <span className="font-bold text-slate-700 block text-[10px] uppercase">Rappels de procédure :</span>
                            {ficheSuiviForm.rappels.map((rap, idx) => (
                              <input
                                key={`rap-${idx}`}
                                type="text"
                                value={rap || ""}
                                onChange={e => {
                                  const newRappels = [...ficheSuiviForm.rappels];
                                  newRappels[idx] = e.target.value;
                                  setFicheSuiviForm({ ...ficheSuiviForm, rappels: newRappels });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-blue-500"
                                placeholder={`Rappel #${idx + 1}`}
                              />
                            ))}
                          </div>
                          <div className="space-y-2">
                            <span className="font-bold text-slate-700 block text-[10px] uppercase">Réserves techniques relevées :</span>
                            {ficheSuiviForm.reserves.map((res, idx) => (
                              <input
                                key={`res-${idx}`}
                                type="text"
                                value={res || ""}
                                onChange={e => {
                                  const newReserves = [...ficheSuiviForm.reserves];
                                  newReserves[idx] = e.target.value;
                                  setFicheSuiviForm({ ...ficheSuiviForm, reserves: newReserves });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-blue-500"
                                placeholder={`Réserve #${idx + 1}`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <span className="font-bold text-slate-700 block text-[10px] uppercase">Observations / Notes d'indemnisation (max 8) :</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ficheSuiviForm.autresInformations.map((note, idx) => (
                              <input
                                key={`note-${idx}`}
                                type="text"
                                value={note || ""}
                                onChange={e => {
                                  const newNotes = [...ficheSuiviForm.autresInformations];
                                  newNotes[idx] = e.target.value;
                                  setFicheSuiviForm({ ...ficheSuiviForm, autresInformations: newNotes });
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-blue-500"
                                placeholder={`Observation #${idx + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setIsEditingFicheSuivi(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-all active:scale-95"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          disabled={isSavingFicheSuivi}
                          onClick={handleSaveFicheSuivi}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2"
                        >
                          {isSavingFicheSuivi ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          <span>{isSavingFicheSuivi ? "Enregistrement..." : "Sauvegarder l'Expertise"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Fiche de Suivi - READ ONLY BEAUTIFUL BENTO GRID VIEW FOR EXPERTISE & INDEMNISATION */
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-left">
                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                          <div>
                            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block mb-2">Expertise Foncière & Cadastre</span>
                            <div className="space-y-2 mt-2">
                              <p className="flex justify-between">
                                <span className="text-slate-500 font-bold">Cabinet GEF :</span>
                                <span className="font-black text-slate-800">{selectedProject.ficheSuivi?.gefCabinet || "Non désigné"}</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-slate-500 font-bold">Date de Demande :</span>
                                <span className="font-black text-slate-800 font-mono">{selectedProject.ficheSuivi?.demandeGefDate ? formatDateFrench(selectedProject.ficheSuivi.demandeGefDate) : "Non renseignée"}</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-slate-500 font-bold">Nature de Terrain :</span>
                                <span className="font-black text-slate-800">{selectedProject.ficheSuivi?.natureTerrain || "Non renseignée"}</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-slate-500 font-bold">Dépôt Cadastral :</span>
                                <span className="font-black text-slate-800">{selectedProject.ficheSuivi?.depotDossierType || "N/A"}</span>
                              </p>
                            </div>
                          </div>

                          {(selectedProject.ficheSuivi?.expertiseArreteEnqueteRef || selectedProject.ficheSuivi?.expertiseArreteConsignationRef) && (
                            <div className="border-t border-slate-200/60 pt-2.5 mt-2.5 space-y-2 text-[11px]">
                              <span className="text-[9px] font-black uppercase text-blue-600 block tracking-wide">Arrêtés de Procédure d'Expertise</span>
                              {selectedProject.ficheSuivi?.expertiseArreteEnqueteRef && (
                                <p className="flex justify-between">
                                  <span className="text-slate-500 font-bold">Arrêté d'Enquête Publique :</span>
                                  <span className="font-black text-slate-800 font-mono">
                                    {selectedProject.ficheSuivi.expertiseArreteEnqueteRef}
                                    {selectedProject.ficheSuivi.expertiseArreteEnqueteDate && ` (${formatDateFrench(selectedProject.ficheSuivi.expertiseArreteEnqueteDate)})`}
                                  </span>
                                </p>
                              )}
                              {selectedProject.ficheSuivi?.expertiseArreteConsignationRef && (
                                <p className="flex justify-between">
                                  <span className="text-slate-500 font-bold">Arrêté de Consignation :</span>
                                  <span className="font-black text-slate-800 font-mono">
                                    {selectedProject.ficheSuivi.expertiseArreteConsignationRef}
                                    {selectedProject.ficheSuivi.expertiseArreteConsignationDate && ` (${formatDateFrench(selectedProject.ficheSuivi.expertiseArreteConsignationDate)})`}
                                  </span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="p-5 bg-orange-50/45 rounded-2xl border border-orange-100/70 space-y-3">
                          <h5 className="font-extrabold text-orange-800 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-orange-600" />
                            <span>Arrêté de Servitude (AS) & Indemnisation</span>
                          </h5>
                          <div className="grid grid-cols-2 gap-3.5 pt-1">
                            <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-xs space-y-0.5">
                              <p className="text-slate-400 text-[9px] font-bold uppercase">PV d'Enquête</p>
                              <p className="font-black text-slate-800">{selectedProject.ficheSuivi?.servitudeEnquetePv === "Oui" ? `Clôturée (${selectedProject.ficheSuivi.servitudeEnqueteDate ? formatDateFrench(selectedProject.ficheSuivi.servitudeEnqueteDate) : "N/A"})` : "En attente"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-xs space-y-0.5">
                              <p className="text-slate-400 text-[9px] font-bold uppercase">Publication Presse</p>
                              <p className="font-black text-slate-800">{selectedProject.ficheSuivi?.servitudeJournaux === "Oui" ? "✓ Publié (2 Journaux)" : "✗ Non publié"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-xs space-y-0.5">
                              <p className="text-slate-400 text-[9px] font-bold uppercase">Quittances / Indemnité</p>
                              <p className="font-black text-slate-800">{selectedProject.ficheSuivi?.servitudeQuittancesPv === "Oui" ? "✓ Libérées & Payées" : "Non payées"}</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-xs space-y-0.5">
                              <p className="text-slate-400 text-[9px] font-bold uppercase">Date de Paiement</p>
                              <p className="font-black text-slate-800 font-mono">{selectedProject.ficheSuivi?.servitudeQuittancesDate ? formatDateFrench(selectedProject.ficheSuivi.servitudeQuittancesDate) : "En cours"}</p>
                            </div>
                          </div>
                          {selectedProject.ficheSuivi?.servitudeArreteRef && (
                            <div className="p-2 bg-white rounded-xl border border-orange-100 flex justify-between items-center text-[11px] mt-1 text-left">
                              <span className="font-bold text-slate-500">Réf. Arrêté de Servitude :</span>
                              <span className="font-mono font-black text-orange-950 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                {selectedProject.ficheSuivi.servitudeArreteRef}
                              </span>
                            </div>
                          )}
                          {selectedProject.ficheSuivi?.servitudeEnqueteUtilitePubliquePv && (
                            <div className="p-2 bg-white rounded-xl border border-orange-100 flex justify-between items-center text-[11px] mt-1 text-left">
                              <span className="font-bold text-slate-500">Enquête Utilité Publique :</span>
                              <span className="font-mono font-black text-orange-950 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                {selectedProject.ficheSuivi.servitudeEnqueteUtilitePubliquePv === "Oui" 
                                  ? `Oui (${selectedProject.ficheSuivi.servitudeEnqueteUtilitePubliqueDate ? formatDateFrench(selectedProject.ficheSuivi.servitudeEnqueteUtilitePubliqueDate) : "S.D"}${selectedProject.ficheSuivi.servitudeEnqueteUtilitePubliqueRef ? " - Réf: " + selectedProject.ficheSuivi.servitudeEnqueteUtilitePubliqueRef : ""})`
                                  : "Non démarrée / En cours"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* BENTO ROW 3: REMINDERS, RESERVES & SUIVI NOTES */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-left">
                        {/* Reminders / Reserves */}
                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                          <div className="space-y-2">
                            <span className="font-extrabold text-slate-700 block text-[9px] uppercase tracking-wider">Rappels de procédure réglementaire :</span>
                            <ul className="space-y-1 text-slate-600 font-medium list-disc list-inside">
                              {(() => {
                                const list = (selectedProject.ficheSuivi?.rappels || []).filter((r: string) => r && r.trim() !== "");
                                return list.length > 0 ? (
                                  list.map((rap: string, idx: number) => (
                                    <li key={`view-rap-${idx}`}>{rap}</li>
                                  ))
                                ) : (
                                  <span className="text-slate-400 text-[11px] italic">Aucun rappel spécifique</span>
                                );
                              })()}
                            </ul>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            <span className="font-extrabold text-red-700 block text-[9px] uppercase tracking-wider">Réserves parcellaires ou techniques :</span>
                            <ul className="space-y-1 text-red-600 font-medium list-disc list-inside">
                              {(() => {
                                const list = (selectedProject.ficheSuivi?.reserves || []).filter((r: string) => r && r.trim() !== "");
                                return list.length > 0 ? (
                                  list.map((res: string, idx: number) => (
                                    <li key={`view-res-${idx}`}>{res}</li>
                                  ))
                                ) : (
                                  <span className="text-slate-400 text-[11px] italic">Aucune réserve active</span>
                                );
                              })()}
                            </ul>
                          </div>
                        </div>

                        {/* Suivi notes */}
                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                          <span className="font-extrabold text-slate-700 block text-[9px] uppercase tracking-wider">Notes d'Observations & Indemnisations :</span>
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {(() => {
                              const list = (selectedProject.ficheSuivi?.autresInformations || []).filter((n: string) => n && n.trim() !== "");
                              return list.length > 0 ? (
                                list.map((note: string, idx: number) => (
                                  <div key={`view-note-${idx}`} className="p-2.5 bg-white rounded-xl border border-slate-100 font-medium text-slate-700 shadow-xs flex gap-2">
                                    <span className="text-blue-500 font-black">#{idx + 1}</span>
                                    <span>{note}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-slate-400 text-[11px] italic">Aucune note d'information enregistrée.</p>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Levée de Réserves & Plan d'Action (Expertise) */}
                        <div className="p-5 bg-emerald-50/45 rounded-2xl border border-emerald-100/70 space-y-3">
                          <h5 className="font-extrabold text-emerald-800 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>Levée de Réserves & Action (Expertise)</span>
                          </h5>
                          <div className="space-y-2 pt-1">
                            <div className="bg-white p-2.5 rounded-xl border border-emerald-100/70 shadow-xs flex justify-between items-center">
                              <div>
                                <p className="text-slate-400 text-[9px] font-bold uppercase">Date de Levée</p>
                                <p className="font-black text-slate-800 font-mono text-[11px]">
                                  {selectedProject.ficheSuivi?.expertiseLeveeReserveDate ? formatDateFrench(selectedProject.ficheSuivi.expertiseLeveeReserveDate) : "En cours / Non levée"}
                                </p>
                              </div>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${selectedProject.ficheSuivi?.expertiseLeveeReserveDate ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                                {selectedProject.ficheSuivi?.expertiseLeveeReserveDate ? "Levée" : "Active"}
                              </span>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-emerald-100/70 shadow-xs">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Statut / Référence Levée</p>
                              <p className="font-black text-slate-800 text-[10px] leading-tight">{selectedProject.ficheSuivi?.expertiseLeveeReserveStatus || "Aucun statut enregistré"}</p>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl border border-emerald-100/70 shadow-xs">
                              <p className="text-slate-400 text-[9px] font-bold uppercase mb-0.5">Action à mener / État de l'action</p>
                              <p className="font-black text-slate-800 text-[10px] leading-tight">{selectedProject.ficheSuivi?.expertiseActionStatus || "Aucune action spécifiée"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Contrat & Prestataire (Expertise Foncière) */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-emerald-600" />
                              <span>Contrat & Prestataire Expertise (Géomètre Expert Foncier - GEF)</span>
                            </h5>
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 font-mono">
                              Section 03 • Expertise & Indemnisation
                            </span>
                          </div>

                          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <span className="font-extrabold text-emerald-900 text-[11px] flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                Cabinet du Géomètre Expert Foncier (GEF)
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Cabinet / Expert Désigné :</label>
                                <input
                                  type="text"
                                  value={selectedProject.contrats?.expert?.nom || selectedProject.ficheSuivi?.gefCabinet || ""}
                                  onChange={e => updateProjectContractField('expert', 'nom', e.target.value)}
                                  placeholder="ex: Cabinet Touazi GEF"
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Référence Contrat / Convention :</label>
                                <input
                                  type="text"
                                  value={selectedProject.contrats?.expert?.ref || ""}
                                  onChange={e => updateProjectContractField('expert', 'ref', e.target.value)}
                                  placeholder="N° Convention GEF"
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Montant Honoraires / Contrat :</label>
                                <input
                                  type="text"
                                  value={selectedProject.contrats?.expert?.montant || ""}
                                  onChange={e => updateProjectContractField('expert', 'montant', e.target.value)}
                                  placeholder="Montant DA"
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Délai Réalisation Parcellaire :</label>
                                <input
                                  type="text"
                                  value={selectedProject.contrats?.expert?.delai || ""}
                                  onChange={e => updateProjectContractField('expert', 'delai', e.target.value)}
                                  placeholder="ex: 60 jours"
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Date Notification ODS :</label>
                                <input
                                  type="date"
                                  value={selectedProject.contrats?.expert?.ods || selectedProject.contrats?.expert?.date || ""}
                                  onChange={e => updateProjectContractField('expert', 'ods', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-500 font-bold text-[10px] mb-0.5">Avancement Dossier Parcellaire (%) :</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={selectedProject.contrats?.expert?.avancement || 0}
                                  onChange={e => updateProjectContractField('expert', 'avancement', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-bold font-mono text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ================= PHASE 03: TRAVAUX & ESSAIS ================= */}
              {activeSubTab === "travaux" && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider font-mono">Phase 04 • Travaux & Épreuves</span>
                    <h4 className="font-extrabold text-base text-slate-800">Gestion des Entreprises de Réalisation, Marchés & Plan de Contrôle</h4>
                  </div>

                  {/* Lot Navigation Selector Bar if project has lots */}
                  {selectedProject.lots && selectedProject.lots.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100 shadow-xs">
                      <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider font-mono mr-2 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Sélection du Lot :</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTravauxLotId(null)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeTravauxLotId === null
                            ? "bg-purple-600 text-white shadow-xs"
                            : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <span>Vue Globale (Tous les Lots)</span>
                        <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-purple-200 text-purple-900 font-black">
                          Av. {selectedProject.travauxPlanification?.avancementPhysique || 0}%
                        </span>
                      </button>
                      {selectedProject.lots.map((lot, lIdx) => (
                        <button
                          type="button"
                          key={lot.id || lIdx}
                          onClick={() => setActiveTravauxLotId(lot.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTravauxLotId === lot.id
                              ? "bg-purple-600 text-white shadow-xs"
                              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                          }`}
                        >
                          <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                          <span>{lot.name || `Lot ${lIdx + 1}`}</span>
                          <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                            Av. {lot.avancementPhysique || 0}%
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Prestataires & Entreprises Réalisatrices du Projet / Multi-Lots */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-150">
                      <div>
                        <h5 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-purple-600" />
                          <span>Entreprises de Réalisation & Prestataires du Projet</span>
                        </h5>
                        <p className="text-[10px] text-slate-400">Section 04 • Marchés de Génie Civil (ETB GC), Montage Mécanique (ETB Meca).</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {((selectedProject.lots && selectedProject.lots.length > 0) 
                        ? (activeTravauxLotId 
                            ? selectedProject.lots.filter(l => l.id === activeTravauxLotId) 
                            : selectedProject.lots) 
                        : [
                        {
                          id: "lot-1",
                          name: "Lot Unique (Général)",
                          phase: selectedProject.identity.phase || "Étude",
                          avancementPhysique: selectedProject.travauxPlanification.avancementPhysique || 0,
                          avancementGC: selectedProject.travauxPlanification.avancementGC || 0,
                          avancementMeca: selectedProject.travauxPlanification.avancementMeca || 0,
                          contrats: selectedProject.contrats
                        }
                      ]).map((lot, idx) => {
                        const updateContractField = (contractKey: 'bureauEtude' | 'betEnvironnement' | 'expert' | 'etbGC' | 'etbMeca', field: string, value: any) => {
                          updateProjectContractField(contractKey, field, value, lot.id);
                        };

                        return (
                          <div key={lot.id || idx} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                              <div className="flex items-center gap-2.5">
                                <span className="bg-purple-600 text-white font-black px-2.5 py-1 rounded-lg text-[10px] uppercase font-mono tracking-wider">
                                  {lot.id?.toUpperCase() || `LOT ${idx + 1}`}
                                </span>
                                <h6 className="font-black text-xs text-slate-800">{lot.name || `Lot ${idx + 1}`}</h6>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 font-bold bg-white px-2.5 py-1 rounded-full border border-slate-200">
                                Phase : {lot.phase || selectedProject.identity.phase || "Non spécifiée"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* 1. Entreprise Génie Civil */}
                              <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100/90 space-y-3">
                                <div className="flex items-center justify-between border-b border-emerald-100/60 pb-2">
                                  <span className="text-[11px] font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                                    <HardHat className="w-4 h-4 text-emerald-600" />
                                    Entreprise Génie Civil (ETB GC)
                                  </span>
                                  <span className="text-[10px] font-black bg-emerald-100/80 text-emerald-800 px-2.5 py-0.5 rounded-full font-mono">
                                    Av. GC {lot.avancementGC ?? lot.contrats?.etbGC?.avancement ?? 0}%
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 text-xs">
                                  <div className="col-span-2">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nom / Raison Sociale / Groupement</label>
                                    <input
                                      type="text"
                                      placeholder="ex: COSIDER GC, BATIMETAL..."
                                      value={lot.contrats?.etbGC?.nom || ""}
                                      onChange={(e) => updateContractField('etbGC', 'nom', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">N° Contrat / Marché</label>
                                    <input
                                      type="text"
                                      placeholder="ex: N° 012/GC/2025"
                                      value={lot.contrats?.etbGC?.ref || ""}
                                      onChange={(e) => updateContractField('etbGC', 'ref', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 text-xs font-mono outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Montant (DA)</label>
                                    <input
                                      type="text"
                                      placeholder="ex: 150 000 000 DA"
                                      value={lot.contrats?.etbGC?.montant || ""}
                                      onChange={(e) => updateContractField('etbGC', 'montant', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 text-xs font-mono outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">ODS / Date Sign.</label>
                                    <input
                                      type="date"
                                      value={lot.contrats?.etbGC?.ods || lot.contrats?.etbGC?.date || ""}
                                      onChange={(e) => updateContractField('etbGC', 'ods', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-slate-800 text-xs font-mono outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Délai Exécution</label>
                                    <input
                                      type="text"
                                      placeholder="ex: 6 mois"
                                      value={lot.contrats?.etbGC?.delai || ""}
                                      onChange={(e) => updateContractField('etbGC', 'delai', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 text-xs outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                  <div className="col-span-2 pt-2 border-t border-emerald-100 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-emerald-900 uppercase">Avancement Génie Civil (Généré depuis le canevas) :</span>
                                    <div className="flex items-center gap-1.5 bg-emerald-100/90 text-emerald-900 px-3 py-1 rounded-xl font-mono font-black text-xs">
                                      <span>{lot.avancementGC ?? lot.contrats?.etbGC?.avancement ?? 0}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 2. Entreprise Montage Mécanique & Pose */}
                              <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-100/90 space-y-3">
                                <div className="flex items-center justify-between border-b border-purple-100/60 pb-2">
                                  <span className="text-[11px] font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5">
                                    <Wrench className="w-4 h-4 text-purple-600" />
                                    Entreprise Pose & Montage Mécanique
                                  </span>
                                  <span className="text-[10px] font-black bg-purple-100/80 text-purple-800 px-2.5 py-0.5 rounded-full font-mono">
                                    Av. GM {lot.avancementMeca ?? lot.contrats?.etbMeca?.avancement ?? 0}%
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 text-xs">
                                  <div className="col-span-2">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nom / Raison Sociale / Groupement</label>
                                    <input
                                      type="text"
                                      placeholder="ex: KANAGHAZ, GTP, SARL MECA..."
                                      value={lot.contrats?.etbMeca?.nom || ""}
                                      onChange={(e) => updateContractField('etbMeca', 'nom', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 text-xs outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">N° Contrat / Marché</label>
                                    <input
                                      type="text"
                                      placeholder="ex: N° 088/MECA/2025"
                                      value={lot.contrats?.etbMeca?.ref || ""}
                                      onChange={(e) => updateContractField('etbMeca', 'ref', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 text-xs font-mono outline-none focus:border-purple-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Montant (DA)</label>
                                    <input
                                      type="text"
                                      placeholder="ex: 320 000 000 DA"
                                      value={lot.contrats?.etbMeca?.montant || ""}
                                      onChange={(e) => updateContractField('etbMeca', 'montant', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 text-xs font-mono outline-none focus:border-purple-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">ODS / Date Sign.</label>
                                    <input
                                      type="date"
                                      value={lot.contrats?.etbMeca?.ods || lot.contrats?.etbMeca?.date || ""}
                                      onChange={(e) => updateContractField('etbMeca', 'ods', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-slate-800 text-xs font-mono outline-none focus:border-purple-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Délai Exécution</label>
                                    <input
                                      type="text"
                                      placeholder="ex: 8 mois"
                                      value={lot.contrats?.etbMeca?.delai || ""}
                                      onChange={(e) => updateContractField('etbMeca', 'delai', e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 text-xs outline-none focus:border-purple-500"
                                    />
                                  </div>
                                  <div className="col-span-2 pt-2 border-t border-purple-100 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-purple-900 uppercase">Avancement Mécanique (Généré depuis le canevas) :</span>
                                    <div className="flex items-center gap-1.5 bg-purple-100/90 text-purple-900 px-3 py-1 rounded-xl font-mono font-black text-xs">
                                      <span>{lot.avancementMeca ?? lot.contrats?.etbMeca?.avancement ?? 0}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Physical progress block & validation stats */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Avancement Physique Global</span>
                        <span className="text-2xl font-black text-slate-800">{selectedProject.travauxPlanification.avancementPhysique}%</span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300 shadow-inner mt-2">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-700"
                          style={{ width: `${selectedProject.travauxPlanification.avancementPhysique}%` }}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Conformité Plan de Contrôle</span>
                        {(() => {
                          const completedCount = Object.values(selectedProject.planDeControle || {}).filter(
                            item => item.resultat === 'C' || item.resultatNouveau === 'C'
                          ).length;
                          const percent = Math.round((completedCount / 36) * 100);
                          return (
                            <>
                              <span className="text-2xl font-black text-slate-800">{completedCount} / 36</span>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden border">
                                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${percent}%` }}></div>
                                </div>
                                <span className="text-[10px] font-black text-green-700 shrink-0">{percent}%</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="md:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Organisme de Contrôle Agréé</span>
                        <span className="text-base font-black text-slate-800 bg-white px-3 py-1 border border-slate-200 rounded-xl inline-block mt-1 shadow-xs">
                          {selectedProject.travauxPlanification.essaisReglementaires.organismeControleur || "Non désigné"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Standard Test Section Summary (Épreuves hydrauliques réglementaires) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-purple-50/20 p-4 rounded-2xl border border-purple-100/40">
                    <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-700">1 • Épreuve de Résistance (Hydraulique 24h) :</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                          selectedProject.travauxPlanification.essaisReglementaires.epreuveResistance === "Réussie"
                            ? "bg-green-100 text-green-800"
                            : selectedProject.travauxPlanification.essaisReglementaires.epreuveResistance === "En cours"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-slate-100 text-slate-800"
                        }`}>{selectedProject.travauxPlanification.essaisReglementaires.epreuveResistance}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Pression réglementaire maximale maintenue sous contrôle d'enregistreur approuvé.</p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-700">2 • Épreuve d'Étanchéité (Hydraulique 24h) :</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                          selectedProject.travauxPlanification.essaisReglementaires.epreuveEtancheite === "Réussie"
                            ? "bg-green-100 text-green-800"
                            : selectedProject.travauxPlanification.essaisReglementaires.epreuveEtancheite === "En cours"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-slate-100 text-slate-800"
                        }`}>{selectedProject.travauxPlanification.essaisReglementaires.epreuveEtancheite}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Suivi rigoureux des variations thermométriques et de pression du fluide.</p>
                    </div>
                  </div>

                  {/* ====== CANEVAS D'AVANCEMENT PHYSIQUE DES TRAVAUX ====== */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-150">
                      <div>
                        <h5 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                          <span>
                            Canevas d'Avancement Physique des Travaux
                            {activeTravauxLotId && selectedProject.lots?.find(l => l.id === activeTravauxLotId) ? (
                              <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 font-mono text-[10px] rounded-md font-extrabold">
                                {selectedProject.lots.find(l => l.id === activeTravauxLotId)?.name}
                              </span>
                            ) : (
                              <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded-md font-bold">
                                Synthèse Projet
                              </span>
                            )}
                          </span>
                        </h5>
                        <p className="text-[10px] text-slate-400">Génération automatique des avancements GC, GM (Mécanique) et Global depuis les tableaux.</p>
                      </div>

                      {hasPrivilege("section_travaux") && (
                        <div className="shrink-0">
                          {!isEditingTravauxProgress ? (
                            <button
                              onClick={() => {
                                const targetLot = selectedProject.lots?.find(l => l.id === activeTravauxLotId);
                                const fallbackLot = selectedProject.lots?.[0];
                                
                                const lData = (activeTravauxLotId && targetLot?.travauxLigne && targetLot.travauxLigne.length > 0)
                                  ? targetLot.travauxLigne 
                                  : (selectedProject.travauxLigne && selectedProject.travauxLigne.length > 0 
                                      ? selectedProject.travauxLigne 
                                      : (fallbackLot?.travauxLigne && fallbackLot.travauxLigne.length > 0 
                                          ? fallbackLot.travauxLigne 
                                          : DEFAULT_TRAVAUX_LIGNE));

                                const pData = (activeTravauxLotId && targetLot?.travauxPostes && targetLot.travauxPostes.length > 0)
                                  ? targetLot.travauxPostes 
                                  : (selectedProject.travauxPostes && selectedProject.travauxPostes.length > 0 
                                      ? selectedProject.travauxPostes 
                                      : (fallbackLot?.travauxPostes && fallbackLot.travauxPostes.length > 0 
                                          ? fallbackLot.travauxPostes 
                                          : DEFAULT_TRAVAUX_POSTES));

                                const lenVal = (activeTravauxLotId && targetLot?.longueur) ? targetLot.longueur : getProjectDisplayLength(selectedProject);

                                setTempTravauxLigne(JSON.parse(JSON.stringify(lData)));
                                setTempTravauxPostes(JSON.parse(JSON.stringify(pData)));
                                setTempLongueur(lenVal);
                                setIsEditingTravauxProgress(true);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Saisir l'avancement</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const lenKm = tempLongueur !== "" && !isNaN(parseFloat(tempLongueur)) ? parseFloat(tempLongueur) : (parseFloat(getProjectDisplayLength(selectedProject)) || 10);

                                    const cleanedLigne = (tempTravauxLigne || []).map((item: any) => ({
                                      ...item,
                                      anterieur: parseFloat(String(item.anterieur)) || 0,
                                      quotidien: parseFloat(String(item.quotidien)) || 0,
                                      ponderation: parseFloat(String(item.ponderation)) || 0
                                    }));

                                    const cleanedPostes = (tempTravauxPostes || []).map((item: any) => ({
                                      ...item,
                                      anterieur: parseFloat(String(item.anterieur)) || 0,
                                      quotidien: parseFloat(String(item.quotidien)) || 0,
                                      global: (parseFloat(String(item.anterieur)) || 0) + (parseFloat(String(item.quotidien)) || 0),
                                      ponderation: parseFloat(String(item.ponderation)) || 0
                                    }));

                                    const computed = computeProgressFromCanvas(cleanedLigne, cleanedPostes, lenKm, isPosteDetenteSeul);

                                    let updatedProj: any = {
                                      ...selectedProject,
                                      travauxLigne: cleanedLigne,
                                      travauxPostes: cleanedPostes,
                                      updatedAt: new Date().toISOString()
                                    };

                                    if (selectedProject.lots && selectedProject.lots.length > 0) {
                                      const targetLotId = activeTravauxLotId || selectedProject.lots[0].id;
                                      const updatedLots = selectedProject.lots.map(l => {
                                        if (l.id === targetLotId || (!activeTravauxLotId && l.id === selectedProject.lots[0].id)) {
                                          const lContrats = (l.contrats || {}) as any;
                                          return {
                                            ...l,
                                            longueur: tempLongueur || l.longueur || "0",
                                            travauxLigne: cleanedLigne,
                                            travauxPostes: cleanedPostes,
                                            avancementGC: computed.avancementGC,
                                            avancementMeca: computed.avancementMeca,
                                            avancementPhysique: computed.avancementPhysique,
                                            contrats: {
                                              ...lContrats,
                                              etbGC: { ...(lContrats.etbGC || {}), avancement: computed.avancementGC },
                                              etbMeca: { ...(lContrats.etbMeca || {}), avancement: computed.avancementMeca }
                                            }
                                          };
                                        }
                                        return l;
                                      });

                                      const totalLength = updatedLots.reduce((sum, l) => sum + (parseFloat(l.longueur || "0") || 1), 0);
                                      let weightedGC = 0, weightedMeca = 0, weightedPhys = 0;
                                      updatedLots.forEach(l => {
                                        const w = (parseFloat(l.longueur || "0") || 1) / totalLength;
                                        weightedGC += (l.avancementGC || 0) * w;
                                        weightedMeca += (l.avancementMeca || 0) * w;
                                        weightedPhys += (l.avancementPhysique || 0) * w;
                                      });

                                      const finalGC = Math.round(weightedGC);
                                      const finalMeca = Math.round(weightedMeca);
                                      const finalPhys = Math.round(weightedPhys);

                                      updatedProj.lots = updatedLots;
                                      updatedProj.travauxPlanification = {
                                        ...selectedProject.travauxPlanification,
                                        avancementGC: finalGC,
                                        avancementMeca: finalMeca,
                                        avancementPhysique: finalPhys
                                      };
                                      updatedProj.contrats = {
                                        ...(selectedProject.contrats || {}),
                                        etbGC: { ...(selectedProject.contrats?.etbGC || {}), avancement: finalGC },
                                        etbMeca: { ...(selectedProject.contrats?.etbMeca || {}), avancement: finalMeca }
                                      };
                                    } else {
                                      updatedProj.identity = {
                                        ...(selectedProject.identity || {}),
                                        caracteristiques: {
                                          ...(selectedProject.identity?.caracteristiques || {}),
                                          longueur: tempLongueur || "0"
                                        }
                                      };
                                      updatedProj.travauxPlanification = {
                                        ...selectedProject.travauxPlanification,
                                        avancementGC: computed.avancementGC,
                                        avancementMeca: computed.avancementMeca,
                                        avancementPhysique: computed.avancementPhysique
                                      };
                                      updatedProj.contrats = {
                                        ...(selectedProject.contrats || {}),
                                        etbGC: { ...(selectedProject.contrats?.etbGC || {}), avancement: computed.avancementGC },
                                        etbMeca: { ...(selectedProject.contrats?.etbMeca || {}), avancement: computed.avancementMeca }
                                      };
                                    }

                                    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProj : p));

                                    await setDoc(doc(db, "projects", selectedProject.id), updatedProj);

                                    await createNotification({
                                      projectId: selectedProject.id,
                                      projectName: selectedProject.name || "Ouvrage",
                                      message: `Avancement physique mis à jour : GC ${computed.avancementGC}%, Méca ${computed.avancementMeca}% ➔ Global ${computed.avancementPhysique}%`,
                                      category: "update",
                                      authorName: userProfile?.name || currentUser?.displayName || "Superviseur",
                                      authorEmail: currentUser?.email || "",
                                      authorRole: userProfile?.role || "Superviseur",
                                      pole: selectedProject.identity?.pole || "",
                                      region: selectedProject.identity?.region || ""
                                    });

                                    setIsEditingTravauxProgress(false);
                                  } catch (error) {
                                    console.error("Error saving progress sheet:", error);
                                    alert("Erreur lors de l'enregistrement de l'avancement.");
                                  }
                                }}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Enregistrer</span>
                              </button>
                              <button
                                onClick={() => setIsEditingTravauxProgress(false)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[11px] font-black rounded-lg transition-all cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Progress sheet metrics summary */}
                    {(() => {
                      const activeLotObj = selectedProject.lots?.find(l => l.id === activeTravauxLotId);
                      const lenKmVal = isEditingTravauxProgress ? tempLongueur : (activeLotObj?.longueur || getProjectDisplayLength(selectedProject));
                      const lenKm = lenKmVal !== "" && !isNaN(parseFloat(lenKmVal)) ? parseFloat(lenKmVal) : 10;

                      const tLigne = isEditingTravauxProgress && tempTravauxLigne 
                        ? tempTravauxLigne 
                        : (activeLotObj?.travauxLigne && activeLotObj.travauxLigne.length > 0
                            ? activeLotObj.travauxLigne 
                            : (selectedProject.travauxLigne && selectedProject.travauxLigne.length > 0 
                                ? selectedProject.travauxLigne 
                                : (selectedProject.lots && selectedProject.lots[0]?.travauxLigne && selectedProject.lots[0].travauxLigne.length > 0 
                                    ? selectedProject.lots[0].travauxLigne 
                                    : DEFAULT_TRAVAUX_LIGNE)));
                      
                      const tPostes = isEditingTravauxProgress && tempTravauxPostes
                        ? tempTravauxPostes
                        : (activeLotObj?.travauxPostes && activeLotObj.travauxPostes.length > 0
                            ? activeLotObj.travauxPostes
                            : (selectedProject.travauxPostes && selectedProject.travauxPostes.length > 0
                                ? selectedProject.travauxPostes
                                : (selectedProject.lots && selectedProject.lots[0]?.travauxPostes && selectedProject.lots[0].travauxPostes.length > 0
                                    ? selectedProject.lots[0].travauxPostes
                                    : DEFAULT_TRAVAUX_POSTES)));

                      const computed = computeProgressFromCanvas(tLigne, tPostes, lenKm, isPosteDetenteSeul);

                      return (
                        <div className="space-y-4">
                          {/* Top mini dashboard with GC, GM, and Global progress indicators */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100 flex flex-col justify-between">
                              <span className="text-blue-800 font-extrabold uppercase text-[9px] tracking-wider block">Avancement GC (Génie Civil)</span>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xl font-black text-blue-900">{computed.avancementGC}%</span>
                                <span className="text-[9px] font-mono text-blue-700 font-bold">Ligne + Postes</span>
                              </div>
                              <div className="w-full h-1.5 bg-blue-200 rounded-full overflow-hidden mt-1.5">
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${computed.avancementGC}%` }}></div>
                              </div>
                            </div>

                            <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                              <span className="text-emerald-800 font-extrabold uppercase text-[9px] tracking-wider block">Avancement GM (Mécanique)</span>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xl font-black text-emerald-900">{computed.avancementMeca}%</span>
                                <span className="text-[9px] font-mono text-emerald-700 font-bold">Montage & Pose</span>
                              </div>
                              <div className="w-full h-1.5 bg-emerald-200 rounded-full overflow-hidden mt-1.5">
                                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${computed.avancementMeca}%` }}></div>
                              </div>
                            </div>

                            <div className="bg-purple-900 text-white p-3.5 rounded-2xl border border-purple-950 flex flex-col justify-between shadow-sm col-span-1 sm:col-span-2">
                              <span className="text-purple-200 font-extrabold uppercase text-[9px] tracking-wider block">
                                {activeLotObj ? `Avancement Physique — ${activeLotObj.name}` : "Avancement Physique Global (Calculé)"}
                              </span>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-2xl font-black">{computed.avancementPhysique}%</span>
                                <span className="text-[9px] font-mono bg-purple-800 text-purple-100 px-2 py-0.5 rounded font-bold uppercase">
                                  {isPosteDetenteSeul ? "100% Poste" : "Pondéré 80/20"}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-purple-800 rounded-full overflow-hidden mt-1.5">
                                <div className="h-full bg-white rounded-full" style={{ width: `${computed.avancementPhysique}%` }}></div>
                              </div>
                            </div>
                          </div>

                          {/* Tab Navigation & project length info */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
                            <div className="flex gap-1.5 p-0.5 bg-slate-100 rounded-xl max-w-fit border">
                              {!isPosteDetenteSeul && (
                                <button
                                  type="button"
                                  onClick={() => setTravauxProgressTab("ligne")}
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                                    travauxProgressTab === "ligne" 
                                      ? "bg-white text-slate-800 shadow-xs" 
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  <Layers className="w-3 h-3" />
                                  <span>🛤️ Travaux de Ligne</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setTravauxProgressTab("postes")}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                                  travauxProgressTab === "postes" 
                                    ? "bg-white text-slate-800 shadow-xs" 
                                    : "text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                <Building className="w-3 h-3" />
                                <span>🏢 Ouvrages Concentrés (Postes)</span>
                              </button>
                            </div>

                            <div className="text-[10px] text-slate-500 flex items-center gap-2 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border">
                              <span className="font-extrabold text-slate-700">Longueur du Projet :</span>
                              <span className="font-mono font-black text-slate-800">{lenKm} km</span>
                              <span className="text-slate-300">|</span>
                              <span className="font-mono font-black text-slate-800">{(lenKm * 1000).toLocaleString()} ml</span>
                              {isEditingTravauxProgress && (
                                <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200">
                                  <span className="text-slate-400 font-bold">Modifier (km):</span>
                                  <input 
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={tempLongueur}
                                    onChange={(e) => {
                                      setTempLongueur(e.target.value);
                                    }}
                                    className="w-14 bg-white border rounded px-1 text-[10px] font-black font-mono text-center"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Active Tab View */}
                          {travauxProgressTab === "ligne" ? (
                            <div className="overflow-x-auto rounded-2xl border border-slate-150 shadow-xs">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-150 text-[9px] uppercase tracking-wider font-extrabold text-slate-500">
                                    <th className="py-2.5 px-3">Phase de Travaux</th>
                                    <th className="py-2.5 px-3 text-center bg-purple-50/30">Pondér. (%)</th>
                                    <th className="py-2.5 px-3 text-center">Réal. Antér. (ml)</th>
                                    <th className="py-2.5 px-3 text-center">Réal. Quot. (ml)</th>
                                    <th className="py-2.5 px-3 text-center font-bold text-slate-700 bg-slate-100/50">Réal. Cumulée (ml)</th>
                                    <th className="py-2.5 px-3 text-center">Avanc. Abs. Quot. (%)</th>
                                    <th className="py-2.5 px-3 text-center">Avanc. Abs. Global (%)</th>
                                    <th className="py-2.5 px-3 text-center bg-purple-50/50 font-bold text-purple-700">Avanc. Quot. Rel. (%)</th>
                                    <th className="py-2.5 px-3 text-center bg-purple-100/40 font-black text-purple-900 font-black">Avanc. Cumulé Rel. (%)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                  {(() => {
                                    const totLenM = lenKm * 1000;
                                    let sumPonderation = 0;
                                    let sumAnterieur = 0;
                                    let sumQuotidien = 0;
                                    let sumCumule = 0;
                                    let sumQuotidienAbs = 0;
                                    let sumGlobalAbs = 0;
                                    let sumQuotidienRel = 0;
                                    let sumCumuleRel = 0;

                                    return (
                                      <>
                                        {tLigne.map((row, idx) => {
                                          const ant = parseFloat(row.anterieur) || 0;
                                          const quot = parseFloat(row.quotidien) || 0;
                                          const cum = ant + quot;
                                          const pond = parseFloat(row.ponderation) || 0;

                                          const quotAbs = totLenM > 0 ? (quot / totLenM) * 100 : 0;
                                          const globAbs = totLenM > 0 ? (cum / totLenM) * 100 : 0;

                                          const quotRel = quotAbs * (pond / 100);
                                          const cumRel = globAbs * (pond / 100);

                                          sumPonderation += pond;
                                          sumAnterieur += ant;
                                          sumQuotidien += quot;
                                          sumCumule += cum;
                                          sumQuotidienAbs += quotAbs;
                                          sumGlobalAbs += globAbs;
                                          sumQuotidienRel += quotRel;
                                          sumCumuleRel += cumRel;

                                          return (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                              <td className="py-2 px-3 font-black text-slate-800">{idx + 1}/ {row.phase}</td>
                                              <td className="py-2 px-3 text-center font-mono font-bold bg-purple-50/10">{pond}%</td>
                                              <td className="py-2 px-3 text-center font-mono">
                                                {isEditingTravauxProgress ? (
                                                  <input 
                                                    type="number"
                                                    value={row.anterieur}
                                                    onChange={(e) => {
                                                      const raw = e.target.value;
                                                      const val = raw === "" ? "" : Math.max(0, parseFloat(raw) || 0);
                                                      const updated = [...tLigne];
                                                      updated[idx] = { ...updated[idx], anterieur: val };
                                                      setTempTravauxLigne(updated);
                                                    }}
                                                    className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center font-mono font-black"
                                                  />
                                                ) : ant.toLocaleString()}
                                              </td>
                                              <td className="py-2 px-3 text-center font-mono">
                                                {isEditingTravauxProgress ? (
                                                  <input 
                                                    type="number"
                                                    value={row.quotidien}
                                                    onChange={(e) => {
                                                      const raw = e.target.value;
                                                      const val = raw === "" ? "" : Math.max(0, parseFloat(raw) || 0);
                                                      const updated = [...tLigne];
                                                      updated[idx] = { ...updated[idx], quotidien: val };
                                                      setTempTravauxLigne(updated);
                                                    }}
                                                    className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center font-mono font-black"
                                                  />
                                                ) : quot.toLocaleString()}
                                              </td>
                                              <td className="py-2 px-3 text-center font-mono font-black text-slate-800 bg-slate-100/30">
                                                {cum.toLocaleString()}
                                              </td>
                                              <td className="py-2 px-3 text-center font-mono text-slate-500 text-[11px]">
                                                {quotAbs.toFixed(2)}%
                                              </td>
                                              <td className="py-2 px-3 text-center font-mono text-slate-600 text-[11px]">
                                                {globAbs.toFixed(2)}%
                                              </td>
                                              <td className="py-2 px-3 text-center font-mono bg-purple-50/30 text-purple-600 font-bold">
                                                {quotRel.toFixed(2)}%
                                              </td>
                                              <td className="py-2 px-3 text-center font-mono bg-purple-100/20 text-purple-800 font-black">
                                                {cumRel.toFixed(2)}%
                                              </td>
                                            </tr>
                                          );
                                        })}

                                        {/* Total Summary Row */}
                                        <tr className="bg-slate-100/60 font-black text-slate-800 text-[11px] border-t-2 border-slate-200">
                                          <td className="py-2.5 px-3 uppercase tracking-wider font-extrabold font-black">TOTAL RELATIF LIGNE</td>
                                          <td className="py-2.5 px-3 text-center font-mono bg-purple-50/20">{sumPonderation}%</td>
                                          <td className="py-2.5 px-3 text-center font-mono">{sumAnterieur.toLocaleString()}</td>
                                          <td className="py-2.5 px-3 text-center font-mono">{sumQuotidien.toLocaleString()}</td>
                                          <td className="py-2.5 px-3 text-center font-mono bg-slate-200/40">{sumCumule.toLocaleString()}</td>
                                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">-</td>
                                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">-</td>
                                          <td className="py-2.5 px-3 text-center font-mono bg-purple-100/30 text-purple-700 font-bold">{sumQuotidienRel.toFixed(2)}%</td>
                                          <td className="py-2.5 px-3 text-center font-mono bg-purple-200/30 text-purple-900 text-xs font-extrabold">{sumCumuleRel.toFixed(2)}%</td>
                                        </tr>
                                      </>
                                    );
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-2xl border border-slate-150 shadow-xs">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-150 text-[9px] uppercase tracking-wider font-extrabold text-slate-500">
                                    <th className="py-2.5 px-3">Ouvrage • Phase Postes</th>
                                    <th className="py-2.5 px-3 text-center bg-indigo-50/30">Pondér. (%)</th>
                                    <th className="py-2.5 px-3 text-center">Avancement Absolu Antérieur (%)</th>
                                    <th className="py-2.5 px-3 text-center">Avancement Absolu Quotidien (%)</th>
                                    <th className="py-2.5 px-3 text-center font-bold text-slate-700 bg-slate-100/50">Avancement Absolu Global (%)</th>
                                    <th className="py-2.5 px-3 text-center bg-indigo-50/50 font-bold text-indigo-700">Avancement Quotidien Relatif (%)</th>
                                    <th className="py-2.5 px-3 text-center bg-indigo-100/40 font-black text-indigo-900 font-black">Avancement Cumulé Relatif (%)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                  {(() => {
                                    let sumPonderation = 0;
                                    let sumAnterieurAbs = 0;
                                    let sumQuotidienAbs = 0;
                                    let sumGlobalAbs = 0;
                                    let sumQuotidienRel = 0;
                                    let sumCumuleRel = 0;

                                    return (
                                      <>
                                        {tPostes.map((row, idx) => {
                                          const ant = row.anterieur !== undefined 
                                            ? (parseFloat(row.anterieur) || 0) 
                                            : Math.max(0, (parseFloat(row.global) || 0) - (parseFloat(row.quotidien) || 0));
                                          const quot = parseFloat(row.quotidien) || 0;
                                          const glob = ant + quot;
                                          const pond = parseFloat(row.ponderation) || 0;

                                          const quotRel = quot * (pond / 100);
                                          const cumRel = glob * (pond / 100);

                                          sumPonderation += pond;
                                          sumAnterieurAbs += ant;
                                          sumQuotidienAbs += quot;
                                          sumGlobalAbs += glob;
                                          sumQuotidienRel += quotRel;
                                          sumCumuleRel += cumRel;

                                          return (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                              <td className="py-2.5 px-3 font-black text-slate-800">{idx + 1}/ {row.phase}</td>
                                              <td className="py-2.5 px-3 text-center font-mono font-bold bg-indigo-50/10">{pond}%</td>
                                              
                                              {/* Avancement Absolu Antérieur (%) */}
                                              <td className="py-2.5 px-3 text-center font-mono">
                                                {isEditingTravauxProgress ? (
                                                  <div className="flex items-center justify-center gap-1">
                                                    <input 
                                                      type="number"
                                                      min="0"
                                                      max="100"
                                                      value={row.anterieur !== undefined ? row.anterieur : ant}
                                                      onChange={(e) => {
                                                        const raw = e.target.value;
                                                        const val = raw === "" ? "" : Math.min(100, Math.max(0, parseFloat(raw) || 0));
                                                        const updated = [...tPostes];
                                                        const numVal = parseFloat(String(val)) || 0;
                                                        const numQuot = parseFloat(String(updated[idx].quotidien)) || 0;
                                                        updated[idx] = { ...updated[idx], anterieur: val, global: numVal + numQuot };
                                                        setTempTravauxPostes(updated);
                                                      }}
                                                      className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center font-mono font-black"
                                                    />
                                                    <span className="text-slate-400 font-bold">%</span>
                                                  </div>
                                                ) : `${ant}%`}
                                              </td>

                                              {/* Avancement Absolu Quotidien (%) */}
                                              <td className="py-2.5 px-3 text-center font-mono">
                                                {isEditingTravauxProgress ? (
                                                  <div className="flex items-center justify-center gap-1">
                                                    <input 
                                                      type="number"
                                                      min="0"
                                                      max="100"
                                                      value={row.quotidien}
                                                      onChange={(e) => {
                                                        const raw = e.target.value;
                                                        const val = raw === "" ? "" : Math.min(100, Math.max(0, parseFloat(raw) || 0));
                                                        const updated = [...tPostes];
                                                        const rowAnt = updated[idx].anterieur !== undefined 
                                                          ? (parseFloat(String(updated[idx].anterieur)) || 0) 
                                                          : Math.max(0, (parseFloat(String(updated[idx].global)) || 0) - (parseFloat(String(updated[idx].quotidien)) || 0));
                                                        const numVal = parseFloat(String(val)) || 0;
                                                        updated[idx] = { ...updated[idx], quotidien: val, global: rowAnt + numVal };
                                                        setTempTravauxPostes(updated);
                                                      }}
                                                      className="w-16 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center font-mono font-black"
                                                    />
                                                    <span className="text-slate-400 font-bold">%</span>
                                                  </div>
                                                ) : `${quot}%`}
                                              </td>

                                              {/* Avancement Absolu Global (%) - Calculated */}
                                              <td className="py-2.5 px-3 text-center font-mono font-black text-slate-800 bg-slate-100/30">
                                                {glob}%
                                              </td>

                                              <td className="py-2.5 px-3 text-center font-mono bg-indigo-50/30 text-indigo-600 font-bold">
                                                {quotRel.toFixed(2)}%
                                              </td>
                                              <td className="py-2.5 px-3 text-center font-mono bg-indigo-100/20 text-indigo-800 font-black">
                                                {cumRel.toFixed(2)}%
                                              </td>
                                            </tr>
                                          );
                                        })}

                                        {/* Total Summary Row */}
                                        <tr className="bg-slate-100/60 font-black text-slate-800 text-[11px] border-t-2 border-slate-200">
                                          <td className="py-2.5 px-3 uppercase tracking-wider font-extrabold font-black font-black">TOTAL RELATIF POSTES</td>
                                          <td className="py-2.5 px-3 text-center font-mono bg-indigo-50/20">{sumPonderation}%</td>
                                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">-</td>
                                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">-</td>
                                          <td className="py-2.5 px-3 text-center font-mono text-slate-500 bg-slate-200/45">-</td>
                                          <td className="py-2.5 px-3 text-center font-mono bg-indigo-100/30 text-indigo-700 font-bold">{sumQuotidienRel.toFixed(2)}%</td>
                                          <td className="py-2.5 px-3 text-center font-mono bg-indigo-200/30 text-indigo-900 text-xs font-extrabold">{sumCumuleRel.toFixed(2)}%</td>
                                        </tr>
                                      </>
                                    );
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* DISPONIBILITÉ MATÉRIEL ET ÉQUIPEMENTS */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <h5 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-purple-600" />
                          <span>Disponibilité du Matériel et Équipements de Chantier</span>
                        </h5>
                        <p className="text-[10px] text-slate-400">État d'approvisionnement des composants critiques pour le raccordement et la pose du gazoduc.</p>
                      </div>

                      {hasPrivilege("section_travaux") && (
                        <div className="shrink-0">
                          {!isEditingMateriel ? (
                            <button
                              onClick={() => {
                                const initialMat = selectedProject.disponibiliteMateriel || {
                                  tube: { statut: "Disponible", quantite: "100%", commentaire: "Tubes en acier de diamètre spécifié réceptionnés." },
                                  posteRechauffeur: { statut: "Disponible", quantite: "1 unité", commentaire: "Poste réchauffeur d'eau chaude installé et opérationnel." },
                                  raccorderie: { statut: "Disponible", quantite: "100%", commentaire: "Brides, coudes et tés inspectés et conformes." },
                                  posteSectionnement: { statut: "Disponible", quantite: "2 unités", commentaire: "Postes de sectionnement préfabriqués sur chantier." },
                                  gareRacleur: { statut: "En cours", quantite: "1 départ / 1 arrivée", commentaire: "Gare de racleur de départ installée, gare d'arrivée en cours de montage." },
                                  autre: { statut: "Disponible", quantite: "N/A", commentaire: "Générateurs et postes de soudage automatiques de secours disponibles." }
                                };
                                setTempMateriel(JSON.parse(JSON.stringify(initialMat)));
                                setIsEditingMateriel(true);
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Mettre à jour l'état</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const updatedProj = {
                                      ...selectedProject,
                                      disponibiliteMateriel: tempMateriel,
                                      updatedAt: new Date().toISOString()
                                    };
                                    // Save to firestore
                                    await setDoc(doc(db, "projects", selectedProject.id), updatedProj);
                                    setIsEditingMateriel(false);
                                  } catch (error) {
                                    console.error("Error saving material availability:", error);
                                    alert("Erreur lors de la sauvegarde.");
                                  }
                                }}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Enregistrer</span>
                              </button>
                              <button
                                onClick={() => setIsEditingMateriel(false)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[11px] font-black rounded-lg transition-all cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {isEditingMateriel && tempMateriel ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {[
                          { key: "tube", label: "Tube (Canalisations)", desc: "État de livraison des tubes acier de la ligne principale." },
                          { key: "posteRechauffeur", label: "Poste Réchauffeur", desc: "Disponibilité et état du poste réchauffeur d'eau chaude." },
                          { key: "raccorderie", label: "Raccorderie", desc: "Brides, coudes, tés, joints isolants de raccordement." },
                          { key: "posteSectionnement", label: "Poste de Sectionnement", desc: "Robinetterie et vannes de sectionnement de ligne." },
                          { key: "gareRacleur", label: "Gare Racleur (Départ / Arrivée)", desc: "Gare de racleur départ et d'arrivée." },
                          { key: "autre", label: "Autre matériel", desc: "Tout autre équipement ou matériel de chantier nécessaire." }
                        ].map(({ key, label, desc }) => (
                          <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-slate-800 text-xs">{label}</span>
                              <select
                                value={tempMateriel[key]?.statut || "Disponible"}
                                onChange={(e) => {
                                  setTempMateriel({
                                    ...tempMateriel,
                                    [key]: { ...tempMateriel[key], statut: e.target.value }
                                  });
                                }}
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 outline-none cursor-pointer"
                              >
                                <option value="Disponible">Disponible ✅</option>
                                <option value="En cours">En cours de livraison 🚚</option>
                                <option value="Manquant">Manquant ❌</option>
                                <option value="Non requis">Non requis ⚪</option>
                              </select>
                            </div>
                            <p className="text-[10px] text-slate-400 -mt-1">{desc}</p>
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              <div className="col-span-1">
                                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wide block">Quantité / Réf</label>
                                <input
                                  type="text"
                                  value={tempMateriel[key]?.quantite || ""}
                                  onChange={(e) => {
                                    setTempMateriel({
                                      ...tempMateriel,
                                      [key]: { ...tempMateriel[key], quantite: e.target.value }
                                    });
                                  }}
                                  className="w-full mt-0.5 px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-md outline-none font-bold text-slate-700"
                                  placeholder="Ex: 100% ou 2 u"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wide block">Commentaires / Remarques</label>
                                <input
                                  type="text"
                                  value={tempMateriel[key]?.commentaire || ""}
                                  onChange={(e) => {
                                    setTempMateriel({
                                      ...tempMateriel,
                                      [key]: { ...tempMateriel[key], commentaire: e.target.value }
                                    });
                                  }}
                                  className="w-full mt-0.5 px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-md outline-none text-slate-700"
                                  placeholder="Observations sur le chantier..."
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                        {(() => {
                          const matData = selectedProject.disponibiliteMateriel || {
                            tube: { statut: "Disponible", quantite: "100%", commentaire: "Tubes en acier de diamètre spécifié réceptionnés." },
                            posteRechauffeur: { statut: "Disponible", quantite: "1 unité", commentaire: "Poste réchauffeur d'eau chaude installé et opérationnel." },
                            raccorderie: { statut: "Disponible", quantite: "100%", commentaire: "Brides, coudes et tés inspectés et conformes." },
                            posteSectionnement: { statut: "Disponible", quantite: "2 unités", commentaire: "Postes de sectionnement préfabriqués sur chantier." },
                            gareRacleur: { statut: "En cours", quantite: "1 départ / 1 arrivée", commentaire: "Gare de racleur de départ installée, gare d'arrivée en cours de montage." },
                            autre: { statut: "Disponible", quantite: "N/A", commentaire: "Générateurs et postes de soudage automatiques de secours disponibles." }
                          };
                          return [
                            { key: "tube", label: "Tube (Canalisations)", icon: Layers },
                            { key: "posteRechauffeur", label: "Poste Réchauffeur", icon: Thermometer },
                            { key: "raccorderie", label: "Raccorderie", icon: Sliders },
                            { key: "posteSectionnement", label: "Poste de Sectionnement", icon: Radio },
                            { key: "gareRacleur", label: "Gare Racleur (Départ / Arrivée)", icon: ArrowRightLeft },
                            { key: "autre", label: "Autre matériel", icon: Wrench }
                          ].map(({ key, label, icon: IconComponent }) => {
                            const val = matData[key as keyof typeof matData] || { statut: "Disponible", quantite: "100%", commentaire: "" };
                            const getStatutBadge = (status: string) => {
                              switch (status) {
                                case "Disponible":
                                  return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-bold text-[9px] border border-green-200/50">Disponible ✅</span>;
                                case "En cours":
                                  return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full font-bold text-[9px] border border-yellow-200/50">En cours 🚚</span>;
                                case "Manquant":
                                  return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded-full font-bold text-[9px] border border-red-200/50">Manquant ❌</span>;
                                default:
                                  return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full font-bold text-[9px] border border-slate-200/50">Non requis ⚪</span>;
                              }
                            };
                            return (
                              <div key={key} className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 hover:border-slate-200/80 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-2">
                                <div className="flex justify-between items-start gap-1">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white rounded-lg border border-slate-200/50 text-slate-600">
                                      <IconComponent className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="font-extrabold text-slate-800 text-[11px]">{label}</span>
                                  </div>
                                  {getStatutBadge(val.statut)}
                                </div>
                                <div className="space-y-1 pt-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-mono text-slate-400 uppercase">Quantité/Réf:</span>
                                    <span className="text-[10px] font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded-md border border-slate-100">{val.quantite || "N/A"}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 italic leading-relaxed line-clamp-2">
                                    {val.commentaire || "Aucune observation enregistrée."}
                                  </p>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  {/* 36 POINTS OF CONTROL AUDIT REGISTER */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h5 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-purple-600" />
                          <span>Registre des 36 Tâches du Plan de Contrôle (PR.INFR.03.V02)</span>
                        </h5>
                        <p className="text-[10px] text-slate-400">Cliquez sur un point de contrôle pour l'ouvrir, modifier son résultat d'audit, vérifier l'étalonnage des appareils ou renseigner les actions correctives.</p>
                      </div>

                      {/* Filter & Search controls */}
                      <div className="flex w-full sm:w-auto items-center gap-2 text-xs shrink-0">
                        <div className="relative flex-1 sm:flex-initial">
                          <input
                            type="text"
                            value={planDeControleSearch}
                            onChange={e => setPlanDeControleSearch(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-1.5 text-slate-700 focus:outline-blue-500 font-medium text-xs w-full sm:w-48"
                            placeholder="Rechercher une tâche..."
                          />
                        </div>
                        <select
                          value={planDeControleFilter}
                          onChange={e => setPlanDeControleFilter(e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-slate-700 focus:outline-blue-500 font-black text-xs"
                        >
                          <option value="Tous">Filtrer: Tous</option>
                          <option value="C">Conforme (C)</option>
                          <option value="NC">Non Conforme (NC)</option>
                          <option value="/">Non contrôlé (/)</option>
                        </select>
                      </div>
                    </div>

                    {/* Interactive List/Table of 36 items */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">
                              <th className="py-3 px-4 w-12 text-center">N°</th>
                              <th className="py-3 px-4">Tâche / Activité de contrôle</th>
                              <th className="py-3 px-4 hidden md:table-cell">Mode de Contrôle</th>
                              <th className="py-3 px-4 hidden md:table-cell">Document de Référence</th>
                              <th className="py-3 px-4 text-center w-36">Statut Audit</th>
                            </tr>
                          </thead>
                        </table>
                        </div>

                        <div className="divide-y divide-slate-100 bg-white max-h-[500px] overflow-y-auto">
                          {STATIC_PLAN_DE_CONTROLE_TASKS.filter(task => {
                            // Filter by Search string
                            const matchesSearch = task.tache.toLowerCase().includes(planDeControleSearch.toLowerCase()) || task.ord.includes(planDeControleSearch);
                            
                            // Filter by compliance status
                            const statusObj = selectedProject.planDeControle?.[task.ord];
                            const currentResult = statusObj ? (statusObj.resultatNouveau !== "/" ? statusObj.resultatNouveau : statusObj.resultat) : "/";
                            
                            if (planDeControleFilter === "Tous") return matchesSearch;
                            return matchesSearch && currentResult === planDeControleFilter;
                          }).map(task => {
                            const status = selectedProject.planDeControle?.[task.ord];
                            const hasBeenControlled = !!status;
                            const res1 = status?.resultat || "/";
                            const resNew = status?.resultatNouveau || "/";
                            
                            // Determine final active status
                            const finalResult = resNew !== "/" ? resNew : res1;
                            
                            const isExpanded = expandedPlanDeControleItem === task.ord;

                            return (
                              <div key={task.ord} className="transition-all">
                                <div 
                                  onClick={() => handleToggleExpandPlanItem(task.ord)}
                                  className={`flex items-center justify-between md:grid md:grid-cols-12 py-3.5 px-4 cursor-pointer text-xs transition-all ${
                                    isExpanded ? "bg-slate-50 font-extrabold" : "hover:bg-slate-50/50"
                                  }`}
                                >
                                  {/* Ordinal */}
                                  <div className="md:col-span-1 text-center font-mono font-black text-slate-400 pr-2">
                                    {task.ord}
                                  </div>
                                  
                                  {/* Task title */}
                                  <div className="md:col-span-5 pr-4">
                                    <p className="font-extrabold text-slate-800 leading-tight">{task.tache}</p>
                                    <p className="md:hidden text-[10px] text-slate-400 mt-0.5">{task.mode} • Ref: {task.ref}</p>
                                  </div>

                                  {/* Mode (hidden on mobile) */}
                                  <div className="md:col-span-2 hidden md:block text-slate-500 font-medium pr-3">
                                    {task.mode}
                                  </div>

                                  {/* Document ref (hidden on mobile) */}
                                  <div className="md:col-span-2 hidden md:block text-slate-400 font-mono truncate pr-3" title={task.ref}>
                                    {task.ref}
                                  </div>

                                  {/* Status badge */}
                                  <div className="md:col-span-2 flex justify-center shrink-0">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase text-center w-28 flex items-center justify-center gap-1.5 ${
                                      finalResult === "C"
                                        ? "bg-green-100 text-green-800 border border-green-200"
                                        : finalResult === "NC"
                                        ? "bg-red-100 text-red-800 border border-red-200"
                                        : "bg-slate-100 text-slate-500 border border-slate-200"
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        finalResult === "C" ? "bg-green-600" : finalResult === "NC" ? "bg-red-600" : "bg-slate-400"
                                      }`}></span>
                                      <span>
                                        {finalResult === "C" && "Conforme"}
                                        {finalResult === "NC" && "Non Conforme"}
                                        {finalResult === "/" && "Non contrôlé"}
                                      </span>
                                    </span>
                                  </div>
                                </div>

                                {/* Expanded detail view */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden bg-slate-50 border-t border-b border-slate-100 px-6 py-5 text-xs text-slate-700"
                                    >
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Static Reference & Specs column */}
                                        <div className="space-y-3.5 border-r border-slate-200/60 pr-0 md:pr-6">
                                          <div>
                                            <span className="text-[9px] font-black uppercase text-purple-600 tracking-wider">Critère d'acceptation</span>
                                            <p className="font-extrabold text-slate-800 leading-relaxed mt-0.5">{task.critere}</p>
                                          </div>
                                          <div>
                                            <span className="text-[9px] font-black uppercase text-purple-600 tracking-wider">Étalonnage de mesure requis</span>
                                            <p className="font-medium text-slate-600 leading-relaxed mt-0.5">{task.etalonnage}</p>
                                          </div>
                                          <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
                                            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-xs">
                                              <span className="text-[9px] text-slate-400 font-bold block">MODE DE CONTROLE</span>
                                              <span className="font-bold text-slate-800">{task.mode}</span>
                                            </div>
                                            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-xs">
                                              <span className="text-[9px] text-slate-400 font-bold block">DOCUMENT REF</span>
                                              <span className="font-mono text-slate-800 truncate block" title={task.ref}>{task.ref}</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Audit status / Editor column */}
                                        <div className="space-y-4">
                                          {hasPrivilege("section_travaux") ? (
                                            /* Admin editable form */
                                            <div className="space-y-3">
                                              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider block">Enregistrer l'évaluation d'audit (Admin)</span>
                                              
                                              <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                  <label className="block text-slate-500 font-bold mb-1">Date Contrôle :</label>
                                                  <input 
                                                    type="date" 
                                                    value={editPlanItemFields.dateControle || ""}
                                                    onChange={e => setEditPlanItemFields({ ...editPlanItemFields, dateControle: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-slate-500 font-bold mb-1">Résultat :</label>
                                                  <select
                                                    value={editPlanItemFields.resultat}
                                                    onChange={e => setEditPlanItemFields({ ...editPlanItemFields, resultat: e.target.value as any })}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-black text-slate-800"
                                                  >
                                                    <option value="/">Non contrôlé (/)</option>
                                                    <option value="C">Conforme (C)</option>
                                                    <option value="NC">Non Conforme (NC)</option>
                                                  </select>
                                                </div>
                                              </div>

                                              <div className="grid grid-cols-1 gap-2">
                                                <div>
                                                  <label className="block text-slate-500 font-bold mb-0.5">Certificat Étalonnage vérifié (si requis) :</label>
                                                  <input 
                                                    type="text" 
                                                    value={editPlanItemFields.etalonnage || ""}
                                                    onChange={e => setEditPlanItemFields({ ...editPlanItemFields, etalonnage: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5"
                                                    placeholder="ex: Certificat ONML n°2026/84 validé"
                                                  />
                                                </div>
                                              </div>

                                              {editPlanItemFields.resultat === "NC" && (
                                                <div className="bg-red-50 p-3 rounded-xl border border-red-100 space-y-3.5">
                                                  <p className="text-[10px] text-red-800 font-black uppercase tracking-wide">Fiche de Non-Conformité & Correction</p>
                                                  <div>
                                                    <label className="block text-red-700 font-bold mb-0.5">Action corrective demandée :</label>
                                                    <input 
                                                      type="text" 
                                                      value={editPlanItemFields.action || ""}
                                                      onChange={e => setEditPlanItemFields({ ...editPlanItemFields, action: e.target.value })}
                                                      className="w-full bg-white border border-red-200 rounded-xl px-2.5 py-1.5 text-red-900"
                                                      placeholder="ex: Sablage à refaire, ré-évaluation de soudure"
                                                    />
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                      <label className="block text-red-700 font-bold mb-0.5">Date ré-évaluation :</label>
                                                      <input 
                                                        type="date" 
                                                        value={editPlanItemFields.dateNouveauControle || ""}
                                                        onChange={e => setEditPlanItemFields({ ...editPlanItemFields, dateNouveauControle: e.target.value })}
                                                        className="w-full bg-white border border-red-200 rounded-xl px-2.5 py-1.5 font-mono"
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-red-700 font-bold mb-0.5">Nouveau Résultat :</label>
                                                      <select
                                                        value={editPlanItemFields.resultatNouveau}
                                                        onChange={e => setEditPlanItemFields({ ...editPlanItemFields, resultatNouveau: e.target.value as any })}
                                                        className="w-full bg-white border border-red-200 rounded-xl px-2.5 py-1.5 font-black text-red-900"
                                                      >
                                                        <option value="/">Attente Ré-évaluation</option>
                                                        <option value="C">Conforme (C)</option>
                                                        <option value="NC">Toujours Non Conforme</option>
                                                      </select>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}

                                              <div>
                                                <label className="block text-slate-500 font-bold mb-0.5">Observations / Notes d'audit :</label>
                                                <textarea 
                                                  value={editPlanItemFields.observation || ""}
                                                  onChange={e => setEditPlanItemFields({ ...editPlanItemFields, observation: e.target.value })}
                                                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 min-h-[45px]"
                                                  placeholder="Renseigner d'autres détails ou réserves relatives au point de contrôle..."
                                                />
                                              </div>

                                              <div className="flex justify-end pt-1">
                                                <button
                                                  type="button"
                                                  disabled={isSavingPlanItem}
                                                  onClick={() => handleSavePlanDeControleItem(task.ord)}
                                                  className="px-4.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                                                >
                                                  {isSavingPlanItem ? (
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                  ) : (
                                                    <Save className="w-3.5 h-3.5" />
                                                  )}
                                                  <span>{isSavingPlanItem ? "Enregistrement..." : "Enregistrer ce point"}</span>
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            /* Regular/Guest user read-only summary card */
                                            <div className="bg-white p-4.5 rounded-xl border border-slate-200/60 shadow-sm space-y-3">
                                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block border-b pb-1">Évaluation d'Audit de Chantier</span>
                                              
                                              {hasBeenControlled ? (
                                                <div className="space-y-2.5">
                                                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                                                    <div className="bg-slate-50 p-2 rounded-lg">
                                                      <span className="text-[10px] text-slate-400 block font-bold">DATE CONTROLE</span>
                                                      <span className="font-mono font-black text-slate-800">{status.dateControle || "Non spécifiée"}</span>
                                                    </div>
                                                    <div className="bg-slate-50 p-2 rounded-lg">
                                                      <span className="text-[10px] text-slate-400 block font-bold">RESULTAT D'AUDIT</span>
                                                      <span className={`font-black text-xs ${status.resultat === "C" ? "text-green-700" : "text-red-700"}`}>
                                                        {status.resultat === "C" ? "CONFORME" : "NON CONFORME"}
                                                      </span>
                                                    </div>
                                                  </div>

                                                  {status.etalonnage && (
                                                    <div className="text-[11px]">
                                                      <span className="text-slate-400 block font-bold">ÉTALONNAGE APPAREIL</span>
                                                      <p className="font-extrabold text-slate-800 bg-slate-50/50 p-2 rounded-lg border">{status.etalonnage}</p>
                                                    </div>
                                                  )}

                                                  {status.resultat === "NC" && (
                                                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-2 text-[11px]">
                                                      <span className="text-red-800 font-black uppercase block text-[9px] tracking-wider">Fiche de Non-Conformité active</span>
                                                      <div>
                                                        <span className="text-red-600 font-bold block">ACTION DEMANDEE :</span>
                                                        <p className="font-black text-red-900 leading-tight">{status.action || "Attente d'action corrective"}</p>
                                                      </div>
                                                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-red-200/50">
                                                        <div>
                                                          <span className="text-red-600 block">Date Ré-évaluation</span>
                                                          <span className="font-mono font-black text-red-900">{status.dateNouveauControle || "N/A"}</span>
                                                        </div>
                                                        <div>
                                                          <span className="text-red-600 block">Nouveau Résultat</span>
                                                          <span className="font-black text-red-900">{status.resultatNouveau === "C" ? "✓ CONFORME (Corrigé)" : "Attente correction"}</span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}

                                                  {status.observation && (
                                                    <div className="text-[11px]">
                                                      <span className="text-slate-400 block font-bold">OBSERVATIONS CHANTIER</span>
                                                      <p className="font-medium text-slate-700 italic bg-slate-50/50 p-2.5 rounded-lg border leading-relaxed">
                                                        "{status.observation}"
                                                      </p>
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <div className="text-center py-6">
                                                  <Info className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                                                  <p className="text-slate-500 font-extrabold">Point de contrôle non encore évalué.</p>
                                                  <p className="text-[10px] text-slate-400 mt-0.5">En attente de la visite du superviseur de chantier.</p>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
              )}

              {/* ================= PHASE 04: MISE EN GAZ & ARCHIVES ================= */}
              {activeSubTab === "gaz" && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase text-green-600 tracking-wider">Phase 04 • Réception & Archivage</span>
                    <h4 className="font-extrabold text-base text-slate-800">Mise en Gaz définitive et Livrables Documentaires</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 bg-green-50/40 rounded-2xl border border-green-100/60 flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-500">Statut de la Mise en Gaz :</p>
                        <p className="font-black text-green-950 text-sm mt-0.5">
                          {selectedProject.miseEnGazArchive.statutMiseEnGaz || "Non planifiée"}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-500">Date Programmée / Réelle :</p>
                        <p className="font-black text-slate-800 text-sm mt-0.5">
                          {selectedProject.miseEnGazArchive.dateEffectiveMiseEnGaz || "Non programmée"}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-500">Conformité Finale :</p>
                        <p className="font-black text-slate-800 text-sm mt-0.5">
                          {selectedProject.travauxPlanification.avancementPhysique === 100 ? "✓ 100% Conforme" : "En cours d'homologation"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Document archives lists */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h5 className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                        <FolderOpen className="w-4 h-4 text-blue-600" />
                        <span>Archives Documentaires Obligatoires (Plans de recollement, PV, etc.)</span>
                      </h5>
                    </div>

                    {/* Grid list of files */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedProject.miseEnGazArchive.documentsArchives || []).map((doc, idx) => (
                        <div 
                          key={doc.id || idx}
                          className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate leading-snug">{doc.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{doc.category}</span>
                                <span className="text-[9px] text-slate-400">{doc.addedAt}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => removeArchiveDocument(doc.id)}
                              className="p-1 text-slate-300 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                              title="Retirer l'archive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {(selectedProject.miseEnGazArchive.documentsArchives || []).length === 0 && (
                        <div className="col-span-2 text-center py-6 text-xs text-slate-400 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                          Aucun document archivé dans ce dossier de recollement.
                        </div>
                      )}
                    </div>

                    {/* Form to add a document reference */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-end gap-3 text-xs">
                      <div className="space-y-1 w-full">
                        <label className="font-bold text-slate-600">Nom du fichier archivé</label>
                        <input
                          type="text"
                          value={newDocName}
                          onChange={(e) => setNewDocName(e.target.value)}
                          placeholder="e.g., Plan de recollement - Traversée d'Oued.dwg"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none"
                        />
                      </div>
                      <div className="space-y-1 shrink-0 w-full sm:w-56">
                        <label className="font-bold text-slate-600">Catégorie</label>
                        <select
                          value={newDocCat}
                          onChange={(e) => setNewDocCat(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none"
                        >
                          <option value="Plan de recollement">Plan de recollement</option>
                          <option value="Dossier Technique Final">Dossier Technique Final</option>
                          <option value="PV d'essais">PV d'essais</option>
                          <option value="Rapport de conformité">Rapport de conformité</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                      <button
                        onClick={addArchiveDocument}
                        className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <FilePlus className="w-4 h-4" />
                        <span>Archiver</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= PHASE 05: BORDEREAU DES PRIX GENERATOR ================= */}
              {activeSubTab === "bordereau" && selectedProject && renderBordereauPrixContent(selectedProject)}

              {/* Created/Updated indicators */}
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono mt-4">
                <span>Créé le : {new Date(selectedProject.createdAt || Date.now()).toLocaleDateString("fr-FR")}</span>
                <span>Mis à jour : {new Date(selectedProject.updatedAt || Date.now()).toLocaleString("fr-FR")}</span>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center text-slate-400 space-y-4">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="font-bold">Aucun ouvrage sélectionné. Veuillez en sélectionner un dans la barre d'ouvrages ci-dessus.</p>
          </div>
        )}
      </div>
  </motion.div>
                );
              })()}
</AnimatePresence>

          {/* Printable Official BPU Modal overlay */}
          {showPrintBordereauModal && selectedProject && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-8 flex flex-col justify-between space-y-6">
                {/* Print area */}
                <div id="printable-bordereau" className="space-y-6 text-left text-slate-800 p-6 border border-slate-100 rounded-2xl bg-white shadow-xs">
                  {/* Sonelgaz header */}
                  <div className="flex justify-between items-center border-b-2 border-[#007ac3] pb-3 mb-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={defaultLogo}
                        alt="Sonelgaz Logo Officiel"
                        className="h-14 max-h-16 w-auto object-contain select-none"
                        onError={(e) => {
                          e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/e/ec/Logo_Sonelgaz.svg";
                        }}
                      />
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-[10px] uppercase tracking-wider text-[#007ac3]">Société Algérienne de l'Électricité et du Gaz</p>
                        <p className="font-black text-xs text-[#007ac3] uppercase tracking-widest">SONELGAZ – TRANSPORT DU GAZ</p>
                        <p className="text-[9px] font-bold text-slate-600 uppercase">Direction Régionale du Transport Gaz</p>
                        <p className="text-[9px] font-medium text-slate-500">Division Engineering et Travaux Neufs (DETN)</p>
                      </div>
                    </div>
                    <div className="text-right text-[9px] font-mono text-slate-500 space-y-0.5">
                      <p className="font-bold text-slate-700">Réf: SNG/DRTG/DETN/{new Date().getFullYear()}/BPU</p>
                      <p>Date: {new Date().toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>

                  {/* Document title */}
                  <div className="text-center py-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-y border-slate-300 py-2">
                      Bordereau Estimatif et Quantitatif (B.E.Q)
                    </h3>
                    <p className="text-[10px] font-bold uppercase text-rose-600 mt-1">
                      {bordereauActivePart === "01" ? "Partie 01 : Bureau d'Études (BE)" :
                       bordereauActivePart === "02" ? "Partie 02 : Expertise & Contrôle Technique (GEF / CND)" :
                       "Partie 03 : Travaux de Réalisation (Génie Civil & Montage)"}
                    </p>
                  </div>

                  {/* Project Info Panel */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4 text-[11px]">
                    <div>
                      <p className="font-bold text-slate-500">Ouvrage : <span className="font-black text-slate-800">{selectedProject.name}</span></p>
                      <p className="font-bold text-slate-500">Localisation : <span className="font-black text-slate-800">{selectedProject.identity.wilaya} (Pôle {selectedProject.identity.pole || "N/A"})</span></p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-500">Caractéristiques : <span className="font-black text-slate-800">DN {diamNum}" • Longueur {longNum} km</span></p>
                      <p className="font-bold text-slate-500">Cadre d'inscription : <span className="font-black text-slate-800">{selectedProject.identity.cadreInscription || "N/A"}</span></p>
                    </div>
                  </div>

                  {/* Table */}
                  <table className="w-full text-left border-collapse text-[10px] border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-extrabold text-slate-700">
                        <th className="py-2 px-2.5 border-r border-slate-300 w-10 text-center">Item</th>
                        <th className="py-2 px-2.5 border-r border-slate-300">Désignation des prestations</th>
                        <th className="py-2 px-2 border-r border-slate-300 w-10 text-center">Unité</th>
                        <th className="py-2 px-2 border-r border-slate-300 w-16 text-center">Qté</th>
                        <th className="py-2 px-2.5 border-r border-slate-300 w-24 text-right">P.U (DA)</th>
                        <th className="py-2 px-2.5 text-right w-28">Montant HT (DA)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {(bordereauActivePart === "01" ? etudeItems : 
                        bordereauActivePart === "02" ? expertItems : 
                        travauxItems).map((item) => {
                        const cost = item.qty * item.price;
                        return (
                          <tr key={item.id}>
                            <td className="py-2 px-2.5 border-r border-slate-300 text-center font-mono text-slate-500">{item.code}</td>
                            <td className="py-2 px-2.5 border-r border-slate-300 font-bold">{item.designation}</td>
                            <td className="py-2 px-2 border-r border-slate-300 text-center font-bold text-slate-500">{item.unit}</td>
                            <td className="py-2 px-2 border-r border-slate-300 text-center font-mono font-bold">{item.qty}</td>
                            <td className="py-2 px-2.5 border-r border-slate-300 text-right font-mono">
                              {new Intl.NumberFormat("fr-DZ", { minimumFractionDigits: 0 }).format(item.price)}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-black">
                              {new Intl.NumberFormat("fr-DZ", { minimumFractionDigits: 0 }).format(cost)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-300 font-black text-slate-900 text-[11px]">
                        <td colSpan={5} className="py-2 px-2.5 border-r border-slate-300 text-right uppercase">TOTAL GENERAL HT :</td>
                        <td className="py-2 px-2.5 text-right font-mono">
                          {new Intl.NumberFormat("fr-DZ", { minimumFractionDigits: 0 }).format(
                            (bordereauActivePart === "01" ? etudeItems : bordereauActivePart === "02" ? expertItems : travauxItems)
                              .reduce((acc, item) => acc + (item.qty * item.price), 0)
                          )} DA
                        </td>
                      </tr>
                      <tr className="bg-slate-50 font-black text-slate-900 text-[11px]">
                        <td colSpan={5} className="py-2 px-2.5 border-r border-slate-300 text-right uppercase">TVA REGLEMENTAIRE (19%) :</td>
                        <td className="py-2 px-2.5 text-right font-mono">
                          {new Intl.NumberFormat("fr-DZ", { minimumFractionDigits: 0 }).format(
                            (bordereauActivePart === "01" ? etudeItems : bordereauActivePart === "02" ? expertItems : travauxItems)
                              .reduce((acc, item) => acc + (item.qty * item.price), 0) * 0.19
                          )} DA
                        </td>
                      </tr>
                      <tr className="bg-rose-50 font-black text-slate-950 text-[11px] border-t border-slate-400">
                        <td colSpan={5} className="py-2 px-2.5 border-r border-slate-300 text-right uppercase">MONTANT TOTAL ESTIMÉ TTC :</td>
                        <td className="py-2 px-2.5 text-right font-mono text-rose-700 font-black text-xs">
                          {new Intl.NumberFormat("fr-DZ", { minimumFractionDigits: 0 }).format(
                            (bordereauActivePart === "01" ? etudeItems : bordereauActivePart === "02" ? expertItems : travauxItems)
                              .reduce((acc, item) => acc + (item.qty * item.price), 0) * 1.19
                          )} DA
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Signatures block */}
                  <div className="grid grid-cols-2 gap-8 pt-6 text-[11px]">
                    <div className="border border-slate-200 p-4 rounded-xl text-center space-y-12 bg-slate-50/50">
                      <p className="font-extrabold text-slate-600">Le Partenaire Contractant / L'Entreprise</p>
                      <p className="text-[9px] text-slate-400 italic">(Nom, Cachet et Signature précédés de la mention "Lu et approuvé")</p>
                    </div>
                    <div className="border border-slate-200 p-4 rounded-xl text-center space-y-12 bg-slate-50/50">
                      <p className="font-extrabold text-slate-600">Pour Sonelgaz / Division Engineering (DETN)</p>
                      <p className="text-[9px] text-slate-400 italic">(Visa pour validation technique réglementaire)</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setShowPrintBordereauModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors text-xs"
                  >
                    Fermer la prévisualisation
                  </button>
                  <button
                    onClick={() => {
                      const printContents = document.getElementById("printable-bordereau")?.innerHTML;
                      if (printContents) {
                        const win = window.open("", "_blank");
                        if (win) {
                          win.document.write(`
                            <html>
                              <head>
                                <title>Sonelgaz BPU - ${selectedProject.name}</title>
                                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                                <style>
                                  body { padding: 40px; font-family: system-ui, sans-serif; background-color: #fff; color: #1e293b; }
                                  table { border-collapse: collapse; width: 100%; margin-top: 15px; margin-bottom: 15px; }
                                  th, td { border: 1px solid #94a3b8; padding: 8px; text-align: left; font-size: 10px; }
                                  th { background-color: #f1f5f9; font-weight: bold; }
                                  .text-right { text-align: right; }
                                  .text-center { text-align: center; }
                                  .font-black { font-weight: 900; }
                                  .font-bold { font-weight: 700; }
                                  .font-mono { font-family: monospace; }
                                  .bg-rose-50 { background-color: #fff1f2; }
                                  .text-rose-700 { color: #be123c; }
                                </style>
                              </head>
                              <body>
                                ${printContents}
                                <script>window.onload = function() { window.print(); window.close(); }</script>
                              </body>
                            </html>
                          `);
                          win.document.close();
                        } else {
                          window.print();
                        }
                      }
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-2 shadow-md text-xs"
                  >
                    <FileText className="w-4 h-4" />
                    Lancer l'impression officielle
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Delete Confirmation Modal */}
          {projectToDelete && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 animate-fade-in text-left">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <h3 className="font-black text-sm uppercase tracking-wide">Suppression de Projet</h3>
                  </div>
                  <button 
                    onClick={() => setProjectToDelete(null)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <p className="text-xs font-black text-slate-700 mb-1">
                    Ouvrage : {projects.find(p => p.id === projectToDelete)?.name}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Êtes-vous sûr de vouloir supprimer définitivement ce projet ? Cette action est irréversible et détruira toutes les données associées de manière définitive.
                  </p>
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const id = projectToDelete;
                      setProjectToDelete(null);
                      await deleteProject(id);
                    }}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmer la suppression</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Recherche et Ajout de Chargé de Projet */}
          {isCPSearchOpen && editProjectData && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 animate-fade-in text-left">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Search className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-wide">
                        Recherche ({cpSearchType === "travaux" ? "CP Travaux" : cpSearchType === "etude" ? "CP Étude" : cpSearchType === "expertise" ? "Chargé Expertise & Indemnisation" : "Superviseur"})
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold">Sélectionner un compte d'utilisateur parmi le personnel enregistré</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsCPSearchOpen(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Champ de recherche */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email, structure, pôle..."
                    value={cpSearchQuery}
                    onChange={(e) => setCpSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-10 py-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                    autoFocus
                  />
                  {cpSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCpSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:text-slate-600 text-slate-400 font-extrabold text-xs bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Liste des comptes filtrés */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[250px] max-h-[400px]">
                  {(() => {
                    const query = cpSearchQuery.trim().toLowerCase();
                    const filteredProfiles = profilesList.filter(prof => {
                      if (!query) return true;
                      return (
                        (prof.name || "").toLowerCase().includes(query) ||
                        (prof.email || "").toLowerCase().includes(query) ||
                        (prof.structure || "").toLowerCase().includes(query) ||
                        (prof.pole || "").toLowerCase().includes(query) ||
                        (prof.role || "").toLowerCase().includes(query)
                      );
                    });

                    if (filteredProfiles.length === 0) {
                      return (
                        <div className="py-12 text-center text-slate-400 text-xs italic font-medium">
                          Aucun compte ne correspond à votre recherche.
                        </div>
                      );
                    }

                    return filteredProfiles.map(prof => {
                      // Check if already added to the corresponding category
                      const alreadyAdded = cpSearchType === "travaux"
                        ? (editProjectData.chefsDeProjetTravaux || []).some(item => item.uid === prof.id)
                        : cpSearchType === "etude"
                        ? (editProjectData.chefsDeProjetEtude || []).some(item => item.uid === prof.id)
                        : cpSearchType === "expertise"
                        ? (editProjectData.chefsDeProjetExpertise || []).some(item => item.uid === prof.id)
                        : (editProjectData.superviseurs || []).some(item => item.uid === prof.id);

                      return (
                        <div 
                          key={prof.id} 
                          className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-slate-800 truncate">{prof.name}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 font-bold mt-0.5">
                              {prof.email && <span className="truncate">📧 {prof.email}</span>}
                              {prof.structure && <span className="truncate">🏢 {prof.structure}</span>}
                              {prof.pole && <span className="truncate text-blue-600">📍 Pôle: {prof.pole}</span>}
                            </div>
                          </div>

                          <div>
                            {alreadyAdded ? (
                              <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-150 rounded-xl text-[10px] font-black uppercase tracking-wide">
                                Déjà ajouté
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const newItem = {
                                    uid: prof.id,
                                    name: prof.name,
                                    email: prof.email || "",
                                    structure: prof.structure || ""
                                  };

                                  if (cpSearchType === "travaux") {
                                    const currentList = editProjectData.chefsDeProjetTravaux || [];
                                    const newList = [...currentList, newItem];
                                    setEditProjectData({
                                      ...editProjectData,
                                      chefsDeProjetTravaux: newList,
                                      chefDeProjetUid: newList[0]?.uid || "",
                                      chefDeProjetName: newList[0]?.name || "",
                                      chefDeProjetEmail: newList[0]?.email || "",
                                      chefDeProjetStructure: newList[0]?.structure || ""
                                    });
                                  } else if (cpSearchType === "etude") {
                                    const currentList = editProjectData.chefsDeProjetEtude || [];
                                    const newList = [...currentList, newItem];
                                    setEditProjectData({
                                      ...editProjectData,
                                      chefsDeProjetEtude: newList,
                                      chefDeProjetEtudeUid: newList[0]?.uid || "",
                                      chefDeProjetEtudeName: newList[0]?.name || "",
                                      chefDeProjetEtudeEmail: newList[0]?.email || "",
                                      chefDeProjetEtudeStructure: newList[0]?.structure || ""
                                    });
                                  } else if (cpSearchType === "expertise") {
                                    const currentList = editProjectData.chefsDeProjetExpertise || [];
                                    const newList = [...currentList, newItem];
                                    setEditProjectData({
                                      ...editProjectData,
                                      chefsDeProjetExpertise: newList
                                    });
                                  } else {
                                    const currentList = editProjectData.superviseurs || [];
                                    const newList = [...currentList, newItem];
                                    setEditProjectData({
                                      ...editProjectData,
                                      superviseurs: newList,
                                      superviseurUid: newList[0]?.uid || "",
                                      superviseurName: newList[0]?.name || "",
                                      superviseurEmail: newList[0]?.email || "",
                                      superviseurStructure: newList[0]?.structure || ""
                                    });
                                  }
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                              >
                                + Ajouter
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400">Total : {profilesList.length} comptes enregistrés</span>
                  <button
                    type="button"
                    onClick={() => setIsCPSearchOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
</div>
</div>
</div>
  );
}
