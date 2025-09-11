import { useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import AIAndCommunity from "@/components/AIAndCommunity";
import PersonaGrid from "@/components/PersonaGrid";
import FeatureSection from "@/components/FeatureSection";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Scroll-triggered animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-slide-up");
            entry.target.classList.remove("opacity-0", "translate-y-10");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    // Observe elements for scroll animations
    const animatedElements = document.querySelectorAll("[data-animate]");
    animatedElements.forEach((el) => {
      el.classList.add("opacity-0", "translate-y-10", "transition-all", "duration-700");
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen pt-16 overflow-x-hidden">
      <Navigation />
      <Hero />
      <div data-animate>
        <AIAndCommunity />
      </div>
      <div data-animate>
        <PersonaGrid />
      </div>
      <div data-animate>
        <FeatureSection />
      </div>
      <div data-animate>
        <HowItWorks />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
