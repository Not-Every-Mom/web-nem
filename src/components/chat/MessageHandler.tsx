/* eslint-disable @typescript-eslint/no-explicit-any */
/* MessageHandler: handles send flow and includes optional demo-mode append callback.
   We allow a narrow use of `any` for the dynamic demo handler import to avoid
   tight coupling with evolving demo/local-llm types. */
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { useToast } from "@/hooks/use-toast";
import { useEmbeddings } from "@/hooks/useEmbeddings";
import { useLocalMemory } from "@/hooks/useLocalMemory";
import { supabase } from "@/integrations/supabase/client";
import { captureMemoryIfRelevant } from "@/lib/memory/capture";
import type { Message, Persona } from "./types";
import type { MemoryItem } from "@/lib/memory/types";

interface MessageHandlerProps {
  persona: Persona;
  conversationId?: string;
  messages: Message[];
  onMessagesUpdate: () => Promise<void>;
  onThinkingChange: (thinking: boolean) => void;
  onSendingChange: (sending: boolean) => void;
  // Optional callback to append demo-mode messages directly to UI
  onAppendDemoMessages?: (msgs: Message | Message[]) => void;
}

export interface MessageHandlerReturn {
  sendMessage: (messageContent: string) => Promise<void>;
}

export const useMessageHandler = ({
  persona,
  conversationId,
  messages,
  onMessagesUpdate,
  onThinkingChange,
  onSendingChange,
  onAppendDemoMessages,
}: MessageHandlerProps): MessageHandlerReturn => {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const { toast } = useToast();
  const { ensureReady } = useEmbeddings();
  
  // Local on-device memory engine (passphrase optional)
  const kek = typeof window !== 'undefined' ? (localStorage.getItem('localMemory.kek') || undefined) : undefined;
  const localMemory = useLocalMemory(kek);

  const validateAndPrepareMessage = (content: string): string => {
    const trimmedContent = content.trim();
    if (!trimmedContent || !persona) {
      throw new Error('Invalid message content or persona');
    }
    return trimmedContent;
  };

  const handleDemoMode = async (messageContent: string, appendCb?: (msgs: Message | Message[]) => void): Promise<void> => {
    // Import dynamically and treat as 'any' to avoid tight type coupling across modules.
    // The DemoMessageHandler may evolve; using a dynamic call lets us pass the optional appendCb.
    const mod = await import('./DemoMessageHandler');
    const addDemoMessage = (mod as any).addDemoMessage || (mod as any).default;
    // addDemoMessage will append assistant reply via appendCb when available
    await addDemoMessage(messageContent, persona, onMessagesUpdate, appendCb);
  };

  const sendMessage = async (messageContent: string): Promise<void> => {
    try {
      const validatedContent = validateAndPrepareMessage(messageContent);
      console.log('[Chat] sendMessage', { 
        messageContent: validatedContent, 
        personaId: persona.id, 
        isDemoMode, 
        conversationId, 
        userId: user?.id 
      });

      onSendingChange(true);

      // Handle demo mode separately: append user immediately, then generate demo reply
      if (isDemoMode || !conversationId || !user) {
        const demoUserMessage: Message = {
          id: Date.now().toString(),
          content: validatedContent,
          sender_type: 'user',
          created_at: new Date().toISOString(),
        } as Message;

        if (onAppendDemoMessages) {
          onAppendDemoMessages(demoUserMessage);
        }

        // Show thinking/typing UI while demo reply is generated
        onThinkingChange(true);
        await handleDemoMode(validatedContent, onAppendDemoMessages);
        onThinkingChange(false);
        return;
      }

      // Kick off embeddings warmup in background — do not block send flow.
      // We still show the thinking indicator while we retrieve memory, but we
      // won't await ensureReady() here because it can hang in some environments.
      onThinkingChange(true);
      ensureReady().catch((e) => {
        console.warn('[embeddings] ensureReady failed (background)', e);
      });

      // Get memory context but don't let embeddings/memory warmup block send flow.
      const { retrieveMemoryContext } = await import('./MemoryIntegration');
      let memoryAcknowledgment: string | undefined;
      try {
        memoryAcknowledgment = await Promise.race([
          retrieveMemoryContext(validatedContent, user.id, localMemory),
          new Promise<string | undefined>((resolve) =>
            setTimeout(() => {
              console.warn('[memory] retrieveMemoryContext timed out after 1500ms, proceeding without memory ack');
              resolve(undefined);
            }, 1500)
          )
        ]);
      } catch (e) {
        console.warn('[memory] retrieve failed', e);
        memoryAcknowledgment = undefined;
      }

      onThinkingChange(false);

      // Append user message immediately to UI (so the sender sees their message instantly)
      const userMessage: Message = {
        id: Date.now().toString(),
        content: validatedContent,
        sender_type: 'user',
        created_at: new Date().toISOString(),
      } as Message;

      if (onAppendDemoMessages) {
        onAppendDemoMessages(userMessage);
      }

      // Save user message to database
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: validatedContent,
          sender_type: 'user'
        });

      if (userMessageError) {
        console.error('Error sending user message:', userMessageError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to send message"
        });
        return;
      }

      // Attempt to capture memory (fire-and-forget)
      void captureUserMemory(user.id, validatedContent, localMemory).catch((e) => {
        console.warn('[memory] captureUserMemory failed (async)', e);
      });

      // Generate and save AI response
      const { generateAndSaveAIResponse } = await import('./AIResponseHandler');
      await generateAndSaveAIResponse({
        persona,
        messageContent: validatedContent,
        messages,
        conversationId,
        memoryAcknowledgment,
        onMessagesUpdate,
        onAppendDemoMessages
      });

    } catch (error) {
      console.error('Error in sendMessage:', error);
      onThinkingChange(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message"
      });
    } finally {
      onSendingChange(false);
      onThinkingChange(false);
    }
  };

  return { sendMessage };
};

const captureUserMemory = async (
  userId: string,
  messageContent: string,
  localMemory: ReturnType<typeof useLocalMemory>
): Promise<void> => {
  try {
    const res = await captureMemoryIfRelevant(userId, messageContent);
    if (localMemory.isReady && res && typeof res === 'object' && 'created' in res) {
      const created = (res as { created: MemoryItem }).created;
      try {
        await localMemory.addMemory({
          memory_type: created.memory_type,
          content: created.content,
          salience: created.salience,
          sensitive: false,
          topic_tags: created.topic_tags,
          source: 'chat',
          embedFromText: true,
        });
      } catch (e) {
        console.warn('[local-memory] capture mirror failed', e);
      }
    }
  } catch (e) {
    console.warn('[memory] capture failed', e);
  }
};
