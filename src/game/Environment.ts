import * as THREE from 'three';

export class Environment {
  public group: THREE.Group;
  private dustParticles: THREE.Points | null = null;
  private sunLight: THREE.DirectionalLight;

  constructor() {
    this.group = new THREE.Group();
    this.sunLight = this.setupLights();
    this.setupSky();
    this.setupDustParticles();
  }

  private setupLights(): THREE.DirectionalLight {
    // Warm tropical daylight ambient fill
    const ambientLight = new THREE.AmbientLight(0xfffaee, 0.75);
    this.group.add(ambientLight);

    // Primary direct Lagos sunlight (angled at 55° for dramatic athletic shadows)
    const sun = new THREE.DirectionalLight(0xfff8eb, 2.1);
    sun.position.set(18, 28, 16);
    sun.castShadow = true;

    // High-resolution shadow map with tight frustum for crisp player & post shadows
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 5;
    sun.shadow.camera.far = 75;
    sun.shadow.camera.left = -24;
    sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 1.8;

    this.group.add(sun);

    // Sky and ground bounce light (Sky blue + warm sandy concrete ground reflection)
    const hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x82705e, 0.95);
    hemiLight.position.set(0, 30, 0);
    this.group.add(hemiLight);

    // Subtle opposite rim-light to catch player shoulders and hair edges
    const rimLight = new THREE.DirectionalLight(0xbae6fd, 0.45);
    rimLight.position.set(-18, 16, -14);
    this.group.add(rimLight);

    return sun;
  }

  // Realistic bright Lagos afternoon sunny sky
  private setupSky() {
    const skyGeo = new THREE.SphereGeometry(75, 24, 24);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Bright blue tropical sky with soft warm horizon haze
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#0284c7'); // Rich blue upper sky
    grad.addColorStop(0.55, '#38bdf8'); // Sky blue
    grad.addColorStop(0.85, '#bae6fd'); // Pale sky horizon
    grad.addColorStop(1, '#fed7aa'); // Warm sun-drenched haze
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const skyTex = new THREE.CanvasTexture(canvas);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      depthWrite: false
    });

    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.group.add(skyMesh);
  }

  // Floating dust particles over the pitch
  private setupDustParticles() {
    const count = 100;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 1] = Math.random() * 4 + 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 22;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.1,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });

    this.dustParticles = new THREE.Points(geo, mat);
    this.group.add(this.dustParticles);
  }

  public update(delta: number) {
    if (this.dustParticles) {
      const positions = this.dustParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] -= delta * 0.12;
        if (positions[i * 3 + 1] < 0.1) {
          positions[i * 3 + 1] = 4;
        }
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }
  }
}
