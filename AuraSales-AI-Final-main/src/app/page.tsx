import { StickyNav } from "@/components/home/StickyNav";
import Hero from "@/components/home/Hero";
import { SocialProof } from "@/components/home/SocialProof";
import TrustMarquee from "@/components/home/TrustMarquee";
import EnterpriseFeatures from "@/components/home/EnterpriseFeatures";
import Pricing from "@/components/home/Pricing";
import UnifiedFAQAccordion from "@/components/home/UnifiedFAQAccordion";
import FinalCTA from "@/components/home/FinalCTA";
import HowItWorks from "@/components/home/HowItWorks";
import { TestimonialGrid } from "@/components/home/TestimonialGrid";
import { FeatureBoxGrid } from "@/components/home/FeatureBoxGrid";
import { HeroNew } from "@/components/home/HeroNew";

export default function Home() {  
  return (
    <main className="bg-slate-950">
      <StickyNav />
      <HeroNew />
      <EnterpriseFeatures />
      <FeatureBoxGrid />
      <HowItWorks />
      <SocialProof />
      <TrustMarquee />
      <TestimonialGrid />
      <Pricing />
      <UnifiedFAQAccordion />
      <FinalCTA />
    </main>
  );
}