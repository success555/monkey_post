import * as THREE from 'three';
import { Player, AyoGameState } from './types';
import { ayoSound } from './AyoAudio';

export interface PitPosition {
  index: number;
  x: number;
  y: number;
  z: number;
  radius: number;
}

export class AyoScene3D {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;

  // Board & Seeds
  private boardGroup: THREE.Group;
  private seedMeshesByPit: Map<number, THREE.Mesh[]> = new Map();
  private storeSeedMeshes: { 1: THREE.Mesh[]; 2: THREE.Mesh[] } = { 1: [], 2: [] };
  private pitHighlights: Map<number, THREE.Mesh> = new Map();

  // Coordinates
  private pitPositions: PitPosition[] = [];
  private storeP1Pos = { x: -6.1, y: 0.25, z: 0 }; // Player 1 captured store (Left)
  private storeP2Pos = { x: 6.1, y: 0.25, z: 0 };  // Player 2 captured store (Right)

  // Interaction
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private hoveredPitIndex: number | null = null;
  public onPitSelect?: (pitIndex: number) => void;
  public isInteractive = true;
  public currentTurn: Player = 1;

  // Animation Queue
  private isAnimating = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.boardGroup = new THREE.Group();
    this.scene.add(this.boardGroup);

    // Setup Camera (Overhead Angled View)
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    this.camera.position.set(0, 10.5, 9.2);
    this.camera.lookAt(0, -0.2, 0.2);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Environment & Lighting
    this.setupLighting();
    this.setupRoomEnvironment();

    // Calculate Pit Grid Coordinates
    this.calculatePitPositions();

    // Build 3D Carved Wooden Board & Pits
    this.createCarvedAyoBoard();

    // Event Listeners
    this.bindEvents();

    // Render loop
    this.animate();
  }

  // Calculate coordinates for the 12 pits
  private calculatePitPositions() {
    const spacingX = 1.65;
    const rowZ = 1.35;

    // Player 1 (South row, indices 0 to 5, left to right)
    for (let i = 0; i < 6; i++) {
      const x = -4.125 + i * spacingX;
      this.pitPositions.push({
        index: i,
        x,
        y: 0.25,
        z: rowZ,
        radius: 0.65
      });
    }

    // Player 2 (North row, indices 6 to 11, right to left for counter-clockwise loop)
    for (let i = 0; i < 6; i++) {
      const x = 4.125 - i * spacingX;
      this.pitPositions.push({
        index: 6 + i,
        x,
        y: 0.25,
        z: -rowZ,
        radius: 0.65
      });
    }
  }

  // Realistic Warm Nigerian Tabletop Lighting
  private setupLighting() {
    // Warm ambient light
    const ambient = new THREE.AmbientLight(0xfffaee, 0.85);
    this.scene.add(ambient);

    // Key Light: Overhead warm sunlight
    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.85);
    keyLight.position.set(5, 14, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -9;
    keyLight.shadow.camera.right = 9;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -7;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // Fill Light: Soft blue reflection
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.65);
    fillLight.position.set(-6, 8, -6);
    this.scene.add(fillLight);
  }

  // Rich Traditional Nigerian Room Setting
  private setupRoomEnvironment() {
    // Room background color (deep warm dark charcoal)
    this.scene.background = new THREE.Color(0x0e0e11);

    // Underlying Rustic Wooden Table Mat
    const tableGeo = new THREE.PlaneGeometry(36, 26);
    const tableCanvas = document.createElement('canvas');
    tableCanvas.width = 512;
    tableCanvas.height = 512;
    const tCtx = tableCanvas.getContext('2d')!;
    tCtx.fillStyle = '#1c1917';
    tCtx.fillRect(0, 0, 512, 512);
    // Subtle wood grain streaks
    tCtx.fillStyle = 'rgba(41, 37, 36, 0.6)';
    for (let i = 0; i < 120; i++) {
      tCtx.fillRect(0, Math.random() * 512, 512, 1 + Math.random() * 3);
    }
    const tableTex = new THREE.CanvasTexture(tableCanvas);
    const tableMat = new THREE.MeshStandardMaterial({
      map: tableTex,
      roughness: 0.88,
      metalness: 0.05
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.rotation.x = -Math.PI / 2;
    table.position.y = -0.55;
    table.receiveShadow = true;
    this.scene.add(table);
  }

  // Generates procedurally carved African Iroko Hardwood Board Texture
  private createWoodTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Rich Iroko wood base color
    ctx.fillStyle = '#5c3822';
    ctx.fillRect(0, 0, 1024, 512);

    // Longitudinal organic wood rings
    for (let y = 0; y < 512; y += 4) {
      const alpha = 0.08 + Math.sin(y * 0.05) * 0.06;
      ctx.fillStyle = `rgba(38, 20, 10, ${alpha})`;
      ctx.fillRect(0, y, 1024, 3);
    }

    // Carved African geometric perimeter border (triangles & chevrons)
    ctx.strokeStyle = 'rgba(28, 14, 8, 0.65)';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, 992, 480);

    ctx.fillStyle = 'rgba(28, 14, 8, 0.45)';
    for (let x = 24; x < 1000; x += 32) {
      // Top row triangles
      ctx.beginPath();
      ctx.moveTo(x, 18);
      ctx.lineTo(x + 16, 32);
      ctx.lineTo(x + 32, 18);
      ctx.closePath();
      ctx.fill();

      // Bottom row triangles
      ctx.beginPath();
      ctx.moveTo(x, 494);
      ctx.lineTo(x + 16, 480);
      ctx.lineTo(x + 32, 494);
      ctx.closePath();
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  // Build the 3D Carved Ọpọ́n Ayò Board
  private createCarvedAyoBoard() {
    const woodTex = this.createWoodTexture();
    const woodMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.42,
      metalness: 0.08
    });

    // Dark carved interior bowl material
    const bowlMat = new THREE.MeshStandardMaterial({
      color: 0x3d2112,
      roughness: 0.72,
      metalness: 0.02
    });

    // Main wooden board block (with chamfered rounded edges)
    const boardWidth = 14.2;
    const boardHeight = 0.85;
    const boardDepth = 5.6;

    const boardBody = new THREE.Mesh(
      new THREE.BoxGeometry(boardWidth, boardHeight, boardDepth),
      woodMat
    );
    boardBody.position.y = 0;
    boardBody.castShadow = true;
    boardBody.receiveShadow = true;
    this.boardGroup.add(boardBody);

    // Decorative Carved End Grips / Handles
    [-1, 1].forEach(side => {
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, boardDepth * 0.75, 16),
        woodMat
      );
      handle.rotation.x = Math.PI / 2;
      handle.position.set(side * (boardWidth / 2 + 0.15), 0, 0);
      handle.castShadow = true;
      this.boardGroup.add(handle);
    });

    // 12 Carved Circular Pit Bowls
    this.pitPositions.forEach(p => {
      // Pit Bowl Cavity (dark hollow interior)
      const bowlGeo = new THREE.CylinderGeometry(p.radius, p.radius * 0.82, 0.38, 24);
      const bowl = new THREE.Mesh(bowlGeo, bowlMat);
      bowl.position.set(p.x, 0.26, p.z);
      bowl.receiveShadow = true;
      this.boardGroup.add(bowl);

      // Pit Rim Ring (smooth polished lip)
      const rimGeo = new THREE.TorusGeometry(p.radius, 0.065, 8, 24);
      const rim = new THREE.Mesh(rimGeo, woodMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(p.x, 0.43, p.z);
      this.boardGroup.add(rim);

      // Interactive Glow Ring for Hover & Legal Move Highlighting
      const glowGeo = new THREE.RingGeometry(p.radius * 0.98, p.radius * 1.25, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(p.x, 0.44, p.z);
      this.boardGroup.add(glow);
      this.pitHighlights.set(p.index, glow);

      // Initialize seed container for this pit
      this.seedMeshesByPit.set(p.index, []);
    });

    // 2 Large End Storage Bowls for Captured Seeds (Ilédè)
    // Left Store (Player 1)
    const storeGeo = new THREE.CylinderGeometry(1.05, 0.88, 0.42, 28);
    const storeP1 = new THREE.Mesh(storeGeo, bowlMat);
    storeP1.position.set(this.storeP1Pos.x, 0.25, this.storeP1Pos.z);
    storeP1.receiveShadow = true;
    this.boardGroup.add(storeP1);

    const storeP1Rim = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.08, 8, 28), woodMat);
    storeP1Rim.rotation.x = Math.PI / 2;
    storeP1Rim.position.set(this.storeP1Pos.x, 0.43, this.storeP1Pos.z);
    this.boardGroup.add(storeP1Rim);

    // Right Store (Player 2)
    const storeP2 = new THREE.Mesh(storeGeo, bowlMat);
    storeP2.position.set(this.storeP2Pos.x, 0.25, this.storeP2Pos.z);
    storeP2.receiveShadow = true;
    this.boardGroup.add(storeP2);

    const storeP2Rim = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.08, 8, 28), woodMat);
    storeP2Rim.rotation.x = Math.PI / 2;
    storeP2Rim.position.set(this.storeP2Pos.x, 0.43, this.storeP2Pos.z);
    this.boardGroup.add(storeP2Rim);
  }

  // Create an authentic glossy natural African Caesalpinia Bonduc Seed Mesh (Ọmọ Ayò)
  private createSeedMesh(): THREE.Mesh {
    const seedGeo = new THREE.SphereGeometry(0.19, 14, 14);
    // Slight organic pebble flattening
    seedGeo.scale(1.08, 0.84, 1.02);

    // Organic earthy seed color shades
    const seedColors = [0x78350f, 0x92400e, 0x573016, 0x475569, 0xa16207, 0x64748b];
    const col = seedColors[Math.floor(Math.random() * seedColors.length)];

    const seedMat = new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.28, // Polished, glossy surface
      metalness: 0.12
    });

    const mesh = new THREE.Mesh(seedGeo, seedMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    return mesh;
  }

  /**
   * Sync 3D Scene with Ayò Board State
   * (Places seeds physically clustered inside each bowl)
   */
  public updateBoardState(state: AyoGameState) {
    this.currentTurn = state.currentTurn;

    // 1. Update 12 Pit Bowls
    state.board.forEach((seedCount, pitIndex) => {
      const currentMeshes = this.seedMeshesByPit.get(pitIndex) || [];
      const pitPos = this.pitPositions[pitIndex];

      // Remove excess meshes
      while (currentMeshes.length > seedCount) {
        const removed = currentMeshes.pop()!;
        this.boardGroup.remove(removed);
        removed.geometry.dispose();
      }

      // Add missing meshes
      while (currentMeshes.length < seedCount) {
        const seed = this.createSeedMesh();
        this.boardGroup.add(seed);
        currentMeshes.push(seed);
      }

      // Arrange seeds naturally inside the circular bowl
      currentMeshes.forEach((seed, idx) => {
        const angle = (idx / Math.max(1, currentMeshes.length)) * Math.PI * 2 + idx * 0.4;
        const layer = Math.floor(idx / 6);
        const radius = (idx % 6 === 0 && idx !== 0) ? 0.05 : 0.18 + (idx % 3) * 0.11;
        const offsetX = Math.cos(angle) * Math.min(radius, pitPos.radius * 0.55);
        const offsetZ = Math.sin(angle) * Math.min(radius, pitPos.radius * 0.55);
        const offsetY = 0.28 + layer * 0.16;

        seed.position.set(pitPos.x + offsetX, pitPos.y + offsetY, pitPos.z + offsetZ);
      });

      this.seedMeshesByPit.set(pitIndex, currentMeshes);
    });

    // 2. Update Player 1 Captured Store (Left)
    this.syncStoreSeeds(1, state.captured[1], this.storeP1Pos);

    // 3. Update Player 2 Captured Store (Right)
    this.syncStoreSeeds(2, state.captured[2], this.storeP2Pos);

    // 4. Update Legal Move Highlights
    this.updateLegalHighlights(state);
  }

  // Sync seeds in captured end store
  private syncStoreSeeds(player: 1 | 2, count: number, storePos: { x: number; y: number; z: number }) {
    const list = this.storeSeedMeshes[player];

    while (list.length > count) {
      const removed = list.pop()!;
      this.boardGroup.remove(removed);
      removed.geometry.dispose();
    }

    while (list.length < count) {
      const seed = this.createSeedMesh();
      this.boardGroup.add(seed);
      list.push(seed);
    }

    list.forEach((seed, idx) => {
      const angle = (idx * 0.85);
      const dist = (idx % 8) * 0.09;
      const layer = Math.floor(idx / 8);
      seed.position.set(
        storePos.x + Math.cos(angle) * dist,
        storePos.y + 0.18 + layer * 0.14,
        storePos.z + Math.sin(angle) * dist
      );
    });
  }

  // Update Golden Glow on playable pits
  private updateLegalHighlights(state: AyoGameState) {
    const turn = state.currentTurn;

    this.pitPositions.forEach(p => {
      const glow = this.pitHighlights.get(p.index);
      if (!glow) return;

      const isOwned = turn === 1 ? p.index >= 0 && p.index <= 5 : p.index >= 6 && p.index <= 11;
      const hasSeeds = state.board[p.index] > 0;
      const isPlayable = isOwned && hasSeeds && !state.isGameOver;

      const mat = glow.material as THREE.MeshBasicMaterial;
      if (p.index === this.hoveredPitIndex && isPlayable) {
        mat.opacity = 0.85;
        mat.color.setHex(0x22c55e); // Bright emerald on hover
      } else if (isPlayable) {
        mat.opacity = 0.45;
        mat.color.setHex(turn === 1 ? 0xfacc15 : 0x38bdf8); // Warm yellow for P1, cyan for P2
      } else {
        mat.opacity = 0;
      }
    });
  }

  // --- SEED SOWING & CAPTURE ANIMATION SEQUENCE ---
  public async animateMoveSequence(
    startPit: number,
    sowPath: number[],
    capturedPits: { pitIndex: number; count: number }[],
    player: Player
  ): Promise<void> {
    this.isAnimating = true;
    this.isInteractive = false;

    // Sowing flight sound
    ayoSound.playSowWhoosh();

    // 1. Lift and sow seeds one by one along sowPath
    for (let step = 0; step < sowPath.length; step++) {
      const targetPit = sowPath[step];
      const targetPos = this.pitPositions[targetPit];

      // Play soft wood tap on each drop
      ayoSound.playSeedDrop();

      // Spawn temporary flying seed along arc
      await this.animateSeedArc(
        this.pitPositions[startPit],
        targetPos,
        180 // ms per seed
      );
    }

    // 2. Animate Captures if any
    if (capturedPits.length > 0) {
      ayoSound.playCapture();

      const storePos = player === 1 ? this.storeP1Pos : this.storeP2Pos;
      for (const cap of capturedPits) {
        const fromPos = this.pitPositions[cap.pitIndex];
        await this.animateSeedArc(fromPos, storePos, 240);
      }
    }

    this.isAnimating = false;
    this.isInteractive = true;
  }

  // Parabolic flight arc animation for a single seed
  private animateSeedArc(
    startPos: { x: number; y: number; z: number },
    endPos: { x: number; y: number; z: number },
    durationMs: number
  ): Promise<void> {
    return new Promise(resolve => {
      const tempSeed = this.createSeedMesh();
      this.boardGroup.add(tempSeed);

      const startTime = performance.now();
      const peakY = Math.max(startPos.y, endPos.y) + 1.25;

      const updateArc = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);

        // Linear interpolation X & Z
        const curX = startPos.x + (endPos.x - startPos.x) * progress;
        const curZ = startPos.z + (endPos.z - startPos.z) * progress;

        // Parabolic arc for Y
        const heightBoost = Math.sin(progress * Math.PI) * peakY;
        const curY = startPos.y + (endPos.y - startPos.y) * progress + heightBoost;

        tempSeed.position.set(curX, curY, curZ);
        tempSeed.rotation.x += 0.2;
        tempSeed.rotation.y += 0.3;

        if (progress < 1) {
          requestAnimationFrame(updateArc);
        } else {
          this.boardGroup.remove(tempSeed);
          tempSeed.geometry.dispose();
          resolve();
        }
      };

      requestAnimationFrame(updateArc);
    });
  }

  // Event Listeners for Raycasting & Clicks
  private bindEvents() {
    const getCanvasRelativeMouse = (e: MouseEvent | Touch) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1
      };
    };

    // Mouse Move Hover
    this.renderer.domElement.addEventListener('mousemove', e => {
      if (!this.isInteractive || this.isAnimating) return;
      const coords = getCanvasRelativeMouse(e);
      this.mouse.set(coords.x, coords.y);
      this.checkHover();
    });

    // Click / Tap Pit
    const handleClick = (coords: { x: number; y: number }) => {
      if (!this.isInteractive || this.isAnimating) return;
      this.mouse.set(coords.x, coords.y);
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Check intersect against pit radii
      let bestPit: number | null = null;
      let minDistance = Infinity;

      this.pitPositions.forEach(p => {
        const pitSphere = new THREE.Sphere(new THREE.Vector3(p.x, p.y + 0.2, p.z), p.radius * 1.3);
        const ray = this.raycaster.ray;
        const hit = ray.intersectSphere(pitSphere, new THREE.Vector3());
        if (hit) {
          const dist = hit.distanceTo(ray.origin);
          if (dist < minDistance) {
            minDistance = dist;
            bestPit = p.index;
          }
        }
      });

      if (bestPit !== null && this.onPitSelect) {
        this.onPitSelect(bestPit);
      }
    };

    this.renderer.domElement.addEventListener('click', e => {
      const coords = getCanvasRelativeMouse(e);
      handleClick(coords);
    });

    // Touch support for mobile
    this.renderer.domElement.addEventListener('touchstart', e => {
      if (e.touches.length > 0) {
        const coords = getCanvasRelativeMouse(e.touches[0]);
        handleClick(coords);
      }
    });

    // Window Resize
    window.addEventListener('resize', () => {
      if (!this.container) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  private checkHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    let hovered: number | null = null;

    this.pitPositions.forEach(p => {
      const pitSphere = new THREE.Sphere(new THREE.Vector3(p.x, p.y + 0.2, p.z), p.radius * 1.25);
      const hit = this.raycaster.ray.intersectSphere(pitSphere, new THREE.Vector3());
      if (hit) {
        hovered = p.index;
      }
    });

    this.hoveredPitIndex = hovered;
  }

  // Animation render loop
  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);

    // Subtle gentle camera breathing effect
    const t = performance.now() * 0.0008;
    this.camera.position.x = Math.sin(t * 0.5) * 0.15;

    this.renderer.render(this.scene, this.camera);
  };

  public dispose() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

