

let metaballShader;
const N_orange_balls = 20, // オレンジボールの数
      N_pink_balls = 14;    // ピンクボールの数
let orangeBalls = [];
let pinkBalls = [];
let mouseInfluenceRadius = 200;
let maxSizeMultiplier = 1.8;
let metaballSizeFactor = 0.85

// 爆発効果用の変数
let explosions = []; // 現在進行中の爆発
let explosionTimer = 0;
let explosionInterval = 3000; // 10秒間隔（ミリ秒）

function preload() {
  metaballShader = getShader(this._renderer);
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  shader(metaballShader);
  
  // オレンジボールの手動配置 [x割合, y割合, サイズ]
  const orangePositions = [
    [0.18, 0.4, 0.8],   // 左上あたり、大きめ
    [0.35, 0.75, 0.6],   // 左下、中サイズ
    [0.35, 0.9, 0.15],   // 右上、中サイズ
    [0.11, 0.50, 0.5],   // 右下、小さめ
    [0.03, 0.72, 0.7],   // 上中央、小さめ
    [0.15, 0.8, 0.6],   // 下中央、中サイズ
    [0.12, 0.89, 0.8],   // 左中央、大きめ
    [0.7, 0.2, 0.5],   // 右中央、小さめ
    [0.87, 0.10, 0.7],  // 左端、中サイズ
    [0.95, 0.12, 0.3],  // 右端、中サイズ
    [0.5, 0.3, 0.8],   // 中央上、大きめ
    [0.93, 0.26, 0.5]    // 中央下、中サイズ
  ];
  
  // ピンクボールの手動配置 [x割合, y割合, サイズ]
  const pinkPositions = [
  ];
  
  // オレンジボール生成
  for (let i = 0; i < N_orange_balls; i++) {
    if (i < orangePositions.length) {
      orangeBalls.push(new OrangeMetaball(orangePositions[i]));
    } else {
      orangeBalls.push(new OrangeMetaball());
    }
  }
  
  // ピンクボール生成
  for (let i = 0; i < N_pink_balls; i++) {
    if (i < pinkPositions.length) {
      pinkBalls.push(new PinkMetaball(pinkPositions[i]));
    } else {
      pinkBalls.push(new PinkMetaball());
    }
  }
}

function draw() {
  var orangeData = [];
  var pinkData = [];
  
  let mouseXNormalized = mouseX;
  let mouseYNormalized = height - mouseY;
	
	// 爆発タイマーの更新
  updateExplosions();
  
  // オレンジボールの更新
  for (const ball of orangeBalls) {
    ball.update(mouseXNormalized, mouseYNormalized, explosions);
    orangeData.push(ball.pos.x, ball.pos.y, ball.currentRadius);
  }
  
  // ピンクボールの更新（オレンジボール情報を渡す）
  for (const ball of pinkBalls) {
    ball.update(mouseXNormalized, mouseYNormalized, orangeBalls, explosions);
    pinkData.push(ball.pos.x, ball.pos.y, ball.currentRadius);
  }
  
  metaballShader.setUniform("orangeBalls", orangeData);
  metaballShader.setUniform("pinkBalls", pinkData);
  rect(0, 0, width, height);
}


function updateExplosions() {
  // 新しい爆発の生成チェック
  if (millis() - explosionTimer > explosionInterval) {
    createExplosion();
    explosionTimer = millis();
  }
  
  // 既存の爆発の更新と削除
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].update();
    if (explosions[i].isFinished()) {
      explosions.splice(i, 1);
    }
  }
}

function createExplosion() {
	
	let bestPosition;
  // メタボール密度の高い場所を見つける
	if (random() > 0.7){
		bestPosition = createVector(random(width), random(height));
	}else{
		bestPosition = findHighestDensityPoint();
	}
  let power = random(3, 8)*10; // 爆発の強さ
	let maxRadius = 400 * (1440 / windowWidth);
  explosions.push(new Explosion(bestPosition.x, bestPosition.y, power, 400));
}

function findHighestDensityPoint() {
  let maxDensity = 0;
  let bestX = width / 2;
  let bestY = height / 2;
  
  // グリッド状に密度をチェック（計算量を抑えるため粗めに）
  let gridSize = 80; // チェック間隔
  
  for (let x = gridSize; x < width - gridSize; x += gridSize) {
    for (let y = gridSize; y < height - gridSize; y += gridSize) {
      let density = calculateDensityAt(x, y);
      
      if (density > maxDensity) {
        maxDensity = density;
        bestX = x;
        bestY = y;
      }
    }
  }
  
  // 密度が低すぎる場合はランダム位置にフォールバック
  if (maxDensity < 0.1) {
    bestX = random(width);
    bestY = random(height);
  }
  
  return createVector(bestX, bestY);
}

function calculateDensityAt(x, y) {
  let density = 0;
  
  // オレンジボールの密度計算（重み付き）
  for (let ball of orangeBalls) {
    let distance = dist(x, y, ball.pos.x, ball.pos.y);
    if (distance < ball.currentRadius + 100) { // 影響範囲内
      let influence = 1 - (distance / (ball.currentRadius + 100));
      density += influence * (ball.currentRadius / 100); // サイズも考慮
    }
  }
  
  // ピンクボールの密度計算（軽め）
  for (let ball of pinkBalls) {
    let distance = dist(x, y, ball.pos.x, ball.pos.y);
    if (distance < ball.currentRadius + 50) { // 影響範囲内
      let influence = 1 - (distance / (ball.currentRadius + 50));
      density += influence * 0.3; // オレンジより軽い重み
    }
  }
  
  return density;
}

function mouseWheel() {
  return false;
}

function mousePressed() {
  // マウスクリックで爆発を発生
  let mouseXNormalized = mouseX;
  let mouseYNormalized = height - mouseY; // Y座標を反転
  
  // 画面内のクリックのみ反応
  if (mouseXNormalized >= 0 && mouseXNormalized <= width && 
      mouseYNormalized >= 0 && mouseYNormalized <= height) {
    
    let power = random(5, 10)*20; // 手動爆発は少し強めに
		let maxRadius = 400 * (windowWidth / 1440);
    explosions.push(new Explosion(mouseXNormalized, mouseYNormalized, power, maxRadius ));
  }
}