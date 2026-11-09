import { PlayerState, BallState, TeamSide } from '../types/game';
import { PITCH_LENGTH, PITCH_WIDTH, GOAL_WIDTH, TACKLE_DISTANCE } from './constants';
import { PhysicsEngine } from './PhysicsEngine';

export class AIController {
  private physics: PhysicsEngine;
  private passDecisionCooldown: Map<string, number> = new Map();

  constructor(physics: PhysicsEngine) {
    this.physics = physics;
  }

  public update(
    aiPlayers: PlayerState[],
    allPlayers: PlayerState[],
    ball: BallState,
    delta: number
  ) {
    const halfLen = PITCH_LENGTH / 2;

    for (const player of aiPlayers) {
      // Skip if player is human controlled
      if (player.isUserControlled) continue;

      // Update cooldowns
      const cd = this.passDecisionCooldown.get(player.id) || 0;
      if (cd > 0) this.passDecisionCooldown.set(player.id, cd - delta);

      const targetGoalX = player.team === 'home' ? halfLen : -halfLen;
      const ownGoalX = player.team === 'home' ? -halfLen : halfLen;

      // 1. If this AI player HAS THE BALL
      if (player.hasBall) {
        this.handleAttackingWithBall(player, allPlayers, ball, targetGoalX, delta);
        continue;
      }

      // 2. If teammate has the ball (OFF-THE-BALL ATTACK SUPPORT)
      const ballOwner = allPlayers.find(p => p.id === ball.ownerId);
      if (ballOwner && ballOwner.team === player.team) {
        this.handleAttackingSupport(player, ballOwner, targetGoalX, delta);
        continue;
      }

      // 3. If opponent has the ball (DEFENSIVE PRESS & MARKING)
      if (ballOwner && ballOwner.team !== player.team) {
        this.handleDefending(player, ballOwner, allPlayers, ball, ownGoalX, delta);
        continue;
      }

      // 4. Loose ball scramble
      this.handleLooseBall(player, ball, delta);
    }
  }

  // When AI has the ball
  private handleAttackingWithBall(
    player: PlayerState,
    allPlayers: PlayerState[],
    ball: BallState,
    targetGoalX: number,
    delta: number
  ) {
    const distToGoal = Math.abs(targetGoalX - player.position.x);

    // Check if opponent is pressing closely
    let closestOpponentDist = 999;
    for (const opp of allPlayers) {
      if (opp.team !== player.team) {
        const d = Math.hypot(opp.position.x - player.position.x, opp.position.z - player.position.z);
        if (d < closestOpponentDist) closestOpponentDist = d;
      }
    }

    // A. Shoot opportunity: in range (< 14m) and clear or under pressure
    if (distToGoal < 13 && Math.abs(player.position.z) < 6) {
      const shotPower = 0.6 + Math.random() * 0.4;
      this.physics.shootBall(player, shotPower, ball);
      return;
    }

    // B. Pass opportunity if pressed
    const cd = this.passDecisionCooldown.get(player.id) || 0;
    if (closestOpponentDist < 2.5 && cd <= 0) {
      // Find open teammate ahead
      const teammates = allPlayers.filter(p => p.team === player.team && p.id !== player.id);
      let bestTeammate: PlayerState | null = null;
      let bestScore = -999;

      teammates.forEach(tm => {
        const d = Math.hypot(tm.position.x - player.position.x, tm.position.z - player.position.z);
        if (d > 3 && d < 18) {
          // Bonus if teammate is further upfield toward target goal
          const progress = player.team === 'home' ? (tm.position.x - player.position.x) : (player.position.x - tm.position.x);
          const score = progress * 2 - d * 0.2;
          if (score > bestScore) {
            bestScore = score;
            bestTeammate = tm;
          }
        }
      });

      if (bestTeammate && bestScore > 0) {
        const isLofted = Math.random() > 0.65;
        this.physics.passBall(player, bestTeammate, isLofted, ball);
        this.passDecisionCooldown.set(player.id, 1.5);
        return;
      }
    }

    // C. Dribble toward opponent monkey post
    const dirX = targetGoalX > player.position.x ? 1 : -1;
    // Slight weaving around defenders
    const weave = Math.sin(Date.now() * 0.003 + player.number) * 0.4;
    this.physics.updatePlayer(
      player,
      { x: dirX, z: weave },
      closestOpponentDist > 4, // sprint if open space
      delta,
      allPlayers,
      ball
    );
  }

  // Support teammate who has the ball
  private handleAttackingSupport(
    player: PlayerState,
    ballOwner: PlayerState,
    targetGoalX: number,
    delta: number
  ) {
    let desiredX = ballOwner.position.x + (targetGoalX > ballOwner.position.x ? 6 : -6);
    let desiredZ = player.basePosition.z;

    switch (player.role) {
      case 'striker':
        desiredX = targetGoalX > 0 ? targetGoalX - 5 : targetGoalX + 5;
        desiredZ = (Math.random() - 0.5) * 4;
        break;
      case 'winger_left':
        desiredZ = -PITCH_WIDTH / 2 + 2.5;
        break;
      case 'winger_right':
        desiredZ = PITCH_WIDTH / 2 - 2.5;
        break;
      case 'defender':
        // Stay back to cover counter-attacks
        desiredX = player.team === 'home' ? -PITCH_LENGTH / 4 : PITCH_LENGTH / 4;
        desiredZ = 0;
        break;
      case 'midfielder':
      default:
        desiredX = (ballOwner.position.x + targetGoalX) * 0.5;
        desiredZ = ballOwner.position.z * 0.5;
        break;
    }

    const dx = desiredX - player.position.x;
    const dz = desiredZ - player.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 1.2) {
      this.physics.updatePlayer(
        player,
        { x: dx / dist, z: dz / dist },
        dist > 6,
        delta,
        [ballOwner], // minimal collision list for performance
        { position: { x: 0, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, ownerId: null, lastTouchPlayer: null, lastTouchTeam: null }
      );
    }
  }

  // Defending against ball owner
  private handleDefending(
    player: PlayerState,
    ballOwner: PlayerState,
    allPlayers: PlayerState[],
    ball: BallState,
    ownGoalX: number,
    delta: number
  ) {
    // Find closest teammate to ball owner to decide who presses
    const teammates = allPlayers.filter(p => p.team === player.team);
    let closestToBallDist = 999;
    let closestPlayerId = '';

    teammates.forEach(tm => {
      const d = Math.hypot(tm.position.x - ballOwner.position.x, tm.position.z - ballOwner.position.z);
      if (d < closestToBallDist) {
        closestToBallDist = d;
        closestPlayerId = tm.id;
      }
    });

    const isPrimaryPresser = player.id === closestPlayerId;

    if (isPrimaryPresser) {
      // Primary presser aggressively rushes the ball carrier!
      const dx = ballOwner.position.x - player.position.x;
      const dz = ballOwner.position.z - player.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < TACKLE_DISTANCE + 0.3 && player.tackleCooldown <= 0) {
        // Execute slide tackle!
        this.physics.executeTackle(player, ball, allPlayers);
      } else {
        // Sprint to close down
        this.physics.updatePlayer(
          player,
          { x: dx / dist, z: dz / dist },
          true,
          delta,
          allPlayers,
          ball
        );
      }
    } else if (player.role === 'defender') {
      // Defender stays positioned between ball carrier and own tiny Monkey Post
      const goalZ = 0;
      const blockX = ownGoalX + (player.team === 'home' ? 2.5 : -2.5);
      const blockZ = ballOwner.position.z * 0.4;

      const dx = blockX - player.position.x;
      const dz = blockZ - player.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.8) {
        this.physics.updatePlayer(
          player,
          { x: dx / dist, z: dz / dist },
          dist > 5,
          delta,
          allPlayers,
          ball
        );
      }
    } else {
      // Other players mark space or cut passing lanes
      const markX = (ballOwner.position.x + ownGoalX) * 0.5;
      const markZ = player.basePosition.z;
      const dx = markX - player.position.x;
      const dz = markZ - player.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 1.5) {
        this.physics.updatePlayer(
          player,
          { x: dx / dist, z: dz / dist },
          false,
          delta,
          allPlayers,
          ball
        );
      }
    }
  }

  // Loose ball sprint scramble
  private handleLooseBall(player: PlayerState, ball: BallState, delta: number) {
    const dx = ball.position.x - player.position.x;
    const dz = ball.position.z - player.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 14) {
      // Chase down loose ball
      this.physics.updatePlayer(
        player,
        { x: dx / dist, z: dz / dist },
        dist > 3,
        delta,
        [],
        ball
      );
    }
  }

  // Utility to find optimal teammate to pass to
  public findBestPassTarget(passer: PlayerState, teammates: PlayerState[]): PlayerState | null {
    let best: PlayerState | null = null;
    let maxScore = -999;

    const forwardX = Math.sin(passer.rotation);
    const forwardZ = Math.cos(passer.rotation);

    for (const tm of teammates) {
      if (tm.id === passer.id) continue;
      const dx = tm.position.x - passer.position.x;
      const dz = tm.position.z - passer.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 2.0 || dist > 25.0) continue;

      // Check alignment with facing direction
      const dot = (dx * forwardX + dz * forwardZ) / dist;
      // Prefer forward facing teammates
      const score = dot * 10 - dist * 0.2;

      if (score > maxScore) {
        maxScore = score;
        best = tm;
      }
    }

    return best;
  }
}

