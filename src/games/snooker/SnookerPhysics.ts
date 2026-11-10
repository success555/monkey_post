import { Ball, Pocket } from './types';

export const BALL_RADIUS = 0.22;
export const TABLE_WIDTH = 7.2;   // X: -3.6 to 3.6
export const TABLE_LENGTH = 14.4; // Z: -7.2 to 7.2

export const POCKETS: Pocket[] = [
  { id: 'top_left', x: -3.42, z: -7.02, radius: 0.50 },
  { id: 'top_right', x: 3.42, z: -7.02, radius: 0.50 },
  { id: 'mid_left', x: -3.52, z: 0.0, radius: 0.46 },
  { id: 'mid_right', x: 3.52, z: 0.0, radius: 0.46 },
  { id: 'bot_left', x: -3.42, z: 7.02, radius: 0.50 },
  { id: 'bot_right', x: 3.42, z: 7.02, radius: 0.50 }
];

export interface PhysicsEvents {
  ballCollisions: { b1: Ball; b2: Ball; speed: number }[];
  cushionHits: { ball: Ball; speed: number }[];
  pottedBalls: Ball[];
}

export class SnookerPhysics {
  public balls: Ball[] = [];
  public onBallClack?: (speed: number) => void;
  public onCushionBounce?: (speed: number) => void;
  public onPocketDrop?: (ball: Ball) => void;

  private friction = 0.987;
  private minSpeedStop = 0.0035;

  constructor(initialBalls: Ball[]) {
    this.balls = initialBalls;
  }

  public setBalls(balls: Ball[]) {
    this.balls = balls;
  }

  public update(delta: number): PhysicsEvents {
    const events: PhysicsEvents = {
      ballCollisions: [],
      cushionHits: [],
      pottedBalls: []
    };

    // Sub-stepping for ultra stable high-speed collision resolution
    const steps = 4;
    const subDelta = (delta * 60) / steps; // normalized 60fps base

    for (let step = 0; step < steps; step++) {
      this.stepPhysics(subDelta, events);
    }

    return events;
  }

  private stepPhysics(dtRatio: number, events: PhysicsEvents) {
    const minX = -3.6 + BALL_RADIUS;
    const maxX = 3.6 - BALL_RADIUS;
    const minZ = -7.2 + BALL_RADIUS;
    const maxZ = 7.2 - BALL_RADIUS;

    // 1. Move active balls & check pockets
    for (const b of this.balls) {
      if (b.isPotted) continue;

      // Update position
      b.x += b.vx * dtRatio;
      b.z += b.vz * dtRatio;

      // Apply rolling friction
      b.vx *= Math.pow(this.friction, dtRatio);
      b.vz *= Math.pow(this.friction, dtRatio);

      const speedSq = b.vx * b.vx + b.vz * b.vz;
      if (speedSq < this.minSpeedStop * this.minSpeedStop) {
        b.vx = 0;
        b.vz = 0;
      }

      // Check Pocket Entry & Suction
      let inPocketArea = false;
      for (const p of POCKETS) {
        const dx = b.x - p.x;
        const dz = b.z - p.z;
        const distSq = dx * dx + dz * dz;
        const potRadiusSq = p.radius * p.radius;

        if (distSq < potRadiusSq) {
          inPocketArea = true;
          // Gravitational funnel pull towards pocket center
          const dist = Math.sqrt(distSq);
          if (dist > 0.01) {
            const pull = 0.02 * dtRatio;
            b.vx -= (dx / dist) * pull;
            b.vz -= (dz / dist) * pull;
          }

          // Fully dropped into pocket
          if (dist < p.radius * 0.72) {
            b.isPotted = true;
            b.vx = 0;
            b.vz = 0;
            b.y = -0.5; // drop below baize
            events.pottedBalls.push(b);
            this.onPocketDrop?.(b);
            break;
          }
        }
      }

      if (b.isPotted || inPocketArea) continue;

      // 2. Table Cushion Bounces (only when not dropping into pockets)
      const restitution = 0.82;

      // Left & Right Cushions
      if (b.x < minX) {
        b.x = minX;
        const impactSpeed = Math.abs(b.vx);
        b.vx = -b.vx * restitution;
        if (impactSpeed > 0.02) {
          events.cushionHits.push({ ball: b, speed: impactSpeed });
          this.onCushionBounce?.(impactSpeed);
        }
      } else if (b.x > maxX) {
        b.x = maxX;
        const impactSpeed = Math.abs(b.vx);
        b.vx = -b.vx * restitution;
        if (impactSpeed > 0.02) {
          events.cushionHits.push({ ball: b, speed: impactSpeed });
          this.onCushionBounce?.(impactSpeed);
        }
      }

      // Top & Bottom Cushions
      if (b.z < minZ) {
        b.z = minZ;
        const impactSpeed = Math.abs(b.vz);
        b.vz = -b.vz * restitution;
        if (impactSpeed > 0.02) {
          events.cushionHits.push({ ball: b, speed: impactSpeed });
          this.onCushionBounce?.(impactSpeed);
        }
      } else if (b.z > maxZ) {
        b.z = maxZ;
        const impactSpeed = Math.abs(b.vz);
        b.vz = -b.vz * restitution;
        if (impactSpeed > 0.02) {
          events.cushionHits.push({ ball: b, speed: impactSpeed });
          this.onCushionBounce?.(impactSpeed);
        }
      }
    }

    // 3. Elastic Ball-to-Ball Collisions
    const n = this.balls.length;
    const minDist = BALL_RADIUS * 2;
    const minDistSq = minDist * minDist;

    for (let i = 0; i < n; i++) {
      const b1 = this.balls[i];
      if (b1.isPotted) continue;

      for (let j = i + 1; j < n; j++) {
        const b2 = this.balls[j];
        if (b2.isPotted) continue;

        const dx = b2.x - b1.x;
        const dz = b2.z - b1.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < minDistSq && distSq > 0.000001) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist; // Collision normal X
          const nz = dz / dist; // Collision normal Z

          // Separate overlapping spheres
          const overlap = (minDist - dist) * 0.5;
          b1.x -= nx * overlap;
          b1.z -= nz * overlap;
          b2.x += nx * overlap;
          b2.z += nz * overlap;

          // Relative velocity along collision normal
          const kx = b1.vx - b2.vx;
          const kz = b1.vz - b2.vz;
          const normalVel = kx * nx + kz * nz;

          // Only resolve if balls are moving towards each other
          if (normalVel > 0) {
            const restitution = 0.95; // Crisp resin bounce
            const impulse = ((1 + restitution) * normalVel) / 2;

            b1.vx -= impulse * nx;
            b1.vz -= impulse * nz;
            b2.vx += impulse * nx;
            b2.vz += impulse * nz;

            const impactSpeed = Math.abs(normalVel);
            if (impactSpeed > 0.015) {
              events.ballCollisions.push({ b1, b2, speed: impactSpeed });
              this.onBallClack?.(impactSpeed);
            }
          }
        }
      }
    }
  }

  // Check if any active ball is currently rolling
  public isMoving(): boolean {
    for (const b of this.balls) {
      if (!b.isPotted) {
        if (b.vx * b.vx + b.vz * b.vz > 0.0001) {
          return true;
        }
      }
    }
    return false;
  }

  // Stop all balls immediately
  public stopAll() {
    for (const b of this.balls) {
      b.vx = 0;
      b.vz = 0;
    }
  }
}

