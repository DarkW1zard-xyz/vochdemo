# Caurlaides spējas un atbildes laika mērījumi

- Datums: 2026-03-06T11:41:08.835Z
- Bāzes URL: http://localhost:3000

| Scenārijs | Concurrency | Ilgums (s) | Avg latency (ms) | p95 latency (ms) | Req/s | Total req | Errors | Timeouts |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| API search @100 concurrent | 100 | 15 | 31.42 | 52.00 | 3131.27 | 46959 | 0 | 0 |
| API search @1000 concurrent | 1000 | 15 | 315.25 | 474.00 | 3137.80 | 47060 | 0 | 0 |

## Secinājumi

- Kritērijs “< 200ms” tiek vērtēts pēc p95 latency.
- Kritērijs “1000+ vienlaicīgas meklēšanas” tiek vērtēts pēc 1000 concurrency scenārija ar error/timeout skaitu.
