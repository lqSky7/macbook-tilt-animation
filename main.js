import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MacOSScreen, WALLPAPERS } from './ui.js';

// DOM elements
const viewport = document.querySelector('#viewport');
const slider = document.querySelector('#angle');
const angleVal = document.querySelector('#angle-val');
const play = document.querySelector('#play');
const pauseIcon = document.querySelector('#pause-icon');
const playIcon = document.querySelector('#play-icon');
const uiInput = document.querySelector('#ui-upload');
const themeButtons = document.querySelectorAll('[data-wallpaper]');
const customButton = document.querySelector('[data-ui-custom]');
const resetCamBtn = document.querySelector('#reset-camera');

// Three.js Scene & Camera setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
const DEFAULT_CAM_POS = new THREE.Vector3(0, 1.8, 5.0);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 0.45, 0);
camera.position.copy(DEFAULT_CAM_POS);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
viewport.appendChild(renderer.domElement);

// HDRI Environment reflection
const environment = new RoomEnvironment();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(environment, 0.04).texture;
environment.dispose();
pmrem.dispose();
scene.environmentIntensity = 1.25;

// Subtle soft lighting
scene.add(new THREE.HemisphereLight(0xffffff, 0x475569, 1.5));

const keyLight = new THREE.DirectionalLight(0xfffdfa, 2.5);
keyLight.position.set(-6, 8, 8);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.4);
rimLight.position.set(6, 4, -6);
scene.add(rimLight);

const bottomLight = new THREE.DirectionalLight(0xffffff, 0.6);
bottomLight.position.set(0, -4, 4);
scene.add(bottomLight);

// Shadow plane under the MacBook
const shadowGeo = new THREE.PlaneGeometry(8, 8);
const shadowMat = new THREE.ShadowMaterial({ opacity: 0.25 });
const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.15;
scene.add(shadowPlane);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.minDistance = 2.4;
controls.maxDistance = 8.5;
controls.maxPolarAngle = Math.PI / 2 + 0.02; // Prevent camera going below desk
controls.target.copy(DEFAULT_CAM_TARGET);
controls.update();

// State variables
let angle = 108; // Default comfortable MacBook angle
let playing = false;
let animPhase = 0;
let transition = null;
let ready = false;

// 2D macOS Desktop Canvas & Texture
const desktopCanvas = document.createElement('canvas');
const macScreen = new MacOSScreen(desktopCanvas);
const screenTexture = new THREE.CanvasTexture(desktopCanvas);
screenTexture.colorSpace = THREE.SRGBColorSpace;
screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
screenTexture.minFilter = THREE.LinearMipmapLinearFilter;
screenTexture.magFilter = THREE.LinearFilter;
screenTexture.generateMipmaps = true;

// Model references
let macbookGroup = new THREE.Group();
scene.add(macbookGroup);
let lidPivot = null;
let screenMesh = null;

// Convert lid angle in degrees (0 = closed, 90 = upright, 135 = wide) to lidPivot.rotation.x
function applyLidAngle(deg) {
  angle = deg;
  if (slider) {
    slider.value = deg;
    slider.style.setProperty('--progress', `${(deg / 135) * 100}%`);
  }
  if (angleVal) {
    angleVal.textContent = `${Math.round(deg)}°`;
  }

  if (lidPivot) {
    // 90 deg = upright (rotation 0)
    // 0 deg = closed (rotation +90 deg = +Math.PI / 2)
    // 108 deg = open (rotation -18 deg)
    const rad = (90 - deg) * (Math.PI / 180);
    lidPivot.rotation.x = rad;
  }

  // Realistic sleep / wake screen backlight effect
  if (screenMesh && screenMesh.material) {
    if (deg <= 4) {
      screenMesh.material.emissiveIntensity = 0.0;
    } else {
      const backlight = Math.min(1.0, (deg - 4) / 12);
      screenMesh.material.emissiveIntensity = 0.85 * backlight;
    }
  }
}

function setPlaying(val) {
  playing = val;
  if (pauseIcon) pauseIcon.toggleAttribute('hidden', !val);
  if (playIcon) playIcon.toggleAttribute('hidden', val);
  if (play) play.setAttribute('aria-label', val ? 'Pause fold animation' : 'Play fold animation');
}

// Load default wallpaper
await macScreen.setWallpaperById('apple-park');
screenTexture.needsUpdate = true;

// Load 3D MacBook Model
try {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync('./assets/models/macbook.glb');
  const root = gltf.scene;

  // Find the 'Macbook' node
  const macbookNode = root.getObjectByName('Macbook') || root;

  // Create the lid pivot at the exact hinge coordinates in Macbook space
  lidPivot = new THREE.Group();
  lidPivot.name = 'LidPivot';
  lidPivot.position.set(0, 1.2405, 0); // Hinge line along Y=1.2405, Z=0
  macbookNode.add(lidPivot);

  // Group lid parts to the pivot
  const lidNames = ['anchor', 'back_screen', 'overlay', 'Screen'];
  lidNames.forEach(name => {
    const mesh = macbookNode.getObjectByName(name);
    if (mesh) {
      mesh.position.y -= 1.2405;
      lidPivot.add(mesh);
    }
  });

  // Remap Screen UVs for Retina display mapping
  screenMesh = macbookNode.getObjectByName('Screen');
  if (screenMesh && screenMesh.geometry) {
    const geom = screenMesh.geometry;
    const pos = geom.attributes.position;
    const minX = -1.7685, maxX = 1.7685;
    const minZ = 0.1422, maxZ = 2.3830;
    const uvs = new Float32Array(pos.count * 2);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      uvs[i * 2] = (x - minX) / (maxX - minX);
      uvs[i * 2 + 1] = (z - minZ) / (maxZ - minZ);
    }
    geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    // Custom Screen Material showing macOS UI
    screenMesh.material = new THREE.MeshStandardMaterial({
      color: 0x050505,
      map: screenTexture,
      emissive: 0xffffff,
      emissiveMap: screenTexture,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.05,
      toneMapped: false,
    });
  }

  // Adjust glass overlay over screen
  const overlayMesh = macbookNode.getObjectByName('overlay');
  if (overlayMesh && overlayMesh.material) {
    overlayMesh.material.transparent = true;
    overlayMesh.material.opacity = 0.2;
    overlayMesh.material.roughness = 0.02;
    overlayMesh.material.metalness = 0.1;
  }

  // Fine-tune aluminum body finish
  const bodyMesh = macbookNode.getObjectByName('body');
  if (bodyMesh && bodyMesh.material) {
    bodyMesh.material.metalness = 0.7;
    bodyMesh.material.roughness = 0.38;
  }

  // Center the MacBook model in the world scene
  root.position.set(0, 0, 0);
  macbookGroup.add(root);

  // Set initial angle
  applyLidAngle(108);
  ready = true;

  // Enable controls
  document.querySelectorAll('button, input').forEach(el => el.disabled = false);
} catch (err) {
  console.error('Error loading MacBook model:', err);
  const errBox = document.createElement('div');
  errBox.className = 'error-banner';
  errBox.textContent = 'Unable to load the 3D model. Please refresh the page.';
  document.body.appendChild(errBox);
}

// UI Event Listeners
play.addEventListener('click', () => {
  transition = null;
  if (!playing) {
    // Smoothly synchronize animation phase from current angle
    animPhase = Math.acos(Math.max(-1, Math.min(1, 2 * (angle / 135) - 1)));
  }
  setPlaying(!playing);
});

slider.addEventListener('input', () => {
  transition = null;
  setPlaying(false);
  applyLidAngle(Number(slider.value));
});

// Wallpaper tab selection
themeButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const wpId = btn.dataset.wallpaper;
    themeButtons.forEach(b => b.setAttribute('aria-selected', 'false'));
    btn.setAttribute('aria-selected', 'true');
    if (customButton) customButton.setAttribute('aria-selected', 'false');

    await macScreen.setWallpaperById(wpId);
    screenTexture.needsUpdate = true;
  });
});

// Custom wallpaper upload
if (customButton) {
  customButton.addEventListener('click', () => {
    uiInput.click();
  });
}

uiInput.addEventListener('change', () => {
  const file = uiInput.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  img.onload = () => {
    macScreen.setCustomImage(img);
    screenTexture.needsUpdate = true;
    themeButtons.forEach(b => b.setAttribute('aria-selected', 'false'));
    if (customButton) customButton.setAttribute('aria-selected', 'true');
    URL.revokeObjectURL(url);
    uiInput.value = '';
  };
  img.onerror = () => {
    alert('Could not read this image. Please upload a valid PNG, JPG, or WebP.');
    URL.revokeObjectURL(url);
    uiInput.value = '';
  };
});

// Reset Camera Button
if (resetCamBtn) {
  resetCamBtn.addEventListener('click', () => {
    controls.reset();
    camera.position.copy(DEFAULT_CAM_POS);
    controls.target.copy(DEFAULT_CAM_TARGET);
    controls.update();
  });
}

// Keyboard shortcuts for accessibility & power users
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') {
    e.preventDefault();
    play.click();
  } else if (e.code === 'ArrowRight' || e.code === 'ArrowUp') {
    e.preventDefault();
    setPlaying(false);
    applyLidAngle(Math.min(135, angle + 2));
  } else if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') {
    e.preventDefault();
    setPlaying(false);
    applyLidAngle(Math.max(0, angle - 2));
  } else if (e.key === 'r' || e.key === 'R') {
    if (resetCamBtn) resetCamBtn.click();
  }
});

// Window resize handling
function resize() {
  const { width, height } = viewport.getBoundingClientRect();
  renderer.setSize(width, height);
  camera.aspect = width / height;
  // Dynamic FOV for responsive laptop framing across mobile and desktop
  if (width < 640) {
    camera.fov = 46;
  } else if (width < 1024) {
    camera.fov = 38;
  } else {
    camera.fov = 34;
  }
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);
resize();

// Animation Loop
let lastTime = performance.now();
renderer.setAnimationLoop(now => {
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (ready && playing) {
    animPhase = (animPhase + delta * 1.6) % (Math.PI * 2);
    // Smooth sinusoidal motion from 0° (closed) to 135° (open)
    const targetDeg = 67.5 * (1 - Math.cos(animPhase));
    applyLidAngle(targetDeg);
  } else if (transition) {
    transition.elapsed += delta;
    const progress = Math.min(transition.elapsed / 0.8, 1);
    const ease = progress * progress * (3 - 2 * progress);
    applyLidAngle(THREE.MathUtils.lerp(transition.from, transition.to, ease));
    if (progress === 1) transition = null;
  }

  controls.update();
  renderer.render(scene, camera);
});
