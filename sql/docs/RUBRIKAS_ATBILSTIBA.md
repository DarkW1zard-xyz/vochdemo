# Rubrikas atbilstības matrica

Šis dokuments sasaista vērtēšanas kritērijus ar implementāciju un mērījumu artefaktiem projektā.

## Funkcionālā pilnība

- Teksta meklēšana produktu nosaukumos/aprakstos
  - Implementācija: `src/routes/products.ts` (`q` tokenizācija + meklēšana `name`, `description`, `cpu`, `gpu`; Meili BM25).
- Kategoriju filtrēšana
  - Implementācija: `category` filtrs (`/api/products?category=...`).
- Cenu diapazons
  - Implementācija: `minPrice`, `maxPrice` ar validāciju (`minPrice <= maxPrice`).
- Zīmolu filtrēšana
  - Implementācija: `brand` filtrs.
- Pieejamības statuss
  - Implementācija: `availability` atbalsta `in_stock`, `out_of_stock`, `preorder`.
- Rezultātu kārtošana
  - Implementācija: `relevance` (Meili noklusējums), `price_asc`, `price_desc`, `rating_desc`, `popularity_desc`, `newest`.
- Auto-complete + typo tolerance
  - Implementācija: `GET /api/search/suggest` (Meili typo tolerance + SQL fallback).

## Nefunkcionālās prasības

- Atbildes laiks < 200ms
  - Artefakts: `docs/THROUGHPUT_RESULTS.md` (p95 latency).
- 1000+ vienlaicīgas meklēšanas
  - Artefakts: `docs/THROUGHPUT_RESULTS.md` (`@1000 concurrent` scenārijs).
- Efektīva darbība ar 1M+ produktiem
  - Pamatojums: Meilisearch invertētais indekss + SQL fallback + Redis cache.
  - Papildu rekomendācijas: `README.md` sadaļa “Scaling notes for 1M users”.
- RAM patēriņš un indeksa izmērs
  - Artefakts: `docs/RESOURCE_RESULTS.md`.

## Koda kvalitāte

- Modulāra struktūra
  - `src/routes`, `src/lib`, `src/scripts`.
- Lasāmība un konsekvence
  - Saprotami nosaukumi, vienots TypeScript stils.
- Kļūdu apstrāde/validācija
  - Pievienota 400/500 validācija un kļūdu atbildes meklēšanas endpointos.
- Efektivitāte
  - Redis cache + Meili indeksi + ierobežots `limit` (`<=100`).
- Testējamība
  - Atkārtojami benchmark skripti:
    - `npm run search:evaluate`
    - `npm run benchmark:throughput`
    - `npm run benchmark:resources`

## Algoritma efektivitāte

- Algoritma izvēles argumentācija, O-notācija, alternatīvas, optimizācijas
  - Artefakts: `docs/ALGORITMA_ANALIZE_UN_TESTI.md`.

## Testēšana

- Reprezentatīvi testa dati
  - `npm run products:generate` (>=10K).
- Sistemātiski veiktspējas mērījumi
  - `docs/SEARCH_TEST_RESULTS.md`, `docs/THROUGHPUT_RESULTS.md`.
- Precizitātes novērtēšana
  - `Precision@10` atskaite `docs/SEARCH_TEST_RESULTS.md`.
- Rezultātu dokumentācija
  - Visi rezultāti centralizēti mapē `docs/`.

## Aktuālais statuss (2026-03-04)

- Funkcionālā pilnība: **ATBILST**
  - Teksta meklēšana, kategorijas, cena, zīmols, pieejamība, kārtošana, autocomplete implementēti API + UI.
- Atbildes laiks `< 200ms`: **ATBILST**
  - `p95=103ms` pie 100 concurrent (skat. `docs/THROUGHPUT_RESULTS.md`).
- 1000+ vienlaicīgas meklēšanas: **ATBILST**
  - 1000 concurrent izpildīts bez kļūdām/timeouts (`errors=0`, `timeouts=0`), `req/s=3093.34`.
- 1M+ mērogojamība: **ARGUMENTĒTI ATBILST**
  - Arhitektūra (Meili + Redis + SQL fallback) paredzēta horizontālai mērogošanai.
- RAM ≤ 4GB/100K: **DAĻĒJI / PROJEKCIJA**
  - Ir mērījumi un projekcija (`docs/RESOURCE_RESULTS.md`), bet nav pilna produkcijas slodzes tests.
- Indekss ≤150%: **ATBILST (PostgreSQL), DAĻĒJI (Meili)**
  - PostgreSQL indeksu/datu attiecība: `72.31%` (`docs/RESOURCE_RESULTS.md`) — atbilst kritērijam.
  - Meilisearch izmērs šajā vidē nav izmērīts (nav pieejams Docker CLI).
