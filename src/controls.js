import * as THREE from 'three';
import * as state from './state.js';
import { updateInfo } from './utils.js';
import { updateDroneScale, updateMaxSpeed } from './drone.js';
import { updateDroneSoundPitch, playButtonSound, playCursorSound } from './sound.js';
import {
  createAutoReturnText, createAutoReturnRightControllerText, removeAutoReturnText,
  createSpeedText, createTrackingLostText,
  createSequenceStatusText, removeSequenceStatusText, t
} from './ui.js';

// 自動帰還モードの処理
export function updateAutoReturn() {
  if (!state.isAutoReturning || !state.drone || !state.dronePositioned) return;

  if (state.autoReturnPhase === 'horizontal') {
    const horizontalTarget = new THREE.Vector3(state.autoReturnTarget.x, state.drone.position.y, state.autoReturnTarget.z);
    const direction = new THREE.Vector3().subVectors(horizontalTarget, state.drone.position);
    const distance = direction.length();

    if (distance < 0.05) {
      state.setAutoReturnPhase('vertical');
      updateInfo('水平位置到達 - 高度調整中');
      console.log('水平移動完了、高度調整開始');
    } else {
      direction.normalize();
      const moveSpeed = Math.min(state.autoReturnSpeed, distance);
      state.drone.position.x += direction.x * moveSpeed;
      state.drone.position.z += direction.z * moveSpeed;
      state.drone.userData.basePosition.copy(state.drone.position);

      const targetAngle = Math.atan2(direction.x, direction.z);
      const currentAngle = state.drone.rotation.y;
      let angleDiff = targetAngle - currentAngle;

      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      state.drone.rotation.y += angleDiff * 0.1;
    }
  } else if (state.autoReturnPhase === 'vertical') {
    const verticalDistance = Math.abs(state.autoReturnTarget.y - state.drone.position.y);

    if (verticalDistance < 0.05) {
      state.setAutoReturnPhase('rotation');
      updateInfo('高度到達 - 向き調整中');
      console.log('高度調整完了、向き調整開始');
    } else {
      const direction = Math.sign(state.autoReturnTarget.y - state.drone.position.y);
      const moveSpeed = Math.min(state.autoReturnSpeed, verticalDistance);
      state.drone.position.y += direction * moveSpeed;
      state.drone.userData.basePosition.copy(state.drone.position);
    }
  } else if (state.autoReturnPhase === 'rotation') {
    const cameraPos = new THREE.Vector3();
    state.camera.getWorldPosition(cameraPos);

    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(state.camera.quaternion);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    const targetAngle = Math.atan2(cameraDirection.x, cameraDirection.z);
    const currentAngle = state.drone.rotation.y;

    let angleDiff = targetAngle - currentAngle;

    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) < 0.05) {
      state.drone.rotation.y = targetAngle;
      state.setIsAutoReturning(false);
      state.setAutoReturnPhase('horizontal');
      removeAutoReturnText();
      state.drone.userData.basePosition.copy(state.drone.position);
      state.velocity.set(0, 0, 0);
      state.setAngularVelocity(0);
      updateInfo('自動帰還完了');
      console.log('自動帰還完了');
    } else {
      state.drone.rotation.y += angleDiff * 0.1;
    }
  }
}

// 速度レベル変更処理（無効化）
export function handleSpeedChange() {
  // 機能削除
}

// 右コントローラーのボタン処理（自動帰還、フォーメーション切り替え）
export function handleRightControllerButtons() {
  if (!state.xrSession || !state.drone || !state.dronePositioned) return;

  // 起動完了後のみ
  if (!state.isStartupComplete || state.isGrabbedByController || state.isGrabbedByHand || state.bothGripsPressed) return;

  const inputSources = state.xrSession.inputSources;
  for (const source of inputSources) {
    if (source.handedness === 'right' && source.gamepad) {
      const buttons = source.gamepad.buttons;

      // Aボタンでフォーメーション切り替え（K → MU → I → (^_^) → 元 のループ）
      // アニメーション中でも押せる
      const aButton = buttons[4];
      const isAPressed = aButton && aButton.pressed;

      if (isAPressed && !state.rightAButtonPressed) {
        // Xボタンフォーメーションをリセット
        state.setFormationIndexX(0);
        state.setFormationAnimatingX(false);
        // フォーメーションインデックスを進める (0: 元, 1: K, 2: MU, 3: I, 4: (^_^))
        const nextIndex = (state.formationIndex + 1) % 5;
        state.setFormationIndex(nextIndex);
        state.setFormationAnimating(true);
        state.setFormationStartTime(null);
        // 各ドローンの速度をリセット＆反応遅延を再設定＆到着フラグをリセット
        state.droneChildren.forEach((drone) => {
          if (drone) {
            drone.userData.velocity = { x: 0, y: 0, z: 0 };
            drone.userData.reactionDelay = Math.random() * 1.0;
            if (drone.userData.flightParams) {
              drone.userData.flightParams.hasArrived = false;
            }
          }
        });
        playButtonSound();
        const formationNames = ['Normal', 'K', 'MU', 'I', '(^_^)'];
        updateInfo(formationNames[nextIndex] + ' Formation');
        console.log('Aボタン フォーメーション切り替え:', formationNames[nextIndex]);
      }
      state.setRightAButtonPressed(isAPressed);

      // Bボタンで自動帰還（FPVモード中は無効）
      const bButton = buttons[5];
      const isBPressed = bButton && bButton.pressed;

      if (isBPressed && !state.rightBButtonPressed) {
        if (state.isFpvMode) {
          // FPVモード中は自動帰還を使用不可
          updateInfo('FPVモード中は自動帰還を使用できません');
          playButtonSound();
        } else if (!state.isAutoReturning) {
          const frame = state.renderer.xr.getFrame();
          const referenceSpace = state.renderer.xr.getReferenceSpace();
          if (frame && referenceSpace && source.gripSpace) {
            const gripPose = frame.getPose(source.gripSpace, referenceSpace);
            if (gripPose) {
              const controllerPos = new THREE.Vector3().setFromMatrixPosition(
                new THREE.Matrix4().fromArray(gripPose.transform.matrix)
              );

              state.setIsAutoReturning(true);
              state.setAutoReturnPhase('horizontal');
              state.autoReturnTarget.copy(controllerPos);
              state.setAutoReturnSpeed(state.maxSpeed * 1.5);
              createAutoReturnText();
              createAutoReturnRightControllerText();
              updateInfo('自動帰還モード開始 - 水平移動中');
              console.log('自動帰還開始:', state.autoReturnTarget, 'speed:', state.autoReturnSpeed);
              playButtonSound();
            }
          }
        } else {
          state.setIsAutoReturning(false);
          state.setAutoReturnPhase('horizontal');
          removeAutoReturnText();
          updateInfo('自動帰還モードをキャンセル');
          console.log('自動帰還キャンセル');
          playButtonSound();
        }
      }

      state.setRightBButtonPressed(isBPressed);
    }
  }
}

// 左コントローラーのボタン処理（設定メニュー削除済み）
export function handleLeftControllerButtons() {
  // 設定メニュー削除済み - 空関数
}

// 左コントローラーの起動/終了シーケンス処理
export function handleStartupSequence() {
  if (!state.xrSession || !state.droneSound) return;

  const inputSources = state.xrSession.inputSources;

  for (const source of inputSources) {
    if (source.handedness === 'left' && source.gamepad) {
      const buttons = source.gamepad.buttons;

      // Xボタンで起動/終了シーケンス
      const xButton = buttons[5];
      const isXPressed = xButton && xButton.pressed;

      if (isXPressed && !state.leftXButtonPressed && !state.isStartupComplete && !state.isStartingUp && !state.isShuttingDown && state.dronePositioned) {
        // 起動シーケンスを開始
        state.setIsStartingUp(true);
        state.setHasLanded(false);
        console.log('起動シーケンス開始');
        updateInfo('Drone Starting...');
        createSequenceStatusText(t('status', 'startingUp'));
        playButtonSound();

        // ドローン音を低ピッチで再生開始
        if (state.droneSound && state.droneSound.buffer && !state.droneSound.isPlaying) {
          let normalPitch = Math.pow(0.3 / state.currentDroneScale, 0.5);
          normalPitch = Math.max(0.2, Math.min(2.7, normalPitch));
          const startPitch = Math.max(normalPitch / 2.0, 0.2);

          state.droneSound.setVolume(0);
          state.droneSound.setPlaybackRate(startPitch);
          state.droneSound.play();
          console.log('ドローン音開始 - 開始ピッチ:', startPitch.toFixed(2), '目標ピッチ:', normalPitch.toFixed(2));
        }

        // プロペラを2秒かけてフル回転に加速
        const startTime = Date.now();
        const accelerationDuration = 2000;

        let normalPitch = Math.pow(0.3 / state.currentDroneScale, 0.5);
        normalPitch = Math.max(0.2, Math.min(2.7, normalPitch));
        const startPitch = Math.max(normalPitch / 2.0, 0.2);

        const accelerateInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / accelerationDuration, 1.0);
          state.setPropellerSpeedMultiplier(progress);

          if (state.droneSound && state.droneSound.isPlaying) {
            if (!state.isSoundMuted) {
              state.droneSound.setVolume(0.7 * progress);
            }
            const currentPitch = startPitch + (normalPitch - startPitch) * progress;
            state.droneSound.setPlaybackRate(currentPitch);
          }

          if (progress >= 1.0) {
            clearInterval(accelerateInterval);
            console.log('プロペラ加速完了、音量・ピッチ通常到達');

            setTimeout(() => {
              console.log('=== 上昇準備完了 - 次のフレームで上昇開始 ===');
              state.setLiftStartTime(Date.now());
            }, 500);
          }
        }, 16);
      }

      // 起動完了後：Xボタンでフォーメーション切り替え（猫 → メビウス → 泣き顔 → 波 → 元）
      // アニメーション中でも押せる
      if (isXPressed && !state.leftXButtonPressedForFormation && state.isStartupComplete && !state.isShuttingDown) {
        // Aボタンフォーメーションをリセット
        state.setFormationIndex(0);
        state.setFormationAnimating(false);
        // フォーメーションインデックスを進める (0: 元, 1: 猫, 2: メビウス, 3: 泣き顔, 4: 波)
        const nextIndex = (state.formationIndexX + 1) % 5;
        state.setFormationIndexX(nextIndex);
        state.setFormationAnimatingX(true);
        state.setFormationStartTimeX(null);
        state.setFormationAnimationTimeX(0);
        // 各ドローンの速度をリセット＆反応遅延を再設定＆到着フラグをリセット
        state.droneChildren.forEach((drone) => {
          if (drone) {
            drone.userData.velocity = { x: 0, y: 0, z: 0 };
            drone.userData.reactionDelay = Math.random() * 1.0;
            if (drone.userData.flightParams) {
              drone.userData.flightParams.hasArrived = false;
            }
          }
        });
        playButtonSound();
        const formationNames = ['Normal', 'Cat🐱', '∞Mobius', 'Crying;_;', 'Wave〜'];
        updateInfo(formationNames[nextIndex] + ' Formation');
        console.log('Xボタン フォーメーション切り替え:', formationNames[nextIndex]);
      }
      state.setLeftXButtonPressedForFormation(isXPressed);

      state.setLeftXButtonPressed(isXPressed);
    }
  }
}

// 両グリップでのサイズ変更処理
export function handleSizeChange() {
  if (!state.xrSession || !state.drone || !state.dronePositioned) return;
  if (state.isGrabbedByController || state.isGrabbedByHand || state.isStartingUp || state.isShuttingDown) return;

  const inputSources = state.xrSession.inputSources;
  let rightGripCurrentlyPressed = false;
  let leftGripCurrentlyPressed = false;
  let rightControllerPos = null;
  let leftControllerPos = null;

  const frame = state.renderer.xr.getFrame();
  const referenceSpace = state.renderer.xr.getReferenceSpace();
  if (frame && referenceSpace) {
    for (const source of inputSources) {
      if (source.gamepad && source.gripSpace) {
        const buttons = source.gamepad.buttons;
        const gripButton = buttons[1];
        const isGripPressed = gripButton && gripButton.pressed;

        const gripPose = frame.getPose(source.gripSpace, referenceSpace);
        if (gripPose) {
          const controllerPos = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().fromArray(gripPose.transform.matrix));

          if (source.handedness === 'right') {
            rightGripCurrentlyPressed = isGripPressed;
            rightControllerPos = controllerPos;
          } else if (source.handedness === 'left') {
            leftGripCurrentlyPressed = isGripPressed;
            leftControllerPos = controllerPos;
          }
        }
      }
    }
  }

  if (rightGripCurrentlyPressed && leftGripCurrentlyPressed && rightControllerPos && leftControllerPos) {
    if (!state.bothGripsPressed) {
      state.setBothGripsPressed(true);
      state.setInitialControllerDistance(rightControllerPos.distanceTo(leftControllerPos));
      state.setInitialDroneScale(state.currentDroneScale);
      updateInfo('サイズ変更モード開始 (初期距離: ' + (state.initialControllerDistance * 100).toFixed(1) + 'cm)');
      console.log('サイズ変更モード開始:', state.initialControllerDistance, 'スケール:', state.initialDroneScale);
    } else {
      const currentDistance = rightControllerPos.distanceTo(leftControllerPos);
      const scaleRatio = currentDistance / state.initialControllerDistance;
      const newScale = state.initialDroneScale * scaleRatio;
      updateDroneScale(newScale);
    }
  } else {
    if (state.bothGripsPressed) {
      state.setBothGripsPressed(false);
      updateInfo('サイズ変更モード終了 (最終スケール: ' + state.currentDroneScale.toFixed(2) + ')');
      console.log('サイズ変更モード終了');
    }
  }
}

// コントローラーでドローンを掴む処理
export function handleControllerGrab() {
  if (!state.xrSession || !state.drone || !state.dronePositioned) return;
  if (state.isGrabbedByHand || state.bothGripsPressed || state.isStartingUp || state.isShuttingDown) return;

  const inputSources = state.xrSession.inputSources;

  for (const source of inputSources) {
    if (source.gamepad && source.gripSpace) {
      const gp = source.gamepad;
      const buttons = gp.buttons;
      const gripButton = buttons[1];
      const isGripPressed = gripButton && gripButton.pressed;

      // 右コントローラーのグリップ
      if (source.handedness === 'right') {
        if (isGripPressed && !state.rightGripPressed && source.gripSpace) {
          const dronePos = new THREE.Vector3();
          state.drone.getWorldPosition(dronePos);

          const frame = state.renderer.xr.getFrame();
          const referenceSpace = state.renderer.xr.getReferenceSpace();
          if (frame && referenceSpace) {
            const gripPose = frame.getPose(source.gripSpace, referenceSpace);
            if (gripPose) {
              const controllerPos = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().fromArray(gripPose.transform.matrix));

              const distance = dronePos.distanceTo(controllerPos);
              if (distance < 0.08) {
                state.setIsGrabbedByController(true);
                state.setGrabbingInputSource(source);
                state.setHasLanded(false);

                state.smoothedControllerPosition.copy(controllerPos);

                const controllerQuat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().fromArray(gripPose.transform.matrix));
                state.smoothedControllerRotation.copy(controllerQuat);

                state.grabOffset.copy(dronePos).sub(state.smoothedControllerPosition);

                const droneQuat = new THREE.Quaternion();
                state.drone.getWorldQuaternion(droneQuat);
                state.grabRotationOffset.copy(state.smoothedControllerRotation).invert().multiply(droneQuat);

                updateInfo('右コントローラーでドローンを掴んだ (距離: ' + (distance * 100).toFixed(1) + 'cm)');
                console.log('右コントローラーでドローンを掴んだ');
              }
            }
          }
        } else if (!isGripPressed && state.rightGripPressed && state.isGrabbedByController && state.grabbingInputSource === source) {
          handleControllerRelease();
        }
        state.setRightGripPressed(isGripPressed);
      }

      // 左コントローラーのグリップ
      if (source.handedness === 'left') {
        if (isGripPressed && !state.leftGripPressed && source.gripSpace) {
          const dronePos = new THREE.Vector3();
          state.drone.getWorldPosition(dronePos);

          const frame = state.renderer.xr.getFrame();
          const referenceSpace = state.renderer.xr.getReferenceSpace();
          if (frame && referenceSpace) {
            const gripPose = frame.getPose(source.gripSpace, referenceSpace);
            if (gripPose) {
              const controllerPos = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().fromArray(gripPose.transform.matrix));

              const distance = dronePos.distanceTo(controllerPos);
              if (distance < 0.08) {
                state.setIsGrabbedByController(true);
                state.setGrabbingInputSource(source);
                state.setHasLanded(false);

                state.smoothedControllerPosition.copy(controllerPos);

                const controllerQuat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().fromArray(gripPose.transform.matrix));
                state.smoothedControllerRotation.copy(controllerQuat);

                state.grabOffset.copy(dronePos).sub(state.smoothedControllerPosition);

                const droneQuat = new THREE.Quaternion();
                state.drone.getWorldQuaternion(droneQuat);
                state.grabRotationOffset.copy(state.smoothedControllerRotation).invert().multiply(droneQuat);

                updateInfo('左コントローラーでドローンを掴んだ (距離: ' + (distance * 100).toFixed(1) + 'cm)');
                console.log('左コントローラーでドローンを掴んだ');
              }
            }
          }
        } else if (!isGripPressed && state.leftGripPressed && state.isGrabbedByController && state.grabbingInputSource === source) {
          handleControllerRelease();
        }
        state.setLeftGripPressed(isGripPressed);
      }
    }
  }

  // コントローラーで掴んでいる場合、ドローンをコントローラーに追従させる
  if (state.isGrabbedByController && state.grabbingInputSource && state.grabbingInputSource.gripSpace) {
    const frame = state.renderer.xr.getFrame();
    const referenceSpace = state.renderer.xr.getReferenceSpace();
    if (frame && referenceSpace) {
      const gripPose = frame.getPose(state.grabbingInputSource.gripSpace, referenceSpace);
      if (gripPose) {
        const controllerPos = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().fromArray(gripPose.transform.matrix));

        state.smoothedControllerPosition.lerp(controllerPos, state.controllerSmoothingFactor);

        const newPos = state.smoothedControllerPosition.clone().add(state.grabOffset);
        state.drone.position.copy(newPos);
        if (state.drone.userData.basePosition) {
          state.drone.userData.basePosition.copy(newPos);
        }

        const controllerQuat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().fromArray(gripPose.transform.matrix));
        state.smoothedControllerRotation.slerp(controllerQuat, state.controllerSmoothingFactor);

        const targetQuat = state.smoothedControllerRotation.clone().multiply(state.grabRotationOffset);
        state.drone.quaternion.copy(targetQuat);

        state.velocity.set(0, 0, 0);
        state.setAngularVelocity(0);
      }
    }
  }
}

// コントローラーを離した時の処理
function handleControllerRelease() {
  const dt = 0.016;
  const releaseVelocity = state.drone.position.clone().sub(state.dronePreviousPosition).divideScalar(dt);

  state.setIsGrabbedByController(false);
  state.setGrabbingInputSource(null);

  if (state.isStartupComplete) {
    state.setIsReturningToHover(true);
    state.setReturnProgress(0);
    state.returnStartPosition.copy(state.drone.position);
    state.returnStartRotation.copy(state.drone.quaternion);
    state.returnTargetRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), state.drone.rotation.y);
    updateInfo('ドローンを離した - ホバー位置に戻ります');
    console.log('ドローンを離した');
  } else {
    state.dronePhysicsVelocity.copy(releaseVelocity);
    state.droneAngularVelocity.set(
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3
    );
    updateInfo('ドローンを離した');
    console.log('ドローンを離した - 速度:', releaseVelocity.length().toFixed(2), 'm/s');
  }
}

// ハンドトラッキングでドローンを掴む処理（50機個別対応）
// パフォーマンス最適化: 再利用オブジェクト
const _handIndexPos = new THREE.Vector3();
const _handThumbPos = new THREE.Vector3();
const _handCenter = new THREE.Vector3();
const _droneWorldPos = new THREE.Vector3();
const _handQuat = new THREE.Quaternion();
const _droneQuat = new THREE.Quaternion();

// 前フレームのピンチ状態を追跡（つまんだ状態で近づいても反応しないように）
let _wasPinchingHand1 = false;
let _wasPinchingHand2 = false;

export function handleHandGrab() {
  if (!state.xrSession || !state.dronePositioned) return;
  if (state.isGrabbedByController || state.bothGripsPressed || state.isStartingUp || state.isShuttingDown) return;

  const frame = state.renderer.xr.getFrame();
  if (!frame) return;

  const hands = [state.hand1, state.hand2];

  // 全ドローンリスト（メインドローン + 子ドローン）
  const allDrones = [];
  if (state.drone) allDrones.push(state.drone);
  if (state.droneChildren && state.droneChildren.length > 0) {
    allDrones.push(...state.droneChildren);
  }

  for (let i = 0; i < hands.length; i++) {
    const hand = hands[i];
    if (!hand) continue;

    const indexTip = hand.joints['index-finger-tip'];
    const thumbTip = hand.joints['thumb-tip'];

    if (indexTip && thumbTip) {
      indexTip.getWorldPosition(_handIndexPos);
      thumbTip.getWorldPosition(_handThumbPos);

      const pinchDistance = _handIndexPos.distanceTo(_handThumbPos);
      const isPinching = pinchDistance < 0.025;

      // 前フレームのピンチ状態を取得・更新
      const wasPinching = i === 0 ? _wasPinchingHand1 : _wasPinchingHand2;
      if (i === 0) {
        _wasPinchingHand1 = isPinching;
      } else {
        _wasPinchingHand2 = isPinching;
      }

      // ピンチ開始（立ち上がりエッジ）を検出
      const justStartedPinching = isPinching && !wasPinching;

      _handCenter.addVectors(_handIndexPos, _handThumbPos).multiplyScalar(0.5);

      // ピンチ開始時のみドローンを掴む（つまんだ状態で近づいても反応しない）
      if (justStartedPinching && !state.isGrabbedByHand) {
        let closestDrone = null;
        let closestDistance = 0.08; // 掴める最大距離

        for (const drone of allDrones) {
          if (!drone) continue;
          drone.getWorldPosition(_droneWorldPos);
          const dist = _handCenter.distanceTo(_droneWorldPos);
          if (dist < closestDistance) {
            closestDistance = dist;
            closestDrone = drone;
          }
        }

        if (closestDrone) {
          state.setIsGrabbedByHand(true);
          state.setGrabbingHand(hand);
          state.setGrabbedDrone(closestDrone);
          state.setHasLanded(false);

          // 元の位置と回転を保存
          state.grabbedDroneOriginalPosition.copy(closestDrone.position);
          state.grabbedDroneOriginalQuaternion.copy(closestDrone.quaternion);

          closestDrone.getWorldPosition(_droneWorldPos);
          state.grabOffset.copy(_droneWorldPos).sub(_handCenter);
          state.smoothedHandPosition.copy(_handCenter);

          const wrist = hand.joints['wrist'];
          if (wrist) {
            wrist.getWorldQuaternion(_handQuat);
            closestDrone.getWorldQuaternion(_droneQuat);
            state.grabRotationOffset.copy(_handQuat).invert().multiply(_droneQuat);
            state.smoothedHandRotation.copy(_handQuat);
          } else {
            hand.getWorldQuaternion(_handQuat);
            closestDrone.getWorldQuaternion(_droneQuat);
            state.grabRotationOffset.copy(_handQuat).invert().multiply(_droneQuat);
            state.smoothedHandRotation.copy(_handQuat);
          }

          const isMainDrone = closestDrone === state.drone;
          const droneIndex = isMainDrone ? 0 : state.droneChildren.indexOf(closestDrone) + 1;
          updateInfo('ドローン #' + droneIndex + ' を掴んだ');
          console.log('手でドローンを掴んだ #' + droneIndex + ' 距離:', closestDistance.toFixed(3));
        }
      } else if (!isPinching && state.isGrabbedByHand && state.grabbingHand === hand) {
        handleHandRelease();
      }

      // 掴んでいる場合、ドローンを手に追従させる
      if (state.isGrabbedByHand && state.grabbingHand === hand && state.grabbedDrone) {
        indexTip.getWorldPosition(_handIndexPos);
        thumbTip.getWorldPosition(_handThumbPos);
        _handCenter.addVectors(_handIndexPos, _handThumbPos).multiplyScalar(0.5);

        state.smoothedHandPosition.lerp(_handCenter, state.handSmoothingFactor);

        const newWorldPos = state.smoothedHandPosition.clone().add(state.grabOffset);

        // 子ドローンの場合はワールド座標をローカル座標に変換
        const isMainDrone = state.grabbedDrone === state.drone;
        if (isMainDrone) {
          state.grabbedDrone.position.copy(newWorldPos);
          if (state.grabbedDrone.userData.basePosition) {
            state.grabbedDrone.userData.basePosition.copy(newWorldPos);
          }
        } else {
          // 親（メインドローン）のワールド行列の逆行列でローカル座標に変換
          const localPos = newWorldPos.clone();
          if (state.drone) {
            state.drone.updateWorldMatrix(true, false);
            const parentInverse = new THREE.Matrix4().copy(state.drone.matrixWorld).invert();
            localPos.applyMatrix4(parentInverse);
          }
          state.grabbedDrone.position.copy(localPos);
        }

        const wrist = hand.joints['wrist'];
        if (wrist) {
          wrist.getWorldQuaternion(_handQuat);
          state.smoothedHandRotation.slerp(_handQuat, state.handSmoothingFactor);
          const targetQuat = state.smoothedHandRotation.clone().multiply(state.grabRotationOffset);
          if (isMainDrone) {
            state.grabbedDrone.quaternion.copy(targetQuat);
          } else {
            // 子ドローンの回転もローカルに変換
            const parentQuatInverse = new THREE.Quaternion();
            state.drone.getWorldQuaternion(parentQuatInverse);
            parentQuatInverse.invert();
            const localQuat = parentQuatInverse.multiply(targetQuat);
            state.grabbedDrone.quaternion.copy(localQuat);
          }
        } else {
          hand.getWorldQuaternion(_handQuat);
          state.smoothedHandRotation.slerp(_handQuat, state.handSmoothingFactor);
          const targetQuat = state.smoothedHandRotation.clone().multiply(state.grabRotationOffset);
          if (isMainDrone) {
            state.grabbedDrone.quaternion.copy(targetQuat);
          } else {
            const parentQuatInverse = new THREE.Quaternion();
            state.drone.getWorldQuaternion(parentQuatInverse);
            parentQuatInverse.invert();
            const localQuat = parentQuatInverse.multiply(targetQuat);
            state.grabbedDrone.quaternion.copy(localQuat);
          }
        }

        // メインドローンの場合のみ速度リセット
        if (isMainDrone) {
          state.velocity.set(0, 0, 0);
          state.setAngularVelocity(0);
        }
      }
    }
  }
}

// 手を離した時の処理
function handleHandRelease() {
  const grabbedDrone = state.grabbedDrone;
  if (!grabbedDrone) {
    state.setIsGrabbedByHand(false);
    state.setGrabbingHand(null);
    state.setGrabbedDrone(null);
    return;
  }

  const isMainDrone = grabbedDrone === state.drone;
  const droneIndex = isMainDrone ? 0 : state.droneChildren.indexOf(grabbedDrone) + 1;

  state.setIsGrabbedByHand(false);
  state.setGrabbingHand(null);
  state.setGrabbedDrone(null);

  // 元の位置に戻るアニメーションを開始
  if (isMainDrone) {
    // メインドローン
    state.setIsReturningToHover(true);
    state.setReturnProgress(0);
    state.returnStartPosition.copy(grabbedDrone.position);
    state.returnStartRotation.copy(grabbedDrone.quaternion);
    // 元の位置に戻る
    if (grabbedDrone.userData.basePosition) {
      state.drone.userData.returnTargetPosition = grabbedDrone.userData.basePosition.clone();
    }
    state.returnTargetRotation.copy(state.grabbedDroneOriginalQuaternion);
  } else {
    // 子ドローン - 隊列の目標位置に戻るアニメーション
    const childIndex = state.droneChildren.indexOf(grabbedDrone);
    if (childIndex >= 0) {
      // 現在のフォーメーションに基づいて目標位置を取得
      let targetPositions;
      if (state.formationAnimating || state.formationIndex > 0) {
        // Aボタンフォーメーション
        switch (state.formationIndex) {
          case 1: targetPositions = state.droneKPositions; break;
          case 2: targetPositions = state.droneMUPositions; break;
          case 3: targetPositions = state.droneIPositions; break;
          case 4: targetPositions = state.droneSmilePositions; break;
          default: targetPositions = state.droneOriginalPositions; break;
        }
      } else if (state.formationAnimatingX || state.formationIndexX > 0) {
        // Xボタンフォーメーション
        switch (state.formationIndexX) {
          case 1: targetPositions = state.droneCatPositions; break;
          case 2: targetPositions = state.droneMobiusPositions; break;
          case 3: targetPositions = state.droneCryingPositions; break;
          case 4: targetPositions = state.droneWavePositions; break;
          default: targetPositions = state.droneOriginalPositions; break;
        }
      } else {
        targetPositions = state.droneOriginalPositions;
      }

      if (targetPositions && targetPositions[childIndex]) {
        const targetPos = targetPositions[childIndex];
        state.setReturningDrone(grabbedDrone);
        state.setReturningDroneProgress(0);
        state.returningDroneStartPosition.copy(grabbedDrone.position);
        state.returningDroneStartQuaternion.copy(grabbedDrone.quaternion);
        state.returningDroneTargetPosition.set(targetPos.x, targetPos.y || 0, targetPos.z || 0);
        state.returningDroneTargetQuaternion.set(0, 0, 0, 1); // 水平姿勢
      }
    }
  }

  updateInfo('ドローン #' + droneIndex + ' を離した - 元の位置に戻ります');
  console.log('手を離した #' + droneIndex + ' - 元の位置に戻ります');
}

// 子ドローンの戻りアニメーション更新
export function updateReturningDrone() {
  if (!state.returningDrone) return;

  state.setReturningDroneProgress(state.returningDroneProgress + state.returnSpeed * 0.016);

  if (state.returningDroneProgress >= 1.0) {
    state.setReturningDroneProgress(1.0);
    state.returningDrone.position.copy(state.returningDroneTargetPosition);
    state.returningDrone.quaternion.copy(state.returningDroneTargetQuaternion);
    state.setReturningDrone(null);
    return;
  }

  // イージング
  const easeProgress = 1 - Math.pow(1 - state.returningDroneProgress, 3);

  // 位置の補間
  state.returningDrone.position.lerpVectors(
    state.returningDroneStartPosition,
    state.returningDroneTargetPosition,
    easeProgress
  );

  // 回転の補間
  state.returningDrone.quaternion.slerpQuaternions(
    state.returningDroneStartQuaternion,
    state.returningDroneTargetQuaternion,
    easeProgress
  );
}
