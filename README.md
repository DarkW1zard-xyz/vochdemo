PC & Laptop Meklētājs (Gatavs 1M+ lietotājiem)

Šis projekts nodrošina Node.js un PostgreSQL/SQLite aizmugursistēmu (backend) ar Prisma ORM, kā arī ātru un mērogojamu meklēšanas API e-komercijas vajadzībām.

🚀 Iespējas un tehnoloģijas

Datu glabāšana: Relāciju datubāze lietotājiem un produktiem (SQLite izstrādei, PostgreSQL produkcijai).

Hibrīdais meklēšanas dzinējs: Apvieno Meilisearch pilnteksta/kļūdu toleranto (fuzzy) meklēšanu ar automātisku atkāpšanās mehānismu (fallback) uz SQL optimizētiem B-koku (B-Tree) indeksiem.

Kešošana: Redis integrācija biežāko vaicājumu rezultātu uzglabāšanai (atbildes tiek kešotas 60 sekundes).

Autentifikācija: Droša e-pasta un paroles pieteikšanās izmantojot JWT.

API: Detalizēta meklēšanas un filtrēšanas API ar lapošanu (pagination).

Frontend: Statiskā lietotāja saskarne, ko apkalpo Express.js.

🛠️ Uzstādīšana (Lokālā izstrāde)

1. Instalējiet atkarības

cd sql
npm install


2. Vides mainīgie
Izveidojiet .env failu, izmantojot sagatavi:

cp .env.example .env


Aizpildiet ar savu datu bāzes konfigurāciju:

DATABASE_URL="file:./dev.db"
PORT=3000
JWT_SECRET="jusu-super-slepena-atslega"


3. Migrācijas un datu inicializācija (Seed)

npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed


4. Startējiet serveri

npm run dev


Apmeklējiet: http://localhost:3000

Traucējumnovēršana:

Ja Firefox/Chrome redzat kļūdu SSL_ERROR_RX_RECORD_TOO_LONG, pārliecinieties, ka apmeklējat http://localhost:3000 (nevis https).

Ja meklēšana ir lēna: pārliecinieties, ka datubāzes indeksi ir izveidoti, izpildot npm run prisma:migrate.

🐳 Docker (PostgreSQL + Redis + Meilisearch)

Lai maksimāli pietuvinātu vidi produkcijai un apstrādātu lielu datu apjomu, no sql/ direktorijas:

# 1. Startējiet servisu konteinerus
docker compose up -d


Konfigurējiet .env failu:

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pc_laptop_search?schema=public"
REDIS_URL="redis://localhost:6379"
MEILI_URL="http://127.0.0.1:7700"
MEILI_API_KEY="masterKey"


Palaidiet nepieciešamās komandas:

npm run prisma:migrate      # Izveido datubāzes struktūru
npm run prisma:seed         # Aizpilda DB ar 10K+ testa produktiem
npm run search:index        # Indeksē produktus Meilisearch dzinējā
npm run dev                 # Startē serveri


Piezīme: Kad MEILI_URL ir iestatīts, produktu meklēšana vispirms izmanto Meilisearch un automātiski atgriežas uz SQL dzinēju, ja tas nav pieejams.

📡 API Pamatpunkti

Metode

Ceļš

Apraksts

GET

/api/health

Veselības pārbaude (vienmēr OK)

GET

/api/metrics

API atbildes laika metrikas (p50/p95 ms)

GET

/api/products

Meklēt produktus ar filtriem

GET

/api/products/:id

Iegūt produktu pēc ID

POST

/api/auth/register

Reģistrēt jaunu lietotāju

POST

/api/auth/login

Lietotāja pieteikšanās

GET

/api/search/suggest

Autocomplete ieteikumi

GET

/api/search/popular

Populārākie meklēšanas termini

Meklēšanas vaicājuma parametri (/api/products):
Piemērs: ?q=i7+16gb&minRam=16&maxPrice=1500&sort=price_asc&limit=24&offset=0

q: Teksts meklēšanai (piem., "i7 16gb rtx 4060")

category, brand, type: Filtrēšana pēc kategorijas un ražotāja

cpuBrand, gpuBrand: Komponenšu filtri

minRam, minStorage, minScreen: Minimālie tehniskie parametri

minPrice, maxPrice: Cenu diapazons

availability: Pieejamība (in_stock, out_of_stock)

sort: Kārtošana (relevance, price_asc, price_desc, rating_desc, newest)

limit, offset: Rezultātu lapošana

📈 Mērogošanas ieteikumi 1M+ lietotājiem

Lai sistēma izturētu lielas slodzes produkcijas vidē, jāievieš sekojošais:

Izmantot savienojumu pūlu (Connection Pooling) ar PgBouncer un palielināt DB servera resursus.

Aktivizēt pilnvērtīgu Redis klasteri karsto vaicājumu un sesiju kešošanai.

Pilnteksta un fuzzy meklēšanai izmantot dedikētu dzinēju (Meilisearch / Elasticsearch).

Konfigurēt GIN indeksus SQL datubāzē pilnteksta meklēšanas atkāpšanās (fallback) variantam.

Pievienot CDN statiskajiem failiem un aktivizēt HTTP kompresiju (Gzip/Brotli).

Ieviest pieprasījumu ierobežošanu (Rate Limiting) un WAF (Web Application Firewall) drošībai.

Izmantot API horizontālo mērogošanu (vairākas Node.js instances aiz Load Balancer).

🧪 Veiktspējas testēšana (Benchmarking)

Sistēmas robežu un funkcionalitātes pārbaudei ir izstrādāti integrēti skripti:

npm run loadtest             # Ātra lokālā slodzes pārbaude
npm run search:evaluate      # Algoritma precizitātes un ātruma izvērtēšana
npm run benchmark:throughput # Caurlaidspējas testi (100 un 1000 vienlaicīgi savienojumi)
npm run benchmark:resources  # Resursu mērījumi (DB izmērs, RAM, Indeksu izmērs)


📚 Projekta dokumentācija un algoritma atskaite

Visi ar sistēmas arhitektūru un novērtējumu saistītie dokumenti atrodami docs/ direktorijā:

Algoritma izvēle, alternatīvas, kompleksitātes analīze (Big O): docs/ALGORITMA_ANALIZE_UN_TESTI.md

Caurlaidspējas un atbildes laika rezultāti: docs/THROUGHPUT_RESULTS.md

Resursu un indeksa izmēra rezultāti: docs/RESOURCE_RESULTS.md

Meklēšanas precizitātes testa rezultāti: docs/SEARCH_TEST_RESULTS.md

Rubrikas atbilstības matrica: docs/RUBRIKAS_ATBILSTIBA.md

Iesnieguma kopsavilkums (prezentācijai): docs/IESNIEGUMA_KOPSAVILKUMS.md

🤝 Izstrādes un Git darbplūsma (Workflow)

Repozitorija klonēšana:

git clone https://github.com/yourusername/vochdemo.git
cd vochdemo/sql
npm install


Darbs ar atzariem (Feature Branches):

git checkout -b feature/tavas-funkcijas-nosaukums
git add .
git commit -m "feat: funkcionalitātes apraksts"
git push origin feature/tavas-funkcijas-nosaukums


Pēc izmaiņu augšupielādes, atveriet Pull Request (PR) GitHub platformā.

Problēmu pieteikšana (Issues):
Ja atrodat kļūdu vai vēlaties ieteikt uzlabojumu, lūdzu, atveriet jaunu "Issue", norādot:

Problēmas aprakstu un reproducēšanas soļus.

Paredzēto sistēmas uzvedību.

Savu vidi (OS, Node versija, datubāzes tips).
