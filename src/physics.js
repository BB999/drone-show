import * as THREE from 'three';
import * as state from './state.js';
import { playCrashSound } from './sound.js';

// 起動前の物理シミュレーション（落下処理）
export function updatePreStartupPhysics() {
  if (!state.drone || !state.dronePositioned) return;
  if (state.isStartupComplete || state.isStartingUp) return;
  if (state.liftStartTime !== null || state.descentStartTime !== null || state.decelerationStartTime !== null) return;
  if (state.propellerSpeedMultiplier > 0) return;
  if (state.isGrabbedByController || state.isGrabbedByHand) return;
  if (state.isReturningToHover || state.isAutoReturning) return;
  if (state.hasLanded) return;

  const floorHeight = 0;
  const dt = 0.016;

  // まず着地可能な平面の高さを計算（床の高さ + ドローンの半径）
  let landingPlaneHeight = floorHeight + state.droneCollisionRadius.vertical;

  state.detectedPlanes.forEach((planeData) => {
    const { position, quaternion, polygon } = planeData;

    // 水平な平面のみ対象（法線がほぼ上向き）
    const planeNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);
    if (Math.abs(planeNormal.y) < 0.7) return;

    const dronePos = state.drone.position.clone();

    // ドローンが平面の範囲内にいるか確認
    const inverseQuaternion = quaternion.clone().invert();
    const localDronePos = dronePos.clone().sub(position).applyQuaternion(inverseQuaternion);

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, zi = polygon[i].z;
      const xj = polygon[j].x, zj = polygon[j].z;

      const intersect = ((zi > localDronePos.z) !== (zj > localDronePos.z))
        && (localDronePos.x < (xj - xi) * (localDronePos.z - zi) / (zj - zi) + xi);
      if (intersect) inside = !inside;
    }

    if (inside) {
      // 平面の高さ + ドローンの半径
      const planeHeight = position.y + state.droneCollisionRadius.vertical;
      // ドローンより下にある平面のうち、最も高いものを選択
      if (planeHeight <= dronePos.y + 0.01 && planeHeight > landingPlaneHeight) {
        landingPlaneHeight = planeHeight;
      }
    }
  });

  // すでに着地している場合は静止状態を維持
  const isOnGround = Math.abs(state.drone.position.y - landingPlaneHeight) < 0.01;
  const isAlmostStopped = state.dronePhysicsVelocity.length() < 0.05;

  if (isOnGround && isAlmostStopped) {
    // 完全に静止
    state.drone.position.y = landingPlaneHeight;
    state.dronePhysicsVelocity.set(0, 0, 0);
    state.droneAngularVelocity.set(0, 0, 0);

    // 水平姿勢に固定
    const targetQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      state.drone.rotation.y
    );
    state.drone.quaternion.slerp(targetQuat, 0.3);

    const euler = new THREE.Euler().setFromQuaternion(state.drone.quaternion);
    if (Math.abs(euler.x) < 0.02 && Math.abs(euler.z) < 0.02) {
      const finalQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        state.drone.rotation.y
      );
      state.drone.quaternion.copy(finalQuat);
    }
    return;
  }

  // 重力加速度を適用
  const gravity = -9.8;
  state.dronePhysicsVelocity.y += gravity * dt;

  // 速度から位置を更新
  state.drone.position.add(state.dronePhysicsVelocity.clone().multiplyScalar(dt));

  // 地面または平面との衝突判定（終了シーケンスと同じ処理）
  if (state.drone.position.y <= landingPlaneHeight) {
    const impactVelocity = Math.abs(state.dronePhysicsVelocity.y);
    state.drone.position.y = landingPlaneHeight;

    // 下向きの速度がある場合は跳ね返る（終了シーケンスと同じ条件）
    if (state.dronePhysicsVelocity.y < 0) {
      state.dronePhysicsVelocity.y = -state.dronePhysicsVelocity.y * 0.5;
      state.droneAngularVelocity.x += (Math.random() - 0.5) * 1.0;
      state.droneAngularVelocity.z += (Math.random() - 0.5) * 1.0;

      // 衝突音と触覚フィードバック（終了シーケンスと同じ）
      if (impactVelocity > 0.5 && !state.isColliding) {
        state.setIsColliding(true);
        playCrashSound();
        if (state.xrSession) {
          const inputSources = state.xrSession.inputSources;
          for (const source of inputSources) {
            if (source.gamepad && source.gamepad.hapticActuators && source.gamepad.hapticActuators.length > 0) {
              const impactStrength = Math.min(Math.max(impactVelocity * 0.5, 0.3), 1.0);
              source.gamepad.hapticActuators[0].pulse(impactStrength, 33);
            }
          }
        }
      }
    } else {
      state.setIsColliding(false);
    }

    state.dronePhysicsVelocity.x *= 0.7;
    state.dronePhysicsVelocity.z *= 0.7;
    state.droneAngularVelocity.multiplyScalar(0.7);
  } else {
    state.setIsColliding(false);
  }

  // 角速度を回転に適用
  if (state.droneAngularVelocity.length() > 0.01) {
    const rotationAxis = state.droneAngularVelocity.clone().normalize();
    const rotationAngle = state.droneAngularVelocity.length() * dt;
    const rotationQuat = new THREE.Quaternion().setFromAxisAngle(rotationAxis, rotationAngle);
    state.drone.quaternion.multiply(rotationQuat);

    state.droneAngularVelocity.multiplyScalar(0.85);
  } else {
    state.droneAngularVelocity.set(0, 0, 0);
  }

  // 着地中は水平姿勢に戻る
  if (state.drone.position.y <= landingPlaneHeight + 0.02) {
    const targetQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      state.drone.rotation.y
    );
    state.drone.quaternion.slerp(targetQuat, 0.2);
  }
}

// ホバリングアニメーション
export function updateHoverAnimation() {
  if (!state.drone || !state.dronePositioned) return;
  if (!state.isStartupComplete) return;
  if (state.isGrabbedByController || state.isGrabbedByHand) return;
  if (state.isReturningToHover || state.isAutoReturning) return;

  state.setHoverTime(state.hoverTime + 0.016);

  if (!state.drone.userData.basePosition) {
    state.drone.userData.basePosition = state.drone.position.clone();
  }

  const hoverMultiplier = Math.pow(state.currentDroneScale / 0.3, 0.5);
  const clampedHoverMultiplier = Math.max(0.3, Math.min(2.0, hoverMultiplier));

  const hoverY = Math.sin(state.hoverTime * 1.2) * 0.006 * clampedHoverMultiplier;
  const hoverZ = Math.cos(state.hoverTime * 0.9) * 0.004 * clampedHoverMultiplier;
  const hoverX = Math.sin(state.hoverTime * 0.8) * 0.008 * clampedHoverMultiplier;

  const hoverTiltX = Math.sin(state.hoverTime * 0.7) * 0.008 * clampedHoverMultiplier;
  const hoverTiltZ = Math.cos(state.hoverTime * 0.85) * 0.008 * clampedHoverMultiplier;

  const basePos = state.drone.userData.basePosition;
  state.drone.position.x = basePos.x + hoverX;
  state.drone.position.y = basePos.y + hoverY;
  state.drone.position.z = basePos.z + hoverZ;

  if (!state.drone.userData.physicsTilt) {
    state.drone.userData.physicsTilt = { x: 0, z: 0 };
  }

  state.drone.rotation.order = 'YXZ';
  state.drone.rotation.x = state.drone.userData.physicsTilt.x + hoverTiltX;
  state.drone.rotation.z = state.drone.userData.physicsTilt.z + hoverTiltZ;
}

// 離した後のホバー位置への戻りアニメーション
export function updateReturnToHover() {
  if (!state.isReturningToHover || !state.drone || !state.dronePositioned) return;

  state.setReturnProgress(state.returnProgress + state.returnSpeed * 0.016);

  if (state.returnProgress >= 1.0) {
    state.setReturnProgress(1.0);
    state.setIsReturningToHover(false);
  }

  const easeProgress = 1 - Math.pow(1 - state.returnProgress, 3);

  if (!state.drone.userData.basePosition) {
    state.drone.userData.basePosition = state.drone.position.clone();
  }
  state.drone.userData.basePosition.copy(state.drone.position);

  state.drone.quaternion.slerpQuaternions(state.returnStartRotation, state.returnTargetRotation, easeProgress);

  state.velocity.set(0, 0, 0);
  state.setAngularVelocity(0);
}
