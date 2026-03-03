import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.js";
import productsRouter from "./routes/products.js";
import searchRouter from "./routes/search.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const latencySamples: number[] = [];
const MAX_SAMPLES = 2000;
const recordLatency = (ms: number) => {
  latencySamples.push(ms);
  if (latencySamples.length > MAX_SAMPLES) {
    latencySamples.shift();
  }
};
const percentile = (p: number) => {
  if (latencySamples.length === 0) return 0;
  const sorted = [...latencySamples].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
};

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  const originalEnd = res.end;

  res.end = function (...args) {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1_000_000;
    if (!res.headersSent) {
      res.setHeader("X-Response-Time", `${ms.toFixed(2)}ms`);
    }
    recordLatency(ms);
    return originalEnd.apply(this, args as Parameters<typeof originalEnd>);
  } as typeof res.end;

  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/metrics", (_req, res) => {
  res.json({
    samples: latencySamples.length,
    p50: Number(percentile(50).toFixed(2)),
    p95: Number(percentile(95).toFixed(2))
  });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/search", searchRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

app.use(
  "/images",
  express.static(path.join(publicDir, "images"), {
    setHeaders(res) {
      res.setHeader("Cache-Control", "public, max-age=86400");
    }
  })
);

app.use(express.static(publicDir));
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
