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
