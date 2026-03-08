# Algoritma izvēle un pamatojums

## Izvēlētais algoritms / datu struktūra

Izvēlēta pieeja: **invertētais indekss ar BM25 reitingošanu un typo toleranci**, izmantojot Meilisearch (`src/scripts/index-products.ts`, `src/routes/products.ts`).

Pamatojums pret prasībām:

- Funkcionālās prasības:
  - Brīvteksta meklēšana (`q`) vairākos laukos (`name`, `description`, `cpu`, `gpu`).
  - Filtri (`category`, `brand`, `type`, `cpuBrand`, `gpuBrand`, `ram`, `storage`, `screen`, `price`, `inStock`).
  - Kārtošana (`price`, `rating`, `popularity`, `createdAt`).
- Nefunkcionālās prasības:
  - Zems latentums pie liela vaicājumu apjoma.
  - Mērogojamība līdz lielākam lietotāju skaitam.
  - Labs rezultātu relevances līmenis pat ar drukas kļūdām.

Kāpēc tieši šī pieeja:

- Invertētais indekss optimizē meklēšanu uz teksta laukiem, samazinot nepieciešamību skenēt pilnu tabulu.
- BM25 reitingošana nodrošina relevances balstītu kārtošanu bez manuāli veidotas punktu sistēmas.
- Typo tolerance uzlabo UX (lietotāja kļūdu tolerance).
- Filtri un kārtošana ir tieši atbalstīti ar indeksa iestatījumiem (`filterableAttributes`, `sortableAttributes`).

## Salīdzinājums ar alternatīvām

1. SQL `ILIKE`/`contains` (esošais fallback)
   - Plusi: vienkārša uzturēšana, nav papildu servisa.
   - Mīnusi: sliktāks latentums pie brīvteksta meklēšanas un fuzzy scenārijiem; relevance ir primitīvāka.

2. PostgreSQL Full Text Search (`tsvector`, `GIN`)
   - Plusi: nav ārēja meklēšanas dzinēja, laba veiktspēja ar pareiziem indeksiem.
   - Mīnusi: typo tolerance un relevances tunings prasa vairāk manuāla darba; sarežģītāka konfigurācija.

3. Trie / Prefix tree (pašu implementācija)
   - Plusi: ļoti ātrs prefix autocomplete.
   - Mīnusi: slikti der kombinētai brīvteksta + filtru + fuzzy meklēšanai; liels izstrādes un uzturēšanas apjoms.

Secinājums: šajā projektā vislabāk atbilst **Meilisearch ar invertēto indeksu/BM25**, ar SQL fallback drošības scenārijam.

---

# Kompleksitātes analīze

Apzīmējumi:
- `N` — produktu skaits.
- `T` — tokenu skaits vaicājumā.
- `M` — kandidātu dokumentu skaits pēc indeksa atlases.
- `K` — atgriezto rezultātu skaits.

## Laika sarežģītība

### Meilisearch (invertētais indekss)

- Indeksēšana: aptuveni `O(N * avgTermsPerDoc)` (offline process).
- Meklēšana (tipiski): aptuveni `O(T + M log M)` (kandidātu atlase + reitings).
- Atgriešana: `O(K)`.

Scenāriji:
- Labākais: ļoti specifisks vaicājums ar maz kandidātiem → zems `M`, latentums zems.
- Vidējais: daļēji specifiski vaicājumi → mērens `M`, stabils latentums.
- Sliktākais: ļoti īsi/vispārīgi vaicājumi (`"laptop"`) + liels datu apjoms → augsts `M`, latentums pieaug.

### SQL fallback (`contains` + tokenu AND)

- Bez pilna teksta indeksa: sliktākajā gadījumā tuvojas tabulas skenēšanai (`O(N * T)` loģiskā izteiksmē).
- Ar daļu B-tree indeksiem filtriem situācija uzlabojas, bet brīvteksta matching joprojām dārgāks par invertēto indeksu.

Scenāriji:
- Labākais: stingri filtri + mazs kandidātu skaits.
- Vidējais: kombinēta meklēšana ar dažiem tokeniem.
- Sliktākais: tikai brīvteksts bez selektīviem filtriem.

## Telpas sarežģītība

- Meilisearch indekss: `O(totalTerms + N)` papildus primārajai DB glabāšanai.
- SQL fallback: minimāla papildatmiņa ārpus DB indeksiem.

## Atbilstība nefunkcionālajām prasībām

- Latentums: Meilisearch pieeja praksē tipiski nodrošina zemāku p95 pie brīvteksta vaicājumiem.
- Mērogojamība: meklēšanas slodze tiek noņemta no galvenās SQL DB.
- Relevance/UX: typo tolerance + BM25 uzlabo rezultātu kvalitāti.

---

# Testēšana un novērtēšana

## Testdati (>=10K)

- Datu ģenerēšana: `npm run products:generate`
- Noklusētais apjoms: 10 000 produkti (`GENERATE_COUNT` var pārdefinēt).

## Veiktspējas un precizitātes mērīšana

Pievienots skripts: `src/scripts/evaluate-search.ts`.

Tas izpilda:
- latentuma mērījumus (`avg`, `p50`, `p95`, `max`);
- `Precision@10` katram vaicājumam;
- salīdzinājumu starp Meilisearch un SQL fallback;
- automātisku rezultātu atskaiti failā `docs/SEARCH_TEST_RESULTS.md`.

Palaišana:

```bash
npm run search:evaluate
```

Ja nepieciešams, var pielāgot:
- `EVAL_MIN_PRODUCTS` (noklusēti 10000),
- `EVAL_ITERATIONS` (noklusēti 20),
- `EVAL_TOP_K` (noklusēti 10).

## Dokumentētie rezultāti

- Izpildes rezultāti tiek saglabāti failā `docs/SEARCH_TEST_RESULTS.md`.
- Šis fails ir primārais artefakts iesnieguma sadaļai “Testa rezultāti ar veiktspējas mērījumiem un galvenajiem secinājumiem”.
