Piedod, iepriekš sistēma to ģenerēja kā iegultu failu, tāpēc formatējums pazuda. Ielikšu pilnīgi visu tekstu tieši šajā koda blokā.Tev atliek tikai nospiest "Copy code" (kopēt kodu) pogu, kas parādīsies šī bloka augšējā labajā stūrī, un ielīmēt to savā tukšajā README.md failā. Tādā veidā Markdown formāts, virsraksti un koda bloki pārcelsies perfekti.Markdown# PC & Laptop Meklētājs (Mērogojams 1M+ lietotājiem)

Node.js un SQLite/PostgreSQL aizmugursistēma (backend) ar Prisma ORM un Express.js, kas nodrošina API ātru un precīzu produktu meklēšanu.

## Iespējas un Funkcionalitāte
* **Datu glabāšana:** Relāciju datubāze lietotājiem un produktiem (SQLite izstrādei, PostgreSQL produkcijai).
* **Hibrīdais meklēšanas dzinējs:** Uzlabots algoritms, kas primāri izmanto Meilisearch ātrai pilnteksta (fuzzy) meklēšanai, bet automātiski pārslēdzas uz SQL optimizētiem vaicājumiem (fallback), ja nepieciešams.
* **API un filtrēšana:** Detalizēta produktu filtrēšana un meklēšanas API ar lapu dalīšanu (pagination).
* **Autentifikācija:** Droša e-pasta un paroles pieteikšanās, izmantojot JWT.
* **Veiktspējas optimizācija:** Redis integrācija biežāko vaicājumu kešošanai (atbildes tiek kešotas 60 sekundes).
* **Statiskā saskarne:** Frontenda failus servē Express.

## Atbilstība projekta uzdevumiem (Vērtēšanai)
Projekts ir izstrādāts, stingri sekojot specifikācijas prasībām. Visi detalizētie apraksti atrodami `docs/` direktorijā:
1. **Algoritma izvēle un pamatojums:** Hibrīdās meklēšanas izvēle pamatota dokumentā: `docs/ALGORITMA_ANALIZE_UN_TESTI.md`.
2. **Algoritma implementācija:** Realizēta API maršrutētājos. Kods ir strukturēts, komentēts un atbalsta visu galveno funkcionalitāti.
3. **Kompleksitātes analīze:** Laika un telpas sarežģītības analīze, kā arī labāko/sliktāko scenāriju izvērtējums atrodams algoritma analīzes failā.
4. **Testēšana un novērtēšana:** Sistēma testēta ar datu kopu, kas pārsniedz 10K produktus. 
   * Veiktspējas (Throughput) un atbildes laika rezultāti: `docs/THROUGHPUT_RESULTS.md`
   * Resursu patēriņš: `docs/RESOURCE_RESULTS.md`
   * Pēdējie ģenerētie testa rezultāti: `docs/SEARCH_TEST_RESULTS.md`

---

## Uzstādīšana (Lokālā izstrāde)

**1. Instalējiet atkarības**
```bash
cd sql
npm install
2. Vides mainīgie (.env)Izveidojiet .env failu, izmantojot sagatavi:Bashcp .env.example .env
Aizpildiet ar saviem datubāzes datiem:Koda fragmentsDATABASE_URL="file:./dev.db"
PORT=3000
JWT_SECRET="your-super-secret-key-here"
3. Migrācijas un datubāzes inicializācija (Seed)Bashnpm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
4. Servera palaišanaBashnpm run dev
Apmeklējiet http://localhost:3000Traucējumnovēršana: Ja redzat SSL kļūdu (SSL_ERROR_RX_RECORD_TOO_LONG), pārliecinieties, ka pārlūkā atvērāt http://, nevis https://. Ja meklēšana ir lēna, pārliecinieties, ka indeksi ir izveidoti, palaižot migrācijas.Docker Uzstādīšana (PostgreSQL + Redis + Meilisearch)No sql/ direktorijas:Bash# 1. Startējiet servisu konteinerus
docker compose up -d

# 2. Konfigurējiet .env failu
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pc_laptop_search"
REDIS_URL="redis://localhost:6379"
MEILI_URL="[http://127.0.0.1:7700](http://127.0.0.1:7700)"
MEILI_API_KEY="masterKey"

# 3. Palaidiet migrācijas un seed datus
npm run prisma:migrate
npm run prisma:seed

# 4. Indeksējiet produktus Meilisearch dzinējā
npm run search:index

# 5. Startējiet serveri
npm run dev
API Pamatpunkti (Endpoints)MetodeCeļšAprakstsGET/api/healthVeselības pārbaude (vienmēr OK)GET/api/metricsAPI atbildes laika metrikas (p50/p95 ms)GET/api/productsMeklēt produktus ar filtriemGET/api/products/:idIegūt konkrētu produktu pēc IDPOST/api/auth/registerReģistrēt jaunu lietotājuPOST/api/auth/loginLietotāja pieteikšanās (atgriež JWT)GET/api/search/suggestAutocomplete meklēšanas ieteikumiGET/api/search/popularPopulārie meklēšanas terminiTestēšana un Veiktspējas mērījumi (Benchmark)Projektā ir iebūvēti skripti veiktspējas un algoritma testēšanai:Bash# Ātra lokālā slodzes pārbaude
npm run loadtest

# Algoritma precizitātes un ātruma izvērtēšana
npm run search:evaluate

# Caurlaidspējas (throughput) testi (100 un 1000 vienlaicīgi savienojumi)
npm run benchmark:throughput

# Datubāzes un indeksu resursu patēriņa analīze
npm run benchmark:resources