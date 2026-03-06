import dotenv from "dotenv";
import prisma from "../lib/prisma.js";

dotenv.config();

const main = async () => {
  const duplicates = await prisma.$queryRawUnsafe<
    { name: string; keep_id: string }[]
  >(
    `SELECT name, MIN(id) AS keep_id FROM Product GROUP BY name HAVING COUNT(*) > 1`
  );

  let removed = 0;
  for (const row of duplicates) {
    const allWithName = await prisma.product.findMany({
      where: { name: row.name },
      select: { id: true },
      orderBy: { id: "asc" }
    });
    const idsToDelete = allWithName.slice(1).map((p) => p.id);
    if (idsToDelete.length > 0) {
      const result = await prisma.product.deleteMany({
        where: { id: { in: idsToDelete } }
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
