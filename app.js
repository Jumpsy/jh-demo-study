// JH Demo Prep app. Plain JS, no build step.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $("#app");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const shuffle = (a, r = Math.random) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, r = Math.random) => a[Math.floor(r() * a.length)];
const mulberry = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const round5 = (x) => Math.round(x * 2) / 2;
const PARTNER = { heine: "mendelssohn", mendelssohn: "heine", jacobson: "hamburg", hamburg: "jacobson", frankel: "geiger", geiger: "frankel", pittsburgh: "columbus", columbus: "pittsburgh" };

// ---------- storage ----------
const KEY = "jhdemo_v1";
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
const S = Object.assign({ items: {}, log: [], demos: [], best: 0, ai: { day: "", n: 0 } }, load());
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }
function record(key, topic, ok, kind) {
  const it = (S.items[key] ||= { n: 0, c: 0 });
  it.n++; if (ok) it.c++; it.last = Date.now();
  S.log.push({ k: key, t: topic, ok: ok ? 1 : 0, kind, ts: Date.now() });
  if (S.log.length > 3000) S.log = S.log.slice(-3000);
  save();
}
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 1800); }
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cols = ["#b8862b", "#1d3557", "#2f6b4f", "#e9c46a", "#a63d2f"];
  for (let i = 0; i < 40; i++) { const d = document.createElement("i"); d.className = "confetti"; d.style.left = Math.random() * 100 + "vw"; d.style.background = pick(cols); d.style.animationDelay = Math.random() * .4 + "s"; document.body.appendChild(d); setTimeout(() => d.remove(), 2200); }
}

// ---------- shared bits ----------
const ava = (who) => { const s = SPEAKERS[who]; return s.img ? `<img src="${s.img}" alt="">` : `<div class="badge-portrait" style="width:100%;height:100%">${s.badge}</div>`; };
const topicPill = (t) => `<span class="pill t-${t}">${TOPICS[t]}</span>`;
function polsterBox(i) { const p = typeof i === "number" ? POLSTER[i] : pick(POLSTER); return `<div class="polster"><div class="polster-ava">P</div><div><div class="who">Dr. Polster in class</div><q>${esc(p.text)}</q><div class="about">${esc(p.about)}</div></div></div>`; }

// ---------- router ----------
const routes = { home, learn, notes, cards, quiz, test, demo, predict, ask };
let cleanup = null;
function route() {
  if (cleanup) { cleanup(); cleanup = null; }
  const [page, arg] = (location.hash.slice(1) || "home").split("/");
  (routes[page] || home)(arg);
  $$(".nav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + page));
  $("#nav").classList.remove("open");
  window.scrollTo(0, 0);
}
addEventListener("hashchange", route);
$("#menuBtn").onclick = () => $("#nav").classList.toggle("open");
(function theme() {
  let t; try { t = localStorage.getItem("jh_theme"); } catch {}
  if (t) document.documentElement.dataset.theme = t;
  $("#themeBtn").onclick = () => {
    const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const n = dark ? "light" : "dark"; document.documentElement.dataset.theme = n; try { localStorage.setItem("jh_theme", n); } catch {}
  };
})();

// ---------- HOME ----------
function home() {
  const answered = S.log.length, acc = answered ? Math.round(100 * S.log.filter((l) => l.ok).length / answered) : 0;
  app.innerHTML = `
  <section class="hero">
    <div>
      <div class="eyebrow">Grade 11 Jewish History · Demo Friday</div>
      <h1>Know who said it <em>in two seconds.</em></h1>
      <p class="lead">Conversion and Reform, from Heine to the Columbus Platform. Built from the source book and Dr. Polster's classes.</p>
      <div class="countdown" id="cd"></div>
      <div class="row"><a class="btn primary" href="#demo">Take a mock demo</a><a class="btn" href="#quiz">Endless quiz</a></div>
    </div>
    <figure class="hero-img"><img src="img/temple-illustration.jpg" alt="Engraving-style illustration of an early Reform temple with an organ and choir"><figcaption>An early Reform temple: German sermon, organ, choir. (AI illustration)</figcaption></figure>
  </section>
  <div class="section-head"><div><div class="eyebrow">What's on the paper</div><h2>The demo, exactly</h2></div><p>2.5% of your mark · 10 min (12.5 extra time)</p></div>
  <div class="format">
    <div class="f"><b>5 blanks</b>A quote is given. Write who it's from. Word bank of 7 or 8, use each once.</div>
    <div class="f"><b>2 of 3</b>Short answers, about 2 sentences each. Cross one out.</div>
    <div class="f"><b>No dates</b>But know the evolution: Pittsburgh 1885 to Columbus 1937.</div>
  </div>
  ${polsterBox(0)}
  <div class="section-head"><div><div class="eyebrow">Study path</div><h2>Do these in order</h2></div>${answered ? `<p>${answered} answered · ${acc}% right</p>` : ""}</div>
  <div class="grid g3">
    ${[["learn", "Learn it", "Every person, quote and idea with pictures. 10 minutes."], ["cards", "Flashcards", "Quote on the front, who said it on the back."], ["quiz", "Endless quiz", "Never runs out. Focuses on what you get wrong."], ["test", "Practice test", "20 mixed questions, marked at the end."], ["demo", "Mock demo", "The real format, timed, on paper. New one every time."], ["predict", "Score prediction", "A realistic guess of your demo mark."]]
      .map(([h, t, p], i) => `<a class="card tile" href="#${h}"><span class="num">${i + 1}</span><h3>${t}</h3><p>${p}</p></a>`).join("")}
  </div>`;
  const cd = $("#cd"); const tick = () => { const ms = new Date(DEMO_DATE) - Date.now(); if (ms <= 0) { cd.innerHTML = `<div class="cd-box"><b>Today</b><span>good luck</span></div>`; return; } const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60; cd.innerHTML = [[d, "days"], [h, "hours"], [m, "min"]].map(([n, l]) => `<div class="cd-box"><b>${n}</b><span>${l}</span></div>`).join(""); };
  tick(); const iv = setInterval(tick, 30000); cleanup = () => clearInterval(iv);
}

// ---------- LEARN ----------
function personCard(who, extra = "") {
  const s = SPEAKERS[who];
  const qs = QUOTES.filter((q) => q.who === who);
  return `<div class="card person"><div class="portrait">${ava(who)}</div><div>
    <div class="row">${topicPill(s.topic)}<span class="pill">${s.page}</span></div>
    <h3 style="margin-top:8px">${s.full}</h3><p class="muted">${s.tag}</p>${extra}
    ${qs.map((q) => `<div class="quote-line ${q.star ? "key" : ""}"><span class="qt">${esc(q.text)}</span>${q.star ? ' <span class="star" title="Dr. Polster flagged this">★</span>' : ""}<small>${esc(q.clue)}</small></div>`).join("")}
  </div></div>`;
}
function learn() {
  app.innerHTML = `
  <div class="eyebrow">Study guide</div><h1>Everything on the demo</h1>
  <p class="muted">★ = Dr. Polster said highlight it. Highlighted quotes are the most likely ones.</p>
  <nav class="toc"><a href="#learn" data-go="big">Big picture</a><a href="#learn" data-go="conv">Conversion</a><a href="#learn" data-go="begin">Reform beginnings</a><a href="#learn" data-go="issues">Main issues</a><a href="#learn" data-go="evo">Evolution</a></nav>

  <h2 id="big" style="margin-top:20px">After emancipation: what now?</h2>
  <p>Jews got freedom and left the ghetto. They had options. The demo covers the two highlighted ones.</p>
  <div class="options-map">
    <div class="opt-node">Science of Judaism<span>not on demo</span></div>
    <div class="opt-node on">Conversion<span>Heine, Mendelssohn</span></div>
    <div class="opt-node on">Reform<span>Jacobson to Columbus</span></div>
    <div class="opt-node">Conservative<span>Frankel (shows up in the debate)</span></div>
    <div class="opt-node">Orthodoxy<span>not on demo</span></div>
  </div>

  <h2 id="conv" style="margin-top:40px">1. Conversion</h2>
  <figure class="wide-img"><img src="img/ticket-illustration.jpg" alt="Illustration of an old ticket next to a sealed certificate"><figcaption>"The baptismal certificate is the ticket of admission to European culture." Heine. (AI illustration)</figcaption></figure>
  <div class="card"><h3>The key idea</h3><ul class="keypoints">
    <li>This conversion was a <b>choice</b>, not forced like the Crusades or the Inquisition.</li>
    <li>It was <b>social and political</b>, not religious. Nobody here converted because they believed in Jesus.</li>
    <li>At least <b>250,000</b> Jews "bought their tickets". Disraeli was born Jewish and became British prime minister.</li></ul></div>
  ${polsterBox(4)}
  <div class="grid g2" style="margin-top:14px">${personCard("heine", `<p>Baptized Lutheran in 1825 to get a doctorate and a government or university job. <b>It didn't work.</b> He moved to Paris.</p>`)}${personCard("mendelssohn", `<p>Son of <b>Moses Mendelssohn</b>, father of the Haskalah (Jewish Enlightenment). Wrote to his daughter Fanny explaining why he raised her Christian.</p>`)}</div>
  <div class="card" style="margin-top:14px"><h3>Heine vs. Mendelssohn: why convert?</h3><div class="tbl-wrap"><table class="compare"><tr><th></th><th>Heine</th><th>Mendelssohn</th></tr>
    <tr><td>Reason</td><td>Get ahead. Jews get discriminated against. Baptism is the ticket in.</td><td>Judaism "had its day". Christianity is the religion of today's most civilized people.</td></tr>
    <tr><td>Feeling</td><td>Ashamed and bitter. Kept his Jewishness privately.</td><td>Calm. His real religion is conscience and being good.</td></tr>
    <tr><td>Same thing</td><td colspan="2">Both are social or political moves, not religious belief.</td></tr></table></div></div>

  <h2 id="begin" style="margin-top:40px">2. Reform: the beginnings</h2>
  <p>The goal was <b>not</b> to destroy Judaism. It was to make it understandable and attractive so Jews stop converting out.</p>
  ${polsterBox(6)}
  <div class="grid g2">${personCard("jacobson", `<p>Opened his little "Temple" in Seesen, 1810. Not a rabbi. Christians came. Orchestra, choir, organ, hymns in German and Hebrew.</p>`)}${personCard("hamburg", `<p>First full Reform congregation, founded by 66 laymen. Added a <b>German sermon</b>, <b>choir with organ</b>, and <b>confirmation for boys and girls</b>.</p>`)}</div>
  <h3 style="margin-top:22px">Why call it a "Temple"? Two reasons</h3>
  <div class="temple-why"><div class="why-box"><div class="n">1</div><b>Less foreign.</b> Sounds less Jewish than synagogue or beit knesset. Buddhists and Hindus have temples. Fits in next to the church.</div>
  <div class="why-box"><div class="n">2</div><b>Here to stay.</b> "Temple" was the name of the destroyed Temple in Jerusalem. Using it meant giving up the hope of returning. Hamburg became their Jerusalem.</div></div>
  ${polsterBox(7)}

  <h2 id="issues" style="margin-top:40px">3. Reform: the main issues</h2>
  <p>To "be like them", Reform had to deal with: <b>prayer language</b>, head covering, kashrut, and Sabbath on Saturday vs. Sunday. The big debate was prayer language at the <b>Frankfurt conference (1845)</b>: is Hebrew legally needed for prayer?</p>
  <div class="vs">
    <div class="side"><h3><span class="mini-ava">${ava("frankel")}</span>Frankel: team Hebrew</h3><ul class="keypoints"><li>Hebrew isn't legally required, <b>but conserve it</b>.</li><li>It's sacred to the whole people. Dropping it causes a <b>schism</b> (split).</li><li>Later founds the <b>Conservative</b> movement.</li></ul></div>
    <div class="mid">vs</div>
    <div class="side"><h3><span class="mini-ava">${ava("geiger")}</span>Geiger: team German</h3><ul class="keypoints"><li>A German prayer <b>strikes a deeper chord</b>, because you understand it.</li><li>A special language makes you a nation. <b>Judaism is a religion, not a nation.</b></li><li>Still refused to move Shabbat to Sunday.</li></ul></div>
  </div>
  ${polsterBox(1)}
  <div class="card" style="margin-top:14px"><h3>Geiger's new prayer book: 3 main changes</h3><ol class="keypoints"><li><b>No Israel or Zion.</b> "Wholly faded" is the hope for a Jewish state in Palestine.</li><li><b>No Messiah, no rebuilt Temple, no ingathering of exiles.</b> Praying for it would be "a blatant untruth".</li><li><b>Universalism.</b> Hope for "the unification of all mankind". Judaism as one religion among many.</li></ol></div>
  <div class="grid g2" style="margin-top:14px">${personCard("frankel")}${personCard("geiger")}</div>

  <h2 id="evo" style="margin-top:40px">4. Reform: the evolution</h2>
  <p>No dates needed. Know the <b>direction</b>: Reform first dropped peoplehood and Zion, then brought them back after the Nazis.</p>
  <div class="timeline">${TIMELINE.map((e) => `<div class="tl-item ${e.who ? "" : "dark"}"><b>${e.y}</b>${esc(e.e)}</div>`).join("")}</div>
  <div class="card"><h3>Pittsburgh 1885 vs. Columbus 1937</h3><div class="tbl-wrap"><table class="compare"><tr><th></th><th>Pittsburgh (Classical Reform)</th><th>Columbus</th></tr>
    <tr><td>Are Jews a nation?</td><td>"No longer a nation, but a religious community"</td><td>"Judaism is the soul of which Israel is the body." The Jewish people matter.</td></tr>
    <tr><td>Palestine / Zion</td><td>Expect no return to Palestine</td><td>All Jews should help build a Jewish homeland</td></tr>
    <tr><td>Laws and rituals</td><td>Only moral laws are binding. Diet, dress, purity laws "fail to impress the modern Jew".</td><td>Keep Sabbath, festivals, and customs with "inspirational value"</td></tr>
    <tr><td>Hebrew</td><td>Not important</td><td>Hebrew together with the vernacular</td></tr>
    <tr><td>Why</td><td>Optimism: fit into modern society</td><td>Nazi Nuremberg Laws (1935). Assimilation failed. Zionism worked.</td></tr></table></div></div>
  ${polsterBox(11)}
  <div class="grid g2" style="margin-top:14px">${personCard("pittsburgh", `<p>Called by Kaufmann Kohler, chaired by Isaac M. Wise (pictured). Adopted by the CCAR.</p>`)}${personCard("columbus", `<p>CCAR, Columbus, Ohio. "Not as a fixed creed but as a guide."</p>`)}</div>
  <div class="section-head"><h2>All of Dr. Polster's lines</h2></div>
  ${POLSTER.map((_, i) => polsterBox(i)).join("")}
  <div class="row" style="justify-content:center;margin-top:24px"><a class="btn primary" href="#cards">Next: flashcards</a></div>`;
  $$(".toc a").forEach((a) => a.onclick = (e) => { e.preventDefault(); $("#" + a.dataset.go).scrollIntoView({ behavior: "smooth", block: "start" }); });
}


// ---------- NOTES (plain, copyable) ----------
function notesText() {
  const L = [];
  const by = (w) => QUOTES.filter((q) => q.who === w).map((q) => `  - "${q.text}"${q.star ? " (KEY)" : ""}`).join("\n");
  L.push("JEWISH HISTORY 11 DEMO NOTES: CONVERSION AND REFORM");
  L.push("Source: JH11-21 source book + Dr. Polster's classes.\n");
  L.push("DEMO FORMAT");
  L.push("- Friday Oct 2. Worth 2.5%. On paper. 10 min (12.5 extra time).");
  L.push("- Part A: 5 fill-in-the-blanks. A quote is given, write WHO it is associated with. Word bank of 7-8, each word used once.");
  L.push("- Part B: 3 short answers, do only 2 (cross one out). About 2 sentences each.");
  L.push("- No dates needed, but know the evolution from Pittsburgh (1885) to Columbus (1937).");
  L.push("- Not on demo: Wissenschaft des Judentums (science of Judaism) or anything earlier.\n");
  L.push("1. CONVERSION");
  L.push("- After emancipation, conversion was a CHOICE (not forced like the Crusades or Inquisition).");
  L.push("- It was social/political, not religious. At least 250,000 Jews converted. Disraeli became British PM.\n");
  L.push("HEINRICH HEINE (p. 13): German Jewish poet. Baptized Lutheran in 1825 to get a doctorate and a government/university job. It didn't work; moved to Paris. Kept his Jewishness privately.");
  L.push(by("heine") + "\n");
  L.push("ABRAHAM MENDELSSOHN (pp. 11-12): son of Moses Mendelssohn (father of the Haskalah). Letter to daughter Fanny on why he raised her Christian: Judaism 'had its day', Christianity is the creed of the most civilized people.");
  L.push(by("mendelssohn") + "\n");
  L.push("HEINE vs MENDELSSOHN: Heine = get ahead, avoid discrimination, baptism is a ticket. Mendelssohn = Christianity is today's religion of civilized people. Both social/political, not religious.\n");
  L.push("2. REFORM: BEGINNINGS (pp. 14-15)");
  L.push("- Goal of early Reform: NOT to destroy Judaism. Make it understandable and attractive so Jews stop converting out.");
  L.push("ISRAEL JACOBSON'S TEMPLE (Seesen, 1810): not a rabbi. Christians attended, orchestra, choir, organ, hymns in German and Hebrew. Goal: religious education.");
  L.push(by("jacobson"));
  L.push("HAMBURG TEMPLE (constitution 1817): founded by 66 laymen. German sermon, choir with organ, confirmation for boys AND girls. Worship was neglected because people no longer knew Hebrew.");
  L.push(by("hamburg"));
  L.push("WHY 'TEMPLE'? (1) Sounds less foreign / less Jewish than synagogue. (2) Name of the destroyed Jerusalem Temple: they gave up hope of returning to Zion. Hamburg = their Jerusalem. 'We're here to stay.'\n");
  L.push("3. REFORM: MAIN ISSUES (pp. 17-18, 22-23)");
  L.push("- Issues: prayer language (Hebrew vs vernacular), head covering, kashrut, Sabbath Saturday vs Sunday.");
  L.push("- Frankfurt conference (1845): is Hebrew legally needed for prayer?");
  L.push("ZECHARIAS FRANKEL: team Hebrew. Not legally required but CONSERVE it, it's sacred to the people, prevents a schism. Positive-historical Judaism. Founder of Conservative Judaism.");
  L.push(by("frankel"));
  L.push("ABRAHAM GEIGER: team German. German prayer strikes a deeper chord (you understand it). Judaism is a religion, NOT a nation. Refused to move Shabbat to Sunday or abolish circumcision.");
  L.push(by("geiger"));
  L.push("GEIGER'S PRAYER BOOK PREFACE, 3 main issues: (1) no Israel/Zion, (2) no Messiah, rebuilt Temple, ingathering of exiles, (3) universalism / openness to other religions.\n");
  L.push("4. REFORM: EVOLUTION (pp. 24-28)");
  L.push("PITTSBURGH PLATFORM (1885), Classical Reform. Called by Kaufmann Kohler, chaired by Isaac M. Wise, adopted by the CCAR.");
  L.push(by("pittsburgh"));
  L.push("COLUMBUS PLATFORM (1937), CCAR. Why it changed: Nazi Nuremberg Laws (1935), assimilation failed (even converts not accepted), Zionism succeeding.");
  L.push(by("columbus"));
  L.push("EVOLUTION SUMMARY: Pittsburgh = not a nation, no return to Palestine, only moral laws binding, drop diet/dress laws. Columbus = Jewish people again ('soul of which Israel is the body'), help build a Jewish homeland, Hebrew together with the vernacular, keep Sabbath/festivals/inspiring customs. Reform today is NOT anti-Israel.\n");
  L.push("TIMELINE (order matters, dates don't): " + TIMELINE.map((e) => `${e.y} ${e.e}`).join(" -> ") + "\n");
  L.push("DR. POLSTER'S LINES FROM CLASS");
  POLSTER.forEach((p) => L.push(`- "${p.text}" (${p.about})`));
  L.push("\nPRACTICE SHORT ANSWERS (with model answers)");
  SHORT.forEach((s, i) => L.push(`${i + 1}. ${s.q}\n   Model: ${s.model}`));
  return L.join("\n");
}
function notes() {
  const txt = notesText();
  app.innerHTML = `<div class="row no-print" style="max-width:820px;margin:0 auto 14px"><div><div class="eyebrow">Plain notes</div><h1 style="margin:0">All notes, one page</h1></div><span class="spacer"></span>
    <button class="btn primary" id="cp">Copy all</button><button class="btn" id="cpgpt">Copy for ChatGPT</button></div>
  <p class="muted no-print" style="max-width:820px;margin:0 auto 14px">Paste into ChatGPT, Gemini or Google Docs. "Copy for ChatGPT" adds a line asking it to quiz you.</p>
  <div class="paper"><pre id="nt" style="white-space:pre-wrap;font-family:'Source Serif 4',Georgia,serif;font-size:1rem;line-height:1.65;margin:0">${esc(txt)}</pre></div>`;
  const copy = (t) => (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast("Copied!"), () => { const r = document.createRange(); r.selectNodeContents($("#nt")); getSelection().removeAllRanges(); getSelection().addRange(r); toast("Selected. Press Cmd/Ctrl+C"); });
  $("#cp").onclick = () => copy(txt);
  $("#cpgpt").onclick = () => copy("Here are my notes for a Grade 11 Jewish History demo. Quiz me one question at a time, mostly 'who said this quote', and explain simply when I'm wrong. Only use these notes.\n\n" + txt);
}

// ---------- FLASHCARDS ----------
function cards() {
  let filter = "all", deck = [], i = 0;
  const build = () => { deck = shuffle(QUOTES.filter((q) => filter === "all" || (filter === "star" ? q.star : SPEAKERS[q.who].topic === filter))); i = 0; };
  build();
  const draw = () => {
    const q = deck[i], s = SPEAKERS[q.who];
    app.innerHTML = `<div class="eyebrow" style="text-align:center">Flashcards</div><h1 style="text-align:center">Who said it?</h1>
    <div class="chips">${[["all", "All"], ["star", "★ Polster's picks"], ...Object.entries(TOPICS)].map(([k, v]) => `<button class="chip ${filter === k ? "on" : ""}" data-f="${k}">${v}</button>`).join("")}</div>
    <p class="muted" style="text-align:center">Card ${i + 1} of ${deck.length} · tap the card or press Space</p>
    <div class="flash-wrap"><div class="flash" id="fl">
      <div class="face front"><div class="q-quote">${esc(q.text)}</div><div class="tap">Tap to flip</div></div>
      <div class="face back"><div class="big-ava">${ava(q.who)}</div><h2>${s.full}</h2><p>${esc(q.clue)}</p><p class="small">${s.page}</p><div class="tap">Tap to flip back</div></div>
    </div></div>
    <div class="row" style="justify-content:center;margin-top:20px"><button class="btn" id="again">Still learning</button><button class="btn primary" id="got">I knew it</button></div>`;
    $("#fl").onclick = () => $("#fl").classList.toggle("flipped");
    const next = (ok) => { record("q:" + q.id, s.topic, ok, "card"); i = (i + 1) % deck.length; if (i === 0) { deck = shuffle(deck); toast("Deck done! Shuffled."); } draw(); };
    $("#got").onclick = () => next(true); $("#again").onclick = () => next(false);
    $$(".chip").forEach((c) => c.onclick = () => { filter = c.dataset.f; build(); draw(); });
  };
  draw();
  const key = (e) => { if (e.code === "Space" && $("#fl")) { e.preventDefault(); $("#fl").classList.toggle("flipped"); } };
  addEventListener("keydown", key); cleanup = () => removeEventListener("keydown", key);
}

// ---------- QUESTION GENERATORS ----------
let recent = [];
function weightedQuote(topic) {
  const pool = QUOTES.filter((q) => !topic || topic === "all" || SPEAKERS[q.who].topic === topic);
  const ws = pool.map((q) => { const it = S.items["q:" + q.id]; let w = 1 + (q.star ? .8 : 0); if (!it) w += 1.5; else w += 4 * (1 - it.c / it.n); if (recent.includes(q.id)) w *= .05; return w; });
  let r = Math.random() * ws.reduce((a, b) => a + b, 0); for (let k = 0; k < pool.length; k++) { r -= ws[k]; if (r <= 0) return pool[k]; } return pool[0];
}
function speakerOpts(correct, n = 4) {
  const others = shuffle(Object.keys(SPEAKERS).filter((k) => k !== correct && k !== PARTNER[correct]));
  return shuffle([correct, PARTNER[correct], ...others.slice(0, n - 2)]);
}
function genWho(topic) {
  const q = weightedQuote(topic); recent = [q.id, ...recent].slice(0, 10);
  return { type: "mcq", topic: SPEAKERS[q.who].topic, key: "q:" + q.id, prompt: "Who is this quote associated with?", quote: q.text,
    opts: speakerOpts(q.who).map((k) => ({ v: k, label: SPEAKERS[k].full, who: k })), answer: q.who,
    explain: `<b>${SPEAKERS[q.who].full}</b> (${SPEAKERS[q.who].page}). ${esc(q.clue)}` };
}
function genReverse(topic) {
  const q = weightedQuote(topic); recent = [q.id, ...recent].slice(0, 10);
  const wrong = shuffle(QUOTES.filter((x) => x.who !== q.who)).slice(0, 3);
  return { type: "mcq", topic: SPEAKERS[q.who].topic, key: "q:" + q.id, prompt: `Which quote is from <b>${SPEAKERS[q.who].full}</b>?`,
    opts: shuffle([q, ...wrong]).map((x) => ({ v: x.id, label: "“" + x.text + "”" })), answer: q.id,
    explain: `${esc(q.clue)} The others: ${wrong.map((w) => SPEAKERS[w.who].name).join(", ")}.` };
}
function genFact(topic) {
  const pool = FACTS.map((f, i) => ({ ...f, i })).filter((f) => !topic || topic === "all" || f.t === topic);
  const ws = pool.map((f) => { const it = S.items["f:" + f.i]; let w = it ? 1 + 4 * (1 - it.c / it.n) : 2.5; if (recent.includes("f" + f.i)) w *= .05; return w; });
  let r = Math.random() * ws.reduce((a, b) => a + b, 0), f = pool[0]; for (let k = 0; k < pool.length; k++) { r -= ws[k]; if (r <= 0) { f = pool[k]; break; } }
  recent = ["f" + f.i, ...recent].slice(0, 10);
  return { type: "mcq", topic: f.t, key: "f:" + f.i, prompt: f.q, opts: shuffle([f.a, ...f.w]).map((x) => ({ v: x, label: x })), answer: f.a, explain: `Answer: <b>${esc(f.a)}</b>` };
}
function genTF(topic) {
  const pool = TF.map((x, i) => ({ ...x, i })).filter((x) => !topic || topic === "all" || x.t === topic);
  const x = pick(pool), truth = Math.random() < .5;
  return { type: "mcq", topic: x.t, key: "tf:" + x.i + (truth ? "t" : "f"), prompt: "True or false?", quote: truth ? x.s : x.f, noMark: true,
    opts: [{ v: "T", label: "True" }, { v: "F", label: "False" }], answer: truth ? "T" : "F", explain: truth ? "True." : `False. The truth: <b>${esc(x.s)}</b>` };
}
function genSort(topic) {
  const sets = SORTS.filter((s) => !topic || topic === "all" || SPEAKERS[s.a].topic === topic);
  const set = pick(sets.length ? sets : SORTS);
  return { type: "sort", topic: SPEAKERS[set.a].topic, key: "sort:" + set.a, prompt: set.title, set, items: shuffle(set.items).slice(0, 6) };
}
function genOrder() {
  const ev = shuffle(TIMELINE).slice(0, 4).sort((a, b) => TIMELINE.indexOf(a) - TIMELINE.indexOf(b));
  return { type: "order", topic: "evolution", key: "order", prompt: "Put these in order, first to last. (Dates aren't tested, but the order is.)", correct: ev, items: shuffle(ev) };
}
function genBank(topic) {
  const spk = shuffle(Object.keys(SPEAKERS).filter((k) => !topic || topic === "all" || SPEAKERS[k].topic === topic));
  const chosen = spk.slice(0, Math.min(3, spk.length));
  const qs = chosen.map((w) => pick(QUOTES.filter((q) => q.who === w)));
  const bank = shuffle([...chosen, ...shuffle(Object.keys(SPEAKERS).filter((k) => !chosen.includes(k))).slice(0, 2)]);
  return { type: "bank", topic: SPEAKERS[chosen[0]].topic, prompt: "Mini demo: fill each blank from the word bank. Each word once.", qs, bank };
}
function genQuestion(topic) {
  const r = Math.random() * 100;
  if (r < 36) return genWho(topic); if (r < 46) return genReverse(topic); if (r < 68) return genFact(topic);
  if (r < 80) return genTF(topic); if (r < 88) return genSort(topic); if (r < 94) return genBank(topic);
  return topic && topic !== "all" && topic !== "evolution" ? genWho(topic) : genOrder();
}

// Render one question into el. done(okFraction) when answered.
function renderQ(el, q, done, opts = {}) {
  const head = `<div class="q-top">${topicPill(q.topic)}<span class="spacer"></span>${opts.counter || ""}</div><div class="q-prompt">${q.prompt}</div>`;
  if (q.type === "mcq") {
    el.innerHTML = head + (q.quote ? `<div class="q-quote">${esc(q.quote)}</div>` : "") + `<div class="opts">${q.opts.map((o, i) => `<button class="opt" data-v="${esc(o.v)}"><span class="k">${i + 1}</span>${o.who ? `<span class="ava">${ava(o.who)}</span>` : ""}<span>${esc(o.label)}</span></button>`).join("")}</div><div class="feedback" id="fb"></div>`;
    const answer = (btn) => {
      if (el.dataset.done) return; el.dataset.done = 1;
      const ok = btn.dataset.v === String(q.answer);
      if (!opts.silent) { $$(".opt", el).forEach((b) => { b.disabled = true; if (b.dataset.v === String(q.answer)) b.classList.add("correct"); }); if (!ok) btn.classList.add("wrong"); const fb = $("#fb", el); fb.className = "feedback show " + (ok ? "good" : "bad"); fb.innerHTML = (ok ? "<b>Correct!</b> " : "<b>Not quite.</b> ") + q.explain; }
      else { btn.classList.add("correct"); $$(".opt", el).forEach((b) => b.disabled = true); }
      done(ok ? 1 : 0, btn.dataset.v);
    };
    $$(".opt", el).forEach((b) => b.onclick = () => answer(b));
    el._key = (n) => { const b = $$(".opt", el)[n - 1]; if (b) answer(b); };
  } else if (q.type === "sort") {
    const pickd = {};
    el.innerHTML = head + `<div class="order-list">${q.items.map(([, txt], i) => `<div class="sort-item" data-i="${i}"><span>${esc(txt)}</span><div class="seg"><button data-s="${q.set.a}">${SPEAKERS[q.set.a].name}</button><button data-s="${q.set.b}">${SPEAKERS[q.set.b].name}</button></div></div>`).join("")}</div><div class="row" style="margin-top:14px"><button class="btn primary" id="chk">Check</button></div><div class="feedback" id="fb"></div>`;
    $$(".sort-item", el).forEach((row) => $$("button", row).forEach((b) => b.onclick = () => { pickd[row.dataset.i] = b.dataset.s; $$("button", row).forEach((x) => x.classList.toggle("on", x === b)); }));
    $("#chk", el).onclick = () => {
      if (Object.keys(pickd).length < q.items.length) return toast("Pick an answer for every line");
      let c = 0; $$(".sort-item", el).forEach((row) => { const ok = pickd[row.dataset.i] === q.items[row.dataset.i][0]; c += ok; row.classList.add(ok ? "correct" : "wrong"); if (!ok) row.querySelector("span").innerHTML += ` <b>(${SPEAKERS[q.items[row.dataset.i][0]].name})</b>`; });
      $("#chk", el).disabled = true; const fb = $("#fb", el); fb.className = "feedback show " + (c === q.items.length ? "good" : "bad"); fb.innerHTML = `<b>${c} of ${q.items.length}</b> right.`;
      done(c / q.items.length);
    };
  } else if (q.type === "order") {
    let items = [...q.items];
    const draw = () => {
      el.innerHTML = head + `<div class="order-list">${items.map((e, i) => `<div class="order-item" data-i="${i}"><span class="num">${i + 1}</span><span>${esc(e.e)}</span><span class="arrows"><button data-u="${i}" aria-label="Move up">↑</button><button data-d="${i}" aria-label="Move down">↓</button></span></div>`).join("")}</div><div class="row" style="margin-top:14px"><button class="btn primary" id="chk">Check order</button></div><div class="feedback" id="fb"></div>`;
      $$("[data-u]", el).forEach((b) => b.onclick = () => { const i = +b.dataset.u; if (i > 0) { [items[i - 1], items[i]] = [items[i], items[i - 1]]; draw(); } });
      $$("[data-d]", el).forEach((b) => b.onclick = () => { const i = +b.dataset.d; if (i < items.length - 1) { [items[i + 1], items[i]] = [items[i], items[i + 1]]; draw(); } });
      $("#chk", el).onclick = () => {
        let c = 0; $$(".order-item", el).forEach((row, i) => { const ok = items[i] === q.correct[i]; c += ok; row.classList.add(ok ? "correct" : "wrong"); });
        $$(".arrows button", el).forEach((b) => b.disabled = true); $("#chk", el).disabled = true;
        const fb = $("#fb", el); fb.className = "feedback show " + (c === items.length ? "good" : "bad");
        fb.innerHTML = c === items.length ? "<b>Perfect order!</b>" : `<b>Right order:</b> ${q.correct.map((e) => esc(e.e)).join(" → ")}`;
        done(c / items.length);
      };
    };
    draw();
  } else if (q.type === "bank") {
    el.innerHTML = head + q.qs.map((x, i) => `<div class="q-quote" style="font-size:1.1rem">${esc(x.text)}<div style="margin-top:8px"><select class="blank-sel" data-i="${i}" style="font:inherit;padding:6px 10px;border-radius:8px;border:2px solid var(--line);background:var(--card);color:var(--ink)"><option value="">Pick...</option>${q.bank.map((b) => `<option value="${b}">${SPEAKERS[b].name}</option>`).join("")}</select></div></div>`).join("") + `<div class="row"><button class="btn primary" id="chk">Check</button></div><div class="feedback" id="fb"></div>`;
    $("#chk", el).onclick = () => {
      const sels = $$(".blank-sel", el); if (sels.some((s) => !s.value)) return toast("Fill every blank");
      const vals = sels.map((s) => s.value); if (new Set(vals).size < vals.length) return toast("Each word can only be used once");
      let c = 0; sels.forEach((s, i) => { const ok = s.value === q.qs[i].who; c += ok; s.style.borderColor = ok ? "var(--good)" : "var(--bad)"; s.disabled = true; record("q:" + q.qs[i].id, SPEAKERS[q.qs[i].who].topic, ok, "bank"); });
      $("#chk", el).disabled = true; const fb = $("#fb", el); fb.className = "feedback show " + (c === sels.length ? "good" : "bad");
      fb.innerHTML = `<b>${c} of ${sels.length}.</b> ` + q.qs.map((x) => `${SPEAKERS[x.who].name}: ${esc(x.clue)}`).join("<br>");
      done(c / sels.length, null, true);
    };
  }
}

// ---------- ENDLESS QUIZ ----------
function quiz() {
  let topic = "all", n = 0, right = 0, streak = 0, cur = null, answered = false;
  app.innerHTML = `<div class="eyebrow" style="text-align:center">Endless quiz</div><h1 style="text-align:center">It never runs out</h1>
  <p class="muted" style="text-align:center">It shows you more of what you get wrong. Keys 1 to 4 to answer, Enter for next.</p>
  <div class="chips">${[["all", "Everything"], ...Object.entries(TOPICS)].map(([k, v]) => `<button class="chip ${k === "all" ? "on" : ""}" data-f="${k}">${v}</button>`).join("")}</div>
  <div class="stats-bar"><div class="stat"><b id="sN">0</b><span>answered</span></div><div class="stat"><b id="sA">0%</b><span>right</span></div><div class="stat"><b id="sS">0</b><span>streak</span></div><div class="stat"><b id="sB">${S.best}</b><span>best</span></div></div>
  <div class="card qcard" id="qc"></div>
  <div class="row" style="justify-content:center;margin-top:16px"><button class="btn primary" id="next">Next question</button></div>`;
  const next = () => {
    answered = false; cur = genQuestion(topic); const el = $("#qc"); delete el.dataset.done;
    renderQ(el, cur, (frac, _v, selfRecorded) => {
      answered = true; n++; const ok = frac >= .99; if (ok) { right++; streak++; } else streak = 0;
      if (streak > S.best) { S.best = streak; if (streak % 10 === 0) { confetti(); toast(streak + " in a row!"); } }
      if (!selfRecorded) record(cur.key, cur.topic, ok, cur.type);
      $("#sN").textContent = n; $("#sA").textContent = Math.round(100 * right / n) + "%"; $("#sS").textContent = streak; $("#sB").textContent = S.best;
      if (!ok) { const fb = $("#fb"); if (fb) fb.insertAdjacentHTML("beforeend", ` <a href="#ask" class="small" id="askwhy">Still confused? Ask AI</a>`); const a = $("#askwhy"); if (a) a.onclick = () => sessionStorage.setItem("jh_prefill", "Explain this to me simply: " + (cur.quote || cur.prompt).replace(/<[^>]+>/g, "")); }
    });
  };
  $("#next").onclick = next;
  $$(".chip").forEach((c) => c.onclick = () => { topic = c.dataset.f; $$(".chip").forEach((x) => x.classList.toggle("on", x === c)); next(); });
  const key = (e) => { if (e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return; if (e.key === "Enter" && answered) next(); else if (/^[1-4]$/.test(e.key) && $("#qc")._key) $("#qc")._key(+e.key); };
  addEventListener("keydown", key); cleanup = () => removeEventListener("keydown", key);
  next();
}

// ---------- PRACTICE TEST ----------
function test() {
  const qs = []; const gens = [genWho, genWho, genWho, genWho, genWho, genWho, genWho, genWho, genReverse, genReverse, genFact, genFact, genFact, genFact, genFact, genFact, genTF, genTF, genTF, genTF];
  shuffle(gens).forEach((g) => qs.push(g("all")));
  const ans = new Array(qs.length).fill(null); let i = 0;
  const draw = () => {
    app.innerHTML = `<div class="eyebrow" style="text-align:center">Practice test</div><h1 style="text-align:center">20 questions</h1><p class="muted" style="text-align:center">No answers shown until you finish.</p>
    <div class="card qcard" id="qc"></div><div class="row" style="justify-content:center;margin-top:16px"><button class="btn" id="prev" ${i === 0 ? "disabled" : ""}>Back</button><button class="btn primary" id="nx">${i === qs.length - 1 ? "Finish test" : "Next"}</button></div>`;
    const el = $("#qc");
    renderQ(el, qs[i], (_f, v) => { ans[i] = v; }, { silent: true, counter: `<span class="pill">${i + 1} / ${qs.length}</span>` });
    if (ans[i] != null) { const b = $$(".opt", el).find((b) => b.dataset.v === ans[i]); if (b) { b.classList.add("correct"); $$(".opt", el).forEach((x) => x.disabled = true); el.dataset.done = 1; } }
    $("#prev").onclick = () => { i--; draw(); };
    $("#nx").onclick = () => { if (i < qs.length - 1) { i++; draw(); } else finish(); };
  };
  const finish = () => {
    if (ans.some((a) => a == null) && !confirmLike()) return;
    let c = 0; const byT = {};
    qs.forEach((q, k) => { const ok = ans[k] === String(q.answer); c += ok; record(q.key, q.topic, ok, "test"); (byT[q.topic] ||= [0, 0]); byT[q.topic][1]++; if (ok) byT[q.topic][0]++; });
    if (c >= 18) confetti();
    app.innerHTML = `<div class="card score-big"><div class="eyebrow">Your result</div><div class="n">${c}/20</div><p>${Math.round(c * 5)}%</p></div>
    <div class="card" style="margin-top:16px"><h3>By topic</h3>${Object.entries(byT).map(([t, [a, b]]) => `<div class="ready-row"><span>${TOPICS[t]}</span><div class="bar"><i style="width:${100 * a / b}%;background:var(--c-${t})"></i></div><b>${a}/${b}</b></div>`).join("")}</div>
    <div class="card" style="margin-top:16px"><h3>Review your mistakes</h3>${qs.map((q, k) => ans[k] === String(q.answer) ? "" : `<div style="padding:12px 0;border-bottom:1px solid var(--line)"><div>${q.prompt}</div>${q.quote ? `<div class="quote-line"><span class="qt">${esc(q.quote)}</span></div>` : ""}<div class="small">${q.explain}</div></div>`).join("") || "<p>None. Perfect!</p>"}</div>
    <div class="row" style="justify-content:center;margin-top:16px"><button class="btn primary" onclick="route()">New test</button><a class="btn" href="#predict">See prediction</a></div>`;
  };
  const confirmLike = () => { toast("Answer every question first"); return false; };
  draw();
}

// ---------- MOCK DEMO ----------
function buildDemo(seed) {
  const r = mulberry(seed);
  const who = shuffle(Object.keys(SPEAKERS), r).slice(0, 5);
  const blanks = who.map((w) => { const pool = QUOTES.filter((q) => q.who === w); const stars = pool.filter((q) => q.star); return pick(r() < .65 && stars.length ? stars : pool, r); });
  const extra = shuffle(Object.keys(SPEAKERS).filter((k) => !who.includes(k)), r).slice(0, r() < .5 ? 2 : 3);
  const bank = shuffle([...who, ...extra], r);
  const tps = shuffle(Object.keys(TOPICS), r).slice(0, 3);
  const sas = tps.map((t) => pick(SHORT.filter((s) => s.t === t), r));
  return { seed, blanks, bank, sas };
}
function autoMark(sa, text) {
  const t = text.toLowerCase(); const words = t.split(/\s+/).filter(Boolean).length;
  if (words < 4) return { score: 0, hits: [] };
  const hits = sa.pts.filter(([, re]) => new RegExp(re, "i").test(t));
  let score = round5(2.5 * Math.min(1, hits.length / Math.max(2, sa.pts.length - 0.5)));
  if (words < 12) score = Math.min(score, 1.5);
  return { score, hits: hits.map((h) => h[0]) };
}
function demo(arg) {
  const seed = Number(arg) || Math.floor(Math.random() * 1e6);
  let mins = 10;
  app.innerHTML = `<div class="demo-setup"><div class="eyebrow">Mock demo #${seed}</div><h1>Just like Friday's paper</h1>
  <p>5 fill-in-the-blanks with a word bank, then 3 short answers where you do only 2. Timed. It hands itself in when time runs out.</p>
  ${polsterBox(12)}
  <div class="card"><h3>Your time</h3><div class="row"><button class="chip on" data-m="10">10 min (regular)</button><button class="chip" data-m="12.5">12.5 min (extra time)</button></div>
  <p class="small muted" style="margin-top:12px">We guess the marks are 1 per blank and 2.5 per short answer (10 total). Dr. Polster didn't give the exact split.</p>
  <div class="row" style="margin-top:12px"><button class="btn primary" id="go">Start the demo</button><button class="btn" id="share">Send this exact demo to a friend</button></div></div></div>`;
  $$("[data-m]").forEach((b) => b.onclick = () => { mins = +b.dataset.m; $$("[data-m]").forEach((x) => x.classList.toggle("on", x === b)); });
  $("#share").onclick = () => { const u = location.href.split("#")[0] + "#demo/" + seed; navigator.clipboard?.writeText(u).then(() => toast("Link copied"), () => toast(u)); };
  $("#go").onclick = () => runDemo(buildDemo(seed), mins);
}
function runDemo(D, mins) {
  const total = mins * 60; let left = total, crossed = null, over = false;
  app.innerHTML = `<div class="timer-bar" id="tb"><span>Time left</span><span class="t" id="tt"></span><span class="prog"><i id="tp"></i></span><button class="btn gold" id="hand">Hand it in</button></div>
  <div class="paper"><h2>Jewish History 11 · Demo</h2><div class="sub">Conversion and Reform · 2.5%</div>
    <div class="nameline"><span>Name: <input aria-label="Name"></span><span>Date: <input aria-label="Date" value="Fri. Oct. 2"></span></div>
    <div class="instr">Part A. Fill in each blank with the person or source the quote is associated with. Use the word bank below. Each word may be used only once. Not all words will be used.</div>
    ${D.blanks.map((q, i) => `<div class="item"><span class="num">${i + 1}.</span>“${esc(q.text)}” <span style="white-space:nowrap">&nbsp;<select class="blank" data-i="${i}"><option value="">__________</option>${D.bank.map((b) => `<option value="${b}">${SPEAKERS[b].name}</option>`).join("")}</select></span><span class="mark" id="bm${i}"></span></div>`).join("")}
    <div class="bankbox"><div class="ttl">Word Bank</div><div class="bankwords">${D.bank.map((b) => `<span data-w="${b}">${SPEAKERS[b].name}</span>`).join("")}</div></div>
    <div class="pagenum">Page 1 of 2</div></div>
  <div class="paper"><div class="instr">Part B. Answer TWO of the three questions in about two sentences each. Cross out the one you are not doing.</div>
    ${D.sas.map((s, i) => `<div class="sa" id="sa${i}"><div class="sa-q"><b>${i + 1}.</b> ${esc(s.q)} <button class="xbtn no-print" data-x="${i}">Cross out</button></div><textarea data-i="${i}" placeholder="Write about 2 sentences..."></textarea><div id="sr${i}"></div></div>`).join("")}
    <div class="pagenum">Page 2 of 2</div></div>
  <div class="row no-print" style="justify-content:center"><button class="btn primary" id="hand2">Hand it in</button></div>`;
  const used = () => { const v = $$("select.blank").map((s) => s.value); $$(".bankwords span").forEach((sp) => sp.classList.toggle("used", v.includes(sp.dataset.w))); };
  $$("select.blank").forEach((s) => s.onchange = used);
  $$("[data-x]").forEach((b) => b.onclick = () => { const i = +b.dataset.x; crossed = crossed === i ? null : i; $$(".sa").forEach((el, k) => el.classList.toggle("crossed", k === crossed)); $$("[data-x]").forEach((x, k) => x.textContent = k === crossed ? "Undo" : "Cross out"); });
  const tickT = () => { const m = Math.floor(left / 60), s = Math.floor(left % 60); $("#tt").textContent = `${m}:${String(s).padStart(2, "0")}`; $("#tp").style.width = (100 * left / total) + "%"; $("#tb").classList.toggle("low", left <= 60); };
  tickT(); const iv = setInterval(() => { left--; tickT(); if (left <= 0) { toast("Time's up! Pencils down."); hand(); } }, 1000);
  cleanup = () => clearInterval(iv);
  const hand = () => {
    if (over) return; over = true; clearInterval(iv); const used = total - left;
    $("#tb").innerHTML = `<span>Handed in after ${Math.floor(used / 60)}:${String(used % 60).padStart(2, "0")}</span><span class="spacer"></span><span class="t" id="tot"></span>`;
    let b = 0; const vals = $$("select.blank").map((s) => s.value);
    $$("select.blank").forEach((s, i) => { s.disabled = true; const right = D.blanks[i].who; const dup = vals.filter((v) => v === s.value).length > 1; const ok = s.value === right && !dup; b += ok; s.classList.add(ok ? "correct" : "wrong"); $("#bm" + i).className = "mark" + (ok ? " ok" : ""); $("#bm" + i).textContent = ok ? "✓" : `✗ ${SPEAKERS[right].name}${dup && s.value === right ? " (used twice)" : ""}`; record("q:" + D.blanks[i].id, SPEAKERS[right].topic, ok, "demo"); });
    $$("[data-x]").forEach((x) => x.remove());
    let doIdx = [0, 1, 2].filter((k) => k !== crossed); const filled = doIdx.filter((k) => $(`textarea[data-i="${k}"]`).value.trim());
    if (crossed == null) doIdx = (filled.length >= 2 ? filled : doIdx).slice(0, 2);
    const rec = { ts: Date.now(), seed: D.seed, blanks: b, sa: [0, 0], mins };
    const saScores = {};
    const totalUpd = () => { rec.sa = doIdx.map((k) => saScores[k]); rec.total = b + rec.sa.reduce((x, y) => x + y, 0); $("#tot").textContent = `${rec.total} / 10`; const ix = S.demos.findIndex((d) => d.ts === rec.ts); if (ix >= 0) S.demos[ix] = { ...rec }; else S.demos.push({ ...rec }); save(); };
    [0, 1, 2].forEach((k) => {
      const ta = $(`textarea[data-i="${k}"]`); ta.readOnly = true; const box = $("#sr" + k); const sa = D.sas[k];
      if (!doIdx.includes(k)) { $("#sa" + k).classList.add("crossed"); box.innerHTML = `<div class="result-box">Not marked (you did the other two).<br><b>Model answer:</b> ${esc(sa.model)}</div>`; return; }
      const m = autoMark(sa, ta.value); saScores[k] = m.score;
      const paint = (note = "") => {
        box.innerHTML = `<div class="result-box"><b>Mark: <span id="ms${k}">${saScores[k]}</span> / 2.5</b> ${note}<br>
        <span class="small">Key points: ${sa.pts.map(([l]) => (m.hits.includes(l) ? "✓ " : "✗ ") + esc(l)).join(" · ")}</span><br>
        <b>Model answer:</b> ${esc(sa.model)}
        <div class="adj">Be honest, fix your mark: <button data-a="-1">−</button><button data-a="1">+</button> <button class="xbtn" data-ai="1">Mark with AI (uses 1 AI turn)</button></div></div>`;
        $$("[data-a]", box).forEach((btn) => btn.onclick = () => { saScores[k] = Math.max(0, Math.min(2.5, saScores[k] + .5 * btn.dataset.a)); $("#ms" + k).textContent = saScores[k]; totalUpd(); });
        $("[data-ai]", box).onclick = async (e) => {
          if (!useAI()) return; e.target.disabled = true; e.target.textContent = "Marking...";
          try { const r = await callAI({ mode: "grade", question: sa.q, answer: ta.value, max: 2.5 }); saScores[k] = round5(Math.max(0, Math.min(2.5, Number(r.score) || 0))); totalUpd(); paint(`<br><i>AI: ${esc(r.feedback || "")}${r.missing ? " Missing: " + esc(r.missing) : ""}</i>`); }
          catch (err) { e.target.textContent = err.message; }
        };
      };
      paint();
    });
    totalUpd(); if (rec.total >= 9) confetti();
    app.insertAdjacentHTML("beforeend", `<div class="card no-print" style="max-width:820px;margin:0 auto"><h3>Done!</h3><p>The prediction page now uses this result. Each mock demo is new, so do another.</p><div class="row"><a class="btn primary" href="#demo/${Math.floor(Math.random() * 1e6)}">New mock demo</a><a class="btn" href="#predict">See my prediction</a></div></div>`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  $("#hand").onclick = hand; $("#hand2").onclick = hand;
}

// ---------- PREDICTION ----------
function predictModel() {
  const recentLog = S.log.slice(-400);
  const spk = {}; Object.keys(SPEAKERS).forEach((k) => spk[k] = [0, 0]);
  recentLog.forEach((l) => { if (l.k.startsWith("q:")) { const q = QUOTES.find((x) => "q:" + x.id === l.k); if (q) { spk[q.who][1]++; spk[q.who][0] += l.ok; } } });
  const pSpk = Object.fromEntries(Object.entries(spk).map(([k, [c, n]]) => [k, (c + 2) / (n + 3.3)]));
  const pq = Object.values(pSpk).reduce((a, b) => a + b, 0) / 8;
  let pBlank = 1 - (1 - pq) * .78;
  const demos = S.demos.slice(-5);
  const dB = demos.reduce((a, d) => a + d.blanks, 0), dN = demos.length * 5;
  pBlank = (dB + pBlank * 6) / (dN + 6);
  const facts = recentLog.filter((l) => !l.k.startsWith("q:"));
  const fAcc = facts.length >= 10 ? facts.filter((l) => l.ok).length / facts.length : .55;
  const prior = .35 + .45 * fAcc;
  const saF = demos.flatMap((d) => d.sa.map((x) => x / 2.5));
  const pSa = (saF.reduce((a, b) => a + b, 0) + prior * 2) / (saF.length + 2);
  const E = 5 * pBlank + 5 * pSa;
  const evidence = recentLog.length + 20 * demos.length;
  const sd = Math.sqrt(5 * pBlank * (1 - pBlank) + 2 * 6.25 * pSa * (1 - pSa) * .35 + Math.pow(1.6 / Math.sqrt(1 + evidence / 25), 2));
  const lo = Math.max(0, round5(E - sd)), hi = Math.min(10, round5(E + sd));
  const topic = {}; Object.keys(TOPICS).forEach((t) => { const ls = recentLog.filter((l) => l.t === t); topic[t] = { n: ls.length, p: ls.length ? (ls.filter((l) => l.ok).length + 1) / (ls.length + 2) : null }; });
  return { E: round5(E), lo, hi, pBlank, pSa, pSpk, spk, topic, evidence, demos, conf: evidence < 40 ? "Low" : evidence < 150 ? "Medium" : "High" };
}
function gaugeSVG(v, lo, hi) {
  const cx = 160, cy = 150, R = 120; const pt = (x) => { const a = Math.PI * (1 - x / 10); return [cx + R * Math.cos(a), cy - R * Math.sin(a)]; };
  const arc = (a, b) => { const [x1, y1] = pt(a), [x2, y2] = pt(b); return `M${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2}`; };
  const col = v >= 8 ? "var(--good)" : v >= 6 ? "var(--gold)" : "var(--bad)";
  return `<svg class="gauge" viewBox="0 0 320 175" role="img" aria-label="Predicted ${v} out of 10">
    <path d="${arc(0, 10)}" stroke="var(--bg-2)" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="${arc(lo, Math.max(hi, lo + .05))}" stroke="${col}" stroke-opacity=".3" stroke-width="22" fill="none"/>
    <path d="${arc(0, Math.max(v, .05))}" stroke="${col}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <text x="160" y="128" text-anchor="middle" font-family="Fraunces, serif" font-size="46" font-weight="800" fill="var(--ink)">${v}</text>
    <text x="160" y="152" text-anchor="middle" font-size="13" fill="var(--muted)">out of 10 · likely ${lo} to ${hi}</text></svg>`;
}
function predict() {
  const M = predictModel();
  const weak = Object.entries(M.pSpk).sort((a, b) => a[1] - b[1]).slice(0, 3);
  const tips = [];
  if (!M.demos.length) tips.push(`You haven't done a <a href="#demo">mock demo</a> yet. That's the best way to make this prediction accurate.`);
  weak.forEach(([k, p]) => { if (M.spk[k][1] < 3) tips.push(`Not enough practice on <b>${SPEAKERS[k].full}</b> quotes yet.`); else if (p < .8) tips.push(`<b>${SPEAKERS[k].full}</b> quotes: you get about ${Math.round(100 * M.spk[k][0] / M.spk[k][1])}% right. Review them in <a href="#learn">Learn</a>.`); });
  if (M.pSa < .7) tips.push(`Short answers are your weak spot. Read the model answers after each mock demo. Use names and one key idea in every answer.`);
  tips.push(`Must know: Geiger, "the national aspect of Israel must recede into the background."`);
  app.innerHTML = `<div class="eyebrow">Score prediction</div><h1>What you'll probably get</h1>
  <p class="muted">Based on ${M.evidence ? `${S.log.slice(-400).length} recent answers and ${M.demos.length} mock demo${M.demos.length === 1 ? "" : "s"}` : "no practice yet, so this is just a starting guess"}. Confidence: <b>${M.conf}</b>.</p>
  <div class="card gauge-wrap"><div>${gaugeSVG(M.E, M.lo, M.hi)}</div><div>
    <h3>${Math.round(M.E * 10)}% predicted</h3>
    <div class="ready-row"><span>Part A blanks</span><div class="bar"><i style="width:${100 * M.pBlank}%;background:var(--navy)"></i></div><b>${(5 * M.pBlank).toFixed(1)}/5</b></div>
    <div class="ready-row"><span>Part B answers</span><div class="bar"><i style="width:${100 * M.pSa}%;background:var(--gold)"></i></div><b>${(5 * M.pSa).toFixed(1)}/5</b></div>
    <p class="small muted">How it works: it uses how often you know who said each quote, gives a small boost for the word bank (you can rule words out), and uses your mock demo short-answer marks. Fewer answers means a wider range. Assumes 1 mark per blank and 2.5 per short answer.</p>
  </div></div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card"><h3>Ready by topic</h3>${Object.entries(M.topic).map(([t, x]) => `<div class="ready-row"><span>${TOPICS[t]}</span><div class="bar"><i style="width:${x.p == null ? 0 : 100 * x.p}%;background:var(--c-${t})"></i></div><b>${x.p == null ? "new" : Math.round(100 * x.p) + "%"}</b></div>`).join("")}</div>
    <div class="card"><h3>Quote recognition by person</h3>${Object.keys(SPEAKERS).map((k) => { const [c, n] = M.spk[k]; return `<div class="ready-row"><span>${SPEAKERS[k].name}</span><div class="bar"><i style="width:${n ? 100 * c / n : 0}%;background:var(--c-${SPEAKERS[k].topic})"></i></div><b>${n ? `${c}/${n}` : "new"}</b></div>`; }).join("")}</div>
  </div>
  <div class="card" style="margin-top:16px"><h3>Mock demo history</h3>${M.demos.length ? `<svg viewBox="0 0 ${Math.max(5, S.demos.slice(-10).length) * 60} 140" style="width:100%;max-height:160px" role="img" aria-label="Mock demo scores">${S.demos.slice(-10).map((d, i) => `<rect x="${i * 60 + 12}" y="${120 - d.total * 10}" width="36" height="${d.total * 10}" rx="6" fill="var(--navy)"/><text x="${i * 60 + 30}" y="${114 - d.total * 10}" text-anchor="middle" font-size="13" fill="var(--ink)">${d.total}</text><text x="${i * 60 + 30}" y="136" text-anchor="middle" font-size="11" fill="var(--muted)">#${i + 1}</text>`).join("")}</svg>` : `<p class="muted">No mock demos yet.</p>`}</div>
  <div class="card" style="margin-top:16px"><h3>To raise your mark</h3><ul class="tip-list">${tips.map((t) => `<li>${t}</li>`).join("")}</ul>
  <div class="row"><a class="btn primary" href="#demo">Do a mock demo</a><a class="btn" href="#quiz">Endless quiz</a><button class="btn ghost" id="reset">Reset my progress</button></div></div>`;
  $("#reset").onclick = (e) => { if (e.target.dataset.sure) { S.items = {}; S.log = []; S.demos = []; S.best = 0; save(); predict(); toast("Progress reset"); } else { e.target.dataset.sure = 1; e.target.textContent = "Tap again to really reset"; } };
}

// ---------- AI ----------
function today() { return new Date().toISOString().slice(0, 10); }
function aiLeft() { if (S.ai.day !== today()) S.ai = { day: today(), n: 0 }; return AI_DAILY_LIMIT - S.ai.n; }
function useAI() { if (aiLeft() <= 0) { toast("Out of AI turns for today"); return false; } S.ai.n++; save(); return true; }
async function callAI(body) {
  const r = await fetch(AI_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "AI is busy, try later"); return d;
}
function md(s) {
  const lines = esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").split(/\n+/); let out = "", inList = false;
  lines.forEach((l) => { const m = l.match(/^\s*[-*•]\s+(.*)/) || l.match(/^\s*\d+[.)]\s+(.*)/); if (m) { if (!inList) { out += "<ul>"; inList = true; } out += `<li>${m[1]}</li>`; } else { if (inList) { out += "</ul>"; inList = false; } if (l.trim()) out += `<p>${l}</p>`; } });
  return out + (inList ? "</ul>" : "");
}
let chat = []; try { chat = JSON.parse(sessionStorage.getItem("jh_chat")) || []; } catch {}
function ask() {
  app.innerHTML = `<div class="chat"><div class="eyebrow">Ask AI</div><h1>Ask anything about the demo</h1>
  <div class="warn"><b>Go easy on the AI.</b> We only have a small amount of free AI for everyone. Check <a href="#learn">Learn</a> first, and only ask what you really need. You have <b id="left">${aiLeft()}</b> of ${AI_DAILY_LIMIT} AI turns left today on this device.</div>
  <div class="sugs">${["What's on the demo?", "Heine vs Mendelssohn in 2 lines", "Why did Reform change by 1937?", "Quiz me on Geiger"].map((s) => `<button class="chip" data-s="${s}">${s}</button>`).join("")}</div>
  <div class="chat-log" id="log"></div>
  <div class="chat-input"><textarea id="inp" rows="1" placeholder="Ask about the demo..."></textarea><button class="btn primary" id="send">Ask</button></div></div>`;
  const log = $("#log");
  const paint = () => { log.innerHTML = chat.length ? chat.map((m) => `<div class="msg ${m.role === "user" ? "user" : "bot"}">${m.role === "user" ? esc(m.content) : md(m.content)}</div>`).join("") : `<div class="msg bot"><p>Hi! I answer from the source book and Dr. Polster's classes. Ask me something short.</p></div>`; };
  paint();
  const send = async (text) => {
    text = (text || $("#inp").value).trim(); if (!text) return; if (!useAI()) return;
    $("#left").textContent = aiLeft(); $("#inp").value = ""; chat.push({ role: "user", content: text }); paint();
    log.insertAdjacentHTML("beforeend", `<div class="msg bot typing" id="typ"><span></span><span></span><span></span></div>`); $("#send").disabled = true;
    try { const r = await callAI({ messages: chat.slice(-6) }); chat.push({ role: "assistant", content: r.reply || "Sorry, no answer." }); }
    catch (e) { chat.push({ role: "assistant", content: "Couldn't reach the AI: " + e.message }); }
    try { sessionStorage.setItem("jh_chat", JSON.stringify(chat.slice(-20))); } catch {}
    $("#send").disabled = false; paint(); log.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  $("#send").onclick = () => send();
  $("#inp").onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  $$("[data-s]").forEach((b) => b.onclick = () => send(b.dataset.s));
  const pre = sessionStorage.getItem("jh_prefill"); if (pre) { $("#inp").value = pre; sessionStorage.removeItem("jh_prefill"); $("#inp").focus(); }
}

route();
