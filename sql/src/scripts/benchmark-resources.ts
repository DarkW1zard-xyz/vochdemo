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

  const dbRows = await prisma.$queryRaw<Array<{ total: bigint; data: bigint; indexes: bigint }>>`
    SELECT
      pg_total_relation_size('"Product"') AS total,
      pg_relation_size('"Product"') AS data,
      pg_indexes_size('"Product"') AS indexes
  `;
  const dbTotalSizeBytes = Number(dbRows[0]?.total ?? 0);
  const dbDataSizeBytes = Number(dbRows[0]?.data ?? 0);
  const dbIndexSizeBytes = Number(dbRows[0]?.indexes ?? 0);

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

  const report = `# Atmiņas un indeksa izmēra novērtējums\n\n- Datums: ${new Date().toISOString()}\n- Produktu skaits: ${snapshot.productCount}\n\n## Faktiskie mērījumi\n\n- PostgreSQL Product kopējais izmērs (data + index): ${formatMb(snapshot.dbTotalSizeBytes)}\n- PostgreSQL Product datu izmērs: ${formatMb(snapshot.dbDataSizeBytes)}\n- PostgreSQL Product indeksu izmērs: ${formatMb(snapshot.dbIndexSizeBytes)}\n- Meilisearch indeksa izmērs: ${snapshot.meiliIndexBytes ? formatMb(snapshot.meiliIndexBytes) : "N/A (Meili nav pieejams)"}\n- Node.js heapUsed (benchmark skripts): ${formatMb(snapshot.nodeHeapUsedBytes)}\n- Node.js RSS (benchmark skripts): ${formatMb(snapshot.nodeRssBytes)}\n\n## Projekcija uz 100K produktiem (lineāra aproksimācija)\n\n- Prognozētais Product kopējais izmērs: ${formatMb(projectedDbTotalBytes)}\n- Prognozētais Product datu izmērs: ${formatMb(projectedDbDataBytes)}\n- Prognozētais Product indeksu izmērs: ${formatMb(projectedDbIndexBytes)}\n- Prognozētais Meilisearch indekss: ${projectedMeiliBytes ? formatMb(projectedMeiliBytes) : "N/A"}\n- PostgreSQL indeksu/datu attiecības koeficients: ${postgresIndexRatio !== undefined ? `${(postgresIndexRatio * 100).toFixed(2)}%` : "N/A"}\n- Meilisearch indeksa/datu attiecības koeficients: ${meiliIndexRatio !== undefined ? `${(meiliIndexRatio * 100).toFixed(2)}%` : "N/A"}\n\n## Kritēriju atbilstība\n\n- RAM ≤ 4GB / 100K: jāvērtē, izmantojot servera procesa RSS produkcijas slodzē.\n- Indekss ≤ 150% no oriģinālo datu izmēra (PostgreSQL): ${postgresIndexRatio !== undefined ? (postgresIndexRatio <= 1.5 ? "ATBILST" : "NEATBILST") : "NAV DATU"}.\n- Indekss ≤ 150% no oriģinālo datu izmēra (Meilisearch): ${meiliIndexRatio !== undefined ? (meiliIndexRatio <= 1.5 ? "ATBILST" : "NEATBILST") : "NAV DATU"}.\n`;

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
