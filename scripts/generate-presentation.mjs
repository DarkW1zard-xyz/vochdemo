import fs from "node:fs";
import path from "node:path";
import PptxGenJS from "pptxgenjs";

const outDir = path.resolve("sql", "docs");
const outPath = path.join(outDir, "E_KOMERCIJAS_MEKLESANAS_SISTEMA_PREZENTACIJA.pptx");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "GitHub Copilot";
pptx.company = "vochdemo";
pptx.subject = "E-komercijas produktu meklesanas sistema";
pptx.title = "E-komercijas produktu meklesanas sistema";
pptx.lang = "lv-LV";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "lv-LV"
};

const colors = {
  navy: "0F172A",
  blue: "1D4ED8",
  teal: "0F766E",
  green: "15803D",
  amber: "B45309",
  slate: "334155",
  light: "E2E8F0",
  white: "FFFFFF",
  panel: "F8FAFC"
};

const addHeader = (slide, title, subtitle) => {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.75,
    fill: { color: colors.navy },
    line: { color: colors.navy }
  });
  slide.addText(title, {
    x: 0.45,
    y: 0.18,
    w: 8.2,
    h: 0.28,
    fontFace: "Aptos Display",
    fontSize: 24,
    bold: true,
    color: colors.white,
    margin: 0
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.45,
      y: 0.88,
      w: 9,
      h: 0.25,
      fontSize: 10,
      color: colors.slate,
      margin: 0
    });
  }
};

const addBulletList = (slide, items, x, y, w, h, options = {}) => {
  slide.addText(
    items.map((text) => ({ text, options: { bullet: { indent: 16 } } })),
    {
      x,
      y,
      w,
      h,
      fontSize: options.fontSize ?? 18,
      color: options.color ?? colors.slate,
      breakLine: true,
      valign: "top",
      margin: 0.08,
      paraSpaceAfterPt: 9
    }
  );
};

const addMetricCard = (slide, x, y, w, h, title, value, statusColor) => {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    fill: { color: colors.panel },
    line: { color: colors.light, pt: 1 }
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: x + 0.18,
    y: y + 0.18,
    w: 0.12,
    h: h - 0.36,
    fill: { color: statusColor },
    line: { color: statusColor }
  });
  slide.addText(title, {
    x: x + 0.42,
    y: y + 0.22,
    w: w - 0.6,
    h: 0.25,
    fontSize: 11,
    color: colors.slate,
    bold: true,
    margin: 0
  });
  slide.addText(value, {
    x: x + 0.42,
    y: y + 0.5,
    w: w - 0.6,
    h: 0.42,
    fontSize: 22,
    color: colors.navy,
    bold: true,
    margin: 0
  });
};

const slide1 = pptx.addSlide();
slide1.background = { color: colors.white };
slide1.addShape(pptx.ShapeType.rect, {
  x: 0,
  y: 0,
  w: 13.333,
  h: 7.5,
  fill: { color: "F7FAFC" },
  line: { color: "F7FAFC" }
});
slide1.addShape(pptx.ShapeType.rect, {
  x: 8.9,
  y: 0,
  w: 4.433,
  h: 7.5,
  fill: { color: colors.navy },
  line: { color: colors.navy }
});
slide1.addText("E-komercijas produktu\nmeklesanas sistema", {
  x: 0.7,
  y: 1.1,
  w: 7.1,
  h: 1.4,
  fontFace: "Aptos Display",
  fontSize: 24,
  bold: true,
  color: colors.navy,
  margin: 0
});
slide1.addText("Algoritma izvele, kompleksitates analize un testu rezultati", {
  x: 0.75,
  y: 2.7,
  w: 6.8,
  h: 0.5,
  fontSize: 16,
  color: colors.slate,
  margin: 0
});
slide1.addText("10 024 produkti\nSQLite + Prisma\nSQL fallback + optional Meilisearch", {
  x: 9.35,
  y: 1.55,
  w: 3.2,
  h: 1.8,
  fontSize: 20,
  color: colors.white,
  bold: true,
  margin: 0,
  breakLine: true
});
slide1.addText("Datums: 2026-03-06", {
  x: 0.75,
  y: 6.6,
  w: 3,
  h: 0.2,
  fontSize: 12,
  color: colors.slate,
  margin: 0
});

const slide2 = pptx.addSlide();
addHeader(slide2, "Uzdevums un prasibas", "Funkcionalas un nefunkcionalas prasibas, kas noteica arhitekturu");
addBulletList(slide2, [
  "Teksta meklesana pec nosaukuma un apraksta",
  "Filtri: kategorija, zimols, cena, pieejamiba",
  "Kartosana pec relevances, cenas, popularitates, reitinga un datuma",
  "Autocomplete, popularie termini un typo tolerance arhitekturas limeni",
  "Merki: <200 ms standarta meklejumam, 1000 vienlaicigi pieprasijumi",
  "Atminas limits: <= 4 GB uz 100K produktu, indekss <= 150% no datiem"
], 0.65, 1.25, 6.0, 4.7);
slide2.addShape(pptx.ShapeType.roundRect, {
  x: 7.15,
  y: 1.35,
  w: 5.35,
  h: 4.55,
  rectRadius: 0.08,
  fill: { color: colors.panel },
  line: { color: colors.light, pt: 1 }
});
slide2.addText("Datu modelis", {
  x: 7.45,
  y: 1.65,
  w: 2.4,
  h: 0.25,
  fontSize: 18,
  bold: true,
  color: colors.navy,
  margin: 0
});
slide2.addText("Product: id, name, description, category, brand, price, inStock, rating, createdAt", {
  x: 7.45,
  y: 2.05,
  w: 4.55,
  h: 1.15,
  fontSize: 16,
  color: colors.slate,
  breakLine: true,
  margin: 0
});
slide2.addText("Papildu lauki meklei: type, cpuBrand, cpu, gpuBrand, gpu, ram, storage, screen, popularity, tags", {
  x: 7.45,
  y: 3.2,
  w: 4.55,
  h: 1.35,
  fontSize: 16,
  color: colors.slate,
  breakLine: true,
  margin: 0
});

const slide3 = pptx.addSlide();
addHeader(slide3, "Algoritma izvele", "Izveleta hibrida pieeja: SQL meklesana ar inverteta indeksa arhitekturas virzienu");
addBulletList(slide3, [
  "Pamata dzinejs: SQL meklesana ar indeksiem un tokenu sadalisanu",
  "Papildiespeja: Meilisearch ar BM25 un typo tolerance augstai slodzei",
  "Redis kess populariem pieprasijumiem un ieteikumiem",
  "Request coalescing novers dubultu identisku meklejumu izpildi",
  "Fallback strategija nodrosina darbibu pat bez Redis un Meilisearch"
], 0.65, 1.25, 6.4, 4.7);
slide3.addText("Alternativu salidzinajums", {
  x: 7.35,
  y: 1.3,
  w: 2.9,
  h: 0.25,
  fontSize: 18,
  bold: true,
  color: colors.navy,
  margin: 0
});
slide3.addTable([
  [{ text: "Variants", options: { bold: true, color: colors.white, fill: colors.blue } }, { text: "Vertejums", options: { bold: true, color: colors.white, fill: colors.blue } }],
  ["SQL ILIKE", "Vienkarsa, bet vaja relevance un typo tolerance"],
  ["PostgreSQL FTS", "Labs, bet prasa PostgreSQL un papildus konfiguraciju"],
  ["Trie", "Lieliski autocomplete, neder pilnai meklei"],
  ["Meilisearch", "Labakais produkcija, bet areja atkariba"],
  ["Izvele: SQL + optional Meili", "Labakais balanss starp vienkarsibu un merogojamibu"]
], {
  x: 7.25,
  y: 1.75,
  w: 5.45,
  h: 4.1,
  border: { type: "solid", color: colors.light, pt: 1 },
  fontSize: 11,
  color: colors.slate,
  fill: colors.white,
  margin: 0.06,
  rowH: 0.5,
  colW: [1.8, 3.65]
});

const slide4 = pptx.addSlide();
addHeader(slide4, "Arhitektura", "API, kessa un datu glabasanas slani");
slide4.addShape(pptx.ShapeType.roundRect, { x: 0.75, y: 2.0, w: 2.0, h: 0.85, rectRadius: 0.06, fill: { color: colors.blue }, line: { color: colors.blue } });
slide4.addText("Frontend UI", { x: 1.18, y: 2.28, w: 1.1, h: 0.2, color: colors.white, fontSize: 20, bold: true, margin: 0 });
slide4.addShape(pptx.ShapeType.chevron, { x: 2.95, y: 2.18, w: 0.55, h: 0.45, fill: { color: colors.light }, line: { color: colors.light } });
slide4.addShape(pptx.ShapeType.roundRect, { x: 3.75, y: 1.25, w: 2.1, h: 0.8, rectRadius: 0.06, fill: { color: colors.navy }, line: { color: colors.navy } });
slide4.addText("/api/products", { x: 4.12, y: 1.52, w: 1.3, h: 0.2, color: colors.white, fontSize: 18, bold: true, margin: 0 });
slide4.addShape(pptx.ShapeType.roundRect, { x: 3.75, y: 2.4, w: 2.1, h: 0.8, rectRadius: 0.06, fill: { color: colors.teal }, line: { color: colors.teal } });
slide4.addText("/api/search", { x: 4.17, y: 2.67, w: 1.2, h: 0.2, color: colors.white, fontSize: 18, bold: true, margin: 0 });
slide4.addShape(pptx.ShapeType.roundRect, { x: 3.75, y: 3.55, w: 2.1, h: 0.8, rectRadius: 0.06, fill: { color: colors.green }, line: { color: colors.green } });
slide4.addText("In-memory cache", { x: 3.98, y: 3.82, w: 1.65, h: 0.2, color: colors.white, fontSize: 16, bold: true, margin: 0 });
slide4.addShape(pptx.ShapeType.chevron, { x: 6.1, y: 2.18, w: 0.55, h: 0.45, fill: { color: colors.light }, line: { color: colors.light } });
slide4.addShape(pptx.ShapeType.roundRect, { x: 6.9, y: 1.25, w: 2.15, h: 0.8, rectRadius: 0.06, fill: { color: colors.panel }, line: { color: colors.light } });
slide4.addText("Redis (optional)", { x: 7.28, y: 1.52, w: 1.4, h: 0.2, color: colors.navy, fontSize: 17, bold: true, margin: 0 });
slide4.addShape(pptx.ShapeType.roundRect, { x: 6.9, y: 2.4, w: 2.15, h: 0.8, rectRadius: 0.06, fill: { color: colors.panel }, line: { color: colors.light } });
slide4.addText("SQLite + Prisma", { x: 7.24, y: 2.67, w: 1.5, h: 0.2, color: colors.navy, fontSize: 17, bold: true, margin: 0 });
slide4.addShape(pptx.ShapeType.roundRect, { x: 6.9, y: 3.55, w: 2.15, h: 0.8, rectRadius: 0.06, fill: { color: colors.panel }, line: { color: colors.light } });
slide4.addText("Meilisearch optional", { x: 7.12, y: 3.82, w: 1.75, h: 0.2, color: colors.navy, fontSize: 16, bold: true, margin: 0 });
slide4.addText("Galvenais princips: ja arejie servisi nav pieejami, sistema turpina stradat ar SQL fallback un bez krasiem.", {
  x: 0.8,
  y: 5.7,
  w: 11.8,
  h: 0.5,
  fontSize: 17,
  color: colors.slate,
  margin: 0
});

const slide5 = pptx.addSlide();
addHeader(slide5, "Kompleksitates analize", "Galvenie laika un vietas novertejumi");
slide5.addTable([
  [{ text: "Operaciona", options: { bold: true, color: colors.white, fill: colors.navy } }, { text: "Sarezgitiba", options: { bold: true, color: colors.white, fill: colors.navy } }, { text: "Piezime", options: { bold: true, color: colors.white, fill: colors.navy } }],
  ["Tokenu sadalisana", "O(T)", "Parasti 1-4 tokeni"],
  ["Filtri ar indeksiem", "O(F log N)", "B-tree uz filtrejamiem laukiem"],
  ["Teksta contains meklesana", "O(N * L)", "Sliktaka gadijuma pilna skenesana"],
  ["Kartosana", "O(M log M)", "Pec rezultatu kopas"],
  ["Cache hit", "O(1)", "Map vai Redis GET"],
  ["Meili meklesana", "O(T + M log M)", "Invertetais indekss + relevance"]
], {
  x: 0.65,
  y: 1.3,
  w: 12,
  h: 3.55,
  border: { type: "solid", color: colors.light, pt: 1 },
  fontSize: 12,
  color: colors.slate,
  fill: colors.white,
  margin: 0.05,
  colW: [3.1, 2.0, 6.9]
});
addMetricCard(slide5, 0.8, 5.3, 2.4, 1.15, "Labakais scenarijs", "O(1)", colors.green);
addMetricCard(slide5, 3.45, 5.3, 2.7, 1.15, "Videjais scenarijs", "O(T + F log N + K)", colors.blue);
addMetricCard(slide5, 6.45, 5.3, 2.9, 1.15, "Sliktakais scenarijs", "O(N * T * L + N log N)", colors.amber);
addMetricCard(slide5, 9.7, 5.3, 2.4, 1.15, "Index/data ratio", "66.67%", colors.green);

const slide6 = pptx.addSlide();
addHeader(slide6, "Testu dati un metodika", "10K+ produktu sintesiska kopa un vairaki merijumu scenariji");
addBulletList(slide6, [
  "10 000 genereeti produkti + 24 seed produkti = 10 024 ieraksti",
  "18 zimoli, 4 kategorijas, 4 iericu tipi, 3 CPU zimoli",
  "Cenu diapazons: 499-3499, RAM 8-64 GB, storage 256-2048 GB",
  "Pieejamiba: 85% in_stock, 15% preorder",
  "Precision tests: 10 vaicajumi x 20 iteracijas = 200 merijumi",
  "Throughput: autocannon ar 100 un 1000 vienlaicigiem savienojumiem"
], 0.65, 1.25, 6.4, 4.8);
slide6.addTable([
  [{ text: "Metrika", options: { bold: true, color: colors.white, fill: colors.blue } }, { text: "Vertiba", options: { bold: true, color: colors.white, fill: colors.blue } }],
  ["Produktu skaits", "10 024"],
  ["Iteracijas uz vaicajumu", "20"],
  ["Precision metrika", "Precision@10"],
  ["Throughput ilgums", "15 s katram scenarijam"],
  ["DB", "SQLite ar Prisma"],
  ["Node.js", "v24.14.0"]
], {
  x: 7.45,
  y: 1.5,
  w: 4.7,
  h: 3.4,
  border: { type: "solid", color: colors.light, pt: 1 },
  fontSize: 12,
  color: colors.slate,
  fill: colors.white,
  margin: 0.05,
  colW: [2.3, 2.4]
});

const slide7 = pptx.addSlide();
addHeader(slide7, "Precizitates rezultati", "SQL dzineja relevance un latentums 200 merijumos");
addMetricCard(slide7, 0.8, 1.35, 2.4, 1.2, "Precision@10", "0.90", colors.green);
addMetricCard(slide7, 3.55, 1.35, 2.4, 1.2, "p50 latency", "2.53 ms", colors.green);
addMetricCard(slide7, 6.3, 1.35, 2.4, 1.2, "p95 latency", "31.79 ms", colors.green);
addMetricCard(slide7, 9.05, 1.35, 2.4, 1.2, "Max latency", "70.08 ms", colors.amber);
slide7.addTable([
  [{ text: "Vaicajums", options: { bold: true, color: colors.white, fill: colors.navy } }, { text: "Avg ms", options: { bold: true, color: colors.white, fill: colors.navy } }, { text: "P@10", options: { bold: true, color: colors.white, fill: colors.navy } }],
  ["lenovo laptop", "6.99", "1.00"],
  ["dell desktop", "4.87", "1.00"],
  ["gaming nvidia", "2.29", "1.00"],
  ["intel i7", "1.96", "1.00"],
  ["amd ryzen", "2.32", "1.00"],
  ["apple m3", "2.03", "1.00"],
  ["office mini-pc", "2.57", "1.00"],
  ["asus laptop", "5.04", "1.00"],
  ["preorder", "36.31", "0.00"],
  ["electronics all-in-one", "2.24", "1.00"]
], {
  x: 1.35,
  y: 2.95,
  w: 10.65,
  h: 3.7,
  border: { type: "solid", color: colors.light, pt: 1 },
  fontSize: 11,
  color: colors.slate,
  fill: colors.white,
  margin: 0.05,
  colW: [5.5, 2.2, 2.0]
});

const slide8 = pptx.addSlide();
addHeader(slide8, "Caurlaides speja un resursi", "Merijumi pie 100 un 1000 vienlaicigiem pieprasijumiem, plus atminas novertejums");
addMetricCard(slide8, 0.8, 1.35, 2.7, 1.2, "@100 p95", "52 ms", colors.green);
addMetricCard(slide8, 3.85, 1.35, 2.9, 1.2, "@1000 req/s", "3137.80", colors.green);
addMetricCard(slide8, 7.1, 1.35, 2.5, 1.2, "Node RSS", "95.19 MB", colors.green);
addMetricCard(slide8, 9.95, 1.35, 2.5, 1.2, "Projected 100K RSS", "~950 MB", colors.green);
slide8.addTable([
  [{ text: "Scenarijs", options: { bold: true, color: colors.white, fill: colors.blue } }, { text: "Avg ms", options: { bold: true, color: colors.white, fill: colors.blue } }, { text: "p95 ms", options: { bold: true, color: colors.white, fill: colors.blue } }, { text: "Req/s", options: { bold: true, color: colors.white, fill: colors.blue } }, { text: "Errors", options: { bold: true, color: colors.white, fill: colors.blue } }],
  ["100 concurrent", "31.42", "52.00", "3131.27", "0"],
  ["1000 concurrent", "315.25", "474.00", "3137.80", "0"]
], {
  x: 0.85,
  y: 3.0,
  w: 6.15,
  h: 1.8,
  border: { type: "solid", color: colors.light, pt: 1 },
  fontSize: 11,
  color: colors.slate,
  fill: colors.white,
  margin: 0.05,
  colW: [2.0, 1.0, 1.0, 1.15, 1.0]
});
slide8.addTable([
  [{ text: "Resurss", options: { bold: true, color: colors.white, fill: colors.teal } }, { text: "Vertiba", options: { bold: true, color: colors.white, fill: colors.teal } }],
  ["SQLite DB", "5.90 MB"],
  ["Data size", "3.54 MB"],
  ["Index size", "2.36 MB"],
  ["Index/data ratio", "66.67%"],
  ["Projected DB @100K", "58.88 MB"]
], {
  x: 7.4,
  y: 3.0,
  w: 4.7,
  h: 2.6,
  border: { type: "solid", color: colors.light, pt: 1 },
  fontSize: 11,
  color: colors.slate,
  fill: colors.white,
  margin: 0.05,
  colW: [2.4, 2.3]
});

const slide9 = pptx.addSlide();
addHeader(slide9, "Secinajumi", "Rezultatu interpretacija un turpmakie uzlabojumi");
addBulletList(slide9, [
  "Sistema izpilda galvenas funkcionalas prasibas: teksta meklesana, filtri, kartosana un autocomplete",
  "Veiktspeja atbilst merkim standarta scenarija: p95 = 31.79 ms, kas ir stipri zem 200 ms",
  "1000 vienlaicigi pieprasijumi tika apstradati bez kludam un timeoutiem",
  "Atminas un indeksu prasibas ir izpilditas: ~950 MB uz 100K produktu un 66.67% index/data ratio",
  "Vajaka vieta ir preorder vaicajums; to var uzlabot ar plasaku search lauku kopu vai Meilisearch",
  "Produkcijas uzlabojumi: aktivizet Meilisearch, saglabat popularos terminus Redis un izmantot PostgreSQL/GIN, ja nepieciesams"
], 0.75, 1.4, 12.0, 4.6, { fontSize: 18 });
slide9.addText("Galvenais secinajums: izveleta hibrida arhitektura ir praktiska, pietiekami atri darbojas ar 10K produktu kopu un ir skaidri merogojama talak.", {
  x: 0.8,
  y: 6.2,
  w: 11.9,
  h: 0.5,
  fontSize: 20,
  bold: true,
  color: colors.navy,
  margin: 0
});

fs.mkdirSync(outDir, { recursive: true });
await pptx.writeFile({ fileName: outPath });
console.log(outPath);
