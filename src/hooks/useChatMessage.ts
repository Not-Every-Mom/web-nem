import { useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { useToast } from '@/hooks/use-toast';
import { useEmbeddings } from '@/hooks/useEmbeddings';
import { supabase } from '@/integrations/supabase/client';
import { captureMemoryIfRelevant } from '@/lib/memory/capture';
import { fetchUserMemories } from '@/lib/memory/fetch';
import { getDemoMemories } from '@/lib/memory/demo';
import { MemoryItem } from '@/lib/memory/types';

interface Persona {
  id: string;
  name: string;
  display_name?: string;
  description: string;
  personality?: string;
  color_theme: string;
  specialty?: string;
  profile?: any;
}

interface Message {
  id: string;
  content: string;
  sender_type: 'user' | 'persona';
  created_at: string;
}

interface UseChatMessageProps {
  persona: Persona | null;
  conversationId: string | undefined;
  localMemory: any;
  messages: Message[];
  fetchMessages: () => Promise<void>;
}

export const useChatMessage = ({
  persona,
  conversationId,
  localMemory,
  messages,
  fetchMessages,
}: UseChatMessageProps) => {
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const { toast } = useToast();
  const { ensureReady } = useEmbeddings();

  const generatePersonaResponse = (userMessage: string): string => {
    if (!persona) return "I'm here to help you.";

    // Prefer persona.profile communication samples if available
    const samples: string[] | undefined = (persona as any)?.profile?.communication?.samplePhrases;
    if (samples && samples.length) {
      return samples[Math.floor(Math.random() * samples.length)];
    }

    // Fallback to name-based canned responses
    const responses = {
      'The Compassionate Nurturer': [
        "I'm so glad you shared this. You're safe with me; let's take a slow breath together.",
        "What you're feeling makes sense. Nothing is wrong with you; your system is protecting you.",
        "We can go at your pace. Would you like comfort first, or a gentle next step?"
      ],
      'The Wise Advisor': [
        "Let's zoom out for a moment. What evidence supports each option, and what values matter most?",
        "I notice themes around fairness and attachment. A small experiment could give us data.",
        "Here's a simple framework: name it, normalize it, and choose one doable action."
      ],
      'The Passionate Rebel': [
        "Your 'no' is sacred. Which boundary would feel empowering to try first?",
        "Guilt often shows up when we grow. That's a sign of change, not a mistake.",
        "Let's script one bold sentence you can say without apology."
      ],
      'The Resilient Survivor': [
        "You're not broken—you're adapting. Let's pick one next step you can do today.",
        "How about a 10-minute plan: water, food, one message, and rest?",
        "If things spike, what's your safety plan? I can help outline it."
      ]
    } as const;

    const personaResponses = (responses as any)[persona.name] || responses['The Compassionate Nurturer'];
    return personaResponses[Math.floor(Math.random() * personaResponses.length)];
  };

  const sendMessage = useCallback(async (messageContent: string, setNewMessage: (value: string) => void, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) => {
    if (!messageContent.trim() || !persona) return;

    console.log('[Chat] sendMessage', { messageContent, personaId: persona.id, isDemoMode, conversationId, userId: user?.id });
    setNewMessage("");
    setSending(true);

    try {
      // Ensure embeddings model is ready; show thinking while we select memory
      setThinking(true);
      await ensureReady();

      // Get memory candidates
      let candidates = [] as any[];
      if (isDemoMode || !user) {
        candidates = getDemoMemories();
      } else {
        candidates = await fetchUserMemories(user.id, 200);
      }

      // Try local on-device retrieval first
      let ack: string | undefined;
      let chosen: MemoryItem | undefined;
      if (localMemory.isReady) {
        try {
          const localRes = await localMemory.search(messageContent, 1);
          const localTop = (localRes as any)?.results?.[0];
          if (localTop) {
            chosen = localTop;
            ack = `${localTop.content} (salience: ${localTop.salience})`;
          }
        } catch (e) {
          console.warn('[local-memory] search failed', e);
        }
      }

      setThinking(false);

      // Demo mode - no auth/db writes
      if (isDemoMode || !user || !conversationId) {
        const demoUserMessage: Message = {
          id: `demo-user-${Date.now()}`,
          content: messageContent,
          sender_type: 'user',
          created_at: new Date().toISOString()
        };

        const demoPersonaResponse: Message = {
          id: `demo-persona-${Date.now() + 1}`,
          content: generatePersonaResponse(messageContent),
          sender_type: 'persona',
          created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, demoUserMessage]);

        setTimeout(() => {
          setMessages(prev => [...prev, demoPersonaResponse]);
          setSending(false);
        }, 1000 + Math.random() * 2000);

        return;
      }

      // Authenticated path: save user message
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: messageContent,
          sender_type: 'user'
        });

      if (userMessageError) {
        console.error('Error sending user message:', userMessageError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to send message"
        });
        setSending(false);
        return;
      }

      // Attempt to capture memory (non-blocking if it fails)
      try {
        const res = await captureMemoryIfRelevant(user.id, messageContent);
        if (localMemory.isReady && (res as any)?.created) {
          const created = (res as any).created;
          try {
            await localMemory.addMemory({
              memory_type: created.memory_type,
              content: created.content,
              salience: created.salience,
              sensitive: false,
              topic_tags: created.topic_tags,
              source: 'chat',
              embedFromText: true,
            } as any);
          } catch (e) {
            console.warn('[local-memory] capture mirror failed', e);
          }
        }
      } catch (e) {
        console.warn('[memory] capture failed', e);
      }

      // Generate AI response via Supabase Edge Function (Claude Sonnet 4)
      let aiReplyText = "";
      try {
        const history = messages.slice(-8).map(m => ({
          role: m.sender_type === 'user' ? 'user' as const : 'assistant' as const,
          content: m.content,
        }));

        const { data, error } = await supabase.functions.invoke('claude-chat', {
          body: {
            persona: {
              id: persona.id,
              name: persona.name,
              description: persona.description,
              personality: persona.personality,
            },
            message: messageContent,
            history,
            ack,
          },
        });

        if (error) {
          console.error('Claude chat error:', error);
          aiReplyText = generatePersonaResponse(messageContent);
        } else {
          aiReplyText = data?.reply || generatePersonaResponse(messageContent);
        }
      } catch (e) {
        console.error('Claude chat exception:', e);
        aiReplyText = generatePersonaResponse(messageContent);
      }

      // Save persona message
      const { error: personaMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: aiReplyText,
          sender_type: 'persona'
        });

      if (personaMessageError) {
        console.error('Error sending persona message:', personaMessageError);
      }

      await fetchMessages();
      setSending(false);

    } catch (error) {
      console.error('Error in sendMessage:', error);
      setThinking(false);
      setSending(false);
    }
  }, [persona, isDemoMode, conversationId, user, ensureReady, localMemory, messages, toast, fetchMessages]);

  return {
    sendMessage,
    sending,
    thinking,
  };
};