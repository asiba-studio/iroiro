function getShader(_renderer) {
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
  const frag = `
    precision highp float;
    varying vec2 vTexCoord;
    uniform vec3 orangeBalls[12];
    uniform vec3 pinkBalls[8];
    const float WIDTH = ` + windowWidth + `.0;
    const float HEIGHT = ` + windowHeight + `.0;
    
    void main() {
      float x = vTexCoord.x * WIDTH;
      float y = vTexCoord.y * HEIGHT;
      
      // オレンジボールの計算
      float orangeValue = 0.0;
      for (int i = 0; i < 12; i++) {
        vec3 ball = orangeBalls[i];
        float dx = ball.x - x;
        float dy = ball.y - y;
        float r = ball.z;
        orangeValue += r * r / (dx * dx + dy * dy);
      }
      
      // ピンクボールの計算
      float pinkValue = 0.0;
      for (int i = 0; i < 8; i++) {
        vec3 ball = pinkBalls[i];
        float dx = ball.x - x;
        float dy = ball.y - y;
        float r = ball.z;
        pinkValue += r * r / (dx * dx + dy * dy);
      }
      
      // 色の決定（融合させない）
      vec3 finalColor = vec3(0.160, 0.368, 0.858); // 背景色（青）
      
      // オレンジが優先（より強い値を持つ方）
      if (orangeValue > 1.0 && orangeValue >= pinkValue) {
        //float intensity = min((orangeValue - 1.0) * 0.5, 1.0);
        //vec3 color1 = vec3(1.0, 0.35, 0.1);  // 濃いオレンジ
        //vec3 color2 = vec3(1.0, 0.6, 0.2);   // 明るいオレンジ
        //finalColor = mix(color1, color2, intensity);
				finalColor = vec3(0.968, 0.364, 0.270);
      }
      // ピンクボール（オレンジがない場所のみ）
      else if (pinkValue > 1.0) {
        //float intensity = min((pinkValue - 1.0) * 0.3, 1.0);
        //vec3 color1 = vec3(1.0, 0.4, 0.7);   // 濃いピンク
        //vec3 color2 = vec3(1.0, 0.7, 0.9);   // 淡いピンク
        //finalColor = mix(color1, color2, intensity);
				finalColor = vec3(1.0, 0.623, 0.819);
      }
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;
  
  return new p5.Shader(_renderer, vert, frag);
}