import * as THREE from 'three';
import * as state from './state.js';
import { updateInfo } from './utils.js';

// ボタン音用のAudioオブジェクト
let buttonSound = null;
let buttonSoundBuffer = null;

// ウィンドウ音用のAudioオブジェクト
let windowOpenSound = null;
let windowOpenSoundBuffer = null;
let windowCloseSound = null;
let windowCloseSoundBuffer = null;

// カーソル音用のAudioオブジェクト
let cursorSound = null;
let cursorSoundBuffer = null;

// 衝突音用のAudioオブジェクト（3D）
let crashSound = null;
let crashSoundBuffer = null;

// チュートリアルBGM用のAudioオブジェクト
let tutorialBGM = null;
let tutorialBGMBuffer = null;
let isTutorialBGMPlaying = false;
let tutorialBGMFadeInterval = null;

// ボタン音の初期化
export function setupButtonSound() {
  if (!state.audioListener) {
    console.error('オーディオリスナーが未初期化');
    return;
  }

  // 通常のAudio（3Dではない）
  buttonSound = new THREE.Audio(state.audioListener);

  const audioLoader = new THREE.AudioLoader();
  audioLoader.load(
    './button1.mp3',
    (buffer) => {
      buttonSoundBuffer = buffer;
      buttonSound.setBuffer(buffer);
      buttonSound.setVolume(0.2);
      console.log('ボタン音声読み込み完了');
    },
    undefined,
    (error) => {
      console.error('ボタン音声ファイルの読み込みエラー:', error);
    }
  );
}

// ボタン音を再生
export function playButtonSound() {
  if (!buttonSound || !buttonSoundBuffer) return;

  // 再生中なら停止して最初から
  if (buttonSound.isPlaying) {
    buttonSound.stop();
  }
  buttonSound.play();
}

// ウィンドウ音の初期化
export function setupWindowSound() {
  if (!state.audioListener) {
    console.error('オーディオリスナーが未初期化');
    return;
  }

  // ウィンドウ開く音
  windowOpenSound = new THREE.Audio(state.audioListener);
  // ウィンドウ閉じる音
  windowCloseSound = new THREE.Audio(state.audioListener);

  const audioLoader = new THREE.AudioLoader();

  // 開く音を読み込み
  audioLoader.load(
    './window1.mp3',
    (buffer) => {
      windowOpenSoundBuffer = buffer;
      windowOpenSound.setBuffer(buffer);
      windowOpenSound.setVolume(0.2);
      console.log('ウィンドウ開く音声読み込み完了');
    },
    undefined,
    (error) => {
      console.error('ウィンドウ開く音声ファイルの読み込みエラー:', error);
    }
  );

  // 閉じる音を読み込み
  audioLoader.load(
    './window2.mp3',
    (buffer) => {
      windowCloseSoundBuffer = buffer;
      windowCloseSound.setBuffer(buffer);
      windowCloseSound.setVolume(0.2);
      console.log('ウィンドウ閉じる音声読み込み完了');
    },
    undefined,
    (error) => {
      console.error('ウィンドウ閉じる音声ファイルの読み込みエラー:', error);
    }
  );
}

// ウィンドウ開く音を再生
export function playWindowOpenSound() {
  if (!windowOpenSound || !windowOpenSoundBuffer) return;

  if (windowOpenSound.isPlaying) {
    windowOpenSound.stop();
  }
  windowOpenSound.play();
}

// ウィンドウ閉じる音を再生
export function playWindowCloseSound() {
  if (!windowCloseSound || !windowCloseSoundBuffer) return;

  if (windowCloseSound.isPlaying) {
    windowCloseSound.stop();
  }
  windowCloseSound.play();
}

// カーソル音の初期化
export function setupCursorSound() {
  if (!state.audioListener) {
    console.error('オーディオリスナーが未初期化');
    return;
  }

  cursorSound = new THREE.Audio(state.audioListener);

  const audioLoader = new THREE.AudioLoader();
  audioLoader.load(
    './cursor.mp3',
    (buffer) => {
      cursorSoundBuffer = buffer;
      cursorSound.setBuffer(buffer);
      cursorSound.setVolume(0.2);
      console.log('カーソル音声読み込み完了');
    },
    undefined,
    (error) => {
      console.error('カーソル音声ファイルの読み込みエラー:', error);
    }
  );
}

// カーソル音を再生
export function playCursorSound() {
  if (!cursorSound || !cursorSoundBuffer) return;

  if (cursorSound.isPlaying) {
    cursorSound.stop();
  }
  cursorSound.play();
}

// 衝突音の初期化（3D音響）
export function setupCrashSound() {
  if (!state.drone || !state.audioListener) {
    console.error('ドローンまたはオーディオリスナーが未初期化');
    return;
  }

  // PositionalAudio（3D音響）
  crashSound = new THREE.PositionalAudio(state.audioListener);

  const audioLoader = new THREE.AudioLoader();
  audioLoader.load(
    './crash.mp3',
    (buffer) => {
      crashSoundBuffer = buffer;
      crashSound.setBuffer(buffer);
      crashSound.setVolume(0.5);
      crashSound.setRefDistance(0.5);
      crashSound.setRolloffFactor(2);
      crashSound.setMaxDistance(10);
      console.log('衝突音声読み込み完了');
    },
    undefined,
    (error) => {
      console.error('衝突音声ファイルの読み込みエラー:', error);
    }
  );

  // ドローンに音声を追加
  state.drone.add(crashSound);
}

// 衝突音を再生
export function playCrashSound() {
  if (!crashSound || !crashSoundBuffer) return;

  if (crashSound.isPlaying) {
    crashSound.stop();
  }
  crashSound.play();
}

// チュートリアルBGMの初期化
export function setupTutorialBGM() {
  if (!state.audioListener) {
    console.error('オーディオリスナーが未初期化');
    return;
  }

  tutorialBGM = new THREE.Audio(state.audioListener);

  const audioLoader = new THREE.AudioLoader();
  audioLoader.load(
    './maou_bgm.mp3',
    (buffer) => {
      tutorialBGMBuffer = buffer;
      tutorialBGM.setBuffer(buffer);
      tutorialBGM.setLoop(true);
      tutorialBGM.setVolume(0.2);
      console.log('チュートリアルBGM読み込み完了');
    },
    undefined,
    (error) => {
      console.error('チュートリアルBGMファイルの読み込みエラー:', error);
    }
  );
}

// チュートリアルBGMを再生
export function playTutorialBGM() {
  if (!tutorialBGM || !tutorialBGMBuffer) return;
  if (isTutorialBGMPlaying) return;

  // フェードアウト中なら停止
  if (tutorialBGMFadeInterval) {
    clearInterval(tutorialBGMFadeInterval);
    tutorialBGMFadeInterval = null;
  }

  tutorialBGM.setVolume(0.2);
  tutorialBGM.play();
  isTutorialBGMPlaying = true;
  console.log('チュートリアルBGM再生開始');
}

// チュートリアルBGMをフェードアウト
export function fadeOutTutorialBGM(duration = 2000) {
  if (!tutorialBGM || !isTutorialBGMPlaying) return;

  const startVolume = tutorialBGM.getVolume();
  const fadeSteps = 20;
  const stepTime = duration / fadeSteps;
  const volumeStep = startVolume / fadeSteps;
  let currentStep = 0;

  tutorialBGMFadeInterval = setInterval(() => {
    currentStep++;
    const newVolume = Math.max(0, startVolume - (volumeStep * currentStep));
    tutorialBGM.setVolume(newVolume);

    if (currentStep >= fadeSteps) {
      clearInterval(tutorialBGMFadeInterval);
      tutorialBGMFadeInterval = null;
      tutorialBGM.stop();
      isTutorialBGMPlaying = false;
      console.log('チュートリアルBGMフェードアウト完了');
    }
  }, stepTime);
}

// ドローン音声の設定
export function setupDroneSound() {
  if (!state.drone || !state.audioListener) {
    console.error('ドローンまたはオーディオリスナーが未初期化');
    return;
  }

  // PositionalAudio作成（距離に応じて音量が変わる3D音響）
  const droneSound = new THREE.PositionalAudio(state.audioListener);

  // オーディオローダーで音声ファイル読み込み
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load(
    './OTO.mp3',
    (buffer) => {
      droneSound.setBuffer(buffer);
      droneSound.setLoop(true); // ループ再生
      droneSound.setVolume(0.7); // 基本音量
      droneSound.setRefDistance(0.5); // 基準距離（この距離で最大音量）
      droneSound.setRolloffFactor(2); // 距離減衰率（大きいほど急激に減衰）
      droneSound.setMaxDistance(10); // 最大聴取距離

      console.log('ドローン音声読み込み完了');
      updateInfo('ドローン音声準備完了');
    },
    (progress) => {
      console.log('音声読み込み中:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
      console.error('音声ファイルの読み込みエラー:', error);
      updateInfo('エラー: 音声ファイルを読み込めませんでした');
    }
  );

  // ドローンに音声を追加
  state.drone.add(droneSound);
  state.setDroneSound(droneSound);
  console.log('ドローンに音声を追加');
}

// ドローンの音のピッチと音量を更新（サイズと移動速度を考慮）
export function updateDroneSoundPitch() {
  if (!state.droneSound || !state.droneSound.isPlaying) return;

  // 起動シーケンス中は独自のピッチ制御があるため、この関数では更新しない
  if (state.isStartingUp || !state.isStartupComplete) return;

  // ミュート中は音量を更新しない
  if (!state.isSoundMuted) {
    // サイズに基づく音量（大きいほど大きい音、小さいほど小さい音）
    // スケール0.3で0.7、スケール1.0で1.0、スケール0.01で0.1を基準
    const volumeFromSize = Math.pow(state.currentDroneScale / 0.3, 0.5) * 0.7;
    // 音量の範囲を0.1〜1.0に制限
    const finalVolume = Math.max(0.1, Math.min(1.0, volumeFromSize));
    state.droneSound.setVolume(finalVolume);
  }

  // サイズに基づく基本ピッチ（大きいほど低い音、小さいほど高い音）
  let basePitchFromSize = Math.pow(0.3 / state.currentDroneScale, 0.5);
  // サイズによるピッチは0.2〜2.7に制限（移動速度による変化の余地を残す）
  basePitchFromSize = Math.max(0.2, Math.min(2.7, basePitchFromSize));

  // 移動速度に基づく追加ピッチ（移動中は加算で高くなる）
  // 速度0.5m/s以上で効果が出始め、最大+0.3まで加算
  const velocityAddition = Math.min(state.droneVelocity * 0.6, 0.3);

  // 最終的なピッチ（加算方式なので必ず移動時の変化が聞こえる）
  const finalPitch = basePitchFromSize + velocityAddition;

  // 最終的なピッチの範囲を0.2〜3.0に制限
  state.droneSound.setPlaybackRate(Math.max(0.2, Math.min(3.0, finalPitch)));
}
