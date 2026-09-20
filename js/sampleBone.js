import * as THREE from 'three';

/**
 * Genera un modelo anatómico procedural de un fémur / hueso largo humano
 * con relieve orgánico, cabeza femoral, cuello, diáfisis curva y cóndilos distales.
 * Incluye texturas procedurales para dar apariencia ósea realista.
 */
export function createSampleBone() {
  const boneGroup = new THREE.Group();
  boneGroup.name = "Sample_Femur_Bone";

  // Generamos una textura ósea procedural de alta calidad
  const boneTexture = createBoneTexture();
  const boneNormalMap = createBoneNormalMap();

  const boneMaterial = new THREE.MeshStandardMaterial({
    color: 0xf3ede0, // Tono hueso natural / marfil
    roughness: 0.65,
    metalness: 0.05,
    map: boneTexture,
    normalMap: boneNormalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    side: THREE.DoubleSide
  });

  // 1. Diáfisis (cuerpo del hueso ligeramente arqueado)
  const shaftPoints = [];
  const segments = 40;
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * 2 - 1; // de -1 a 1
    const y = t * 7;
    // Ligera curvatura anatómica fisiológica anteroposterior
    const z = Math.sin((t + 1) * Math.PI * 0.5) * 0.45;
    // Radio variable: más estrecho en el centro, expandiéndose en los extremos
    const radius = 0.95 + 0.35 * Math.pow(t, 2) + 0.15 * Math.pow(t, 4);
    shaftPoints.push(new THREE.Vector3(0, y, z));
  }

  const shaftCurve = new THREE.CatmullRomCurve3(shaftPoints);
  const shaftGeo = new THREE.TubeGeometry(shaftCurve, 50, 1.1, 32, false);
  const shaftMesh = new THREE.Mesh(shaftGeo, boneMaterial);
  shaftMesh.castShadow = true;
  shaftMesh.receiveShadow = true;
  boneGroup.add(shaftMesh);

  // 2. Extremo Proximal: Cabeza femoral (esfera suave angulada)
  const headGeo = new THREE.SphereGeometry(2.1, 36, 36);
  // Deformación anatómica suave
  const pos = headGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    v.x *= 1.05;
    v.y *= 0.98;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  headGeo.computeVertexNormals();
  const headMesh = new THREE.Mesh(headGeo, boneMaterial);
  headMesh.position.set(2.4, 7.8, 0.4);
  headMesh.castShadow = true;
  boneGroup.add(headMesh);

  // Cuello femoral que une la cabeza con la diáfisis
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 6.2, 0.3),
    new THREE.Vector3(1.2, 7.0, 0.35),
    new THREE.Vector3(2.4, 7.8, 0.4)
  ]);
  const neckGeo = new THREE.TubeGeometry(neckCurve, 20, 1.25, 24, false);
  const neckMesh = new THREE.Mesh(neckGeo, boneMaterial);
  neckMesh.castShadow = true;
  boneGroup.add(neckMesh);

  // Trocánter mayor (prominencia lateral en la parte superior del fémur)
  const trochanterGeo = new THREE.SphereGeometry(1.6, 24, 24);
  trochanterGeo.scale(1.2, 1.5, 0.9);
  const trochanterMesh = new THREE.Mesh(trochanterGeo, boneMaterial);
  trochanterMesh.position.set(-1.3, 6.7, -0.2);
  trochanterMesh.rotation.z = 0.2;
  trochanterMesh.castShadow = true;
  boneGroup.add(trochanterMesh);

  // 3. Extremo Distal: Cóndilos femorales (cóndilo medial y lateral)
  const condyleGeo1 = new THREE.SphereGeometry(1.65, 28, 28);
  condyleGeo1.scale(1.1, 1.2, 1.4);
  const condyle1 = new THREE.Mesh(condyleGeo1, boneMaterial);
  condyle1.position.set(-1.4, -7.2, -0.4);
  condyle1.castShadow = true;
  boneGroup.add(condyle1);

  const condyleGeo2 = new THREE.SphereGeometry(1.7, 28, 28);
  condyleGeo2.scale(1.1, 1.2, 1.4);
  const condyle2 = new THREE.Mesh(condyleGeo2, boneMaterial);
  condyle2.position.set(1.4, -7.2, -0.4);
  condyle2.castShadow = true;
  boneGroup.add(condyle2);

  // Fosa intercondílea / unión distal
  const distalBaseGeo = new THREE.CylinderGeometry(2.3, 2.6, 2.2, 28);
  const distalBase = new THREE.Mesh(distalBaseGeo, boneMaterial);
  distalBase.position.set(0, -6.6, -0.2);
  distalBase.castShadow = true;
  boneGroup.add(distalBase);

  // Rotamos el fémur para colocarlo en posición anatómica vertical
  boneGroup.position.set(0, 0, 0);
  boneGroup.scale.set(0.65, 0.65, 0.65);

  return boneGroup;
}

/**
 * Crea una textura difusa de tejido óseo realista mediante Canvas HTML5
 */
function createBoneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base tono marfil/hueso
  ctx.fillStyle = '#f3ede2';
  ctx.fillRect(0, 0, 512, 512);

  // Veteado suave y porosidades óseas naturales
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const w = 2 + Math.random() * 8;
    const h = 20 + Math.random() * 60;
    const alpha = 0.03 + Math.random() * 0.05;

    ctx.fillStyle = Math.random() > 0.5 ? `rgba(180, 160, 140, ${alpha})` : `rgba(255, 255, 250, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, (Math.random() - 0.5) * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Micro-poros óseos
  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 1.5;
    ctx.fillStyle = `rgba(140, 120, 100, ${0.04 + Math.random() * 0.06})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2);
  return texture;
}

/**
 * Genera un mapa normal procedural de relieve óseo (osteones y laminillas)
 */
function createBoneNormalMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Fondo neutro mapa normal (128, 128, 255)
  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, 256, 256);

  // Estrías longitudinales
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const w = 1 + Math.random() * 3;
    const h = 10 + Math.random() * 40;
    
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(180, 128, 255, 0.15)' : 'rgba(70, 128, 255, 0.15)';
    ctx.fillRect(x, y, w, h);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  return texture;
}
