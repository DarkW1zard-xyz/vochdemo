import { Router, type Request, type Response } from "express";
import prisma from "../lib/prisma.js";
import { redis, connectRedis } from "../lib/redis.js";
import { meiliClient, meiliIndexName } from "../lib/search.js";
import { getCachedJson, setCachedJson } from "../lib/query-cache.js";

const router = Router();
const inFlightSearches = new Map<string, Promise<{ items: unknown[]; total: number; limit: number; offset: number }>>();

const toNumber = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseAvailability = (value?: string) => {
  if (!value) return undefined;
  if (value === "in_stock") return true;
  if (value === "out_of_stock" || value === "preorder") return false;
  return undefined;
};

const KNOWN_TYPES = new Set(["laptop", "desktop", "mini-pc", "all-in-one"]);
const KNOWN_CATEGORIES = new Set(["electronics", "computers", "gaming", "office", "accessories"]);
const KNOWN_CPU_BRANDS = new Set(["intel", "amd", "apple"]);
const KNOWN_GPU_BRANDS = new Set(["nvidia", "amd", "apple", "integrated"]);

const inferTokenFilters = (tokens: string[]) => {
  let inferredType: string | undefined;
  let inferredCategory: string | undefined;
  let inferredCpuBrand: string | undefined;
  let inferredGpuBrand: string | undefined;

  const textTokens: string[] = [];

  for (const token of tokens) {
    const normalized = token.toLowerCase();
    if (!inferredType && KNOWN_TYPES.has(normalized)) {
      inferredType = normalized;
      continue;
    }
    if (!inferredCategory && KNOWN_CATEGORIES.has(normalized)) {
      inferredCategory = normalized;
      continue;
    }
    if (!inferredCpuBrand && KNOWN_CPU_BRANDS.has(normalized)) {
      inferredCpuBrand = normalized;
      continue;
    }
    if (!inferredGpuBrand && KNOWN_GPU_BRANDS.has(normalized)) {
      inferredGpuBrand = normalized;
      continue;
    }
    textTokens.push(token);
  }

  return { inferredType, inferredCategory, inferredCpuBrand, inferredGpuBrand, textTokens };
};

router.get("/", async (req: Request, res: Response) => {
  try {
    await connectRedis();
    const redisReady = Boolean(redis?.isOpen);
    const q = (req.query.q as string | undefined)?.trim();
    const requestedCategory = (req.query.category as string | undefined)?.trim();
    const brand = (req.query.brand as string | undefined)?.trim();
    const requestedType = (req.query.type as string | undefined)?.trim();
    const requestedCpuBrand = (req.query.cpuBrand as string | undefined)?.trim();
    const requestedGpuBrand = (req.query.gpuBrand as string | undefined)?.trim();
    const availability = (req.query.availability as string | undefined)?.trim();
    const availabilityInStock = parseAvailability(availability);

    const minRam = toNumber(req.query.minRam as string | undefined);
    const minStorage = toNumber(req.query.minStorage as string | undefined);
    const minScreen = toNumber(req.query.minScreen as string | undefined);
    const minPrice = toNumber(req.query.minPrice as string | undefined);
    const maxPrice = toNumber(req.query.maxPrice as string | undefined);

    const requestedLimit = toNumber(req.query.limit as string | undefined) ?? 24;
    const limit = Math.min(requestedLimit, 100);
    const offset = toNumber(req.query.offset as string | undefined) ?? 0;
    const sort = (req.query.sort as string | undefined)?.trim();

    if (requestedLimit <= 0 || offset < 0) {
      return res.status(400).json({ error: "Invalid pagination values" });
    }

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return res.status(400).json({ error: "minPrice cannot be greater than maxPrice" });
    }

    if (availability && availabilityInStock === undefined) {
      return res.status(400).json({ error: "Invalid availability value" });
    }

    const queryTokens = (q ?? "").split(/\s+/).filter(Boolean);
    const inferred = inferTokenFilters(queryTokens);

    const category = requestedCategory ?? inferred.inferredCategory;
    const type = requestedType ?? inferred.inferredType;
    const cpuBrand = requestedCpuBrand ?? inferred.inferredCpuBrand;
    const gpuBrand = requestedGpuBrand ?? inferred.inferredGpuBrand;
    const textTokens = inferred.textTokens;

    const cacheKey = `products:${JSON.stringify({ q, category, brand, type, cpuBrand, gpuBrand, availabilityInStock, minRam, minStorage, minScreen, minPrice, maxPrice, limit, offset, sort })}`;

    const localCached = getCachedJson(cacheKey);
    if (localCached) {
      return res.json(JSON.parse(localCached));
    }

    if (redisReady && redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          setCachedJson(cacheKey, cached);
          return res.json(JSON.parse(cached));
        }
        if (q) {
          await redis.zIncrBy("search:terms", 1, q.toLowerCase());
        }
      } catch {
        // ignore redis read/write failures and continue
      }
    }

    const existingInFlight = inFlightSearches.get(cacheKey);
    if (existingInFlight) {
      const payload = await existingInFlight;
      return res.json(payload);
    }

    const pendingSearch = (async () => {
      if (meiliClient) {
        try {
          const index = meiliClient.index(meiliIndexName);
          const filters: string[] = [];
          if (category) filters.push(`category = "${category}"`);
          if (brand) filters.push(`brand = "${brand}"`);
          if (type) filters.push(`type = "${type}"`);
          if (cpuBrand) filters.push(`cpuBrand = "${cpuBrand}"`);
          if (gpuBrand) filters.push(`gpuBrand = "${gpuBrand}"`);
          if (availabilityInStock !== undefined) filters.push(`inStock = ${availabilityInStock ? "true" : "false"}`);
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

          return { items: hits, total: estimatedTotalHits ?? hits.length, limit, offset };
        } catch {
          // fallback to SQL when meili is configured but unavailable
        }
      }

      const where: Record<string, unknown> = {
        ...(category ? { category } : {}),
        ...(brand ? { brand } : {}),
        ...(type ? { type } : {}),
        ...(cpuBrand ? { cpuBrand } : {}),
        ...(gpuBrand ? { gpuBrand } : {}),
        ...(availabilityInStock !== undefined ? { inStock: availabilityInStock } : {}),
        ...(minRam ? { ram: { gte: minRam } } : {}),
        ...(minStorage ? { storage: { gte: minStorage } } : {}),
        ...(minScreen ? { screen: { gte: minScreen } } : {}),
        ...(minPrice ? { price: { gte: minPrice } } : {}),
        ...(maxPrice ? { price: { lte: maxPrice } } : {})
      };

      if (textTokens.length) {
        where.AND = textTokens.map((token) => ({
          OR: [
            { name: { contains: token } },
            { description: { contains: token } },
            { cpu: { contains: token } },
            { gpu: { contains: token } }
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

      return { items: items.map((item) => ({ ...item, tags: JSON.parse(item.tags) })), total, limit, offset };
    })();

    inFlightSearches.set(cacheKey, pendingSearch);

    try {
      const payload = await pendingSearch;
      const serialized = JSON.stringify(payload);
      setCachedJson(cacheKey, serialized);
      if (redisReady && redis) {
        try {
          await redis.set(cacheKey, serialized, { EX: 60 });
        } catch {
          // ignore redis write failures
        }
      }
      return res.json(payload);
    } finally {
      inFlightSearches.delete(cacheKey);
    }
  } catch (error) {
    console.error("Product search failed", error);
    return res.status(500).json({ error: "Search failed" });
  }
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
