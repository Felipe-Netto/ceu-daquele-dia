import Link from 'next/link'

// Estrelas pré-calculadas para o fundo do hero (x%, y%, raio, delay)
const HERO_STARS: [number, number, number, number][] = [
  [5, 8, 1.5, 0], [14, 4, 1, 0.8], [24, 12, 2, 1.5], [36, 6, 1.2, 0.3],
  [48, 10, 1.8, 2.1], [58, 5, 1, 0.6], [68, 14, 2.2, 1.2], [78, 8, 1.3, 1.8],
  [88, 4, 1.6, 0.4], [96, 11, 1, 2.5], [4, 28, 1.2, 1.1], [12, 22, 1.8, 0.7],
  [22, 32, 1, 2.0], [33, 25, 2.5, 0.2], [44, 30, 1.3, 1.6], [55, 20, 1, 0.9],
  [65, 35, 1.7, 2.3], [76, 28, 1.1, 0.5], [85, 22, 2, 1.4], [94, 32, 1.5, 1.9],
  [8, 48, 1.3, 0.3], [18, 42, 2, 1.7], [28, 55, 1.1, 0.8], [40, 45, 1.6, 2.4],
  [52, 52, 1, 0.1], [62, 44, 1.9, 1.3], [72, 58, 1.4, 2.0], [82, 48, 1.2, 0.6],
  [91, 54, 1.8, 1.1], [3, 65, 1, 2.2], [15, 68, 2.2, 0.4], [26, 72, 1.3, 1.8],
  [38, 62, 1.7, 0.9], [50, 70, 1, 2.6], [60, 65, 2, 0.3], [70, 75, 1.5, 1.5],
  [80, 68, 1.1, 2.1], [90, 72, 1.9, 0.7], [97, 65, 1.3, 1.2], [7, 82, 1.6, 0.5],
  [18, 88, 1, 2.3], [29, 80, 2, 1.0], [41, 85, 1.4, 0.2], [53, 90, 1.2, 1.7],
  [63, 82, 1.8, 2.4], [73, 88, 1, 0.8], [83, 84, 2.3, 1.3], [93, 80, 1.5, 0.4],
  [11, 95, 1, 1.9], [23, 92, 1.7, 0.6], [35, 97, 1.3, 2.1], [47, 93, 1.1, 1.4],
  [59, 96, 2, 0.3], [71, 94, 1.5, 1.8], [84, 92, 1.2, 0.9], [95, 96, 1.8, 2.5],
  [43, 38, 1, 0.7], [57, 78, 2.5, 1.6], [20, 58, 1.4, 2.2], [75, 42, 1, 0.1],
]

export default function HeroSection({ precoFormatado }: { precoFormatado: string }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Fundo gradiente espacial */}
      <div className="absolute inset-0 bg-space-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(124,58,237,0.18)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_20%_80%,rgba(167,139,250,0.08)_0%,transparent_60%)]" />
      </div>

      {/* Campo de estrelas */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {HERO_STARS.map(([x, y, r, delay], i) => (
          <circle
            key={i}
            cx={`${x}%`}
            cy={`${y}%`}
            r={r}
            fill="white"
            style={{
              animation: `twinkle ${2.5 + (i % 4) * 0.5}s ease-in-out ${delay}s infinite`,
            }}
          />
        ))}
      </svg>

      {/* Anel decorativo de fundo */}
      <div className="absolute w-[600px] h-[600px] rounded-full border border-violet-500/10 animate-spin-slow pointer-events-none" />
      <div className="absolute w-[900px] h-[900px] rounded-full border border-violet-500/5 animate-spin-slow pointer-events-none" style={{ animationDirection: 'reverse', animationDuration: '45s' }} />

      {/* Conteúdo */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Tagline */}
        <p
          className="text-violet-400 text-xs tracking-[5px] uppercase mb-8 font-sans font-light animate-fadein-up"
          style={{ animationDelay: '0.1s' }}
        >
          ✦ &nbsp; Céu Daquele Dia &nbsp; ✦
        </p>

        {/* Título principal */}
        <h1
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[82px] leading-[1.1] mb-6 animate-fadein-up"
          style={{ animationDelay: '0.25s' }}
        >
          <span className="text-star">Eternize o céu do dia</span>
          <br />
          <span className="text-gradient italic">em que o seu mundo mudou</span>
        </h1>

        {/* Subtítulo */}
        <p
          className="text-stardust text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto font-sans font-light animate-fadein-up"
          style={{ animationDelay: '0.45s' }}
        >
          O mapa estelar real da noite mais especial de vocês, com foto, música e QR Code
          para imprimir e guardar para sempre. Um presente único e eterno. 💜
        </p>

        {/* CTA */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadein-up"
          style={{ animationDelay: '0.65s' }}
        >
          <Link
            href="/criar"
            className="btn-glow inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-sans font-semibold text-base px-8 py-4 rounded-full transition-all duration-300 shadow-lg"
          >
            ✨ Criar Nosso Céu
          </Link>
          <a
            href="#como-funciona"
            className="text-stardust hover:text-violet-400 font-sans text-sm tracking-wide transition-colors duration-200 underline underline-offset-4"
          >
            Como funciona?
          </a>
        </div>

        {/* Preço sutil */}
        <p
          className="mt-6 text-nebula text-xs font-sans animate-fadein-up"
          style={{ animationDelay: '0.8s' }}
        >
          Assinatura anual · {precoFormatado} · Acesso por 1 ano completo
        </p>
      </div>

      {/* Indicador de scroll */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-5 h-8 rounded-full border border-violet-500/40 flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-violet-500/60 rounded-full animate-fadein-up" />
        </div>
      </div>
    </section>
  )
}
