# PC & Laptop Search (SQL + 1M users ready)

This project provides a Node.js + PostgreSQL backend with Prisma and a simple frontend that queries the API.

## Features
- SQL storage for users and products (PostgreSQL)
- Search and filter API with pagination
- Email/password auth (JWT)
- Static frontend served by Express

## Setup

1) Install dependencies

2) Create a local Postgres database

3) Copy environment file
```
cp .env.example .env
```

4) Run migrations and seed data
```
npm run products:dedupe
npm run prisma:migrate
npm run prisma:seed
```

5) Start the server
```
npm run dev
```

Visit http://localhost:3000

### Troubleshooting

- If you see `SSL_ERROR_RX_RECORD_TOO_LONG` in Firefox/Chrome, you likely opened `https://localhost:3000`.
  This dev server listens on plain HTTP by default, so use `http://localhost:3000` (or disable HTTPS-Only mode for localhost).

## Docker (Postgres + Redis + Meilisearch)

From sql/:
- Start services: docker compose up -d
- Set .env:
  - DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pc_laptop_search?schema=public
  - REDIS_URL=redis://localhost:6379
  - MEILI_URL=http://127.0.0.1:7700
  - MEILI_API_KEY=masterKey

## Redis cache (optional)

- Set REDIS_URL in .env
- Cached responses for search are stored for 60 seconds.

## Meilisearch (recommended for 1M users)

- Run Meilisearch and set MEILI_URL (+ MEILI_API_KEY if used)
- Index products:
  - npm run search:index

When MEILI_URL is set, product search uses Meilisearch first and falls back to SQL if not configured.

## API

- GET /api/health
- GET /api/metrics (p50/p95 response time)
- GET /api/products
  - Query: q, type, cpuBrand, gpuBrand, minRam, minStorage, minScreen, maxPrice, limit, offset
- GET /api/products/:id
- POST /api/auth/register
- POST /api/auth/login

## Scaling notes for 1M users

- Use connection pooling (PgBouncer) and increase DB resources.
- Add Redis for caching hot queries and sessions.
- Use a dedicated search engine (Meilisearch/Typesense/Elasticsearch) for fuzzy/full-text at scale.
- Add database indexes for frequent filters (already in schema) and consider GIN indexes for full-text.
- Add a CDN for static assets and enable gzip/brotli.
- Add rate limiting and WAF at the edge.
- Use horizontal scaling for the API behind a load balancer.

## Performance testing

- Run a quick local load test:
  - npm run loadtest
