import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Sparkles } from "lucide-react";

const FeatureSection = () => {
  return (
    <section className="py-24 px-8 lg:px-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-powder-blue/5" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-20" data-animate>
          <h2 className="font-display text-3xl lg:text-4xl text-deep-green mb-6 font-bold tracking-tight">
            Why Choose M.O.M AI?
          </h2>
          <p className="font-sans text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
            Experience the support you deserve with AI that truly understands your needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          <Card 
            className="group p-8 bg-card/60 backdrop-blur-sm border-powder-blue/20 hover:border-powder-blue/40 
                       transition-all duration-500 hover:transform hover:scale-105 hover:-translate-y-4 
                       hover:shadow-xl cursor-pointer relative overflow-hidden"
            data-animate
            style={{ animationDelay: "0.1s" }}
          >
            {/* Enhanced background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-powder-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <Heart 
              className="w-12 h-12 text-powder-blue mb-6 transition-all duration-300 group-hover:scale-125 
                         group-hover:animate-pulse-icon relative z-10" 
            />
            <h3 className="font-display text-xl text-deep-green mb-4 font-semibold relative z-10">Unconditional Love</h3>
            <p className="font-sans text-muted-foreground leading-relaxed relative z-10">
              Feel the warmth of unconditional love in every conversation. Day or night, you'll always be welcomed, accepted, and embraced exactly as you are.
            </p>
          </Card>
          
          <Card 
            className="group p-8 bg-card/60 backdrop-blur-sm border-muted-gold/20 hover:border-muted-gold/40 
                       transition-all duration-500 hover:transform hover:scale-105 hover:-translate-y-4 
                       hover:shadow-xl cursor-pointer relative overflow-hidden"
            data-animate
            style={{ animationDelay: "0.2s" }}
          >
            {/* Enhanced background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-muted-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <MessageCircle 
              className="w-12 h-12 text-muted-gold mb-6 transition-all duration-300 group-hover:scale-125 
                         group-hover:animate-float-gentle relative z-10" 
            />
            <h3 className="font-display text-xl text-deep-green mb-4 font-semibold relative z-10">Wise Guidance</h3>
            <p className="font-sans text-muted-foreground leading-relaxed relative z-10">
              Receive thoughtful, compassionate guidance when life feels uncertain. We'll walk alongside you, helping you find clarity with care.
            </p>
          </Card>
          
          <Card 
            className="group p-8 bg-card/60 backdrop-blur-sm border-deep-green/20 hover:border-deep-green/40 
                       transition-all duration-500 hover:transform hover:scale-105 hover:-translate-y-4 
                       hover:shadow-xl cursor-pointer relative overflow-hidden"
            data-animate
            style={{ animationDelay: "0.3s" }}
          >
            {/* Enhanced background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-deep-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <Sparkles 
              className="w-12 h-12 text-deep-green mb-6 transition-all duration-300 group-hover:scale-125 
                         group-hover:animate-pulse-icon relative z-10" 
            />
            <h3 className="font-display text-xl text-deep-green mb-4 font-semibold relative z-10">Always Available</h3>
            <p className="font-sans text-muted-foreground leading-relaxed relative z-10">
              Lean on 24/7 emotional support in a safe, judgment-free space. Whenever you need comfort, we're here.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;