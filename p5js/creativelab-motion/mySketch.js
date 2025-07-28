let logoL, logoC, logoR;
let backL, backC, backR;
let posL = 1.2, posR = 1.35; // 初期位置を画面右外に設定
let targetPosL = 0.425, targetPosR = 0.575; // 最終目標位置
let finalPosL = 0.425, finalPosR = 0.575; // 定位置（定数として定義）
let theShader;
let resolution = [];
let imageAspectRatio = 1;

// アニメーション制御パラメータ
let animationComplete = false;
let interactionEnabled = false;
let animationStartTime = 0;
let animationDuration = 2000; // 2.5秒
let interactionDelay = -200; // インタラクション開始までの遅延

// マウス制御パラメータ
let centerAreaRatio = 0.173;
let mouseSensitivity = 0.8;
let lineInertia = 0.96;
let minLineDistance = 0.13;

// マウス追跡用変数
let prevMouseX = 0;
let mouseVelocityX = 0;
let smoothedVelocity = 0;
let velocityHistory = [];
let historyLength = 5;

// エリア計算用変数
let leftAreaEnd, rightAreaStart;

function preload() {
  logoL = loadImage('logoL.png');
  logoC = loadImage('logoC.png');
  logoR = loadImage('logoR.png');
  backL = loadImage('backL.png');
  backC = loadImage('backC.png');
  backR = loadImage('backR.png');
  theShader = new p5.Shader(this.renderer, vert, frag);
}

function setup() {
  if (logoL.width && logoL.height) {
    imageAspectRatio = logoL.width / logoL.height;
  }
  
  let canvasSize = calculateCanvasSize(windowWidth, windowHeight);
  createCanvas(canvasSize.width, canvasSize.height, WEBGL);
  resolution = [canvasSize.width, canvasSize.height];
  
  // エリア境界を計算
  calculateAreas();
  
  // マウス位置を初期化
  prevMouseX = mouseX / width;
  
  // 速度履歴を初期化
  for (let i = 0; i < historyLength; i++) {
    velocityHistory.push(0);
  }
  
  // アニメーション開始
  animationStartTime = millis();
}

function draw() {
  background(255);
	centerAreaRatio = 0.25;
  
  // アニメーション処理
  if (!animationComplete) {
    updateAnimation();
  } else if (!interactionEnabled) {
    // アニメーション完了後の待機期間
    updateInteractionDelay();
    // 待機期間中は線を定位置に固定
    posL = finalPosL;
    posR = finalPosR;
    targetPosL = finalPosL;
    targetPosR = finalPosR;
  } else {
    // マウスインタラクション有効
    calculateMouseVelocity();
    updateLinePositions();
  }
	
  
  // シェーダーの描画
  shader(theShader);
  theShader.setUniform('logoL', logoL);
  theShader.setUniform('logoC', logoC);
  theShader.setUniform('logoR', logoR);
  theShader.setUniform('backL', backL);
  theShader.setUniform('backC', backC);
  theShader.setUniform('backR', backR);
  theShader.setUniform('u_resolution', resolution);
  theShader.setUniform('u_linePositions', [posL, posR]);
  theShader.setUniform('u_time', millis() * 0.001);
	
	let animationProgress = constrain(map(millis() - animationStartTime, animationDuration -250, animationDuration + 750, 0, 1), 0, 1);
	theShader.setUniform('u_alphaAnimation', animationProgress);
  
  noStroke();
  fill(255);
  rect(0, 0, resolution[0], resolution[1]);
}

function updateAnimation() {
  let currentTime = millis();
  let elapsed = currentTime - animationStartTime;
  let progress = elapsed / animationDuration;
  
  if (progress >= 1.0) {
    // アニメーション完了
    progress = 1.0;
    animationComplete = true;
    posL = finalPosL;
    posR = finalPosR;
    targetPosL = finalPosL;
    targetPosR = finalPosR;
  } else {
    // バック系イージング関数を適用
    let easedProgress = easeOut(progress);
    
    // 初期位置（画面右外）から最終位置への補間
    posL = lerp(1.2, finalPosL, easedProgress);
    posR = lerp(1.35, finalPosR, easedProgress);
  }
}

function updateInteractionDelay() {
  let currentTime = millis();
  let timeSinceComplete = currentTime - (animationStartTime + animationDuration);
  
  if (timeSinceComplete >= interactionDelay) {
    // インタラクション解禁
    interactionEnabled = true;
    
    // マウス状態を初期化
    // 画面外の場合は中央（0.5）として扱う
    let initialMouseX = 0.5;
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
      initialMouseX = mouseX / width;
    }
    
    prevMouseX = initialMouseX;
    for (let i = 0; i < historyLength; i++) {
      velocityHistory[i] = 0;
    }
    smoothedVelocity = 0;
    mouseVelocityX = 0;
  }
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 2);
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function calculateAreas() {
  let sideAreaRatio = (1.0 - centerAreaRatio) / 2.0;
  leftAreaEnd = sideAreaRatio;
  rightAreaStart = 1.0 - sideAreaRatio;
}

function calculateMouseVelocity() {
  let currentMouseX = mouseX / width;
  currentMouseX = constrain(currentMouseX, 0, 1);
  
  mouseVelocityX = currentMouseX - prevMouseX;
  
  velocityHistory.push(mouseVelocityX);
  velocityHistory.shift();
  
  smoothedVelocity = 0;
  for (let vel of velocityHistory) {
    smoothedVelocity += vel;
  }
  smoothedVelocity /= historyLength;
  
  prevMouseX = currentMouseX;
}

function updateLinePositions() {
  // マウスが画面内にある場合のみインタラクション処理
  if (mouseX <= 0 || mouseX >= width || mouseY <= 0 || mouseY >= height) {
    return; // 画面外の場合は何もしない
  }

  
  let velocityInfluence = smoothedVelocity * mouseSensitivity;
  
  let currentMouseX = mouseX / width;
  currentMouseX = constrain(currentMouseX, 0, 1);
  
  let mouseArea = getMouseArea(currentMouseX);
  
  switch (mouseArea) {
    case 'left':
      let leftTarget = lerp(0.05, leftAreaEnd - 0.02, 
                           map(currentMouseX, 0, leftAreaEnd, 0, 1));
      targetPosL = leftTarget;
      targetPosR += (leftTarget - posL) * 0.1;
      break;
      
    case 'right':
      let rightTarget = lerp(rightAreaStart + 0.02, 0.95, 
                            map(currentMouseX, rightAreaStart, 1, 0, 1));
      targetPosR = rightTarget;
      targetPosL += (rightTarget - posR) * 0.1;
      break;
      
    case 'center':
    default:
      targetPosL += velocityInfluence * 0.5;
      targetPosR += velocityInfluence * 0.5;
      break;
  }
  
  ensureDistance();
  
  posL = lerp(posL, targetPosL, 1 - lineInertia);
  posR = lerp(posR, targetPosR, 1 - lineInertia);
}

function getMouseArea(mouseX) {
  if (mouseX < leftAreaEnd) {
    return 'left';
  } else if (mouseX > rightAreaStart) {
    return 'right';
  } else {
    return 'center';
  }
}

function ensureDistance() {
  let targetDistance = centerAreaRatio;
  let currentDistance = targetPosR - targetPosL;
  
  let distanceDiff = targetDistance - currentDistance;
  
  let correction = distanceDiff * 0.3;
  
  let halfCorrection = correction * 0.5;
  
  targetPosL -= halfCorrection;
  targetPosR += halfCorrection;
  
  if (targetPosL < 0.05) {
    let overflow = 0.05 - targetPosL;
    targetPosL = 0.05;
    targetPosR += overflow;
  }
  
  if (targetPosR > 0.95) {
    let overflow = targetPosR - 0.95;
    targetPosR = 0.95;
    targetPosL -= overflow;
  }
}

function calculateCanvasSize(maxWidth, maxHeight) {
  let windowAspect = maxWidth / maxHeight;
  let canvasWidth, canvasHeight;
  
  if (imageAspectRatio > windowAspect) {
    canvasWidth = maxWidth;
    canvasHeight = maxWidth / imageAspectRatio;
  } else {
    canvasHeight = maxHeight;
    canvasWidth = maxHeight * imageAspectRatio;
  }
  
  return { width: canvasWidth, height: canvasHeight };
}

function windowResized() {
  let canvasSize = calculateCanvasSize(windowWidth, windowHeight);
  resizeCanvas(canvasSize.width, canvasSize.height);
  resolution = [canvasSize.width, canvasSize.height];
  
  if (theShader) {
    theShader.setUniform('u_resolution', resolution);
  }
  
  console.log(`Canvas resized: ${canvasSize.width} x ${canvasSize.height}`);
}