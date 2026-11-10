import * as THREE from 'three';
import { Ball } from './types';
import { BALL_RADIUS, POCKETS } from './SnookerPhysics';

export class SnookerScene3D {
  private container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // Visual Groups
  private tableGroup: THREE.Group = new THREE.Group();
  private ballsGroup: THREE.Group = new THREE.Group();
  private cueGroup: THREE.Group = new THREE.Group();
  private guideGroup: THREE.Group = new THREE.Group();

  // Ball mesh cache
  private ballMeshes: Map<string, THREE.Mesh> = new Map();

  // Cue Stick Components
  private cueMesh!: THREE.Mesh;
  private guideLine!: THREE.Line;
  private ghostBallMesh!: THREE.Mesh;

  // Camera Settings
  public cameraMode: 'aim' | 'overhead' = 'aim';
  private targetCameraPos = new THREE.Vector3();
  private targetCameraLook = new THREE.Vector3();

  // Animation Loop
  private animFrameId: number | null = null;
  private isAiming = false;
  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c10); // Luxurious snooker lounge ambient
    this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.025);

    // 2. Camera with safe dimension fallbacks
    const width = container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800) || 800;
    const height = container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600) || 600;
    const aspect = (width > 0 && height > 0) ? width / height : 16 / 9;

    this.camera = new THREE.PerspectiveCamera(45, Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9, 0.1, 100);
    this.camera.position.set(0, 10, 14);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer with PBR shadows & tone mapping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    container.appendChild(this.renderer.domElement);

    // 4. Lighting Setup (Overhead Warm Pool Hall Canopies)
    this.setupLighting();

    // 5. Build 3D World
    this.scene.add(this.tableGroup);
    this.scene.add(this.ballsGroup);
    this.scene.add(this.cueGroup);
    this.scene.add(this.guideGroup);

    this.buildTable();
    this.buildCueAndGuide();

    // 6. Handle Window Resizing & ResizeObserver
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);

    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this.resizeObserver = new ResizeObserver(() => {
        this.onResize();
      });
      this.resizeObserver.observe(this.container);
    }

    setTimeout(this.onResize, 0);

    // 7. Start Render Loop
    this.renderLoop();
  }

  private setupLighting() {
    // Ambient fill
    const ambient = new THREE.AmbientLight(0xfff7ed, 0.65);
    this.scene.add(ambient);

    // Triple Billiard Overhead Spotlights
    const lightZPositions = [-4.5, 0.0, 4.5];
    lightZPositions.forEach(z => {
      const spot = new THREE.SpotLight(0xfffaed, 2.8, 25, Math.PI / 3, 0.35, 1.2);
      spot.position.set(0, 8.5, z);
      spot.target.position.set(0, 0, z);
      spot.castShadow = true;
      spot.shadow.mapSize.width = 1024;
      spot.shadow.mapSize.height = 1024;
      spot.shadow.bias = -0.0005;
      this.scene.add(spot);
      this.scene.add(spot.target);

      // Hanging Brass Lamp Shade mesh
      const shadeGeo = new THREE.ConeGeometry(0.75, 0.55, 16, 1, true);
      const shadeMat = new THREE.MeshStandardMaterial({
        color: 0x1e3a1e, // classic dark green lamp shade
        roughness: 0.4,
        metalness: 0.6,
        side: THREE.DoubleSide
      });
      const shade = new THREE.Mesh(shadeGeo, shadeMat);
      shade.position.set(0, 8.2, z);
      this.scene.add(shade);
    });

    // Soft warm floor bounce light
    const floorBounce = new THREE.DirectionalLight(0xd97706, 0.3);
    floorBounce.position.set(0, -5, 0);
    this.scene.add(floorBounce);
  }

  private buildTable() {
    // 1. Snooker Baize Cloth Bed (Playing Area: 7.2 x 14.4)
    const baizeGeo = new THREE.BoxGeometry(7.2, 0.3, 14.4);
    const baizeMat = new THREE.MeshStandardMaterial({
      color: 0x0e6e3c, // Rich championship snooker emerald green
      roughness: 0.88,
      metalness: 0.02
    });
    const baize = new THREE.Mesh(baizeGeo, baizeMat);
    baize.position.y = -0.15;
    baize.receiveShadow = true;
    this.tableGroup.add(baize);

    // 2. Baulk Line & "D" Marking Texture Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;

    // Transparent background
    ctx.clearRect(0, 0, 1024, 2048);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 4;

    // Baulk Line at Z = 4.8 (mapped to canvas height)
    // Z range is -7.2 to +7.2 -> delta is 14.4
    // z = 4.8 corresponds to: (4.8 - (-7.2)) / 14.4 = 12.0 / 14.4 = 0.8333 of height
    const baulkY = 2048 * (12.0 / 14.4);
    ctx.beginPath();
    ctx.moveTo(40, baulkY);
    ctx.lineTo(984, baulkY);
    ctx.stroke();

    // The "D" Semi-Circle (Radius = 1.4 units -> 1.4 / 7.2 of width)
    const centerX = 512;
    const dRadiusPx = (1.4 / 7.2) * 1024;
    ctx.beginPath();
    // Arc towards the bottom cushion (baulk side)
    ctx.arc(centerX, baulkY, dRadiusPx, 0, Math.PI, false);
    ctx.stroke();

    const lineTexture = new THREE.CanvasTexture(canvas);
    const lineGeo = new THREE.PlaneGeometry(7.2, 14.4);
    const lineMat = new THREE.MeshBasicMaterial({
      map: lineTexture,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    const lineMesh = new THREE.Mesh(lineGeo, lineMat);
    lineMesh.rotation.x = -Math.PI / 2;
    lineMesh.position.y = 0.002;
    this.tableGroup.add(lineMesh);

    // 3. Polished Mahogany Rails & Cushions
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x3d1b09, // Dark rosewood / mahogany
      roughness: 0.28,
      metalness: 0.15
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xca8a04, // Polished brass accents
      roughness: 0.32,
      metalness: 0.85
    });

    const railThickness = 0.55;
    const railHeight = 0.45;

    // Side Rails (Left & Right)
    const sideRailGeo = new THREE.BoxGeometry(railThickness, railHeight, 14.4 + railThickness * 2);
    const leftRail = new THREE.Mesh(sideRailGeo, railMat);
    leftRail.position.set(-3.6 - railThickness / 2, railHeight / 2 - 0.15, 0);
    leftRail.castShadow = true;
    leftRail.receiveShadow = true;
    this.tableGroup.add(leftRail);

    const rightRail = new THREE.Mesh(sideRailGeo, railMat);
    rightRail.position.set(3.6 + railThickness / 2, railHeight / 2 - 0.15, 0);
    rightRail.castShadow = true;
    rightRail.receiveShadow = true;
    this.tableGroup.add(rightRail);

    // End Rails (Top & Bottom)
    const endRailGeo = new THREE.BoxGeometry(7.2, railHeight, railThickness);
    const topRail = new THREE.Mesh(endRailGeo, railMat);
    topRail.position.set(0, railHeight / 2 - 0.15, -7.2 - railThickness / 2);
    topRail.castShadow = true;
    topRail.receiveShadow = true;
    this.tableGroup.add(topRail);

    const botRail = new THREE.Mesh(endRailGeo, railMat);
    botRail.position.set(0, railHeight / 2 - 0.15, 7.2 + railThickness / 2);
    botRail.castShadow = true;
    botRail.receiveShadow = true;
    this.tableGroup.add(botRail);

    // 4. Six Brass Pocket Liners & Dark Holes
    const pocketHoleMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    for (const p of POCKETS) {
      // Dark Hole
      const holeGeo = new THREE.CylinderGeometry(p.radius * 0.85, p.radius * 0.85, 0.35, 20);
      const hole = new THREE.Mesh(holeGeo, pocketHoleMat);
      hole.position.set(p.x, -0.1, p.z);
      this.tableGroup.add(hole);

      // Brass Corner/Rim Plate
      const rimGeo = new THREE.TorusGeometry(p.radius * 0.95, 0.08, 12, 24);
      const rim = new THREE.Mesh(rimGeo, brassMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(p.x, 0.02, p.z);
      this.tableGroup.add(rim);
    }

    // 5. Six Turned Carved Mahogany Table Legs
    const legGeo = new THREE.CylinderGeometry(0.38, 0.28, 5.0, 16);
    const legPositions = [
      [-3.3, -7.0],
      [3.3, -7.0],
      [-3.3, 0.0],
      [3.3, 0.0],
      [-3.3, 7.0],
      [3.3, 7.0]
    ];

    legPositions.forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, railMat);
      leg.position.set(x, -2.65, z);
      leg.castShadow = true;
      this.tableGroup.add(leg);

      // Brass footer ring
      const footGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.4, 16);
      const foot = new THREE.Mesh(footGeo, brassMat);
      foot.position.set(x, -5.0, z);
      this.tableGroup.add(foot);
    });
  }

  // Build Cue Stick & Laser Guideline
  private buildCueAndGuide() {
    // 1. Realistic Cue Stick Mesh
    // Tapered cylinder: 1.5 units long
    const cueLength = 5.2;
    const cueGeo = new THREE.CylinderGeometry(0.035, 0.08, cueLength, 16);
    // Align horizontally along Z
    cueGeo.rotateX(Math.PI / 2);
    cueGeo.translate(0, 0, -cueLength / 2);

    const cueWoodMat = new THREE.MeshStandardMaterial({
      color: 0xca8a04, // North American ash/maple shaft
      roughness: 0.35,
      metalness: 0.1
    });
    this.cueMesh = new THREE.Mesh(cueGeo, cueWoodMat);
    this.cueMesh.castShadow = true;
    this.cueGroup.add(this.cueMesh);

    // Chalk tip
    const tipGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.06, 16);
    tipGeo.rotateX(Math.PI / 2);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 }); // Blue Master chalk tip
    const tipMesh = new THREE.Mesh(tipGeo, tipMat);
    tipMesh.position.set(0, 0, -0.03);
    this.cueGroup.add(tipMesh);

    // 2. Projected Aim Guideline
    const guidePoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 8)];
    const guideGeo = new THREE.BufferGeometry().setFromPoints(guidePoints);
    const guideMat = new THREE.LineDashedMaterial({
      color: 0xfacc15,
      dashSize: 0.25,
      gapSize: 0.15,
      linewidth: 2
    });
    this.guideLine = new THREE.Line(guideGeo, guideMat);
    this.guideLine.computeLineDistances();
    this.guideGroup.add(this.guideLine);

    // 3. Ghost Ball Preview at target location
    const ghostGeo = new THREE.SphereGeometry(BALL_RADIUS, 16, 16);
    const ghostMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    this.ghostBallMesh = new THREE.Mesh(ghostGeo, ghostMat);
    this.guideGroup.add(this.ghostBallMesh);
  }

  // Synchronize 3D ball meshes with physics state
  public syncBalls(balls: Ball[]) {
    for (const b of balls) {
      let mesh = this.ballMeshes.get(b.id);
      if (!mesh) {
        // Create high-gloss billiard resin ball
        const geo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
        const mat = new THREE.MeshPhysicalMaterial({
          color: b.colorHex,
          roughness: 0.12,
          metalness: 0.02,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.ballsGroup.add(mesh);
        this.ballMeshes.set(b.id, mesh);
      }

      // Update mesh position
      mesh.position.set(b.x, b.y, b.z);

      // If ball is potted, hide or position below table
      if (b.isPotted) {
        mesh.visible = false;
      } else {
        mesh.visible = true;
      }
    }
  }

  // Update Cue Stick, Aim Guideline, and Dynamic Camera
  public updateAim(
    cueBall: Ball,
    angle: number,
    power: number,
    isBallsMoving: boolean,
    targetBalls: Ball[]
  ) {
    if (isBallsMoving || cueBall.isPotted) {
      this.cueGroup.visible = false;
      this.guideGroup.visible = false;
      this.isAiming = false;
      return;
    }

    this.cueGroup.visible = true;
    this.guideGroup.visible = true;
    this.isAiming = true;

    // Cue stick positioning behind cue ball
    const strikeOffset = 0.25 + power * 0.65; // Pull back with shot power
    const cueX = cueBall.x - Math.cos(angle) * (BALL_RADIUS + strikeOffset);
    const cueZ = cueBall.z - Math.sin(angle) * (BALL_RADIUS + strikeOffset);

    this.cueGroup.position.set(cueX, BALL_RADIUS + 0.08, cueZ);
    // Point tip towards cue ball
    this.cueGroup.rotation.y = -angle + Math.PI / 2;
    // Slight downward strike tilt (approx 5 degrees)
    this.cueGroup.rotation.x = 0.09;

    // Guideline forward raycast from cue ball
    const dirX = Math.cos(angle);
    const dirZ = Math.sin(angle);
    let rayDist = 7.0; // Max preview distance

    // Check collision with other balls to show Ghost Ball
    let closestDist = rayDist;
    let hitBall: Ball | null = null;

    for (const other of targetBalls) {
      if (other.isPotted || other.id === cueBall.id) continue;

      // Distance from other ball center to aim ray
      const ox = other.x - cueBall.x;
      const oz = other.z - cueBall.z;
      const proj = ox * dirX + oz * dirZ;

      if (proj > 0 && proj < closestDist) {
        const perpSq = ox * ox + oz * oz - proj * proj;
        const thresh = (BALL_RADIUS * 2) ** 2;
        if (perpSq < thresh) {
          closestDist = proj - Math.sqrt(thresh - perpSq);
          hitBall = other;
        }
      }
    }

    if (hitBall && closestDist < rayDist) {
      rayDist = closestDist;
      this.ghostBallMesh.visible = true;
      this.ghostBallMesh.position.set(
        cueBall.x + dirX * rayDist,
        BALL_RADIUS,
        cueBall.z + dirZ * rayDist
      );
    } else {
      this.ghostBallMesh.visible = false;
    }

    // Update Guideline line geometry
    const positions = (this.guideLine.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    positions[0] = cueBall.x;
    positions[1] = BALL_RADIUS + 0.01;
    positions[2] = cueBall.z;
    positions[3] = cueBall.x + dirX * rayDist;
    positions[4] = BALL_RADIUS + 0.01;
    positions[5] = cueBall.z + dirZ * rayDist;
    this.guideLine.geometry.attributes.position.needsUpdate = true;
    this.guideLine.computeLineDistances();

    // Camera Positioning
    if (this.cameraMode === 'aim') {
      // Cinematic behind-the-cue view looking down the shot
      const camBackDist = 3.6;
      const camHeight = 1.6;
      this.targetCameraPos.set(
        cueBall.x - dirX * camBackDist,
        camHeight,
        cueBall.z - dirZ * camBackDist
      );
      this.targetCameraLook.set(
        cueBall.x + dirX * 4.0,
        BALL_RADIUS,
        cueBall.z + dirZ * 4.0
      );
    } else {
      // Overhead tactical top-down view
      this.targetCameraPos.set(0, 16.5, 0.1);
      this.targetCameraLook.set(0, 0, 0);
    }
  }

  // Smooth camera interpolation in render loop
  private updateCamera(delta: number) {
    const lerpFactor = Math.min(1, delta * 6.0);
    this.camera.position.lerp(this.targetCameraPos, lerpFactor);

    // Intermediate look target
    const currentLook = new THREE.Vector3();
    this.camera.getWorldDirection(currentLook);
    currentLook.multiplyScalar(5).add(this.camera.position);
    currentLook.lerp(this.targetCameraLook, lerpFactor);
    this.camera.lookAt(currentLook);
  }

  private renderLoop = () => {
    this.animFrameId = requestAnimationFrame(this.renderLoop);
    this.updateCamera(0.016);
    this.renderer.render(this.scene, this.camera);
  };

  public resize = () => {
    this.onResize();
  };

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 0);
    const h = this.container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 0);
    if (w <= 0 || h <= 0 || !Number.isFinite(w) || !Number.isFinite(h)) return;
    const aspect = w / h;
    if (!Number.isFinite(aspect) || aspect <= 0) return;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

