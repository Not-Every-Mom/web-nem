import { useMemo } from 'react';
import { Shield, Waves, Moon } from 'lucide-react';
import NancyIcon from '@/components/icons/NancyIcon';

export interface PersonaTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  gradient: string;
  icon: React.ComponentType<any>;
  textStyle: string;
  description: string;
}

export const usePersonaTheme = (personaId?: string): PersonaTheme | null => {
  return useMemo(() => {
    if (!personaId) return null;

    const themes: Record<string, PersonaTheme> = {
      'nurturing-nancy': {
        id: 'nurturing-nancy',
        name: 'Nurturing Nancy',
        primary: 'hsl(var(--nancy-primary))',
        secondary: 'hsl(var(--nancy-secondary))',
        accent: 'hsl(var(--nancy-accent))',
        muted: 'hsl(var(--nancy-muted))',
        gradient: 'var(--nancy-gradient)',
        icon: NancyIcon,
        textStyle: 'font-body',
        description: 'Warm coral and pink tones for emotional comfort'
      },
      'wise-willow': {
        id: 'wise-willow',
        name: 'Wise Willow',
        primary: 'hsl(var(--willow-primary))',
        secondary: 'hsl(var(--willow-secondary))',
        accent: 'hsl(var(--willow-accent))',
        muted: 'hsl(var(--willow-muted))',
        gradient: 'var(--willow-gradient)',
        icon: Shield,
        textStyle: 'font-heading',
        description: 'Deep green and forest tones for wisdom and stability'
      },
      'caring-clara': {
        id: 'caring-clara',
        name: 'Caring Clara',
        primary: 'hsl(var(--clara-primary))',
        secondary: 'hsl(var(--clara-secondary))',
        accent: 'hsl(var(--clara-accent))',
        muted: 'hsl(var(--clara-muted))',
        gradient: 'var(--clara-gradient)',
        icon: Waves,
        textStyle: 'font-body',
        description: 'Calming blue and teal tones for peace and support'
      },
      'loving-luna': {
        id: 'loving-luna',
        name: 'Loving Luna',
        primary: 'hsl(var(--luna-primary))',
        secondary: 'hsl(var(--luna-secondary))',
        accent: 'hsl(var(--luna-accent))',
        muted: 'hsl(var(--luna-muted))',
        gradient: 'var(--luna-gradient)',
        icon: Moon,
        textStyle: 'font-heading',
        description: 'Purple and lavender tones for comfort and imagination'
      }
    };

    // Handle legacy persona IDs or partial matches
    const matchedKey = Object.keys(themes).find(key => 
      key === personaId || 
      key.includes(personaId.toLowerCase()) ||
      personaId.toLowerCase().includes(key.split('-')[1])
    );

    return matchedKey ? themes[matchedKey] : null;
  }, [personaId]);
};

export const getPersonaThemeCSS = (theme: PersonaTheme) => ({
  '--persona-primary': theme.primary,
  '--persona-secondary': theme.secondary,
  '--persona-accent': theme.accent,
  '--persona-muted': theme.muted,
  '--persona-gradient': theme.gradient,
});