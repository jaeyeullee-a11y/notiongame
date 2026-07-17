import fs from 'node:fs'
import path from 'node:path'

const outDir = path.resolve('public/assets/sprites')
fs.mkdirSync(outDir, { recursive: true })

const assets = [
  {
    id: 'fern-patch',
    w: 180,
    h: 120,
    body: `
      <ellipse cx="90" cy="100" rx="70" ry="16" fill="#3a4f3c" opacity="0.25"/>
      <path d="M40 95 C55 40, 70 35, 90 95" fill="#5f8a58"/>
      <path d="M70 95 C85 30, 105 28, 110 95" fill="#6f9a66"/>
      <path d="M95 95 C120 38, 140 45, 145 95" fill="#567f50"/>
    `,
  },
  {
    id: 'clover-patch',
    w: 160,
    h: 90,
    body: `
      <ellipse cx="80" cy="78" rx="60" ry="12" fill="#3a4f3c" opacity="0.22"/>
      <circle cx="55" cy="55" r="14" fill="#6f9a66"/>
      <circle cx="72" cy="48" r="14" fill="#7eaa74"/>
      <circle cx="88" cy="55" r="14" fill="#6f9a66"/>
      <circle cx="110" cy="52" r="12" fill="#89b47d"/>
      <circle cx="95" cy="62" r="11" fill="#5f8a58"/>
    `,
  },
  {
    id: 'wild-grass',
    w: 140,
    h: 100,
    body: `
      <ellipse cx="70" cy="90" rx="50" ry="10" fill="#3a4f3c" opacity="0.2"/>
      <path d="M30 90 Q40 40 35 20" stroke="#6f9a66" stroke-width="4" fill="none"/>
      <path d="M50 90 Q55 30 52 15" stroke="#89b47d" stroke-width="4" fill="none"/>
      <path d="M70 90 Q72 25 70 10" stroke="#6f9a66" stroke-width="5" fill="none"/>
      <path d="M90 90 Q95 35 98 18" stroke="#7eaa74" stroke-width="4" fill="none"/>
      <path d="M110 90 Q108 45 115 25" stroke="#5f8a58" stroke-width="4" fill="none"/>
    `,
  },
  {
    id: 'rose-bush',
    w: 200,
    h: 180,
    body: `
      <ellipse cx="100" cy="165" rx="70" ry="14" fill="#3a4f3c" opacity="0.25"/>
      <ellipse cx="100" cy="110" rx="70" ry="55" fill="#4f7a4c"/>
      <circle cx="70" cy="95" r="14" fill="#c45b6a"/>
      <circle cx="105" cy="80" r="16" fill="#d46876"/>
      <circle cx="130" cy="105" r="13" fill="#b85160"/>
      <circle cx="90" cy="120" r="12" fill="#c45b6a"/>
    `,
  },
  {
    id: 'lavender-cluster',
    w: 160,
    h: 200,
    body: `
      <ellipse cx="80" cy="188" rx="45" ry="10" fill="#3a4f3c" opacity="0.22"/>
      <rect x="40" y="90" width="6" height="90" fill="#6d8a5c"/>
      <rect x="70" y="70" width="6" height="110" fill="#6d8a5c"/>
      <rect x="100" y="85" width="6" height="95" fill="#6d8a5c"/>
      <ellipse cx="43" cy="75" rx="10" ry="28" fill="#8b7bb8"/>
      <ellipse cx="73" cy="55" rx="12" ry="34" fill="#9a89c4"/>
      <ellipse cx="103" cy="70" rx="10" ry="30" fill="#7f6eab"/>
    `,
  },
  {
    id: 'daisy-cluster',
    w: 170,
    h: 140,
    body: `
      <ellipse cx="85" cy="128" rx="55" ry="12" fill="#3a4f3c" opacity="0.22"/>
      <circle cx="55" cy="90" r="16" fill="#f3f0df" stroke="#e4d9a8"/>
      <circle cx="55" cy="90" r="5" fill="#e2b14a"/>
      <circle cx="90" cy="75" r="18" fill="#f7f4e8" stroke="#e4d9a8"/>
      <circle cx="90" cy="75" r="5" fill="#e2b14a"/>
      <circle cx="120" cy="95" r="15" fill="#f3f0df" stroke="#e4d9a8"/>
      <circle cx="120" cy="95" r="4" fill="#e2b14a"/>
      <path d="M55 106 V128 M90 93 V128 M120 110 V128" stroke="#6d8a5c" stroke-width="3"/>
    `,
  },
  {
    id: 'round-hedge',
    w: 220,
    h: 160,
    body: `
      <ellipse cx="110" cy="145" rx="85" ry="14" fill="#3a4f3c" opacity="0.25"/>
      <ellipse cx="110" cy="95" rx="90" ry="55" fill="#4d7348"/>
      <ellipse cx="80" cy="85" rx="35" ry="30" fill="#5d8855"/>
      <ellipse cx="140" cy="90" rx="35" ry="28" fill="#45683f"/>
    `,
  },
  {
    id: 'flowering-shrub',
    w: 210,
    h: 190,
    body: `
      <ellipse cx="105" cy="175" rx="75" ry="14" fill="#3a4f3c" opacity="0.25"/>
      <ellipse cx="105" cy="110" rx="80" ry="65" fill="#52784c"/>
      <circle cx="70" cy="95" r="8" fill="#d98aa0"/>
      <circle cx="100" cy="80" r="9" fill="#e29aaf"/>
      <circle cx="130" cy="100" r="8" fill="#d98aa0"/>
      <circle cx="95" cy="120" r="7" fill="#c97b92"/>
    `,
  },
  {
    id: 'loose-shrub',
    w: 200,
    h: 170,
    body: `
      <ellipse cx="100" cy="155" rx="70" ry="12" fill="#3a4f3c" opacity="0.22"/>
      <path d="M40 140 C50 70, 80 50, 100 140 C120 55, 150 70, 165 140 C140 100, 70 100, 40 140Z" fill="#5a8253"/>
      <path d="M60 130 C75 80, 110 75, 125 130" fill="#6d9664"/>
    `,
  },
  {
    id: 'young-oak',
    w: 280,
    h: 340,
    body: `
      <ellipse cx="140" cy="320" rx="55" ry="16" fill="#3a4f3c" opacity="0.28"/>
      <rect x="128" y="200" width="24" height="120" rx="6" fill="#7a5a3d"/>
      <circle cx="140" cy="150" r="95" fill="#4f7a4c"/>
      <circle cx="95" cy="140" r="45" fill="#5f8a58"/>
      <circle cx="180" cy="130" r="50" fill="#45683f"/>
      <circle cx="145" cy="100" r="40" fill="#6f9a66"/>
    `,
  },
  {
    id: 'birch-tree',
    w: 200,
    h: 380,
    body: `
      <ellipse cx="100" cy="360" rx="40" ry="12" fill="#3a4f3c" opacity="0.25"/>
      <rect x="92" y="160" width="16" height="200" rx="4" fill="#efe8d8"/>
      <rect x="96" y="180" width="3" height="20" fill="#6b6558"/>
      <rect x="96" y="230" width="3" height="16" fill="#6b6558"/>
      <rect x="96" y="280" width="3" height="18" fill="#6b6558"/>
      <ellipse cx="100" cy="120" rx="70" ry="90" fill="#7ea86f"/>
      <ellipse cx="70" cy="130" rx="30" ry="40" fill="#6f9a66"/>
      <ellipse cx="125" cy="110" rx="28" ry="38" fill="#89b47d"/>
    `,
  },
  {
    id: 'willow-tree',
    w: 360,
    h: 400,
    body: `
      <ellipse cx="180" cy="380" rx="90" ry="18" fill="#3a4f3c" opacity="0.28"/>
      <rect x="168" y="180" width="24" height="200" rx="6" fill="#6b5338"/>
      <ellipse cx="180" cy="140" rx="140" ry="100" fill="#5d8855"/>
      <path d="M70 140 Q80 280 90 340" stroke="#6f9a66" stroke-width="8" fill="none" opacity="0.85"/>
      <path d="M120 120 Q125 270 130 350" stroke="#7eaa74" stroke-width="8" fill="none" opacity="0.85"/>
      <path d="M230 120 Q235 270 240 350" stroke="#6f9a66" stroke-width="8" fill="none" opacity="0.85"/>
      <path d="M280 140 Q275 280 270 340" stroke="#5f8a58" stroke-width="8" fill="none" opacity="0.85"/>
    `,
  },
  {
    id: 'wooden-bench',
    w: 220,
    h: 110,
    body: `
      <ellipse cx="110" cy="98" rx="80" ry="10" fill="#3a4f3c" opacity="0.2"/>
      <rect x="30" y="55" width="160" height="18" rx="3" fill="#8a6951"/>
      <rect x="30" y="35" width="160" height="12" rx="3" fill="#9a785e"/>
      <rect x="40" y="73" width="10" height="22" fill="#6e5240"/>
      <rect x="170" y="73" width="10" height="22" fill="#6e5240"/>
    `,
  },
  {
    id: 'bird-bath',
    w: 120,
    h: 140,
    body: `
      <ellipse cx="60" cy="128" rx="28" ry="8" fill="#3a4f3c" opacity="0.22"/>
      <rect x="50" y="70" width="20" height="55" rx="4" fill="#aaa698"/>
      <ellipse cx="60" cy="70" rx="40" ry="16" fill="#b8b4a6"/>
      <ellipse cx="60" cy="66" rx="30" ry="10" fill="#8eb4b8"/>
    `,
  },
  {
    id: 'garden-lantern',
    w: 80,
    h: 180,
    body: `
      <ellipse cx="40" cy="168" rx="16" ry="6" fill="#3a4f3c" opacity="0.22"/>
      <rect x="36" y="90" width="8" height="75" fill="#6e5240"/>
      <rect x="22" y="50" width="36" height="45" rx="4" fill="#8a6951"/>
      <rect x="28" y="58" width="24" height="28" rx="2" fill="#e8c27a" opacity="0.85"/>
      <polygon points="20,50 40,30 60,50" fill="#6e5240"/>
    `,
  },
  {
    id: 'wooden-footbridge',
    w: 320,
    h: 160,
    body: `
      <ellipse cx="160" cy="145" rx="130" ry="12" fill="#3a4f3c" opacity="0.18"/>
      <path d="M30 110 Q160 40 290 110" stroke="#8a6951" stroke-width="28" fill="none"/>
      <path d="M30 110 Q160 40 290 110" stroke="#9a785e" stroke-width="8" fill="none" opacity="0.5"/>
      <rect x="50" y="70" width="8" height="45" fill="#6e5240"/>
      <rect x="262" y="70" width="8" height="45" fill="#6e5240"/>
    `,
  },
  {
    id: 'garden-arch',
    w: 260,
    h: 280,
    body: `
      <ellipse cx="130" cy="265" rx="70" ry="12" fill="#3a4f3c" opacity="0.22"/>
      <path d="M50 260 V120 Q130 40 210 120 V260" stroke="#8a6951" stroke-width="16" fill="none"/>
      <circle cx="80" cy="110" r="10" fill="#c45b6a"/>
      <circle cx="180" cy="105" r="10" fill="#c45b6a"/>
      <circle cx="130" cy="70" r="12" fill="#6f9a66"/>
    `,
  },
  {
    id: 'small-gazebo',
    w: 340,
    h: 300,
    body: `
      <ellipse cx="170" cy="280" rx="120" ry="16" fill="#3a4f3c" opacity="0.25"/>
      <polygon points="170,40 40,140 300,140" fill="#b66d4f"/>
      <polygon points="170,55 70,140 270,140" fill="#c88464"/>
      <rect x="70" y="140" width="14" height="120" fill="#8a6951"/>
      <rect x="256" y="140" width="14" height="120" fill="#8a6951"/>
      <rect x="155" y="140" width="14" height="120" fill="#9a785e"/>
      <rect x="90" y="200" width="160" height="12" fill="#aaa698" opacity="0.7"/>
    `,
  },
]

for (const asset of assets) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${asset.w}" height="${asset.h}" viewBox="0 0 ${asset.w} ${asset.h}">
  ${asset.body}
</svg>
`
  fs.writeFileSync(path.join(outDir, `${asset.id}.svg`), svg)
}

// Favicon
fs.writeFileSync(
  path.resolve('public/favicon.svg'),
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#E8E1C9"/>
  <circle cx="32" cy="34" r="18" fill="#789267"/>
  <circle cx="24" cy="30" r="6" fill="#c45b6a"/>
  <rect x="30" y="40" width="4" height="14" fill="#8A6951"/>
</svg>
`,
)

console.log(`Generated ${assets.length} placeholder sprites`)
