import { Card } from "@/components/ui/card";
import { MessageCircle, Heart, Zap, Users } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: MessageCircle,
      title: "Choose Your M.O.M",
      description: "Select from our loving personas, each with unique strengths and specialties to match your needs.",
      color: "powder-blue"
    },
    {
      icon: Heart,
      title: "Share Your Story",
      description: "Open up in a safe, judgment-free space. M.O.M listens with unconditional love and understanding.",
      color: "muted-gold"
    },
    {
      icon: Zap,
      title: "She Grows With You",
      description: "Your M.O.M remembers your conversations and evolves to become the perfect companion for your journey.",
      color: "deep-green"
    },
    {
      icon: Users,
      title: "Join the Community",
      description: "Connect with others who understand, sharing experiences and support in our caring community.",
      color: "powder-blue"
    }
  ];

  return (
    <section className="py-24 px-8 lg:px-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-deep-green/5 to-background/50" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-20" data-animate>
          <h2 className="font-display text-3xl lg:text-4xl text-deep-green mb-6 font-bold tracking-tight">
            🌐 How M.O.M AI Works
          </h2>
          <p className="font-sans text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
            Experience a maternal companion that understands, remembers, and grows with you through every step of your journey.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <Card
                key={index}
                className="group p-6 bg-card/60 backdrop-blur-sm border-gray-200/50 hover:border-powder-blue/40 
                           transition-all duration-500 hover:transform hover:scale-105 hover:-translate-y-2 
                           hover:shadow-xl cursor-pointer relative overflow-hidden"
                data-animate
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Enhanced background effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-powder-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Step number */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-powder-blue to-muted-gold rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {index + 1}
                </div>
                
                <div className="relative z-10 text-center space-y-4">
                  <IconComponent 
                    className={`w-12 h-12 mx-auto mb-4 transition-all duration-300 group-hover:scale-125 
                               text-${step.color}`}
                  />
                  <h3 className="font-display text-lg text-deep-green font-semibold">
                    {step.title}
                  </h3>
                  <p className="font-sans text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;