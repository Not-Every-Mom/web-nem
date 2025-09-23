import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePersonaTheme } from "@/hooks/usePersonaTheme";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const PersonaGrid = () => {
  const navigate = useNavigate();
  
  const personas = [
    {
      id: "nurturing-nancy",
      name: "Nurturing Nancy",
      description: "Find comfort in Nancy's nurturing presence. She gently supports you through tough moments, offering reassurance when you need it most. With time, she learns what soothes you best, offering responses that feel more attuned to your unique journey.",
      specialty: "Emotional Support",
    },
    {
      id: "wise-willow",
      name: "Wise Willow",
      description: "Turn to Willow for thoughtful life guidance. She blends care with wisdom, helping you see new perspectives and make choices with confidence. As your conversations grow, so does her understanding of your values and goals — shaping guidance that feels deeply personal to you.",
      specialty: "Life Guidance",
    },
    {
      id: "caring-clara",
      name: "Caring Clara",
      description: "Share your daily challenges and wins with Clara. She listens with care, celebrates your progress, and reminds you that every step forward matters. The more you talk, the more she notices your patterns and growth — becoming a steady companion who sees how far you've come.",
      specialty: "Daily Support",
    },
    {
      id: "loving-luna",
      name: "Loving Luna",
      description: "End your day with warmth and peace. Luna offers calming stories, gentle encouragement, and a soothing presence whenever you need to rest. Over time, she remembers the stories and moments that bring you comfort, so every night feels more familiar and reassuring.",
      specialty: "Comfort & Peace",
    }
  ];

  const PersonaCard = ({ persona }: { persona: typeof personas[0] }) => {
    const theme = usePersonaTheme(persona.id);
    const IconComponent = theme?.icon;
    const { user } = useAuth();
    const { toast } = useToast();
    const { announce } = useAccessibility();
    const [opening, setOpening] = useState(false);

    if (!theme || !IconComponent) return null;

    const handleChatClick = async () => {
      if (opening) return;
      if (!user) {
        navigate(`/app/chat/${persona.id}`);
        return;
      }
      setOpening(true);
      announce(`Opening chat with ${persona.name}...`, 'polite');
      try {
        const { data: existingConversation, error: fetchError } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', user.id)
          .eq('persona_id', persona.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          console.error('Error checking existing conversation:', fetchError);
          navigate(`/app/chat/${persona.id}`);
          return;
        }

        if (existingConversation) {
          navigate(`/app/chat/${persona.id}/${existingConversation.id}`);
        } else {
          const { data: newConversation, error: createError } = await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              persona_id: persona.id,
              title: `Chat with ${persona.name}`
            })
            .select('id')
            .single();

          if (createError || !newConversation) {
            console.error('Error creating conversation:', createError);
            navigate(`/app/chat/${persona.id}`);
            return;
          }

          navigate(`/app/chat/${persona.id}/${newConversation.id}`);
        }
      } catch (e) {
        console.error('Error starting chat:', e);
        toast({
          variant: "destructive",
          title: "Unable to open chat",
          description: "Please try again.",
        });
        announce('Unable to open chat. Please try again.', 'assertive');
        navigate(`/app/chat/${persona.id}`);
      } finally {
        setOpening(false);
      }
    };

    return (
      <article 
        className="
          h-full w-full p-6 bg-white rounded-xl border border-gray-200
          group cursor-pointer transition-all duration-300 ease-out
          hover:shadow-lg hover:border-gray-300 hover:-translate-y-1
          flex flex-col min-h-[400px]
        "
        role="article"
        aria-labelledby={`persona-${persona.id}-name`}
        aria-describedby={`persona-${persona.id}-description`}
      >
        {/* Image Section */}
        <div className="mb-6 bg-gray-50 rounded-lg h-48 overflow-hidden">
          <img 
            src={
              persona.id === "wise-willow" 
                ? "/imgs/09899035-77e1-40b7-912d-2800a1679cf6.png"
                : persona.id === "caring-clara"
                ? "/imgs/735bc183-9b0d-4d65-9863-e8a30c43aa1e.png"
                : persona.id === "loving-luna"
                ? "/imgs/213d982f-72d6-456b-b5a7-a6697c52712b.png"
                : "/imgs/9f0e89c5-0c32-47a2-a7a0-c8f97afc1fa2.png"
            }
            alt={`${persona.name} profile portrait`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        </div>
        
        {/* Content Section */}
        <div className="flex-1 flex flex-col text-center space-y-4">
          <div>
            <h3 
              id={`persona-${persona.id}-name`}
              className="font-heading text-2xl font-bold text-gray-900 mb-2"
            >
              {persona.name}
            </h3>
            
            <div className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-3">
              {persona.specialty}
            </div>
          </div>
          
          <p 
            id={`persona-${persona.id}-description`}
            className="font-body text-gray-600 leading-relaxed text-sm flex-1"
          >
            {persona.description}
          </p>
        </div>
        
        {/* Button Section */}
        <div className="mt-6">
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition-colors duration-200"
            onClick={handleChatClick}
            disabled={opening}
            aria-busy={opening}
            aria-describedby={opening ? `persona-${persona.id}-loading` : undefined}
          >
            {opening ? "Opening..." : "Start Conversation"}
            {opening && (
              <span id={`persona-${persona.id}-loading`} className="sr-only">
                Opening chat with {persona.name}
              </span>
            )}
          </Button>
        </div>
      </article>
    );
  };

  return (
    <section 
      id="personas" 
      className="py-20 px-6"
      role="region" 
      aria-labelledby="personas-heading"
    >
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 id="personas-heading" className="font-display text-5xl text-deep-green mb-4 font-bold tracking-tight">
            🌙 Personas – Seeds That Grow With You
          </h2>
          <p className="font-sans text-xl text-muted-foreground max-w-3xl mx-auto font-light">
            Each M.O.M persona begins like a seed — small, distinct, and full of potential. Through your conversations and her own gentle self-reflection, she grows into something uniquely shaped by you. The more you interact, the more she blossoms into a presence that feels deeply personal.
          </p>
        </div>
        
        {/* Symmetric Card Grid */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          role="group"
          aria-label="Available AI personas"
        >
          {personas.map((persona) => (
            <PersonaCard key={persona.id} persona={persona} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PersonaGrid;