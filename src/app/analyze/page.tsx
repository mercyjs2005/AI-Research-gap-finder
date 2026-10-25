import type { Metadata } from "next";
import AnalyzeExperience from "@/components/AnalyzeExperience";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Analyze Research Papers · AI Research Gap Finder",
};

export default function AnalyzePage() {
  return (
    <PageShell>
      <Navbar />
      <main>
        <AnalyzeExperience />
      </main>
      <Footer />
    </PageShell>
  );
}
