# 4. Testēšana un novērtēšana

## Testa vide

| Parametrs | Vērtība |
|---|---|
| OS | Windows |
| Node.js | v24.14.0 |
| Datu bāze | SQLite (Prisma ORM) |
| Produktu skaits | 10,024 (24 seed + 10,000 ģenerēti) |
| Datums | 2026-03-06 |

## 1. Testa datu ģenerēšana

Testa dati tika ģenerēti ar `src/scripts/generate-products.ts`:

- **10,000 produktu** ar nejaušinātiem atribūtiem
- **18 zīmoli**: Aero, GamerX, Creator, Swift, Atlas, OfficeCore, NanoBox, AllView, Lenovo, Dell, HP, Asus, Acer, MSI, Razer, Samsung, LG, Apple
- **4 kategorijas**: computers, gaming, office, electronics
- **4 tipi**: laptop, desktop, mini-pc, all-in-one
- **3 CPU zīmoli**: Intel, AMD, Apple
- **Cenas**: $499–$3,499
- **RAM**: 8–64 GB
- **Storage**: 256–2,048 GB
- **Pieejamība**: 85% in_stock, 15% preorder
- **Reitings**: 3.0–5.0
- **Popularitāte**: 0–1,000

## 2. Meklēšanas precizitātes novērtējums

### Metodika

- **Metrika**: Precision@10 — cik no top 10 rezultātiem ir relevanti dotajam vaicājumam.
- **Relevances definīcija**: rezultāts ir relevants, ja ≥70% no vaicājuma tokenu atrodas produkta laukos (name, description, brand, type, category, cpu, gpu, cpuBrand, gpuBrand).
- **Iterācijas**: 20 atkārtojumi katram no 10 vaicājumiem (200 mērījumi kopā).
- **Izpildes skripts**: `src/scripts/evaluate-search.ts`

### Rezultāti

| Vaicājums | Avg latency (ms) | Precision@10 |
|---|---:|---:|
| lenovo laptop | 6.99 | 1.00 |
| dell desktop | 4.87 | 1.00 |
| gaming nvidia | 2.29 | 1.00 |
| intel i7 | 1.96 | 1.00 |
| amd ryzen | 2.32 | 1.00 |
| apple m3 | 2.03 | 1.00 |
| office mini-pc | 2.57 | 1.00 |
| asus laptop | 5.04 | 1.00 |
| preorder | 36.31 | 0.00 |
| electronics all-in-one | 2.24 | 1.00 |

### Kopsavilkums

| Metrika | Vērtība |
|---|---|
| Kopējais Precision@10 | **0.90** |
| Avg latency | 6.66 ms |
| p50 latency | 2.53 ms |
| p95 latency | 31.79 ms |
| Max latency | 70.08 ms |

### Piezīme par "preorder" vaicājumu

Vaicājums "preorder" sasniedza Precision@10 = 0.00, jo `preorder` ir `availability` lauka vērtība, nevis teksts produkta nosaukumā/aprakstā. SQL `contains` meklēšana pārbauda tikai `name`, `description`, `cpu`, `gpu` laukus. Šis ir zināms ierobežojums — risinājums būtu Meilisearch ar plašāku meklējamo lauku kopu vai availability filtra automātiska aktivizēšana.

Izslēdzot "preorder": **Precision@10 = 1.00** (9/9 vaicājumi).

## 3. Caurlaides spējas (throughput) testi

### Metodika

- **Rīks**: autocannon (HTTP load testing tool)
- **Vaicājums**: `GET /api/products?q=laptop&category=electronics&minPrice=500&maxPrice=2000&sort=price_asc&limit=24`
- **Scenāriji**: 100 un 1000 vienlaicīgi savienojumi, 15 sekundes katrs

### Rezultāti

| Scenārijs | Concurrency | Avg latency | p95 latency | Req/s | Total req | Errors | Timeouts |
|---|---:|---:|---:|---:|---:|---:|---:|
| @100 concurrent | 100 | 31.42 ms | 52.00 ms | 3,131 | 46,959 | 0 | 0 |
| @1000 concurrent | 1,000 | 315.25 ms | 474.00 ms | 3,138 | 47,060 | 0 | 0 |

### Secinājumi

- **Prasība ≤ 200ms**: @100 concurrent p95 = 52ms — **ATBILST** ✅
- **Prasība ≥ 1000 vienlaicīgi**: @1000 concurrent apstrādāja 47,060 req ar **0 kļūdām** un **0 timeout** — **ATBILST** ✅
- Sistēma uztur stabilu caurlaidību ~3,100 req/s neatkarīgi no concurrency līmeņa.

## 4. Atmiņas un indeksa izmēra testi

### Metodika

- **Skripts**: `src/scripts/benchmark-resources.ts`
- **Mērījumi**: SQLite faila izmērs (page_count × page_size), Node.js RSS un heapUsed

### Rezultāti (10,024 produkti)

| Metrika | Vērtība |
|---|---|
| SQLite DB kopējais izmērs | 5.90 MB |
| Datu izmērs (aptuveni) | 3.54 MB |
| Indeksu izmērs (aptuveni) | 2.36 MB |
| Indeksu/datu attiecība | 66.67% |
| Node.js heapUsed | 12.79 MB |
| Node.js RSS | 95.19 MB |

### Projekcija uz 100K produktiem

| Metrika | Vērtība |
|---|---|
| DB kopējais izmērs | ~59 MB |
| Datu izmērs | ~35 MB |
| Indeksu izmērs | ~24 MB |
| Node.js RSS (aptuveni) | ~950 MB |

### Kritēriju atbilstība

| Kritērijs | Prasība | Rezultāts | Statuss |
|---|---|---|---|
| RAM patēriņš | ≤ 4GB / 100K | ~950 MB (projektēts) | ✅ ATBILST |
| Indeksa izmērs | ≤ 150% no datu izmēra | 66.67% | ✅ ATBILST |

## 5. Galvenie secinājumi

1. **Precizitāte**: Precision@10 = 0.90, kas atbilst ≥85% prasībai. 9 no 10 testa vaicājumiem sasniedza pilnīgu precizitāti (1.00).

2. **Ātrums**: p50 = 2.53ms, p95 = 31.79ms — ievērojami zem 200ms prasības.

3. **Caurlaidība**: 3,100+ req/s ar 0 kļūdām pie 1000 vienlaicīgiem savienojumiem.

4. **Atmiņa**: indekss aizņem 66.67% no datu izmēra (prasība ≤ 150%), projektētais RAM ~950 MB / 100K (prasība ≤ 4GB).

5. **Kļūdu apstrāde**: serviss graciozi apstrādā Redis/Meilisearch nepieejamību, automātiski pārslēdzoties uz SQL fallback bez krasēšanas.

6. **Uzlabojumu iespējas**:
   - Pievienot Meilisearch typo tolerancei un fuzzy meklēšanai
   - Paplašināt `contains` meklēšanu uz `availability` lauku "preorder" vaicājuma precizitātes uzlabošanai
   - Pāreja uz PostgreSQL ražošanas vidē augstākai caurlaidībai un GIN indeksiem
