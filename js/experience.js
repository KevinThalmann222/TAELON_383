const audio = document.querySelector("#low-low-audio");
const playButtons = [...document.querySelectorAll("[data-audio-play]")];
const toggleButton = document.querySelector("#audio-toggle");
const stopButton = document.querySelector("#audio-stop");
const progressBar = document.querySelector("#audio-progress");
const timeLabel = document.querySelector("#audio-time");
const audioStatus = document.querySelector("#audio-status");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let audioContext;
let analyser;
let audioSource;
let frequencyData;
let renderWorld;

function formatTime(value) {
  const seconds = Math.max(0, Math.floor(value || 0));
  return `00:${String(seconds).padStart(2, "0")}`;
}

function syncAudioControls() {
  if (!audio) return;
  const playing = !audio.paused && !audio.ended;
  const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 30;
  toggleButton?.setAttribute("aria-pressed", String(playing));
  toggleButton?.setAttribute("aria-label", playing ? "LOW LOW pausieren" : "LOW LOW abspielen");
  const glyph = toggleButton?.querySelector(".play-glyph");
  if (glyph) glyph.textContent = playing ? "Ⅱ" : "▶";
  if (progressBar) {
    progressBar.max = duration;
    progressBar.value = current;
    progressBar.setAttribute("aria-valuetext", `${formatTime(current)} von ${formatTime(duration)}`);
  }
  if (timeLabel) timeLabel.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  for (const button of playButtons) {
    button.setAttribute("aria-pressed", String(playing));
    const label = button.querySelector("span:last-child");
    const buttonGlyph = button.querySelector(".button-icon");
    if (label) label.textContent = playing ? "Musik pausieren" : current > 0 ? "Weiter abspielen" : button.dataset.defaultLabel || "Radio einschalten";
    if (buttonGlyph) buttonGlyph.textContent = playing ? "Ⅱ" : "▶";
  }
}

function connectAnalyser() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass || analyser) return;
  try {
    audioContext = new AudioContextClass();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.84;
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    audioSource = audioContext.createMediaElementSource(audio);
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);
  } catch {
    analyser = undefined;
  }
}

async function toggleAudio() {
  if (!audio) return;
  if (!audio.paused) {
    audio.pause();
    audioStatus.textContent = "LOW LOW pausiert.";
    syncAudioControls();
    return;
  }
  connectAnalyser();
  try {
    if (audioContext?.state === "suspended") await audioContext.resume();
    if (audio.ended || audio.currentTime >= 29.95) audio.currentTime = 0;
    await audio.play();
    audioStatus.textContent = "LOW LOW läuft. Du kannst frei weiterscrollen.";
  } catch {
    audioStatus.textContent = "Der Audioausschnitt konnte nicht gestartet werden. Bitte noch einmal versuchen.";
  }
  syncAudioControls();
}

for (const button of playButtons) {
  button.dataset.defaultLabel = button.querySelector("span:last-child")?.textContent?.trim() || "Radio einschalten";
  button.addEventListener("click", toggleAudio);
}
toggleButton?.addEventListener("click", toggleAudio);
stopButton?.addEventListener("click", () => {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audioStatus.textContent = "LOW LOW gestoppt.";
  syncAudioControls();
});
audio?.addEventListener("timeupdate", syncAudioControls);
audio?.addEventListener("durationchange", syncAudioControls);
audio?.addEventListener("play", () => {
  syncAudioControls();
  renderWorld?.refreshWave();
});
audio?.addEventListener("pause", () => {
  syncAudioControls();
  renderWorld?.refreshWave();
});
audio?.addEventListener("ended", () => {
  audioStatus.textContent = "Der 30-Sekunden-Ausschnitt ist zu Ende.";
  syncAudioControls();
});

const chapters = [...document.querySelectorAll(".chapter")];
if ("IntersectionObserver" in window) {
  const chapterObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-active");
      document.body.dataset.scene = entry.target.dataset.scene || "drive";
      for (const link of document.querySelectorAll(".main-nav a")) {
        const current = link.hash === `#${entry.target.id}`;
        if (current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    }
  }, { threshold: 0.52 });
  chapters.forEach((chapter) => chapterObserver.observe(chapter));
}

async function startExperience() {
  try {
    const THREE = await import("../vendor/three.module.js");
    renderWorld = createWorld(THREE);
    renderWorld.start();
  } catch (error) {
    console.warn("3D-Welt nicht verfügbar; die Story bleibt lesbar.", error);
    document.body.classList.add("world-fallback");
  }
}

function createWorld(THREE) {
  const canvas = document.querySelector("#world-canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  const mobile = window.matchMedia("(max-width: 720px)");
  const requestedPixelRatio = () => Math.min(window.devicePixelRatio || 1, mobile.matches ? 2 : 1.8);
  const lowPowerHint = mobile.matches && ((navigator.deviceMemory || 8) <= 4 || (navigator.hardwareConcurrency || 8) <= 4);
  const minimumQualityTier = lowPowerHint ? 1 : 0;
  let qualityTier = minimumQualityTier;
  const pixelRatioForTier = () => Math.max(1, requestedPixelRatio() * [1, 0.88, 0.72][qualityTier]);
  renderer.setPixelRatio(pixelRatioForTier());
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  renderer.setClearColor(0x07090d, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07090d);
  scene.fog = new THREE.FogExp2(0x090a0e, 0.018);
  const camera = new THREE.PerspectiveCamera(49, 1, 0.08, 180);
  const world = new THREE.Group();
  world.name = "TAELON 383 night drive";
  scene.add(world);

  const palette = {
    road: 0x080a0e,
    cabin: 0x121317,
    trim: 0x29282a,
    warm: 0xffb567,
    red: 0xf52e3b,
    gold: 0xf0c37b,
    pale: 0xffe6ca
  };
  const nightColor = new THREE.Color(0x0a0d12);
  const redColor = new THREE.Color(0x10090e);
  const goldColor = new THREE.Color(0x100e0d);
  const mat = (color, roughness = 0.55, metalness = 0.08, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  const addMesh = (geometry, material, parent, position, rotation) => {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(...position);
    if (rotation) item.rotation.set(...rotation);
    parent.add(item);
    return item;
  };

  scene.add(new THREE.HemisphereLight(0x8995a4, 0x171317, 1.28));
  const cabinFill = new THREE.PointLight(0xe0a775, 6.2, 17, 2);
  cabinFill.position.set(0, 2.6, 0.5);
  scene.add(cabinFill);
  const consoleFill = new THREE.PointLight(0x94775b, 0.85, 5.5, 2);
  consoleFill.position.set(0.25, 0.9, 0.15);
  scene.add(consoleFill);
  const dashGlow = new THREE.PointLight(0xa63a37, 1.1, 6, 2);
  dashGlow.position.set(-0.72, 1.08, -2.48);
  world.add(dashGlow);
  const radioKey = new THREE.PointLight(0xffc88d, 0, 8, 2);
  radioKey.position.set(-1.8, 2.9, -1.05);
  world.add(radioKey);
  const radioFill = new THREE.PointLight(0x8e9daf, 0, 7, 2);
  radioFill.position.set(2.2, 2.15, -1.3);
  world.add(radioFill);
  const radioWash = new THREE.PointLight(0xffc286, 0, 6, 2);
  radioWash.position.set(0, 2.45, -1.8);
  world.add(radioWash);
  const albumGlow = new THREE.PointLight(0xf6bd69, 0, 13, 2);
  albumGlow.position.set(0, 1.6, -14.8);
  world.add(albumGlow);

  // A long, quiet city corridor gives the cabin a real place to travel through.
  const road = addMesh(new THREE.PlaneGeometry(24, 112), mat(palette.road, 0.88, 0.03), world, [0, -0.88, -56], [-Math.PI / 2, 0, 0]);
  road.material.side = THREE.DoubleSide;
  addMesh(new THREE.PlaneGeometry(6, 112), mat(0x111217, 0.92), world, [0, -0.87, -56], [-Math.PI / 2, 0, 0]);
  const roadMarkings = [];
  const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0x807b76, transparent: true, opacity: 0.48, toneMapped: false });
  for (let i = 0; i < 24; i += 1) {
    const dash = addMesh(new THREE.BoxGeometry(0.075, 0.018, 1.35), stripeMaterial, world, [0, -0.84, -7 - i * 4.1]);
    roadMarkings.push(dash);
  }
  const roadEdges = mat(0xc2794d, 0.7, 0.12, { emissive: 0x241008, emissiveIntensity: 0.7 });
  for (const x of [-2.95, 2.95]) {
    addMesh(new THREE.BoxGeometry(0.035, 0.02, 112), roadEdges, world, [x, -0.83, -56]);
  }
  // Thin translucent streaks fake wet-road reflections without expensive post-processing.
  const reflectionMaterials = [
    new THREE.MeshBasicMaterial({ color: 0x99552e, transparent: true, opacity: 0.16, toneMapped: false }),
    new THREE.MeshBasicMaterial({ color: 0xc62c35, transparent: true, opacity: 0.1, toneMapped: false }),
    new THREE.MeshBasicMaterial({ color: 0xe5a363, transparent: true, opacity: 0.11, toneMapped: false })
  ];
  for (let i = 0; i < 22; i += 1) {
    const x = (Math.sin(i * 27.17) * 0.5 + 0.5) * 8 - 4;
    const z = -8 - (i % 11) * 8.8;
    const strip = addMesh(new THREE.PlaneGeometry(0.1 + (i % 3) * 0.12, 1.4 + (i % 5) * 0.9), reflectionMaterials[i % reflectionMaterials.length], world, [x, -0.825, z], [-Math.PI / 2, 0, 0]);
    strip.material.side = THREE.DoubleSide;
  }

  // Distant blocks and lit windows create a city silhouette rather than a flat backdrop.
  const cityMats = [mat(0x181a22, 0.92), mat(0x201d20, 0.9), mat(0x18202a, 0.86)];
  const windowMats = [
    new THREE.MeshBasicMaterial({ color: 0xe0a76c, transparent: true, opacity: 0.78, toneMapped: false }),
    new THREE.MeshBasicMaterial({ color: 0xb5a38b, transparent: true, opacity: 0.54, toneMapped: false })
  ];
  let seed = 383;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let side of [-1, 1]) {
    for (let i = 0; i < 12; i += 1) {
      const width = 2.5 + random() * 3.6;
      const height = 4.2 + random() * 11;
      const depth = 3 + random() * 4;
      const x = side * (5.1 + random() * 4.4);
      const z = -28 - i * 7.3 - random() * 3;
      addMesh(new THREE.BoxGeometry(width, height, depth), cityMats[i % cityMats.length], world, [x, height / 2 - 0.7, z]);
      const count = 4 + Math.floor(random() * 4);
      for (let w = 0; w < count; w += 1) {
        const wx = x + (random() - 0.5) * width * 0.72;
        const wy = 0.15 + random() * (height * 0.78);
        const glow = addMesh(new THREE.PlaneGeometry(0.075 + random() * 0.055, 0.16 + random() * 0.17), windowMats[Math.floor(random() * windowMats.length)], world, [wx, wy, z + depth / 2 + 0.012]);
        glow.material.side = THREE.DoubleSide;
      }
    }
  }

  // Small radial glows make practical lights bloom softly on mobile too.
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 128;
  const glowContext = glowCanvas.getContext("2d");
  const glow = glowContext.createRadialGradient(64, 64, 2, 64, 64, 64);
  glow.addColorStop(0, "rgba(255,235,204,0.96)");
  glow.addColorStop(0.12, "rgba(255,175,100,0.56)");
  glow.addColorStop(0.48, "rgba(230,89,51,0.16)");
  glow.addColorStop(1, "rgba(230,89,51,0)");
  glowContext.fillStyle = glow;
  glowContext.fillRect(0, 0, 128, 128);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  const glowMaterial = new THREE.SpriteMaterial({ map: glowTexture, color: palette.warm, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const lampPositions = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i += 1) {
      const z = -12 - i * 15;
      const x = side * 3.25;
      addMesh(new THREE.CylinderGeometry(0.055, 0.09, 5.7, 8), mat(0x24252a, 0.48, 0.62), world, [x, 2.0, z]);
      addMesh(new THREE.BoxGeometry(0.68, 0.12, 0.22), mat(0x343034, 0.35, 0.5), world, [x - side * 0.2, 4.82, z]);
      const bulb = addMesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({ color: palette.warm, toneMapped: false }), world, [x - side * 0.23, 4.73, z]);
      const sprite = new THREE.Sprite(glowMaterial.clone());
      sprite.position.copy(bulb.position);
      sprite.scale.set(4.8, 4.8, 1);
      world.add(sprite);
      lampPositions.push({ sprite, bulb });
    }
  }

  // Cockpit: the dashboard and radio sit between the driver and a real windshield plane.
  const cabin = new THREE.Group();
  cabin.name = "cockpit";
  world.add(cabin);
  const leather = mat(0x1d1d22, 0.76, 0.025);
  const dashLeather = mat(0x302e32, 0.64, 0.04);
  const soft = mat(0x090a0d, 0.86, 0.02);
  const brushed = mat(0x59534b, 0.34, 0.48);
  const seam = mat(0x454044, 0.48, 0.08);
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = grainCanvas.height = 512;
  const grainContext = grainCanvas.getContext("2d");
  const grainPixels = grainContext.createImageData(grainCanvas.width, grainCanvas.height);
  for (let i = 0; i < grainPixels.data.length; i += 4) {
    const value = 112 + Math.floor(random() * 32);
    grainPixels.data[i] = value;
    grainPixels.data[i + 1] = value;
    grainPixels.data[i + 2] = value;
    grainPixels.data[i + 3] = 255;
  }
  grainContext.putImageData(grainPixels, 0, 0);
  const grainTexture = new THREE.CanvasTexture(grainCanvas);
  grainTexture.wrapS = grainTexture.wrapT = THREE.RepeatWrapping;
  grainTexture.repeat.set(4, 2);
  leather.bumpMap = grainTexture;
  leather.bumpScale = 0.018;
  dashLeather.bumpMap = grainTexture;
  dashLeather.bumpScale = 0.026;

  // Windscreen glass, gasket, roof header, and pillars frame the road beyond the dash.
  const windscreen = new THREE.Mesh(
    new THREE.PlaneGeometry(5.9, 2.65),
    new THREE.MeshPhysicalMaterial({ color: 0x89939b, roughness: 0.18, metalness: 0.02, transparent: true, opacity: 0.085, side: THREE.DoubleSide, depthWrite: false })
  );
  windscreen.position.set(0, 3.05, -4.34);
  cabin.add(windscreen);
  addMesh(new THREE.BoxGeometry(6.3, 0.22, 0.36), soft, cabin, [0, 4.48, -4.24]);
  addMesh(new THREE.BoxGeometry(6.1, 0.15, 0.46), dashLeather, cabin, [0, 1.72, -4.02]);
  for (const side of [-1, 1]) {
    const pillar = addMesh(new THREE.BoxGeometry(0.24, 3.25, 0.34), soft, cabin, [side * 2.95, 3.02, -4.28]);
    pillar.rotation.z = side * -0.17;
    addMesh(new THREE.BoxGeometry(0.055, 3.12, 0.025), brushed, cabin, [side * 2.85, 3.03, -4.085], [0, 0, side * -0.17]);
    const mirrorStem = addMesh(new THREE.BoxGeometry(0.42, 0.055, 0.06), soft, cabin, [side * 3.0, 2.07, -3.72]);
    mirrorStem.rotation.z = side * 0.1;
    addMesh(new THREE.BoxGeometry(0.42, 0.18, 0.25), dashLeather, cabin, [side * 3.32, 2.1, -3.67], [0, side * -0.12, side * 0.06]);
  }

  // Broad sculpted dashboard, instrument binnacle, glove box, and center-stack surround.
  const dashboardShape = new THREE.Shape();
  dashboardShape.moveTo(-4.45, 0.08);
  dashboardShape.lineTo(4.45, 0.08);
  dashboardShape.lineTo(4.35, 1.1);
  dashboardShape.quadraticCurveTo(3.95, 1.32, 3.35, 1.28);
  dashboardShape.lineTo(1.32, 1.16);
  dashboardShape.quadraticCurveTo(0, 1.04, -1.32, 1.16);
  dashboardShape.lineTo(-3.35, 1.28);
  dashboardShape.quadraticCurveTo(-3.95, 1.32, -4.35, 1.1);
  dashboardShape.closePath();
  const dashboardGeometry = new THREE.ExtrudeGeometry(dashboardShape, {
    depth: 1.55,
    bevelEnabled: true,
    bevelThickness: 0.075,
    bevelSize: 0.075,
    bevelSegments: 4,
    curveSegments: 12
  });
  dashboardGeometry.translate(0, 0, -0.775);
  addMesh(dashboardGeometry, leather, cabin, [0, 0, -3.16]);
  addMesh(new THREE.BoxGeometry(8.8, 0.28, 1.42), dashLeather, cabin, [0, 1.42, -3.2]);
  addMesh(new THREE.BoxGeometry(8.9, 0.035, 1.3), mat(0x303036, 0.72, 0.025), cabin, [0, 1.574, -3.22]);
  addMesh(new THREE.BoxGeometry(8.72, 1.35, 0.36), leather, cabin, [0, -0.18, -2.58]);
  addMesh(new THREE.BoxGeometry(8.5, 0.045, 0.26), brushed, cabin, [0, 0.16, -2.405]);
  addMesh(new THREE.BoxGeometry(4.7, 0.016, 0.016), mat(0xb87346, 0.34, 0.25, { emissive: 0x7c3d1c, emissiveIntensity: 0.24 }), cabin, [0.35, 0.08, -2.38]);
  addMesh(new THREE.BoxGeometry(2.2, 0.3, 0.26), dashLeather, cabin, [2.62, 0.66, -2.39]);
  addMesh(new THREE.BoxGeometry(1.8, 0.012, 0.012), seam, cabin, [2.62, 0.5, -2.245]);
  const cabinFloor = addMesh(new THREE.PlaneGeometry(8.2, 7.0), mat(0x151619, 0.9, 0.02), cabin, [0, -0.55, -1.0], [-Math.PI / 2, 0, 0]);
  cabinFloor.material.side = THREE.DoubleSide;
  addMesh(new THREE.BoxGeometry(1.9, 0.62, 3.8), mat(0x28272b, 0.58, 0.045), cabin, [0, 0.05, -0.5]);
  addMesh(new THREE.BoxGeometry(1.62, 0.045, 3.52), mat(0x353237, 0.52, 0.055), cabin, [0, 0.385, -0.5]);
  const tunnelTrim = mat(0x756b5b, 0.32, 0.64);
  for (const side of [-1, 1]) {
    addMesh(new THREE.BoxGeometry(0.035, 0.018, 3.12), tunnelTrim, cabin, [side * 0.79, 0.418, -0.48]);
  }
  addMesh(new THREE.BoxGeometry(1.36, 0.16, 0.88), leather, cabin, [0, 0.49, 1.12]);
  addMesh(new THREE.BoxGeometry(1.14, 0.025, 0.7), dashLeather, cabin, [0, 0.582, 1.1]);
  // Brushed pedals and a ribbed footwell mat finish the lower cabin foreground.
  const footwellMat = addMesh(new THREE.PlaneGeometry(1.55, 1.95), mat(0x1b1a1d, 0.86, 0.05), cabin, [-1.12, -0.51, 0.85], [-Math.PI / 2, 0, 0]);
  footwellMat.material.side = THREE.DoubleSide;
  const pedalMaterial = mat(0x59534a, 0.34, 0.62);
  for (let i = 0; i < 3; i += 1) {
    const pedal = addMesh(new THREE.BoxGeometry(0.2, 0.34, 0.075), pedalMaterial, cabin, [-1.58 + i * 0.31, -0.22, 0.3]);
    pedal.rotation.x = -0.12;
    for (let rib = 0; rib < 4; rib += 1) {
      addMesh(new THREE.BoxGeometry(0.14, 0.012, 0.008), mat(0xaaa093, 0.3, 0.58), cabin, [-1.58 + i * 0.31, -0.34 + rib * 0.075, 0.342]);
    }
  }
  addMesh(new THREE.BoxGeometry(8.75, 0.035, 0.11), brushed, cabin, [0, 1.34, -2.36]);
  const stitchMaterial = new THREE.MeshBasicMaterial({ color: 0x77706b, transparent: true, opacity: 0.52 });
  for (let i = 0; i < 39; i += 1) {
    addMesh(new THREE.BoxGeometry(0.055, 0.009, 0.008), stitchMaterial, cabin, [-4.15 + i * 0.218, 1.365, -2.34]);
  }
  // Side door caps and armrests give the dashboard a clear cabin silhouette in portrait view.
  for (const side of [-1, 1]) {
    const door = addMesh(new THREE.BoxGeometry(0.2, 1.04, 2.7), leather, cabin, [side * 4.28, 0.74, -2.28]);
    door.rotation.y = side * -0.08;
    addMesh(new THREE.BoxGeometry(0.36, 0.2, 1.2), dashLeather, cabin, [side * 4.06, 0.96, -1.94], [0, side * -0.08, 0]);
    addMesh(new THREE.BoxGeometry(0.34, 0.035, 0.28), brushed, cabin, [side * 4.01, 1.04, -2.04], [0, side * -0.08, 0]);
    addMesh(new THREE.BoxGeometry(0.045, 0.035, 0.12), mat(0xd4c7b2, 0.23, 0.72), cabin, [side * 3.96, 1.03, -2.02]);
  }
  const stack = addMesh(new THREE.BoxGeometry(3.24, 2.7, 0.58), dashLeather, cabin, [0, 1.43, -3.04]);
  stack.rotation.x = -0.055;
  addMesh(new THREE.BoxGeometry(2.7, 0.7, 0.72), leather, cabin, [2.75, 0.96, -3.18]);
  addMesh(new THREE.BoxGeometry(0.92, 0.035, 0.045), brushed, cabin, [2.72, 1.0, -2.81]);
  addMesh(new THREE.BoxGeometry(2.6, 0.18, 0.38), soft, cabin, [-3.08, 1.79, -2.72]);

  // Twin instrument dials stay visible above the steering wheel.
  const dialCenters = [-1.78, -0.98];
  const dialFace = new THREE.MeshBasicMaterial({ color: 0x0c0e12, toneMapped: false });
  const dialMark = new THREE.MeshBasicMaterial({ color: 0xd99d62, toneMapped: false });
  for (const x of dialCenters) {
    addMesh(new THREE.CircleGeometry(0.34, 40), dialFace, cabin, [x, 1.68, -2.49]);
    addMesh(new THREE.TorusGeometry(0.35, 0.025, 8, 48), brushed, cabin, [x, 1.68, -2.46]);
    for (let tick = 0; tick < 12; tick += 1) {
      const angle = tick / 12 * Math.PI * 1.55 - Math.PI * 0.78;
      const marker = addMesh(new THREE.BoxGeometry(0.012, 0.055, 0.008), dialMark, cabin, [x + Math.sin(angle) * 0.26, 1.68 + Math.cos(angle) * 0.26, -2.445]);
      marker.rotation.z = -angle;
    }
    const needle = addMesh(new THREE.BoxGeometry(0.014, 0.21, 0.012), new THREE.MeshBasicMaterial({ color: 0xf1dfc0, toneMapped: false }), cabin, [x, 1.73, -2.432]);
    needle.rotation.z = 0.24;
  }
  const wheelPosition = [-1.38, 1.25, -1.78];
  const wheel = addMesh(new THREE.TorusGeometry(0.62, 0.066, 16, 72), mat(0x363236, 0.48, 0.045), cabin, wheelPosition);
  wheel.rotation.y = 0.04;
  addMesh(new THREE.TorusGeometry(0.62, 0.014, 8, 72), mat(0x766b5c, 0.38, 0.2), cabin, [-1.38, 1.25, -1.79]);
  addMesh(new THREE.CylinderGeometry(0.17, 0.17, 0.22, 32), mat(0x27272b, 0.52, 0.08), cabin, wheelPosition, [Math.PI / 2, 0, 0]);
  addMesh(new THREE.CylinderGeometry(0.13, 0.13, 0.235, 32), brushed, cabin, [-1.38, 1.25, -1.8], [Math.PI / 2, 0, 0]);
  addMesh(new THREE.BoxGeometry(0.16, 0.1, 0.045), mat(0x18191d, 0.4, 0.16), cabin, [-1.38, 1.25, -1.935]);
  for (const angle of [0.5, 2.6, 4.7]) {
    const spoke = addMesh(new THREE.BoxGeometry(0.075, 0.49, 0.06), brushed, cabin, [-1.38, 1.25, -1.82]);
    spoke.rotation.z = angle;
  }
  addMesh(new THREE.BoxGeometry(0.22, 0.16, 0.075), soft, cabin, [-1.38, 1.04, -1.9]);
  addMesh(new THREE.BoxGeometry(0.22, 0.16, 0.075), soft, cabin, [-1.38, 1.46, -1.9]);
  for (const side of [-1, 1]) {
    addMesh(new THREE.BoxGeometry(0.22, 0.11, 0.035), mat(0x222328, 0.55, 0.18), cabin, [-1.38 + side * 0.39, 1.25, -1.89]);
    addMesh(new THREE.BoxGeometry(0.09, 0.025, 0.012), mat(0xc49a6a, 0.32, 0.4, { emissive: 0x3c2110, emissiveIntensity: 0.24 }), cabin, [-1.38 + side * 0.39, 1.25, -1.867]);
  }
  // Compact electronic selector: leather grip, satin-metal spine, and illuminated gear key.
  addMesh(new THREE.BoxGeometry(1.08, 0.1, 0.74), mat(0x17181c, 0.46, 0.18), cabin, [0.68, 0.45, 0.18]);
  addMesh(new THREE.BoxGeometry(0.94, 0.035, 0.61), brushed, cabin, [0.68, 0.514, 0.18]);
  const cupholderMetal = mat(0xa2937d, 0.26, 0.68);
  for (const x of [-0.38, 0.38]) {
    addMesh(new THREE.CylinderGeometry(0.13, 0.13, 0.026, 32), mat(0x0d0e11, 0.68, 0.2), cabin, [0.68 + x, 0.423, 0.92]);
    addMesh(new THREE.TorusGeometry(0.13, 0.012, 8, 32), cupholderMetal, cabin, [0.68 + x, 0.44, 0.92], [Math.PI / 2, 0, 0]);
  }
  const selector = new THREE.Group();
  selector.position.set(0.7, 0.52, 0.2);
  selector.rotation.z = -0.06;
  cabin.add(selector);
  const selectorShape = new THREE.Shape();
  selectorShape.moveTo(-0.27, 0.03);
  selectorShape.lineTo(0.27, 0.03);
  selectorShape.lineTo(0.22, 0.33);
  selectorShape.quadraticCurveTo(0.2, 0.4, 0.16, 0.48);
  selectorShape.lineTo(-0.16, 0.48);
  selectorShape.quadraticCurveTo(-0.2, 0.4, -0.22, 0.33);
  selectorShape.closePath();
  const selectorGeometry = new THREE.ExtrudeGeometry(selectorShape, { depth: 0.36, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.035, bevelSegments: 4, curveSegments: 12 });
  selectorGeometry.translate(0, 0, -0.18);
  addMesh(selectorGeometry, mat(0x29282a, 0.38, 0.3), selector, [0, 0, 0]);
  addMesh(new THREE.BoxGeometry(0.28, 0.028, 0.27), mat(0x1a1b1f, 0.26, 0.42), selector, [0, 0.47, 0]);
  addMesh(new THREE.BoxGeometry(0.23, 0.014, 0.018), mat(0xd4c6ac, 0.22, 0.72), selector, [0, 0.47, 0.145]);
  addMesh(new THREE.BoxGeometry(0.11, 0.012, 0.014), mat(0xe8b878, 0.28, 0.48, { emissive: 0x593416, emissiveIntensity: 0.35 }), selector, [0, 0.47, 0.158]);
  addMesh(new THREE.BoxGeometry(0.018, 0.26, 0.02), mat(0xaaa093, 0.29, 0.72), selector, [-0.215, 0.25, 0.17]);
  addMesh(new THREE.BoxGeometry(0.015, 0.24, 0.016), mat(0x8b8175, 0.34, 0.64), selector, [0.215, 0.25, 0.17]);
  for (let rib = 0; rib < 3; rib += 1) {
    addMesh(new THREE.BoxGeometry(0.09, 0.012, 0.012), mat(0x8d8172, 0.34, 0.55), selector, [0.1, 0.16 + rib * 0.055, 0.185]);
  }
  addMesh(new THREE.BoxGeometry(0.37, 0.026, 0.035), mat(0x7b7265, 0.32, 0.62), selector, [0, 0.02, 0.19]);
  selector.scale.set(0.84, 0.9, 0.88);

  // Small mirror and wipers make the windshield read as glass from the driver's seat.
  addMesh(new THREE.BoxGeometry(0.78, 0.11, 0.18), brushed, cabin, [0, 4.03, -3.94]);
  addMesh(new THREE.BoxGeometry(0.07, 0.34, 0.09), soft, cabin, [0, 3.85, -4.0]);
  for (const side of [-1, 1]) {
    const wiper = addMesh(new THREE.BoxGeometry(2.45, 0.035, 0.06), soft, cabin, [side * 1.28, 1.82, -3.9]);
    wiper.rotation.z = side * 0.045;
  }
  const glassReflectionMaterial = new THREE.MeshBasicMaterial({ color: 0xc1b5a7, transparent: true, opacity: 0.12, depthWrite: false, toneMapped: false });
  const glassReflection = addMesh(new THREE.PlaneGeometry(5.1, 0.045), glassReflectionMaterial, cabin, [0.45, 4.12, -4.315]);
  glassReflection.rotation.z = -0.06;

  const radio = new THREE.Group();
  radio.name = "center-stack-radio";
  radio.position.set(0, 1.46, -2.86);
  radio.rotation.x = -0.045;
  cabin.add(radio);
  function roundedRect(width, height, radius) {
    const x = width / 2;
    const y = height / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-x + radius, -y);
    shape.lineTo(x - radius, -y);
    shape.quadraticCurveTo(x, -y, x, -y + radius);
    shape.lineTo(x, y - radius);
    shape.quadraticCurveTo(x, y, x - radius, y);
    shape.lineTo(-x + radius, y);
    shape.quadraticCurveTo(-x, y, -x, y - radius);
    shape.lineTo(-x, -y + radius);
    shape.quadraticCurveTo(-x, -y, -x + radius, -y);
    return shape;
  }
  function addRoundedPanel(width, height, radius, depth, bevel, material, position) {
    const geometry = new THREE.ExtrudeGeometry(roundedRect(width, height, radius), {
      depth,
      steps: 1,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 8
    });
    geometry.translate(0, 0, -depth / 2);
    return addMesh(geometry, material, radio, position);
  }
  addRoundedPanel(3.06, 2.62, 0.27, 0.42, 0.07, mat(0x494640, 0.3, 0.52), [0, 0, 0]);
  addRoundedPanel(2.94, 2.50, 0.24, 0.075, 0.022, mat(0x15161a, 0.48, 0.24), [0, 0, 0.215]);
  addRoundedPanel(2.84, 2.40, 0.22, 0.035, 0.01, mat(0x242529, 0.54, 0.2), [0, 0, 0.268]);

  // A wide, flush touchscreen gives the center stack a modern integrated silhouette.
  addRoundedPanel(2.54, 1.56, 0.12, 0.105, 0.035, mat(0x777166, 0.24, 0.58), [0, 0.16, 0.275]);
  addRoundedPanel(2.40, 1.42, 0.09, 0.035, 0.012, mat(0x080a0d, 0.2, 0.08, { emissive: 0x0b1015, emissiveIntensity: 0.62 }), [0, 0.16, 0.338]);
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 2048;
  screenCanvas.height = 1024;
  const screenContext = screenCanvas.getContext("2d");
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  function drawRadioScreen() {
    screenContext.fillStyle = "#080b0f";
    screenContext.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
    const glow = screenContext.createLinearGradient(0, 0, screenCanvas.width, screenCanvas.height);
    glow.addColorStop(0, "#172027");
    glow.addColorStop(0.5, "#0a1015");
    glow.addColorStop(1, "#1a1511");
    screenContext.fillStyle = glow;
    screenContext.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
    screenContext.strokeStyle = "rgba(216, 194, 164, .24)";
    screenContext.lineWidth = 2;
    screenContext.beginPath();
    screenContext.moveTo(140, 112);
    screenContext.lineTo(1908, 112);
    screenContext.stroke();
    screenContext.textAlign = "center";
    screenContext.textBaseline = "middle";
    screenContext.fillStyle = "rgba(235, 197, 151, .96)";
    screenContext.font = "600 92px Inter, Segoe UI, Arial, sans-serif";
    screenContext.letterSpacing = "12px";
    screenContext.fillText("TAELON 383", 1024, 222);
    screenContext.fillStyle = "#f5f0e7";
    screenContext.font = "700 176px Inter, Segoe UI, Arial, sans-serif";
    screenContext.letterSpacing = "1px";
    screenContext.fillText("LOW LOW", 1024, 456);
    screenContext.fillStyle = "rgba(221, 213, 201, .84)";
    screenContext.font = "600 76px Inter, Segoe UI, Arial, sans-serif";
    screenContext.letterSpacing = "14px";
    screenContext.fillText("OHNE ANSAGE", 1024, 626);
    screenContext.strokeStyle = "rgba(216, 194, 164, .15)";
    screenContext.beginPath();
    screenContext.moveTo(140, 738);
    screenContext.lineTo(1908, 738);
    screenContext.stroke();
  }
  drawRadioScreen();
  screenTexture.needsUpdate = true;
  const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false });
  const screenFace = addMesh(new THREE.PlaneGeometry(2.40, 1.42), screenMaterial, radio, [0, 0.16, 0.382]);
  screenFace.renderOrder = 3;
  const waveformCanvas = document.createElement("canvas");
  waveformCanvas.width = 1536;
  waveformCanvas.height = 192;
  const waveformContext = waveformCanvas.getContext("2d");
  const waveformTexture = new THREE.CanvasTexture(waveformCanvas);
  waveformTexture.colorSpace = THREE.SRGBColorSpace;
  waveformTexture.generateMipmaps = false;
  waveformTexture.minFilter = THREE.LinearFilter;
  waveformTexture.magFilter = THREE.LinearFilter;
  const waveformMaterial = new THREE.MeshBasicMaterial({ map: waveformTexture, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const waveform = addMesh(new THREE.PlaneGeometry(2.04, 0.23), waveformMaterial, radio, [0, -0.19, 0.416]);
  waveform.renderOrder = 5;

  // Slim air vents and a pair of premium climate knobs frame the touchscreen.
  const ventCasing = mat(0x101114, 0.62, 0.2);
  addRoundedPanel(2.16, 0.19, 0.06, 0.055, 0.012, ventCasing, [0, 1.08, 0.3]);
  for (let i = 0; i < 5; i += 1) {
    addMesh(new THREE.BoxGeometry(1.82, 0.012, 0.024), mat(0x8c8579, 0.38, 0.48), radio, [0, 1.02 + i * 0.026, 0.342]);
  }
  const knobMetal = mat(0xb1a18a, 0.23, 0.64);
  for (const x of [-0.9, 0.9]) {
    addMesh(new THREE.CylinderGeometry(0.11, 0.12, 0.13, 40), mat(0x25262a, 0.28, 0.55), radio, [x, -0.91, 0.34], [Math.PI / 2, 0, 0]);
    const ring = addMesh(new THREE.TorusGeometry(0.096, 0.012, 8, 40), knobMetal, radio, [x, -0.91, 0.414]);
    ring.renderOrder = 2;
    addMesh(new THREE.BoxGeometry(0.012, 0.034, 0.012), mat(0xf0c37b, 0.25, 0.3, { emissive: 0x513419, emissiveIntensity: 0.4 }), radio, [x, -0.86, 0.417]);
  }
  for (let i = 0; i < 3; i += 1) {
    const x = -0.22 + i * 0.22;
    addRoundedPanel(0.14, 0.07, 0.022, 0.04, 0.008, mat(0x28292d, 0.3, 0.56), [x, -0.91, 0.3]);
    addMesh(new THREE.BoxGeometry(0.024, 0.01, 0.012), mat(i === 1 ? 0xe6b97c : 0x9b9a9b, 0.25, 0.45, { emissive: i === 1 ? 0x5b3214 : 0x151515, emissiveIntensity: 0.25 }), radio, [x, -0.91, 0.33]);
  }
  const hazardShape = new THREE.Shape();
  hazardShape.moveTo(0, 0.065);
  hazardShape.lineTo(0.064, -0.05);
  hazardShape.lineTo(-0.064, -0.05);
  hazardShape.closePath();
  const hazard = addMesh(new THREE.ShapeGeometry(hazardShape), new THREE.MeshBasicMaterial({ color: palette.red, toneMapped: false }), radio, [0, -1.02, 0.30]);
  hazard.renderOrder = 2;

  // The album cover is a second, warm-lit object in the same continuous world.
  const textureLoader = new THREE.TextureLoader();
  const albumFrame = new THREE.Group();
  albumFrame.name = "OHNE ANSAGE album landmark";
  albumFrame.position.set(0, 1.55, -17.4);
  world.add(albumFrame);
  const frameMaterial = mat(0x9b6c3e, 0.3, 0.72, { emissive: 0x4d2411, emissiveIntensity: 0.5 });
  const frameSide = 2.42;
  addMesh(new THREE.BoxGeometry(frameSide, 0.075, 0.12), frameMaterial, albumFrame, [0, frameSide / 2, 0]);
  addMesh(new THREE.BoxGeometry(frameSide, 0.075, 0.12), frameMaterial, albumFrame, [0, -frameSide / 2, 0]);
  addMesh(new THREE.BoxGeometry(0.075, frameSide, 0.12), frameMaterial, albumFrame, [-frameSide / 2, 0, 0]);
  addMesh(new THREE.BoxGeometry(0.075, frameSide, 0.12), frameMaterial, albumFrame, [frameSide / 2, 0, 0]);
  const albumMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false });
  const albumArt = addMesh(new THREE.PlaneGeometry(2.25, 2.25), albumMaterial, albumFrame, [0, 0, 0.075]);
  albumArt.renderOrder = 2;
  let albumLoaded = false;
  function loadAlbum() {
    if (albumLoaded) return;
    albumLoaded = true;
    textureLoader.load("assets/ohne-ansage-cover.png", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      albumMaterial.map = texture;
      albumMaterial.needsUpdate = true;
    }, undefined, () => { albumLoaded = false; });
  }

  // A restrained drifting veil gives the lamps depth; the count drops on phones.
  const particleCount = mobile.matches ? 112 : 220;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    positions[i * 3] = (random() - 0.5) * 20;
    positions[i * 3 + 1] = random() * 7.5 - 0.3;
    positions[i * 3 + 2] = -5 - random() * 95;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({ color: 0xb5a9a0, size: mobile.matches ? 0.024 : 0.032, transparent: true, opacity: 0.34, depthWrite: false, sizeAttenuation: true });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  world.add(particles);
  let activeParticleCount = particleCount;
  function setQualityTier(nextTier) {
    qualityTier = THREE.MathUtils.clamp(nextTier, minimumQualityTier, 2);
    renderer.setPixelRatio(pixelRatioForTier());
    renderer.setSize(Math.max(1, window.innerWidth), Math.max(1, window.innerHeight), false);
    activeParticleCount = Math.max(16, Math.floor(particleCount * [1, 0.56, 0.24][qualityTier]));
    particleGeometry.setDrawRange(0, activeParticleCount);
    particleMaterial.opacity = [0.3, 0.2, 0.12][qualityTier];
    particleMaterial.size = mobile.matches ? 0.024 : 0.032;
  }
  setQualityTier(qualityTier);

  const cameraKeys = [
    { p: 0, position: [-0.25, 2.4, 7.0], target: [-0.2, 1.55, -3.8], fov: 47, mobile: { position: [-0.12, 2.3, 6.0], target: [-0.1, 1.45, -3.8], fov: 56 } },
    { p: 0.18, position: [-0.15, 2.15, 5.4], target: [0, 1.48, -5.25], fov: 48, mobile: { position: [-0.12, 2.18, 5.4], target: [-0.08, 1.52, -4.7], fov: 56 } },
    { p: 0.34, position: [0, 1.76, 4.45], target: [0, 1.5, -2.86], fov: 46, mobile: { position: [0.12, 1.76, 5.0], fov: 60 } },
    { p: 0.49, position: [0, 1.66, 2.0], target: [0, 1.54, -2.86], fov: 35, mobile: { position: [0.08, 1.66, 4.5], fov: 58 } },
    { p: 0.62, position: [0, 1.62, -9.1], target: [0, 1.55, -16.2], fov: 44 },
    { p: 0.75, position: [0, 1.62, -9.1], target: [0, 1.55, -16.2], fov: 44 },
    { p: 0.87, position: [0, 1.55, -13.6], target: [0, 1.55, -17.3], fov: 40 },
    { p: 1, position: [0, 1.35, -21.5], target: [0, 1.55, -26.2], fov: 47 }
  ];
  const goalPosition = new THREE.Vector3();
  const goalTarget = new THREE.Vector3();
  const currentTarget = new THREE.Vector3();
  let exactProgress = 0;
  let smoothProgress = 0;
  let viewportHeight = window.innerHeight;
  let scrollSpan = 1;
  let lastTime = 0;
  let elapsed = 0;
  let frameId = 0;
  let visible = !document.hidden;

  function requestRender() {
    if (!visible || frameId) return;
    frameId = requestAnimationFrame(render);
  }
  function measureScroll() {
    viewportHeight = window.innerHeight;
    scrollSpan = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
    exactProgress = Math.min(1, Math.max(0, window.scrollY / scrollSpan));
    requestRender();
  }
  function sampleCamera(progress) {
    let index = 0;
    while (index < cameraKeys.length - 2 && progress > cameraKeys[index + 1].p) index += 1;
    const right = cameraKeys[index + 1];
    const left = cameraKeys[index];
    const t = THREE.MathUtils.clamp((progress - left.p) / (right.p - left.p), 0, 1);
    const eased = t * t * (3 - 2 * t);
    const mobileLeft = mobile.matches && left.mobile ? left.mobile : left;
    const mobileRight = mobile.matches && right.mobile ? right.mobile : right;
    const positionLeft = mobileLeft.position || left.position;
    const positionRight = mobileRight.position || right.position;
    const targetLeft = mobileLeft.target || left.target;
    const targetRight = mobileRight.target || right.target;
    goalPosition.set(
      THREE.MathUtils.lerp(positionLeft[0], positionRight[0], eased),
      THREE.MathUtils.lerp(positionLeft[1], positionRight[1], eased),
      THREE.MathUtils.lerp(positionLeft[2], positionRight[2], eased)
    );
    goalTarget.set(
      THREE.MathUtils.lerp(targetLeft[0], targetRight[0], eased),
      THREE.MathUtils.lerp(targetLeft[1], targetRight[1], eased),
      THREE.MathUtils.lerp(targetLeft[2], targetRight[2], eased)
    );
    camera.fov = THREE.MathUtils.lerp(mobileLeft.fov ?? left.fov, mobileRight.fov ?? right.fov, eased);
    camera.updateProjectionMatrix();
  }
  function resize() {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    renderer.setPixelRatio(pixelRatioForTier());
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    measureScroll();
  }
  let lastWaveUpdate = -1;
  function updateWave(time) {
    if (analyser && frequencyData) analyser.getByteFrequencyData(frequencyData);
    const p = exactProgress;
    waveform.visible = p > 0.27 && p < 0.72;
    if (!waveform.visible) return;
    const playing = audio && !audio.paused && !audio.ended;
    if (reducedMotion.matches && lastWaveUpdate >= 0) return;
    if (!reducedMotion.matches && time - lastWaveUpdate < 1 / 24) return;
    lastWaveUpdate = time;
    waveformContext.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    const gradient = waveformContext.createLinearGradient(0, 0, waveformCanvas.width, 0);
    gradient.addColorStop(0, "#b97b4e");
    gradient.addColorStop(0.5, "#ffe3b1");
    gradient.addColorStop(1, "#ce8d5b");
    waveformContext.save();
    const centerY = waveformCanvas.height / 2;
    const sampleCount = 320;
    const maxAmplitude = playing ? 82 : 70;
    let spectrumEnergy = 0;
    if (playing && frequencyData) {
      const bands = [[1, 7, 0.56], [7, 30, 0.3], [30, 90, 0.14]];
      for (const [start, end, weight] of bands) {
        let total = 0;
        for (let bin = start; bin < Math.min(end, frequencyData.length); bin += 1) total += frequencyData[bin] / 255;
        spectrumEnergy += total / Math.max(1, Math.min(end, frequencyData.length) - start) * weight;
      }
    }
    waveformContext.strokeStyle = "rgba(255, 226, 185, .14)";
    waveformContext.lineWidth = 2;
    waveformContext.beginPath();
    waveformContext.moveTo(24, centerY);
    waveformContext.lineTo(waveformCanvas.width - 24, centerY);
    waveformContext.stroke();
    function drawCurve(stroke, width, alpha, glow) {
      waveformContext.globalAlpha = alpha;
      waveformContext.strokeStyle = stroke;
      waveformContext.lineWidth = width;
      waveformContext.shadowColor = "rgba(246, 184, 116, .78)";
      waveformContext.shadowBlur = glow;
      waveformContext.lineJoin = "round";
      waveformContext.lineCap = "round";
      waveformContext.beginPath();
      for (let i = 0; i < sampleCount; i += 1) {
        const position = i / (sampleCount - 1);
        const phase = i * 0.082;
        const carrier =
          Math.sin(phase + (reducedMotion.matches ? 0 : time * (playing ? 2.2 : 0.7))) * 0.58 +
          Math.sin(phase * 1.82 - time * 1.15) * 0.27 +
          Math.sin(phase * 3.1 + time * 0.62) * 0.15;
        const bandIndex = 1 + Math.floor(Math.pow(position, 1.65) * Math.min(88, (frequencyData?.length || 89) - 1));
        const localEnergy = playing && frequencyData ? frequencyData[bandIndex] / 255 : 0;
        const envelope = playing
          ? 0.07 + spectrumEnergy * 0.22 + localEnergy * 0.34
          : 0.035;
        const raw = carrier * envelope;
        const shaped = Math.sign(raw) * Math.sqrt(Math.abs(raw));
        const x = 18 + position * (waveformCanvas.width - 36);
        const y = centerY - shaped * maxAmplitude;
        if (i === 0) waveformContext.moveTo(x, y);
        else waveformContext.lineTo(x, y);
      }
      waveformContext.stroke();
    }
    waveformContext.shadowBlur = 0;
    drawCurve(gradient, 15, 0.2, 24);
    drawCurve(gradient, 4, 0.98, 12);
    waveformContext.restore();
    waveformTexture.needsUpdate = true;
  }
  let qualityFrames = 0;
  let slowFrames = 0;
  let qualityWindowStart = performance.now();
  function adaptQuality(now, dt) {
    qualityFrames += 1;
    if (dt > 1 / 36) slowFrames += 1;
    if (now - qualityWindowStart < 3500 || qualityFrames < 45) return;
    const slowRatio = slowFrames / qualityFrames;
    if (slowRatio > 0.25 && qualityTier < 2) setQualityTier(qualityTier + 1);
    else if (slowRatio < 0.08 && qualityTier > minimumQualityTier) setQualityTier(qualityTier - 1);
    qualityFrames = 0;
    slowFrames = 0;
    qualityWindowStart = now;
  }
  function render(now) {
    frameId = 0;
    if (!visible) return;
    const frameDelta = Math.max(0.001, (now - (lastTime || now)) / 1000);
    const dt = Math.min(0.05, frameDelta);
    lastTime = now;
    elapsed += frameDelta;
    adaptQuality(now, dt);
    smoothProgress = exactProgress;
    document.body.classList.toggle("radio-focus", smoothProgress > 0.45 && smoothProgress < 0.66);
    sampleCamera(smoothProgress);
    const damping = reducedMotion.matches ? 1 : 1 - Math.exp(-12 * frameDelta);
    camera.position.lerp(goalPosition, damping);
    currentTarget.lerp(goalTarget, damping);
    camera.lookAt(currentTarget);

    if (smoothProgress < 0.64) scene.background.copy(nightColor).lerp(redColor, THREE.MathUtils.smoothstep(smoothProgress, 0.28, 0.64));
    else scene.background.copy(redColor).lerp(goldColor, THREE.MathUtils.smoothstep(smoothProgress, 0.64, 0.89));
    scene.fog.color.copy(scene.background);
    const radioReveal = THREE.MathUtils.smoothstep(smoothProgress, 0.25, 0.43) * (1 - THREE.MathUtils.smoothstep(smoothProgress, 0.64, 0.73));
    dashGlow.intensity = 0.38 + radioReveal * 1.35;
    radioKey.intensity = radioReveal * 7.5;
    radioFill.intensity = radioReveal * 4.2;
    radioWash.intensity = radioReveal * 5.4;
    albumGlow.intensity = THREE.MathUtils.smoothstep(smoothProgress, 0.68, 0.86) * 4.0;
    const albumIn = THREE.MathUtils.smoothstep(smoothProgress, 0.69, 0.82);
    albumMaterial.opacity = albumIn;
    albumFrame.scale.setScalar(0.96 + albumIn * 0.04);
    if (smoothProgress > 0.65 && smoothProgress < 0.94) loadAlbum();
    updateWave(elapsed);
    if (!reducedMotion.matches && smoothProgress < 0.31) {
      for (const dash of roadMarkings) {
        dash.position.z -= dt * (1.4 + smoothProgress * 3.3);
        if (dash.position.z < -72) dash.position.z += 65.6;
      }
      const p = particleGeometry.attributes.position;
      for (let i = 0; i < activeParticleCount; i += 1) {
        p.array[i * 3 + 2] += dt * (0.8 + (i % 5) * 0.22);
        if (p.array[i * 3 + 2] > 2) p.array[i * 3 + 2] = -92;
      }
      p.needsUpdate = true;
      for (let i = 0; i < lampPositions.length; i += 1) {
        const pulse = 0.94 + Math.sin(elapsed * 1.1 + i) * 0.06;
        lampPositions[i].sprite.scale.setScalar(4.8 * pulse);
      }
    }
    renderer.render(scene, camera);
    const cameraSettled =
      camera.position.distanceToSquared(goalPosition) < 0.00002 &&
      currentTarget.distanceToSquared(goalTarget) < 0.00002;
    const ambientMotion =
      !reducedMotion.matches &&
      (smoothProgress < 0.31 || (smoothProgress > 0.27 && smoothProgress < 0.68));
    if (!cameraSettled || ambientMotion) frameId = requestAnimationFrame(render);
  }

  window.addEventListener("scroll", measureScroll, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("orientationchange", resize, { passive: true });
  const resizeObserver = new ResizeObserver(measureScroll);
  resizeObserver.observe(document.documentElement);
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (visible) {
      lastTime = 0;
      requestRender();
    } else {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  });
  resize();
  sampleCamera(0);
  camera.position.copy(goalPosition);
  currentTarget.copy(goalTarget);
  camera.lookAt(currentTarget);
  return {
    start() {
      measureScroll();
      requestRender();
    },
    refreshWave() {
      lastWaveUpdate = -1;
      requestRender();
    }
  };
}

syncAudioControls();
startExperience();
