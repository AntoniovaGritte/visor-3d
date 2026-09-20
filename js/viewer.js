import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Viewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.currentModel = null;
    this.originalMaterials = new Map();
    this.currentVisualMode = 'realistic';

    // 1. Escena
    this.scene = new THREE.Scene();
    this.scene.background = null; // Canvas transparente sobre gradiente CSS

    // Pivote independiente para rotación del modelo como tal (sin mover la cámara ni la puesta en escena)
    this.modelPivot = new THREE.Group();
    this.modelPivot.name = "Model_Pivot";
    this.scene.add(this.modelPivot);
    this.modelRotation = { x: 0, y: 0, z: 0 };

    // 2. Obtener dimensiones del espacio 3D disponible a la derecha
    const container = this.canvas.parentElement;
    const initialWidth = (container && container.clientWidth) ? container.clientWidth : (window.innerWidth - 360);
    const initialHeight = (container && container.clientHeight) ? container.clientHeight : (window.innerHeight - 62);

    this.camera = new THREE.PerspectiveCamera(
      45,
      initialWidth / initialHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 22);

    // 3. Renderer con stencil buffer de hardware y local clipping activado
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      stencil: true, // CRÍTICO para hardware stencil buffer (Solid Caps)
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true // Permite capturas de pantalla de alta resolución
    });
    this.renderer.setSize(initialWidth, initialHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.localClippingEnabled = true; // CRÍTICO: Permite planos de corte locales
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. OrbitControls con control directo instantáneo (sin inercia residual al soltar)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false; // Sin movimiento suave al soltar: se queda quieta exactamente donde se deja
    this.controls.rotateSpeed = 0.8;
    this.controls.zoomSpeed = 1.0;
    this.controls.panSpeed = 1.0;
    this.controls.screenSpacePanning = true; // Desplazar en el plano de la pantalla
    this.controls.minDistance = 2;
    this.controls.maxDistance = 150;

    // Configuración de botones del ratón:
    // Click Izquierdo: Rotar
    // Click del Scroll (rueda del ratón): Desplazar / Panear la vista
    // Click Derecho: Desplazar / Panear la vista
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.PAN
    };

    // Mesa Giratoria (Auto-rotación 360° activada por defecto al abrir)
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 2.5;

    // 5. Luces de estudio anatómico
    this.setupLighting();

    // 6. Plataforma / Sombra de contacto
    this.setupContactShadow();

    // 7. Eventos de redimensionamiento
    window.addEventListener('resize', () => this.onResize());
    if (window.ResizeObserver && this.canvas.parentElement) {
      this.resizeObserver = new ResizeObserver(() => this.onResize());
      this.resizeObserver.observe(this.canvas.parentElement);
    }

    // FPS Meter
    this.fpsLastTime = performance.now();
    this.fpsFrames = 0;
    this.fps = 60;
  }

  setupLighting() {
    this.lightsGroup = new THREE.Group();
    this.lightsGroup.name = "Lighting_Rig";

    // Luz ambiental suave
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.lightsGroup.add(this.ambientLight);

    // Luz Principal (Key Light)
    this.keyLight = new THREE.DirectionalLight(0xfff8ee, 1.8);
    this.keyLight.position.set(12, 16, 14);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.bias = -0.0001;
    this.lightsGroup.add(this.keyLight);

    // Luz de Relleno (Fill Light médica tono cian suave)
    this.fillLight = new THREE.DirectionalLight(0x94d2bd, 0.9);
    this.fillLight.position.set(-14, 8, -10);
    this.lightsGroup.add(this.fillLight);

    // Luz de Contorno (Rim Light)
    this.rimLight = new THREE.DirectionalLight(0x06b6d4, 1.1);
    this.rimLight.position.set(0, -12, -12);
    this.lightsGroup.add(this.rimLight);

    this.scene.add(this.lightsGroup);
  }

  setupContactShadow() {
    // Sombra sutil de contacto debajo del modelo
    const shadowGeo = new THREE.PlaneGeometry(24, 24);
    const shadowMat = new THREE.ShadowMaterial({
      opacity: 0.25
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = -8;
    this.contactShadow.receiveShadow = true;
    this.scene.add(this.contactShadow);
  }

  setLightIntensity(factor) {
    if (this.ambientLight) this.ambientLight.intensity = 0.6 * factor;
    if (this.keyLight) this.keyLight.intensity = 1.6 * factor;
    if (this.fillLight) this.fillLight.intensity = 0.8 * factor;
    if (this.rimLight) this.rimLight.intensity = 1.0 * factor;
  }

  setModel(model) {
    // Eliminar modelo anterior del pivote
    if (this.currentModel) {
      this.modelPivot.remove(this.currentModel);
      this.disposeObject(this.currentModel);
      this.originalMaterials.clear();
    }

    // Restablecer rotación del pivote para el nuevo espécimen
    this.modelRotation = { x: 0, y: 0, z: 0 };
    this.modelPivot.rotation.set(0, 0, 0);

    this.currentModel = model;
    this.modelPivot.add(model);
    this.modelPivot.updateMatrixWorld(true);

    // Guardar materiales originales para alternar entre modos de visualización
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        this.originalMaterials.set(child, child.material);
      }
    });

    // Ajustar y centrar la cámara automáticamente en el modelo
    this.fitCameraToModel();
  }

  /**
   * Modifica la rotación del modelo como tal en grados (0 a 360)
   */
  setModelRotation(xDeg, yDeg, zDeg = 0) {
    const safeX = Number(xDeg) || 0;
    const safeY = Number(yDeg) || 0;
    const safeZ = Number(zDeg) || 0;

    this.modelRotation.x = ((Math.round(safeX) % 360) + 360) % 360;
    this.modelRotation.y = ((Math.round(safeY) % 360) + 360) % 360;
    this.modelRotation.z = ((Math.round(safeZ) % 360) + 360) % 360;

    if (this.modelPivot) {
      this.modelPivot.rotation.x = THREE.MathUtils.degToRad(this.modelRotation.x);
      this.modelPivot.rotation.y = THREE.MathUtils.degToRad(this.modelRotation.y);
      this.modelPivot.rotation.z = THREE.MathUtils.degToRad(this.modelRotation.z);
      this.modelPivot.updateMatrixWorld(true);
    }

    // Actualizar sombra de contacto para que descanse bajo el hueso girado
    if (this.contactShadow && this.currentModel) {
      const box = new THREE.Box3().setFromObject(this.currentModel);
      this.contactShadow.position.y = box.min.y - 0.05;
    }

    this.render();
    return { ...this.modelRotation };
  }

  /**
   * Rota el modelo un valor delta puntual (por ejemplo +90, -45, etc.)
   */
  rotateModelAxis(axis, deltaDeg) {
    if (axis === 'x') {
      return this.setModelRotation(this.modelRotation.x + deltaDeg, this.modelRotation.y, this.modelRotation.z);
    } else if (axis === 'y') {
      return this.setModelRotation(this.modelRotation.x, this.modelRotation.y + deltaDeg, this.modelRotation.z);
    } else if (axis === 'z') {
      return this.setModelRotation(this.modelRotation.x, this.modelRotation.y, this.modelRotation.z + deltaDeg);
    }
    return { ...this.modelRotation };
  }

  /**
   * Restablece la rotación del modelo a (0, 0, 0)
   */
  resetModelRotation() {
    return this.setModelRotation(0, 0, 0);
  }

  getModelRotation() {
    return { ...this.modelRotation };
  }

  fitCameraToModel() {
    if (!this.currentModel) return;

    const box = new THREE.Box3().setFromObject(this.currentModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.6;
    cameraDistance = Math.max(cameraDistance, 5);

    this.camera.position.set(center.x, center.y + size.y * 0.1, center.z + cameraDistance);
    this.camera.lookAt(center);
    this.controls.target.copy(center);
    this.controls.update();

    // Actualizar posición de la sombra debajo del hueso
    if (this.contactShadow) {
      this.contactShadow.position.y = box.min.y - 0.05;
      const shadowSize = maxDim * 1.8;
      this.contactShadow.scale.set(shadowSize / 24, shadowSize / 24, 1);
    }
  }

  resetView() {
    this.fitCameraToModel();
  }

  setVisualMode(mode) {
    this.currentVisualMode = mode;
    if (!this.currentModel) return;

    this.currentModel.traverse((child) => {
      if (child.isMesh && !child.name.startsWith("StencilCap_")) {
        const origMat = this.originalMaterials.get(child) || child.material;

        switch (mode) {
          case 'realistic':
            child.material = origMat;
            break;

          case 'clay':
            // Material yeso anatómico liso
            child.material = new THREE.MeshStandardMaterial({
              color: 0xf5f2eb,
              roughness: 0.8,
              metalness: 0.02,
              clippingPlanes: origMat.clippingPlanes || [],
              clipShadows: true,
              side: THREE.DoubleSide
            });
            break;

          case 'xray':
            // Material translúcido estilo radiografía / rayos X
            child.material = new THREE.MeshPhysicalMaterial({
              color: 0x38bdf8,
              transmission: 0.75,
              opacity: 0.85,
              transparent: true,
              roughness: 0.2,
              ior: 1.3,
              clippingPlanes: origMat.clippingPlanes || [],
              side: THREE.DoubleSide
            });
            break;

          case 'wireframe':
            // Malla de alambre técnica
            child.material = new THREE.MeshBasicMaterial({
              color: 0x06b6d4,
              wireframe: true,
              clippingPlanes: origMat.clippingPlanes || []
            });
            break;
        }
      }
    });
  }

  captureScreenshot() {
    this.renderer.render(this.scene, this.camera);
    const dataURL = this.canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `AnatoCut_3D_Corte_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataURL;
    link.click();
  }

  onResize() {
    const container = this.canvas.parentElement;
    const width = (container && container.clientWidth) ? container.clientWidth : (window.innerWidth - 360);
    const height = (container && container.clientHeight) ? container.clientHeight : (window.innerHeight - 62);
    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  calculateFPS() {
    this.fpsFrames++;
    const now = performance.now();
    if (now >= this.fpsLastTime + 1000) {
      this.fps = Math.round((this.fpsFrames * 1000) / (now - this.fpsLastTime));
      this.fpsFrames = 0;
      this.fpsLastTime = now;
      return this.fps;
    }
    return null;
  }

  getModelStats() {
    if (!this.currentModel) return { polygons: 0, vertices: 0 };
    let polygons = 0;
    let vertices = 0;
    this.currentModel.traverse((child) => {
      if (child.isMesh && child.geometry) {
        if (child.geometry.index) {
          polygons += child.geometry.index.count / 3;
        } else if (child.geometry.attributes.position) {
          polygons += child.geometry.attributes.position.count / 3;
        }
        if (child.geometry.attributes.position) {
          vertices += child.geometry.attributes.position.count;
        }
      }
    });
    return { polygons: Math.round(polygons), vertices };
  }

  disposeObject(obj) {
    obj.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });
  }

  // Control de Mesa Giratoria
  toggleTurntable() {
    this.controls.autoRotate = !this.controls.autoRotate;
    return this.controls.autoRotate;
  }

  setTurntable(enabled) {
    this.controls.autoRotate = enabled;
  }

  isTurntableActive() {
    return this.controls.autoRotate;
  }

  update() {
    this.controls.update();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
