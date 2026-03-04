import { Router, type Request, type Response } from "express";
import { meiliClient, meiliIndexName } from "../lib/search.js";
import { redis, connectRedis } from "../lib/redis.js";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/suggest", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string | undefined)?.trim() ?? "";
    if (meiliClient) {
      try {
        const index = meiliClient.index(meiliIndexName);
        const result = await index.search(q, {
          limit: 8,
          attributesToRetrieve: ["name"]
        });

        const names = Array.from(
          new Set((result.hits ?? []).map((hit: any) => hit.name).filter(Boolean))
        );

        return res.json({ items: names });
      } catch {
        // fallback to SQL suggestions
      }
    }

    if (!q) {
      const items = await prisma.product.findMany({
        take: 8,
        orderBy: [{ popularity: "desc" }, { rating: "desc" }],
        select: { name: true }
      });
      return res.json({ items: items.map((item) => item.name) });
    }

    const items = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { name: { startsWith: q, mode: "insensitive" } }
        ]
      },
      take: 8,
      orderBy: [{ popularity: "desc" }, { rating: "desc" }],
      select: { name: true }
    });

    return res.json({ items: Array.from(new Set(items.map((item) => item.name))) });
  } catch (error) {
    console.error("Suggestions failed", error);
    return res.status(500).json({ error: "Suggestion lookup failed" });
  }
});

router.get("/popular", async (_req: Request, res: Response) => {
  await connectRedis();
  if (!redis?.isOpen) {
    return res.json({ items: [] });
  }

  try {
    const items = await redis.zRange("search:terms", 0, 7, { REV: true });
    return res.json({ items });
  } catch {
    return res.json({ items: [] });
  }
});

export default router;
