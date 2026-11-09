import * as THREE from 'three';
import { PITCH_LENGTH, PITCH_WIDTH, GOAL_WIDTH, GOAL_HEIGHT, GOAL_DEPTH } from './constants';

export class Pitch {
  public group: THREE.Group;
  public wallColliders: { minX: number; maxX: number; minZ: number; maxZ: number; normal: THREE.Vector3 }[] = [];
  public goalFrames: THREE.Group[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.createAsphaltStreetGround();
    this.createStreetGoals();
    this.createStreetSurroundings();
  }

  /**
   * Generates high-resolution asphalt tarmac texture exactly matching reference photo:
   * Dark aged tarmac, organic bitumen patches, crack networks, yellow dashed curb markings,
   * white regulation lines, corner arcs, penalty boxes, penalty D-arcs,
   * VIBRANT AFRICA MAP painted inside the center circle, and organic yellow paint spills!
   */
  private createAsphaltStreetTextures(): {
    diffuseMap: THREE.CanvasTexture;
    roughnessMap: THREE.CanvasTexture;
    bumpMap: THREE.CanvasTexture;
  } {
    const width = 2048;
    const height = 1250;

    // Diffuse Canvas
    const dCanvas = document.createElement('canvas');
    dCanvas.width = width;
    dCanvas.height = height;
    const dCtx = dCanvas.getContext('2d')!;

    // Roughness Canvas
    const rCanvas = document.createElement('canvas');
    rCanvas.width = width;
    rCanvas.height = height;
    const rCtx = rCanvas.getContext('2d')!;

    // Bump Canvas
    const bCanvas = document.createElement('canvas');
    bCanvas.width = width;
    bCanvas.height = height;
    const bCtx = bCanvas.getContext('2d')!;

    // 1. BASE DARK ASPHALT / TARMAC SURFACE
    dCtx.fillStyle = '#2f3338';
    dCtx.fillRect(0, 0, width, height);

    rCtx.fillStyle = '#dedede'; // High roughness for gritty tarmac
    rCtx.fillRect(0, 0, width, height);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, width, height);

    // 2. ASPHALT AGGREGATE GRAIN NOISE (Granular stone specks)
    for (let i = 0; i < 95000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const isLight = Math.random() > 0.45;
      const speckVal = isLight ? 60 + Math.random() * 45 : 20 + Math.random() * 20;

      dCtx.fillStyle = `rgba(${speckVal}, ${speckVal}, ${speckVal + 2}, 0.28)`;
      dCtx.fillRect(x, y, 2, 2);

      const bVal = isLight ? 145 : 115;
      bCtx.fillStyle = `rgba(${bVal}, ${bVal}, ${bVal}, 0.22)`;
      bCtx.fillRect(x, y, 2, 2);
    }

    // 3. ORGANIC BITUMEN SEALANT PATCHES (Darker smoothed asphalt repairs)
    const bitumenPatches = [
      { x: 380, y: 320, rx: 160, ry: 90, rot: 0.2 },
      { x: 740, y: 780, rx: 220, ry: 130, rot: -0.15 },
      { x: 1250, y: 440, rx: 190, ry: 110, rot: 0.35 },
      { x: 1620, y: 690, rx: 240, ry: 140, rot: -0.1 },
      { x: 920, y: 260, rx: 140, ry: 80, rot: 0.1 },
      { x: 420, y: 920, rx: 180, ry: 100, rot: -0.25 },
      { x: 1720, y: 280, rx: 150, ry: 90, rot: 0.18 }
    ];

    bitumenPatches.forEach(p => {
      dCtx.save();
      dCtx.translate(p.x, p.y);
      dCtx.rotate(p.rot);
      const grad = dCtx.createRadialGradient(0, 0, 10, 0, 0, p.rx);
      grad.addColorStop(0, 'rgba(26, 28, 32, 0.75)');
      grad.addColorStop(0.7, 'rgba(35, 38, 43, 0.45)');
      grad.addColorStop(1, 'rgba(45, 48, 53, 0)');
      dCtx.fillStyle = grad;
      dCtx.beginPath();
      dCtx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
      dCtx.fill();
      dCtx.restore();

      // Bitumen has lower roughness (slicker)
      rCtx.save();
      rCtx.translate(p.x, p.y);
      rCtx.rotate(p.rot);
      const rGrad = rCtx.createRadialGradient(0, 0, 10, 0, 0, p.rx);
      rGrad.addColorStop(0, 'rgba(80, 80, 80, 0.6)');
      rGrad.addColorStop(1, 'rgba(222, 222, 222, 0)');
      rCtx.fillStyle = rGrad;
      rCtx.beginPath();
      rCtx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
      rCtx.fill();
      rCtx.restore();
    });

    // 4. AUTHENTIC PROCEDURAL ASPHALT CRACK NETWORK (Branching street fissures)
    const drawCrack = (startX: number, startY: number, length: number, angle: number, branches: number) => {
      let curX = startX;
      let curY = startY;
      let curAngle = angle;

      dCtx.strokeStyle = '#121316'; // Deep black crack core
      dCtx.lineWidth = 2.2;
      dCtx.beginPath();
      dCtx.moveTo(curX, curY);

      bCtx.strokeStyle = '#252525';
      bCtx.lineWidth = 3.0;
      bCtx.beginPath();
      bCtx.moveTo(curX, curY);

      const steps = Math.floor(length / 8);
      for (let s = 0; s < steps; s++) {
        curAngle += (Math.random() - 0.5) * 0.7;
        curX += Math.cos(curAngle) * 8;
        curY += Math.sin(curAngle) * 8;
        dCtx.lineTo(curX, curY);
        bCtx.lineTo(curX, curY);

        if (branches > 0 && Math.random() < 0.18) {
          const bAngle = curAngle + (Math.random() > 0.5 ? 0.8 : -0.8);
          drawCrack(curX, curY, length * 0.45, bAngle, branches - 1);
        }
      }
      dCtx.stroke();
      bCtx.stroke();
    };

    const crackSeeds = [
      { x: 300, y: 400, len: 140, a: 0.5 },
      { x: 550, y: 750, len: 180, a: -0.4 },
      { x: 880, y: 350, len: 210, a: 1.1 },
      { x: 1100, y: 820, len: 170, a: -0.8 },
      { x: 1420, y: 460, len: 190, a: 0.3 },
      { x: 1680, y: 720, len: 160, a: -1.2 },
      { x: 700, y: 180, len: 120, a: 0.9 },
      { x: 1300, y: 980, len: 150, a: -0.3 }
    ];
    crackSeeds.forEach(cs => drawCrack(cs.x, cs.y, cs.len, cs.a, 2));

    // 5. ORGANIC YELLOW PAINT SPLATTERS / SPILLS (Exact match to reference photo)
    const drawYellowSplatter = (
      centerX: number,
      centerY: number,
      radiusX: number,
      radiusY: number,
      rotation: number
    ) => {
      dCtx.save();
      dCtx.translate(centerX, centerY);
      dCtx.rotate(rotation);

      // Splatter base polygon with organic ragged edges
      dCtx.beginPath();
      const numPoints = 28;
      for (let i = 0; i < numPoints; i++) {
        const ang = (i / numPoints) * Math.PI * 2;
        const noise = 0.65 + Math.sin(ang * 4) * 0.2 + Math.cos(ang * 7) * 0.15 + (Math.random() - 0.5) * 0.12;
        const rx = radiusX * noise;
        const ry = radiusY * noise;
        const px = Math.cos(ang) * rx;
        const py = Math.sin(ang) * ry;
        if (i === 0) dCtx.moveTo(px, py);
        else dCtx.lineTo(px, py);
      }
      dCtx.closePath();

      // Main yellow paint fill
      dCtx.fillStyle = '#eab308';
      dCtx.fill();

      // Slightly brighter weathered center
      dCtx.fillStyle = 'rgba(250, 204, 21, 0.85)';
      dCtx.fill();

      // Paint drip satellites / droplets around perimeter
      for (let d = 0; d < 22; d++) {
        const dAng = Math.random() * Math.PI * 2;
        const dist = (radiusX + radiusY) * 0.5 * (1.1 + Math.random() * 0.45);
        const dx = Math.cos(dAng) * dist;
        const dy = Math.sin(dAng) * dist;
        const dSize = 2 + Math.random() * 6;
        dCtx.beginPath();
        dCtx.arc(dx, dy, dSize, 0, Math.PI * 2);
        dCtx.fillStyle = '#eab308';
        dCtx.fill();
      }

      dCtx.restore();

      // Paint sits proud and slightly smoother on asphalt
      rCtx.save();
      rCtx.translate(centerX, centerY);
      rCtx.rotate(rotation);
      rCtx.fillStyle = '#909090';
      rCtx.beginPath();
      rCtx.ellipse(0, 0, radiusX * 0.9, radiusY * 0.9, 0, 0, Math.PI * 2);
      rCtx.fill();
      rCtx.restore();

      bCtx.save();
      bCtx.translate(centerX, centerY);
      bCtx.rotate(rotation);
      bCtx.fillStyle = '#a5a5a5';
      bCtx.beginPath();
      bCtx.ellipse(0, 0, radiusX * 0.9, radiusY * 0.9, 0, 0, Math.PI * 2);
      bCtx.fill();
      bCtx.restore();
    };

    // Foreground and sideline yellow paint splashes as seen in reference screenshot
    drawYellowSplatter(1420, 880, 210, 130, 0.25); // Large bottom-right splash
    drawYellowSplatter(1580, 760, 95, 60, -0.4);
    drawYellowSplatter(450, 920, 140, 85, -0.2);   // Bottom-left splash
    drawYellowSplatter(940, 360, 110, 65, 0.35);   // Center-top splash

    // 6. REGULATION WHITE PITCH MARKINGS & YELLOW CURB DASHES
    const marginX = 110;
    const marginY = 85;

    const pitchLeft = marginX;
    const pitchRight = width - marginX;
    const pitchTop = marginY;
    const pitchBottom = height - marginY;
    const pitchW = pitchRight - pitchLeft;
    const pitchH = pitchBottom - pitchTop;
    const centerY = height / 2;
    const centerX = width / 2;

    // Draw Yellow Dashed Street Curb Lines (Exact match to reference photo top and bottom curbs)
    const drawYellowDashes = () => {
      dCtx.save();
      dCtx.strokeStyle = '#eab308'; // Street yellow
      dCtx.lineWidth = 5.5;
      dCtx.setLineDash([32, 22]); // 32px dash, 22px gap
      dCtx.lineCap = 'butt';

      // Top curb yellow dashed line (running along sidewalk edge)
      const topCurbY = pitchTop - 36;
      dCtx.beginPath();
      dCtx.moveTo(pitchLeft - 40, topCurbY);
      dCtx.lineTo(pitchRight + 40, topCurbY);
      dCtx.stroke();

      // Bottom curb yellow dashed line
      const bottomCurbY = pitchBottom + 36;
      dCtx.beginPath();
      dCtx.moveTo(pitchLeft - 40, bottomCurbY);
      dCtx.lineTo(pitchRight + 40, bottomCurbY);
      dCtx.stroke();
      dCtx.restore();
    };
    drawYellowDashes();

    // 7. VIBRANT AFRICA MAP CENTER CIRCLE (Exact match to reference screenshot)
    this.drawAfricaCenterCircle(dCtx, rCtx, bCtx, centerX, centerY, 195);

    // 8. White regulation street pitch markings
    const setupLineStyle = (ctx: CanvasRenderingContext2D, color: string, lineWidth: number) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      ctx.setLineDash([]);
    };

    [
      { ctx: dCtx, color: '#f8fafc', lineW: 7.5 },
      { ctx: rCtx, color: '#888888', lineW: 7.5 },
      { ctx: bCtx, color: '#c0c0c0', lineW: 8.5 }
    ].forEach(({ ctx, color, lineW }) => {
      setupLineStyle(ctx, color, lineW);

      // A. Outer Perimeter Rectangle Boundary
      ctx.strokeRect(pitchLeft, pitchTop, pitchW, pitchH);

      // B. Center Halfway Line
      ctx.beginPath();
      ctx.moveTo(centerX, pitchTop);
      ctx.lineTo(centerX, pitchBottom);
      ctx.stroke();

      // C. Center Circle Ring (Circumference around the Africa Map)
      ctx.beginPath();
      ctx.arc(centerX, centerY, 195, 0, Math.PI * 2);
      ctx.stroke();

      // D. Center Kickoff Spot (Solid white spot at center)
      ctx.beginPath();
      ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
      ctx.fill();

      // E. West (Left) Penalty Area & Inner 6-Yard Goal Box
      const penaltyBoxW = 320;
      const penaltyBoxH = 680;
      ctx.strokeRect(pitchLeft, centerY - penaltyBoxH / 2, penaltyBoxW, penaltyBoxH);

      const innerBoxW = 120;
      const innerBoxH = 340;
      ctx.strokeRect(pitchLeft, centerY - innerBoxH / 2, innerBoxW, innerBoxH);

      // West Penalty D-Arc facing toward center
      ctx.beginPath();
      ctx.arc(pitchLeft + penaltyBoxW, centerY, 120, -Math.PI / 2.7, Math.PI / 2.7);
      ctx.stroke();

      // F. East (Right) Penalty Area & Inner 6-Yard Goal Box
      ctx.strokeRect(pitchRight - penaltyBoxW, centerY - penaltyBoxH / 2, penaltyBoxW, penaltyBoxH);
      ctx.strokeRect(pitchRight - innerBoxW, centerY - innerBoxH / 2, innerBoxW, innerBoxH);

      // East Penalty D-Arc facing toward center
      ctx.beginPath();
      ctx.arc(pitchRight - penaltyBoxW, centerY, 120, (1.7 * Math.PI) / 2.7, (3.7 * Math.PI) / 2.7);
      ctx.stroke();

      // G. Four Corner Arcs
      const cornerRadius = 45;
      // Top-Left
      ctx.beginPath();
      ctx.arc(pitchLeft, pitchTop, cornerRadius, 0, Math.PI / 2);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.arc(pitchLeft, pitchBottom, cornerRadius, -Math.PI / 2, 0);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.arc(pitchRight, pitchTop, cornerRadius, Math.PI / 2, Math.PI);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.arc(pitchRight, pitchBottom, cornerRadius, Math.PI, (3 * Math.PI) / 2);
      ctx.stroke();
    });

    const diffuseMap = new THREE.CanvasTexture(dCanvas);
    diffuseMap.wrapS = THREE.ClampToEdgeWrapping;
    diffuseMap.wrapT = THREE.ClampToEdgeWrapping;

    const roughnessMap = new THREE.CanvasTexture(rCanvas);
    roughnessMap.wrapS = THREE.ClampToEdgeWrapping;
    roughnessMap.wrapT = THREE.ClampToEdgeWrapping;

    const bumpMap = new THREE.CanvasTexture(bCanvas);
    bumpMap.wrapS = THREE.ClampToEdgeWrapping;
    bumpMap.wrapT = THREE.ClampToEdgeWrapping;

    return { diffuseMap, roughnessMap, bumpMap };
  }

  /**
   * Draws the authentic multi-colored painted map of Africa in the center circle
   * with distinct colored regions (West = Green, Sahara/North = Yellow, East = Orange, South = Blue/Cyan).
   */
  private drawAfricaCenterCircle(
    dCtx: CanvasRenderingContext2D,
    rCtx: CanvasRenderingContext2D,
    bCtx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    circleRadius: number
  ) {
    const s = circleRadius * 0.88; // Scale factor for Africa continent outline

    dCtx.save();
    dCtx.translate(cx, cy);

    // A. West Africa Region (Vibrant Emerald / Lime Green)
    // Encompasses Nigeria, Ghana, Ivory Coast, Senegal, Guinea
    dCtx.beginPath();
    dCtx.moveTo(-0.15 * s, -0.15 * s);
    dCtx.lineTo(-0.12 * s, 0.05 * s);  // Bight of Biafra
    dCtx.lineTo(-0.45 * s, 0.12 * s);  // Gulf of Guinea coast
    dCtx.lineTo(-0.75 * s, 0.08 * s);  // Liberia / Sierra Leone
    dCtx.lineTo(-0.95 * s, -0.18 * s); // Dakar tip of Senegal
    dCtx.lineTo(-0.72 * s, -0.38 * s); // Mauritania south
    dCtx.lineTo(-0.35 * s, -0.32 * s); // Mali / Niger
    dCtx.closePath();
    dCtx.fillStyle = '#22c55e'; // Bright Green
    dCtx.fill();

    // Secondary emerald tint
    dCtx.fillStyle = 'rgba(21, 128, 61, 0.35)';
    dCtx.fill();

    // B. North Africa / Sahara Region (Golden Yellow & Amber)
    // Encompasses Morocco, Algeria, Tunisia, Libya, Northern Mauritania
    dCtx.beginPath();
    dCtx.moveTo(-0.72 * s, -0.38 * s);
    dCtx.lineTo(-0.62 * s, -0.58 * s); // Morocco / Western Sahara
    dCtx.lineTo(-0.42 * s, -0.72 * s); // Strait of Gibraltar
    dCtx.lineTo(-0.08 * s, -0.78 * s); // Tunisia / Algeria bulge
    dCtx.lineTo(0.18 * s, -0.62 * s);  // Gulf of Sidra
    dCtx.lineTo(0.35 * s, -0.68 * s);  // Egypt border
    dCtx.lineTo(0.28 * s, -0.28 * s);  // Sudan / Chad border
    dCtx.lineTo(-0.15 * s, -0.15 * s); // Center boundary
    dCtx.lineTo(-0.35 * s, -0.32 * s); // Mali
    dCtx.closePath();
    dCtx.fillStyle = '#eab308'; // Rich Golden Yellow
    dCtx.fill();

    // C. North-East & East Africa (Vivid Tangerine & Red-Orange)
    // Encompasses Egypt, Sudan, Ethiopia, Somalia (Horn), Kenya, Uganda, Tanzania
    dCtx.beginPath();
    dCtx.moveTo(0.35 * s, -0.68 * s);
    dCtx.lineTo(0.55 * s, -0.65 * s); // Sinai / Egypt
    dCtx.lineTo(0.68 * s, -0.22 * s); // Red Sea / Bab-el-Mandeb
    dCtx.lineTo(0.92 * s, 0.02 * s);  // Horn of Africa tip (Somalia)
    dCtx.lineTo(0.68 * s, 0.28 * s);  // Kenya / Tanzania coast
    dCtx.lineTo(0.48 * s, 0.45 * s);  // Mozambique north
    dCtx.lineTo(0.15 * s, 0.25 * s);  // Great Lakes / Congo east
    dCtx.lineTo(-0.15 * s, -0.15 * s);
    dCtx.lineTo(0.28 * s, -0.28 * s);
    dCtx.closePath();
    dCtx.fillStyle = '#ea580c'; // Vibrant Orange
    dCtx.fill();

    // D. Southern Africa (Electric Royal Blue & Cyan)
    // Encompasses Angola, Zambia, Zimbabwe, Mozambique, Botswana, Namibia, South Africa
    dCtx.beginPath();
    dCtx.moveTo(-0.12 * s, 0.05 * s);
    dCtx.lineTo(0.15 * s, 0.25 * s);
    dCtx.lineTo(0.48 * s, 0.45 * s);
    dCtx.lineTo(0.42 * s, 0.72 * s);  // Mozambique south
    dCtx.lineTo(0.18 * s, 0.95 * s);  // Cape of Good Hope / South Africa
    dCtx.lineTo(-0.05 * s, 0.88 * s); // Western Cape
    dCtx.lineTo(-0.22 * s, 0.58 * s); // Namibia coast
    dCtx.lineTo(-0.24 * s, 0.28 * s); // Angola coast
    dCtx.closePath();
    dCtx.fillStyle = '#0284c7'; // Royal Blue
    dCtx.fill();

    // Secondary cyan highlight in South
    dCtx.fillStyle = 'rgba(6, 182, 212, 0.35)';
    dCtx.fill();

    // E. Madagascar Island (Cyan / Blue)
    dCtx.beginPath();
    dCtx.ellipse(0.72 * s, 0.58 * s, 0.1 * s, 0.22 * s, -0.35, 0, Math.PI * 2);
    dCtx.fillStyle = '#0284c7';
    dCtx.fill();
    dCtx.strokeStyle = '#0f172a';
    dCtx.lineWidth = 2.5;
    dCtx.stroke();

    // F. Dark Charcoal Regional Boundaries & Outer Continent Outline
    dCtx.strokeStyle = '#0f172a';
    dCtx.lineWidth = 3.5;
    dCtx.lineJoin = 'round';

    // Outer continent path outline
    dCtx.beginPath();
    // North coast
    dCtx.moveTo(-0.42 * s, -0.72 * s);
    dCtx.lineTo(-0.08 * s, -0.78 * s);
    dCtx.lineTo(0.18 * s, -0.62 * s);
    dCtx.lineTo(0.55 * s, -0.65 * s);
    // East coast & Horn
    dCtx.lineTo(0.68 * s, -0.22 * s);
    dCtx.lineTo(0.92 * s, 0.02 * s);
    dCtx.lineTo(0.68 * s, 0.28 * s);
    dCtx.lineTo(0.48 * s, 0.45 * s);
    dCtx.lineTo(0.42 * s, 0.72 * s);
    // South tip
    dCtx.lineTo(0.18 * s, 0.95 * s);
    dCtx.lineTo(-0.05 * s, 0.88 * s);
    // West coast
    dCtx.lineTo(-0.22 * s, 0.58 * s);
    dCtx.lineTo(-0.24 * s, 0.28 * s);
    dCtx.lineTo(-0.12 * s, 0.05 * s);
    dCtx.lineTo(-0.45 * s, 0.12 * s);
    dCtx.lineTo(-0.75 * s, 0.08 * s);
    dCtx.lineTo(-0.95 * s, -0.18 * s);
    dCtx.lineTo(-0.72 * s, -0.38 * s);
    dCtx.lineTo(-0.62 * s, -0.58 * s);
    dCtx.closePath();
    dCtx.stroke();

    // Internal regional dividing lines
    dCtx.lineWidth = 2.2;
    dCtx.beginPath();
    // West boundary
    dCtx.moveTo(-0.35 * s, -0.32 * s);
    dCtx.lineTo(-0.15 * s, -0.15 * s);
    dCtx.lineTo(-0.12 * s, 0.05 * s);
    // North/East boundary
    dCtx.moveTo(-0.15 * s, -0.15 * s);
    dCtx.lineTo(0.28 * s, -0.28 * s);
    dCtx.lineTo(0.35 * s, -0.68 * s);
    // South boundary
    dCtx.moveTo(-0.15 * s, -0.15 * s);
    dCtx.lineTo(0.15 * s, 0.25 * s);
    dCtx.lineTo(0.48 * s, 0.45 * s);
    dCtx.stroke();

    dCtx.restore();

    // Slightly smooth roughness on paint mural
    rCtx.save();
    rCtx.translate(cx, cy);
    rCtx.fillStyle = '#a0a0a0';
    rCtx.beginPath();
    rCtx.arc(0, 0, circleRadius * 0.85, 0, Math.PI * 2);
    rCtx.fill();
    rCtx.restore();
  }

  // 1. Asphalt Street Football Ground
  private createAsphaltStreetGround() {
    const pitchGeo = new THREE.PlaneGeometry(PITCH_LENGTH, PITCH_WIDTH, 48, 48);
    const { diffuseMap, roughnessMap, bumpMap } = this.createAsphaltStreetTextures();

    const pitchMat = new THREE.MeshStandardMaterial({
      map: diffuseMap,
      roughnessMap: roughnessMap,
      bumpMap: bumpMap,
      bumpScale: 0.04,
      metalness: 0.04
    });

    const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
    pitchMesh.rotation.x = -Math.PI / 2;
    pitchMesh.receiveShadow = true;
    this.group.add(pitchMesh);

    // Surrounding Asphalt Street Apron
    const streetApronGeo = new THREE.PlaneGeometry(PITCH_LENGTH + 22, PITCH_WIDTH + 18);
    const apronMat = new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.95,
      metalness: 0.02
    });
    const streetApron = new THREE.Mesh(streetApronGeo, apronMat);
    streetApron.position.y = -0.015;
    streetApron.rotation.x = -Math.PI / 2;
    streetApron.receiveShadow = true;
    this.group.add(streetApron);
  }

  // 2. Tubular Steel Street Goals (White metal pipes matching reference photo)
  private createStreetGoals() {
    const halfLen = PITCH_LENGTH / 2;
    const postRadius = 0.045;

    // High-visibility pure white metal pipe
    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.32,
      metalness: 0.5
    });

    // White goal net
    const netMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });

    [-1, 1].forEach((side) => {
      const goalGroup = new THREE.Group();
      const posX = side * halfLen;

      // Two vertical posts
      [-GOAL_WIDTH / 2, GOAL_WIDTH / 2].forEach((gz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, GOAL_HEIGHT, 16), pipeMat);
        post.position.set(posX, GOAL_HEIGHT / 2, gz);
        post.castShadow = true;
        goalGroup.add(post);

        const runner = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, GOAL_DEPTH, 12), pipeMat);
        runner.rotation.z = Math.PI / 2;
        runner.position.set(posX + side * (GOAL_DEPTH / 2), 0.03, gz);
        goalGroup.add(runner);

        const elbow = new THREE.Mesh(new THREE.TorusGeometry(0.12, postRadius, 8, 12, Math.PI / 2), pipeMat);
        elbow.position.set(posX + side * 0.12, GOAL_HEIGHT - 0.12, gz);
        elbow.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
        elbow.rotation.z = side === 1 ? Math.PI : 0;
        goalGroup.add(elbow);

        const topRunner = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, GOAL_DEPTH - 0.12, 12), pipeMat);
        topRunner.rotation.z = Math.PI / 2;
        topRunner.position.set(posX + side * (GOAL_DEPTH / 2 + 0.06), GOAL_HEIGHT, gz);
        goalGroup.add(topRunner);

        const rearSupport = new THREE.Mesh(new THREE.CylinderGeometry(postRadius * 0.85, postRadius * 0.85, GOAL_HEIGHT, 12), pipeMat);
        rearSupport.position.set(posX + side * GOAL_DEPTH, GOAL_HEIGHT / 2, gz);
        goalGroup.add(rearSupport);
      });

      // Front Top Horizontal Crossbar
      const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, GOAL_WIDTH, 16), pipeMat);
      crossbar.rotation.x = Math.PI / 2;
      crossbar.position.set(posX, GOAL_HEIGHT, 0);
      crossbar.castShadow = true;
      goalGroup.add(crossbar);

      // Back bottom crossbar
      const backBottomBar = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, GOAL_WIDTH, 12), pipeMat);
      backBottomBar.rotation.x = Math.PI / 2;
      backBottomBar.position.set(posX + side * GOAL_DEPTH, 0.03, 0);
      goalGroup.add(backBottomBar);

      // Back top crossbar
      const backTopBar = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, GOAL_WIDTH, 12), pipeMat);
      backTopBar.rotation.x = Math.PI / 2;
      backTopBar.position.set(posX + side * GOAL_DEPTH, GOAL_HEIGHT, 0);
      goalGroup.add(backTopBar);

      // White Netting: Back plane
      const backNet = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_WIDTH, GOAL_HEIGHT, 12, 8), netMat);
      backNet.position.set(posX + side * GOAL_DEPTH, GOAL_HEIGHT / 2, 0);
      backNet.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
      goalGroup.add(backNet);

      // Top net
      const topNet = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_DEPTH, GOAL_WIDTH, 8, 12), netMat);
      topNet.position.set(posX + side * (GOAL_DEPTH / 2), GOAL_HEIGHT, 0);
      topNet.rotation.x = -Math.PI / 2;
      goalGroup.add(topNet);

      // Left side net
      const leftNet = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_DEPTH, GOAL_HEIGHT, 8, 8), netMat);
      leftNet.position.set(posX + side * (GOAL_DEPTH / 2), GOAL_HEIGHT / 2, -GOAL_WIDTH / 2);
      goalGroup.add(leftNet);

      // Right side net
      const rightNet = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_DEPTH, GOAL_HEIGHT, 8, 8), netMat);
      rightNet.position.set(posX + side * (GOAL_DEPTH / 2), GOAL_HEIGHT / 2, GOAL_WIDTH / 2);
      goalGroup.add(rightNet);

      this.group.add(goalGroup);
      this.goalFrames.push(goalGroup);
    });
  }

  // 3. Complete African Street Surroundings:
  // Mama T Provisions shop, market umbrellas, keke napep tricycles, wooden fence, sponsor banners, spectators
  private createStreetSurroundings() {
    const halfLen = PITCH_LENGTH / 2;
    const halfWid = PITCH_WIDTH / 2;

    // A. Concrete sidewalk along the North Sideline
    const sidewalkGeo = new THREE.BoxGeometry(PITCH_LENGTH + 18, 0.18, 4.2);
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x858079,
      roughness: 0.92,
      metalness: 0.05
    });
    const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    sidewalk.position.set(0, 0.09, -halfWid - 2.8);
    sidewalk.receiveShadow = true;
    this.group.add(sidewalk);

    // Curb edge stone along the pitch
    const curbGeo = new THREE.BoxGeometry(PITCH_LENGTH + 18, 0.22, 0.3);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x5a554e, roughness: 0.95 });
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(0, 0.11, -halfWid - 0.7);
    curb.castShadow = true;
    curb.receiveShadow = true;
    this.group.add(curb);

    // B. MAMA T PROVISIONS SHOPFRONT & STREET BUILDINGS (Exact match to reference photo)
    this.createMamaTProvisionsShop(halfWid);

    // C. 3 VIBRANT MARKET UMBRELLAS (Blue/White striped, Yellow, Pink)
    this.createMarketUmbrellas(halfWid);

    // D. KEKE NAPEP / AUTO-RICKSHAW TRICYCLES
    this.createKekeNapepFleet(halfWid);

    // E. WOODEN SIDELINE BARRIERS & OFFICIAL SPONSOR BANNERS
    this.createSidelineBarriersAndSponsors(halfLen, halfWid);

    // F. SPECTATOR CROWD ALONG THE SIDELINE BARRIER
    this.createSpectatorCrowd(halfLen, halfWid);
  }

  /**
   * B. Mama T Provisions Shop building facade with signage, shelves & produce crates
   */
  private createMamaTProvisionsShop(halfWid: number) {
    // 1. Mama T Provisions Signboard (Canvas Texture)
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024;
    signCanvas.height = 256;
    const sCtx = signCanvas.getContext('2d')!;

    // Yellow background with metal weathered border
    sCtx.fillStyle = '#facc15'; // Bright Lagos Yellow
    sCtx.fillRect(0, 0, 1024, 256);

    sCtx.strokeStyle = '#09090b';
    sCtx.lineWidth = 14;
    sCtx.strokeRect(7, 7, 1010, 242);

    // Bold text "MAMA T PROVISIONS"
    sCtx.fillStyle = '#09090b';
    sCtx.font = '900 84px Impact, Arial Black, sans-serif';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.letterSpacing = '4px';
    sCtx.fillText('MAMA T PROVISIONS', 512, 128);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.45 });
    const signMesh = new THREE.Mesh(new THREE.BoxGeometry(8.5, 1.4, 0.15), signMat);
    signMesh.position.set(-2.5, 4.2, -halfWid - 3.8);
    signMesh.castShadow = true;
    this.group.add(signMesh);

    // 2. Pink / Salmon Building Facade
    const buildingWallMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6, // Vibrant warm pink stucco
      roughness: 0.85
    });
    const mainBuilding = new THREE.Mesh(new THREE.BoxGeometry(18, 6.5, 2.5), buildingWallMat);
    mainBuilding.position.set(-2.5, 3.25, -halfWid - 5.2);
    mainBuilding.castShadow = true;
    mainBuilding.receiveShadow = true;
    this.group.add(mainBuilding);

    // Adjacent turquoise/yellow building next door
    const rightBuildingMat = new THREE.MeshStandardMaterial({ color: 0x2dd4bf, roughness: 0.88 });
    const rightBuilding = new THREE.Mesh(new THREE.BoxGeometry(16, 6.8, 2.5), rightBuildingMat);
    rightBuilding.position.set(14.5, 3.4, -halfWid - 5.2);
    rightBuilding.castShadow = true;
    this.group.add(rightBuilding);

    // Corrugated tin roof over Mama T Provisions
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x78716c, metalness: 0.65, roughness: 0.45 });
    const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(18.5, 0.15, 3.5), roofMat);
    roofMesh.position.set(-2.5, 6.4, -halfWid - 4.4);
    roofMesh.rotation.x = 0.15;
    roofMesh.castShadow = true;
    this.group.add(roofMesh);

    // 3. Wooden Fruit and Plantain Display Crates on Sidewalk
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
    const plantainMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.6 }); // Green plantains
    const mangoMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });     // Mangoes/Pineapples

    [-5.8, -4.6, -3.4, -1.2, 0.0].forEach((cx, idx) => {
      // Wooden box crate
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.45, 0.75), crateMat);
      crate.position.set(cx, 0.35, -halfWid - 1.8);
      crate.castShadow = true;
      this.group.add(crate);

      // Produce mound inside crate
      const produceMat = idx % 2 === 0 ? plantainMat : mangoMat;
      const produceMound = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 1), produceMat);
      produceMound.position.set(cx, 0.62, -halfWid - 1.8);
      produceMound.scale.set(1.2, 0.7, 0.9);
      produceMound.castShadow = true;
      this.group.add(produceMound);
    });
  }

  /**
   * C. 3 Vibrant Market Umbrellas: Blue/White Striped, Bright Yellow, Hot Pink
   */
  private createMarketUmbrellas(halfWid: number) {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x573e2a, roughness: 0.8 });

    // 1. Blue & White Striped Umbrella Canvas
    const stripedCanvas = document.createElement('canvas');
    stripedCanvas.width = 512;
    stripedCanvas.height = 512;
    const stCtx = stripedCanvas.getContext('2d')!;
    const numSlices = 8;
    for (let i = 0; i < numSlices; i++) {
      const a1 = (i / numSlices) * Math.PI * 2;
      const a2 = ((i + 1) / numSlices) * Math.PI * 2;
      stCtx.beginPath();
      stCtx.moveTo(256, 256);
      stCtx.arc(256, 256, 256, a1, a2);
      stCtx.closePath();
      stCtx.fillStyle = i % 2 === 0 ? '#1d4ed8' : '#f8fafc'; // Royal Blue and White
      stCtx.fill();
    }
    const stripedTex = new THREE.CanvasTexture(stripedCanvas);
    const stripedMat = new THREE.MeshStandardMaterial({ map: stripedTex, roughness: 0.55, side: THREE.DoubleSide });

    // Umbrella specs from reference screenshot
    const umbrellas = [
      { x: -6.2, z: -halfWid - 1.9, mat: stripedMat, tiltZ: 0.06 },
      { x: -2.2, z: -halfWid - 1.9, mat: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.55 }), tiltZ: -0.04 }, // Yellow
      { x: 1.8, z: -halfWid - 1.8, mat: new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.55 }), tiltZ: 0.05 }    // Pink
    ];

    umbrellas.forEach(u => {
      const uGroup = new THREE.Group();
      uGroup.position.set(u.x, 0.18, u.z);
      uGroup.rotation.z = u.tiltZ;

      // Vertical pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.8, 8), poleMat);
      pole.position.y = 1.4;
      pole.castShadow = true;
      uGroup.add(pole);

      // Umbrella canopy cone
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.65, 0.65, 8, 1, true), u.mat);
      canopy.position.y = 2.7;
      canopy.castShadow = true;
      uGroup.add(canopy);

      this.group.add(uGroup);
    });
  }

  /**
   * D. Parked Keke Napep / Auto-rickshaw Tricycles in background street
   */
  private createKekeNapepFleet(halfWid: number) {
    const createKeke = (x: number, z: number, angle: number, mainColor: number) => {
      const keke = new THREE.Group();
      keke.position.set(x, 0.18, z);
      keke.rotation.y = angle;

      const bodyMat = new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.45 });
      const blackTrimMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 });
      const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });

      // Chassis Body
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.65, 2.2), bodyMat);
      chassis.position.y = 0.55;
      chassis.castShadow = true;
      keke.add(chassis);

      // Roof Canopy
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.1, 2.25), blackTrimMat);
      roof.position.y = 1.75;
      roof.castShadow = true;
      keke.add(roof);

      // 4 Canopy Pillars
      [-0.6, 0.6].forEach(px => {
        [-0.95, 0.95].forEach(pz => {
          const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 8), chromeMat);
          pillar.position.set(px, 1.2, pz);
          keke.add(pillar);
        });
      });

      // Front wheel (1 center wheel)
      const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 16), wheelMat);
      frontWheel.rotation.z = Math.PI / 2;
      frontWheel.position.set(0, 0.24, 0.95);
      frontWheel.castShadow = true;
      keke.add(frontWheel);

      // Rear wheels (2 side wheels)
      [-0.62, 0.62].forEach(rx => {
        const rearWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.12, 16), wheelMat);
        rearWheel.rotation.z = Math.PI / 2;
        rearWheel.position.set(rx, 0.25, -0.75);
        rearWheel.castShadow = true;
        keke.add(rearWheel);
      });

      // Front round headlight
      const light = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 12), chromeMat);
      light.rotation.x = Math.PI / 2;
      light.position.set(0, 0.72, 1.12);
      keke.add(light);

      this.group.add(keke);
    };

    // 3 Keke Napep tricycles parked along alley
    createKeke(8.5, -halfWid - 3.2, 0.22, 0xfacc15);  // Yellow Keke Napep
    createKeke(12.6, -halfWid - 3.0, -0.15, 0x9333ea); // Purple/Magenta Keke Napep
    createKeke(16.2, -halfWid - 3.4, 0.1, 0x0f766e);   // Dark Teal Keke Napep
  }

  /**
   * E. Sideline Rustic Wooden Barrier & Official Sponsor Advertising Boards
   * (usebuddy.app, Cardify Crypto & Giftcard, Cardify logo)
   */
  private createSidelineBarriersAndSponsors(halfLen: number, halfWid: number) {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x634d3d, roughness: 0.9 });

    // Low wooden fence along North sideline
    for (let x = -halfLen; x <= halfLen; x += 3.2) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 0.14), woodMat);
      post.position.set(x, 0.48, -halfWid - 0.55);
      post.castShadow = true;
      this.group.add(post);
    }
    const northRailTop = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 2, 0.08, 0.12), woodMat);
    northRailTop.position.set(0, 0.85, -halfWid - 0.55);
    this.group.add(northRailTop);

    const northRailMid = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 2, 0.08, 0.12), woodMat);
    northRailMid.position.set(0, 0.45, -halfWid - 0.55);
    this.group.add(northRailMid);

    // 1. USEBUDDY.APP SPONSOR BANNER (Sideline Left - Dark Green WhatsApp marketing)
    const buddyCanvas = document.createElement('canvas');
    buddyCanvas.width = 1024;
    buddyCanvas.height = 256;
    const buCtx = buddyCanvas.getContext('2d')!;
    buCtx.fillStyle = '#064e3b'; // Deep emerald green
    buCtx.fillRect(0, 0, 1024, 256);

    // Green WhatsApp icon bubble
    buCtx.fillStyle = '#22c55e';
    buCtx.beginPath();
    buCtx.arc(95, 128, 55, 0, Math.PI * 2);
    buCtx.fill();
    buCtx.fillStyle = '#ffffff';
    buCtx.font = 'bold 50px sans-serif';
    buCtx.textAlign = 'center';
    buCtx.textBaseline = 'middle';
    buCtx.fillText('💬', 95, 128);

    // Brand text
    buCtx.textAlign = 'left';
    buCtx.fillStyle = '#22c55e';
    buCtx.font = '900 68px Arial Black, sans-serif';
    buCtx.fillText('usebuddy.app', 180, 95);

    buCtx.fillStyle = '#ffffff';
    buCtx.font = 'bold 38px sans-serif';
    buCtx.fillText('Buddy Make WhatsApp your best marketing channel.', 180, 168);

    const buddyTex = new THREE.CanvasTexture(buddyCanvas);
    const buddyMat = new THREE.MeshStandardMaterial({ map: buddyTex, roughness: 0.4 });
    const buddyMesh = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.9, 0.05), buddyMat);
    buddyMesh.position.set(-10.2, 0.55, -halfWid - 0.52);
    buddyMesh.castShadow = true;
    this.group.add(buddyMesh);

    // 2. CARDIFY CRYPTO & GIFTCARD BANNER (Sideline Right - Black & Yellow)
    const cardifyCanvas = document.createElement('canvas');
    cardifyCanvas.width = 1024;
    cardifyCanvas.height = 256;
    const cdCtx = cardifyCanvas.getContext('2d')!;
    cdCtx.fillStyle = '#111827'; // Dark charcoal black
    cdCtx.fillRect(0, 0, 1024, 256);

    // Cardify logo icon
    cdCtx.fillStyle = '#eab308';
    cdCtx.font = 'bold 65px sans-serif';
    cdCtx.textAlign = 'center';
    cdCtx.textBaseline = 'middle';
    cdCtx.fillText('⛊', 85, 128);

    cdCtx.textAlign = 'left';
    cdCtx.fillStyle = '#ffffff';
    cdCtx.font = 'bold 44px sans-serif';
    cdCtx.fillText('Sell Crypto & Giftcard for', 150, 95);

    cdCtx.fillStyle = '#eab308'; // Yellow rate
    cdCtx.font = '900 50px Arial Black, sans-serif';
    cdCtx.fillText('N1350/$', 740, 95);

    cdCtx.fillStyle = '#f8fafc';
    cdCtx.font = 'bold 46px sans-serif';
    cdCtx.fillText('www.cardify.co', 150, 168);

    const cardifyTex = new THREE.CanvasTexture(cardifyCanvas);
    const cardifyMat = new THREE.MeshStandardMaterial({ map: cardifyTex, roughness: 0.4 });
    const cardifyMesh = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.9, 0.05), cardifyMat);
    cardifyMesh.position.set(6.8, 0.55, -halfWid - 0.52);
    cardifyMesh.castShadow = true;
    this.group.add(cardifyMesh);

    // 3. CARDIFY LOGO BANNER NEXT TO GOAL
    const miniCardifyCanvas = document.createElement('canvas');
    miniCardifyCanvas.width = 512;
    miniCardifyCanvas.height = 180;
    const mcCtx = miniCardifyCanvas.getContext('2d')!;
    mcCtx.fillStyle = '#0f172a';
    mcCtx.fillRect(0, 0, 512, 180);
    mcCtx.fillStyle = '#ffffff';
    mcCtx.font = '900 68px Arial Black, sans-serif';
    mcCtx.textAlign = 'center';
    mcCtx.textBaseline = 'middle';
    mcCtx.fillText('cardify', 256, 90);

    const miniCardifyTex = new THREE.CanvasTexture(miniCardifyCanvas);
    const miniCardifyMat = new THREE.MeshStandardMaterial({ map: miniCardifyTex, roughness: 0.4 });
    const miniCardifyMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.85, 0.05), miniCardifyMat);
    miniCardifyMesh.position.set(13.8, 0.55, -halfWid - 0.52);
    this.group.add(miniCardifyMesh);
  }

  /**
   * F. Spectator Crowd along the sidelines watching the game
   */
  private createSpectatorCrowd(halfLen: number, halfWid: number) {
    const skinTones = [0x3d2314, 0x4a2c17, 0x5a371e, 0x2e190c];
    const shirtColors = [
      0xfacc15, // Yellow
      0x15803d, // Green
      0xec4899, // Pink
      0x0284c7, // Royal Blue
      0xf97316, // Orange
      0xf8fafc, // White
      0x0f766e, // Teal
      0x8b5cf6  // Purple
    ];

    const crowdGroup = new THREE.Group();
    const numSpectators = 38;

    for (let i = 0; i < numSpectators; i++) {
      const spec = new THREE.Group();
      const posX = -halfLen + 2.5 + (i / numSpectators) * (PITCH_LENGTH - 4.5) + (Math.random() - 0.5) * 0.4;
      const posZ = -halfWid - 1.2 - Math.random() * 0.9;
      const height = 1.65 + (Math.random() - 0.5) * 0.2;

      const skinMat = new THREE.MeshStandardMaterial({
        color: skinTones[Math.floor(Math.random() * skinTones.length)],
        roughness: 0.75
      });
      const shirtMat = new THREE.MeshStandardMaterial({
        color: shirtColors[Math.floor(Math.random() * shirtColors.length)],
        roughness: 0.6
      });
      const pantsMat = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? 0x1e293b : 0x334155,
        roughness: 0.7
      });

      // Torso / Shirt
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.58, 0.26), shirtMat);
      torso.position.y = height * 0.65;
      torso.castShadow = true;
      spec.add(torso);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), skinMat);
      head.position.y = height * 0.94;
      head.castShadow = true;
      spec.add(head);

      // Legs / Pants
      const legs = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.65, 0.22), pantsMat);
      legs.position.y = height * 0.32;
      legs.castShadow = true;
      spec.add(legs);

      // Random hat / cap on some spectators
      if (Math.random() > 0.6) {
        const hatMat = new THREE.MeshStandardMaterial({ color: 0x09090b });
        const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 8), hatMat);
        hat.position.y = height + 0.02;
        spec.add(hat);
      }

      spec.position.set(posX, 0.18, posZ);
      // Face slightly toward pitch center
      spec.rotation.y = (Math.random() - 0.5) * 0.35;
      crowdGroup.add(spec);
    }

    this.group.add(crowdGroup);
  }
}
