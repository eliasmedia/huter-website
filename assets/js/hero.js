/* Huter Haustechnik – Hero-Partikelfeld
   Fließendes "Energiefeld" aus Partikeln (Anspielung auf Luft/Wärme/Energie).

   Canvas 2D mit eigener Perspektivprojektion – ersetzt die frühere three.js-Variante
   (1,24 MB Bibliothek für einen rein dekorativen Effekt). Gleiche Wellenmathematik,
   gleiche Kamera, gleicher Farbverlauf.

   Fällt bei prefers-reduced-motion oder fehlendem 2D-Kontext sauber auf den
   statischen Gradient/Fallback zurück (Canvas bleibt dann einfach leer).
*/
(function () {
  "use strict";

  var canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  /* ---- Partikelgitter ---------------------------------------------------- */
  var COLS = 96, ROWS = 46, GAP = 0.57;   // gleiche Feldgröße wie zuvor (~55 x 26 Einheiten)
  var FOV = 60, POINT = 0.055;
  var CAM_Y = 3.2, CAM_Z = 15;
  var BUCKETS = 14;                        // Farbstufen – erlaubt Batching pro Farbe

  var cRed = [0xe2, 0x37, 0x42], cCool = [0x3a, 0x46, 0x58];
  var buckets = [];                        // je Farbstufe eine Liste von Punktindizes
  for (var b = 0; b < BUCKETS; b++) {
    var m = b / (BUCKETS - 1);
    buckets.push({
      color: "rgb(" + Math.round(cRed[0] + (cCool[0] - cRed[0]) * m) + "," +
                      Math.round(cRed[1] + (cCool[1] - cRed[1]) * m) + "," +
                      Math.round(cRed[2] + (cCool[2] - cRed[2]) * m) + ")",
      idx: []
    });
  }

  var count = COLS * ROWS;
  var baseX = new Float32Array(count), baseZ = new Float32Array(count);
  var i = 0;
  for (var cx = 0; cx < COLS; cx++) {
    for (var cz = 0; cz < ROWS; cz++) {
      var px = (cx - COLS / 2) * GAP, pz = (cz - ROWS / 2) * GAP;
      baseX[i] = px; baseZ[i] = pz;
      var d = Math.min(1, Math.hypot(px, pz) / 16);
      buckets[Math.min(BUCKETS - 1, Math.round(d * (BUCKETS - 1)))].idx.push(i);
      i++;
    }
  }

  /* ---- Maus-Parallaxe ---------------------------------------------------- */
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", function (e) {
    mouse.tx = e.clientX / window.innerWidth - 0.5;
    mouse.ty = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  /* ---- Renderschleife ---------------------------------------------------- */
  var dpr = 1, w = 0, h = 0, focal = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!cw || !ch) return false;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr; canvas.height = ch * dpr;
    }
    w = canvas.width; h = canvas.height;
    focal = (h / 2) / Math.tan((FOV * Math.PI / 180) / 2);
    return true;
  }

  var sx = new Float32Array(count), sy = new Float32Array(count), sr = new Float32Array(count);
  var running = true, started = 0;

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!resize()) return;
    if (!started) started = now;
    var t = (now - started) / 1000;

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    /* Kamera schaut stets auf den Ursprung -> lookAt-Basis aufbauen */
    var ex = mouse.x * 3, ey = CAM_Y - mouse.y * 2, ez = CAM_Z;
    var fl = Math.hypot(ex, ey, ez);
    var fx = -ex / fl, fy = -ey / fl, fz = -ez / fl;          // Blickrichtung
    var rx = -fz, rz = fx;                                     // right = normalize(f × up)
    var rl = Math.hypot(rx, rz); rx /= rl; rz /= rl;
    var ux = rz * fy, uy = rz * fx - rx * fz, uz = -rx * fy;   // up = right × forward

    var rot = mouse.x * 0.35, cosR = Math.cos(rot), sinR = Math.sin(rot);

    for (var k = 0; k < count; k++) {
      var bx = baseX[k], bz = baseZ[k];
      var py = Math.sin(bx * 0.35 + t * 0.9) * 0.9 +
               Math.cos(bz * 0.4 + t * 0.7) * 0.7 +
               Math.sin((bx + bz) * 0.2 + t * 0.5) * 0.5;

      var wx = bx * cosR + bz * sinR;                          // Rotation um Y
      var wz = -bx * sinR + bz * cosR;

      var dx = wx - ex, dy = py - ey, dz = wz - ez;
      var zc = dx * fx + dy * fy + dz * fz;                    // Tiefe in Kamerarichtung
      if (zc <= 0.1) { sr[k] = 0; continue; }
      var xc = dx * rx + dz * rz;
      var yc = dx * ux + dy * uy + dz * uz;

      var inv = focal / zc;
      sx[k] = w / 2 + xc * inv;
      sy[k] = h / 2 - yc * inv;
      sr[k] = Math.max(dpr * 0.7, POINT * inv);                // sizeAttenuation
    }

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.9;
    for (var bi = 0; bi < BUCKETS; bi++) {
      var list = buckets[bi].idx;
      ctx.fillStyle = buckets[bi].color;
      for (var j = 0; j < list.length; j++) {
        var p = list[j], r = sr[p];
        if (!r) continue;
        ctx.fillRect(sx[p], sy[p], r, r);
      }
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  document.addEventListener("visibilitychange", function () {
    var wasRunning = running;
    running = !document.hidden;
    if (running && !wasRunning) { started = 0; requestAnimationFrame(frame); }
  });

  requestAnimationFrame(frame);
})();
