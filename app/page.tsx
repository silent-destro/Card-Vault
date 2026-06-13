import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import HowItWorks from "@/components/HowItWorks";
import FeaturesSection from "@/components/FeaturesSection";
import ThemesShowcase from "@/components/ThemesShowcase";
import AIReviewDemo from "@/components/AIReviewDemo";
import Testimonials from "@/components/Testimonials";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const hostname = host.split(":")[0];

  const isDefaultDomain = [
    "localhost",
    "127.0.0.1",
    "cardvault.in",
    "www.cardvault.in",
    "card-vault-digital-business-card.vercel.app",
  ].includes(hostname) || hostname.endsWith(".vercel.app");

  if (!isDefaultDomain) {
    try {
      const card = await prisma.card.findUnique({
        where: { customDomain: hostname }
      });
      if (card) {
        redirect(`/card/${card.slug}`);
      }
    } catch (e) {
      console.error("Custom domain routing lookup failed:", e);
    }
  }

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <HowItWorks />
        <FeaturesSection />
        <ThemesShowcase />
        <AIReviewDemo />
        {/* <Testimonials /> */}
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />

      {/* Floating WhatsApp Inquiry Button */}
      <a
        href="https://wa.me/919925531531?text=Hello%20CardVault%20Team!%20I'm%20interested%20in%20creating%20a%20digital%20business%20card%20for%20my%20business.%20I%20would%20like%20to%20get%20more%20information%20about%20your%20premium%20features%20and%20plans.%20Thank%20you!"
        target="_blank"
        className="floating-wa-btn"
        title="WhatsApp Inquiry"
      >
        <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.398 0 9.786-4.386 9.788-9.785 0-2.613-1.01-5.068-2.845-6.905C16.377 2.078 13.927 1.07 11.998 1.07c-5.396 0-9.783 4.388-9.786 9.787-.001 1.514.417 2.991 1.21 4.301L2.395 19.82l4.252-1.116-.001.001zm13.79-5.49c-.293-.146-1.73-.854-1.997-.951-.268-.099-.463-.147-.659.146-.195.293-.756.951-.927 1.146-.17.195-.341.219-.634.073-1.8-.788-2.922-1.96-3.774-3.418-.22-.375.22-.348.63-.1.368.223.414.293.61.683.195.39.098.732-.049.976-.146.244-.659.878-.805 1.049-.195.219-.439.146-.732-.049-1.39-.683-2.316-1.854-2.805-2.731-.244-.439.122-.732.414-.976.244-.22.341-.341.488-.585.146-.244.073-.488-.049-.732-.122-.244-.659-1.73-.878-2.268-.219-.537-.463-.463-.659-.463-.17 0-.366-.024-.561-.024-.195 0-.512.073-.78.366-.268.293-1.024 1.001-1.024 2.44 0 1.439 1.049 2.829 1.195 3.024.146.195 2.06 3.14 4.992 4.414.698.304 1.243.485 1.668.62.702.223 1.341.191 1.846.115.563-.085 1.73-.707 1.974-1.39.244-.683.244-1.268.17-1.39-.073-.122-.268-.195-.561-.341z" />
        </svg>
      </a>
    </>
  );
}
