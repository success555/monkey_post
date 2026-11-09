import * as THREE from 'three';
import {
  PITCH_LENGTH,
  PITCH_WIDTH,
  GOAL_WIDTH,
  GOAL_HEIGHT,
  GOAL_DEPTH,
  BALL_RADIUS,
  PLAYER_RADIUS,
  GRAVITY,
  AIR_DRAG,
  GROUND_FRICTION,
  BALL_RESTITUTION,
  WALL_BOUNCE,
  MAX_BALL_SPEED,
  DRIBBLE_OFFSET,
  DRIBBLE_TETHER_RADIUS,
  BASE_SPEED,
  SPRINT_SPEED,
  DRIBBLE_SPEED_FACTOR,
  STAMINA_DRAIN_RATE,
  STAMINA_RECOVERY_RATE,
  TACKLE_DISTANCE,
  TACKLE_COOLDOWN,
  WARRI_COMMENTARY
} from './constants';
import { BallState, PlayerState, TeamSide, TeamStatsModifiers } from '../types/game';
import { soundFX } from '../audio/SoundFX';

export class PhysicsEngine {
  public onGoalScored?: (scoringTeam: TeamSide) => void;
  public onCommentary?: (text: string, type: 'goal' | 'tackle' | 'miss' | 'skill' | 'nutmeg' | 'general') => void;

  public homeStats: TeamStatsModifiers = { speed: 1.0, stamina: 1.0, tacklePower: 1.0, dribble: 1.0, passing: 1.0, shooting: 1.0 };
  public awayStats: TeamStatsModifiers = { speed: 1.0, stamina: 1.0, tacklePower: 1.0, dribble: 1.0, passing: 1.0, shooting: 1.0 };

  private halfLen = PITCH_LENGTH / 2;
  private halfWid = PITCH_WIDTH / 2;
  private postRadius = 0.06;
  private lastNutmegCheckTime = 0;
  private lastMissCheckTime = 0;

  public setTeamStats(home: TeamStatsModifiers, away: TeamStatsModifiers) {
    this.homeStats = home;
    this.awayStats = away;
  }

  // Update Ball Physics
  public updateBall(ball: BallState, players: PlayerState[], delta: number) {
    // If a player is carrying the ball
    if (ball.ownerId) {
      const owner = players.find(p => p.id === ball.ownerId);
      if (owner) {
        // Dribble position is in front of the player's facing direction
        const forwardX = Math.sin(owner.rotation);
        const forwardZ = Math.cos(owner.rotation);

        const targetX = owner.position.x + forwardX * DRIBBLE_OFFSET;
        const targetZ = owner.position.z + forwardZ * DRIBBLE_OFFSET;

        // Smoothly interpolate ball to feet with natural micro-roll
        const dribbleStat = owner.team === 'home' ? this.homeStats.dribble : this.awayStats.dribble;
        const stickiness = 16 * dribbleStat;
        ball.position.x += (targetX - ball.position.x) * stickiness * delta;
        ball.position.z += (targetZ - ball.position.z) * stickiness * delta;

        // Slight natural bob on ground
        const speed = Math.hypot(owner.velocity.x, owner.velocity.z);
        ball.position.y = BALL_RADIUS + Math.abs(Math.sin(Date.now() * 0.015)) * (speed > 2 ? 0.08 : 0);

        ball.velocity.x = owner.velocity.x;
        ball.velocity.z = owner.velocity.z;
        ball.velocity.y = 0;

        // Nutmeg detection while dribbling past opponent close-range
        const now = Date.now();
        if (now - this.lastNutmegCheckTime > 3000) {
          for (const opp of players) {
            if (opp.team !== owner.team) {
              const dist = Math.hypot(owner.position.x - opp.position.x, owner.position.z - opp.position.z);
              if (dist < 0.75 && speed > 3.0) {
                this.lastNutmegCheckTime = now;
                const phrase = WARRI_COMMENTARY.nutmegs[Math.floor(Math.random() * WARRI_COMMENTARY.nutmegs.length)];
                if (this.onCommentary) this.onCommentary(phrase, 'nutmeg');
                break;
              }
            }
          }
        }

        return;
      } else {
        ball.ownerId = null;
      }
    }

    // Free Ball Physics Simulation
    // 1. Apply air drag
    ball.velocity.x *= AIR_DRAG;
    ball.velocity.z *= AIR_DRAG;

    // 2. Apply Gravity
    ball.velocity.y -= GRAVITY * delta;

    // 3. Update Position
    ball.position.x += ball.velocity.x * delta;
    ball.position.y += ball.velocity.y * delta;
    ball.position.z += ball.velocity.z * delta;

    // 4. Ground Collision
    if (ball.position.y <= BALL_RADIUS) {
      ball.position.y = BALL_RADIUS;
      if (ball.velocity.y < -1.2) {
        soundFX.playWallBounce(Math.abs(ball.velocity.y) / 10);
      }
      ball.velocity.y = -ball.velocity.y * BALL_RESTITUTION;

      // Ground friction
      ball.velocity.x *= GROUND_FRICTION;
      ball.velocity.z *= GROUND_FRICTION;

      // Stop tiny vibration
      if (Math.abs(ball.velocity.y) < 0.2) ball.velocity.y = 0;
    }

    // 5. Perimeter Wall & Monkey Post Collisions
    this.handleWallCollisions(ball);

    // 6. Free ball pickup check by nearby players
    if (!ball.ownerId) {
      for (const player of players) {
        if (player.tackleCooldown > 0) continue; // recovering from tackle
        const dx = ball.position.x - player.position.x;
        const dz = ball.position.z - player.position.z;
        const dist = Math.hypot(dx, dz);

        // Player within reach and ball is low
        if (dist < DRIBBLE_TETHER_RADIUS && ball.position.y < 1.1) {
          ball.ownerId = player.id;
          ball.lastTouchTeam = player.team;
          ball.lastTouchPlayer = player.name;
          player.hasBall = true;
          // Clear ball flag on other players
          players.forEach(p => {
            if (p.id !== player.id) p.hasBall = false;
          });
          break;
        }
      }
    }
  }

  // Handle bouncing off perimeter walls and tiny Monkey Post goals
  private handleWallCollisions(ball: BallState) {
    const halfGoalW = GOAL_WIDTH / 2;

    // --- North Wall (Z = -halfWid) ---
    if (ball.position.z - BALL_RADIUS <= -this.halfWid) {
      ball.position.z = -this.halfWid + BALL_RADIUS;
      ball.velocity.z = Math.abs(ball.velocity.z) * WALL_BOUNCE;
      soundFX.playWallBounce(Math.abs(ball.velocity.z) / 10);
    }

    // --- South Wall (Z = +halfWid) ---
    if (ball.position.z + BALL_RADIUS >= this.halfWid) {
      ball.position.z = this.halfWid - BALL_RADIUS;
      ball.velocity.z = -Math.abs(ball.velocity.z) * WALL_BOUNCE;
      soundFX.playWallBounce(Math.abs(ball.velocity.z) / 10);
    }

    // --- West Goal & End Wall (X = -halfLen) ---
    if (ball.position.x - BALL_RADIUS <= -this.halfLen) {
      const isInsideGoalOpening = Math.abs(ball.position.z) <= halfGoalW && ball.position.y <= GOAL_HEIGHT;

      if (!isInsideGoalOpening) {
        // Check if shot flew over the monkey post
        if (Math.abs(ball.position.z) <= halfGoalW * 1.5 && ball.position.y > GOAL_HEIGHT) {
          this.triggerMissCommentary();
        }

        // Outside goal: bounce off brick/concrete end wall
        ball.position.x = -this.halfLen + BALL_RADIUS;
        ball.velocity.x = Math.abs(ball.velocity.x) * WALL_BOUNCE;
        soundFX.playWallBounce(Math.abs(ball.velocity.x) / 10);
      } else {
        // Inside goal opening! Check if crossed goal line
        if (ball.position.x <= -this.halfLen - 0.2) {
          // Goal Scored by AWAY team (into Home goal)
          this.triggerGoal('away', ball);
          // Net collision backstop
          if (ball.position.x <= -this.halfLen - GOAL_DEPTH) {
            ball.position.x = -this.halfLen - GOAL_DEPTH;
            ball.velocity.x = 0;
            ball.velocity.z *= 0.2;
          }
        }
      }
    }

    // --- East Goal & End Wall (X = +halfLen) ---
    if (ball.position.x + BALL_RADIUS >= this.halfLen) {
      const isInsideGoalOpening = Math.abs(ball.position.z) <= halfGoalW && ball.position.y <= GOAL_HEIGHT;

      if (!isInsideGoalOpening) {
        // Check if shot flew over the monkey post
        if (Math.abs(ball.position.z) <= halfGoalW * 1.5 && ball.position.y > GOAL_HEIGHT) {
          this.triggerMissCommentary();
        }

        // Outside goal: bounce off brick/concrete end wall
        ball.position.x = this.halfLen - BALL_RADIUS;
        ball.velocity.x = -Math.abs(ball.velocity.x) * WALL_BOUNCE;
        soundFX.playWallBounce(Math.abs(ball.velocity.x) / 10);
      } else {
        // Inside goal opening! Check if crossed goal line
        if (ball.position.x >= this.halfLen + 0.2) {
          // Goal Scored by HOME team (into Away goal)
          this.triggerGoal('home', ball);
          // Net collision backstop
          if (ball.position.x >= this.halfLen + GOAL_DEPTH) {
            ball.position.x = this.halfLen + GOAL_DEPTH;
            ball.velocity.x = 0;
            ball.velocity.z *= 0.2;
          }
        }
      }
    }

    // --- Monkey Post Post & Crossbar Deflections ---
    [-this.halfLen, this.halfLen].forEach(gx => {
      // Check left and right vertical posts
      [-halfGoalW, halfGoalW].forEach(gz => {
        const dx = ball.position.x - gx;
        const dz = ball.position.z - gz;
        const dist = Math.hypot(dx, dz);
        if (dist < BALL_RADIUS + this.postRadius && ball.position.y <= GOAL_HEIGHT + 0.1) {
          // Hit vertical post!
          const normal = new THREE.Vector2(dx, dz).normalize();
          const currentVel = new THREE.Vector2(ball.velocity.x, ball.velocity.z);
          const dot = currentVel.dot(normal);
          if (dot < 0) {
            currentVel.sub(normal.clone().multiplyScalar(2 * dot));
            ball.velocity.x = currentVel.x * 0.8;
            ball.velocity.z = currentVel.y * 0.8;
            soundFX.playPostHit();
            this.triggerMissCommentary();
          }
        }
      });

      // Check horizontal crossbar at y = GOAL_HEIGHT
      if (Math.abs(ball.position.x - gx) < BALL_RADIUS + this.postRadius &&
          Math.abs(ball.position.z) <= halfGoalW) {
        if (Math.abs(ball.position.y - GOAL_HEIGHT) < BALL_RADIUS + this.postRadius) {
          ball.velocity.y = -Math.abs(ball.velocity.y) * 0.8;
          ball.velocity.x *= -0.6;
          soundFX.playPostHit();
          this.triggerMissCommentary();
        }
      }
    });
  }

  private triggerMissCommentary() {
    const now = Date.now();
    if (now - this.lastMissCheckTime > 3500) {
      this.lastMissCheckTime = now;
      const phrase = WARRI_COMMENTARY.misses[Math.floor(Math.random() * WARRI_COMMENTARY.misses.length)];
      if (this.onCommentary) this.onCommentary(phrase, 'miss');
    }
  }

  private goalTriggered = false;
  private triggerGoal(scoringTeam: TeamSide, ball: BallState) {
    if (this.goalTriggered) return;
    this.goalTriggered = true;
    soundFX.playGoalCelebration();
    if (this.onGoalScored) {
      this.onGoalScored(scoringTeam);
    }
    // Warri Pidgin Goal line
    const phrase = WARRI_COMMENTARY.goals[Math.floor(Math.random() * WARRI_COMMENTARY.goals.length)];
    if (this.onCommentary) {
      this.onCommentary(phrase, 'goal');
    }
    setTimeout(() => {
      this.goalTriggered = false;
    }, 3000);
  }

  // Update Player Movement & Tackle Mechanics
  public updatePlayer(
    player: PlayerState,
    moveInput: { x: number; z: number },
    sprintPressed: boolean,
    delta: number,
    allPlayers: PlayerState[],
    ball: BallState
  ) {
    // Cooldown timers
    if (player.tackleCooldown > 0) {
      player.tackleCooldown -= delta;
    }

    const stats = player.team === 'home' ? this.homeStats : this.awayStats;

    // Stamina calculation (Enerhen / high stamina teams drain slower)
    const baseSpd = BASE_SPEED * stats.speed;
    const sprintSpd = SPRINT_SPEED * stats.speed;
    const drainRate = STAMINA_DRAIN_RATE / stats.stamina;
    const recoveryRate = STAMINA_RECOVERY_RATE * stats.stamina;

    let currentSpeed = baseSpd;
    if (sprintPressed && player.stamina > 5 && (Math.abs(moveInput.x) > 0.1 || Math.abs(moveInput.z) > 0.1)) {
      player.isSprinting = true;
      currentSpeed = sprintSpd;
      player.stamina = Math.max(0, player.stamina - drainRate * delta);
    } else {
      player.isSprinting = false;
      player.stamina = Math.min(100, player.stamina + recoveryRate * delta);
    }

    if (player.hasBall) {
      // Crafty dribblers (Pessu) lose less speed while dribbling
      currentSpeed *= THREE.MathUtils.lerp(0.85, 0.96, (stats.dribble - 0.95) / 0.5);
    }

    // Acceleration
    const inputMagnitude = Math.hypot(moveInput.x, moveInput.z);
    if (inputMagnitude > 0.05) {
      const dirX = moveInput.x / inputMagnitude;
      const dirZ = moveInput.z / inputMagnitude;

      player.velocity.x += (dirX * currentSpeed - player.velocity.x) * 12 * delta;
      player.velocity.z += (dirZ * currentSpeed - player.velocity.z) * 12 * delta;

      // Rotate toward direction of travel
      player.rotation = Math.atan2(dirX, dirZ);
    } else {
      // Friction decelerate
      player.velocity.x *= 0.8;
      player.velocity.z *= 0.8;
    }

    // Tackle lunging
    if (player.isTackling) {
      const lungePower = 12 * stats.tacklePower;
      const lungeX = Math.sin(player.rotation) * lungePower;
      const lungeZ = Math.cos(player.rotation) * lungePower;
      player.velocity.x = lungeX;
      player.velocity.z = lungeZ;
    }

    // Integrate position
    player.position.x += player.velocity.x * delta;
    player.position.z += player.velocity.z * delta;

    // Pitch perimeter constraints for players
    const margin = PLAYER_RADIUS + 0.1;
    player.position.x = Math.max(-this.halfLen + margin, Math.min(this.halfLen - margin, player.position.x));
    player.position.z = Math.max(-this.halfWid + margin, Math.min(this.halfWid - margin, player.position.z));

    // Player vs Player collision avoidance
    for (const other of allPlayers) {
      if (other.id === player.id) continue;
      const dx = player.position.x - other.position.x;
      const dz = player.position.z - other.position.z;
      const dist = Math.hypot(dx, dz);
      const minDist = PLAYER_RADIUS * 1.8;

      if (dist < minDist && dist > 0.001) {
        const overlap = (minDist - dist) / 2;
        const pushX = (dx / dist) * overlap;
        const pushZ = (dz / dist) * overlap;
        player.position.x += pushX;
        player.position.z += pushZ;

        // Check sliding tackle impact!
        if (player.isTackling && other.hasBall && other.team !== player.team) {
          // Clean tackle! Dislodge ball!
          soundFX.playTackle();
          other.hasBall = false;
          ball.ownerId = null;
          // Kick ball free in tackle direction
          const kickStrength = 10 * stats.tacklePower;
          ball.velocity.x = Math.sin(player.rotation) * kickStrength;
          ball.velocity.z = Math.cos(player.rotation) * kickStrength;
          ball.velocity.y = 2.0;
          other.tackleCooldown = 0.8;
          if (this.onCommentary) {
            const phrase = WARRI_COMMENTARY.tackles[Math.floor(Math.random() * WARRI_COMMENTARY.tackles.length)];
            this.onCommentary(phrase, 'tackle');
          }
        }
      }
    }
  }

  // Pass Ball Action
  public passBall(
    passer: PlayerState,
    targetTeammate: PlayerState | null,
    isLofted: boolean,
    ball: BallState
  ) {
    if (!passer.hasBall) return;
    passer.hasBall = false;
    ball.ownerId = null;
    passer.isKicking = true;

    const stats = passer.team === 'home' ? this.homeStats : this.awayStats;

    let dirX: number;
    let dirZ: number;
    let distance: number;

    if (targetTeammate) {
      // Lead the pass slightly in front of teammate
      const leadX = targetTeammate.position.x + targetTeammate.velocity.x * 0.4;
      const leadZ = targetTeammate.position.z + targetTeammate.velocity.z * 0.4;
      dirX = leadX - passer.position.x;
      dirZ = leadZ - passer.position.z;
      distance = Math.hypot(dirX, dirZ);
      dirX /= distance;
      dirZ /= distance;
    } else {
      // Pass forward in player's facing direction
      dirX = Math.sin(passer.rotation);
      dirZ = Math.cos(passer.rotation);
      distance = 12;
    }

    const passSpeed = (isLofted ? 18.0 : 16.0) * stats.passing;
    ball.velocity.x = dirX * passSpeed;
    ball.velocity.z = dirZ * passSpeed;
    ball.velocity.y = isLofted ? 4.8 : 0.8;

    ball.lastTouchTeam = passer.team;
    ball.lastTouchPlayer = passer.name;

    soundFX.playKick(isLofted ? 0.8 : 0.5);
  }

  // Shoot Ball Action
  public shootBall(
    shooter: PlayerState,
    powerRatio: number, // 0.0 to 1.0
    ball: BallState
  ) {
    if (!shooter.hasBall) return;
    shooter.hasBall = false;
    ball.ownerId = null;
    shooter.isKicking = true;

    const stats = shooter.team === 'home' ? this.homeStats : this.awayStats;

    // Target the opponent's tiny monkey post
    const targetGoalX = shooter.team === 'home' ? this.halfLen : -this.halfLen;
    // Add slight aim variation based on power
    const targetZ = (Math.random() - 0.5) * GOAL_WIDTH * 0.9;

    let dirX = targetGoalX - shooter.position.x;
    let dirZ = targetZ - shooter.position.z;
    const dist = Math.hypot(dirX, dirZ);
    dirX /= dist;
    dirZ /= dist;

    // Calculate shot velocity scaled by team shooting stat
    const shotSpeed = (16 + powerRatio * 12) * stats.shooting;
    ball.velocity.x = dirX * shotSpeed;
    ball.velocity.z = dirZ * shotSpeed;
    // In Monkey Post, shots are precision low ground drives into the tiny post.
    // Overcharging (> 0.65) lifts the ball over the low bar ("Over bar o!").
    if (powerRatio <= 0.65) {
      ball.velocity.y = 0.12 + powerRatio * 0.7; // low skimming ground drive into the monkey post
    } else {
      ball.velocity.y = 1.2 + (powerRatio - 0.65) * 4.0; // over-hit shot soaring over the monkey post
    }

    ball.lastTouchTeam = shooter.team;
    ball.lastTouchPlayer = shooter.name;

    soundFX.playKick(powerRatio);
  }

  // Tackle Action
  public executeTackle(player: PlayerState, ball: BallState, allPlayers: PlayerState[]) {
    if (player.tackleCooldown > 0 || player.isTackling) return;
    player.isTackling = true;
    player.tackleCooldown = TACKLE_COOLDOWN;
    soundFX.playTackle();

    const stats = player.team === 'home' ? this.homeStats : this.awayStats;
    const reach = TACKLE_DISTANCE * stats.tacklePower;

    // Check if near ball carrier
    for (const other of allPlayers) {
      if (other.id === player.id || other.team === player.team) continue;
      const dist = Math.hypot(
        player.position.x - other.position.x,
        player.position.z - other.position.z
      );
      if (dist < reach && other.hasBall) {
        other.hasBall = false;
        ball.ownerId = null;
        ball.velocity.x = Math.sin(player.rotation) * (12 * stats.tacklePower);
        ball.velocity.z = Math.cos(player.rotation) * (12 * stats.tacklePower);
        ball.velocity.y = 2.5;
        other.tackleCooldown = 0.9;
        if (this.onCommentary) {
          const phrase = WARRI_COMMENTARY.tackles[Math.floor(Math.random() * WARRI_COMMENTARY.tackles.length)];
          this.onCommentary(phrase, 'tackle');
        }
        break;
      }
    }
  }
}
