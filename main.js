import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { loadDefaultUIs } from './ui.js';

const viewport = document.querySelector('#viewport');
const slider = document.querySelector('#angle');
const play = document.querySelector('#play');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, .1, 250);
camera.position.set(0, 1.2, 7.2);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0xf6f6f6, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
viewport.appendChild(renderer.domElement);

const environment = new RoomEnvironment();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(environment, .04).texture;
environment.dispose();
pmrem.dispose();
scene.environmentIntensity = 1.35;

scene.add(new THREE.HemisphereLight(0xffffff, 0xcccccc, 1.8));
const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(-15, 25, 30);
scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 2);
rim.position.set(15, 5, -15);
scene.add(rim);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 3;
controls.maxDistance = 15;
controls.target.set(0, 0.4, 0);
controls.update();

const macbook = new THREE.Group();
scene.add(macbook);

const bend = { value: 0 };
let angle = 108;
let playing = false;
let phase = 0;
let transition = null;
let ready = false;

let lidPivot = null;
let screenMesh = null;

const defaultUIs = await loadDefaultUIs();
let uiTheme = 'wallpaper';

const uiCanvas = document.createElement('canvas');
uiCanvas.width = 1440;
uiCanvas.height = 900;
const uiTexture = new THREE.CanvasTexture(uiCanvas);
uiTexture.colorSpace = THREE.SRGBColorSpace;
uiTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

const defaultTextures = {};
for (const [theme, canvas] of Object.entries(defaultUIs)) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  defaultTextures[theme] = texture;
}

const uiPixel = { value: new THREE.Vector2(1 / 1440, 1 / 900) };

const screenMaterial = new THREE.MeshBasicMaterial({
  map: defaultTextures[uiTheme],
  toneMapped: false
});

// Original progressive blur and darkening shader from iphone-duo
const screenShader = `
uniform float foldAngle;
uniform vec2 uiPixel;
vec3 screenColor() {
  float progress = clamp(foldAngle / 1.570796327, 0.0, 1.0);
  float motion = smoothstep(0.0, 1.0, progress);
  float radius = 56.0 * motion;
  float effect = motion * 1.4;
  vec2 aa = max(fwidth(vUv), uiPixel * 0.5);
  vec2 dx = dFdx(vUv) / uiPixel;
  vec2 dy = dFdy(vUv) / uiPixel;
  float baseLod = log2(max(1.0, max(length(dx), length(dy))));
  vec2 coverage = smoothstep(-aa, aa, vUv) * (1.0 - smoothstep(vec2(1.0) - aa, vec2(1.0) + aa, vUv));
  vec3 color = textureLod(map, clamp(vUv, vec2(0.0), vec2(1.0)), baseLod).rgb * coverage.x * coverage.y;
  if (radius > 0.0) {
    float lod = max(baseLod, log2(max(1.0, radius)));
    vec2 footprint = max(aa, uiPixel * radius * 0.75);
    color = vec3(0.0);
    for (int y = -2; y <= 2; y++) {
      for (int x = -2; x <= 2; x++) {
        float wx = x == 0 ? 6.0 : (abs(x) == 1 ? 4.0 : 1.0);
        float wy = y == 0 ? 6.0 : (abs(y) == 1 ? 4.0 : 1.0);
        vec2 sampleUV = vUv + vec2(float(x), float(y)) * uiPixel * radius;
        vec2 cov = smoothstep(-footprint, footprint, sampleUV) * (1.0 - smoothstep(vec2(1.0) - footprint, vec2(1.0) + footprint, sampleUV));
        color += textureLod(map, clamp(sampleUV, vec2(0.0), vec2(1.0)), lod).rgb * cov.x * cov.y * wx * wy / 256.0;
      }
    }
  }
  return color * (1.0 - min(1.0, effect * 1.5));
}
`;

screenMaterial.onBeforeCompile = shader => {
  shader.uniforms.foldAngle = bend;
  shader.uniforms.uiPixel = uiPixel;
  shader.vertexShader = `varying vec2 vUv;\n${shader.vertexShader}`;
  shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
    vUv = uv;
    #include <begin_vertex>
  `);
  shader.fragmentShader = `varying vec2 vUv;\n${shader.fragmentShader}`;
  shader.fragmentShader = shader.fragmentShader.replace('#include <map_pars_fragment>', `
    #include <map_pars_fragment>
    ${screenShader}
  `).replace('#include <map_fragment>', 'diffuseColor.rgb *= screenColor();');
};
screenMaterial.customProgramCacheKey = () => 'macbook-fold-screen';

const uiInput = document.querySelector('#ui-upload');
uiInput.addEventListener('change', async () => {
  const file = uiInput.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
    const c = uiCanvas.getContext('2d');
    c.fillStyle = '#0a0a0a';
    c.fillRect(0, 0, uiCanvas.width, uiCanvas.height);
    const scale = Math.max(uiCanvas.width / img.width, uiCanvas.height / img.height);
    const width = img.width * scale, height = img.height * scale;
    c.drawImage(img, (uiCanvas.width - width) / 2, (uiCanvas.height - height) / 2, width, height);
    uiTexture.needsUpdate = true;
    screenMaterial.map = uiTexture;
    uiTheme = 'custom';
    document.querySelectorAll('[data-ui-theme]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.uiTheme === uiTheme)));
    setPlaying(false);
    transition = { from: angle, to: 108, elapsed: 0 };
  } catch {
    alert('Unable to read this image. Choose a PNG, JPG, or WebP file.');
  } finally {
    URL.revokeObjectURL(url);
    uiInput.value = '';
  }
});

function showDefaultUI() {
  const texture = defaultTextures[uiTheme];
  screenMaterial.map = texture;
  document.querySelectorAll('[data-ui-theme]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.uiTheme === uiTheme)));
}

document.querySelectorAll('[data-ui-theme]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.uiTheme === 'custom') {
    uiInput.click();
    return;
  }
  uiTheme = button.dataset.uiTheme;
  showDefaultUI();
}));

function setPlaying(value) {
  playing = value;
  document.querySelector('#pause-icon').toggleAttribute('hidden', !value);
  document.querySelector('#play-icon').toggleAttribute('hidden', value);
  play.setAttribute('aria-label', value ? 'Pause animation' : 'Play animation');
}

function setAngle(value) {
  angle = value;
  slider.value = value;
  slider.style.setProperty('--progress', `${(value / 135) * 100}%`);
  // As lid closes toward 0, bend increases to Math.PI/2, triggering blur and darkening
  bend.value = Math.max(0, (108 - value) / 108 * (Math.PI / 2));
  if (lidPivot) {
    const rad = (90 - value) * (Math.PI / 180);
    lidPivot.rotation.x = rad;
  }
}

play.addEventListener('click', () => {
  transition = null;
  if (!playing) phase = 1.2 + Math.acos(Math.max(-1, Math.min(1, 2 * angle / 108 - 1))) / Math.PI * 3.1;
  setPlaying(!playing);
});

slider.addEventListener('input', () => {
  transition = null;
  setPlaying(false);
  setAngle(Number(slider.value));
});

function resize() {
  const { width, height } = viewport.getBoundingClientRect();
  renderer.setSize(width, height);
  camera.aspect = width / height;
  const pixelsPerUnit = Math.min(width / 25, height / 17, 45);
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(height / pixelsPerUnit / 2 / 40));
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);

try {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync('./assets/models/macbook.glb');
  const root = gltf.scene;

  const macbookNode = root.getObjectByName('Macbook') || root;

  // Hinge pivot group
  lidPivot = new THREE.Group();
  lidPivot.name = 'LidPivot';
  lidPivot.position.set(0, 1.2405, 0);
  macbookNode.add(lidPivot);

  const lidNames = ['anchor', 'back_screen', 'Screen'];
  lidNames.forEach(name => {
    const mesh = macbookNode.getObjectByName(name);
    if (mesh) {
      mesh.position.y -= 1.2405;
      lidPivot.add(mesh);
    }
  });

  // Remove overlay mesh to eliminate shiny glass reflections over the screen
  const overlayMesh = macbookNode.getObjectByName('overlay');
  if (overlayMesh) {
    overlayMesh.visible = false;
  }

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
    screenMesh.material = screenMaterial;
  }

  // Optimize materials for Apple anodized aluminum finish
  macbookNode.traverse(child => {
    if (child.isMesh && child.material && child !== screenMesh) {
      child.material.roughness = 0.42;
      child.material.metalness = 0.85;
      child.material.envMapIntensity = 1.2;
      child.material.needsUpdate = true;
    }
  });

  macbook.add(root);
  showDefaultUI();
  document.querySelectorAll('button, input').forEach(element => element.disabled = false);
  ready = true;
  setAngle(108);
} catch (error) {
  alert('Unable to load the model. Refresh the page to try again.');
  console.error(error);
}

let lastTime = performance.now();
renderer.setAnimationLoop(now => {
  const delta = Math.min((now - lastTime) / 1000, .05);
  lastTime = now;
  if (ready && playing) {
    phase = (phase + delta) % 8.6;
    let value;
    if (phase < 1.2) value = 108;
    else if (phase < 4.3) value = 54 * (1 + Math.cos((phase - 1.2) / 3.1 * Math.PI));
    else if (phase < 5.5) value = 0;
    else value = 54 * (1 - Math.cos((phase - 5.5) / 3.1 * Math.PI));
    setAngle(value);
  } else if (transition) {
    transition.elapsed += delta;
    const progress = Math.min(transition.elapsed / 1.4, 1);
    const ease = progress * progress * (3 - 2 * progress);
    setAngle(THREE.MathUtils.lerp(transition.from, transition.to, ease));
    if (progress === 1) transition = null;
  }
  controls.update();
  renderer.render(scene, camera);
});
