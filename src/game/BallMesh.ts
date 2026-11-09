import * as THREE from 'three';
import { BALL_RADIUS } from './constants';
import { BallState } from '../types/game';

export class BallMesh {
  public group: THREE.Group;
  public ballSphere: THREE.Mesh;
  public shadowBlob: THREE.Mesh;
  public state: BallState;

  constructor(initialState: BallState) {
    this.state = initialState;
    this.group = new THREE.Group();

    // 1. Procedural Street Soccer Ball Texture
    const texture = this.createSoccerBallTexture();

    const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 24, 24);
    const ballMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.4,
      metalness: 0.1
    });

    this.ballSphere = new THREE.Mesh(ballGeo, ballMat);
    this.ballSphere.castShadow = true;
    this.group.add(this.ballSphere);

    // 2. Dynamic ground shadow blob
    const shadowGeo = new THREE.CircleGeometry(BALL_RADIUS * 1.15, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    this.shadowBlob = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowBlob.rotation.x = -Math.PI / 2;
    this.shadowBlob.position.y = 0.015;
    this.group.add(this.shadowBlob);

    this.updatePosition();
  }

  // Create authentic street soccer ball panel texture
  private createSoccerBallTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // White base
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    // Black pentagonal panels
    ctx.fillStyle = '#1e293b';

    const drawPentagon = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    };

    // Distribute panels
    const centers = [
      [256, 256, 44],
      [128, 128, 38],
      [384, 128, 38],
      [128, 384, 38],
      [384, 384, 38],
      [256, 70, 36],
      [256, 442, 36],
      [70, 256, 36],
      [442, 256, 36]
    ];

    centers.forEach(([x, y, r]) => drawPentagon(x, y, r));

    // Stitched seam lines
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    centers.forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Street logo / stamp
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('NAIJA 94', 210, 260);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  public update(delta: number) {
    this.updatePosition();

    // Roll ball rotation according to ground velocity
    const speed = Math.hypot(this.state.velocity.x, this.state.velocity.z);
    if (speed > 0.05) {
      const rotAngle = (speed * delta) / BALL_RADIUS;
      const rotAxis = new THREE.Vector3(-this.state.velocity.z, 0, this.state.velocity.x).normalize();
      this.ballSphere.rotateOnWorldAxis(rotAxis, rotAngle);
    }

    // Shadow dynamics: shadow stays on ground (y=0.015), shrinks and fades when ball is kicked high in air
    const heightAboveGround = Math.max(0, this.state.position.y - BALL_RADIUS);
    const shadowScale = Math.max(0.3, 1.0 - heightAboveGround * 0.25);
    const shadowOpacity = Math.max(0.08, 0.45 - heightAboveGround * 0.1);

    this.shadowBlob.position.set(0, 0.015 - this.state.position.y, 0);
    this.shadowBlob.scale.set(shadowScale, shadowScale, 1);
    (this.shadowBlob.material as THREE.MeshBasicMaterial).opacity = shadowOpacity;
  }

  public updatePosition() {
    this.group.position.set(
      this.state.position.x,
      this.state.position.y,
      this.state.position.z
    );
  }
}

