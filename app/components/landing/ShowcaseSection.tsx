// ── Dados do mapa estelar ─────────────────────────────────────────────────────
// Simulação fiel do estilo "navy" da AstronomyAPI
// Céu de Florianópolis, SC · 14 de Fevereiro de 2020 · 23h00
// ViewBox 320×320, centro (160,160), raio máximo 148

// Estrelas de fundo [cx, cy, r, opacidade]
const BG_STARS: [number, number, number, number][] = [
  // Quadrante superior
  [140,25,0.8,0.6],[165,22,1.0,0.7],[185,28,0.7,0.5],
  [90,45,0.9,0.6],[115,40,0.7,0.5],[172,35,1.1,0.7],[198,42,0.8,0.6],[225,50,0.7,0.5],
  [65,65,1.0,0.6],[92,58,0.8,0.5],[122,55,0.9,0.7],[182,58,0.7,0.5],[212,65,1.0,0.6],[248,72,0.8,0.5],
  [45,88,0.8,0.5],[75,80,1.1,0.7],[108,75,0.7,0.5],[142,72,0.9,0.6],[210,80,0.8,0.6],[248,88,0.7,0.5],
  [35,110,0.9,0.5],[65,102,0.8,0.6],[98,95,1.0,0.7],[132,92,0.7,0.5],[232,102,0.9,0.6],[268,110,0.8,0.5],
  [28,132,0.7,0.5],[58,125,1.0,0.6],[92,118,0.8,0.7],[268,132,0.9,0.5],[292,140,0.7,0.5],
  // Equador
  [22,160,0.8,0.5],[52,155,0.7,0.6],[88,150,1.0,0.6],[235,152,0.8,0.6],[270,158,0.7,0.5],
  // Quadrante inferior
  [28,188,0.9,0.5],[58,195,0.7,0.6],[92,202,1.0,0.6],[232,195,0.8,0.5],[265,188,0.7,0.5],
  [35,215,0.8,0.5],[68,222,1.1,0.7],[102,228,0.7,0.5],[205,222,0.9,0.6],[242,215,0.8,0.5],
  [65,240,0.9,0.5],[95,248,0.8,0.6],[228,242,0.7,0.5],[252,230,1.0,0.6],
  [88,262,0.8,0.5],[118,268,0.7,0.6],[212,260,0.9,0.5],
  [108,278,0.7,0.5],[168,280,0.8,0.5],[198,275,0.7,0.5],
  // Preenchimento geral
  [152,110,0.7,0.5],[218,118,0.9,0.6],[242,142,0.8,0.5],
  [48,168,0.7,0.5],[278,172,0.8,0.5],[258,205,0.9,0.6],
  [138,230,0.7,0.5],[172,228,0.8,0.5],[175,258,0.7,0.5],
  [112,138,0.9,0.6],[115,172,0.7,0.5],[220,172,0.8,0.6],
  [78,138,0.8,0.5],[245,162,0.7,0.5],[58,148,0.9,0.6],
]

// Estrelas nomeadas {cx, cy, r, color, label?}
const NAMED_STARS = [
  // Orion
  { cx:145, cy:108, r:3.0, color:'#ffcc88', label:'Betelgeuse' },
  { cx:188, cy:172, r:2.8, color:'#c8e8ff', label:'Rigel' },
  { cx:178, cy:100, r:1.9, color:'#ffffff' },
  { cx:148, cy:175, r:1.9, color:'#ffffff' },
  // Orion belt (Mintaka, Alnilam, Alnitak)
  { cx:155, cy:142, r:1.7, color:'#e0e8ff' },
  { cx:168, cy:145, r:1.7, color:'#e0e8ff' },
  { cx:181, cy:148, r:1.7, color:'#e0e8ff' },
  // Canis Major
  { cx:88,  cy:198, r:3.8, color:'#c8e8ff', label:'Sirius' },
  { cx:68,  cy:228, r:1.7, color:'#d0e8ff' },
  { cx:58,  cy:212, r:1.5, color:'#d0e8ff' },
  // Canopus (very bright, southern sky)
  { cx:118, cy:252, r:3.2, color:'#d8f0ff', label:'Canopus' },
  // Procyon
  { cx:230, cy:138, r:2.2, color:'#f0f0ff', label:'Procyon' },
  // Gemini
  { cx:95,  cy:78,  r:1.9, color:'#fff0d0' },
  { cx:108, cy:90,  r:2.0, color:'#fff0d0' },
  // Taurus
  { cx:75,  cy:112, r:2.3, color:'#ffaa66', label:'Aldebaran' },
  { cx:102, cy:78,  r:1.8, color:'#ffffff' },
  // Auriga
  { cx:128, cy:62,  r:2.2, color:'#ffe88a', label:'Capella' },
  // Lepus
  { cx:155, cy:200, r:1.8, color:'#ffffff' },
  { cx:140, cy:212, r:1.5, color:'#ffffff' },
  { cx:165, cy:218, r:1.3, color:'#ffffff' },
  // Pleiades cluster
  { cx:55,  cy:72,  r:1.2, color:'#c8d8ff' },
  { cx:62,  cy:65,  r:1.0, color:'#c8d8ff' },
  { cx:68,  cy:75,  r:1.3, color:'#c8d8ff' },
  { cx:50,  cy:80,  r:1.0, color:'#c8d8ff' },
  { cx:72,  cy:82,  r:1.1, color:'#c8d8ff' },
  { cx:60,  cy:88,  r:1.0, color:'#c8d8ff' },
  // Achernar (southern)
  { cx:65,  cy:270, r:2.5, color:'#c8e8ff' },
  // Eridanus
  { cx:200, cy:145, r:1.5, color:'#ffffff' },
  { cx:215, cy:158, r:1.4, color:'#ffffff' },
]

// Linhas de constelação [x1,y1,x2,y2]
const CONSTELLATION_LINES: [number,number,number,number][] = [
  // Orion: cintura (belt)
  [155,142, 168,145], [168,145, 181,148],
  // Orion: ombros → cintura
  [145,108, 155,142], [178,100, 155,142],
  // Orion: ombro-ombro (horizontal)
  [145,108, 178,100],
  // Orion: cintura → pés
  [181,148, 188,172], [155,142, 148,175],
  // Canis Major
  [88,198, 68,228], [88,198, 58,212],
  // Gemini
  [95,78, 108,90],
  // Taurus
  [75,112, 102,78], [75,112, 55,72],
  // Auriga partial
  [128,62, 102,78],
  // Lepus
  [155,200, 140,212], [140,212, 165,218],
]

// ── Componente ────────────────────────────────────────────────────────────────

export default function ShowcaseSection() {
  return (
    <section className="relative py-24 md:py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(124,58,237,0.06)_0%,transparent_70%)]" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-14">
          <p className="text-violet-400 text-xs tracking-[4px] uppercase font-sans font-light mb-4">
            ✦ &nbsp; Prévia &nbsp; ✦
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-star">
            Uma memória que dura para sempre
          </h2>
          <p className="text-stardust text-sm font-sans mt-3">
            Veja exatamente o que o casal recebe após o pagamento
          </p>
        </div>

        {/* Card principal */}
        <div className="bg-space-800/90 backdrop-blur-sm border border-violet-500/20 rounded-3xl p-6 md:p-10 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12">

            {/* ── Coluna esquerda: visuais ── */}
            <div className="flex flex-col items-center gap-6 flex-shrink-0">

              {/* Mapa estelar — estilo AstronomyAPI "navy" */}
              <div className="relative">
                {/* Brilho externo */}
                <div className="absolute inset-0 rounded-full bg-violet-600/15 blur-2xl scale-110 animate-pulse-glow" />

                <svg
                  viewBox="0 0 320 320"
                  width="288"
                  height="288"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-[0_0_24px_rgba(100,140,255,0.25)]"
                  aria-label="Mapa estelar de Florianópolis · 14 Fev 2020"
                >
                  <defs>
                    <clipPath id="sky-clip">
                      <circle cx="160" cy="160" r="148" />
                    </clipPath>
                    <radialGradient id="sky-bg" cx="50%" cy="48%" r="55%">
                      <stop offset="0%"   stopColor="#0c1e3a" />
                      <stop offset="60%"  stopColor="#070e1f" />
                      <stop offset="100%" stopColor="#04090f" />
                    </radialGradient>
                    <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%"   stopColor="rgba(80,120,220,0.12)" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    {/* Halo de estrela brilhante */}
                    <radialGradient id="star-halo" cx="50%" cy="50%" r="50%">
                      <stop offset="0%"   stopColor="rgba(200,232,255,0.6)" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    <filter id="star-blur">
                      <feGaussianBlur stdDeviation="1.5" />
                    </filter>
                  </defs>

                  {/* Fundo do céu */}
                  <circle cx="160" cy="160" r="148" fill="url(#sky-bg)" />
                  <circle cx="160" cy="160" r="148" fill="url(#center-glow)" />

                  <g clipPath="url(#sky-clip)">
                    {/* Grade de coordenadas equatoriais */}
                    {[38,75,113,148].map((r) => (
                      <circle key={r} cx="160" cy="160" r={r}
                        fill="none" stroke="rgba(80,130,220,0.10)" strokeWidth="0.6" />
                    ))}
                    {[0,30,60,90,120,150].map((deg) => {
                      const rad = (deg * Math.PI) / 180
                      return (
                        <line key={deg}
                          x1={160 + 148 * Math.sin(rad)}  y1={160 - 148 * Math.cos(rad)}
                          x2={160 - 148 * Math.sin(rad)}  y2={160 + 148 * Math.cos(rad)}
                          stroke="rgba(80,130,220,0.08)" strokeWidth="0.6"
                        />
                      )
                    })}

                    {/* Via Láctea — banda difusa diagonal */}
                    <ellipse cx="148" cy="160" rx="28" ry="145"
                      fill="rgba(180,200,255,0.025)"
                      transform="rotate(-25 160 160)"
                    />

                    {/* Estrelas de fundo — estáticas, sem animação */}
                    {BG_STARS.map(([cx,cy,r,op],i) => (
                      <circle key={`bg-${i}`} cx={cx} cy={cy} r={r}
                        fill="white" opacity={op}
                      />
                    ))}

                    {/* Linhas de constelação */}
                    {CONSTELLATION_LINES.map(([x1,y1,x2,y2],i) => (
                      <line key={`cl-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="rgba(140,180,255,0.30)" strokeWidth="0.7"
                        strokeLinecap="round"
                      />
                    ))}

                    {/* Halos de estrelas brilhantes (Sirius, Canopus, Betelgeuse) */}
                    {[
                      {cx:88,cy:198,r:12},{cx:118,cy:252,r:10},{cx:145,cy:108,r:9}
                    ].map((s,i)=>(
                      <circle key={`halo-${i}`} cx={s.cx} cy={s.cy} r={s.r}
                        fill="url(#star-halo)" filter="url(#star-blur)" opacity="0.5"
                      />
                    ))}

                    {/* Estrelas nomeadas — estáticas, sem animação */}
                    {NAMED_STARS.map((s,i) => (
                      <circle key={`ns-${i}`} cx={s.cx} cy={s.cy} r={s.r}
                        fill={s.color}
                      />
                    ))}

                    {/* Labels das 4 estrelas mais brilhantes */}
                    <text x="95"  y="195" fontSize="5" fill="rgba(180,210,255,0.7)" fontFamily="monospace">Sirius</text>
                    <text x="122" y="250" fontSize="5" fill="rgba(180,210,255,0.7)" fontFamily="monospace">Canopus</text>
                    <text x="152" y="106" fontSize="5" fill="rgba(255,200,140,0.8)" fontFamily="monospace">Betelgeuse</text>
                    <text x="194" y="172" fontSize="5" fill="rgba(200,232,255,0.8)" fontFamily="monospace">Rigel</text>

                    {/* Label da constelação */}
                    <text x="148" y="160" fontSize="7" fill="rgba(140,170,255,0.20)"
                      fontFamily="monospace" textAnchor="middle" letterSpacing="3">ORION</text>
                  </g>

                  {/* Borda e marcadores de direção */}
                  <circle cx="160" cy="160" r="148" fill="none"
                    stroke="rgba(100,140,230,0.35)" strokeWidth="1.2" />
                  <circle cx="160" cy="160" r="143" fill="none"
                    stroke="rgba(100,140,230,0.12)" strokeWidth="0.6" strokeDasharray="2 4" />

                  {/* Ticks de grau */}
                  {Array.from({length:12},(_,i)=>{
                    const rad=(i*30*Math.PI)/180
                    return (
                      <line key={i}
                        x1={160+143*Math.sin(rad)} y1={160-143*Math.cos(rad)}
                        x2={160+148*Math.sin(rad)} y2={160-148*Math.cos(rad)}
                        stroke="rgba(100,140,230,0.5)" strokeWidth="1"
                      />
                    )
                  })}

                  {/* N S L O */}
                  <text x="160" y="14" fontSize="8" fill="rgba(140,180,255,0.8)" fontFamily="monospace" textAnchor="middle">N</text>
                  <text x="160" y="313" fontSize="8" fill="rgba(140,180,255,0.8)" fontFamily="monospace" textAnchor="middle">S</text>
                  <text x="10"  y="163" fontSize="8" fill="rgba(140,180,255,0.8)" fontFamily="monospace" textAnchor="middle">L</text>
                  <text x="312" y="163" fontSize="8" fill="rgba(140,180,255,0.8)" fontFamily="monospace" textAnchor="middle">O</text>

                  {/* Rótulo da data */}
                  <text x="160" y="302" fontSize="6" fill="rgba(140,180,255,0.45)"
                    fontFamily="monospace" textAnchor="middle">
                    14.02.2020 · Florianópolis · 23h00
                  </text>
                </svg>
              </div>

              {/* Foto do casal — moldura polaroid */}
              <div
                className="relative"
                style={{ transform: 'rotate(-2deg)', transformOrigin: 'center' }}
              >
                {/* Sombra da polaroid */}
                <div className="absolute inset-0 translate-x-1 translate-y-1 bg-black/40 blur-sm rounded-sm" />

                {/* Moldura polaroid */}
                <div className="relative bg-white rounded-sm"
                  style={{ padding: '8px 8px 28px 8px', width: '180px' }}>

                  {/* Área da foto */}
                  <div className="w-full aspect-square bg-gradient-to-br from-violet-900 to-space-800 flex flex-col items-center justify-center gap-2 overflow-hidden rounded-[1px]">
                    {/* Placeholder: ícone e iniciais */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400/40 to-violet-700/40 border-2 border-violet-400/30 flex items-center justify-center">
                      <span className="text-2xl">👫</span>
                    </div>
                    <p className="text-violet-300/60 text-[10px] font-sans text-center leading-tight">
                      Sua foto aparece<br />aqui
                    </p>
                  </div>

                  {/* Legenda da polaroid */}
                  <p className="mt-0 text-center text-[9px] text-gray-500 font-sans pt-2 leading-tight">
                    Ana &amp; Rafael · Fev 2020
                  </p>
                </div>
              </div>
            </div>

            {/* ── Coluna direita: informações ── */}
            <div className="flex-1 min-w-0">

              {/* Nomes + contador */}
              <h3 className="font-display text-3xl md:text-4xl text-star mb-1">
                Ana <span className="text-violet-400">&amp;</span> Rafael
              </h3>
              <p className="text-stardust text-sm font-sans mb-6">
                💕 Juntos há{' '}
                <span className="text-violet-400 font-semibold">4 anos, 2 meses e 14 dias</span>
                <span className="text-nebula text-xs ml-1">(contador ao vivo)</span>
              </p>

              <div className="h-px bg-violet-500/15 mb-5" />

              {/* Data + Local */}
              <div className="space-y-3 mb-5">
                <div className="flex items-start gap-3 text-sm font-sans">
                  <span className="text-base mt-0.5">📅</span>
                  <div>
                    <span className="text-nebula text-[10px] uppercase tracking-wider">Data especial</span>
                    <p className="text-star font-medium">14 de Fevereiro de 2020</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm font-sans">
                  <span className="text-base mt-0.5">📍</span>
                  <div>
                    <span className="text-nebula text-[10px] uppercase tracking-wider">Local</span>
                    <p className="text-star font-medium">Florianópolis, SC</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-violet-500/15 mb-5" />

              {/* Fase da Lua */}
              <div className="bg-space-700/50 border border-violet-500/15 rounded-2xl p-4 mb-5">
                <p className="text-nebula text-[10px] uppercase tracking-wider font-sans mb-3">
                  🌙 Fase da Lua naquela noite
                </p>
                <div className="flex items-center gap-4">
                  {/* SVG da Lua Quase Cheia (Minguante Gibosa, ~83%) */}
                  <svg viewBox="0 0 44 44" width="44" height="44" xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0 drop-shadow-[0_0_8px_rgba(245,215,142,0.5)]">
                    <defs>
                      <clipPath id="luna-clip"><circle cx="22" cy="22" r="18"/></clipPath>
                      <radialGradient id="luna-grad" cx="42%" cy="38%" r="60%">
                        <stop offset="0%"  stopColor="#fef9c3"/>
                        <stop offset="60%" stopColor="#f5d78e"/>
                        <stop offset="100%" stopColor="#d4a84b"/>
                      </radialGradient>
                    </defs>
                    {/* Brilho externo */}
                    <circle cx="22" cy="22" r="20" fill="rgba(245,215,142,0.10)"/>
                    {/* Disco da lua */}
                    <circle cx="22" cy="22" r="18" fill="url(#luna-grad)"/>
                    {/* Sombra minguante — elipse fina à direita (17% de sombra = gibbosa) */}
                    <ellipse cx="30" cy="22" rx="9" ry="18"
                      fill="#060e1c" clipPath="url(#luna-clip)"/>
                    {/* Crateras sutis */}
                    <circle cx="14" cy="18" r="2" fill="rgba(0,0,0,0.07)"/>
                    <circle cx="18" cy="26" r="1.5" fill="rgba(0,0,0,0.06)"/>
                    <circle cx="10" cy="26" r="1" fill="rgba(0,0,0,0.05)"/>
                  </svg>

                  <div>
                    <p className="text-star text-sm font-sans font-semibold">Lua Minguante Gibosa</p>
                    <p className="text-stardust text-xs font-sans">83% iluminada</p>
                    <p className="text-violet-400/80 text-xs font-sans italic mt-0.5">
                      "Sob a luz de uma lua quase cheia"
                    </p>
                  </div>
                </div>
              </div>

              {/* Player de música */}
              <div className="bg-space-700/50 border border-violet-500/15 rounded-2xl p-4 mb-5">
                <p className="text-nebula text-[10px] uppercase tracking-wider font-sans mb-3">🎵 Música de fundo</p>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1DB954] to-[#0d9140] flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-lg">♪</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-star text-sm font-sans font-semibold truncate">Perfect</p>
                    <p className="text-stardust text-xs font-sans truncate">Ed Sheeran</p>
                    <div className="mt-1.5 h-1 bg-space-600 rounded-full overflow-hidden">
                      <div className="h-full w-2/5 bg-gradient-to-r from-[#1DB954] to-[#5ae87a] rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-stardust flex-shrink-0">
                    <span className="text-xs cursor-pointer hover:text-star transition-colors select-none">⏮</span>
                    <div className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                      <span className="text-[10px] text-star pl-0.5">▶</span>
                    </div>
                    <span className="text-xs cursor-pointer hover:text-star transition-colors select-none">⏭</span>
                  </div>
                </div>
              </div>

              {/* Mensagem personalizada */}
              <div className="relative">
                <div className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500/60 to-transparent rounded-full" />
                <p className="pl-4 text-stardust text-sm font-sans italic leading-relaxed">
                  "Naquela noite, em Florianópolis, as estrelas foram testemunhas do começo
                  da nossa história. Cada ponto de luz no céu guardou esse momento para sempre..."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Label de simulação */}
        <p className="text-center text-nebula text-xs font-sans mt-5 tracking-wider">
          ✦ Simulação — seu mapa estelar será gerado com os dados reais da sua data e local ✦
        </p>
      </div>
    </section>
  )
}
