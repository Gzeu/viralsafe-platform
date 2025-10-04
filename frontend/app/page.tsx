import { HeroSection } from '@/components/home/HeroSection'
import { FeaturesSection } from '@/components/home/FeaturesSection'
import { StatsSection } from '@/components/home/StatsSection'
import { TokenomicsSection } from '@/components/home/TokenomicsSection'
import { RoadmapSection } from '@/components/home/RoadmapSection'
import { CTASection } from '@/components/home/CTASection'

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* Statistics */}
      <StatsSection />
      
      {/* Tokenomics */}
      <TokenomicsSection />
      
      {/* Roadmap */}
      <RoadmapSection />
      
      {/* Call to Action */}
      <CTASection />
    </>
  )
}