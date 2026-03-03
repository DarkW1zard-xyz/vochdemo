import { MeiliSearch } from "meilisearch";

const MEILI_URL = process.env.MEILI_URL;
const MEILI_API_KEY = process.env.MEILI_API_KEY;

export const meiliClient = MEILI_URL
  ? new MeiliSearch({ host: MEILI_URL, apiKey: MEILI_API_KEY || undefined })
  : null;

export const meiliIndexName = "products";
