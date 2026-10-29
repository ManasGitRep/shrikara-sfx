/* =========================================================
   Shrikara SFX · enquiry form → WhatsApp (wa.me click-to-chat)
   Nothing is sent to any server. The visitor reviews and sends
   the message inside WhatsApp.
   ========================================================= */
(function () {
  "use strict";

  var CFG = window.SHRIKARA || {};
  var form = document.querySelector("[data-enquiry]");
  if (!form) return;

  var BRAND = CFG.brandName || "Shrikara SFX";
  var contacts = (CFG.contacts || []).filter(function (c) { return c && /^\d{10}$/.test(c.phone); });
  var DRAFT_KEY = "shrikara-enquiry-draft";
  var $ = function (s) { return form.querySelector(s); };
  var status = $("[data-status]"), summary = $("[data-error-summary]"), submitBtn = $("[data-submit]");

  function fmtPhone(p) { return "+91 " + p.slice(0, 5) + " " + p.slice(5); }

  /* ---------- Contact choice ---------- */
  var contactField = $("[data-contact-field]"), optionsBox = $("[data-contact-options]");
  if (contacts.length <= 1) {
    contactField.hidden = true;
  } else {
    contacts.forEach(function (c, i) {
      var id = "f-contact-" + i;
      var label = document.createElement("label");
      label.className = "contact-opt";
      label.setAttribute("for", id);
      label.innerHTML = '<input type="radio" name="contact" id="' + id + '" value="' + i + '"><span><b></b><small></small></span>';
      label.querySelector("b").textContent = c.name;
      label.querySelector("small").textContent = fmtPhone(c.phone);
      optionsBox.appendChild(label);
    });
  }

  /* ---------- Budget (only when ranges are configured) ---------- */
  var budgets = CFG.budgetRanges || [];
  if (budgets.length) {
    var sel = $("#f-budget");
    budgets.forEach(function (b) { var o = document.createElement("option"); o.textContent = b; sel.appendChild(o); });
    $("[data-budget-field]").hidden = false;
  }

  /* ---------- Date: no past dates ---------- */
  var d = new Date(), pad = function (n) { return (n < 10 ? "0" : "") + n; };
  $("#f-date").min = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());

  /* ---------- Draft: keep answers if the visitor navigates away and back ---------- */
  function saveDraft() {
    try {
      var data = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name) return;
        if (el.type === "checkbox") { (data[el.name] = data[el.name] || []); if (el.checked) data[el.name].push(el.value); }
        else if (el.type === "radio") { if (el.checked) data[el.name] = el.value; }
        else data[el.name] = el.value;
      });
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch (e) { /* storage unavailable: ignore */ }
  }
  function loadDraft() {
    var data;
    try { data = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { data = null; }
    if (!data) return;
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || !(el.name in data)) return;
      if (el.type === "checkbox") el.checked = (data[el.name] || []).indexOf(el.value) > -1;
      else if (el.type === "radio") el.checked = data[el.name] === el.value;
      else el.value = data[el.name];
    });
  }
  loadDraft();
  form.addEventListener("input", saveDraft);
  form.addEventListener("change", saveDraft);

  /* ---------- Pre-fill from "Enquire for this" / "Plan a wedding" links ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-service], [data-event]");
    if (!a) return;
    if (a.dataset.service) {
      Array.prototype.forEach.call(form.querySelectorAll('input[name="services"]'), function (cb) {
        if (cb.value === a.dataset.service) cb.checked = true;
      });
    }
    if (a.dataset.event) $("#f-event").value = a.dataset.event;
    saveDraft();
  });

  /* ---------- Validation ---------- */
  function normalisePhone(raw) {
    var digits = String(raw || "").replace(/\D/g, "");
    if (digits.length === 12 && digits.indexOf("91") === 0) digits = digits.slice(2);
    if (digits.length === 11 && digits.charAt(0) === "0") digits = digits.slice(1);
    return /^[6-9]\d{9}$/.test(digits) ? digits : null;
  }
  function setError(input, errEl, msg) {
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    errEl.textContent = msg || "";
    errEl.hidden = !msg;
  }
  var rules = [
    { el: "#f-name", err: "#e-name", test: function (v) { return v.trim().length >= 2 ? "" : "Enter your name."; } },
    { el: "#f-phone", err: "#e-phone", test: function (v) { return normalisePhone(v) ? "" : "Enter a 10-digit Indian mobile number, for example 98765 43210."; } },
    { el: "#f-event", err: "#e-event", test: function (v) { return v ? "" : "Choose the type of event."; } },
    { el: "#f-city", err: "#e-city", test: function (v) { return v.trim().length >= 2 ? "" : "Enter the city or venue for your event."; } }
  ];
  function checkField(r) {
    var input = $(r.el), msg = r.test(input.value);
    setError(input, $(r.err), msg);
    return msg;
  }
  rules.forEach(function (r) {
    var input = $(r.el);
    input.addEventListener("blur", function () { if (input.value) checkField(r); });
    input.addEventListener("input", function () { if (input.getAttribute("aria-invalid") === "true") checkField(r); });
  });
  function chosenContact() {
    if (contacts.length === 1) return contacts[0];
    var r = form.querySelector('input[name="contact"]:checked');
    return r ? contacts[+r.value] : null;
  }

  /* ---------- Message ---------- */
  function buildMessage() {
    var v = function (s) { return ($(s).value || "").trim(); };
    var services = Array.prototype.filter.call(form.querySelectorAll('input[name="services"]'), function (c) { return c.checked; })
      .map(function (c) { return c.value; });
    var date = v("#f-date"), dateText = "";
    if (date) {
      var p = date.split("-");
      var dt = new Date(+p[0], +p[1] - 1, +p[2]);
      dateText = dt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", weekday: "short" });
    }
    var lines = [
      "Hello " + BRAND + ",",
      "",
      "I would like to enquire about your event services.",
      ""
    ];
    var add = function (label, val) { if (val) lines.push(label + ": " + val); };
    add("Name", v("#f-name"));
    add("Contact Number", fmtPhone(normalisePhone(v("#f-phone"))));
    add("Event Type", v("#f-event"));
    add("Event Date", dateText);
    add("Event Location", v("#f-city"));
    add("Services Required", services.join(", "));
    add("Budget", v("#f-budget"));
    add("Additional Requirements", v("#f-notes"));
    lines.push("", "Please contact me to discuss availability and details.", "", "Thank you.");
    return lines.join("\n");
  }
  // exposed for testing and for anyone extending the form
  window.ShrikaraEnquiry = { buildMessage: buildMessage, normalisePhone: normalisePhone };

  /* ---------- Submit ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = "";
    var errors = [];
    rules.forEach(function (r) { var m = checkField(r); if (m) errors.push({ el: $(r.el), msg: m }); });

    var contact = chosenContact(), cErr = $("#e-contact");
    if (!contact) {
      var msg = "Choose who should receive your enquiry.";
      setError(null, cErr, msg);
      errors.push({ el: form.querySelector('input[name="contact"]'), msg: msg });
    } else setError(null, cErr, "");

    if (errors.length) {
      summary.textContent = errors.length === 1 ? "Please fix 1 field before continuing." : "Please fix " + errors.length + " fields before continuing.";
      summary.hidden = false;
      if (errors[0].el) errors[0].el.focus();
      return;
    }
    summary.hidden = true;

    var url = "https://wa.me/91" + contact.phone + "?text=" + encodeURIComponent(buildMessage());
    submitBtn.setAttribute("aria-busy", "true");
    status.textContent = "Opening WhatsApp…";

    var win = null;
    try { win = window.open(url, "_blank"); } catch (err) { win = null; }
    if (win) { try { win.opener = null; } catch (err) { /* cross-origin: ignore */ } }
    else {
      // Popup blocked or not supported (some in-app browsers): open in this tab.
      // The draft is saved, so the form is still filled in if they come back.
      window.location.href = url;
    }

    setTimeout(function () {
      submitBtn.removeAttribute("aria-busy");
      status.innerHTML = "";
      status.append("WhatsApp should now be open with your message. Tap Send to reach " + contact.name + ". Didn't open? ");
      var a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Try again";
      status.append(a, " or call ");
      var t = document.createElement("a"); t.href = "tel:+91" + contact.phone; t.textContent = fmtPhone(contact.phone);
      status.append(t, ".");
    }, 900);
  });
})();
