
import { useState, useEffect } from "react";

const words = ["loving.", "kind.", "supportive.", "understanding.", "caring.", "wise."];

const RollingText = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        setIsVisible(true);
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center mb-6">
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-deep-green/90 font-bold leading-[1.05] tracking-tight">
        Not Every Mom is{" "}
        <span className="inline-block w-28 md:w-36 lg:w-44">
          <span 
            className={`text-powder-blue font-bold transition-all duration-500 ${
              isVisible 
                ? "opacity-100 translate-y-0 scale-100" 
                : "opacity-0 translate-y-4 scale-95"
            }`}
            style={{
              background: 'linear-gradient(135deg, hsl(var(--powder-blue)), hsl(var(--muted-gold)))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
            aria-live="polite"
            aria-label={`Currently showing: ${words[currentWordIndex]}`}
          >
            {words[currentWordIndex]}
          </span>
        </span>
      </h2>
      
      {/* Tasteful horizontal divider */}
      <div className="flex justify-center mt-6">
        <div className="w-32 md:w-48 lg:w-64 xl:w-80 h-0.5 md:h-1 bg-gradient-to-r from-transparent via-powder-blue/70 to-transparent"></div>
      </div>
    </div>
  );
};

export default RollingText;
