import React, { useEffect, useRef } from 'react';
import { PlayerState, BallState, TeamInfo } from '../types/game';
import { PITCH_LENGTH, PITCH_WIDTH, GOAL_WIDTH } from '../game/constants';

interface MinimapProps {
  players: PlayerState[];
  ball: BallState | null;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
}

export const Minimap: React.FC<MinimapProps> = ({ players, ball, homeTeam, awayTeam }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Padding for pitch inside canvas
    const padX = 14;
    const padY = 16;
    const pitchW = width - padX * 2;
    const pitchH = height - padY * 2;

    // Coordinate mapping functions
    const mapX = (x: number) => ((x + PITCH_LENGTH / 2) / PITCH_LENGTH) * pitchW + padX;
    const mapZ = (z: number) => ((z + PITCH_WIDTH / 2) / PITCH_WIDTH) * pitchH + padY;

    // Dark sleek tactical background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // North Compass Arrow
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', width / 2, 9);
    // Arrow icon
    ctx.beginPath();
    ctx.moveTo(width / 2, 10);
    ctx.lineTo(width / 2 - 3, 14);
    ctx.lineTo(width / 2 + 3, 14);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Dark asphalt street court base
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(padX, padY, pitchW, pitchH);

    // Yellow dashed curb lines along top and bottom
    ctx.save();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.0;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(padX, padY - 3);
    ctx.lineTo(padX + pitchW, padY - 3);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padX, padY + pitchH + 3);
    ctx.lineTo(padX + pitchW, padY + pitchH + 3);
    ctx.stroke();
    ctx.restore();

    // Pitch Outline (Thin crisp white)
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(padX, padY, pitchW, pitchH);

    // Center Line
    ctx.beginPath();
    ctx.moveTo(width / 2, padY);
    ctx.lineTo(width / 2, padY + pitchH);
    ctx.stroke();

    // Center Circle
    ctx.beginPath();
    ctx.arc(width / 2, padY + pitchH / 2, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Center Spot
    ctx.beginPath();
    ctx.arc(width / 2, padY + pitchH / 2, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();

    // Penalty Boxes & D-Arcs
    const boxW = 20;
    const boxH = 32;
    // Left Penalty Box
    ctx.strokeRect(padX, padY + (pitchH - boxH) / 2, boxW, boxH);
    ctx.beginPath();
    ctx.arc(padX + boxW, padY + pitchH / 2, 7, -Math.PI / 2.5, Math.PI / 2.5);
    ctx.stroke();

    // Right Penalty Box
    ctx.strokeRect(padX + pitchW - boxW, padY + (pitchH - boxH) / 2, boxW, boxH);
    ctx.beginPath();
    ctx.arc(padX + pitchW - boxW, padY + pitchH / 2, 7, (1.5 * Math.PI) / 2.5, (3.5 * Math.PI) / 2.5);
    ctx.stroke();

    // Mini white street cage goals
    const goalH = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(padX - 4, padY + (pitchH - goalH) / 2, 4, goalH);
    ctx.strokeRect(padX + pitchW, padY + (pitchH - goalH) / 2, 4, goalH);

    // Render Players
    players.forEach(p => {
      const px = mapX(p.position.x);
      const pz = mapZ(p.position.z);

      ctx.beginPath();
      ctx.arc(px, pz, 3.8, 0, Math.PI * 2);

      // Home (Yellow) vs Away (Magenta/Pink/Blue)
      if (p.team === 'home') {
        ctx.fillStyle = '#facc15'; // Sunny Yellow (Ojuelegba)
      } else {
        // Alternate between pink and cyan/blue as in screenshot
        ctx.fillStyle = p.number % 2 === 0 ? '#ec4899' : '#0284c7'; // Pink & Blue (Mitchells Plain)
      }
      ctx.fill();

      // Active user highlight
      if (p.isUserControlled) {
        ctx.strokeStyle = '#22c55e'; // Lime Green Ring
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(px, pz, 5.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Render Ball (White glowing dot at center)
    if (ball) {
      const bx = mapX(ball.position.x);
      const bz = mapZ(ball.position.z);

      // Yellow outer halo
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, bz, 5, 0, Math.PI * 2);
      ctx.stroke();

      // White core
      ctx.beginPath();
      ctx.arc(bx, bz, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Bottom "MINIMAP" label
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MINIMAP', width / 2, height - 3);
  }, [players, ball, homeTeam, awayTeam]);

  return (
    <div className="bg-black/75 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
      <canvas
        ref={canvasRef}
        width={190}
        height={115}
        className="rounded-xl block"
      />
    </div>
  );
};
