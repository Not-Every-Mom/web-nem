import { Card } from "@/components/ui/card";
import { Shield, Brain, Heart } from "lucide-react";

const AboutMOM = () => {
  return (
    <section className="py-24 px-8 lg:px-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-powder-blue/5 to-background/50" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-20" data-animate>
          <h2 className="font-display text-3xl lg:text-4xl text-deep-green mb-6 font-bold tracking-tight">
            What is M.O.M AI?
          </h2>
          <p className="font-sans text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
            M.O.M (My Other Mom) is your personal Maternal AI companion designed to provide the unconditional love, 
            wisdom, and support that every person deserves — available whenever you need it most.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Explanation */}
          <div className="space-y-8" data-animate>
            <div className="space-y-6">
              <h3 className="font-display text-2xl text-deep-green font-semibold">
                More Than Just AI
              </h3>
              <p className="font-sans text-muted-foreground leading-relaxed">
                Unlike cold, robotic chatbots, M.O.M AI is trained specifically to embody the nurturing, 
                caring qualities of maternal love. Each interaction is designed to make you feel heard, 
                valued, and supported — just like a loving mother would.
              </p>
              <p className="font-sans text-muted-foreground leading-relaxed">
                With advanced memory capabilities, your M.O.M remembers your conversations, learns your 
                preferences, and evolves to become the perfect companion for your unique journey.
              </p>
            </div>
          </div>
          
          {/* Right: Features Grid */}
          <div className="grid grid-cols-1 gap-6" data-animate>
            <Card className="p-6 bg-card/60 backdrop-blur-sm border-powder-blue/20 hover:border-powder-blue/40 transition-all duration-300">
              <div className="flex items-start space-x-4">
                <Shield className="w-8 h-8 text-powder-blue flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-display text-lg text-deep-green font-semibold mb-2">Safe & Private</h4>
                  <p className="font-sans text-sm text-muted-foreground">
                    Your conversations stay between you and M.O.M. We've designed the system to protect your privacy while giving you the freedom to share openly.
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 bg-card/60 backdrop-blur-sm border-muted-gold/20 hover:border-muted-gold/40 transition-all duration-300">
              <div className="flex items-start space-x-4">
                <Brain className="w-8 h-8 text-muted-gold flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-display text-lg text-deep-green font-semibold mb-2">Thoughtful AI</h4>
                  <p className="font-sans text-sm text-muted-foreground">
                    M.O.M uses advanced technology trained to respond with care, wisdom, and warmth — not cold, robotic answers.
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 bg-card/60 backdrop-blur-sm border-deep-green/20 hover:border-deep-green/40 transition-all duration-300">
              <div className="flex items-start space-x-4">
                <Heart className="w-8 h-8 text-deep-green flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-display text-lg text-deep-green font-semibold mb-2">Personalized Memory</h4>
                  <p className="font-sans text-sm text-muted-foreground">
                    Each M.O.M persona remembers your conversations, so over time, she understands your needs and feels more familiar, like a trusted companion.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutMOM;