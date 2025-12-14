import * as THREE from 'three';
import * as state from './state.js';
import { updateInfo } from './utils.js';
import { loadDroneModel, updateMaxSpeed } from './drone.js';
import { updateDroneSoundPitch } from './sound.js';
import {
  updateAutoReturnText, updateSpeedText,
  updateSequenceStatusText,
  removeSequenceStatusText,
  loadSettingsFromStorage
} from './ui.js';
import { updatePreStartupPhysics, updateHoverAnimation, updateReturnToHover } from './physics.js';
import { processDepthInformation, createDepthVisualization, positionDrone } from './vr.js';
import {
  updateAutoReturn, handleSpeedChange, handleRightControllerButtons,
  handleStartupSequence, handleSizeChange, handleControllerGrab, handleHandGrab,
  handleLeftControllerButtons, updateReturningDrone
} from './controls.js';

// シーンの初期化
function init() {
  // シーン作成
  const scene = new THREE.Scene();
  state.setScene(scene);

  // カメラ作成
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  state.setCamera(camera);

  // オーディオリスナー作成
  const audioListener = new THREE.AudioListener();
  camera.add(audioListener);
  state.setAudioListener(audioListener);

  // レンダラー作成
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  state.setRenderer(renderer);

  const appDiv = document.getElementById('app');
  appDiv.appendChild(renderer.domElement);

  // ライト設定
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // ドローンモデルの読み込みはXRセッション開始時に行う（リソース節約のため）

  // ウィンドウリサイズ対応
  window.addEventListener('resize', onWindowResize);

  // localStorageから設定を読み込み
  loadSettingsFromStorage();

  // アニメーションループ
  renderer.setAnimationLoop(render);
}

// メインレンダーループ
function render() {
  // UI更新
  updateAutoReturnText();
  updateSpeedText();
  updateSequenceStatusText();

  // XRセッション中の処理
  if (state.xrSession) {
    // 深度テクスチャ未取得時のみ処理（1回だけ）
    if (!state.depthDataTexture) {
      const frame = state.renderer.xr.getFrame();
      const referenceSpace = state.renderer.xr.getReferenceSpace();
      if (frame && referenceSpace) {
        processDepthInformation(frame, referenceSpace);
      }
    }

    // 深度視覚化メッシュの作成と更新
    if (state.depthDataTexture && !state.depthMesh) {
      createDepthVisualization();
    }
    if (state.depthMesh) {
      state.depthMesh.visible = state.showDepthVisualization;
    }
  }

  // ドローン配置
  positionDrone();

  // プロペラ回転
  state.propellers.forEach((propeller) => {
    if (state.isStartupComplete && !state.isShuttingDown) {
      propeller.rotation.y += state.propellerRotationSpeed;
    } else {
      propeller.rotation.y += state.propellerRotationSpeed * state.propellerSpeedMultiplier;
    }
  });

  // 物理演算とアニメーション
  updateReturnToHover();
  updateReturningDrone();
  updateLiftSequence();
  updatePreStartupPhysics();
  updateHoverAnimation();
  updateFormationAnimation();    // Aボタン用（K → MU → I → (^_^)）
  updateFormationAnimationX();   // Xボタン用（猫 → メビウス → 泣き顔 → 波）
  logFormationState();

  // コントローラー入力処理
  handleSizeChange();
  handleControllerGrab();
  updateAutoReturn();
  handleSpeedChange();
  handleRightControllerButtons();
  handleLeftControllerButtons();
  handleStartupSequence();
  updateDecelerationSequence();
  updateGamepadMovement();
  handleHandGrab();

  // ドローンの速度を計算して音のピッチを更新
  if (state.drone && state.dronePositioned) {
    const currentPos = state.drone.position.clone();

    if (state.previousDronePosition.length() > 0) {
      const displacement = currentPos.distanceTo(state.previousDronePosition);
      state.setDroneVelocity(displacement / 0.016);
      updateDroneSoundPitch();
    }

    state.previousDronePosition.copy(currentPos);
  }

  // 次フレームの速度計算のために現在位置を保存
  if (state.drone) {
    state.dronePreviousPosition.copy(state.drone.position);
  }

  state.renderer.render(state.scene, state.camera);
}

// FPVカメラの更新
function updateFpvCamera() {
  if (!state.xrSession || !state.drone || !state.dronePositioned) return;

  // ベース参照空間を保存（初回のみ）
  if (!state.baseReferenceSpace) {
    const referenceSpace = state.renderer.xr.getReferenceSpace();
    if (referenceSpace) {
      state.setBaseReferenceSpace(referenceSpace);
    }
  }

  if (!state.baseReferenceSpace) return;

  // FPVモードの状態変化を検出
  if (state.isFpvMode && !state.wasFpvMode) {
    // FPVモードがオンになった瞬間
    // まずベース参照空間に戻す
    state.renderer.xr.setReferenceSpace(state.baseReferenceSpace);

    // カメラの高さを保存
    const cameraPos = new THREE.Vector3();
    state.camera.getWorldPosition(cameraPos);
    state.setFpvInitialCameraPos(cameraPos.clone());

    // ドローン位置を保存（basePositionを使用）
    const initialDronePos = state.drone.userData.basePosition
      ? state.drone.userData.basePosition.clone()
      : state.drone.position.clone();
    state.setFpvInitialDronePos(initialDronePos);

    state.setFpvInitialDroneRotationY(state.drone.rotation.y);
    state.setWasFpvMode(true);
    console.log('FPVモード開始');
    console.log('  カメラ高さ:', cameraPos.y.toFixed(3));
    console.log('  ドローンbasePosition:', initialDronePos.x.toFixed(3), initialDronePos.y.toFixed(3), initialDronePos.z.toFixed(3));
  } else if (!state.isFpvMode && state.wasFpvMode) {
    // FPVモードがオフになった瞬間
    state.setWasFpvMode(false);
    state.setFpvInitialCameraPos(null);
    state.setFpvInitialDronePos(null);
    state.setFpvInitialDroneRotationY(0);
    // ベース参照空間に戻す
    state.renderer.xr.setReferenceSpace(state.baseReferenceSpace);
    console.log('FPVモード終了 - 元の位置に戻る');
    return;
  }

  if (state.isFpvMode && state.fpvInitialDronePos && state.fpvInitialCameraPos) {
    // FPVモード: カメラをドローンの位置に完全に同期
    // basePositionを使用（ホバーアニメーションの影響を除外）
    const dronePos = state.drone.userData.basePosition
      ? state.drone.userData.basePosition.clone()
      : state.drone.position.clone();

    // ドローンの現在のY軸回転
    const droneRotationY = state.drone.rotation.y;

    // カメラの回転角度（ドローンの前方を向く = ドローンの回転 + 180度）
    const cameraRotationY = droneRotationY + Math.PI;

    // ドローンの位置をオフセットとして使用
    // Y軸は初期カメラ高さとドローン高さの差分を補正
    const totalOffset = new THREE.Vector3(
      dronePos.x,
      dronePos.y - state.fpvInitialCameraPos.y,
      dronePos.z
    );

    // 回転後の座標系でのオフセットを計算
    const rotQuat = new THREE.Quaternion();
    rotQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotationY);

    // ワールド座標の移動ベクトルを回転後座標系に変換
    const rotatedOffset = totalOffset.clone().applyQuaternion(rotQuat.clone().invert());

    // XRRigidTransformを作成
    const offsetTransform = new XRRigidTransform(
      { x: -rotatedOffset.x, y: -rotatedOffset.y, z: -rotatedOffset.z },
      { x: 0, y: Math.sin(-cameraRotationY / 2), z: 0, w: Math.cos(-cameraRotationY / 2) }
    );

    // 新しい参照空間を設定（baseReferenceSpaceからの相対オフセット）
    const newReferenceSpace = state.baseReferenceSpace.getOffsetReferenceSpace(offsetTransform);
    state.renderer.xr.setReferenceSpace(newReferenceSpace);
  }
}

// 上昇シーケンスの処理
function updateLiftSequence() {
  if (state.liftStartTime === null || !state.drone || !state.dronePositioned) return;

  // 初回のみ右コントローラーの位置を取得
  if (state.liftStartPos === null && state.xrSession) {
    const frame = state.renderer.xr.getFrame();
    const referenceSpace = state.renderer.xr.getReferenceSpace();

    if (frame && referenceSpace) {
      for (const src of state.xrSession.inputSources) {
        if (src.handedness === 'right' && src.gripSpace) {
          const gripPose = frame.getPose(src.gripSpace, referenceSpace);
          if (gripPose) {
            const targetPos = new THREE.Vector3().setFromMatrixPosition(
              new THREE.Matrix4().fromArray(gripPose.transform.matrix)
            );

            state.setLiftStartPos(state.drone.position.clone());
            if (state.drone.position.y >= targetPos.y) {
              state.setLiftTargetHeight(state.drone.position.y + 0.1);
              console.log('上昇開始 - 現在位置:', state.liftStartPos.y.toFixed(3), '目標高さ:', state.liftTargetHeight.toFixed(3), '(コントローラーより高いため10cm上昇)');
            } else {
              state.setLiftTargetHeight(targetPos.y);
              console.log('上昇開始 - 現在位置:', state.liftStartPos.y.toFixed(3), '目標高さ:', state.liftTargetHeight.toFixed(3), '(コントローラーの高さまで)');
            }
            break;
          }
        }
      }

      if (state.liftStartPos === null) {
        console.log('右コントローラーが見つからないため上昇を中止');
        state.setLiftStartTime(null);
      }
    }
  }
}

// 減速シーケンスの処理
function updateDecelerationSequence() {
  if (state.decelerationStartTime === null || !state.drone || !state.dronePositioned) return;

  const elapsed = Date.now() - state.decelerationStartTime;
  const decelerationDuration = 2000;
  const progress = Math.min(elapsed / decelerationDuration, 1.0);

  state.setPropellerSpeedMultiplier(1.0 - progress);
  console.log('減速中 - progress:', progress.toFixed(2), 'propellerSpeed:', state.propellerSpeedMultiplier.toFixed(2));

  if (state.droneSound && state.droneSound.isPlaying) {
    const normalPitch = Math.pow(0.3 / state.currentDroneScale, 0.5);
    const clampedNormalPitch = Math.max(0.2, Math.min(2.7, normalPitch));
    const endPitch = Math.max(clampedNormalPitch / 2.0, 0.2);

    const currentPitch = clampedNormalPitch - (clampedNormalPitch - endPitch) * progress;
    state.droneSound.setPlaybackRate(currentPitch);

    if (!state.isSoundMuted) {
      state.droneSound.setVolume(0.7 * (1.0 - progress));
    }
  }

  if (progress >= 1.0) {
    state.setDecelerationStartTime(null);
    state.setLandingHeight(null);
    state.setIsShuttingDown(false);
    state.setPropellerSpeedMultiplier(0);
    state.setHasLanded(true);

    if (state.droneSound && state.droneSound.isPlaying) {
      state.droneSound.stop();
    }

    console.log('終了シーケンス完了');
    updateInfo('ドローン停止 - Xボタンで再起動');
    removeSequenceStatusText();
  }
}

// Aボタン用フォーメーション（K → MU → I → (^_^)）の位置配列を取得
function getTargetPositionsA() {
  switch (state.formationIndex) {
    case 1: return state.droneKPositions;
    case 2: return state.droneMUPositions;
    case 3: return state.droneIPositions;
    case 4: return state.droneSmilePositions;
    default: return state.droneOriginalPositions;
  }
}

// Xボタン用フォーメーション（猫 → メビウス → 泣き顔 → 波）の位置配列を取得
function getTargetPositionsX() {
  switch (state.formationIndexX) {
    case 1: return state.droneCatPositions;
    case 2: return state.droneMobiusPositions;
    case 3: return state.droneCryingPositions;
    case 4: return state.droneWavePositions;
    default: return state.droneOriginalPositions;
  }
}

// アニメーション付きフォーメーションの位置を計算（Xボタン用）
function getAnimatedPositionX(basePos, index, animTime) {
  const pos = { x: basePos.x, y: basePos.y || 0, z: basePos.z || 0 };

  // 猫の尻尾振りアニメーション
  if (basePos.isTail && state.formationIndexX === 1) {
    const tailWave = Math.sin(animTime * 3 + basePos.tailIndex * 0.3) * 0.03;
    pos.x = basePos.x + tailWave * (basePos.tailIndex / 7);
    pos.y = basePos.y + Math.sin(animTime * 2 + basePos.tailIndex * 0.5) * 0.01;
  }

  // 八の字（メビウス）の循環アニメーション
  if (basePos.mobiusT !== undefined && state.formationIndexX === 2) {
    const t = basePos.mobiusT + animTime * 0.8; // 循環速度
    const a = 0.20;
    const denom = 1 + Math.sin(t) * Math.sin(t);
    pos.x = a * Math.cos(t) / denom;
    pos.y = a * Math.sin(t) * Math.cos(t) / denom;
    pos.z = 0;
  }

  // 泣き顔の涙アニメーション
  if (basePos.isTear && state.formationIndexX === 3) {
    const tearOffset = (animTime * 0.8 + basePos.tearIndex * 0.2) % 1.0;
    const baseY = 0.02;
    const tearLength = 0.16;
    pos.y = baseY - tearOffset * tearLength;
    pos.tearAlpha = 1.0 - tearOffset;
  }

  // 動く波のアニメーション
  if (basePos.wavePhase !== undefined && state.formationIndexX === 4) {
    const phase = basePos.wavePhase + animTime * 2;
    pos.y = Math.sin(phase) * 0.12;
  }

  return pos;
}

// Aボタン用フォーメーションアニメーション処理（K → MU → I → (^_^)）
// パフォーマンス最適化: 定数の事前計算
const ARRIVAL_THRESHOLD_SQ = 0.012 * 0.012; // 二乗で比較してsqrt省略
const CLOSE_THRESHOLD_SQ = 0.04 * 0.04;
const MIN_DISTANCE_SQ = 0.001 * 0.001;

function updateFormationAnimation() {
  if (!state.formationAnimating || state.droneChildren.length === 0) return;

  const targetPositions = getTargetPositionsA();
  let allReached = true;
  const now = Date.now();

  // フォーメーション開始時刻を記録
  if (!state.formationStartTime) {
    state.setFormationStartTime(now);
    const formationNames = ['Normal', 'K', 'MU', 'I', '(^_^)'];
    console.log('Aボタン フォーメーション開始 -', formationNames[state.formationIndex]);
  }

  // 基本物理パラメータ（慣性を重視）
  const baseAcceleration = 0.0012;
  const baseMaxSpeed = 0.010;
  const baseMaxSpeedSq = baseMaxSpeed * baseMaxSpeed;
  const baseFriction = 0.94;

  // タイムアウト: 開始から8秒経過したら強制完了
  const elapsed = now - state.formationStartTime;
  const timeout = 8000;

  // 共通の時間計算（ループ外で1回だけ）
  const wobbleTimeBase = now * 0.001;
  const wobbleTimeSlow = now * 0.003;
  const isSmileFormation = state.formationIndex === 4;

  state.droneChildren.forEach((drone, index) => {
    if (!drone || !targetPositions[index]) return;

    const target = targetPositions[index];
    const current = drone.position;
    const targetY = target.y || 0;
    const targetZ = target.z || 0;

    // 個体パラメータ初期化
    if (!drone.userData.flightParams) {
      drone.userData.flightParams = {
        speedMultiplier: 0.8 + Math.random() * 0.4,
        accelMultiplier: 0.8 + Math.random() * 0.4,
        wobbleFreq: 2 + Math.random() * 2,
        wobbleAmp: 0.0008 + Math.random() * 0.001,
        wobblePhase: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 0.0001,
        driftZ: (Math.random() - 0.5) * 0.0001,
        hasArrived: false,
      };
    }
    const params = drone.userData.flightParams;

    const vel = drone.userData.velocity || { x: 0, y: 0, z: 0 };
    const inertia = drone.userData.inertia || 1.0;
    const reactionDelay = (drone.userData.reactionDelay || 0) * 1000;

    // タイムラグ
    if (elapsed < reactionDelay) {
      allReached = false;
      current.y += Math.sin(wobbleTimeSlow * params.wobbleFreq + params.wobblePhase) * params.wobbleAmp * 0.3;
      return;
    }

    // タイムアウト: 強制的に到着扱い
    if (elapsed > timeout && !params.hasArrived) {
      params.hasArrived = true;
      drone.userData.velocity = { x: 0, y: 0, z: 0 };
      current.x = target.x;
      current.y = targetY;
      current.z = targetZ;
      return;
    }

    // 既に到着済みの場合はホバリングのみ
    if (params.hasArrived) {
      const wobblePhase = wobbleTimeBase * params.wobbleFreq + params.wobblePhase;
      current.x = target.x + Math.sin(wobblePhase) * params.wobbleAmp;
      current.y = targetY + Math.sin(wobblePhase * 1.3 + 1) * params.wobbleAmp * 0.5;
      current.z = targetZ + Math.cos(wobblePhase * 0.8) * params.wobbleAmp;
      drone.rotation.x = isSmileFormation ? -Math.PI / 2 : 0;
      return;
    }

    // 目標への差分
    const dx = target.x - current.x;
    const dy = targetY - current.y;
    const dz = targetZ - current.z;
    const distanceSq = dx * dx + dy * dy + dz * dz;

    // 到着判定（二乗で比較してsqrt省略）
    if (distanceSq < ARRIVAL_THRESHOLD_SQ) {
      params.hasArrived = true;
      drone.userData.velocity = { x: 0, y: 0, z: 0 };
      current.x = target.x;
      current.y = targetY;
      current.z = targetZ;
      drone.rotation.x = isSmileFormation ? -Math.PI / 2 : 0;
    } else {
      allReached = false;

      // 慣性を考慮した加速度
      const accel = baseAcceleration * params.accelMultiplier / inertia;

      // 目標方向への加速（sqrtは必要な時だけ）
      if (distanceSq > MIN_DISTANCE_SQ) {
        const invDistance = 1 / Math.sqrt(distanceSq);
        vel.x += dx * invDistance * accel;
        vel.y += dy * invDistance * accel;
        vel.z += dz * invDistance * accel;
      }

      // ドリフトと揺れ
      vel.x += params.driftX;
      vel.z += params.driftZ;
      vel.y += Math.sin(wobbleTimeBase * params.wobbleFreq + params.wobblePhase) * params.wobbleAmp * 0.2;

      // 速度制限（二乗で比較）
      const maxSpeedSq = baseMaxSpeedSq * params.speedMultiplier * params.speedMultiplier * (0.9 + inertia * 0.2) * (0.9 + inertia * 0.2);
      const speedSq = vel.x * vel.x + vel.y * vel.y + vel.z * vel.z;
      if (speedSq > maxSpeedSq) {
        const scale = Math.sqrt(maxSpeedSq / speedSq);
        vel.x *= scale;
        vel.y *= scale;
        vel.z *= scale;
      }

      // 摩擦
      let friction = baseFriction + (inertia - 1.0) * 0.02;
      if (distanceSq < CLOSE_THRESHOLD_SQ) {
        friction = Math.max(0.88, friction - 0.04);
      }
      friction = Math.max(0.88, Math.min(0.96, friction));

      vel.x *= friction;
      vel.y *= friction;
      vel.z *= friction;

      current.x += vel.x;
      current.y += vel.y;
      current.z += vel.z;

      drone.userData.velocity = vel;
    }
  });

  if (allReached) {
    state.setFormationAnimating(false);
    state.setFormationStartTime(null);
    const formationNames = ['Normal', 'K', 'MU', 'I', '(^_^)'];
    console.log('Aボタン フォーメーションアニメーション完了 -', formationNames[state.formationIndex]);
  }
}

// デバッグ用：フォーメーション状態を定期的にログ
let lastFormationLogTime = 0;
function logFormationState() {
  const isAnimating = state.formationAnimating || state.formationAnimatingX;
  if (!isAnimating) return;
  const now = Date.now();
  if (now - lastFormationLogTime > 2000) {
    lastFormationLogTime = now;
    const targetPositions = state.formationAnimating ? getTargetPositionsA() : getTargetPositionsX();
    let notReachedCount = 0;
    const totalCount = state.droneChildren.length;
    state.droneChildren.forEach((drone, index) => {
      if (!drone || !targetPositions[index]) return;
      const params = drone.userData.flightParams;
      if (params && !params.hasArrived) notReachedCount++;
    });
    if (notReachedCount > 0) {
      const formationNamesA = ['Normal', 'K', 'MU', 'I', '(^_^)'];
      const formationNamesX = ['Normal', 'Cat🐱', '∞Mobius', 'Crying;_;', 'Wave〜'];
      const name = state.formationAnimating ? formationNamesA[state.formationIndex] : formationNamesX[state.formationIndexX];
      console.log('フォーメーション進行中 (' + name + ') - 未到着:', notReachedCount, '/', totalCount);
    }
  }
}

// Xボタン用フォーメーションアニメーション処理（猫 → メビウス → 泣き顔 → 波）
function updateFormationAnimationX() {
  if (!state.formationAnimatingX || state.droneChildren.length === 0) return;

  const targetPositions = getTargetPositionsX();
  let allReached = true;
  const now = Date.now();

  // フォーメーション開始時刻を記録
  if (!state.formationStartTimeX) {
    state.setFormationStartTimeX(now);
    const formationNames = ['Normal', 'Cat🐱', '∞Mobius', 'Crying;_;', 'Wave〜'];
    console.log('Xボタン フォーメーション開始 -', formationNames[state.formationIndexX]);
  }

  // アニメーション時間を更新
  const animTime = (now - state.formationStartTimeX) / 1000;

  // 基本物理パラメータ
  const baseAcceleration = 0.0012;
  const baseMaxSpeed = 0.010;
  const baseMaxSpeedSq = baseMaxSpeed * baseMaxSpeed;
  const baseFriction = 0.94;

  // タイムアウト: 8秒
  const elapsed = now - state.formationStartTimeX;
  const timeout = 8000;

  // 共通の時間計算（ループ外で1回だけ）
  const wobbleTimeBase = now * 0.001;
  const wobbleTimeSlow = now * 0.003;
  const isVerticalFormation = state.formationIndexX === 1 || state.formationIndexX === 3;
  const targetRotX = isVerticalFormation ? -Math.PI / 2 : 0;

  state.droneChildren.forEach((drone, index) => {
    if (!drone || !targetPositions[index]) return;

    const target = targetPositions[index];
    const current = drone.position;
    const targetY = target.y || 0;
    const targetZ = target.z || 0;

    // 個体パラメータ初期化
    if (!drone.userData.flightParams) {
      drone.userData.flightParams = {
        speedMultiplier: 0.8 + Math.random() * 0.4,
        accelMultiplier: 0.8 + Math.random() * 0.4,
        wobbleFreq: 2 + Math.random() * 2,
        wobbleAmp: 0.0008 + Math.random() * 0.001,
        wobblePhase: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 0.0001,
        driftZ: (Math.random() - 0.5) * 0.0001,
        hasArrived: false,
      };
    }
    const params = drone.userData.flightParams;

    const vel = drone.userData.velocity || { x: 0, y: 0, z: 0 };
    const inertia = drone.userData.inertia || 1.0;
    const reactionDelay = (drone.userData.reactionDelay || 0) * 1000;

    // タイムラグ
    if (elapsed < reactionDelay) {
      allReached = false;
      current.y += Math.sin(wobbleTimeSlow * params.wobbleFreq + params.wobblePhase) * params.wobbleAmp * 0.3;
      return;
    }

    // タイムアウト: 強制到着
    if (elapsed > timeout && !params.hasArrived) {
      params.hasArrived = true;
      drone.userData.velocity = { x: 0, y: 0, z: 0 };
      const animatedTarget = getAnimatedPositionX(target, index, animTime);
      current.x = animatedTarget.x;
      current.y = animatedTarget.y;
      current.z = animatedTarget.z;
      return;
    }

    // 到着済みの場合はアニメーション付きホバリング
    if (params.hasArrived) {
      const animatedTarget = getAnimatedPositionX(target, index, animTime);
      const wobblePhase = wobbleTimeBase * params.wobbleFreq + params.wobblePhase;
      current.x = animatedTarget.x + Math.sin(wobblePhase) * params.wobbleAmp;
      current.y = animatedTarget.y + Math.sin(wobblePhase * 1.3 + 1) * params.wobbleAmp * 0.5;
      current.z = animatedTarget.z + Math.cos(wobblePhase * 0.8) * params.wobbleAmp;
      drone.rotation.x = targetRotX;
      return;
    }

    // 目標への差分
    const dx = target.x - current.x;
    const dy = targetY - current.y;
    const dz = targetZ - current.z;
    const distanceSq = dx * dx + dy * dy + dz * dz;

    // 到着判定（二乗で比較）
    if (distanceSq < ARRIVAL_THRESHOLD_SQ) {
      params.hasArrived = true;
      drone.userData.velocity = { x: 0, y: 0, z: 0 };
      const animatedTarget = getAnimatedPositionX(target, index, animTime);
      current.x = animatedTarget.x;
      current.y = animatedTarget.y;
      current.z = animatedTarget.z;
      drone.rotation.x = targetRotX;
    } else {
      allReached = false;

      const accel = baseAcceleration * params.accelMultiplier / inertia;

      if (distanceSq > MIN_DISTANCE_SQ) {
        const invDistance = 1 / Math.sqrt(distanceSq);
        vel.x += dx * invDistance * accel;
        vel.y += dy * invDistance * accel;
        vel.z += dz * invDistance * accel;
      }

      vel.x += params.driftX;
      vel.z += params.driftZ;
      vel.y += Math.sin(wobbleTimeBase * params.wobbleFreq + params.wobblePhase) * params.wobbleAmp * 0.2;

      // 速度制限（二乗で比較）
      const maxSpeedSq = baseMaxSpeedSq * params.speedMultiplier * params.speedMultiplier * (0.9 + inertia * 0.2) * (0.9 + inertia * 0.2);
      const speedSq = vel.x * vel.x + vel.y * vel.y + vel.z * vel.z;
      if (speedSq > maxSpeedSq) {
        const scale = Math.sqrt(maxSpeedSq / speedSq);
        vel.x *= scale;
        vel.y *= scale;
        vel.z *= scale;
      }

      let friction = baseFriction + (inertia - 1.0) * 0.02;
      if (distanceSq < CLOSE_THRESHOLD_SQ) {
        friction = Math.max(0.88, friction - 0.04);
      }
      friction = Math.max(0.88, Math.min(0.96, friction));

      vel.x *= friction;
      vel.y *= friction;
      vel.z *= friction;

      current.x += vel.x;
      current.y += vel.y;
      current.z += vel.z;

      // 移動中も徐々に回転
      drone.rotation.x += (targetRotX - drone.rotation.x) * 0.05;

      drone.userData.velocity = vel;
    }
  });

  // Xボタンフォーメーションはアニメーションが継続するため、formationAnimatingXをtrueのまま維持
  // ただし、Normalに戻った場合は完了とする
  if (allReached && state.formationIndexX === 0) {
    state.setFormationAnimatingX(false);
    state.setFormationStartTimeX(null);
    console.log('Xボタン フォーメーションアニメーション完了 - Normal');
  }
}

// ゲームパッド移動処理
function updateGamepadMovement() {
  if (!state.xrSession || !state.drone || !state.dronePositioned) return;
  if (!state.isStartupComplete && state.liftStartTime === null && state.descentStartTime === null) return;
  if (state.isGrabbedByController || state.isGrabbedByHand || state.isReturningToHover || state.isAutoReturning || state.bothGripsPressed) return;

  const inputSources = state.xrSession.inputSources;
  let inputX = 0, inputY = 0, inputZ = 0;
  let inputRotation = 0;
  let rawInputX = 0, rawInputZ = 0;

  // 上昇中は自動的に上昇入力をシミュレート
  if (state.liftStartTime !== null && state.liftStartPos !== null && state.liftTargetHeight !== null) {
    const currentY = state.drone.userData.basePosition ? state.drone.userData.basePosition.y : state.drone.position.y;

    // スタック検出
    let isStuck = false;
    if (state.isCollisionEnabled) {
      if (state.liftLastY === null) {
        state.setLiftLastY(currentY);
        state.setLiftStuckStartTime(Date.now());
      } else {
        const yDiff = Math.abs(currentY - state.liftLastY);
        if (yDiff < 0.005) {
          const stuckDuration = Date.now() - state.liftStuckStartTime;
          if (stuckDuration > 500) {
            isStuck = true;
            console.log('上昇中にスタック検出 - 0.5秒間動いていない');
          }
        } else {
          state.setLiftLastY(currentY);
          state.setLiftStuckStartTime(Date.now());
        }
      }
    }

    if (isStuck) {
      state.setLiftStartTime(null);
      state.setLiftStartPos(null);
      state.setLiftTargetHeight(null);
      state.setLiftLastY(null);
      state.setLiftStuckStartTime(null);
      state.setIsStartupComplete(true);
      state.setIsStartingUp(false);
      state.setPropellerSpeedMultiplier(1.0);

      if (state.drone.userData.basePosition) {
        state.drone.userData.basePosition = state.drone.position.clone();
      }
      state.setHoverTime(0);

      console.log('上昇中に衝突検出 - その場で起動完了');
      updateInfo('Collision Detected - Ready');
      removeSequenceStatusText();
    } else {
      const yDiff = state.liftTargetHeight - currentY;

      if (Math.abs(yDiff) > 0.02) {
        inputY = Math.min(Math.max(yDiff * 2.0, 0.3), 1.0);
      } else {
        state.setLiftStartTime(null);
        state.setLiftStartPos(null);
        state.setLiftTargetHeight(null);
        state.setLiftLastY(null);
        state.setLiftStuckStartTime(null);
        state.setIsStartupComplete(true);
        state.setIsStartingUp(false);
        state.setPropellerSpeedMultiplier(1.0);

        if (state.drone.userData.basePosition) {
          state.drone.userData.basePosition = state.drone.position.clone();
        }
        state.setHoverTime(0);

        console.log('起動シーケンス完了 - 最終高さ:', state.drone.position.y);
        updateInfo('Drone Ready');
        removeSequenceStatusText();
      }
    }
  }

  // 降下中は自動的に下降入力をシミュレート
  if (state.descentStartTime !== null && state.decelerationStartTime === null) {
    const floorHeight = 0;
    const currentY = state.drone.userData.basePosition ? state.drone.userData.basePosition.y : state.drone.position.y;

    // スタック検出
    let isStuck = false;
    if (state.isCollisionEnabled) {
      if (state.descentLastY === null) {
        state.setDescentLastY(currentY);
        state.setDescentStuckStartTime(Date.now());
      } else {
        const yDiff = Math.abs(currentY - state.descentLastY);
        if (yDiff < 0.005) {
          const stuckDuration = Date.now() - state.descentStuckStartTime;
          if (stuckDuration > 500) {
            isStuck = true;
            console.log('降下中にスタック検出 - 0.5秒間動いていない');
          }
        } else {
          state.setDescentLastY(currentY);
          state.setDescentStuckStartTime(Date.now());
        }
      }
    }

    if (isStuck) {
      state.setDescentStartTime(null);
      state.setDescentLastY(null);
      state.setDescentStuckStartTime(null);
      state.setDecelerationStartTime(Date.now());
      state.setLandingHeight(currentY);

      if (state.drone.userData.basePosition) {
        state.drone.userData.basePosition.copy(state.drone.position);
      }
      state.velocity.set(0, 0, 0);

      console.log('降下中に衝突検出 - その高さで減速シーケンス開始, 着地高さ:', state.landingHeight.toFixed(3));
      updateInfo('Collision Detected - Landing...');
    } else {
      const yDiff = currentY - floorHeight;

      state.setPropellerSpeedMultiplier(1.0);

      if (yDiff > 0.02) {
        inputY = -Math.min(Math.max(yDiff * 2.0, 0.3), 1.0);
      } else {
        state.setDescentStartTime(null);
        state.setDescentLastY(null);
        state.setDescentStuckStartTime(null);
        state.setDecelerationStartTime(Date.now());
        state.setLandingHeight(floorHeight);
        console.log('着地完了 - プロペラ減速開始');
        updateInfo('Landing...');
      }
    }
  }

  // スティック入力取得
  const deadzone = state.stickDeadzone;
  for (const source of inputSources) {
    if (source.gamepad) {
      const gp = source.gamepad;
      const axes = gp.axes;

      if (state.liftStartTime === null && state.descentStartTime === null && state.decelerationStartTime === null) {
        if (source.handedness === 'right' && axes.length >= 4) {
          if (Math.abs(axes[2]) > deadzone) {
            inputX = axes[2];
            rawInputX = axes[2];
          }
          if (Math.abs(axes[3]) > deadzone) {
            inputY = -axes[3];
          }
        }

        if (source.handedness === 'left' && axes.length >= 4) {
          if (Math.abs(axes[2]) > deadzone) {
            inputRotation = -axes[2];
          }
          if (Math.abs(axes[3]) > deadzone) {
            inputZ = axes[3];
            rawInputZ = axes[3];
          }
        }
      }
    }
  }

  // 上昇・下降（絶対座標）
  state.velocity.y += inputY * state.acceleration;

  // Y軸周りの回転のみを適用
  const yRotationOnly = new THREE.Quaternion();
  yRotationOnly.setFromAxisAngle(new THREE.Vector3(0, 1, 0), state.drone.rotation.y);

  // 前後移動
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(yRotationOnly);
  forward.y = 0;
  forward.normalize();
  forward.multiplyScalar(inputZ * state.acceleration);
  state.velocity.add(forward);

  // 左右移動
  const right = new THREE.Vector3(-1, 0, 0);
  right.applyQuaternion(yRotationOnly);
  right.y = 0;
  right.normalize();
  right.multiplyScalar(inputX * state.acceleration);
  state.velocity.add(right);

  // 速度制限
  if (state.velocity.length() > state.maxSpeed) {
    state.velocity.normalize().multiplyScalar(state.maxSpeed);
  }

  // 摩擦による減衰
  state.velocity.multiplyScalar(state.friction);

  // basePositionの初期化
  if (!state.drone.userData.basePosition) {
    state.drone.userData.basePosition = state.drone.position.clone();
  }

  // 速度を位置に反映
  if (state.decelerationStartTime !== null) {
    state.velocity.set(0, 0, 0);
    if (state.landingHeight !== null) {
      state.drone.position.y = state.landingHeight;
      if (state.drone.userData.basePosition) {
        state.drone.userData.basePosition.y = state.landingHeight;
      }
    } else {
      const floorHeight = 0;
      state.drone.position.y = floorHeight;
      if (state.drone.userData.basePosition) {
        state.drone.userData.basePosition.y = floorHeight;
      }
    }
  } else if (state.liftStartTime !== null || state.descentStartTime !== null) {
    state.drone.position.add(state.velocity);
    state.drone.userData.basePosition.copy(state.drone.position);
  } else {
    state.drone.userData.basePosition.add(state.velocity);
  }

  // 角速度の更新
  let angVel = state.angularVelocity;
  angVel += inputRotation * state.angularAcceleration;
  angVel = Math.max(-state.maxAngularSpeed, Math.min(state.maxAngularSpeed, angVel));
  angVel *= state.angularFriction;
  state.setAngularVelocity(angVel);

  // 角速度を回転に反映
  state.drone.rotation.y += state.angularVelocity;

  // 移動方向への傾き
  const targetTiltX = -rawInputZ * state.tiltAmount;
  const targetTiltZ = rawInputX * state.tiltAmount;

  if (!state.drone.userData.physicsTilt) {
    state.drone.userData.physicsTilt = { x: 0, z: 0 };
  }
  state.drone.userData.physicsTilt.x += (targetTiltX - state.drone.userData.physicsTilt.x) * state.tiltSmoothing;
  state.drone.userData.physicsTilt.z += (targetTiltZ - state.drone.userData.physicsTilt.z) * state.tiltSmoothing;
}

function onWindowResize() {
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(window.innerWidth, window.innerHeight);
}

// MRセッション開始
async function startXR() {
  if (!navigator.xr) {
    updateInfo('WebXRがサポートされていません');
    alert('このデバイスはWebXRをサポートしていません');
    return;
  }

  try {
    updateInfo('MRセッションを開始中...');

    const supported = await navigator.xr.isSessionSupported('immersive-ar');

    if (!supported) {
      updateInfo('immersive-ARがサポートされていません');
      alert('このデバイスはAR機能をサポートしていません');
      return;
    }

    const xrSession = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: [],
      optionalFeatures: ['local-floor', 'bounded-floor', 'depth-sensing', 'plane-detection', 'hand-tracking'],
      depthSensing: {
        usagePreference: ['gpu-optimized'],
        dataFormatPreference: ['luminance-alpha']
      }
    });

    state.setXrSession(xrSession);
    state.setIsMrMode(true);

    await state.renderer.xr.setSession(xrSession);

    // ドローンモデルの読み込み（XRセッション開始時に行う）
    if (!state.drone) {
      loadDroneModel();
    }

    const rightController = state.renderer.xr.getController(0);
    const leftController = state.renderer.xr.getController(1);
    state.scene.add(rightController);
    state.scene.add(leftController);
    state.setRightController(rightController);
    state.setLeftController(leftController);

    const hand1 = state.renderer.xr.getHand(0);
    const hand2 = state.renderer.xr.getHand(1);
    state.scene.add(hand1);
    state.scene.add(hand2);
    state.setHand1(hand1);
    state.setHand2(hand2);

    // フラグをリセット
    state.setDronePositioned(false);
    state.setIsStartupComplete(false);
    state.setIsStartingUp(false);
    state.setPropellerSpeedMultiplier(0);
    state.setLiftStartTime(null);
    state.setLiftStartPos(null);
    state.setLiftTargetHeight(null);
    state.dronePhysicsVelocity.set(0, 0, 0);
    state.droneAngularVelocity.set(0, 0, 0);
    state.dronePreviousPosition.set(0, 0, 0);

    if (state.droneSound && state.droneSound.isPlaying) {
      state.droneSound.stop();
      console.log('ドローン音声停止');
    }

    const button = document.getElementById('start-button');
    if (button) {
      button.style.display = 'none';
    }

    window.dispatchEvent(new Event('xr-session-start'));

    updateInfo('MRセッション開始');

    if (xrSession.depthUsage) {
      console.log('深度センサー有効:', xrSession.depthUsage);
      updateInfo('MRセッション開始 (深度センサー有効)');
    } else {
      console.log('深度センサー無効');
      updateInfo('MRセッション開始 (深度センサー無効)');
    }

    xrSession.addEventListener('end', () => {
      state.setXrSession(null);
      state.setIsMrMode(false);
      state.setBaseReferenceSpace(null);
      state.setIsFpvMode(false);
      state.setWasFpvMode(false);
      state.setFpvInitialCameraPos(null);
      state.setFpvInitialDronePos(null);

      if (state.droneSound && state.droneSound.isPlaying) {
        state.droneSound.stop();
        console.log('ドローン音声停止');
      }

      if (state.depthMesh) {
        state.scene.remove(state.depthMesh);
        state.setDepthMesh(null);
      }
      state.setDepthDataTexture(null);

      state.detectedPlanes.clear();

      window.dispatchEvent(new Event('xr-session-end'));

      updateInfo('MRセッション終了');
      if (button) {
        button.style.display = 'block';
      }
    });

  } catch (error) {
    console.error('XRセッション開始エラー:', error);
    updateInfo('エラー: ' + (error.message || error.name || 'Unknown error'));
    alert('MRセッションを開始できませんでした: ' + (error.message || error.name || 'Unknown error'));
  }
}

// 初期化実行
init();

// ボタンのイベントリスナー
const startButton = document.getElementById('start-button');
if (startButton) {
  startButton.addEventListener('click', startXR);
}

// 深度表示切り替えボタン
const depthToggleButton = document.getElementById('depth-toggle');
if (depthToggleButton) {
  depthToggleButton.addEventListener('click', () => {
    state.setShowDepthVisualization(!state.showDepthVisualization);
    depthToggleButton.textContent = state.showDepthVisualization ? '深度表示 ON' : '深度表示 OFF';
    console.log('深度表示:', state.showDepthVisualization);
  });

  window.addEventListener('xr-session-start', () => {
    depthToggleButton.style.display = 'block';
  });

  window.addEventListener('xr-session-end', () => {
    depthToggleButton.style.display = 'none';
    state.setShowDepthVisualization(false);
    depthToggleButton.textContent = '深度表示 OFF';
  });
}
