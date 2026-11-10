import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
  private diceGroup: THREE.Group | null = null;
  private isDiceRolling = false;
  private modelLoaded = false;

  // Interaction
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  public onTokenSelect?: (tokenId: string) => void;
  public onDiceClick?: () => void;
  public isInteractive = true;

  // Cached state for syncing once model finishes loading
  private pendingTokensState: Record<LudoColor, TokenState[]> | null = null;
  private pendingMovableIds: string[] = [];

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
    this.loadCustomNigeriaLudoModel();
    this.bindEvents();
    this.animate();
  }

  private setupLighting() {
    this.scene.background = new THREE.Color(0x0a0a0c);

    const ambient = new THREE.AmbientLight(0xfff7ed, 0.95);
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
   * Load the uploaded Nigeria_Ludo.glb 3D Model
   * Extracts authentic custom Nigerian board, yard platforms, 3D pawns, and dice!
   */
  private loadCustomNigeriaLudoModel() {
    const loader = new GLTFLoader();
    loader.load(
      '/models/Nigeria_Ludo.glb',
      (gltf) => {
        const root = gltf.scene;

        // Enable shadows on all parts
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        // 1. Separate Static Board Parts:
        // part_0: Base Board
        // part_1: Track Lines
        // part_2: Center Star
        // part_3: Center Triangle
        // part_4, 17, 30, 43: Corner Yard Platforms
        // part_18..29, 31..42: Decorative Green/Blue Yard Pawns
        const boardPartNames = [
          'part_0', 'part_1', 'part_2', 'part_3',
          'part_4', 'part_17', 'part_30', 'part_43',
          // Keep secondary yard pawns as decorative resting pawns in yard 2 and 3
          'part_18', 'part_19', 'part_20', 'part_21', 'part_22', 'part_23',
          'part_24', 'part_25', 'part_26', 'part_27', 'part_28', 'part_29',
          'part_31', 'part_32', 'part_33', 'part_34', 'part_35', 'part_36',
          'part_37', 'part_38', 'part_39', 'part_40', 'part_41', 'part_42'
        ];

        const boardHolder = new THREE.Group();
        boardPartNames.forEach((name) => {
          const obj = root.getObjectByName(name);
          if (obj) {
            boardHolder.add(obj);
          }
        });
        this.boardGroup.add(boardHolder);

        // 2. Extract Red (Player 1 South) 4 Pawns from Yard 1:
        // P1.0: part_5, part_6, part_7 (center: -3.60, 0.19, -3.60)
        // P1.1: part_8, part_9, part_10 (center: -2.80, 0.19, -3.60)
        // P1.2: part_11, part_12, part_13 (center: -3.60, 0.19, -2.80)
        // P1.3: part_14, part_15, part_16 (center: -2.80, 0.19, -2.80)
        const redPawnConfigs = [
          { id: 'red_0', parts: ['part_5', 'part_6', 'part_7'], ox: -3.60, oy: 0.19, oz: -3.60 },
          { id: 'red_1', parts: ['part_8', 'part_9', 'part_10'], ox: -2.80, oy: 0.19, oz: -3.60 },
          { id: 'red_2', parts: ['part_11', 'part_12', 'part_13'], ox: -3.60, oy: 0.19, oz: -2.80 },
          { id: 'red_3', parts: ['part_14', 'part_15', 'part_16'], ox: -2.80, oy: 0.19, oz: -2.80 }
        ];

        redPawnConfigs.forEach((cfg) => {
          this.buildPawnGroupFromGLTF(root, cfg.id, cfg.parts, cfg.ox, cfg.oy, cfg.oz, 'red');
        });

        // 3. Extract Yellow (Player 2 / AI North) 4 Pawns from Yard 4:
        // P2.0: part_44, part_45, part_46 (center: 2.80, 0.19, 2.80)
        // P2.1: part_47, part_48, part_49 (center: 3.60, 0.19, 2.80)
        // P2.2: part_50, part_51, part_52 (center: 2.80, 0.19, 3.60)
        // P2.3: part_53, part_54, part_55 (center: 3.60, 0.19, 3.60)
        const yellowPawnConfigs = [
          { id: 'yellow_0', parts: ['part_44', 'part_45', 'part_46'], ox: 2.80, oy: 0.19, oz: 2.80 },
          { id: 'yellow_1', parts: ['part_47', 'part_48', 'part_49'], ox: 3.60, oy: 0.19, oz: 2.80 },
          { id: 'yellow_2', parts: ['part_50', 'part_51', 'part_52'], ox: 2.80, oy: 0.19, oz: 3.60 },
          { id: 'yellow_3', parts: ['part_53', 'part_54', 'part_55'], ox: 3.60, oy: 0.19, oz: 3.60 }
        ];

        yellowPawnConfigs.forEach((cfg) => {
          this.buildPawnGroupFromGLTF(root, cfg.id, cfg.parts, cfg.ox, cfg.oy, cfg.oz, 'yellow');
        });

        // 4. Extract 3D Dice (part_56 cube + part_57, 58, 59 pips):
        // Original center: 0.00, 0.45, 4.60
        const diceGroup = new THREE.Group();
        ['part_56', 'part_57', 'part_58', 'part_59'].forEach((name) => {
          const part = root.getObjectByName(name) as THREE.Mesh;
          if (part) {
            part.geometry.translate(0, -0.45, -4.60);
            diceGroup.add(part);
          }
        });
        diceGroup.position.set(0, 0.45, 0);
        this.boardGroup.add(diceGroup);
        this.diceGroup = diceGroup;

        this.modelLoaded = true;

        // Synchronize tokens if state was pending
        if (this.pendingTokensState) {
          this.syncTokens(this.pendingTokensState, this.pendingMovableIds);
        }
      },
      undefined,
      (err) => {
        console.warn('Failed to load Nigeria_Ludo.glb, using fallback procedural board', err);
        this.buildFallbackBoard();
      }
    );
  }

  /**
   * Helper to build an interactive pawn group from GLTF mesh parts
   */
  private buildPawnGroupFromGLTF(
    root: THREE.Group,
    tokenId: string,
    partNames: string[],
    ox: number,
    oy: number,
    oz: number,
    color: LudoColor
  ) {
    const pawnGroup = new THREE.Group();
    pawnGroup.name = tokenId;

    const accentHex = color === 'red' ? 0xdc2626 : 0xf59e0b;

    partNames.forEach((name) => {
      const part = root.getObjectByName(name) as THREE.Mesh;
      if (part) {
        // Translate vertices so pawn local origin is (0, 0, 0)
        part.geometry.translate(-ox, -oy, -oz);

        // Enhance material with glossy finish and distinct player tint
        if (part.material) {
          const mat = (part.material as THREE.MeshStandardMaterial).clone();
          mat.roughness = 0.25;
          mat.metalness = 0.15;
          if (color === 'red') {
            mat.color.setHex(0xef4444);
          } else {
            mat.color.setHex(0xfacc15);
          }
          part.material = mat;
        }

        pawnGroup.add(part);
      }
    });

    // Selection Halo Ring around base
    const haloGeo = new THREE.RingGeometry(0.32, 0.44, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: accentHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.05;
    pawnGroup.add(halo);
    this.tokenHighlights.set(tokenId, halo);

    // Initial position in yard
    pawnGroup.position.set(ox, oy, oz);

    this.boardGroup.add(pawnGroup);
    this.tokensMap.set(tokenId, pawnGroup);
  }

  /**
   * Fallback procedural board (only used if GLB fails to load)
   */
  private buildFallbackBoard() {
    const baseGeo = new THREE.BoxGeometry(11.8, 0.5, 11.8);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3e1f0e, roughness: 0.55 });
    const base = new THREE.Mesh(baseGeo, woodMat);
    base.position.y = -0.25;
    this.boardGroup.add(base);
  }

  /**
   * Synchronize all tokens from game state
   */
  public syncTokens(tokens: Record<LudoColor, TokenState[]>, movableIds: string[]) {
    this.pendingTokensState = tokens;
    this.pendingMovableIds = movableIds;

    if (!this.modelLoaded) return;

    (['red', 'yellow'] as LudoColor[]).forEach((col) => {
      tokens[col].forEach((t) => {
        const group = this.tokensMap.get(t.id);
        if (!group) return;

        const world = getTokenWorldPosition(col, t.index, t.step);
        group.position.set(world.x, world.y, world.z);

        // Highlight if movable
        const halo = this.tokenHighlights.get(t.id);
        if (halo) {
          const isMovable = movableIds.includes(t.id);
          const mat = halo.material as THREE.MeshBasicMaterial;
          mat.opacity = isMovable ? 0.9 : 0;
          if (isMovable) {
            mat.color.setHex(0x22c55e); // Bright emerald glow on playable tokens
          }
        }
      });
    });
  }

  /**
   * Animate 3D Dice Roll
   */
  public async animateDiceRoll(targetValue: number): Promise<void> {
    if (!this.diceGroup || this.isDiceRolling) return;
    this.isDiceRolling = true;

    ludoSound.playDiceShake();
    ludoSound.playDiceRoll();

    const startRotX = this.diceGroup.rotation.x;
    const startRotY = this.diceGroup.rotation.y;
    const startRotZ = this.diceGroup.rotation.z;

    // Target rotations to face up:
    const targetRotations: Record<number, { x: number; z: number }> = {
      1: { x: 0, z: 0 },
      2: { x: Math.PI / 2, z: 0 },
      3: { x: 0, z: -Math.PI / 2 },
      4: { x: 0, z: Math.PI / 2 },
      5: { x: -Math.PI / 2, z: 0 },
      6: { x: Math.PI, z: 0 }
    };

    const target = targetRotations[targetValue] || { x: 0, z: 0 };
    const extraSpins = 4 * Math.PI;

    const duration = 650;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const updateRoll = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);

        const heightArc = Math.sin(progress * Math.PI) * 2.2;
        this.diceGroup!.position.y = 0.45 + heightArc;

        this.diceGroup!.rotation.x = startRotX + (target.x + extraSpins - startRotX) * ease;
        this.diceGroup!.rotation.z = startRotZ + (target.z + extraSpins - startRotZ) * ease;
        this.diceGroup!.rotation.y = startRotY + extraSpins * 0.7 * ease;

        if (progress < 1) {
          requestAnimationFrame(updateRoll);
        } else {
          this.diceGroup!.position.y = 0.45;
          this.diceGroup!.rotation.set(target.x, 0, target.z);
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
    const duration = 280;
    const startTime = performance.now();
    const peakHeight = Math.max(startPos.y, endPos.y) + 0.85;

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
      if (this.diceGroup) {
        const diceHit = this.raycaster.intersectObjects(this.diceGroup.children, true);
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
