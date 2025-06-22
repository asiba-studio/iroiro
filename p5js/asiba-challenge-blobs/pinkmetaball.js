class PinkMetaball {
  constructor(preset) {
    if (preset) {
      // 手動配置の場合
      const [xRatio, yRatio, sizeRatio] = preset;
      this.baseRadius = (20 + (sizeRatio * 20)) * (windowWidth / 1440) * metaballSizeFactor; // 10-30の範囲
      this.pos = new p5.Vector(
        xRatio * width,
        (1-yRatio) * height
      );
      this.vel = p5.Vector.random2D().mult(1 + sizeRatio);
    } else {
      // ランダム配置の場合（フォールバック）
      this.baseRadius = (random(12, 25)*3) * (windowWidth / 1440) * metaballSizeFactor;
      this.pos = new p5.Vector(
        random(this.baseRadius * 2, width - this.baseRadius * 2), 
        random(this.baseRadius * 2, height - this.baseRadius * 2)
      );
      this.vel = p5.Vector.random2D().mult(random(1, 2));
    }
    
    this.currentRadius = this.baseRadius;
  }
  
  update(mouseX, mouseY, orangeBalls, explosions) {
		
		// ピンクボール同士の反発力
		/*
    let pinkRepulsion = createVector(0, 0);
    for (let otherBall of pinkBalls) {
      if (otherBall !== this) {
        let distance = dist(this.pos.x, this.pos.y, otherBall.pos.x, otherBall.pos.y);
        let minDistance = (this.currentRadius + otherBall.currentRadius) * 0.5; // 適度な距離を保つ
        
        if (distance < minDistance && distance > 5) {
          let repelForce = p5.Vector.sub(this.pos, otherBall.pos);
          repelForce.normalize();
          let strength = (1 - distance / minDistance) * 0.5;
          repelForce.mult(strength);
          pinkRepulsion.add(repelForce);
        }
      }
    }
		*/
    
		
    // オレンジボールから逃げる力
    let totalEscapeForce = createVector(0, 0);
    
    for (let orangeBall of orangeBalls) {
      let distance = dist(this.pos.x, this.pos.y, orangeBall.pos.x, orangeBall.pos.y);
      let dangerRadius = orangeBall.currentRadius + 100; // オレンジボールの影響範囲
      
      if (distance < dangerRadius && distance > 5) {
        // オレンジボールから逃げる方向
        let escapeForce = p5.Vector.sub(this.pos, orangeBall.pos);
        escapeForce.normalize();
        
        // オレンジボールが大きいほど、近いほど強く逃げる
        let orangeSize = orangeBall.currentRadius / orangeBall.baseRadius; // サイズ倍率
        let proximityFactor = 1 - (distance / dangerRadius);
        let escapeStrength = proximityFactor * orangeSize * 1.5;
        
        escapeForce.mult(escapeStrength);
        totalEscapeForce.add(escapeForce);
      }
    }
		
		// 爆発からの力を受ける（ピンクボールは軽いのでより影響を受ける）
    for (let explosion of explosions) {
      let explosionForce = explosion.getForceAt(this.pos);
      explosionForce.mult(5); // ピンクボールは爆発に敏感
      this.vel.add(explosionForce);
    }
    
		// すべての力を適用
    //this.vel.add(pinkRepulsion); // ピンク同士の反発
    this.vel.add(totalEscapeForce);
    
    // ランダムな動き（ふらふら感を減らす）
    let randomForce = p5.Vector.random2D().mult(0.05);
    this.vel.add(randomForce);
    
    // オレンジボールが近くにあるときは速く動く
    let nearbyOrange = false;
    for (let orangeBall of orangeBalls) {
      let distance = dist(this.pos.x, this.pos.y, orangeBall.pos.x, orangeBall.pos.y);
      if (distance < orangeBall.currentRadius + 80) {
        nearbyOrange = true;
        break;
      }
    }
    
    // 速度制限（危険時は速く）
    let maxSpeed = nearbyOrange ? 8 : 3;
    this.vel.limit(maxSpeed);
    
    // 位置更新
    this.pos.add(this.vel);
    
    // 壁での反射
    if (this.pos.x < this.currentRadius || this.pos.x > width - this.currentRadius) {
      this.vel.x *= -0.9;
      this.pos.x = constrain(this.pos.x, this.currentRadius, width - this.currentRadius);
    }
    if (this.pos.y < this.currentRadius || this.pos.y > height - this.currentRadius) {
      this.vel.y *= -0.9;
      this.pos.y = constrain(this.pos.y, this.currentRadius, height - this.currentRadius);
    }
    
    // 摩擦（危険時は少なく）
    let friction = nearbyOrange ? 0.98 : 0.95;
    this.vel.mult(friction);
    
    // サイズ調整（怖がって小さくなる）
    if (nearbyOrange) {
      this.currentRadius = lerp(this.currentRadius, this.baseRadius * 0.7, 0.1);
    } else {
      this.currentRadius = lerp(this.currentRadius, this.baseRadius, 0.05);
    }
  }
}