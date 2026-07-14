/**
 * Gerador de mapa estelar estático para uso no backend (e-mails, PDFs, QR codes).
 *
 * Produz SVG puro — sem React, sem Tailwind, sem CSS externo, sem animações.
 * Compatível com clientes de e-mail (Resend/Gmail/Apple Mail) via data URI ou
 * como `<img src="https://...">` após upload no Supabase Storage.
 *
 * Uso no template de e-mail:
 *   const svg    = buildStarMapSvg()
 *   const b64    = starMapToBase64(svg)
 *   // Como tag <img> no HTML do e-mail:
 *   <img src="data:image/svg+xml;base64,${b64}" width="300" height="300" />
 */

// ── Dados estelares ──────────────────────────────────────────────────────────
// Idênticos ao componente ShowcaseSection — fonte única de verdade para ambos.
// Estrelas de fundo [cx, cy, r, opacity]
const BG_STARS: [number, number, number, number][] = [
  [140,25,0.8,0.6],[165,22,1.0,0.7],[185,28,0.7,0.5],
  [90,45,0.9,0.6],[115,40,0.7,0.5],[172,35,1.1,0.7],[198,42,0.8,0.6],[225,50,0.7,0.5],
  [65,65,1.0,0.6],[92,58,0.8,0.5],[122,55,0.9,0.7],[182,58,0.7,0.5],[212,65,1.0,0.6],[248,72,0.8,0.5],
  [45,88,0.8,0.5],[75,80,1.1,0.7],[108,75,0.7,0.5],[142,72,0.9,0.6],[210,80,0.8,0.6],[248,88,0.7,0.5],
  [35,110,0.9,0.5],[65,102,0.8,0.6],[98,95,1.0,0.7],[132,92,0.7,0.5],[232,102,0.9,0.6],[268,110,0.8,0.5],
  [28,132,0.7,0.5],[58,125,1.0,0.6],[92,118,0.8,0.7],[268,132,0.9,0.5],[292,140,0.7,0.5],
  [22,160,0.8,0.5],[52,155,0.7,0.6],[88,150,1.0,0.6],[235,152,0.8,0.6],[270,158,0.7,0.5],
  [28,188,0.9,0.5],[58,195,0.7,0.6],[92,202,1.0,0.6],[232,195,0.8,0.5],[265,188,0.7,0.5],
  [35,215,0.8,0.5],[68,222,1.1,0.7],[102,228,0.7,0.5],[205,222,0.9,0.6],[242,215,0.8,0.5],
  [65,240,0.9,0.5],[95,248,0.8,0.6],[228,242,0.7,0.5],[252,230,1.0,0.6],
  [88,262,0.8,0.5],[118,268,0.7,0.6],[212,260,0.9,0.5],
  [108,278,0.7,0.5],[168,280,0.8,0.5],[198,275,0.7,0.5],
  [152,110,0.7,0.5],[218,118,0.9,0.6],[242,142,0.8,0.5],
  [48,168,0.7,0.5],[278,172,0.8,0.5],[258,205,0.9,0.6],
  [138,230,0.7,0.5],[172,228,0.8,0.5],[175,258,0.7,0.5],
  [112,138,0.9,0.6],[115,172,0.7,0.5],[220,172,0.8,0.6],
  [78,138,0.8,0.5],[245,162,0.7,0.5],[58,148,0.9,0.6],
]

// Estrelas nomeadas [cx, cy, r, color]
const NAMED_STARS: [number, number, number, string][] = [
  [145,108,3.0,'#ffcc88'], [188,172,2.8,'#c8e8ff'], [178,100,1.9,'#ffffff'],
  [148,175,1.9,'#ffffff'],
  [155,142,1.7,'#e0e8ff'], [168,145,1.7,'#e0e8ff'], [181,148,1.7,'#e0e8ff'],
  [88,198,3.8,'#c8e8ff'],  [68,228,1.7,'#d0e8ff'],  [58,212,1.5,'#d0e8ff'],
  [118,252,3.2,'#d8f0ff'],
  [230,138,2.2,'#f0f0ff'],
  [95,78,1.9,'#fff0d0'],   [108,90,2.0,'#fff0d0'],
  [75,112,2.3,'#ffaa66'],  [102,78,1.8,'#ffffff'],
  [128,62,2.2,'#ffe88a'],
  [155,200,1.8,'#ffffff'], [140,212,1.5,'#ffffff'], [165,218,1.3,'#ffffff'],
  [55,72,1.2,'#c8d8ff'],   [62,65,1.0,'#c8d8ff'],  [68,75,1.3,'#c8d8ff'],
  [50,80,1.0,'#c8d8ff'],   [72,82,1.1,'#c8d8ff'],  [60,88,1.0,'#c8d8ff'],
  [65,270,2.5,'#c8e8ff'],
  [200,145,1.5,'#ffffff'], [215,158,1.4,'#ffffff'],
]

// Linhas de constelação [x1, y1, x2, y2]
const CONSTELLATION_LINES: [number, number, number, number][] = [
  [155,142,168,145],[168,145,181,148],
  [145,108,155,142],[178,100,155,142],[145,108,178,100],
  [181,148,188,172],[155,142,148,175],
  [88,198,68,228],[88,198,58,212],
  [95,78,108,90],
  [75,112,102,78],[75,112,55,72],
  [128,62,102,78],
  [155,200,140,212],[140,212,165,218],
]

// ── Gerador ──────────────────────────────────────────────────────────────────

export interface StarMapOptions {
  /** Largura/altura do SVG em pixels (é quadrado). Padrão: 320 */
  size?: number
  /** Data a exibir na borda inferior. Padrão: string vazia */
  dateLabel?: string
  /** Local a exibir na borda inferior. Padrão: string vazia */
  locationLabel?: string
}

/**
 * Gera o SVG do mapa estelar como string pura.
 * Sem animações, sem dependências externas — seguro para e-mail.
 */
export function buildStarMapSvg(opts: StarMapOptions = {}): string {
  const { size = 320, dateLabel = '', locationLabel = '' } = opts
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 8   // raio principal
  const rInner = r - 5      // raio da borda interna tracejada

  // Escala relativa ao viewBox 320
  const s = size / 320

  // Grade de coordenadas: 4 círculos concêntricos
  const gridCircles = [38, 75, 113, 148].map(
    (gr) => `<circle cx="${cx}" cy="${cy}" r="${gr * s}" fill="none" stroke="rgba(80,130,220,0.10)" stroke-width="0.6"/>`
  ).join('\n    ')

  // Linhas radiais: 6 ângulos
  const gridLines = [0, 30, 60, 90, 120, 150].map((deg) => {
    const rad = (deg * Math.PI) / 180
    const x1 = cx + r * Math.sin(rad)
    const y1 = cy - r * Math.cos(rad)
    const x2 = cx - r * Math.sin(rad)
    const y2 = cy + r * Math.cos(rad)
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(80,130,220,0.08)" stroke-width="0.6"/>`
  }).join('\n    ')

  // Estrelas de fundo
  const bgStars = BG_STARS.map(
    ([bx, by, br, op]) =>
      `<circle cx="${(bx*s).toFixed(1)}" cy="${(by*s).toFixed(1)}" r="${(br*s).toFixed(2)}" fill="white" opacity="${op}"/>`
  ).join('\n    ')

  // Linhas de constelação
  const constLines = CONSTELLATION_LINES.map(
    ([x1, y1, x2, y2]) =>
      `<line x1="${(x1*s).toFixed(1)}" y1="${(y1*s).toFixed(1)}" x2="${(x2*s).toFixed(1)}" y2="${(y2*s).toFixed(1)}" stroke="rgba(140,180,255,0.30)" stroke-width="${(0.7*s).toFixed(2)}" stroke-linecap="round"/>`
  ).join('\n    ')

  // Halos de difração para estrelas brilhantes
  const halos = [
    { bx: 88, by: 198, br: 12 }, { bx: 118, by: 252, br: 10 }, { bx: 145, by: 108, br: 9 },
  ].map(
    ({ bx, by, br }) =>
      `<circle cx="${(bx*s).toFixed(1)}" cy="${(by*s).toFixed(1)}" r="${(br*s).toFixed(1)}" fill="url(#star-halo)" filter="url(#star-blur)" opacity="0.5"/>`
  ).join('\n    ')

  // Estrelas nomeadas
  const namedStars = NAMED_STARS.map(
    ([bx, by, br, color]) =>
      `<circle cx="${(bx*s).toFixed(1)}" cy="${(by*s).toFixed(1)}" r="${(br*s).toFixed(2)}" fill="${color}"/>`
  ).join('\n    ')

  // Ticks de grau na borda
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const rad = (i * 30 * Math.PI) / 180
    const x1 = cx + rInner * Math.sin(rad)
    const y1 = cy - rInner * Math.cos(rad)
    const x2 = cx + r * Math.sin(rad)
    const y2 = cy - r * Math.cos(rad)
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(100,140,230,0.5)" stroke-width="1"/>`
  }).join('\n  ')

  // Rótulo inferior (data + local)
  const footerLabel = [dateLabel, locationLabel].filter(Boolean).join(' · ')
  const footerSvg = footerLabel
    ? `<text x="${cx}" y="${size - 6}" font-size="${(6*s).toFixed(1)}" fill="rgba(140,180,255,0.45)" font-family="monospace" text-anchor="middle">${footerLabel}</text>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <clipPath id="sky-clip-email">
      <circle cx="${cx}" cy="${cy}" r="${r}"/>
    </clipPath>
    <radialGradient id="sky-bg-email" cx="50%" cy="48%" r="55%">
      <stop offset="0%"   stop-color="#0c1e3a"/>
      <stop offset="60%"  stop-color="#070e1f"/>
      <stop offset="100%" stop-color="#04090f"/>
    </radialGradient>
    <radialGradient id="center-glow-email" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="rgba(80,120,220,0.12)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <radialGradient id="star-halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="rgba(200,232,255,0.6)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <filter id="star-blur">
      <feGaussianBlur stdDeviation="1.5"/>
    </filter>
  </defs>

  <!-- Fundo -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sky-bg-email)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#center-glow-email)"/>

  <g clip-path="url(#sky-clip-email)">
    <!-- Grade equatorial -->
    ${gridCircles}
    ${gridLines}

    <!-- Via Láctea -->
    <ellipse cx="${(148*s).toFixed(1)}" cy="${cy}" rx="${(28*s).toFixed(1)}" ry="${(145*s).toFixed(1)}"
      fill="rgba(180,200,255,0.025)" transform="rotate(-25 ${cx} ${cy})"/>

    <!-- Estrelas de fundo -->
    ${bgStars}

    <!-- Linhas de constelação -->
    ${constLines}

    <!-- Halos -->
    ${halos}

    <!-- Estrelas nomeadas -->
    ${namedStars}

    <!-- Labels -->
    <text x="${(95*s).toFixed(1)}"  y="${(195*s).toFixed(1)}" font-size="${(5*s).toFixed(1)}" fill="rgba(180,210,255,0.7)" font-family="monospace">Sirius</text>
    <text x="${(122*s).toFixed(1)}" y="${(250*s).toFixed(1)}" font-size="${(5*s).toFixed(1)}" fill="rgba(180,210,255,0.7)" font-family="monospace">Canopus</text>
    <text x="${(152*s).toFixed(1)}" y="${(106*s).toFixed(1)}" font-size="${(5*s).toFixed(1)}" fill="rgba(255,200,140,0.8)" font-family="monospace">Betelgeuse</text>
    <text x="${(194*s).toFixed(1)}" y="${(172*s).toFixed(1)}" font-size="${(5*s).toFixed(1)}" fill="rgba(200,232,255,0.8)" font-family="monospace">Rigel</text>
    <text x="${cx}" y="${(160*s).toFixed(1)}" font-size="${(7*s).toFixed(1)}" fill="rgba(140,170,255,0.20)"
      font-family="monospace" text-anchor="middle" letter-spacing="3">ORION</text>
  </g>

  <!-- Borda -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(100,140,230,0.35)" stroke-width="1.2"/>
  <circle cx="${cx}" cy="${cy}" r="${rInner}" fill="none" stroke="rgba(100,140,230,0.12)" stroke-width="0.6" stroke-dasharray="2 4"/>

  <!-- Ticks e direções -->
  ${ticks}
  <text x="${cx}"         y="${(14*s).toFixed(1)}" font-size="${(8*s).toFixed(1)}" fill="rgba(140,180,255,0.8)" font-family="monospace" text-anchor="middle">N</text>
  <text x="${cx}"         y="${(size-4).toFixed(1)}" font-size="${(8*s).toFixed(1)}" fill="rgba(140,180,255,0.8)" font-family="monospace" text-anchor="middle">S</text>
  <text x="${(10*s).toFixed(1)}"  y="${(163*s).toFixed(1)}" font-size="${(8*s).toFixed(1)}" fill="rgba(140,180,255,0.8)" font-family="monospace" text-anchor="middle">L</text>
  <text x="${(312*s).toFixed(1)}" y="${(163*s).toFixed(1)}" font-size="${(8*s).toFixed(1)}" fill="rgba(140,180,255,0.8)" font-family="monospace" text-anchor="middle">O</text>

  ${footerSvg}
</svg>`
}

/**
 * Retorna o SVG como string Base64 — pronto para usar em `<img src="...">` no e-mail.
 *
 * Exemplo:
 *   `<img src="${starMapToBase64(buildStarMapSvg({ dateLabel: '14.02.2020', locationLabel: 'Florianópolis' }))}" width="300" height="300" />`
 */
export function starMapToBase64(svgString: string): string {
  const b64 = Buffer.from(svgString).toString('base64')
  return `data:image/svg+xml;base64,${b64}`
}
