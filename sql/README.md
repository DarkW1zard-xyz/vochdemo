# PC & Laptop meklēšana (SQL + 1M lietotāji gatavi)

Node.js + SQLite/PostgreSQL backend ar Prisma un vienkāršu frontenda saskarni, kas pieprasa API.

## Iespējas
- SQL glabāšana lietotājiem un produktiem (SQLite/PostgreSQL)
- Meklēšanas un filtrēšanas API ar lapu dalīšanu
- E-pasta/paroles autentifikācija (JWT)
- Statiskā priekšgals, ko servē Express
- Hibridais meklēšanas dzinējs (SQL fallback + Meilisearch opcija)
- Redis cešošana (neobligāti)

## Uzstādīšana

### 1. Instalējiet atkarības
```bash
cd sql
npm install
```

### 2. Izveidojiet .env failu
```bash
cp .env.example .env
```

Aizpildiet ar jūsu datu bāzes konfigurāciju:
```
DATABASE_URL="file:./dev.db"
PORT=3000
JWT_SECRET=your-super-secret-key-here
```

### 3. Palaidiet migrācijas un seedzējiet datus
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4. Startējiet serveri
```bash
npm run dev
```

Apmeklējiet http://localhost:3000

## Traucējumnovēršana

- Ja redzat `SSL_ERROR_RX_RECORD_TOO_LONG` Firefox/Chrome, iespējams atvērāt `https://localhost:3000`.
  Šis dev serviss seko uz plānu HTTP, tāpēc izmantojiet `http://localhost:3000` (vai atspējojiet HTTPS-Only mode localhost dēļ).

- Ja meklēšana ir lēna: pārliecinieties, ka indeksi ir izveidoti — `npm run prisma:migrate`

## Docker (PostgreSQL + Redis + Meilisearch)

No `sql/` direktorijas:

```bash
# Startējiet servisu konteineri
docker compose up -d

# Konfigurējiet .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pc_laptop_search
REDIS_URL=redis://localhost:6379
MEILI_URL=http://127.0.0.1:7700
MEILI_API_KEY=masterKey
```

```bash
# Palaidiet migrācijas
npm run prisma:migrate

# Seedzējiet datus
npm run prisma:seed

# Indeksējiet produktus Meilisearch
npm run search:index

# Startējiet serveri
npm run dev
```

## Redis cešošana (neobligāti)

- Iestatiet `REDIS_URL` .env failā
- Meklēšanas atbildes ir cešotas 60 sekundes

## Meilisearch (ieteicams 1M+ produktiem)

- Palaidiet Meilisearch un iestatiet `MEILI_URL` (+ `MEILI_API_KEY` ja nepieciešams)
- Indeksējiet produktus:
  ```bash
  npm run search:index
  ```

Kad `MEILI_URL` ir iestatīts, produktu meklēšana vispirms izmanto Meilisearch un pēc noklusējuma atgriežas uz SQL.

## API pamatpunkti

| Metode | Ceļš | Apraksts |
|--------|------|----------|
| GET | `/api/health` | Veselības pārbaude (vienmēr OK) |
| GET | `/api/metrics` | p50/p95 atbildes laiks ms |
| GET | `/api/products` | Meklēt produktus ar filtriem |
| GET | `/api/products/:id` | Iegūt produktu pēc ID |
| POST | `/api/auth/register` | Reģistrēt jaunu lietotāju |
| POST | `/api/auth/login` | Pierakstīties |
| GET | `/api/search/suggest` | Autocomplete ieteikumi |
| GET | `/api/search/popular` | Populārie meklēšanas termini |

### Meklēšanas vaicājuma parametri

```
GET /api/products?q=i7+16gb&minRam=16&maxPrice=1500&sort=price_asc&limit=24&offset=0

Parametri:
- q: Teksts meklēšanai (piemērs: "i7 16gb rtx 4060")
- category: Kategorija (electronics, computers, gaming, office, accessories)
- brand: Zīmols (Apple, ASUS, Dell, HP, Lenovo, utt.)
- type: Tips (laptop, desktop, mini-pc, all-in-one)
- cpuBrand: CPU zīmols (intel, amd, apple)
- gpuBrand: GPU zīmols (nvidia, amd, apple, integrated)
- minRam: Minimums RAM (GB)
- minStorage: Minimums uzkrāšana (GB)
- minScreen: Minimums ekrāna lielums (collas)
- minPrice: Minimums cena ($)
- maxPrice: Maksimums cena ($)
- availability: Pieejamība (in_stock, out_of_stock, preorder)
- sort: Kārtošana (relevance, price_asc, price_desc, rating_desc, popularity_desc, newest)
- limit: Rezultātu skaits uz lapu (maks 100, noklusējums 24)
- offset: Pārlecēšana (lapu dalīšana)
```

## Mērogošanas ieteikumi 1M+ lietotājiem

- Izmantojiet savienojuma pooling (PgBouncer) un palieliniet DB resursus
- Pievienojiet Redis karstās vaicājumiem un sesiju cešošanai
- Izmantojiet dedikētu meklēšanas dzinēju (Meilisearch/Typesense/Elasticsearch) fuzzy/pilnteksta mērogošanai
- Pievienojiet datu bāzes indeksus biežiem filtriem (jau shēmā) un apsveriet GIN indeksus pilntekstam
- Pievienojiet CDN statiskami aktīviem un iespējojiet gzip/brotli
- Pievienojiet likmes ierobežošanu un WAF malu
- Izmantojiet horizontālo mērogošanu API aiz slodzes balansētāja

## Veiktspējas testēšana

```bash
# Ātra lokālā slodzes pārbaude
npm run loadtest

# Algoritma benchmark + precizitātes novērtēšana
npm run search:evaluate

# Veiktspējas benchmark (100 un 1000 vienlaicīgi)
npm run benchmark:throughput

# Resursu benchmark (DB izmērs, atmiņa, indeksa izmērs)
npm run benchmark:resources
```

## Algoritma atskaite (LV)

- Algoritma izvēle, alternatīvas, sarežģītības analīze:
  - `docs/ALGORITMA_ANALIZE_UN_TESTI.md`
- Pēdējie ģenerētie benchmark rezultāti:
  - `docs/SEARCH_TEST_RESULTS.md`
- Veiktspējas un atbildes laika rezultāti:
  - `docs/THROUGHPUT_RESULTS.md`
- Resursu un indeksa izmēra rezultāti:
  - `docs/RESOURCE_RESULTS.md`
- Rubrikas atbilstības matrica:
  - `docs/RUBRIKAS_ATBILSTIBA.md`
- Iesnieguma kopsavilkums (prezentācijai gatavs):
  - `docs/IESNIEGUMA_KOPSAVILKUMS.md`

---

## GitHub

### Repozitorija klonēšana

```bash
git clone https://github.com/yourusername/vochdemo.git
cd vochdemo/sql
npm install
```

### Atzaru darbs (Feature Branches)

```bash
# Izveidojiet jaunu atzaru
git checkout -b feature/your-feature-name

# Veiciet izmaiņas un pierakstieties
git add .
git commit -m "feat: jūsu iezīmes apraksts"

# Grūdiet uz attālo repozitoriju
git push origin feature/your-feature-name

# Izveidojiet Pull Request uz GitHub
```

### Pieaugošanas pieprasījumi (Pull Requests)

1. Forkējiet repozitoriju
2. Izveidojiet atzaru (`git checkout -b feature/improvement`)
3. Pierakstieties izmaiņas (`git commit -m "feat: apraksts"`)
4. Grūdiet atzaru (`git push origin feature/improvement`)
5. Atvērojiet Pull Request ar aprakstu

### Problēmu iesniegšana

Ja atrodat kļūdu vai vēlaties ieteikt iezīmi, lūdzu [atvērojiet problēmu](../../issues) ar:
- Aprakstu par problēmu
- Reprodukcijas soļi (ja piemērojams)
- Paredzētais uzvedības problēmu)
- Jūsu vide (OS, Node versija, DB tips)

### Devela izstrāde

```bash
# Uz mainiem failus
npm run dev

# Palaidiet testus
npm run search:evaluate

# Pārbaudi veiktspēju
npm run benchmark:throughput
```

### Licencija

MIT – bezmaksas izmantošana un modificēšana

### Autori

- Algoritma dizains un optimizācija: vochdemo team
- Backend: Express.js, Prisma ORM
- Meklēšana: SQLite/Meilisearch
- Kešošana: Redis

---

**Padoms**: Izmantojiet GitHub Discussions priekš jautājumiem un ideju dalīšanās par meklēšanas uzlabošanu!
