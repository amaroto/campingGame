import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { MAX_PLOTS, type Plot } from './config';

export function createWorld(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
  const scene = new Scene(engine);
  const daySky = new Color3(0.53, 0.66, 0.64);
  const nightSky = new Color3(0.12, 0.18, 0.29);
  scene.clearColor = new Color4(daySky.r, daySky.g, daySky.b, 1);
  scene.ambientColor = new Color3(0.42, 0.42, 0.42);

  const camera = new ArcRotateCamera('camera', -Math.PI / 2.35, 1.03, 21, new Vector3(0, 0, 0), scene);
  camera.lowerRadiusLimit = 16;
  camera.upperRadiusLimit = 28;
  camera.lowerBetaLimit = 0.82;
  camera.upperBetaLimit = 1.25;
  camera.wheelPrecision = 55;
  camera.panningSensibility = 0;
  camera.attachControl(canvas, true);

  const hemi = new HemisphericLight('soft-sky', new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.62;
  hemi.groundColor = new Color3(0.38, 0.34, 0.27);
  const dayGround = new Color3(0.38, 0.34, 0.27);
  const nightGround = new Color3(0.18, 0.21, 0.26);
  const sun = new DirectionalLight('late-afternoon-sun', new Vector3(-0.5, -1, 0.45), scene);
  sun.position = new Vector3(8, 15, -10);
  sun.intensity = 0.78;
  const daySunColor = new Color3(1, 0.89, 0.72);
  const nightSunColor = new Color3(0.46, 0.58, 0.82);
  const dayAmbient = new Color3(0.42, 0.42, 0.42);
  const nightAmbient = new Color3(0.28, 0.32, 0.43);
  const shadows = new ShadowGenerator(2048, sun);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = 32;
  shadows.bias = 0.0005;
  shadows.normalBias = 0.025;

  function material(name: string, color: string, roughness = 1): StandardMaterial {
    const mat = new StandardMaterial(name, scene);
    mat.diffuseColor = Color3.FromHexString(color);
    mat.specularColor = new Color3(0.16, 0.16, 0.16);
    mat.roughness = roughness;
    return mat;
  }

  const materials = {
    grass: material('meadow', '#829B73'),
    groundLight: material('sunlit grass', '#748A68'),
    groundDark: material('shadow grass', '#647D5B'),
    path: material('warm gravel', '#D7C89F'),
    wood: material('cedar wood', '#8F6847'),
    woodLight: material('pale wood', '#C49A67'),
    cream: material('canvas cream', '#F2E6C9'),
    terracotta: material('canvas terracotta', '#D58C66'),
    sage: material('canvas sage', '#AFC59A'),
    dark: material('deep green', '#405D47'),
    leaf: material('leaf green', '#62845C'),
    leafLight: material('leaf light', '#829A64'),
    water: material('pond', '#72A99F', 0.35),
    stone: material('stone', '#C6C5AC'),
    gold: material('golden marker', '#E5BB69'),
    skin: material('traveler', '#DEAA79'),
    clothes: material('traveler clothes', '#66859A'),
    rubbish: material('camping litter', '#735B43'),
    barkLight: material('sunlit bark', '#A17A55'),
    roof: material('weathered roof', '#65745A'),
    roofLight: material('roof edge', '#68765A'),
    window: material('warm window glass', '#97C4BD', 0.3),
    canvasShade: material('canvas seams', '#AE7157'),
    tentDoor: material('tent entrance', '#765947'),
    firewood: material('campfire wood', '#725139'),
    flameOuter: material('campfire amber', '#E58B3D'),
    flameInner: material('campfire glow', '#F4CE70'),
    flower: material('wildflower', '#E7C779'),
    berry: material('red berries', '#B85F4A'),
    metal: material('camping metal', '#596E69', 0.45),
    stoneWarm: material('warm pebbles', '#B0A58A'),
  };
  materials.window.emissiveColor = new Color3(0.06, 0.1, 0.08);
  materials.flameOuter.emissiveColor = new Color3(0.28, 0.09, 0.025);
  materials.flameInner.emissiveColor = new Color3(0.34, 0.22, 0.05);

  function addShadows(mesh: Mesh): Mesh {
    shadows.addShadowCaster(mesh);
    return mesh;
  }

  function box(name: string, x: number, y: number, z: number, w: number, h: number, d: number, mat: StandardMaterial): Mesh {
    const mesh = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
    mesh.position.set(x, y, z);
    mesh.material = mat;
    mesh.receiveShadows = true;
    return mesh;
  }

  function triangleMesh(name: string, points: number[], mat: StandardMaterial): Mesh {
    const mesh = new Mesh(name, scene);
    const vertexData = new VertexData();
    vertexData.positions = points;
    vertexData.indices = [0, 1, 2];
    vertexData.normals = [];
    VertexData.ComputeNormals(points, vertexData.indices, vertexData.normals);
    vertexData.applyToMesh(mesh);
    mat.backFaceCulling = false;
    mesh.material = mat;
    mesh.receiveShadows = true;
    return mesh;
  }

  function createTree(x: number, z: number, scale = 1): void {
    const trunk = MeshBuilder.CreateCylinder('tree trunk', { height: 1.7 * scale, diameterTop: 0.2 * scale, diameterBottom: 0.34 * scale, tessellation: 9 }, scene);
    trunk.position.set(x, 0.83 * scale, z);
    trunk.material = materials.wood;
    addShadows(trunk);
    const palette = [materials.leaf, materials.leafLight, materials.dark];
    const crownClusters = [
      { x: 0, y: 2.18, z: 0, size: 1.48 },
      { x: -0.34, y: 2.38, z: 0.08, size: 1.12 },
      { x: 0.34, y: 2.35, z: -0.08, size: 1.14 },
      { x: 0.02, y: 2.78, z: -0.28, size: 1.08 },
      { x: -0.1, y: 2.72, z: 0.29, size: 1.04 },
      { x: 0.02, y: 3.03, z: 0.02, size: 0.88 },
    ];
    crownClusters.forEach((cluster, index) => {
      const crown = MeshBuilder.CreateSphere('natural tree crown', { diameter: 1, segments: 12 }, scene);
      crown.position.set(x + cluster.x * scale, cluster.y * scale, z + cluster.z * scale);
      crown.scaling.set(cluster.size * scale, cluster.size * 0.72 * scale, cluster.size * 0.94 * scale);
      const treeVariant = Math.floor(Math.abs(x * 11 + z * 7)) % palette.length;
      crown.material = palette[(index + treeVariant) % palette.length];
      addShadows(crown);
    });
  }

  function createBush(x: number, z: number, scale = 1): void {
    for (let index = 0; index < 3; index += 1) {
      const bush = MeshBuilder.CreateSphere('little shrub', { diameter: 0.85 * scale, segments: 7 }, scene);
      bush.position.set(x + (index - 1) * 0.34 * scale, (0.34 + (index % 2) * 0.08) * scale, z + (index % 2) * 0.2 * scale);
      bush.scaling.set(0.78, 0.75, 0.8);
      bush.material = index === 1 ? materials.leafLight : materials.leaf;
      addShadows(bush);
    }
    const berry = MeshBuilder.CreateSphere('small berry', { diameter: 0.12 * scale, segments: 5 }, scene);
    berry.position.set(x + 0.18 * scale, 0.52 * scale, z - 0.18 * scale);
    berry.material = materials.berry;
  }

  // A broad, softly framed meadow keeps the scene readable around the management cards.
  const meadow = box('campground meadow', 0, -0.3, 0, 20, 0.45, 14, materials.grass);
  meadow.receiveShadows = true;
  const outerGrass = box('surrounding lawn', 0, -0.57, 0, 200, 0.12, 200, materials.groundLight);
  outerGrass.receiveShadows = true;

  const pond = MeshBuilder.CreateDisc('little pond', { radius: 1.8, tessellation: 48 }, scene);
  pond.rotation.x = Math.PI / 2;
  pond.position.set(7.2, 0.015, -4.5);
  pond.scaling.set(1.18, 0.62, 1);
  pond.material = materials.water;
  const pondRim = MeshBuilder.CreateCylinder('pond stone bank', { diameter: 4.25, height: 0.08, tessellation: 48 }, scene);
  pondRim.position.set(7.2, -0.06, -4.5);
  pondRim.scaling.set(1.18, 0.62, 1);
  pondRim.material = materials.stoneWarm;
  for (let reedIndex = 0; reedIndex < 5; reedIndex += 1) {
    const reed = MeshBuilder.CreateCylinder('pond reed', { height: 0.58, diameterTop: 0.025, diameterBottom: 0.07, tessellation: 4 }, scene);
    reed.position.set(5.75 + reedIndex * 0.18, 0.28, -3.0 + (reedIndex % 2) * 0.13);
    reed.rotation.z = (reedIndex - 2) * 0.12;
    reed.material = materials.leaf;
  }

  const path = box('main walking path', 0, -0.045, 2.5, 18, 0.08, 1.35, materials.path);
  path.receiveShadows = true;
  const pathBranch = box('path to cabin', -7.3, -0.035, -0.25, 1.1, 0.07, 4.1, materials.path);
  pathBranch.receiveShadows = true;
  const pathToPond = box('path to pond', 6.1, -0.04, 1.25, 0.72, 0.07, 1.25, materials.path);
  pathToPond.rotation.y = -0.38;
  pathToPond.receiveShadows = true;
  for (let index = 0; index < 22; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const z = -3.8 + index * 0.36;
    const pebble = MeshBuilder.CreateSphere('pathside pebble', { diameter: 0.16 + (index % 3) * 0.035, segments: 6 }, scene);
    pebble.position.set(side * (8.95 + (index % 4) * 0.12), -0.025, z);
    pebble.scaling.set(1.25, 0.38, 0.9);
    pebble.material = materials.stoneWarm;
  }

  const cabin = MeshBuilder.CreateBox('reception hut', { width: 2.6, height: 1.65, depth: 1.8 }, scene);
  cabin.position.set(-7.3, 0.83, -1.6);
  cabin.material = materials.woodLight;
  addShadows(cabin);
  for (let row = 0; row < 5; row += 1) {
    const beam = box(`cabin timber course ${row}`, -7.3, 0.2 + row * 0.31, -0.665, 2.55, 0.035, 0.035, materials.wood);
    beam.receiveShadows = true;
  }
  const roofLeft = box('cabin roof left slope', -7.83, 2.14, -1.6, 1.52, 0.14, 2.25, materials.roof);
  roofLeft.rotation.z = 0.58;
  addShadows(roofLeft);
  const roofRight = box('cabin roof right slope', -6.77, 2.14, -1.6, 1.52, 0.14, 2.25, materials.roof);
  roofRight.rotation.z = -0.58;
  addShadows(roofRight);
  for (let row = 0; row < 5; row += 1) {
    const offset = -0.58 + row * 0.29;
    const leftShingle = box('roof shingle seam', -7.83 + offset, 2.14 + offset * 0.55, -1.6, 0.035, 0.025, 2.18, materials.roofLight);
    leftShingle.rotation.z = 0.58;
    const rightShingle = box('roof shingle seam', -6.77 + offset, 2.14 - offset * 0.55, -1.6, 0.035, 0.025, 2.18, materials.roofLight);
    rightShingle.rotation.z = -0.58;
  }
  const ridge = box('cabin roof ridge', -7.3, 2.6, -1.6, 0.16, 0.16, 2.4, materials.roofLight);
  ridge.rotation.z = Math.PI / 4;
  addShadows(ridge);
  const chimney = box('cabin chimney', -8.05, 2.48, -1.95, 0.34, 0.95, 0.42, materials.wood);
  addShadows(chimney);
  const chimneyCap = box('chimney cap', -8.05, 2.98, -1.95, 0.52, 0.12, 0.58, materials.stoneWarm);
  addShadows(chimneyCap);
  for (const z of [-2.78, -0.42]) {
    triangleMesh(
      'cabin timber gable',
      [-8.6, 1.68, z, -7.3, 2.57, z, -6, 1.68, z],
      materials.woodLight,
    );
  }
  const door = box('cabin door', -7.3, 0.56, -0.68, 0.58, 1.12, 0.08, materials.wood);
  addShadows(door);
  const doorHandle = MeshBuilder.CreateSphere('door handle', { diameter: 0.07, segments: 6 }, scene);
  doorHandle.position.set(-7.08, 0.55, -0.61);
  doorHandle.material = materials.gold;
  for (const x of [-8.08, -6.52]) {
    const frame = box('window frame', x, 1.13, -0.68, 0.62, 0.58, 0.1, materials.wood);
    box('window glass', x, 1.13, -0.62, 0.47, 0.42, 0.04, materials.window);
    box('window crossbar', x, 1.13, -0.58, 0.045, 0.43, 0.04, materials.cream);
    box('window sill', x, 0.81, -0.62, 0.75, 0.08, 0.16, materials.wood);
    addShadows(frame);
  }
  const porch = box('reception porch', -7.3, 0.12, -0.16, 2.6, 0.18, 1.1, materials.wood);
  porch.receiveShadows = true;
  const porchStep = box('porch step', -7.3, 0.035, 0.43, 1.5, 0.1, 0.34, materials.stoneWarm);
  porchStep.receiveShadows = true;
  box('welcome sign', -7.3, 1.47, -0.57, 1.05, 0.32, 0.1, materials.cream);
  const signText = box('sign lettering', -7.3, 1.47, -0.505, 0.58, 0.045, 0.025, materials.dark);
  signText.isPickable = false;
  const lamp = MeshBuilder.CreateSphere('porch lantern', { diameter: 0.2, segments: 7 }, scene);
  lamp.position.set(-7.3, 1.79, -0.58);
  lamp.material = material('lantern glow', '#F0D996');
  (lamp.material as StandardMaterial).emissiveColor = new Color3(0.32, 0.24, 0.1);

  for (const [x, z, size] of [
    [-9, -5, 1.2], [-8.6, 4.7, 1.2], [-5.4, 5.6, 0.9], [-2.8, 5.7, 1.1],
    [1, 5.7, 1], [4.4, 5.8, 1.15], [8.7, 3.2, 1.2], [9, -1, 0.95],
    [4.7, -5.8, 1.1], [1, -5.6, 0.9], [-3.5, -5.8, 1.2], [-7, -4.5, 0.9],
  ] as const) createTree(x, z, size);
  for (const [x, z] of [[-6, 2.8], [-3, 3.3], [3, 3.2], [6, 3.5], [-8.4, -3.9], [5.8, -5.5]] as const) createBush(x, z);

  const plotCenters = [
    new Vector3(-4.3, 0, -2.4), new Vector3(0, 0, -2.4), new Vector3(4.3, 0, -2.4),
    new Vector3(-4.3, 0, 0.2), new Vector3(0, 0, 0.2), new Vector3(4.3, 0, 0.2),
  ];
  const plots: Plot[] = [];
  const plotMaterials = [
    material('plot green', '#A9BE8F'),
    material('plot selected', '#DDE9B8'),
    material('plot unavailable', '#8C9D7B'),
    material('plot needs cleaning', '#B9A184'),
    material('selected plot needs cleaning', '#D7B876'),
  ];
  const selectedPlotBorder = material('selected plot border', '#EFCB78');
  const plotFrames: Mesh[][] = [];
  const fireLights: PointLight[] = [];
  const fireNightIntensities: number[] = [];

  function makeTent(index: number): Mesh {
    const center = plotCenters[index];
    const tent = MeshBuilder.CreateBox(`tent ${index + 1}`, { width: 0.01, height: 0.01, depth: 0.01 }, scene);
    tent.position.set(center.x, 0, center.z);
    tent.isVisible = false;
    tent.isPickable = false;
    const fireLight = new PointLight(`campfire light ${index + 1}`, new Vector3(-1.02, 0.52, 0.49), scene);
    fireLight.parent = tent;
    fireLight.diffuse = new Color3(1, 0.48, 0.16);
    fireLight.range = 5.5;
    fireLight.intensity = 0;
    fireLights[index] = fireLight;
    fireNightIntensities[index] = 0;
    const cloth = index % 2 === 0 ? materials.terracotta : materials.sage;
    const fabricPanel = material(`tent fabric ${index + 1}`, index % 2 === 0 ? '#D99470' : '#BAC8A0');
    const seamMat = index % 2 === 0 ? materials.canvasShade : materials.leaf;

    const addPart = (part: Mesh, x: number, y: number, z: number): Mesh => {
      part.parent = tent;
      part.position.set(x, y, z);
      part.isPickable = true;
      addShadows(part);
      return part;
    };
    const addTriangle = (name: string, points: number[], mat: StandardMaterial): Mesh => {
      const mesh = new Mesh(name, scene);
      const vertexData = new VertexData();
      vertexData.positions = points;
      vertexData.indices = [0, 1, 2];
      vertexData.normals = [];
      VertexData.ComputeNormals(points, vertexData.indices, vertexData.normals);
      vertexData.applyToMesh(mesh);
      mat.backFaceCulling = false;
      mesh.material = mat;
      return mesh;
    };

    const slopeAngle = Math.atan(0.66 / 1.05);
    for (const side of [-1, 1] as const) {
      const panel = box('sloping tent canvas', center.x + side * 0.33, 0.55, center.z, 0.09, 1.25, 1.55, fabricPanel);
      panel.rotation.z = side * slopeAngle;
      addPart(panel, side * 0.33, 0.55, 0);
      const seam = box('tent stitched seam', center.x + side * 0.32, 0.69, center.z, 0.1, 0.025, 1.53, seamMat);
      seam.rotation.z = side * slopeAngle;
      addPart(seam, side * 0.32, 0.69, 0);
    }
    const front = addTriangle(
      `tent front ${index + 1}`,
      [-0.66, 0.03, 0.72, 0, 1.1, 0.72, 0.66, 0.03, 0.72],
      cloth,
    );
    addPart(front, 0, 0, 0);
    const rear = addTriangle(
      `tent back ${index + 1}`,
      [-0.66, 0.03, -0.72, 0.66, 0.03, -0.72, 0, 1.1, -0.72],
      cloth,
    );
    addPart(rear, 0, 0, 0);
    const flap = addTriangle(
      `tent doorway ${index + 1}`,
      [-0.24, 0.05, 0.733, 0, 0.55, 0.733, 0.24, 0.05, 0.733],
      materials.tentDoor,
    );
    addPart(flap, 0, 0, 0);
    for (const x of [-0.66, 0.66]) {
      for (const z of [-0.72, 0.72]) {
        const pole = MeshBuilder.CreateCylinder('tent support pole', { height: 0.16, diameterTop: 0.025, diameterBottom: 0.04, tessellation: 6 }, scene);
        pole.position.set(center.x + x, 0.08, center.z + z);
        pole.material = materials.metal;
        addPart(pole, x, 0.08, z);
      }
    }
    const ridgePole = MeshBuilder.CreateCylinder('tent ridge support', { height: 1.55, diameter: 0.035, tessellation: 6 }, scene);
    ridgePole.rotation.x = Math.PI / 2;
    ridgePole.position.set(center.x, 1.08, center.z);
    ridgePole.material = materials.metal;
    addPart(ridgePole, 0, 1.08, 0);

    const tableTop = MeshBuilder.CreateCylinder('camp table top', { height: 0.07, diameter: 0.63, tessellation: 8 }, scene);
    tableTop.position.set(center.x + 1.0, 0.49, center.z - 0.2);
    tableTop.material = materials.woodLight;
    addPart(tableTop, 1, 0.49, -0.2);
    for (const x of [0.78, 1.22]) {
      for (const z of [-0.38, -0.02]) {
        const leg = MeshBuilder.CreateCylinder('camp table leg', { height: 0.48, diameter: 0.045, tessellation: 5 }, scene);
        leg.position.set(center.x + x, 0.24, center.z + z);
        leg.material = materials.wood;
        addPart(leg, x, 0.24, z);
      }
    }
    const chairSeat = box('folding chair seat', center.x + 1.15, 0.28, center.z + 0.65, 0.55, 0.08, 0.42, materials.terracotta);
    addPart(chairSeat, 1.15, 0.28, 0.65);
    const chairBack = box('folding chair back', center.x + 1.15, 0.56, center.z + 0.82, 0.55, 0.5, 0.07, materials.terracotta);
    chairBack.rotation.x = -0.12;
    addPart(chairBack, 1.15, 0.56, 0.82);
    for (const x of [0.92, 1.38]) {
      const chairLeg = MeshBuilder.CreateCylinder('folding chair leg', { height: 0.52, diameter: 0.035, tessellation: 5 }, scene);
      chairLeg.position.set(center.x + x, 0.25, center.z + 0.68);
      chairLeg.rotation.x = 0.12;
      chairLeg.material = materials.metal;
      addPart(chairLeg, x, 0.25, 0.68);
    }
    const campfire = MeshBuilder.CreateCylinder('campfire ember bed', { height: 0.08, diameter: 0.53, tessellation: 9 }, scene);
    campfire.position.set(center.x - 1.02, 0.12, center.z + 0.49);
    campfire.material = materials.stoneWarm;
    addPart(campfire, -1.02, 0.12, 0.49);
    for (let stoneIndex = 0; stoneIndex < 7; stoneIndex += 1) {
      const angle = stoneIndex / 7 * Math.PI * 2;
      const stone = MeshBuilder.CreateSphere('campfire ring stone', { diameter: 0.19, segments: 5 }, scene);
      stone.position.set(center.x - 1.02 + Math.cos(angle) * 0.31, 0.12, center.z + 0.49 + Math.sin(angle) * 0.31);
      stone.scaling.y = 0.62;
      stone.material = stoneIndex % 2 === 0 ? materials.stoneWarm : materials.stone;
      addPart(stone, -1.02 + Math.cos(angle) * 0.31, 0.12, 0.49 + Math.sin(angle) * 0.31);
    }
    for (const angle of [-0.55, 0.55]) {
      const log = MeshBuilder.CreateCylinder('campfire log', { height: 0.58, diameter: 0.095, tessellation: 6 }, scene);
      log.position.set(center.x - 1.02, 0.21, center.z + 0.49);
      log.rotation.y = angle;
      log.rotation.z = 0.13;
      log.material = materials.firewood;
      addPart(log, -1.02, 0.21, 0.49);
    }
    const flame = MeshBuilder.CreateSphere('campfire flame', { diameter: 0.22, segments: 5 }, scene);
    flame.position.set(center.x - 1.02, 0.31, center.z + 0.49);
    flame.scaling.set(0.62, 1.25, 0.62);
    flame.material = materials.flameOuter;
    addPart(flame, -1.02, 0.38, 0.49);
    const flameCore = MeshBuilder.CreateSphere('campfire core', { diameter: 0.12, segments: 5 }, scene);
    flameCore.position.set(center.x - 1.02, 0.29, center.z + 0.49);
    flameCore.scaling.set(0.62, 1.15, 0.62);
    flameCore.material = materials.flameInner;
    addPart(flameCore, -1.02, 0.34, 0.49);
    tent.metadata = { fabric: cloth, plotIndex: index };
    return tent;
  }

  function makeGuest(index: number): Mesh {
    const center = plotCenters[index];
    const body = MeshBuilder.CreateCylinder(`guest ${index + 1}`, { height: 0.72, diameterTop: 0.37, diameterBottom: 0.42, tessellation: 7 }, scene);
    body.position.set(center.x - 1.25, 0.38, center.z - 0.38);
    body.material = index % 2 === 0 ? materials.clothes : materials.leaf;
    body.isPickable = true;
    const head = MeshBuilder.CreateSphere(`guest head ${index + 1}`, { diameter: 0.32, segments: 7 }, scene);
    head.position.set(0, 0.52, 0);
    head.material = materials.skin;
    body.metadata = { plotIndex: index };
    head.isPickable = false;
    body.setEnabled(false);
    head.parent = body;
    const backpack = MeshBuilder.CreateBox(`guest backpack ${index + 1}`, { width: 0.25, height: 0.34, depth: 0.16 }, scene);
    backpack.position.set(-0.19, 0.03, 0.04);
    backpack.material = index % 2 === 0 ? materials.terracotta : materials.woodLight;
    backpack.isPickable = false;
    backpack.parent = body;
    for (const side of [-1, 1] as const) {
      const arm = MeshBuilder.CreateCylinder(`guest arm ${index + 1}`, { height: 0.46, diameter: 0.11, tessellation: 6 }, scene);
      arm.position.set(side * 0.25, 0.02, 0);
      arm.rotation.z = side * -0.18;
      arm.material = body.material;
      arm.isPickable = false;
      arm.parent = body;
      const leg = MeshBuilder.CreateCylinder(`guest leg ${index + 1}`, { height: 0.34, diameter: 0.13, tessellation: 6 }, scene);
      leg.position.set(side * 0.11, -0.48, 0);
      leg.material = materials.dark;
      leg.isPickable = false;
      leg.parent = body;
    }
    const hat = MeshBuilder.CreateCylinder(`guest hat ${index + 1}`, { height: 0.08, diameterTop: 0.28, diameterBottom: 0.4, tessellation: 8 }, scene);
    hat.position.set(0, 0.7, 0);
    hat.material = materials.woodLight;
    hat.isPickable = false;
    hat.parent = body;
    return body;
  }

  for (let index = 0; index < MAX_PLOTS; index += 1) {
    const center = plotCenters[index];
    const deck = box(`plot ${index + 1}`, center.x, 0.015, center.z, 3.45, 0.08, 2.1, plotMaterials[0]);
    deck.metadata = { plotIndex: index };
    deck.isPickable = true;
    const frame = [
      box(`plot ${index + 1} selection front`, center.x, 0.08, center.z - 1.03, 3.5, 0.035, 0.055, selectedPlotBorder),
      box(`plot ${index + 1} selection back`, center.x, 0.08, center.z + 1.03, 3.5, 0.035, 0.055, selectedPlotBorder),
      box(`plot ${index + 1} selection left`, center.x - 1.72, 0.08, center.z, 0.055, 0.035, 2.1, selectedPlotBorder),
      box(`plot ${index + 1} selection right`, center.x + 1.72, 0.08, center.z, 0.055, 0.035, 2.1, selectedPlotBorder),
    ];
    frame.forEach((edge) => {
      edge.isPickable = false;
      edge.setEnabled(false);
    });
    plotFrames.push(frame);
    const accent = box(`plot marker ${index + 1}`, center.x, 0.08, center.z + 0.82, 0.32, 0.025, 0.035, materials.gold);
    accent.isPickable = false;
    const rock = MeshBuilder.CreateSphere(`plot stone ${index + 1}`, { diameter: 0.25, segments: 5 }, scene);
    rock.position.set(center.x - 1.43, 0.13, center.z + 0.78);
    rock.material = materials.stone;
    rock.metadata = { plotIndex: index };
    rock.isPickable = true;
    const rubbish = MeshBuilder.CreateSphere(`litter on plot ${index + 1}`, { diameter: 0.46, segments: 4 }, scene);
    rubbish.position.set(center.x + 0.45, 0.14, center.z + 0.25);
    rubbish.scaling.set(1.2, 0.36, 0.8);
    rubbish.material = materials.rubbish;
    rubbish.metadata = { plotIndex: index };
    rubbish.isPickable = true;
    rubbish.setEnabled(false);
    plots.push({
      level: 0,
      guestUntil: 0,
      stayDurationSeconds: 0,
      guestName: '',
      dirty: false,
      meshes: [deck],
      accent,
      rubbish,
      tent: makeTent(index),
      guest: makeGuest(index),
    });
  }


  function updateDayNight(timeMinutes: number): string {
    const hour = timeMinutes / 60;
    const smoothstep = (start: number, end: number, value: number): number => {
      const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
      return t * t * (3 - 2 * t);
    };
    const daylight = smoothstep(5, 7, hour) * (1 - smoothstep(17, 19, hour));
    const night = 1 - daylight;
    const blend = (dayValue: number, nightValue: number): number => nightValue + (dayValue - nightValue) * daylight;

    scene.clearColor.r = blend(daySky.r, nightSky.r);
    scene.clearColor.g = blend(daySky.g, nightSky.g);
    scene.clearColor.b = blend(daySky.b, nightSky.b);
    scene.ambientColor.r = blend(dayAmbient.r, nightAmbient.r);
    scene.ambientColor.g = blend(dayAmbient.g, nightAmbient.g);
    scene.ambientColor.b = blend(dayAmbient.b, nightAmbient.b);
    hemi.intensity = blend(0.62, 0.48);
    hemi.groundColor.r = blend(dayGround.r, nightGround.r);
    hemi.groundColor.g = blend(dayGround.g, nightGround.g);
    hemi.groundColor.b = blend(dayGround.b, nightGround.b);
    sun.intensity = blend(0.78, 0.16);
    sun.diffuse.r = blend(daySunColor.r, nightSunColor.r);
    sun.diffuse.g = blend(daySunColor.g, nightSunColor.g);
    sun.diffuse.b = blend(daySunColor.b, nightSunColor.b);
    materials.flameOuter.emissiveColor = new Color3(0.28 * night, 0.09 * night, 0.025 * night);
    materials.flameInner.emissiveColor = new Color3(0.34 * night, 0.22 * night, 0.05 * night);
    fireNightIntensities.fill(night * 1.6);
    return daylight < 0.15
      ? String.fromCodePoint(0x263E)
      : daylight < 0.75
        ? String.fromCodePoint(0x25D0)
        : String.fromCodePoint(0x2600);
  }

  function updateWorldAnimations(timeSeconds: number): void {
    fireLights.forEach((light, index) => {
      light.intensity = fireNightIntensities[index] * (0.94 + Math.sin(timeSeconds * 8 + index) * 0.06);
    });
    plots.forEach((plot, index) => {
      const guest = plot.guest;
      if (!guest?.isEnabled()) return;
      const phase = timeSeconds * 0.8 + index * 1.7;
      guest.position.x = plotCenters[index].x - 1.25 + Math.sin(phase) * 0.34;
      guest.position.y = 0.38 + Math.abs(Math.sin(phase * 2)) * 0.025;
      guest.position.z = plotCenters[index].z - 0.38 + Math.cos(phase * 0.72) * 0.25;
      guest.rotation.y = Math.cos(phase) * 0.35;
    });
  }

  function updatePlotVisuals(selected: number, unlocked: number): void {
    plots.forEach((plot, index) => {
      const deck = plot.meshes[0];
      deck.material = index >= unlocked
        ? plotMaterials[2]
        : plot.dirty
          ? index === selected ? plotMaterials[4] : plotMaterials[3]
          : index === selected
            ? plotMaterials[1]
            : plotMaterials[0];
      plot.accent.visibility = index === selected ? 1 : 0.3;
      plot.accent.material = plot.dirty && index !== selected ? materials.rubbish : materials.gold;
      plotFrames[index].forEach((edge) => edge.setEnabled(index === selected));
    });
  }

  return { engine, scene, camera, plots, plotCenters, materials, plotMaterials, updateDayNight, updatePlotVisuals, updateWorldAnimations };
}
