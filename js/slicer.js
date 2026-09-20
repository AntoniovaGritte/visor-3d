import * as THREE from 'three';

export class Slicer {
  constructor(viewer) {
    this.viewer = viewer;
    this.enabled = false;
    this.planeType = 'axial'; // axial (Y), sagital (X), coronal (Z), custom
    this.progress = 0.5; // 0.0 a 1.0
    this.isInverted = false;
    this.showHelper = true;
    this.solidCapEnabled = true;
    this.capColor = 0xd9cdb8; // Color anatómico de corte óseo / médula

    // Ángulos para el modo libre
    this.angleX = 0;
    this.angleZ = 0;

    // Plano de corte Three.js
    this.clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    this.planesArray = [this.clipPlane];

    // Grupo para los helpers visuales
    this.helperGroup = new THREE.Group();
    this.helperGroup.name = "Slicer_Helpers";
    this.viewer.scene.add(this.helperGroup);

    // Malla auxiliar visual del plano de corte (transparente estilo cristal)
    this.helperOpacity = 0.08;
    this.createHelperMesh();

    // Malla de Tapa Sólida (Cap Mesh con Stencil Buffer)
    this.createSolidCapMesh();

    // Límites del modelo actual
    this.bounds = {
      min: -5,
      max: 5,
      center: new THREE.Vector3()
    };

    // Estado del escaneo continuo animado
    this.isScanning = false;
    this.scanDirection = 1;
    this.scanSpeed = 0.003;
  }

  createHelperMesh() {
    // Disco / Plano circular transparente estilo cristal médico
    const radius = 8;
    const geometry = new THREE.CircleGeometry(radius, 64);
    this.helperMaterial = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: this.helperOpacity,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.helperDisc = new THREE.Mesh(geometry, this.helperMaterial);
    this.helperDisc.renderOrder = 4; // Por encima de la tapa
    
    // Anillo exterior brillante que delimita el plano sin tapar la pieza
    const ringGeo = new THREE.RingGeometry(radius - 0.06, radius, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.helperDisc.add(ringMesh);

    // Ejes de referencia sutiles
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      depthWrite: false
    });
    const crossGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-radius, 0, 0),
      new THREE.Vector3(radius, 0, 0),
      new THREE.Vector3(0, -radius, 0),
      new THREE.Vector3(0, radius, 0)
    ]);
    const crossLines = new THREE.LineSegments(crossGeo, lineMat);
    this.helperDisc.add(crossLines);

    this.helperDisc.visible = false;
    this.helperGroup.add(this.helperDisc);
  }

  createSolidCapMesh() {
    // La tapa sólida cubre el plano completo, pero la GPU SOLO la dibuja
    // donde el stencil buffer es distinto de cero (es decir, la silueta exacta del corte del hueso)
    const capGeo = new THREE.PlaneGeometry(100, 100);
    this.capMaterial = new THREE.MeshStandardMaterial({
      color: this.capColor,
      roughness: 0.75,
      metalness: 0.05,
      side: THREE.DoubleSide,
      stencilWrite: true,
      stencilRef: 0,
      stencilFunc: THREE.NotEqualStencilFunc,
      stencilFail: THREE.ReplaceStencilOp,
      stencilZFail: THREE.ReplaceStencilOp,
      stencilZPass: THREE.ReplaceStencilOp
    });

    this.capMesh = new THREE.Mesh(capGeo, this.capMaterial);
    this.capMesh.name = "Solid_Bone_Cap";
    this.capMesh.renderOrder = 3;
    this.capMesh.visible = false;
    this.viewer.scene.add(this.capMesh);
  }

  /**
   * Genera los grupos de stencil para cada malla del modelo actual.
   * Esto garantiza que al cortar el hueso, la sección interna quede rellena y maciza.
   */
  setupStencilGroups() {
    // Limpiar grupos anteriores
    if (this.stencilGroupsList) {
      this.stencilGroupsList.forEach((group) => {
        if (group.parent) group.parent.remove(group);
        this.disposeObject(group);
      });
    }
    this.stencilGroupsList = [];

    if (!this.viewer.currentModel) return;

    this.viewer.currentModel.traverse((child) => {
      if (child.isMesh && child.geometry && !child.name.startsWith("Stencil") && child.name !== "Solid_Bone_Cap") {
        // Objeto principal visible
        child.renderOrder = 2;

        // Base material invisible para dibujar en el stencil buffer
        const baseMat = new THREE.MeshBasicMaterial();
        baseMat.depthWrite = false;
        baseMat.depthTest = false;
        baseMat.colorWrite = false;
        baseMat.stencilWrite = true;
        baseMat.stencilFunc = THREE.AlwaysStencilFunc;

        // 1. Back faces: Incrementa el stencil buffer
        const matBack = baseMat.clone();
        matBack.side = THREE.BackSide;
        matBack.clippingPlanes = this.planesArray;
        matBack.stencilFail = THREE.IncrementWrapStencilOp;
        matBack.stencilZFail = THREE.IncrementWrapStencilOp;
        matBack.stencilZPass = THREE.IncrementWrapStencilOp;

        const meshBack = new THREE.Mesh(child.geometry, matBack);
        meshBack.name = "Stencil_Back";
        meshBack.renderOrder = 1;

        // 2. Front faces: Decrementa el stencil buffer
        const matFront = baseMat.clone();
        matFront.side = THREE.FrontSide;
        matFront.clippingPlanes = this.planesArray;
        matFront.stencilFail = THREE.DecrementWrapStencilOp;
        matFront.stencilZFail = THREE.DecrementWrapStencilOp;
        matFront.stencilZPass = THREE.DecrementWrapStencilOp;

        const meshFront = new THREE.Mesh(child.geometry, matFront);
        meshFront.name = "Stencil_Front";
        meshFront.renderOrder = 1;

        const stencilGroup = new THREE.Group();
        stencilGroup.name = "StencilGroup";
        stencilGroup.add(meshBack);
        stencilGroup.add(meshFront);

        // Al añadirlo como hijo directo del mesh, hereda automáticamente la matriz y transformación
        child.add(stencilGroup);
        this.stencilGroupsList.push(stencilGroup);
      }
    });

    this.updateHelperVisibility();
  }

  updateModelBounds() {
    if (!this.viewer.currentModel) return;

    const box = new THREE.Box3().setFromObject(this.viewer.currentModel);
    box.getCenter(this.bounds.center);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Ajustar el radio del disco auxiliar al tamaño del hueso
    const radius = Math.max(maxDim * 0.9, 4);
    if (this.helperDisc) {
      this.helperDisc.scale.set(radius / 8, radius / 8, 1);
    }

    // Configurar los grupos de stencil para el nuevo modelo
    this.setupStencilGroups();

    // Calcular límites según la normal actual
    this.recalculateRange();
    this.updatePlane();
  }

  recalculateRange() {
    if (!this.viewer.currentModel) return;

    const box = new THREE.Box3().setFromObject(this.viewer.currentModel);
    const normal = this.getNormalVector();

    // Proyectar los 8 vértices de la caja sobre la normal para obtener el rango exacto de corte
    const corners = [
      new THREE.Vector3(box.min.x, box.min.y, box.min.z),
      new THREE.Vector3(box.min.x, box.min.y, box.max.z),
      new THREE.Vector3(box.min.x, box.max.y, box.min.z),
      new THREE.Vector3(box.min.x, box.max.y, box.max.z),
      new THREE.Vector3(box.max.x, box.min.y, box.min.z),
      new THREE.Vector3(box.max.x, box.min.y, box.max.z),
      new THREE.Vector3(box.max.x, box.max.y, box.min.z),
      new THREE.Vector3(box.max.x, box.max.y, box.max.z)
    ];

    let min = Infinity;
    let max = -Infinity;

    corners.forEach((c) => {
      const dot = c.dot(normal);
      if (dot < min) min = dot;
      if (dot > max) max = dot;
    });

    // Margen ligero del 2% para ver el modelo completo en los extremos
    const margin = (max - min) * 0.02;
    this.bounds.min = min - margin;
    this.bounds.max = max + margin;
  }

  /**
   * Se ejecuta cuando el usuario rota la pieza tridimensional
   */
  onModelRotated() {
    this.recalculateRange();
    if (this.enabled) {
      this.updatePlane();
    }
  }

  getNormalVector() {
    let normal = new THREE.Vector3(0, -1, 0);

    switch (this.planeType) {
      case 'axial':
        normal.set(0, -1, 0);
        break;
      case 'sagital':
        normal.set(-1, 0, 0);
        break;
      case 'coronal':
        normal.set(0, 0, -1);
        break;
      case 'custom':
        // Rotación libre alrededor de X y Z
        const radX = THREE.MathUtils.degToRad(this.angleX);
        const radZ = THREE.MathUtils.degToRad(this.angleZ);
        normal.set(0, -1, 0);
        normal.applyAxisAngle(new THREE.Vector3(1, 0, 0), radX);
        normal.applyAxisAngle(new THREE.Vector3(0, 0, 1), radZ);
        break;
    }

    if (this.isInverted) {
      normal.negate();
    }

    return normal.normalize();
  }

  setEnabled(val) {
    this.enabled = val;
    this.applyClippingToMaterials();
    this.updateHelperVisibility();
  }

  setPlaneType(type) {
    this.planeType = type;
    this.recalculateRange();
    this.updatePlane();
  }

  setProgress(val) {
    this.progress = Math.max(0, Math.min(1, val));
    this.updatePlane();
  }

  setAngles(x, z) {
    this.angleX = x;
    this.angleZ = z;
    if (this.planeType === 'custom') {
      this.recalculateRange();
      this.updatePlane();
    }
  }

  toggleInvert() {
    this.isInverted = !this.isInverted;
    this.recalculateRange();
    this.updatePlane();
  }

  setShowHelper(val) {
    this.showHelper = val;
    this.updateHelperVisibility();
  }

  setHelperOpacity(val) {
    this.helperOpacity = Math.max(0, Math.min(1, val));
    if (this.helperMaterial) {
      this.helperMaterial.opacity = this.helperOpacity;
      this.helperMaterial.needsUpdate = true;
    }
  }

  updateHelperVisibility() {
    const isVisible = this.enabled && this.showHelper;
    if (this.helperDisc) {
      this.helperDisc.visible = isVisible;
    }
    if (this.capMesh) {
      this.capMesh.visible = this.enabled && this.solidCapEnabled;
    }
    if (this.stencilGroupsList) {
      this.stencilGroupsList.forEach((g) => {
        g.visible = this.enabled && this.solidCapEnabled;
      });
    }
  }

  updatePlane() {
    const normal = this.getNormalVector();
    
    // Interpolar la distancia D a lo largo del rango proyectado
    const d = THREE.MathUtils.lerp(this.bounds.min, this.bounds.max, this.progress);
    
    // Definición en Three.js: plane.normal y plane.constant. Los puntos donde dot(p, normal) + constant < 0 se recortan.
    this.clipPlane.normal.copy(normal);
    this.clipPlane.constant = -d;

    // Posicionar la malla guía visual exactamente en el plano de corte
    const planeCenter = normal.clone().multiplyScalar(d);
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal
    );

    if (this.helperDisc) {
      this.helperDisc.position.copy(planeCenter);
      this.helperDisc.quaternion.copy(targetQuat);
    }

    if (this.capMesh) {
      this.capMesh.position.copy(planeCenter);
      this.capMesh.quaternion.copy(targetQuat);
    }
  }

  applyClippingToMaterials() {
    if (!this.viewer.currentModel) return;

    const planes = this.enabled ? this.planesArray : [];

    this.viewer.currentModel.traverse((child) => {
      if (child.isMesh && !child.name.startsWith("Stencil") && child.name !== "Solid_Bone_Cap") {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => {
            m.clippingPlanes = planes;
            m.clipShadows = true;
            m.needsUpdate = true;
          });
        } else if (child.material) {
          child.material.clippingPlanes = planes;
          child.material.clipShadows = true;
          child.material.needsUpdate = true;
        }
      }
    });
  }

  toggleContinuousScan() {
    this.isScanning = !this.isScanning;
    return this.isScanning;
  }

  updateAnimation() {
    if (this.isScanning && this.enabled) {
      this.progress += this.scanSpeed * this.scanDirection;
      if (this.progress >= 1.0) {
        this.progress = 1.0;
        this.scanDirection = -1;
      } else if (this.progress <= 0.0) {
        this.progress = 0.0;
        this.scanDirection = 1;
      }
      this.updatePlane();
      return this.progress;
    }
    return null;
  }

  disposeObject(obj) {
    obj.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });
  }
}
