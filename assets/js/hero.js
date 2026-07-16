/* Huter Haustechnik – three.js Hero
   Fließendes "Energiefeld" aus Partikeln (Anspielung auf Luft/Wärme/Energie).
   Lädt three.js per CDN. Fällt bei reduced-motion oder fehlendem WebGL sauber auf den
   statischen Gradient/Fallback zurück (Canvas bleibt dann einfach leer/unsichtbar).
*/
const canvas = document.getElementById("hero-canvas");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas && !reduce) {
  import("./vendor/three.module.js")
    .then((THREE) => init(THREE))
    .catch(() => { /* WebGL nicht verfügbar → Fallback-Gradient bleibt */ });
}

function init(THREE) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 3.2, 15);
  camera.lookAt(0, 0, 0);

  // Partikel-Gitter als flächiges Feld
  const COLS = 130, ROWS = 60, GAP = 0.42;
  const count = COLS * ROWS;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const base = new Float32Array(count * 2); // x,z Ausgangslage

  const cRed = new THREE.Color(0xe23742);
  const cCool = new THREE.Color(0x3a4658);
  let i = 0;
  for (let x = 0; x < COLS; x++) {
    for (let z = 0; z < ROWS; z++) {
      const px = (x - COLS / 2) * GAP;
      const pz = (z - ROWS / 2) * GAP;
      positions[i * 3] = px;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = pz;
      base[i * 2] = px; base[i * 2 + 1] = pz;
      // Farbverlauf: rot in der Mitte, kühl nach außen
      const d = Math.min(1, Math.hypot(px, pz) / 16);
      const col = cRed.clone().lerp(cCool, d);
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
      i++;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.055, vertexColors: true, transparent: true, opacity: 0.9,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // sanfte Maus-Parallaxe
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5);
    mouse.ty = (e.clientY / window.innerHeight - 0.5);
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener("resize", resize);

  const pos = geo.attributes.position.array;
  let running = true;
  document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) loop(); });

  const clock = new THREE.Clock();
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    resize();
    const t = clock.getElapsedTime();

    // fließende Wellen (überlagerte Sinusfunktionen)
    for (let k = 0; k < count; k++) {
      const bx = base[k * 2], bz = base[k * 2 + 1];
      pos[k * 3 + 1] =
        Math.sin(bx * 0.35 + t * 0.9) * 0.9 +
        Math.cos(bz * 0.4 + t * 0.7) * 0.7 +
        Math.sin((bx + bz) * 0.2 + t * 0.5) * 0.5;
    }
    geo.attributes.position.needsUpdate = true;

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    points.rotation.y = mouse.x * 0.35;
    camera.position.x = mouse.x * 3;
    camera.position.y = 3.2 - mouse.y * 2;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  resize();
  loop();
}
