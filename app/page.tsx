import HeroSection from './components/landing/HeroSection'
import ShowcaseSection from './components/landing/ShowcaseSection'
import HowItWorksSection from './components/landing/HowItWorksSection'
import BenefitsSection from './components/landing/BenefitsSection'

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ShowcaseSection />
      <HowItWorksSection />
      <BenefitsSection />
    </main>
  )
}
