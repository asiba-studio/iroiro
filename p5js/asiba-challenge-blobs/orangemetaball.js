class OrangeMetaball {
  constructor(preset) {
    if (preset) {
      // 手動配置の場合
      const [xRatio, yRatio, sizeRatio] = preset;
      this.baseRadius = (60 + (sizeRatio * 60)) * (windowWidth / 1440) * metaballSizeFactor; // 40-100の範囲
      this.pos = new p5.Vector(
        xRatio * width,
        (1-yRatio) * height
      );
      this.vel = p5.Vector.random2D().mult(0.5 * (1 - sizeRatio) + 0.5);
    } else {
      // ランダム配置の場合（フォールバック）
      const size = Math.pow(Math.random(), 0.5);
      this.baseRadius = (60 * size + 30) * (windowWidth / 1440) * metaballSizeFactor;
      this.pos = new p5.Vector(
        random(this.baseRadius * 2, width - this.baseRadius * 2), 
        random(this.baseRadius * 2, height - this.baseRadius * 2)
      );
      this.vel = p5.Vector.random2D().mult(0.5 * (1 - size) + 1);
    }
    
    this.currentRadius = this.baseRadius;
  }
  
  update(mouseX, mouseY, explosions) {
    // マウスに向かう力
    let mouseForce = p5.Vector.sub(createVector(mouseX, mouseY), this.pos);
    let mouseDistance = mouseForce.mag();
    
    if (mouseDistance < mouseInfluenceRadius && mouseDistance > 5) {
      mouseForce.normalize();
      mouseForce.mult(0.05); // 引力の強さ
      this.vel.add(mouseForce);
    }
		
		// 爆発からの力を受ける
    for (let explosion of explosions) {
      let explosionForce = explosion.getForceAt(this.pos);
      this.vel.add(explosionForce);
    }
    
    // 速度制限
    this.vel.limit(1.5);
    
    // 位置更新
    this.pos.add(this.vel);
    
    // 壁での反射
    if (this.pos.x < this.currentRadius || this.pos.x > width - this.currentRadius) {
      this.vel.x *= -0.8;
      this.pos.x = constrain(this.pos.x, this.currentRadius, width - this.currentRadius);
    }
    if (this.pos.y < this.currentRadius || this.pos.y > height - this.currentRadius) {
      this.vel.y *= -0.8;
      this.pos.y = constrain(this.pos.y, this.currentRadius, height - this.currentRadius);
    }
    
    // サイズ調整（マウスに近いと大きくなる）
    if (mouseDistance < mouseInfluenceRadius) {
      let influence = 1 - (mouseDistance / mouseInfluenceRadius);
      let sizeMultiplier = 1 + (influence * (maxSizeMultiplier - 1));
      this.currentRadius = this.baseRadius * sizeMultiplier;
    } else {
      this.currentRadius = lerp(this.currentRadius, this.baseRadius, 0.1);
    }
    
    // 摩擦
    this.vel.mult(0.98);
  }
}