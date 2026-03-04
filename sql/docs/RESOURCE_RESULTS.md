# Atmiņas un indeksa izmēra novērtējums

- Datums: 2026-03-04T11:31:53.209Z
- Produktu skaits: 10024

## Faktiskie mērījumi

- PostgreSQL Product kopējais izmērs (data + index): 6.80 MB
- PostgreSQL Product datu izmērs: 3.92 MB
- PostgreSQL Product indeksu izmērs: 2.84 MB
- Meilisearch indeksa izmērs: N/A (Meili nav pieejams)
- Node.js heapUsed (benchmark skripts): 13.38 MB
- Node.js RSS (benchmark skripts): 122.62 MB

## Projekcija uz 100K produktiem (lineāra aproksimācija)

- Prognozētais Product kopējais izmērs: 67.81 MB
- Prognozētais Product datu izmērs: 39.12 MB
- Prognozētais Product indeksu izmērs: 28.29 MB
- Prognozētais Meilisearch indekss: N/A
- PostgreSQL indeksu/datu attiecības koeficients: 72.31%
- Meilisearch indeksa/datu attiecības koeficients: N/A

## Kritēriju atbilstība

- RAM ≤ 4GB / 100K: jāvērtē, izmantojot servera procesa RSS produkcijas slodzē.
- Indekss ≤ 150% no oriģinālo datu izmēra (PostgreSQL): ATBILST.
- Indekss ≤ 150% no oriģinālo datu izmēra (Meilisearch): NAV DATU.
