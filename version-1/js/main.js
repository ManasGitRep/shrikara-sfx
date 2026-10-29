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

  /* ---------- Hero sparkular fountains ---------- */
  (function heroFountains() {
    var cv = $("[data-fountains]");
    if (!cv || REDUCED) return;
    var s = sizeCanvas(cv), parts = [], running = false, t0 = performance.now();
    window.addEventListener("resize", function () { s = sizeCanvas(cv); });
    function spawn(now) {
      var ramp = Math.min(1, (now - t0 - 700) / 900);           // start after headline lands
      if (ramp <= 0) return;
      var xs = s.w < 720 ? [0.06, 0.94] : [0.08, 0.92];
      var power = s.h * (s.w < 720 ? 0.0105 : 0.0125);
      xs.forEach(function (fx) {
        for (var i = 0; i < 4; i++) {
          parts.push({ x: s.w * fx + rand(-4, 4), y: s.h + 2, vx: rand(-0.55, 0.55), vy: -rand(0.75, 1) * power * ramp,
            life: 1, d: rand(0.006, 0.013), r: rand(0.6, 1.6) });
        }
      });
    }
    function tick(now) {
      if (!running) return;
      spawn(now);
      var c = s.ctx;
      c.globalCompositeOperation = "source-over";
      c.clearRect(0, 0, s.w, s.h);
      c.globalCompositeOperation = "lighter";
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.09; p.vx *= 0.995; p.life -= p.d;
        if (p.life <= 0 || p.y > s.h + 6) { parts.splice(i, 1); continue; }
        c.strokeStyle = sparkColor(p.life, p.life * 0.9);
        c.lineWidth = p.r;
        c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2); c.stroke();
      }
      requestAnimationFrame(tick);
    }
    onVisible(cv, function (vis) {
      var was = running; running = vis && !document.hidden;
      if (running && !was) requestAnimationFrame(tick);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) running = false;
    });
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
    var s, mode = "pyro", parts = [], running = false, visible = false, t = 0, timers = {};

    function resize() { s = sizeCanvas(cv); }
    function floorY() { return s.h * 0.84; }

    var emit = {
      fountain: function (x, power, n, spread) {
        for (var i = 0; i < n; i++) parts.push({ k: "spark", x: x + rand(-2, 2), y: floorY(), vx: rand(-spread, spread), vy: -rand(0.85, 1) * power, life: 1, d: rand(0.008, 0.016), r: rand(0.6, 1.5), g: 0.07 });
      },
      vapour: function (x, n) {
        for (var i = 0; i < n; i++) parts.push({ k: "vapour", x: x + rand(-3, 3), y: floorY(), vx: rand(-0.5, 0.5), vy: -rand(5.5, 8.5) * s.h / 420, life: 1, d: rand(0.012, 0.02), r: rand(4, 9), grow: rand(0.5, 1.1) });
      },
      confetti: function (n) {
        var cols = ["#e2b75c", "#f3e6c4", "#c9973f", "#7a2a2c", "#fff6dc"];
        for (var i = 0; i < n; i++) {
          var a = rand(-Math.PI * 0.82, -Math.PI * 0.18), v = rand(5, 10) * s.h / 420;
          parts.push({ k: "conf", x: s.w * 0.5, y: floorY(), vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, d: rand(0.0025, 0.004), rot: rand(0, 6.28), vr: rand(-0.2, 0.2), w: rand(4, 8), h: rand(2, 4), c: cols[(Math.random() * cols.length) | 0], ph: rand(0, 6.28) });
        }
      },
      smoke: function (n, high) {
        for (var i = 0; i < n; i++) parts.push({ k: "smoke", x: rand(-0.1, 1.1) * s.w, y: floorY() - rand(0, high ? s.h * 0.25 : 18), vx: rand(-0.25, 0.25), vy: rand(-0.06, 0.02), life: 1, d: rand(0.002, 0.004), r: rand(30, 70) * s.w / 420 });
      },
      rocket: function () {
        parts.push({ k: "rocket", x: rand(0.25, 0.75) * s.w, y: floorY(), vx: rand(-0.4, 0.4), vy: -rand(6.2, 7.6) * s.h / 420, life: 1, d: 0, r: 1.4, burstAt: rand(0.14, 0.32) * s.h });
      },
      shell: function (x, y) {
        var n = 70, hue = Math.random() < 0.7 ? "gold" : "white";
        for (var i = 0; i < n; i++) {
          var a = (i / n) * 6.283 + rand(-0.05, 0.05), v = rand(2.1, 2.8) * s.h / 420;
          parts.push({ k: "star", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, d: rand(0.011, 0.016), r: 1.3, hue: hue, g: 0.03 });
        }
      }
    };

    var modes = {
      pyro: function () { if (t % 1 === 0) { var p = s.h * 0.026; emit.fountain(s.w * 0.3, p, 4, 0.5); emit.fountain(s.w * 0.7, p, 4, 0.5); } },
      sparkular: function () {
        var on = (t % 150) < 95, p = s.h * 0.02;
        if (on) for (var i = 0; i < 5; i++) emit.fountain(s.w * (0.14 + i * 0.18), p, 2, 0.35);
      },
      co2: function () {
        var c = t % 110;
        if (c < 26) { emit.vapour(s.w * 0.22, 3); emit.vapour(s.w * 0.5, 3); emit.vapour(s.w * 0.78, 3); }
      },
      confetti: function () { if (t % 210 === 1) emit.confetti(170); },
      smoke: function () { if (t % 6 === 0) emit.smoke(2, false); },
      fireworks: function () { if (t % 70 === 1) emit.rocket(); },
      stage: function () {
        if (t % 9 === 0) emit.smoke(1, true);
        var p = s.h * 0.022;
        if ((t % 240) < 140) { emit.fountain(s.w * 0.12, p, 2, 0.4); emit.fountain(s.w * 0.88, p, 2, 0.4); }
        if ((t % 240) > 170 && (t % 240) < 186) emit.vapour(s.w * 0.5, 4);
      }
    };

    function step() {
      t++;
      modes[mode]();
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        if (p.k === "spark" || p.k === "star") { p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= 0.995; if (p.k === "star") { p.vx *= 0.985; p.vy *= 0.985; } }
        else if (p.k === "vapour") { p.x += p.vx; p.y += p.vy; p.vy *= 0.95; p.r += p.grow; }
        else if (p.k === "conf") { p.vy += 0.07; p.vx *= 0.975; p.vy *= 0.975; if (p.vy > 0) { p.vy = Math.min(p.vy, 0.9); p.x += Math.sin(t * 0.06 + p.ph) * 0.6; } p.x += p.vx; p.y += p.vy; p.rot += p.vr; }
        else if (p.k === "smoke") { p.x += p.vx; p.y += p.vy; p.r += 0.12; }
        else if (p.k === "rocket") { p.x += p.vx; p.y += p.vy; p.vy += 0.045; if (t % 2 === 0) parts.push({ k: "spark", x: p.x, y: p.y, vx: rand(-0.3, 0.3), vy: rand(0.2, 0.8), life: 0.6, d: 0.03, r: 0.8, g: 0.02 }); if (p.y <= p.burstAt || p.vy >= 0) { emit.shell(p.x, p.y); p.life = 0; } }
        p.life -= p.d;
        if (p.life <= 0 || p.y > s.h + 20 || (p.k === "spark" && p.y > floorY() + 1 && p.vy > 0)) parts.splice(i, 1);
      }
    }

    function draw() {
      var c = s.ctx, fy = floorY();
      c.globalCompositeOperation = "source-over";
      c.clearRect(0, 0, s.w, s.h);
      // stage floor glow + hairline
      var g = c.createLinearGradient(0, fy - 40, 0, s.h);
      g.addColorStop(0, "rgba(226,183,92,0)"); g.addColorStop(0.5, "rgba(226,183,92,0.06)"); g.addColorStop(1, "rgba(226,183,92,0)");
      c.fillStyle = g; c.fillRect(0, fy - 40, s.w, s.h - fy + 40);
      c.fillStyle = "rgba(226,183,92,0.55)"; c.fillRect(s.w * 0.06, fy, s.w * 0.88, 1);
      // smoke & vapour (normal blend)
      parts.forEach(function (p) {
        if (p.k !== "smoke" && p.k !== "vapour") return;
        var a = p.k === "smoke" ? Math.min(1, (1 - p.life) * 4) * p.life * 0.16 : p.life * 0.42;
        var rg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        rg.addColorStop(0, "rgba(236,230,218," + a + ")"); rg.addColorStop(1, "rgba(236,230,218,0)");
        c.fillStyle = rg; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
      });
      // confetti
      parts.forEach(function (p) {
        if (p.k !== "conf") return;
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(1, Math.cos(p.rot * 2));
        c.globalAlpha = Math.min(1, p.life * 1.5); c.fillStyle = p.c; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore();
      });
      c.globalAlpha = 1;
      // sparks (additive)
      c.globalCompositeOperation = "lighter";
      parts.forEach(function (p) {
        if (p.k === "spark") {
          c.strokeStyle = sparkColor(p.life, p.life * 0.95); c.lineWidth = p.r;
          c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 2, p.y - p.vy * 2); c.stroke();
        } else if (p.k === "star") {
          c.fillStyle = p.hue === "gold" ? sparkColor(p.life, p.life) : "rgba(255,248,230," + p.life + ")";
          c.beginPath(); c.arc(p.x, p.y, p.r * (0.4 + p.life), 0, 6.283); c.fill();
        } else if (p.k === "rocket") {
          c.fillStyle = "rgba(255,230,170,0.95)"; c.beginPath(); c.arc(p.x, p.y, 1.8, 0, 6.283); c.fill();
        }
      });
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
      draw();
    }

    resize();
    window.addEventListener("resize", function () { resize(); if (REDUCED) still(); });
    onVisible(cv, function (vis) { visible = vis; sync(); });
    document.addEventListener("visibilitychange", sync);

    return {
      set: function (key, name, photoSrc) {
        mode = modes[key] ? key : "pyro"; parts = []; t = 0;
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
      if (Stage) {
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
