# nycrhythm — NYC Subway Live Map

**Open a tab, watch New York breathe.**
Every train in the NYC subway, moving live on the map — powered by MTA GTFS-Realtime.

**Live: https://nycrhythm.scottchen0622.com**

Sister project of [mrtrhythm](https://github.com/sc126-cornell/mrtrhythm) (Taipei Metro,「捷奏」) — same engine philosophy. Taipei simulates schedules and calibrates against arrival boards; New York reads true per-train positions from GTFS-RT. Two cities, one rhythm.

## How it works

- **Data pipeline** (`pipeline/`, daily via GitHub Actions): MTA GTFS static → `network.json` (29 routes, 496 stations + transfer complexes, 257 track-shape variants with per-stop chainage). No API key required.
- **RT proxy** (`api/rt`): decodes 8 GTFS-RT protobuf feeds, slims to JSON, edge-cached 15s — MTA load is decoupled from visitor count.
- **Engine** (`web/`): each train is interpolated along official track geometry between its own real-time stop predictions. Follow mode, station arrival boards (transfer-complex aware), search, deep links. Auto day/night follows the NYC sun.

## Develop

```bash
npm install
npm run dev        # local dev (RT via production API)
npm run build
npx tsx pipeline/build-network.ts   # rebuild network.json from GTFS zip
```

Docs & phase plans (PDCA, in Chinese): [PRD.md](PRD.md) · [SDD.md](SDD.md) · [plans/](plans/) · [BACKLOG.md](BACKLOG.md)

## Data & License

- Data: [MTA Open Data](https://api.mta.info/) — GTFS static + GTFS-Realtime (key-free)
- Basemap: © OpenStreetMap © CARTO
- Code: [MIT](LICENSE)
