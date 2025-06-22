class Explosion {
  constructor(x, y, power, maxRadius) {
    this.pos = createVector(x, y);
    this.power = power;
    this.maxRadius = maxRadius; //power * 100; // 影響範囲
    this.currentRadius = 0;
    this.duration = 1500; // 2秒間
    this.startTime = millis();
    this.active = true;
  }
  
  update() {
    let elapsed = millis() - this.startTime;
    let progress = elapsed / this.duration;
    
    if (progress >= 1.0) {
      this.active = false;
      return;
    }
    
    // 爆発の範囲が広がる（最初は急速に、後でゆっくり）
    this.currentRadius = this.maxRadius * Math.pow(progress, 0.3);
  }
  
  getForceAt(targetPos) {
    if (!this.active) return createVector(0, 0);
    
    let distance = dist(this.pos.x, this.pos.y, targetPos.x, targetPos.y);
    
    if (distance > this.currentRadius || distance < 10) {
      return createVector(0, 0);
    }
    
    // 爆発中心から外向きの力
    let force = p5.Vector.sub(targetPos, this.pos);
    force.normalize();
    
    // 距離と時間による力の減衰
    let elapsed = millis() - this.startTime;
    let timeDecay = 1 - (elapsed / this.duration);
    let distanceDecay = 1 - (distance / this.currentRadius);
    
    let forceStrength = this.power * timeDecay * distanceDecay * 0.5 *2;
    force.mult(forceStrength);
    
    return force;
  }
  
  isFinished() {
    return !this.active;
  }
}