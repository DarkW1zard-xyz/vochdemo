PC & Laptop Meklētājs (Mērogojams 1M+ lietotājiem)Node.js un SQLite/PostgreSQL aizmugursistēma (backend) ar Prisma ORM un Express.js, kas nodrošina API ātru un precīzu produktu meklēšanu.Galvenās iezīmesDatu glabāšana: Relāciju datubāze lietotājiem un produktiem (SQLite izstrādei, PostgreSQL produkcijai).Hibrīdais meklēšanas dzinējs: Uzlabots algoritms, kas primāri izmanto Meilisearch ātrai pilnteksta (fuzzy) meklēšanai, bet automātiski pārslēdzas (fallback) uz SQL optimizētiem vaicājumiem, ja nepieciešams.API un filtrēšana: Detalizēta produktu filtrēšana un meklēšanas API ar lapošanu (pagination).Autentifikācija: Droša e-pasta un paroles pieteikšanās izmantojot JWT.Veiktspējas optimizācija: Redis integrācija biežāko vaicājumu kešošanai (atbildes tiek kešotas 60 sekundes).Atbilstība projekta uzdevumiemProjekts ir izstrādāts, stingri sekojot specifikācijas prasībām. Visi detalizētie apraksti atrodami docs/ direktorijā:Algoritma izvēle un pamatojums: Hibrīdās meklēšanas izvēle (Invertētais indekss + SQL B-Tree indeksi) pamatota dokumentā: docs/ALGORITMA_ANALIZE_UN_TESTI.md.Algoritma implementācija: Realizēta API maršrutētājos. Kods ir strukturēts, komentēts un atbalsta visu galveno funkcionalitāti.Kompleksitātes analīze: Laika ($O(1)$ līdz $O(\log n)$) un telpas sarežģītības analīze, kā arī labāko/sliktāko scenāriju izvērtējums atrodams algoritma analīzes failā.Testēšana un novērtēšana: Sistēma testēta ar datu kopu, kas pārsniedz 10K produktus.Veiktspējas (Throughput) un atbildes laika (p50/p95) rezultāti: docs/THROUGHPUT_RESULTS.mdResursu patēriņš: docs/RESOURCE_RESULTS.mdUzstādīšana (Lokālā izstrāde)1. Instalējiet atkarībasBashcd sql
npm install
2. Vides mainīgieIzveidojiet .env failu, izmantojot sagatavi:Bashcp .env.example .env
Aizpildiet ar saviem datiem:Koda fragmentsDATABASE_URL="file:./dev.db"
PORT=3000
JWT_SECRET="tava-super-slepena-atslega"
3. Migrācijas un datubāzes inicializācija (Seed)Bashnpm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
4. Servera palaišanaBashnpm run dev
API pieejams: http://localhost:3000 (Piezīme: Ja pārlūkā redzat SSL kļūdu, pārliecinieties, ka neizmantojat HTTPS lokālajai izstrādei).Docker Uzstādīšana (PostgreSQL + Redis + Meilisearch)Lai maksimāli pietuvinātu vidi produkcijai un apstrādātu lielu datu apjomu:Bash# 1. Startējiet servisu konteinerus
docker compose up -d

# 2. Pievienojiet šos parametrus .env failā
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pc_laptop_search"
REDIS_URL="redis://localhost:6379"
MEILI_URL="http://127.0.0.1:7700"
MEILI_API_KEY="masterKey"

# 3. Izpildiet migrācijas un seed datus
npm run prisma:migrate
npm run prisma:seed

# 4. Indeksējiet produktus Meilisearch dzinējā
npm run search:index

# 5. Startējiet serveri
npm run dev
API Pamatpunkti (Endpoints)MetodeCeļšAprakstsGET/api/healthVeselības pārbaudeGET/api/metricsAPI atbildes laika metrikas (p50/p95 ms)GET/api/productsMeklēt produktus ar filtriem (skat. zemāk)GET/api/products/:idIegūt konkrētu produktu pēc IDPOST/api/auth/registerReģistrēt jaunu lietotājuPOST/api/auth/loginLietotāja pieteikšanās (atgriež JWT)GET/api/search/suggestAutocomplete meklēšanas ieteikumiTestēšana un Benchmark (Veiktspējas mērījumi)Projekts ietver iebūvētus rīkus pilnvērtīgai slodzes un algoritma testēšanai:Bash# Ātra lokālā slodzes pārbaude
npm run loadtest

# Algoritma meklēšanas precizitātes un ātruma izvērtēšana
npm run search:evaluate

# Caurlaidspējas (throughput) testi (100 un 1000 vienlaicīgi savienojumi)
npm run benchmark:throughput

# Datubāzes un indeksu resursu patēriņa analīze
npm run benchmark:resources
