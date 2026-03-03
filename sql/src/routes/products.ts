import { Router, type Request, type Response } from "express";
import prisma from "../lib/prisma.js";
import { redis, connectRedis } from "../lib/redis.js";
import { meiliClient, meiliIndexName } from "../lib/search.js";

const router = Router();

const toNumber = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

router.get("/", async (req: Request, res: Response) => {
  await connectRedis();
  const q = (req.query.q as string | undefined)?.trim();
  const category = (req.query.category as string | undefined)?.trim();
  const brand = (req.query.brand as string | undefined)?.trim();
  const type = (req.query.type as string | undefined)?.trim();
  const cpuBrand = (req.query.cpuBrand as string | undefined)?.trim();
  const gpuBrand = (req.query.gpuBrand as string | undefined)?.trim();
  const availability = (req.query.availability as string | undefined)?.trim();

  const minRam = toNumber(req.query.minRam as string | undefined);
  const minStorage = toNumber(req.query.minStorage as string | undefined);
  const minScreen = toNumber(req.query.minScreen as string | undefined);
  const minPrice = toNumber(req.query.minPrice as string | undefined);
  const maxPrice = toNumber(req.query.maxPrice as string | undefined);

  const limit = Math.min(toNumber(req.query.limit as string | undefined) ?? 24, 100);
  const offset = toNumber(req.query.offset as string | undefined) ?? 0;
  const sort = (req.query.sort as string | undefined)?.trim();

  const cacheKey = `products:${JSON.stringify({ q, category, brand, type, cpuBrand, gpuBrand, availability, minRam, minStorage, minScreen, minPrice, maxPrice, limit, offset, sort })}`;
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    if (q) {
      await redis.zIncrBy("search:terms", 1, q.toLowerCase());
    }
  }

  if (meiliClient) {
    const index = meiliClient.index(meiliIndexName);
    const filters: string[] = [];
    if (category) filters.push(`category = "${category}"`);
    if (brand) filters.push(`brand = "${brand}"`);
    if (type) filters.push(`type = "${type}"`);
    if (cpuBrand) filters.push(`cpuBrand = "${cpuBrand}"`);
    if (gpuBrand) filters.push(`gpuBrand = "${gpuBrand}"`);
    if (availability) filters.push(`inStock = ${availability === "in_stock" ? "true" : "false"}`);
    if (minRam) filters.push(`ram >= ${minRam}`);
    if (minStorage) filters.push(`storage >= ${minStorage}`);
    if (minScreen) filters.push(`screen >= ${minScreen}`);
    if (minPrice) filters.push(`price >= ${minPrice}`);
    if (maxPrice) filters.push(`price <= ${maxPrice}`);

    const sortBy = sort === "price_asc"
      ? ["price:asc"]
      : sort === "price_desc"
        ? ["price:desc"]
        : sort === "rating_desc"
          ? ["rating:desc"]
          : sort === "popularity_desc"
            ? ["popularity:desc"]
            : sort === "newest"
              ? ["createdAt:desc"]
              : undefined;

    const { hits, estimatedTotalHits } = await index.search(q || "", {
      filter: filters.length ? filters.join(" AND ") : undefined,
      limit,
      offset,
      sort: sortBy
    });

    const payload = { items: hits, total: estimatedTotalHits ?? hits.length, limit, offset };
    if (redis) {
      await redis.set(cacheKey, JSON.stringify(payload), { EX: 60 });
    }
    return res.json(payload);
  }

  const where: Record<string, unknown> = {
    ...(category ? { category } : {}),
    ...(brand ? { brand } : {}),
    ...(type ? { type } : {}),
    ...(cpuBrand ? { cpuBrand } : {}),
    ...(gpuBrand ? { gpuBrand } : {}),
    ...(availability ? { inStock: availability === "in_stock" } : {}),
    ...(minRam ? { ram: { gte: minRam } } : {}),
    ...(minStorage ? { storage: { gte: minStorage } } : {}),
    ...(minScreen ? { screen: { gte: minScreen } } : {}),
    ...(minPrice ? { price: { gte: minPrice } } : {}),
    ...(maxPrice ? { price: { lte: maxPrice } } : {})
  };

  if (q) {
    const tokens = q.split(/\s+/).filter(Boolean);
    where.AND = tokens.map((token) => ({
      OR: [
        { name: { contains: token, mode: "insensitive" } },
        { description: { contains: token, mode: "insensitive" } },
        { cpu: { contains: token, mode: "insensitive" } },
        { gpu: { contains: token, mode: "insensitive" } }
      ]
    }));
  }

  const orderBy: Record<string, "asc" | "desc"> = sort === "price_asc"
    ? { price: "asc" }
    : sort === "price_desc"
      ? { price: "desc" }
      : sort === "rating_desc"
        ? { rating: "desc" }
        : sort === "popularity_desc"
          ? { popularity: "desc" }
          : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit
    }),
    prisma.product.count({ where })
  ]);

  const payload = { items, total, limit, offset };
  if (redis) {
    await redis.set(cacheKey, JSON.stringify(payload), { EX: 60 });
  }
  return res.json(payload);
});

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return res.status(404).json({ error: "Not found" });
  }
  return res.json(product);
});

export default router;
