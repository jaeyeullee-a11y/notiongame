# Stillgarden

A calm 2D garden-decorating sandbox for desktop web.

Paint terrain, place 18 garden assets, arrange the scene, observe ambient life, and export a PNG — all offline, with local save slots.

## Stack

- React 19 + TypeScript + Vite
- PixiJS 8
- Zustand
- Dexie.js (IndexedDB)
- Howler.js
- Zod
- Vitest

## Scripts

```bash
npm install
npm run dev
npm run build
npm test
```

## Controls

| Input | Action |
| --- | --- |
| Left click | Select, place, paint |
| Left drag | Move object / paint terrain |
| Middle drag / Space + drag | Pan |
| Wheel | Zoom |
| Esc | Cancel placement / clear selection |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Shift + Z | Redo |
| Delete | Delete selected |
| Ctrl/Cmd + D | Duplicate |
| Q / E | Rotate |
| X | Flip |
| [ / ] | Layer back / forward |
| - / = | Scale |
| Tab | Observe Mode |
| Ctrl/Cmd + S | Save dialog |

## MVP scope

- 2400×1600 temperate garden world
- Terrain: grass, soil, stone path, pond water
- 18 placeable assets (6 categories × 3)
- Undo/redo, autosave, 6 local slots, PNG export
- Observe Mode, butterflies, birds, ambient audio tones
