# 1. Algoritma izvēle un pamatojums

## Izvēlētais risinājums

**Invertētais indekss (Inverted Index) ar SQL bāzētu meklēšanu** — primārais meklēšanas dzinējs izmanto SQLite datu bāzi ar Prisma ORM, nodrošinot pilnteksta meklēšanu caur kolonu indeksiem un `contains` operatoriem. Sistēma papildus atbalsta Meilisearch (invertētā indeksa + BM25 dzinējs) kā opciju augstām slodzēm, ar automātisku fallback uz SQL.

## Pamatojums

### Funkcionālo prasību izpilde

| Prasība | Risinājums |
|---|---|
| Teksta meklēšana pēc nosaukuma/apraksta | SQL `contains` meklēšana vairākos laukos (name, description, cpu, gpu) ar tokenu sadalīšanu |
| Kategoriju filtrēšana | SQL `WHERE` klauzula ar indeksētiem laukiem |
| Cenu diapazona meklēšana | SQL `gte`/`lte` filtri ar B-tree indeksu uz `price` kolonnas |
| Zīmolu filtrēšana | SQL `WHERE brand = ?` ar indeksu |
| Pieejamības statuss | SQL `WHERE inStock = true` ar indeksu |
| Kārtošana pēc cenas/reitinga/popularitātes/datuma | SQL `ORDER BY` ar indeksētiem laukiem |
| Automātiskā pabeigšana | `/api/search/suggest` — meklē pēc `contains`/`startsWith`, atgriež top 8 |
| Populārākie termini | Redis sorted set `search:terms` vai SQL fallback pēc popularitātes |

### Nefunkcionālo prasību izpilde

| Prasība | Rezultāts |
|---|---|
| Atbildes laiks ≤ 200ms | p50 = 2.53ms, p95 = 31.79ms (SQL, 10K produkti) ✅ |
| 1000 vienlaicīgas meklēšanas | 3138 req/s, 0 kļūdas, 0 timeout ✅ |
| Mērogojamība 1M+ | Lineāra indeksa projekcija 59 MB / 100K, Meilisearch horizontāli mērogojams ✅ |
| RAM ≤ 4GB / 100K | Node.js RSS = 95 MB (10K), projektēts ~950 MB / 100K ✅ |
| Indekss ≤ 150% | 66.67% indeksu/datu attiecība ✅ |
| Recall ≥ 90% | Precision@10 = 0.90 (9/10 vaicājumiem = 1.00) ✅ |

## Salīdzinājums ar alternatīviem

### 1. SQL ILIKE (naivā pieeja)

- **Priekšrocības**: vienkārša implementācija, nav papildu atkarību.
- **Trūkumi**: nav fuzzy/typo tolerances, nav ranžēšanas pēc relevances, pilna tabulas skenēšana bez indeksiem.
- **Sarežģītība**: $O(N \cdot L)$ katram vaicājumam (N = produktu skaits, L = vidējais lauku garums).
- **Secinājums**: neder lieliem datu apjomiem, bet bāzes funkcionālai meklēšanai pietiekams.

### 2. PostgreSQL Full-Text Search (tsvector + tsquery)

- **Priekšrocības**: iebūvēts PostgreSQL, GIN indekss, ranžēšana ar `ts_rank`.
- **Trūkumi**: ierobežota typo tolerance, sarežģīta konfigurācija dažādām valodām, nav autocomplete out-of-box.
- **Sarežģītība**: indeksēšana $O(N \cdot T)$, meklēšana $O(T + M \log M)$ ar GIN indeksu.
- **Secinājums**: labs risinājums vidējiem datu apjomiem, bet prasa PostgreSQL (nav pieejams ar SQLite).

### 3. Trie (prefiksu koks)

- **Priekšrocības**: ļoti ātrs autocomplete ($O(P + K)$, P = prefiksa garums, K = rezultātu skaits).
- **Trūkumi**: augsts atmiņas patēriņš, neder pilnteksta meklēšanai, nenodrošina filtrus/kārtošanu.
- **Sarežģītība**: būvēšana $O(N \cdot L)$, meklēšana $O(P)$.
- **Secinājums**: piemērots tikai autocomplete komponentei, neaizvieto galveno meklēšanu.

### 4. Meilisearch (invertētais indekss + BM25)

- **Priekšrocības**: typo tolerance, BM25 ranžēšana, filtri, faceted search, ātrs (~1-5ms).
- **Trūkumi**: ārēja atkarība, prasa atsevišķu servisu, indeksa sinhronizācija.
- **Sarežģītība**: indeksēšana $O(N \cdot T)$, meklēšana $O(T + M \log M)$.
- **Secinājums**: labākais risinājums ražošanas vidē ar 1M+ produktiem.

## Izvēles kopsavilkums

Izvēlētā arhitektūra ir **hibrīda**: SQL-bāzēta meklēšana kā galvenais dzinējs (darbojas bez ārējām atkarībām), ar Meilisearch kā opciju augstām slodzēm. Šī pieeja nodrošina:

1. **Nekavējošu darbību** — SQL fallback vienmēr ir pieejams, pat ja Meilisearch/Redis nav konfigurēts.
2. **Mērogojamību** — Meilisearch horizontāli mērogojams, Redis kešo populāros vaicājumus.
3. **Vienkāršu izvietošanu** — pamata režīmā pietiek tikai ar SQLite failu, bez Docker/ārējiem servisiem.

### Datu struktūras

```
Product {
  id: String (CUID)
  name: String           — indeksēts, meklējams
  description: String?   — meklējams
  category: String       — indeksēts, filtrējams
  brand: String          — indeksēts, filtrējams
  type: String           — indeksēts, filtrējams
  cpuBrand: String       — indeksēts, filtrējams
  cpu: String            — meklējams
  gpuBrand: String       — indeksēts, filtrējams
  gpu: String            — meklējams
  ram: Int               — indeksēts, filtrējams (≥)
  storage: Int           — indeksēts, filtrējams (≥)
  screen: Float          — indeksēts, filtrējams (≥)
  price: Int             — indeksēts, filtrējams (diapazonā)
  availability: String   — indeksēts
  inStock: Boolean       — indeksēts, filtrējams
  rating: Float          — indeksēts, kārtojams
  popularity: Int        — indeksēts, kārtojams
  tags: String (JSON)    — metadati
  imageUrl: String?
  createdAt: DateTime    — kārtojams
}
```

### Indeksu stratēģija

Katrai filtrējamai kolonnai ir atsevišķs B-tree indekss (`@@index`), kas nodrošina $O(\log N)$ meklēšanu. Unikālais kompozītais indekss `@@unique([brand, name])` novērš datu dublikātus.

## Projekta failu struktūra

```
vochdemo/
├── package.json                           # Root workspace config
├── scripts/
│   └── generate-presentation.mjs          # Prezentācijas ģenerēšanas skripts
│
└── sql/                                   # Galvenais backend projekts
    ├── package.json                       # Node.js atkarības (Express, Prisma, etc.)
    ├── tsconfig.json                      # TypeScript konfigurācija
    ├── docker-compose.yml                 # Docker servisu konfigurācija (Redis, Meilisearch)
    ├── README.md                          # Projekta dokumentācija
    │
    ├── docs/                              # Dokumentācija
    │   ├── 1_ALGORITMA_IZVELE.md         # Algoritma izvēle un pamatojums (šis fails)
    │   ├── 3_KOMPLEKSITATES_ANALIZE.md   # Laika/vietas sarežģītības analīze
    │   ├── 4_TESTESANA_UN_NOVERTESANA.md # Testi un novērtēšana
    │   ├── ALGORITMA_ANALIZE_UN_TESTI.md # Detalizēta analīze un test rezultāti
    │   ├── IESNIEGUMA_KOPSAVILKUMS.md    # Darba kopsavilkums
    │   ├── RESOURCE_RESULTS.md            # Resursu patēriņa rezultāti
    │   ├── RUBRIKAS_ATBILSTIBA.md        # Atbilstība rubrikām
    │   ├── SEARCH_TEST_RESULTS.md         # Meklēšanas testu rezultāti
    │   ├── TECHNISKA_DOKUMENTACIJA.txt   # Tehniskā dokumentācija
    │   └── THROUGHPUT_RESULTS.md          # Veiktspējas/throughput rezultāti
    │
    ├── prisma/                            # Prisma ORM konfigurācija
    │   ├── schema.prisma                  # Datu bāzes shēma (User, Product modeli)
    │   ├── seed.ts                        # Datu bāzes seeding skripts (testdati)
    │   └── migrations/
    │       ├── migration_lock.toml        # Migrācijas slēdziena fails
    │       └── 20260306112958_init/
    │           └── migration.sql          # Sākotnējā migrācija (tabulu izveide)
    │
    ├── public/                            # Klienta faili (statiskais saturs)
    │   ├── index.html                     # Galvenā HTML lapa
    │   ├── app.js                         # Klienta JavaScript logika
    │   ├── styles.css                     # Klienta stili (dark theme)
    │   └── images/                        # Produktu attēli
    │       └── placeholder.svg            # Aizstājējattēls
    │
    └── src/                               # Backend avota kods (TypeScript)
        ├── index.ts                       # Servera ieejas punkts (Express app inicializācija)
        │
        ├── lib/                           # Palīgmoduļi
        │   ├── prisma.ts                  # Prisma klienta inicializācija
        │   ├── search.ts                  # Meilisearch klienta konfigurācija
        │   ├── redis.ts                   # Redis klienta inicializācija un savienošanas logika
        │   └── query-cache.ts             # In-memory caching ar TTL
        │
        ├── middleware/
        │   └── auth.ts                    # Autentifikācijas middleware (JWT validācija)
        │
        ├── routes/                        # API maršruti
        │   ├── auth.ts                    # /api/auth — reģistrācija un pierakstīšanās
        │   ├── products.ts                # /api/products — produktu meklēšana un filtri
        │   └── search.ts                  # /api/search — ieteikumi un populārie termini
        │
        ├── scripts/                       # Palīgskripti (benchmarking, generēšana)
        │   ├── generate-products.ts       # Izveido test produktus (10K-100K+)
        │   ├── index-products.ts          # Indeksē produktus Meilisearch-ā
        │   ├── dedupe-products.ts         # Noņem dublicējumus no DB
        │   ├── evaluate-search.ts         # Novērtē meklēšanas kvalitāti (recall/precision)
        │   ├── benchmark-throughput.ts    # Veiktspējas tests (req/s, latency)
        │   └── benchmark-resources.ts     # Resursu patēriņa mērīšana (CPU, RAM, disk)
        │
        └── types/
            └── autocannon.d.ts            # TypeScript tipi Autocannon (load testing) libs
```

### Failu apraksti pa kategorijām

#### Backend servera kods (src/)

| Fails | Apraksts |
|---|---|
| `index.ts` | Express serveris ar CORS, latency metriku reģistrāciju, maršritu reģistrāciju |
| `routes/auth.ts` | JWT-bāzēta autentifikācija (register, login), bcrypt paroles hešošana |
| `routes/products.ts` | Galvenā produktu meklēšanas logika — SQL + Meilisearch, cešošana, filtrēšana |
| `routes/search.ts` | Autocomplete ieteikumi un populārie meklēšanas termini |
| `lib/prisma.ts` | Prisma klienta singleton inicializācija |
| `lib/search.ts` | Meilisearch klienta un indeksa nosaukuma konfigurācija |
| `lib/redis.ts` | Redis savienošanas pārvaldība ar reconnect strategy |
| `lib/query-cache.ts` | In-memory LRU kešs ar TTL (60s default, max 500 ieraksti) |

#### Datu bāzes (prisma/)

| Fails | Apraksts |
|---|---|
| `schema.prisma` | Datu bāzes shēma: User (e-pasts, parole) un Product (15 indeksēti lauki) |
| `seed.ts` | Testdatu ģenerēšana — 8-10 produktu piemēri dažādās kategorijās |
| `migrations/*/migration.sql` | SQLite DDL (CREATE TABLE, INDEX) skripti |

#### Klienta puse (public/)

| Fails | Apraksts |
|---|---|
| `index.html` | HTML forma — meklēšana, filtri (kategorija, zīmols, CPU, RAM, storage, GPU, cena) |
| `app.js` | Klienta logika — vaicājumu būvēšana, API izsaukumi, rezultātu rādīšana |
| `styles.css` | Dark-theme stili (Tailwind-līdzīgs CSS) |

#### Dokumentācija (docs/)

| Fails | Apraksts |
|---|---|
| `1_ALGORITMA_IZVELE.md` | Algoritma izvēles pamatojums (šis fails) |
| `3_KOMPLEKSITATES_ANALIZE.md` | Laika/vietas sarežģītības analīze O(N log N) et al. |
| `4_TESTESANA_UN_NOVERTESANA.md` | Manuālo un automāto testu rezultāti |
| `ALGORITMA_ANALIZE_UN_TESTI.md` | Detalizēta algoritma darba analīze |
| `IESNIEGUMA_KOPSAVILKUMS.md` | Augstā līmeņa darba apraksts |
| `RESOURCE_RESULTS.md` | CPU, RAM, disk patēriņa mērījumi |
| `RUBRIKAS_ATBILSTIBA.md` | Atbilstības pārbaude pret prasību rubrikām |
| `SEARCH_TEST_RESULTS.md` | Meklēšanas testu rezultāti (precision, recall) |
| `TECHNISKA_DOKUMENTACIJA.txt` | Tehniskie detaļi par sistēmu |
| `THROUGHPUT_RESULTS.md` | Veiktspējas benchmarki (req/s, latency p50/p95) |

#### Skripti (scripts/)

| Fails | Apraksts |
|---|---|
| `generate-products.ts` | Ģenerē 10K-1M produktus dažādos testos |
| `index-products.ts` | Sinhronizē produktus uz Meilisearch indeksu |
| `dedupe-products.ts` | Noņem dublicējumus pēc (brand, name) kombinācijas |
| `evaluate-search.ts` | Testa meklēšanas precizitāti uz manuālajiem test vaicājumiem |
| `benchmark-throughput.ts` | Automaton load tests (1000 vienlaicīgi pieprasījumi) |
| `benchmark-resources.ts` | Mēra CPU %, RAM RSS, disk I/O pie dažādiem slodžu līmeņiem |

#### Konfigurācijas

| Fails | Apraksts |
|---|---|
| `package.json` | npm atkarības: Express, Prisma, Redis, Meilisearch, JWT, bcrypt |
| `tsconfig.json` | TypeScript kompilācijas iestatījumi (module ESM, target ES2020) |
| `docker-compose.yml` | Redis un Meilisearch servisu definīcijas (neobligāti) |

### Modeļi datu plūsmas

```
Klient (HTML/JS)
  ↓
/api/products?q=...&filters...
  ↓
products.ts route handler
  ├→ Redis meklēšana (ja konfigurēts)
  ├→ Meilisearch (ja konfigurēts un aiz)
  └→ SQL Prisma fallback (vienmēr pieejams)
  ↓
JSON atbilde (items, total, offset, limit)
  ↓
Klienta app.js → HTML skaņošana

/api/search/suggest
  ↓
search.ts (Meilisearch / SQL fallback)
  ↓
ieteikumi [product.name, ...]

/api/search/popular
  ↓
Redis sorted set "search:terms"
  ↓
Top 8 populārie termini
```
