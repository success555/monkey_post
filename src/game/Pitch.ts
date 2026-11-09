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
   * Generates high-resolution asphalt tarmac texture matching reference photo:
   * Dark aged tarmac, organic bitumen patches, crack networks, yellow dashed curb markings,
   * white regulation lines, corner arcs, penalty boxes, penalty D-arcs, and scattered leaves.
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
    dCtx.fillStyle = '#2d3035';
    dCtx.fillRect(0, 0, width, height);

    rCtx.fillStyle = '#dedede'; // High roughness for gritty tarmac
    rCtx.fillRect(0, 0, width, height);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, width, height);

    // 2. ASPHALT AGGREGATE GRAIN NOISE (Granular stone specks)
    for (let i = 0; i < 90000; i++) {
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
      grad.addColorStop(0, 'rgba(28, 30, 34, 0.75)');
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

        // Branching secondary fissure
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

    // 5. REGULATION WHITE PITCH MARKINGS & YELLOW CURB DASHES
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

    // White regulation street pitch markings
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
      { ctx: rCtx, color: '#888888', lineW: 7.5 }, // White chalk/paint is smoother
      { ctx: bCtx, color: '#c0c0c0', lineW: 8.5 }  // Paint sits slightly proud of tarmac
    ].forEach(({ ctx, color, lineW }) => {
      setupLineStyle(ctx, color, lineW);

      // A. Outer Perimeter Rectangle Boundary
      ctx.strokeRect(pitchLeft, pitchTop, pitchW, pitchH);

      // B. Center Kickoff Spot (solid white circle at exact center)
      ctx.beginPath();
      ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
      ctx.fill();

      // C. West (Left) Penalty Area & Penalty "D" Arc
      const penaltyBoxW = 320;
      const penaltyBoxH = 680;
      ctx.strokeRect(pitchLeft, centerY - penaltyBoxH / 2, penaltyBoxW, penaltyBoxH);

      // West Penalty D-Arc facing toward center
      ctx.beginPath();
      ctx.arc(pitchLeft + penaltyBoxW, centerY, 120, -Math.PI / 2.7, Math.PI / 2.7);
      ctx.stroke();

      // D. East (Right) Penalty Area & Penalty "D" Arc
      ctx.strokeRect(pitchRight - penaltyBoxW, centerY - penaltyBoxH / 2, penaltyBoxW, penaltyBoxH);

      // East Penalty D-Arc facing toward center
      ctx.beginPath();
      ctx.arc(pitchRight - penaltyBoxW, centerY, 120, (1.7 * Math.PI) / 2.7, (3.7 * Math.PI) / 2.7);
      ctx.stroke();

      // E. Four Corner Arcs
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

    // 6. SCATTERED DRIED AUTUMN LEAVES & CITY DEBRIS (Exact match to photo)
    const leafColors = ['#b45309', '#d97706', '#ca8a04', '#78350f', '#92400e'];
    for (let i = 0; i < 280; i++) {
      const lx = Math.random() * width;
      const ly = Math.random() * height;
      const col = leafColors[Math.floor(Math.random() * leafColors.length)];
      const size = 3 + Math.random() * 4;

      dCtx.save();
      dCtx.translate(lx, ly);
      dCtx.rotate(Math.random() * Math.PI * 2);
      dCtx.fillStyle = col;
      dCtx.beginPath();
      dCtx.ellipse(0, 0, size, size * 0.55, 0, 0, Math.PI * 2);
      dCtx.fill();
      dCtx.restore();
    }

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

  // 1. Asphalt Street Football Ground
  private createAsphaltStreetGround() {
    // Pitch surface geometry
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
    const streetApronGeo = new THREE.PlaneGeometry(PITCH_LENGTH + 18, PITCH_WIDTH + 14);
    const apronMat = new THREE.MeshStandardMaterial({
      color: 0x24262a, // Deep dark street asphalt
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
    const postRadius = 0.042;

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
        // Vertical post
        const post = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, GOAL_HEIGHT, 16), pipeMat);
        post.position.set(posX, GOAL_HEIGHT / 2, gz);
        post.castShadow = true;
        goalGroup.add(post);

        // Ground runner extending backward
        const runner = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, GOAL_DEPTH, 12), pipeMat);
        runner.rotation.z = Math.PI / 2;
        runner.position.set(posX + side * (GOAL_DEPTH / 2), 0.03, gz);
        goalGroup.add(runner);

        // Curved top elbow pipe transitioning backward
        const elbow = new THREE.Mesh(new THREE.TorusGeometry(0.12, postRadius, 8, 12, Math.PI / 2), pipeMat);
        elbow.position.set(posX + side * 0.12, GOAL_HEIGHT - 0.12, gz);
        elbow.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
        elbow.rotation.z = side === 1 ? Math.PI : 0;
        goalGroup.add(elbow);

        // Top depth runner
        const topRunner = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, GOAL_DEPTH - 0.12, 12), pipeMat);
        topRunner.rotation.z = Math.PI / 2;
        topRunner.position.set(posX + side * (GOAL_DEPTH / 2 + 0.06), GOAL_HEIGHT, gz);
        goalGroup.add(topRunner);

        // Rear vertical support
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

  // 3. Authentic Urban Street Surroundings: Sidewalk, Shopfronts, Posters, Moped, Trash Bin, Railing & Foliage
  private createStreetSurroundings() {
    const halfLen = PITCH_LENGTH / 2;
    const halfWid = PITCH_WIDTH / 2;

    // A. NORTH (TOP) ELEVATED CONCRETE SIDEWALK & CURB
    const sidewalkGeo = new THREE.BoxGeometry(PITCH_LENGTH + 14, 0.18, 3.2);
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x827e77, // Concrete sidewalk grey
      roughness: 0.92,
      metalness: 0.05
    });
    const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    sidewalk.position.set(0, 0.09, -halfWid - 2.2);
    sidewalk.receiveShadow = true;
    this.group.add(sidewalk);

    // Curb edge stone along the pitch
    const curbGeo = new THREE.BoxGeometry(PITCH_LENGTH + 14, 0.22, 0.25);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x5c5750, roughness: 0.95 });
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(0, 0.11, -halfWid - 0.7);
    curb.castShadow = true;
    curb.receiveShadow = true;
    this.group.add(curb);

    // Storm drain grates along the curb
    [-12, -4, 4, 12].forEach(gx => {
      const drainGeo = new THREE.BoxGeometry(1.2, 0.03, 0.4);
      const drainMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.4 });
      const drain = new THREE.Mesh(drainGeo, drainMat);
      drain.position.set(gx, 0.01, -halfWid - 0.48);
      this.group.add(drain);
    });

    // B. NORTH BUILDING FACADE WITH METAL ROLL-DOWN SHOP SHUTTERS & GIG POSTERS
    const shopWallCanvas = document.createElement('canvas');
    shopWallCanvas.width = 1024;
    shopWallCanvas.height = 512;
    const sCtx = shopWallCanvas.getContext('2d')!;

    // Brick / plaster upper facade
    sCtx.fillStyle = '#6b584d';
    sCtx.fillRect(0, 0, 1024, 512);

    // Brick mortar lines on upper section
    sCtx.strokeStyle = 'rgba(215, 205, 195, 0.35)';
    sCtx.lineWidth = 1.5;
    for (let y = 0; y < 180; y += 14) {
      sCtx.beginPath(); sCtx.moveTo(0, y); sCtx.lineTo(1024, y); sCtx.stroke();
    }

    // 4 Distinct Shopfront Bays with corrugated roll-down metal shutters
    const shutterColors = ['#475569', '#1e293b', '#1e3a8a', '#581c87'];
    for (let b = 0; b < 4; b++) {
      const bx = b * 256;
      sCtx.fillStyle = '#1e1b18';
      sCtx.fillRect(bx + 12, 170, 232, 342); // Shop frame

      // Corrugated shutter metal slats
      sCtx.fillStyle = shutterColors[b];
      sCtx.fillRect(bx + 18, 180, 220, 332);

      // Slat shadow lines
      sCtx.strokeStyle = 'rgba(0,0,0,0.45)';
      sCtx.lineWidth = 2;
      for (let sy = 186; sy < 512; sy += 12) {
        sCtx.beginPath(); sCtx.moveTo(bx + 18, sy); sCtx.lineTo(bx + 238, sy); sCtx.stroke();
      }

      // Pasted street gig posters / graffiti flyers (Yellow, red, cyan, black)
      const posterColors = ['#facc15', '#ef4444', '#06b6d4', '#ffffff', '#fb923c'];
      for (let p = 0; p < 3; p++) {
        const px = bx + 30 + p * 65;
        const py = 250 + (p % 2) * 60;
        sCtx.fillStyle = posterColors[(b * 3 + p) % posterColors.length];
        sCtx.fillRect(px, py, 45, 65);

        // Poster header text bars
        sCtx.fillStyle = '#09090b';
        sCtx.fillRect(px + 4, py + 8, 37, 7);
        sCtx.fillRect(px + 4, py + 20, 28, 4);
        sCtx.fillRect(px + 4, py + 28, 32, 4);
      }
    }

    const shopTex = new THREE.CanvasTexture(shopWallCanvas);
    const shopWallMat = new THREE.MeshStandardMaterial({ map: shopTex, roughness: 0.88 });
    const northBuilding = new THREE.Mesh(new THREE.BoxGeometry(PITCH_LENGTH + 14, 8, 1), shopWallMat);
    northBuilding.position.set(0, 4.0, -halfWid - 4.3);
    northBuilding.castShadow = true;
    northBuilding.receiveShadow = true;
    this.group.add(northBuilding);

    // C. PARKED MOPED / SCOOTER ON SIDEWALK (Exact match to reference photo top-right)
    const mopedGroup = new THREE.Group();
    mopedGroup.position.set(13.5, 0.18, -halfWid - 1.8);
    mopedGroup.rotation.y = 0.35; // Parked at angle

    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 }); // Electric blue scooter body

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16);
    const frontWheel = new THREE.Mesh(wheelGeo, rubberMat);
    frontWheel.rotation.x = Math.PI / 2;
    frontWheel.position.set(0.65, 0.24, 0);
    mopedGroup.add(frontWheel);

    const rearWheel = frontWheel.clone();
    rearWheel.position.set(-0.65, 0.24, 0);
    mopedGroup.add(rearWheel);

    // Scooter chassis body
    const bodyGeo = new THREE.BoxGeometry(0.85, 0.35, 0.32);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(-0.1, 0.42, 0);
    mopedGroup.add(bodyMesh);

    // Seat
    const seatGeo = new THREE.BoxGeometry(0.55, 0.12, 0.28);
    const seatMesh = new THREE.Mesh(seatGeo, rubberMat);
    seatMesh.position.set(-0.2, 0.65, 0);
    mopedGroup.add(seatMesh);

    // Steering column & handlebars
    const columnGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8);
    const columnMesh = new THREE.Mesh(columnGeo, chromeMat);
    columnMesh.position.set(0.55, 0.62, 0);
    columnMesh.rotation.z = -0.25;
    mopedGroup.add(columnMesh);

    const handlebarGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.58, 8);
    const handlebarMesh = new THREE.Mesh(handlebarGeo, chromeMat);
    handlebarMesh.rotation.x = Math.PI / 2;
    handlebarMesh.position.set(0.62, 0.92, 0);
    mopedGroup.add(handlebarMesh);

    this.group.add(mopedGroup);

    // D. GREEN STREET WHEELIE TRASH BIN (Next to scooter, matching photo)
    const binGroup = new THREE.Group();
    binGroup.position.set(15.8, 0.18, -halfWid - 2.1);
    const binMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 });
    const binBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.95, 0.55), binMat);
    binBody.position.y = 0.48;
    binBody.castShadow = true;
    binGroup.add(binBody);

    const binLid = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.6), binMat);
    binLid.position.y = 0.98;
    binGroup.add(binLid);
    this.group.add(binGroup);

    // E. EAST WALL: VIBRANT GEOMETRIC GRAFFITI STREET MURAL (Exact match to photo top-right)
    const muralCanvas = document.createElement('canvas');
    muralCanvas.width = 1024;
    muralCanvas.height = 512;
    const mCtx = muralCanvas.getContext('2d')!;

    // Brick mortar base
    mCtx.fillStyle = '#26221f';
    mCtx.fillRect(0, 0, 1024, 512);

    const graffitiColors = [
      '#ec4899', '#06b6d4', '#facc15', '#f97316', '#8b5cf6', '#2563eb', '#84cc16', '#ef4444'
    ];

    // Diagonal chevron geometric art
    for (let x = -100; x < 1150; x += 95) {
      for (let y = 0; y < 512; y += 85) {
        mCtx.fillStyle = graffitiColors[Math.floor(Math.random() * graffitiColors.length)];
        mCtx.beginPath();
        mCtx.moveTo(x, y);
        mCtx.lineTo(x + 120, y + 80);
        mCtx.lineTo(x + 85, y + 140);
        mCtx.lineTo(x - 35, y + 60);
        mCtx.closePath();
        mCtx.fill();

        // Contrasting triangular accents
        mCtx.fillStyle = graffitiColors[Math.floor(Math.random() * graffitiColors.length)];
        mCtx.beginPath();
        mCtx.moveTo(x + 35, y + 25);
        mCtx.lineTo(x + 75, y + 65);
        mCtx.lineTo(x + 10, y + 75);
        mCtx.closePath();
        mCtx.fill();
      }
    }

    // Heavy graphic outline stencils
    mCtx.strokeStyle = '#09090b';
    mCtx.lineWidth = 4;
    for (let x = 0; x < 1024; x += 130) {
      mCtx.beginPath();
      mCtx.moveTo(x, 0);
      mCtx.lineTo(x + 180, 512);
      mCtx.stroke();
    }

    const muralTex = new THREE.CanvasTexture(muralCanvas);
    const eastWallMat = new THREE.MeshStandardMaterial({ map: muralTex, roughness: 0.85 });
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7.5, PITCH_WIDTH + 8), eastWallMat);
    eastWall.position.set(halfLen + 2.5, 3.75, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    this.group.add(eastWall);

    // F. WEST WALL: URBAN WEATHERED BRICK WALL
    const westWallMat = new THREE.MeshStandardMaterial({ color: 0x4d3b32, roughness: 0.95 });
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7.5, PITCH_WIDTH + 8), westWallMat);
    westWall.position.set(-halfLen - 2.5, 3.75, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    this.group.add(westWall);

    // G. SOUTH FOREGROUND: BLACK WROUGHT-IRON STREET RAILING & CORNER FOLIAGE
    const railingMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.35 });
    const railingGroup = new THREE.Group();
    const railingY = 0.55;
    const railingZ = halfWid + 0.9;

    // Horizontal top handrail bar
    const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, PITCH_LENGTH + 6, 12), railingMat);
    topBar.rotation.z = Math.PI / 2;
    topBar.position.set(0, railingY + 0.45, railingZ);
    railingGroup.add(topBar);

    // Horizontal bottom rail
    const bottomBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, PITCH_LENGTH + 6, 12), railingMat);
    bottomBar.rotation.z = Math.PI / 2;
    bottomBar.position.set(0, railingY - 0.4, railingZ);
    railingGroup.add(bottomBar);

    // Vertical railing pickets every 0.6m
    for (let rx = -halfLen - 2; rx <= halfLen + 2; rx += 0.6) {
      const picket = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.95, 8), railingMat);
      picket.position.set(rx, railingY, railingZ);
      picket.castShadow = true;
      railingGroup.add(picket);
    }
    this.group.add(railingGroup);

    // Green tree hedge / leaves peering over railing at bottom-left corner (matching photo)
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 });
    for (let i = 0; i < 8; i++) {
      const leafCluster = new THREE.Mesh(
        new THREE.SphereGeometry(0.38 + Math.random() * 0.25, 8, 8),
        foliageMat
      );
      leafCluster.position.set(
        -halfLen - 1.5 + Math.random() * 2.2,
        0.5 + Math.random() * 0.7,
        halfWid + 0.7 + Math.random() * 0.8
      );
      this.group.add(leafCluster);
    }
  }
}
