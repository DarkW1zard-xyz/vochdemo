# Atmiņas un indeksa izmēra novērtējums

- Datums: 2026-03-06T11:40:25.320Z
- Produktu skaits: 10024

## Faktiskie mērījumi

- SQLite DB kopējais izmērs: 5.90 MB
- SQLite datu izmērs (aptuveni): 3.54 MB
- SQLite indeksu izmērs (aptuveni): 2.36 MB
- Meilisearch indeksa izmērs: N/A (Meili nav pieejams)
- Node.js heapUsed (benchmark skripts): 12.79 MB
- Node.js RSS (benchmark skripts): 95.19 MB

## Projekcija uz 100K produktiem (lineāra aproksimācija)

- Prognozētais DB kopējais izmērs: 58.88 MB
- Prognozētais datu izmērs: 35.33 MB
- Prognozētais indeksu izmērs: 23.55 MB
- Prognozētais Meilisearch indekss: N/A
- Indeksu/datu attiecības koeficients: 66.67%
- Meilisearch indeksa/datu attiecības koeficients: N/A

## Kritēriju atbilstība

- RAM ≤ 4GB / 100K: jāvērtē, izmantojot servera procesa RSS produkcijas slodzē.
- Indekss ≤ 150% no oriģinālo datu izmēra: ATBILST.
- Meilisearch indekss ≤ 150%: NAV DATU.
