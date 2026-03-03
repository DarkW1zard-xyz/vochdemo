import dotenv from "dotenv";
import prisma from "../lib/prisma.js";
import { meiliClient, meiliIndexName } from "../lib/search.js";

dotenv.config();

const main = async () => {
  if (!meiliClient) {
    console.error("MEILI_URL not set");
    process.exit(1);
  }

  const products = await prisma.product.findMany();
  try {
    await meiliClient.deleteIndex(meiliIndexName);
  } catch {
    // ignore if index doesn't exist
  }

  await meiliClient.createIndex(meiliIndexName, { primaryKey: "id" });
  const index = meiliClient.index(meiliIndexName);

  await index.updateSettings({
    searchableAttributes: ["name", "description", "cpu", "gpu"],
    filterableAttributes: [
      "category",
      "brand",
      "type",
      "cpuBrand",
      "gpuBrand",
      "ram",
      "storage",
      "screen",
      "price",
      "availability",
      "inStock"
    ],
    sortableAttributes: ["price", "createdAt", "rating", "popularity"],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 }
    }
  });

  await index.addDocuments(products);
  console.log(`Indexed ${products.length} products`);
};

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
