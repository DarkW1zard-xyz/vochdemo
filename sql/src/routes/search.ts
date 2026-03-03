import { Router, type Request, type Response } from "express";
import { meiliClient, meiliIndexName } from "../lib/search.js";
import { redis, connectRedis } from "../lib/redis.js";

const router = Router();

router.get("/suggest", async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim() ?? "";
  if (!meiliClient) {
    return res.json({ items: [] });
  }

  const index = meiliClient.index(meiliIndexName);
  const result = await index.search(q, {
    limit: 8,
    attributesToRetrieve: ["name"]
  });

  const names = Array.from(
    new Set((result.hits ?? []).map((hit: any) => hit.name).filter(Boolean))
  );

  return res.json({ items: names });
});

router.get("/popular", async (_req: Request, res: Response) => {
  await connectRedis();
  if (!redis) {
    return res.json({ items: [] });
  }

  const items = await redis.zRange("search:terms", 0, 7, { REV: true });
  return res.json({ items });
});

export default router;
