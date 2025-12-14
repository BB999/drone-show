import * as THREE from 'three';
import * as state from './state.js';
import { playWindowOpenSound, playWindowCloseSound, playCursorSound, playButtonSound, playTutorialBGM, fadeOutTutorialBGM } from './sound.js';

// 多言語テキスト定義
const i18n = {
  ja: {
    // 設定ウィンドウ
    settings: {
      title: '設定',
      language: '言語',
      languageDesc: '表示言語を選択',
      deadzone: 'デッドゾーン',
      deadzoneDesc: 'スティック入力の無効範囲',
      acceleration: '加速度',
      accelerationDesc: 'ドローンの加速の強さ',
      friction: '摩擦',
      frictionDesc: '高いほど滑らかに止まる',
      tilt: '傾き量',
      tiltDesc: '移動時のドローンの傾き',
      angularSpeed: '旋回スピード',
      angularSpeedDesc: '左スティック横の回転速度',
      propellerSpeed: 'プロペラ速度',
      propellerSpeedDesc: 'プロペラの回転速度',
      fpvMode: 'FPVモード (実験的機能)',
      fpvModeDesc: 'ドローン視点で操縦',
      laserInstruction: '右コントローラーのレーザーで操作',
      closeInstruction: 'X ボタンで閉じる',
      returnToTitle: 'タイトルに戻る',
      tutorial: 'チュートリアルを受ける',
      default: 'DEFAULT',
      on: 'ON',
      off: 'OFF',
      japanese: '日本語',
      english: 'English'
    },
    // コントローラーガイド
    guide: {
      title: '操作ガイド',
      leftController: '左コントローラー',
      rightController: '右コントローラー',
      stickUpDown: 'スティック↑↓',
      stickLeftRight: 'スティック←→',
      yButton: 'Y ボタン',
      xButton: 'X ボタン',
      aButton: 'A ボタン',
      bButton: 'B ボタン',
      stickPress: 'スティック押込',
      trigger: 'トリガー',
      grip: 'グリップ',
      forwardBackward: '前進 / 後退',
      turnLeftRight: '左旋回 / 右旋回',
      startStop: '起動 / 終了',
      settingsWindow: '設定ウィンドウ',
      collisionToggle: '衝突 ON/OFF',
      speedDown: '速度ダウン',
      grabDrone: 'ドローンを掴む',
      upDown: '上昇 / 下降',
      moveLeftRight: '左移動 / 右移動',
      thisMenu: 'このメニュー',
      volumeToggle: '音量 ON/OFF',
      autoReturn: '自動帰還',
      speedUp: '速度アップ',
      handTracking: 'ハンドトラッキング対応',
      handTrackingDesc: 'ピンチジェスチャーでドローンを掴んで移動・スケール変更',
      bothGrips: '両グリップ同時押し + 左右移動: ドローンサイズ変更',
      closeWithA: 'A ボタンで閉じる',
      footer: 'Quest 3 / Quest Pro 対応 | WebXR Immersive Experience'
    },
    // ステータステキスト
    status: {
      autoReturn: '自動帰還中',
      volumeOn: '音量 ON',
      volumeOff: '音量 OFF',
      collisionOn: '当たり判定 ON',
      collisionOff: '当たり判定 OFF',
      startingUp: '起動中',
      shuttingDown: '終了中',
      trackingLostBoth: 'Controllers Tracking Lost',
      trackingLostLeft: 'Left Controller Tracking Lost',
      trackingLostRight: 'Right Controller Tracking Lost'
    },
    // ウェルカムウィンドウ
    welcome: {
      step: 'チュートリアル①',
      stepEn: 'Tutorial 1',
      title: 'ドローンの世界へようこそ',
      titleEn: 'Welcome to Drone World',
      instruction1: 'コントローラーの前にドローンが配置されます',
      instruction1En: 'Drone will be placed in front of your controller',
      nextWithA: 'A ボタンで次へ',
      nextWithAEn: 'Press A to continue'
    },
    tutorial2: {
      step: 'チュートリアル②',
      stepEn: 'Tutorial 2',
      title: 'ドローンの世界へようこそ',
      titleEn: 'Welcome to Drone World',
      instruction1: 'Aボタンでコントロールガイドを開く',
      instruction2: 'こちらで操作方法を覚えましょう',
      instruction1En: 'Press A button to open Controller Guide',
      instruction2En: 'Learn how to operate here',
      nextWithA: 'A ボタンで開く',
      nextWithAEn: 'Press A to open'
    },
    tutorial3: {
      step: 'チュートリアル③',
      stepEn: 'Tutorial 3',
      title: 'ドローンの世界へようこそ',
      titleEn: 'Welcome to Drone World',
      instruction1: 'Xボタンで各種設定ウィンドウが出ます',
      instruction1En: 'Press X button to open Settings window',
      nextWithA: 'X ボタンで開く',
      nextWithAEn: 'Press X to open'
    },
    tutorial4: {
      step: 'チュートリアル④',
      stepEn: 'Tutorial 4',
      title: 'ドローンの世界へようこそ',
      titleEn: 'Welcome to Drone World',
      instruction1: 'Yボタンでドローンを起動できます',
      instruction2: 'さぁドローンを楽しみましょう!!',
      instruction1En: 'Press Y button to start the Drone',
      instruction2En: 'Let\'s enjoy flying the Drone!!',
      nextWithA: 'Y ボタンで起動',
      nextWithAEn: 'Press Y to start'
    }
  },
  en: {
    // Settings window
    settings: {
      title: 'SETTINGS',
      language: 'Language',
      languageDesc: 'Select display language',
      deadzone: 'Deadzone',
      deadzoneDesc: 'Stick input dead zone',
      acceleration: 'Acceleration',
      accelerationDesc: 'Drone acceleration strength',
      friction: 'Friction',
      frictionDesc: 'Higher = smoother stop',
      tilt: 'Tilt Amount',
      tiltDesc: 'Drone tilt during movement',
      angularSpeed: 'Turn Speed',
      angularSpeedDesc: 'Left stick horizontal rotation',
      propellerSpeed: 'Propeller Speed',
      propellerSpeedDesc: 'Propeller rotation speed',
      fpvMode: 'FPV Mode (Experimental)',
      fpvModeDesc: 'Fly from drone perspective',
      laserInstruction: 'Use right controller laser to operate',
      closeInstruction: 'Press X to close',
      returnToTitle: 'Return to Title',
      tutorial: 'Start Tutorial',
      default: 'DEFAULT',
      on: 'ON',
      off: 'OFF',
      japanese: '日本語',
      english: 'English'
    },
    // Controller guide
    guide: {
      title: 'CONTROLLER GUIDE',
      leftController: 'Left Controller',
      rightController: 'Right Controller',
      stickUpDown: 'Stick ↑↓',
      stickLeftRight: 'Stick ←→',
      yButton: 'Y Button',
      xButton: 'X Button',
      aButton: 'A Button',
      bButton: 'B Button',
      stickPress: 'Stick Press',
      trigger: 'Trigger',
      grip: 'Grip',
      forwardBackward: 'Forward / Backward',
      turnLeftRight: 'Turn Left / Right',
      startStop: 'Start / Stop',
      settingsWindow: 'Settings Window',
      collisionToggle: 'Collision ON/OFF',
      speedDown: 'Speed Down',
      grabDrone: 'Grab Drone',
      upDown: 'Up / Down',
      moveLeftRight: 'Move Left / Right',
      thisMenu: 'This Menu',
      volumeToggle: 'Volume ON/OFF',
      autoReturn: 'Auto Return',
      speedUp: 'Speed Up',
      handTracking: 'Hand Tracking Supported',
      handTrackingDesc: 'Pinch gesture to grab drone and move/scale',
      bothGrips: 'Both Grips + Move: Change Drone Size',
      closeWithA: 'Press A to close',
      footer: 'Quest 3 / Quest Pro Compatible | WebXR Immersive Experience'
    },
    // Status text
    status: {
      autoReturn: 'Auto Returning',
      volumeOn: 'Volume On',
      volumeOff: 'Volume Off',
      collisionOn: 'Collision On',
      collisionOff: 'Collision Off',
      startingUp: 'STARTING UP',
      shuttingDown: 'SHUTTING DOWN',
      trackingLostBoth: 'Controllers Tracking Lost',
      trackingLostLeft: 'Left Controller Tracking Lost',
      trackingLostRight: 'Right Controller Tracking Lost'
    },
    // Welcome window
    welcome: {
      step: 'Tutorial 1',
      stepEn: 'Tutorial 1',
      title: 'Welcome to Drone World',
      titleEn: 'Welcome to Drone World',
      instruction1: 'Drone will be placed in front of your controller',
      instruction1En: 'Drone will be placed in front of your controller',
      nextWithA: 'Press A to continue',
      nextWithAEn: 'Press A to continue'
    },
    tutorial2: {
      step: 'Tutorial 2',
      stepEn: 'Tutorial 2',
      title: 'Welcome to Drone World',
      titleEn: 'Welcome to Drone World',
      instruction1: 'Press A button to open Controller Guide',
      instruction1En: 'Press A button to open Controller Guide',
      nextWithA: 'Press A to open',
      nextWithAEn: 'Press A to open'
    },
    tutorial3: {
      step: 'Tutorial 3',
      stepEn: 'Tutorial 3',
      title: 'Welcome to Drone World',
      titleEn: 'Welcome to Drone World',
      instruction1: 'Press X button to open Settings window',
      instruction1En: 'Press X button to open Settings window',
      nextWithA: 'Press X to open',
      nextWithAEn: 'Press X to open'
    },
    tutorial4: {
      step: 'Tutorial 4',
      stepEn: 'Tutorial 4',
      title: 'Welcome to Drone World',
      titleEn: 'Welcome to Drone World',
      instruction1: 'Press Y button to start the Drone',
      instruction2: 'Let\'s enjoy flying the Drone!!',
      instruction1En: 'Press Y button to start the Drone',
      instruction2En: 'Let\'s enjoy flying the Drone!!',
      nextWithA: 'Press Y to start',
      nextWithAEn: 'Press Y to start'
    }
  }
};

// 現在の言語でテキストを取得するヘルパー関数
export function t(category, key) {
  const lang = state.currentLanguage || 'ja';
  return i18n[lang][category][key] || i18n['ja'][category][key] || key;
}

// 自動帰還中のテキストを作成
export function createAutoReturnText() {
  if (state.autoReturnText) return;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');

  context.fillStyle = '#00ff00';
  context.font = 'bold 60px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(t('status', 'autoReturn'), canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const geometry = new THREE.PlaneGeometry(0.15, 0.0375);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  state.scene.add(mesh);
  state.setAutoReturnText(mesh);
}

// 自動帰還中のコントローラーテキストを作成（右）
export function createAutoReturnRightControllerText() {
  if (state.autoReturnRightControllerText) return;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');

  context.fillStyle = '#00ff00';
  context.font = 'bold 60px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(t('status', 'autoReturn'), canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const geometry = new THREE.PlaneGeometry(0.15, 0.0375);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  state.scene.add(mesh);
  state.setAutoReturnRightControllerText(mesh);
}

// 自動帰還中のコントローラーテキストを作成（左）
export function createAutoReturnLeftControllerText() {
  if (state.autoReturnLeftControllerText) return;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');

  context.fillStyle = '#00ff00';
  context.font = 'bold 60px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(t('status', 'autoReturn'), canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const geometry = new THREE.PlaneGeometry(0.15, 0.0375);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  state.scene.add(mesh);
  state.setAutoReturnLeftControllerText(mesh);
}

// 自動帰還中のテキストを削除
export function removeAutoReturnText() {
  if (state.autoReturnText) {
    state.scene.remove(state.autoReturnText);
    state.autoReturnText.geometry.dispose();
    state.autoReturnText.material.dispose();
    state.autoReturnText.material.map.dispose();
    state.setAutoReturnText(null);
  }
  if (state.autoReturnRightControllerText) {
    state.scene.remove(state.autoReturnRightControllerText);
    state.autoReturnRightControllerText.geometry.dispose();
    state.autoReturnRightControllerText.material.dispose();
    state.autoReturnRightControllerText.material.map.dispose();
    state.setAutoReturnRightControllerText(null);
  }
  if (state.autoReturnLeftControllerText) {
    state.scene.remove(state.autoReturnLeftControllerText);
    state.autoReturnLeftControllerText.geometry.dispose();
    state.autoReturnLeftControllerText.material.dispose();
    state.autoReturnLeftControllerText.material.map.dispose();
    state.setAutoReturnLeftControllerText(null);
  }
}

// 自動帰還中のテキスト位置を更新
export function updateAutoReturnText() {
  if (state.autoReturnText) {
    const cameraPos = new THREE.Vector3();
    state.camera.getWorldPosition(cameraPos);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(state.camera.quaternion);
    const down = new THREE.Vector3(0, -1, 0).applyQuaternion(state.camera.quaternion);

    const textPos = cameraPos.clone()
      .add(forward.multiplyScalar(0.5))
      .add(right.multiplyScalar(0.2))
      .add(down.multiplyScalar(0.15));

    state.autoReturnText.position.copy(textPos);
    state.autoReturnText.lookAt(state.camera.position);
  }

  if (state.autoReturnRightControllerText) {
    state.autoReturnRightControllerText.visible = false;
  }
}

// 速度レベル表示を作成
export function createSpeedText() {
  if (state.speedText) {
    state.scene.remove(state.speedText);
    state.speedText.geometry.dispose();
    state.speedText.material.dispose();
    state.speedText.material.map.dispose();
    state.setSpeedText(null);
  }
  if (state.speedRightControllerText) {
    state.scene.remove(state.speedRightControllerText);
    state.speedRightControllerText.geometry.dispose();
    state.speedRightControllerText.material.dispose();
    state.speedRightControllerText.material.map.dispose();
    state.setSpeedRightControllerText(null);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');

  context.fillStyle = '#ffff00';
  context.font = 'bold 60px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('Speed ' + state.speedLevel, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);

  const geometry1 = new THREE.PlaneGeometry(0.2, 0.05);
  const material1 = new THREE.MeshBasicMaterial({
    map: texture.clone(),
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const speedText = new THREE.Mesh(geometry1, material1);
  state.scene.add(speedText);
  state.setSpeedText(speedText);

  const geometry2 = new THREE.PlaneGeometry(0.2, 0.05);
  const material2 = new THREE.MeshBasicMaterial({
    map: texture.clone(),
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const speedRightText = new THREE.Mesh(geometry2, material2);
  state.scene.add(speedRightText);
  state.setSpeedRightControllerText(speedRightText);

  // 既存のタイマーをクリア
  if (state.speedTextTimerId) {
    clearTimeout(state.speedTextTimerId);
  }

  const timerId = setTimeout(() => {
    if (state.speedText) {
      state.scene.remove(state.speedText);
      state.speedText.geometry.dispose();
      state.speedText.material.dispose();
      state.speedText.material.map.dispose();
      state.setSpeedText(null);
    }
    if (state.speedRightControllerText) {
      state.scene.remove(state.speedRightControllerText);
      state.speedRightControllerText.geometry.dispose();
      state.speedRightControllerText.material.dispose();
      state.speedRightControllerText.material.map.dispose();
      state.setSpeedRightControllerText(null);
    }
    state.setSpeedTextTimerId(null);
  }, 3000);

  state.setSpeedTextTimerId(timerId);
}

// 速度レベル表示の位置を更新
export function updateSpeedText() {
  if (state.speedText) {
    const cameraPos = new THREE.Vector3();
    state.camera.getWorldPosition(cameraPos);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(state.camera.quaternion);
    const down = new THREE.Vector3(0, -1, 0).applyQuaternion(state.camera.quaternion);

    const textPos = cameraPos.clone()
      .add(forward.multiplyScalar(0.5))
      .add(right.multiplyScalar(0.2))
      .add(down.multiplyScalar(0.2));

    state.speedText.position.copy(textPos);
    state.speedText.lookAt(state.camera.position);
  }

  if (state.speedRightControllerText) {
    state.speedRightControllerText.visible = false;
  }
}

// 音量オンオフ表示を作成
export function createVolumeText(isOn) {
  if (state.volumeText) {
    state.scene.remove(state.volumeText);
    state.volumeText.geometry.dispose();
    state.volumeText.material.dispose();
    state.volumeText.material.map.dispose();
    state.setVolumeText(null);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');

  context.fillStyle = '#00ff00';
  context.font = 'bold 60px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const text = isOn ? t('status', 'volumeOn') : t('status', 'volumeOff');
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const geometry = new THREE.PlaneGeometry(0.2, 0.05);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const volumeText = new THREE.Mesh(geometry, material);
  state.scene.add(volumeText);
  state.setVolumeText(volumeText);

  setTimeout(() => {
    if (state.volumeText) {
      state.scene.remove(state.volumeText);
      state.volumeText.geometry.dispose();
      state.volumeText.material.dispose();
      state.volumeText.material.map.dispose();
      state.setVolumeText(null);
    }
  }, 3000);
}

// 音量オンオフ表示の位置を更新
export function updateVolumeText() {
  if (state.volumeText) {
    const cameraPos = new THREE.Vector3();
    state.camera.getWorldPosition(cameraPos);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(state.camera.quaternion);
    const down = new THREE.Vector3(0, -1, 0).applyQuaternion(state.camera.quaternion);

    const textPos = cameraPos.clone()
      .add(forward.multiplyScalar(0.5))
      .add(right.multiplyScalar(0.2))
      .add(down.multiplyScalar(0.25));

    state.volumeText.position.copy(textPos);
    state.volumeText.lookAt(state.camera.position);
  }
}

// 当たり判定オンオフ表示を作成
export function createCollisionText(isOn) {
  if (state.collisionText) {
    state.scene.remove(state.collisionText);
    state.collisionText.geometry.dispose();
    state.collisionText.material.dispose();
    state.collisionText.material.map.dispose();
    state.setCollisionText(null);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');

  context.fillStyle = '#00ff00';
  context.font = 'bold 60px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  const text = isOn ? t('status', 'collisionOn') : t('status', 'collisionOff');
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const geometry = new THREE.PlaneGeometry(0.2, 0.05);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const collisionText = new THREE.Mesh(geometry, material);
  state.scene.add(collisionText);
  state.setCollisionText(collisionText);

  setTimeout(() => {
    if (state.collisionText) {
      state.scene.remove(state.collisionText);
      state.collisionText.geometry.dispose();
      state.collisionText.material.dispose();
      state.collisionText.material.map.dispose();
      state.setCollisionText(null);
    }
  }, 3000);
}

// 当たり判定オンオフ表示の位置を更新
export function updateCollisionText() {
  if (state.collisionText) {
    const cameraPos = new THREE.Vector3();
    state.camera.getWorldPosition(cameraPos);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
    const left = new THREE.Vector3(-1, 0, 0).applyQuaternion(state.camera.quaternion);
    const down = new THREE.Vector3(0, -1, 0).applyQuaternion(state.camera.quaternion);

    const textPos = cameraPos.clone()
      .add(forward.multiplyScalar(0.5))
      .add(left.multiplyScalar(0.2))
      .add(down.multiplyScalar(0.25));

    state.collisionText.position.copy(textPos);
    state.collisionText.lookAt(state.camera.position);
  }
}

// トラッキングロスト表示を作成
export function createTrackingLostText() {
  if (state.trackingLostText) {
    state.scene.remove(state.trackingLostText);
    state.trackingLostText.geometry.dispose();
    state.trackingLostText.material.dispose();
    state.trackingLostText.material.map.dispose();
    state.setTrackingLostText(null);
  }

  let message = '';
  if (!state.isLeftControllerTracked && !state.isRightControllerTracked) {
    message = 'Controllers Tracking Lost';
  } else if (!state.isLeftControllerTracked) {
    message = 'Left Controller Tracking Lost';
  } else if (!state.isRightControllerTracked) {
    message = 'Right Controller Tracking Lost';
  } else {
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const context = canvas.getContext('2d');

  context.fillStyle = '#ff0000';
  context.font = 'bold 60px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(message, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const geometry = new THREE.PlaneGeometry(0.4, 0.05);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const trackingLostText = new THREE.Mesh(geometry, material);
  state.scene.add(trackingLostText);
  state.setTrackingLostText(trackingLostText);
}

// トラッキングロスト表示を削除
export function removeTrackingLostText() {
  if (state.trackingLostText) {
    state.scene.remove(state.trackingLostText);
    state.trackingLostText.geometry.dispose();
    state.trackingLostText.material.dispose();
    state.trackingLostText.material.map.dispose();
    state.setTrackingLostText(null);
  }
}

// トラッキングロスト表示の位置を更新
export function updateTrackingLostText() {
  if (state.trackingLostText) {
    const cameraPos = new THREE.Vector3();
    state.camera.getWorldPosition(cameraPos);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
    const down = new THREE.Vector3(0, -1, 0).applyQuaternion(state.camera.quaternion);

    const textPos = cameraPos.clone()
      .add(forward.multiplyScalar(0.5))
      .add(down.multiplyScalar(0.3));

    state.trackingLostText.position.copy(textPos);
    state.trackingLostText.lookAt(state.camera.position);
  }
}

// シーケンス状態表示を作成
export function createSequenceStatusText(message) {
  if (state.sequenceStatusText) {
    state.scene.remove(state.sequenceStatusText);
    state.sequenceStatusText.geometry.dispose();
    state.sequenceStatusText.material.dispose();
    state.sequenceStatusText.material.map.dispose();
    state.setSequenceStatusText(null);
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  context.font = 'bold 60px Arial';
  const metrics = context.measureText(message);
  const textWidth = metrics.width;
  const textHeight = 60;

  const padding = 10;
  canvas.width = textWidth + padding * 2;
  canvas.height = textHeight + padding * 2;

  context.font = 'bold 60px Arial';
  context.fillStyle = '#00ff00';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(message, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const aspectRatio = canvas.width / canvas.height;
  const planeHeight = 0.05;
  const planeWidth = planeHeight * aspectRatio;
  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const sequenceStatusText = new THREE.Mesh(geometry, material);
  state.scene.add(sequenceStatusText);
  state.setSequenceStatusText(sequenceStatusText);
}

// シーケンス状態表示を削除
export function removeSequenceStatusText() {
  if (state.sequenceStatusText) {
    state.scene.remove(state.sequenceStatusText);
    state.sequenceStatusText.geometry.dispose();
    state.sequenceStatusText.material.dispose();
    state.sequenceStatusText.material.map.dispose();
    state.setSequenceStatusText(null);
  }
}

// シーケンス状態表示の位置を更新
export function updateSequenceStatusText() {
  if (state.sequenceStatusText) {
    const cameraPos = new THREE.Vector3();
    state.camera.getWorldPosition(cameraPos);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
    const down = new THREE.Vector3(0, -1, 0).applyQuaternion(state.camera.quaternion);

    const textPos = cameraPos.clone()
      .add(forward.multiplyScalar(0.5))
      .add(down.multiplyScalar(0.2));

    state.sequenceStatusText.position.copy(textPos);
    state.sequenceStatusText.lookAt(state.camera.position);
  }
}

// コントローラーガイドメニュー用のキャンバスとテクスチャを保持
let guideMenuCanvas = null;
let guideMenuTexture = null;

// コントローラーガイドメニューを作成
export function createControllerGuideMenu() {
  if (state.controllerGuideMenu) {
    return;
  }

  // キャンバスでメニュー全体を描画
  guideMenuCanvas = document.createElement('canvas');
  guideMenuCanvas.width = 800;
  guideMenuCanvas.height = 820;
  const canvas = guideMenuCanvas;
  const ctx = canvas.getContext('2d');

  // キャンバスをクリア（透明）
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景（半透明）
  ctx.fillStyle = 'rgba(10, 10, 26, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 枠線（シアン）
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  // 内側の光彩効果
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(0, 200, 255, 0.1)');
  gradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.05)');
  gradient.addColorStop(1, 'rgba(0, 200, 255, 0.1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(4, 4, canvas.width - 8, canvas.height - 8);

  // タイトル
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = '#00c8ff';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 200, 255, 0.8)';
  ctx.shadowBlur = 20;
  ctx.fillText(t('guide', 'title'), canvas.width / 2, 60);
  ctx.shadowBlur = 0;

  // 区切り線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 90);
  ctx.lineTo(canvas.width - 50, 90);
  ctx.stroke();

  // 左コントローラーセクション
  const leftX = 200;
  let y = 140;

  // 左コントローラータイトル（アイコン風の背景付き）
  const iconGradient = ctx.createLinearGradient(leftX - 120, y, leftX + 120, y + 30);
  iconGradient.addColorStop(0, '#00c8ff');
  iconGradient.addColorStop(1, '#ff6b6b');
  ctx.fillStyle = iconGradient;
  ctx.beginPath();
  ctx.roundRect(leftX - 100, y - 5, 200, 35, 8);
  ctx.fill();

  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#0a0a1a';
  ctx.textAlign = 'center';
  ctx.fillText(t('guide', 'leftController'), leftX, y + 20);

  y += 55;

  // 左コントローラーの操作一覧
  const leftControls = [
    { button: t('guide', 'stickUpDown'), desc: t('guide', 'forwardBackward') },
    { button: t('guide', 'stickLeftRight'), desc: t('guide', 'turnLeftRight') },
    { button: t('guide', 'yButton'), desc: t('guide', 'startStop') },
    { button: t('guide', 'xButton'), desc: t('guide', 'settingsWindow') },
    { button: t('guide', 'stickPress'), desc: t('guide', 'collisionToggle') },
    { button: t('guide', 'trigger'), desc: t('guide', 'speedDown') },
    { button: t('guide', 'grip'), desc: t('guide', 'grabDrone') }
  ];

  leftControls.forEach((item) => {
    // ボタンラベルの背景
    const btnGradient = ctx.createLinearGradient(leftX - 95, y, leftX + 35, y);
    btnGradient.addColorStop(0, 'rgba(0, 200, 255, 0.2)');
    btnGradient.addColorStop(1, 'rgba(255, 107, 107, 0.2)');
    ctx.fillStyle = btnGradient;
    ctx.beginPath();
    ctx.roundRect(leftX - 95, y - 2, 130, 28, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#00c8ff';
    ctx.textAlign = 'center';
    ctx.fillText(item.button, leftX - 30, y + 18);

    ctx.font = '18px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(item.desc, leftX + 45, y + 18);

    y += 38;
  });

  // 右コントローラーセクション
  const rightX = 600;
  y = 140;

  // 右コントローラータイトル
  const rightIconGradient = ctx.createLinearGradient(rightX - 120, y, rightX + 120, y + 30);
  rightIconGradient.addColorStop(0, '#00c8ff');
  rightIconGradient.addColorStop(1, '#ff6b6b');
  ctx.fillStyle = rightIconGradient;
  ctx.beginPath();
  ctx.roundRect(rightX - 100, y - 5, 200, 35, 8);
  ctx.fill();

  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#0a0a1a';
  ctx.textAlign = 'center';
  ctx.fillText(t('guide', 'rightController'), rightX, y + 20);

  y += 55;

  // 右コントローラーの操作一覧
  const rightControls = [
    { button: t('guide', 'stickUpDown'), desc: t('guide', 'upDown') },
    { button: t('guide', 'stickLeftRight'), desc: t('guide', 'moveLeftRight') },
    { button: t('guide', 'aButton'), desc: t('guide', 'thisMenu') },
    { button: t('guide', 'stickPress'), desc: t('guide', 'volumeToggle') },
    { button: t('guide', 'bButton'), desc: t('guide', 'autoReturn') },
    { button: t('guide', 'trigger'), desc: t('guide', 'speedUp') },
    { button: t('guide', 'grip'), desc: t('guide', 'grabDrone') }
  ];

  rightControls.forEach((item) => {
    // ボタンラベルの背景
    const btnGradient = ctx.createLinearGradient(rightX - 95, y, rightX + 35, y);
    btnGradient.addColorStop(0, 'rgba(0, 200, 255, 0.2)');
    btnGradient.addColorStop(1, 'rgba(255, 107, 107, 0.2)');
    ctx.fillStyle = btnGradient;
    ctx.beginPath();
    ctx.roundRect(rightX - 95, y - 2, 130, 28, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#00c8ff';
    ctx.textAlign = 'center';
    ctx.fillText(item.button, rightX - 30, y + 18);

    ctx.font = '18px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(item.desc, rightX + 45, y + 18);

    y += 38;
  });

  // ハンドトラッキング情報
  ctx.fillStyle = 'rgba(0, 255, 150, 0.1)';
  ctx.strokeStyle = 'rgba(0, 255, 150, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(50, 520, canvas.width - 100, 80, 12);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = '#00ff96';
  ctx.textAlign = 'center';
  ctx.fillText(t('guide', 'handTracking'), canvas.width / 2, 555);

  ctx.font = '18px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(t('guide', 'handTrackingDesc'), canvas.width / 2, 585);

  // 両グリップ操作
  ctx.fillStyle = 'rgba(255, 200, 0, 0.1)';
  ctx.strokeStyle = 'rgba(255, 200, 0, 0.3)';
  ctx.beginPath();
  ctx.roundRect(50, 620, canvas.width - 100, 60, 12);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#ffc800';
  ctx.fillText(t('guide', 'bothGrips'), canvas.width / 2, 660);

  // 区切り線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 710);
  ctx.lineTo(canvas.width - 50, 710);
  ctx.stroke();

  // 閉じる説明
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#ffff00';
  ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText(t('guide', 'closeWithA'), canvas.width / 2, 760);
  ctx.shadowBlur = 0;

  // フッター
  ctx.font = '16px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText(t('guide', 'footer'), canvas.width / 2, 800);

  // テクスチャ作成
  guideMenuTexture = new THREE.CanvasTexture(canvas);
  guideMenuTexture.needsUpdate = true;

  // メッシュ作成
  const aspectRatio = canvas.width / canvas.height;
  const menuHeight = 0.4;
  const menuWidth = menuHeight * aspectRatio;
  const geometry = new THREE.PlaneGeometry(menuWidth, menuHeight);
  const material = new THREE.MeshBasicMaterial({
    map: guideMenuTexture,
    transparent: true,
    side: THREE.DoubleSide
  });

  const menuMesh = new THREE.Mesh(geometry, material);
  menuMesh.scale.set(0.01, 0.01, 0.01); // 最初は小さく
  menuMesh.material.opacity = 0;
  state.scene.add(menuMesh);
  state.setControllerGuideMenu(menuMesh);
  state.setIsControllerGuideVisible(true);

  // アニメーション開始
  state.setControllerGuideAnimProgress(0);
  state.setControllerGuideAnimating(true);
  state.setControllerGuideAnimDirection(1);
}

// コントローラーガイドメニューを再描画（ボタン状態を反映）
export function redrawControllerGuideMenu(pressedButtons) {
  if (!guideMenuCanvas || !guideMenuTexture) return;

  const canvas = guideMenuCanvas;
  const ctx = canvas.getContext('2d');

  // キャンバスをクリア（透明）
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景（半透明）
  ctx.fillStyle = 'rgba(10, 10, 26, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 枠線（シアン）
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  // 内側の光彩効果
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(0, 200, 255, 0.1)');
  gradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.05)');
  gradient.addColorStop(1, 'rgba(0, 200, 255, 0.1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(4, 4, canvas.width - 8, canvas.height - 8);

  // タイトル
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = '#00c8ff';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 200, 255, 0.8)';
  ctx.shadowBlur = 20;
  ctx.fillText(t('guide', 'title'), canvas.width / 2, 60);
  ctx.shadowBlur = 0;

  // 区切り線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 90);
  ctx.lineTo(canvas.width - 50, 90);
  ctx.stroke();


  // 左コントローラーセクション
  const leftX = 200;
  let y = 140;

  // 左コントローラータイトル
  const iconGradient = ctx.createLinearGradient(leftX - 120, y, leftX + 120, y + 30);
  iconGradient.addColorStop(0, '#00c8ff');
  iconGradient.addColorStop(1, '#ff6b6b');
  ctx.fillStyle = iconGradient;
  ctx.beginPath();
  ctx.roundRect(leftX - 100, y - 5, 200, 35, 8);
  ctx.fill();

  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#0a0a1a';
  ctx.textAlign = 'center';
  ctx.fillText(t('guide', 'leftController'), leftX, y + 20);

  y += 55;

  // 左コントローラーの操作一覧
  const leftControls = [
    { button: t('guide', 'stickUpDown'), desc: t('guide', 'forwardBackward'), key: 'leftStickY' },
    { button: t('guide', 'stickLeftRight'), desc: t('guide', 'turnLeftRight'), key: 'leftStickX' },
    { button: t('guide', 'yButton'), desc: t('guide', 'startStop'), key: 'leftX' },
    { button: t('guide', 'xButton'), desc: t('guide', 'settingsWindow'), key: 'leftY' },
    { button: t('guide', 'stickPress'), desc: t('guide', 'collisionToggle'), key: 'leftStickPress' },
    { button: t('guide', 'trigger'), desc: t('guide', 'speedDown'), key: 'leftTrigger' },
    { button: t('guide', 'grip'), desc: t('guide', 'grabDrone'), key: 'leftGrip' }
  ];

  leftControls.forEach((item) => {
    const isPressed = pressedButtons[item.key];

    // ボタンラベルの背景
    if (isPressed) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
    } else {
      const btnGradient = ctx.createLinearGradient(leftX - 95, y, leftX + 35, y);
      btnGradient.addColorStop(0, 'rgba(0, 200, 255, 0.2)');
      btnGradient.addColorStop(1, 'rgba(255, 107, 107, 0.2)');
      ctx.fillStyle = btnGradient;
    }
    ctx.beginPath();
    ctx.roundRect(leftX - 95, y - 2, 130, 28, 6);
    ctx.fill();
    ctx.strokeStyle = isPressed ? 'rgba(255, 255, 0, 0.9)' : 'rgba(0, 200, 255, 0.5)';
    ctx.lineWidth = isPressed ? 2 : 1;
    ctx.stroke();

    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = isPressed ? '#000000' : '#00c8ff';
    ctx.textAlign = 'center';
    ctx.fillText(item.button, leftX - 30, y + 18);

    ctx.font = '18px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(item.desc, leftX + 45, y + 18);

    y += 38;
  });

  // 右コントローラーセクション
  const rightX = 600;
  y = 140;

  // 右コントローラータイトル
  const rightIconGradient = ctx.createLinearGradient(rightX - 120, y, rightX + 120, y + 30);
  rightIconGradient.addColorStop(0, '#00c8ff');
  rightIconGradient.addColorStop(1, '#ff6b6b');
  ctx.fillStyle = rightIconGradient;
  ctx.beginPath();
  ctx.roundRect(rightX - 100, y - 5, 200, 35, 8);
  ctx.fill();

  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#0a0a1a';
  ctx.textAlign = 'center';
  ctx.fillText(t('guide', 'rightController'), rightX, y + 20);

  y += 55;

  // 右コントローラーの操作一覧
  const rightControls = [
    { button: t('guide', 'stickUpDown'), desc: t('guide', 'upDown'), key: 'rightStickY' },
    { button: t('guide', 'stickLeftRight'), desc: t('guide', 'moveLeftRight'), key: 'rightStickX' },
    { button: t('guide', 'aButton'), desc: t('guide', 'thisMenu'), key: 'rightA' },
    { button: t('guide', 'stickPress'), desc: t('guide', 'volumeToggle'), key: 'rightStickPress' },
    { button: t('guide', 'bButton'), desc: t('guide', 'autoReturn'), key: 'rightB' },
    { button: t('guide', 'trigger'), desc: t('guide', 'speedUp'), key: 'rightTrigger' },
    { button: t('guide', 'grip'), desc: t('guide', 'grabDrone'), key: 'rightGrip' }
  ];

  rightControls.forEach((item) => {
    const isPressed = pressedButtons[item.key];

    // ボタンラベルの背景
    if (isPressed) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
    } else {
      const btnGradient = ctx.createLinearGradient(rightX - 95, y, rightX + 35, y);
      btnGradient.addColorStop(0, 'rgba(0, 200, 255, 0.2)');
      btnGradient.addColorStop(1, 'rgba(255, 107, 107, 0.2)');
      ctx.fillStyle = btnGradient;
    }
    ctx.beginPath();
    ctx.roundRect(rightX - 95, y - 2, 130, 28, 6);
    ctx.fill();
    ctx.strokeStyle = isPressed ? 'rgba(255, 255, 0, 0.9)' : 'rgba(0, 200, 255, 0.5)';
    ctx.lineWidth = isPressed ? 2 : 1;
    ctx.stroke();

    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = isPressed ? '#000000' : '#00c8ff';
    ctx.textAlign = 'center';
    ctx.fillText(item.button, rightX - 30, y + 18);

    ctx.font = '18px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(item.desc, rightX + 45, y + 18);

    y += 38;
  });

  // 両グリップ操作（先に表示）
  const bothGripsPressed = pressedButtons.leftGrip && pressedButtons.rightGrip;

  ctx.fillStyle = bothGripsPressed ? 'rgba(255, 255, 0, 0.4)' : 'rgba(255, 200, 0, 0.1)';
  ctx.strokeStyle = bothGripsPressed ? 'rgba(255, 255, 0, 0.9)' : 'rgba(255, 200, 0, 0.3)';
  ctx.lineWidth = bothGripsPressed ? 3 : 2;
  ctx.beginPath();
  ctx.roundRect(50, 520, canvas.width - 100, 60, 12);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = bothGripsPressed ? '#000000' : '#ffc800';
  ctx.textAlign = 'center';
  ctx.fillText(t('guide', 'bothGrips'), canvas.width / 2, 558);

  // ハンドトラッキング情報
  ctx.fillStyle = 'rgba(0, 255, 150, 0.1)';
  ctx.strokeStyle = 'rgba(0, 255, 150, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(50, 600, canvas.width - 100, 80, 12);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = '#00ff96';
  ctx.textAlign = 'center';
  ctx.fillText(t('guide', 'handTracking'), canvas.width / 2, 635);

  ctx.font = '18px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(t('guide', 'handTrackingDesc'), canvas.width / 2, 665);

  // 区切り線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 710);
  ctx.lineTo(canvas.width - 50, 710);
  ctx.stroke();

  // 閉じる説明
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#ffff00';
  ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText(t('guide', 'closeWithA'), canvas.width / 2, 760);
  ctx.shadowBlur = 0;

  // フッター
  ctx.font = '16px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText(t('guide', 'footer'), canvas.width / 2, 800);

  // テクスチャを更新
  guideMenuTexture.needsUpdate = true;
}

// コントローラーガイドメニューを削除（アニメーション開始）
export function removeControllerGuideMenu() {
  if (state.controllerGuideMenu && !state.controllerGuideAnimating) {
    // 閉じるアニメーションを開始
    state.setControllerGuideAnimProgress(1);
    state.setControllerGuideAnimating(true);
    state.setControllerGuideAnimDirection(-1);
    state.setIsControllerGuideVisible(false);
  }
}

// コントローラーガイドメニューを実際に削除（アニメーション完了後に呼ばれる）
function destroyControllerGuideMenu() {
  if (state.controllerGuideMenu) {
    state.scene.remove(state.controllerGuideMenu);
    state.controllerGuideMenu.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    });
    state.setControllerGuideMenu(null);
    guideMenuCanvas = null;
    guideMenuTexture = null;
  }
}

// コントローラーガイドメニューをトグル
export function toggleControllerGuideMenu() {
  // アニメーション中は操作を受け付けない
  if (state.controllerGuideAnimating) return;

  if (state.isControllerGuideVisible || state.controllerGuideMenu) {
    removeControllerGuideMenu();
    playWindowCloseSound();
  } else {
    createControllerGuideMenu();
    playWindowOpenSound();
  }
}

// 設定メニュー用のキャンバスとテクスチャを保持
let settingsMenuCanvas = null;
let settingsMenuTexture = null;
let settingsMenuWidth = 0;
let settingsMenuHeight = 0;

// ボタンの当たり判定領域を保存
let settingsButtonAreas = [];

// 設定をlocalStorageに保存
function saveSettingToStorage(key, value) {
  const settings = JSON.parse(localStorage.getItem('droneSettings') || '{}');
  settings[key] = value;
  localStorage.setItem('droneSettings', JSON.stringify(settings));
}

// localStorageから設定を読み込んで適用
export function loadSettingsFromStorage() {
  const settings = JSON.parse(localStorage.getItem('droneSettings') || '{}');

  settingsItems.forEach(item => {
    if (settings[item.key] !== undefined) {
      item.setValue(settings[item.key]);
    }
  });
}

// 設定項目の定義（動的に名前と説明を取得）
const settingsItems = [
  {
    nameKey: 'language',
    descKey: 'languageDesc',
    key: 'language',
    type: 'language',
    getValue: () => state.currentLanguage,
    setValue: (v) => state.setCurrentLanguage(v),
    defaultValue: 'ja'
  },
  {
    nameKey: 'deadzone',
    descKey: 'deadzoneDesc',
    key: 'deadzone',
    type: 'value',
    getValue: () => state.stickDeadzone,
    setValue: (v) => state.setStickDeadzone(v),
    defaultValue: 0.15,
    min: 0.01,
    max: 0.35,
    step: 0.01,
    format: (v) => (v * 100).toFixed(0) + '%'
  },
  {
    nameKey: 'acceleration',
    descKey: 'accelerationDesc',
    key: 'acceleration',
    type: 'value',
    getValue: () => state.acceleration,
    setValue: (v) => state.setAcceleration(v),
    getDefaultValue: () => {
      // 速度レベルとサイズに応じたデフォルト値を計算
      const speedMultiplier = 0.05 + (state.speedLevel - 1) * (4.0 - 0.05) / 29;
      const sizeMultiplier = Math.pow(state.currentDroneScale / 0.3, 0.5);
      const clampedSizeMultiplier = Math.max(0.5, Math.min(2.0, sizeMultiplier));
      return state.baseAcceleration * speedMultiplier * clampedSizeMultiplier;
    },
    min: 0.0001,
    max: 0.005,
    step: 0.0001,
    format: (v) => (v * 1000).toFixed(1)
  },
  {
    nameKey: 'friction',
    descKey: 'frictionDesc',
    key: 'friction',
    type: 'value',
    getValue: () => state.friction,
    setValue: (v) => {
      state.setFriction(v);
      state.setAngularFriction(v);
    },
    defaultValue: 0.965,
    min: 0.90,
    max: 0.99,
    step: 0.01,
    format: (v) => v.toFixed(2)
  },
  {
    nameKey: 'tilt',
    descKey: 'tiltDesc',
    key: 'tilt',
    type: 'value',
    getValue: () => state.tiltAmount,
    setValue: (v) => state.setTiltAmount(v),
    defaultValue: 0.6,
    min: 0.0,
    max: 1.0,
    step: 0.1,
    format: (v) => v.toFixed(1)
  },
  {
    nameKey: 'angularSpeed',
    descKey: 'angularSpeedDesc',
    key: 'angularSpeed',
    type: 'value',
    getValue: () => state.maxAngularSpeed,
    setValue: (v) => {
      state.setMaxAngularSpeed(v);
      state.setAngularAcceleration(v * 0.025);
    },
    defaultValue: 0.06,
    min: 0.02,
    max: 0.12,
    step: 0.01,
    format: (v) => (v * 100).toFixed(0) + '%'
  },
  {
    nameKey: 'propellerSpeed',
    descKey: 'propellerSpeedDesc',
    key: 'propellerSpeed',
    type: 'value',
    getValue: () => state.propellerRotationSpeed,
    setValue: (v) => state.setPropellerRotationSpeed(v),
    defaultValue: 1.0,
    min: 0.1,
    max: 2.0,
    step: 0.1,
    format: (v) => (v * 100).toFixed(0) + '%'
  },
  {
    nameKey: 'fpvMode',
    descKey: 'fpvModeDesc',
    key: 'fpvMode',
    type: 'toggle',
    getValue: () => state.isFpvMode,
    setValue: (v) => state.setIsFpvMode(v),
    defaultValue: false,
    isHidden: () => state.isMrMode
  },
];

// 設定メニューを作成
export function createSettingsMenu() {
  if (state.settingsMenu) {
    return;
  }

  // 表示項目数に応じてキャンバスの高さを計算
  const visibleItems = settingsItems.filter(item => !item.isHidden || !item.isHidden());
  const itemHeight = 100;
  // タイトル(70) + 設定項目 + 操作説明(90) + チュートリアルボタン(75) + タイトルに戻るボタン(75) + 余白(30)
  const canvasHeight = 70 + (visibleItems.length * itemHeight) + 90 + 75 + 75 + 30;

  settingsMenuCanvas = document.createElement('canvas');
  settingsMenuCanvas.width = 700;
  settingsMenuCanvas.height = canvasHeight;

  redrawSettingsMenu(null);

  settingsMenuTexture = new THREE.CanvasTexture(settingsMenuCanvas);
  settingsMenuTexture.needsUpdate = true;

  const aspectRatio = settingsMenuCanvas.width / settingsMenuCanvas.height;
  const menuHeight = 0.35;
  const menuWidth = menuHeight * aspectRatio;
  settingsMenuWidth = menuWidth;
  settingsMenuHeight = menuHeight;
  const geometry = new THREE.PlaneGeometry(menuWidth, menuHeight);
  const material = new THREE.MeshBasicMaterial({
    map: settingsMenuTexture,
    transparent: true,
    side: THREE.DoubleSide
  });

  const menuMesh = new THREE.Mesh(geometry, material);
  menuMesh.scale.set(0.01, 0.01, 0.01); // 最初は小さく
  menuMesh.material.opacity = 0;
  state.scene.add(menuMesh);
  state.setSettingsMenu(menuMesh);
  state.setIsSettingsMenuVisible(true);
  state.setSettingsMenuSelectedIndex(0);

  // アニメーション開始
  state.setSettingsMenuAnimProgress(0);
  state.setSettingsMenuAnimating(true);
  state.setSettingsMenuAnimDirection(1);

  // レーザーライン作成（チュートリアル中は非表示）
  if (state.tutorialStep === 0 || state.tutorialStep > 4) {
    createSettingsLaser();
  }
}

// 設定メニューを再描画
export function redrawSettingsMenu(hoveredButton) {
  if (!settingsMenuCanvas) return;

  const canvas = settingsMenuCanvas;
  const ctx = canvas.getContext('2d');

  // ボタン領域をクリア
  settingsButtonAreas = [];

  // キャンバスをクリア（透明）
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景（半透明）
  ctx.fillStyle = 'rgba(10, 10, 26, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 枠線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  // 内側の光彩効果
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(0, 200, 255, 0.1)');
  gradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.05)');
  gradient.addColorStop(1, 'rgba(0, 200, 255, 0.1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(4, 4, canvas.width - 8, canvas.height - 8);

  // タイトル
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#00c8ff';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 200, 255, 0.8)';
  ctx.shadowBlur = 15;
  ctx.fillText(t('settings', 'title'), canvas.width / 2, 50);
  ctx.shadowBlur = 0;

  // 区切り線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 70);
  ctx.lineTo(canvas.width - 40, 70);
  ctx.stroke();

  // 設定項目（非表示のものを除外）
  const visibleItems = settingsItems.filter(item => !item.isHidden || !item.isHidden());
  let y = 110;
  const itemHeight = 100;

  visibleItems.forEach((item, index) => {
    const value = item.getValue();
    // nameKey/descKey から動的にテキストを取得
    const itemName = item.nameKey ? t('settings', item.nameKey) : item.name;
    const itemDesc = item.descKey ? t('settings', item.descKey) : item.description;

    // 項目の背景
    ctx.fillStyle = 'rgba(30, 30, 50, 0.5)';
    ctx.beginPath();
    ctx.roundRect(25, y - 10, canvas.width - 50, itemHeight - 10, 8);
    ctx.fill();

    // 項目名
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(itemName, 40, y + 20);

    // 説明文
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(itemDesc, 40, y + 42);

    if (item.type === 'language') {
      // 言語選択ボタン（日本語 / English）
      const isJapanese = value === 'ja';
      const btnWidth = 100;
      const btnHeight = 50;
      const btnSpacing = 10;
      const startX = 380;

      // 日本語ボタン
      const jaBtnX = startX;
      const jaBtnY = y + 5;
      const isJaHovered = hoveredButton && hoveredButton.index === index && hoveredButton.type === 'langJa';

      if (isJaHovered) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
      } else if (isJapanese) {
        ctx.fillStyle = 'rgba(0, 255, 150, 0.5)';
      } else {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
      }
      ctx.beginPath();
      ctx.roundRect(jaBtnX, jaBtnY, btnWidth, btnHeight, 6);
      ctx.fill();

      if (isJaHovered) {
        ctx.strokeStyle = '#ffff00';
      } else if (isJapanese) {
        ctx.strokeStyle = 'rgba(0, 255, 150, 0.8)';
      } else {
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
      }
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = isJaHovered ? '#000000' : (isJapanese ? '#00ff96' : 'rgba(255, 255, 255, 0.6)');
      ctx.textAlign = 'center';
      ctx.fillText(t('settings', 'japanese'), jaBtnX + btnWidth / 2, jaBtnY + btnHeight / 2 + 6);

      settingsButtonAreas.push({
        x: jaBtnX, y: jaBtnY, w: btnWidth, h: btnHeight,
        index: index, type: 'langJa'
      });

      // Englishボタン
      const enBtnX = startX + btnWidth + btnSpacing;
      const enBtnY = y + 5;
      const isEnHovered = hoveredButton && hoveredButton.index === index && hoveredButton.type === 'langEn';

      if (isEnHovered) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
      } else if (!isJapanese) {
        ctx.fillStyle = 'rgba(0, 255, 150, 0.5)';
      } else {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
      }
      ctx.beginPath();
      ctx.roundRect(enBtnX, enBtnY, btnWidth, btnHeight, 6);
      ctx.fill();

      if (isEnHovered) {
        ctx.strokeStyle = '#ffff00';
      } else if (!isJapanese) {
        ctx.strokeStyle = 'rgba(0, 255, 150, 0.8)';
      } else {
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
      }
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = isEnHovered ? '#000000' : (!isJapanese ? '#00ff96' : 'rgba(255, 255, 255, 0.6)');
      ctx.textAlign = 'center';
      ctx.fillText(t('settings', 'english'), enBtnX + btnWidth / 2, enBtnY + btnHeight / 2 + 6);

      settingsButtonAreas.push({
        x: enBtnX, y: enBtnY, w: btnWidth, h: btnHeight,
        index: index, type: 'langEn'
      });

    } else if (item.type === 'toggle') {
      // トグルボタン
      const toggleBtnX = 480;
      const toggleBtnY = y + 5;
      const toggleBtnW = 120;
      const toggleBtnH = 50;
      const isToggleHovered = hoveredButton && hoveredButton.index === index && hoveredButton.type === 'toggle';
      const isOn = value === true;

      // トグルボタン背景
      if (isToggleHovered) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
      } else if (isOn) {
        ctx.fillStyle = 'rgba(0, 255, 150, 0.5)';
      } else {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
      }
      ctx.beginPath();
      ctx.roundRect(toggleBtnX, toggleBtnY, toggleBtnW, toggleBtnH, 6);
      ctx.fill();

      if (isToggleHovered) {
        ctx.strokeStyle = '#ffff00';
      } else if (isOn) {
        ctx.strokeStyle = 'rgba(0, 255, 150, 0.8)';
      } else {
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
      }
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 22px Arial';
      ctx.fillStyle = isToggleHovered ? '#000000' : (isOn ? '#00ff96' : 'rgba(255, 255, 255, 0.6)');
      ctx.textAlign = 'center';
      ctx.fillText(isOn ? t('settings', 'on') : t('settings', 'off'), toggleBtnX + toggleBtnW / 2, toggleBtnY + toggleBtnH / 2 + 8);

      settingsButtonAreas.push({
        x: toggleBtnX, y: toggleBtnY, w: toggleBtnW, h: toggleBtnH,
        index: index, type: 'toggle'
      });
    } else {
      // 値タイプ（従来の左右矢印とデフォルトボタン）
      const displayValue = item.format ? item.format(value) : value.toString();

      // 左矢印ボタン
      const leftBtnX = 320;
      const leftBtnY = y + 5;
      const btnSize = 50;
      const isLeftHovered = hoveredButton && hoveredButton.index === index && hoveredButton.type === 'left';

      ctx.fillStyle = isLeftHovered ? 'rgba(255, 255, 0, 0.8)' : 'rgba(0, 200, 255, 0.3)';
      ctx.beginPath();
      ctx.roundRect(leftBtnX, leftBtnY, btnSize, btnSize, 6);
      ctx.fill();
      ctx.strokeStyle = isLeftHovered ? '#ffff00' : 'rgba(0, 200, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = isLeftHovered ? '#000000' : '#00c8ff';
      ctx.textAlign = 'center';
      ctx.fillText('◀', leftBtnX + btnSize / 2, leftBtnY + btnSize / 2 + 8);

      settingsButtonAreas.push({
        x: leftBtnX, y: leftBtnY, w: btnSize, h: btnSize,
        index: index, type: 'left'
      });

      // 値
      ctx.font = 'bold 22px Arial';
      ctx.fillStyle = '#00c8ff';
      ctx.textAlign = 'center';
      ctx.fillText(displayValue, 440, y + 40);

      // 右矢印ボタン
      const rightBtnX = 510;
      const rightBtnY = y + 5;
      const isRightHovered = hoveredButton && hoveredButton.index === index && hoveredButton.type === 'right';

      ctx.fillStyle = isRightHovered ? 'rgba(255, 255, 0, 0.8)' : 'rgba(0, 200, 255, 0.3)';
      ctx.beginPath();
      ctx.roundRect(rightBtnX, rightBtnY, btnSize, btnSize, 6);
      ctx.fill();
      ctx.strokeStyle = isRightHovered ? '#ffff00' : 'rgba(0, 200, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = isRightHovered ? '#000000' : '#00c8ff';
      ctx.textAlign = 'center';
      ctx.fillText('▶', rightBtnX + btnSize / 2, rightBtnY + btnSize / 2 + 8);

      settingsButtonAreas.push({
        x: rightBtnX, y: rightBtnY, w: btnSize, h: btnSize,
        index: index, type: 'right'
      });

      // デフォルトボタン
      const defaultBtnX = 580;
      const defaultBtnY = y + 5;
      const defaultBtnW = 80;
      const isDefaultHovered = hoveredButton && hoveredButton.index === index && hoveredButton.type === 'default';
      const defaultVal = item.getDefaultValue ? item.getDefaultValue() : item.defaultValue;
      const isDefault = Math.abs(value - defaultVal) < 0.0001;

      ctx.fillStyle = isDefaultHovered ? 'rgba(255, 107, 107, 0.8)' : (isDefault ? 'rgba(100, 100, 100, 0.3)' : 'rgba(255, 107, 107, 0.3)');
      ctx.beginPath();
      ctx.roundRect(defaultBtnX, defaultBtnY, defaultBtnW, btnSize, 6);
      ctx.fill();
      ctx.strokeStyle = isDefaultHovered ? '#ff6b6b' : (isDefault ? 'rgba(100, 100, 100, 0.5)' : 'rgba(255, 107, 107, 0.6)');
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = isDefaultHovered ? '#000000' : (isDefault ? 'rgba(255, 255, 255, 0.3)' : '#ff6b6b');
      ctx.textAlign = 'center';
      ctx.fillText(t('settings', 'default'), defaultBtnX + defaultBtnW / 2, defaultBtnY + btnSize / 2 + 5);

      settingsButtonAreas.push({
        x: defaultBtnX, y: defaultBtnY, w: defaultBtnW, h: btnSize,
        index: index, type: 'default'
      });
    }

    y += itemHeight;
  });

  // 操作説明（設定項目の下）
  const bottomLineY = y + 10;
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, bottomLineY);
  ctx.lineTo(canvas.width - 40, bottomLineY);
  ctx.stroke();

  ctx.font = '16px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.textAlign = 'center';
  ctx.fillText(t('settings', 'laserInstruction'), canvas.width / 2, bottomLineY + 30);

  // 閉じる説明
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#ffff00';
  ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText(t('settings', 'closeInstruction'), canvas.width / 2, bottomLineY + 60);
  ctx.shadowBlur = 0;

  // チュートリアルを受けるボタン
  const tutorialBtnX = 25;
  const tutorialBtnY = bottomLineY + 80;
  const tutorialBtnW = canvas.width - 50;
  const tutorialBtnH = 60;
  const isTutorialHovered = hoveredButton && hoveredButton.type === 'tutorial';

  ctx.fillStyle = isTutorialHovered ? 'rgba(100, 200, 255, 0.9)' : 'rgba(100, 200, 255, 0.4)';
  ctx.beginPath();
  ctx.roundRect(tutorialBtnX, tutorialBtnY, tutorialBtnW, tutorialBtnH, 8);
  ctx.fill();
  ctx.strokeStyle = isTutorialHovered ? '#64c8ff' : 'rgba(100, 200, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 26px Arial';
  ctx.fillStyle = isTutorialHovered ? '#000000' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(t('settings', 'tutorial'), canvas.width / 2, tutorialBtnY + tutorialBtnH / 2 + 9);

  settingsButtonAreas.push({
    x: tutorialBtnX, y: tutorialBtnY, w: tutorialBtnW, h: tutorialBtnH,
    type: 'tutorial'
  });

  // タイトルに戻るボタン
  const returnBtnX = 25;
  const returnBtnY = tutorialBtnY + tutorialBtnH + 15;
  const returnBtnW = canvas.width - 50;
  const returnBtnH = 60;
  const isReturnHovered = hoveredButton && hoveredButton.type === 'returnToTitle';

  ctx.fillStyle = isReturnHovered ? 'rgba(255, 100, 100, 0.9)' : 'rgba(255, 100, 100, 0.4)';
  ctx.beginPath();
  ctx.roundRect(returnBtnX, returnBtnY, returnBtnW, returnBtnH, 8);
  ctx.fill();
  ctx.strokeStyle = isReturnHovered ? '#ff6666' : 'rgba(255, 100, 100, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 26px Arial';
  ctx.fillStyle = isReturnHovered ? '#000000' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(t('settings', 'returnToTitle'), canvas.width / 2, returnBtnY + returnBtnH / 2 + 9);

  settingsButtonAreas.push({
    x: returnBtnX, y: returnBtnY, w: returnBtnW, h: returnBtnH,
    type: 'returnToTitle'
  });

  if (settingsMenuTexture) {
    settingsMenuTexture.needsUpdate = true;
  }
}

// 設定メニューを削除（アニメーション開始）
export function removeSettingsMenu() {
  if (state.settingsMenu && !state.settingsMenuAnimating) {
    // 閉じるアニメーションを開始
    state.setSettingsMenuAnimProgress(1);
    state.setSettingsMenuAnimating(true);
    state.setSettingsMenuAnimDirection(-1);
    state.setIsSettingsMenuVisible(false);
  }
}

// 設定メニューを実際に削除（アニメーション完了後に呼ばれる）
function destroySettingsMenu() {
  if (state.settingsMenu) {
    state.scene.remove(state.settingsMenu);
    state.settingsMenu.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    });
    state.setSettingsMenu(null);
    settingsMenuCanvas = null;
    settingsMenuTexture = null;
    settingsButtonAreas = [];
  }

  // レーザーも削除
  removeSettingsLaser();

  // チュートリアルステップ4の場合、チュートリアル4ウィンドウを表示
  if (state.tutorialStep === 4) {
    setTimeout(() => {
      createTutorial4Window();
    }, 300);
    console.log('設定ウィンドウを閉じ、チュートリアル4を表示');
  }
}

// 設定メニューをトグル
export function toggleSettingsMenu() {
  // アニメーション中は操作を受け付けない
  if (state.settingsMenuAnimating) return;

  if (state.isSettingsMenuVisible || state.settingsMenu) {
    removeSettingsMenu();
    playWindowCloseSound();
  } else {
    createSettingsMenu();
    playWindowOpenSound();
  }
}

// レーザーを作成
function createSettingsLaser() {
  // レーザーライン
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    linewidth: 2,
    transparent: true,
    opacity: 0.8
  });
  const lineGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(6);
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const laserLine = new THREE.Line(lineGeometry, lineMaterial);
  state.scene.add(laserLine);
  state.setSettingsLaserLine(laserLine);

  // レーザードット
  const dotGeometry = new THREE.SphereGeometry(0.005, 8, 8);
  const dotMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.9
  });
  const laserDot = new THREE.Mesh(dotGeometry, dotMaterial);
  laserDot.visible = false;
  state.scene.add(laserDot);
  state.setSettingsLaserDot(laserDot);
}

// レーザーを削除
function removeSettingsLaser() {
  if (state.settingsLaserLine) {
    state.scene.remove(state.settingsLaserLine);
    state.settingsLaserLine.geometry.dispose();
    state.settingsLaserLine.material.dispose();
    state.setSettingsLaserLine(null);
  }
  if (state.settingsLaserDot) {
    state.scene.remove(state.settingsLaserDot);
    state.settingsLaserDot.geometry.dispose();
    state.settingsLaserDot.material.dispose();
    state.setSettingsLaserDot(null);
  }
}

// レーザーのクリック判定用クールダウン
let laserClickCooldown = 0;

// 設定メニューのアニメーション更新
export function updateSettingsMenuAnimation() {
  if (!state.settingsMenuAnimating) return;

  const animSpeed = 0.08;

  if (state.settingsMenuAnimDirection === 1) {
    // 開くアニメーション
    let progress = state.settingsMenuAnimProgress + animSpeed;
    if (progress >= 1) {
      progress = 1;
      state.setSettingsMenuAnimating(false);
    }
    state.setSettingsMenuAnimProgress(progress);

    if (state.settingsMenu) {
      const easedProgress = easeOutBack(progress);
      const scale = easedProgress;
      state.settingsMenu.scale.set(scale, scale, scale);
      state.settingsMenu.material.opacity = Math.min(1, progress * 1.5);
    }
  } else {
    // 閉じるアニメーション
    let progress = state.settingsMenuAnimProgress - animSpeed;
    if (progress <= 0) {
      progress = 0;
      state.setSettingsMenuAnimating(false);
      destroySettingsMenu();
    }
    state.setSettingsMenuAnimProgress(progress);

    if (state.settingsMenu) {
      const easedProgress = easeInBack(progress);
      const scale = Math.max(0.01, easedProgress);
      state.settingsMenu.scale.set(scale, scale, scale);
      state.settingsMenu.material.opacity = progress;
    }
  }
}

export function updateSettingsMenu() {
  // アニメーション更新
  updateSettingsMenuAnimation();

  if (!state.settingsMenu || !state.xrSession) return;

  const inputSources = state.xrSession.inputSources;
  const frame = state.renderer.xr.getFrame();
  const referenceSpace = state.renderer.xr.getReferenceSpace();

  if (!frame || !referenceSpace) return;

  let rightControllerPos = null;
  let rightControllerDir = null;
  let rightTriggerPressed = false;

  for (const source of inputSources) {
    // 左コントローラー：メニュー位置を更新
    if (source.handedness === 'left' && source.gripSpace) {
      const gripPose = frame.getPose(source.gripSpace, referenceSpace);
      if (gripPose) {
        const controllerMatrix = new THREE.Matrix4().fromArray(gripPose.transform.matrix);
        const controllerPos = new THREE.Vector3().setFromMatrixPosition(controllerMatrix);

        const menuPos = controllerPos.clone();
        menuPos.y += 0.25;

        state.settingsMenu.position.copy(menuPos);

        if (state.camera) {
          const cameraPos = new THREE.Vector3();
          state.camera.getWorldPosition(cameraPos);

          const direction = new THREE.Vector3();
          direction.subVectors(cameraPos, menuPos);
          direction.y = 0;
          direction.normalize();

          const angle = Math.atan2(direction.x, direction.z);
          state.settingsMenu.rotation.set(0, angle, 0);
        }
      }
    }

    // 右コントローラー：レーザー用の位置と向きを取得
    if (source.handedness === 'right' && source.targetRaySpace) {
      const rayPose = frame.getPose(source.targetRaySpace, referenceSpace);
      if (rayPose) {
        const rayMatrix = new THREE.Matrix4().fromArray(rayPose.transform.matrix);
        rightControllerPos = new THREE.Vector3().setFromMatrixPosition(rayMatrix);

        // 向きを取得（Z軸負方向がポインティング方向）
        rightControllerDir = new THREE.Vector3(0, 0, -1);
        const rayQuat = new THREE.Quaternion().setFromRotationMatrix(rayMatrix);
        rightControllerDir.applyQuaternion(rayQuat);
      }

      if (source.gamepad && source.gamepad.buttons[0]) {
        rightTriggerPressed = source.gamepad.buttons[0].pressed;
      }
    }
  }

  // レーザーとメニューの交点を計算
  let hoveredButton = null;

  if (rightControllerPos && rightControllerDir && state.settingsMenu) {
    // レーザーラインを更新
    if (state.settingsLaserLine) {
      const positions = state.settingsLaserLine.geometry.attributes.position.array;
      positions[0] = rightControllerPos.x;
      positions[1] = rightControllerPos.y;
      positions[2] = rightControllerPos.z;

      const endPoint = rightControllerPos.clone().add(rightControllerDir.clone().multiplyScalar(2));
      positions[3] = endPoint.x;
      positions[4] = endPoint.y;
      positions[5] = endPoint.z;

      state.settingsLaserLine.geometry.attributes.position.needsUpdate = true;
    }

    // メニューとの交点を計算
    const raycaster = new THREE.Raycaster(rightControllerPos, rightControllerDir);
    const intersects = raycaster.intersectObject(state.settingsMenu);

    if (intersects.length > 0) {
      const hit = intersects[0];

      // ドットを表示
      if (state.settingsLaserDot) {
        state.settingsLaserDot.visible = true;
        state.settingsLaserDot.position.copy(hit.point);
      }

      // UV座標からキャンバス上の位置を計算
      if (hit.uv) {
        const canvasX = hit.uv.x * settingsMenuCanvas.width;
        const canvasY = (1 - hit.uv.y) * settingsMenuCanvas.height;

        // ボタンの当たり判定
        for (const btn of settingsButtonAreas) {
          if (canvasX >= btn.x && canvasX <= btn.x + btn.w &&
              canvasY >= btn.y && canvasY <= btn.y + btn.h) {
            hoveredButton = btn;
            break;
          }
        }

        // トリガーでクリック
        const now = Date.now();
        if (rightTriggerPressed && hoveredButton && laserClickCooldown < now) {
          handleSettingsButtonClick(hoveredButton);
          laserClickCooldown = now + 200;
        }
      }
    } else {
      // メニューに当たっていない場合、ドットを非表示
      if (state.settingsLaserDot) {
        state.settingsLaserDot.visible = false;
      }
    }
  }

  // 再描画
  redrawSettingsMenu(hoveredButton);
}

// ボタンクリック処理
function handleSettingsButtonClick(button) {
  if (button.type === 'tutorial') {
    // チュートリアルを受ける - タイトルに戻ってチュートリアルを再開
    playButtonSound();
    state.setRestartTutorial(true);
    localStorage.setItem('restartTutorial', 'true');
    removeSettingsMenu();
    if (state.xrSession) {
      state.xrSession.end().then(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
    return;
  }

  if (button.type === 'returnToTitle') {
    // タイトルに戻る
    playButtonSound();
    removeSettingsMenu();
    if (state.xrSession) {
      state.xrSession.end().then(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
    return;
  }

  const visibleItems = settingsItems.filter(item => !item.isHidden || !item.isHidden());
  const item = visibleItems[button.index];

  if (button.type === 'langJa') {
    // 日本語を選択
    item.setValue('ja');
    saveSettingToStorage(item.key, 'ja');
    playButtonSound();
    // コントローラーガイドメニューが開いていれば再描画
    if (state.controllerGuideMenu) {
      redrawControllerGuideMenu({});
    }
  } else if (button.type === 'langEn') {
    // 英語を選択
    item.setValue('en');
    saveSettingToStorage(item.key, 'en');
    playButtonSound();
    // コントローラーガイドメニューが開いていれば再描画
    if (state.controllerGuideMenu) {
      redrawControllerGuideMenu({});
    }
  } else if (button.type === 'toggle') {
    // トグル切り替え
    const currentValue = item.getValue();
    const newValue = !currentValue;
    item.setValue(newValue);
    saveSettingToStorage(item.key, newValue);
    playButtonSound();
  } else if (button.type === 'left') {
    // 値を減少
    const currentValue = item.getValue();
    const newValue = Math.max(item.min, currentValue - item.step);
    item.setValue(newValue);
    saveSettingToStorage(item.key, newValue);
    playCursorSound();
  } else if (button.type === 'right') {
    // 値を増加
    const currentValue = item.getValue();
    const newValue = Math.min(item.max, currentValue + item.step);
    item.setValue(newValue);
    saveSettingToStorage(item.key, newValue);
    playCursorSound();
  } else if (button.type === 'default') {
    // デフォルト値に戻す
    const defaultVal = item.getDefaultValue ? item.getDefaultValue() : item.defaultValue;
    item.setValue(defaultVal);
    saveSettingToStorage(item.key, defaultVal);
    playButtonSound();
  }
}

// イージング関数（バウンス風のエフェクト）
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// イージング関数（滑らかな加速）
function easeInBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
}

// コントローラーガイドメニューのアニメーション更新
export function updateControllerGuideAnimation() {
  if (!state.controllerGuideAnimating) return;

  const animSpeed = 0.08;

  if (state.controllerGuideAnimDirection === 1) {
    // 開くアニメーション
    let progress = state.controllerGuideAnimProgress + animSpeed;
    if (progress >= 1) {
      progress = 1;
      state.setControllerGuideAnimating(false);
    }
    state.setControllerGuideAnimProgress(progress);

    if (state.controllerGuideMenu) {
      const easedProgress = easeOutBack(progress);
      const scale = easedProgress;
      state.controllerGuideMenu.scale.set(scale, scale, scale);
      state.controllerGuideMenu.material.opacity = Math.min(1, progress * 1.5);
    }
  } else {
    // 閉じるアニメーション
    let progress = state.controllerGuideAnimProgress - animSpeed;
    if (progress <= 0) {
      progress = 0;
      state.setControllerGuideAnimating(false);
      destroyControllerGuideMenu();
    }
    state.setControllerGuideAnimProgress(progress);

    if (state.controllerGuideMenu) {
      const easedProgress = easeInBack(progress);
      const scale = Math.max(0.01, easedProgress);
      state.controllerGuideMenu.scale.set(scale, scale, scale);
      state.controllerGuideMenu.material.opacity = progress;
    }
  }
}

// コントローラーガイドメニューの位置を更新（右コントローラー上に常に追従、角度は水平固定）
export function updateControllerGuideMenu() {
  // アニメーション更新
  updateControllerGuideAnimation();

  if (!state.controllerGuideMenu || !state.xrSession) return;

  const inputSources = state.xrSession.inputSources;
  const frame = state.renderer.xr.getFrame();
  const referenceSpace = state.renderer.xr.getReferenceSpace();

  if (!frame || !referenceSpace) return;

  // ボタン状態を収集
  const pressedButtons = {
    leftStickX: false,
    leftStickY: false,
    leftY: false,
    leftX: false,
    leftStickPress: false,
    leftTrigger: false,
    leftGrip: false,
    rightStickX: false,
    rightStickY: false,
    rightA: false,
    rightStickPress: false,
    rightB: false,
    rightTrigger: false,
    rightGrip: false
  };

  for (const source of inputSources) {
    if (source.gamepad) {
      const gp = source.gamepad;
      const buttons = gp.buttons;
      const axes = gp.axes;

      // デッドゾーン（実際のコントロールと同じ値）
      const deadzone = state.stickDeadzone;

      if (source.handedness === 'left') {
        // 左スティック（デッドゾーン考慮）
        if (axes.length >= 4) {
          pressedButtons.leftStickX = Math.abs(axes[2]) > deadzone;
          pressedButtons.leftStickY = Math.abs(axes[3]) > deadzone;
        }
        // ボタン (X=buttons[5], Y=buttons[4])
        if (buttons[5]) pressedButtons.leftX = buttons[5].pressed;
        if (buttons[4]) pressedButtons.leftY = buttons[4].pressed;
        if (buttons[3]) pressedButtons.leftStickPress = buttons[3].pressed;
        if (buttons[0]) pressedButtons.leftTrigger = buttons[0].pressed || buttons[0].value > 0.5;
        if (buttons[1]) pressedButtons.leftGrip = buttons[1].pressed || buttons[1].value > 0.5;
      } else if (source.handedness === 'right') {
        // 右スティック（デッドゾーン考慮）
        if (axes.length >= 4) {
          pressedButtons.rightStickX = Math.abs(axes[2]) > deadzone;
          pressedButtons.rightStickY = Math.abs(axes[3]) > deadzone;
        }
        // ボタン
        if (buttons[4]) pressedButtons.rightA = buttons[4].pressed;
        if (buttons[3]) pressedButtons.rightStickPress = buttons[3].pressed;
        if (buttons[5]) pressedButtons.rightB = buttons[5].pressed;
        if (buttons[0]) pressedButtons.rightTrigger = buttons[0].pressed || buttons[0].value > 0.5;
        if (buttons[1]) pressedButtons.rightGrip = buttons[1].pressed || buttons[1].value > 0.5;
      }
    }

    if (source.handedness === 'right' && source.gripSpace) {
      const gripPose = frame.getPose(source.gripSpace, referenceSpace);
      if (gripPose) {
        const controllerMatrix = new THREE.Matrix4().fromArray(gripPose.transform.matrix);
        const controllerPos = new THREE.Vector3().setFromMatrixPosition(controllerMatrix);

        // コントローラーの位置から上方向（ワールド座標）に配置
        const menuPos = controllerPos.clone();
        menuPos.y += 0.25;

        state.controllerGuideMenu.position.copy(menuPos);

        // カメラの方を向く（Y軸回転のみ、傾きなし）
        if (state.camera) {
          const cameraPos = new THREE.Vector3();
          state.camera.getWorldPosition(cameraPos);

          // Y軸回転のみでカメラの方を向く
          const direction = new THREE.Vector3();
          direction.subVectors(cameraPos, menuPos);
          direction.y = 0; // 水平方向のみ
          direction.normalize();

          const angle = Math.atan2(direction.x, direction.z);
          state.controllerGuideMenu.rotation.set(0, angle, 0);
        }
      }
    }
  }

  // メニューを再描画（ボタン状態を反映）
  redrawControllerGuideMenu(pressedButtons);
}

// ドローン位置表示矢印を作成（ドローンがカメラ外にいる時の方向ガイド）
export function createDroneLocationArrow() {
  if (state.hudDroneLocationArrow) {
    state.scene.remove(state.hudDroneLocationArrow);
    if (state.hudDroneLocationArrow.geometry) state.hudDroneLocationArrow.geometry.dispose();
    if (state.hudDroneLocationArrow.material) state.hudDroneLocationArrow.material.dispose();
    state.setHudDroneLocationArrow(null);
  }

  const geometry = new THREE.ConeGeometry(0.02, 0.06, 8);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.9
  });

  const hudDroneLocationArrow = new THREE.Mesh(geometry, material);
  state.scene.add(hudDroneLocationArrow);
  state.setHudDroneLocationArrow(hudDroneLocationArrow);
}

// ドローン位置表示矢印の位置と向きを更新
export function updateDroneLocationArrow() {
  if (!state.drone || !state.camera) return;

  const cameraPos = new THREE.Vector3();
  state.camera.getWorldPosition(cameraPos);

  const dronePos = state.drone.position.clone();
  const toDrone = dronePos.clone().sub(cameraPos);
  const toDroneLocal = toDrone.clone().applyQuaternion(state.camera.quaternion.clone().invert());

  const fovRad = (state.camera.fov * Math.PI) / 180;
  const aspectRatio = state.camera.aspect || (window.innerWidth / window.innerHeight);

  const verticalHalfAngle = fovRad / 2 * 0.7;
  const horizontalHalfAngle = Math.atan(Math.tan(verticalHalfAngle) * aspectRatio);

  const angleY = Math.atan2(toDroneLocal.y, -toDroneLocal.z);
  const angleX = Math.atan2(toDroneLocal.x, -toDroneLocal.z);

  const isInView =
    Math.abs(angleY) < verticalHalfAngle &&
    Math.abs(angleX) < horizontalHalfAngle &&
    toDroneLocal.z < 0;

  if (isInView) {
    if (state.hudDroneLocationArrow) {
      state.hudDroneLocationArrow.visible = false;
    }
  } else {
    if (!state.hudDroneLocationArrow) {
      createDroneLocationArrow();
    }
    state.hudDroneLocationArrow.visible = true;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(state.camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(state.camera.quaternion);

    const depth = 0.35;
    let edgePos = cameraPos.clone().add(forward.clone().multiplyScalar(depth));

    // 円形の表示エリアにするため、角度から方向を計算
    const dirAngle = Math.atan2(angleY, angleX);

    // 上下で異なる半径係数を使用（下は外側に、上は内側に）
    const isDown = angleY < 0;
    const verticalRadius = isDown ? 0.95 : 0.55;
    const horizontalRadius = 0.55;

    // 円周上の位置を計算
    const horizontalOffset = Math.cos(dirAngle) * horizontalHalfAngle * horizontalRadius;
    const verticalOffset = Math.sin(dirAngle) * verticalHalfAngle * verticalRadius;

    edgePos.add(right.clone().multiplyScalar(Math.tan(horizontalOffset) * depth));
    edgePos.add(up.clone().multiplyScalar(Math.tan(verticalOffset) * depth));

    state.hudDroneLocationArrow.position.copy(edgePos);
    state.hudDroneLocationArrow.lookAt(dronePos);
    state.hudDroneLocationArrow.rotateX(Math.PI / 2);

    // 矢印自体をゆっくり自転させる
    state.hudDroneLocationArrow.rotateY(Date.now() * 0.002);
  }
}

// ウェルカムウィンドウ用のキャンバスとテクスチャ
let welcomeWindowCanvas = null;
let welcomeWindowTexture = null;

// ウェルカムウィンドウを作成
export function createWelcomeWindow() {
  if (state.welcomeWindow) return;

  playWindowOpenSound();
  playTutorialBGM();

  // キャンバス作成
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  welcomeWindowCanvas = canvas;

  // テクスチャ作成
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  welcomeWindowTexture = texture;

  // 初期描画
  redrawWelcomeWindow();

  // メッシュ作成
  const geometry = new THREE.PlaneGeometry(0.6, 0.4);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  state.scene.add(mesh);
  state.setWelcomeWindow(mesh);
  state.setIsWelcomeWindowVisible(true);

  // アニメーション開始
  state.setWelcomeWindowAnimProgress(0);
  state.setWelcomeWindowAnimating(true);
  state.setWelcomeWindowAnimDirection(1);
}

// ウェルカムウィンドウを再描画
function redrawWelcomeWindow() {
  if (!welcomeWindowCanvas) return;

  const canvas = welcomeWindowCanvas;
  const ctx = canvas.getContext('2d');

  // キャンバスをクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景（半透明）
  ctx.fillStyle = 'rgba(10, 10, 26, 0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 枠線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  // 内側の光彩効果
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(0, 200, 255, 0.1)');
  gradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.05)');
  gradient.addColorStop(1, 'rgba(0, 200, 255, 0.1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(4, 4, canvas.width - 8, canvas.height - 8);

  // ステップ番号
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#ffcc00';
  ctx.textAlign = 'center';
  ctx.fillText(t('welcome', 'step'), canvas.width / 2, 35);

  // タイトル（日本語）
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#00c8ff';
  ctx.shadowColor = 'rgba(0, 200, 255, 0.8)';
  ctx.shadowBlur = 15;
  ctx.fillText(t('welcome', 'title'), canvas.width / 2, 75);
  ctx.shadowBlur = 0;

  // タイトル（英語）
  ctx.font = '18px Arial';
  ctx.fillStyle = 'rgba(0, 200, 255, 0.7)';
  ctx.fillText(t('welcome', 'titleEn'), canvas.width / 2, 100);

  // 区切り線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 120);
  ctx.lineTo(canvas.width - 40, 120);
  ctx.stroke();

  // 説明文（日本語）
  ctx.font = '22px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(t('welcome', 'instruction1'), canvas.width / 2, 165);

  // 説明文（英語）
  ctx.font = '18px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText(t('welcome', 'instruction1En'), canvas.width / 2, 195);

  // 区切り線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.beginPath();
  ctx.moveTo(40, 260);
  ctx.lineTo(canvas.width - 40, 260);
  ctx.stroke();

  // 次へ説明（日本語）- 右寄せ
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#ffff00';
  ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.textAlign = 'right';
  ctx.fillText(t('welcome', 'nextWithA'), canvas.width - 40, 310);
  ctx.shadowBlur = 0;

  // 次へ説明（英語）- 右寄せ
  ctx.font = '18px Arial';
  ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
  ctx.fillText(t('welcome', 'nextWithAEn'), canvas.width - 40, 340);
  ctx.textAlign = 'center';

  // テクスチャを更新
  if (welcomeWindowTexture) {
    welcomeWindowTexture.needsUpdate = true;
  }
}

// ウェルカムウィンドウを削除（アニメーション開始）
export function removeWelcomeWindow() {
  if (!state.welcomeWindow || !state.isWelcomeWindowVisible) return;

  playWindowCloseSound();
  state.setWelcomeWindowAnimDirection(-1);
  state.setWelcomeWindowAnimating(true);
}

// ウェルカムウィンドウのアニメーション更新
function updateWelcomeWindowAnimation() {
  if (!state.welcomeWindowAnimating) return;

  const speed = 0.08;
  let progress = state.welcomeWindowAnimProgress;

  if (state.welcomeWindowAnimDirection === 1) {
    progress += speed;
    if (progress >= 1) {
      progress = 1;
      state.setWelcomeWindowAnimating(false);
    }
  } else {
    progress -= speed;
    if (progress <= 0) {
      progress = 0;
      state.setWelcomeWindowAnimating(false);
      // 完全に閉じたらメッシュを削除
      if (state.welcomeWindow) {
        state.scene.remove(state.welcomeWindow);
        if (state.welcomeWindow.geometry) state.welcomeWindow.geometry.dispose();
        if (state.welcomeWindow.material) {
          if (state.welcomeWindow.material.map) state.welcomeWindow.material.map.dispose();
          state.welcomeWindow.material.dispose();
        }
        state.setWelcomeWindow(null);
        state.setIsWelcomeWindowVisible(false);
        welcomeWindowCanvas = null;
        welcomeWindowTexture = null;
      }
      // ガイドラインとドットも削除
      if (state.welcomeGuideLine) {
        state.scene.remove(state.welcomeGuideLine);
        if (state.welcomeGuideLine.geometry) state.welcomeGuideLine.geometry.dispose();
        if (state.welcomeGuideLine.material) state.welcomeGuideLine.material.dispose();
        state.setWelcomeGuideLine(null);
      }
      if (state.welcomeGuideDot) {
        state.scene.remove(state.welcomeGuideDot);
        if (state.welcomeGuideDot.geometry) state.welcomeGuideDot.geometry.dispose();
        if (state.welcomeGuideDot.material) state.welcomeGuideDot.material.dispose();
        state.setWelcomeGuideDot(null);
      }
    }
  }

  state.setWelcomeWindowAnimProgress(progress);

  // メッシュのスケールとアルファを更新
  if (state.welcomeWindow) {
    const eased = easeOutBack(progress);
    state.welcomeWindow.scale.set(eased, eased, 1);
    if (state.welcomeWindow.material) {
      state.welcomeWindow.material.opacity = progress;
    }
  }
}

// ウェルカムウィンドウの更新（毎フレーム呼び出し）
export function updateWelcomeWindow() {
  // アニメーション更新
  updateWelcomeWindowAnimation();

  if (!state.welcomeWindow || !state.xrSession) return;

  // カメラ位置を取得
  const cameraPos = new THREE.Vector3();
  const cameraQuat = new THREE.Quaternion();
  state.camera.getWorldPosition(cameraPos);
  state.camera.getWorldQuaternion(cameraQuat);

  // カメラの前方向
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(cameraQuat);

  // ウィンドウの位置（カメラの前方1m、少し下に）
  const windowPos = cameraPos.clone().add(forward.clone().multiplyScalar(1.0));
  windowPos.y -= 0.15; // 少し下に配置
  state.welcomeWindow.position.copy(windowPos);

  // Y軸回転のみでカメラの方を向く
  const direction = new THREE.Vector3();
  direction.subVectors(cameraPos, windowPos);
  direction.y = 0;
  direction.normalize();

  const angle = Math.atan2(direction.x, direction.z);
  state.welcomeWindow.rotation.set(0, angle, 0);

  // ドローンへの矢印を描画
  if (state.drone && state.dronePositioned) {
    const dronePos = new THREE.Vector3();
    state.drone.getWorldPosition(dronePos);

    // ウィンドウの下部からドローンへのライン
    const lineStartOffset = new THREE.Vector3(0, -0.15, 0); // ウィンドウの下部
    lineStartOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    const lineStart = windowPos.clone().add(lineStartOffset);
    const lineEnd = dronePos.clone();

    // ガイドラインの作成/更新
    if (!state.welcomeGuideLine) {
      const lineGeometry = new THREE.BufferGeometry();
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.8
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      state.scene.add(line);
      state.setWelcomeGuideLine(line);
    }

    // ラインの頂点を更新
    const positions = new Float32Array([
      lineStart.x, lineStart.y, lineStart.z,
      lineEnd.x, lineEnd.y, lineEnd.z
    ]);
    state.welcomeGuideLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    state.welcomeGuideLine.geometry.attributes.position.needsUpdate = true;

    // ドット（ドローン位置を示す点滅する球）の作成/更新
    if (!state.welcomeGuideDot) {
      const dotGeometry = new THREE.SphereGeometry(0.02, 16, 16);
      const dotMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true
      });
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      state.scene.add(dot);
      state.setWelcomeGuideDot(dot);
    }

    // ドットの位置を更新（ドローン位置）
    state.welcomeGuideDot.position.copy(dronePos);

    // ドットの点滅アニメーション
    const pulseSpeed = 3.0;
    const pulse = (Math.sin(Date.now() * 0.001 * pulseSpeed) + 1) / 2;
    state.welcomeGuideDot.material.opacity = 0.3 + pulse * 0.7;
    state.welcomeGuideDot.scale.setScalar(0.8 + pulse * 0.4);
  }
}

// チュートリアル2用のキャンバスとテクスチャ
let tutorial2Canvas = null;
let tutorial2Texture = null;

// チュートリアル2ウィンドウを作成
export function createTutorial2Window() {
  if (state.tutorial2Window) return;

  playWindowOpenSound();

  // キャンバス作成
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  tutorial2Canvas = canvas;

  // テクスチャ作成
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  tutorial2Texture = texture;

  // 初期描画
  redrawTutorial2Window();

  // メッシュ作成
  const geometry = new THREE.PlaneGeometry(0.6, 0.4);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  state.scene.add(mesh);
  state.setTutorial2Window(mesh);
  state.setIsTutorial2Visible(true);

  // アニメーション開始
  state.setTutorial2AnimProgress(0);
  state.setTutorial2Animating(true);
  state.setTutorial2AnimDirection(1);
}

// チュートリアル2ウィンドウを再描画
function redrawTutorial2Window() {
  if (!tutorial2Canvas) return;

  const canvas = tutorial2Canvas;
  const ctx = canvas.getContext('2d');

  // キャンバスをクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景（半透明）
  ctx.fillStyle = 'rgba(10, 10, 26, 0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 枠線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  // 内側の光彩効果
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(0, 200, 255, 0.1)');
  gradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.05)');
  gradient.addColorStop(1, 'rgba(0, 200, 255, 0.1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(4, 4, canvas.width - 8, canvas.height - 8);

  // ステップ番号
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#ffcc00';
  ctx.textAlign = 'center';
  ctx.fillText(t('tutorial2', 'step'), canvas.width / 2, 35);

  // タイトル（日本語）
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#00c8ff';
  ctx.shadowColor = 'rgba(0, 200, 255, 0.8)';
  ctx.shadowBlur = 15;
  ctx.fillText(t('tutorial2', 'title'), canvas.width / 2, 75);
  ctx.shadowBlur = 0;

  // タイトル（英語）
  ctx.font = '18px Arial';
  ctx.fillStyle = 'rgba(0, 200, 255, 0.7)';
  ctx.fillText(t('tutorial2', 'titleEn'), canvas.width / 2, 100);

  // 区切り線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 120);
  ctx.lineTo(canvas.width - 40, 120);
  ctx.stroke();

  // 説明文1（日本語）
  ctx.font = '22px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(t('tutorial2', 'instruction1'), canvas.width / 2, 155);

  // 説明文2（日本語）
  ctx.fillText(t('tutorial2', 'instruction2'), canvas.width / 2, 185);

  // 説明文（英語）
  ctx.font = '18px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText(t('tutorial2', 'instruction1En'), canvas.width / 2, 215);
  ctx.fillText(t('tutorial2', 'instruction2En'), canvas.width / 2, 240);

  // 区切り線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.beginPath();
  ctx.moveTo(40, 260);
  ctx.lineTo(canvas.width - 40, 260);
  ctx.stroke();

  // 次へ説明（日本語）- 右寄せ
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#ffff00';
  ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.textAlign = 'right';
  ctx.fillText(t('tutorial2', 'nextWithA'), canvas.width - 40, 310);
  ctx.shadowBlur = 0;

  // 次へ説明（英語）- 右寄せ
  ctx.font = '18px Arial';
  ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
  ctx.fillText(t('tutorial2', 'nextWithAEn'), canvas.width - 40, 340);
  ctx.textAlign = 'center';

  // テクスチャを更新
  if (tutorial2Texture) {
    tutorial2Texture.needsUpdate = true;
  }
}

// チュートリアル2ウィンドウを削除（アニメーション開始）
export function removeTutorial2Window() {
  if (!state.tutorial2Window || !state.isTutorial2Visible) return;

  playWindowCloseSound();
  state.setTutorial2AnimDirection(-1);
  state.setTutorial2Animating(true);
}

// チュートリアル2ウィンドウのアニメーション更新
function updateTutorial2WindowAnimation() {
  if (!state.tutorial2Animating) return;

  const speed = 0.08;
  let progress = state.tutorial2AnimProgress;

  if (state.tutorial2AnimDirection === 1) {
    progress += speed;
    if (progress >= 1) {
      progress = 1;
      state.setTutorial2Animating(false);
    }
  } else {
    progress -= speed;
    if (progress <= 0) {
      progress = 0;
      state.setTutorial2Animating(false);
      // 完全に閉じたらメッシュを削除
      if (state.tutorial2Window) {
        state.scene.remove(state.tutorial2Window);
        if (state.tutorial2Window.geometry) state.tutorial2Window.geometry.dispose();
        if (state.tutorial2Window.material) {
          if (state.tutorial2Window.material.map) state.tutorial2Window.material.map.dispose();
          state.tutorial2Window.material.dispose();
        }
        state.setTutorial2Window(null);
        state.setIsTutorial2Visible(false);
        tutorial2Canvas = null;
        tutorial2Texture = null;
      }
      // ガイドラインとドットも削除
      if (state.tutorial2GuideLine) {
        state.scene.remove(state.tutorial2GuideLine);
        if (state.tutorial2GuideLine.geometry) state.tutorial2GuideLine.geometry.dispose();
        if (state.tutorial2GuideLine.material) state.tutorial2GuideLine.material.dispose();
        state.setTutorial2GuideLine(null);
      }
      if (state.tutorial2GuideDot) {
        state.scene.remove(state.tutorial2GuideDot);
        if (state.tutorial2GuideDot.geometry) state.tutorial2GuideDot.geometry.dispose();
        if (state.tutorial2GuideDot.material) state.tutorial2GuideDot.material.dispose();
        state.setTutorial2GuideDot(null);
      }
    }
  }

  state.setTutorial2AnimProgress(progress);

  // メッシュのスケールとアルファを更新
  if (state.tutorial2Window) {
    const eased = easeOutBack(progress);
    state.tutorial2Window.scale.set(eased, eased, 1);
    if (state.tutorial2Window.material) {
      state.tutorial2Window.material.opacity = progress;
    }
  }
}

// チュートリアル2ウィンドウの更新（毎フレーム呼び出し）
export function updateTutorial2Window() {
  // アニメーション更新
  updateTutorial2WindowAnimation();

  if (!state.tutorial2Window || !state.xrSession) return;

  const frame = state.renderer.xr.getFrame();
  const referenceSpace = state.renderer.xr.getReferenceSpace();

  if (!frame || !referenceSpace) return;

  // カメラ位置を取得
  const cameraPos = new THREE.Vector3();
  const cameraQuat = new THREE.Quaternion();
  state.camera.getWorldPosition(cameraPos);
  state.camera.getWorldQuaternion(cameraQuat);

  // カメラの前方向
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(cameraQuat);

  // ウィンドウの位置（カメラの前方1m、少し下に）
  const windowPos = cameraPos.clone().add(forward.clone().multiplyScalar(1.0));
  windowPos.y -= 0.15; // 少し下に配置
  state.tutorial2Window.position.copy(windowPos);

  // Y軸回転のみでカメラの方を向く
  const direction = new THREE.Vector3();
  direction.subVectors(cameraPos, windowPos);
  direction.y = 0;
  direction.normalize();

  const angle = Math.atan2(direction.x, direction.z);
  state.tutorial2Window.rotation.set(0, angle, 0);

  // 右コントローラーの位置を取得してラインを描画
  let rightControllerPos = null;
  const inputSources = state.xrSession.inputSources;
  for (const source of inputSources) {
    if (source.handedness === 'right' && source.gripSpace) {
      const gripPose = frame.getPose(source.gripSpace, referenceSpace);
      if (gripPose) {
        rightControllerPos = new THREE.Vector3().setFromMatrixPosition(
          new THREE.Matrix4().fromArray(gripPose.transform.matrix)
        );
        break;
      }
    }
  }

  if (rightControllerPos) {
    // ウィンドウの右下からコントローラーへのライン
    const lineStartOffset = new THREE.Vector3(0.2, -0.15, 0); // ウィンドウの右下
    lineStartOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    const lineStart = windowPos.clone().add(lineStartOffset);
    const lineEnd = rightControllerPos.clone();

    // ガイドラインの作成/更新
    if (!state.tutorial2GuideLine) {
      const lineGeometry = new THREE.BufferGeometry();
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.8
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      state.scene.add(line);
      state.setTutorial2GuideLine(line);
    }

    // ラインの頂点を更新
    const positions = new Float32Array([
      lineStart.x, lineStart.y, lineStart.z,
      lineEnd.x, lineEnd.y, lineEnd.z
    ]);
    state.tutorial2GuideLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    state.tutorial2GuideLine.geometry.attributes.position.needsUpdate = true;

    // ドット（Aボタン位置を示す点滅する球）の作成/更新
    if (!state.tutorial2GuideDot) {
      const dotGeometry = new THREE.SphereGeometry(0.015, 16, 16);
      const dotMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true
      });
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      state.scene.add(dot);
      state.setTutorial2GuideDot(dot);
    }

    // ドットの位置を更新（コントローラー位置）
    state.tutorial2GuideDot.position.copy(rightControllerPos);

    // ドットの点滅アニメーション
    const pulseSpeed = 3.0;
    const pulse = (Math.sin(Date.now() * 0.001 * pulseSpeed) + 1) / 2;
    state.tutorial2GuideDot.material.opacity = 0.3 + pulse * 0.7;
    state.tutorial2GuideDot.scale.setScalar(0.8 + pulse * 0.4);
  }
}

// チュートリアル3用のキャンバスとテクスチャ
let tutorial3Canvas = null;
let tutorial3Texture = null;

// チュートリアル3ウィンドウを作成
export function createTutorial3Window() {
  if (state.tutorial3Window) return;

  playWindowOpenSound();

  // キャンバス作成
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  tutorial3Canvas = canvas;

  // テクスチャ作成
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  tutorial3Texture = texture;

  // 初期描画
  redrawTutorial3Window();

  // メッシュ作成
  const geometry = new THREE.PlaneGeometry(0.6, 0.4);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  state.scene.add(mesh);
  state.setTutorial3Window(mesh);
  state.setIsTutorial3Visible(true);

  // アニメーション開始
  state.setTutorial3AnimProgress(0);
  state.setTutorial3Animating(true);
  state.setTutorial3AnimDirection(1);
}

// チュートリアル3ウィンドウを再描画
function redrawTutorial3Window() {
  if (!tutorial3Canvas) return;

  const canvas = tutorial3Canvas;
  const ctx = canvas.getContext('2d');

  // キャンバスをクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景（半透明）
  ctx.fillStyle = 'rgba(10, 10, 26, 0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 枠線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  // 内側の光彩効果
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(0, 200, 255, 0.1)');
  gradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.05)');
  gradient.addColorStop(1, 'rgba(0, 200, 255, 0.1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(4, 4, canvas.width - 8, canvas.height - 8);

  // ステップ番号
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#ffcc00';
  ctx.textAlign = 'center';
  ctx.fillText(t('tutorial3', 'step'), canvas.width / 2, 35);

  // タイトル（日本語）
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#00c8ff';
  ctx.shadowColor = 'rgba(0, 200, 255, 0.8)';
  ctx.shadowBlur = 15;
  ctx.fillText(t('tutorial3', 'title'), canvas.width / 2, 75);
  ctx.shadowBlur = 0;

  // タイトル（英語）
  ctx.font = '18px Arial';
  ctx.fillStyle = 'rgba(0, 200, 255, 0.7)';
  ctx.fillText(t('tutorial3', 'titleEn'), canvas.width / 2, 100);

  // 区切り線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 120);
  ctx.lineTo(canvas.width - 40, 120);
  ctx.stroke();

  // 説明文（日本語）
  ctx.font = '22px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(t('tutorial3', 'instruction1'), canvas.width / 2, 175);

  // 説明文（英語）
  ctx.font = '18px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText(t('tutorial3', 'instruction1En'), canvas.width / 2, 205);

  // 区切り線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.beginPath();
  ctx.moveTo(40, 260);
  ctx.lineTo(canvas.width - 40, 260);
  ctx.stroke();

  // 次へ説明（日本語）- 右寄せ
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#ffff00';
  ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.textAlign = 'right';
  ctx.fillText(t('tutorial3', 'nextWithA'), canvas.width - 40, 310);
  ctx.shadowBlur = 0;

  // 次へ説明（英語）- 右寄せ
  ctx.font = '18px Arial';
  ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
  ctx.fillText(t('tutorial3', 'nextWithAEn'), canvas.width - 40, 340);
  ctx.textAlign = 'center';

  // テクスチャを更新
  if (tutorial3Texture) {
    tutorial3Texture.needsUpdate = true;
  }
}

// チュートリアル3ウィンドウを削除（アニメーション開始）
export function removeTutorial3Window() {
  if (!state.tutorial3Window || !state.isTutorial3Visible) return;

  playWindowCloseSound();
  state.setTutorial3AnimDirection(-1);
  state.setTutorial3Animating(true);
}

// チュートリアル3ウィンドウのアニメーション更新
function updateTutorial3WindowAnimation() {
  if (!state.tutorial3Animating) return;

  const speed = 0.08;
  let progress = state.tutorial3AnimProgress;

  if (state.tutorial3AnimDirection === 1) {
    progress += speed;
    if (progress >= 1) {
      progress = 1;
      state.setTutorial3Animating(false);
    }
  } else {
    progress -= speed;
    if (progress <= 0) {
      progress = 0;
      state.setTutorial3Animating(false);
      // 完全に閉じたらメッシュを削除
      if (state.tutorial3Window) {
        state.scene.remove(state.tutorial3Window);
        if (state.tutorial3Window.geometry) state.tutorial3Window.geometry.dispose();
        if (state.tutorial3Window.material) {
          if (state.tutorial3Window.material.map) state.tutorial3Window.material.map.dispose();
          state.tutorial3Window.material.dispose();
        }
        state.setTutorial3Window(null);
        state.setIsTutorial3Visible(false);
        tutorial3Canvas = null;
        tutorial3Texture = null;
      }
      // ガイドラインとドットも削除
      if (state.tutorial3GuideLine) {
        state.scene.remove(state.tutorial3GuideLine);
        if (state.tutorial3GuideLine.geometry) state.tutorial3GuideLine.geometry.dispose();
        if (state.tutorial3GuideLine.material) state.tutorial3GuideLine.material.dispose();
        state.setTutorial3GuideLine(null);
      }
      if (state.tutorial3GuideDot) {
        state.scene.remove(state.tutorial3GuideDot);
        if (state.tutorial3GuideDot.geometry) state.tutorial3GuideDot.geometry.dispose();
        if (state.tutorial3GuideDot.material) state.tutorial3GuideDot.material.dispose();
        state.setTutorial3GuideDot(null);
      }
    }
  }

  state.setTutorial3AnimProgress(progress);

  // メッシュのスケールとアルファを更新
  if (state.tutorial3Window) {
    const eased = easeOutBack(progress);
    state.tutorial3Window.scale.set(eased, eased, 1);
    if (state.tutorial3Window.material) {
      state.tutorial3Window.material.opacity = progress;
    }
  }
}

// チュートリアル3ウィンドウの更新（毎フレーム呼び出し）
export function updateTutorial3Window() {
  // アニメーション更新
  updateTutorial3WindowAnimation();

  if (!state.tutorial3Window || !state.xrSession) return;

  const frame = state.renderer.xr.getFrame();
  const referenceSpace = state.renderer.xr.getReferenceSpace();

  if (!frame || !referenceSpace) return;

  // カメラ位置を取得
  const cameraPos = new THREE.Vector3();
  const cameraQuat = new THREE.Quaternion();
  state.camera.getWorldPosition(cameraPos);
  state.camera.getWorldQuaternion(cameraQuat);

  // カメラの前方向
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(cameraQuat);

  // ウィンドウの位置（カメラの前方1m、少し下に）
  const windowPos = cameraPos.clone().add(forward.clone().multiplyScalar(1.0));
  windowPos.y -= 0.15; // 少し下に配置
  state.tutorial3Window.position.copy(windowPos);

  // Y軸回転のみでカメラの方を向く
  const direction = new THREE.Vector3();
  direction.subVectors(cameraPos, windowPos);
  direction.y = 0;
  direction.normalize();

  const angle = Math.atan2(direction.x, direction.z);
  state.tutorial3Window.rotation.set(0, angle, 0);

  // 左コントローラーの位置を取得してラインを描画（Xボタンは左コントローラー）
  let leftControllerPos = null;
  const inputSources = state.xrSession.inputSources;
  for (const source of inputSources) {
    if (source.handedness === 'left' && source.gripSpace) {
      const gripPose = frame.getPose(source.gripSpace, referenceSpace);
      if (gripPose) {
        leftControllerPos = new THREE.Vector3().setFromMatrixPosition(
          new THREE.Matrix4().fromArray(gripPose.transform.matrix)
        );
        break;
      }
    }
  }

  if (leftControllerPos) {
    // ウィンドウの左下からコントローラーへのライン
    const lineStartOffset = new THREE.Vector3(-0.2, -0.15, 0); // ウィンドウの左下
    lineStartOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    const lineStart = windowPos.clone().add(lineStartOffset);
    const lineEnd = leftControllerPos.clone();

    // ガイドラインの作成/更新
    if (!state.tutorial3GuideLine) {
      const lineGeometry = new THREE.BufferGeometry();
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.8
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      state.scene.add(line);
      state.setTutorial3GuideLine(line);
    }

    // ラインの頂点を更新
    const positions = new Float32Array([
      lineStart.x, lineStart.y, lineStart.z,
      lineEnd.x, lineEnd.y, lineEnd.z
    ]);
    state.tutorial3GuideLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    state.tutorial3GuideLine.geometry.attributes.position.needsUpdate = true;

    // ドット（Xボタン位置を示す点滅する球）の作成/更新
    if (!state.tutorial3GuideDot) {
      const dotGeometry = new THREE.SphereGeometry(0.015, 16, 16);
      const dotMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true
      });
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      state.scene.add(dot);
      state.setTutorial3GuideDot(dot);
    }

    // ドットの位置を更新（コントローラー位置）
    state.tutorial3GuideDot.position.copy(leftControllerPos);

    // ドットの点滅アニメーション
    const pulseSpeed = 3.0;
    const pulse = (Math.sin(Date.now() * 0.001 * pulseSpeed) + 1) / 2;
    state.tutorial3GuideDot.material.opacity = 0.3 + pulse * 0.7;
    state.tutorial3GuideDot.scale.setScalar(0.8 + pulse * 0.4);
  }
}

// チュートリアル4用のキャンバスとテクスチャ
let tutorial4Canvas = null;
let tutorial4Texture = null;

// チュートリアル4ウィンドウを作成
export function createTutorial4Window() {
  if (state.tutorial4Window) return;

  playWindowOpenSound();

  // キャンバス作成
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  tutorial4Canvas = canvas;

  // テクスチャ作成
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  tutorial4Texture = texture;

  // 初期描画
  redrawTutorial4Window();

  // メッシュ作成
  const geometry = new THREE.PlaneGeometry(0.6, 0.4);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  state.scene.add(mesh);
  state.setTutorial4Window(mesh);
  state.setIsTutorial4Visible(true);

  // アニメーション開始
  state.setTutorial4AnimProgress(0);
  state.setTutorial4Animating(true);
  state.setTutorial4AnimDirection(1);
}

// チュートリアル4ウィンドウを再描画
function redrawTutorial4Window() {
  if (!tutorial4Canvas) return;

  const canvas = tutorial4Canvas;
  const ctx = canvas.getContext('2d');

  // キャンバスをクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景（半透明）
  ctx.fillStyle = 'rgba(10, 10, 26, 0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 枠線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  // 内側の光彩効果
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, 'rgba(0, 200, 255, 0.1)');
  gradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.05)');
  gradient.addColorStop(1, 'rgba(0, 200, 255, 0.1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(4, 4, canvas.width - 8, canvas.height - 8);

  // ステップ番号
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#ffcc00';
  ctx.textAlign = 'center';
  ctx.fillText(t('tutorial4', 'step'), canvas.width / 2, 35);

  // タイトル（日本語）
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#00c8ff';
  ctx.shadowColor = 'rgba(0, 200, 255, 0.8)';
  ctx.shadowBlur = 15;
  ctx.fillText(t('tutorial4', 'title'), canvas.width / 2, 75);
  ctx.shadowBlur = 0;

  // タイトル（英語）
  ctx.font = '18px Arial';
  ctx.fillStyle = 'rgba(0, 200, 255, 0.7)';
  ctx.fillText(t('tutorial4', 'titleEn'), canvas.width / 2, 100);

  // 区切り線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 120);
  ctx.lineTo(canvas.width - 40, 120);
  ctx.stroke();

  // 説明文1行目（日本語）
  ctx.font = '22px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(t('tutorial4', 'instruction1'), canvas.width / 2, 155);

  // 説明文2行目（日本語）
  ctx.font = 'bold 26px Arial';
  ctx.fillStyle = '#ffff00';
  ctx.shadowColor = 'rgba(255, 255, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText(t('tutorial4', 'instruction2'), canvas.width / 2, 195);
  ctx.shadowBlur = 0;

  // 説明文（英語）
  ctx.font = '16px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText(t('tutorial4', 'instruction1En'), canvas.width / 2, 235);
  ctx.fillText(t('tutorial4', 'instruction2En'), canvas.width / 2, 255);

  // 区切り線
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
  ctx.beginPath();
  ctx.moveTo(40, 280);
  ctx.lineTo(canvas.width - 40, 280);
  ctx.stroke();

  // 次へ説明（日本語）- 右寄せ
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#00ff00';
  ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.textAlign = 'right';
  ctx.fillText(t('tutorial4', 'nextWithA'), canvas.width - 40, 325);
  ctx.shadowBlur = 0;

  // 次へ説明（英語）- 右寄せ
  ctx.font = '16px Arial';
  ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
  ctx.fillText(t('tutorial4', 'nextWithAEn'), canvas.width - 40, 350);
  ctx.textAlign = 'center';

  // テクスチャを更新
  if (tutorial4Texture) {
    tutorial4Texture.needsUpdate = true;
  }
}

// チュートリアル4ウィンドウを削除（アニメーション開始）
export function removeTutorial4Window() {
  if (!state.tutorial4Window || !state.isTutorial4Visible) return;

  playWindowCloseSound();
  fadeOutTutorialBGM(2000);
  state.setTutorial4AnimDirection(-1);
  state.setTutorial4Animating(true);
}

// チュートリアル4ウィンドウのアニメーション更新
function updateTutorial4WindowAnimation() {
  if (!state.tutorial4Animating) return;

  const speed = 0.08;
  let progress = state.tutorial4AnimProgress;

  if (state.tutorial4AnimDirection === 1) {
    progress += speed;
    if (progress >= 1) {
      progress = 1;
      state.setTutorial4Animating(false);
    }
  } else {
    progress -= speed;
    if (progress <= 0) {
      progress = 0;
      state.setTutorial4Animating(false);
      // 完全に閉じたらメッシュを削除
      if (state.tutorial4Window) {
        state.scene.remove(state.tutorial4Window);
        if (state.tutorial4Window.geometry) state.tutorial4Window.geometry.dispose();
        if (state.tutorial4Window.material) {
          if (state.tutorial4Window.material.map) state.tutorial4Window.material.map.dispose();
          state.tutorial4Window.material.dispose();
        }
        state.setTutorial4Window(null);
        state.setIsTutorial4Visible(false);
        tutorial4Canvas = null;
        tutorial4Texture = null;
      }
      // ガイドラインとドットも削除
      if (state.tutorial4GuideLine) {
        state.scene.remove(state.tutorial4GuideLine);
        if (state.tutorial4GuideLine.geometry) state.tutorial4GuideLine.geometry.dispose();
        if (state.tutorial4GuideLine.material) state.tutorial4GuideLine.material.dispose();
        state.setTutorial4GuideLine(null);
      }
      if (state.tutorial4GuideDot) {
        state.scene.remove(state.tutorial4GuideDot);
        if (state.tutorial4GuideDot.geometry) state.tutorial4GuideDot.geometry.dispose();
        if (state.tutorial4GuideDot.material) state.tutorial4GuideDot.material.dispose();
        state.setTutorial4GuideDot(null);
      }
    }
  }

  state.setTutorial4AnimProgress(progress);

  // メッシュのスケールとアルファを更新
  if (state.tutorial4Window) {
    const eased = easeOutBack(progress);
    state.tutorial4Window.scale.set(eased, eased, 1);
    if (state.tutorial4Window.material) {
      state.tutorial4Window.material.opacity = progress;
    }
  }
}

// チュートリアル4ウィンドウの更新（毎フレーム呼び出し）
export function updateTutorial4Window() {
  // アニメーション更新
  updateTutorial4WindowAnimation();

  if (!state.tutorial4Window || !state.xrSession) return;

  const frame = state.renderer.xr.getFrame();
  const referenceSpace = state.renderer.xr.getReferenceSpace();

  if (!frame || !referenceSpace) return;

  // カメラ位置を取得
  const cameraPos = new THREE.Vector3();
  const cameraQuat = new THREE.Quaternion();
  state.camera.getWorldPosition(cameraPos);
  state.camera.getWorldQuaternion(cameraQuat);

  // カメラの前方向
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(cameraQuat);

  // ウィンドウの位置（カメラの前方1m、少し下に）
  const windowPos = cameraPos.clone().add(forward.clone().multiplyScalar(1.0));
  windowPos.y -= 0.15; // 少し下に配置
  state.tutorial4Window.position.copy(windowPos);

  // Y軸回転のみでカメラの方を向く
  const direction = new THREE.Vector3();
  direction.subVectors(cameraPos, windowPos);
  direction.y = 0;
  direction.normalize();

  const angle = Math.atan2(direction.x, direction.z);
  state.tutorial4Window.rotation.set(0, angle, 0);

  // 左コントローラーの位置を取得してラインを描画（Yボタンは左コントローラー）
  let leftControllerPos = null;
  const inputSources = state.xrSession.inputSources;
  for (const source of inputSources) {
    if (source.handedness === 'left' && source.gripSpace) {
      const gripPose = frame.getPose(source.gripSpace, referenceSpace);
      if (gripPose) {
        leftControllerPos = new THREE.Vector3().setFromMatrixPosition(
          new THREE.Matrix4().fromArray(gripPose.transform.matrix)
        );
        break;
      }
    }
  }

  if (leftControllerPos) {
    // ウィンドウの左下からコントローラーへのライン
    const lineStartOffset = new THREE.Vector3(-0.2, -0.15, 0); // ウィンドウの左下
    lineStartOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    const lineStart = windowPos.clone().add(lineStartOffset);
    const lineEnd = leftControllerPos.clone();

    // ガイドラインの作成/更新
    if (!state.tutorial4GuideLine) {
      const lineGeometry = new THREE.BufferGeometry();
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.8
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      state.scene.add(line);
      state.setTutorial4GuideLine(line);
    }

    // ラインの頂点を更新
    const positions = new Float32Array([
      lineStart.x, lineStart.y, lineStart.z,
      lineEnd.x, lineEnd.y, lineEnd.z
    ]);
    state.tutorial4GuideLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    state.tutorial4GuideLine.geometry.attributes.position.needsUpdate = true;

    // ドット（Yボタン位置を示す点滅する球）の作成/更新
    if (!state.tutorial4GuideDot) {
      const dotGeometry = new THREE.SphereGeometry(0.015, 16, 16);
      const dotMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true
      });
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      state.scene.add(dot);
      state.setTutorial4GuideDot(dot);
    }

    // ドットの位置を更新（コントローラー位置）
    state.tutorial4GuideDot.position.copy(leftControllerPos);

    // ドットの点滅アニメーション
    const pulseSpeed = 3.0;
    const pulse = (Math.sin(Date.now() * 0.001 * pulseSpeed) + 1) / 2;
    state.tutorial4GuideDot.material.opacity = 0.3 + pulse * 0.7;
    state.tutorial4GuideDot.scale.setScalar(0.8 + pulse * 0.4);
  }
}
