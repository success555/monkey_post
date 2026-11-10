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

  // TWO 3D Rolling Dice
  private die1Group: THREE.Group | null = null;
  private die2Group: THREE.Group | null = null;
  private isDiceRolling = false;
  private modelLoaded = false;

  // Camera Mode
  public cameraMode: 'iso' | 'top' = 'iso';
  private targetCamPos = new THREE.Vector3(0, 15.0, 11.5);
  private targetCamLook = new THREE.Vector3(0, 0, 0);

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

    // Camera setup tuned for mobile landscape horizontal view
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 100);
    this.updateCameraTarget();
    this.camera.position.copy(this.targetCamPos);
    this.camera.lookAt(this.targetCamLook);

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
    this.scene.background = new THREE.Color(0x09090b);

    const ambient = new THREE.AmbientLight(0xfff7ed, 1.05);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    dirLight.position.set(10, 20, 12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 45;
    dirLight.shadow.bias = -0.0004;
    const d = 11;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    fillLight.position.set(-12, 14, -10);
    this.scene.add(fillLight);
  }

  /**
   * Load the uploaded Nigeria_Ludo_Two_Dice.glb 3D Model
   * Extracts authentic custom Nigerian board, yard platforms, 3D pawns, and TWO dice!
   */
  private loadCustomNigeriaLudoModel() {
    const loader = new GLTFLoader();
    loader.load(
      '/models/Nigeria_Ludo_Two_Dice.glb',
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
        // part_0: Base Board (16x16)
        // part_1..4: Border rails
        // part_5..8: Corner blocks
        // part_9: Inner playing field
        // part_10..13: Inner track borders
        // part_14..17: Center house pyramid
        // part_18..27: Track stars & markers
        // part_28, 29: Yard 1 platform & rim (SW)
        // part_50, 51: Yard 2 platform & rim (NE)
        // part_72, 73: Yard 3 platform & rim (NW)
        // part_94, 95: Yard 4 platform & rim (SE)
        // Keep decorative resting pawns for Green (Yard 2: part_52..71) & Blue (Yard 3: part_74..93)
        const boardPartNames = [
          'part_0', 'part_1', 'part_2', 'part_3', 'part_4',
          'part_5', 'part_6', 'part_7', 'part_8', 'part_9',
          'part_10', 'part_11', 'part_12', 'part_13',
          'part_14', 'part_15', 'part_16', 'part_17',
          'part_18', 'part_19', 'part_20', 'part_21', 'part_22', 'part_23',
          'part_24', 'part_25', 'part_26', 'part_27',
          'part_28', 'part_29', 'part_50', 'part_51',
          'part_72', 'part_73', 'part_94', 'part_95',
          // Decorative Yard 2 (Green) pawns
          'part_52', 'part_53', 'part_54', 'part_55', 'part_56',
          'part_57', 'part_58', 'part_59', 'part_60', 'part_61',
          'part_62', 'part_63', 'part_64', 'part_65', 'part_66',
          'part_67', 'part_68', 'part_69', 'part_70', 'part_71',
          // Decorative Yard 3 (Blue) pawns
          'part_74', 'part_75', 'part_76', 'part_77', 'part_78',
          'part_79', 'part_80', 'part_81', 'part_82', 'part_83',
          'part_84', 'part_85', 'part_86', 'part_87', 'part_88',
          'part_89', 'part_90', 'part_91', 'part_92', 'part_93'
        ];

        const boardHolder = new THREE.Group();
        boardPartNames.forEach((name) => {
          const obj = root.getObjectByName(name);
          if (obj) {
            boardHolder.add(obj);
          }
        });
        this.boardGroup.add(boardHolder);

        // 2. Extract Red (Player 1 South / SW) 4 Interactive Pawns:
        const redPawnConfigs = [
          { id: 'red_0', parts: ['part_30', 'part_31', 'part_32', 'part_33', 'part_34'], ox: -5.65, oy: 0.35, oz: -5.65 },
          { id: 'red_1', parts: ['part_35', 'part_36', 'part_37', 'part_38', 'part_39'], ox: -4.35, oy: 0.35, oz: -5.65 },
          { id: 'red_2', parts: ['part_40', 'part_41', 'part_42', 'part_43', 'part_44'], ox: -5.65, oy: 0.35, oz: -4.35 },
          { id: 'red_3', parts: ['part_45', 'part_46', 'part_47', 'part_48', 'part_49'], ox: -4.35, oy: 0.35, oz: -4.35 }
        ];

        redPawnConfigs.forEach((cfg) => {
          this.buildPawnGroupFromGLTF(root, cfg.id, cfg.parts, cfg.ox, cfg.oy, cfg.oz, 'red');
        });

        // 3. Extract Yellow (Player 2 / AI North / SE) 4 Interactive Pawns:
        const yellowPawnConfigs = [
          { id: 'yellow_0', parts: ['part_96', 'part_97', 'part_98', 'part_99', 'part_100'], ox: 4.35, oy: 0.35, oz: 4.35 },
          { id: 'yellow_1', parts: ['part_101', 'part_102', 'part_103', 'part_104', 'part_105'], ox: 5.65, oy: 0.35, oz: 4.35 },
          { id: 'yellow_2', parts: ['part_106', 'part_107', 'part_108', 'part_109', 'part_110'], ox: 4.35, oy: 0.35, oz: 5.65 },
          { id: 'yellow_3', parts: ['part_111', 'part_112', 'part_113', 'part_114', 'part_115'], ox: 5.65, oy: 0.35, oz: 5.65 }
        ];

        yellowPawnConfigs.forEach((cfg) => {
          this.buildPawnGroupFromGLTF(root, cfg.id, cfg.parts, cfg.ox, cfg.oy, cfg.oz, 'yellow');
        });

        // 4. Extract TWO 3D DICE:
        // DIE 1: part_116..123 (original center: -1.20, 2.20, -0.80)
        const d1Parts = ['part_116', 'part_117', 'part_118', 'part_119', 'part_120', 'part_121', 'part_122', 'part_123'];
        const d1Group = new THREE.Group();
        d1Parts.forEach((name) => {
          const part = root.getObjectByName(name) as THREE.Mesh;
          if (part) {
            part.geometry.translate(1.20, -2.20, 0.80);
            d1Group.add(part);
          }
        });
        d1Group.position.set(-1.15, 0.35, 0.0);
        d1Group.scale.set(0.65, 0.65, 0.65);
        this.boardGroup.add(d1Group);
        this.die1Group = d1Group;

        // DIE 2: part_124..131 (original center: 1.30, 2.60, 0.60)
        const d2Parts = ['part_124', 'part_125', 'part_126', 'part_127', 'part_128', 'part_129', 'part_130', 'part_131'];
        const d2Group = new THREE.Group();
        d2Parts.forEach((name) => {
          const part = root.getObjectByName(name) as THREE.Mesh;
          if (part) {
            part.geometry.translate(-1.30, -2.60, -0.60);
            d2Group.add(part);
          }
        });
        d2Group.position.set(1.15, 0.35, 0.0);
        d2Group.scale.set(0.65, 0.65, 0.65);
        this.boardGroup.add(d2Group);
        this.die2Group = d2Group;

        this.modelLoaded = true;

        // Synchronize tokens if state was pending
        if (this.pendingTokensState) {
          this.syncTokens(this.pendingTokensState, this.pendingMovableIds);
        }
      },
      undefined,
      (err) => {
        console.warn('Failed to load Nigeria_Ludo_Two_Dice.glb, using fallback procedural board', err);
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

    partNames.forEach((partName) => {
      const part = root.getObjectByName(partName) as THREE.Mesh;
      if (part) {
        part.geometry.translate(-ox, -oy, -oz);
        pawnGroup.add(part);
      }
    });

    // Initial position at original yard coordinate
    pawnGroup.position.set(ox, oy, oz);
    this.boardGroup.add(pawnGroup);
    this.tokensMap.set(tokenId, pawnGroup);

    // Glowing Golden Pulsing Ring Highlight under pawn
    const haloGeo = new THREE.RingGeometry(0.35, 0.52, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.02;
    pawnGroup.add(halo);
    this.tokenHighlights.set(tokenId, halo);
  }

  /**
   * Procedural Fallback Board in case GLB fails to fetch
   */
  private buildFallbackBoard() {
    const boardGeo = new THREE.BoxGeometry(16, 0.5, 16);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.6 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = -0.25;
    board.receiveShadow = true;
    this.boardGroup.add(board);

    // Fallback Die 1 & Die 2
    const dieGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const dieMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    this.die1Group = new THREE.Group();
    this.die1Group.add(new THREE.Mesh(dieGeo, dieMat));
    this.die1Group.position.set(-1.15, 0.35, 0);
    this.boardGroup.add(this.die1Group);

    this.die2Group = new THREE.Group();
    this.die2Group.add(new THREE.Mesh(dieGeo, dieMat));
    this.die2Group.position.set(1.15, 0.35, 0);
    this.boardGroup.add(this.die2Group);

    this.modelLoaded = true;
  }

  /**
   * Synchronize 3D pawn positions with gameplay state
   */
  public syncTokens(tokens: Record<LudoColor, TokenState[]>, movableTokenIds: string[]) {
    if (!this.modelLoaded) {
      this.pendingTokensState = tokens;
      this.pendingMovableIds = movableTokenIds;
      return;
    }

    for (const color of ['red', 'yellow'] as LudoColor[]) {
      for (const token of tokens[color]) {
        const group = this.tokensMap.get(token.id);
        const halo = this.tokenHighlights.get(token.id);
        if (!group) continue;

        const targetPos = getTokenWorldPosition(color, token.index, token.step);

        // Smooth position interpolation
        group.position.x = THREE.MathUtils.lerp(group.position.x, targetPos.x, 0.25);
        group.position.z = THREE.MathUtils.lerp(group.position.z, targetPos.z, 0.25);
        group.position.y = THREE.MathUtils.lerp(group.position.y, targetPos.y, 0.25);

        // Highlight active movable tokens
        const isMovable = movableTokenIds.includes(token.id);
        if (halo) {
          const haloMat = halo.material as THREE.MeshBasicMaterial;
          haloMat.opacity = isMovable ? 0.85 : 0.0;
          haloMat.color.setHex(color === 'red' ? 0xef4444 : 0xfacc15);
        }
      }
    }
  }

  /**
   * Animate a pawn hopping step by step along circuit
   */
  public animatePawnMove(
    tokenId: string,
    fromStep: number,
    toStep: number,
    color: LudoColor,
    tokenIndex: number,
    onComplete: () => void
  ) {
    const group = this.tokensMap.get(tokenId);
    if (!group) {
      onComplete();
      return;
    }

    const stepsToHop: WorldPos[] = [];
    if (fromStep === -1) {
      // Opening hop: from yard pedestal to start tile (step 0)
      stepsToHop.push(getTokenWorldPosition(color, tokenIndex, 0));
      for (let s = 1; s <= toStep; s++) {
        stepsToHop.push(getTokenWorldPosition(color, tokenIndex, s));
      }
    } else {
      for (let s = fromStep + 1; s <= toStep; s++) {
        stepsToHop.push(getTokenWorldPosition(color, tokenIndex, s));
      }
    }

    if (stepsToHop.length === 0) {
      onComplete();
      return;
    }

    let currentStepIdx = 0;
    const hopDuration = 140; // ms per tile
    let stepStartTime = performance.now();
    const startPos = { x: group.position.x, y: group.position.y, z: group.position.z };

    ludoSound.playTokenHop();

    const hopAnim = (time: number) => {
      const elapsed = time - stepStartTime;
      const t = Math.min(1, elapsed / hopDuration);

      const target = stepsToHop[currentStepIdx];
      // Horizontal linear interpolation
      group.position.x = THREE.MathUtils.lerp(startPos.x, target.x, t);
      group.position.z = THREE.MathUtils.lerp(startPos.z, target.z, t);

      // Parabolic vertical hop arc (jump 0.5 units in the air)
      const jumpHeight = 0.55;
      const arc = 4 * jumpHeight * t * (1 - t);
      group.position.y = THREE.MathUtils.lerp(startPos.y, target.y, t) + arc;

      if (t >= 1) {
        group.position.set(target.x, target.y, target.z);
        currentStepIdx++;

        if (currentStepIdx < stepsToHop.length) {
          stepStartTime = performance.now();
          startPos.x = group.position.x;
          startPos.y = group.position.y;
          startPos.z = group.position.z;
          ludoSound.playTokenHop();
          requestAnimationFrame(hopAnim);
        } else {
          onComplete();
        }
      } else {
        requestAnimationFrame(hopAnim);
      }
    };

    requestAnimationFrame(hopAnim);
  }

  /**
   * Physics-like 3D Tumbling Rolling Animation for TWO DICE
   */
  public rollTwoDice3D(val1: number, val2: number, onComplete?: () => void) {
    if (this.isDiceRolling || !this.die1Group || !this.die2Group) {
      onComplete?.();
      return;
    }

    this.isDiceRolling = true;
    ludoSound.playDiceShake();

    const d1 = this.die1Group;
    const d2 = this.die2Group;

    const start1 = { x: -1.15, y: 0.35, z: 0 };
    const start2 = { x: 1.15, y: 0.35, z: 0 };

    const targetRot1 = this.getDiceEulerForValue(val1);
    const targetRot2 = this.getDiceEulerForValue(val2);

    const duration = 750; // ms
    const startTime = performance.now();

    // Random rotational velocity spins
    const spin1 = {
      x: (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 4 + targetRot1.x),
      y: (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 4 + targetRot1.y),
      z: (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 4 + targetRot1.z)
    };
    const spin2 = {
      x: (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 4 + targetRot2.x),
      y: (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 4 + targetRot2.y),
      z: (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 4 + targetRot2.z)
    };

    const rollLoop = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out bounce curve
      const ease = Math.sin((progress * Math.PI) / 2);

      // Arc in the air (peaks at y = 2.2)
      const arc = 4 * 1.85 * progress * (1 - progress);
      d1.position.y = start1.y + arc;
      d2.position.y = start2.y + arc;

      // Slight horizontal tumble drift
      d1.position.x = start1.x - Math.sin(progress * Math.PI) * 0.25;
      d2.position.x = start2.x + Math.sin(progress * Math.PI) * 0.25;

      // Spin rotation interpolation
      d1.rotation.x = THREE.MathUtils.lerp(spin1.x, targetRot1.x, ease);
      d1.rotation.y = THREE.MathUtils.lerp(spin1.y, targetRot1.y, ease);
      d1.rotation.z = THREE.MathUtils.lerp(spin1.z, targetRot1.z, ease);

      d2.rotation.x = THREE.MathUtils.lerp(spin2.x, targetRot2.x, ease);
      d2.rotation.y = THREE.MathUtils.lerp(spin2.y, targetRot2.y, ease);
      d2.rotation.z = THREE.MathUtils.lerp(spin2.z, targetRot2.z, ease);

      if (progress >= 1) {
        d1.position.set(start1.x, start1.y, start1.z);
        d2.position.set(start2.x, start2.y, start2.z);
        d1.rotation.set(targetRot1.x, targetRot1.y, targetRot1.z);
        d2.rotation.set(targetRot2.x, targetRot2.y, targetRot2.z);

        ludoSound.playDiceClatter();
        this.isDiceRolling = false;
        onComplete?.();
      } else {
        requestAnimationFrame(rollLoop);
      }
    };

    requestAnimationFrame(rollLoop);
  }

  /**
   * Map face number 1..6 to Euler rotation angles (showing correct face up on +Y)
   */
  private getDiceEulerForValue(val: number): THREE.Euler {
    switch (val) {
      case 1:
        return new THREE.Euler(Math.PI, 0, 0); // Bottom face up
      case 2:
        return new THREE.Euler(-Math.PI / 2, 0, 0);
      case 3:
        return new THREE.Euler(0, 0, 0); // Default top face
      case 4:
        return new THREE.Euler(Math.PI / 2, 0, 0);
      case 5:
        return new THREE.Euler(0, 0, -Math.PI / 2);
      case 6:
        return new THREE.Euler(0, 0, Math.PI / 2);
      default:
        return new THREE.Euler(0, 0, 0);
    }
  }

  /**
   * Switch Camera Mode: Dynamic 3D Isometric or Top-Down Tactical View
   */
  public setCameraMode(mode: 'iso' | 'top') {
    this.cameraMode = mode;
    this.updateCameraTarget();
  }

  private updateCameraTarget() {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    if (this.cameraMode === 'iso') {
      // Adjusted for mobile horizontal landscape framing
      const camY = isMobile ? 16.5 : 14.5;
      const camZ = isMobile ? 12.0 : 10.5;
      this.targetCamPos.set(0, camY, camZ);
      this.targetCamLook.set(0, -0.4, 0);
    } else {
      // Top-Down Tactical Cam
      const camY = isMobile ? 21.0 : 19.0;
      this.targetCamPos.set(0, camY, 0.05);
      this.targetCamLook.set(0, 0, 0);
    }
  }

  private bindEvents() {
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', () => {
      this.onResize();
      setTimeout(this.onResize, 150);
      setTimeout(this.onResize, 350);
    });
  }

  private onPointerDown = (e: PointerEvent) => {
    if (!this.isInteractive) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Check Dice click
    if (this.die1Group && this.die2Group) {
      const diceHits = this.raycaster.intersectObjects([this.die1Group, this.die2Group], true);
      if (diceHits.length > 0) {
        this.onDiceClick?.();
        return;
      }
    }

    // 2. Check Token click
    for (const [tokenId, group] of this.tokensMap.entries()) {
      const hits = this.raycaster.intersectObjects(group.children, true);
      if (hits.length > 0) {
        this.onTokenSelect?.(tokenId);
        return;
      }
    }
  };

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    const aspect = w / h;

    this.camera.aspect = aspect;
    // Responsive dynamic FOV for horizontal phone view
    const isMobile = w < 1024;
    const baseFov = isMobile ? (aspect < 1.6 ? 54 : 46) : 42;
    this.camera.fov = baseFov;
    this.camera.updateProjectionMatrix();

    this.updateCameraTarget();
    this.renderer.setSize(w, h);
  };

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);

    // Smooth camera transition
    this.camera.position.lerp(this.targetCamPos, 0.08);
    const lookTarget = new THREE.Vector3();
    this.camera.getWorldDirection(lookTarget);
    lookTarget.multiplyScalar(5).add(this.camera.position);
    lookTarget.lerp(this.targetCamLook, 0.08);
    this.camera.lookAt(lookTarget);

    // Gentle floating bob for highlighted movable pawns
    const time = performance.now() * 0.004;
    this.tokenHighlights.forEach((halo) => {
      const mat = halo.material as THREE.MeshBasicMaterial;
      if (mat.opacity > 0) {
        halo.scale.setScalar(1.0 + Math.sin(time) * 0.08);
      }
    });

    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.dispose();
    if (dom.parentElement) {
      dom.parentElement.removeChild(dom);
    }
  }
}
