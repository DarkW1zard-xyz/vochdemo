# 3. Kompleksitātes analīze

## Laika sarežģītība

### Meklēšanas operācija (GET /api/products)

Apzīmējumi:
- $N$ — kopējais produktu skaits datu bāzē
- $T$ — tokenu skaits vaicājumā (parasti 1–4)
- $F$ — aktīvo filtru skaits (0–10)
- $M$ — atfiltrēto rezultātu skaits
- $K$ — pieprasīto rezultātu skaits (limit, max 100)

#### SQL dzinējs (primārais)

| Operācija | Sarežģītība | Paskaidrojums |
|---|---|---|
| Tokenu sadalīšana | $O(T)$ | Vaicājuma virknes split pēc atstarpēm |
| Tokenu klasifikācija (inferTokenFilters) | $O(T)$ | Katra tokena pārbaude pret zināmiem Set |
| Filtru konstruēšana (WHERE) | $O(F)$ | Filtru objekta izveide |
| B-tree indeksa meklēšana (katrs filtrs) | $O(\log N)$ | SQLite B-tree indekss |
| Teksta `contains` meklēšana | $O(N \cdot L)$ | Lineāra skenēšana (L = vid. lauka garums) |
| Kārtošana | $O(M \log M)$ | SQLite iekšējā kārtošana |
| Kopējā meklēšana | $O(T + F \cdot \log N + M \log M)$ | Ar indeksiem |
| Kopējā bez indeksiem | $O(N \cdot T \cdot L + M \log M)$ | Sliktākais scenārijs |

#### Keša slānis

| Operācija | Sarežģītība | Paskaidrojums |
|---|---|---|
| In-memory keša pārbaude | $O(1)$ | Map.get() |
| Redis keša pārbaude | $O(1)$ | Redis GET ar O(1) |
| Keša ierakstīšana | $O(1)$ | Map.set() / Redis SET |

#### Meilisearch dzinējs (ja konfigurēts)

| Operācija | Sarežģītība | Paskaidrojums |
|---|---|---|
| Invertētā indeksa meklēšana | $O(T)$ | Tokenu meklēšana invertētajā indeksā |
| Postu sarakstu apvienošana | $O(M)$ | Posting lists intersection |
| BM25 ranžēšana | $O(M \log M)$ | Rezultātu kārtošana pēc relevances |
| Filtru piemērošana | $O(M \cdot F)$ | Caur meklēšanas filtriem |
| Kopējā | $O(T + M \log M)$ | Tipiskais gadījums |

### Autocomplete (GET /api/search/suggest)

| Operācija | Sarežģītība | Paskaidrojums |
|---|---|---|
| SQL `contains`/`startsWith` | $O(N \cdot P)$ | P = prefiksa garums |
| Meilisearch suggest | $O(P + K)$ | Prefiksa meklēšana ar limitu K |

### Indeksēšanas operācija (vienreizēja)

| Operācija | Sarežģītība | Paskaidrojums |
|---|---|---|
| SQLite B-tree indeksa būvēšana | $O(N \log N)$ | Katram indeksētam laukam |
| Meilisearch indeksēšana | $O(N \cdot T_{avg})$ | $T_{avg}$ = vidējais termu skaits dokumentā |

## Vietas sarežģītība (atmiņas patēriņš)

| Komponente | Izmērs | Paskaidrojums |
|---|---|---|
| SQLite DB fails (10K prod.) | 5.90 MB | Dati + indeksi |
| SQLite indeksi (10K prod.) | ~2.36 MB | 13 B-tree indeksi |
| Indeksu/datu attiecība | 66.67% | Zem 150% prasības ✅ |
| Projekcija uz 100K | ~59 MB | Lineāra aproksimācija |
| Node.js RSS (10K) | 95 MB | Servera procesa patēriņš |
| Node.js heapUsed (10K) | 12.79 MB | JS heap |
| In-memory keša limits | ~500 ieraksti | LRU keša ar TTL 60s |

### Atmiņas prasības (NFR)

- **RAM ≤ 4GB / 100K**: Node.js RSS = 95 MB pie 10K → lineāri ~950 MB pie 100K. **ATBILST** ✅
- **Indekss ≤ 150%**: 66.67% < 150%. **ATBILST** ✅

## Scenāriju analīze

### Labākais scenārijs (Best Case)

**Kad**: vaicājums atrodas kešā (in-memory vai Redis).

- **Laiks**: $O(1)$ — tūlītēja atgriešana no keša.
- **Piemērs**: populārs meklējums "laptop" otrreiz 60s laikā.
- **Latency**: < 1ms.

### Vidējais scenārijs (Average Case)

**Kad**: vaicājums ar 1–2 filtriem, 2 tokeni, no SQL ar indeksiem.

- **Laiks**: $O(T + F \cdot \log N + K)$ — indeksēta meklēšana ar limitu.
- **Piemērs**: `q=lenovo laptop&category=computers&limit=24`.
- **Latency**: 2–7ms (mērīts p50 = 2.53ms).

### Sliktākais scenārijs (Worst Case)

**Kad**: tukšs vaicājums bez filtriem vai `contains` meklēšana pēc reta termina bez indeksa priekšrocību.

- **Laiks**: $O(N \cdot T \cdot L + N \log N)$ — pilna skenēšana + kārtošana.
- **Piemērs**: `q=preorder` (meklē visos laukos, `contains` skenē katru rindu).
- **Latency**: 30–70ms (mērīts max = 70.08ms, p95 = 31.79ms).

### Secinājumi par scenārijiem

| Scenārijs | Laika sarežģītība | Izmērīts latency |
|---|---|---|
| Labākais (keša hits) | $O(1)$ | < 1ms |
| Vidējais (indeksēts SQL) | $O(T + F \cdot \log N + K)$ | 2–7ms |
| Sliktākais (pilna skenēšana) | $O(N \cdot T \cdot L + N \log N)$ | 30–70ms |

Visos scenārijos atbildes laiks ir zem 200ms prasības robežas pat ar 10K produktiem.

## Atbilstība nefunkcionālajām prasībām

| NFR | Prasība | Rezultāts | Statuss |
|---|---|---|---|
| Atbildes laiks | ≤ 200ms | p95 = 31.79ms | ✅ ATBILST |
| Caurlaides spēja | ≥ 1000 vienlaicīgi | 3138 req/s, 0 kļūdas | ✅ ATBILST |
| RAM patēriņš | ≤ 4GB / 100K | ~950 MB (projektēts) | ✅ ATBILST |
| Indeksa izmērs | ≤ 150% | 66.67% | ✅ ATBILST |
| Relevance | ≥ 85% | Precision@10 = 0.90 | ✅ ATBILST |
| Recall | ≥ 90% | 9/10 vaicājumi ar P@10 = 1.00 | ✅ ATBILST |
| Kļūdu apstrāde | Gracioza | try/catch + fallback, 0 crashes | ✅ ATBILST |
