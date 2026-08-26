/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { FASCICULES_DATA } from "./data/fascicules";
import { NetworkAnimation } from "./components/NetworkAnimation";

import InteractiveDiagrams from "./components/InteractiveDiagrams";
import Calculators from "./components/Calculators";
import Forms from "./components/Forms";
import AIAssistant from "./components/AIAssistant";
import ProjectManagement from "./components/ProjectManagement";
import DriveLinkConverter from "./components/DriveLinkConverter";
import { motion, AnimatePresence } from "motion/react";
import { auth, db, activeConfig, createNotification } from "./lib/firebase";
import { initializeApp } from "firebase/app";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  getAuth
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, onSnapshot, deleteDoc, query, where, getDocs } from "firebase/firestore";
import {
  User,
  Lock,
  Unlock,
  Shield,
  Key,
  LogOut,
  SlidersHorizontal,
  History,
  CheckCircle,
  FolderOpen,
  Bell,
  Check,
  Calendar,
  Filter,
  Briefcase,
  BarChart3,
  LogIn,
  Users,
  Activity
} from "lucide-react";
import {
  BookOpen,
  Search,
  Calculator,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Flame,
  Info,
  Layers,
  Award,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  UploadCloud,
  AlertCircle,
  Edit3,
  Save,
  X
} from "lucide-react";

// Import local images statically to ensure proper bundling in production and offline robustness
import defaultLogo from "./assets/images/sonelgaz_logo_1783415417090.jpg";
import defaultBg from "./assets/images/sonelgaz_bg_1783414375853.jpg";
import slideDesert from "./assets/images/gazoduc_desert_sunset_1783427970931.jpg";
import slideValves from "./assets/images/gazoduc_station_valves_1783427984252.jpg";
import { GuidesTabContent } from "./components/GuidesTabContent";

// Helper to compress image files before uploading to Firestore (under 1MB constraint)
const compressImage = (file: File, maxW = 1000, maxH = 1000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG with 0.75 quality for superb quality but small weight (< 150KB)
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        reject(new Error("Erreur de chargement de l'image."));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

const SLIDES_DATA = [
  {
    image: slideDesert,
    badge: "Développement • Réseau Gaz",
    title: "Planification & Extension du Réseau",
    desc: "Suivi technique et réglementaire des travaux d'extension, de raccordement et de pose des conduites de gaz à travers l'Algérie."
  },
  {
    image: slideValves,
    badge: "Postes de Distribution & Régulation",
    title: "Ouvrages Annexes & Sécurité",
    desc: "Spécifications d'implantation des postes de distribution publique, détentes, vannes de sectionnement et raccordement au réseau de gaz."
  },
  {
    image: defaultBg,
    badge: "Normes & Guides Travaux",
    title: "Guide de Référence Technique Gaz",
    desc: "Plateforme numérique interactive pour accompagner les ingénieurs dans l'étude, l'approbation et le contrôle des travaux gaz."
  }
];

const defaultSlideImages = [slideDesert, slideValves, defaultBg];

const resolveSlideImage = (slideImg: string | undefined, index: number) => {
  if (!slideImg || typeof slideImg !== "string" || slideImg.trim() === "" || slideImg.startsWith("/src/assets/")) {
    if (slideImg?.includes("gazoduc_desert") || slideImg?.includes("desert")) return slideDesert;
    if (slideImg?.includes("gazoduc_station") || slideImg?.includes("valves")) return slideValves;
    if (slideImg?.includes("sonelgaz_bg") || slideImg?.includes("bg")) return defaultBg;
    return defaultSlideImages[index % defaultSlideImages.length];
  }
  return slideImg;
};

const resolveBrandingBg = (bg: string | undefined) => {
  if (!bg || typeof bg !== "string" || bg.trim() === "" || bg.startsWith("/src/assets/")) return defaultBg;
  return bg;
};

export default function App() {
  // Dynamic branding state with default robust fallbacks
  const [branding, setBranding] = useState<{
    logo: string;
    welcome_bg: string;
    splash_bg: string;
  }>({
    logo: defaultLogo,
    welcome_bg: defaultBg,
    splash_bg: defaultBg,
  });

  const [widgetConfig, setWidgetConfig] = useState<{
    widget2Enabled: boolean;
    widget3Enabled: boolean;
    widget4Enabled: boolean;
  }>({
    widget2Enabled: true,
    widget3Enabled: true,
    widget4Enabled: true,
  });

  // Real-time synchronization of home widgets configuration from Firebase Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "widgets"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setWidgetConfig({
          widget2Enabled: data.widget2Enabled !== false,
          widget3Enabled: data.widget3Enabled !== false,
          widget4Enabled: data.widget4Enabled !== false,
        });
      } else {
        setWidgetConfig({
          widget2Enabled: true,
          widget3Enabled: true,
          widget4Enabled: true,
        });
      }
    }, (error) => {
      console.warn("Failed to listen to widgets config in Firestore:", error);
    });
    return () => unsubscribe();
  }, []);

  // Real-time synchronization of home page custom slides from Firestore
  const [slides, setSlides] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "slides"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort by order ascending
      list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      setSlides(list);
    }, (error) => {
      console.warn("Failed to listen to slides in Firestore:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleWidget = async (widgetId: "widget2" | "widget3" | "widget4") => {
    const key = `${widgetId}Enabled` as const;
    const newVal = !widgetConfig[key];
    try {
      await setDoc(doc(db, "settings", "widgets"), {
        [key]: newVal
      }, { merge: true });
    } catch (err) {
      console.error(`Error toggling ${widgetId}:`, err);
    }
  };

  const [allProjects, setAllProjects] = useState<any[]>([]);

  // Sync projects from Firestore for user visibility and homepage statistics
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "projects"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAllProjects(list);
    });
    return () => unsubscribe();
  }, []);

  // Real-time synchronization of custom application branding from Firebase Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "branding"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBranding({
          logo: data.logo || defaultLogo,
          welcome_bg: resolveBrandingBg(data.welcome_bg),
          splash_bg: resolveBrandingBg(data.splash_bg),
        });
      } else {
        setBranding({
          logo: defaultLogo,
          welcome_bg: defaultBg,
          splash_bg: defaultBg,
        });
      }
    }, (error) => {
      console.warn("Failed to listen to branding snapshot in Firestore:", error);
    });
    return () => unsubscribe();
  }, []);

  const [hasEntered, setHasEntered] = useState(false);
  const [activeTab, setActiveTab] = useState<"accueil" | "docs_plans" | "gestion_projet" | "calculateurs" | "pv" | "assistant" | "profil" | "guides">("accueil");
  const [isReaderActive, setIsReaderActive] = useState(false);
  
  // Slide Carousel States for Homepage (Diaporama Gazoduc)
  const [currentSlide, setCurrentSlide] = useState(0);

  // Authentication & Profiles State
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(() => {
    try {
      const saved = localStorage.getItem("sonelgaz_user_profile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Load notifications from Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, "notifications"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort notifications by timestamp descending (most recent first)
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(list);
    }, (err) => {
      console.error("Error loading notifications:", err);
    });
    return () => unsubscribe();
  }, []);

  // Automated monthly archiving check and notification generation
  useEffect(() => {
    if (!userProfile || (userProfile.role !== "Super Administrateur" && userProfile.role !== "Administrateur" && userProfile.role !== "Directeur / Gérant")) {
      return;
    }

    const checkAndGenerateMonthlyNotification = async () => {
      try {
        const currentYearMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-07"
        const currentMonthLabel = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
        const notifId = `archive_${currentYearMonth}`;

        const docRef = doc(db, "notifications", notifId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          const monthlyNotif = {
            projectId: notifId,
            projectName: "Rapports Mensuels d'Archivage",
            category: "assignment",
            message: `📂 [RAPPEL MENSUEL - ARCHIVAGE] Bonjour, veuillez compiler et télécharger l'état d'avancement par projet ainsi que le plan de charge du mois de ${currentMonthLabel} pour archivage physique de sauvegarde (Word et PDF) sur PC.`,
            authorName: "Système de Planification",
            authorEmail: "systeme@sonelgaz.dz",
            authorRole: "Planificateur Central",
            timestamp: new Date().toISOString(),
            readBy: []
          };
          await setDoc(docRef, monthlyNotif);
          console.log(`Monthly archiving notification created: ${notifId}`);
        }
      } catch (err) {
        console.warn("Could not check/generate monthly archiving notification:", err);
      }
    };

    checkAndGenerateMonthlyNotification();
  }, [userProfile]);

  const handleAppLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.warn("Standard Firebase signOut warning:", err);
    }
    setUserProfile(null);
  };

  // Session tracking to enforce single active session per user
  const browserSessionId = useRef<string>(
    Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
  ).current;
  const [sessionConflict, setSessionConflict] = useState<boolean>(false);

  useEffect(() => {
    if (!userProfile?.uid) {
      setSessionConflict(false);
      return;
    }

    const profileRef = doc(db, "profiles", userProfile.uid);
    
    // Set this browser session as active in Firestore
    const registerSession = async () => {
      try {
        await setDoc(profileRef, { activeSessionId: browserSessionId }, { merge: true });
      } catch (err) {
        console.warn("Could not register session in Firestore (possibly offline or read-only):", err);
      }
    };
    
    registerSession();

    // Listen to changes on user's profile to detect if another session has logged in
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.activeSessionId && data.activeSessionId !== browserSessionId) {
          setSessionConflict(true);
        }
      }
    }, (err) => {
      console.warn("Error watching session state from Firestore:", err);
    });

    return () => {
      unsubscribe();
    };
  }, [userProfile?.uid, browserSessionId]);

  // Sync userProfile with localStorage for persistence (especially virtual accounts)
  useEffect(() => {
    try {
      if (userProfile) {
        localStorage.setItem("sonelgaz_user_profile", JSON.stringify(userProfile));
      } else {
        localStorage.removeItem("sonelgaz_user_profile");
      }
    } catch (err) {
      console.warn("Could not save profile to localStorage:", err);
    }
  }, [userProfile]);

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isSuperAdminEmail = currentUser.email?.toLowerCase() === "boudjada.youcef@gmail.com";
        try {
          const profileDoc = await getDoc(doc(db, "profiles", currentUser.uid));
          if (profileDoc.exists()) {
            const profileData = profileDoc.data();
            // Assurer que le compte de boudjada.youcef@gmail.com est toujours Super Administrateur
            if (isSuperAdminEmail && profileData.role !== "Super Administrateur") {
              profileData.role = "Super Administrateur";
              try {
                await setDoc(doc(db, "profiles", currentUser.uid), { ...profileData, role: "Super Administrateur" }, { merge: true });
              } catch (writeErr) {
                console.warn("Could not auto-promote admin profile in Firestore:", writeErr);
              }
            }
            setUserProfile(profileData);
          } else {
            // Create user profile on the fly if it doesn't exist
            const defaultRole = isSuperAdminEmail ? "Super Administrateur" : "Utilisateur";
            const newProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || (isSuperAdminEmail ? "Youcef Boudjada" : currentUser.email?.split("@")[0] || "Ingénieur"),
              email: currentUser.email || "",
              role: defaultRole,
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(doc(db, "profiles", currentUser.uid), newProfile);
            } catch (writeErr) {
              console.warn("Could not write profile to Firestore (using offline mode):", writeErr);
            }
            setUserProfile(newProfile);
          }
        } catch (err) {
          console.warn("Error fetching profile from Firestore (using local fallback profile):", err);
          
          // Generate a highly robust offline/local fallback profile so the user is never locked out
          const defaultRole = isSuperAdminEmail ? "Super Administrateur" : "Utilisateur";
          const fallbackProfile = {
            uid: currentUser.uid,
            name: currentUser.displayName || (isSuperAdminEmail ? "Youcef Boudjada" : currentUser.email?.split("@")[0] || "Ingénieur"),
            email: currentUser.email || "",
            role: defaultRole,
            createdAt: new Date().toISOString(),
            isOfflineFallback: true
          };
          setUserProfile(fallbackProfile);
        }
      } else {
        // If there's no standard active Firebase user, but we have a persisted virtual user profile,
        // do NOT clear it! This prevents automatic logout of virtual users.
        setUserProfile((prev: any) => {
          if (prev && prev.isVirtual) {
            return prev;
          }
          return null;
        });
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Log user connection for stats
  useEffect(() => {
    if (userProfile && userProfile.uid) {
      const uid = userProfile.uid;
      const lastLoggedSession = sessionStorage.getItem(`logged_session_${uid}`);
      if (!lastLoggedSession) {
        try {
          const logRef = doc(collection(db, "connection_logs"));
          const logId = logRef.id;
          const newLog = {
            id: logId,
            userId: uid,
            userName: userProfile.name || "Utilisateur anonyme",
            userEmail: userProfile.email || "",
            userRole: userProfile.role || "Utilisateur",
            userStructure: userProfile.structure || "Non spécifié",
            userPole: userProfile.pole || "Non spécifié",
            userDirection: userProfile.direction || "Non spécifié",
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          };
          
          setDoc(doc(db, "connection_logs", logId), newLog)
            .then(() => {
              sessionStorage.setItem(`logged_session_${uid}`, "true");
            })
            .catch((err) => {
              console.warn("Could not write connection log to Firestore:", err);
            });
        } catch (e) {
          console.warn("Error preparing connection log:", e);
        }
      }
    }
  }, [userProfile]);

  // Compute isAdmin flag based on profile role or email
  const isAdmin = userProfile?.role === "Administrateur" || userProfile?.role === "Super Administrateur" || userProfile?.email?.toLowerCase() === "boudjada.youcef@gmail.com";
  const isSuperAdmin = userProfile?.role === "Super Administrateur" || userProfile?.email?.toLowerCase() === "boudjada.youcef@gmail.com";

  const hasAppPrivilege = (privilegeKey: string): boolean => {
    if (isAdmin) return true;
    if (userProfile?.privileges) {
      return userProfile.privileges[privilegeKey] !== false;
    }
    return true;
  };

  // States for Quick Plan Editor (Admin)
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [isQuickPlanModalOpen, setIsQuickPlanModalOpen] = useState(false);
  const [quickPlanEditing, setQuickPlanEditing] = useState<any | null>(null);
  const [quickPlanTitle, setQuickPlanTitle] = useState("");
  const [quickPlanCaption, setQuickPlanCaption] = useState("");
  const [quickPlanSrc, setQuickPlanSrc] = useState("");
  const [quickPlanFascicule, setQuickPlanFascicule] = useState("");
  const [quickPlanPage, setQuickPlanPage] = useState<number>(1);
  const [quickPlanError, setQuickPlanError] = useState<string | null>(null);
  const [quickPlanSuccess, setQuickPlanSuccess] = useState(false);
  const [quickPlanLoading, setQuickPlanLoading] = useState(false);

  // Sync plans in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "plans"), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setDbPlans(list);
    }, (err) => {
      console.warn("Firestore loading error in App.tsx (using static fallback): ", err);
    });
    return () => unsubscribe();
  }, []);

  // Quick Plan Save / Update
  const handleSaveQuickPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPlanTitle.trim() || !quickPlanSrc.trim()) {
      setQuickPlanError("Le titre et l'image/URL sont obligatoires.");
      return;
    }
    setQuickPlanLoading(true);
    setQuickPlanError(null);
    setQuickPlanSuccess(false);

    try {
      const planId = quickPlanEditing?.id || `plan_${Date.now()}`;
      
      const planData = {
        id: planId,
        title: quickPlanTitle.trim(),
        caption: quickPlanCaption.trim(),
        src: quickPlanSrc.trim(),
        fascicule: quickPlanFascicule,
        page: Number(quickPlanPage),
        category: quickPlanEditing?.category || "Ligne courante",
        tags: quickPlanEditing?.tags || ["mise_a_jour", "terrain", "chantier"],
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || "Admin"
      };

      await setDoc(doc(db, "plans", planId), planData);
      setQuickPlanSuccess(true);
      setTimeout(() => {
        setIsQuickPlanModalOpen(false);
        setQuickPlanSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error saving quick plan:", err);
      setQuickPlanError(err.message || "Erreur de synchronisation avec Firestore.");
    } finally {
      setQuickPlanLoading(false);
    }
  };

  // Quick Plan Delete
  const handleDeleteQuickPlan = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce schéma de la base ?")) {
      return;
    }
    setQuickPlanLoading(true);
    try {
      await deleteDoc(doc(db, "plans", id));
      setIsQuickPlanModalOpen(false);
    } catch (err: any) {
      console.error("Error deleting plan:", err);
      alert("Erreur lors de la suppression: " + err.message);
    } finally {
      setQuickPlanLoading(false);
    }
  };

  // File Drag-and-Drop / Base64 Reader
  const handleQuickPlanFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processQuickFile(file);
    }
  };

  const handleQuickPlanFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processQuickFile(file);
    }
  };

  const processQuickFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setQuickPlanError("Seuls les fichiers d'images (.png, .jpg, .jpeg, .svg) sont acceptés.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setQuickPlanError("La taille de l'image ne doit pas dépasser 2 Mo pour l'hébergement cloud.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setQuickPlanSrc(event.target.result as string);
        setQuickPlanError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFasciculeId, setSelectedFasciculeId] = useState("fascicule_01");
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; caption: string; page: number } | null>(null);
  const [pageReaderMode, setPageReaderMode] = useState(false);
  const [currentPageNum, setCurrentPageNum] = useState<number | null>(null);
  const [selectedSectionDetails, setSelectedSectionDetails] = useState<any | null>(null);
  const [checklistStatus, setChecklistStatus] = useState<{[key: string]: boolean}>({});

  const toggleChecklistItem = (sectionId: string, itemIndex: number) => {
    const key = `${sectionId}-${itemIndex}`;
    setChecklistStatus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getChecklistProgress = (section: any) => {
    if (!section.qaqcChecklist) return 0;
    const items = section.qaqcChecklist;
    const checkedCount = items.filter((_: any, idx: number) => checklistStatus[`${section.id}-${idx}`]).length;
    return Math.round((checkedCount / items.length) * 100);
  };

  // Auto-play the diaporama slides on the home page
  useEffect(() => {
    if (activeTab !== "accueil" || !hasEntered) return;
    const totalSlides = slides.length > 0 ? slides.length : SLIDES_DATA.length;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeTab, hasEntered, slides]);

  // High-fidelity image preview states (Zoom, Pan, Drag)
  const [previewScale, setPreviewScale] = useState(1);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [previewIsDragging, setPreviewIsDragging] = useState(false);
  const [previewDragStart, setPreviewDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setPreviewScale((prev) => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setPreviewScale((prev) => Math.max(prev - 0.5, 1));
  const handleResetZoom = () => {
    setPreviewScale(1);
    setPreviewPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (previewScale <= 1) return;
    setPreviewIsDragging(true);
    setPreviewDragStart({ x: e.clientX - previewPosition.x, y: e.clientY - previewPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!previewIsDragging) return;
    setPreviewPosition({
      x: e.clientX - previewDragStart.x,
      y: e.clientY - previewDragStart.y,
    });
  };

  const handleMouseUp = () => {
    setPreviewIsDragging(false);
  };

  const closePreview = () => {
    setPreviewImage(null);
    setPreviewScale(1);
    setPreviewPosition({ x: 0, y: 0 });
  };

  // Search filter
  const filteredResults = searchQuery
    ? FASCICULES_DATA.flatMap((f) =>
        f.sections
          .filter(
            (s) =>
              s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((s) => ({ ...s, fasciculeNumber: f.number, fasciculeTitle: f.title, fasciculeId: f.id }))
      )
    : [];

  const handleSelectFascicule = (id: string) => {
    setSelectedFasciculeId(id);
    setIsReaderActive(true);
    setActiveTab("docs_plans");
  };

  const selectedFascicule = FASCICULES_DATA.find((f) => f.id === selectedFasciculeId)!;

  // Filter notifications for the current user's assigned poles/directions and count unread
  const loggedInUserPoles = userProfile?.assignedPoles || (userProfile?.pole ? [userProfile.pole] : []);
  const loggedInUserDirections = userProfile?.assignedDirections || (userProfile?.direction ? [userProfile.direction] : []);

  const appVisibleNotifications = notifications.filter(notif => {
    if (isSuperAdmin) return true;
    const matchPole = !notif.pole || isUserPolesMatched(loggedInUserPoles, notif.pole);
    const matchDir = !notif.region || isUserDirectionsMatched(loggedInUserDirections, notif.region);
    return matchPole && matchDir;
  });

  const unreadNotificationsCount = appVisibleNotifications.filter(n => userProfile?.uid && !(n.readBy || []).includes(userProfile.uid)).length;

  const handleMarkAsRead = async (notifId: string) => {
    if (!userProfile?.uid) return;
    try {
      const notifRef = doc(db, "notifications", notifId);
      const targetNotif = notifications.find(n => n.id === notifId);
      if (targetNotif) {
        const currentReadBy = targetNotif.readBy || [];
        if (!currentReadBy.includes(userProfile.uid)) {
          await setDoc(notifRef, {
            readBy: [...currentReadBy, userProfile.uid]
          }, { merge: true });
        }
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userProfile?.uid) return;
    try {
      const unreadNotifs = appVisibleNotifications.filter(n => !(n.readBy || []).includes(userProfile.uid));
      for (const notif of unreadNotifs) {
        const notifRef = doc(db, "notifications", notif.id);
        await setDoc(notifRef, {
          readBy: [...(notif.readBy || []), userProfile.uid]
        }, { merge: true });
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  if (sessionConflict && userProfile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative text-center font-sans">
        {/* Subtle decorative background glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full filter blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-md w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-[32px] p-8 space-y-6 shadow-2xl text-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase tracking-tight text-white">
              ⚠️ Connexion Suspendue
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Une seule connexion active autorisée
            </p>
          </div>
          
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 text-xs font-semibold text-slate-300 space-y-3 leading-relaxed text-left">
            <p>
              Votre compte <strong className="text-orange-400 font-extrabold">{userProfile.email || userProfile.name}</strong> a été connecté sur un autre appareil ou navigateur.
            </p>
            <p className="text-slate-400 text-[11px]">
              Par mesure de sécurité pour préserver l'intégrité de vos actions et éviter les conflits d'édition, cette session locale a été déconnectée au profit de la nouvelle.
            </p>
          </div>
          
          <div className="pt-2">
            <button
              onClick={async () => {
                await handleAppLogout();
                setSessionConflict(false);
              }}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter de cette session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasEntered) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#020617', // bg-slate-950
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          padding: '16px',
          boxSizing: 'border-box'
        }}
        className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans relative overflow-hidden p-4"
        id="splash-screen"
      >
        {/* Full screen background image of the pipeline guide */}
        <div 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            backgroundRepeat: 'no-repeat', 
            opacity: 0.25, 
            filter: 'blur(3px)',
            transition: 'all 1s ease-in-out',
            zIndex: 1,
            backgroundImage: `url(${branding.splash_bg})`
          }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 scale-105 filter blur-[3px] transition-all duration-1000"
        />
        
        {/* Animated grid and radial gradient overlay for high contrast readability */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to top, #020617 0%, rgba(2, 6, 23, 0.85) 60%, rgba(15, 23, 42, 0.55) 100%)',
            zIndex: 10
          }}
          className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/55 z-10" 
        />
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at center, transparent 0%, rgba(2, 6, 23, 0.8) 70%, #020617 100%)',
            zIndex: 10
          }}
          className="absolute inset-0 bg-radial-at-c from-transparent via-slate-950/80 to-slate-950 z-10" 
        />
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:32px_32px] z-10" />

        <div 
          style={{ 
            position: 'relative', 
            zIndex: 20, 
            maxWidth: '1280px', 
            width: '100%', 
            boxSizing: 'border-box', 
            margin: 'auto',
            padding: '24px'
          }}
          className="relative z-20 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 md:py-12"
        >
          {/* Welcome layout: Animation Left, Message Right */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full"
          >
            {/* Left Column: Interactive RTG Network Animation */}
            <div className="lg:col-span-7 w-full">
              <NetworkAnimation />
            </div>

            {/* Right Column: Message & Branding */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
              {/* Sonelgaz Logo Icon in the Splash */}
              <div 
                style={{ 
                  width: '76px', 
                  height: '76px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  backgroundColor: '#ffffff', 
                  borderRadius: '20px', 
                  boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '6px',
                  overflow: 'hidden'
                }}
                className="w-20 h-20 bg-white rounded-2xl shadow-2xl border border-slate-200/10 p-2 flex items-center justify-center shrink-0"
              >
                <img 
                  src={branding.logo || defaultLogo} 
                  alt="Sonelgaz Logo" 
                  style={{ width: '74px', height: '74px', objectFit: 'contain', borderRadius: '14px' }}
                  className="w-full h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = defaultLogo; }}
                />
              </div>

              <div className="space-y-4">
                <span 
                  style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    backgroundColor: 'rgba(249, 115, 22, 0.2)', 
                    color: '#fb923c', 
                    fontSize: '11px',
                    fontWeight: '900',
                    letterSpacing: '0.1em',
                    borderRadius: '8px',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(249, 115, 22, 0.3)'
                  }}
                  className="inline-block px-4 py-1.5 bg-orange-500/20 text-orange-400 text-xs font-black tracking-widest rounded-lg uppercase border border-orange-500/30"
                >
                  Développement Réseau & Travaux Gaz
                </span>
                <h1 
                  style={{
                    fontSize: '28px',
                    fontWeight: '900',
                    color: '#ffffff',
                    lineHeight: '1.3',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}
                  className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-md"
                >
                  Bienvenue sur la plateforme de gestion des travaux de développement réseau TG. Guide travaux gaz
                </h1>
                <p 
                  style={{
                    fontSize: '15px',
                    color: '#cbd5e1', 
                    lineHeight: '1.6',
                    fontWeight: '500'
                  }}
                  className="text-sm md:text-base text-slate-300 leading-relaxed font-medium"
                >
                  Plateforme numérique interactive pour la planification, le suivi du développement de réseau et la réalisation des travaux de gaz.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setHasEntered(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '18px 36px',
                    backgroundColor: '#f97316', 
                    color: '#ffffff',
                    fontWeight: '900',
                    fontSize: '15px',
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 20px -3px rgba(249, 115, 22, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="group inline-flex items-center gap-2 px-9 py-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-base rounded-2xl shadow-xl shadow-orange-500/25 transition-all duration-200"
                  id="enter-app-button"
                >
                  <span>Entrer sur la plateforme</span>
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" style={{ width: '20px', height: '20px' }} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Footer Info */}
        <div 
          style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, textAlign: 'center', zIndex: 20, fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}
          className="absolute bottom-6 left-0 right-0 text-center z-20 text-[11px] text-slate-500 font-mono"
        >
          © 2026 SONELGAZ • Développement Réseau & Guide Travaux Gaz
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-orange-500 selection:text-white pb-12 relative overflow-x-hidden">
      {/* Faded watermark background of the pipeline illustration */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-[0.06] filter blur-[1px]"
        style={{ backgroundImage: `url(${branding.welcome_bg})` }}
      />
      
      {/* Header, main and modals need to reside above the background */}
      <div className="relative z-10">
      {/* Top Session & Authentication micro-bar (Epure et Discret) */}
      <div className="bg-slate-950 text-slate-300 border-b border-blue-950/60 text-[11px] py-2 relative z-50 print:hidden font-sans shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              {userProfile 
                ? `${(userProfile.role || "Ingénieur").toUpperCase()} - ${(userProfile.structure || "SONELGAZ-TRANSPORT GAZ").toUpperCase()}`
                : "SONELGAZ-TRANSPORT GAZ"
              }
            </span>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end mt-1.5 md:mt-0">
            {userProfile ? (
              <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2" id="top-user-status">
                <span className="text-slate-400">Connecté en tant que :</span>
                <button 
                  onClick={() => setActiveTab("profil")}
                  className="font-extrabold text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Accéder à mon profil"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span>{userProfile.name}</span>
                </button>
                {userProfile.role && (
                  <span className="bg-orange-500/10 text-orange-400 text-[9px] font-black px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-widest">
                    {userProfile.role}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2" id="top-login-prompt">
                <span className="text-slate-300 font-medium text-[10px] md:text-[11px]">
                  ⚠️ Vous n'êtes pas connecté. Connectez-vous :
                </span>
                <button
                  onClick={() => setActiveTab("profil")}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] px-3 py-1 rounded-lg shadow-sm shadow-orange-500/10 transition-all uppercase tracking-wider cursor-pointer active:scale-95"
                >
                  Se connecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sonelgaz Top Header Banner */}
      <header className="relative overflow-hidden bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md border-b border-blue-950 sticky top-0 z-[9999] print:hidden">
        {/* Subtle, faded industrial background picture (Sonelgaz environment) */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-15 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url(${defaultBg})` }}
        />
        {/* Soft, warm amber/orange and blue ambient glow gradient for a gentle, friendly atmosphere */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-amber-500/15 via-transparent to-blue-500/10 mix-blend-screen pointer-events-none" />
        <div className="absolute -left-16 -top-16 w-64 h-64 bg-orange-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Real Sonelgaz Corporate Logo image */}
            <div 
              style={{
                width: '48px',
                height: '48px',
                minWidth: '48px',
                minHeight: '48px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #dbeafe',
                padding: '4px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-inner border border-blue-100 relative overflow-hidden shrink-0 p-1"
            >
              <img 
                src={branding.logo || defaultLogo} 
                alt="Sonelgaz Logo" 
                width="40"
                height="40"
                style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px' }}
                className="w-full h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.src = defaultLogo; }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight">SONELGAZ • DÉVELOPPEMENT RÉSEAU</h1>
                <span className="text-[9px] font-extrabold uppercase tracking-widest bg-orange-500 text-white px-2 py-0.5 rounded-full">
                  Guide Travaux Gaz
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Plateforme de Gestion du Développement Réseau & Guide de réalisation des Travaux Gaz
              </p>
            </div>
          </div>

          {/* Navigation tabs - horizontally scrollable on mobile/tablet, wrapped on desktop */}
          <nav className="flex overflow-x-auto md:flex-wrap bg-blue-900/50 p-1 rounded-xl border border-blue-800 gap-1 max-w-full scrollbar-none snap-x">
            <button
              onClick={() => setActiveTab("accueil")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 snap-start ${
                activeTab === "accueil" ? "bg-orange-500 text-white shadow-sm" : "text-blue-100 hover:text-white"
              }`}
            >
              Accueil
            </button>
            <button
              onClick={() => {
                setActiveTab("docs_plans");
                setIsReaderActive(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 snap-start ${
                activeTab === "docs_plans" ? "bg-orange-500 text-white shadow-sm" : "text-blue-100 hover:text-white"
              }`}
            >
              Espace Documentaire / Plan interactif
            </button>
            <button
              onClick={() => setActiveTab("gestion_projet")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 snap-start ${
                activeTab === "gestion_projet" ? "bg-orange-500 text-white shadow-sm" : "text-blue-100 hover:text-white"
              }`}
            >
              Gestion de projet
            </button>
            <button
              onClick={() => setActiveTab("calculateurs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 snap-start ${
                activeTab === "calculateurs" ? "bg-orange-500 text-white shadow-sm" : "text-blue-100 hover:text-white"
              }`}
            >
              Calculateurs
            </button>
            <button
              onClick={() => setActiveTab("pv")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 snap-start ${
                activeTab === "pv" ? "bg-orange-500 text-white shadow-sm" : "text-blue-100 hover:text-white"
              }`}
            >
              PV Officiels
            </button>
            <button
              onClick={() => setActiveTab("assistant")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 snap-start ${
                activeTab === "assistant" ? "bg-orange-500 text-white shadow-sm" : "text-blue-100 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Conseiller IA</span>
            </button>
            <button
              onClick={() => setActiveTab("guides")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 snap-start ${
                activeTab === "guides" ? "bg-orange-500 text-white shadow-sm" : "text-blue-100 hover:text-white"
              }`}
              id="nav-guides-button"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guides</span>
            </button>
            <button
              onClick={() => setActiveTab("profil")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 snap-start relative ${
                activeTab === "profil" ? "bg-orange-500 text-white shadow-sm" : "text-blue-100 hover:text-white"
              }`}
              id="nav-profile-button"
            >
              <User className="w-3.5 h-3.5" />
              <span>{userProfile ? (isAdmin ? "Profil Admin" : "Mon Profil") : "Connexion"}</span>
              {userProfile && unreadNotificationsCount > 0 && (
                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-1 ring-white animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
              {userProfile && unreadNotificationsCount === 0 && (
                <span className="w-2 h-2 rounded-full bg-green-400 border border-white animate-pulse"></span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <AnimatePresence mode="wait">
          {activeTab === "accueil" && (
            <motion.div
              key="accueil"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Hero Slideshow Carousel (Diaporama) - Full Width Window Edge-to-Edge with Inner Alignment */}
              {(() => {
                const activeSlides = slides.length > 0 ? slides : SLIDES_DATA;
                const safeIdx = currentSlide >= activeSlides.length ? 0 : currentSlide;
                const currentSlideData = activeSlides[safeIdx] || SLIDES_DATA[0];
                return (
                  <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-8 overflow-hidden shadow-2xl border-b border-slate-200/10 min-h-[480px] sm:min-h-[520px] md:min-h-[560px] flex flex-col justify-end text-white bg-slate-950 select-none group/slider" id="diaporama-container">
                    {/* Background Images Layer */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={safeIdx}
                        initial={{ opacity: 0, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.65, ease: "easeInOut" }}
                        className="absolute inset-0 z-0 overflow-hidden"
                      >
                        <img
                          src={resolveSlideImage(currentSlideData.image, safeIdx)}
                          alt={currentSlideData.title || "Diaporama Sonelgaz"}
                          className="w-full h-full object-cover object-center"
                          onError={(e) => {
                            e.currentTarget.src = defaultSlideImages[safeIdx % defaultSlideImages.length];
                          }}
                        />
                      </motion.div>
                    </AnimatePresence>

                    {/* Gradient Overlay for Text Readability - Smooth subtle gradient without blocking the image */}
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

                    {/* Content Layer with internal alignment layout matching max-w-7xl */}
                    <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-20 md:pb-12 md:pt-28 space-y-6">
                      <div className="max-w-3xl space-y-4 text-left">
                        {currentSlideData.badge && (
                          <motion.span 
                            key={`badge-${safeIdx}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/95 text-white text-[10px] font-black tracking-widest rounded-lg uppercase backdrop-blur-md shadow-sm border border-orange-400/30"
                          >
                            <Flame className="w-3 h-3 text-orange-200 animate-pulse" style={{ width: '12px', height: '12px' }} />
                            <span>{currentSlideData.badge}</span>
                          </motion.span>
                        )}
                        
                        <div className="space-y-2.5">
                          <motion.h2 
                            key={`title-${safeIdx}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-2xl md:text-5xl font-black tracking-tight leading-tight uppercase font-sans text-white drop-shadow-lg"
                          >
                            {currentSlideData.title}
                          </motion.h2>
                          
                          <motion.p 
                            key={`desc-${safeIdx}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18 }}
                            className="text-xs md:text-sm text-slate-200 leading-relaxed max-w-2xl font-medium drop-shadow-md"
                          >
                            {currentSlideData.desc}
                          </motion.p>
                        </div>

                        {/* Built-in Search Engine in Hero Slider */}
                        <div className="pt-2 max-w-lg">
                          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-1 flex items-center border border-white/20 focus-within:border-orange-500 transition-all shadow-[inset_1px_1px_3px_rgba(255,255,255,0.2),_0_10px_25px_rgba(0,0,0,0.3)]">
                            <Search className="w-5 h-5 text-slate-300 ml-3.5 shrink-0" style={{ width: '20px', height: '20px' }} />
                            <input
                              type="text"
                              id="hero-search-input"
                              placeholder="Rechercher une clause, une cote, un matériau..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-transparent border-0 outline-none text-white px-3 py-2.5 placeholder-slate-300 text-xs focus:ring-0 font-medium"
                              style={{ backgroundColor: 'transparent', border: 'none', outline: 'none', color: '#ffffff', boxShadow: 'none' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Left/Right Chevron Buttons (Visible on Hover over slider bounds) */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 flex justify-between px-6 pointer-events-none">
                      <button
                        type="button"
                        onClick={() => setCurrentSlide((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1))}
                        className="p-3 rounded-full bg-slate-900/60 hover:bg-orange-500 hover:text-white text-slate-300 border border-white/10 opacity-0 group-hover/slider:opacity-100 transition-all backdrop-blur-sm cursor-pointer shadow-md active:scale-90 pointer-events-auto"
                        aria-label="Slide Précédent"
                      >
                        <ChevronLeft className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentSlide((prev) => (prev + 1) % activeSlides.length)}
                        className="p-3 rounded-full bg-slate-900/60 hover:bg-orange-500 hover:text-white text-slate-300 border border-white/10 opacity-0 group-hover/slider:opacity-100 transition-all backdrop-blur-sm cursor-pointer shadow-md active:scale-90 pointer-events-auto"
                        aria-label="Slide Suivant"
                      >
                        <ChevronRight className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                      </button>
                    </div>

                    {/* Slide Indicators Dots centered at bottom */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                      {activeSlides.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentSlide(idx)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                            safeIdx === idx ? "w-6 bg-orange-500" : "bg-white/40 hover:bg-white/70"
                          }`}
                          aria-label={`Aller au slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Search results display */}
              {searchQuery && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4 animate-fade-in">
                  <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
                    Résultats de recherche ({filteredResults.length}) :
                  </h3>
                  {filteredResults.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredResults.map((res, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelectFascicule(res.fasciculeId)}
                          className="p-4 rounded-xl border border-slate-100 hover:border-orange-200 bg-slate-50/50 hover:bg-orange-50/10 cursor-pointer transition-all flex flex-col justify-between"
                        >
                          <div>
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-wide">
                              Fascicule {res.fasciculeNumber} : {res.fasciculeTitle}
                            </span>
                            <h4 className="font-bold text-slate-800 text-sm mt-1 mb-2">{res.title}</h4>
                            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{res.content}</p>
                          </div>
                          <span className="text-[10px] font-bold text-blue-600 mt-3 inline-flex items-center gap-1 self-start">
                            <span>Voir dans le document</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">Aucun résultat trouvé pour votre recherche. Essayez avec un mot-clé comme "soudure", "peinture" ou "gaine".</p>
                  )}
                </div>
              )}

              {/* Animation Réseau RTG Gaz Algérie */}
              <div className="py-2">
                <div className="bg-slate-950 rounded-[32px] p-6 md:p-8 text-white border border-slate-800 shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none" />
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
                    {/* Left: Animation */}
                    <div className="lg:col-span-7 w-full">
                      <NetworkAnimation />
                    </div>
                    {/* Right: Message & Info */}
                    <div className="lg:col-span-5 space-y-5 text-left">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse inline-block" />
                        <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-black tracking-widest rounded-lg uppercase border border-orange-500/30">
                          Supervision Réseau Algérie
                        </span>
                      </div>
                      <h3 className="text-xl md:text-3xl font-black text-white leading-tight">
                        Animation Déploiement Réseau Gazier RTG
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        Carte interactive et simulation dynamique du maillage des gazoducs, des tronçons de canalisation et des postes de détente haute et moyenne pression.
                      </p>
                      <div className="pt-2 grid grid-cols-2 gap-3 text-xs font-mono text-slate-400">
                        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800/80">
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Gazoducs & Peignes</div>
                          <div className="text-emerald-400 font-bold text-sm">Maillage National</div>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800/80">
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Système Postes</div>
                          <div className="text-orange-400 font-bold text-sm">Détente & Raccord</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widgets d'information en temps réel (Uniquement si connecté) */}
              {userProfile && (widgetConfig.widget2Enabled || widgetConfig.widget3Enabled || widgetConfig.widget4Enabled) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4" id="home-widgets-container">
                    
                    {/* WIDGET 2: Statistiques d'Avancement Global par Phase (Wow Graphs & Badges) */}
                    {widgetConfig.widget2Enabled && (
                      <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200/70 shadow-sm space-y-6 text-left lg:col-span-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/[0.01] rounded-full filter blur-3xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                              <BarChart3 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Tableau de Bord des Phases &amp; Rendement</h3>
                              <p className="text-xs text-slate-400 font-semibold">Analyse d'avancement physique et distribution des ouvrages gaziers.</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-black px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">
                            Total : {allProjects.length} {allProjects.length > 1 ? "ouvrages" : "ouvrage"}
                          </span>
                        </div>

                        {/* Visual KPI Macarons & Interactive Circular Graphs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* Phase 1: Etudes */}
                          {(() => {
                            const count = allProjects.filter(p => p.identity?.phase === "Étude").length;
                            const pct = allProjects.length > 0 ? Math.round((count / allProjects.length) * 100) : 0;
                            const radius = 24;
                            const strokeDasharray = 2 * Math.PI * radius; // ~150.8
                            const strokeDashoffset = strokeDasharray - (strokeDasharray * pct) / 100;
                            return (
                              <div className="bg-slate-50/75 p-5 rounded-3xl border border-slate-150 flex items-center justify-between gap-4 group hover:bg-white hover:shadow-md hover:border-blue-300 transition-all duration-300 relative overflow-hidden">
                                <div className="space-y-1.5 z-10">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Phase Étude</span>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-black text-slate-800 font-mono">{count}</span>
                                    <span className="text-[10px] font-bold text-slate-400">ouvrages</span>
                                  </div>
                                  <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black rounded-full uppercase">
                                    Macaron : {pct}%
                                  </span>
                                </div>
                                <div className="relative flex items-center justify-center shrink-0">
                                  <svg className="w-16 h-16 transform -rotate-90">
                                    <circle cx="32" cy="32" r={radius} stroke="#e2e8f0" strokeWidth="4.5" fill="transparent" />
                                    <circle cx="32" cy="32" r={radius} stroke="#3b82f6" strokeWidth="4.5" fill="transparent" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000" />
                                  </svg>
                                  <span className="absolute text-[10px] font-black text-slate-600 font-mono">{pct}%</span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Phase 2: Travaux */}
                          {(() => {
                            const count = allProjects.filter(p => p.identity?.phase === "Travaux").length;
                            const pct = allProjects.length > 0 ? Math.round((count / allProjects.length) * 100) : 0;
                            const radius = 24;
                            const strokeDasharray = 2 * Math.PI * radius;
                            const strokeDashoffset = strokeDasharray - (strokeDasharray * pct) / 100;
                            return (
                              <div className="bg-slate-50/75 p-5 rounded-3xl border border-slate-150 flex items-center justify-between gap-4 group hover:bg-white hover:shadow-md hover:border-amber-300 transition-all duration-300 relative overflow-hidden">
                                <div className="space-y-1.5 z-10">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Phase Travaux</span>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-black text-slate-800 font-mono">{count}</span>
                                    <span className="text-[10px] font-bold text-slate-400">chantiers</span>
                                  </div>
                                  <span className="inline-flex px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black rounded-full uppercase">
                                    Macaron : {pct}%
                                  </span>
                                </div>
                                <div className="relative flex items-center justify-center shrink-0">
                                  <svg className="w-16 h-16 transform -rotate-90">
                                    <circle cx="32" cy="32" r={radius} stroke="#e2e8f0" strokeWidth="4.5" fill="transparent" />
                                    <circle cx="32" cy="32" r={radius} stroke="#f59e0b" strokeWidth="4.5" fill="transparent" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000" />
                                  </svg>
                                  <span className="absolute text-[10px] font-black text-slate-600 font-mono">{pct}%</span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Phase 3: Mise en Gaz */}
                          {(() => {
                            const count = allProjects.filter(p => p.identity?.phase === "Mise en Gaz").length;
                            const pct = allProjects.length > 0 ? Math.round((count / allProjects.length) * 100) : 0;
                            const radius = 24;
                            const strokeDasharray = 2 * Math.PI * radius;
                            const strokeDashoffset = strokeDasharray - (strokeDasharray * pct) / 100;
                            return (
                              <div className="bg-slate-50/75 p-5 rounded-3xl border border-slate-150 flex items-center justify-between gap-4 group hover:bg-white hover:shadow-md hover:border-orange-300 transition-all duration-300 relative overflow-hidden">
                                <div className="space-y-1.5 z-10">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Mise en Gaz</span>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-black text-slate-800 font-mono">{count}</span>
                                    <span className="text-[10px] font-bold text-slate-400">actifs</span>
                                  </div>
                                  <span className="inline-flex px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 text-[10px] font-black rounded-full uppercase">
                                    Macaron : {pct}%
                                  </span>
                                </div>
                                <div className="relative flex items-center justify-center shrink-0">
                                  <svg className="w-16 h-16 transform -rotate-90">
                                    <circle cx="32" cy="32" r={radius} stroke="#e2e8f0" strokeWidth="4.5" fill="transparent" />
                                    <circle cx="32" cy="32" r={radius} stroke="#f97316" strokeWidth="4.5" fill="transparent" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000" />
                                  </svg>
                                  <span className="absolute text-[10px] font-black text-slate-600 font-mono">{pct}%</span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Phase 4: Clôturé */}
                          {(() => {
                            const count = allProjects.filter(p => p.identity?.phase === "Clôturé").length;
                            const pct = allProjects.length > 0 ? Math.round((count / allProjects.length) * 100) : 0;
                            const radius = 24;
                            const strokeDasharray = 2 * Math.PI * radius;
                            const strokeDashoffset = strokeDasharray - (strokeDasharray * pct) / 100;
                            return (
                              <div className="bg-slate-50/75 p-5 rounded-3xl border border-slate-150 flex items-center justify-between gap-4 group hover:bg-white hover:shadow-md hover:border-green-300 transition-all duration-300 relative overflow-hidden">
                                <div className="space-y-1.5 z-10">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Archivés / Clôturés</span>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-black text-slate-800 font-mono">{count}</span>
                                    <span className="text-[10px] font-bold text-slate-400">validés</span>
                                  </div>
                                  <span className="inline-flex px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 text-[10px] font-black rounded-full uppercase">
                                    Macaron : {pct}%
                                  </span>
                                </div>
                                <div className="relative flex items-center justify-center shrink-0">
                                  <svg className="w-16 h-16 transform -rotate-90">
                                    <circle cx="32" cy="32" r={radius} stroke="#e2e8f0" strokeWidth="4.5" fill="transparent" />
                                    <circle cx="32" cy="32" r={radius} stroke="#22c55e" strokeWidth="4.5" fill="transparent" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000" />
                                  </svg>
                                  <span className="absolute text-[10px] font-black text-slate-600 font-mono">{pct}%</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Interactive Sparkline Area Graph of Project Progress Wave */}
                        {allProjects.length >= 2 && (
                          <div className="bg-slate-50 border border-slate-150 rounded-3xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">Graphe de Dispersion d'Avancement Physique</h4>
                                <p className="text-[10px] text-slate-400 font-medium">Répartition dynamique des avancements physiques des gazoducs de la base.</p>
                              </div>
                              <div className="flex gap-2">
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded">Fluide</span>
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-green-100 text-green-800 border border-green-200 rounded">Actif</span>
                              </div>
                            </div>
                            
                            <div className="h-28 w-full pt-2">
                              {(() => {
                                const w = 600;
                                const h = 90;
                                const padX = 20;
                                const padY = 10;
                                const chartW = w - 2 * padX;
                                const chartH = h - 2 * padY;
                                
                                const projsWithPhys = allProjects.map((p, idx) => ({
                                  name: p.name,
                                  phys: p.travauxPlanification?.avancementPhysique || 0,
                                  idx
                                }));
                                
                                const stepX = chartW / Math.max(1, projsWithPhys.length - 1);
                                const points = projsWithPhys.map((p, i) => {
                                  const x = padX + i * stepX;
                                  const y = h - padY - (p.phys / 100) * chartH;
                                  return `${x},${y}`;
                                }).join(" ");
                                
                                // Area points enclosing the bottom
                                const areaPoints = `${padX},${h - padY} ${points} ${padX + (projsWithPhys.length - 1) * stepX},${h - padY}`;
                                
                                return (
                                  <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
                                    <defs>
                                      <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                                      </linearGradient>
                                    </defs>
                                    {/* Grid Lines */}
                                    <line x1={padX} y1={padY} x2={w - padX} y2={padY} stroke="#e2e8f0" strokeDasharray="2,2" strokeWidth="1" />
                                    <line x1={padX} y1={padY + chartH / 2} x2={w - padX} y2={padY + chartH / 2} stroke="#e2e8f0" strokeDasharray="2,2" strokeWidth="1" />
                                    <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} stroke="#cbd5e1" strokeWidth="1" />
                                    
                                    {/* Filled Area */}
                                    <polygon points={areaPoints} fill="url(#waveGrad)" />
                                    
                                    {/* Stroke Line */}
                                    <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    
                                    {/* Data Points */}
                                    {projsWithPhys.map((p, i) => {
                                      const x = padX + i * stepX;
                                      const y = h - padY - (p.phys / 100) * chartH;
                                      return (
                                        <g key={i} className="group/dot cursor-pointer">
                                          <circle cx={x} cy={y} r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" className="hover:scale-150 transition-transform duration-200" />
                                          <title>{p.name} : {p.phys}%</title>
                                        </g>
                                      );
                                    })}
                                    
                                    {/* Axis indicators */}
                                    <text x={padX - 15} y={padY + 4} className="text-[8px] font-black fill-slate-400 font-mono text-right">100%</text>
                                    <text x={padX - 15} y={padY + chartH / 2 + 3} className="text-[8px] font-black fill-slate-400 font-mono text-right">50%</text>
                                    <text x={padX - 15} y={h - padY + 3} className="text-[8px] font-black fill-slate-400 font-mono text-right">0%</text>
                                  </svg>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Global Physical Progress metrics for Travaux phase */}
                        {(() => {
                          const travauxProjs = allProjects.filter(p => p.identity?.phase === "Travaux");
                          if (travauxProjs.length === 0) return null;
                          
                          let sumTotal = 0;
                          let sumGC = 0;
                          let sumMeca = 0;
                          let countGC = 0;
                          let countMeca = 0;
                          
                          travauxProjs.forEach(p => {
                            const phys = p.travauxPlanification?.avancementPhysique || 0;
                            sumTotal += phys;
                            
                            if (p.travauxPlanification?.avancementGC !== undefined) {
                              sumGC += p.travauxPlanification.avancementGC;
                              countGC++;
                            }
                            if (p.travauxPlanification?.avancementMeca !== undefined) {
                              sumMeca += p.travauxPlanification.avancementMeca;
                              countMeca++;
                            }
                          });
                          
                          const avgTotal = Math.round(sumTotal / travauxProjs.length);
                          const avgGC = countGC > 0 ? Math.round(sumGC / countGC) : avgTotal;
                          const avgMeca = countMeca > 0 ? Math.round(sumMeca / countMeca) : avgTotal;

                          return (
                            <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-150 flex flex-col md:flex-row gap-6 justify-between items-center relative overflow-hidden">
                              <div className="space-y-1 text-left w-full md:w-1/3">
                                <span className="text-[10px] font-black uppercase text-blue-600 block">Rendement Travaux</span>
                                <h4 className="text-xs font-black text-slate-700 uppercase">Progression Physique des Chantiers</h4>
                                <p className="text-[10px] text-slate-400 font-medium">Avancement cumulé des chantiers en cours de réalisation.</p>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full md:w-2/3">
                                {/* Total Physics */}
                                <div className="space-y-2 text-left bg-white p-3.5 rounded-2xl border border-slate-100">
                                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />Global</span>
                                    <span className="font-mono font-black text-slate-800">{avgTotal}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full" style={{ width: `${avgTotal}%` }} />
                                  </div>
                                </div>

                                {/* GC */}
                                <div className="space-y-2 text-left bg-white p-3.5 rounded-2xl border border-slate-100">
                                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Génie Civil</span>
                                    <span className="font-mono font-black text-slate-800">{avgGC}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${avgGC}%` }} />
                                  </div>
                                </div>

                                {/* Mecanique */}
                                <div className="space-y-2 text-left bg-white p-3.5 rounded-2xl border border-slate-100">
                                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Tuyauterie</span>
                                    <span className="font-mono font-black text-slate-800">{avgMeca}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full rounded-full" style={{ width: `${avgMeca}%` }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* WIDGET 3: Indicateurs Géographiques (Pôles & Wilayas) */}
                    {widgetConfig.widget3Enabled && (
                      <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200/70 shadow-sm space-y-4 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/[0.01] rounded-full filter blur-2xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100">
                              <Activity className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Répartition par Pôles Gaziers</h3>
                              <p className="text-xs text-slate-400 font-semibold">Répartition géographique et rendement par pôle régional.</p>
                            </div>
                          </div>
                        </div>

                        {allProjects.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-xs italic font-medium">
                            Aucun projet enregistré pour extraire les statistiques géographiques.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {(() => {
                              const polesToDisplay = ["Pôle Ouest", "Pôle Est", "Pôle Centre", "Pôle Nord / Sud", "Pôle Sud"];
                              const computedPoles = polesToDisplay.map(poleName => {
                                const projs = allProjects.filter(p => {
                                  const pPole = p.identity?.pole || "";
                                  return pPole.toLowerCase().includes(poleName.toLowerCase().replace("pôle ", "")) || 
                                         poleName.toLowerCase().includes(pPole.toLowerCase());
                                });

                                let avgProgress = 0;
                                if (projs.length > 0) {
                                  const sum = projs.reduce((acc, curr) => acc + (curr.travauxPlanification?.avancementPhysique || 0), 0);
                                  avgProgress = Math.round(sum / projs.length);
                                }

                                const wilayas = Array.from(new Set(projs.map(p => p.identity?.wilaya).filter(Boolean))) as string[];

                                return {
                                  name: poleName,
                                  count: projs.length,
                                  avgProgress,
                                  wilayas
                                };
                              });

                              return computedPoles.map(p => (
                                <div key={p.name} className="p-4 bg-slate-50/70 hover:bg-white border border-slate-150 hover:border-orange-300 hover:shadow-md rounded-2xl space-y-3 transition-all duration-300">
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">{p.name}</h4>
                                      <div className="flex gap-1 flex-wrap mt-1.5">
                                        {p.wilayas.length > 0 ? (
                                          p.wilayas.map(w => (
                                            <span key={w} className="text-[9px] font-black text-slate-500 bg-white border border-slate-250 px-1.5 py-0.5 rounded-md shadow-2xs">
                                              {w.split("-")[1]?.trim() || w}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-[9px] text-slate-400 italic">Aucune direction locale rattachée</span>
                                        )}
                                      </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                                      p.count > 0 
                                        ? "bg-orange-100 text-orange-700 border border-orange-200" 
                                        : "bg-slate-200/40 text-slate-400 border border-slate-200/20"
                                    }`}>
                                      {p.count} {p.count > 1 ? "Ouvrages" : "Ouvrage"}
                                    </span>
                                  </div>

                                  {p.count > 0 && (
                                    <div className="space-y-1.5 pt-1">
                                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                                        <span>Rendement d'avancement moyen</span>
                                        <span className="font-mono font-black text-orange-600">{p.avgProgress}%</span>
                                      </div>
                                      <div className="w-full bg-slate-200/40 h-2 rounded-full overflow-hidden">
                                        <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full" style={{ width: `${p.avgProgress}%` }} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ));
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* WIDGET 4: Tableau des Contraintes et Activités Récentes (Bento Layout) */}
                    {widgetConfig.widget4Enabled && (
                      <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200/70 shadow-sm space-y-4 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/[0.01] rounded-full filter blur-2xl pointer-events-none" />
                        
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                              <Briefcase className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Obstacles &amp; Flux Opérationnel</h3>
                              <p className="text-xs text-slate-400 font-semibold">Alertes de blocages techniques et journal des modifications.</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 font-sans">
                          {/* Contraintes Terrain */}
                          <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">⚠️ Obstacles techniques et administratifs</span>
                            {(() => {
                              const constrainedProjs = allProjects.filter(p => p.identity?.contraintes && p.identity.contraintes.trim() !== "" && p.identity.contraintes.toLowerCase() !== "aucune" && p.identity.contraintes.toLowerCase() !== "néant");
                              if (constrainedProjs.length === 0) {
                                return (
                                  <div className="p-4 bg-green-50/50 border border-green-200/50 rounded-2xl flex items-center gap-2.5 text-xs text-green-700 font-bold">
                                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 animate-bounce" />
                                    <span>Aucun point d'arrêt majeur signalé sur le réseau gazier.</span>
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-3">
                                  {constrainedProjs.slice(0, 3).map(p => (
                                    <div key={p.id} className="p-4 bg-red-50/50 border border-red-150 rounded-2xl space-y-2 hover:bg-white hover:shadow-sm hover:border-red-300 transition-all duration-200">
                                      <div className="flex justify-between items-center gap-2">
                                        <span className="text-xs font-black text-slate-800 line-clamp-1">{p.name}</span>
                                        <span className="text-[9px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200 uppercase tracking-wide">
                                          Blocage
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                        {p.identity.contraintes}
                                      </p>
                                      <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1.5 pt-1 border-t border-red-100/50">
                                        <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">{p.identity.pole}</span>
                                        <span>•</span>
                                        <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">{p.identity.wilaya}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Flux d'activités */}
                          <div className="space-y-3 pt-4 border-t border-slate-100">
                            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">⚡ Journal de modifications de la plateforme</span>
                            {notifications.length === 0 ? (
                              <div className="text-center py-4 text-slate-400 text-xs italic font-medium">
                                Aucune modification récente enregistrée dans la base Firestore.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {notifications.slice(0, 3).map((notif) => {
                                  let badgeBg = "bg-blue-50 text-blue-700 border-blue-100";
                                  if (notif.category === "creation") badgeBg = "bg-orange-50 text-orange-700 border-orange-100";
                                  else if (notif.category === "status_change") badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                  else if (notif.category === "assignment") badgeBg = "bg-purple-50 text-purple-700 border-purple-100";

                                  return (
                                    <div key={notif.id} className="flex gap-3 items-start p-3 rounded-2xl hover:bg-slate-50 transition-all border border-slate-100 bg-slate-50/30">
                                      <div className="p-2 bg-white rounded-xl text-slate-500 shrink-0 border border-slate-200">
                                        <Activity className="w-4 h-4 text-slate-600" />
                                      </div>
                                      <div className="min-w-0 space-y-1 text-left flex-grow">
                                        <div className="flex justify-between items-center gap-2">
                                          <span className="text-[11px] font-black text-slate-700 truncate">{notif.authorName}</span>
                                          <span className="text-[9px] text-slate-400 shrink-0 font-mono font-bold">
                                            {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"}) : "En cours"}
                                          </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed whitespace-pre-line">
                                          {notif.message}
                                        </p>
                                        <div className="flex items-center gap-1.5 pt-1">
                                          <span className="text-[10px] font-extrabold text-orange-500 max-w-xs truncate">{notif.projectName}</span>
                                          <span className={`text-[9px] font-black uppercase px-2 rounded-full border ${badgeBg}`}>
                                            {notif.category || "action"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

            </motion.div>
          )}

          {activeTab === "docs_plans" && (
            <motion.div
              key="docs_plans"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {!userProfile ? (
                <div className="bg-slate-50 border border-slate-200/60 rounded-[32px] p-8 text-center space-y-5 max-w-2xl mx-auto my-6 shadow-inner relative overflow-hidden" id="confidential-docs-banner">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-full filter blur-3xl pointer-events-none" />
                  <div className="mx-auto p-4 bg-slate-200/50 text-slate-500 rounded-2xl w-14 h-14 flex items-center justify-center border border-slate-200">
                    <Shield className="w-7 h-7 text-slate-600 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-black uppercase text-slate-700 tracking-wider flex items-center justify-center gap-2">
                      <span>🔒 Espace Documentaire Sécurisé</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto font-medium">
                      Par mesure de sécurité, l'accès aux guides de transport de gaz, fascicules réglementaires, plans techniques et schémas interactifs de la plateforme nécessite une habilitation. Veuillez vous connecter pour accéder à l'espace documentaire.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("profil")}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <span>Se connecter pour déverrouiller</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  {!isReaderActive ? (
                <div className="space-y-8 animate-fade-in">
                  {/* Interactive Diagram Hub */}
                  <InteractiveDiagrams isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />

                  {/* Fascicules Grid */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Les 7 Fascicules Réglementaires</h3>
                      <p className="text-xs text-slate-400 font-medium">Sélectionnez pour consulter les spécifications</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {FASCICULES_DATA.map((f) => (
                        <div
                          key={f.id}
                          onClick={() => handleSelectFascicule(f.id)}
                          className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-md">
                                Fascicule {f.number}
                              </span>
                              <BookOpen className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                              {f.title}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                              {f.summary}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-blue-500 mt-4 flex items-center gap-1">
                            <span>Explorer le guide</span>
                            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {/* Return button */}
                  <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsReaderActive(false)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-300 hover:scale-105 transition-all rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-md"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Retour aux documents et plans</span>
                      </button>
                      <div className="hidden sm:block h-6 w-px bg-slate-800"></div>
                      <div className="hidden sm:block text-xs font-medium text-slate-400">
                        Vous lisez : <span className="font-bold text-white">Fascicule {selectedFascicule.number} - {selectedFascicule.title}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-850 px-2.5 py-1 rounded border border-slate-800 text-slate-400">
                      MODE LISEUSE ACTIF
                    </span>
                  </div>

                  {/* Liseuse core layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar Document Selector */}
              <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-2 h-fit">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block px-2 mb-3">Table des Matières</span>
                {FASCICULES_DATA.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFasciculeId(f.id);
                      setPageReaderMode(false);
                      setCurrentPageNum(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl text-xs font-bold transition-all flex items-start justify-between gap-2 ${
                      selectedFasciculeId === f.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <span className="block opacity-60 text-[9px] uppercase tracking-wider mb-0.5">Fascicule {f.number}</span>
                      <span className="line-clamp-2 leading-tight">{f.title}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-3 space-y-6">
                {/* Mode Toggler Header */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-sm text-slate-800">Mode de consultation</h3>
                    <p className="text-[11px] text-slate-400">Sélectionnez la liseuse pour afficher les schémas originaux côte-à-côte.</p>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                    <button
                      onClick={() => setPageReaderMode(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        !pageReaderMode ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Par Clauses (Standard)</span>
                    </button>
                    <button
                      onClick={() => {
                        setPageReaderMode(true);
                        const pages = Array.from(new Set([
                          ...selectedFascicule.sections.map(s => s.page),
                          ...(selectedFascicule.illustrations?.map(i => i.page) || [])
                        ].filter(Boolean))) as number[];
                        pages.sort((a, b) => a - b);
                        if (pages.length > 0) {
                          setCurrentPageNum(pages[0]);
                        } else {
                          setCurrentPageNum(1);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        pageReaderMode ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Liseuse Technique</span>
                    </button>
                  </div>
                </div>

                {!pageReaderMode ? (
                  /* Standard Clause View */
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-xs font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-md">
                          Fascicule {selectedFascicule.number}
                        </span>
                        <h2 className="text-2xl font-black text-slate-800 mt-2">{selectedFascicule.title}</h2>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 italic leading-relaxed border-l-4 border-blue-500 pl-4 bg-slate-50 py-3 rounded-r-xl">
                      {selectedFascicule.summary}
                    </p>

                    <div className="space-y-8">
                      {selectedFascicule.sections.map((sec) => (
                        <div key={sec.id} className="space-y-3 border-b border-slate-50 pb-6 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800 text-base">{sec.title}</h3>
                            {sec.page && (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                Page {sec.page}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{sec.content}</p>
                          {sec.points && (
                            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside bg-slate-50 p-4 rounded-xl border border-slate-100">
                              {sec.points.map((pt, pIdx) => (
                                <li key={pIdx} className="leading-relaxed">{pt}</li>
                              ))}
                            </ul>
                          )}
                          <div className="pt-2 flex flex-wrap items-center gap-2.5">
                            <button
                              onClick={() => setSelectedSectionDetails(sec)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Détails & Procédures</span>
                            </button>
                            {sec.relatedPv && (
                              <button
                                onClick={() => setActiveTab("pv")}
                                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>PV Officiel associé</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* High Fidelity Booklet Page Reader Mode */
                  <div className="space-y-6">
                    {/* Page Selector Navigation Bar */}
                    {(() => {
                      const fasciculeNumStr = selectedFascicule.number?.replace(/\D/g, ""); // e.g., "02" -> "2"
                      const currentFasciculeCustomPlans = dbPlans.filter(p => {
                        const planFasciculeNum = p.fascicule?.replace(/\D/g, "");
                        return Number(planFasciculeNum) === Number(fasciculeNumStr);
                      });

                      const pages = Array.from(new Set([
                        ...selectedFascicule.sections.map(s => s.page),
                        ...(selectedFascicule.illustrations?.map(i => i.page) || []),
                        ...currentFasciculeCustomPlans.map(p => p.page)
                      ].filter(Boolean))) as number[];
                      pages.sort((a, b) => a - b);
                      const activePage = currentPageNum || pages[0] || 1;
                      const activePageIdx = pages.indexOf(activePage);
                      const hasPrev = activePageIdx > 0;
                      const hasNext = activePageIdx < pages.length - 1;

                      const activePageSections = selectedFascicule.sections.filter(s => s.page === activePage);
                      
                      const activePageIllustrations = [
                        ...(selectedFascicule.illustrations?.filter(ill => ill.page === activePage) || []),
                        ...currentFasciculeCustomPlans.filter(p => p.page === activePage)
                      ].reduce((acc: any[], current) => {
                        const isDuplicate = acc.some(item => item.id === current.id || item.title === current.title);
                        if (!isDuplicate) {
                          acc.push(current);
                        }
                        return acc;
                      }, []);

                      return (
                        <div className="space-y-6">
                          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <button
                              disabled={!hasPrev}
                              onClick={() => setCurrentPageNum(pages[activePageIdx - 1])}
                              className={`p-2 rounded-xl border border-slate-200 text-xs font-bold transition-all flex items-center gap-1 ${
                                hasPrev ? "hover:bg-slate-50 text-slate-700" : "opacity-30 cursor-not-allowed text-slate-300"
                              }`}
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Page Précédente</span>
                            </button>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500">Page</span>
                              <select
                                value={activePage}
                                onChange={(e) => setCurrentPageNum(Number(e.target.value))}
                                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                              >
                                {pages.map((p) => {
                                  const section = selectedFascicule.sections.find(s => s.page === p);
                                  const illustration = selectedFascicule.illustrations?.find(ill => ill.page === p);
                                  const pageTitle = section?.title || illustration?.title || "Feuillet Technique";
                                  const displayTitle = pageTitle.length > 30 ? pageTitle.substring(0, 30) + "..." : pageTitle;
                                  return (
                                    <option key={p} value={p}>
                                      Page {p} • {displayTitle}
                                    </option>
                                  );
                                })}
                              </select>
                              <span className="text-xs font-bold text-slate-500">sur {pages[pages.length - 1]}</span>
                            </div>

                            <button
                              disabled={!hasNext}
                              onClick={() => setCurrentPageNum(pages[activePageIdx + 1])}
                              className={`p-2 rounded-xl border border-slate-200 text-xs font-bold transition-all flex items-center gap-1 ${
                                hasNext ? "hover:bg-slate-50 text-slate-700" : "opacity-30 cursor-not-allowed text-slate-300"
                              }`}
                            >
                              <span>Page Suivante</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Paper Sheet Simulator Split Layout */}
                          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                            {/* Paper Leaf: Text Clauses */}
                            <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 relative overflow-hidden flex flex-col justify-between min-h-[450px]">
                              {/* Page watermarked background */}
                              <div className="absolute top-4 right-6 text-[10px] font-mono text-slate-300 pointer-events-none uppercase tracking-widest">
                                SONELGAZ SPEC • PAGE {activePage}
                              </div>

                              <div className="space-y-6 z-10">
                                <div className="border-b border-slate-100 pb-3">
                                  <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    CLAUSES OFFICIELLES
                                  </span>
                                  <h4 className="text-xs font-black text-slate-400 mt-2 uppercase tracking-wider">Fascicule {selectedFascicule.number} • Page {activePage}</h4>
                                </div>

                                {activePageSections.length > 0 ? (
                                  activePageSections.map((sec) => (
                                    <div key={sec.id} className="space-y-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                      <h5 className="font-extrabold text-slate-800 text-sm">{sec.title}</h5>
                                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{sec.content}</p>
                                      {sec.points && (
                                        <ul className="text-xs text-slate-600 space-y-1.5 bg-slate-50/50 p-3 rounded-lg border border-slate-100/60 list-disc list-inside">
                                          {sec.points.map((pt, pIdx) => (
                                            <li key={pIdx} className="leading-relaxed">{pt}</li>
                                          ))}
                                        </ul>
                                      )}
                                      <div className="pt-2 flex flex-wrap items-center gap-2">
                                        <button
                                          onClick={() => setSelectedSectionDetails(sec)}
                                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                                        >
                                          <FileText className="w-3.5 h-3.5" />
                                          <span>Détail & Procédure QA/QC</span>
                                        </button>
                                        {sec.relatedPv && (
                                          <button
                                            onClick={() => setActiveTab("pv")}
                                            className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span>PV Associé</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="space-y-4 py-4">
                                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-3">
                                      <div className="flex items-center gap-2 text-blue-600">
                                        <Info className="w-4 h-4 shrink-0" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Note Technique de l'Annexe</span>
                                      </div>
                                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        Ce feuillet technique présente principalement des dessins d'exécution et des plans d'installations approuvés par la SONELGAZ. Les détails techniques du plan ci-contre doivent être scrupuleusement appliqués sur le chantier lors de la phase de pose ou de réception.
                                      </p>
                                    </div>
                                    
                                    {activePageIllustrations.map((ill) => (
                                      <div key={`desc-${ill.id}`} className="space-y-2 border-t border-slate-100 pt-4">
                                        <h5 className="font-extrabold text-slate-800 text-xs">{ill.title}</h5>
                                        <p className="text-[11px] text-slate-500 leading-relaxed italic">{ill.caption}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="border-t border-slate-100 pt-4 mt-6 text-[10px] text-slate-400 font-mono text-center flex items-center justify-between">
                                <span>CAHIER DES CHARGES INTERACTIF</span>
                                <span>PAGE {activePage}</span>
                                <span>ÉDITION 2025</span>
                              </div>
                            </div>

                            {/* Plan technical extract (illustrations) */}
                            <div className="xl:col-span-2 space-y-4">
                              {activePageIllustrations.length > 0 ? (
                                <div className="space-y-4">
                                  {activePageIllustrations.map((ill) => (
                                    <div key={ill.id} className={`bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col justify-between p-4 space-y-3 ${
                                      activePageIllustrations.length === 1 ? "h-full" : "h-auto"
                                    }`}>
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-[9px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded flex items-center gap-1">
                                            {dbPlans.some(p => p.id === ill.id) ? "🔧 Schéma Personnalisé Cloud" : "Extrait de Plan Authentique"}
                                          </span>
                                          <span className="text-[9px] font-mono text-slate-400">Page {ill.page}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-xs leading-tight">{ill.title}</h4>
                                      </div>

                                      {/* Mini Plan Preview Area */}
                                      <div className="bg-slate-100 border border-slate-200 rounded-xl overflow-hidden aspect-video relative group flex items-center justify-center">
                                        <img
                                          src={ill.src}
                                          alt={ill.title}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                          <button
                                            onClick={() => setPreviewImage(ill)}
                                            className="p-2 bg-white text-slate-800 rounded-xl hover:bg-orange-500 hover:text-white transition-colors text-xs font-bold flex items-center gap-1.5 shadow-md"
                                          >
                                            <ZoomIn className="w-3.5 h-3.5" />
                                            <span>Zoomer</span>
                                          </button>
                                        </div>
                                      </div>

                                      <p className="text-[11px] text-slate-500 leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        {ill.caption}
                                      </p>

                                      {/* Direct Admin Quick Edit Trigger */}
                                      {isAdmin && (
                                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                          <button
                                            onClick={() => {
                                              setQuickPlanEditing(ill);
                                              setQuickPlanTitle(ill.title);
                                              setQuickPlanCaption(ill.caption || "");
                                              setQuickPlanSrc(ill.src);
                                              setQuickPlanFascicule(`Fascicule ${selectedFascicule.number}`);
                                              setQuickPlanPage(activePage);
                                              setQuickPlanError(null);
                                              setIsQuickPlanModalOpen(true);
                                            }}
                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                            title="Modifier les détails de ce schéma technique"
                                          >
                                            <Plus className="w-3 h-3" />
                                            <span>Modifier / Remplacer</span>
                                          </button>
                                          
                                          {dbPlans.some(p => p.id === ill.id) && (
                                            <button
                                              onClick={() => handleDeleteQuickPlan(ill.id)}
                                              className="px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                              title="Supprimer ce schéma personnalisé"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                              <span>Supprimer</span>
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[350px]">
                                  <Layers className="w-10 h-10 text-slate-300" />
                                  <div className="space-y-1">
                                    <h4 className="font-extrabold text-xs text-slate-700">Aucun schéma sur cette page</h4>
                                    <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                                      Ce feuillet contient uniquement des clauses textuelles. Les schémas originaux de ce fascicule sont disponibles via la liseuse ou la galerie ci-dessous.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Admin direct addition button for current active page */}
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    setQuickPlanEditing(null);
                                    setQuickPlanTitle(`Nouveau schéma - Fascicule ${selectedFascicule.number} - Page ${activePage}`);
                                    setQuickPlanCaption("");
                                    setQuickPlanSrc("");
                                    setQuickPlanFascicule(`Fascicule ${selectedFascicule.number}`);
                                    setQuickPlanPage(activePage);
                                    setQuickPlanError(null);
                                    setIsQuickPlanModalOpen(true);
                                  }}
                                  className="w-full py-3 bg-white border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 text-slate-500 hover:text-blue-600 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Ajouter un schéma technique à la Page {activePage}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Illustrations Gallery Drawer */}
                {selectedFascicule.illustrations && selectedFascicule.illustrations.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-orange-500" />
                        <h3 className="font-extrabold text-sm text-slate-800">Recueil d'Extraits de Plans Techniques (Sans changement)</h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">Total : {selectedFascicule.illustrations.length} schéma(s)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedFascicule.illustrations.map((ill) => (
                        <div
                          key={ill.id}
                          className="border border-slate-100 hover:border-orange-100 rounded-xl overflow-hidden bg-slate-50/50 p-3 flex flex-col justify-between space-y-3 group"
                        >
                          <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden relative">
                            <img
                              src={ill.src}
                              alt={ill.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => setPreviewImage(ill)}
                                className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-xl shadow flex items-center gap-1 hover:bg-orange-500 hover:text-white transition-colors"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>Agrandir le schéma</span>
                              </button>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="font-black text-orange-500 uppercase">Page {ill.page}</span>
                              <span className="text-slate-400 font-mono">ID: {ill.id}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-xs">{ill.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{ill.caption}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specific Tab Quick Action */}
                {selectedFasciculeId === "fascicule_01" && (
                  <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-orange-800 text-sm">Calculateur de Rechanges (Fascicule 1)</h4>
                      <p className="text-xs text-orange-700 mt-1">Saisissez les quantités installées pour obtenir automatiquement la dotation réglementaire de rechanges.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("calculateurs")}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm shrink-0 transition-colors"
                    >
                      Ouvrir le calculateur
                    </button>
                  </div>
                )}

                {selectedFasciculeId === "fascicule_02" && (
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-blue-800 text-sm">Générateur de PV (Fascicule 2)</h4>
                      <p className="text-xs text-blue-700 mt-1">Rédigez et imprimez le procès-verbal d'état des lieux contradictoire avant ou après travaux.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("pv")}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shrink-0 transition-colors"
                    >
                      Remplir le PV
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {activeTab === "gestion_projet" && (
            <motion.div
              key="gestion_projet"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {userProfile ? (
                <ProjectManagement isAdmin={isAdmin} currentUser={user} userProfile={userProfile} />
              ) : (
                <AccessDeniedGate 
                  tabName="Suivi des Projets" 
                  onGoToProfile={() => setActiveTab("profil")} 
                  onGoToDocs={() => {
                    setActiveTab("docs_plans");
                    setIsReaderActive(false);
                  }} 
                />
              )}
            </motion.div>
          )}

          {activeTab === "calculateurs" && (
            <motion.div
              key="calculateurs"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {userProfile && hasAppPrivilege("acces_calculateur") ? (
                <Calculators />
              ) : (
                <AccessDeniedGate 
                  tabName="Calculateurs" 
                  onGoToProfile={() => setActiveTab("profil")} 
                  onGoToDocs={() => {
                    setSelectedFasciculeId("fascicule_01");
                    setIsReaderActive(true);
                    setActiveTab("docs_plans");
                  }} 
                  isPrivilegeError={userProfile && !hasAppPrivilege("acces_calculateur")}
                />
              )}
            </motion.div>
          )}

          {activeTab === "pv" && (
            <motion.div
              key="pv"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {userProfile ? (
                <Forms />
              ) : (
                <AccessDeniedGate 
                  tabName="PV Officiels" 
                  onGoToProfile={() => setActiveTab("profil")} 
                  onGoToDocs={() => {
                    setSelectedFasciculeId("fascicule_02");
                    setIsReaderActive(true);
                    setActiveTab("docs_plans");
                  }} 
                />
              )}
            </motion.div>
          )}

          {activeTab === "assistant" && (
            <motion.div
              key="assistant"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {userProfile ? (
                <AIAssistant />
              ) : (
                <AccessDeniedGate 
                  tabName="Conseiller IA" 
                  onGoToProfile={() => setActiveTab("profil")} 
                  onGoToDocs={() => {
                    setSelectedFasciculeId("fascicule_01");
                    setIsReaderActive(true);
                    setActiveTab("docs_plans");
                  }} 
                />
              )}
            </motion.div>
          )}

          {activeTab === "guides" && (
            <motion.div
              key="guides"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <GuidesTabContent 
                isAdmin={isAdmin} 
                userProfile={userProfile} 
              />
            </motion.div>
          )}

          {activeTab === "profil" && (
            <motion.div
              key="profil"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <ProfileTabContent 
                user={user} 
                userProfile={userProfile} 
                setUserProfile={setUserProfile} 
                isAdmin={isAdmin} 
                branding={branding}
                visibleNotifications={appVisibleNotifications}
                unreadNotificationsCount={unreadNotificationsCount}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                widgetConfig={widgetConfig}
                onToggleWidget={handleToggleWidget}
                allProjects={allProjects}
                slides={slides}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Image Zoom overlay Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-orange-400 bg-orange-950/60 border border-orange-900/40 px-2.5 py-0.5 rounded">
                  Fascicule {selectedFascicule.number} • Page {previewImage.page}
                </span>
                <h3 className="text-sm font-bold text-slate-100 mt-1">{previewImage.title}</h3>
              </div>
              
              <button
                onClick={closePreview}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all font-bold text-xs"
              >
                Fermer l'examen
              </button>
            </div>

            {/* Interactive Zoom Controls strip */}
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-2.5 flex items-center justify-between text-xs text-slate-600 shrink-0 select-none">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleZoomOut}
                  disabled={previewScale <= 1}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-40"
                  title="Zoom arrière"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono font-bold w-12 text-center text-slate-800">{Math.round(previewScale * 100)}%</span>
                <button
                  onClick={handleZoomIn}
                  disabled={previewScale >= 4}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-40"
                  title="Zoom avant"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px]"
                  title="Réinitialiser l'affichage"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réinitialiser</span>
                </button>
              </div>

              {previewScale > 1 && (
                <div className="text-[11px] text-orange-600 font-medium flex items-center gap-1 animate-pulse">
                  <Move className="w-3.5 h-3.5" />
                  <span>Cliquez et glissez pour naviguer sur le plan de détail</span>
                </div>
              )}
            </div>

            {/* Canvas Area with drag & scroll support */}
            <div 
              className="flex-1 overflow-hidden bg-slate-900 flex items-center justify-center relative cursor-grab active:cursor-grabbing p-6 min-h-[300px]"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                style={{
                  transform: `translate(${previewPosition.x}px, ${previewPosition.y}px) scale(${previewScale})`,
                  transition: previewIsDragging ? "none" : "transform 0.15s ease-out",
                  transformOrigin: "center center"
                }}
                className="max-h-[55vh] max-w-full flex items-center justify-center pointer-events-none"
              >
                <img
                  src={previewImage.src}
                  alt={previewImage.title}
                  className="max-h-[55vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Modal Technical Description Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 text-xs leading-relaxed shrink-0 max-h-[180px] overflow-auto">
              <p className="font-extrabold text-slate-800 mb-1 text-xs">Descriptif Technique & Clauses Règlementaires :</p>
              <p className="text-slate-600 font-medium text-[11px]">{previewImage.caption}</p>
            </div>

          </div>
        </div>
      )}

      {/* Admin Quick Plan Editor / Replacer Modal */}
      {isQuickPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl max-w-2xl w-full border border-slate-100 flex flex-col max-h-[92vh] animate-fade-in">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between shrink-0 font-sans">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    {quickPlanEditing ? "Modifier / Remplacer le Plan" : "Ajouter un Plan Technique"}
                  </h3>
                  <p className="text-[10px] text-slate-300">Synchronisé en temps réel avec Firestore Cloud</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setIsQuickPlanModalOpen(false)}
                className="text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all font-bold text-xs"
              >
                Annuler
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveQuickPlan} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {quickPlanError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-bold flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                  <span>{quickPlanError}</span>
                </div>
              )}

              {quickPlanSuccess && (
                <div className="p-3 bg-green-50 border border-green-100 text-green-700 text-xs rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5 text-green-600 shrink-0" />
                  <span>Schéma technique synchronisé avec succès !</span>
                </div>
              )}

              {/* Step 1: Upload / Image Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wide block">1. Fichier du plan ou URL de l'image</label>
                
                {/* Drag and Drop Region */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleQuickPlanFileDrop}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-slate-50 rounded-2xl p-5 text-center transition-all relative flex flex-col items-center justify-center gap-2"
                >
                  {quickPlanSrc ? (
                    <div className="relative max-h-36 max-w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-50">
                      <img 
                        src={quickPlanSrc} 
                        alt="Aperçu du plan" 
                        className="max-h-36 object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setQuickPlanSrc("")}
                        className="absolute top-2 right-2 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-bold shadow-md transition-all"
                      >
                        Changer
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-slate-300" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700">Glissez-déposez le fichier image du schéma ici</p>
                        <p className="text-[10px] text-slate-400">Ou cliquez pour sélectionner un fichier (PNG, JPG, SVG - max 2 Mo)</p>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleQuickPlanFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </>
                  )}
                </div>

                {/* Direct URL Input fallback */}
                <div className="pt-2">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Ou collez l'URL directe de l'image (ex: https://... ou lien Google Drive converti)"
                      value={quickPlanSrc}
                      onChange={(e) => setQuickPlanSrc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                    />
                  </div>
                  {/* Google Drive Link Converter integration */}
                  <div className="mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Convertisseur de liens Google Drive :</span>
                    <DriveLinkConverter 
                      compact
                      onUseLink={(directLink) => {
                        setQuickPlanSrc(directLink);
                        setQuickPlanError(null);
                      }} 
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Location Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wide block">Fascicule</label>
                  <select
                    value={quickPlanFascicule}
                    onChange={(e) => setQuickPlanFascicule(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                      <option key={num} value={`Fascicule ${num}`}>Fascicule {num}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wide block">Page de destination</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quickPlanPage}
                    onChange={(e) => setQuickPlanPage(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Step 3: Title and Caption */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wide block">Titre du plan technique</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Profil type de pose en tranchée blindée"
                  value={quickPlanTitle}
                  onChange={(e) => setQuickPlanTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wide block">Prescriptions & Légendes règlementaires</label>
                <textarea
                  rows={4}
                  placeholder="Saisissez les cotes, exigences de pose, diamètres admissibles et toutes les notes à afficher à côté de ce schéma technique..."
                  value={quickPlanCaption}
                  onChange={(e) => setQuickPlanCaption(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800 leading-relaxed"
                />
              </div>

              {/* Form Actions Footer */}
              <div className="flex gap-3 pt-3 border-t border-slate-100 shrink-0">
                {quickPlanEditing && dbPlans.some(p => p.id === quickPlanEditing.id) && (
                  <button
                    type="button"
                    disabled={quickPlanLoading}
                    onClick={() => handleDeleteQuickPlan(quickPlanEditing.id)}
                    className="px-4 py-3 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-xl text-xs font-black shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={quickPlanLoading}
                  className="flex-grow py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                  {quickPlanLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  <span>{quickPlanEditing ? "Mettre à jour le plan" : "Publier sur cette page"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Article Detail, Procedure and QA/QC Checklist Modal */}
      {selectedSectionDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-fade-in">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-blue-400 bg-blue-950/60 border border-blue-900/40 px-2.5 py-0.5 rounded">
                  Fiche Technique de Terrain • Page {selectedSectionDetails.page || "N/A"}
                </span>
                <h3 className="text-base font-bold text-slate-100">{selectedSectionDetails.title}</h3>
              </div>
              <button
                onClick={() => setSelectedSectionDetails(null)}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl transition-all font-bold text-xs"
              >
                Fermer
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Context Summary */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Rappel Règlementaire :</span>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                  {selectedSectionDetails.content}
                </p>
                {selectedSectionDetails.points && (
                  <ul className="text-[11px] text-slate-500 space-y-1.5 list-disc list-inside px-1">
                    {selectedSectionDetails.points.map((pt: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">{pt}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Procedure Steps Section */}
              {selectedSectionDetails.procedure ? (
                <div className="space-y-4 pt-4 border-t border-slate-100 animate-fade-in">
                  <div className="flex items-center gap-2 text-blue-600">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider">Procédure Opérationnelle de Chantier</span>
                  </div>
                  
                  <div className="bg-blue-50/20 rounded-2xl p-5 border border-blue-100/50 space-y-4">
                    <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wide">{selectedSectionDetails.procedure.title}</h4>
                    
                    {/* Numbered Steps */}
                    <div className="space-y-3">
                      {selectedSectionDetails.procedure.steps.map((step: string, sIdx: number) => (
                        <div key={sIdx} className="flex gap-3">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white font-mono font-bold text-[10px] shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">{step}</p>
                        </div>
                      ))}
                    </div>

                    {/* Required Equipment */}
                    {selectedSectionDetails.procedure.equipment && selectedSectionDetails.procedure.equipment.length > 0 && (
                      <div className="border-t border-blue-100/60 pt-3.5 space-y-2">
                        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Matériel & Équipements Recommandés :</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedSectionDetails.procedure.equipment.map((eq: string, eIdx: number) => (
                            <span key={eIdx} className="bg-blue-100/50 text-blue-800 px-2 py-1 rounded-lg text-[10px] font-bold font-mono">
                              🛠️ {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tolerances */}
                    {selectedSectionDetails.procedure.tolerances && selectedSectionDetails.procedure.tolerances.length > 0 && (
                      <div className="border-t border-blue-100/60 pt-3.5 space-y-2">
                        <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">Cotes de Tolérances & Seuils de Rejet :</span>
                        <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                          {selectedSectionDetails.procedure.tolerances.map((tol: string, tIdx: number) => (
                            <li key={tIdx} className="font-semibold">{tol}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-2 pt-4 border-t border-slate-100 text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Procédure Opérationnelle :</span>
                  <p className="text-xs text-slate-500 italic">Aucune procédure de terrain spécifique n'est pré-enregistrée pour cet article. Veuillez appliquer les consignes générales du document officiel.</p>
                </div>
              )}

              {/* QA/QC Checklist Section */}
              {selectedSectionDetails.qaqcChecklist && selectedSectionDetails.qaqcChecklist.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-600">
                      <Award className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-black uppercase tracking-wider">Checklist d'Autocontrôle & QA/QC</span>
                    </div>
                    
                    {/* Checklist Completion Badge */}
                    <span className="text-[10px] font-mono font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                      Avancement : {getChecklistProgress(selectedSectionDetails)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${getChecklistProgress(selectedSectionDetails)}%` }}
                    />
                  </div>

                  {/* Interactive Checkbox Items */}
                  <div className="space-y-2">
                    {selectedSectionDetails.qaqcChecklist.map((item: string, cIdx: number) => {
                      const isChecked = !!checklistStatus[`${selectedSectionDetails.id}-${cIdx}`];
                      return (
                        <div 
                          key={cIdx}
                          onClick={() => toggleChecklistItem(selectedSectionDetails.id, cIdx)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isChecked 
                              ? "bg-green-50/50 border-green-200 text-green-900" 
                              : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100/50"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                            isChecked ? "bg-green-600 border-green-600 text-white" : "bg-white border-slate-300"
                          }`}>
                            {isChecked && <span className="text-[10px] font-black">✓</span>}
                          </div>
                          <span className={`text-xs leading-relaxed font-medium ${isChecked ? "line-through opacity-60" : ""}`}>
                            {item}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Related PV Quick Access Card */}
              {selectedSectionDetails.relatedPv && (
                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[9px] font-black uppercase text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded block w-fit">
                      Génération Administrative
                    </span>
                    <h4 className="text-xs font-bold text-orange-900">Procès-Verbal de Réception requis</h4>
                    <p className="text-[10px] text-orange-700 max-w-sm font-medium">Cet article requiert la signature contradictoire d'un PV de réception officiel. Renseignez directement le PV correspondant.</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSectionDetails(null);
                      setActiveTab("pv");
                    }}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm shrink-0 transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Rédiger le PV associé</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

interface AccessDeniedGateProps {
  tabName: string;
  onGoToProfile: () => void;
  onGoToDocs: () => void;
  isPrivilegeError?: boolean;
}

export function AccessDeniedGate({ tabName, onGoToProfile, onGoToDocs, isPrivilegeError }: AccessDeniedGateProps) {
  return (
    <div className="bg-white rounded-[32px] p-8 md:p-12 border border-slate-200/60 shadow-[0_20px_40px_rgba(15,23,42,0.06),_inset_0_1px_3px_rgba(255,255,255,0.8)] text-center max-w-2xl mx-auto space-y-6 my-10 relative overflow-hidden" id="access-gate">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full filter blur-2xl -mr-16 -mt-16 opacity-70 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-50 rounded-full filter blur-2xl -ml-16 -mb-16 opacity-70 pointer-events-none" />
      
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-blue-100">
        <Lock className="w-8 h-8" />
      </div>
      
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100">
          🔒 {isPrivilegeError ? "Privilège Requis" : "Accès Protégé"} • SONELGAZ Développement Réseau
        </span>
        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">
          {isPrivilegeError ? "Privilèges Insuffisants" : "Connexion Requise"}
        </h2>
        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed font-medium">
          {isPrivilegeError ? (
            <span>
              L'utilisation du module d'ingénierie <span className="font-extrabold text-blue-600">"{tabName}"</span> requiert un privilège d'accès spécifique. Veuillez contacter le Super Administrateur de l'application pour activer ce droit sur votre compte.
            </span>
          ) : (
            <span>
              L'utilisation du module d'ingénierie <span className="font-extrabold text-blue-600">"{tabName}"</span> requiert l'authentification avec un compte professionnel. Cela garantit la traçabilité des PV de chantier et la conformité des calculs.
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
        <button
          type="button"
          onClick={onGoToProfile}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <User className="w-4 h-4" />
          <span>{isPrivilegeError ? "Consulter mon Profil" : "Créer un compte ou se connecter"}</span>
        </button>
        <button
          type="button"
          onClick={onGoToDocs}
          className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200/60"
        >
          <BookOpen className="w-4 h-4" />
          <span>Consulter la documentation publique</span>
        </button>
      </div>
    </div>
  );
}

interface FirebaseErrorBannerProps {
  error: string;
  projectId: string;
}

export function FirebaseErrorBanner({ error, projectId }: FirebaseErrorBannerProps) {
  if (!error) return null;

  const isOperationNotAllowed = error.includes("auth/operation-not-allowed") || error.includes("operation-not-allowed");
  const isEmailAlreadyInUse = error.includes("auth/email-already-in-use") || error.includes("email-already-in-use");
  const isNetworkError = error.includes("auth/network-request-failed") || error.includes("network-request-failed");

  if (isNetworkError) {
    return (
      <div className="p-5 bg-rose-50/90 border border-rose-200 rounded-2xl space-y-3.5 text-left">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-rose-100 text-rose-800 rounded-lg shrink-0 mt-0.5 animate-pulse">
            <AlertCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-black text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
              <span>⚠️ Échec de Connexion Réseau (Firebase)</span>
            </h5>
            <p className="text-[11px] text-rose-900 font-semibold leading-relaxed">
              L'application n'a pas pu contacter le service d'authentification sécurisé de Google.
            </p>
          </div>
        </div>

        <div className="p-3 bg-white border border-rose-100/50 rounded-xl space-y-2 text-[10px] text-rose-900 font-medium leading-relaxed">
          <p className="font-bold text-[11px] text-rose-950">Pourquoi cela se produit-il ?</p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-rose-800">
            <li><strong>Bloqueur de publicités/traqueurs :</strong> Des extensions (uBlock, Brave Shields, AdBlock) bloquent les scripts d'authentification Google (<code className="font-mono bg-rose-50 px-1 py-0.5 rounded text-rose-700">identitytoolkit.googleapis.com</code>).</li>
            <li><strong>Pare-feu d'entreprise ou VPN :</strong> Le réseau de votre entreprise peut restreindre l'accès à certains services cloud de Google.</li>
            <li><strong>Problème de connectivité temporaire :</strong> Votre connexion internet est peut-être lente ou instable.</li>
          </ul>
        </div>

        <div className="p-3.5 bg-orange-50 border border-orange-100 rounded-xl space-y-2">
          <p className="text-[11px] text-orange-950 font-bold flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-orange-600" />
            <span>Accès Administrateur :</span>
          </p>
          <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
            En cas de problème de connexion ou de blocage réseau, veuillez contacter l'administrateur système pour obtenir vos accès sécurisés.
          </p>
        </div>
      </div>
    );
  }

  if (isOperationNotAllowed) {
    const isAutoProvisioned = projectId === "graphical-router-x18qq";
    return (
      <div className="p-5 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-4 text-left">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
            <Shield className="w-4 h-4 text-amber-700" />
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-black text-amber-950 uppercase tracking-wide">⚙️ Activation de l'authentification requise</h5>
            <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
              La méthode de connexion par <strong>Adresse e-mail / Mot de passe</strong> n'est pas encore activée dans le projet Firebase <strong>({projectId})</strong>.
            </p>
          </div>
        </div>

        {isAutoProvisioned ? (
          <div className="space-y-3">
            <div className="p-3 bg-white border border-amber-200/50 rounded-xl space-y-2 text-[10px] text-amber-900 leading-relaxed font-medium">
              <p className="font-bold text-[11px] text-amber-950">❓ Pourquoi obtenez-vous "URL introuvable" ?</p>
              <p>
                Le projet <code className="bg-amber-50 px-1 py-0.5 rounded font-mono font-bold text-amber-800">graphical-router-x18qq</code> est une base de données temporaire <strong>gérée automatiquement par la plateforme Google AI Studio</strong>. 
                Comme ce projet est hébergé sous notre organisation, votre compte Google personnel n'a pas les droits d'administration pour en ouvrir la console Firebase. C'est pourquoi Google affiche "URL introuvable".
              </p>
              <p className="font-bold text-[11px] text-amber-950 mt-1">💡 Deux options s'offrent à vous :</p>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700">
                <li>
                  <strong className="text-amber-900">Option 1 : Accès Administrateur Système</strong>
                  <p className="pl-4 text-slate-600 text-[9px]">Saisissez vos identifiants administrateur sécurisés configurés dans la base de données.</p>
                </li>
                <li>
                  <strong className="text-amber-900">Option 2 : Connecter votre propre projet Firebase (Recommandé pour la production)</strong>
                  <p className="pl-4 text-slate-600 text-[9px]">Puisque vous avez déjà un compte Firebase, vous pouvez l'utiliser ! Créez un projet sur <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline text-amber-700 font-bold">console.firebase.google.com</a>, activez l'authentification <strong>Email/Mot de passe</strong>, puis insérez vos clés dans l'onglet <strong>Settings (Paramètres/Secrets)</strong> de cette interface.</p>
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-white border border-amber-200/50 rounded-xl space-y-1.5 text-[10px] text-amber-900 font-medium">
              <p className="font-bold text-[11px] text-amber-950">Comment l'activer sur votre projet en 30 secondes :</p>
              <ol className="list-decimal list-inside space-y-1 leading-normal pl-1">
                <li>Cliquez sur le bouton ci-dessous pour ouvrir la console de votre projet.</li>
                <li>Allez dans l'onglet <strong>Sign-in method</strong>.</li>
                <li>Cliquez sur <strong>"Ajouter un fournisseur"</strong> ou modifiez l'existant.</li>
                <li>Sélectionnez <strong>"Adresse e-mail/Mot de passe"</strong>, activez-le et enregistrez.</li>
              </ol>
            </div>

            <a
              href={`https://console.firebase.google.com/project/${projectId}/authentication/providers`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider text-center"
            >
              <span>Ouvrir la Console de votre Projet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    );
  }

  if (isEmailAlreadyInUse) {
    return (
      <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-left space-y-2">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-orange-100 text-orange-700 rounded-lg shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-black text-orange-900 uppercase tracking-wide">Adresse e-mail déjà enregistrée</h5>
            <p className="text-[11px] text-orange-800 font-medium leading-relaxed">
              Cette adresse e-mail possède déjà un compte d'authentification valide. L'ingénieur peut se connecter directement en utilisant son adresse e-mail et son mot de passe existant.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium text-left">
      {error}
    </div>
  );
}

interface ProfileTabContentProps {
  user: any;
  userProfile: any;
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
  isAdmin: boolean;
  branding: any;
  visibleNotifications: any[];
  unreadNotificationsCount: number;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  widgetConfig: {
    widget2Enabled: boolean;
    widget3Enabled: boolean;
    widget4Enabled: boolean;
  };
  onToggleWidget: (widgetId: "widget2" | "widget3" | "widget4") => Promise<void>;
  allProjects: any[];
  slides: any[];
}

const WILAYAS_ALGERIE_LIST = [
  "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna", 
  "06 - Béjaïa", "07 - Biskra", "08 - Béchar", "09 - Blida", "10 - Bouira", 
  "11 - Tamanrasset", "12 - Tébessa", "13 - Tlemcen", "14 - Tiaret", "15 - Tizi Ouzou", 
  "16 - Alger", "17 - Djelfa", "18 - Jijel", "19 - Sétif", "20 - Saïda", 
  "21 - Skikda", "22 - Sidi Bel Abbès", "23 - Annaba", "24 - Guelma", "25 - Constantine", 
  "26 - Médéa", "27 - Mostaganem", "28 - M'Sila", "29 - Mascara", "30 - Ouargla", 
  "31 - Oran", "32 - El Bayadh", "33 - Illizi", "34 - Bordj Bou Arreridj", "35 - Boumerdès", 
  "36 - El Tarf", "37 - Tindouf", "38 - Tissemsilt", "39 - El Oued", "40 - Khenchela", 
  "41 - Souk Ahras", "42 - Tipaza", "43 - Mila", "44 - Aïn Defla", "45 - Naâma", 
  "46 - Aïn Témouchent", "47 - Ghardaïa", "48 - Relizane", "49 - El M'Ghair", "50 - El Meniaa", 
  "51 - Ouled Djellal", "52 - Bordj Baji Mokhtar", "53 - Béni Abbès", "54 - Timimoun", "55 - Touggourt", 
  "56 - Djanet", "57 - In Salah", "58 - In Guezzam"
];

const POLES_ALGERIE_OPTIONS = [
  "Pôle ACO (Alger - Constantine - Ouargla)",
  "Pôle BBO (Blida - Béchar - Oran)"
];

const REGIONS_ALGERIE_OPTIONS = [
  "Région de transport gaz Constantine",
  "Région de transport gaz Ouargla",
  "Région de transport gaz Alger",
  "Région de transport gaz Oran",
  "Région de transport gaz Blida",
  "Région de transport gaz Béchar"
];

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

export function ProfileTabContent({ 
  user, 
  userProfile, 
  setUserProfile, 
  isAdmin, 
  branding,
  visibleNotifications,
  unreadNotificationsCount,
  onMarkAsRead,
  onMarkAllAsRead,
  widgetConfig,
  onToggleWidget,
  allProjects,
  slides
}: ProfileTabContentProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [adminSubTab, setAdminSubTab] = useState<"profile" | "gestion_compte" | "mes_projets" | "gestion_plateforme">("profile");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Password Recovery Requests States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [passwordRequests, setPasswordRequests] = useState<any[]>([]);
  const [requestActionMsg, setRequestActionMsg] = useState("");
  const [connectionLogs, setConnectionLogs] = useState<any[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState("");

  // Event Simulator States for Directeur / Gérant
  const [simEventTitle, setSimEventTitle] = useState("");
  const [simEventCategory, setSimEventCategory] = useState<"creation" | "update" | "assignment" | "status_change">("update");
  const [simEventSeverity, setSimEventSeverity] = useState<"info" | "warning" | "critical" | "success">("info");
  const [simEventMessage, setSimEventMessage] = useState("");
  const [simEventProject, setSimEventProject] = useState("");
  const [simEventPole, setSimEventPole] = useState("");
  const [simEventRegion, setSimEventRegion] = useState("");
  const [simSuccessMsg, setSimSuccessMsg] = useState("");
  const [simErrorMsg, setSimErrorMsg] = useState("");
  const [simLoading, setSimLoading] = useState(false);

  // Home Slideshow Manager States & Handlers
  const [slideFormOpen, setSlideFormOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideTitle, setSlideTitle] = useState("");
  const [slideBadge, setSlideBadge] = useState("");
  const [slideDesc, setSlideDesc] = useState("");
  const [slideOrder, setSlideOrder] = useState(1);
  const [slideImageFile, setSlideImageFile] = useState<File | null>(null);
  const [slideImageUrl, setSlideImageUrl] = useState("");
  const [slideSaving, setSlideSaving] = useState(false);
  const [slideErrorMsg, setSlideErrorMsg] = useState("");
  const [slideSuccessMsg, setSlideSuccessMsg] = useState("");

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlideErrorMsg("");
    setSlideSuccessMsg("");

    if (!slideTitle.trim() || !slideDesc.trim()) {
      setSlideErrorMsg("Le titre et la description du slide sont requis.");
      return;
    }

    setSlideSaving(true);
    try {
      let finalImgUrl = slideImageUrl.trim();

      // If they uploaded a custom image file, compress it and convert to base64
      if (slideImageFile) {
        finalImgUrl = await compressImage(slideImageFile, 1200, 1200);
      }

      if (!finalImgUrl) {
        setSlideErrorMsg("Veuillez sélectionner un fichier image ou saisir une URL d'image valide.");
        setSlideSaving(false);
        return;
      }

      const slideData = {
        title: slideTitle.trim(),
        badge: slideBadge.trim(),
        desc: slideDesc.trim(),
        order: Number(slideOrder) || 1,
        image: finalImgUrl,
        createdAt: new Date().toISOString()
      };

      if (editingSlideId) {
        await setDoc(doc(db, "slides", editingSlideId), slideData, { merge: true });
        setSlideSuccessMsg("La diapositive a été mise à jour avec succès !");
      } else {
        const newDocRef = doc(collection(db, "slides"));
        await setDoc(newDocRef, { ...slideData, id: newDocRef.id });
        setSlideSuccessMsg("La nouvelle diapositive a été ajoutée avec succès !");
      }

      // Reset form fields
      setSlideTitle("");
      setSlideBadge("");
      setSlideDesc("");
      setSlideOrder(slides.length + 2);
      setSlideImageFile(null);
      setSlideImageUrl("");
      setEditingSlideId(null);
      setSlideFormOpen(false);
    } catch (err: any) {
      console.error("Error saving slide:", err);
      setSlideErrorMsg("Erreur lors de l'enregistrement de la diapositive : " + (err.message || err));
    } finally {
      setSlideSaving(false);
    }
  };

  const handleEditSlideClick = (slide: any) => {
    setEditingSlideId(slide.id);
    setSlideTitle(slide.title);
    setSlideBadge(slide.badge || "");
    setSlideDesc(slide.desc);
    setSlideOrder(slide.order || 1);
    setSlideImageUrl(slide.image || "");
    setSlideImageFile(null);
    setSlideFormOpen(true);
    setSlideErrorMsg("");
    setSlideSuccessMsg("");
  };

  const handleDeleteSlide = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette diapositive d'accueil ?")) return;
    setSlideErrorMsg("");
    setSlideSuccessMsg("");
    try {
      await deleteDoc(doc(db, "slides", id));
      setSlideSuccessMsg("La diapositive a été supprimée avec succès.");
    } catch (err: any) {
      console.error("Error deleting slide:", err);
      setSlideErrorMsg("Erreur lors de la suppression de la diapositive.");
    }
  };

  const handleImportDefaultSlides = async () => {
    if (!window.confirm("Voulez-vous importer les diapositives de démonstration initiales dans votre base de données ?")) return;
    setSlideSaving(true);
    setSlideErrorMsg("");
    setSlideSuccessMsg("");
    try {
      for (let i = 0; i < SLIDES_DATA.length; i++) {
        const def = SLIDES_DATA[i];
        const newDocRef = doc(collection(db, "slides"));
        await setDoc(newDocRef, {
          id: newDocRef.id,
          title: def.title,
          badge: def.badge,
          desc: def.desc,
          order: i + 1,
          image: def.image,
          createdAt: new Date().toISOString()
        });
      }
      setSlideSuccessMsg("Les 3 diapositives par défaut ont été importées dans Firestore !");
    } catch (err: any) {
      console.error("Error importing default slides:", err);
      setSlideErrorMsg("Erreur lors de l'importation des diapositives.");
    } finally {
      setSlideSaving(false);
    }
  };

  const handleSimulateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimSuccessMsg("");
    setSimErrorMsg("");
    if (!simEventTitle.trim() || !simEventMessage.trim()) {
      setSimErrorMsg("Veuillez saisir un intitulé et une description de l'événement.");
      return;
    }
    setSimLoading(true);
    try {
      const poleValue = simEventPole || userProfile?.pole || "";
      const regionValue = simEventRegion || userProfile?.direction || "";

      await createNotification({
        projectId: simEventProject || "simulation_system",
        projectName: simEventProject 
          ? (allProjects.find((p: any) => p.id === simEventProject)?.name || "Projet Spécifique") 
          : "Système de Supervision de Juridiction",
        message: `${simEventTitle.trim()} - ${simEventMessage.trim()} [Sévérité: ${simEventSeverity.toUpperCase()}]`,
        category: simEventCategory,
        authorName: userProfile?.name || "Superviseur",
        authorEmail: userProfile?.email || user?.email || "",
        authorRole: userProfile?.poste || userProfile?.role || "Directeur / Gérant",
        pole: poleValue,
        region: regionValue,
        readBy: []
      });

      setSimSuccessMsg("Événement de juridiction simulé et émis en temps réel avec succès !");
      setSimEventTitle("");
      setSimEventMessage("");
    } catch (err: any) {
      console.error("Error creating simulation event:", err);
      setSimErrorMsg("Erreur lors de la création de l'événement: " + (err.message || err));
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(
      collection(db, "password_requests")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort in memory by date descending
      list.sort((a, b) => {
        const dateA = a.requestedAt || "";
        const dateB = b.requestedAt || "";
        return dateB.localeCompare(dateA);
      });
      setPasswordRequests(list);
    }, (error) => {
      console.error("Error loading password requests:", error);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "connection_logs"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort in memory by timestamp descending
      list.sort((a, b) => {
        const timeA = a.timestamp || "";
        const timeB = b.timestamp || "";
        return timeB.localeCompare(timeA);
      });
      setConnectionLogs(list);
    }, (error) => {
      console.error("Error loading connection logs:", error);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const [activeNotifFilter, setActiveNotifFilter] = useState<"all" | "creation" | "update" | "assignment" | "status_change">("all");
  const [notifSearchQuery, setNotifSearchQuery] = useState("");
  const [notifFilterProject, setNotifFilterProject] = useState("all");
  const [notifFilterDateRange, setNotifFilterDateRange] = useState("all"); // 'all', 'today', 'week', 'month'
  const [notifFilterPole, setNotifFilterPole] = useState("all");

  const filteredNotificationsToShow = (visibleNotifications || []).filter(n => {
    // 1. Category Filter
    if (activeNotifFilter !== "all" && n.category !== activeNotifFilter) {
      return false;
    }

    // 2. Text Search Query (message, project name, author name, or category)
    if (notifSearchQuery.trim()) {
      const query = notifSearchQuery.toLowerCase().trim();
      const messageMatch = (n.message || "").toLowerCase().includes(query);
      const projectMatch = (n.projectName || "").toLowerCase().includes(query);
      const authorMatch = (n.authorName || "").toLowerCase().includes(query);
      const poleMatch = (n.pole || "").toLowerCase().includes(query);
      const regionMatch = (n.region || "").toLowerCase().includes(query);
      const categoryMatch = (
        n.category === "creation" ? "creation" :
        n.category === "update" ? "mise a jour update" :
        n.category === "assignment" ? "affectation assignment" :
        n.category === "status_change" ? "phase statut change" : ""
      ).toLowerCase().includes(query);

      if (!messageMatch && !projectMatch && !authorMatch && !poleMatch && !regionMatch && !categoryMatch) {
        return false;
      }
    }

    // 3. Project Filter
    if (notifFilterProject !== "all" && n.projectName !== notifFilterProject) {
      return false;
    }

    // 4. Pole Filter
    if (notifFilterPole !== "all" && n.pole !== notifFilterPole) {
      return false;
    }

    // 5. Date Filter
    if (notifFilterDateRange !== "all") {
      const notifDate = new Date(n.timestamp);
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);

      if (notifFilterDateRange === "today") {
        if (notifDate < todayMidnight) return false;
      } else if (notifFilterDateRange === "week") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (notifDate < sevenDaysAgo) return false;
      } else if (notifFilterDateRange === "month") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (notifDate < thirtyDaysAgo) return false;
      }
    }

    return true;
  });

  const uniqueProjectNames = Array.from(
    new Set(
      (visibleNotifications || [])
        .map((n) => n.projectName)
        .filter((name): name is string => !!name)
    )
  ).sort();

  const uniqueNotifPoles = Array.from(
    new Set(
      (visibleNotifications || [])
        .map((n) => n.pole)
        .filter((p): p is string => !!p)
    )
  ).sort();

  // User's own professional details edit states
  const [isEditingOwnProfile, setIsEditingOwnProfile] = useState(false);
  const [ownPole, setOwnPole] = useState(userProfile?.pole || "");
  const [ownDirection, setOwnDirection] = useState(userProfile?.direction || "");
  const [ownDepartement, setOwnDepartement] = useState(userProfile?.departement || "");
  const [ownDistrict, setOwnDistrict] = useState(userProfile?.district || "");
  const [ownPoste, setOwnPoste] = useState(userProfile?.poste || "");

  // Sync own fields when user profile changes
  useEffect(() => {
    if (userProfile) {
      setOwnPole(userProfile.pole || "");
      setOwnDirection(userProfile.direction || "");
      setOwnDepartement(userProfile.departement || "");
      setOwnDistrict(userProfile.district || "");
      setOwnPoste(userProfile.poste || "");
    }
  }, [userProfile]);

  const handleSaveOwnProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      const updatedData = {
        pole: ownPole,
        direction: ownDirection,
        departement: ownDepartement,
        district: ownDistrict,
        poste: ownPoste,
      };

      if (userProfile?.uid) {
        const profRef = doc(db, "profiles", userProfile.uid);
        await setDoc(profRef, updatedData, { merge: true });
        setUserProfile((prev: any) => ({ ...prev, ...updatedData }));
        setSuccessMsg("Informations de profil mises à jour avec succès !");
        setIsEditingOwnProfile(false);
      } else {
        setErrorMsg("Impossible de mettre à jour le profil : Utilisateur non connecté.");
      }
    } catch (err: any) {
      console.error("Error updating own profile:", err);
      setErrorMsg("Erreur de sauvegarde: " + (err.message || err));
    }
  };

  // Admin direct user creation states
  const [adminNewEmail, setAdminNewEmail] = useState("");
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [adminNewName, setAdminNewName] = useState("");
  const [adminNewRole, setAdminNewRole] = useState<"Utilisateur" | "Administrateur" | "Directeur / Gérant">("Utilisateur");
  const [adminNewPoste, setAdminNewPoste] = useState("");
  const [adminNewStructure, setAdminNewStructure] = useState("");
  const [adminNewPole, setAdminNewPole] = useState("");
  const [adminNewDirection, setAdminNewDirection] = useState("");
  const [adminNewPoles, setAdminNewPoles] = useState<string[]>([]);
  const [adminNewDirections, setAdminNewDirections] = useState<string[]>([]);
  const [adminNewDepartement, setAdminNewDepartement] = useState("");
  const [adminNewDistrict, setAdminNewDistrict] = useState("");
  
  const [adminCreateError, setAdminCreateError] = useState("");
  const [adminCreateSuccess, setAdminCreateSuccess] = useState("");
  const [adminCreateLoading, setAdminCreateLoading] = useState(false);

  // Privileges states for new user
  const [privilegeCalculateur, setPrivilegeCalculateur] = useState(true);
  const [privilegeBordereau, setPrivilegeBordereau] = useState(true);
  const [privilegeAjoutProjet, setPrivilegeAjoutProjet] = useState(true);
  const [privilegeEtude, setPrivilegeEtude] = useState(true);
  const [privilegeTravaux, setPrivilegeTravaux] = useState(true);
  const [projectPrivilege, setProjectPrivilege] = useState<"all" | "assigned" | "readonly">("all");

  // Profiles list states for administrator management panel
  const [profiles, setProfiles] = useState<any[]>([]);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  const [deletingProfile, setDeletingProfile] = useState<any | null>(null);
  const [editPrivilegeCalculateur, setEditPrivilegeCalculateur] = useState(true);
  const [editPrivilegeBordereau, setEditPrivilegeBordereau] = useState(true);
  const [editPrivilegeAjoutProjet, setEditPrivilegeAjoutProjet] = useState(true);
  const [editPrivilegeEtude, setEditPrivilegeEtude] = useState(true);
  const [editPrivilegeTravaux, setEditPrivilegeTravaux] = useState(true);
  const [editProjectPrivilege, setEditProjectPrivilege] = useState<"all" | "assigned" | "readonly">("all");
  const [editRole, setEditRole] = useState<string>("Utilisateur");
  const [editPoste, setEditPoste] = useState<string>("");
  const [editPassword, setEditPassword] = useState<string>("");
  const [editStructure, setEditStructure] = useState<string>("");
  const [editPole, setEditPole] = useState<string>("");
  const [editDirection, setEditDirection] = useState<string>("");
  const [editPoles, setEditPoles] = useState<string[]>([]);
  const [editDirections, setEditDirections] = useState<string[]>([]);
  const [editDepartement, setEditDepartement] = useState<string>("");
  const [editDistrict, setEditDistrict] = useState<string>("");
  const [editName, setEditName] = useState<string>("");

  // Search and filter states for user accounts list
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminFilterRole, setAdminFilterRole] = useState("all");
  const [adminFilterPole, setAdminFilterPole] = useState("all");
  const [adminFilterDirection, setAdminFilterDirection] = useState("all");

  const loggedInUserPoles = userProfile?.assignedPoles || (userProfile?.pole ? [userProfile.pole] : []);
  const loggedInUserDirections = userProfile?.assignedDirections || (userProfile?.direction ? [userProfile.direction] : []);
  const isSuperAdmin = userProfile?.role === "Super Administrateur" || userProfile?.email?.toLowerCase() === "boudjada.youcef@gmail.com";

  const allowedPoles = isSuperAdmin 
    ? POLES_ALGERIE_OPTIONS 
    : POLES_ALGERIE_OPTIONS.filter(p => isUserPolesMatched(loggedInUserPoles, p));

  const allowedDirections = isSuperAdmin 
    ? REGIONS_ALGERIE_OPTIONS 
    : REGIONS_ALGERIE_OPTIONS.filter(d => isUserDirectionsMatched(loggedInUserDirections, d));

  const visibleProfiles = profiles.filter(prof => {
    if (isSuperAdmin) return true;
    const profPoles = prof.assignedPoles || (prof.pole ? [prof.pole] : []);
    const profDirections = prof.assignedDirections || (prof.direction ? [prof.direction] : []);
    
    const matchPole = profPoles.some((pp: string) => isUserPolesMatched(loggedInUserPoles, pp));
    const matchDir = profDirections.some((pd: string) => isUserDirectionsMatched(loggedInUserDirections, pd));
    
    return matchPole && matchDir;
  });

  const filteredProfiles = visibleProfiles.filter(prof => {
    // 1. Search text filter (case-insensitive across name, email, structure, district, ID, role)
    const query = adminSearchQuery.toLowerCase().trim();
    if (query) {
      const nameMatch = (prof.name || "").toLowerCase().includes(query);
      const emailMatch = (prof.email || "").toLowerCase().includes(query);
      const structMatch = (prof.structure || "").toLowerCase().includes(query);
      const districtMatch = (prof.district || "").toLowerCase().includes(query);
      const idMatch = (prof.id || "").toLowerCase().includes(query);
      const roleMatch = (prof.role || "").toLowerCase().includes(query);
      const poleMatch = (prof.pole || "").toLowerCase().includes(query);
      const dirMatch = (prof.direction || "").toLowerCase().includes(query);
      if (
        !nameMatch &&
        !emailMatch &&
        !structMatch &&
        !districtMatch &&
        !idMatch &&
        !roleMatch &&
        !poleMatch &&
        !dirMatch
      ) {
        return false;
      }
    }

    // 2. Filter by Role
    if (adminFilterRole !== "all") {
      if (prof.role !== adminFilterRole) return false;
    }

    // 3. Filter by Pole
    if (adminFilterPole !== "all") {
      const profPoles = prof.assignedPoles || (prof.pole ? [prof.pole] : []);
      if (!profPoles.some((p: string) => p.toLowerCase().includes(adminFilterPole.toLowerCase()) || adminFilterPole.toLowerCase().includes(p.toLowerCase()))) {
        return false;
      }
    }

    // 4. Filter by Direction
    if (adminFilterDirection !== "all") {
      const profDirs = prof.assignedDirections || (prof.direction ? [prof.direction] : []);
      if (!profDirs.some((d: string) => d.toLowerCase().includes(adminFilterDirection.toLowerCase()) || adminFilterDirection.toLowerCase().includes(d.toLowerCase()))) {
        return false;
      }
    }

    return true;
  });

  // Load all profiles for the admin panel in real-time
  useEffect(() => {
    if (isAdmin) {
      const q = query(collection(db, "profiles"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setProfiles(list);
      }, (err) => {
        console.error("Error loading profiles for Admin:", err);
      });
      return () => unsubscribe();
    }
  }, [isAdmin]);

  const handleStartEdit = (prof: any) => {
    setEditingProfileId(prof.id);
    setEditName(prof.name || "");
    setEditRole(prof.role || "Utilisateur");
    setEditPoste(prof.poste || "");
    setEditPassword(prof.virtualPassword || "");
    setEditStructure(prof.structure || "");
    setEditPole(prof.pole || "");
    setEditDirection(prof.direction || "");
    setEditPoles(prof.assignedPoles || (prof.pole ? [prof.pole] : []));
    setEditDirections(prof.assignedDirections || (prof.direction ? [prof.direction] : []));
    setEditDepartement(prof.departement || "");
    setEditDistrict(prof.district || "");
    setEditPrivilegeCalculateur(prof.privileges?.acces_calculateur !== false);
    setEditPrivilegeBordereau(prof.privileges?.acces_bordereau !== false);
    setEditPrivilegeAjoutProjet(prof.privileges?.ajout_projet !== false);
    setEditPrivilegeEtude(prof.privileges?.section_etude !== false);
    setEditPrivilegeTravaux(prof.privileges?.section_travaux !== false);
    setEditProjectPrivilege(prof.privileges?.project_privilege || "all");
  };

  const handleSavePrivileges = async (uid: string) => {
    if (editPassword && editPassword.length < 6) {
      setAdminCreateError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    try {
      const profRef = doc(db, "profiles", uid);
      await setDoc(profRef, {
        name: editName,
        role: editRole,
        poste: editPoste,
        virtualPassword: editPassword,
        structure: editStructure,
        pole: editPoles[0] || editPole || "",
        direction: editDirections[0] || editDirection || "",
        assignedPoles: editPoles,
        assignedDirections: editDirections,
        departement: editDepartement,
        district: editDistrict,
        privileges: {
          acces_calculateur: (editRole === "Administrateur" || editRole === "Directeur / Gérant") ? true : editPrivilegeCalculateur,
          acces_bordereau: (editRole === "Administrateur" || editRole === "Directeur / Gérant") ? true : editPrivilegeBordereau,
          ajout_projet: (editRole === "Administrateur" || editRole === "Directeur / Gérant") ? true : editPrivilegeAjoutProjet,
          section_etude: (editRole === "Administrateur" || editRole === "Directeur / Gérant") ? true : editPrivilegeEtude,
          section_travaux: (editRole === "Administrateur" || editRole === "Directeur / Gérant") ? true : editPrivilegeTravaux,
          project_privilege: (editRole === "Administrateur" || editRole === "Directeur / Gérant") ? "all" : editProjectPrivilege,
        }
      }, { merge: true });
      setEditingProfileId(null);
      setAdminCreateSuccess("Structure, nom, privilèges et mot de passe de l'utilisateur mis à jour avec succès !");
    } catch (err) {
      console.error("Error updating privileges:", err);
      setAdminCreateError("Une erreur s'est produite lors de la modification des privilèges.");
    }
  };

  const handleDeleteProfile = (prof: any) => {
    const activeUid = user?.uid || userProfile?.uid;
    if (prof.id === activeUid) {
      setAdminCreateError("Vous ne pouvez pas supprimer le compte avec lequel vous êtes actuellement connecté !");
      return;
    }
    setDeletingProfile(prof);
  };

  const executeDeleteProfile = async (uid: string, emailToDelete: string) => {
    try {
      await deleteDoc(doc(db, "profiles", uid));
      setAdminCreateSuccess(`Le compte de ${emailToDelete} a été supprimé avec succès.`);
    } catch (err) {
      console.error("Error deleting user profile:", err);
      setAdminCreateError("Une erreur est survenue lors de la suppression du compte de la base de données.");
    }
  };

  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCreateError("");
    setAdminCreateSuccess("");
    setAdminCreateLoading(true);

    const emailToCreate = adminNewEmail.trim().toLowerCase();
    const passwordToCreate = adminNewPassword;
    const nameToCreate = adminNewName.trim();

    if (!emailToCreate || !passwordToCreate || !nameToCreate) {
      setAdminCreateError("Veuillez remplir tous les champs requis.");
      setAdminCreateLoading(false);
      return;
    }

    if (passwordToCreate.length < 6) {
      setAdminCreateError("Le mot de passe doit contenir au moins 6 caractères.");
      setAdminCreateLoading(false);
      return;
    }

    let tempAppToDestroy: any = null;
    try {
      let uid = "";
      let isVirtual = false;

      try {
        // Initialize secondary Firebase app to avoid disrupting current admin's session
        const tempAppName = `temp-auth-app-${Date.now()}`;
        const tempApp = initializeApp(activeConfig, tempAppName);
        tempAppToDestroy = tempApp;
        const tempAuthInstance = getAuth(tempApp);

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(tempAuthInstance, emailToCreate, passwordToCreate);
        const newlyCreatedUser = userCredential.user;

        // Update their display name in secondary Auth instance
        await updateProfile(newlyCreatedUser, { displayName: nameToCreate });
        uid = newlyCreatedUser.uid;
      } catch (authErr: any) {
        const errStr = String(authErr?.code || authErr?.message || authErr || "").toLowerCase();
        if (errStr.includes("operation-not-allowed") || authErr?.code === "auth/operation-not-allowed") {
          console.warn("Firebase Email/Password Auth is disabled. Falling back to creating virtual Firestore-only user profile...");
          uid = `virtual_user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          isVirtual = true;
        } else {
          throw authErr;
        }
      }

      // Save profile details into Firestore using primary db
      const profileRef = doc(db, "profiles", uid);
      const newProfile = {
        uid: uid,
        name: nameToCreate,
        email: emailToCreate,
        role: adminNewRole,
        poste: adminNewPoste,
        structure: adminNewStructure.trim(),
        pole: adminNewPoles[0] || adminNewPole || "",
        direction: adminNewDirections[0] || adminNewDirection || "",
        assignedPoles: adminNewPoles,
        assignedDirections: adminNewDirections,
        departement: adminNewDepartement,
        district: adminNewDistrict,
        createdAt: new Date().toISOString(),
        isVirtual: isVirtual,
        virtualPassword: passwordToCreate, // Save for authentication fallback
        privileges: {
          acces_calculateur: (adminNewRole === "Administrateur" || adminNewRole === "Directeur / Gérant") ? true : privilegeCalculateur,
          acces_bordereau: (adminNewRole === "Administrateur" || adminNewRole === "Directeur / Gérant") ? true : privilegeBordereau,
          ajout_projet: (adminNewRole === "Administrateur" || adminNewRole === "Directeur / Gérant") ? true : privilegeAjoutProjet,
          section_etude: (adminNewRole === "Administrateur" || adminNewRole === "Directeur / Gérant") ? true : privilegeEtude,
          section_travaux: (adminNewRole === "Administrateur" || adminNewRole === "Directeur / Gérant") ? true : privilegeTravaux,
          project_privilege: (adminNewRole === "Administrateur" || adminNewRole === "Directeur / Gérant") ? "all" : projectPrivilege,
        }
      };

      await setDoc(profileRef, newProfile);

      if (isVirtual) {
        setAdminCreateSuccess(`Compte Virtuel (bac à sable) créé avec succès pour ${nameToCreate} (${emailToCreate}) !`);
      } else {
        setAdminCreateSuccess(`Compte créé avec succès pour ${nameToCreate} (${emailToCreate}) !`);
      }
      
      // Clear inputs
      setAdminNewEmail("");
      setAdminNewPassword("");
      setAdminNewName("");
      setAdminNewRole("Utilisateur");
      setAdminNewPoste("");
      setAdminNewStructure("");
      setAdminNewPole("");
      setAdminNewDirection("");
      setAdminNewPoles([]);
      setAdminNewDirections([]);
      setAdminNewDepartement("");
      setAdminNewDistrict("");
      setPrivilegeCalculateur(true);
      setPrivilegeBordereau(true);
      setPrivilegeAjoutProjet(true);
      setPrivilegeEtude(true);
      setPrivilegeTravaux(true);
      setProjectPrivilege("all");
    } catch (err: any) {
      console.error("Admin user creation error:", err);
      if (err.code === "auth/email-already-in-use") {
        setAdminCreateError("Cette adresse e-mail est déjà utilisée.");
      } else if (err.code === "auth/invalid-email") {
        setAdminCreateError("L'adresse e-mail n'est pas valide.");
      } else if (err.code === "auth/weak-password") {
        setAdminCreateError("Le mot de passe doit contenir au moins 6 caractères.");
      } else if (err.code === "auth/operation-not-allowed" || String(err?.code || err?.message || "").toLowerCase().includes("operation-not-allowed")) {
        setAdminCreateError("⚙️ Firebase : La méthode d'authentification par Adresse E-mail / Mot de passe n'est pas activée.");
      } else {
        setAdminCreateError(err.message || "Une erreur s'est produite lors de la création.");
      }
    } finally {
      if (tempAppToDestroy) {
        try {
          await tempAppToDestroy.delete();
        } catch (delErr) {
          console.warn("Could not clean up secondary Firebase app instance:", delErr);
        }
      }
      setAdminCreateLoading(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    setResetLoading(true);

    const cleanUsername = resetUsername.trim().toLowerCase();
    if (!cleanUsername) {
      setResetError("Veuillez saisir votre nom d'utilisateur.");
      setResetLoading(false);
      return;
    }

    try {
      // 1. Check if a request already exists for this username
      const q = query(
        collection(db, "password_requests"),
        where("username", "==", cleanUsername)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Request already exists! Show the requested message
        setResetError(
          "traitement en cours pas l'equupe admin, un mp de récupératuon dera transmis a votre email proffesionnel pour garantir et vérifier le demandeur"
        );
        setResetLoading(false);
        return;
      }

      // 2. Look up user profile to find their real professional email if it exists
      let userEmail = cleanUsername.includes("@") ? cleanUsername : `${cleanUsername}@sonelgaz.dz`;
      let userFullName = cleanUsername;
      
      const uq = query(
        collection(db, "profiles"),
        where("email", "==", userEmail)
      );
      const profileSnapshot = await getDocs(uq);
      if (!profileSnapshot.empty) {
        profileSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.name) userFullName = data.name;
          if (data.email) userEmail = data.email;
        });
      }

      // 3. Create a new request in password_requests
      const reqId = doc(collection(db, "password_requests")).id;
      const requestData = {
        id: reqId,
        username: cleanUsername,
        email: userEmail,
        fullName: userFullName,
        requestedAt: new Date().toISOString(),
        status: "pending"
      };

      await setDoc(doc(db, "password_requests", reqId), requestData);

      // Create a notification for the administrators
      const notifId = doc(collection(db, "notifications")).id;
      const adminNotification = {
        id: notifId,
        projectId: "security",
        projectName: "Sécurité & Accès",
        message: `Demande de mot de passe oublié de la part de : ${userFullName} (${cleanUsername})`,
        category: "creation",
        authorName: userFullName,
        authorEmail: userEmail,
        timestamp: new Date().toISOString(),
        readBy: []
      };
      await setDoc(doc(db, "notifications", notifId), adminNotification);

      setResetSuccess(
        "Votre requête a été transmise avec succès à l'équipe d'administration. Un mot de passe de récupération sera transmis à votre e-mail professionnel."
      );
    } catch (err: any) {
      console.error("Error creating reset request:", err);
      setResetError("Une erreur s'est produite lors de la transmission de votre demande.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    let targetEmail = email.trim().toLowerCase();
    if (targetEmail && !targetEmail.includes("@")) {
      targetEmail = targetEmail + "@sonelgaz.dz";
    }
    const isSuperAdminEmail = targetEmail === "boudjada.youcef@gmail.com";
    const isSuperAdminPassword = password === "Sonelgaz2026!" || password === "Sonelgaz2026";

    if (!targetEmail || !password) {
      setErrorMsg("Veuillez remplir tous les champs.");
      setLoading(false);
      return;
    }

    // Direct Super Admin Bypass & Synchronisation to Firestore
    if (isSuperAdminEmail && isSuperAdminPassword) {
      try {
        let firebaseUser = null;
        try {
          const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
          firebaseUser = userCredential.user;
        } catch (firebaseErr) {
          console.warn("Standard Firebase Auth failed, using secure Super Admin fallback:", firebaseErr);
        }

        const superAdminProfile = {
          uid: firebaseUser?.uid || "super_admin_youcef_boudjada",
          name: "Youcef Boudjada",
          email: targetEmail,
          role: "Super Administrateur" as const,
          createdAt: new Date().toISOString()
        };

        try {
          await setDoc(doc(db, "profiles", superAdminProfile.uid), superAdminProfile);
        } catch (dbErr) {
          console.warn("Could not synchronize Super Admin profile in Firestore:", dbErr);
        }

        setUserProfile(superAdminProfile);
        setSuccessMsg("Connexion Super Administrateur réussie et synchronisée !");
        setLoading(false);
        return;
      } catch (err: any) {
        console.error("Super Admin authenticating error:", err);
      }
    }

    // Standard & Virtual user validation
    try {
      // 1. Query Firestore profiles for pre-created user
      const q = query(collection(db, "profiles"), where("email", "==", targetEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErrorMsg("Identifiant ou compte inexistant. Seul un administrateur peut créer des comptes d'accès.");
        setLoading(false);
        return;
      }

      let matchedProfile: any = null;
      querySnapshot.forEach((docSnap) => {
        matchedProfile = { uid: docSnap.id, ...docSnap.data() };
      });

      // 2. If it is a virtual user or standard auth is disabled/fails, check virtual password
      try {
        // Attempt standard sign-in if enabled
        await signInWithEmailAndPassword(auth, targetEmail, password);
        // Success: Standard auth verified the password!
        setUserProfile(matchedProfile);
        setSuccessMsg("Connexion réussie !");
      } catch (authErr: any) {
        const errStr = String(authErr?.code || authErr?.message || authErr || "").toLowerCase();
        
        // If operation is not allowed or credentials failed but we have a matching virtual password in the pre-created profile
        if (
          authErr.code === "auth/operation-not-allowed" || 
          errStr.includes("operation-not-allowed") ||
          authErr.code === "auth/user-not-found" ||
          authErr.code === "auth/invalid-credential" ||
          authErr.code === "auth/wrong-password"
        ) {
          // Verify pre-created account virtual password
          if (matchedProfile.virtualPassword === password) {
            setUserProfile(matchedProfile);
            setSuccessMsg("Connexion sécurisée réussie !");
            setLoading(false);
            return;
          } else {
            setErrorMsg("Mot de passe incorrect. Veuillez vérifier le mot de passe assigné par l'administrateur.");
            setLoading(false);
            return;
          }
        }
        throw authErr;
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setErrorMsg("Identifiants de sécurité incorrects.");
      } else {
        setErrorMsg(err.message || "Une erreur s'est produite lors de la connexion.");
      }
    } finally {
      if (loading) setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const currentUser = userCredential.user;
      
      let userProfileData: any = null;
      try {
        const profileRef = doc(db, "profiles", currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          userProfileData = profileSnap.data();
          // Assurer que le compte de boudjada.youcef@gmail.com est toujours Super Administrateur
          if (currentUser.email?.toLowerCase() === "boudjada.youcef@gmail.com" && userProfileData.role !== "Super Administrateur") {
            userProfileData.role = "Super Administrateur";
            try {
              await setDoc(profileRef, { ...userProfileData, role: "Super Administrateur" }, { merge: true });
            } catch (writeErr) {
              console.warn("Could not auto-promote admin profile in Google login:", writeErr);
            }
          }
        } else {
          // Check if there is a pre-registered profile with this email
          const targetEmail = currentUser.email?.toLowerCase().trim() || "";
          const q = query(collection(db, "profiles"), where("email", "==", targetEmail));
          const qSnap = await getDocs(q);
          
          if (!qSnap.empty) {
            let matchedProfile: any = null;
            qSnap.forEach((docSnap) => {
              matchedProfile = { uid: docSnap.id, ...docSnap.data() };
            });
            // Merge virtual/pre-created profile with the actual Google UID
            userProfileData = { ...matchedProfile, uid: currentUser.uid };
            try {
              if (matchedProfile.uid !== currentUser.uid) {
                await deleteDoc(doc(db, "profiles", matchedProfile.uid));
              }
              await setDoc(doc(db, "profiles", currentUser.uid), userProfileData);
            } catch (mergeErr) {
              console.warn("Could not merge Google UID into profile:", mergeErr);
            }
          } else {
            // Check if Super Admin
            if (targetEmail === "boudjada.youcef@gmail.com") {
              userProfileData = {
                uid: currentUser.uid,
                name: "Youcef Boudjada",
                email: targetEmail,
                role: "Super Administrateur" as const,
                createdAt: new Date().toISOString()
              };
              await setDoc(profileRef, userProfileData);
            } else {
              // Block unauthorized Google Sign-ins
              throw new Error("Compte non pré-enregistré. Veuillez contacter l'administrateur.");
            }
          }
        }
      } catch (dbErr: any) {
        console.warn("Could not fetch profile during Google login:", dbErr);
        if (dbErr?.message?.includes("Compte non pré-enregistré")) {
          throw dbErr;
        }
        // General fallback if offline or DB query fails
        const targetEmail = currentUser.email?.toLowerCase().trim() || "";
        if (targetEmail === "boudjada.youcef@gmail.com") {
          userProfileData = {
            uid: currentUser.uid,
            name: "Youcef Boudjada",
            email: targetEmail,
            role: "Super Administrateur" as const,
            createdAt: new Date().toISOString()
          };
        } else {
          throw new Error("Erreur de connexion : Compte non validé.");
        }
      }
      
      setUserProfile(userProfileData);
      setSuccessMsg("Connexion Google réussie et sécurisée !");
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("Compte non pré-enregistré")) {
        setErrorMsg("Accès non autorisé. Votre adresse de messagerie Google n'a pas été pré-enregistrée par l'administrateur de l'application.");
      } else if (err.code === "auth/operation-not-allowed" || String(err?.code || err?.message || "").toLowerCase().includes("operation-not-allowed")) {
        setErrorMsg("⚙️ Firebase : La connexion via Google n'est pas encore activée dans votre console Firebase. Pour vous connecter immédiatement en tant que Super Administrateur, utilisez l'adresse boudjada.youcef@gmail.com avec le mot de passe Sonelgaz2026!.");
      } else {
        setErrorMsg("Erreur de connexion via Google : " + (err.message || "Veuillez réessayer."));
      }
    } finally {
      setLoading(false);
    }
  };

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.warn("Standard Firebase signOut warning:", err);
    }
    setUserProfile(null);
    setSuccessMsg("Déconnexion réussie.");
  }



  // If user is logged in
  if (userProfile) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto" id="profile-logged-in">
        {/* Profile Header Status Card with Stamped Accent */}
        <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200/60 shadow-[0_20px_40px_rgba(15,23,42,0.04),_inset_0_1px_3px_rgba(255,255,255,0.8)] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Stamp Circle Photo */}
            <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-500 font-extrabold text-xl shadow-inner uppercase">
              {userProfile.name?.slice(0, 2) || "S"}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-800 leading-tight">{userProfile.name}</h2>
                {userProfile.role === "Super Administrateur" ? (
                  <span className="bg-gradient-to-r from-red-600 to-orange-500 text-white font-extrabold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 animate-pulse">
                    <Shield className="w-2.5 h-2.5" />
                    <span>Super Administrateur</span>
                  </span>
                ) : isAdmin ? (
                  <span className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-extrabold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                    <Shield className="w-2.5 h-2.5" />
                    <span>Administrateur</span>
                  </span>
                ) : (
                  <span className="bg-blue-100 border border-blue-200 text-blue-700 font-extrabold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                    Ingénieur • Utilisateur
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">{userProfile.email}</p>
              {userProfile.structure && (
                <p className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
                  <span>🏢</span> <span>{userProfile.structure}</span>
                </p>
              )}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <History className="w-3.5 h-3.5" />
                <span>Membre depuis : {new Date(userProfile.createdAt || Date.now()).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-5 py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Se déconnecter</span>
          </button>
        </div>

        {/* Navigation administrateur simplifiée par sous-onglets */}
        {isAdmin && (
          <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 flex overflow-x-auto gap-1 scrollbar-none snap-x shadow-inner">
            <button
              onClick={() => setAdminSubTab("profile")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap snap-start ${
                adminSubTab === "profile"
                  ? "bg-amber-500 text-white shadow-md scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Mon Profil &amp; Notifications</span>
            </button>
            <button
              onClick={() => setAdminSubTab("mes_projets")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap snap-start ${
                adminSubTab === "mes_projets"
                  ? "bg-amber-500 text-white shadow-md scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Mes Projets Supervisés</span>
            </button>
            <button
              onClick={() => setAdminSubTab("gestion_compte")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap snap-start ${
                adminSubTab === "gestion_compte"
                  ? "bg-amber-500 text-white shadow-md scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Gestion de Compte ({profiles.length})</span>
            </button>
            <button
              onClick={() => setAdminSubTab("gestion_plateforme")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap snap-start ${
                adminSubTab === "gestion_plateforme"
                  ? "bg-amber-500 text-white shadow-md scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Gestion Plateforme</span>
            </button>
          </div>
        )}

        {/* Détails du Profil Professionnel */}
        {(!isAdmin || adminSubTab === "profile") && (
          <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200/60 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight uppercase">📋 Détails du profil professionnel</h3>
                <p className="text-[11px] text-slate-400 font-semibold">Consultez et mettez à jour votre pôle, direction, département et district de rattachement.</p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setIsEditingOwnProfile(!isEditingOwnProfile)}
              className="px-4 py-2 bg-slate-50 hover:bg-amber-50 hover:text-amber-600 border border-slate-200 hover:border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingOwnProfile ? "Fermer l'édition" : "Modifier mes informations"}</span>
            </button>
          </div>

          {isEditingOwnProfile ? (
            <form onSubmit={handleSaveOwnProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 block">Pôle</label>
                <select
                  value={ownPole}
                  onChange={(e) => setOwnPole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-slate-800 cursor-pointer focus:bg-white focus:border-amber-500 transition-all text-xs"
                >
                  <option value="">Sélectionner un Pôle</option>
                  <option value="Pôle ACO">Pôle ACO</option>
                  <option value="Pole BBO">Pole BBO</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 block">Direction de Rattachement (DRTG)</label>
                <select
                  value={ownDirection}
                  onChange={(e) => setOwnDirection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-slate-800 cursor-pointer focus:bg-white focus:border-amber-500 transition-all text-xs"
                >
                  <option value="">Sélectionner une Direction</option>
                  <option value="DRTG Constantine">DRTG Constantine</option>
                  <option value="DRTG Ouargle">DRTG Ouargle</option>
                  <option value="DRTG Alger">DRTG Alger</option>
                  <option value="DRTG Oran">DRTG Oran</option>
                  <option value="DRTG Bechar">DRTG Bechar</option>
                  <option value="DRTG Blida">DRTG Blida</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 block">Département / Division</label>
                <select
                  value={ownDepartement}
                  onChange={(e) => setOwnDepartement(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-slate-800 cursor-pointer focus:bg-white focus:border-amber-500 transition-all text-xs"
                >
                  <option value="">Sélectionner un Département / Division</option>
                  <option value="Département Etude et travaux">Département Etude et travaux</option>
                  <option value="Division Etude et Développement">Division Etude et Développement</option>
                  <option value="Division Soutiens aux opérations">Division Soutiens aux opérations</option>
                  <option value="Département Etude et Développement">Département Etude et Développement</option>
                  <option value="Département Soutiens aux opérations lourdes">Département Soutiens aux opérations lourdes</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 block">District de Rattachement</label>
                <select
                  value={ownDistrict}
                  onChange={(e) => setOwnDistrict(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-slate-800 cursor-pointer focus:bg-white focus:border-amber-500 transition-all text-xs"
                >
                  <option value="">Sélectionner un district</option>
                  {WILAYAS_ALGERIE_LIST.map((w) => {
                    const cleanName = w.includes(" - ") ? w.split(" - ")[1] : w;
                    return (
                      <option key={w} value={`${cleanName} District Gaz`}>
                        {cleanName} District Gaz
                      </option>
                    );
                  })}
                </select>
              </div>

              {(userProfile?.role === "Directeur / Gérant" || ownPoste) && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-black uppercase text-slate-500 block">Poste / Fonction Spécifique</label>
                  <select
                    value={ownPoste}
                    onChange={(e: any) => setOwnPoste(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none font-bold text-slate-800 cursor-pointer focus:bg-white focus:border-amber-500 transition-all text-xs"
                  >
                    <option value="">-- Aucun poste spécifique défini --</option>
                    <option value="Directeur de région transport gaz">Directeur de Région Transport Gaz</option>
                    <option value="Chef de département étude et travaux">Chef de Département Études et Travaux</option>
                    <option value="Directeur principal étude et travaux">Directeur Principal Études et Travaux</option>
                    <option value="Directeur central étude et travaux">Directeur Central Études et Travaux</option>
                    <option value="Chef de département soutiens aux opérations lourdes">Chef de Département Soutien aux Opérations Lourdes</option>
                  </select>
                </div>
              )}

              <div className="md:col-span-2 pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingOwnProfile(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-sm shadow-amber-200 transition-all cursor-pointer"
                >
                  Sauvegarder les informations
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Pôle</span>
                  <p className="text-xs font-extrabold text-slate-800">{userProfile.pole || "Non renseigné"}</p>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Direction (DRTG)</span>
                  <p className="text-xs font-extrabold text-slate-800">{userProfile.direction || "Non renseigné"}</p>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Département</span>
                  <p className="text-xs font-extrabold text-slate-800">{userProfile.departement || "Non renseigné"}</p>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">District</span>
                  <p className="text-xs font-extrabold text-slate-800">{userProfile.district || "Non renseigné"}</p>
                </div>
              </div>

              {userProfile.poste && (
                <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl space-y-1 max-w-2xl">
                  <span className="text-[9px] font-black uppercase text-blue-600/70 tracking-wider block">Poste de Supervision / Fonction</span>
                  <p className="text-xs font-black text-blue-900 uppercase tracking-tight">{userProfile.poste}</p>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Module de Supervision de la Juridiction & Générateur d'Événements */}
        {userProfile && (userProfile.role === "Directeur / Gérant" || userProfile.poste) && (!isAdmin || adminSubTab === "profile") && (
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-[32px] p-6 md:p-8 border border-blue-900/40 shadow-xl space-y-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-800/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100 tracking-tight uppercase">⚡ Supervision de la Juridiction & Générateur</h3>
                  <p className="text-[11px] text-blue-200/70 font-semibold">
                    Supervisez les flux opérationnels de votre territoire de compétences et émettez des alertes / mises à jour de statut en direct.
                  </p>
                </div>
              </div>
            </div>

            {/* Jurisdiction Information Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-5 rounded-2xl border border-blue-900/30">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">Territoire de compétence</span>
                <p className="text-sm font-bold text-slate-100">
                  {userProfile.poste === "Directeur central étude et travaux" && "Secteur National (Visibilité Totale)"}
                  {userProfile.poste === "Directeur principal étude et travaux" && `Pôle d'affectation : ${userProfile.pole || "Non défini"} (Directions Études & Travaux)`}
                  {userProfile.poste === "Chef de département soutiens aux opérations lourdes" && `Département Opérations Lourdes - Région : ${userProfile.direction || "Non définie"}`}
                  {userProfile.poste === "Directeur de région transport gaz" && `Région Transport Gaz : ${userProfile.direction || "Non définie"}`}
                  {userProfile.poste === "Chef de département étude et travaux" && `Département Études & Travaux - Région : ${userProfile.direction || "Non définie"}`}
                  {!userProfile.poste && "Juridiction Standard (Profil Directeur)"}
                </p>
                <div className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  {userProfile.poste === "Directeur central étude et travaux" && "En tant que Directeur Central, vous pilotez l'intégralité des infrastructures gazières nationales avec pouvoir d'arbitrage général."}
                  {userProfile.poste === "Directeur principal étude et travaux" && `Rattaché au pôle, vous pilotez deux directions majeures (Études et Travaux) et disposez d'un droit de regard complet sur le pôle ${userProfile.pole || ""}.`}
                  {userProfile.poste === "Chef de département soutiens aux opérations lourdes" && `Vous opérez en étroite synergie avec le département Études et Développement pour les interventions et réparations de grande envergure dans la région ${userProfile.direction || ""}.`}
                  {userProfile.poste === "Directeur de région transport gaz" && `Vous assurez le transport continu et la maintenance des ouvrages de haute pression dans la juridiction de la direction régionale de ${userProfile.direction || ""}.`}
                  {userProfile.poste === "Chef de département étude et travaux" && `Vous assurez la réalisation des projets d'investissement, de raccordement et de pose de conduites gazières au sein de la région ${userProfile.direction || ""}.`}
                </div>
              </div>

              <div className="space-y-3 border-t md:border-t-0 md:border-l border-blue-900/30 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block mb-1">Indicateurs de Supervision</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                    <span className="text-xs font-black uppercase text-green-400">Canal de Juridiction Actif</span>
                  </div>
                </div>
                <div className="text-[11px] text-blue-100/50 italic">
                  Toute simulation d'événement émise via le générateur mettra instantanément à jour le flux de tous les collaborateurs concernés par cette juridiction.
                </div>
              </div>
            </div>

            {/* Event Simulator Form */}
            <form onSubmit={handleSimulateEvent} className="space-y-4 bg-slate-950/20 p-5 rounded-2xl border border-blue-900/10">
              <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-wider">⚡ Générateur d'Événements (Simulation)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-300">Intitulé de l'événement</label>
                  <input
                    type="text"
                    placeholder="Ex: Fin du soudage de la section B"
                    value={simEventTitle}
                    onChange={(e) => setSimEventTitle(e.target.value)}
                    className="w-full bg-slate-900/80 border border-blue-800/40 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-white font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-300">Catégorie</label>
                  <select
                    value={simEventCategory}
                    onChange={(e: any) => setSimEventCategory(e.target.value)}
                    className="w-full bg-slate-900/80 border border-blue-800/40 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-white font-semibold cursor-pointer"
                  >
                    <option value="update">Mise à jour (Update)</option>
                    <option value="creation">Création d'activité</option>
                    <option value="assignment">Affectation de personnel</option>
                    <option value="status_change">Changement de phase</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-300">Niveau de Sévérité</label>
                  <select
                    value={simEventSeverity}
                    onChange={(e: any) => setSimEventSeverity(e.target.value)}
                    className="w-full bg-slate-900/80 border border-blue-800/40 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-white font-semibold cursor-pointer"
                  >
                    <option value="info">ℹ️ Information</option>
                    <option value="success">✅ Succès de phase</option>
                    <option value="warning">⚠️ Avertissement (Retard, etc)</option>
                    <option value="critical">🚨 Alerte Critique / Incident</option>
                  </select>
                </div>
              </div>

              {/* Advanced Target Fields (Pre-selected based on user profile but overrideable if Central) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-blue-900/10 pt-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-300">Cibler un projet (Optionnel)</label>
                  <select
                    value={simEventProject}
                    onChange={(e) => setSimEventProject(e.target.value)}
                    className="w-full bg-slate-900/80 border border-blue-800/40 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-white font-semibold cursor-pointer"
                  >
                    <option value="">Tous les projets de la juridiction</option>
                    {allProjects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-300">Cibler Pôle</label>
                  <select
                    value={simEventPole}
                    onChange={(e) => setSimEventPole(e.target.value)}
                    disabled={userProfile.poste !== "Directeur central étude et travaux"}
                    className="w-full bg-slate-900/80 border border-blue-800/40 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <option value="">{userProfile.poste === "Directeur central étude et travaux" ? "Tous les pôles" : (userProfile.pole || "Aucun pôle")}</option>
                    <option value="Pôle ACO">Pôle ACO</option>
                    <option value="Pole BBO">Pole BBO</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-300">Cibler Direction Régionale</label>
                  <select
                    value={simEventRegion}
                    onChange={(e) => setSimEventRegion(e.target.value)}
                    disabled={userProfile.poste === "Directeur de région transport gaz" || userProfile.poste === "Chef de département étude et travaux" || userProfile.poste === "Chef de département soutiens aux opérations lourdes"}
                    className="w-full bg-slate-900/80 border border-blue-800/40 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <option value="">{userProfile.direction ? userProfile.direction : "Toutes les directions régionales"}</option>
                    <option value="DRTG Constantine">DRTG Constantine</option>
                    <option value="DRTG Ouargle">DRTG Ouargle</option>
                    <option value="DRTG Alger">DRTG Alger</option>
                    <option value="DRTG Oran">DRTG Oran</option>
                    <option value="DRTG Bechar">DRTG Bechar</option>
                    <option value="DRTG Blida">DRTG Blida</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-300">Description détaillée de l'événement</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Les tests hydrauliques ont été passés avec succès. Pression nominale stabilisée à 70 bars sur l'ensemble de la section."
                  value={simEventMessage}
                  onChange={(e) => setSimEventMessage(e.target.value)}
                  className="w-full bg-slate-900/80 border border-blue-800/40 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-white font-semibold"
                />
              </div>

              {simSuccessMsg && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-xs rounded-xl">
                  {simSuccessMsg}
                </div>
              )}

              {simErrorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs rounded-xl">
                  {simErrorMsg}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={simLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-2"
                >
                  {simLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Émettre l'événement de Juridiction</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Jurisdiction Real-Time Event Feed */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-blue-800/10 pb-2">
                <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-wider">📉 Flux en temps réel de votre Juridiction</h4>
                <span className="text-[9px] font-semibold text-slate-400 italic">
                  Affichage des alertes correspondantes à votre périmètre
                </span>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {(() => {
                  const filteredFeed = visibleNotifications.filter(notif => {
                    if (userProfile.poste === "Directeur central étude et travaux") {
                      return true;
                    }
                    if (userProfile.poste === "Directeur principal étude et travaux") {
                      return !notif.pole || notif.pole === userProfile.pole;
                    }
                    if (userProfile.poste === "Chef de département soutiens aux opérations lourdes") {
                      const belongsToRegion = ["DRTG Alger", "DRTG Ouargle", "DRTG Bechar"].includes(notif.region || "");
                      return belongsToRegion;
                    }
                    if (userProfile.poste === "Directeur de région transport gaz") {
                      return !notif.region || notif.region === userProfile.direction;
                    }
                    if (userProfile.poste === "Chef de département étude et travaux") {
                      return (!notif.region || notif.region === userProfile.direction);
                    }
                    return (!notif.pole || notif.pole === userProfile.pole) || (!notif.region || notif.region === userProfile.direction);
                  });

                  if (filteredFeed.length === 0) {
                    return (
                      <p className="text-[11px] text-slate-400 italic text-center py-6">
                        Aucun événement récent enregistré dans votre juridiction.
                      </p>
                    );
                  }

                  return filteredFeed.map((notif: any) => {
                    const isCritical = notif.message?.toLowerCase().includes("critical") || notif.message?.toLowerCase().includes("critique") || notif.message?.toLowerCase().includes("alerte");
                    const isWarning = notif.message?.toLowerCase().includes("warning") || notif.message?.toLowerCase().includes("avertissement") || notif.message?.toLowerCase().includes("retard");
                    const isSuccess = notif.message?.toLowerCase().includes("success") || notif.message?.toLowerCase().includes("succès") || notif.message?.toLowerCase().includes("réussite");

                    return (
                      <div 
                        key={notif.id || Math.random()} 
                        className={`p-3 rounded-xl border transition-all text-xs flex flex-col gap-1.5 ${
                          isCritical ? "bg-red-950/40 border-red-900/30 text-red-200" :
                          isWarning ? "bg-amber-950/40 border-amber-900/30 text-amber-200" :
                          isSuccess ? "bg-green-950/40 border-green-900/30 text-green-200" :
                          "bg-slate-900/50 border-slate-800/40 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold uppercase tracking-wider text-[9px] text-blue-400">
                            {notif.category || "NOTIFICATION"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {notif.timestamp ? new Date(notif.timestamp).toLocaleString("fr-FR") : ""}
                          </span>
                        </div>
                        <p className="font-semibold">{notif.message}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/20">
                          <span>Auteur : {notif.authorName || "Système"} ({notif.authorRole || "Rôle"})</span>
                          {notif.region && <span className="bg-blue-900/20 px-1.5 py-0.5 rounded text-[9px] text-blue-300 font-bold uppercase">{notif.region}</span>}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Centre de Notifications */}
        {userProfile && (!isAdmin || adminSubTab === "profile") && (
          <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200/60 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 relative">
                  <Bell className="w-5 h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white animate-pulse">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight uppercase">🔔 Centre de Notifications</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Suivi en temps réel des créations, affectations, et changements de phase/statut sur vos projets d'étude et de travaux.</p>
                </div>
              </div>

              {unreadNotificationsCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
                >
                  <Check className="w-4 h-4" />
                  <span>Tout marquer comme lu</span>
                </button>
              )}
            </div>

            {/* Filtres de notifications */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveNotifFilter("all")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      activeNotifFilter === "all"
                        ? "bg-slate-850 text-white border-slate-800"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Tous ({visibleNotifications ? visibleNotifications.length : 0})
                  </button>
                  <button
                    onClick={() => setActiveNotifFilter("creation")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      activeNotifFilter === "creation"
                        ? "bg-green-600 text-white border-green-500"
                        : "bg-green-50 text-green-700 border-green-150 hover:bg-green-100"
                    }`}
                  >
                    Créations ({visibleNotifications ? visibleNotifications.filter(n => n.category === "creation").length : 0})
                  </button>
                  <button
                    onClick={() => setActiveNotifFilter("update")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      activeNotifFilter === "update"
                        ? "bg-blue-600 text-white border-blue-500"
                        : "bg-blue-50 text-blue-700 border-blue-150 hover:bg-blue-100"
                    }`}
                  >
                    Mises à jour ({visibleNotifications ? visibleNotifications.filter(n => n.category === "update").length : 0})
                  </button>
                  <button
                    onClick={() => setActiveNotifFilter("assignment")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      activeNotifFilter === "assignment"
                        ? "bg-amber-600 text-white border-amber-500"
                        : "bg-amber-50 text-amber-700 border-amber-150 hover:bg-amber-100"
                    }`}
                  >
                    Affectations ({visibleNotifications ? visibleNotifications.filter(n => n.category === "assignment").length : 0})
                  </button>
                  <button
                    onClick={() => setActiveNotifFilter("status_change")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      activeNotifFilter === "status_change"
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-purple-50 text-purple-700 border-purple-150 hover:bg-purple-100"
                    }`}
                  >
                    Phases / Statuts ({visibleNotifications ? visibleNotifications.filter(n => n.category === "status_change").length : 0})
                  </button>
                </div>

                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase font-mono border border-slate-200">
                  Total : {filteredNotificationsToShow.length} / {visibleNotifications ? visibleNotifications.length : 0} affichées
                </span>
              </div>

              {/* Recherche & Filtres Avancés de Notifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                {/* Recherche textuelle */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par message, ouvrage..."
                    value={notifSearchQuery}
                    onChange={(e) => setNotifSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  {notifSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setNotifSearchQuery("")}
                      className="absolute right-2.5 top-2 hover:text-slate-600 text-slate-400 font-extrabold text-xs bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
                      title="Effacer la recherche"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filtre Projet */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={notifFilterProject}
                    onChange={(e) => setNotifFilterProject(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tous les ouvrages</option>
                    {uniqueProjectNames.map((projName) => (
                      <option key={projName} value={projName}>
                        {projName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtre Pôle */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={notifFilterPole}
                    onChange={(e) => setNotifFilterPole(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tous les Pôles</option>
                    {uniqueNotifPoles.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtre Date */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={notifFilterDateRange}
                    onChange={(e) => setNotifFilterDateRange(e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Toutes les dates</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">7 derniers jours</option>
                    <option value="month">30 derniers jours</option>
                  </select>
                </div>
              </div>

              {/* Reset indicator if filtered */}
              {(notifSearchQuery || notifFilterProject !== "all" || notifFilterPole !== "all" || notifFilterDateRange !== "all" || activeNotifFilter !== "all") && (
                <div className="flex items-center justify-between bg-blue-50/50 px-4 py-2 rounded-xl border border-blue-100 text-[11px] text-blue-700">
                  <span className="font-semibold">Filtres actifs appliqués</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifSearchQuery("");
                      setNotifFilterProject("all");
                      setNotifFilterPole("all");
                      setNotifFilterDateRange("all");
                      setActiveNotifFilter("all");
                    }}
                    className="hover:underline font-bold uppercase tracking-wider cursor-pointer text-blue-800"
                  >
                    Réinitialiser les filtres ✕
                  </button>
                </div>
              )}
            </div>

            {/* Liste des notifications */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {filteredNotificationsToShow.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl space-y-2">
                  <p className="text-sm font-bold text-slate-400">Aucune notification disponible</p>
                  <p className="text-xs text-slate-400">Il n'y a pas de changement correspondant à ce filtre ou pour vos pôles d'affectation.</p>
                </div>
              ) : (
                filteredNotificationsToShow.map((notif) => {
                  const isRead = (notif.readBy || []).includes(userProfile?.uid);
                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-left ${
                        isRead
                          ? "bg-slate-50/40 border-slate-100 hover:bg-slate-50 text-slate-600"
                          : "bg-blue-50/20 border-blue-100 hover:bg-blue-50/40 shadow-[0_2px_8px_rgba(59,130,246,0.02)] text-slate-800"
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {!isRead ? (
                            <span className="bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                              Nouveau
                            </span>
                          ) : (
                            <span className="bg-slate-200 text-slate-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                              Lu
                            </span>
                          )}

                          {notif.category === "creation" && (
                            <span className="bg-green-100 border border-green-200 text-green-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                              Création
                            </span>
                          )}
                          {notif.category === "update" && (
                            <span className="bg-blue-100 border border-blue-200 text-blue-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                              Mise à jour
                            </span>
                          )}
                          {notif.category === "assignment" && (
                            <span className="bg-amber-100 border border-amber-200 text-amber-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                              Affectation
                            </span>
                          )}
                          {notif.category === "status_change" && (
                            <span className="bg-purple-100 border border-purple-200 text-purple-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                              Phase / Statut
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 font-medium font-mono">
                            ⏱️ {new Date(notif.timestamp).toLocaleString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>

                        {/* Message with structured change highlights */}
                        <div className="space-y-2">
                          {/* If the message contains bullet points (multiple parameter changes), extract and highlight them */}
                          {notif.message.includes("\n• ") ? (
                            <div className="space-y-1.5">
                              <p className={`text-xs font-black ${isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                                {notif.message.split("\n• ")[0]}
                              </p>
                              <div className="bg-slate-100/80 rounded-xl p-2.5 border border-slate-200/80 space-y-1 font-mono text-[11px] text-slate-700">
                                {notif.message.split("\n• ").slice(1).map((changeItem, idx) => (
                                  <div key={idx} className="flex items-start gap-1.5">
                                    <span className="text-orange-600 font-bold shrink-0">❖</span>
                                    <span className="font-semibold">{changeItem}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className={`text-xs leading-relaxed whitespace-pre-line ${isRead ? 'text-slate-600' : 'text-slate-800 font-bold'}`}>
                              {notif.message}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                          <span>Ouvrage: <strong className="text-slate-600">{notif.projectName}</strong></span>
                          {notif.pole && <span>• Pôle: <strong className="text-slate-600">{notif.pole}</strong></span>}
                          {notif.region && <span>• Direction: <strong className="text-slate-600">{notif.region.replace("Région de transport gaz", "RTG")}</strong></span>}
                          <span>• Par: <strong className="text-slate-600">{notif.authorName} {notif.authorRole ? `(${notif.authorRole})` : ""}</strong></span>
                        </div>
                      </div>

                      {!isRead && (
                        <button
                          type="button"
                          onClick={() => onMarkAsRead(notif.id)}
                          className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                        >
                          <Check className="w-3.5 h-3.5 text-green-600" />
                          <span>Marquer comme lu</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Mes Projets & Affaires en Charge (Déclinaison hiérarchique) */}
        {(!isAdmin || adminSubTab === "mes_projets") && (
          <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200/60 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight uppercase">💼 Mes affaires et projets en charge</h3>
              <p className="text-[11px] text-slate-400 font-semibold">Liste des affaires d'ingénierie et de travaux qui vous sont formellement attribuées.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne 1: Chef de Projet */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">En tant que Chef de Projet ({
                  allProjects.filter(p => 
                    (p.chefDeProjetUid && p.chefDeProjetUid === userProfile?.uid) ||
                    (p.chefDeProjetEmail && p.chefDeProjetEmail.toLowerCase() === userProfile?.email?.toLowerCase()) ||
                    (p.chefDeProjetEtudeUid && p.chefDeProjetEtudeUid === userProfile?.uid) ||
                    (p.chefDeProjetEtudeEmail && p.chefDeProjetEtudeEmail.toLowerCase() === userProfile?.email?.toLowerCase()) ||
                    p.chefsDeProjetTravaux?.some((c: any) => c.uid === userProfile?.uid || c.email?.toLowerCase() === userProfile?.email?.toLowerCase()) ||
                    p.chefsDeProjetEtude?.some((c: any) => c.uid === userProfile?.uid || c.email?.toLowerCase() === userProfile?.email?.toLowerCase())
                  ).length
                })</h4>
              </div>

              <div className="space-y-3">
                {allProjects.filter(p => 
                  (p.chefDeProjetUid && p.chefDeProjetUid === userProfile?.uid) ||
                  (p.chefDeProjetEmail && p.chefDeProjetEmail.toLowerCase() === userProfile?.email?.toLowerCase()) ||
                  (p.chefDeProjetEtudeUid && p.chefDeProjetEtudeUid === userProfile?.uid) ||
                  (p.chefDeProjetEtudeEmail && p.chefDeProjetEtudeEmail.toLowerCase() === userProfile?.email?.toLowerCase()) ||
                  p.chefsDeProjetTravaux?.some((c: any) => c.uid === userProfile?.uid || c.email?.toLowerCase() === userProfile?.email?.toLowerCase()) ||
                  p.chefsDeProjetEtude?.some((c: any) => c.uid === userProfile?.uid || c.email?.toLowerCase() === userProfile?.email?.toLowerCase())
                ).map(p => (
                  <div key={p.id} className="p-4 bg-slate-50/50 border border-slate-150 rounded-2xl hover:bg-slate-50 transition-all space-y-2 text-left">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-extrabold text-slate-800 text-[11px] leading-normal">{p.name}</p>
                      <span className="px-2 py-0.5 bg-blue-100 border border-blue-200 text-blue-700 text-[9px] font-black rounded-full uppercase shrink-0">
                        {p.identity?.phase || "Étude"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Région: {p.identity?.region?.replace("Région de transport gaz", "RTG") || "N/A"}</span>
                      <span className="font-mono font-bold text-slate-600">Long: {p.identity?.caracteristiques?.longueur ? `${p.identity.caracteristiques.longueur} km` : "N/A"}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                        <span>Avancement Physique</span>
                        <span className="font-mono text-slate-600 font-bold">{p.travauxPlanification?.avancementPhysique || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${p.travauxPlanification?.avancementPhysique || 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))}

                {allProjects.filter(p => 
                  (p.chefDeProjetUid && p.chefDeProjetUid === userProfile?.uid) ||
                  (p.chefDeProjetEmail && p.chefDeProjetEmail.toLowerCase() === userProfile?.email?.toLowerCase()) ||
                  (p.chefDeProjetEtudeUid && p.chefDeProjetEtudeUid === userProfile?.uid) ||
                  (p.chefDeProjetEtudeEmail && p.chefDeProjetEtudeEmail.toLowerCase() === userProfile?.email?.toLowerCase()) ||
                  p.chefsDeProjetTravaux?.some((c: any) => c.uid === userProfile?.uid || c.email?.toLowerCase() === userProfile?.email?.toLowerCase()) ||
                  p.chefsDeProjetEtude?.some((c: any) => c.uid === userProfile?.uid || c.email?.toLowerCase() === userProfile?.email?.toLowerCase())
                ).length === 0 && (
                  <p className="text-xs text-slate-400 italic py-4 text-center font-medium">Aucune affaire attribuée en tant que Chef de Projet.</p>
                )}
              </div>
            </div>

            {/* Colonne 2: Superviseur */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">En tant que Superviseur / Directeur ({
                  allProjects.filter(p => 
                    (p.superviseurUid && p.superviseurUid === userProfile?.uid) ||
                    (p.superviseurEmail && p.superviseurEmail.toLowerCase() === userProfile?.email?.toLowerCase())
                  ).length
                })</h4>
              </div>

              <div className="space-y-3">
                {allProjects.filter(p => 
                  (p.superviseurUid && p.superviseurUid === userProfile?.uid) ||
                  (p.superviseurEmail && p.superviseurEmail.toLowerCase() === userProfile?.email?.toLowerCase())
                ).map(p => (
                  <div key={p.id} className="p-4 bg-slate-50/50 border border-slate-150 rounded-2xl hover:bg-slate-50 transition-all space-y-2 text-left">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-extrabold text-slate-800 text-[11px] leading-normal">{p.name}</p>
                      <span className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-700 text-[9px] font-black rounded-full uppercase shrink-0">
                        {p.identity?.phase || "Étude"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Chef de Projet: {p.chefDeProjetName || "Non désigné"}</span>
                      <span className="font-mono font-bold text-slate-600">Physique: {p.travauxPlanification?.avancementPhysique || 0}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                        <span>Avancement Physique</span>
                        <span className="font-mono text-slate-600 font-bold">{p.travauxPlanification?.avancementPhysique || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${p.travauxPlanification?.avancementPhysique || 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))}

                {allProjects.filter(p => 
                  (p.superviseurUid && p.superviseurUid === userProfile?.uid) ||
                  (p.superviseurEmail && p.superviseurEmail.toLowerCase() === userProfile?.email?.toLowerCase())
                ).length === 0 && (
                  <p className="text-xs text-slate-400 italic py-4 text-center font-medium">Aucun projet sous votre supervision directe.</p>
                )}
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Administration Box if user is Admin */}
        {isAdmin && (
          <div className="bg-white rounded-[32px] p-6 md:p-8 border-2 border-amber-500/20 shadow-lg space-y-6 relative overflow-hidden" id="admin-panel">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/[0.02] rounded-full filter blur-3xl pointer-events-none" />
            
            {deletingProfile && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3 text-red-600 mb-4">
                    <div className="p-2.5 bg-red-50 rounded-xl">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                        Supprimer le compte
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold font-mono">
                        ID : {deletingProfile.id}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 mb-6 text-left">
                    <p className="text-xs text-red-700 font-black mb-2">
                      Attention : Cette action est définitive et irréversible !
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                      Êtes-vous absolument sûr de vouloir supprimer le compte de l'ingénieur{" "}
                      <strong className="font-extrabold text-slate-800">{deletingProfile.name || "Sans Nom"}</strong>{" "}
                      ({deletingProfile.email}) ?
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setDeletingProfile(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const uidToDelete = deletingProfile.id;
                        const emailToDelete = deletingProfile.email;
                        setDeletingProfile(null);
                        await executeDeleteProfile(uidToDelete, emailToDelete);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-sm shadow-red-200 transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Oui, Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl shadow-sm">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-amber-800 tracking-wider">Espace Gestion de Base de Données</h3>
                <p className="text-[10px] text-slate-400 font-medium">Panneau d'administration de sécurité et d'outils collaboratifs pour l'application.</p>
              </div>
            </div>

            {adminSubTab === "gestion_plateforme" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Box 1: Drive Link Converter */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">1. Convertisseur Principal Google Drive</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Utilisez cet outil pour convertir de manière autonome les liens d'accès de votre compte Google Drive en liens de fichiers d'images directs exploitables instantanément par l'application dans la base Firebase.
                </p>
                <DriveLinkConverter />
              </div>

              {/* Box 2: Real-time Firebase Sync Status & Simulation */}
              <div className="space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">2. Raccordement Temps Réel Firebase</h4>
                  <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
                      <span>Firebase Firestore Connecté</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      La base de données en ligne Firestore synchronise en temps réel tous les documents, plans et commentaires ajoutés par l'administrateur. Tous les ingénieurs connectés visualisent les mises à jour sans rafraîchir.
                    </p>
                  </div>
                </div>

                {/* Super Admin Status Summary */}
                <div className="bg-blue-50/50 border border-blue-200/40 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                    <Shield className="w-4 h-4" />
                    <span>Statut d'Autorisation Élevé</span>
                  </div>
                  <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                    Vous êtes connecté en tant que Super Administrateur Principal de l'application. Vous disposez des privilèges d'écriture complets sur les clauses techniques, les fiches de contrôle QA/QC, les plans interactifs et la création de comptes d'utilisateurs.
                  </p>
                </div>
              </div>
            </div>
            )}
              
              {/* Box 3: Création Directe de Comptes Utilisateurs */}
              {adminSubTab === "gestion_compte" && (
                <div className="md:col-span-2 border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">3. Création directe de compte avec mot de passe</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Inscrivez directement un ingénieur ou un administrateur dans Firebase sans vous déconnecter.</p>
                  </div>
                </div>

                <div className="max-h-[520px] overflow-y-auto pr-1.5 space-y-2">
                <form onSubmit={handleAdminCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Noms d'utilisateur</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: ahmed_ali"
                      value={adminNewName}
                      onChange={(e) => setAdminNewName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Adresse e-mail</label>
                    <input
                      type="email"
                      required
                      placeholder="nom.prenom@sonelgaz.dz"
                      value={adminNewEmail}
                      onChange={(e) => setAdminNewEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Mot de passe</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Structure d'appartenance</label>
                    <input
                      type="text"
                      placeholder="Ex: Division Étude STG- Constantine"
                      value={adminNewStructure}
                      onChange={(e) => setAdminNewStructure(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Rôle assigné</label>
                    <select
                      value={adminNewRole}
                      onChange={(e: any) => setAdminNewRole(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                    >
                      <option value="Utilisateur">Utilisateur</option>
                      <option value="Directeur / Gérant">Directeur / Gérant</option>
                      <option value="Administrateur">Administrateur</option>
                    </select>
                  </div>

                  {(adminNewRole === "Directeur / Gérant" || adminNewPoste) && (
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[9px] font-black uppercase text-slate-500 block">Poste / Fonction Spécifique</label>
                      <select
                        value={adminNewPoste}
                        onChange={(e: any) => setAdminNewPoste(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800 cursor-pointer"
                      >
                        <option value="">-- Aucun poste spécifique défini --</option>
                        <option value="Directeur de région transport gaz">Directeur de Région Transport Gaz</option>
                        <option value="Chef de département étude et travaux">Chef de Département Études et Travaux</option>
                        <option value="Directeur principal étude et travaux">Directeur Principal Études et Travaux</option>
                        <option value="Directeur central étude et travaux">Directeur Central Études et Travaux</option>
                        <option value="Chef de département soutiens aux opérations lourdes">Chef de Département Soutien aux Opérations Lourdes</option>
                      </select>
                    </div>
                  )}

                  {/* Pôle, Direction, Département, District extra selectors */}
                  <div className="sm:col-span-2 lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-100 pt-3">
                    <div className="space-y-1.5 bg-white p-3 rounded-2xl border border-slate-100 shadow-xs text-left">
                      <label className="text-[9px] font-black uppercase text-slate-500 block">Pôle(s) d'affectation</label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {allowedPoles.map(p => {
                          const isChecked = adminNewPoles.includes(p);
                          return (
                            <label key={p} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAdminNewPoles([...adminNewPoles, p]);
                                  } else {
                                    setAdminNewPoles(adminNewPoles.filter(x => x !== p));
                                  }
                                }}
                                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                              />
                              <span>{p}</span>
                            </label>
                          );
                        })}
                        {allowedPoles.length === 0 && (
                          <span className="text-[10px] text-slate-400 italic">Aucun pôle autorisé</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-white p-3 rounded-2xl border border-slate-100 shadow-xs text-left">
                      <label className="text-[9px] font-black uppercase text-slate-500 block">Direction(s) d'affectation (DRTG)</label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {allowedDirections.map(d => {
                          const isChecked = adminNewDirections.includes(d);
                          return (
                            <label key={d} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAdminNewDirections([...adminNewDirections, d]);
                                  } else {
                                    setAdminNewDirections(adminNewDirections.filter(x => x !== d));
                                  }
                                }}
                                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                              />
                              <span>{d}</span>
                            </label>
                          );
                        })}
                        {allowedDirections.length === 0 && (
                          <span className="text-[10px] text-slate-400 italic">Aucune direction autorisée</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-500 block">Département</label>
                      <select
                        value={adminNewDepartement}
                        onChange={(e) => setAdminNewDepartement(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                      >
                        <option value="">Sélectionner un Département</option>
                        <option value="Département Etude et travaux">Département Etude et travaux</option>
                        <option value="Division Etude et Développement">Division Etude et Développement</option>
                        <option value="Division Soutiens aux opérations">Division Soutiens aux opérations</option>
                        <option value="Département Etude et Développement">Département Etude et Développement</option>
                        <option value="Département Soutiens aux opérations lourdes">Département Soutiens aux opérations lourdes</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-500 block">District de Rattachement</label>
                      <select
                        value={adminNewDistrict}
                        onChange={(e) => setAdminNewDistrict(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                      >
                        <option value="">Sélectionner un district</option>
                        {WILAYAS_ALGERIE_LIST.map((w) => {
                          const cleanName = w.includes(" - ") ? w.split(" - ")[1] : w;
                          return (
                            <option key={w} value={`${cleanName} District Gaz`}>
                              {cleanName} District Gaz
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                   {adminNewRole === "Utilisateur" && (
                    <div className="sm:col-span-2 lg:col-span-5 border-t border-slate-100 pt-4 space-y-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase text-slate-500 block">Privilèges d'accès généraux pour ce compte</span>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-inner">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={privilegeCalculateur} 
                              onChange={(e) => setPrivilegeCalculateur(e.target.checked)} 
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                            />
                            <span>Accès Calculateur</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={privilegeBordereau} 
                              onChange={(e) => setPrivilegeBordereau(e.target.checked)} 
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                            />
                            <span>Bordereau des prix</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={privilegeAjoutProjet} 
                              onChange={(e) => setPrivilegeAjoutProjet(e.target.checked)} 
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                            />
                            <span>Ajout Projet</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={privilegeEtude} 
                              onChange={(e) => setPrivilegeEtude(e.target.checked)} 
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                            />
                            <span>Section Étude</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={privilegeTravaux} 
                              onChange={(e) => setPrivilegeTravaux(e.target.checked)} 
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                            />
                            <span>Section Travaux</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase text-slate-500 block">Privilèges d'Accès & Modification des Projets</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-inner">
                          <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer select-none shadow-sm hover:border-blue-300 transition-all">
                            <input 
                              type="radio" 
                              name="project_privilege" 
                              value="all"
                              checked={projectPrivilege === "all"}
                              onChange={() => setProjectPrivilege("all")}
                              className="text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300 mt-0.5 cursor-pointer"
                            />
                            <div className="text-[11px] font-semibold text-slate-700">
                              <p className="font-extrabold text-slate-800">Édition Complète</p>
                              <p className="text-[10px] text-slate-400 font-medium">Modification autorisée pour tous les projets.</p>
                            </div>
                          </label>
                          
                          <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer select-none shadow-sm hover:border-blue-300 transition-all">
                            <input 
                              type="radio" 
                              name="project_privilege" 
                              value="assigned"
                              checked={projectPrivilege === "assigned"}
                              onChange={() => setProjectPrivilege("assigned")}
                              className="text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300 mt-0.5 cursor-pointer"
                            />
                            <div className="text-[11px] font-semibold text-slate-700">
                              <p className="font-extrabold text-slate-800">Projets assignés uniquement</p>
                              <p className="text-[10px] text-slate-400 font-medium">Édition si CP (Chargé de projet), lecture seule pour les autres.</p>
                            </div>
                          </label>

                          <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer select-none shadow-sm hover:border-blue-300 transition-all">
                            <input 
                              type="radio" 
                              name="project_privilege" 
                              value="readonly"
                              checked={projectPrivilege === "readonly"}
                              onChange={() => setProjectPrivilege("readonly")}
                              className="text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300 mt-0.5 cursor-pointer"
                            />
                            <div className="text-[11px] font-semibold text-slate-700">
                              <p className="font-extrabold text-slate-800">Lecture Seule Générale</p>
                              <p className="text-[10px] text-slate-400 font-medium">Consultation seule pour tous les projets (aucune modification).</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Clean, Full-width form action bar at the bottom */}
                  <div className="sm:col-span-2 lg:col-span-5 flex justify-end pt-4 border-t border-slate-100/60 mt-3 w-full">
                    <button
                      type="submit"
                      disabled={adminCreateLoading}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-black text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {adminCreateLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-white" />
                          <span>Créer le profil d'utilisateur</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
                </div>

                {adminCreateError && (
                  <FirebaseErrorBanner error={adminCreateError} projectId={activeConfig.projectId} />
                )}

                {adminCreateSuccess && (
                  <div className="p-3 bg-green-50 border border-green-100 text-green-700 text-xs rounded-xl font-bold flex items-center gap-1">
                    <CheckCircle className="w-4.5 h-4.5 text-green-600" />
                    <span>{adminCreateSuccess}</span>
                  </div>
                )}
              </div>
              )}
                       {/* Box 4: Liste des Comptes & Espace Privilèges */}
              {adminSubTab === "gestion_compte" && (
                <div className="md:col-span-2 border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">4. Liste des comptes & Espace Privilèges</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Modifiez les privilèges de chaque compte utilisateur ou supprimez des comptes.</p>
                    </div>
                  </div>

                  {/* Count Indicator */}
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase font-mono border border-slate-200">
                    Total : {filteredProfiles.length} / {visibleProfiles.length} comptes
                  </span>
                </div>

                {/* Search & Dynamic Filters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                  {/* Text Search Field */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, email, structure..."
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    {adminSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setAdminSearchQuery("")}
                        className="absolute right-2.5 top-2 hover:text-slate-600 text-slate-400 font-extrabold text-xs bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
                        title="Effacer la recherche"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Role filter */}
                  <div>
                    <select
                      value={adminFilterRole}
                      onChange={(e) => setAdminFilterRole(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="all">Tous les Rôles</option>
                      <option value="Administrateur">Administrateurs</option>
                      <option value="Super Administrateur">Super Administrateurs</option>
                      <option value="Utilisateur">Utilisateurs</option>
                    </select>
                  </div>

                  {/* Pole filter */}
                  <div>
                    <select
                      value={adminFilterPole}
                      onChange={(e) => setAdminFilterPole(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="all">Tous les Pôles</option>
                      {allowedPoles.map((pole) => (
                        <option key={pole} value={pole}>
                          {pole.replace("Pôle ", "")}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Direction (DRTG) filter */}
                  <div>
                    <select
                      value={adminFilterDirection}
                      onChange={(e) => setAdminFilterDirection(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="all">Toutes les Directions</option>
                      {allowedDirections.map((dir) => (
                        <option key={dir} value={dir}>
                          {dir.replace("Région de transport gaz ", "").replace("DRTG ", "").trim()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-wider">
                          <th className="px-4 py-3">Ingénieur</th>
                          <th className="px-4 py-3">Rôle / Email</th>
                          <th className="px-4 py-3">Privilèges Actuels</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filteredProfiles.map((prof) => {
                          const activeUid = user?.uid || userProfile?.uid;
                          const isActiveUser = prof.id === activeUid;
                          
                          return (
                            <tr key={prof.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="px-4 py-3">
                                <div className="font-extrabold text-slate-800 flex items-center gap-2">
                                  <span>{prof.name || "Sans Nom"}</span>
                                  {isActiveUser && (
                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-black rounded-md uppercase tracking-wider">
                                      Connecté
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">{prof.id}</div>
                                {allProjects.some(p => 
                                  p.chefDeProjetUid === prof.id || 
                                  p.chefDeProjetEmail?.toLowerCase() === prof.email?.toLowerCase() ||
                                  p.chefDeProjetEtudeUid === prof.id || 
                                  p.chefDeProjetEtudeEmail?.toLowerCase() === prof.email?.toLowerCase() ||
                                  p.superviseurUid === prof.id || 
                                  p.superviseurEmail?.toLowerCase() === prof.email?.toLowerCase() ||
                                  p.chefsDeProjetTravaux?.some((c: any) => c.uid === prof.id || c.email?.toLowerCase() === prof.email?.toLowerCase()) ||
                                  p.chefsDeProjetEtude?.some((c: any) => c.uid === prof.id || c.email?.toLowerCase() === prof.email?.toLowerCase())
                                ) && (
                                  <div className="mt-2 space-y-1 text-[9px]">
                                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Projets attribués :</span>
                                    <div className="flex flex-col gap-1 max-w-[240px]">
                                      {allProjects.filter(p => 
                                        p.chefDeProjetUid === prof.id || 
                                        p.chefDeProjetEmail?.toLowerCase() === prof.email?.toLowerCase() ||
                                        p.chefsDeProjetTravaux?.some((c: any) => c.uid === prof.id || c.email?.toLowerCase() === prof.email?.toLowerCase())
                                      ).map(p => (
                                        <div key={p.id} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-extrabold rounded-md border border-blue-100 truncate" title={p.name}>
                                          💼 CP Travaux : {p.name}
                                        </div>
                                      ))}
                                      {allProjects.filter(p => 
                                        p.chefDeProjetEtudeUid === prof.id || 
                                        p.chefDeProjetEtudeEmail?.toLowerCase() === prof.email?.toLowerCase() ||
                                        p.chefsDeProjetEtude?.some((c: any) => c.uid === prof.id || c.email?.toLowerCase() === prof.email?.toLowerCase())
                                      ).map(p => (
                                        <div key={p.id} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-md border border-emerald-100 truncate" title={p.name}>
                                          ✏️ CP Étude : {p.name}
                                        </div>
                                      ))}
                                      {allProjects.filter(p => p.superviseurUid === prof.id || p.superviseurEmail?.toLowerCase() === prof.email?.toLowerCase()).map(p => (
                                        <div key={p.id} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 font-extrabold rounded-md border border-amber-100 truncate" title={p.name}>
                                          🛡️ SUP : {p.name}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </td>
                              
                              <td className="px-4 py-3 space-y-1">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  prof.role === "Super Administrateur" ? "bg-red-50 text-red-700 border border-red-100" :
                                  prof.role === "Administrateur" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                  "bg-blue-50 text-blue-700 border border-blue-100"
                                }`}>
                                  {prof.role || "Utilisateur"}
                                </span>
                                {prof.structure && (
                                  <div className="text-[10px] text-blue-600 font-extrabold flex items-center gap-1 mt-0.5" title="Structure d'appartenance">
                                    <span>🏢</span> <span>{prof.structure}</span>
                                  </div>
                                )}
                                <div className="text-[10px] text-slate-500">{prof.email}</div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                                  <span className="font-semibold text-slate-400">MDP :</span>
                                  <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-700 font-bold select-all">
                                    {prof.virtualPassword || "Non défini"}
                                  </span>
                                </div>
                                {(prof.pole || prof.direction || prof.assignedPoles || prof.assignedDirections || prof.departement || prof.district) && (
                                  <div className="mt-1.5 pt-1 border-t border-slate-100 space-y-1.5 text-left">
                                    {prof.assignedPoles && prof.assignedPoles.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {prof.assignedPoles.map((p: string) => (
                                          <span key={p} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black rounded border border-indigo-100/60" title={p}>
                                            ⚡ {p.replace(/\(.*?\)/g, "").trim()}
                                          </span>
                                        ))}
                                      </div>
                                    ) : prof.pole ? (
                                      <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                                        <span>⚡</span> <span>{prof.pole}</span>
                                      </div>
                                    ) : null}

                                    {prof.assignedDirections && prof.assignedDirections.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {prof.assignedDirections.map((d: string) => (
                                          <span key={d} className="px-1.5 py-0.5 bg-teal-50 text-teal-700 text-[9px] font-black rounded border border-teal-100/60" title={d}>
                                            📍 {d.replace("Région de transport gaz ", "").replace("DRTG ", "").trim()}
                                          </span>
                                        ))}
                                      </div>
                                    ) : prof.direction ? (
                                      <div className="text-[10px] text-teal-600 font-bold flex items-center gap-1">
                                        <span>📍</span> <span>{prof.direction}</span>
                                      </div>
                                    ) : null}

                                    {prof.departement && (
                                      <div className="text-[10px] text-slate-600 font-bold flex items-center gap-1">
                                        <span>📂</span> <span>{prof.departement}</span>
                                      </div>
                                    )}
                                    {prof.district && (
                                      <div className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                                        <span>🔥</span> <span>{prof.district}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              <td className="px-4 py-3">
                                {prof.role === "Super Administrateur" || prof.role === "Administrateur" ? (
                                  <span className="text-[10px] text-slate-400 italic">Accès total administrateur</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${prof.privileges?.acces_calculateur !== false ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"}`}>
                                      Calculateur : {prof.privileges?.acces_calculateur !== false ? "Oui" : "Non"}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${prof.privileges?.acces_bordereau !== false ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"}`}>
                                      Bordereau : {prof.privileges?.acces_bordereau !== false ? "Oui" : "Non"}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${prof.privileges?.ajout_projet !== false ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"}`}>
                                      Créer Projets : {prof.privileges?.ajout_projet !== false ? "Oui" : "Non"}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${prof.privileges?.section_etude !== false ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"}`}>
                                      Sect. Étude : {prof.privileges?.section_etude !== false ? "Oui" : "Non"}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${prof.privileges?.section_travaux !== false ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"}`}>
                                      Sect. Travaux : {prof.privileges?.section_travaux !== false ? "Oui" : "Non"}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                      prof.privileges?.project_privilege === "readonly" ? "bg-red-50 text-red-600 border border-red-100" :
                                      prof.privileges?.project_privilege === "assigned" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                      "bg-green-50 text-green-700 border border-green-100"
                                    }`}>
                                      Projets : {
                                        prof.privileges?.project_privilege === "readonly" ? "Lecture Seule" :
                                        prof.privileges?.project_privilege === "assigned" ? "CP Pris en charge" :
                                        "Édition Totale"
                                      }
                                    </span>
                                  </div>
                                )}
                              </td>

                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!isActiveUser && (
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(prof)}
                                      className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-500 border border-slate-200/50 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                                      title="Modifier le compte"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {!isActiveUser && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteProfile(prof)}
                                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100/50 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                                      title="Supprimer compte"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {filteredProfiles.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-semibold italic">
                              Aucun compte utilisateur ne correspond à vos critères de recherche.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Account Edit Modal Popup specifically for the selected account */}
                {editingProfileId !== null && (
                  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl max-w-3xl w-full border border-slate-100 flex flex-col max-h-[92vh] animate-fade-in text-left">
                      
                      {/* Modal Header */}
                      <div className="p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between shrink-0 font-sans">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-wider">
                              Édition du compte
                            </h3>
                            <p className="text-[10px] text-slate-300">
                              Modifiez les détails pour le compte {editingProfileId}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setEditingProfileId(null)}
                          className="text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all font-bold text-xs cursor-pointer"
                        >
                          Fermer
                        </button>
                      </div>

                      {/* Scrollable Form Body */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Column 1: Identity & Structure */}
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100 pb-1">
                              1. Identité & Rattachement
                            </h4>
                            
                            {/* Name field (Noms d'utilisateur modification added!) */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">Noms d'utilisateur</label>
                              <input
                                type="text"
                                required
                                placeholder="Nom de l'utilisateur"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                              />
                            </div>

                            {/* Rôle assigné */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">Rôle assigné</label>
                              <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800 cursor-pointer"
                              >
                                <option value="Utilisateur">Utilisateur</option>
                                <option value="Directeur / Gérant">Directeur / Gérant</option>
                                <option value="Administrateur">Administrateur</option>
                              </select>
                            </div>

                            {(editRole === "Directeur / Gérant" || editPoste) && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-500 block">Poste / Fonction Spécifique</label>
                                <select
                                  value={editPoste}
                                  onChange={(e: any) => setEditPoste(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800 cursor-pointer"
                                >
                                  <option value="">-- Aucun poste spécifique défini --</option>
                                  <option value="Directeur de région transport gaz">Directeur de Région Transport Gaz</option>
                                  <option value="Chef de département étude et travaux">Chef de Département Études et Travaux</option>
                                  <option value="Directeur principal étude et travaux">Directeur Principal Études et Travaux</option>
                                  <option value="Directeur central étude et travaux">Directeur Central Études et Travaux</option>
                                  <option value="Chef de département soutiens aux opérations lourdes">Chef de Département Soutien aux Opérations Lourdes</option>
                                </select>
                              </div>
                            )}

                            {/* Structure d'appartenance */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">Structure d'appartenance</label>
                              <input
                                type="text"
                                value={editStructure}
                                onChange={(e) => setEditStructure(e.target.value)}
                                placeholder="Ex: Division Étude STG- Constantine"
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                              />
                            </div>

                            {/* Département / Division */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">Département / Division</label>
                              <select
                                value={editDepartement}
                                onChange={(e) => setEditDepartement(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800 cursor-pointer"
                              >
                                <option value="">Non défini</option>
                                <option value="Département Etude et travaux">Département Etude et travaux</option>
                                <option value="Division Etude et Développement">Division Etude et Développement</option>
                                <option value="Division Soutiens aux opérations">Division Soutiens aux opérations</option>
                                <option value="Département Etude et Développement">Département Etude et Développement</option>
                                <option value="Département Soutiens aux opérations lourdes">Département Soutiens aux opérations lourdes</option>
                              </select>
                            </div>

                            {/* District de Rattachement */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-500 block">District de Rattachement</label>
                              <select
                                value={editDistrict}
                                onChange={(e) => setEditDistrict(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800 cursor-pointer"
                              >
                                <option value="">Non défini</option>
                                {WILAYAS_ALGERIE_LIST.map((w) => {
                                  const cleanName = w.includes(" - ") ? w.split(" - ")[1] : w;
                                  return (
                                    <option key={w} value={`${cleanName} District Gaz`}>
                                      {cleanName} District Gaz
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            {/* Password input */}
                            <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Mot de passe (En clair)</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editPassword}
                                  onChange={(e) => setEditPassword(e.target.value)}
                                  className="flex-grow bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono font-bold text-slate-700"
                                  placeholder="Mot de passe"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const rand = "SG-" + Math.floor(100000 + Math.random() * 900000);
                                    setEditPassword(rand);
                                  }}
                                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer whitespace-nowrap transition-all active:scale-95"
                                  title="Générer un mot de passe automatique"
                                >
                                  Générer
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Column 2: Affectations & Privilèges */}
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100 pb-1">
                              2. Affectations géographiques & Droits
                            </h4>

                            {/* Pôles d'affectation */}
                            <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Pôle(s) d'affectation</label>
                              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                {allowedPoles.map(p => {
                                  const isChecked = editPoles.includes(p);
                                  return (
                                    <label key={p} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                      <input 
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setEditPoles([...editPoles, p]);
                                          } else {
                                            setEditPoles(editPoles.filter(x => x !== p));
                                          }
                                        }}
                                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                                      />
                                      <span>{p}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Directions d'affectation (DRTG) */}
                            <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">Direction(s) d'affectation (DRTG)</label>
                              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                {allowedDirections.map(d => {
                                  const isChecked = editDirections.includes(d);
                                  return (
                                    <label key={d} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                      <input 
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setEditDirections([...editDirections, d]);
                                          } else {
                                            setEditDirections(editDirections.filter(x => x !== d));
                                          }
                                        }}
                                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                                      />
                                      <span>{d.replace("Région de transport gaz ", "").replace("DRTG ", "").trim()}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Privilèges Utilisateur details */}
                            {editRole === "Utilisateur" && (
                              <div className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <label className="text-[9px] font-black uppercase text-slate-500 block">Privilèges d'accès généraux</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={editPrivilegeCalculateur}
                                      onChange={(e) => setEditPrivilegeCalculateur(e.target.checked)}
                                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                                    />
                                    <span>Calculateur</span>
                                  </label>
                                  <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={editPrivilegeBordereau}
                                      onChange={(e) => setEditPrivilegeBordereau(e.target.checked)}
                                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                                    />
                                    <span>Bordereau</span>
                                  </label>
                                  <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={editPrivilegeAjoutProjet}
                                      onChange={(e) => setEditPrivilegeAjoutProjet(e.target.checked)}
                                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                                    />
                                    <span>Ajout Projet</span>
                                  </label>
                                  <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={editPrivilegeEtude}
                                      onChange={(e) => setEditPrivilegeEtude(e.target.checked)}
                                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                                    />
                                    <span>Sect. Étude</span>
                                  </label>
                                  <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer select-none col-span-2">
                                    <input
                                      type="checkbox"
                                      checked={editPrivilegeTravaux}
                                      onChange={(e) => setEditPrivilegeTravaux(e.target.checked)}
                                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                                    />
                                    <span>Sect. Travaux</span>
                                  </label>
                                </div>

                                <div className="pt-2 border-t border-slate-200 space-y-1">
                                  <label className="text-[9px] font-black uppercase text-slate-400 block">Droit aux Projets</label>
                                  <select
                                    value={editProjectPrivilege}
                                    onChange={(e: any) => setEditProjectPrivilege(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none w-full cursor-pointer"
                                  >
                                    <option value="all">Édition Totale</option>
                                    <option value="assigned">CP Pris en charge uniquement</option>
                                    <option value="readonly">Lecture Seule Générale</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            {editRole === "Administrateur" && (
                              <div className="p-3 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-2xl border border-amber-100 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Accès total administrateur activé (tous les privilèges d'écriture et de lecture sont accordés par défaut).</span>
                              </div>
                            )}

                          </div>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingProfileId(null)}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSavePrivileges(editingProfileId)}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>Sauvegarder</span>
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Box 5: Personnalisation de l'Habillage et des Logos */}
              {adminSubTab === "gestion_plateforme" && (
                <div className="md:col-span-2 border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">5. Personnalisation de l'Habillage et des Logos (Firebase)</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Modifiez directement les images clés de l'application. Ces images sont stockées en temps réel dans Firebase Firestore sous forme compressée de haute qualité.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  {/* Item 1: Logo */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-500 block">Logo de l'application</span>
                      <p className="text-[9px] text-slate-400 font-medium mb-2">S'affiche en haut à gauche et sur l'écran d'accueil (recommandé: carré).</p>
                    </div>
                    <div 
                      style={{ height: '176px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
                      className="flex items-center justify-center border-2 border-dashed border-slate-200 bg-white p-3 rounded-2xl h-44 relative overflow-hidden group"
                    >
                      <img 
                        src={branding.logo} 
                        alt="Logo Preview" 
                        style={{ maxHeight: '150px', maxWidth: '100%', objectFit: 'contain' }}
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-grow flex items-center justify-center px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer active:scale-95 shadow-sm text-center">
                        <span>Téléverser</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const base64 = await compressImage(file, 400, 400);
                                await setDoc(doc(db, "settings", "branding"), { logo: base64 }, { merge: true });
                              } catch (err) {
                                console.error("Error updating logo:", err);
                              }
                            }
                          }}
                        />
                      </label>
                      <button
                        onClick={async () => {
                          await setDoc(doc(db, "settings", "branding"), { logo: "" }, { merge: true });
                        }}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100 text-[10px] font-bold transition-all flex items-center justify-center"
                        title="Réinitialiser"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Item 2: Welcome BG */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-500 block">Image d'Accueil (Couverture)</span>
                      <p className="text-[9px] text-slate-400 font-medium mb-2">Couverture du cahier des charges et fond en filigrane.</p>
                    </div>
                    <div 
                      style={{ height: '176px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
                      className="flex items-center justify-center border-2 border-dashed border-slate-200 bg-white p-2 rounded-2xl h-44 relative overflow-hidden group"
                    >
                      <img 
                        src={branding.welcome_bg} 
                        alt="Welcome BG Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-grow flex items-center justify-center px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer active:scale-95 shadow-sm text-center">
                        <span>Téléverser</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const base64 = await compressImage(file, 1000, 1000);
                                await setDoc(doc(db, "settings", "branding"), { welcome_bg: base64 }, { merge: true });
                              } catch (err) {
                                console.error("Error updating welcome_bg:", err);
                              }
                            }
                          }}
                        />
                      </label>
                      <button
                        onClick={async () => {
                          await setDoc(doc(db, "settings", "branding"), { welcome_bg: "" }, { merge: true });
                        }}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100 text-[10px] font-bold transition-all flex items-center justify-center"
                        title="Réinitialiser"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Item 3: Splash BG */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-500 block">Image de Fond d'Ouverture</span>
                      <p className="text-[9px] text-slate-400 font-medium mb-2">Arrière-plan flouté de l'écran de chargement / démarrage.</p>
                    </div>
                    <div 
                      style={{ height: '176px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
                      className="flex items-center justify-center border-2 border-dashed border-slate-200 bg-white p-2 rounded-2xl h-44 relative overflow-hidden group"
                    >
                      <img 
                        src={branding.splash_bg} 
                        alt="Splash BG Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-grow flex items-center justify-center px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer active:scale-95 shadow-sm text-center">
                        <span>Téléverser</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const base64 = await compressImage(file, 1000, 1000);
                                await setDoc(doc(db, "settings", "branding"), { splash_bg: base64 }, { merge: true });
                              } catch (err) {
                                console.error("Error updating splash_bg:", err);
                              }
                            }
                          }}
                        />
                      </label>
                      <button
                        onClick={async () => {
                          await setDoc(doc(db, "settings", "branding"), { splash_bg: "" }, { merge: true });
                        }}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100 text-[10px] font-bold transition-all flex items-center justify-center"
                        title="Réinitialiser"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Box 6: Demandes de récupération de mot de passe */}
              {adminSubTab === "gestion_compte" && (
                <div className="md:col-span-2 border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                    <Key className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">6. Demandes de récupération de mot de passe</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Consultez et validez les demandes d'accès et de récupération de mot de passe soumises par les ingénieurs.</p>
                  </div>
                </div>

                {requestActionMsg && (
                  <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 text-xs rounded-xl font-bold flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>{requestActionMsg}</span>
                  </div>
                )}

                <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-xs p-4">
                  {passwordRequests.length === 0 ? (
                    <div className="text-center py-6 space-y-2">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                      <p className="text-xs text-slate-500 font-semibold">Aucune demande de récupération de mot de passe enregistrée.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {passwordRequests.map((req) => {
                        // Find matching profile to check if a virtualPassword exists
                        const matchedProf = profiles.find(
                          (p) => 
                            p.email?.toLowerCase() === req.email?.toLowerCase() || 
                            p.email?.toLowerCase().split("@")[0] === req.username?.toLowerCase()
                        );
                        const isPending = req.status === "pending";

                        return (
                          <div 
                            key={req.id} 
                            className={`p-4 rounded-xl border transition-all text-left flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              isPending 
                                ? "bg-amber-50/30 border-amber-200/60 hover:bg-amber-50/50" 
                                : "bg-slate-50/50 border-slate-200/60"
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-xs text-slate-800">
                                  {req.fullName || req.username}
                                </span>
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  @{req.username}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  isPending 
                                    ? "bg-amber-100 text-amber-700 border border-amber-200" 
                                    : "bg-green-100 text-green-700 border border-green-200"
                                }`}>
                                  {isPending ? "En attente" : "Traité"}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500 font-medium font-semibold">
                                <div>
                                  <span className="text-slate-400">Email pro : </span>
                                  <span className="font-semibold text-slate-700">{req.email}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Demandé le : </span>
                                  <span className="font-mono">{req.requestedAt ? new Date(req.requestedAt).toLocaleString("fr-FR") : "N/A"}</span>
                                </div>
                                {matchedProf && (
                                  <div className="sm:col-span-2 mt-1 p-2 bg-white border border-slate-150 rounded-lg flex items-center justify-between gap-2 shadow-inner">
                                    <div>
                                      <span className="text-[10px] text-slate-400 uppercase font-black block">Mot de passe de sécurité actuel</span>
                                      <span className="font-mono font-bold text-slate-800 text-xs">
                                        {matchedProf.virtualPassword || "Authentification externe uniquement (Google, etc.)"}
                                      </span>
                                    </div>
                                    {matchedProf.virtualPassword && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(matchedProf.virtualPassword);
                                          setRequestActionMsg(`Mot de passe de ${req.fullName || req.username} copié dans le presse-papiers !`);
                                          setTimeout(() => setRequestActionMsg(""), 3000);
                                        }}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold border border-slate-200"
                                      >
                                        Copier
                                      </button>
                                    )}
                                  </div>
                                )}
                                {!isPending && (
                                  <div className="sm:col-span-2 text-[10px] text-slate-400 mt-1 italic font-semibold">
                                    Traité par {req.resolvedBy} le {req.resolvedAt ? new Date(req.resolvedAt).toLocaleString("fr-FR") : "N/A"}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const docRef = doc(db, "password_requests", req.id);
                                      await setDoc(docRef, { 
                                        status: "resolved", 
                                        resolvedAt: new Date().toISOString(),
                                        resolvedBy: userProfile?.name || "Administrateur"
                                      }, { merge: true });
                                      setRequestActionMsg(`La demande de @${req.username} a été marquée comme résolue.`);
                                    } catch (err) {
                                      console.error("Error updating request:", err);
                                      setRequestActionMsg("Erreur lors de la mise à jour de la demande.");
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Marquer Traité</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await deleteDoc(doc(db, "password_requests", req.id));
                                    setRequestActionMsg(`La demande de @${req.username} a été supprimée.`);
                                  } catch (err) {
                                    console.error("Error deleting request:", err);
                                    setRequestActionMsg("Erreur lors de la suppression de la demande.");
                                  }
                                }}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100 transition-all cursor-pointer"
                                title="Supprimer la demande de la liste"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Box 7: Historique de connexion & Statistiques de la plateforme */}
              {adminSubTab === "gestion_plateforme" && (
                <div className="md:col-span-2 border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                      <BarChart3 className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">7. Historique de connexion & Statistiques</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Consultez l'activité des utilisateurs et les indicateurs d'utilisation de la plateforme.</p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm("Êtes-vous sûr de vouloir vider l'historique complet des connexions de la plateforme ?")) {
                        try {
                          for (const log of connectionLogs) {
                            await deleteDoc(doc(db, "connection_logs", log.id));
                          }
                          alert("L'historique de connexion a été vidé avec succès !");
                        } catch (err) {
                          console.error("Error clearing logs:", err);
                        }
                      }
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    Vider l'historique
                  </button>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                      <LogIn className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Total Connexions</span>
                      <span className="text-base font-black text-slate-800 font-mono">{connectionLogs.length}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-2.5 bg-green-100 text-green-700 rounded-xl">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Utilisateurs uniques</span>
                      <span className="text-base font-black text-slate-800 font-mono">
                        {new Set(connectionLogs.map(log => log.userEmail || log.userId)).size}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex items-center gap-3 sm:col-span-2">
                    <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Profil le plus actif</span>
                      <span className="text-xs font-bold text-slate-800 block truncate font-semibold" title={(() => {
                        if (connectionLogs.length === 0) return "Aucun log";
                        const counts: { [key: string]: { count: number, name: string } } = {};
                        connectionLogs.forEach(log => {
                          const email = log.userEmail || "Inconnu";
                          if (!counts[email]) counts[email] = { count: 0, name: log.userName || email };
                          counts[email].count += 1;
                        });
                        let maxEmail = "";
                        let maxCount = 0;
                        Object.keys(counts).forEach(email => {
                          if (counts[email].count > maxCount) {
                            maxCount = counts[email].count;
                            maxEmail = email;
                          }
                        });
                        return maxEmail ? `${counts[maxEmail].name} (${maxCount} fois)` : "N/A";
                      })()}>
                        {(() => {
                          if (connectionLogs.length === 0) return "N/A";
                          const counts: { [key: string]: { count: number, name: string } } = {};
                          connectionLogs.forEach(log => {
                            const email = log.userEmail || "Inconnu";
                            if (!counts[email]) counts[email] = { count: 0, name: log.userName || email };
                            counts[email].count += 1;
                          });
                          let maxEmail = "";
                          let maxCount = 0;
                          Object.keys(counts).forEach(email => {
                            if (counts[email].count > maxCount) {
                              maxCount = counts[email].count;
                              maxEmail = email;
                            }
                          });
                          return maxEmail ? `${counts[maxEmail].name} (${maxCount} connexions)` : "N/A";
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Distribution stats */}
                {connectionLogs.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/30 p-4 rounded-2xl border border-slate-100">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase text-slate-500 block">Répartition par Rôle</span>
                      <div className="space-y-1.5 text-xs">
                        {(() => {
                          const counts: { [key: string]: number } = {};
                          connectionLogs.forEach(l => {
                            const role = l.userRole || "Utilisateur";
                            counts[role] = (counts[role] || 0) + 1;
                          });
                          return Object.keys(counts).map(role => {
                            const pct = Math.round((counts[role] / connectionLogs.length) * 100);
                            return (
                              <div key={role} className="space-y-1 text-left">
                                <div className="flex justify-between text-[10px] font-bold text-slate-600">
                                  <span>{role}</span>
                                  <span>{counts[role]} ({pct}%)</span>
                                </div>
                                <div className="w-full bg-slate-200/50 h-1 rounded-full overflow-hidden">
                                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200/60 pt-2 md:pt-0 md:pl-4">
                      <span className="text-[10px] font-black uppercase text-slate-500 block">Répartition par Pôle d'origine</span>
                      <div className="space-y-1.5 text-xs">
                        {(() => {
                          const counts: { [key: string]: number } = {};
                          connectionLogs.forEach(l => {
                            let pole = l.userPole || "Non spécifié";
                            if (pole.includes("ACO")) pole = "Pôle ACO";
                            else if (pole.includes("BBO")) pole = "Pôle BBO";
                            counts[pole] = (counts[pole] || 0) + 1;
                          });
                          return Object.keys(counts).map(pole => {
                            const pct = Math.round((counts[pole] / connectionLogs.length) * 100);
                            return (
                              <div key={pole} className="space-y-1 text-left">
                                <div className="flex justify-between text-[10px] font-bold text-slate-600">
                                  <span>{pole}</span>
                                  <span>{counts[pole]} ({pct}%)</span>
                                </div>
                                <div className="w-full bg-slate-200/50 h-1 rounded-full overflow-hidden">
                                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection History table */}
                <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-2 items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500">Journal détaillé d'activité</span>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Rechercher dans les logs..."
                        value={logSearchQuery}
                        onChange={(e) => setLogSearchQuery(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-48 shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-wider">
                          <th className="px-4 py-2.5">Ingénieur / Email</th>
                          <th className="px-4 py-2.5">Rôle / Structure d'appartenance</th>
                          <th className="px-4 py-2.5">Horodatage</th>
                          <th className="px-4 py-2.5">Système / Navigateur</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {(() => {
                          const filteredLogs = connectionLogs.filter(log => {
                            const q = logSearchQuery.toLowerCase().trim();
                            if (!q) return true;
                            return (
                              (log.userName || "").toLowerCase().includes(q) ||
                              (log.userEmail || "").toLowerCase().includes(q) ||
                              (log.userRole || "").toLowerCase().includes(q) ||
                              (log.userStructure || "").toLowerCase().includes(q) ||
                              (log.userPole || "").toLowerCase().includes(q) ||
                              (log.userDirection || "").toLowerCase().includes(q)
                            );
                          });

                          if (filteredLogs.length === 0) {
                            return (
                              <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">
                                  Aucun enregistrement d'activité ne correspond à la recherche.
                                </td>
                              </tr>
                            );
                          }

                          return filteredLogs.map((log) => {
                            const agent = log.userAgent || "";
                            let browser = "Inconnu";
                            if (agent.includes("Firefox")) browser = "Firefox";
                            else if (agent.includes("Chrome")) browser = "Chrome";
                            else if (agent.includes("Safari")) browser = "Safari";
                            else if (agent.includes("Edge")) browser = "Edge";
                            
                            let os = "Inconnu";
                            if (agent.includes("Windows")) os = "Windows";
                            else if (agent.includes("Macintosh")) os = "Mac OS";
                            else if (agent.includes("Linux")) os = "Linux";
                            else if (agent.includes("Android")) os = "Android";
                            else if (agent.includes("iPhone")) os = "iOS";

                            return (
                              <tr key={log.id} className="hover:bg-slate-50/50 transition-all text-[11px]">
                                <td className="px-4 py-2.5 text-left">
                                  <div className="font-extrabold text-slate-800">{log.userName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono font-bold">{log.userEmail}</div>
                                </td>
                                <td className="px-4 py-2.5 text-left">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                      log.userRole?.includes("Admin") 
                                        ? "bg-amber-100 text-amber-700 border border-amber-200" 
                                        : "bg-blue-100 text-blue-700 border border-blue-200"
                                    }`}>
                                      {log.userRole || "Utilisateur"}
                                    </span>
                                    <span className="text-slate-500 font-extrabold text-[10px]">
                                      {log.userStructure || "N/A"}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[10px] text-slate-600 text-left">
                                  {log.timestamp ? new Date(log.timestamp).toLocaleString("fr-FR") : "N/A"}
                                </td>
                                <td className="px-4 py-2.5 text-slate-500 text-left">
                                  <span className="font-bold">{browser}</span> <span className="text-[10px] text-slate-400 font-mono">({os})</span>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              )}

              {/* Box 8: Activation et configuration des widgets de la page d'accueil (Super Admin Only) */}
              {adminSubTab === "gestion_plateforme" && (
                <div className="md:col-span-2 border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                    <SlidersHorizontal className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">8. Contrôle des Widgets de l'Accueil</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Activez ou désactivez les statistiques et widgets avancés visibles sur la page d'accueil pour l'ensemble des utilisateurs.</p>
                  </div>
                </div>

                {isSuperAdmin ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    {/* Widget 2 Toggle */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs flex flex-col justify-between space-y-3">
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] font-black uppercase text-blue-600">Widget 2 : Phases &amp; Avancement</span>
                        <p className="text-[10px] text-slate-500 leading-snug">Affiche le nombre de projets par phase (Étude, Travaux, etc.) et le taux d'avancement moyen.</p>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400">Statut: {widgetConfig?.widget2Enabled ? "Activé" : "Désactivé"}</span>
                        <button
                          type="button"
                          onClick={() => onToggleWidget?.("widget2")}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            widgetConfig?.widget2Enabled ? "bg-orange-500" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              widgetConfig?.widget2Enabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Widget 3 Toggle */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs flex flex-col justify-between space-y-3">
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] font-black uppercase text-amber-600">Widget 3 : Indicateurs par Pôle</span>
                        <p className="text-[10px] text-slate-500 leading-snug">Affiche la répartition géographique des projets par pôle et wilayas de transport gazier.</p>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400">Statut: {widgetConfig?.widget3Enabled ? "Activé" : "Désactivé"}</span>
                        <button
                          type="button"
                          onClick={() => onToggleWidget?.("widget3")}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            widgetConfig?.widget3Enabled ? "bg-orange-500" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              widgetConfig?.widget3Enabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Widget 4 Toggle */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs flex flex-col justify-between space-y-3">
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] font-black uppercase text-emerald-600">Widget 4 : Contraintes &amp; Activités</span>
                        <p className="text-[10px] text-slate-500 leading-snug">Affiche les contraintes de chantier à résoudre et le fil des activités en temps réel.</p>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400">Statut: {widgetConfig?.widget4Enabled ? "Activé" : "Désactivé"}</span>
                        <button
                          type="button"
                          onClick={() => onToggleWidget?.("widget4")}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            widgetConfig?.widget4Enabled ? "bg-orange-500" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              widgetConfig?.widget4Enabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/50 border border-amber-200/40 rounded-2xl flex items-center gap-3">
                    <Shield className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-800 font-medium">
                      Seul le <span className="font-extrabold text-amber-900">Super Administrateur de la plateforme</span> (compte boudjada.youcef@gmail.com) dispose des habilitations nécessaires pour activer ou désactiver ces widgets de la page d'accueil.
                    </p>
                  </div>
                )}
              </div>
              )}

              {/* Box 9: Gestion du Diaporama de la page d'accueil (Super Admin Only) */}
              {adminSubTab === "gestion_plateforme" && (
              <div className="md:col-span-2 border-t border-slate-100 pt-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                      <SlidersHorizontal className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">9. Gestion du Diaporama d'Accueil (Carrousel)</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Configurez les diapositives de la grande bannière d'accueil de la plateforme en temps réel.</p>
                    </div>
                  </div>

                  {isSuperAdmin && !slideFormOpen && (
                    <div className="flex gap-2">
                      {slides.length === 0 && (
                        <button
                          type="button"
                          onClick={handleImportDefaultSlides}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border border-slate-200"
                        >
                          Importer les slides par défaut
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSlideId(null);
                          setSlideTitle("");
                          setSlideBadge("");
                          setSlideDesc("");
                          setSlideOrder(slides.length + 1);
                          setSlideImageUrl("");
                          setSlideImageFile(null);
                          setSlideFormOpen(true);
                          setSlideErrorMsg("");
                          setSlideSuccessMsg("");
                        }}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter un slide</span>
                      </button>
                    </div>
                  )}
                </div>

                {slideSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl font-bold text-left animate-fade-in flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{slideSuccessMsg}</span>
                  </div>
                )}

                {slideErrorMsg && (
                  <div className="p-3.5 bg-red-50 border border-red-100 text-red-800 text-xs rounded-xl font-bold text-left animate-fade-in flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{slideErrorMsg}</span>
                  </div>
                )}

                {!isSuperAdmin ? (
                  <div className="p-4 bg-amber-50/50 border border-amber-200/40 rounded-2xl flex items-center gap-3">
                    <Shield className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-800 font-medium">
                      Seul le <span className="font-extrabold text-amber-900">Super Administrateur de la plateforme</span> dispose des permissions d'écriture pour insérer ou supprimer des diapositives de la page d'accueil.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Interactive slide edit/creation form */}
                    {slideFormOpen && (
                      <form onSubmit={handleSaveSlide} className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60 space-y-4 text-left animate-fade-in">
                        <h5 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                          {editingSlideId ? "Modifier la diapositive" : "Créer une nouvelle diapositive"}
                        </h5>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Titre du Slide</label>
                            <input
                              type="text"
                              value={slideTitle}
                              onChange={(e) => setSlideTitle(e.target.value)}
                              placeholder="ex : Extension du Réseau Transport Gaz"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 font-medium text-slate-800"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Badge (Surtitre)</label>
                            <input
                              type="text"
                              value={slideBadge}
                              onChange={(e) => setSlideBadge(e.target.value)}
                              placeholder="ex : Normes &amp; Travaux"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 font-medium text-slate-800"
                            />
                          </div>

                          <div className="space-y-1 md:col-span-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Description / Texte Principal</label>
                            <textarea
                              value={slideDesc}
                              onChange={(e) => setSlideDesc(e.target.value)}
                              placeholder="Saisissez le texte d'accompagnement de la diapositive..."
                              rows={3}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 font-medium text-slate-800 leading-relaxed"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Ordre d'affichage</label>
                            <input
                              type="number"
                              min="1"
                              value={slideOrder}
                              onChange={(e) => setSlideOrder(Number(e.target.value) || 1)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 font-medium text-slate-800"
                              required
                            />
                          </div>

                          {/* Image setup */}
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Sélectionner un Fichier Image (Compresse auto)</label>
                            <div className="flex gap-2 items-center">
                              <label className="flex-grow flex items-center justify-center px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm text-center">
                                <span>{slideImageFile ? `Fichier: ${slideImageFile.name.substring(0, 20)}...` : "Choisir un fichier image"}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      setSlideImageFile(e.target.files[0]);
                                      setSlideImageUrl("");
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                              {(slideImageFile || slideImageUrl) && (
                                <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                                  <img
                                    src={slideImageFile ? URL.createObjectURL(slideImageFile) : slideImageUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1 md:col-span-3">
                            <span className="text-[9px] text-slate-400 font-medium block text-center">- OU SAISIR UNE URL D'IMAGE DIRECTE -</span>
                            <input
                              type="text"
                              value={slideImageUrl}
                              onChange={(e) => {
                                      setSlideImageUrl(e.target.value);
                                      if (e.target.value.trim()) {
                                        setSlideImageFile(null);
                                      }
                                    }}
                              placeholder="https://example.com/ma-belle-image.jpg"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500 font-medium text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSlideFormOpen(false);
                              setEditingSlideId(null);
                            }}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            disabled={slideSaving}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            {slideSaving ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Enregistrement...</span>
                              </>
                            ) : (
                              <span>{editingSlideId ? "Mettre à jour" : "Créer le Slide"}</span>
                            )}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Slide List */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-xs text-left">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/45">
                        <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Diapositives Actives ({slides.length > 0 ? slides.length : "3 par défaut"})</h5>
                      </div>

                      {slides.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 space-y-3">
                          <SlidersHorizontal className="w-8 h-8 text-slate-300 mx-auto" />
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-500">Aucune diapositive personnalisée dans Firestore</p>
                            <p className="text-[10px] text-slate-400 max-w-sm mx-auto">La page d'accueil affiche actuellement les 3 diapositives par défaut pré-configurées. Importez-les pour commencer à les éditer !</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleImportDefaultSlides}
                            disabled={slideSaving}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-orange-500 hover:text-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-slate-600 shadow-sm"
                          >
                            Importer les slides d'origine
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-150 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                <th className="px-4 py-2.5 text-left w-24">Image</th>
                                <th className="px-4 py-2.5 text-left">Contenu du Slide</th>
                                <th className="px-4 py-2.5 text-center w-20">Ordre</th>
                                <th className="px-4 py-2.5 text-right w-36">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {slides.map((sld) => (
                                <tr key={sld.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                                  <td className="px-4 py-3 text-left">
                                    <div className="w-16 h-10 rounded border border-slate-200 overflow-hidden bg-slate-100 shadow-inner">
                                      <img
                                        src={resolveSlideImage(sld.image, 0)}
                                        alt={sld.title}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => { e.currentTarget.src = slideDesert; }}
                                      />
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-left space-y-0.5">
                                    {sld.badge && (
                                      <span className="inline-block px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded text-[9px] font-black uppercase tracking-wider">
                                        {sld.badge}
                                      </span>
                                    )}
                                    <div className="font-extrabold text-xs text-slate-800">{sld.title}</div>
                                    <div className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-xl truncate">
                                      {sld.desc}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center font-bold text-xs text-slate-600">
                                    {sld.order || 1}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleEditSlideClick(sld)}
                                        className="p-1 text-slate-500 hover:text-orange-500 hover:bg-orange-50 rounded transition-all cursor-pointer"
                                        title="Modifier"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSlide(sld.id)}
                                        className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                                        title="Supprimer"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              )}
            </div>
          )}

        {/* Regular User Notice */}
        {!isAdmin && (
          <div className="bg-white rounded-[32px] p-6 border border-slate-200/60 shadow-sm flex gap-4 items-start max-w-2xl">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Accès standard ingénieur</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Vous possédez actuellement un accès standard. Vous pouvez utiliser l'intégralité des calculateurs d'ingénierie, générer des procès-verbaux de chantiers officiels, et poser des questions techniques à notre Conseiller IA.
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-2">
                Note : Seuls les comptes de Super Administrateur (ex : <span className="font-bold">boudjada.youcef@gmail.com</span>) peuvent insérer, modifier ou supprimer des schémas techniques de haute pression ou d'ouvrages dans la base de données.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Not logged in: Show Authentication Gateway Forms
  return (
    <div className="max-w-md mx-auto my-6" id="auth-form-container">
      <div className="bg-white rounded-[32px] p-8 border border-slate-200/60 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.08),_inset_0_1px_3px_rgba(255,255,255,0.8)] space-y-6 relative overflow-hidden">
        {/* Soft decorative blur */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full filter blur-3xl pointer-events-none" />
        
        {showForgotPassword ? (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto shadow-sm border border-amber-100">
                <Key className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                Mot de Passe Oublié
              </h2>
              <p className="text-xs text-slate-400 font-medium px-4">
                Saisissez votre nom d'utilisateur professionnel pour demander un mot de passe de récupération de compte.
              </p>
            </div>

            {resetError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-semibold leading-relaxed flex gap-2">
                <span className="shrink-0 text-red-500">⚠️</span>
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-green-50 border border-green-100 text-green-700 text-xs rounded-xl font-bold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordResetRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 block">Nom d'utilisateur</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="nom.prenom"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800 shadow-[inset_1px_1px_2.5px_rgba(0,0,0,0.03)]"
                  />
                  <div className="absolute right-3.5 text-slate-400 font-mono text-xs">@</div>
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
              >
                {resetLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                <span>Envoyer la demande</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetError("");
                  setResetSuccess("");
                  setResetUsername("");
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer text-center"
              >
                Retour à la connexion
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-sm border border-blue-100">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                Connexion Espace Gaz
              </h2>
              <p className="text-xs text-slate-400 font-medium px-4">
                Saisissez vos identifiants professionnels pour débloquer les calculateurs, le bordereau des prix et le conseiller IA.
              </p>
            </div>

            {errorMsg && (
              <FirebaseErrorBanner error={errorMsg} projectId={activeConfig.projectId} />
            )}

            {successMsg && (
              <div className="p-3 bg-green-50 border border-green-100 text-green-700 text-xs rounded-xl font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 block">Nom d'utilisateur</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="nom.prenom"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800 shadow-[inset_1px_1px_2.5px_rgba(0,0,0,0.03)]"
                  />
                  <div className="absolute right-3.5 text-slate-400 font-mono text-xs">@</div>
                </div>
                {email.toLowerCase() === "boudjada.youcef@gmail.com" && (
                  <p className="text-[9px] text-amber-600 font-bold animate-pulse mt-1">✓ Compte Administrateur Détecté !</p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-500 block">Mot de passe de sécurité</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setResetUsername(email); // Autofill
                    }}
                    className="text-[10px] text-blue-600 hover:underline font-bold"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-medium text-slate-800 shadow-[inset_1px_1px_2.5px_rgba(0,0,0,0.03)]"
                  />
                  <div className="absolute right-3.5 text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                <span>Se connecter</span>
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">OU ALORS</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {/* Google Authentication popup */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" alt="Google Logo" className="w-4 h-4" />
              <span>Continuer avec Google</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
