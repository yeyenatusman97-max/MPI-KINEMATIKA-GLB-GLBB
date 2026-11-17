import * as THREE from 'three';

export interface Procedural3DCarHandle {
  group: THREE.Group;
  wheels: THREE.Group[];
  headlightMat: THREE.MeshStandardMaterial;
  taillightMat: THREE.MeshStandardMaterial;
  bodyMat: THREE.MeshPhysicalMaterial;
  dispose: () => void;
}

export interface Procedural3DCarOptions {
  bodyColor?: number;
  accentColor?: number;
  scale?: number;
  includeFlag?: boolean;
}

/**
 * Builds a composite multi-part 3D aerodynamic physics car using beveled ExtrudeGeometry,
 * tinted glass cabin, rear spoiler, LED headlights/taillights, 4 alloy-spoke wheels,
 * and grounded contact shadow. Tracks all geometries/materials for clean disposal.
 */
export function createProcedural3DCar(
  options: Procedural3DCarOptions = {}
): Procedural3DCarHandle {
  const {
    bodyColor = 0x0284c7,
    accentColor = 0xf59e0b,
    scale = 1,
    includeFlag = true,
  } = options;

  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const wheels: THREE.Group[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  // 1. Primary Sculpted Aerodynamic Body Hull (ExtrudeGeometry with smooth bevels)
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-1.95, 0.25);
  hullShape.lineTo(-1.9, 0.72);
  hullShape.lineTo(-1.45, 0.85);
  hullShape.lineTo(-0.85, 0.88);
  hullShape.quadraticCurveTo(-0.45, 1.38, 0.05, 1.42);
  hullShape.lineTo(0.55, 1.40);
  hullShape.quadraticCurveTo(0.95, 1.32, 1.25, 0.90);
  hullShape.quadraticCurveTo(1.78, 0.84, 2.02, 0.62);
  hullShape.lineTo(2.05, 0.30);
  hullShape.lineTo(1.92, 0.22);
  hullShape.lineTo(-1.95, 0.25);

  const bodyGeo = trackGeo(
    new THREE.ExtrudeGeometry(hullShape, {
      depth: 1.66,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.1,
      bevelSegments: 4,
      curveSegments: 16,
    })
  );
  // Center extrusion along Z (-0.83 .. +0.83)
  bodyGeo.translate(0, 0, -0.83);

  const bodyMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: bodyColor,
      metalness: 0.68,
      roughness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    })
  );
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Carbon Lower Splitter / Underbody Trim
  const trimGeo = trackGeo(new THREE.BoxGeometry(4.1, 0.14, 1.94));
  const trimMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.35,
      roughness: 0.72,
    })
  );
  const trimMesh = new THREE.Mesh(trimGeo, trimMat);
  trimMesh.position.set(0.03, 0.26, 0);
  trimMesh.castShadow = true;
  group.add(trimMesh);

  // 3. Tinted Panoramic Cabin Glasshouse (ExtrudeGeometry)
  const glassShape = new THREE.Shape();
  glassShape.moveTo(-0.82, 0.92);
  glassShape.quadraticCurveTo(-0.42, 1.33, 0.06, 1.36);
  glassShape.lineTo(0.52, 1.34);
  glassShape.quadraticCurveTo(0.88, 1.26, 1.15, 0.92);
  glassShape.closePath();

  const glassGeo = trackGeo(
    new THREE.ExtrudeGeometry(glassShape, {
      depth: 1.44,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 3,
      curveSegments: 14,
    })
  );
  glassGeo.translate(0, 0, -0.72);

  const glassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.15,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 0.88,
    })
  );
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  group.add(glassMesh);

  // 4. Aerodynamic Racing Stripe Accent
  const accentMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: accentColor,
      metalness: 0.55,
      roughness: 0.25,
    })
  );
  // Add subtle front/rear accent stripes cleanly on hood & roof
  const roofStripeGeo = trackGeo(new THREE.BoxGeometry(0.95, 0.05, 0.36));
  const roofStripe = new THREE.Mesh(roofStripeGeo, accentMat);
  roofStripe.position.set(0.28, 1.46, 0);
  group.add(roofStripe);

  const frontLipStripeGeo = trackGeo(new THREE.BoxGeometry(0.92, 0.06, 0.38));
  const frontLipStripe = new THREE.Mesh(frontLipStripeGeo, accentMat);
  frontLipStripe.position.set(1.56, 0.81, 0);
  frontLipStripe.rotation.z = -0.26;
  group.add(frontLipStripe);

  // 5. Rear Aerodynamic Spoiler Wing + Uprights
  const wingGeo = trackGeo(new THREE.BoxGeometry(0.46, 0.07, 1.72));
  const wingMesh = new THREE.Mesh(wingGeo, trimMat);
  wingMesh.position.set(-1.76, 1.18, 0);
  wingMesh.rotation.z = 0.1;
  wingMesh.castShadow = true;
  group.add(wingMesh);

  const strutGeo = trackGeo(new THREE.BoxGeometry(0.12, 0.34, 0.08));
  [-0.5, 0.5].forEach((zPos) => {
    const strut = new THREE.Mesh(strutGeo, accentMat);
    strut.position.set(-1.72, 1.0, zPos);
    group.add(strut);
  });

  // 6. Optional Photogate Sensor Fin (for physics lab sensor triggering)
  if (includeFlag) {
    const finGeo = trackGeo(new THREE.BoxGeometry(0.26, 0.42, 0.08));
    const finMesh = new THREE.Mesh(finGeo, accentMat);
    finMesh.position.set(0, 1.65, 0);
    finMesh.castShadow = true;
    group.add(finMesh);
  }

  // 7. LED Headlights & Brake Taillights
  const headlightGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.14, 0.34));
  const headlightMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      emissive: 0xfef08a,
      emissiveIntensity: 1.8,
      roughness: 0.15,
    })
  );
  [-0.58, 0.58].forEach((zPos) => {
    const lamp = new THREE.Mesh(headlightGeo, headlightMat);
    lamp.position.set(2.04, 0.56, zPos);
    group.add(lamp);
  });

  const taillightGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.12, 0.42));
  const taillightMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    })
  );
  [-0.56, 0.56].forEach((zPos) => {
    const tail = new THREE.Mesh(taillightGeo, taillightMat);
    tail.position.set(-1.98, 0.62, zPos);
    group.add(tail);
  });

  // 8. Side Mirrors
  const mirrorGeo = trackGeo(new THREE.BoxGeometry(0.18, 0.11, 0.2));
  [-0.95, 0.95].forEach((zPos) => {
    const mirror = new THREE.Mesh(mirrorGeo, bodyMat);
    mirror.position.set(0.68, 0.96, zPos);
    group.add(mirror);
  });

  // 9. 4 Multi-Part Wheels (Tire + Metallic Chrome Rim + 5 Spokes + Brake Caliper Hub)
  const tireGeo = trackGeo(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24));
  const rimGeo = trackGeo(new THREE.CylinderGeometry(0.27, 0.27, 0.34, 18));
  const hubGeo = trackGeo(new THREE.CylinderGeometry(0.1, 0.1, 0.36, 12));
  const spokeGeo = trackGeo(new THREE.BoxGeometry(0.46, 0.055, 0.35));

  const tireMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.1,
      roughness: 0.85,
    })
  );
  const rimMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15,
      clearcoat: 0.8,
    })
  );

  const wheelPositions: [number, number, number][] = [
    [-1.18, 0.42, 0.92],
    [1.24, 0.42, 0.92],
    [-1.18, 0.42, -0.92],
    [1.24, 0.42, -0.92],
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(wx, wy, wz);

    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.x = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    wheelGroup.add(rim);

    const hub = new THREE.Mesh(hubGeo, accentMat);
    hub.rotation.x = Math.PI / 2;
    wheelGroup.add(hub);

    const spoke1 = new THREE.Mesh(spokeGeo, rimMat);
    const spoke2 = new THREE.Mesh(spokeGeo, rimMat);
    spoke2.rotation.z = Math.PI / 2;
    wheelGroup.add(spoke1, spoke2);

    wheels.push(wheelGroup);
    group.add(wheelGroup);
  });

  // 10. Grounding Contact Shadow
  const shadowGeo = trackGeo(new THREE.PlaneGeometry(4.6, 2.5));
  const shadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    })
  );
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0.05, 0.02, 0);
  group.add(shadowPlane);

  if (scale !== 1) {
    group.scale.setScalar(scale);
  }

  return {
    group,
    wheels,
    headlightMat,
    taillightMat,
    bodyMat,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
