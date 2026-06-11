import Header from "@/components/Header";
import ToolsHero from "@/components/ToolsHero";
import TokenForm from "@/components/TokenForm";
import TokenList from "@/components/TokenList";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Header />
      <ToolsHero />
      <TokenForm />
      <TokenList />
      <FAQ />
      <Footer />
    </main>
  );
}
