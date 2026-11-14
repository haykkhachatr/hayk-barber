// Hayk V. barber card: scroll reveals, sticky dock, 3D-coverflow haircut carousel, booking form (SMS + calendar file),
// map + navigation, copy / share, scissors cut, and the 3D pole.
// Everything here is progressive: without JS the page is still a complete, tappable card (call, SMS, save, map links).
import "./look.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const C = window.CARD || {};
const T = C.t || {};
const fmt = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] == null ? "" : o[k]));
// iPhones, iPads (incl. "desktop-class" iPadOS): Apple Maps, and `sms:` wants & instead of ? before body=
const apple = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const smsHref = (body) => `sms:${C.tel}${apple ? "&" : "?"}body=${encodeURIComponent(body)}`;

/* ---------- toast + clipboard + share ---------- */
const toastEl = $("#toast");
let toastTimer = 0;
function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("on"), 1900);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall back below */ }
  const ta = document.createElement("textarea");
  ta.value = text; ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (_) { /* ignore */ }
  ta.remove();
  return ok;
}
$$("[data-copy]").forEach((b) => b.addEventListener("click", async () => toast((await copy(b.dataset.copy)) ? T.copied : T.copyFail)));
$$("[data-share]").forEach((b) => b.addEventListener("click", async () => {
  const url = location.href.split("#")[0];
  const data = {
    title: fmt(T.shareTitle, { who: C.who, role: C.role }),
    text: fmt(T.shareText, { shop: C.shop, addr: C.addr, phone: C.phoneDisplay }),
    url,
  };
  if (navigator.share) {
    try { await navigator.share(data); return; } catch (e) { if (e && e.name === "AbortError") return; }
  }
  toast((await copy(url)) ? T.linkCopied : T.copyFail);
}));

/* ---------- scroll reveals + the scissors line ---------- */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add(e.target.classList.contains("cut") ? "go" : "in");
    io.unobserve(e.target);
  }
}, { threshold: 0.18 });
$$(".reveal, .cut").forEach((el) => io.observe(el));

/* ---------- sticky dock: slides up once the hero buttons are out of sight ---------- */
const dock = $("#dock"), cta = $("#cta");
if (dock && cta) {
  new IntersectionObserver(([e]) => {
    dock.classList.toggle("on", !e.isIntersecting && e.boundingClientRect.top < 0);
  }).observe(cta);
}

/* ---------- haircut carousel: native scroll-snap + 3D coverflow transforms ---------- */
(function gallery() {
  const track = $("#track");
  if (!track) return;
  const slides = $$(".slide", track);
  const prev = $(".arrow.prev"), next = $(".arrow.next");
  const dots = $$("#dots button");
  const ci = $("#ci"), cname = $("#cname"), chy = $("#chy"), cds = $("#cds"), want = $("#want"), hint = $("#hint");
  let idx = 0, raf = 0, touched = false;

  const gap = () => parseFloat(getComputedStyle(track).columnGap) || 14;
  const target = (i) => slides[i].offsetLeft - (track.clientWidth - slides[i].offsetWidth) / 2;
  const go = (i, smooth = true) => {
    i = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: target(i), behavior: smooth && !reduce ? "smooth" : "auto" });
  };

  function paint() {
    raf = 0;
    const mid = track.scrollLeft + track.clientWidth / 2;
    const step = slides[0].offsetWidth + gap();
    let best = 0, bestD = Infinity;
    slides.forEach((s, i) => {
      const d = (s.offsetLeft + s.offsetWidth / 2 - mid) / step;
      const ad = Math.abs(d), cl = Math.min(ad, 2);
      if (ad < bestD) { bestD = ad; best = i; }
      s.style.setProperty("--act", Math.max(0, 1 - ad).toFixed(3));
      s.style.opacity = (1 - Math.min(ad, 1.7) * 0.3).toFixed(2);
      s.style.zIndex = String(10 - Math.round(ad));
      s.style.transform =
        `perspective(1000px) translate3d(${(-Math.sign(d) * cl * s.offsetWidth * 0.2).toFixed(1)}px,0,${(-cl * 90).toFixed(1)}px) rotateY(${Math.max(-62, Math.min(62, -d * 40)).toFixed(1)}deg) scale(${(1 - cl * 0.07).toFixed(3)}) ` +
        "rotateY(calc(var(--lx,0) * var(--act,0) * 9deg)) rotateX(calc(var(--ly,0) * var(--act,0) * -7deg))";
    });
    if (best !== idx) { idx = best; show(); }
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(paint); };

  function show() {
    const s = slides[idx];
    ci.textContent = String(idx + 1).padStart(2, "0");
    dots.forEach((b, i) => b.setAttribute("aria-current", i === idx ? "true" : "false"));
    prev.disabled = idx === 0;
    next.disabled = idx === slides.length - 1;
    cname.textContent = s.dataset.name;
    chy.textContent = s.dataset.hy;
    cds.textContent = s.dataset.desc;
    [cname, chy, cds].forEach((el) => { el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); });
  }

  const touch = () => { if (!touched) { touched = true; hint.classList.add("off"); } };
  track.addEventListener("scroll", () => { schedule(); if (track.scrollLeft > 4 && Math.abs(track.scrollLeft - target(0)) > 8) touch(); }, { passive: true });
  addEventListener("resize", () => { go(idx, false); schedule(); });
  prev.addEventListener("click", () => { touch(); go(idx - 1); });
  next.addEventListener("click", () => { touch(); go(idx + 1); });
  dots.forEach((b, i) => b.addEventListener("click", () => { touch(); go(i); }));
  slides.forEach((s, i) => s.addEventListener("click", () => { if (i !== idx) { touch(); go(i); } }));
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); touch(); go(idx + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); touch(); go(idx - 1); }
  });
  // "book this style": hand the chosen style to the booking form and jump there
  want.addEventListener("click", (e) => {
    if (!$("#book-form") || $("#book-form").hidden) return; // no booking form -> the plain #book anchor still works
    e.preventDefault();
    document.dispatchEvent(new CustomEvent("pickstyle", { detail: slides[idx].dataset.id }));
  });

  // first paint, and a small nudge the first time the carousel scrolls into view so people see it is swipeable
  go(0, false);
  paint();
  show();
  if (!reduce) {
    const nudge = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      nudge.disconnect();
      setTimeout(() => {
        if (touched) return;
        track.scrollTo({ left: target(0) + 56, behavior: "smooth" });
        setTimeout(() => { if (!touched) track.scrollTo({ left: target(0), behavior: "smooth" }); }, 700);
      }, 900);
    }, { threshold: 0.7 });
    nudge.observe(track);
  }
})();

/* ---------- booking: builds a ready SMS (and a calendar file) from style + date + time ---------- */
(function booking() {
  const form = $("#book-form");
  if (!form) return;
  form.hidden = false;
  const style = $("#b-style"), date = $("#b-date"), time = $("#b-time"), name = $("#b-name");
  const err = $("#b-err"), text = $("#b-text"), chips = $("#b-chips");
  const WD = ["Կիրակի", "Երկուշաբթի", "Երեքշաբթի", "Չորեքշաբթի", "Հինգշաբթի", "Ուրբաթ", "Շաբաթ"];
  const MO = ["հունվարի", "փետրվարի", "մարտի", "ապրիլի", "մայիսի", "հունիսի", "հուլիսի", "օգոստոսի", "սեպտեմբերի", "հոկտեմբերի", "նոյեմբերի", "դեկտեմբերի"];
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const inDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

  date.min = ymd(new Date());
  [[T.today, 0], [T.tomorrow, 1], [T.after, 2]].forEach(([label, n]) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.textContent = label; b.dataset.n = n; b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => { date.value = ymd(inDays(n)); err.textContent = ""; sync(); });
    chips.appendChild(b);
  });

  const styleLabel = () => (C.styles && C.styles[style.value] ? C.styles[style.value].name : T.advise);
  function when() {
    if (!date.value || !time.value) return null;
    const [y, m, d] = date.value.split("-").map(Number), [hh, mm] = time.value.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm);
  }
  function message() {
    const dt = when(), n = name.value.trim();
    const parts = [T.hello];
    if (n) parts.push(fmt(T.name, { v: n }));
    parts.push(fmt(T.want, { v: dt ? `${WD[dt.getDay()]}, ${dt.getDate()} ${MO[dt.getMonth()]}, ${pad(dt.getHours())}:${pad(dt.getMinutes())}` : "…" }));
    parts.push(fmt(T.style, { v: styleLabel() }));
    return parts.join(" ");
  }
  function problem() {
    if (!date.value) return T.needDate;
    if (!time.value) return T.needTime;
    return when() < new Date() ? T.past : "";
  }
  function sync() {
    $$(".chip", chips).forEach((b) => b.setAttribute("aria-pressed", String(date.value === ymd(inDays(+b.dataset.n)))));
    text.textContent = date.value && time.value ? message() : T.previewEmpty;
  }
  form.addEventListener("input", () => { err.textContent = ""; sync(); });
  form.addEventListener("change", () => { err.textContent = ""; sync(); });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const p = problem();
    if (p) { err.textContent = p; (date.value ? time : date).focus(); return; }
    location.href = smsHref(message());
  });

  const wa = $("#b-wa");
  if (wa) wa.addEventListener("click", (e) => {
    const p = problem();
    if (p) { e.preventDefault(); err.textContent = p; return; }
    wa.href = `https://wa.me/${C.tel.replace("+", "")}?text=${encodeURIComponent(message())}`;
  });

  $("#b-copy").addEventListener("click", async () => {
    if (!date.value || !time.value) { err.textContent = problem(); return; }
    toast((await copy(message())) ? T.copied : T.copyFail);
  });

  // iCalendar file: floating local time, one-hour reminder before. Lines folded at 75 octets.
  const enc = new TextEncoder();
  function fold(line) {
    if (enc.encode(line).length <= 75) return line;
    const out = []; let cur = "", size = 0;
    for (const ch of line) {
      const n = enc.encode(ch).length;
      if (size + n > 75) { out.push(cur); cur = " " + ch; size = 1 + n; } else { cur += ch; size += n; }
    }
    out.push(cur);
    return out.join("\r\n");
  }
  $("#b-cal").addEventListener("click", () => {
    const p = problem();
    if (p) { err.textContent = p; return; }
    const s = when(), e = new Date(s.getTime() + (C.minutes || 60) * 60000);
    const fl = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const esc = (v) => String(v).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Barber card//HY", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
      `UID:${Date.now()}@barber-card`, `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d{3}/g, "")}`,
      `DTSTART:${fl(s)}`, `DTEND:${fl(e)}`,
      `SUMMARY:${esc(fmt(T.icsTitle, { who: C.who, v: styleLabel() }))}`,
      `LOCATION:${esc(C.addr)}`, `GEO:${C.lat};${C.lon}`,
      `DESCRIPTION:${esc(fmt(T.icsDesc, { phone: C.phoneDisplay }))}`,
      "BEGIN:VALARM", "TRIGGER:-PT60M", "ACTION:DISPLAY", "DESCRIPTION:Barber", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ].map(fold);
    const url = URL.createObjectURL(new Blob([lines.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "barber-appointment.ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  });

  // a card's "book this style" button lands here
  document.addEventListener("pickstyle", (e) => {
    style.value = e.detail;
    sync();
    const box = style.closest(".fld");
    $("#book").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    box.classList.remove("flash"); void box.offsetWidth; box.classList.add("flash");
    setTimeout(() => box.classList.remove("flash"), 1500);
  });

  sync();
})();

/* ---------- map: OpenStreetMap embed loads when it is about to be seen; locked until tapped so page scrolling still works ---------- */
(function map() {
  const m = $("#map");
  if (!m) return;
  const act = $("#map-act");
  let loaded = false;
  function load() {
    if (loaded) return;
    loaded = true;
    const f = document.createElement("iframe");
    f.src = m.dataset.src;
    f.title = "Քարտեզ";
    f.loading = "lazy";
    f.referrerPolicy = "no-referrer";
    f.setAttribute("tabindex", "-1");
    f.addEventListener("load", () => { m.classList.add("ready"); act.hidden = false; });
    m.prepend(f);
  }
  const lock = (on) => { m.classList.toggle("live", on); act.textContent = on ? T.mapLock : T.mapLive; };
  act.textContent = T.mapLive;
  act.addEventListener("click", (e) => { e.stopPropagation(); lock(!m.classList.contains("live")); });
  m.addEventListener("click", (e) => { if (!e.target.closest("a,button")) { load(); if (m.classList.contains("ready")) lock(true); } });
  const saveData = navigator.connection && navigator.connection.saveData;
  if (!saveData) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { load(); o.disconnect(); } }, { rootMargin: "300px 0px" }).observe(m);

  // navigation: Apple Maps first on iPhone/iPad, the Google Maps link everywhere else
  const ios = $("[data-ios]");
  if (ios && apple) { ios.hidden = false; const main = $("#nav-main"); if (main) main.href = ios.href; }
})();

/* ---------- 3D pole: loaded after the page is done, skipped when 3D can't run (the CSS pole stays) ---------- */
function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return false;
    const lose = gl.getExtension("WEBGL_lose_context");
    if (lose) lose.loseContext();
    return true;
  } catch (e) {
    return false;
  }
}
const pole = $("#pole");
const saveData = navigator.connection && navigator.connection.saveData;
if (pole && !saveData && hasWebGL()) {
  const run = () => import("./pole.js").then((m) => m.start(pole)).catch(() => {});
  if (document.readyState === "complete") run();
  else addEventListener("load", run, { once: true });
}
