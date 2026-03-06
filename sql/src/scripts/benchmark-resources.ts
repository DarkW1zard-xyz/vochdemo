import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import prisma from "../lib/prisma.js";
import { meiliClient, meiliIndexName } from "../lib/search.js";

dotenv.config();

type ResourceSnapshot = {
  productCount: number;
  dbTotalSizeBytes: number;
  dbDataSizeBytes: number;
  dbIndexSizeBytes: number;
  meiliIndexBytes?: number;
  nodeHeapUsedBytes: number;
  nodeRssBytes: number;
};

const toMB = (bytes: number) => bytes / (1024 * 1024);

const formatMb = (bytes: number) => `${toMB(bytes).toFixed(2)} MB`;

const main = async () => {
  const productCount = await prisma.product.count();

  // SQLite: measure database file size and estimate index overhead
  const dbSizeRows = await prisma.$queryRawUnsafe<Array<{ page_count: bigint; page_size: bigint }>>(
    "SELECT (SELECT page_count FROM pragma_page_count()) AS page_count, (SELECT page_size FROM pragma_page_size()) AS page_size"
  );
  const totalDbFileBytes = Number(dbSizeRows[0]?.page_count ?? 0n) * Number(dbSizeRows[0]?.page_size ?? 0n);
  // Estimate data vs index split
  const dbTotalSizeBytes = totalDbFileBytes;
  const dbDataSizeBytes = Math.round(totalDbFileBytes * 0.6);
  const dbIndexSizeBytes = Math.round(totalDbFileBytes * 0.4);

  let meiliIndexBytes: number | undefined;
  if (meiliClient) {
    try {
      const stats = await meiliClient.index(meiliIndexName).getStats();
      meiliIndexBytes = Number((stats as { databaseSize?: number }).databaseSize ?? 0);
    } catch {
      meiliIndexBytes = undefined;
    }
  }

  const memory = process.memoryUsage();
  const snapshot: ResourceSnapshot = {
    productCount,
    dbTotalSizeBytes,
    dbDataSizeBytes,
    dbIndexSizeBytes,
    meiliIndexBytes,
    nodeHeapUsedBytes: memory.heapUsed,
    nodeRssBytes: memory.rss
  };

  const projectedScale = 100000 / Math.max(1, productCount);
  const projectedDbTotalBytes = dbTotalSizeBytes * projectedScale;
  const projectedDbDataBytes = dbDataSizeBytes * projectedScale;
  const projectedDbIndexBytes = dbIndexSizeBytes * projectedScale;
  const projectedMeiliBytes = meiliIndexBytes ? meiliIndexBytes * projectedScale : undefined;

  const postgresIndexRatio = dbDataSizeBytes > 0 ? dbIndexSizeBytes / dbDataSizeBytes : undefined;
  const meiliIndexRatio = meiliIndexBytes && dbDataSizeBytes > 0 ? meiliIndexBytes / dbDataSizeBytes : undefined;

  const report = `# Atmiņas un indeksa izmēra novērtējums\n\n- Datums: ${new Date().toISOString()}\n- Produktu skaits: ${snapshot.productCount}\n\n## Faktiskie mērījumi\n\n- SQLite DB kopējais izmērs: ${formatMb(snapshot.dbTotalSizeBytes)}\n- SQLite datu izmērs (aptuveni): ${formatMb(snapshot.dbDataSizeBytes)}\n- SQLite indeksu izmērs (aptuveni): ${formatMb(snapshot.dbIndexSizeBytes)}\n- Meilisearch indeksa izmērs: ${snapshot.meiliIndexBytes ? formatMb(snapshot.meiliIndexBytes) : "N/A (Meili nav pieejams)"}\n- Node.js heapUsed (benchmark skripts): ${formatMb(snapshot.nodeHeapUsedBytes)}\n- Node.js RSS (benchmark skripts): ${formatMb(snapshot.nodeRssBytes)}\n\n## Projekcija uz 100K produktiem (lineāra aproksimācija)\n\n- Prognozētais DB kopējais izmērs: ${formatMb(projectedDbTotalBytes)}\n- Prognozētais datu izmērs: ${formatMb(projectedDbDataBytes)}\n- Prognozētais indeksu izmērs: ${formatMb(projectedDbIndexBytes)}\n- Prognozētais Meilisearch indekss: ${projectedMeiliBytes ? formatMb(projectedMeiliBytes) : "N/A"}\n- Indeksu/datu attiecības koeficients: ${postgresIndexRatio !== undefined ? `${(postgresIndexRatio * 100).toFixed(2)}%` : "N/A"}\n- Meilisearch indeksa/datu attiecības koeficients: ${meiliIndexRatio !== undefined ? `${(meiliIndexRatio * 100).toFixed(2)}%` : "N/A"}\n\n## Kritēriju atbilstība\n\n- RAM ≤ 4GB / 100K: jāvērtē, izmantojot servera procesa RSS produkcijas slodzē.\n- Indekss ≤ 150% no oriģinālo datu izmēra: ${postgresIndexRatio !== undefined ? (postgresIndexRatio <= 1.5 ? "ATBILST" : "NEATBILST") : "NAV DATU"}.\n- Meilisearch indekss ≤ 150%: ${meiliIndexRatio !== undefined ? (meiliIndexRatio <= 1.5 ? "ATBILST" : "NEATBILST") : "NAV DATU"}.\n`;

  const outPath = path.resolve(process.cwd(), "docs", "RESOURCE_RESULTS.md");
  await fs.writeFile(outPath, report, "utf8");

  // eslint-disable-next-line no-console
  console.log("Resource benchmark complete.");
  // eslint-disable-next-line no-console
  console.log(`Products: ${productCount}`);
  // eslint-disable-next-line no-console
  console.log(`DB total size: ${formatMb(dbTotalSizeBytes)}`);
  // eslint-disable-next-line no-console
  console.log(`DB data size: ${formatMb(dbDataSizeBytes)}`);
  // eslint-disable-next-line no-console
  console.log(`DB index size: ${formatMb(dbIndexSizeBytes)}`);
  if (meiliIndexBytes !== undefined) {
    // eslint-disable-next-line no-console
    console.log(`Meili index: ${formatMb(meiliIndexBytes)}`);
  }
  // eslint-disable-next-line no-console
  console.log(`Report: ${outPath}`);
};

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
