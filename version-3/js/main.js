/* =========================================================
   Shrikara SFX · interface and motion
   No libraries. Every animation respects reduced motion.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var CFG = window.SHRIKARA || {};
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var REDUCED = reduceMQ.matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  root.classList.add("anim-ok");
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add("intro-run"); }); });

  /* Shared hooks for js/motion.js */
  var FX = window.ShrikaraFX = {};

  /* ---------- Small helpers ---------- */
  function sizeCanvas(cv) {
    var r = cv.getBoundingClientRect();
    cv.width = Math.max(1, Math.round(r.width * DPR));
    cv.height = Math.max(1, Math.round(r.height * DPR));
    var ctx = cv.getContext("2d");
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { w: r.width, h: r.height, ctx: ctx };
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function onVisible(el, cb, opts) {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting, e); }); }, opts || {}).observe(el);
  }
  function sparkColor(life, alpha) {
    // white-hot core cooling to gold then ember
    var g = Math.round(150 + 100 * life), b = Math.round(40 + 150 * Math.max(0, life - 0.55));
    return "rgba(255," + g + "," + b + "," + alpha + ")";
  }

  /* ---------- Navigation ---------- */
  var nav = $("[data-nav]");
  function navState() { nav.classList.toggle("is-solid", window.scrollY > 40); }
  navState();
  window.addEventListener("scroll", navState, { passive: true });

  var menuBtn = $("[data-menu-toggle]"), menu = $("[data-menu]");
  function setMenu(open) {
    menuBtn.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) { var first = $("a", menu); if (first) first.focus(); }
  }
  menuBtn.addEventListener("click", function () { setMenu(menuBtn.getAttribute("aria-expanded") !== "true"); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); }
  });
  window.addEventListener("resize", function () { if (window.innerWidth > 860 && !menu.hidden) setMenu(false); });

  /* ---------- Hero: cinematic sparkular show ----------
     Opening: a gold shell bursts behind the headline, then four
     sparkular fountains build to full height with rising embers
     and a warm light bloom. The show lasts ~9 s and stops (no
     perpetual loop). It fires again briefly when the visitor
     returns to the top or points at "Plan Your Event". */
  (function heroShow() {
    var cv = $("[data-fountains]");
    if (!cv || REDUCED) return;
    var hero = cv.parentNode;
    var bloom = document.createElement("div");
    bloom.className = "hero-bloom"; bloom.setAttribute("aria-hidden", "true");
    hero.insertBefore(bloom, cv);

    var s = sizeCanvas(cv), parts = [], running = false, visible = true, opened = false;
    var t0 = performance.now(), showStart = t0 + 450, showEnd = t0 + 9500, level = 0, flash = 0, MAX = 2600;
    window.addEventListener("resize", function () { s = sizeCanvas(cv); });
    var mobile = function () { return s.w < 720; };

    function shell(x, y, n, speed) {
      for (var i = 0; i < n; i++) {
        var a = (i / n) * 6.283 + rand(-0.04, 0.04), v = rand(0.55, 1) * speed;
        parts.push({ k: 2, x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, d: rand(0.008, 0.013), r: rand(1, 1.9) });
      }
      for (var j = 0; j < n / 3; j++) parts.push({ k: 3, x: x + rand(-40, 40), y: y + rand(-30, 30), vx: rand(-1.4, 1.4), vy: rand(-1.4, 0.6), life: 1, d: rand(0.012, 0.02), r: rand(0.6, 1.2), tw: rand(0, 6.28) });
      flash = 1;
    }
    function spawn(k) {
      if (parts.length > (mobile() ? 1400 : MAX)) return;
      var xs = mobile() ? [0.02, 0.98] : [0.035, 0.1, 0.9, 0.965];
      var power = s.h * (mobile() ? 0.0158 : 0.0178);
      xs.forEach(function (fx, j) {
        var inner = xs.length === 4 && (j === 1 || j === 2);
        var lean = mobile() ? 0 : (fx < 0.5 ? 0.18 : -0.18), spread = mobile() ? 0.4 : 0.75;
        var n = Math.round((mobile() ? 7 : 8) * k);
        for (var i = 0; i < n; i++) {
          parts.push({ k: 0, x: s.w * fx + rand(-5, 5), y: s.h + 2,
            vx: rand(-spread, spread) + lean * (inner ? 1.6 : 1), vy: -rand(0.8, 1) * power * (inner ? 0.86 : 1) * (0.8 + 0.2 * k),
            life: 1, d: rand(0.0055, 0.011), r: rand(0.7, 2.1) });
        }
      });
      if (Math.random() < 0.55 * k) parts.push({ k: 1, x: rand(0.05, 0.95) * s.w, y: s.h + 4, vx: rand(-0.35, 0.35), vy: -rand(0.7, 1.8), life: 1, d: rand(0.0025, 0.005), r: rand(0.8, 2), tw: rand(0, 6.28) });
    }
    function tick(now) {
      if (!running) return;
      var target = 0;
      if (now > showStart && now < showEnd) target = Math.min(1, (now - showStart) / 700, (showEnd - now) / 1400);
      level += (target - level) * 0.08;
      if (level > 0.02) spawn(level);
      if (!opened && now - t0 > 1050) { opened = true; shell(s.w / 2, s.h * (mobile() ? 0.17 : 0.2), mobile() ? 110 : 170, s.h * (mobile() ? 0.008 : 0.0095)); }
      flash *= 0.9;
      bloom.style.opacity = Math.min(1, 0.55 * level + 0.7 * flash).toFixed(3);

      var c = s.ctx;
      c.globalCompositeOperation = "source-over";
      c.clearRect(0, 0, s.w, s.h);
      c.globalCompositeOperation = "lighter";
      c.lineCap = "round";
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        if (p.k === 0) { p.vy += 0.1; p.vx *= 0.994; }
        else if (p.k === 1) { p.vx += Math.sin(now * 0.002 + p.tw) * 0.01; }
        else if (p.k === 2) { p.vx *= 0.975; p.vy = p.vy * 0.975 + 0.045; }
        else { p.vy += 0.02; }
        p.x += p.vx; p.y += p.vy; p.life -= p.d;
        if (p.life <= 0 || p.y > s.h + 8) { parts.splice(i, 1); continue; }
        if (p.k === 0 || p.k === 2) {
          var tail = p.k === 0 ? 2.4 : 3.2;
          c.strokeStyle = sparkColor(p.life, p.life * 0.14); c.lineWidth = p.r * 4;          // glow
          c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * tail, p.y - p.vy * tail); c.stroke();
          c.strokeStyle = sparkColor(p.life, Math.min(1, p.life * 1.1)); c.lineWidth = p.r;   // core
          c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * tail, p.y - p.vy * tail); c.stroke();
        } else {
          var tw = p.k === 3 ? (0.4 + 0.6 * Math.abs(Math.sin(now * 0.03 + p.tw))) : (0.6 + 0.4 * Math.sin(now * 0.006 + p.tw));
          c.fillStyle = p.k === 3 ? "rgba(255,250,235," + (p.life * tw) + ")" : sparkColor(p.life, p.life * 0.7 * tw);
          c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
        }
      }
      if (now > showEnd && !parts.length && flash < 0.01) {
        running = false; c.clearRect(0, 0, s.w, s.h); bloom.style.opacity = "0"; return;
      }
      requestAnimationFrame(tick);
    }
    function start() { if (!running && visible && !document.hidden) { running = true; requestAnimationFrame(tick); } }
    function encore(ms) {
      var now = performance.now();
      if (now < showEnd - 400) { showEnd = Math.max(showEnd, now + ms); return; }
      showStart = now; showEnd = now + ms; start();
    }
    FX.heroEncore = encore;

    var seenAway = false;
    onVisible(cv, function (vis) {
      visible = vis;
      if (!vis) { seenAway = true; running = false; return; }
      if (seenAway) { seenAway = false; encore(3200); } else start();
    });
    document.addEventListener("visibilitychange", function () { if (document.hidden) running = false; else start(); });
    var cta = $(".hero .btn-gold");
    if (cta && window.matchMedia("(hover: hover)").matches) cta.addEventListener("mouseenter", function () { encore(2600); });
    start();
  })();

  /* ---------- Burst layer (end of each spark rule) ---------- */
  var burst = (function () {
    var cv = $("[data-burst]");
    if (!cv || REDUCED) return function () {};
    var s = sizeCanvas(cv), parts = [], active = false;
    window.addEventListener("resize", function () { s = sizeCanvas(cv); });
    function tick() {
      var c = s.ctx;
      c.globalCompositeOperation = "source-over";
      c.clearRect(0, 0, s.w, s.h);
      c.globalCompositeOperation = "lighter";
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.vx *= 0.97; p.life -= p.d;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        c.fillStyle = sparkColor(p.life, p.life);
        c.beginPath(); c.arc(p.x, p.y, p.r * p.life + 0.3, 0, 6.283); c.fill();
      }
      if (parts.length) requestAnimationFrame(tick); else { active = false; c.clearRect(0, 0, s.w, s.h); }
    }
    return function (x, y) {
      for (var i = 0; i < 34; i++) {
        var a = rand(-Math.PI, 0.25), v = rand(0.8, 3.4);
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, d: rand(0.015, 0.03), r: rand(0.8, 1.8) });
      }
      if (!active) { active = true; requestAnimationFrame(tick); }
    };
  })();

  FX.burst = burst;
  FX.reduced = REDUCED;

  /* ---------- Scroll reveals ---------- */
  $$(".spark-rule").forEach(function (rule) {
    onVisible(rule, function (vis) {
      if (!vis || rule.classList.contains("is-lit")) return;
      rule.classList.add("is-lit");
      var line = rule.firstElementChild;
      setTimeout(function () {
        var r = line.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) burst(r.right - r.width * 0.1, r.top);
      }, 950);
    }, { rootMargin: "0px 0px -18% 0px" });
  });
  $$("[data-reveal], [data-track]").forEach(function (el) {
    onVisible(el, function (vis) { if (vis) el.classList.add("is-in"); }, { rootMargin: "0px 0px -12% 0px" });
  });

  /* ---------- Effects: list + illustrated stage ---------- */
  var Stage = (function () {
    var fig = $("[data-stage]"), cv = $("[data-stage-canvas]"), label = $("[data-stage-label]"),
        note = $("[data-stage-note]"), photo = $("[data-stage-photo]"), home = $("[data-stage-home]");
    if (!fig) return null;
    var s, mode = "pyro", parts = [], running = false, visible = false, t = 0, flash = 0, MAX = 2600;
    var GOLDS = ["#e2b75c", "#f6e3b0", "#c9973f", "#fff3d1", "#a8742a"], CONF = ["#e2b75c", "#f3e6c4", "#c9973f", "#7a2a2c", "#fff6dc", "#b8862f"];

    function resize() { s = sizeCanvas(cv); }
    function floorY() { return s.h * 0.86; }
    function scale() { return s.h / 420; }

    var emit = {
      fountain: function (x, power, n, spread, life) {
        if (parts.length > MAX) return;
        for (var i = 0; i < n; i++) parts.push({ k: "spark", x: x + rand(-2.5, 2.5), y: floorY(), vx: rand(-spread, spread), vy: -rand(0.85, 1) * power, life: 1, d: rand(0.007, 0.014) / (life || 1), r: rand(0.7, 1.8), g: 0.075 });
      },
      crackle: function (x, y, n) {
        for (var i = 0; i < n; i++) parts.push({ k: "glint", x: x + rand(-14, 14), y: y + rand(-14, 14), vx: rand(-0.8, 0.8), vy: rand(-0.8, 0.4), life: 1, d: rand(0.03, 0.06), r: rand(0.6, 1.3), tw: rand(0, 6.28) });
      },
      vapour: function (x, n, big) {
        if (parts.length > MAX) return;
        for (var i = 0; i < n; i++) parts.push({ k: "vapour", x: x + rand(-4, 4), y: floorY(), vx: rand(-0.7, 0.7), vy: -rand(6.5, 10) * scale() * (big || 1), life: 1, d: rand(0.011, 0.018), r: rand(5, 11), grow: rand(0.8, 1.6) });
      },
      confetti: function (x, n, angle) {
        for (var i = 0; i < n; i++) {
          var a = (angle || -Math.PI / 2) + rand(-0.55, 0.55), v = rand(6, 12) * scale();
          parts.push({ k: "conf", x: x, y: floorY(), vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, d: rand(0.0022, 0.0036), rot: rand(0, 6.28), vr: rand(-0.25, 0.25), w: rand(4, 9), h: rand(2, 4.5), c: CONF[(Math.random() * CONF.length) | 0], ph: rand(0, 6.28), foil: Math.random() < 0.35 });
        }
      },
      smoke: function (n, high) {
        for (var i = 0; i < n; i++) parts.push({ k: "smoke", x: rand(-0.1, 1.1) * s.w, y: floorY() - rand(0, high ? s.h * 0.35 : 22), vx: rand(-0.3, 0.3), vy: rand(-0.07, 0.02), life: 1, d: rand(0.0018, 0.0035), r: rand(36, 82) * s.w / 420 });
      },
      rocket: function (x) {
        parts.push({ k: "rocket", x: (x || rand(0.2, 0.8)) * s.w, y: floorY(), vx: rand(-0.5, 0.5), vy: -rand(6.8, 8.2) * scale(), life: 1, d: 0, r: 1.5, burstAt: rand(0.1, 0.3) * s.h, type: (Math.random() * 3) | 0 });
      },
      shell: function (x, y, type) {
        var n = type === 1 ? 90 : 120, sp = (type === 1 ? 2.2 : 3) * scale();
        for (var i = 0; i < n; i++) {
          var a = (i / n) * 6.283 + rand(-0.06, 0.06), v = rand(0.7, 1) * sp;
          parts.push({ k: "star", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1,
            d: type === 1 ? rand(0.005, 0.008) : rand(0.009, 0.014), r: type === 1 ? 1 : 1.5, hue: type === 2 ? "white" : "gold", g: type === 1 ? 0.045 : 0.03, trail: type === 1 });
        }
        if (type === 2) for (var j = 0; j < 40; j++) emit.crackle(x + rand(-50, 50), y + rand(-50, 50), 1);
        flash = Math.min(1, flash + 0.75);
      }
    };

    /* light beams through haze (stage + smoke) */
    function beams(c, strength) {
      var fy = floorY();
      [0.22, 0.78].forEach(function (bx, i) {
        var sway = Math.sin(t * 0.012 + i * 2.1) * 0.22;
        var x0 = s.w * bx, x1 = s.w * (0.5 + sway), half = s.w * 0.13;
        var g = c.createLinearGradient(x0, 0, x1, fy);
        g.addColorStop(0, "rgba(255,215,140," + (0.22 * strength) + ")");
        g.addColorStop(1, "rgba(255,215,140,0)");
        c.fillStyle = g;
        c.beginPath(); c.moveTo(x0 - 3, 0); c.lineTo(x0 + 3, 0); c.lineTo(x1 + half, fy); c.lineTo(x1 - half, fy); c.closePath(); c.fill();
      });
    }

    var modes = {
      pyro: function () {
        var p = s.h * 0.027;
        emit.fountain(s.w * 0.16, p * 0.86, 5, 0.75);
        emit.fountain(s.w * 0.36, p, 7, 0.6);
        emit.fountain(s.w * 0.64, p, 7, 0.6);
        emit.fountain(s.w * 0.84, p * 0.86, 5, 0.75);
        if (t % 9 === 0) emit.crackle(s.w * (Math.random() < 0.5 ? 0.36 : 0.64), s.h * rand(0.08, 0.3), 4);
      },
      sparkular: function () {
        var c = t % 240, n = 7, p = s.h * 0.022;
        for (var i = 0; i < n; i++) {
          var on = c < 120 ? Math.abs(((c / 6) % (n * 2)) - i * 2) < 3 : c < 220;   // chase, then all together
          if (on) emit.fountain(s.w * (0.1 + i * (0.8 / (n - 1))), p * (c >= 120 ? 1.08 : 0.9), 3, 0.4);
        }
        if (c === 120) flash = 0.6;
      },
      co2: function () {
        var c = t % 100;
        if (c === 0) flash = 0.55;
        if (c < 30) [0.12, 0.31, 0.5, 0.69, 0.88].forEach(function (x, i) { emit.vapour(s.w * x, i === 2 ? 5 : 3, i === 2 ? 1.15 : 1); });
      },
      confetti: function () {
        var c = t % 200;
        if (c === 1) { emit.confetti(s.w * 0.3, 200, -Math.PI / 2 + 0.25); emit.confetti(s.w * 0.7, 200, -Math.PI / 2 - 0.25); emit.vapour(s.w * 0.3, 8); emit.vapour(s.w * 0.7, 8); flash = 0.8; }
      },
      smoke: function () { if (t % 3 === 0) emit.smoke(1, false); },
      fireworks: function () {
        if (t % 42 === 1) emit.rocket();
        if (t % 126 === 64) { emit.rocket(0.3); emit.rocket(0.7); }
      },
      stage: function () {
        var c = t % 300, p = s.h * 0.024;
        if (t % 5 === 0) emit.smoke(1, true);
        if (c < 170) { emit.fountain(s.w * 0.1, p, 4, 0.45); emit.fountain(s.w * 0.9, p, 4, 0.45); }
        if (c > 60 && c < 150 && c % 2 === 0) { emit.fountain(s.w * 0.32, p * 0.8, 2, 0.35); emit.fountain(s.w * 0.68, p * 0.8, 2, 0.35); }
        if (c === 180) flash = 0.6;
        if (c > 180 && c < 202) { emit.vapour(s.w * 0.38, 3); emit.vapour(s.w * 0.62, 3); }
        if (c === 230) { emit.confetti(s.w * 0.5, 160); flash = 0.7; }
      }
    };
    var hazy = { smoke: 1, stage: 0.8 };

    function step() {
      t++;
      modes[mode]();
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        if (p.k === "spark" || p.k === "star") {
          p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= 0.995;
          if (p.k === "star") { p.vx *= 0.982; p.vy *= 0.982; if (p.trail && t % 3 === 0 && p.life > 0.3) parts.push({ k: "spark", x: p.x, y: p.y, vx: 0, vy: 0.3, life: p.life * 0.5, d: 0.04, r: 0.7, g: 0.01 }); }
        }
        else if (p.k === "glint") { p.x += p.vx; p.y += p.vy; p.vy += 0.02; }
        else if (p.k === "vapour") { p.x += p.vx; p.y += p.vy; p.vy *= 0.94; p.r += p.grow; }
        else if (p.k === "conf") { p.vy += 0.075; p.vx *= 0.975; p.vy *= 0.975; if (p.vy > 0) { p.vy = Math.min(p.vy, 0.95); p.x += Math.sin(t * 0.06 + p.ph) * 0.7; } p.x += p.vx; p.y += p.vy; p.rot += p.vr; }
        else if (p.k === "smoke") { p.x += p.vx; p.y += p.vy; p.r += 0.14; }
        else if (p.k === "rocket") {
          p.x += p.vx; p.y += p.vy; p.vy += 0.045;
          if (t % 2 === 0) parts.push({ k: "spark", x: p.x, y: p.y, vx: rand(-0.3, 0.3), vy: rand(0.2, 0.8), life: 0.7, d: 0.035, r: 0.9, g: 0.02 });
          if (p.y <= p.burstAt || p.vy >= 0) { emit.shell(p.x, p.y, p.type); p.life = 0; }
        }
        p.life -= p.d;
        if (p.life <= 0 || p.y > s.h + 20 || (p.k === "spark" && p.y > floorY() + 1 && p.vy > 0)) parts.splice(i, 1);
      }
      flash *= 0.9;
    }

    function draw() {
      var c = s.ctx, fy = floorY(), energy = Math.min(1, parts.length / 900);
      c.globalCompositeOperation = "source-over";
      c.clearRect(0, 0, s.w, s.h);

      // stage floor light, brighter with activity
      var g = c.createLinearGradient(0, fy - 70, 0, s.h);
      var fa = 0.05 + 0.2 * energy + 0.25 * flash;
      g.addColorStop(0, "rgba(226,183,92,0)"); g.addColorStop(0.55, "rgba(226,183,92," + fa.toFixed(3) + ")"); g.addColorStop(1, "rgba(226,183,92,0)");
      c.fillStyle = g; c.fillRect(0, fy - 70, s.w, s.h - fy + 70);
      c.fillStyle = "rgba(226,183,92,0.6)"; c.fillRect(s.w * 0.05, fy, s.w * 0.9, 1);

      if (hazy[mode]) { c.globalCompositeOperation = "lighter"; beams(c, hazy[mode]); c.globalCompositeOperation = "source-over"; }

      // smoke & vapour
      parts.forEach(function (p) {
        if (p.k !== "smoke" && p.k !== "vapour") return;
        var a = p.k === "smoke" ? Math.min(1, (1 - p.life) * 4) * p.life * (mode === "stage" ? 0.15 : 0.2) : p.life * 0.5;
        var col = p.k === "smoke" ? "240,222,190" : "240,236,228";
        var rg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        rg.addColorStop(0, "rgba(" + col + "," + a.toFixed(3) + ")"); rg.addColorStop(1, "rgba(" + col + ",0)");
        c.fillStyle = rg; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
      });
      // confetti (foil pieces glint as they turn)
      parts.forEach(function (p) {
        if (p.k !== "conf") return;
        var turn = Math.cos(p.rot * 2);
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(1, turn);
        c.globalAlpha = Math.min(1, p.life * 1.5);
        c.fillStyle = p.foil && Math.abs(turn) > 0.85 ? "#fff8e2" : p.c;
        c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore();
      });
      c.globalAlpha = 1;

      // sparks and stars, with glow
      c.globalCompositeOperation = "lighter";
      c.lineCap = "round";
      parts.forEach(function (p) {
        if (p.k === "spark") {
          c.strokeStyle = sparkColor(p.life, p.life * 0.13); c.lineWidth = p.r * 4;
          c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2); c.stroke();
          c.strokeStyle = sparkColor(p.life, Math.min(1, p.life * 1.1)); c.lineWidth = p.r;
          c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2); c.stroke();
        } else if (p.k === "star") {
          var col = p.hue === "gold" ? sparkColor(p.life, p.life) : "rgba(255,248,230," + p.life + ")";
          c.fillStyle = p.hue === "gold" ? sparkColor(p.life, p.life * 0.15) : "rgba(255,248,230," + (p.life * 0.15) + ")";
          c.beginPath(); c.arc(p.x, p.y, p.r * 3.2, 0, 6.283); c.fill();
          c.fillStyle = col; c.beginPath(); c.arc(p.x, p.y, p.r * (0.5 + p.life), 0, 6.283); c.fill();
        } else if (p.k === "glint") {
          var a = p.life * (0.4 + 0.6 * Math.abs(Math.sin(t * 0.5 + p.tw)));
          c.fillStyle = "rgba(255,252,240," + a + ")"; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
        } else if (p.k === "rocket") {
          c.fillStyle = "rgba(255,230,170,0.95)"; c.beginPath(); c.arc(p.x, p.y, 2, 0, 6.283); c.fill();
        }
      });
      // camera flash on big moments
      if (flash > 0.02) {
        var fl = c.createRadialGradient(s.w / 2, s.h * 0.45, 0, s.w / 2, s.h * 0.45, s.w * 0.75);
        fl.addColorStop(0, "rgba(255,225,160," + (0.28 * flash).toFixed(3) + ")"); fl.addColorStop(1, "rgba(255,225,160,0)");
        c.fillStyle = fl; c.fillRect(0, 0, s.w, s.h);
      }
      c.globalCompositeOperation = "source-over";
    }

    function loop() {
      if (!running) return;
      step(); draw();
      requestAnimationFrame(loop);
    }
    function sync() {
      var should = visible && !document.hidden && !REDUCED;
      if (should && !running) { running = true; requestAnimationFrame(loop); }
      if (!should) running = false;
    }
    function still() {          // reduced motion: draw one settled frame
      parts = []; t = 0;
      for (var i = 0; i < (mode === "confetti" ? 60 : mode === "fireworks" ? 95 : 70); i++) step();
      flash = 0; draw();
    }

    resize();
    window.addEventListener("resize", function () { resize(); if (REDUCED) still(); });
    onVisible(cv, function (vis) { visible = vis; sync(); });
    document.addEventListener("visibilitychange", sync);

    return {
      set: function (key, name, photoSrc) {
        mode = modes[key] ? key : "pyro"; parts = []; t = 0; flash = 0;
        label.textContent = name;
        if (photoSrc) { photo.src = photoSrc; photo.alt = name; photo.hidden = false; cv.hidden = true; note.textContent = ""; }
        else { photo.hidden = true; cv.hidden = false; note.textContent = "Illustration"; }
        if (REDUCED) still();
      },
      moveTo: function (slot) {
        var target = slot || home;
        if (fig.parentNode !== target) { target.appendChild(fig); resize(); if (REDUCED) still(); }
      }
    };
  })();

  FX.stage = Stage;

  (function effects() {
    var list = $("[data-effects]");
    if (!list) return;
    var items = $$(".effect", list), mobileMQ = window.matchMedia("(max-width: 860px)"), current = items[0];

    function activate(li, focusName) {
      current = li;
      items.forEach(function (it) {
        var on = it === li, btn = $(".effect-name", it), det = $(".effect-detail", it);
        btn.setAttribute("aria-expanded", String(on));
        det.hidden = !on;
      });
      var name = $(".effect-name", li).textContent.trim().replace(/^[IVX]+/, "").trim();
      if (Stage && !FX.storyActive) {
        Stage.set(li.dataset.effect, name, li.dataset.photo || "");
        Stage.moveTo(mobileMQ.matches ? $("[data-slot]", li) : null);
      }
      if (focusName) $(".effect-name", li).focus();
    }
    items.forEach(function (li) {
      var btn = $(".effect-name", li);
      btn.addEventListener("click", function () { activate(li); });
      btn.addEventListener("keydown", function (e) {
        var i = items.indexOf(li);
        if (e.key === "ArrowDown") { e.preventDefault(); activate(items[Math.min(items.length - 1, i + 1)], true); }
        if (e.key === "ArrowUp") { e.preventDefault(); activate(items[Math.max(0, i - 1)], true); }
      });
    });
    (mobileMQ.addEventListener ? mobileMQ.addEventListener("change", function () { activate(current); }) : mobileMQ.addListener(function () { activate(current); }));
    $$("[data-open-effect]").forEach(function (a) {
      a.addEventListener("click", function () {
        var li = $('.effect[data-effect="' + a.dataset.openEffect + '"]');
        if (li) activate(li);
      });
    });
    activate(items[0]);
    FX.activateEffect = function (key) { var li = $('.effect[data-effect="' + key + '"]'); if (li) activate(li); };
  })();

  /* ---------- Work gallery ---------- */
  (function gallery() {
    var wrap = $("[data-gallery]");
    if (!wrap) return;
    var track = $("[data-track]", wrap), frames = $$(".frame", track),
        prev = $("[data-prev]", wrap), next = $("[data-next]", wrap),
        cur = $("[data-count-current]", wrap), tot = $("[data-count-total]", wrap);
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    tot.textContent = pad(frames.length);

    function index() {
      var left = track.scrollLeft, best = 0, bestD = Infinity, base = frames[0].offsetLeft;
      frames.forEach(function (f, i) { var d = Math.abs(f.offsetLeft - base - left); if (d < bestD) { bestD = d; best = i; } });
      return best;
    }
    function update() {
      var i = index();
      cur.textContent = pad(i + 1);
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }
    function go(dir) {
      var i = Math.max(0, Math.min(frames.length - 1, index() + dir));
      track.scrollTo({ left: frames[i].offsetLeft - frames[0].offsetLeft, behavior: REDUCED ? "auto" : "smooth" });
    }
    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });
    track.addEventListener("scroll", function () { window.requestAnimationFrame(update); }, { passive: true });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });
    window.addEventListener("resize", update);
    update();

    // mouse drag (touch uses native scrolling)
    var down = false, startX = 0, startL = 0, moved = false;
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startL = track.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) { moved = true; track.classList.add("is-dragging"); }
      if (moved) track.scrollLeft = startL - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!down) return;
      down = false;
      if (moved) { track.classList.remove("is-dragging"); go(0); }
    });
    track.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

    // lightbox for real photos and videos
    var lb = $("[data-lightbox]"), body = $("[data-lightbox-body]");
    function open(node) {
      body.innerHTML = "";
      body.appendChild(node);
      if (lb.showModal) lb.showModal(); else lb.setAttribute("open", "");
    }
    function close() {
      var v = $("video", body); if (v) v.pause();
      if (lb.close) lb.close(); else lb.removeAttribute("open");
      body.innerHTML = "";
    }
    $("[data-lightbox-close]").addEventListener("click", close);
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    lb.addEventListener("close", function () { body.innerHTML = ""; });
    track.addEventListener("click", function (e) {
      var media = e.target.closest(".frame-media");
      if (!media || media.classList.contains("placeholder")) return;
      if (media.dataset.video) {
        var v = document.createElement("video");
        v.src = media.dataset.video; v.controls = true; v.autoplay = true; v.playsInline = true;
        open(v);
      } else {
        var img = $("img", media); if (!img) return;
        var big = document.createElement("img"); big.src = img.currentSrc || img.src; big.alt = img.alt;
        open(big);
      }
    });
    // make real media keyboard-openable
    frames.forEach(function (f) {
      var m = $(".frame-media", f);
      if (m && !m.classList.contains("placeholder") && m.tagName !== "BUTTON") { m.tabIndex = 0; m.setAttribute("role", "button"); m.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); m.click(); } }); }
    });

    // ember cursor (desktop mouse only, cosmetic)
    var ember = $("[data-ember]");
    if (ember && !REDUCED && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      var ex = 0, ey = 0, tx = 0, ty = 0, on = false;
      track.addEventListener("pointerenter", function () { on = true; ember.classList.add("is-on"); loop(); });
      track.addEventListener("pointerleave", function () { on = false; ember.classList.remove("is-on"); });
      track.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; });
      function loop() {
        ex += (tx - ex) * 0.22; ey += (ty - ey) * 0.22;
        ember.style.transform = "translate(" + ex + "px," + ey + "px)";
        if (on) requestAnimationFrame(loop);
      }
    }
  })();

  /* ---------- Mobile booking bar: hide over the form ---------- */
  (function mobileBar() {
    var bar = $("[data-mobile-book]"), book = $("#book"), foot = $(".footer");
    if (!bar || !book) return;
    var hideFor = { book: false, foot: false };
    function apply() { bar.classList.toggle("is-hidden", hideFor.book || hideFor.foot); }
    onVisible(book, function (v) { hideFor.book = v; apply(); });
    onVisible(foot, function (v) { hideFor.foot = v; apply(); });
  })();

  /* ---------- Map embed (optional) ---------- */
  (function map() {
    $$("[data-maps-link]").forEach(function (a) { if (CFG.mapsLink) a.href = CFG.mapsLink; });
    var slot = $("[data-map-slot]");
    if (!slot || !CFG.mapEmbedSrc) return;
    var card = slot.innerHTML;
    var f = document.createElement("iframe");
    f.src = CFG.mapEmbedSrc; f.title = "Shrikara SFX office on Google Maps";
    f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade"; f.allowFullscreen = true;
    f.addEventListener("error", function () { slot.innerHTML = card; });
    slot.innerHTML = ""; slot.appendChild(f);
  })();

  /* ---------- Misc ---------- */
  var y = $("[data-year]"); if (y) y.textContent = String(new Date().getFullYear());
  $$("img").forEach(function (img) {
    img.addEventListener("error", function () {
      var fm = img.closest(".frame-media");
      if (fm) { fm.classList.add("placeholder"); fm.innerHTML = "<span>Image unavailable</span>"; }
      else img.style.visibility = "hidden";
    });
  });
})();
