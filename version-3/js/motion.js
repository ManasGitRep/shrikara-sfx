/* =========================================================
   Shrikara SFX · Motion system (version 2)
   No libraries. Runs after main.js. Only active when the
   visitor allows motion; desktop-only pieces switch on and
   off cleanly when the screen size changes.

   Modules
   1 Hero timeline          5 Mask reveal + parallax
   2 Kinetic headlines      6 Portfolio labels + cursor
   3 Gold ornament rules    7 Magnetic CTAs
   4 Pinned services story  8 Location route line
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var FX = window.ShrikaraFX || {};
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var desktopMQ = window.matchMedia("(min-width: 861px)");
  var fineMQ = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (reduceMQ.matches || !("IntersectionObserver" in window)) {
    root.classList.remove("motion-on");
    return;
  }
  root.classList.add("motion-on");

  function watch(mq, fn) { if (mq.addEventListener) mq.addEventListener("change", fn); else mq.addListener(fn); }
  function onceInView(el, cb, margin) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); cb(e); } });
    }, { rootMargin: margin || "0px 0px -18% 0px" });
    io.observe(el);
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function navH() { return parseFloat(getComputedStyle(root).getPropertyValue("--nav-h")) || 76; }

  /* ---------- 2. Word splitting (keeps the full text for screen readers) ---------- */
  function splitWords(el, baseDelay) {
    if (el.hasAttribute("data-split")) return;
    el.setAttribute("data-split", "");
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
            var wi = document.createElement("span"); wi.className = "wi"; wi.style.setProperty("--i", i++);
            if (baseDelay) wi.style.setProperty("--d", baseDelay);
            wi.textContent = part; w.appendChild(wi); frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          child.setAttribute("aria-hidden", "true");
          walk(child);
        }
      });
    })(el);
  }

  /* ---------- 1. Hero timeline ---------- */
  var heroTitle = $(".hero-title");
  if (heroTitle) splitWords(heroTitle, ".35s");

  var headings = $$(".section-head h2, .occasion-body h3, .about-copy h2, .book-intro h2, .location-copy h2, .final h2");
  headings.forEach(function (h) {
    h.setAttribute("data-words", "");
    splitWords(h);
    onceInView(h, function () { h.classList.add("is-in"); }, "0px 0px -20% 0px");
  });

  root.classList.add("motion-ready");
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add("motion-run"); }); });

  /* ---------- 3. Gold ornament rules ---------- */
  $$(".ornament-rule").forEach(function (rule) {
    onceInView(rule, function () {
      rule.classList.add("is-lit");
      setTimeout(function () {
        var r = rule.getBoundingClientRect();
        if (!FX.burst || r.bottom < 0 || r.top > window.innerHeight) return;
        var l = $(".orn-l", rule).getBoundingClientRect(), rr = $(".orn-r", rule).getBoundingClientRect();
        FX.burst(l.left + l.width * 0.12, l.top);
        FX.burst(rr.right - rr.width * 0.12, rr.top);
      }, 1250);
    });
  });

  /* ---------- 5. Mask reveal + parallax ---------- */
  $$("[data-mask-reveal]").forEach(function (el) { onceInView(el, function () { el.classList.add("is-in"); }, "0px 0px -12% 0px"); });

  var parallax = (function () {
    var items = $$(".occasion-media .par"), live = [], ticking = false, on = false;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var i = live.indexOf(e.target);
        if (e.isIntersecting && i < 0) live.push(e.target);
        if (!e.isIntersecting && i > -1) live.splice(i, 1);
      });
      request();
    });
    function frame() {
      ticking = false;
      var vh = window.innerHeight;
      live.forEach(function (el) {
        var r = el.parentNode.getBoundingClientRect();
        var p = clamp(((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2), -1, 1); // -1 … 1
        el.style.transform = "translate3d(0," + (p * 6).toFixed(2) + "%,0)";
      });
    }
    function request() { if (on && !ticking) { ticking = true; requestAnimationFrame(frame); } }
    return {
      enable: function () { if (on) return; on = true; items.forEach(function (el) { io.observe(el); }); window.addEventListener("scroll", request, { passive: true }); request(); },
      disable: function () { if (!on) return; on = false; io.disconnect(); live = []; window.removeEventListener("scroll", request); items.forEach(function (el) { el.style.transform = ""; }); }
    };
  })();

  /* ---------- 4. Pinned services story (desktop) ---------- */
  var story = (function () {
    var wrap = $("[data-fx-story]"), section = $("#effects");
    if (!wrap || !section || !FX.stage) return null;
    var itemsBox = $("[data-fx-items]", wrap), stepsBox = $("[data-fx-steps]", wrap), host = $("[data-fx-stage]", wrap),
        idxEl = $("[data-fx-index]", wrap), totEl = $("[data-fx-total]", wrap), bar = $("[data-fx-bar]", wrap),
        pin = $(".fx-story-pin", wrap), frame = null;
    var list = $$(".effects-list .effect"), n = list.length, current = -1, on = false, ticking = false, idleT = null, snapping = false;
    var pad = function (v) { return (v < 10 ? "0" : "") + v; };
    var data = list.map(function (li) {
      return {
        key: li.dataset.effect,
        photo: li.dataset.photo || "",
        num: $(".effect-num", li).textContent.trim(),
        name: $(".effect-name", li).textContent.trim().replace(/^[IVX]+/, "").trim(),
        desc: $(".effect-detail p", li).textContent.trim(),
        link: $(".effect-detail a", li)
      };
    });

    // build once
    wrap.style.setProperty("--n", n);
    totEl.textContent = pad(n);
    data.forEach(function (d, i) {
      var item = document.createElement("article");
      item.className = "fx-item"; item.inert = true;
      var k = document.createElement("p"); k.className = "fx-kicker"; k.textContent = "Effect " + d.num;
      var h = document.createElement("h3"); h.textContent = d.name;
      var p = document.createElement("p"); p.textContent = d.desc;
      var a = d.link.cloneNode(true);
      item.append(k, h, p, a);
      itemsBox.appendChild(item);
      var b = document.createElement("button");
      b.type = "button"; b.className = "fx-step"; b.textContent = pad(i + 1); b.setAttribute("aria-label", d.name);
      b.addEventListener("click", function () { go(i); });
      stepsBox.appendChild(b);
    });
    var items = $$(".fx-item", itemsBox), steps = $$(".fx-step", stepsBox);

    function metrics() {
      var r = wrap.getBoundingClientRect(), total = wrap.offsetHeight - pin.offsetHeight;
      return { top: r.top + window.scrollY - navH(), total: Math.max(1, total), p: clamp((navH() - r.top) / Math.max(1, total), 0, 1) };
    }
    function setStep(i) {
      if (i === current) return;
      var prev = current; current = i;
      items.forEach(function (el, j) {
        el.classList.toggle("is-active", j === i);
        el.classList.toggle("is-past", j < i);
        el.inert = j !== i;
      });
      steps.forEach(function (b, j) { if (j === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
      idxEl.textContent = pad(i + 1);
      var d = data[i];
      if (prev < 0) { FX.stage.set(d.key, d.name, d.photo); return; }
      frame = frame || $(".stage-frame", host);
      if (frame) frame.classList.add("is-switching");
      setTimeout(function () {
        if (current !== i) return;
        FX.stage.set(d.key, d.name, d.photo);
        if (frame) frame.classList.remove("is-switching");
      }, 220);
    }
    function update() {
      ticking = false;
      var m = metrics();
      bar.style.transform = "scaleX(" + m.p.toFixed(4) + ")";
      setStep(Math.min(n - 1, Math.floor(m.p * n)));
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
      clearTimeout(idleT);
      idleT = setTimeout(snap, 180);
    }
    function snap() {
      if (snapping) { snapping = false; return; }
      var m = metrics();
      if (m.p <= 0 || m.p >= 1) return;
      var step = m.total / n, i = Math.min(n - 1, Math.floor(m.p * n));
      var target = m.top + (i + 0.5) * step, delta = target - window.scrollY;
      if (Math.abs(delta) > 6 && Math.abs(delta) < step * 0.32) {
        snapping = true;
        window.scrollTo({ top: target, behavior: "smooth" });
      }
    }
    function go(i) {
      var m = metrics();
      window.scrollTo({ top: m.top + (i + 0.5) * (m.total / n), behavior: "smooth" });
    }
    function footerLinks(e) {
      var a = e.target.closest("[data-open-effect]");
      if (!a || !on) return;
      var i = data.map(function (d) { return d.key; }).indexOf(a.dataset.openEffect);
      if (i > -1) { e.preventDefault(); go(i); }
    }

    return {
      enable: function () {
        if (on) return; on = true;
        FX.storyActive = true;
        wrap.hidden = false;
        section.classList.add("has-story");
        FX.stage.moveTo(host);
        current = -1; update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        document.addEventListener("click", footerLinks, true);
      },
      disable: function () {
        if (!on) return; on = false;
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        document.removeEventListener("click", footerLinks, true);
        clearTimeout(idleT);
        FX.storyActive = false;
        wrap.hidden = true;
        section.classList.remove("has-story");
        var key = current > -1 ? data[current].key : data[0].key;
        if (FX.activateEffect) FX.activateEffect(key);
      }
    };
  })();

  /* ---------- 6. Portfolio labels + context cursor ---------- */
  $$(".work-track .frame").forEach(function (frame) {
    var media = $(".frame-media", frame);
    if (!media) return;
    var text = frame.dataset.label;
    if (!text) {
      var ph = $(".placeholder span", frame), cap = $(".frame-cap", frame);
      var what = ph ? ph.innerHTML.split(/<br\s*\/?>/i).pop().replace(/<[^>]*>/g, "").trim() : "";
      text = [what, cap ? cap.textContent.trim() : ""].filter(Boolean).join(" · ");
    }
    if (!text) return;
    var label = document.createElement("span");
    label.className = "frame-label"; label.setAttribute("aria-hidden", "true"); label.textContent = text;
    media.appendChild(label);
  });

  var cursor = (function () {
    var track = $("[data-track]");
    if (!track) return null;
    var el = document.createElement("div"); el.className = "cursor"; el.setAttribute("aria-hidden", "true");
    var txt = document.createElement("span"); el.appendChild(txt); document.body.appendChild(el);
    var x = 0, y = 0, tx = 0, ty = 0, visible = false, raf = 0, on = false;
    function loop() {
      x += (tx - x) * 0.2; y += (ty - y) * 0.2;
      el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      raf = visible ? requestAnimationFrame(loop) : 0;
    }
    function move(e) {
      tx = e.clientX; ty = e.clientY;
      var media = e.target.closest(".frame-media");
      txt.textContent = media && !media.classList.contains("placeholder") ? "View" : "Drag";
    }
    function enter(e) { x = tx = e.clientX; y = ty = e.clientY; visible = true; el.classList.add("is-on"); if (!raf) raf = requestAnimationFrame(loop); }
    function leave() { visible = false; el.classList.remove("is-on"); }
    return {
      enable: function () { if (on) return; on = true; track.addEventListener("pointermove", move); track.addEventListener("pointerenter", enter); track.addEventListener("pointerleave", leave); },
      disable: function () { if (!on) return; on = false; leave(); track.removeEventListener("pointermove", move); track.removeEventListener("pointerenter", enter); track.removeEventListener("pointerleave", leave); }
    };
  })();

  /* ---------- 7. Magnetic CTAs ---------- */
  var magnetic = (function () {
    var btns = $$(".btn-gold, .btn-outline"), on = false, MAX = 6;
    function move(e) {
      var b = e.currentTarget, r = b.getBoundingClientRect();
      var dx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1);
      var dy = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1);
      b.style.setProperty("--mx", (dx * MAX).toFixed(1) + "px");
      b.style.setProperty("--my", (dy * MAX * 0.6).toFixed(1) + "px");
    }
    function leave(e) { e.currentTarget.style.setProperty("--mx", "0px"); e.currentTarget.style.setProperty("--my", "0px"); }
    return {
      enable: function () { if (on) return; on = true; btns.forEach(function (b) { b.addEventListener("pointermove", move); b.addEventListener("pointerleave", leave); }); },
      disable: function () { if (!on) return; on = false; btns.forEach(function (b) { b.removeEventListener("pointermove", move); b.removeEventListener("pointerleave", leave); b.style.removeProperty("--mx"); b.style.removeProperty("--my"); }); }
    };
  })();

  /* ---------- 8. Location route line ---------- */
  var card = $(".map-card");
  if (card) onceInView(card, function () { card.classList.add("is-in"); }, "0px 0px -15% 0px");

  /* ---------- Breakpoint wiring (setup + cleanup) ---------- */
  function applyDesktop() {
    if (desktopMQ.matches) { if (story) story.enable(); parallax.enable(); }
    else { if (story) story.disable(); parallax.disable(); }
  }
  function applyPointer() {
    if (fineMQ.matches) { if (cursor) cursor.enable(); magnetic.enable(); }
    else { if (cursor) cursor.disable(); magnetic.disable(); }
  }
  applyDesktop(); applyPointer();
  watch(desktopMQ, applyDesktop);
  watch(fineMQ, applyPointer);
  watch(reduceMQ, function () { if (reduceMQ.matches) { if (story) story.disable(); parallax.disable(); if (cursor) cursor.disable(); magnetic.disable(); root.classList.remove("motion-on"); } });

  // Recalculate pinned positions once web fonts have changed the layout.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { window.dispatchEvent(new Event("resize")); });
})();
