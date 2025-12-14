import * as THREE from 'three';
import * as state from './state.js';

// MR用の影設定を作成
export function createMRShadow() {
  // 影用のディレクショナルライトを追加
  const shadowLight = new THREE.DirectionalLight(0xffffff, 0.5);
  shadowLight.position.set(0, 10, 0);
  shadowLight.castShadow = true;
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;
  shadowLight.shadow.camera.near = 0.5;
  shadowLight.shadow.camera.far = 50;
  shadowLight.shadow.camera.left = -5;
  shadowLight.shadow.camera.right = 5;
  shadowLight.shadow.camera.top = 5;
  shadowLight.shadow.camera.bottom = -5;
  state.scene.add(shadowLight);
  state.scene.add(shadowLight.target);
  state.setVrShadowLight(shadowLight);

  // フォールバック用の床面（検出された平面がない場合用）
  const floorGeometry = new THREE.PlaneGeometry(50, 50);
  const floorMaterial = new THREE.ShadowMaterial({
    opacity: 0.3
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.001;
  floor.receiveShadow = true;
  state.scene.add(floor);
  state.setVrFloor(floor);

  // レンダラーの影を有効化
  state.renderer.shadowMap.enabled = true;
  state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // ドローンに影を付ける
  if (state.drone) {
    state.drone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
  }

  console.log('MR影設定を作成しました');
}

// MR用の影設定を削除
export function removeMRShadow() {
  if (state.vrFloor) {
    state.scene.remove(state.vrFloor);
    state.vrFloor.geometry.dispose();
    state.vrFloor.material.dispose();
    state.setVrFloor(null);
  }

  if (state.vrShadowLight) {
    state.scene.remove(state.vrShadowLight.target);
    state.scene.remove(state.vrShadowLight);
    state.setVrShadowLight(null);
  }

  // 検出された平面の影メッシュを削除
  state.mrPlaneShadowMeshes.forEach((mesh) => {
    state.scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  state.mrPlaneShadowMeshes.clear();

  console.log('MR影設定を削除しました');
}

// VR用の背景とグリッドを作成
export function createVREnvironment() {
  state.scene.background = new THREE.Color(0xcccccc);

  const gridSize = 100;
  const gridDivisions = 200;
  const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x888888, 0x999999);
  gridHelper.position.y = 0;
  state.scene.add(gridHelper);
  state.setGridHelper(gridHelper);

  // 影を受ける床面を追加（広範囲）
  const floorGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
  const floorMaterial = new THREE.ShadowMaterial({
    opacity: 0.4
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.001;
  floor.receiveShadow = true;
  state.scene.add(floor);
  state.setVrFloor(floor);

  // 影用のディレクショナルライトを追加（広範囲対応）
  const shadowLight = new THREE.DirectionalLight(0xffffff, 0.8);
  shadowLight.position.set(10, 20, 10);
  shadowLight.castShadow = true;
  shadowLight.shadow.mapSize.width = 4096;
  shadowLight.shadow.mapSize.height = 4096;
  shadowLight.shadow.camera.near = 0.5;
  shadowLight.shadow.camera.far = 100;
  shadowLight.shadow.camera.left = -50;
  shadowLight.shadow.camera.right = 50;
  shadowLight.shadow.camera.top = 50;
  shadowLight.shadow.camera.bottom = -50;
  shadowLight.shadow.bias = -0.0001;
  state.scene.add(shadowLight);
  // ターゲットもシーンに追加（位置更新を反映させるため）
  state.scene.add(shadowLight.target);
  state.setVrShadowLight(shadowLight);

  // レンダラーの影を有効化
  state.renderer.shadowMap.enabled = true;
  state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // ドローンに影を付ける
  if (state.drone) {
    state.drone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
  }

  // 練習用障害物を配置
  createTrainingObstacles();

  console.log('VR環境を作成しました');
}

// 競技用コースを作成（全方向ランダム配置・影付き）
function createTrainingObstacles() {
  const obstacles = [];

  // シード付き乱数生成器（毎回異なる配置）
  const seed = Date.now();
  let randomState = seed;
  function seededRandom() {
    randomState = (randomState * 1103515245 + 12345) & 0x7fffffff;
    return randomState / 0x7fffffff;
  }

  // ランダム範囲生成
  function randomRange(min, max) {
    return min + seededRandom() * (max - min);
  }

  // 1m以上離れているか確認
  function isValidPosition(x, z, minDist = 1) {
    const dist = Math.sqrt(x * x + z * z);
    return dist >= minDist;
  }

  // ヘルパー関数：メッシュに影を設定
  function enableShadow(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }

  // ===== ランダムにトーラスゲートを配置 =====
  const torusCount = 25;
  for (let i = 0; i < torusCount; i++) {
    let x, z;
    let attempts = 0;
    do {
      const angle = seededRandom() * Math.PI * 2;
      const dist = randomRange(1, 40);
      x = Math.cos(angle) * dist + randomRange(-3, 3);
      z = Math.sin(angle) * dist + randomRange(-3, 3);
      attempts++;
    } while (!isValidPosition(x, z) && attempts < 10);

    const y = randomRange(1.0, 3.5);
    const radius = randomRange(0.6, 1.3);
    const rotX = seededRandom() < 0.3 ? randomRange(0, Math.PI / 4) : 0;
    const rotY = seededRandom() * Math.PI * 2;
    const rotZ = seededRandom() < 0.2 ? randomRange(-Math.PI / 6, Math.PI / 6) : 0;

    const tubeRadius = randomRange(0.06, 0.1);
    const geometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 32);
    const hue = seededRandom() * 0.4 + 0.45; // シアン〜青〜紫
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.9, 0.5),
      roughness: 0.2,
      metalness: 0.6,
      emissive: new THREE.Color().setHSL(hue, 0.9, 0.15),
      emissiveIntensity: 0.3
    });
    const torus = new THREE.Mesh(geometry, material);
    torus.position.set(x, y, z);
    torus.rotation.set(rotX, rotY, rotZ);
    enableShadow(torus);
    torus.userData.isObstacle = true;
    torus.userData.type = 'torus';
    torus.userData.outerRadius = radius;
    torus.userData.tubeRadius = tubeRadius;
    state.scene.add(torus);
    obstacles.push(torus);
  }

  // ===== ランダムにキューブを配置 =====
  const cubeCount = 35;
  for (let i = 0; i < cubeCount; i++) {
    let x, z;
    let attempts = 0;
    do {
      const angle = seededRandom() * Math.PI * 2;
      const dist = randomRange(1, 38);
      x = Math.cos(angle) * dist + randomRange(-4, 4);
      z = Math.sin(angle) * dist + randomRange(-4, 4);
      attempts++;
    } while (!isValidPosition(x, z) && attempts < 10);

    const size = randomRange(0.3, 0.9);
    const y = randomRange(0.8, 3.5);

    const geometry = new THREE.BoxGeometry(size, size, size);
    const hue = seededRandom() * 0.2 + 0.02; // 赤〜オレンジ〜黄色系
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.8, 0.5),
      roughness: 0.4,
      metalness: 0.4
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(
      seededRandom() * 0.4,
      seededRandom() * Math.PI,
      seededRandom() * 0.4
    );
    enableShadow(mesh);
    mesh.userData.isObstacle = true;
    mesh.userData.type = 'cube';
    mesh.userData.size = size;
    state.scene.add(mesh);
    obstacles.push(mesh);
  }

  // ===== ランダムにポールを配置 =====
  const poleCount = 20;
  for (let i = 0; i < poleCount; i++) {
    let x, z;
    let attempts = 0;
    do {
      const angle = seededRandom() * Math.PI * 2;
      const dist = randomRange(1, 35);
      x = Math.cos(angle) * dist + randomRange(-2, 2);
      z = Math.sin(angle) * dist + randomRange(-2, 2);
      attempts++;
    } while (!isValidPosition(x, z) && attempts < 10);

    const height = randomRange(2.5, 5.5);
    const radius = 0.12;

    const geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      roughness: 0.4,
      metalness: 0.3,
      emissive: 0x330000,
      emissiveIntensity: 0.2
    });
    const pole = new THREE.Mesh(geometry, material);
    pole.position.set(x, height / 2, z);
    enableShadow(pole);
    pole.userData.isObstacle = true;
    pole.userData.type = 'pole';
    pole.userData.radius = radius;
    pole.userData.height = height;
    state.scene.add(pole);
    obstacles.push(pole);
  }

  // ===== 外周にゴールドのゲート（4方向 + 斜め） =====
  const goldGates = [
    { dist: 40, angle: 0 },
    { dist: 40, angle: Math.PI / 2 },
    { dist: 40, angle: Math.PI },
    { dist: 40, angle: Math.PI * 1.5 },
    { dist: 35, angle: Math.PI / 4 },
    { dist: 35, angle: Math.PI * 3 / 4 },
    { dist: 35, angle: Math.PI * 5 / 4 },
    { dist: 35, angle: Math.PI * 7 / 4 },
  ];

  goldGates.forEach((gate) => {
    const x = Math.cos(gate.angle) * gate.dist;
    const z = Math.sin(gate.angle) * gate.dist;
    const y = randomRange(1.5, 2.5);
    const radius = randomRange(1.2, 1.8);

    const tubeRadius = 0.1;
    const geometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0xffd700,
      emissiveIntensity: 0.5
    });
    const torus = new THREE.Mesh(geometry, material);
    torus.position.set(x, y, z);
    torus.rotation.y = gate.angle + Math.PI / 2;
    enableShadow(torus);
    torus.userData.isObstacle = true;
    torus.userData.type = 'torus';
    torus.userData.outerRadius = radius;
    torus.userData.tubeRadius = tubeRadius;
    state.scene.add(torus);
    obstacles.push(torus);
  });

  // ===== コース境界のポール（緑色、ランダムな間隔で配置） =====
  const boundaryCount = 24;
  for (let i = 0; i < boundaryCount; i++) {
    const angle = (i / boundaryCount) * Math.PI * 2 + randomRange(-0.1, 0.1);
    const dist = randomRange(38, 45);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    const height = randomRange(3, 5);
    const radius = 0.08;
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0x44ff44,
      roughness: 0.5,
      metalness: 0.2,
      emissive: 0x114411,
      emissiveIntensity: 0.3
    });
    const pole = new THREE.Mesh(geometry, material);
    pole.position.set(x, height / 2, z);
    enableShadow(pole);
    pole.userData.isObstacle = true;
    pole.userData.type = 'pole';
    pole.userData.radius = radius;
    pole.userData.height = height;
    state.scene.add(pole);
    obstacles.push(pole);
  }

  // ===== 外周の大きなキューブ（ランダム配置） =====
  const outerCubeCount = 12;
  for (let i = 0; i < outerCubeCount; i++) {
    const angle = seededRandom() * Math.PI * 2;
    const dist = randomRange(25, 38);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const size = randomRange(0.8, 1.2);
    const y = randomRange(1.2, 2.5);

    const geometry = new THREE.BoxGeometry(size, size, size);
    const hue = 0.7 + seededRandom() * 0.2; // 紫〜青系
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.7, 0.5),
      roughness: 0.3,
      metalness: 0.5,
      emissive: new THREE.Color().setHSL(hue, 0.7, 0.1),
      emissiveIntensity: 0.2
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(
      seededRandom() * Math.PI,
      seededRandom() * Math.PI,
      seededRandom() * Math.PI
    );
    enableShadow(mesh);
    mesh.userData.isObstacle = true;
    mesh.userData.type = 'cube';
    mesh.userData.size = size;
    state.scene.add(mesh);
    obstacles.push(mesh);
  }

  // ===== 巨大キューブ（ランダム配置） =====
  const giantCubeCount = 15;
  for (let i = 0; i < giantCubeCount; i++) {
    const angle = seededRandom() * Math.PI * 2;
    const dist = randomRange(1, 40);
    const x = Math.cos(angle) * dist + randomRange(-5, 5);
    const z = Math.sin(angle) * dist + randomRange(-5, 5);

    if (!isValidPosition(x, z)) continue;

    const size = randomRange(1.5, 4.0); // 1.5m〜4mの巨大キューブ
    const y = randomRange(1.0, 8.0); // 高さも様々

    const geometry = new THREE.BoxGeometry(size, size, size);
    const hue = seededRandom(); // 全色相
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.6, 0.4),
      roughness: 0.5,
      metalness: 0.3,
      emissive: new THREE.Color().setHSL(hue, 0.6, 0.1),
      emissiveIntensity: 0.15
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(
      seededRandom() * 0.5,
      seededRandom() * Math.PI,
      seededRandom() * 0.5
    );
    enableShadow(mesh);
    mesh.userData.isObstacle = true;
    mesh.userData.type = 'cube';
    mesh.userData.size = size;
    state.scene.add(mesh);
    obstacles.push(mesh);
  }

  // ===== 巨大トーラス（くぐりがいのあるゲート） =====
  const giantTorusCount = 10;
  for (let i = 0; i < giantTorusCount; i++) {
    const angle = seededRandom() * Math.PI * 2;
    const dist = randomRange(1, 35);
    const x = Math.cos(angle) * dist + randomRange(-3, 3);
    const z = Math.sin(angle) * dist + randomRange(-3, 3);

    if (!isValidPosition(x, z)) continue;

    const radius = randomRange(1.5, 3.5); // 1.5m〜3.5mの巨大ゲート
    const y = randomRange(2.0, 10.0);
    const rotX = seededRandom() < 0.4 ? randomRange(0, Math.PI / 3) : 0;
    const rotY = seededRandom() * Math.PI * 2;
    const rotZ = seededRandom() < 0.3 ? randomRange(-Math.PI / 4, Math.PI / 4) : 0;

    const tubeRadius = randomRange(0.1, 0.2);
    const geometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 32);
    const hue = seededRandom() * 0.3 + 0.55; // 青〜紫〜マゼンタ
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.85, 0.55),
      roughness: 0.15,
      metalness: 0.7,
      emissive: new THREE.Color().setHSL(hue, 0.85, 0.2),
      emissiveIntensity: 0.4
    });
    const torus = new THREE.Mesh(geometry, material);
    torus.position.set(x, y, z);
    torus.rotation.set(rotX, rotY, rotZ);
    enableShadow(torus);
    torus.userData.isObstacle = true;
    torus.userData.type = 'torus';
    torus.userData.outerRadius = radius;
    torus.userData.tubeRadius = tubeRadius;
    state.scene.add(torus);
    obstacles.push(torus);
  }

  // ===== 高高度エリア（5m〜15m）のオブジェクト =====

  // 高高度キューブ
  const highCubeCount = 20;
  for (let i = 0; i < highCubeCount; i++) {
    const angle = seededRandom() * Math.PI * 2;
    const dist = randomRange(1, 40);
    const x = Math.cos(angle) * dist + randomRange(-4, 4);
    const z = Math.sin(angle) * dist + randomRange(-4, 4);

    if (!isValidPosition(x, z)) continue;

    const size = randomRange(0.4, 2.0);
    const y = randomRange(5, 15); // 高高度

    const geometry = new THREE.BoxGeometry(size, size, size);
    const hue = seededRandom() * 0.15 + 0.95; // ピンク〜赤系
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue % 1, 0.75, 0.55),
      roughness: 0.35,
      metalness: 0.45,
      emissive: new THREE.Color().setHSL(hue % 1, 0.75, 0.15),
      emissiveIntensity: 0.25
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(
      seededRandom() * Math.PI,
      seededRandom() * Math.PI,
      seededRandom() * Math.PI
    );
    enableShadow(mesh);
    mesh.userData.isObstacle = true;
    mesh.userData.type = 'cube';
    mesh.userData.size = size;
    state.scene.add(mesh);
    obstacles.push(mesh);
  }

  // 高高度トーラス
  const highTorusCount = 15;
  for (let i = 0; i < highTorusCount; i++) {
    const angle = seededRandom() * Math.PI * 2;
    const dist = randomRange(1, 38);
    const x = Math.cos(angle) * dist + randomRange(-3, 3);
    const z = Math.sin(angle) * dist + randomRange(-3, 3);

    if (!isValidPosition(x, z)) continue;

    const radius = randomRange(0.7, 2.0);
    const y = randomRange(6, 14); // 高高度
    const rotX = seededRandom() * Math.PI / 2;
    const rotY = seededRandom() * Math.PI * 2;
    const rotZ = seededRandom() * Math.PI / 3;

    const tubeRadius = randomRange(0.06, 0.12);
    const geometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 32);
    const hue = seededRandom() * 0.2 + 0.35; // 緑〜シアン系
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.9, 0.5),
      roughness: 0.2,
      metalness: 0.6,
      emissive: new THREE.Color().setHSL(hue, 0.9, 0.15),
      emissiveIntensity: 0.35
    });
    const torus = new THREE.Mesh(geometry, material);
    torus.position.set(x, y, z);
    torus.rotation.set(rotX, rotY, rotZ);
    enableShadow(torus);
    torus.userData.isObstacle = true;
    torus.userData.type = 'torus';
    torus.userData.outerRadius = radius;
    torus.userData.tubeRadius = tubeRadius;
    state.scene.add(torus);
    obstacles.push(torus);
  }

  // ===== 超高高度エリア（15m〜25m）のオブジェクト =====

  // 超高高度の巨大ゲート
  const veryHighTorusCount = 8;
  for (let i = 0; i < veryHighTorusCount; i++) {
    const angle = seededRandom() * Math.PI * 2;
    const dist = randomRange(1, 35);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    const radius = randomRange(2.0, 4.0); // 巨大ゲート
    const y = randomRange(15, 25);
    const rotX = seededRandom() * Math.PI / 3;
    const rotY = seededRandom() * Math.PI * 2;

    const tubeRadius = randomRange(0.12, 0.2);
    const geometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffff, // シアン
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5
    });
    const torus = new THREE.Mesh(geometry, material);
    torus.position.set(x, y, z);
    torus.rotation.set(rotX, rotY, 0);
    enableShadow(torus);
    torus.userData.isObstacle = true;
    torus.userData.type = 'torus';
    torus.userData.outerRadius = radius;
    torus.userData.tubeRadius = tubeRadius;
    state.scene.add(torus);
    obstacles.push(torus);
  }

  // 超高高度のキューブ
  const veryHighCubeCount = 10;
  for (let i = 0; i < veryHighCubeCount; i++) {
    const angle = seededRandom() * Math.PI * 2;
    const dist = randomRange(1, 40);
    const x = Math.cos(angle) * dist + randomRange(-3, 3);
    const z = Math.sin(angle) * dist + randomRange(-3, 3);

    if (!isValidPosition(x, z)) continue;

    const size = randomRange(1.0, 3.0);
    const y = randomRange(15, 22);

    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff00ff, // マゼンタ
      roughness: 0.25,
      metalness: 0.6,
      emissive: 0xff00ff,
      emissiveIntensity: 0.3
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(
      seededRandom() * Math.PI,
      seededRandom() * Math.PI,
      seededRandom() * Math.PI
    );
    enableShadow(mesh);
    mesh.userData.isObstacle = true;
    mesh.userData.type = 'cube';
    mesh.userData.size = size;
    state.scene.add(mesh);
    obstacles.push(mesh);
  }

  // ===== 巨大ポール（タワー） =====
  const towerCount = 8;
  for (let i = 0; i < towerCount; i++) {
    const angle = seededRandom() * Math.PI * 2;
    const dist = randomRange(1, 38);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    const height = randomRange(10, 25); // 10m〜25mの巨大タワー
    const radius = randomRange(0.2, 0.5);

    const geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
    const hue = seededRandom() * 0.1 + 0.0; // 赤〜オレンジ
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.9, 0.5),
      roughness: 0.3,
      metalness: 0.4,
      emissive: new THREE.Color().setHSL(hue, 0.9, 0.15),
      emissiveIntensity: 0.25
    });
    const pole = new THREE.Mesh(geometry, material);
    pole.position.set(x, height / 2, z);
    enableShadow(pole);
    pole.userData.isObstacle = true;
    pole.userData.type = 'pole';
    pole.userData.radius = radius;
    pole.userData.height = height;
    state.scene.add(pole);
    obstacles.push(pole);
  }

  state.setVrObstacles(obstacles);
  console.log('競技用コースを配置:', obstacles.length, '個');
}

// VR環境を削除
export function removeVREnvironment() {
  state.scene.background = null;

  if (state.gridHelper) {
    state.scene.remove(state.gridHelper);
    state.setGridHelper(null);
  }

  // 床面を削除
  if (state.vrFloor) {
    state.scene.remove(state.vrFloor);
    state.vrFloor.geometry.dispose();
    state.vrFloor.material.dispose();
    state.setVrFloor(null);
  }

  // 影用ライトを削除
  if (state.vrShadowLight) {
    state.scene.remove(state.vrShadowLight.target);
    state.scene.remove(state.vrShadowLight);
    state.setVrShadowLight(null);
  }

  // 障害物を削除
  state.vrObstacles.forEach(obstacle => {
    state.scene.remove(obstacle);
    if (obstacle.geometry) obstacle.geometry.dispose();
    if (obstacle.material) obstacle.material.dispose();
  });
  state.setVrObstacles([]);

  console.log('VR環境を削除しました');
}

// 深度データの処理
export function processDepthInformation(frame, referenceSpace) {
  const pose = frame.getViewerPose(referenceSpace);
  if (!pose) return;

  const glBinding = frame.session.renderState.baseLayer;

  for (const view of pose.views) {
    if (glBinding && glBinding.getDepthInformation) {
      const depthInfo = glBinding.getDepthInformation(view);
      if (depthInfo) {
        const texture = depthInfo.texture;

        if (!state.depthDataTexture) {
          const depthTexture = new THREE.Texture();
          const properties = state.renderer.properties.get(depthTexture);
          properties.__webglTexture = texture;
          properties.__webglInit = true;
          depthTexture.needsUpdate = true;
          state.setDepthDataTexture(depthTexture);
        }

        if (!state.depthDataTexture.userData.logged) {
          console.log('深度データ取得 (GPU):', {
            width: depthInfo.width,
            height: depthInfo.height,
            normDepthBufferFromNormView: depthInfo.normDepthBufferFromNormView
          });
          state.depthDataTexture.userData.logged = true;
        }
      }
    }
  }
}

// 深度メッシュの視覚化を作成
export function createDepthVisualization() {
  if (state.depthMesh) return;

  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.MeshBasicMaterial({
    map: state.depthDataTexture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5
  });

  const depthMesh = new THREE.Mesh(geometry, material);
  depthMesh.position.set(0, 1.5, -2);
  depthMesh.visible = state.showDepthVisualization;
  state.scene.add(depthMesh);
  state.setDepthMesh(depthMesh);
}

// plane-detectionで検出された平面を処理
export function updatePlanes(frame, referenceSpace) {
  if (!frame.detectedPlanes) return;

  // 削除された平面を処理
  state.detectedPlanes.forEach((planeData, xrPlane) => {
    if (!frame.detectedPlanes.has(xrPlane)) {
      state.detectedPlanes.delete(xrPlane);
      // 対応する影メッシュも削除
      if (state.mrPlaneShadowMeshes.has(xrPlane)) {
        const mesh = state.mrPlaneShadowMeshes.get(xrPlane);
        state.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        state.mrPlaneShadowMeshes.delete(xrPlane);
      }
    }
  });

  // 新しい平面または更新された平面を処理
  frame.detectedPlanes.forEach((xrPlane) => {
    const pose = frame.getPose(xrPlane.planeSpace, referenceSpace);
    if (!pose) return;

    const position = new THREE.Vector3().setFromMatrixPosition(
      new THREE.Matrix4().fromArray(pose.transform.matrix)
    );
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().fromArray(pose.transform.matrix)
    );

    const polygon = xrPlane.polygon;

    if (!state.detectedPlanes.has(xrPlane)) {
      state.detectedPlanes.set(xrPlane, {
        position: position,
        quaternion: quaternion,
        polygon: polygon,
        orientation: xrPlane.orientation
      });

      console.log('新しい平面を検出:', xrPlane.orientation);

      // MRモードの場合、水平面には影を受けるメッシュを作成
      if (state.isMrMode && xrPlane.orientation === 'horizontal') {
        createPlaneShadowMesh(xrPlane, position, quaternion, polygon);
      }
    } else {
      const planeData = state.detectedPlanes.get(xrPlane);
      planeData.position = position;
      planeData.quaternion = quaternion;
      planeData.polygon = polygon;

      // 既存の影メッシュを更新
      if (state.mrPlaneShadowMeshes.has(xrPlane)) {
        updatePlaneShadowMesh(xrPlane, position, quaternion, polygon);
      }
    }
  });
}

// 平面用の影を受けるメッシュを作成
function createPlaneShadowMesh(xrPlane, position, quaternion, polygon) {
  if (!polygon || polygon.length < 3) return;

  // ポリゴンの頂点をワールド座標に変換してBufferGeometryを作成
  const vertices = [];
  const indices = [];

  for (let i = 0; i < polygon.length; i++) {
    // ローカル座標（XZ平面上）をVector3に変換
    const localPoint = new THREE.Vector3(polygon[i].x, 0, polygon[i].z);
    // クォータニオンで回転してワールド座標系に変換
    localPoint.applyQuaternion(quaternion);
    // 位置を加算
    localPoint.add(position);
    // わずかに上にオフセット
    localPoint.y += 0.002;
    vertices.push(localPoint.x, localPoint.y, localPoint.z);
  }

  // 三角形分割（ファンで分割）
  for (let i = 1; i < polygon.length - 1; i++) {
    indices.push(0, i, i + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.ShadowMaterial({
    opacity: 0.4
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;

  state.scene.add(mesh);
  state.mrPlaneShadowMeshes.set(xrPlane, mesh);

  console.log('平面影メッシュを作成: y =', position.y.toFixed(3));
}

// 平面用の影メッシュを更新
function updatePlaneShadowMesh(xrPlane, position, quaternion, polygon) {
  const mesh = state.mrPlaneShadowMeshes.get(xrPlane);
  if (!mesh || !polygon || polygon.length < 3) return;

  // ポリゴンの頂点をワールド座標に変換してBufferGeometryを作成
  const vertices = [];
  const indices = [];

  for (let i = 0; i < polygon.length; i++) {
    const localPoint = new THREE.Vector3(polygon[i].x, 0, polygon[i].z);
    localPoint.applyQuaternion(quaternion);
    localPoint.add(position);
    localPoint.y += 0.002;
    vertices.push(localPoint.x, localPoint.y, localPoint.z);
  }

  for (let i = 1; i < polygon.length - 1; i++) {
    indices.push(0, i, i + 1);
  }

  mesh.geometry.dispose();
  const newGeometry = new THREE.BufferGeometry();
  newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  newGeometry.setIndex(indices);
  newGeometry.computeVertexNormals();
  mesh.geometry = newGeometry;
}

// ドローンの初期配置
export function positionDrone() {
  if (!state.xrSession) {
    return;
  }
  if (!state.drone) {
    console.log('positionDrone: state.droneがまだ設定されていない');
    return;
  }
  if (state.dronePositioned) {
    return;
  }

  const frame = state.renderer.xr.getFrame();
  const referenceSpace = state.renderer.xr.getReferenceSpace();

  if (!frame || !referenceSpace) return;

  const cameraPos = new THREE.Vector3();
  state.camera.getWorldPosition(cameraPos);

  const cameraDirection = new THREE.Vector3(0, 0, -1);
  cameraDirection.applyQuaternion(state.camera.quaternion);
  cameraDirection.y = 0;
  cameraDirection.normalize();

  let floorY = null;

  if (state.detectedPlanes && state.detectedPlanes.size > 0) {
    let lowestY = Infinity;
    for (const [xrPlane, planeMesh] of state.detectedPlanes) {
      const planeOrientation = xrPlane.orientation;
      if (planeOrientation === 'horizontal') {
        const planeY = planeMesh.position.y;
        if (planeY < lowestY) {
          lowestY = planeY;
        }
      }
    }
    if (lowestY !== Infinity) {
      floorY = lowestY;
      console.log('検出された床の高さ:', floorY);
    }
  }

  if (floorY === null) {
    floorY = 0.0;
    console.log('床をy=0に設定 (カメラ位置:', cameraPos.y, ')');
  }

  // 右コントローラーの位置を取得してドローンを配置
  let dronePos = null;
  const inputSources = state.xrSession.inputSources;
  for (const source of inputSources) {
    if (source.handedness === 'right' && source.gripSpace) {
      const gripPose = frame.getPose(source.gripSpace, referenceSpace);
      if (gripPose) {
        dronePos = new THREE.Vector3().setFromMatrixPosition(
          new THREE.Matrix4().fromArray(gripPose.transform.matrix)
        );
        console.log('右コントローラーの位置にドローンを配置:', dronePos);
        break;
      }
    }
  }

  // 右コントローラーが見つからない場合は次のフレームまで待つ
  if (!dronePos) {
    console.log('右コントローラー待機中... inputSources:', inputSources.length);
    return; // 配置しない、次のフレームで再試行
  }

  state.drone.position.copy(dronePos);

  const angle = Math.atan2(cameraDirection.x, cameraDirection.z);
  state.drone.rotation.y = angle;

  // ドローンを表示
  state.drone.visible = true;

  state.setDronePositioned(true);
  console.log('ドローン配置位置:', state.drone.position);
  console.log('カメラ位置:', cameraPos);
  console.log('床の高さ:', floorY);
}
