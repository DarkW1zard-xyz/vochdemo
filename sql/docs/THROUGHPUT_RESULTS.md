# Caurlaides spējas un atbildes laika mērījumi

- Datums: 2026-03-04T11:26:57.302Z
- Bāzes URL: http://localhost:3000

| Scenārijs | Concurrency | Ilgums (s) | Avg latency (ms) | p95 latency (ms) | Req/s | Total req | Errors | Timeouts |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| API search @100 concurrent | 100 | 15 | 35.38 | 103.00 | 2788.00 | 41818 | 0 | 0 |
| API search @1000 concurrent | 1000 | 15 | 320.73 | 787.00 | 3093.34 | 46393 | 0 | 0 |

## Secinājumi

- Kritērijs “< 200ms” tiek vērtēts pēc p95 latency.
- Kritērijs “1000+ vienlaicīgas meklēšanas” tiek vērtēts pēc 1000 concurrency scenārija ar error/timeout skaitu.
