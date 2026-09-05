/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * COPYRIGHT (C) 2026 ORTHOGONAL - ENG. ALL RIGHTS RESERVED.
 * 
 * MODULE : MATÉRIAUX & SHADERS 3D PBR INDUSTRIELS
 * Référentiels : ASME B31.3, ISO 14692, ASTM A106, AISI 316.
 * Version : 021C-ETAPE-C (05 Septembre 2026)
 */

import * as THREE from "three";
import type { RenderShadingMode } from "./types3d";

export interface MaterialPalette {
  carbonSteel: THREE.MeshStandardMaterial;
  stainlessSteel: THREE.MeshStandardMaterial;
  flangeBolts: THREE.MeshStandardMaterial;
  valveBody: THREE.MeshStandardMaterial;
  valveHandwheel: THREE.MeshStandardMaterial;
  gasket: THREE.MeshStandardMaterial;
  weldShop: THREE.MeshStandardMaterial;
  weldField: THREE.MeshStandardMaterial;
  weldGolden: THREE.MeshStandardMaterial;
  supportSteel: THREE.MeshStandardMaterial;
  concretePad: THREE.MeshStandardMaterial;
  highlightSelected: THREE.MeshStandardMaterial;
  highlightHover: THREE.MeshStandardMaterial;
  wireframeMat: THREE.MeshBasicMaterial;
  getSpoolMaterial: (spoolId?: string, spoolColor?: string, mode?: RenderShadingMode) => THREE.Material;
  getServiceMaterial: (service?: string, mode?: RenderShadingMode) => THREE.Material;
}

const SPOOL_COLOR_PALETTE = [
  "#38bdf8", // Sky blue
  "#34d399", // Emerald
  "#fbbf24", // Amber
  "#f472b6", // Rose
  "#a78bfa", // Purple
  "#fb923c", // Orange
  "#2dd4bf", // Teal
  "#818cf8", // Indigo
  "#f87171", // Red coral
  "#a3e635", // Lime
];

export function createPdi3dMaterialPalette(): MaterialPalette {
  const carbonSteel = new THREE.MeshStandardMaterial({
    color: 0x475569, // Slate steel
    metalness: 0.85,
    roughness: 0.32,
    envMapIntensity: 1.0,
  });

  const stainlessSteel = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Bright stainless 316L
    metalness: 0.95,
    roughness: 0.22,
    envMapIntensity: 1.2,
  });

  const flangeBolts = new THREE.MeshStandardMaterial({
    color: 0xcfd8dc,
    metalness: 0.9,
    roughness: 0.2,
  });

  const valveBody = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.7,
    roughness: 0.4,
  });

  const valveHandwheel = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Industrial safety red
    metalness: 0.4,
    roughness: 0.45,
  });

  const gasket = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.85,
    metalness: 0.1,
  });

  const weldShop = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0369a1,
    emissiveIntensity: 0.4,
    metalness: 0.6,
    roughness: 0.4,
  });

  const weldField = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    emissive: 0xbe123c,
    emissiveIntensity: 0.5,
    metalness: 0.6,
    roughness: 0.4,
  });

  const weldGolden = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    emissive: 0xb45309,
    emissiveIntensity: 0.6,
    metalness: 0.8,
    roughness: 0.3,
  });

  const supportSteel = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.75,
    roughness: 0.4,
  });

  const concretePad = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    roughness: 0.9,
    metalness: 0.05,
  });

  const highlightSelected = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00d0f0,
    emissiveIntensity: 0.8,
    metalness: 0.5,
    roughness: 0.2,
  });

  const highlightHover = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.4,
    metalness: 0.4,
    roughness: 0.3,
  });

  const wireframeMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
  });

  const spoolCache = new Map<string, THREE.MeshStandardMaterial>();
  const serviceCache = new Map<string, THREE.MeshStandardMaterial>();

  const getSpoolMaterial = (spoolId?: string, spoolColor?: string, mode: RenderShadingMode = "color_by_spool") => {
    if (mode === "wireframe") return wireframeMat;
    if (mode === "realistic") return carbonSteel;
    const key = spoolId || "SP-00";
    if (spoolCache.has(key)) return spoolCache.get(key)!;

    let hex = spoolColor;
    if (!hex) {
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) % SPOOL_COLOR_PALETTE.length;
      }
      hex = SPOOL_COLOR_PALETTE[Math.abs(hash)];
    }

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex),
      metalness: 0.65,
      roughness: 0.38,
      bumpScale: 0.05,
    });
    spoolCache.set(key, mat);
    return mat;
  };

  const getServiceMaterial = (service?: string, mode: RenderShadingMode = "color_by_service") => {
    if (mode === "wireframe") return wireframeMat;
    if (mode === "realistic") return carbonSteel;
    const key = (service || "default").toLowerCase();
    if (serviceCache.has(key)) return serviceCache.get(key)!;

    let col = 0x0284c7; // Default Blue Gaz/Procédé
    if (key.includes("eau") || key.includes("water")) col = 0x10b981; // Green
    else if (key.includes("vapeur") || key.includes("steam")) col = 0xf59e0b; // Amber
    else if (key.includes("condensat")) col = 0xeab308; // Yellow
    else if (key.includes("huile") || key.includes("oil") || key.includes("hydro")) col = 0xd97706; // Ochre
    else if (key.includes("incendie") || key.includes("fire")) col = 0xef4444; // Red
    else if (key.includes("air") || key.includes("azote") || key.includes("n2")) col = 0x06b6d4; // Cyan

    const mat = new THREE.MeshStandardMaterial({
      color: col,
      metalness: 0.7,
      roughness: 0.35,
    });
    serviceCache.set(key, mat);
    return mat;
  };

  return {
    carbonSteel,
    stainlessSteel,
    flangeBolts,
    valveBody,
    valveHandwheel,
    gasket,
    weldShop,
    weldField,
    weldGolden,
    supportSteel,
    concretePad,
    highlightSelected,
    highlightHover,
    wireframeMat,
    getSpoolMaterial,
    getServiceMaterial,
  };
}
