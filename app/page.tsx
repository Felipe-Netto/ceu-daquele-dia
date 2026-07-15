import HeroSection from './components/landing/HeroSection'
import ShowcaseSection from './components/landing/ShowcaseSection'
import HowItWorksSection from './components/landing/HowItWorksSection'
import BenefitsSection from './components/landing/BenefitsSection'
import { getPreco, formatPreco } from './lib/preco'

export default async function Home() {
  const precoFormatado = formatPreco(await getPreco())
  return (
    <main>
      <HeroSection precoFormatado={precoFormatado} />
      <ShowcaseSection />
      <HowItWorksSection />
      <BenefitsSection precoFormatado={precoFormatado} />
    </main>
  )
}
