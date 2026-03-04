import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import autocannon from "autocannon";

dotenv.config();

type Scenario = {
  title: string;
  connections: number;
  durationSeconds: number;
};

type ScenarioResult = {
  title: string;
  connections: number;
  durationSeconds: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  requestsPerSecond: number;
  throughputBytesPerSec: number;
  totalRequests: number;
  errors: number;
  timeouts: number;
};

type AutocannonResult = {
  latency: { average?: number; p95?: number; p97_5?: number; [key: string]: number | undefined };
  requests: { average: number; total: number };
  throughput: { average: number };
  errors: number;
  timeouts: number;
};

const BASE_URL = process.env.BENCHMARK_BASE_URL ?? "http://localhost:3000";

const scenarios: Scenario[] = [
  { title: "API search @100 concurrent", connections: 100, durationSeconds: 15 },
  { title: "API search @1000 concurrent", connections: 1000, durationSeconds: 15 }
];

const getP95 = (latency: AutocannonResult["latency"]) => {
  const direct = latency.p95;
  if (typeof direct === "number") return direct;
  const percentile95 = latency["95"];
  if (typeof percentile95 === "number") return percentile95;
  const fallback = latency.p97_5;
  if (typeof fallback === "number") return fallback;
  return latency.average ?? 0;
};

const runScenario = (scenario: Scenario): Promise<ScenarioResult> => {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: `${BASE_URL}/api/products?q=laptop&category=electronics&minPrice=500&maxPrice=2000&sort=price_asc&limit=24`,
        connections: scenario.connections,
        duration: scenario.durationSeconds,
        pipelining: 1,
        method: "GET"
      },
      (error: Error | null, result: AutocannonResult) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          title: scenario.title,
          connections: scenario.connections,
          durationSeconds: scenario.durationSeconds,
          averageLatencyMs: result.latency.average ?? 0,
          p95LatencyMs: getP95(result.latency),
          requestsPerSecond: result.requests.average,
          throughputBytesPerSec: result.throughput.average,
          totalRequests: result.requests.total,
          errors: result.errors,
          timeouts: result.timeouts
        });
      }
    );
  });
};

const format = (value: number) => value.toFixed(2);

const toMarkdown = (results: ScenarioResult[], generatedAt: string) => {
  const rows = results
    .map(
      (result) =>
        `| ${result.title} | ${result.connections} | ${result.durationSeconds} | ${format(result.averageLatencyMs)} | ${format(result.p95LatencyMs)} | ${format(result.requestsPerSecond)} | ${result.totalRequests} | ${result.errors} | ${result.timeouts} |`
    )
    .join("\n");

  return `# Caurlaides spējas un atbildes laika mērījumi\n\n- Datums: ${generatedAt}\n- Bāzes URL: ${BASE_URL}\n\n| Scenārijs | Concurrency | Ilgums (s) | Avg latency (ms) | p95 latency (ms) | Req/s | Total req | Errors | Timeouts |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n${rows}\n\n## Secinājumi\n\n- Kritērijs “< 200ms” tiek vērtēts pēc p95 latency.\n- Kritērijs “1000+ vienlaicīgas meklēšanas” tiek vērtēts pēc 1000 concurrency scenārija ar error/timeout skaitu.\n`;
};

const main = async () => {
  const results: ScenarioResult[] = [];
  for (const scenario of scenarios) {
    // eslint-disable-next-line no-console
    console.log(`Running: ${scenario.title}`);
    const result = await runScenario(scenario);
    results.push(result);
  }

  const report = toMarkdown(results, new Date().toISOString());
  const outPath = path.resolve(process.cwd(), "docs", "THROUGHPUT_RESULTS.md");
  await fs.writeFile(outPath, report, "utf8");

  // eslint-disable-next-line no-console
  console.log("Throughput benchmark complete.");
  for (const result of results) {
    // eslint-disable-next-line no-console
    console.log(
      `${result.title}: p95=${format(result.p95LatencyMs)}ms, req/s=${format(result.requestsPerSecond)}, errors=${result.errors}, timeouts=${result.timeouts}`
    );
  }
  // eslint-disable-next-line no-console
  console.log(`Report: ${outPath}`);
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
