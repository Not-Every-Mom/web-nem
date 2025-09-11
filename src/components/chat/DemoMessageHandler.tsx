import type { Message, Persona } from "./types";

/**
 * Simple canned response generator used as a fallback when local model
 * generation is unavailable or times out.
 */
export const generatePersonaResponse = (userMessage: string, persona: Persona): string => {
  if (!persona) return "I'm here to help you.";

  // Prefer persona.profile communication samples if available
  const samples = persona.profile?.communication?.samplePhrases;
  if (samples && samples.length > 0) {
    return samples[Math.floor(Math.random() * samples.length)];
  }

  // Fallback to name-based canned responses
  const responses: Record<string, string[]> = {
    "The Compassionate Nurturer": [
      "I'm so glad you shared this. You're safe with me; let's take a slow breath together.",
      "What you're feeling makes sense. Nothing is wrong with you; your system is protecting you.",
      "We can go at your pace. Would you like comfort first, or a gentle next step?",
    ],
    "The Wise Advisor": [
      "Let's zoom out for a moment. What evidence supports each option, and what values matter most?",
      "I notice themes around fairness and attachment. A small experiment could give us data.",
      "Here's a simple framework: name it, normalize it, and choose one doable action.",
    ],
    "The Passionate Rebel": [
      "Your 'no' is sacred. Which boundary would feel empowering to try first?",
      "Guilt often shows up when we grow. That's a sign of change, not a mistake.",
      "Let's script one bold sentence you can say without apology.",
    ],
    "The Resilient Survivor": [
      "You're not broken—you're adapting. Let's pick one next step you can do today.",
      "How about a 10-minute plan: water, food, one message, and rest?",
      "If things spike, what's your safety plan? I can help outline it.",
    ],
  };

  const personaResponses = responses[persona.name] || responses["The Compassionate Nurturer"];
  return personaResponses[Math.floor(Math.random() * personaResponses.length)];
};

/**
 * Try to generate a reply using a tiny local model (if available).
 * If it fails or times out, fall back to canned responses.
 *
 * This function does not mutate UI directly; callers should append
 * the returned message to UI state (or call onMessagesUpdate).
 */
/* tryGenerateLocalReply
   - Dynamically loads the localLLM helper (tries relative path then alias).
   - Uses a short timeout and returns empty string on failure so caller
     will fall back to canned responses.
*/
const tryGenerateLocalReply = async (messageContent: string, persona: Persona, timeoutMs = 3000): Promise<string> => {
  // Build prompt once (safe and synchronous)
  const promptParts = [
    persona.profile?.description || persona.name || "You are a helpful assistant.",
    `Persona tone: ${persona.profile?.communication?.tone || persona.name || "neutral"}`,
    "User message:",
    messageContent,
    "Reply concisely in one or two short paragraphs, stay in-character for the persona."
  ];
  const prompt = promptParts.filter(Boolean).join("\n\n");

  try {
    // Try relative import first (works in most runtimes), then alias import.
    // We treat the imported module as unknown and then check for the function we need.
    let generateLocalReplyFn: unknown = null;
    try {
      // Relative path import
      // We cast to a narrowed interface to avoid use of `any` so lint rules are satisfied.
      const rel = await import("../../lib/localLLM");
      const relMod = rel as { generateLocalReply?: (prompt: string, opts?: unknown) => Promise<string>; default?: { generateLocalReply?: (prompt: string, opts?: unknown) => Promise<string> } };
      generateLocalReplyFn = relMod.generateLocalReply ?? relMod.default?.generateLocalReply ?? null;
    } catch (_) {
      try {
        const alias = await import("@/lib/localLLM");
        const aliasMod = alias as { generateLocalReply?: (prompt: string, opts?: unknown) => Promise<string>; default?: { generateLocalReply?: (prompt: string, opts?: unknown) => Promise<string> } };
        generateLocalReplyFn = aliasMod.generateLocalReply ?? aliasMod.default?.generateLocalReply ?? null;
      } catch (_) {
        generateLocalReplyFn = null;
      }
    }

    if (!generateLocalReplyFn || typeof generateLocalReplyFn !== "function") {
      // No local generator available
      return "";
    }

    // Call generator with timeout
    const genPromise = (generateLocalReplyFn as (p: string, o?: unknown) => Promise<string>)(prompt);
    const result = (await Promise.race([
      genPromise,
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error("local-llm-timeout")), timeoutMs)),
    ])) as string;

    if (result && result.trim().length > 0) return result.trim();
    return "";
  } catch (e) {
    // Any failure -> fall back to canned responses (caller handles empty string)
    return "";
  }
};

/**
 * Append a demo message flow. The parent component can pass an append callback
 * (appendCb) that receives Message objects to be inserted into the client UI immediately.
 *
 * Signature:
 *   addDemoMessage(messageContent, persona, onMessagesUpdate, appendCb?)
 *
 * Behavior:
 * - If appendCb is provided, we assume the parent will append the user message
 *   (MessageHandler already appends it) and we will append the assistant reply via appendCb.
 * - If appendCb is not provided, we call onMessagesUpdate() after a short delay so
 *   components that rely on fetching will still update (legacy fallback).
 */
export const addDemoMessage = async (
  messageContent: string,
  persona: Persona,
  onMessagesUpdate: () => Promise<void>,
  appendCb?: (msgs: Message | Message[]) => void
): Promise<void> => {
  // Attempt to generate via local LLM (fast path). If it times out or fails,
  // fall back to canned persona responses.
  const localReply = await tryGenerateLocalReply(messageContent, persona, 2500);
  const replyText = localReply || generatePersonaResponse(messageContent, persona);

  const demoPersonaResponse: Message = {
    id: (Date.now() + 2).toString(),
    content: replyText,
    sender_type: "persona" as const,
    created_at: new Date().toISOString(),
  } as Message;

  if (appendCb) {
    // Append assistant reply directly to the UI
    appendCb(demoPersonaResponse);
  } else {
    // Fallback: call the parent's onMessagesUpdate (older flow that expects DB)
    // Simulate a small network/deliberation delay so UX feels natural.
    setTimeout(async () => {
      try {
        await onMessagesUpdate();
      } catch (e) {
        // swallow
      }
    }, 800 + Math.random() * 1200);
  }
};
