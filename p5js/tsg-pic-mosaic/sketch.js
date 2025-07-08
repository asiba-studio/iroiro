
let img;
let mosaicShader;
let isHovered = false;
let defaultImageUrl = 'https://www.lettuceclub.net/i/N1/192370/1154604.jpg';

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

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uMosaicIntensity;
uniform bool uIsHovered;

varying vec2 vTexCoord;

vec4 mosaic(sampler2D tex, vec2 uv, float intensity) {
  if (intensity <= 0.0) {
    return texture2D(tex, uv);
  }
  
  vec2 mosaicSize = vec2(intensity);
  vec2 coord = floor(uv * uResolution / mosaicSize) * mosaicSize / uResolution;
  return texture2D(tex, coord);
}

void main() {
  vec2 uv = vTexCoord;
	uv.y = 1.0 - uv.y;
  
  if (uIsHovered) {
    // ホバー時はモザイクなし
    gl_FragColor = texture2D(uTexture, uv);
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
  
  gl_FragColor = mosaic(uTexture, uv, intensity);
}
`;



function preload() {
    let imageUrl = getImageFromURL();
	img = loadImage(imageUrl);
	mosaicShader = new p5.Shader(this.renderer, vert, frag);
}

function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
}

function draw() {
  background(0);
  
  // マウスホバーの検出
  isHovered = (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height);
  
  // シェーダーを使用
  shader(mosaicShader);
  
  // ユニフォーム変数を設定
  mosaicShader.setUniform('uTexture', img);
  mosaicShader.setUniform('uResolution', [width, height]);
  mosaicShader.setUniform('uIsHovered', isHovered);
  
  noStroke();
	fill(255);
  rect(0, 0, width, height);
}



// URLパラメータから画像URLを取得
function getImageFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('image') || params.get('img') || defaultImageUrl;
}

        


