const STEPS = [
  {
    number: '01',
    icon: '📅',
    title: 'Escolha a data e o local',
    description:
      'Escreva a data e a cidade do seu momento mais marcante. Nós calculamos a posição exata das estrelas e constelações que testemunharam o amor de vocês.',
  },
  {
    number: '02',
    icon: '💌',
    title: 'Personalize com amor',
    description:
      'Escreva a cartinha de vocês, suba uma foto juntos e adicione a música que embala a história de vocês.',
  },
  {
    number: '03',
    icon: '✨',
    title: 'Receba e eternize',
    description:
      'Confirme o pagamento e receba no e-mail a página especial e o QR Code — pronto para imprimir e emoldurar.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="como-funciona" className="relative py-24 md:py-32 px-6">
      {/* Gradiente de fundo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(12,12,40,0.8)_0%,transparent_80%)]" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-16 md:mb-20">
          <p className="text-violet-400 text-xs tracking-[4px] uppercase font-sans font-light mb-4">
            ✦ &nbsp; Simples assim &nbsp; ✦
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-star">
            Como funciona?
          </h2>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {/* Linha conectora (desktop) */}
          <div className="hidden md:block absolute top-14 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

          {STEPS.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              {/* Número + ícone */}
              <div className="relative mb-6">
                {/* Brilho de fundo */}
                <div className="absolute inset-0 rounded-full bg-violet-600/20 blur-xl scale-150" />

                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-space-700 to-space-800 border border-violet-500/25 flex flex-col items-center justify-center shadow-xl">
                  <span className="text-3xl mb-0.5">{step.icon}</span>
                  <span className="text-violet-400/60 text-[10px] font-sans tracking-widest font-light">
                    {step.number}
                  </span>
                </div>

                {/* Seta conectora mobile */}
                {i < STEPS.length - 1 && (
                  <div className="md:hidden absolute -bottom-10 left-1/2 -translate-x-1/2 text-violet-500/30 text-2xl">
                    ↓
                  </div>
                )}
              </div>

              <h3 className="font-display text-2xl text-star mb-3">
                {step.title}
              </h3>
              <p className="text-stardust text-sm font-sans leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
