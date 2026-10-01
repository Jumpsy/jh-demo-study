// Run `node build-seo.js` after editing data.js. Writes plain, crawlable copies of all notes
// so AI tools and search engines can read everything without running JavaScript.
const fs = require("fs");
const src = fs.readFileSync("app.js", "utf8");
const fn = src.split("// ---------- NOTES (plain, copyable) ----------")[1].split("function notes()")[0];
const notesText = new Function(fs.readFileSync("data.js", "utf8") + fn + "; return notesText();");
const txt = notesText();
const URL = "https://jumpsy.github.io/jh-demo-study/";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

fs.writeFileSync("notes.txt", txt + "\n");
fs.writeFileSync("llms-full.txt", txt + "\n");
fs.writeFileSync("llms.txt", `# JH Demo Prep: Jewish History 11 demo (Conversion and Reform)

> Complete study notes for Dr. Polster's Grade 11 Jewish History demo on Friday, October 2, 2026: Conversion (Heinrich Heine, Abraham Mendelssohn) and Reform Judaism (Israel Jacobson's Temple, the Hamburg Temple, Frankel vs. Geiger at the Frankfurt conference, Geiger's prayer book, the Pittsburgh Platform 1885 and the Columbus Platform 1937). Includes every quote with who said it, the demo format, Dr. Polster's lines from class, and model short answers.

## Full notes
- [All notes as plain text](${URL}llms-full.txt): everything in one file
- [All notes as a web page](${URL}notes.html): same content as HTML

## Interactive study tools
- [Study site](${URL}): flashcards, endless quiz, practice test, timed mock demo, score prediction
`);

const sections = esc(txt).split("\n").map((l) => {
  if (/^[A-Z0-9][A-Z0-9 .,:'()&\/-]{6,}$/.test(l.trim()) && !l.startsWith("  ")) return `<h2>${l}</h2>`;
  if (l.startsWith("  - ") || l.startsWith("- ")) return `<li>${l.replace(/^\s*-\s/, "")}</li>`;
  return l.trim() ? `<p>${l}</p>` : "";
}).join("\n").replace(/(<li>[\s\S]*?<\/li>)(?!\n<li>)/g, "$1").replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>\n$1</ul>\n");

const ld = { "@context": "https://schema.org", "@type": "LearningResource", name: "Jewish History 11 Demo Notes: Conversion and Reform",
  description: "Complete notes for the Grade 11 Jewish History demo: Heine, Mendelssohn, Jacobson, Hamburg Temple, Frankel, Geiger, Pittsburgh Platform (1885), Columbus Platform (1937).",
  educationalLevel: "Grade 11", inLanguage: "en", url: URL + "notes.html",
  about: ["Heinrich Heine", "Abraham Mendelssohn", "Israel Jacobson", "Hamburg Temple", "Zecharias Frankel", "Abraham Geiger", "Pittsburgh Platform", "Columbus Platform", "Reform Judaism", "Jewish conversion after emancipation"].map((n) => ({ "@type": "Thing", name: n })) };

fs.writeFileSync("notes.html", `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Jewish History 11 Demo Notes: Conversion and Reform</title>
<meta name="description" content="${esc(ld.description)}">
<link rel="canonical" href="${URL}notes.html">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>body{max-width:760px;margin:0 auto;padding:24px 16px 60px;font:17px/1.65 Georgia,serif;color:#1e1a15;background:#fffdf8}h1{font-size:1.8rem}h2{font-size:1.15rem;margin-top:1.8em}li{margin-bottom:4px}a{color:#1d3557}</style>
</head><body>
<p><a href="${URL}">Back to the study site</a> · <a href="${URL}llms-full.txt">Plain text</a></p>
<h1>Jewish History 11 Demo Notes: Conversion and Reform</h1>
<main>
${sections}
</main></body></html>
`);

// Put the same notes inside index.html so tools that read the home page get everything too.
let html = fs.readFileSync("index.html", "utf8");
const block = `<!--SEO-START--><article class="seo-notes"><h1>Jewish History 11 Demo Notes</h1><p><a href="notes.html">Read all notes</a></p><pre style="white-space:pre-wrap">${esc(txt)}</pre></article><!--SEO-END-->`;
html = html.replace(/<!--SEO-START-->[\s\S]*?<!--SEO-END-->/, "");
html = html.replace('<main id="app" tabindex="-1"></main>', `<main id="app" tabindex="-1">${block}</main>`).replace(/<main id="app" tabindex="-1"><!--SEO-START-->/, '<main id="app" tabindex="-1"><!--SEO-START-->');
if (!html.includes("SEO-START")) html = html.replace(/<main id="app" tabindex="-1">/, `<main id="app" tabindex="-1">${block}`);
if (!html.includes('rel="alternate"')) html = html.replace("</head>", `<link rel="alternate" type="text/plain" href="llms-full.txt" title="All demo notes (plain text)">
<link rel="canonical" href="${URL}">
<script type="application/ld+json">${JSON.stringify({ ...ld, url: URL })}</script>
</head>`);
fs.writeFileSync("index.html", html);

fs.writeFileSync("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${["", "notes.html", "llms.txt", "llms-full.txt"].map((p) => `<url><loc>${URL}${p}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>`).join("\n")}
</urlset>
`);
console.log("notes chars:", txt.length);
