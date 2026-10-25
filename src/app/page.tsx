import FeaturesSection from "@/components/FeaturesSection";
import Hero from "@/components/Hero";
import HowItWorksSection from "@/components/HowItWorksSection";
import Navbar from "@/components/Navbar";
import PageShell from "@/components/PageShell";
import WorkflowSection from "@/components/WorkflowSection";

export default function HomePage() {
  return (
    <PageShell>
      <Navbar />
      <main>
        <Hero />
        <WorkflowSection />
        <FeaturesSection />
        <HowItWorksSection />
      </main>
    </PageShell>
  );
}
