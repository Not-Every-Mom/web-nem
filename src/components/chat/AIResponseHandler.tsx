import { supabase } from "@/integrations/supabase/client";
import type { Message, Persona } from "./types";
import { generatePersonaResponse } from "./DemoMessageHandler";
import { generateLocalReply } from "@/lib/localLLM";

/**
 * Params for AI response generation. onAppendDemoMessages is optional and,
 * when provided, will be used to append the assistant reply to the UI
 * immediately while DB write proceeds in background.
 */
interface AIResponseParams {
  persona: Persona;
  messageContent: string;
  messages: Message[];
  conversationId: string;
  memoryAcknowledgment?: string;
  onMessagesUpdate: () => Promise<void>;
  onAppendDemoMessages?: (msgs: Message | Message[]) => void;
}

/**
 * Utility to race a promise against a timeout (rejects with Error('timeout')).
 *
 * NOTE: use a function declaration to avoid TSX parsing ambiguities with
 * generic arrow functions in .tsx files.
 */
async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

export const generateAndSaveAIResponse = async ({
  persona,
  messageContent,
  messages,
  conversationId,
  memoryAcknowledgment,
  onMessagesUpdate,
  onAppendDemoMessages
}: AIResponseParams): Promise<void> => {
  let aiReplyText = "";

  try {
    const history = messages.slice(-8).map(m => ({
      role: m.sender_type === 'user' ? 'user' as const : 'assistant' as const,
      content: m.content,
    }));

    console.log('[AI] invoking edge function claude-chat (with 10s timeout)', {
      personaId: persona.id,
      conversationId,
      messageContent,
      historyLength: history.length,
      ack: memoryAcknowledgment,
    });

    try {
      // Race the edge function call with a 10s timeout.
      const invokePromise = supabase.functions.invoke('claude-chat', {
        body: {
          persona: {
            id: persona.id,
            name: persona.name,
            description: persona.description,
            personality: persona.personality,
            specialty: persona.specialty,
            profile: persona.profile,
          },
          message: messageContent,
          history,
          ack: memoryAcknowledgment,
        }
      });

      // The Supabase invoke result shape is not strongly typed here; treat result as unknown
      const invokeResult = await withTimeout(invokePromise as Promise<unknown>, 10000);
      const resultObj = (invokeResult && typeof invokeResult === 'object') ? (invokeResult as Record<string, unknown>) : undefined;
      const data = resultObj?.data;
      const error = resultObj?.error;
      console.log('[AI] edge function result', { data, error });

      if (error) {
        // Edge function returned an error object; treat as failure to trigger fallback
        throw error;
      }

      // Try to coerce a reply string from the edge function result if present.
      let replyFromData: string | undefined;
      if (data && typeof data === 'object') {
        const dObj = data as Record<string, unknown>;
        const maybe = dObj['reply'];
        if (typeof maybe === 'string') {
          replyFromData = maybe;
        } else if (maybe != null) {
          try {
            replyFromData = String(maybe);
          } catch {
            replyFromData = undefined;
          }
        }
      }
      aiReplyText = replyFromData ?? generatePersonaResponse(messageContent, persona);
    } catch (e) {
      // Edge function timed out or failed — try local LLM fallback then canned persona response.
      console.warn('[AI] edge function failed or timed out, attempting localLLM fallback', e);

      // Build a compact prompt similar to DemoMessageHandler
      const promptParts = [
        persona.profile?.description || persona.name || "You are a helpful assistant.",
        `Persona tone: ${persona.profile?.communication?.tone || persona.name || "neutral"}`,
        "User message:",
        messageContent,
        "Reply concisely in one or two short paragraphs, stay in-character for the persona."
      ];
      const prompt = promptParts.filter(Boolean).join("\n\n");

      try {
        // Try local generator with a short timeout (3s)
        const local = await Promise.race([
          generateLocalReply(prompt, { max_new_tokens: 120 }),
          new Promise<string>((_, reject) => setTimeout(() => reject(new Error('local-llm-timeout')), 3000))
        ]) as string;

        if (local && local.trim().length > 0) {
          aiReplyText = local.trim();
          console.log('[AI] localLLM produced a reply (fallback)');
        } else {
          aiReplyText = generatePersonaResponse(messageContent, persona);
          console.log('[AI] localLLM produced empty reply, falling back to canned persona response');
        }
      } catch (le) {
        console.warn('[AI] localLLM fallback failed or timed out', le);
        aiReplyText = generatePersonaResponse(messageContent, persona);
      }
    }
  } catch (error) {
    console.error('[AI] unexpected error during generation flow', error);
    aiReplyText = generatePersonaResponse(messageContent, persona);
  }

  // Create the assistant message object to append immediately if requested.
  const assistantMessage: Message = {
    id: (Date.now() + 3).toString(),
    content: aiReplyText,
    sender_type: "persona" as const,
    created_at: new Date().toISOString(),
  } as Message;

  // If caller provided an append callback (UI immediate update), use it now.
  if (onAppendDemoMessages) {
    try {
      onAppendDemoMessages(assistantMessage);
    } catch (e) {
      console.warn('[AI] onAppendDemoMessages callback failed', e);
    }
  }

  // Save persona response after a short delay to simulate typing and to avoid
  // tightly coupling UI append with DB write latency.
  setTimeout(async () => {
    console.log('[AI] saving persona reply to DB', { conversationId, aiReplyText });

    const { error: personaMessageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: aiReplyText,
        sender_type: 'persona'
      });

    if (personaMessageError) {
      console.error('Error sending persona message:', personaMessageError);
      // Even if DB write fails, still attempt to notify the UI consumers.
    } else {
      console.log('[AI] persona message saved successfully');
    }

    try {
      await onMessagesUpdate();
    } catch (e) {
      console.warn('[AI] onMessagesUpdate failed after saving persona message', e);
    }
  }, 1000 + Math.random() * 2000);
};
