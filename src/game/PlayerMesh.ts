import * as THREE from 'three';
import { PLAYER_HEIGHT, PLAYER_RADIUS } from './constants';
import { PlayerState, TeamInfo } from '../types/game';
import { assetManager, AssetManager, RiggedJoints } from './AssetManager';

export class PlayerMesh {
  public group: THREE.Group;
  public state: PlayerState;
  public teamInfo: TeamInfo;

  // Root body container for torso pitch & stance tilt
  private bodyRoot: THREE.Group;
  private torsoGroup: THREE.Group;
  private headMesh: THREE.Mesh;
  private hairGroup: THREE.Group;
  private numberMesh: THREE.Mesh;
  private frontNumberMesh: THREE.Mesh;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private leftCalfGroup: THREE.Group;
  private rightCalfGroup: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftForearmGroup: THREE.Group;
  private rightForearmGroup: THREE.Group;

  // Ground feedback
  private selectionRing: THREE.Mesh;
  private shadowBlob: THREE.Mesh;
  private staminaRing: THREE.Mesh;

  // Animation phase & kinetics
  private walkCycle: number = 0;
  private kickAnimTimer: number = 0;
  private tackleAnimTimer: number = 0;

  // Real 3D GLTF Model & Skeletal Animation support
  private gltfModelGroup: THREE.Group | null = null;
  private animMixer: THREE.AnimationMixer | null = null;
  private animActions: Map<string, THREE.AnimationAction> = new Map();
  private currentActionName: string = '';
  private joints: RiggedJoints | null = null;

  constructor(state: PlayerState, teamInfo: TeamInfo) {
    this.state = state;
    this.teamInfo = teamInfo;
    this.group = new THREE.Group();

    // Check & load high-fidelity .glb model if available
    this.initGLTFModel();

    // 1. Soft Ambient Occlusion Contact Shadow Blob (pinnacle grounding on concrete pitch)
    const shadowGeo = new THREE.CircleGeometry(PLAYER_RADIUS * 1.35, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x050505,
      transparent: true,
      opacity: 0.48,
      depthWrite: false
    });
    this.shadowBlob = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowBlob.rotation.x = -Math.PI / 2;
    this.shadowBlob.position.y = 0.02;
    this.group.add(this.shadowBlob);

    // 2. Selection Ring under active player
    const ringGeo = new THREE.RingGeometry(PLAYER_RADIUS * 1.15, PLAYER_RADIUS * 1.45, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e, // Bright lime green
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });
    this.selectionRing = new THREE.Mesh(ringGeo, ringMat);
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.selectionRing.position.y = 0.03;
    this.selectionRing.visible = state.isUserControlled;
    this.group.add(this.selectionRing);

    // Stamina ring
    const staminaGeo = new THREE.RingGeometry(PLAYER_RADIUS * 1.48, PLAYER_RADIUS * 1.62, 32);
    const staminaMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    this.staminaRing = new THREE.Mesh(staminaGeo, staminaMat);
    this.staminaRing.rotation.x = -Math.PI / 2;
    this.staminaRing.position.y = 0.035;
    this.staminaRing.visible = state.isUserControlled;
    this.group.add(this.staminaRing);

    // -------------------------------------------------------------
    // PBR MATERIALS: Athletic fabrics, rich skin, metallic boots
    // -------------------------------------------------------------
    const isBoss = teamInfo.isBoss === true;

    // African skin tones (warm rich brown with subtle specular sheen)
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x3d2314, // Rich natural African skin tone
      roughness: 0.68,
      metalness: 0.04
    });

    // Jersey fabric material
    const kitMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(teamInfo.primaryColor),
      roughness: isBoss ? 0.32 : 0.55,
      metalness: isBoss ? 0.3 : 0.08
    });

    // Contrasting trim / collar material
    const trimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(teamInfo.secondaryColor),
      roughness: 0.5,
      metalness: 0.1
    });

    // Shorts material
    const shortsMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(teamInfo.secondaryColor),
      roughness: 0.65,
      metalness: 0.05
    });

    // Socks material
    const socksMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(teamInfo.primaryColor),
      roughness: 0.6,
      metalness: 0.06
    });

    // Boots (Neon green for Ojuelegba, electric blue for Mitchells Plain, radiant gold for Boss)
    const bootsMat = new THREE.MeshStandardMaterial({
      color: isBoss ? 0xf59e0b : new THREE.Color(teamInfo.accentColor),
      roughness: isBoss ? 0.22 : 0.35,
      metalness: isBoss ? 0.85 : 0.3
    });

    // Sole plate material
    const soleMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.1
    });

    // White athletic wristband material (terrycloth)
    const wristbandMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.88
    });

    // Hair material (matte dark charcoal/black)
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.95
    });

    // Gold bead material for dreadlocks
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.25,
      metalness: 0.85
    });

    // -------------------------------------------------------------
    // BODY ROOT CONTAINER: For athletic crouched forward lean
    // -------------------------------------------------------------
    this.bodyRoot = new THREE.Group();
    this.group.add(this.bodyRoot);

    // -------------------------------------------------------------
    // 3. TORSO & JERSEY: Muscular V-taper chest & shoulders
    // -------------------------------------------------------------
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 1.08, 0);

    // Upper Chest: Broad muscular chest (tapered cylinder)
    const chestGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.44, 16);
    const chestMesh = new THREE.Mesh(chestGeo, kitMat);
    chestMesh.position.y = 0.15;
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    this.torsoGroup.add(chestMesh);

    // Shoulders (Deltoids): Rounded muscular caps
    const shoulderGeo = new THREE.SphereGeometry(0.095, 12, 12);
    const leftShoulder = new THREE.Mesh(shoulderGeo, kitMat);
    leftShoulder.position.set(-0.29, 0.32, 0);
    leftShoulder.castShadow = true;
    this.torsoGroup.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, kitMat);
    rightShoulder.position.set(0.29, 0.32, 0);
    rightShoulder.castShadow = true;
    this.torsoGroup.add(rightShoulder);

    // Neck: Athletic neck cylinder
    const neckGeo = new THREE.CylinderGeometry(0.085, 0.095, 0.16, 12);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.y = 0.42;
    neckMesh.castShadow = true;
    this.torsoGroup.add(neckMesh);

    // Crew Neck Collar: Contrasting collar trim ring around neck base
    const collarGeo = new THREE.TorusGeometry(0.105, 0.024, 8, 20);
    const collarMesh = new THREE.Mesh(collarGeo, trimMat);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.y = 0.36;
    this.torsoGroup.add(collarMesh);

    // Lower Waist / Abdomen: Tapered waist leading into shorts
    const waistGeo = new THREE.CylinderGeometry(0.24, 0.21, 0.24, 16);
    const waistMesh = new THREE.Mesh(waistGeo, kitMat);
    waistMesh.position.y = -0.16;
    waistMesh.castShadow = true;
    this.torsoGroup.add(waistMesh);

    // Back Jersey Decal: Curved Team Name & Squad Number (Exact match to screenshot)
    const backCanvas = document.createElement('canvas');
    backCanvas.width = 256;
    backCanvas.height = 256;
    const bCtx = backCanvas.getContext('2d')!;
    bCtx.fillStyle = 'rgba(0,0,0,0)';
    bCtx.fillRect(0, 0, 256, 256);

    // Team name arched at the top
    bCtx.fillStyle = '#ffffff';
    bCtx.font = '900 28px sans-serif';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';
    bCtx.shadowColor = 'rgba(0,0,0,0.6)';
    bCtx.shadowBlur = 4;
    const displayName = teamInfo.name.toUpperCase();
    bCtx.fillText(displayName, 128, 55);

    // Bold squad number
    bCtx.font = '900 120px sans-serif';
    bCtx.shadowBlur = 6;
    bCtx.fillText(state.number.toString(), 128, 155);

    const backTex = new THREE.CanvasTexture(backCanvas);
    const backMat = new THREE.MeshBasicMaterial({ map: backTex, transparent: true });
    this.numberMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), backMat);
    this.numberMesh.position.set(0, 0.16, -0.25);
    this.numberMesh.rotation.y = Math.PI;
    this.torsoGroup.add(this.numberMesh);

    // Front Chest Decal: Small squad number on right chest
    const frontCanvas = document.createElement('canvas');
    frontCanvas.width = 128;
    frontCanvas.height = 128;
    const fCtx = frontCanvas.getContext('2d')!;
    fCtx.fillStyle = 'rgba(0,0,0,0)';
    fCtx.fillRect(0, 0, 128, 128);
    fCtx.fillStyle = '#ffffff';
    fCtx.font = '900 64px sans-serif';
    fCtx.textAlign = 'center';
    fCtx.fillText(state.number.toString(), 64, 85);

    const frontTex = new THREE.CanvasTexture(frontCanvas);
    const frontMat = new THREE.MeshBasicMaterial({ map: frontTex, transparent: true });
    this.frontNumberMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), frontMat);
    this.frontNumberMesh.position.set(0.12, 0.22, 0.255);
    this.torsoGroup.add(this.frontNumberMesh);

    this.bodyRoot.add(this.torsoGroup);

    // -------------------------------------------------------------
    // 4. SHORTS: Athletic soccer shorts with side stripes
    // -------------------------------------------------------------
    const shortsGroup = new THREE.Group();
    shortsGroup.position.set(0, 0.74, 0);

    const shortsWaistGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.22, 16);
    const shortsWaist = new THREE.Mesh(shortsWaistGeo, shortsMat);
    shortsWaist.position.y = 0.08;
    shortsWaist.castShadow = true;
    shortsGroup.add(shortsWaist);

    // Left and right shorts leg cuffs
    const shortsLegGeo = new THREE.CylinderGeometry(0.13, 0.14, 0.22, 12);
    const leftShortLeg = new THREE.Mesh(shortsLegGeo, shortsMat);
    leftShortLeg.position.set(-0.13, -0.06, 0);
    leftShortLeg.rotation.z = 0.08;
    leftShortLeg.castShadow = true;
    shortsGroup.add(leftShortLeg);

    const rightShortLeg = new THREE.Mesh(shortsLegGeo, shortsMat);
    rightShortLeg.position.set(0.13, -0.06, 0);
    rightShortLeg.rotation.z = -0.08;
    rightShortLeg.castShadow = true;
    shortsGroup.add(rightShortLeg);

    // White/trim side stripes on shorts
    const stripeGeo = new THREE.BoxGeometry(0.02, 0.24, 0.06);
    const leftStripe = new THREE.Mesh(stripeGeo, trimMat);
    leftStripe.position.set(-0.255, 0.02, 0);
    shortsGroup.add(leftStripe);

    const rightStripe = new THREE.Mesh(stripeGeo, trimMat);
    rightStripe.position.set(0.255, 0.02, 0);
    shortsGroup.add(rightStripe);

    this.bodyRoot.add(shortsGroup);

    // -------------------------------------------------------------
    // 5. HEAD & AUTHENTIC HAIRSTYLE: Stylized chiseled African head
    // -------------------------------------------------------------
    const headGeo = new THREE.SphereGeometry(0.155, 16, 16);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.position.set(0, 1.58, 0.02);
    this.headMesh.scale.set(0.98, 1.15, 1.06); // Athletic jawline and cranial shape
    this.headMesh.castShadow = true;
    this.bodyRoot.add(this.headMesh);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.032, 8, 8);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.155, 1.58, 0.01);
    leftEar.scale.set(0.5, 1.2, 0.8);
    this.bodyRoot.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(0.155, 1.58, 0.01);
    rightEar.scale.set(0.5, 1.2, 0.8);
    this.bodyRoot.add(rightEar);

    // Hairstyle variety based on player squad number:
    this.hairGroup = new THREE.Group();
    this.hairGroup.position.set(0, 1.62, 0);

    if (state.number === 5) {
      // Player #5: Short braided dreadlocks with gold beads (as seen in screenshot!)
      const baseHair = new THREE.Mesh(new THREE.SphereGeometry(0.165, 16, 16), hairMat);
      baseHair.scale.set(1.02, 0.95, 1.04);
      this.hairGroup.add(baseHair);

      // Dreadlock braids extending back
      for (let i = 0; i < 7; i++) {
        const angle = -Math.PI / 2 + (i - 3) * 0.32;
        const dread = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.18, 6), hairMat);
        dread.position.set(Math.cos(angle) * 0.12, -0.04, -0.14 - Math.abs(i - 3) * 0.02);
        dread.rotation.x = -0.65;
        dread.rotation.z = (i - 3) * 0.15;
        dread.castShadow = true;
        this.hairGroup.add(dread);

        // Gold ring bead on braid
        const bead = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.008, 6, 10), goldMat);
        bead.position.copy(dread.position);
        bead.position.y -= 0.04;
        this.hairGroup.add(bead);
      }
    } else if (state.number === 10) {
      // Player #10: Crisp skin fade with textured curls on top
      const baseHair = new THREE.Mesh(new THREE.SphereGeometry(0.168, 16, 16), hairMat);
      baseHair.scale.set(1.02, 1.04, 1.06);
      baseHair.position.set(0, 0.01, -0.01);
      this.hairGroup.add(baseHair);
    } else {
      // Standard clean street fade cut
      const baseHair = new THREE.Mesh(new THREE.SphereGeometry(0.165, 16, 16), hairMat);
      baseHair.scale.set(1.01, 1.0, 1.05);
      baseHair.position.set(0, 0, -0.01);
      this.hairGroup.add(baseHair);
    }

    this.bodyRoot.add(this.hairGroup);

    // -------------------------------------------------------------
    // 6. ARMS & SWEATBANDS: Sculpted arms with white athletic wristbands
    // -------------------------------------------------------------
    const armBicepGeo = new THREE.CylinderGeometry(0.08, 0.072, 0.24, 12);
    const sleeveTrimGeo = new THREE.TorusGeometry(0.076, 0.014, 8, 16);
    const forearmGeo = new THREE.CylinderGeometry(0.068, 0.054, 0.25, 12);
    const wristbandGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.075, 12);
    const handGeo = new THREE.BoxGeometry(0.065, 0.08, 0.052);

    // Left Arm (Pivoted at shoulder: x = -0.31, y = 1.34)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.31, 1.34, 0);

    // Jersey-colored sleeve over bicep
    const leftSleeve = new THREE.Mesh(armBicepGeo, kitMat);
    leftSleeve.position.y = -0.12;
    leftSleeve.castShadow = true;
    this.leftArm.add(leftSleeve);

    // Contrasting sleeve cuff trim
    const leftCuff = new THREE.Mesh(sleeveTrimGeo, trimMat);
    leftCuff.rotation.x = Math.PI / 2;
    leftCuff.position.y = -0.22;
    this.leftArm.add(leftCuff);

    // Captain's Armband for #10
    if (state.number === 10) {
      const captainBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.083, 0.083, 0.07, 14),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
      );
      captainBand.position.y = -0.14;
      this.leftArm.add(captainBand);
    }

    // Left Forearm Group (Pivoted at elbow)
    this.leftForearmGroup = new THREE.Group();
    this.leftForearmGroup.position.set(0, -0.24, 0);

    const leftForearm = new THREE.Mesh(forearmGeo, skinMat);
    leftForearm.position.y = -0.12;
    leftForearm.castShadow = true;
    this.leftForearmGroup.add(leftForearm);

    // White Athletic Wristband (Seen on player #10 and #7!)
    const leftWristband = new THREE.Mesh(wristbandGeo, wristbandMat);
    leftWristband.position.y = -0.22;
    this.leftForearmGroup.add(leftWristband);

    // Cupped fist
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.y = -0.29;
    leftHand.castShadow = true;
    this.leftForearmGroup.add(leftHand);

    this.leftArm.add(this.leftForearmGroup);
    this.bodyRoot.add(this.leftArm);

    // Right Arm (Pivoted at shoulder: x = 0.31, y = 1.34)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.31, 1.34, 0);

    const rightSleeve = new THREE.Mesh(armBicepGeo, kitMat);
    rightSleeve.position.y = -0.12;
    rightSleeve.castShadow = true;
    this.rightArm.add(rightSleeve);

    const rightCuff = new THREE.Mesh(sleeveTrimGeo, trimMat);
    rightCuff.rotation.x = Math.PI / 2;
    rightCuff.position.y = -0.22;
    this.rightArm.add(rightCuff);

    // Right Forearm Group
    this.rightForearmGroup = new THREE.Group();
    this.rightForearmGroup.position.set(0, -0.24, 0);

    const rightForearm = new THREE.Mesh(forearmGeo, skinMat);
    rightForearm.position.y = -0.12;
    rightForearm.castShadow = true;
    this.rightForearmGroup.add(rightForearm);

    // Right White Athletic Wristband
    const rightWristband = new THREE.Mesh(wristbandGeo, wristbandMat);
    rightWristband.position.y = -0.22;
    this.rightForearmGroup.add(rightWristband);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.y = -0.29;
    rightHand.castShadow = true;
    this.rightForearmGroup.add(rightHand);

    this.rightArm.add(this.rightForearmGroup);
    this.bodyRoot.add(this.rightArm);

    // -------------------------------------------------------------
    // 7. LEGS & FOOTBALL BOOTS: Muscular thighs, socks, cleat studs
    // -------------------------------------------------------------
    const thighGeo = new THREE.CylinderGeometry(0.112, 0.092, 0.36, 14);
    const kneeGeo = new THREE.SphereGeometry(0.052, 10, 10);
    const calfGeo = new THREE.CylinderGeometry(0.092, 0.072, 0.38, 14);
    const sockCuffGeo = new THREE.TorusGeometry(0.095, 0.016, 8, 16);

    // Left Leg (Pivoted at hip: x = -0.17, y = 0.72)
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.17, 0.72, 0);

    const leftThigh = new THREE.Mesh(thighGeo, skinMat);
    leftThigh.position.y = -0.18;
    leftThigh.castShadow = true;
    this.leftLeg.add(leftThigh);

    // Knee joint
    const leftKnee = new THREE.Mesh(kneeGeo, skinMat);
    leftKnee.position.set(0, -0.36, 0.02);
    this.leftLeg.add(leftKnee);

    // Left Calf Group (Pivoted at knee: y = -0.36)
    this.leftCalfGroup = new THREE.Group();
    this.leftCalfGroup.position.set(0, -0.36, 0);

    const leftCalf = new THREE.Mesh(calfGeo, socksMat);
    leftCalf.position.y = -0.18;
    leftCalf.castShadow = true;
    this.leftCalfGroup.add(leftCalf);

    // Folded top sock cuff
    const leftSockCuff = new THREE.Mesh(sockCuffGeo, trimMat);
    leftSockCuff.rotation.x = Math.PI / 2;
    leftSockCuff.position.y = -0.04;
    this.leftCalfGroup.add(leftSockCuff);

    // Left Football Boot (Cleat)
    const leftBootGroup = this.createFootballBoot(bootsMat, soleMat);
    leftBootGroup.position.set(0, -0.36, 0.06);
    this.leftCalfGroup.add(leftBootGroup);

    this.leftLeg.add(this.leftCalfGroup);
    this.bodyRoot.add(this.leftLeg);

    // Right Leg (Pivoted at hip: x = 0.17, y = 0.72)
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.17, 0.72, 0);

    const rightThigh = new THREE.Mesh(thighGeo, skinMat);
    rightThigh.position.y = -0.18;
    rightThigh.castShadow = true;
    this.rightLeg.add(rightThigh);

    const rightKnee = new THREE.Mesh(kneeGeo, skinMat);
    rightKnee.position.set(0, -0.36, 0.02);
    this.rightLeg.add(rightKnee);

    // Right Calf Group
    this.rightCalfGroup = new THREE.Group();
    this.rightCalfGroup.position.set(0, -0.36, 0);

    const rightCalf = new THREE.Mesh(calfGeo, socksMat);
    rightCalf.position.y = -0.18;
    rightCalf.castShadow = true;
    this.rightCalfGroup.add(rightCalf);

    const rightSockCuff = new THREE.Mesh(sockCuffGeo, trimMat);
    rightSockCuff.rotation.x = Math.PI / 2;
    rightSockCuff.position.y = -0.04;
    this.rightCalfGroup.add(rightSockCuff);

    // Right Football Boot (Cleat)
    const rightBootGroup = this.createFootballBoot(bootsMat, soleMat);
    rightBootGroup.position.set(0, -0.36, 0.06);
    this.rightCalfGroup.add(rightBootGroup);

    this.rightLeg.add(this.rightCalfGroup);
    this.bodyRoot.add(this.rightLeg);

    // -------------------------------------------------------------
    // DEFAULT ATHLETIC READY CROUCH STANCE (Exact match to screenshot)
    // -------------------------------------------------------------
    this.setAthleticReadyStance();
    this.updateTransform();
  }

  // Load high-fidelity 3D rigged glTF model asynchronously
  private async initGLTFModel() {
    try {
      const gltf = await assetManager.loadGLTF(AssetManager.PLAYER_MODEL);
      if (gltf) {
        const loaded = assetManager.createCustomizedPlayer(gltf, this.teamInfo, this.state.number);
        this.gltfModelGroup = loaded.scene;
        this.joints = loaded.joints;
        this.animMixer = loaded.mixer || null;
        this.animActions = loaded.actions;

        // Scale and align 3D gltf character model
        this.gltfModelGroup.scale.set(0.98, 0.98, 0.98);

        // Hide procedural body mesh, show realistic 3D character model
        this.bodyRoot.visible = false;
        this.group.add(this.gltfModelGroup);

        this.applyJointsReadyStance();
        this.playAnimation('idle');
      }
    } catch (err) {
      console.warn('[PlayerMesh] Using procedural athletic character model.', err);
    }
  }

  // Set athletic ready crouch on 3D rigged character model
  private applyJointsReadyStance() {
    if (!this.joints) return;
    const j = this.joints;
    if (this.gltfModelGroup) this.gltfModelGroup.position.y = 0;

    // Center of gravity forward lean
    if (j.spine) j.spine.rotation.set(0.12, 0, 0);
    if (j.chest) j.chest.rotation.set(0.08, 0, 0);

    // Flexed knee crouch
    if (j.thighL) j.thighL.rotation.set(0.22, 0, 0.08);
    if (j.kneeL) j.kneeL.rotation.set(-0.35, 0, 0);
    if (j.ankleL) j.ankleL.rotation.set(0.12, 0, 0);

    if (j.thighR) j.thighR.rotation.set(0.22, 0, -0.08);
    if (j.kneeR) j.kneeR.rotation.set(-0.35, 0, 0);
    if (j.ankleR) j.ankleR.rotation.set(0.12, 0, 0);

    // Ready flared arms with bent elbows
    if (j.upperArmL) j.upperArmL.rotation.set(-0.15, 0, -0.32);
    if (j.elbowL) j.elbowL.rotation.set(0.38, 0, 0);
    if (j.forearmL) j.forearmL.rotation.set(0.22, 0, 0);

    if (j.upperArmR) j.upperArmR.rotation.set(-0.15, 0, 0.32);
    if (j.elbowR) j.elbowR.rotation.set(0.38, 0, 0);
    if (j.forearmR) j.forearmR.rotation.set(0.22, 0, 0);
  }

  // Running & sprinting kinematics on 3D rigged character
  private updateJointsLocomotion(speed: number, delta: number) {
    if (!this.joints) return;
    const j = this.joints;
    const isSprint = this.state.isSprinting;
    const animSpeed = isSprint ? 16 : 11;
    this.walkCycle += delta * animSpeed;
    const stride = Math.sin(this.walkCycle);
    const cosStride = Math.cos(this.walkCycle);

    if (this.gltfModelGroup) this.gltfModelGroup.position.y = Math.abs(cosStride) * 0.04;

    // Torso lean and banking
    if (j.spine) j.spine.rotation.set(isSprint ? 0.28 : 0.18, 0, cosStride * 0.07);
    if (j.chest) j.chest.rotation.set(isSprint ? 0.14 : 0.08, -stride * 0.1, 0);

    // Leg stride
    const legAmp = isSprint ? 0.95 : 0.65;
    if (j.thighL) j.thighL.rotation.set(stride * legAmp, 0, 0.04);
    if (j.kneeL) j.kneeL.rotation.set(stride > 0 ? -0.85 * legAmp : -0.15, 0, 0);

    if (j.thighR) j.thighR.rotation.set(-stride * legAmp, 0, -0.04);
    if (j.kneeR) j.kneeR.rotation.set(stride < 0 ? -0.85 * legAmp : -0.15, 0, 0);

    // Arm counter-swing
    const armAmp = isSprint ? 0.85 : 0.55;
    if (j.upperArmL) j.upperArmL.rotation.set(-stride * armAmp, 0, -0.25);
    if (j.elbowL) j.elbowL.rotation.set(0.45, 0, 0);

    if (j.upperArmR) j.upperArmR.rotation.set(stride * armAmp, 0, 0.25);
    if (j.elbowR) j.elbowR.rotation.set(0.45, 0, 0);
  }

  // Dynamic strike kick kinematics on 3D rigged character
  private updateJointsKick(kickPhase: number) {
    if (!this.joints) return;
    const j = this.joints;

    if (j.spine) j.spine.rotation.set(-0.2, 0, 0.1);
    if (j.chest) j.chest.rotation.set(-0.15, 0, 0);

    // Right leg strike whip
    if (j.thighR) j.thighR.rotation.set(-kickPhase * 1.35, 0, 0);
    if (j.kneeR) j.kneeR.rotation.set(kickPhase > 0 ? 0.45 : -0.75, 0, 0);

    // Plant left leg
    if (j.thighL) j.thighL.rotation.set(0.28, 0, 0.12);
    if (j.kneeL) j.kneeL.rotation.set(-0.35, 0, 0);

    // Arm counterbalance
    if (j.upperArmL) j.upperArmL.rotation.set(0.8, 0, -0.35);
    if (j.upperArmR) j.upperArmR.rotation.set(-0.8, 0, 0.35);
  }

  // Low slide tackle kinematics on 3D rigged character
  private updateJointsTackle() {
    if (!this.joints) return;
    const j = this.joints;

    if (this.gltfModelGroup) this.gltfModelGroup.position.y = -0.32;

    if (j.spine) j.spine.rotation.set(0.65, 0, -0.3);
    if (j.thighR) j.thighR.rotation.set(-1.35, 0, 0.2);
    if (j.kneeR) j.kneeR.rotation.set(0.1, 0, 0);

    if (j.thighL) j.thighL.rotation.set(0.85, 0, -0.2);
    if (j.kneeL) j.kneeL.rotation.set(-1.1, 0, 0);

    if (j.upperArmL) j.upperArmL.rotation.set(-0.5, 0, -0.6);
    if (j.upperArmR) j.upperArmR.rotation.set(0.4, 0, 0.6);
  }

  // Smoothly blend skeletal animations when using 3D rigged models
  private playAnimation(name: string) {
    if (!this.animMixer || this.animActions.size === 0) return;
    const lowerName = name.toLowerCase();
    let targetAction = this.animActions.get(lowerName);

    // Flexible fallback matches (e.g. "run" -> "running", "jog")
    if (!targetAction) {
      for (const [key, act] of this.animActions.entries()) {
        if (key.includes(lowerName)) {
          targetAction = act;
          break;
        }
      }
    }

    if (targetAction && this.currentActionName !== name) {
      const prevAction = this.animActions.get(this.currentActionName);
      if (prevAction) {
        prevAction.fadeOut(0.2);
      }
      targetAction.reset().fadeIn(0.2).play();
      this.currentActionName = name;
    }
  }

  // Streamlined 3D Football Boot with sole plate and studs
  private createFootballBoot(upperMat: THREE.Material, soleMat: THREE.Material): THREE.Group {
    const bootGroup = new THREE.Group();

    // Upper Boot Body: Streamlined aerodynamic contour
    const upperGeo = new THREE.BoxGeometry(0.12, 0.09, 0.25);
    const upperMesh = new THREE.Mesh(upperGeo, upperMat);
    upperMesh.position.set(0, 0.02, 0);
    upperMesh.scale.set(0.95, 1.0, 1.1);
    upperMesh.castShadow = true;
    bootGroup.add(upperMesh);

    // Toe wedge taper
    const toeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 10);
    const toeMesh = new THREE.Mesh(toeGeo, upperMat);
    toeMesh.rotation.z = Math.PI / 2;
    toeMesh.position.set(0, 0.01, 0.12);
    toeMesh.scale.set(0.7, 0.9, 0.85);
    toeMesh.castShadow = true;
    bootGroup.add(toeMesh);

    // Black Rubber / Carbon Traction Sole Plate
    const soleGeo = new THREE.BoxGeometry(0.125, 0.022, 0.28);
    const soleMesh = new THREE.Mesh(soleGeo, soleMat);
    soleMesh.position.set(0, -0.03, 0.02);
    bootGroup.add(soleMesh);

    // Cleat Traction Studs (4 small studs underneath)
    const studGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.025, 8);
    const studOffsets = [
      [-0.038, 0.10], [0.038, 0.10],
      [-0.038, -0.07], [0.038, -0.07]
    ];
    studOffsets.forEach(([sx, sz]) => {
      const stud = new THREE.Mesh(studGeo, soleMat);
      stud.position.set(sx, -0.045, sz);
      bootGroup.add(stud);
    });

    return bootGroup;
  }

  // Intense Street Football Ready Stance: Knees bent, torso forward, arms flared
  private setAthleticReadyStance() {
    // Forward center-of-gravity pitch
    this.bodyRoot.rotation.x = 0.14; // ~8° forward lean

    // Wide athletic foot base
    this.leftLeg.rotation.z = 0.14;
    this.rightLeg.rotation.z = -0.14;

    // Flexed knees (crouch)
    this.leftLeg.rotation.x = 0.22;
    this.rightLeg.rotation.x = 0.22;
    this.leftCalfGroup.rotation.x = -0.26;
    this.rightCalfGroup.rotation.x = -0.26;

    // Ready flared arms with elbows bent
    this.leftArm.rotation.z = -0.32;
    this.leftArm.rotation.x = -0.12;
    this.leftForearmGroup.rotation.x = -0.42;

    this.rightArm.rotation.z = 0.32;
    this.rightArm.rotation.x = -0.12;
    this.rightForearmGroup.rotation.x = -0.42;
  }

  public update(delta: number) {
    this.updateTransform();

    const speed = Math.hypot(this.state.velocity.x, this.state.velocity.z);

    // Update skeletal animation mixer if loaded .glb model is active
    if (this.animMixer) {
      this.animMixer.update(delta);

      if (this.state.isKicking) {
        this.playAnimation('kick');
      } else if (this.state.isTackling) {
        this.playAnimation('tackle');
      } else if (speed > 0.25) {
        this.playAnimation(this.state.isSprinting ? 'sprint' : 'run');
      } else {
        this.playAnimation('idle');
      }
    }

    // Rigged Joints Kinematics (for uploaded 3D character)
    if (this.joints) {
      if (this.state.isKicking) {
        this.kickAnimTimer += delta * 15;
        const kickPhase = Math.sin(this.kickAnimTimer);
        this.updateJointsKick(kickPhase);
        if (this.kickAnimTimer > Math.PI) {
          this.state.isKicking = false;
          this.kickAnimTimer = 0;
          this.applyJointsReadyStance();
        }
      } else if (this.state.isTackling) {
        this.tackleAnimTimer += delta * 6;
        this.updateJointsTackle();
        if (this.tackleAnimTimer > 1) {
          this.state.isTackling = false;
          this.tackleAnimTimer = 0;
          this.applyJointsReadyStance();
        }
      } else if (speed > 0.25) {
        this.updateJointsLocomotion(speed, delta);
      } else {
        this.applyJointsReadyStance();
      }
    } else {
      // Procedural athletic kinetics fallback
      if (this.state.isKicking) {
        // Dynamic kicking animation: kinetic whip through the ball
        this.kickAnimTimer += delta * 15;
        const kickPhase = Math.sin(this.kickAnimTimer);

        this.bodyRoot.rotation.x = -0.15; // Lean back into the shot
        this.rightLeg.rotation.x = -kickPhase * 1.35;
        this.rightCalfGroup.rotation.x = kickPhase > 0 ? 0.35 : -0.7;

        // Left plant leg anchors firmly
        this.leftLeg.rotation.x = 0.25;
        this.leftCalfGroup.rotation.x = -0.25;

        // Arm counterbalance
        this.leftArm.rotation.x = 0.75;
        this.rightArm.rotation.x = -0.75;

        if (this.kickAnimTimer > Math.PI) {
          this.state.isKicking = false;
          this.kickAnimTimer = 0;
          this.setAthleticReadyStance();
        }
      } else if (this.state.isTackling) {
        // Low sliding tackle along the concrete pitch
        this.tackleAnimTimer += delta * 6;
        this.group.position.y = -0.36;
        this.bodyRoot.rotation.x = 0.72;
        this.bodyRoot.rotation.z = -0.35;

        // Right leg fully outstretched to hook the ball
        this.rightLeg.rotation.x = -1.35;
        this.rightCalfGroup.rotation.x = 0.05;

        // Left leg tucked beneath
        this.leftLeg.rotation.x = 0.85;
        this.leftCalfGroup.rotation.x = -1.1;

        if (this.tackleAnimTimer > 1) {
          this.state.isTackling = false;
          this.tackleAnimTimer = 0;
          this.group.position.y = 0;
          this.bodyRoot.rotation.z = 0;
          this.setAthleticReadyStance();
        }
      } else {
        this.group.position.y = 0;

        if (speed > 0.25) {
          // High-energy athletic running / sprinting locomotion
          const animSpeed = this.state.isSprinting ? 16 : 11;
          this.walkCycle += delta * animSpeed;
          const stride = Math.sin(this.walkCycle);
          const cosStride = Math.cos(this.walkCycle);
          const isSprint = this.state.isSprinting;

          // Torso forward sprint lean
          this.bodyRoot.rotation.x = isSprint ? 0.28 : 0.18;
          this.bodyRoot.rotation.z = cosStride * 0.07; // Natural lateral banking

          // Alternating leg stride with knee drive
          const legAmp = isSprint ? 0.95 : 0.65;
          this.leftLeg.rotation.x = stride * legAmp;
          this.rightLeg.rotation.x = -stride * legAmp;

          // Calf knee flexion on recovery swing
          this.leftCalfGroup.rotation.x = stride > 0 ? -0.75 * legAmp : -0.15;
          this.rightCalfGroup.rotation.x = stride < 0 ? -0.75 * legAmp : -0.15;

          // Natural arm counter-swing with elbows bent
          const armAmp = isSprint ? 0.85 : 0.55;
          this.leftArm.rotation.x = -stride * armAmp;
          this.rightArm.rotation.x = stride * armAmp;
          this.leftForearmGroup.rotation.x = -0.55;
          this.rightForearmGroup.rotation.x = -0.55;

        } else {
          // Return to athletic crouch ready stance
          this.setAthleticReadyStance();
        }
      }
    }

    // Update selection indicators
    this.selectionRing.visible = this.state.isUserControlled;
    this.staminaRing.visible = this.state.isUserControlled;

    if (this.state.isUserControlled) {
      const staminaScale = Math.max(0.1, this.state.stamina / 100);
      this.staminaRing.scale.set(staminaScale, staminaScale, 1);
      const mat = this.staminaRing.material as THREE.MeshBasicMaterial;
      if (this.state.stamina < 30) {
        mat.color.setHex(0xef4444);
      } else {
        mat.color.setHex(0xf59e0b);
      }
    }
  }

  public updateTransform() {
    this.group.position.x = this.state.position.x;
    this.group.position.z = this.state.position.z;
    this.group.rotation.y = this.state.rotation;
  }

  public triggerKick() {
    this.state.isKicking = true;
    this.kickAnimTimer = 0;
  }

  public triggerTackle() {
    this.state.isTackling = true;
    this.tackleAnimTimer = 0;
  }

  public setUserControlled(controlled: boolean) {
    this.state.isUserControlled = controlled;
    this.selectionRing.visible = controlled;
    this.staminaRing.visible = controlled;
  }
}
