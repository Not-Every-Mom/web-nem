import { Button } from "@/components/ui/button";
import { Heart, Users, Shield, ArrowRight, ArrowLeft, Sparkles, TreePine, Waves, Moon, MessageCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePersonaTheme } from "@/hooks/usePersonaTheme";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";

// Child components to respect Rules of Hooks
interface PersonaType {
  id: string;
  name: string;
  personality: string;
  specialty: string;
  description: string;
  icon: React.ComponentType<any>;
  examples: string[];
  situations: string[];
  theme: string;
}

const PersonaDetails = ({ persona, onSelect, showCTA }: { persona: PersonaType; onSelect: (personaName: string) => void; showCTA: boolean; }) => {
  const theme = usePersonaTheme(persona.theme);
  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto px-4 sm:px-6">
      {/* Persona Header */}
      <div className="text-center space-y-3">
        <div 
          className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full flex items-center justify-center shadow-gentle`}
          style={theme ? { background: theme.gradient } : {}}
        >
          <persona.icon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </div>
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl text-deep-green">{persona.name}</h2>
          <p className="font-body text-base sm:text-lg" style={theme ? { color: theme.primary } : {}}>
            {persona.personality}
          </p>
        </div>
      </div>

      {/* Scrollable content area for mobile */}
      <div className="space-y-4 max-h-[50vh] sm:max-h-none overflow-y-auto sm:overflow-visible">
        {/* Specialty */}
        <div className="bg-card/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-powder-blue/20">
          <h3 className="font-heading text-base sm:text-lg text-deep-green mb-2">Specialty</h3>
          <p className="font-body text-sm sm:text-base text-muted-foreground">{persona.specialty}</p>
        </div>

        {/* Example Starters */}
        <div className="bg-card/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-powder-blue/20">
          <h3 className="font-heading text-base sm:text-lg text-deep-green mb-3">Try saying...</h3>
          <div className="space-y-2">
            {persona.examples.map((example: string, index: number) => (
              <div 
                key={index} 
                className="bg-background/50 rounded-md p-2 border border-muted/20"
              >
                <p className="font-body text-xs sm:text-sm text-muted-foreground italic">"{example}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Best For */}
        <div className="bg-card/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-powder-blue/20">
          <h3 className="font-heading text-base sm:text-lg text-deep-green mb-3">Perfect for...</h3>
          <ul className="space-y-1">
            {persona.situations.map((situation: string, index: number) => (
              <li key={index} className="font-body text-xs sm:text-sm text-muted-foreground flex items-start">
                <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-powder-blue rounded-full flex-shrink-0"></span>
                {situation}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA for persona screens */}
      {showCTA && (
        <div className="text-center pt-4">
          <Button
            onClick={() => onSelect(persona.name)}
            className="transition-bounce"
            style={theme ? { background: theme.gradient, color: 'white' } : {}}
          >
            Start chatting with {persona.name}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

const PersonaQuickTile = ({ persona, onSelect }: { persona: PersonaType; onSelect: (personaName: string) => void; }) => {
  const theme = usePersonaTheme(persona.theme);
  return (
    <button
      onClick={() => onSelect(persona.name)}
      className="p-4 bg-card/30 backdrop-blur-sm border border-powder-blue/20 rounded-lg hover:scale-105 transition-all duration-200 group"
    >
      <div 
        className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2"
        style={theme ? { background: theme.gradient } : {}}
      >
        <persona.icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-heading text-sm text-deep-green group-hover:text-powder-blue transition-colors">
        {persona.name}
      </h3>
    </button>
  );
};

const OnboardingScreen = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const navigate = useNavigate();
  const { announce } = useAccessibility();
  
  useDocumentTitle("Welcome to M.O.M AI");

  // Enhanced persona data for detailed introduction - aligned with PersonaGrid
  const personaData = [
    {
      id: "nurturing-nancy",
      name: "Nurturing Nancy",
      personality: "Emotional Support",
      specialty: "Comfort & Understanding",
      description: "Find comfort in Nancy's nurturing presence. She gently supports you through tough moments, offering reassurance when you need it most. With time, she learns what soothes you best, offering responses that feel more attuned to your unique journey.",
      icon: Heart,
      examples: [
        "I'm having a really hard day",
        "I need someone to understand me",
        "Can you help me feel better?"
      ],
      situations: [
        "When you need emotional comfort and support",
        "When you're feeling overwhelmed or stressed",
        "When you want gentle reassurance and understanding"
      ],
      theme: "nurturing-nancy"
    },
    {
      id: "wise-willow",
      name: "Wise Willow",
      personality: "Life Guidance",
      specialty: "Wisdom & Direction",
      description: "Turn to Willow for thoughtful life guidance. She blends care with wisdom, helping you see new perspectives and make choices with confidence. As your conversations grow, so does her understanding of your values and goals — shaping guidance that feels deeply personal to you.",
      icon: Shield,
      examples: [
        "I need help making a difficult decision",
        "What should I do about this situation?",
        "Can you help me see this differently?"
      ],
      situations: [
        "When you need thoughtful guidance and perspective",
        "When facing important life decisions", 
        "When you want wisdom and clarity"
      ],
      theme: "wise-willow"
    },
    {
      id: "caring-clara",
      name: "Caring Clara",
      personality: "Daily Support",
      specialty: "Everyday Encouragement",
      description: "Share your daily challenges and wins with Clara. She listens with care, celebrates your progress, and reminds you that every step forward matters. The more you talk, the more she notices your patterns and growth — becoming a steady companion who sees how far you've come.",
      icon: Sparkles,
      examples: [
        "Let me tell you about my day",
        "I accomplished something today!",
        "I'm struggling with daily routines"
      ],
      situations: [
        "When you want to share daily experiences",
        "When you need encouragement and celebration",
        "When you want consistent daily support"
      ],
      theme: "caring-clara"
    },
    {
      id: "loving-luna",
      name: "Loving Luna", 
      personality: "Comfort & Peace",
      specialty: "Calming Presence",
      description: "End your day with warmth and peace. Luna offers calming stories, gentle encouragement, and a soothing presence whenever you need to rest. Over time, she remembers the stories and moments that bring you comfort, so every night feels more familiar and reassuring.",
      icon: Moon,
      examples: [
        "I need help winding down",
        "Can you tell me a calming story?",
        "I want to feel peaceful"
      ],
      situations: [
        "When you need to relax and unwind",
        "When you want calming, peaceful conversations",
        "When you need bedtime comfort and stories"
      ],
      theme: "loving-luna"
    }
  ];

  const screens = [
    {
      id: "welcome",
      title: "Welcome to Not Every Mom",
      subtitle: "M.O.M AI & Supportive Community",
      description: "Connect with M.O.M (My Other Mom) for AI companionship and join our nurturing community. Access meaningful conversations, shared experiences, helpful resources, and peer support - because not every mom has the support they need, but you do here.",
      icon: Heart,
      bgGradient: "bg-gradient-primary",
      iconColor: "text-white",
      persona: null
    },
    ...personaData.map(persona => ({
      id: persona.id,
      title: `Meet ${persona.name}`,
      subtitle: persona.personality,
      description: persona.description,
      icon: persona.icon,
      bgGradient: `bg-gradient-${persona.theme}`,
      iconColor: "text-white",
      persona: persona
    })),
    {
      id: "get-started",
      title: "Start Your Journey",
      subtitle: "Choose Your Path to Connection",
      description: "Begin with any M.O.M companion for personalized AI support, or explore our community features including discussion forums, resource library, and peer connections. You can always access both throughout your journey.",
      icon: MessageCircle,
      bgGradient: "bg-gradient-primary", 
      iconColor: "text-white",
      persona: null
    }
  ];

  // Check for onboarding completion
  useEffect(() => {
    const hasCompleted = localStorage.getItem('hasCompletedOnboarding');
    if (hasCompleted === 'true') {
      // Returning user - they can skip or go through again
    }
  }, []);

  const currentScreenData = screens[currentScreen];

  const handleNext = useCallback(() => {
    if (currentScreen < screens.length - 1) {
      const nextScreen = currentScreen + 1;
      setCurrentScreen(nextScreen);
      announce(`Step ${nextScreen + 1} of ${screens.length}: ${screens[nextScreen].title}`, "polite");
    } else {
      // Mark onboarding as completed and go to persona selection
      localStorage.setItem('hasCompletedOnboarding', 'true');
      navigate("/auth");
    }
  }, [currentScreen, screens, announce, navigate]);

  const handlePrev = useCallback(() => {
    if (currentScreen > 0) {
      const prevScreen = currentScreen - 1;
      setCurrentScreen(prevScreen);
      announce(`Step ${prevScreen + 1} of ${screens.length}: ${screens[prevScreen].title}`, "polite");
    } else {
      navigate("/");
    }
  }, [currentScreen, screens, announce, navigate]);

  const handleSkip = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    navigate("/auth");
  };

  const handlePersonaSelect = async (personaName: string) => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    // Find the persona by name to get the correct ID
    const selectedPersona = personaData.find(p => p.name === personaName);
    if (selectedPersona) {
      navigate(`/app/chat/${selectedPersona.id}`);
    } else {
      navigate('/app');
    }
  };

  const renderPersonaDetails = (persona: any) => {
    return (
      <PersonaDetails
        persona={persona}
        onSelect={handlePersonaSelect}
        showCTA={currentScreen > 0 && currentScreen < screens.length - 1}
      />
    );
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-subtle" />
      <div className="absolute top-10 right-20 w-32 h-32 bg-powder-blue/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-24 h-24 bg-muted-gold/10 rounded-full blur-xl animate-pulse" />
      
      {/* Skip Button */}
      <div className="absolute top-4 right-4 z-20">
        <Button variant="ghost" onClick={handleSkip} className="font-body text-muted-foreground">
          Skip
        </Button>
      </div>

      {/* Main Content */}
      <div 
        className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10 max-w-4xl min-h-screen flex flex-col"
        role="main"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
      >
        <div className="flex-1 flex flex-col justify-center">
          {/* Content Container */}
          <div className="bg-card/50 backdrop-blur-sm border-2 border-powder-blue/20 shadow-warm rounded-lg p-4 sm:p-6 md:p-8 lg:p-12">
            {/* Welcome Screen */}
            {currentScreen === 0 && (
              <div className="text-center space-y-6 sm:space-y-8">
                {/* Icon */}
                <div className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto ${currentScreenData.bgGradient} rounded-full flex items-center justify-center shadow-gentle`}>
                  <currentScreenData.icon className={`w-10 h-10 sm:w-12 sm:h-12 ${currentScreenData.iconColor}`} />
                </div>

                {/* Content */}
                <div className="space-y-4 max-w-2xl mx-auto px-4 sm:px-6">
                  <h1 
                    id="onboarding-title"
                    className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-deep-green leading-tight"
                  >
                    {currentScreenData.title}
                  </h1>
                  <h2 className="font-heading text-lg sm:text-xl md:text-2xl text-powder-blue">
                    {currentScreenData.subtitle}
                  </h2>
                  <p 
                    id="onboarding-description"
                    className="font-body text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed"
                  >
                    {currentScreenData.description}
                  </p>
                </div>
              </div>
            )}

          {/* Persona Introduction Screens */}
          {currentScreen > 0 && currentScreen < screens.length - 1 && currentScreenData.persona && (
            renderPersonaDetails(currentScreenData.persona)
          )}

            {/* Final Screen */}
            {currentScreen === screens.length - 1 && (
              <div className="text-center space-y-6 sm:space-y-8">
                {/* Icon */}
                <div className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto ${currentScreenData.bgGradient} rounded-full flex items-center justify-center shadow-gentle`}>
                  <currentScreenData.icon className={`w-10 h-10 sm:w-12 sm:h-12 ${currentScreenData.iconColor}`} />
                </div>

                {/* Content */}
                <div className="space-y-4 max-w-2xl mx-auto px-4 sm:px-6">
                  <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl text-deep-green leading-tight">
                    {currentScreenData.title}
                  </h1>
                  <h2 className="font-heading text-lg sm:text-xl md:text-2xl text-powder-blue">
                    {currentScreenData.subtitle}
                  </h2>
                  <p className="font-body text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                    {currentScreenData.description}
                  </p>
                </div>

                {/* Persona Quick Selection */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto px-4 sm:px-6">
                  {personaData.map((persona) => (
                    <PersonaQuickTile
                      key={persona.id}
                      persona={persona as any}
                      onSelect={handlePersonaSelect}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Progress Dots */}
          <div 
            className="flex justify-center space-x-3 mt-6 sm:mt-8"
            role="tablist"
            aria-label="Onboarding progress"
          >
            {screens.map((screen, index) => (
              <button
                key={index}
                role="tab"
                aria-selected={index === currentScreen}
                aria-label={`Go to step ${index + 1}: ${screen.title}`}
                onClick={() => {
                  setCurrentScreen(index);
                  announce(`Navigated to step ${index + 1}: ${screen.title}`, "polite");
                }}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-gentle focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  index === currentScreen 
                    ? 'bg-powder-blue' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 sm:pt-8">
            <Button 
              variant="ghost" 
              onClick={handlePrev}
              className="font-body text-muted-foreground"
              size="sm"
            >
              <ArrowLeft className="mr-1 sm:mr-2 w-4 h-4" />
              <span className="hidden xs:inline">{currentScreen === 0 ? 'Home' : 'Previous'}</span>
              <span className="xs:hidden">{currentScreen === 0 ? 'Home' : 'Back'}</span>
            </Button>

            <Button 
              variant={currentScreen === screens.length - 1 ? "hero" : "maternal"}
              onClick={handleNext}
              size="lg"
              className="transition-bounce"
            >
              {currentScreen === screens.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight className="ml-1 sm:ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;