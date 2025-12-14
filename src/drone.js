import * as THREE from 'three';
import * as state from './state.js';
import { setupDroneSound, setupButtonSound, setupWindowSound, setupCursorSound, setupCrashSound, setupTutorialBGM, updateDroneSoundPitch } from './sound.js';
import { updateInfo } from './utils.js';

// 簡易ドローンモデルを作成（ボックスベース）
function createSimpleDrone(index) {
  const drone = new THREE.Group();

  // ボディ（中央の箱）
  const bodyGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.8);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.3,
    metalness: 0.7,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  drone.add(body);

  // アーム4本
  const armGeometry = new THREE.BoxGeometry(0.6, 0.08, 0.08);
  const armMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.4,
    metalness: 0.5,
  });

  const armPositions = [
    { x: 0.35, z: 0.35, rot: Math.PI / 4 },
    { x: -0.35, z: 0.35, rot: -Math.PI / 4 },
    { x: 0.35, z: -0.35, rot: -Math.PI / 4 },
    { x: -0.35, z: -0.35, rot: Math.PI / 4 },
  ];

  armPositions.forEach((pos) => {
    const arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set(pos.x, 0, pos.z);
    arm.rotation.y = pos.rot;
    drone.add(arm);
  });

  // プロペラ4つ（回転用）
  const propGeometry = new THREE.BoxGeometry(0.5, 0.02, 0.06);
  const propColors = [0x00ff00, 0x00ff00, 0xff0000, 0xff0000]; // 前2つ緑、後2つ赤
  const propPositions = [
    { x: 0.5, z: 0.5 },   // 前右
    { x: -0.5, z: 0.5 },  // 前左
    { x: 0.5, z: -0.5 },  // 後右
    { x: -0.5, z: -0.5 }, // 後左
  ];

  const propellers = [];
  propPositions.forEach((pos, i) => {
    const propMaterial = new THREE.MeshStandardMaterial({
      color: propColors[i],
      emissive: propColors[i],
      emissiveIntensity: 0.3,
      roughness: 0.5,
    });
    const prop = new THREE.Mesh(propGeometry, propMaterial);
    prop.position.set(pos.x, 0.12, pos.z);
    prop.name = `pera${i + 1}`;
    drone.add(prop);
    propellers.push(prop);
  });

  // 前方向インジケーター（青く光るボックス）
  const indicatorGeometry = new THREE.BoxGeometry(0.15, 0.06, 0.02);
  const indicatorMaterial = new THREE.MeshStandardMaterial({
    color: 0x0088ff,
    emissive: 0x0088ff,
    emissiveIntensity: 2,
  });
  const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
  indicator.position.set(0, 0.05, 0.45);
  drone.add(indicator);

  // 点滅処理
  let blinkState = 0;
  const blinkPattern = [
    { visible: true, duration: 150 },
    { visible: false, duration: 150 },
    { visible: true, duration: 150 },
    { visible: false, duration: 1000 },
  ];

  function blink() {
    if (!state.isStartingUp && !state.isStartupComplete && state.propellerSpeedMultiplier === 0) {
      indicator.visible = true;
      setTimeout(blink, 100);
      return;
    }
    indicator.visible = blinkPattern[blinkState].visible;
    setTimeout(() => {
      blinkState = (blinkState + 1) % blinkPattern.length;
      blink();
    }, blinkPattern[blinkState].duration);
  }
  blink();

  drone.userData.propellers = propellers;
  return drone;
}

// ドローンのバウンディングボックスを計算して当たり判定の半径を設定
export function calculateDroneBoundingBox() {
  if (!state.drone) return;

  // バウンディングボックスを計算
  const box = new THREE.Box3().setFromObject(state.drone);
  state.setDroneBoundingBox(box);

  // ボックスのサイズを取得
  const size = new THREE.Vector3();
  box.getSize(size);

  // 水平方向の半径（XとZの最大値）
  const horizontal = Math.max(size.x, size.z) / 2;
  // 垂直方向の半径（Yの半分）を10%増し
  const vertical = (size.y / 2) * 1.1;

  state.setDroneCollisionRadius({ horizontal, vertical });

  console.log('ドローンのサイズ:', size);
  console.log('当たり判定 - 水平:', (horizontal * 100).toFixed(1) + 'cm');
  console.log('当たり判定 - 垂直:', (vertical * 100).toFixed(1) + 'cm');
}

// ドローンのスケールを変更
export function updateDroneScale(newScale) {
  if (!state.drone) return;

  // 最小値のみ設定（極端に小さくなりすぎないように）
  if (newScale < 0.01) {
    newScale = 0.01;
  }

  // ドローンのスケールを更新
  state.drone.scale.set(newScale, newScale, newScale);
  state.setCurrentDroneScale(newScale);

  // 当たり判定を再計算
  calculateDroneBoundingBox();

  // 速度と加速度を更新（サイズに応じて）
  updateMaxSpeed();

  // 音のピッチと音量を更新
  updateDroneSoundPitch();

  console.log('ドローンのスケール変更:', newScale.toFixed(2));
}

// 速度レベルとサイズに応じてmaxSpeedと加速度を更新
export function updateMaxSpeed() {
  // speedLevel 1 = 5%, 30 = 400%
  const speedMultiplier = 0.05 + (state.speedLevel - 1) * (4.0 - 0.05) / 29; // 0.05 ~ 4.0

  // サイズに応じた速度倍率（大きいほど速く、小さいほど遅く）
  // スケール0.3で1.0倍、スケール1.0で1.73倍、スケール0.1で0.58倍
  const sizeMultiplier = Math.pow(state.currentDroneScale / 0.3, 0.5);
  // サイズ倍率は0.5〜2.0に制限
  const clampedSizeMultiplier = Math.max(0.5, Math.min(2.0, sizeMultiplier));

  // 最終的な最大速度と加速度
  const newMaxSpeed = state.baseMaxSpeed * speedMultiplier * clampedSizeMultiplier;
  const newAcceleration = state.baseAcceleration * speedMultiplier * clampedSizeMultiplier;
  state.setMaxSpeed(newMaxSpeed);
  state.setAcceleration(newAcceleration);

  // サイズに応じた摩擦係数（大きいほど慣性が大きい）
  const frictionAdjustment = (clampedSizeMultiplier - 1.0) * 0.04;
  let newFriction = state.baseFriction + frictionAdjustment;
  newFriction = Math.max(0.90, Math.min(0.98, newFriction));
  state.setFriction(newFriction);

  let newAngularFriction = state.baseAngularFriction + frictionAdjustment;
  newAngularFriction = Math.max(0.90, Math.min(0.98, newAngularFriction));
  state.setAngularFriction(newAngularFriction);

  // 自動帰還中の場合は、autoReturnSpeedも更新
  if (state.isAutoReturning) {
    state.setAutoReturnSpeed(newMaxSpeed * 1.5);
    console.log(`速度レベル: ${state.speedLevel}, サイズ倍率: ${clampedSizeMultiplier.toFixed(2)}, maxSpeed: ${newMaxSpeed.toFixed(4)}, autoReturnSpeed: ${state.autoReturnSpeed.toFixed(4)}, 摩擦: ${newFriction.toFixed(3)}`);
  } else {
    console.log(`速度レベル: ${state.speedLevel}, サイズ倍率: ${clampedSizeMultiplier.toFixed(2)}, maxSpeed: ${newMaxSpeed.toFixed(4)}, 加速度: ${newAcceleration.toFixed(6)}, 摩擦: ${newFriction.toFixed(3)}`);
  }
}

// ドローンモデルの生成（50機、簡易ボックスモデル）
export function loadDroneModel() {
  const droneCount = 50;
  const droneScale = 0.03; // 1/10サイズ
  const spacing = 0.08; // ドローン間の基本間隔（広め）
  const randomOffset = 0.02; // ランダムオフセット量

  // 50機をランダム配置風に（10x5グリッド）
  const positions = [];
  const basePositions = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 10; col++) {
      basePositions.push({ x: col - 4.5, z: row - 2 });
    }
  }

  for (const base of basePositions) {
    const randX = (Math.random() - 0.5) * randomOffset;
    const randZ = (Math.random() - 0.5) * randomOffset;
    positions.push({
      x: base.x * spacing + randX,
      z: base.z * spacing + randZ
    });
  }

  // === Aボタン用フォーメーション（K → MU → I → (^_^)）===

  // K字配置の位置（50機用）
  const kPositions = [];
  // 縦線（18機）
  for (let i = 0; i < 18; i++) {
    kPositions.push({ x: -0.12, y: 0.17 - i * 0.02, z: 0 });
  }
  // 上の斜め線（16機）
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    kPositions.push({ x: -0.10 + t * 0.22, y: 0.02 + t * 0.15, z: 0 });
  }
  // 下の斜め線（16機）
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    kPositions.push({ x: -0.10 + t * 0.22, y: -0.02 - t * 0.15, z: 0 });
  }

  // 各機体の個性
  const dronePersonalities = [];
  for (let i = 0; i < droneCount; i++) {
    dronePersonalities.push({
      inertia: 0.5 + Math.random(), // 慣性の強さ 0.5〜1.5
      reactionDelay: Math.random() * 0.5, // 反応遅延 0〜0.5秒
    });
  }

  // 親グループを作成
  const droneGroup = new THREE.Group();
  droneGroup.position.set(0, 0, -2);
  state.scene.add(droneGroup);
  state.setDrone(droneGroup);

  const propellersList = [];
  const droneChildrenList = [];
  const originalPositionsList = [];

  // 10機の簡易ドローンを生成
  positions.forEach((pos, index) => {
    const drone = createSimpleDrone(index);
    drone.scale.set(droneScale, droneScale, droneScale);
    drone.position.set(pos.x, 0, pos.z);
    drone.userData.index = index;
    drone.userData.inertia = dronePersonalities[index].inertia;
    drone.userData.reactionDelay = dronePersonalities[index].reactionDelay;
    drone.userData.velocity = { x: 0, y: 0, z: 0 };
    drone.userData.moveStartTime = 0; // 移動開始時刻

    droneGroup.add(drone);
    droneChildrenList[index] = drone;
    originalPositionsList[index] = { x: pos.x, y: 0, z: pos.z };

    // プロペラを収集
    drone.userData.propellers.forEach((prop) => {
      propellersList.push(prop);
    });
  });

  // 状態を設定
  state.setPropellers(propellersList);
  state.setCurrentDroneScale(droneScale);
  state.setDroneChildren(droneChildrenList);
  state.setDroneOriginalPositions(originalPositionsList);
  // Aボタン用（K）
  state.setDroneKPositions(kPositions);

  console.log('全ドローン生成完了（簡易モデル）');
  console.log('プロペラ数:', propellersList.length);

  // ドローンのバウンディングボックスを計算
  calculateDroneBoundingBox();

  // 初期速度を設定
  updateMaxSpeed();

  // ドローン音声の設定
  setupDroneSound();
  setupButtonSound();
  setupWindowSound();
  setupCursorSound();
  setupCrashSound();
  setupTutorialBGM();

  // 配置されるまで非表示
  droneGroup.visible = false;

  updateInfo('ドローン準備完了');
}
