import dotenv from "dotenv";
import prisma from "../lib/prisma.js";

dotenv.config();

const main = async () => {
  const duplicates = await prisma.$queryRaw<
    { name: string; keep_id: string; dup_ids: string[] }[]
  >`
    SELECT name,
           MIN(id) AS keep_id,
           ARRAY_REMOVE(ARRAY_AGG(id), MIN(id)) AS dup_ids
    FROM "Product"
    GROUP BY name
    HAVING COUNT(*) > 1;
  `;

  let removed = 0;
  for (const row of duplicates) {
    if (row.dup_ids.length > 0) {
      const result = await prisma.product.deleteMany({
        where: { id: { in: row.dup_ids } }
      });
      removed += result.count;
    }
  }

  console.log(`Removed ${removed} duplicate products.`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
