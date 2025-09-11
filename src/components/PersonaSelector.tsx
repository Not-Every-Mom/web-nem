import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Sparkles, Sun, Moon, Shield, Waves } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";

interface Persona {
  id: string;
  name: string;
  display_name?: string;
  description: string;
  specialty: string;
  color_theme: string;
  avatar_url?: string;
}

const PersonaCard = ({ persona, onSelect, isLoading }: { 
  persona: Persona; 
  onSelect: (persona: Persona) => void;
  isLoading: boolean;
}) => {
  const getThemeConfig = (theme: string) => {
    const themeMap: Record<string, any> = {
      'powder-blue': {
        background: 'bg-gradient-to-br from-nancy-muted/50 to-nancy-accent/20',
        border: 'border-nancy-primary/30',
        icon: Heart,
        iconBg: 'from-nancy-primary to-nancy-secondary',
        iconColor: 'text-white',
        accent: 'text-nancy-primary',
        gradient: 'var(--nancy-gradient)'
      },
      'deep-green': {
        background: 'bg-gradient-to-br from-willow-muted/50 to-willow-accent/20',
        border: 'border-willow-primary/30',
        icon: Shield,
        iconBg: 'from-willow-primary to-willow-secondary',
        iconColor: 'text-white',
        accent: 'text-willow-primary',
        gradient: 'var(--willow-gradient)'
      },
      'muted-gold': {
        background: 'bg-gradient-to-br from-clara-muted/50 to-clara-accent/20',
        border: 'border-clara-primary/30',
        icon: Waves,
        iconBg: 'from-clara-primary to-clara-secondary',
        iconColor: 'text-white',
        accent: 'text-clara-primary',
        gradient: 'var(--clara-gradient)'
      },
      'light-cyan': {
        background: 'bg-gradient-to-br from-luna-muted/50 to-luna-accent/20',
        border: 'border-luna-primary/30',
        icon: Moon,
        iconBg: 'from-luna-primary to-luna-secondary',
        iconColor: 'text-white',
        accent: 'text-luna-primary',
        gradient: 'var(--luna-gradient)'
      },
      // New theme aliases for therapeutic personas
      'coral': {
        background: 'bg-gradient-to-br from-nancy-muted/50 to-nancy-accent/20',
        border: 'border-nancy-primary/30',
        icon: Heart,
        iconBg: 'from-nancy-primary to-nancy-secondary',
        iconColor: 'text-white',
        accent: 'text-nancy-primary',
        gradient: 'var(--nancy-gradient)'
      },
      'forest': {
        background: 'bg-gradient-to-br from-willow-muted/50 to-willow-accent/20',
        border: 'border-willow-primary/30',
        icon: Shield,
        iconBg: 'from-willow-primary to-willow-secondary',
        iconColor: 'text-white',
        accent: 'text-willow-primary',
        gradient: 'var(--willow-gradient)'
      },
      'teal': {
        background: 'bg-gradient-to-br from-clara-muted/50 to-clara-accent/20',
        border: 'border-clara-primary/30',
        icon: Waves,
        iconBg: 'from-clara-primary to-clara-secondary',
        iconColor: 'text-white',
        accent: 'text-clara-primary',
        gradient: 'var(--clara-gradient)'
      },
      'violet': {
        background: 'bg-gradient-to-br from-luna-muted/50 to-luna-accent/20',
        border: 'border-luna-primary/30',
        icon: Moon,
        iconBg: 'from-luna-primary to-luna-secondary',
        iconColor: 'text-white',
        accent: 'text-luna-primary',
        gradient: 'var(--luna-gradient)'
      },
    };

    return themeMap[theme] || {
      background: 'bg-gradient-to-br from-nancy-muted/50 to-nancy-accent/20',
      border: 'border-nancy-primary/30',
      icon: Sparkles,
      iconBg: 'from-nancy-primary to-nancy-secondary',
      iconColor: 'text-white',
      accent: 'text-nancy-primary',
      gradient: 'var(--nancy-gradient)'
    };
  };

  const theme = getThemeConfig(persona.color_theme);
  const IconComponent = theme.icon;

  return (
    <Card 
      className={`
        w-full cursor-pointer transition-all duration-300 
        ${theme.background} ${theme.border} 
        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        animate-fade-in focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
      `}
      onClick={() => !isLoading && onSelect(persona)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
          e.preventDefault();
          onSelect(persona);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Start conversation with ${persona.display_name || persona.name}, ${persona.specialty}. ${persona.description}`}
      aria-busy={isLoading}
      aria-disabled={isLoading}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Avatar with personality indicator */}
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center 
            bg-gradient-to-br ${theme.iconBg} flex-shrink-0 transition-all duration-300
          `}>
            <IconComponent className={`w-8 h-8 ${theme.iconColor}`} />
          </div>
          
          {/* Content */}
          <div className="flex-1 space-y-3">
            <div>
<h3 className="font-heading text-xl text-foreground mb-1">
  {persona.display_name || persona.name}
</h3>
              <p className={`font-body text-sm font-medium ${theme.accent}`}>
                {persona.specialty}
              </p>
            </div>
            
            <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {persona.description}
            </p>
            
            <Button 
              variant="default" 
              size="sm"
              className={`
                w-full mt-4 text-white border-0
                transition-all duration-300 hover:shadow-md
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              style={{
                background: theme.gradient,
              }}
              disabled={isLoading}
              aria-live="polite"
              aria-describedby={`persona-${persona.id}-status`}
            >
              <MessageCircle className="w-4 h-4 mr-2" aria-hidden="true" />
              {isLoading ? 'Starting conversation...' : 'Start Conversation'}
            </Button>
            <div id={`persona-${persona.id}-status`} className="sr-only">
              {isLoading ? 'Preparing your chat session, please wait.' : 'Ready to start conversation'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const PersonaSelector = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const { announce } = useAccessibility();

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      const { data, error } = await supabase
        .from('personas')
.select('id, name, display_name, description, specialty, color_theme, avatar_url, profile')
.order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching personas:', error);
        return;
      }

      const allowed = ['The Compassionate Nurturer','The Wise Advisor','The Passionate Rebel','The Resilient Survivor'];
      const ordered = (data || []).filter(p => allowed.includes(p.name)).sort((a,b) => allowed.indexOf(a.name) - allowed.indexOf(b.name));
      setPersonas(ordered);
    } catch (error) {
      console.error('Error fetching personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaSelect = async (persona: Persona) => {
    setSelectedPersonaId(persona.id);
    announce(`Starting conversation with ${persona.display_name || persona.name}`, 'polite');
    
    // Add a small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));

    // For demo mode users, go directly to chat
    if (isDemoMode || !user) {
      navigate(`/app/chat/${persona.id}`);
      return;
    }

    // For authenticated users, create or find existing conversation
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
        // Navigate to existing conversation
        navigate(`/app/chat/${persona.id}/${existingConversation.id}`);
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            persona_id: persona.id,
title: `Chat with ${persona.display_name || persona.name}`
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating conversation:', createError);
          navigate(`/app/chat/${persona.id}`);
          return;
        }

        navigate(`/app/chat/${persona.id}/${newConversation.id}`);
      }
    } catch (error) {
      console.error('Error handling persona selection:', error);
      navigate(`/app/chat/${persona.id}`);
    } finally {
      setSelectedPersonaId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary"></div>
        <p className="font-body text-sm text-muted-foreground">Loading companions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header Section */}
      <div className="text-center px-6 py-4 space-y-3">
        <h1 className="font-heading text-2xl text-foreground" id="personas-heading">
          Choose your AI companion
        </h1>
        <p className="font-body text-muted-foreground max-w-sm mx-auto">
          Select a caring AI companion for emotional support and guidance
        </p>
      </div>

      {/* Persona Cards - Full width, stackable */}
      <div 
        className="space-y-4 px-4"
        role="group"
        aria-labelledby="personas-heading"
      >
        {personas.map((persona, index) => (
          <div
            key={persona.id}
            className="animate-fade-in"
            style={{ 
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'both'
            }}
          >
            <PersonaCard
              persona={persona}
              onSelect={handlePersonaSelect}
              isLoading={selectedPersonaId === persona.id}
            />
          </div>
        ))}
      </div>

      {personas.length === 0 && (
        <div 
          className="text-center py-12 px-6"
          role="status"
          aria-live="polite"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-lg text-foreground mb-2">
            No companions available
          </h2>
          <p className="font-body text-sm text-muted-foreground">
            Please check back later for AI companions.
          </p>
        </div>
      )}
    </div>
  );
};