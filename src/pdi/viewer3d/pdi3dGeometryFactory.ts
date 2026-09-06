/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * COPYRIGHT (C) 2026 ORTHOGONAL - ENG. ALL RIGHTS RESERVED.
 * 
 * MODULE : FABRIQUE GÉOMÉTRIQUE 3D SOLIDE
 * Modélisation physique des tubes, coudes, brides, vannes, soudures et supports.
 * Référentiels : ASME B16.9, ASME B16.5, ASME B36.10M, MSS SP-58.
 * Version : 021C-ETAPE-C (05 Septembre 2026)
 */

import * as THREE from "three";
import { TROUVAY_CAUVIN_CATALOG } from "../catalog/trouvayCauvinCatalog";
import type { MaterialPalette } from "./pdi3dMaterials";
import type { IsoPipingSupport } from "../isometric/supports/pdiMssSupportEngine";

export interface PipeDimensions {
  odM: number;
  idM: number;
  thicknessM: number;
  dn: number;
}

export function getPipeStandardDimensions(dn: number): PipeDimensions {
  // Recherche dans le catalogue Trouvay & Cauvin
  const catalogEntry = TROUVAY_CAUVIN_CATALOG.coude_90?.dimensions?.find((d) => d.dn === dn);
  let odMm = catalogEntry?.odMm;
  if (!odMm) {
    if (dn <= 15) odMm = 21.3;
    else if (dn <= 20) odMm = 26.7;
    else if (dn <= 25) odMm = 33.4;
    else if (dn <= 40) odMm = 48.3;
    else if (dn <= 50) odMm = 60.3;
    else if (dn <= 80) odMm = 88.9;
    else if (dn <= 100) odMm = 114.3;
    else if (dn <= 150) odMm = 168.3;
    else if (dn <= 200) odMm = 219.1;
    else if (dn <= 250) odMm = 273.0;
    else if (dn <= 300) odMm = 323.8;
    else if (dn <= 400) odMm = 406.4;
    else if (dn <= 500) odMm = 508.0;
    else odMm = dn * 1.1;
  }

  const thicknessMm = catalogEntry?.thicknessMm || Math.max(3.2, odMm * 0.05);
  const odM = odMm * 0.001;
  const thicknessM = thicknessMm * 0.001;
  const idM = Math.max(0.005, odM - 2 * thicknessM);

  return { odM, idM, thicknessM, dn };
}

export class Pdi3dGeometryFactory {
  private materials: MaterialPalette;

  constructor(materials: MaterialPalette) {
    this.materials = materials;
  }

  /**
   * Crée un tube solide cylindrique extrudé entre deux points 3D
   */
  public createPipeCylinder(
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    dn: number,
    material: THREE.Material,
    userData: Record<string, any> = {}
  ): THREE.Mesh {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const length = dir.length();
    if (length < 0.001) return new THREE.Mesh();

    const dims = getPipeStandardDimensions(dn);
    const radius = dims.odM / 2;

    const geometry = new THREE.CylinderGeometry(radius, radius, length, 24, 1, false);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Positionner au point milieu
    const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    mesh.position.copy(midPoint);

    // Aligner l'axe Y du cylindre sur la direction p1 -> p2
    const yAxis = new THREE.Vector3(0, 1, 0);
    const normDir = dir.clone().normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(yAxis, normDir);
    mesh.quaternion.copy(quaternion);

    mesh.userData = {
      ...userData,
      isPdiEntity: true,
      entityType: "segment",
      dn,
      odMm: dims.odM * 1000,
      thicknessMm: dims.thicknessM * 1000,
      lengthM: length,
    };

    return mesh;
  }

  /**
   * Crée un coude torique ou composé 3D
   */
  public createElbowMesh(
    center: THREE.Vector3,
    inVec: THREE.Vector3,
    outVec: THREE.Vector3,
    dn: number,
    material: THREE.Material,
    userData: Record<string, any> = {}
  ): THREE.Object3D {
    const group = new THREE.Group();
    const dims = getPipeStandardDimensions(dn);
    const radius = dims.odM / 2;
    const bendRadius = Math.max(0.04, radius * 3.0); // Standard 1.5D Long Radius ASME B16.9

    if (inVec && outVec && inVec.lengthSq() > 0.0001 && outVec.lengthSq() > 0.0001) {
      // Points d'entrée et de sortie tangentiels du coude ASME B16.9
      const dirIn = inVec.clone().normalize();
      const dirOut = outVec.clone().normalize();
      const pStart = center.clone().addScaledVector(dirIn, -bendRadius);
      const pEnd = center.clone().addScaledVector(dirOut, bendRadius);

      // Courbe quadratique pour un raccordement fluide
      const curve = new THREE.QuadraticBezierCurve3(pStart, center, pEnd);
      const tubeGeom = new THREE.TubeGeometry(curve, 16, radius, 18, false);
      const tubeMesh = new THREE.Mesh(tubeGeom, material);
      tubeMesh.castShadow = true;
      tubeMesh.receiveShadow = true;
      tubeMesh.userData = { ...userData, isPdiEntity: true, entityType: "fitting", fittingType: "coude", dn };
      group.add(tubeMesh);
    } else {
      // Raccord sphéroïde pour jonctions multi-directions
      const geom = new THREE.SphereGeometry(radius * 1.05, 20, 20);
      const sphereMesh = new THREE.Mesh(geom, material);
      sphereMesh.position.copy(center);
      sphereMesh.castShadow = true;
      sphereMesh.receiveShadow = true;
      sphereMesh.userData = { ...userData, isPdiEntity: true, entityType: "fitting", fittingType: "coude", dn };
      group.add(sphereMesh);
    }

    return group;
  }

  /**
   * Crée une bride normalisée avec collet, face de joint et boulonnerie ASME B16.5
   */
  public createFlangeMesh(
    position: THREE.Vector3,
    normal: THREE.Vector3,
    dn: number,
    material: THREE.Material,
    userData: Record<string, any> = {}
  ): THREE.Object3D {
    const group = new THREE.Group();
    const dims = getPipeStandardDimensions(dn);
    const pipeR = dims.odM / 2;
    const flangeR = pipeR * 1.8;
    const flangeThickness = Math.max(0.015, dims.odM * 0.22);

    // 1. Disque de bride principal
    const discGeom = new THREE.CylinderGeometry(flangeR, flangeR, flangeThickness, 28);
    const discMesh = new THREE.Mesh(discGeom, material);
    discMesh.castShadow = true;
    discMesh.receiveShadow = true;

    // 2. Face surélevée (Raised Face)
    const rfGeom = new THREE.CylinderGeometry(pipeR * 1.3, pipeR * 1.3, flangeThickness * 0.15, 24);
    const rfMesh = new THREE.Mesh(rfGeom, this.materials.gasket);
    rfMesh.position.y = flangeThickness * 0.55;

    // 3. Couronne de boulons / goujons ASME B16.5
    const boltCount = dn <= 40 ? 4 : dn <= 100 ? 8 : dn <= 200 ? 12 : 16;
    const boltCircleR = (pipeR + flangeR) * 0.52;
    const boltRadius = Math.max(0.005, dims.odM * 0.05);

    const boltGroup = new THREE.Group();
    for (let i = 0; i < boltCount; i++) {
      const angle = (i / boltCount) * Math.PI * 2;
      const bx = Math.cos(angle) * boltCircleR;
      const bz = Math.sin(angle) * boltCircleR;
      const boltGeom = new THREE.CylinderGeometry(boltRadius, boltRadius, flangeThickness * 1.4, 8);
      const boltMesh = new THREE.Mesh(boltGeom, this.materials.flangeBolts);
      boltMesh.position.set(bx, 0, bz);
      boltMesh.castShadow = true;
      boltGroup.add(boltMesh);
    }

    const localAssembly = new THREE.Group();
    localAssembly.add(discMesh);
    localAssembly.add(rfMesh);
    localAssembly.add(boltGroup);

    // Orientation selon la normale de la ligne
    const yAxis = new THREE.Vector3(0, 1, 0);
    const norm = normal.clone().normalize();
    if (norm.lengthSq() > 0.0001) {
      localAssembly.quaternion.setFromUnitVectors(yAxis, norm);
    }
    localAssembly.position.copy(position);

    group.add(localAssembly);
    group.userData = { ...userData, isPdiEntity: true, entityType: "fitting", fittingType: "bride" };
    return group;
  }

  /**
   * Crée une vanne industrielle 3D avec corps, chapeau, tige et volant de manœuvre rouge
   */
  public createValveMesh(
    position: THREE.Vector3,
    flowDir: THREE.Vector3,
    dn: number,
    material: THREE.Material,
    userData: Record<string, any> = {}
  ): THREE.Object3D {
    const group = new THREE.Group();
    const dims = getPipeStandardDimensions(dn);
    const pipeR = dims.odM / 2;
    const bodyLength = Math.max(0.12, dims.odM * 2.5);

    // 1. Corps de vanne (double cône tronqué ou sphéroïde usiné)
    const bodyGeom = new THREE.CylinderGeometry(pipeR * 1.4, pipeR * 1.4, bodyLength, 20);
    const bodyMesh = new THREE.Mesh(bodyGeom, this.materials.valveBody);
    bodyMesh.rotation.z = Math.PI / 2; // Axe d'écoulement
    bodyMesh.castShadow = true;

    // 2. Chapeau et tige de vanne (Bonnet)
    const stemHeight = bodyLength * 1.3;
    const stemGeom = new THREE.CylinderGeometry(pipeR * 0.3, pipeR * 0.3, stemHeight, 14);
    const stemMesh = new THREE.Mesh(stemGeom, this.materials.stainlessSteel);
    stemMesh.position.y = stemHeight / 2;
    stemMesh.castShadow = true;

    // 3. Volant de manœuvre (Handwheel)
    const wheelR = bodyLength * 0.55;
    const wheelGeom = new THREE.TorusGeometry(wheelR, pipeR * 0.15, 12, 24);
    const wheelMesh = new THREE.Mesh(wheelGeom, this.materials.valveHandwheel);
    wheelMesh.rotation.x = Math.PI / 2;
    wheelMesh.position.y = stemHeight;
    wheelMesh.castShadow = true;

    // Rayons du volant
    const spokeGeom = new THREE.CylinderGeometry(pipeR * 0.08, pipeR * 0.08, wheelR * 2, 8);
    const spoke1 = new THREE.Mesh(spokeGeom, this.materials.valveHandwheel);
    spoke1.rotation.z = Math.PI / 2;
    spoke1.position.y = stemHeight;
    const spoke2 = new THREE.Mesh(spokeGeom, this.materials.valveHandwheel);
    spoke2.rotation.x = Math.PI / 2;
    spoke2.position.y = stemHeight;

    const valveAssembly = new THREE.Group();
    valveAssembly.add(bodyMesh);
    valveAssembly.add(stemMesh);
    valveAssembly.add(wheelMesh);
    valveAssembly.add(spoke1);
    valveAssembly.add(spoke2);

    // Aligner avec la direction d'écoulement
    const norm = flowDir.clone().normalize();
    if (norm.lengthSq() > 0.0001) {
      const xAxis = new THREE.Vector3(1, 0, 0);
      valveAssembly.quaternion.setFromUnitVectors(xAxis, norm);
    }
    valveAssembly.position.copy(position);

    group.add(valveAssembly);
    group.userData = { ...userData, isPdiEntity: true, entityType: "fitting", fittingType: "vanne" };
    return group;
  }

  /**
   * Crée un cordon de soudure 3D circulaire (Weld Bead)
   */
  public createWeldRingMesh(
    position: THREE.Vector3,
    normal: THREE.Vector3,
    dn: number,
    location: "shop" | "field" | "golden",
    userData: Record<string, any> = {}
  ): THREE.Object3D {
    const dims = getPipeStandardDimensions(dn);
    const pipeR = dims.odM / 2;
    const beadRadius = Math.max(0.004, dims.odM * 0.04);

    const mat =
      location === "golden"
        ? this.materials.weldGolden
        : location === "field"
        ? this.materials.weldField
        : this.materials.weldShop;

    const geom = new THREE.TorusGeometry(pipeR * 1.01, beadRadius, 12, 24);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;

    const zAxis = new THREE.Vector3(0, 0, 1);
    const norm = normal.clone().normalize();
    if (norm.lengthSq() > 0.0001) {
      mesh.quaternion.setFromUnitVectors(zAxis, norm);
    }
    mesh.position.copy(position);

    mesh.userData = {
      ...userData,
      isPdiEntity: true,
      entityType: "weld",
      location,
      dn,
    };

    return mesh;
  }

  /**
   * Crée un support de tuyauterie 3D MSS SP-58 (Patin, Guide, Point Fixe, Pendard)
   */
  public createSupportMesh(
    support: IsoPipingSupport,
    pipePos: THREE.Vector3,
    dn: number
  ): THREE.Object3D {
    const group = new THREE.Group();
    const dims = getPipeStandardDimensions(dn);
    const pipeR = dims.odM / 2;
    const shoeHeight = Math.max(0.08, pipeR * 1.2);
    const shoeLength = Math.max(0.2, dims.odM * 1.8);

    // 1. Patin de glissement en acier (Pipe Shoe MSS SP-58 Type 39)
    const shoeGeom = new THREE.BoxGeometry(dims.odM * 1.2, shoeHeight, shoeLength);
    const shoeMesh = new THREE.Mesh(shoeGeom, this.materials.supportSteel);
    shoeMesh.position.set(pipePos.x, pipePos.y - (pipeR + shoeHeight / 2), pipePos.z);
    shoeMesh.castShadow = true;
    group.add(shoeMesh);

    // 2. Bride étrier U-Bolt (Type 24) ou collier 2 boulons
    const uboltGeom = new THREE.TorusGeometry(pipeR * 1.08, 0.008, 10, 20, Math.PI);
    const uboltMesh = new THREE.Mesh(uboltGeom, this.materials.flangeBolts);
    uboltMesh.position.set(pipePos.x, pipePos.y, pipePos.z);
    group.add(uboltMesh);

    // 3. Massif de fondation béton au sol (Z = 0) si élévation > 0
    if (pipePos.y > 0.3) {
      const padHeight = 0.15;
      const padWidth = 0.45;
      const padGeom = new THREE.BoxGeometry(padWidth, padHeight, padWidth);
      const padMesh = new THREE.Mesh(padGeom, this.materials.concretePad);
      padMesh.position.set(pipePos.x, padHeight / 2, pipePos.z);
      padMesh.receiveShadow = true;
      group.add(padMesh);

      // Poteau métallique de liaison
      const columnHeight = pipePos.y - (pipeR + shoeHeight) - padHeight;
      if (columnHeight > 0.05) {
        const colGeom = new THREE.CylinderGeometry(0.04, 0.04, columnHeight, 12);
        const colMesh = new THREE.Mesh(colGeom, this.materials.supportSteel);
        colMesh.position.set(pipePos.x, padHeight + columnHeight / 2, pipePos.z);
        group.add(colMesh);
      }
    }

    group.userData = {
      isPdiEntity: true,
      entityType: "support",
      tag: support.tag,
      typeCode: support.type,
      typeLabelFr: support.comments || `Support MSS ${support.type}`,
      standard: "MSS SP-58",
      designLoadKn: support.customLoads?.fz ? Math.abs(support.customLoads.fz) : 5,
    };

    return group;
  }
}
