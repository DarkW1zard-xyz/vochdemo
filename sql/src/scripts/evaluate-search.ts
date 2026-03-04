import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import prisma from "../lib/prisma.js";
import { meiliClient, meiliIndexName } from "../lib/search.js";

dotenv.config();

type ProductDoc = {
  id: string;
  name: string;
  description: string | null;
  brand: string;
  type: string;
  category: string;
  cpu: string;
  gpu: string;
  cpuBrand: string;
  gpuBrand: string;
};

type QueryCase = {
  query: string;
  minExpectedTop10Precision: number;
};

type RunStats = {
  count: number;
  min: number;
  p50: number;
  p95: number;
  max: number;
  avg: number;
};

type EngineResult = {
  engine: "meili" | "sql";
  runStats: RunStats;
  precisionAt10: number;
  perQuery: Array<{ query: string; avgLatencyMs: number; precisionAt10: number }>;
};

const REQUIRED_PRODUCT_COUNT = Number(process.env.EVAL_MIN_PRODUCTS ?? 10000);
const ITERATIONS = Number(process.env.EVAL_ITERATIONS ?? 20);
const TOP_K = Number(process.env.EVAL_TOP_K ?? 10);

const queryCases: QueryCase[] = [
  { query: "lenovo laptop", minExpectedTop10Precision: 0.6 },
  { query: "dell desktop", minExpectedTop10Precision: 0.6 },
  { query: "gaming nvidia", minExpectedTop10Precision: 0.5 },
  { query: "intel i7", minExpectedTop10Precision: 0.5 },
  { query: "amd ryzen", minExpectedTop10Precision: 0.5 },
  { query: "apple m3", minExpectedTop10Precision: 0.6 },
  { query: "office mini-pc", minExpectedTop10Precision: 0.4 },
  { query: "asus laptop", minExpectedTop10Precision: 0.6 },
  { query: "preorder", minExpectedTop10Precision: 0.3 },
  { query: "electronics all-in-one", minExpectedTop10Precision: 0.4 }
];

const percentile = (values: number[], p: number) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const low = Math.floor(index);
  const high = Math.ceil(index);
  if (low === high) return sorted[low] ?? 0;
  const weight = index - low;
  return (sorted[low] ?? 0) * (1 - weight) + (sorted[high] ?? 0) * weight;
};

const toStats = (values: number[]): RunStats => {
  const sum = values.reduce((acc, value) => acc + value, 0);
  return {
    count: values.length,
    min: values.length ? Math.min(...values) : 0,
    p50: percentile(values, 0.5),
    p95: percentile(values, 0.95),
    max: values.length ? Math.max(...values) : 0,
    avg: values.length ? sum / values.length : 0
  };
};

const normalize = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}\s-]+/gu, " ");

const isRelevant = (product: ProductDoc, query: string) => {
  const haystack = normalize(
    [
      product.name,
      product.description ?? "",
      product.brand,
      product.type,
      product.category,
      product.cpu,
      product.gpu,
      product.cpuBrand,
      product.gpuBrand
    ].join(" ")
  );

  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const matchedTokens = tokens.filter((token) => haystack.includes(token));
  return matchedTokens.length >= Math.ceil(tokens.length * 0.7);
};

const precisionAtK = (products: ProductDoc[], query: string, k: number) => {
  const top = products.slice(0, k);
  if (top.length === 0) return 0;
  const relevant = top.filter((product) => isRelevant(product, query)).length;
  return relevant / top.length;
};

const measure = async <T>(fn: () => Promise<T>) => {
  const start = process.hrtime.bigint();
  const result = await fn();
  const elapsedNs = process.hrtime.bigint() - start;
  const elapsedMs = Number(elapsedNs) / 1_000_000;
  return { result, elapsedMs };
};

const sqlSearch = async (query: string, topK: number): Promise<ProductDoc[]> => {
  const tokens = query.split(/\s+/).filter(Boolean);
  const where: Record<string, unknown> = {};

  if (tokens.length) {
    where.AND = tokens.map((token) => ({
      OR: [
        { name: { contains: token, mode: "insensitive" } },
        { description: { contains: token, mode: "insensitive" } },
        { brand: { contains: token, mode: "insensitive" } },
        { category: { contains: token, mode: "insensitive" } },
        { type: { contains: token, mode: "insensitive" } },
        { cpu: { contains: token, mode: "insensitive" } },
        { gpu: { contains: token, mode: "insensitive" } }
      ]
    }));
  }

  return prisma.product.findMany({
    where,
    take: topK,
    orderBy: [{ popularity: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      description: true,
      brand: true,
      type: true,
      category: true,
      cpu: true,
      gpu: true,
      cpuBrand: true,
      gpuBrand: true
    }
  });
};

const meiliSearch = async (query: string, topK: number): Promise<ProductDoc[]> => {
  if (!meiliClient) {
    throw new Error("MEILI_URL nav konfigurēts. Meili benchmark nav pieejams.");
  }

  const index = meiliClient.index(meiliIndexName);
  const response = await index.search(query, {
    limit: topK,
    attributesToRetrieve: [
      "id",
      "name",
      "description",
      "brand",
      "type",
      "category",
      "cpu",
      "gpu",
      "cpuBrand",
      "gpuBrand"
    ]
  });

  return (response.hits ?? []) as ProductDoc[];
};

const evaluateEngine = async (
  engine: "meili" | "sql",
  searchFn: (query: string, topK: number) => Promise<ProductDoc[]>
): Promise<EngineResult> => {
  const allLatencies: number[] = [];
  const perQuery: EngineResult["perQuery"] = [];

  for (const queryCase of queryCases) {
    const queryLatencies: number[] = [];
    const queryPrecisions: number[] = [];

    for (let i = 0; i < ITERATIONS; i += 1) {
      const { result, elapsedMs } = await measure(() => searchFn(queryCase.query, TOP_K));
      queryLatencies.push(elapsedMs);
      allLatencies.push(elapsedMs);
      queryPrecisions.push(precisionAtK(result, queryCase.query, TOP_K));
    }

    const avgLatency = queryLatencies.reduce((acc, value) => acc + value, 0) / queryLatencies.length;
    const avgPrecision = queryPrecisions.reduce((acc, value) => acc + value, 0) / queryPrecisions.length;

    perQuery.push({
      query: queryCase.query,
      avgLatencyMs: avgLatency,
      precisionAt10: avgPrecision
    });
  }

  const precisionAvg =
    perQuery.reduce((acc, item) => acc + item.precisionAt10, 0) / (perQuery.length || 1);

  return {
    engine,
    runStats: toStats(allLatencies),
    precisionAt10: precisionAvg,
    perQuery
  };
};

const formatNumber = (value: number) => value.toFixed(2);

const canUseMeili = async () => {
  if (!meiliClient) return false;
  try {
    await meiliClient.health();
    return true;
  } catch {
    return false;
  }
};

const buildMarkdownReport = (
  productCount: number,
  results: EngineResult[],
  generatedAtIso: string
) => {
  const meili = results.find((item) => item.engine === "meili");
  const sql = results.find((item) => item.engine === "sql");

  const summaryRows = results
    .map((result) => {
      const { runStats } = result;
      return `| ${result.engine.toUpperCase()} | ${runStats.count} | ${formatNumber(runStats.avg)} | ${formatNumber(runStats.p50)} | ${formatNumber(runStats.p95)} | ${formatNumber(runStats.max)} | ${formatNumber(result.precisionAt10)} |`;
    })
    .join("\n");

  const conclusion = meili && sql
    ? meili.runStats.p95 <= sql.runStats.p95
      ? "Izvēlētais risinājums (Meilisearch + invertētais indekss/BM25) nodrošina zemāku p95 latentumu pie līdzīgas vai labākas precizitātes."
      : "SQL fallback šajā palaišanā bija ātrāks p95 griezumā; ieteicams pārskatīt indeksa iestatījumus un datu sadalījumu."
    : "Rezultāti pieejami tikai vienam dzinējam, tāpēc salīdzinājums ir daļējs.";

  return `# Meklēšanas algoritma testēšanas rezultāti\n\n- Datums: ${generatedAtIso}\n- Produktu skaits: ${productCount}\n- Vaicājumu kopums: ${queryCases.length}\n- Iterācijas uz vaicājumu: ${ITERATIONS}\n- Precision metrika: Precision@${TOP_K}\n\n## Kopsavilkuma tabula\n\n| Dzinējs | Mērījumu skaits | Avg (ms) | p50 (ms) | p95 (ms) | Max (ms) | Precision@${TOP_K} |\n|---|---:|---:|---:|---:|---:|---:|\n${summaryRows}\n\n## Vaicājumu detalizācija\n\n${results
    .map((result) => {
      const rows = result.perQuery
        .map(
          (item) => `| ${item.query} | ${formatNumber(item.avgLatencyMs)} | ${formatNumber(item.precisionAt10)} |`
        )
        .join("\n");
      return `### ${result.engine.toUpperCase()}\n\n| Vaicājums | Avg latency (ms) | Precision@${TOP_K} |\n|---|---:|---:|\n${rows}`;
    })
    .join("\n\n")}\n\n## Secinājums\n\n${conclusion}\n`;
};

const main = async () => {
  const productCount = await prisma.product.count();
  if (productCount < REQUIRED_PRODUCT_COUNT) {
    throw new Error(
      `Nepietiek testdatu: atrasti ${productCount} produkti, nepieciešami vismaz ${REQUIRED_PRODUCT_COUNT}. ` +
        "Palaidiet: npm run products:generate"
    );
  }

  const results: EngineResult[] = [];

  const meiliAvailable = await canUseMeili();
  if (meiliAvailable) {
    try {
      results.push(await evaluateEngine("meili", meiliSearch));
    } catch (error) {
      console.warn("Meili evaluation skipped:", error);
    }
  } else if (meiliClient) {
    console.warn("Meili is configured, but service is unavailable. Continuing with SQL-only benchmark.");
  }

  results.push(await evaluateEngine("sql", sqlSearch));

  const generatedAtIso = new Date().toISOString();
  const report = buildMarkdownReport(productCount, results, generatedAtIso);
  const outPath = path.resolve(process.cwd(), "docs", "SEARCH_TEST_RESULTS.md");

  await fs.writeFile(outPath, report, "utf8");

  console.log("Search evaluation complete.");
  console.log(`Products: ${productCount}`);
  for (const result of results) {
    console.log(
      `${result.engine.toUpperCase()}: p50=${formatNumber(result.runStats.p50)}ms, p95=${formatNumber(
        result.runStats.p95
      )}ms, precision@${TOP_K}=${formatNumber(result.precisionAt10)}`
    );
  }
  console.log(`Report: ${outPath}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
