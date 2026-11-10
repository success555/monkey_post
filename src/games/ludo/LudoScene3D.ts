import * as THREE from 'three';
import { LudoColor, TokenState } from './types';
import { getTokenWorldPosition, WorldPos } from './LudoBoardCoords';
import { ludoSound } from './LudoAudio';

export class LudoScene3D {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;

  private boardGroup: THREE.Group;
  private tokensMap: Map<string, THREE.Group> = new Map();
  private tokenHighlights: Map<string, THREE.Mesh> = new Map();

  // 3D Rolling Dice
  private diceMesh: THREE.Mesh | null = null;
  private isDiceRolling = false;

  // Interaction
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  public onTokenSelect?: (tokenId: string) => void;
  public onDiceClick?: () => void;
  public isInteractive = true;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.boardGroup = new THREE.Group();
    this.scene.add(this.boardGroup);

    // Camera setup (Overhead Isometric View)
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(44, aspect, 0.1, 100);
    this.camera.position.set(0, 13.5, 10.5);
    this.camera.lookAt(0, -0.4, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.buildBoard();
    this.createDice();
    this.bindEvents();
    this.animate();
  }

  private setupLighting() {
    this.scene.background = new THREE.Color(0x0a0a0c);

    const ambient = new THREE.AmbientLight(0xfff7ed, 0.85);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    dirLight.position.set(8, 18, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    dirLight.shadow.bias = -0.0005;
    const d = 9;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLight.position.set(-10, 12, -8);
    this.scene.add(fillLight);
  }

  /**
   * Build 3D Hardwood Ludo Board with Acrylic Colored Quadrants
   */
  private buildBoard() {
    // 1. Mahogany Wooden Base Board
    const baseGeo = new THREE.BoxGeometry(12.4, 0.6, 12.4);
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x3e1f0e,
      roughness: 0.55,
      metalness: 0.1
    });
    const baseMesh = new THREE.Mesh(baseGeo, woodMat);
    baseMesh.position.y = -0.3;
    baseMesh.receiveShadow = true;
    this.boardGroup.add(baseMesh);

    // 2. Play Surface (Cream/Ivory background)
    const surfaceGeo = new THREE.BoxGeometry(11.8, 0.05, 11.8);
    const surfaceMat = new THREE.MeshStandardMaterial({
      color: 0xfaf5ee,
      roughness: 0.4,
      metalness: 0.05
    });
    const surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
    surfaceMesh.position.y = 0.02;
    surfaceMesh.receiveShadow = true;
    this.boardGroup.add(surfaceMesh);

    // 3. Four Colored Yards (Corners)
    const yardColors: Record<LudoColor, { hex: number; x: number; z: number }> = {
      red: { hex: 0xdc2626, x: -3.2, z: -3.2 },
      green: { hex: 0x16a34a, x: -3.2, z: 3.2 },
      yellow: { hex: 0xeab308, x: 3.2, z: 3.2 },
      blue: { hex: 0x2563eb, x: 3.2, z: -3.2 }
    };

    (Object.keys(yardColors) as LudoColor[]).forEach((col) => {
      const cfg = yardColors[col];
      // Yard colored square pad
      const yardGeo = new THREE.BoxGeometry(4.4, 0.06, 4.4);
      const yardMat = new THREE.MeshStandardMaterial({
        color: cfg.hex,
        roughness: 0.35,
        metalness: 0.15
      });
      const yardMesh = new THREE.Mesh(yardGeo, yardMat);
      yardMesh.position.set(cfg.x, 0.05, cfg.z);
      yardMesh.receiveShadow = true;
      this.boardGroup.add(yardMesh);

      // Inner white disc
      const discGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.08, 32);
      const discMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.position.set(cfg.x, 0.08, cfg.z);
      disc.receiveShadow = true;
      this.boardGroup.add(disc);
    });

    // 4. Center Triangular Home Zone
    const centerGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.08, 4);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    centerMesh.rotation.y = Math.PI / 4;
    centerMesh.position.set(0, 0.06, 0);
    this.boardGroup.add(centerMesh);
  }

  /**
   * Create 3D Physical Pawn Token
   */
  public createTokenMesh(color: LudoColor, id: string): THREE.Group {
    const group = new THREE.Group();
    group.name = id;

    const colHex = color === 'red' ? 0xef4444 : color === 'yellow' ? 0xfacc15 : color === 'green' ? 0x22c55e : 0x3b82f6;

    const pawnMat = new THREE.MeshStandardMaterial({
      color: colHex,
      roughness: 0.25,
      metalness: 0.2
    });

    // 1. Base foot
    const baseGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.12, 24);
    const base = new THREE.Mesh(baseGeo, pawnMat);
    base.position.y = 0.06;
    base.castShadow = true;
    group.add(base);

    // 2. Body cylinder
    const bodyGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.35, 24);
    const body = new THREE.Mesh(bodyGeo, pawnMat);
    body.position.y = 0.28;
    body.castShadow = true;
    group.add(body);

    // 3. Spherical Head
    const headGeo = new THREE.SphereGeometry(0.18, 24, 24);
    const head = new THREE.Mesh(headGeo, pawnMat);
    head.position.y = 0.54;
    head.castShadow = true;
    group.add(head);

    // 4. Selection Highlight Aura Ring
    const haloGeo = new THREE.RingGeometry(0.32, 0.42, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.04;
    group.add(halo);
    this.tokenHighlights.set(id, halo);

    this.boardGroup.add(group);
    this.tokensMap.set(id, group);
    return group;
  }

  /**
   * Synchronize all tokens from game state
   */
  public syncTokens(tokens: Record<LudoColor, TokenState[]>, movableIds: string[]) {
    (['red', 'yellow'] as LudoColor[]).forEach((col) => {
      tokens[col].forEach((t) => {
        let group = this.tokensMap.get(t.id);
        if (!group) {
          group = this.createTokenMesh(col, t.id);
        }

        const world = getTokenWorldPosition(col, t.index, t.step);
        group.position.set(world.x, world.y, world.z);

        // Highlight if movable
        const halo = this.tokenHighlights.get(t.id);
        if (halo) {
          const isMovable = movableIds.includes(t.id);
          const mat = halo.material as THREE.MeshBasicMaterial;
          mat.opacity = isMovable ? 0.9 : 0;
          if (isMovable) {
            mat.color.setHex(0x22c55e);
          }
        }
      });
    });
  }

  /**
   * 3D Rolling Dice
   */
  private createDice() {
    const diceGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);

    // Materials with pips
    const createFaceCanvas = (pips: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#1e1b4b';

      const drawPip = (x: number, y: number) => {
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
      };

      if (pips === 1) drawPip(64, 64);
      if (pips === 2) { drawPip(36, 36); drawPip(92, 92); }
      if (pips === 3) { drawPip(36, 36); drawPip(64, 64); drawPip(92, 92); }
      if (pips === 4) { drawPip(36, 36); drawPip(92, 36); drawPip(36, 92); drawPip(92, 92); }
      if (pips === 5) { drawPip(36, 36); drawPip(92, 36); drawPip(64, 64); drawPip(36, 92); drawPip(92, 92); }
      if (pips === 6) { drawPip(36, 30); drawPip(92, 30); drawPip(36, 64); drawPip(92, 64); drawPip(36, 98); drawPip(92, 98); }

      return new THREE.CanvasTexture(canvas);
    };

    // Right: 1, Left: 6, Top: 2, Bottom: 5, Front: 3, Back: 4
    const mats = [
      new THREE.MeshStandardMaterial({ map: createFaceCanvas(1), roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ map: createFaceCanvas(6), roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ map: createFaceCanvas(2), roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ map: createFaceCanvas(5), roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ map: createFaceCanvas(3), roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ map: createFaceCanvas(4), roughness: 0.3 })
    ];

    this.diceMesh = new THREE.Mesh(diceGeo, mats);
    this.diceMesh.position.set(0, 0.45, 0);
    this.diceMesh.castShadow = true;
    this.boardGroup.add(this.diceMesh);
  }

  /**
   * Animate 3D Dice Roll
   */
  public async animateDiceRoll(targetValue: number): Promise<void> {
    if (!this.diceMesh || this.isDiceRolling) return;
    this.isDiceRolling = true;

    ludoSound.playDiceShake();
    ludoSound.playDiceRoll();

    const startRotX = this.diceMesh.rotation.x;
    const startRotY = this.diceMesh.rotation.y;
    const startRotZ = this.diceMesh.rotation.z;

    // Rotation targets for each value face pointing up (Top):
    // Face indices: Top is Face 2 (pips=2).
    // Target rotations to face up:
    const targetRotations: Record<number, { x: number; z: number }> = {
      2: { x: 0, z: 0 },
      5: { x: Math.PI, z: 0 },
      1: { x: 0, z: Math.PI / 2 },
      6: { x: 0, z: -Math.PI / 2 },
      3: { x: -Math.PI / 2, z: 0 },
      4: { x: Math.PI / 2, z: 0 }
    };

    const target = targetRotations[targetValue] || { x: 0, z: 0 };
    const extraSpins = 4 * Math.PI; // 2 full extra tumbling spins

    const duration = 650; // ms
    const startTime = performance.now();

    return new Promise((resolve) => {
      const updateRoll = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

        // Height arc
        const heightArc = Math.sin(progress * Math.PI) * 2.2;
        this.diceMesh!.position.y = 0.45 + heightArc;

        // Tumble
        this.diceMesh!.rotation.x = startRotX + (target.x + extraSpins - startRotX) * ease;
        this.diceMesh!.rotation.z = startRotZ + (target.z + extraSpins - startRotZ) * ease;
        this.diceMesh!.rotation.y = startRotY + extraSpins * 0.7 * ease;

        if (progress < 1) {
          requestAnimationFrame(updateRoll);
        } else {
          this.diceMesh!.position.y = 0.45;
          this.diceMesh!.rotation.set(target.x, 0, target.z);
          this.isDiceRolling = false;
          resolve();
        }
      };

      requestAnimationFrame(updateRoll);
    });
  }

  /**
   * Parabolic token hop animation
   */
  public async animateTokenMove(tokenId: string, startPos: WorldPos, endPos: WorldPos): Promise<void> {
    const mesh = this.tokensMap.get(tokenId);
    if (!mesh) return;

    ludoSound.playTokenHop();
    const duration = 300; // ms
    const startTime = performance.now();
    const peakHeight = Math.max(startPos.y, endPos.y) + 0.9;

    return new Promise((resolve) => {
      const updateHop = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        const curX = startPos.x + (endPos.x - startPos.x) * progress;
        const curZ = startPos.z + (endPos.z - startPos.z) * progress;
        const heightArc = Math.sin(progress * Math.PI) * peakHeight;
        const curY = startPos.y + (endPos.y - startPos.y) * progress + heightArc;

        mesh.position.set(curX, curY, curZ);

        if (progress < 1) {
          requestAnimationFrame(updateHop);
        } else {
          mesh.position.set(endPos.x, endPos.y, endPos.z);
          resolve();
        }
      };

      requestAnimationFrame(updateHop);
    });
  }

  /**
   * Kpafuka Chop Animation (Token sent flying home to yard)
   */
  public async animateChop(tokenId: string, endYardPos: WorldPos): Promise<void> {
    const mesh = this.tokensMap.get(tokenId);
    if (!mesh) return;

    ludoSound.playChop();
    const startPos = { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z };
    const duration = 450;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const updateChop = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        const curX = startPos.x + (endYardPos.x - startPos.x) * progress;
        const curZ = startPos.z + (endYardPos.z - startPos.z) * progress;
        const heightArc = Math.sin(progress * Math.PI) * 2.5;
        const curY = startPos.y + heightArc;

        mesh.position.set(curX, curY, curZ);
        mesh.rotation.y += 0.35;

        if (progress < 1) {
          requestAnimationFrame(updateChop);
        } else {
          mesh.position.set(endYardPos.x, endYardPos.y, endYardPos.z);
          mesh.rotation.y = 0;
          resolve();
        }
      };

      requestAnimationFrame(updateChop);
    });
  }

  // Bind mouse and touch events for raycasting
  private bindEvents() {
    const getCanvasRelativeMouse = (e: MouseEvent | Touch) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1
      };
    };

    const handlePointerAction = (coords: { x: number; y: number }) => {
      if (!this.isInteractive) return;
      this.mouse.set(coords.x, coords.y);
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Check intersect with dice
      if (this.diceMesh) {
        const diceHit = this.raycaster.intersectObject(this.diceMesh);
        if (diceHit.length > 0 && this.onDiceClick) {
          this.onDiceClick();
          return;
        }
      }

      // Check intersect with tokens
      const tokenObjects: THREE.Object3D[] = [];
      this.tokensMap.forEach((grp) => tokenObjects.push(...grp.children));
      const hits = this.raycaster.intersectObjects(tokenObjects, true);

      if (hits.length > 0 && hits[0].object.parent) {
        const parentName = hits[0].object.parent.name;
        if (parentName && this.onTokenSelect) {
          this.onTokenSelect(parentName);
        }
      }
    };

    this.renderer.domElement.addEventListener('click', (e) => {
      handlePointerAction(getCanvasRelativeMouse(e));
    });

    this.renderer.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        handlePointerAction(getCanvasRelativeMouse(e.touches[0]));
      }
    });

    window.addEventListener('resize', () => {
      if (!this.container) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const t = performance.now() * 0.0006;
    this.camera.position.x = Math.sin(t * 0.5) * 0.2;
    this.renderer.render(this.scene, this.camera);
  };

  public dispose() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
