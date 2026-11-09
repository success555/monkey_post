import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TeamInfo } from '../types/game';

export interface RiggedJoints {
  root?: THREE.Object3D;
  hips?: THREE.Object3D;
  spine?: THREE.Object3D;
  chest?: THREE.Object3D;
  neck?: THREE.Object3D;
  head?: THREE.Object3D;
  hair?: THREE.Object3D;
  shoulderL?: THREE.Object3D;
  upperArmL?: THREE.Object3D;
  elbowL?: THREE.Object3D;
  forearmL?: THREE.Object3D;
  handL?: THREE.Object3D;
  shoulderR?: THREE.Object3D;
  upperArmR?: THREE.Object3D;
  elbowR?: THREE.Object3D;
  forearmR?: THREE.Object3D;
  handR?: THREE.Object3D;
  hipL?: THREE.Object3D;
  thighL?: THREE.Object3D;
  kneeL?: THREE.Object3D;
  shinL?: THREE.Object3D;
  ankleL?: THREE.Object3D;
  footL?: THREE.Object3D;
  hipR?: THREE.Object3D;
  thighR?: THREE.Object3D;
  kneeR?: THREE.Object3D;
  shinR?: THREE.Object3D;
  ankleR?: THREE.Object3D;
  footR?: THREE.Object3D;
}

export interface LoadedPlayerAsset {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  mixer?: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  joints: RiggedJoints;
}

export class AssetManager {
  private static instance: AssetManager;
  private loader: GLTFLoader;
  private modelCache: Map<string, GLTF> = new Map();
  private loadingPromises: Map<string, Promise<GLTF | null>> = new Map();

  // Model file paths in public/models/
  public static readonly PLAYER_MODEL = '/models/player.glb';
  public static readonly REAL_STREET_PITCH = '/textures/street_pitch_real.jpg';

  private constructor() {
    this.loader = new GLTFLoader();
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Load any .glb or .gltf model asynchronously with caching
   */
  public async loadGLTF(url: string): Promise<GLTF | null> {
    if (this.modelCache.has(url)) {
      return this.modelCache.get(url)!;
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const loadPromise = new Promise<GLTF | null>((resolve) => {
      this.loader.load(
        url,
        (gltf) => {
          this.modelCache.set(url, gltf);
          resolve(gltf);
        },
        undefined,
        (error) => {
          console.warn(`[AssetManager] Model not found or failed to load from ${url}. Using procedural fallback.`, error);
          resolve(null);
        }
      );
    });

    this.loadingPromises.set(url, loadPromise);
    return loadPromise;
  }

  /**
   * Customize the Rigged_Footballer_Smooth_V2 model with team kit colors & joint map
   */
  public createCustomizedPlayer(
    baseGLTF: GLTF,
    teamInfo: TeamInfo,
    number: number
  ): LoadedPlayerAsset {
    const clonedScene = baseGLTF.scene.clone(true) as THREE.Group;
    const isBoss = teamInfo.isBoss === true;

    // Team color palette
    const primaryColor = new THREE.Color(teamInfo.primaryColor);
    const secondaryColor = new THREE.Color(teamInfo.secondaryColor);
    const accentColor = new THREE.Color(teamInfo.accentColor);
    const skinColor = new THREE.Color(0x3d2314); // Rich African skin tone
    const hairColor = new THREE.Color(0x09090b); // Dark hair

    // Pre-create shared materials for performance
    const jerseyMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: isBoss ? 0.35 : 0.58,
      metalness: isBoss ? 0.35 : 0.08
    });

    const shortsMat = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      roughness: 0.68,
      metalness: 0.05
    });

    const socksMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.62
    });

    const bootsMat = new THREE.MeshStandardMaterial({
      color: isBoss ? new THREE.Color(0xf59e0b) : accentColor,
      roughness: isBoss ? 0.22 : 0.35,
      metalness: isBoss ? 0.85 : 0.3
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.72,
      metalness: 0.04
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.95
    });

    const joints: RiggedJoints = {};

    // Traverse and bind joints and materials
    clonedScene.traverse((child) => {
      const name = child.name;

      // Map named joints from user's Rigged_Footballer_Smooth_V2.glb
      switch (name) {
        case 'Root': joints.root = child; break;
        case 'Hips': joints.hips = child; break;
        case 'Spine': joints.spine = child; break;
        case 'Chest': joints.chest = child; break;
        case 'Neck': joints.neck = child; break;
        case 'Head': joints.head = child; break;
        case 'Hair': joints.hair = child; break;
        case 'Shoulder_L': joints.shoulderL = child; break;
        case 'UpperArm_L': joints.upperArmL = child; break;
        case 'Elbow_L': joints.elbowL = child; break;
        case 'Forearm_L': joints.forearmL = child; break;
        case 'Hand_L': joints.handL = child; break;
        case 'Shoulder_R': joints.shoulderR = child; break;
        case 'UpperArm_R': joints.upperArmR = child; break;
        case 'Elbow_R': joints.elbowR = child; break;
        case 'Forearm_R': joints.forearmR = child; break;
        case 'Hand_R': joints.handR = child; break;
        case 'Hip_L': joints.hipL = child; break;
        case 'Thigh_L': joints.thighL = child; break;
        case 'Knee_L': joints.kneeL = child; break;
        case 'Shin_L': joints.shinL = child; break;
        case 'Ankle_L': joints.ankleL = child; break;
        case 'Foot_L': joints.footL = child; break;
        case 'Hip_R': joints.hipR = child; break;
        case 'Thigh_R': joints.thighR = child; break;
        case 'Knee_R': joints.kneeR = child; break;
        case 'Shin_R': joints.shinR = child; break;
        case 'Ankle_R': joints.ankleR = child; break;
        case 'Foot_R': joints.footR = child; break;
        case 'Ball':
          // Hide standalone ball attached to model root
          child.visible = false;
          break;
      }

      // Assign materials based on node identity
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (['Chest', 'Spine', 'Shoulder_L', 'Shoulder_R', 'UpperArm_L', 'UpperArm_R'].includes(name)) {
          child.material = jerseyMat;
        } else if (['Hips', 'Hip_L', 'Hip_R'].includes(name)) {
          child.material = shortsMat;
        } else if (['Shin_L', 'Shin_R', 'Ankle_L', 'Ankle_R'].includes(name)) {
          child.material = socksMat;
        } else if (['Foot_L', 'Foot_R'].includes(name)) {
          child.material = bootsMat;
        } else if (['Hair'].includes(name)) {
          child.material = hairMat;
        } else if (['Head', 'Neck', 'Forearm_L', 'Forearm_R', 'Hand_L', 'Hand_R', 'Thigh_L', 'Thigh_R', 'Elbow_L', 'Elbow_R', 'Knee_L', 'Knee_R'].includes(name)) {
          child.material = skinMat;
        } else {
          // Fallback matching
          const lower = name.toLowerCase();
          if (lower.includes('chest') || lower.includes('jersey') || lower.includes('shirt')) {
            child.material = jerseyMat;
          } else if (lower.includes('short') || lower.includes('hip')) {
            child.material = shortsMat;
          } else if (lower.includes('boot') || lower.includes('foot') || lower.includes('shoe')) {
            child.material = bootsMat;
          } else {
            child.material = skinMat;
          }
        }
      }
    });

    // Add 2D squad number to chest / back of model
    const numCanvas = document.createElement('canvas');
    numCanvas.width = 128;
    numCanvas.height = 128;
    const nCtx = numCanvas.getContext('2d')!;
    nCtx.fillStyle = 'rgba(0,0,0,0)';
    nCtx.fillRect(0, 0, 128, 128);
    nCtx.fillStyle = '#ffffff';
    nCtx.font = '900 80px sans-serif';
    nCtx.textAlign = 'center';
    nCtx.textBaseline = 'middle';
    nCtx.fillText(number.toString(), 64, 64);

    const numTex = new THREE.CanvasTexture(numCanvas);
    const numMat = new THREE.MeshBasicMaterial({ map: numTex, transparent: true });

    // Back number decal attached to Chest
    const backNum = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), numMat);
    backNum.position.set(0, 0.05, -0.16);
    backNum.rotation.y = Math.PI;
    if (joints.chest) {
      joints.chest.add(backNum);
    } else {
      clonedScene.add(backNum);
    }

    const actions = new Map<string, THREE.AnimationAction>();
    let mixer: THREE.AnimationMixer | undefined;

    if (baseGLTF.animations && baseGLTF.animations.length > 0) {
      mixer = new THREE.AnimationMixer(clonedScene);
      baseGLTF.animations.forEach((clip) => {
        const action = mixer!.clipAction(clip);
        actions.set(clip.name.toLowerCase(), action);
      });
    }

    return {
      scene: clonedScene,
      animations: baseGLTF.animations,
      mixer,
      actions,
      joints
    };
  }

  /**
   * Allows the user to load a custom .glb file dynamically
   */
  public async loadCustomModelFromFile(file: File): Promise<GLTF | null> {
    const url = URL.createObjectURL(file);
    const gltf = await this.loadGLTF(url);
    if (gltf) {
      this.modelCache.set(AssetManager.PLAYER_MODEL, gltf);
    }
    return gltf;
  }
}

export const assetManager = AssetManager.getInstance();
