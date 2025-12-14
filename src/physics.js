import * as THREE from 'three';
import * as state from './state.js';
import { playCrashSound } from './sound.js';

// ドローンと平面の衝突判定
export function checkPlaneCollision() {
  if (!state.drone || !state.dronePositioned) return false;

  const dronePos = new THREE.Vector3();
  state.drone.getWorldPosition(dronePos);

  let hasCollision = false;

  state.detectedPlanes.forEach((planeData, xrPlane) => {
    const { position, quaternion, polygon, orientation } = planeData;

    const planeNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);
    const planeToDrone = new THREE.Vector3().subVectors(dronePos, position);
    const distance = planeToDrone.dot(planeNormal);

    const effectiveRadius = (Math.abs(planeNormal.y) > 0.7)
      ? state.droneCollisionRadius.vertical
      : state.droneCollisionRadius.horizontal;

    if (Math.abs(distance) < effectiveRadius) {
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
        hasCollision = true;

        const pushDistance = effectiveRadius - Math.abs(distance);
        const pushDirection = distance > 0 ? 1 : -1;
        const correction = planeNormal.clone().multiplyScalar(pushDistance * pushDirection);

        const collisionStrength = pushDistance;

        state.drone.position.add(correction);
        if (state.drone.userData.basePosition) {
          state.drone.userData.basePosition.add(correction);
        }

        const velocityAlongNormal = state.velocity.dot(planeNormal);
        // 平面に向かう速度成分を反転（床、天井、壁すべてに対応）
        // distance > 0: 法線方向側にいる、distance < 0: 法線と逆方向側にいる
        // velocityAlongNormal と distance の符号が逆 = 平面に向かっている
        if ((distance > 0 && velocityAlongNormal < 0) || (distance < 0 && velocityAlongNormal > 0)) {
          state.velocity.sub(planeNormal.clone().multiplyScalar(velocityAlongNormal * 1.5));
        }

        if (collisionStrength > 0.001 && !state.isColliding) {
          state.setIsColliding(true);
          playCrashSound();
          if (state.xrSession) {
            const inputSources = state.xrSession.inputSources;
            for (const source of inputSources) {
              if (source.gamepad && source.gamepad.hapticActuators && source.gamepad.hapticActuators.length > 0) {
                const impactStrength = Math.min(Math.max(collisionStrength * 20, 0.3), 1.0);
                source.gamepad.hapticActuators[0].pulse(impactStrength, 33);
              }
            }
          }
        }
      }
    }
  });

  // 固定の地面（floorHeight = 0）との衝突判定
  const floorHeight = 0;
  const floorDistance = dronePos.y - floorHeight;

  if (floorDistance < state.droneCollisionRadius.vertical) {
    hasCollision = true;

    const pushDistance = state.droneCollisionRadius.vertical - floorDistance;
    const floorNormal = new THREE.Vector3(0, 1, 0);

    // 位置補正（押し戻し）
    state.drone.position.y += pushDistance;
    if (state.drone.userData.basePosition) {
      state.drone.userData.basePosition.y += pushDistance;
    }

    // 速度反転（下向きの速度がある場合）
    if (state.velocity.y < 0) {
      state.velocity.y = -state.velocity.y * 0.5;
    }

    // 触覚フィードバック
    if (pushDistance > 0.001 && !state.isColliding) {
      state.setIsColliding(true);
      playCrashSound();
      if (state.xrSession) {
        const inputSources = state.xrSession.inputSources;
        for (const source of inputSources) {
          if (source.gamepad && source.gamepad.hapticActuators && source.gamepad.hapticActuators.length > 0) {
            const impactStrength = Math.min(Math.max(pushDistance * 20, 0.3), 1.0);
            source.gamepad.hapticActuators[0].pulse(impactStrength, 33);
          }
        }
      }
    }
  }

  // VR障害物との衝突判定
  if (state.vrObstacles && state.vrObstacles.length > 0) {
    state.vrObstacles.forEach(obstacle => {
      if (!obstacle.userData.isObstacle) return;

      const obstaclePos = obstacle.position.clone();
      const toDrone = new THREE.Vector3().subVectors(dronePos, obstaclePos);

      if (obstacle.userData.type === 'cube') {
        // キューブとの衝突（OBB - 回転を考慮）
        const halfSize = obstacle.userData.size / 2;
        const minDist = state.droneCollisionRadius.horizontal;

        // ドローンの位置をキューブのローカル座標系に変換
        const invQuat = obstacle.quaternion.clone().invert();
        const localDronePos = toDrone.clone().applyQuaternion(invQuat);

        // ローカル座標系での各軸の距離を計算
        const dx = Math.max(0, Math.abs(localDronePos.x) - halfSize);
        const dy = Math.max(0, Math.abs(localDronePos.y) - halfSize);
        const dz = Math.max(0, Math.abs(localDronePos.z) - halfSize);

        // ドローンがボックスの拡張範囲内にいるか
        if (dx < minDist && dy < minDist && dz < minDist) {
          hasCollision = true;

          // ローカル座標系で最も近い面の方向に押し出す
          const overlapX = halfSize + minDist - Math.abs(localDronePos.x);
          const overlapY = halfSize + minDist - Math.abs(localDronePos.y);
          const overlapZ = halfSize + minDist - Math.abs(localDronePos.z);

          let localPushDir = new THREE.Vector3();
          let pushAmount = 0;

          if (overlapX <= overlapY && overlapX <= overlapZ) {
            localPushDir.set(Math.sign(localDronePos.x), 0, 0);
            pushAmount = overlapX;
          } else if (overlapY <= overlapX && overlapY <= overlapZ) {
            localPushDir.set(0, Math.sign(localDronePos.y), 0);
            pushAmount = overlapY;
          } else {
            localPushDir.set(0, 0, Math.sign(localDronePos.z));
            pushAmount = overlapZ;
          }

          // 押し出し方向をワールド座標系に変換
          const pushDir = localPushDir.applyQuaternion(obstacle.quaternion);

          state.drone.position.add(pushDir.clone().multiplyScalar(pushAmount));
          if (state.drone.userData.basePosition) {
            state.drone.userData.basePosition.add(pushDir.clone().multiplyScalar(pushAmount));
          }

          // 速度反転
          const velocityAlongPush = state.velocity.dot(pushDir);
          if (velocityAlongPush < 0) {
            state.velocity.sub(pushDir.clone().multiplyScalar(velocityAlongPush * 1.5));
          }

          if (!state.isColliding) {
            state.setIsColliding(true);
            playCrashSound();
          }
        }
      } else if (obstacle.userData.type === 'pole') {
        // ポール（円柱）との衝突 - 回転を考慮
        const poleRadius = obstacle.userData.radius;
        const poleHeight = obstacle.userData.height;
        const minDist = poleRadius + state.droneCollisionRadius.horizontal;

        // ドローンの位置をポールのローカル座標系に変換
        const invQuat = obstacle.quaternion.clone().invert();
        const localDronePos = toDrone.clone().applyQuaternion(invQuat);

        // ローカル座標系でのY軸（ポールの軸方向）に沿った範囲チェック
        const halfHeight = poleHeight / 2;
        const clampedY = Math.max(-halfHeight, Math.min(halfHeight, localDronePos.y));

        // ローカル座標系でのXZ平面（ポールの断面）での距離
        const horizontalDist = Math.sqrt(localDronePos.x * localDronePos.x + localDronePos.z * localDronePos.z);

        // Y軸方向の距離（端からの距離）
        const yDist = Math.abs(localDronePos.y) - halfHeight;

        // ポール内部にいるか判定
        const isInsideHeight = localDronePos.y >= -halfHeight && localDronePos.y <= halfHeight;
        const isNearHeight = yDist < state.droneCollisionRadius.vertical;

        if (horizontalDist < minDist && (isInsideHeight || isNearHeight)) {
          hasCollision = true;

          let localPushDir = new THREE.Vector3();
          let pushAmount = 0;

          if (isInsideHeight) {
            // 高さ範囲内：XZ平面で押し出す
            localPushDir.set(localDronePos.x, 0, localDronePos.z).normalize();
            pushAmount = minDist - horizontalDist;
          } else {
            // 高さ範囲外（上下端付近）：最も近い方向へ押し出す
            const toEndpoint = new THREE.Vector3(
              localDronePos.x,
              localDronePos.y - clampedY,
              localDronePos.z
            );
            const distToEndpoint = toEndpoint.length();
            if (distToEndpoint > 0.001) {
              localPushDir.copy(toEndpoint).normalize();
              pushAmount = minDist - distToEndpoint;
            }
          }

          if (pushAmount > 0 && localPushDir.length() > 0.001) {
            // 押し出し方向をワールド座標系に変換
            const pushDir = localPushDir.applyQuaternion(obstacle.quaternion);

            state.drone.position.add(pushDir.clone().multiplyScalar(pushAmount));
            if (state.drone.userData.basePosition) {
              state.drone.userData.basePosition.add(pushDir.clone().multiplyScalar(pushAmount));
            }

            // 速度反転
            const velocityAlongPush = state.velocity.dot(pushDir);
            if (velocityAlongPush < 0) {
              state.velocity.sub(pushDir.clone().multiplyScalar(velocityAlongPush * 1.5));
            }

            if (!state.isColliding) {
              state.setIsColliding(true);
              playCrashSound();
            }
          }
        }
      } else if (obstacle.userData.type === 'torus') {
        // トーラスのチューブ部分との衝突
        const outerRadius = obstacle.userData.outerRadius;
        const tubeRadius = obstacle.userData.tubeRadius;

        // トーラスのローカル座標系に変換
        const localPos = toDrone.clone();
        const invQuat = obstacle.quaternion.clone().invert();
        localPos.applyQuaternion(invQuat);

        // THREE.jsのトーラスはXY平面に配置される
        // XY平面でのリング中心からの距離
        const ringDist = Math.sqrt(localPos.x * localPos.x + localPos.y * localPos.y);
        // リング上の最近点までの距離（Z軸方向が厚み）
        const toRingCenter = ringDist - outerRadius;
        const distToTube = Math.sqrt(toRingCenter * toRingCenter + localPos.z * localPos.z);
        const minDist = tubeRadius + state.droneCollisionRadius.horizontal;

        if (distToTube < minDist) {
          hasCollision = true;

          // 押し戻し方向を計算
          const ringAngle = Math.atan2(localPos.y, localPos.x);
          const ringPoint = new THREE.Vector3(
            Math.cos(ringAngle) * outerRadius,
            Math.sin(ringAngle) * outerRadius,
            0
          );
          const pushDir = localPos.clone().sub(ringPoint).normalize();
          pushDir.applyQuaternion(obstacle.quaternion);

          const pushAmount = minDist - distToTube;
          state.drone.position.add(pushDir.multiplyScalar(pushAmount));
          if (state.drone.userData.basePosition) {
            state.drone.userData.basePosition.add(pushDir.clone().multiplyScalar(pushAmount));
          }

          // 速度反転
          const velocityAlongPush = state.velocity.dot(pushDir);
          if (velocityAlongPush < 0) {
            state.velocity.sub(pushDir.clone().multiplyScalar(velocityAlongPush * 1.5));
          }

          if (!state.isColliding) {
            state.setIsColliding(true);
            playCrashSound();
          }
        }
      }
    });
  }

  if (!hasCollision) {
    state.setIsColliding(false);
  }

  return hasCollision;
}

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
