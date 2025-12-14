import * as THREE from 'three';

// シーン関連
export let scene = null;
export let camera = null;
export let renderer = null;
export let drone = null;
export let xrSession = null;
export let rightController = null;
export let leftController = null;
export let dronePositioned = false;
export let propellers = [];
export let gamepad = null;
export let audioListener = null;
export let droneSound = null;
export let hoverTime = 0;
export let isSoundMuted = false;
export let leftStickButtonPressed = false;
export let leftYButtonPressed = false;
export let droneBoundingBox = null;
export let droneCollisionRadius = { horizontal: 0.15, vertical: 0.05 };

// 衝突エフェクト用変数
export let collisionParticles = [];
export let lastCollisionTime = 0;
export let isColliding = false;

// Aボタン用フォーメーション切り替え（K → MU → I → (^_^) → 元）
// 0: 元, 1: K, 2: MU, 3: I, 4: (^_^)
export let formationIndex = 0;
export let formationAnimating = false;
export let formationStartTime = null;
export function setFormationStartTime(value) { formationStartTime = value; }
export let droneChildren = [];
export let droneOriginalPositions = [];
export let droneKPositions = [];
export let droneMUPositions = [];
export let droneIPositions = [];
export let droneSmilePositions = []; // (^_^)
export let rightAButtonPressed = false;
export function setFormationIndex(value) { formationIndex = value; }
export function setFormationAnimating(value) { formationAnimating = value; }
export function setDroneChildren(value) { droneChildren = value; }
export function setDroneOriginalPositions(value) { droneOriginalPositions = value; }
export function setDroneKPositions(value) { droneKPositions = value; }
export function setDroneMUPositions(value) { droneMUPositions = value; }
export function setDroneIPositions(value) { droneIPositions = value; }
export function setDroneSmilePositions(value) { droneSmilePositions = value; }
export function setRightAButtonPressed(value) { rightAButtonPressed = value; }

// Xボタン用フォーメーション切り替え（猫 → メビウス → 泣き顔 → 波 → 元）
// 0: 元, 1: 猫, 2: メビウス(八の字), 3: 泣き顔, 4: 波
export let formationIndexX = 0;
export let formationAnimatingX = false;
export let formationStartTimeX = null;
export let formationAnimationTimeX = 0;
export let droneCatPositions = [];
export let droneMobiusPositions = [];
export let droneCryingPositions = [];
export let droneWavePositions = [];
export let leftXButtonPressedForFormation = false;
export function setFormationIndexX(value) { formationIndexX = value; }
export function setFormationAnimatingX(value) { formationAnimatingX = value; }
export function setFormationStartTimeX(value) { formationStartTimeX = value; }
export function setFormationAnimationTimeX(value) { formationAnimationTimeX = value; }
export function setDroneCatPositions(value) { droneCatPositions = value; }
export function setDroneMobiusPositions(value) { droneMobiusPositions = value; }
export function setDroneCryingPositions(value) { droneCryingPositions = value; }
export function setDroneWavePositions(value) { droneWavePositions = value; }
export function setLeftXButtonPressedForFormation(value) { leftXButtonPressedForFormation = value; }

// 自動帰還モード用変数
export let isAutoReturning = false;
export let autoReturnTarget = new THREE.Vector3();
export let autoReturnSpeed = 0.02;
export let autoReturnPhase = 'horizontal';
export let rightBButtonPressed = false;
export let autoReturnText = null;
export let autoReturnRightControllerText = null;
export let autoReturnLeftControllerText = null;
export let volumeText = null;
export let collisionText = null;
export let isCollisionEnabled = true;
export let rightStickButtonPressed = false;
export let rightAButtonPressedForCollision = false;
export let controllerGuideMenu = null;
export let isControllerGuideVisible = false;
export let rightAButtonPressedForGuide = false;
export let settingsMenu = null;
export let isSettingsMenuVisible = false;
export let leftYButtonPressedForSettings = false;
export let settingsMenuSelectedIndex = 0;
export let settingsLaserLine = null;
export let settingsLaserDot = null;

// メニューアニメーション用変数
export let controllerGuideAnimProgress = 0;
export let controllerGuideAnimating = false;
export let controllerGuideAnimDirection = 1; // 1: 開く, -1: 閉じる
export let settingsMenuAnimProgress = 0;
export let settingsMenuAnimating = false;
export let settingsMenuAnimDirection = 1; // 1: 開く, -1: 閉じる

// チュートリアル（ウェルカム）ウィンドウ用変数
export let welcomeWindow = null;
export let isWelcomeWindowVisible = false;
export let welcomeWindowAnimProgress = 0;
export let welcomeWindowAnimating = false;
export let welcomeWindowAnimDirection = 1; // 1: 開く, -1: 閉じる
export let rightAButtonPressedForWelcome = false;
export let welcomeGuideLine = null;
export let welcomeGuideDot = null;
export let tutorialStep = 1; // 1: 最初のウェルカム, 2: コントロールガイドの案内

// チュートリアル2用変数
export let tutorial2Window = null;
export let isTutorial2Visible = false;
export let tutorial2AnimProgress = 0;
export let tutorial2Animating = false;
export let tutorial2AnimDirection = 1;
export let tutorial2GuideLine = null;
export let tutorial2GuideDot = null;

// チュートリアル3用変数（設定ウィンドウの案内）
export let tutorial3Window = null;
export let isTutorial3Visible = false;
export let tutorial3AnimProgress = 0;
export let tutorial3Animating = false;
export let tutorial3AnimDirection = 1;
export let tutorial3GuideLine = null;
export let tutorial3GuideDot = null;

// チュートリアル4用変数（ドローン起動の案内）
export let tutorial4Window = null;
export let isTutorial4Visible = false;
export let tutorial4AnimProgress = 0;
export let tutorial4Animating = false;
export let tutorial4AnimDirection = 1;
export let tutorial4GuideLine = null;
export let tutorial4GuideDot = null;

// チュートリアル3用Xボタン押下フラグ
export let leftXButtonPressedForTutorial3 = false;

// チュートリアル完了フラグ（一度完了したら再度表示しない）
export let tutorialCompleted = false;
// チュートリアル再開フラグ（設定から再開する場合）
export let restartTutorial = false;

export let trackingLostText = null;
export let isLeftControllerTracked = true;
export let isRightControllerTracked = true;
export let sequenceStatusText = null;

// 起動シーケンス用変数
export let isStartupComplete = false;
export let isStartingUp = false;
export let propellerSpeedMultiplier = 0;
export let propellerRotationSpeed = 1.0;
export const basePropellerRotationSpeed = 1.0;
export let leftXButtonPressed = false;
export let liftStartTime = null;
export let liftStartPos = null;
export let liftTargetHeight = null;
export let liftLastY = null;
export let liftStuckStartTime = null;

// 終了シーケンス用変数
export let isShuttingDown = false;
export let descentStartTime = null;
export let decelerationStartTime = null;
export let descentLastY = null;
export let descentStuckStartTime = null;
export let landingHeight = null;
export let hasLanded = false;

// 起動前の物理シミュレーション用変数
export let dronePhysicsVelocity = new THREE.Vector3(0, 0, 0);
export let droneAngularVelocity = new THREE.Vector3(0, 0, 0);
export let dronePreviousPosition = new THREE.Vector3(0, 0, 0);

// 方向ガイド用変数
export let hudDroneLocationArrow = null;

// 深度センサー用変数
export let depthDataTexture = null;
export let depthMesh = null;
export let showDepthVisualization = false;

// plane-detection用変数
export let detectedPlanes = new Map();

// VR用背景とグリッド
export let vrBackground = null;
export let gridHelper = null;
export let vrObstacles = [];
export let vrFloor = null;
export let vrShadowLight = null;

// MR用の検出平面影メッシュ
export let mrPlaneShadowMeshes = new Map();

export function setVrObstacles(value) { vrObstacles = value; }
export function setVrFloor(value) { vrFloor = value; }
export function setVrShadowLight(value) { vrShadowLight = value; }
export function setMrPlaneShadowMeshes(value) { mrPlaneShadowMeshes = value; }

// ハンドトラッキングとグリップ機能用変数
export let hand1 = null;
export let hand2 = null;
export let isGrabbedByController = false;
export let isGrabbedByHand = false;
export let grabbingController = null;
export let grabbingInputSource = null;
export let grabbingHand = null;
export let grabOffset = new THREE.Vector3();
export let grabRotationOffset = new THREE.Quaternion();
export let rightGripPressed = false;
export let leftGripPressed = false;
export let bothGripsPressed = false;
export let initialControllerDistance = 0;
export let initialDroneScale = 0.03;
export let currentDroneScale = 0.03; // 1/10サイズ
export let smoothedHandPosition = new THREE.Vector3();
export let smoothedHandRotation = new THREE.Quaternion();
export const handSmoothingFactor = 0.3;
export let smoothedControllerPosition = new THREE.Vector3();
export let smoothedControllerRotation = new THREE.Quaternion();
export const controllerSmoothingFactor = 0.3;
export let previousDronePosition = new THREE.Vector3();
export let droneVelocity = 0;

// 離した時のアニメーション用変数
export let isReturningToHover = false;
export let returnStartPosition = new THREE.Vector3();
export let returnStartRotation = new THREE.Quaternion();
export let returnTargetRotation = new THREE.Quaternion();
export let returnProgress = 0;
export const returnDuration = 1.0;
export const returnSpeed = 1.0 / returnDuration;

// 物理演算用パラメータ
export let velocity = new THREE.Vector3(0, 0, 0);
export let angularVelocity = 0;
export let acceleration = 0.001;
export const baseAcceleration = 0.001;
export let maxSpeed = 0.015;
export const baseMaxSpeed = 0.015;
export let speedLevel = 10;
export let speedTextTimerId = null;
export let leftTriggerPressed = false;
export let rightTriggerPressed = false;
export let speedText = null;
export let speedRightControllerText = null;
export let speedLeftControllerText = null;
export let friction = 0.965;
export const baseFriction = 0.965;
export let angularAcceleration = 0.0015;
export const baseAngularAcceleration = 0.0015;
export let maxAngularSpeed = 0.06;
export const baseMaxAngularSpeed = 0.06;
export let angularFriction = 0.965;
export const baseAngularFriction = 0.965;
export let tiltAmount = 0.6;
export const tiltSmoothing = 0.05;
export let stickDeadzone = 0.15;
export let isFpvMode = false;
export let isMrMode = false;
export let fpvCameraOffset = new THREE.Vector3();
export let baseReferenceSpace = null;
export let fpvInitialCameraPos = null;
export let fpvInitialDronePos = null;
export let fpvInitialDroneRotationY = 0;
export let wasFpvMode = false;

// 言語設定（'ja': 日本語, 'en': 英語）
// デバイスの言語設定を自動検出
function detectLanguage() {
  const browserLang = navigator.language || navigator.userLanguage || 'en';
  // 日本語環境の場合は'ja'、それ以外は'en'
  return browserLang.startsWith('ja') ? 'ja' : 'en';
}
export let currentLanguage = detectLanguage();

// セッター関数群
export function setScene(value) { scene = value; }
export function setCamera(value) { camera = value; }
export function setRenderer(value) { renderer = value; }
export function setDrone(value) { drone = value; }
export function setXrSession(value) { xrSession = value; }
export function setRightController(value) { rightController = value; }
export function setLeftController(value) { leftController = value; }
export function setDronePositioned(value) { dronePositioned = value; }
export function setPropellers(value) { propellers = value; }
export function setGamepad(value) { gamepad = value; }
export function setAudioListener(value) { audioListener = value; }
export function setDroneSound(value) { droneSound = value; }
export function setHoverTime(value) { hoverTime = value; }
export function setIsSoundMuted(value) { isSoundMuted = value; }
export function setLeftStickButtonPressed(value) { leftStickButtonPressed = value; }
export function setLeftYButtonPressed(value) { leftYButtonPressed = value; }
export function setDroneBoundingBox(value) { droneBoundingBox = value; }
export function setDroneCollisionRadius(value) { droneCollisionRadius = value; }
export function setCollisionParticles(value) { collisionParticles = value; }
export function setLastCollisionTime(value) { lastCollisionTime = value; }
export function setIsColliding(value) { isColliding = value; }
export function setIsAutoReturning(value) { isAutoReturning = value; }
export function setAutoReturnTarget(value) { autoReturnTarget = value; }
export function setAutoReturnSpeed(value) { autoReturnSpeed = value; }
export function setAutoReturnPhase(value) { autoReturnPhase = value; }
export function setRightBButtonPressed(value) { rightBButtonPressed = value; }
export function setAutoReturnText(value) { autoReturnText = value; }
export function setAutoReturnRightControllerText(value) { autoReturnRightControllerText = value; }
export function setAutoReturnLeftControllerText(value) { autoReturnLeftControllerText = value; }
export function setVolumeText(value) { volumeText = value; }
export function setCollisionText(value) { collisionText = value; }
export function setIsCollisionEnabled(value) { isCollisionEnabled = value; }
export function setRightStickButtonPressed(value) { rightStickButtonPressed = value; }
export function setRightAButtonPressedForCollision(value) { rightAButtonPressedForCollision = value; }
export function setControllerGuideMenu(value) { controllerGuideMenu = value; }
export function setIsControllerGuideVisible(value) { isControllerGuideVisible = value; }
export function setRightAButtonPressedForGuide(value) { rightAButtonPressedForGuide = value; }
export function setSettingsMenu(value) { settingsMenu = value; }
export function setIsSettingsMenuVisible(value) { isSettingsMenuVisible = value; }
export function setLeftYButtonPressedForSettings(value) { leftYButtonPressedForSettings = value; }
export function setSettingsMenuSelectedIndex(value) { settingsMenuSelectedIndex = value; }
export function setSettingsLaserLine(value) { settingsLaserLine = value; }
export function setSettingsLaserDot(value) { settingsLaserDot = value; }
export function setControllerGuideAnimProgress(value) { controllerGuideAnimProgress = value; }
export function setControllerGuideAnimating(value) { controllerGuideAnimating = value; }
export function setControllerGuideAnimDirection(value) { controllerGuideAnimDirection = value; }
export function setSettingsMenuAnimProgress(value) { settingsMenuAnimProgress = value; }
export function setSettingsMenuAnimating(value) { settingsMenuAnimating = value; }
export function setSettingsMenuAnimDirection(value) { settingsMenuAnimDirection = value; }
export function setWelcomeWindow(value) { welcomeWindow = value; }
export function setIsWelcomeWindowVisible(value) { isWelcomeWindowVisible = value; }
export function setWelcomeWindowAnimProgress(value) { welcomeWindowAnimProgress = value; }
export function setWelcomeWindowAnimating(value) { welcomeWindowAnimating = value; }
export function setWelcomeWindowAnimDirection(value) { welcomeWindowAnimDirection = value; }
export function setRightAButtonPressedForWelcome(value) { rightAButtonPressedForWelcome = value; }
export function setWelcomeGuideLine(value) { welcomeGuideLine = value; }
export function setWelcomeGuideDot(value) { welcomeGuideDot = value; }
export function setTutorialStep(value) { tutorialStep = value; }
export function setTutorial2Window(value) { tutorial2Window = value; }
export function setIsTutorial2Visible(value) { isTutorial2Visible = value; }
export function setTutorial2AnimProgress(value) { tutorial2AnimProgress = value; }
export function setTutorial2Animating(value) { tutorial2Animating = value; }
export function setTutorial2AnimDirection(value) { tutorial2AnimDirection = value; }
export function setTutorial2GuideLine(value) { tutorial2GuideLine = value; }
export function setTutorial2GuideDot(value) { tutorial2GuideDot = value; }
export function setTutorial3Window(value) { tutorial3Window = value; }
export function setIsTutorial3Visible(value) { isTutorial3Visible = value; }
export function setTutorial3AnimProgress(value) { tutorial3AnimProgress = value; }
export function setTutorial3Animating(value) { tutorial3Animating = value; }
export function setTutorial3AnimDirection(value) { tutorial3AnimDirection = value; }
export function setTutorial3GuideLine(value) { tutorial3GuideLine = value; }
export function setTutorial3GuideDot(value) { tutorial3GuideDot = value; }
export function setTutorial4Window(value) { tutorial4Window = value; }
export function setIsTutorial4Visible(value) { isTutorial4Visible = value; }
export function setTutorial4AnimProgress(value) { tutorial4AnimProgress = value; }
export function setTutorial4Animating(value) { tutorial4Animating = value; }
export function setTutorial4AnimDirection(value) { tutorial4AnimDirection = value; }
export function setTutorial4GuideLine(value) { tutorial4GuideLine = value; }
export function setTutorial4GuideDot(value) { tutorial4GuideDot = value; }
export function setLeftXButtonPressedForTutorial3(value) { leftXButtonPressedForTutorial3 = value; }
export function setTutorialCompleted(value) { tutorialCompleted = value; }
export function setRestartTutorial(value) { restartTutorial = value; }
export function setTrackingLostText(value) { trackingLostText = value; }
export function setIsLeftControllerTracked(value) { isLeftControllerTracked = value; }
export function setIsRightControllerTracked(value) { isRightControllerTracked = value; }
export function setSequenceStatusText(value) { sequenceStatusText = value; }
export function setIsStartupComplete(value) { isStartupComplete = value; }
export function setIsStartingUp(value) { isStartingUp = value; }
export function setPropellerSpeedMultiplier(value) { propellerSpeedMultiplier = value; }
export function setPropellerRotationSpeed(value) { propellerRotationSpeed = value; }
export function setLeftXButtonPressed(value) { leftXButtonPressed = value; }
export function setLiftStartTime(value) { liftStartTime = value; }
export function setLiftStartPos(value) { liftStartPos = value; }
export function setLiftTargetHeight(value) { liftTargetHeight = value; }
export function setLiftLastY(value) { liftLastY = value; }
export function setLiftStuckStartTime(value) { liftStuckStartTime = value; }
export function setIsShuttingDown(value) { isShuttingDown = value; }
export function setDescentStartTime(value) { descentStartTime = value; }
export function setDecelerationStartTime(value) { decelerationStartTime = value; }
export function setDescentLastY(value) { descentLastY = value; }
export function setDescentStuckStartTime(value) { descentStuckStartTime = value; }
export function setLandingHeight(value) { landingHeight = value; }
export function setHasLanded(value) { hasLanded = value; }
export function setDronePhysicsVelocity(value) { dronePhysicsVelocity = value; }
export function setDroneAngularVelocity(value) { droneAngularVelocity = value; }
export function setDronePreviousPosition(value) { dronePreviousPosition = value; }
export function setHudDroneLocationArrow(value) { hudDroneLocationArrow = value; }
export function setDepthDataTexture(value) { depthDataTexture = value; }
export function setDepthMesh(value) { depthMesh = value; }
export function setShowDepthVisualization(value) { showDepthVisualization = value; }
export function setDetectedPlanes(value) { detectedPlanes = value; }
export function setVrBackground(value) { vrBackground = value; }
export function setGridHelper(value) { gridHelper = value; }
export function setHand1(value) { hand1 = value; }
export function setHand2(value) { hand2 = value; }
export function setIsGrabbedByController(value) { isGrabbedByController = value; }
export function setIsGrabbedByHand(value) { isGrabbedByHand = value; }
export function setGrabbingController(value) { grabbingController = value; }
export function setGrabbingInputSource(value) { grabbingInputSource = value; }
export function setGrabbingHand(value) { grabbingHand = value; }
export function setGrabOffset(value) { grabOffset = value; }
export function setGrabRotationOffset(value) { grabRotationOffset = value; }
export function setRightGripPressed(value) { rightGripPressed = value; }
export function setLeftGripPressed(value) { leftGripPressed = value; }
export function setBothGripsPressed(value) { bothGripsPressed = value; }
export function setInitialControllerDistance(value) { initialControllerDistance = value; }
export function setInitialDroneScale(value) { initialDroneScale = value; }
export function setCurrentDroneScale(value) { currentDroneScale = value; }
export function setSmoothedHandPosition(value) { smoothedHandPosition = value; }
export function setSmoothedHandRotation(value) { smoothedHandRotation = value; }
export function setSmoothedControllerPosition(value) { smoothedControllerPosition = value; }
export function setSmoothedControllerRotation(value) { smoothedControllerRotation = value; }
export function setPreviousDronePosition(value) { previousDronePosition = value; }
export function setDroneVelocity(value) { droneVelocity = value; }
export function setIsReturningToHover(value) { isReturningToHover = value; }
export function setReturnStartPosition(value) { returnStartPosition = value; }
export function setReturnStartRotation(value) { returnStartRotation = value; }
export function setReturnTargetRotation(value) { returnTargetRotation = value; }
export function setReturnProgress(value) { returnProgress = value; }
export function setVelocity(value) { velocity = value; }
export function setAngularVelocity(value) { angularVelocity = value; }
export function setAcceleration(value) { acceleration = value; }
export function setMaxSpeed(value) { maxSpeed = value; }
export function setSpeedLevel(value) { speedLevel = value; }
export function setSpeedTextTimerId(value) { speedTextTimerId = value; }
export function setLeftTriggerPressed(value) { leftTriggerPressed = value; }
export function setRightTriggerPressed(value) { rightTriggerPressed = value; }
export function setSpeedText(value) { speedText = value; }
export function setSpeedRightControllerText(value) { speedRightControllerText = value; }
export function setSpeedLeftControllerText(value) { speedLeftControllerText = value; }
export function setFriction(value) { friction = value; }
export function setAngularAcceleration(value) { angularAcceleration = value; }
export function setMaxAngularSpeed(value) { maxAngularSpeed = value; }
export function setAngularFriction(value) { angularFriction = value; }
export function setTiltAmount(value) { tiltAmount = value; }
export function setStickDeadzone(value) { stickDeadzone = value; }
export function setIsFpvMode(value) { isFpvMode = value; }
export function setIsMrMode(value) { isMrMode = value; }
export function setFpvCameraOffset(value) { fpvCameraOffset = value; }
export function setBaseReferenceSpace(value) { baseReferenceSpace = value; }
export function setFpvInitialCameraPos(value) { fpvInitialCameraPos = value; }
export function setFpvInitialDronePos(value) { fpvInitialDronePos = value; }
export function setFpvInitialDroneRotationY(value) { fpvInitialDroneRotationY = value; }
export function setWasFpvMode(value) { wasFpvMode = value; }
export function setCurrentLanguage(value) { currentLanguage = value; }
