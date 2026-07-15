import Link from 'next/link'

const BENEFITS = [
  {
    icon: '🖼️',
    title: 'Perfeito para emoldurar',
    description:
      'O e-mail chega com o QR Code em alta resolução. Imprima, emoldure e presenteie com um quadro único que conta a história de vocês.',
    highlight: 'Faça um quadro de parede',
  },
  {
    icon: '🌐',
    title: 'Acesso instantâneo',
    description:
      'Escaneie com a câmera do celular e a página abre na hora — sem aplicativo, sem cadastro. Compartilhe com amigos e família.',
    highlight: 'Funciona em qualquer celular',
  },
  {
    icon: '💜',
    title: 'Memória guardada por 1 ano',
    description:
      'A página fica no ar com muito carinho por 12 meses completos. Renove quando quiser e mantenha o presente vivo para sempre.',
    highlight: 'Renovável com facilidade',
  },
]

export default function BenefitsSection({ precoFormatado }: { precoFormatado: string }) {
  return (
    <>
      {/* ── Seção de Benefícios ── */}
      <section className="relative py-24 md:py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-space-800/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(124,58,237,0.08)_0%,transparent_70%)]" />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Cabeçalho */}
          <div className="text-center mb-16">
            <p className="text-violet-400 text-xs tracking-[4px] uppercase font-sans font-light mb-4">
              ✦ &nbsp; Por que presentear assim &nbsp; ✦
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-star">
              Um presente que eles nunca vão esquecer
            </h2>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="group relative bg-space-800 border border-violet-500/15 hover:border-violet-500/40 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Brilho no hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600/0 to-violet-600/0 group-hover:from-violet-600/5 group-hover:to-transparent transition-all duration-300" />

                <div className="relative">
                  <div className="w-14 h-14 bg-space-700 border border-violet-500/20 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-inner">
                    {b.icon}
                  </div>

                  <h3 className="font-display text-2xl text-star mb-3">{b.title}</h3>

                  <p className="text-stardust text-sm font-sans leading-relaxed mb-5">
                    {b.description}
                  </p>

                  <span className="inline-flex items-center gap-1.5 text-violet-400 text-xs font-sans font-semibold uppercase tracking-wider">
                    <span className="w-4 h-px bg-violet-400" />
                    {b.highlight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="relative py-28 md:py-36 px-6 overflow-hidden">
        {/* Fundo com gradiente profundo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(124,58,237,0.2)_0%,rgba(7,7,26,0)_70%)] bg-space-900" />

        {/* Estrelas decorativas */}
        <div className="absolute top-12 left-1/4 w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse-glow" />
        <div className="absolute top-20 right-1/3 w-1 h-1 bg-white rounded-full animate-twinkle" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-16 left-1/3 w-1 h-1 bg-violet-400 rounded-full animate-twinkle" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-24 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse-glow" style={{ animationDelay: '0.5s' }} />

        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <p className="text-violet-400 text-xs tracking-[4px] uppercase font-sans font-light mb-6">
            ✦ &nbsp; Comece agora &nbsp; ✦
          </p>

          <h2 className="font-display text-4xl md:text-6xl text-star leading-tight mb-6">
            Prontos para eternizar<br />
            <span className="text-gradient italic">esse momento?</span>
          </h2>

          <p className="text-stardust font-sans text-base leading-relaxed mb-10">
            Em poucos minutos, o céu da noite mais especial de vocês <br className="hidden md:block" />
            estará guardado para sempre. ✨
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/criar"
              className="btn-glow inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-sans font-semibold text-lg px-10 py-5 rounded-full transition-all duration-300 shadow-xl"
            >
              ✨ Criar Nosso Céu
            </Link>
          </div>

          <p className="mt-6 text-nebula text-xs font-sans">
            {precoFormatado} · Pagamento único · Acesso por 12 meses
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-violet-500/10 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-display text-xl text-stardust italic">Céu Daquele Dia</p>
          <p className="text-nebula text-xs font-sans text-center">
            © {new Date().getFullYear()} Céu Daquele Dia · Feito com 💜 para eternizar memórias
          </p>
          <p className="text-nebula text-xs font-sans">{precoFormatado} / ano</p>
        </div>
      </footer>
    </>
  )
}
