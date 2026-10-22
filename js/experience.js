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
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
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
audio?.addEventListener("play", syncAudioControls);
audio?.addEventListener("pause", syncAudioControls);
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
    antialias: window.innerWidth > 700,
    alpha: false,
    powerPreference: "high-performance"
  });
  const mobile = window.matchMedia("(max-width: 720px)");
  const quality = () => mobile.matches ? 1.2 : 1.65;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality()));
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
  const mat = (color, roughness = 0.55, metalness = 0.08, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  const addMesh = (geometry, material, parent, position, rotation) => {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(...position);
    if (rotation) item.rotation.set(...rotation);
    parent.add(item);
    return item;
  };

  scene.add(new THREE.HemisphereLight(0x6d7683, 0x111014, 1.05));
  const cabinFill = new THREE.PointLight(0xd47b42, 4.0, 15, 2);
  cabinFill.position.set(0, 2.6, 0.5);
  scene.add(cabinFill);
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
    new THREE.MeshBasicMaterial({ color: 0xffc98c, toneMapped: false }),
    new THREE.MeshBasicMaterial({ color: 0xf3584d, toneMapped: false }),
    new THREE.MeshBasicMaterial({ color: 0xb6c7d5, toneMapped: false })
  ];
  let seed = 383;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let side of [-1, 1]) {
    for (let i = 0; i < 12; i += 1) {
      const width = 2.4 + random() * 4.4;
      const height = 3.8 + random() * 15;
      const depth = 3 + random() * 6;
      const x = side * (3.6 + random() * 5.8);
      const z = -12 - i * 5.8 - random() * 3;
      addMesh(new THREE.BoxGeometry(width, height, depth), cityMats[i % cityMats.length], world, [x, height / 2 - 0.7, z]);
      const count = 5 + Math.floor(random() * 5);
      for (let w = 0; w < count; w += 1) {
        const wx = x + (random() - 0.5) * width * 0.72;
        const wy = 0.15 + random() * (height * 0.78);
        const glow = addMesh(new THREE.PlaneGeometry(0.12 + random() * 0.16, 0.08 + random() * 0.18), windowMats[Math.floor(random() * windowMats.length)], world, [wx, wy, z + depth / 2 + 0.012]);
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
      const x = side * 4.4;
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
  addMesh(new THREE.BoxGeometry(9.0, 0.72, 1.55), leather, cabin, [0, 1.0, -3.16]);
  addMesh(new THREE.BoxGeometry(8.8, 0.28, 1.42), dashLeather, cabin, [0, 1.42, -3.2]);
  addMesh(new THREE.BoxGeometry(8.9, 0.035, 1.3), mat(0x303036, 0.72, 0.025), cabin, [0, 1.574, -3.22]);
  const stack = addMesh(new THREE.BoxGeometry(3.24, 2.7, 0.58), dashLeather, cabin, [0, 1.43, -3.04]);
  stack.rotation.x = -0.055;
  addMesh(new THREE.BoxGeometry(2.7, 0.7, 0.72), leather, cabin, [2.75, 0.96, -3.18]);
  addMesh(new THREE.BoxGeometry(0.92, 0.035, 0.045), brushed, cabin, [2.72, 1.0, -2.81]);
  addMesh(new THREE.BoxGeometry(2.6, 0.18, 0.38), soft, cabin, [-3.08, 1.79, -2.72]);

  // Twin instrument dials stay visible above the steering wheel.
  const dialCenters = [-3.53, -2.63];
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
  const wheel = addMesh(new THREE.TorusGeometry(0.62, 0.082, 12, 56), mat(0x363236, 0.53, 0.035), cabin, [-3.1, 1.25, -1.78]);
  wheel.rotation.y = 0.04;
  addMesh(new THREE.CylinderGeometry(0.16, 0.16, 0.28, 24), brushed, cabin, [-3.1, 1.25, -1.78], [Math.PI / 2, 0, 0]);
  for (const angle of [0.5, 2.6, 4.7]) {
    const spoke = addMesh(new THREE.BoxGeometry(0.055, 0.5, 0.055), brushed, cabin, [-3.1, 1.25, -1.82]);
    spoke.rotation.z = angle;
  }
  addMesh(new THREE.BoxGeometry(2.1, 0.05, 0.06), brushed, cabin, [-3.1, 1.25, -1.96]);
  addMesh(new THREE.BoxGeometry(1.9, 0.22, 2.0), leather, cabin, [0, 0.34, -1.62]);
  addMesh(new THREE.BoxGeometry(0.84, 0.12, 0.6), brushed, cabin, [0, 0.49, -1.32]);
  addMesh(new THREE.CylinderGeometry(0.075, 0.1, 0.48, 16), soft, cabin, [0, 0.72, -1.28], [0.12, 0, 0]);
  addMesh(new THREE.SphereGeometry(0.105, 16, 12), mat(0x4a4641, 0.42, 0.08), cabin, [0, 0.99, -1.25]);

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
  addRoundedPanel(2.48, 2.40, 0.19, 0.42, 0.055, mat(0x494640, 0.32, 0.48), [0, 0, 0]);
  addRoundedPanel(2.34, 2.26, 0.16, 0.075, 0.018, mat(0x15161a, 0.5, 0.2), [0, 0, 0.215]);
  addRoundedPanel(2.22, 2.14, 0.13, 0.035, 0.008, mat(0x292a2e, 0.56, 0.16), [0, 0, 0.268]);

  // A backlit, glass-fronted display sits in a rounded metal bezel.
  addRoundedPanel(1.79, 1.10, 0.085, 0.105, 0.035, mat(0x67615a, 0.26, 0.52), [0, 0.08, 0.275]);
  addRoundedPanel(1.65, 0.96, 0.055, 0.035, 0.012, mat(0x080a0d, 0.23, 0.08, { emissive: 0x090d13, emissiveIntensity: 0.5 }), [0, 0.08, 0.338]);
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 1200;
  screenCanvas.height = 680;
  const screenContext = screenCanvas.getContext("2d");
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  function drawRadioScreen() {
    screenContext.fillStyle = "#080b0f";
    screenContext.fillRect(0, 0, 1200, 680);
    const glow = screenContext.createLinearGradient(0, 0, 1200, 680);
    glow.addColorStop(0, "#1a2022");
    glow.addColorStop(0.52, "#0b1013");
    glow.addColorStop(1, "#1c1711");
    screenContext.fillStyle = glow;
    screenContext.fillRect(0, 0, 1200, 680);
    screenContext.textAlign = "center";
    screenContext.fillStyle = "rgba(240,190,130,.96)";
    screenContext.font = "700 40px Arial, sans-serif";
    screenContext.letterSpacing = "7px";
    screenContext.fillText("TAELON 383", 600, 80);
    screenContext.fillStyle = "#f5f0e7";
    screenContext.font = "900 96px Arial, sans-serif";
    screenContext.letterSpacing = "2px";
    screenContext.fillText("LOW LOW", 600, 165);
    screenContext.fillStyle = "rgba(238,222,199,.83)";
    screenContext.font = "600 36px Arial, sans-serif";
    screenContext.letterSpacing = "6px";
    screenContext.fillText("OHNE ANSAGE", 600, 255);
  }
  drawRadioScreen();
  screenTexture.needsUpdate = true;
  const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false });
  const screenFace = addMesh(new THREE.PlaneGeometry(1.65, 0.96), screenMaterial, radio, [0, 0.08, 0.382]);
  screenFace.renderOrder = 3;
  const waveformCanvas = document.createElement("canvas");
  waveformCanvas.width = 768;
  waveformCanvas.height = 144;
  const waveformContext = waveformCanvas.getContext("2d");
  const waveformTexture = new THREE.CanvasTexture(waveformCanvas);
  waveformTexture.colorSpace = THREE.SRGBColorSpace;
  waveformTexture.generateMipmaps = false;
  waveformTexture.minFilter = THREE.LinearFilter;
  waveformTexture.magFilter = THREE.LinearFilter;
  const waveformMaterial = new THREE.MeshBasicMaterial({ map: waveformTexture, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const waveform = addMesh(new THREE.PlaneGeometry(1.5, 0.28), waveformMaterial, radio, [0, 0.05, 0.416]);
  waveform.renderOrder = 5;

  // Machined knobs, vents, climate keys, and the hazard switch sit on a front-lit fascia.
  const knobMetal = mat(0x9a8e7d, 0.28, 0.52);
  for (const [x, radius] of [[-1.03, 0.145], [1.03, 0.132]]) {
    addMesh(new THREE.CylinderGeometry(radius, radius * 1.04, 0.12, 32), mat(0x414044, 0.3, 0.42), radio, [x, 0.08, 0.305], [Math.PI / 2, 0, 0]);
    const ring = addMesh(new THREE.TorusGeometry(radius * 0.86, 0.014, 8, 36), knobMetal, radio, [x, 0.08, 0.371]);
    ring.renderOrder = 2;
    addMesh(new THREE.BoxGeometry(0.018, radius * 0.36, 0.018), mat(0xf0c37b, 0.25, 0.3, { emissive: 0x513419, emissiveIntensity: 0.4 }), radio, [x, 0.08 + radius * 0.55, 0.374]);
  }
  addMesh(new THREE.BoxGeometry(1.68, 0.24, 0.06), mat(0x101114, 0.72, 0.24), radio, [0, 0.87, 0.32]);
  for (let i = 0; i < 7; i += 1) {
    addMesh(new THREE.BoxGeometry(1.46, 0.014, 0.018), mat(0x76716b, 0.45, 0.35), radio, [0, 0.78 + i * 0.029, 0.362]);
  }
  for (let i = 0; i < 6; i += 1) {
    const x = -0.51 + i * 0.204;
    addRoundedPanel(0.14, 0.075, 0.022, 0.045, 0.008, mat(0x29282a, 0.28, 0.58), [x, -0.73, 0.28]);
    addMesh(new THREE.BoxGeometry(0.028, 0.012, 0.012), mat(i === 2 ? 0xf1bd79 : 0xa7a0a1, 0.25, 0.45, { emissive: i === 2 ? 0x5b3214 : 0x151515, emissiveIntensity: 0.28 }), radio, [x, -0.73, 0.316]);
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
  const particleCount = mobile.matches ? 110 : 210;
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

  const cameraKeys = [
    { p: 0, position: [-1.0, 2.05, 10.5], target: [-1.0, 0.6, -15], fov: 51, mobile: { fov: 53 } },
    { p: 0.18, position: [-0.45, 1.95, 5.1], target: [0, 1.0, -7.0], fov: 50 },
    { p: 0.34, position: [0, 1.76, 4.45], target: [0, 1.5, -2.86], fov: 46, mobile: { position: [0.24, 1.76, 4.45], fov: 52 } },
    { p: 0.49, position: [0, 1.66, 2.0], target: [0, 1.54, -2.86], fov: 35, mobile: { position: [0.85, 1.66, 2.0], fov: 60 } },
    { p: 0.62, position: [0, 1.66, 2.0], target: [0, 1.54, -2.86], fov: 35, mobile: { position: [0.85, 1.66, 2.0], fov: 60 } },
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

  function measureScroll() {
    viewportHeight = window.innerHeight;
    scrollSpan = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
    exactProgress = Math.min(1, Math.max(0, window.scrollY / scrollSpan));
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality()));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    measureScroll();
  }
  let lastWaveUpdate = -1;
  function updateBars(time) {
    if (analyser && frequencyData) analyser.getByteFrequencyData(frequencyData);
    const p = exactProgress;
    waveform.visible = p > 0.27 && p < 0.72;
    if (!waveform.visible) return;
    if (reducedMotion.matches && lastWaveUpdate >= 0) return;
    if (!reducedMotion.matches && time - lastWaveUpdate < 1 / 30) return;
    lastWaveUpdate = time;
    const playing = audio && !audio.paused && !audio.ended;
    const count = 48;
    const baseY = 116;
    waveformContext.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    const gradient = waveformContext.createLinearGradient(0, 0, waveformCanvas.width, 0);
    gradient.addColorStop(0, "#bd8150");
    gradient.addColorStop(0.48, "#ffe0ad");
    gradient.addColorStop(1, "#d58a54");
    waveformContext.save();
    waveformContext.shadowColor = playing ? "rgba(244,177,103,.84)" : "rgba(244,177,103,.48)";
    waveformContext.shadowBlur = playing ? 14 : 7;
    waveformContext.fillStyle = gradient;
    for (let i = 0; i < count; i += 1) {
      const binIndex = Math.min((frequencyData?.length || 1) - 1, Math.floor(i / count * (frequencyData?.length || 1)));
      const spectrum = playing && frequencyData ? Math.pow(frequencyData[binIndex] / 255, 0.72) : 0;
      const idlePulse = reducedMotion.matches ? 0 : Math.abs(Math.sin(time * 1.4 + i * 0.31)) * 25;
      const musicPulse = playing && !reducedMotion.matches ? Math.abs(Math.sin(time * 7.4 - i * 0.18)) * 14 : 0;
      const height = Math.min(92, 30 + idlePulse + spectrum * 68 + musicPulse);
      const x = 10 + i * 15.8;
      waveformContext.fillRect(x, baseY - height, 8, height);
      waveformContext.globalAlpha = 0.18;
      waveformContext.fillRect(x, baseY + 4, 8, height * 0.24);
      waveformContext.globalAlpha = 1;
    }
    waveformContext.shadowBlur = 0;
    waveformContext.fillStyle = "rgba(244,190,132,.74)";
    waveformContext.fillRect(8, baseY, waveformCanvas.width - 16, 2);
    waveformContext.restore();
    waveformTexture.needsUpdate = true;
  }
  function render(now) {
    if (!visible) {
      frameId = 0;
      return;
    }
    frameId = requestAnimationFrame(render);
    const dt = Math.min(0.05, Math.max(0.001, (now - (lastTime || now)) / 1000));
    lastTime = now;
    elapsed += dt;
    smoothProgress = exactProgress;
    document.body.classList.toggle("radio-focus", smoothProgress > 0.45 && smoothProgress < 0.66);
    sampleCamera(smoothProgress);
    const damping = reducedMotion.matches ? 1 : 1 - Math.exp(-12 * dt);
    camera.position.lerp(goalPosition, damping);
    currentTarget.lerp(goalTarget, damping);
    camera.lookAt(currentTarget);

    const nightColor = new THREE.Color(0x0d1118);
    const redColor = new THREE.Color(0x10090e);
    const goldColor = new THREE.Color(0x100e0d);
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
    updateBars(elapsed);
    if (!reducedMotion.matches && smoothProgress < 0.31) {
      for (const dash of roadMarkings) {
        dash.position.z -= dt * (1.4 + smoothProgress * 3.3);
        if (dash.position.z < -72) dash.position.z += 65.6;
      }
      const p = particleGeometry.attributes.position;
      for (let i = 0; i < particleCount; i += 1) {
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
      if (!frameId) frameId = requestAnimationFrame(render);
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
      frameId = requestAnimationFrame(render);
    }
  };
}

syncAudioControls();
startExperience();
