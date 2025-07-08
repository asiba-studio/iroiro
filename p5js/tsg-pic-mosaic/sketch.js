

let img;
let mosaicShader;
let isHovered = false;
let defaultImageUrl = '';
let virtualHeight = 1500;

// studio用画像調整
let imageAspect;
let displayWidth, displayHeight;
let tilesY;
let actualCanvasHeight;


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
uniform bool u_isHovered;
uniform float u_tileY;
varying vec2 vTexCoord;

vec4 mosaic(sampler2D tex, vec2 uv, float intensity) {
	if (intensity <= 0.0) {
			return texture2D(tex, uv);
	}

	vec2 mosaicSize = vec2(intensity);
	vec2 coord = floor(uv * u_resolution / mosaicSize) * mosaicSize / u_resolution;
	return texture2D(tex, coord);
}

void main() {
  vec2 uv = vTexCoord;
	uv.y = 1.0 - uv.y;
	
	// 縦方向のタイリング処理
	uv.y = mod(uv.y * u_tileY, 1.0);
  
  if (u_isHovered) {
    // ホバー時はモザイクなし
    gl_FragColor = texture2D(u_texture, uv);
    return;
  }
  
  // 3段階のモザイク強度を計算
  float x = uv.x;
  float intensity;
  
  if (x < 0.33) {
    // 左側: 強いモザイク
    intensity = 20.0;
  } else if (x < 0.66) {
    // 中央: 中程度のモザイク
    intensity = 10.0;
  } else {
    // 右側: 弱いモザイク
    intensity = 5.0;
  }
  
  // さらに右端はモザイクなし
  if (x > 0.8) {
    intensity = 0.0;
  }
  
  gl_FragColor = mosaic(u_texture, uv, intensity);
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
  isHovered = (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height);
  
  // シェーダーを使用
  shader(mosaicShader);
  
  // ユニフォーム変数を設定
  mosaicShader.setUniform('u_texture', img);
  mosaicShader.setUniform('u_resolution', [width, height]);
  mosaicShader.setUniform('u_isHovered', isHovered);
	mosaicShader.setUniform('u_tileY', tilesY);
  
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

	console.log('📐 レイアウト計算結果:');
	console.log(`  iframe: ${windowWidth}x${windowHeight}`);
	console.log(`  画像: ${img.width}x${img.height} (比率: ${imageAspect.toFixed(2)})`);
	console.log(`  表示: ${displayWidth}x${displayHeight.toFixed(1)}`);
	console.log(`  タイル数: ${tilesY}`);
	console.log(`  実際の高さ: ${actualCanvasHeight.toFixed(1)}`);
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

        


