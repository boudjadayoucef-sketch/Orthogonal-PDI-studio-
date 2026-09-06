/**
 * ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS (PD&I)
 * COPYRIGHT (C) 2026 ORTHOGONAL - ENG. ALL RIGHTS RESERVED.
 * 
 * MODULE : GESTIONNAIRE DE SCÈNE 3D, ORBITE & RENDU
 * Contrôles cinématiques, presets de vue, sélection par raycasting et capture.
 * Version : 021C-ETAPE-C (05 Septembre 2026)
 */

import * as THREE from "three";
import { createPdi3dMaterialPalette, type MaterialPalette } from "./pdi3dMaterials";
import { Pdi3dGeometryFactory } from "./pdi3dGeometryFactory";
import type {
  Viewer3dOptions,
  Viewer3dDataPayload,
  Selected3dEntity,
  CameraViewPreset,
  CameraProjectionType,
} from "./types3d";

export class Pdi3dSceneManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private cameraPerspective: THREE.PerspectiveCamera;
  private cameraOrthographic: THREE.OrthographicCamera;
  private activeCamera: THREE.Camera;
  private materials: MaterialPalette;
  private factory: Pdi3dGeometryFactory;

  // Modèle et géométrie
  private modelRoot: THREE.Group;
  private gridHelper: THREE.GridHelper | null = null;
  private axesHelper: THREE.AxesHelper | null = null;
  private raycaster: THREE.Raycaster;
  private mousePos: THREE.Vector2;

  // Contrôles d'orbite internes fluides
  private target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private spherical: THREE.Spherical = new THREE.Spherical(15, Math.PI / 3, Math.PI / 4);
  private isDragging: boolean = false;
  private isPanning: boolean = false;
  private previousMousePosition = { x: 0, y: 0 };
  private animationFrameId: number | null = null;
  private autoRotateSpeed: number = 0.005;

  // État des options
  private currentOptions: Viewer3dOptions;
  private currentData: Viewer3dDataPayload | null = null;
  private onEntitySelected?: (entity: Selected3dEntity | null) => void;
  private onEntityHover?: (entity: Selected3dEntity | null) => void;
  private hoveredMesh: THREE.Mesh | null = null;

  constructor(
    container: HTMLElement,
    options: Viewer3dOptions,
    onEntitySelected?: (entity: Selected3dEntity | null) => void,
    onEntityHover?: (entity: Selected3dEntity | null) => void
  ) {
    this.container = container;
    this.currentOptions = { ...options };
    this.onEntitySelected = onEntitySelected;
    this.onEntityHover = onEntityHover;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Moteur de Rendu WebGL
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    container.replaceChildren(this.renderer.domElement);

    // 2. Scène
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f18); // Fond sombre technique PD&I

    // 3. Caméras
    const aspect = width / height;
    this.cameraPerspective = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    const orthoFrustum = 8;
    this.cameraOrthographic = new THREE.OrthographicCamera(
      (-orthoFrustum * aspect) / 2,
      (orthoFrustum * aspect) / 2,
      orthoFrustum / 2,
      -orthoFrustum / 2,
      0.1,
      1000
    );

    this.activeCamera =
      options.projection === "orthographic" ? this.cameraOrthographic : this.cameraPerspective;

    // 4. Matériaux et Usine
    this.materials = createPdi3dMaterialPalette();
    this.factory = new Pdi3dGeometryFactory(this.materials);
    this.modelRoot = new THREE.Group();
    this.scene.add(this.modelRoot);

    this.raycaster = new THREE.Raycaster();
    this.mousePos = new THREE.Vector2();

    this.setupLighting();
    this.setupEnvironment();
    this.bindEvents();
    this.updateCameraPosition();
    this.startRenderLoop();
  }

  private setupLighting(): void {
    // Lumière ambiante douce
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.75);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    // Lumière principale avec ombres portées
    const mainDirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    mainDirLight.position.set(20, 30, 25);
    mainDirLight.castShadow = true;
    mainDirLight.shadow.mapSize.width = 2048;
    mainDirLight.shadow.mapSize.height = 2048;
    mainDirLight.shadow.camera.near = 0.5;
    mainDirLight.shadow.camera.far = 150;
    const d = 15;
    mainDirLight.shadow.camera.left = -d;
    mainDirLight.shadow.camera.right = d;
    mainDirLight.shadow.camera.top = d;
    mainDirLight.shadow.camera.bottom = -d;
    mainDirLight.shadow.bias = -0.0005;
    this.scene.add(mainDirLight);

    // Lumière de débouchage opposée
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.5);
    fillLight.position.set(-20, -10, -20);
    this.scene.add(fillLight);
  }

  private setupEnvironment(): void {
    // Grille métrique au sol
    if (this.currentOptions.showGroundGrid) {
      this.gridHelper = new THREE.GridHelper(30, 30, 0x0284c7, 0x1e293b);
      this.gridHelper.position.y = -0.01;
      this.scene.add(this.gridHelper);
    }

    // Repère XYZ (X=Rouge/Est, Y=Vert/Nord, Z=Bleu/Élévation)
    if (this.currentOptions.showCompassAxes) {
      this.axesHelper = new THREE.AxesHelper(1.5);
      this.axesHelper.position.set(-5, 0.1, -5);
      this.scene.add(this.axesHelper);
    }
  }

  /**
   * Construit la tuyauterie solide à partir des données
   */
  public buildModel(data: Viewer3dDataPayload, options?: Partial<Viewer3dOptions>): void {
    this.currentData = data;
    if (options) this.currentOptions = { ...this.currentOptions, ...options };

    // Vider le modèle existant
    while (this.modelRoot.children.length > 0) {
      const obj = this.modelRoot.children[0];
      this.modelRoot.remove(obj);
    }

    const { nodes, segments, welds, spools, supports } = data;
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const spoolMap = new Map(spools.map((s) => [s.id, s]));

    // 1. Fonction de conversion de coordonnées CAD Tuyauterie -> Repère Three.js
    // En ingénierie de tuyauterie : X = Est, Y = Nord, Z = Élévation (Hauteur)
    // Dans Three.js : X = Est, Y = Élévation (Haut vertical), Z = Nord
    const toThree = (x: number, y: number, z: number) => new THREE.Vector3(x, z, y);

    const segMap = new Map(segments.map((s) => [s.id, s]));

    // 1. Construction des tubes extrudés (Segments) & Raccords en ligne (Fittings)
    for (const seg of segments) {
      const fromNode = nodeMap.get(seg.fromNodeId);
      const toNode = nodeMap.get(seg.toNodeId);
      if (!fromNode || !toNode) continue;

      // Déterminer le spool auquel appartient ce segment
      const attachedSpool = spools.find((sp) => sp.segmentIds.includes(seg.id));
      const spoolId = attachedSpool?.id;
      const spoolColor = attachedSpool?.color;

      // Filtrage par spool actif
      if (
        this.currentOptions.selectedSpoolId &&
        this.currentOptions.selectedSpoolId !== "all" &&
        spoolId !== this.currentOptions.selectedSpoolId
      ) {
        continue;
      }

      // Matériau selon le mode d'ombrage
      let mat: THREE.Material;
      if (this.currentOptions.shadingMode === "color_by_spool") {
        mat = this.materials.getSpoolMaterial(spoolId, spoolColor, "color_by_spool");
      } else if (this.currentOptions.shadingMode === "color_by_service") {
        mat = this.materials.getServiceMaterial(seg.service || seg.lineFunction, "color_by_service");
      } else if (this.currentOptions.shadingMode === "wireframe") {
        mat = this.materials.wireframeMat;
      } else {
        mat =
          seg.material?.includes("316") || seg.material?.includes("Inox")
            ? this.materials.stainlessSteel
            : this.materials.carbonSteel;
      }

      const p1 = toThree(fromNode.x, fromNode.y, fromNode.z);
      const p2 = toThree(toNode.x, toNode.y, toNode.z);
      const segVec = new THREE.Vector3().subVectors(p2, p1);
      const segLen = segVec.length();
      const normDir = segLen > 0.0001 ? segVec.clone().normalize() : new THREE.Vector3(1, 0, 0);

      // Tube cylindrique solide extrudé
      const pipeMesh = this.factory.createPipeCylinder(p1, p2, seg.dn, mat, {
        id: seg.id,
        tag: seg.tag || `SEG-${seg.id.slice(0, 6)}`,
        dn: seg.dn,
        material: seg.material,
        schedule: seg.spec || "40",
        spoolId,
        spoolColor,
        service: seg.service || "Gaz / Procédé",
        pressureClass: seg.pressureClass || seg.pn || "Class 300",
        lengthM: seg.length || segLen,
      });

      this.modelRoot.add(pipeMesh);

      // Raccords en ligne (Inline Fittings : brides, vannes, clapets)
      if (seg.fittings && Array.isArray(seg.fittings)) {
        for (const fit of seg.fittings) {
          let alpha = 0.5;
          if (typeof fit.localPosition === "number" && fit.localPosition >= 0 && fit.localPosition <= 1) {
            alpha = fit.localPosition;
          } else if (typeof fit.cumulativePosition === "number" && segLen > 0.01) {
            alpha = Math.max(0.05, Math.min(0.95, fit.cumulativePosition / segLen));
          }
          const fitPos = new THREE.Vector3().lerpVectors(p1, p2, alpha);
          const fitDn = fit.dn || seg.dn;

          if (fit.type.includes("vanne") || fit.type.includes("soupape") || fit.type.includes("robinet")) {
            const valve = this.factory.createValveMesh(fitPos, normDir, fitDn, mat, {
              id: fit.id,
              label: fit.label || `Vanne DN${fitDn}`,
              dn: fitDn,
              spoolId,
            });
            this.modelRoot.add(valve);
          } else if (fit.type.includes("bride") || fit.type === "jmi") {
            const flange = this.factory.createFlangeMesh(fitPos, normDir, fitDn, mat, {
              id: fit.id,
              label: fit.label || `Bride DN${fitDn}`,
              dn: fitDn,
              spoolId,
            });
            this.modelRoot.add(flange);
          }
        }
      }
    }

    // 2. Construction des raccords & équipements aux nœuds
    const nodeConnMap = new Map<string, Array<{ seg: typeof segments[0]; otherNodeId: string; dir: THREE.Vector3 }>>();
    for (const seg of segments) {
      const fN = nodeMap.get(seg.fromNodeId);
      const tN = nodeMap.get(seg.toNodeId);
      if (!fN || !tN) continue;
      const vFrom = toThree(fN.x, fN.y, fN.z);
      const vTo = toThree(tN.x, tN.y, tN.z);
      const d1 = new THREE.Vector3().subVectors(vTo, vFrom).normalize();
      const d2 = d1.clone().negate();

      if (!nodeConnMap.has(seg.fromNodeId)) nodeConnMap.set(seg.fromNodeId, []);
      nodeConnMap.get(seg.fromNodeId)!.push({ seg, otherNodeId: seg.toNodeId, dir: d1 });

      if (!nodeConnMap.has(seg.toNodeId)) nodeConnMap.set(seg.toNodeId, []);
      nodeConnMap.get(seg.toNodeId)!.push({ seg, otherNodeId: seg.fromNodeId, dir: d2 });
    }

    for (const node of nodes) {
      const pos = toThree(node.x, node.y, node.z);
      const dn = node.dn || 100;
      const mat = this.materials.carbonSteel;
      const conns = nodeConnMap.get(node.id) || [];

      if (node.type === "tee" || (node.equipmentType && node.equipmentType.startsWith("te_"))) {
        // Té 3D
        const teeGroup = new THREE.Group();
        const mainGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16);
        const mainMesh = new THREE.Mesh(mainGeom, mat);
        mainMesh.rotation.z = Math.PI / 2;
        const branchGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.25, 16);
        const branchMesh = new THREE.Mesh(branchGeom, mat);
        branchMesh.position.y = 0.12;
        teeGroup.add(mainMesh);
        teeGroup.add(branchMesh);
        teeGroup.position.copy(pos);
        teeGroup.userData = { isPdiEntity: true, entityType: "node", label: `Té DN${dn}`, id: node.id, dn };
        this.modelRoot.add(teeGroup);
      } else if (conns.length === 2) {
        // Détecter un coude à 90° ou angle au nœud
        const inDir = conns[0].dir.clone().negate();
        const outDir = conns[1].dir.clone();
        const dot = inDir.dot(outDir);
        if (dot < 0.98) {
          // Il y a un angle -> générer un coude torique 3D
          const elbow = this.factory.createElbowMesh(pos, inDir, outDir, dn, mat, {
            id: `elbow_${node.id}`,
            label: `Coude DN${dn}`,
            nodeId: node.id,
          });
          this.modelRoot.add(elbow);
        }
      } else if (node.equipmentType && node.equipmentType.includes("vanne")) {
        const norm = conns[0] ? conns[0].dir : new THREE.Vector3(1, 0, 0);
        const valve = this.factory.createValveMesh(pos, norm, dn, mat, {
          id: node.id,
          label: node.equipmentLabel || `Vanne DN${dn}`,
          dn,
        });
        this.modelRoot.add(valve);
      } else if (node.equipmentType && node.equipmentType.includes("bride")) {
        const norm = conns[0] ? conns[0].dir : new THREE.Vector3(1, 0, 0);
        const flange = this.factory.createFlangeMesh(pos, norm, dn, mat, {
          id: node.id,
          label: node.equipmentLabel || `Bride DN${dn}`,
          dn,
        });
        this.modelRoot.add(flange);
      }
    }

    // 3. Construction des soudures 3D (Weld Rings) avec alignement vectoriel
    if (this.currentOptions.showWelds) {
      for (const weld of welds) {
        if (
          this.currentOptions.selectedSpoolId &&
          this.currentOptions.selectedSpoolId !== "all" &&
          weld.spoolId !== this.currentOptions.selectedSpoolId
        ) {
          continue;
        }

        const weldPos = toThree(weld.worldPos.x, weld.worldPos.y, weld.worldPos.z);
        
        // Trouver la direction du tube pour aligner le cordon annulaire
        let weldNorm = new THREE.Vector3(1, 0, 0);
        const attachedSeg = segMap.get(weld.segmentId);
        if (attachedSeg) {
          const fN = nodeMap.get(attachedSeg.fromNodeId);
          const tN = nodeMap.get(attachedSeg.toNodeId);
          if (fN && tN) {
            const v1 = toThree(fN.x, fN.y, fN.z);
            const v2 = toThree(tN.x, tN.y, tN.z);
            const dir = new THREE.Vector3().subVectors(v2, v1);
            if (dir.lengthSq() > 0.0001) weldNorm = dir.normalize();
          }
        }

        const weldMesh = this.factory.createWeldRingMesh(
          weldPos,
          weldNorm,
          weld.dn,
          weld.location,
          {
            id: weld.id,
            weldNumber: weld.weldNumber,
            location: weld.location,
            spoolId: weld.spoolId,
            wpsRef: weld.wpsRef || weld.wpsNumber,
            ndtRequired: weld.ndtRequired,
            ndtStatus: weld.ndtStatus,
          }
        );
        this.modelRoot.add(weldMesh);
      }
    }

    // 4. Construction des supports 3D MSS SP-58
    if (this.currentOptions.showSupports && supports) {
      for (const sup of supports) {
        const seg = segMap.get(sup.segmentId);
        const dn = seg?.dn || 100;
        const supPos = toThree(sup.worldPos.x, sup.worldPos.y, sup.worldPos.z);
        const supMesh = this.factory.createSupportMesh(sup, supPos, dn);
        this.modelRoot.add(supMesh);
      }
    }

    // Cadrage automatique initial
    this.fitToExtents();
  }

  /**
   * Recadre la caméra sur l'ensemble de la tuyauterie
   */
  public fitToExtents(): void {
    const box = new THREE.Box3().setFromObject(this.modelRoot);
    if (box.isEmpty()) return;

    box.getCenter(this.target);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 2);

    this.spherical.radius = maxDim * 1.8;
    this.updateCameraPosition();
  }

  /**
   * Applique un preset de vue standard d'ingénierie
   */
  public setViewPreset(preset: CameraViewPreset): void {
    const r = this.spherical.radius;
    switch (preset) {
      case "iso_sw":
        this.spherical.set(r, Math.PI / 3, Math.PI / 4);
        break;
      case "iso_se":
        this.spherical.set(r, Math.PI / 3, (3 * Math.PI) / 4);
        break;
      case "iso_ne":
        this.spherical.set(r, Math.PI / 3, (5 * Math.PI) / 4);
        break;
      case "iso_nw":
        this.spherical.set(r, Math.PI / 3, (7 * Math.PI) / 4);
        break;
      case "top":
        this.spherical.set(r, 0.001, 0); // Vue de dessus pure
        break;
      case "front":
        this.spherical.set(r, Math.PI / 2, 0); // Vue de face X-Z
        break;
      case "side":
        this.spherical.set(r, Math.PI / 2, Math.PI / 2); // Vue latérale Y-Z
        break;
    }
    this.updateCameraPosition();
  }

  /**
   * Bascule entre projection perspective et orthographique
   */
  public setProjection(type: CameraProjectionType): void {
    this.currentOptions.projection = type;
    this.activeCamera = type === "orthographic" ? this.cameraOrthographic : this.cameraPerspective;
    this.handleResize();
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const offset = new THREE.Vector3().setFromSpherical(this.spherical);
    this.activeCamera.position.copy(this.target).add(offset);
    this.activeCamera.lookAt(this.target);

    if (this.activeCamera instanceof THREE.OrthographicCamera) {
      const frustumSize = this.spherical.radius;
      const aspect = this.container.clientWidth / (this.container.clientHeight || 1);
      this.activeCamera.left = (-frustumSize * aspect) / 2;
      this.activeCamera.right = (frustumSize * aspect) / 2;
      this.activeCamera.top = frustumSize / 2;
      this.activeCamera.bottom = -frustumSize / 2;
      this.activeCamera.updateProjectionMatrix();
    }
  }

  private bindEvents(): void {
    const el = this.renderer.domElement;

    el.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.isPanning = e.button === 2 || e.shiftKey;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("mouseup", () => {
      this.isDragging = false;
      this.isPanning = false;
    });

    el.addEventListener("contextmenu", (e) => e.preventDefault());

    el.addEventListener("mousemove", (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        if (this.isPanning) {
          // Panoramique
          const panSpeed = this.spherical.radius * 0.0015;
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.activeCamera.quaternion);
          const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.activeCamera.quaternion);
          this.target.addScaledVector(right, -deltaX * panSpeed);
          this.target.addScaledVector(up, deltaY * panSpeed);
        } else {
          // Rotation orbitale
          this.spherical.theta -= deltaX * 0.006;
          this.spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this.spherical.phi - deltaY * 0.006));
        }

        this.updateCameraPosition();
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      } else {
        // Raycasting survol
        this.checkHover(e);
      }
    });

    el.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1.1 : 0.9;
        this.spherical.radius = Math.max(0.5, Math.min(200, this.spherical.radius * factor));
        this.updateCameraPosition();
      },
      { passive: false }
    );

    el.addEventListener("click", (e) => {
      this.checkClick(e);
    });

    window.addEventListener("resize", () => this.handleResize());
  }

  private checkHover(e: MouseEvent): void {
    if (!this.onEntityHover) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mousePos, this.activeCamera);
    const intersects = this.raycaster.intersectObjects(this.modelRoot.children, true);

    const hit = intersects.find((i) => i.object.userData?.isPdiEntity);
    if (hit) {
      const u = hit.object.userData;
      this.onEntityHover({
        type: u.entityType,
        id: u.id || "elem",
        label: u.tag || u.label || u.weldNumber || "Composant tuyauterie",
        dn: u.dn,
        odMm: u.odMm,
        thicknessMm: u.thicknessMm,
        material: u.material,
        schedule: u.schedule,
        spoolId: u.spoolId,
        spoolColor: u.spoolColor,
        service: u.service,
        pressureClass: u.pressureClass,
        lengthM: u.lengthM,
        worldPos: { x: hit.point.x, y: hit.point.y, z: hit.point.z },
      });
    } else {
      this.onEntityHover(null);
    }
  }

  private checkClick(e: MouseEvent): void {
    if (!this.onEntitySelected) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mousePos, this.activeCamera);
    const intersects = this.raycaster.intersectObjects(this.modelRoot.children, true);

    const hit = intersects.find((i) => i.object.userData?.isPdiEntity);
    if (hit) {
      const u = hit.object.userData;
      this.onEntitySelected({
        type: u.entityType,
        id: u.id || "elem",
        label: u.tag || u.label || u.weldNumber || "Composant",
        dn: u.dn,
        odMm: u.odMm,
        thicknessMm: u.thicknessMm,
        material: u.material,
        schedule: u.schedule,
        spoolId: u.spoolId,
        spoolColor: u.spoolColor,
        service: u.service,
        pressureClass: u.pressureClass,
        lengthM: u.lengthM,
        weldInfo:
          u.entityType === "weld"
            ? {
                weldNumber: u.weldNumber,
                location: u.location,
                wpsRef: u.wpsRef,
                ndtRequired: u.ndtRequired,
                ndtStatus: u.ndtStatus,
              }
            : undefined,
        supportInfo:
          u.entityType === "support"
            ? {
                tag: u.tag,
                typeCode: u.typeCode,
                typeLabelFr: u.typeLabelFr,
                standard: u.standard,
                designLoadKn: u.designLoadKn,
              }
            : undefined,
        worldPos: { x: hit.point.x, y: hit.point.y, z: hit.point.z },
      });
    } else {
      this.onEntitySelected(null);
    }
  }

  public handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.renderer.setSize(width, height);
    const aspect = width / height;

    this.cameraPerspective.aspect = aspect;
    this.cameraPerspective.updateProjectionMatrix();

    const frustumSize = this.spherical.radius;
    this.cameraOrthographic.left = (-frustumSize * aspect) / 2;
    this.cameraOrthographic.right = (frustumSize * aspect) / 2;
    this.cameraOrthographic.top = frustumSize / 2;
    this.cameraOrthographic.bottom = -frustumSize / 2;
    this.cameraOrthographic.updateProjectionMatrix();
  }

  public setAutoRotate(enabled: boolean): void {
    this.currentOptions.autoRotate = enabled;
  }

  public setShadingMode(mode: Viewer3dOptions["shadingMode"]): void {
    this.currentOptions.shadingMode = mode;
    if (this.currentData) {
      this.buildModel(this.currentData);
    }
  }

  public setSelectedSpoolId(spoolId: string | null): void {
    this.currentOptions.selectedSpoolId = spoolId;
    if (this.currentData) {
      this.buildModel(this.currentData);
    }
  }

  private startRenderLoop(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      if (this.currentOptions.autoRotate && !this.isDragging) {
        this.spherical.theta += this.autoRotateSpeed;
        this.updateCameraPosition();
      }

      this.renderer.render(this.scene, this.activeCamera);
    };
    animate();
  }

  /**
   * Capture une capture d'écran PNG haute résolution avec Watermark inaltérable
   */
  public takeSnapshotPng(projectName: string = "Projet Tuyauterie"): string {
    this.renderer.render(this.scene, this.activeCamera);
    const canvas = this.renderer.domElement;

    // Créer un canvas 2D pour incruster le watermark et l'en-tête technique
    const outCanvas = document.createElement("canvas");
    outCanvas.width = canvas.width;
    outCanvas.height = canvas.height;
    const ctx = outCanvas.getContext("2d");
    if (!ctx) return canvas.toDataURL("image/png");

    ctx.drawImage(canvas, 0, 0);

    // Bandeau technique en bas
    ctx.fillStyle = "rgba(10, 15, 24, 0.85)";
    ctx.fillRect(0, outCanvas.height - 40, outCanvas.width, 40);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 13px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText("ORTHOGONAL - ENG · PIPING DESIGN & ISOMETRICS 3D", 20, outCanvas.height - 15);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(`${projectName} · ASME B31.3 / B16.9 · Rendu 3D Solide Extrudé`, outCanvas.width - 380, outCanvas.height - 15);

    return outCanvas.toDataURL("image/png");
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
