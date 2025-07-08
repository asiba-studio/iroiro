

let img;
let mosaicShader;
let mosaicCounterBase = 100.0;
let mosaicCounter = mosaicCounterBase;
let mosaicCounterMin = -50.0;
let mosaicIntensity = [20.0, 10.0, 0.1];
let defaultImageUrl = '';
let virtualHeight = 1500;

// studio用画像調整
let imageAspect;
let displayWidth, displayHeight;
let tilesY;
let actualCanvasHeight;
let hoverGap = 0;
let prevMouseX = 0;


// Verex shader
const vert = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`;

// Fragment shader
const frag = `
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float uMosaicIntensity;
uniform float u_mosaicCounter;
uniform vec3 u_mosaicIntensity;
uniform float u_tileY;
uniform float u_time;
varying vec2 vTexCoord;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}


vec4 mosaic(sampler2D tex, vec2 uv, float intensity) {
  if (intensity <= 0.0) {
    return texture2D(tex, uv);
  }

  vec2 mosaicSize = vec2(intensity);
  
  // セルの中央を基準にした座標計算
  vec2 gridCoord = floor(uv * u_resolution / mosaicSize);
  vec2 cellCenter = (gridCoord + 0.5) * mosaicSize / u_resolution;
  
  return texture2D(tex, cellCenter);
}


void main() {
  vec2 uv = vTexCoord;
	uv.y = 1.0 - uv.y;
	
	// 縦方向のタイリング処理
	uv.y = mod(uv.y * u_tileY, 1.0);
  
  // 3段階のモザイク強度を計算
  float x = uv.x;
  float baseIntensity;

  float leftX = 0.33;
  float rightX = 0.67;
  float lineWidth = 0.5;
  
  if (x < leftX) {
    // 左側: 強いモザイク
    baseIntensity = u_mosaicIntensity.x;
  } else if (x < rightX) {
    // 中央: 中程度のモザイク
    baseIntensity = u_mosaicIntensity.y;
  } else {
    // 右側: 弱いモザイク
    baseIntensity = u_mosaicIntensity.z;
  }

  // 減衰
  float mosaicIntensityFactor = clamp(u_mosaicCounter, 0.0, 100.0) / 100.0;

  float finalIntensity = baseIntensity * mosaicIntensityFactor;
  
  // 2本の線
  vec4 lineLayer = vec4(0.0, 0.0, 0.0, 0.0);
  bool isLine = (abs(x - leftX) * u_resolution.x < lineWidth) || (abs(x - rightX) * u_resolution.x < lineWidth);
  float lineStrength = 0.7 * clamp(u_mosaicCounter, 10.0, 100.0) / 100.0;
  if (isLine) {
    lineLayer = vec4(0.5, 0.5, 0.5, lineStrength);
  }

  // 最終グラフィック
  gl_FragColor = mix(mosaic(u_texture, uv, finalIntensity), lineLayer, lineLayer.a);
}
`;



function preload() {
  let imageUrl = getImageFromURL();
	img = loadImage(imageUrl);
	mosaicShader = new p5.Shader(this.renderer, vert, frag);	
}

function setup() {
	createCanvas(windowWidth, virtualHeight, WEBGL);
	calculateImageLayout();
}

function draw() {
  background(50);
	
	if (!img || !imageAspect) return;
  
  // マウスホバーの検出
  // let isHovered = (mouseX > hoverGap && mouseX < width-hoverGap && mouseY > hoverGap && mouseY < height-hoverGap);
  
  let hasMovement = abs(mouseX - prevMouseX) > 0.01;
  
  // カウンターの更新
  if (hasMovement) {
    // ホバー中は大幅に減少
    mosaicCounter -= 6.0;
  } else {
    // 非ホバー時は少し増加
    mosaicCounter += 0.5;
  }

  prevMouseX = mouseX;

  mosaicCounter = constrain(mosaicCounter, mosaicCounterMin, mosaicCounterBase);
  console.log(mosaicCounter);


  // シェーダーを使用
  shader(mosaicShader);
  
  mosaicShader.setUniform('u_texture', img);
  mosaicShader.setUniform('u_resolution', [width, height]);
  mosaicShader.setUniform('u_mosaicCounter', mosaicCounter);
  mosaicShader.setUniform('u_mosaicIntensity', mosaicIntensity);
	mosaicShader.setUniform('u_tileY', tilesY);
  mosaicShader.setUniform('u_time', millis() / 1000.0);
  
  noStroke();
	fill(255);
  rect(0, 0, width, height);
}

function calculateImageLayout() {
	if (!img) return;

	// 画像のアスペクト比
	imageAspect = img.width / img.height;

	// iframeサイズに合わせて表示サイズを計算
	displayWidth = windowWidth; // 本番ではwindowWidthに
	displayHeight = displayWidth / imageAspect;

	// 縦方向に何枚タイルするか計算
	tilesY = height / displayHeight;

	// 実際のキャンバス高さ（タイル分を含む）
	actualCanvasHeight = displayHeight * tilesY;
}

function windowResized() {
	resizeCanvas(windowWidth, virtualHeight);
	calculateImageLayout(); // 再計算
}

// URLパラメータから画像URLを取得
function getImageFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('image') || params.get('img') || defaultImageUrl;
}

        


