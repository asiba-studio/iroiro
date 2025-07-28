const frag = `
#ifdef GL_ES
precision mediump float;
#endif
uniform sampler2D logoL;
uniform sampler2D logoC;
uniform sampler2D logoR;
uniform sampler2D backL;
uniform sampler2D backC;
uniform sampler2D backR;
uniform vec2 u_resolution;
uniform vec2 u_linePositions;
uniform float u_time;
varying vec2 vTexCoord;
uniform float u_alphaAnimation;


void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;
  
  vec4 texColor;
  vec4 backColor;
	vec4 thisGreen = vec4(0.0, 1.0, 0.0, 1.0);
  
  // 条件分岐でテクスチャサンプリング（背景とロゴの両方）
  if (uv.x < u_linePositions.x) {
    texColor = texture2D(logoL, uv);
    backColor = texture2D(backL, uv);
  } else if (uv.x > u_linePositions.y) {
    texColor = texture2D(logoR, uv);
    backColor = texture2D(backR, uv);
  } else {
    texColor = texture2D(logoC, uv);
    backColor = texture2D(backC, uv);
  }


  
  // draw line
  vec2 screenCoord = uv * u_resolution;
  float lineWidth = 1.0;
	float subLineWidth = 0.5;
  float leftLineX = u_linePositions.x * u_resolution.x;
  float rightLineX = u_linePositions.y * u_resolution.x;
  
  float distToLeftLine = abs(screenCoord.x - leftLineX);
  float distToRightLine = abs(screenCoord.x - rightLineX);
  
  float lineTop = u_resolution.y * 0.1;
  float lineBottom = u_resolution.y * 0.75;
  bool inLineHeight = screenCoord.y > lineTop && screenCoord.y < lineBottom;
  
  bool isLine = (distToLeftLine < lineWidth || distToRightLine < lineWidth) && inLineHeight;
	bool isLineOut = (distToLeftLine < subLineWidth || distToRightLine < subLineWidth) && !inLineHeight;
	
	// 線の右に白いギャップを追加
	float gap = max(u_resolution.x * 0.02, 50.0);
	bool isLeftLineRight = (screenCoord.x - leftLineX < gap ) && (screenCoord.x - leftLineX > 0.0);
	bool isRightLineRight = (screenCoord.x - rightLineX < gap ) && (screenCoord.x - rightLineX > 0.0);
	
	float leftGapEdgeX = leftLineX + gap;
	float rightGapEdgeX = rightLineX + gap;

	bool isGapEdge = (abs(screenCoord.x - leftGapEdgeX) < subLineWidth && screenCoord.x > leftLineX) || 
									 (abs(screenCoord.x - rightGapEdgeX) < subLineWidth && screenCoord.x > rightLineX);
	
	if (isLeftLineRight || isRightLineRight) {
		backColor = vec4(0.0, 0.0, 0.0, 0.0);
	}
	
	
	// 最終の色調整
	backColor.a *= u_alphaAnimation;
	backColor.a *= 0.8;
	
  if (isLine) {
    backColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else if (isGapEdge || isLineOut) {
		backColor = vec4(0.0, 0.0, 0.0, 0.5);
	} 
	
	
	
	gl_FragColor = mix(backColor, texColor, texColor.a);
}
`;