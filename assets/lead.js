/* Quote form -> Eye To Ad lead server. Honeypot + 3 s timer + consent record. No PII in URLs. */
(function () {
  "use strict";
  var LEAD = "https://clients.eyetoad.com/lead/send.php";
  var form = document.getElementById("quote");
  if (!form) { return; }
  var shown = Date.now();
  var t = form.querySelector("input[name=_t]");
  if (t) { t.value = String(shown); }
  var msg = document.getElementById("form-msg");
  var btn = form.querySelector("button[type=submit]");

  function say(text, bad) {
    msg.textContent = text;
    msg.className = bad ? "form-msg bad" : "form-msg";
    msg.focus();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    if (String(fd.get("_honey") || "").trim()) { form.reset(); say("Thanks. We got your request."); return; }
    if (Date.now() - shown < 3000) { say("Please take a moment to check your details, then send again.", true); return; }
    var digits = String(fd.get("phone") || "").replace(/\D+/g, "");
    if (digits.length === 11 && digits.charAt(0) === "1") { digits = digits.slice(1); }
    if (!String(fd.get("name") || "").trim() || digits.length !== 10) { say("Please enter your name and a 10-digit phone number.", true); return; }
    var consent = form.querySelector("input[name=consent]");
    if (!consent || !consent.checked) { say("Please tick the consent box so we can pass your request to movers.", true); return; }
    var ctext = document.getElementById("consent-text");
    fd.set("consent", "yes");
    fd.append("consent_text", ctext ? ctext.textContent.replace(/\s+/g, " ").trim() : "");
    fd.append("consent_at", new Date().toISOString());
    fd.append("site", location.hostname.replace(/^www\./, ""));
    fd.append("page", location.pathname.slice(0, 200));
    fd.append("_subject", "New lead - " + location.hostname.replace(/^www\./, ""));
    btn.disabled = true;
    btn.textContent = "Sending…";
    fetch(LEAD, { method: "POST", body: fd, headers: { "Accept": "application/json" }, credentials: "omit", referrerPolicy: "strict-origin-when-cross-origin" })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) { throw new Error(j.message || "send failed"); } return j; }); })
      .then(function () {
        form.reset();
        form.hidden = true;
        var done = document.getElementById("form-done");
        done.hidden = false;
        done.focus();
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.textContent = btn.getAttribute("data-label");
        say((err && err.message && err.message.indexOf("10-digit") > -1) ? err.message : "Sorry, that didn't go through. Please try again, or email zach@eyetoad.com if it keeps failing.", true);
      });
  });
})();
