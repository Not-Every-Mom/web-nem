/* Hook: useChatInterfaceController.tsx
   Extracted orchestration and state management from ChatInterface to keep the component small.
   Adds support for client-only demoMessages which the demo flow can append to so the UI
   shows messages immediately without waiting on DB fetches.
*/

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useChatHeader } from "@/hooks/useChatHeader";
import { useChatComposer } from "@/hooks/useChatComposer";
import { useEmbeddings } from "@/hooks/useEmbeddings";
import { useMessageHandler } from "./MessageHandler";
import { useChatData } from "./useChatData";
import type { Message } from "./types";

export function useChatInterfaceController() {
  const navigate = useNavigate();
  const { show, update, hide } = useChatHeader();
  const { show: showComposer, update: updateComposer, hide: hideComposer } = useChatComposer();
  
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isLoading: modelLoading } = useEmbeddings();
  
  const { persona, conversation, messages, loading, fetchMessages } = useChatData();

  // Demo-mode message list (client-only) to display immediate appended messages
  const [demoMessages, setDemoMessages] = useState<Message[]>([]);

  const appendDemoMessages = (newMsgs: Message | Message[]) => {
    setDemoMessages((prev) => {
      const arr = Array.isArray(newMsgs) ? newMsgs : [newMsgs];
      return [...prev, ...arr];
    });
  };
  
  const { sendMessage } = useMessageHandler({
    persona: persona!,
    // Use the current conversation id from useChatData so the handler can
    // save messages to the right conversation. If no conversation is present
    // yet, undefined is acceptable (handler will handle demo/no-user flows).
    conversationId: conversation?.id,
    messages,
    // When new messages are written to the DB (e.g., AI response saved),
    // ask the data hook to refresh the messages so the UI updates.
    onMessagesUpdate: fetchMessages,
    onThinkingChange: setThinking,
    onSendingChange: setSending,
    // NOTE: we don't type this in the handler props yet; it's optional and the
    // demo implementation will import DemoMessageHandler directly and call
    // the append callback when available. The handler will check presence.
    // onAppendDemoMessages is passed via the options object if the handler supports it.
    onAppendDemoMessages: appendDemoMessages,
  });

  // Keep stable refs to the latest sendMessage and newMessage so we can
  // register an onSubmit callback with the composer without forcing the
  // composer show effect to re-run whenever sendMessage/newMessage change.
  const sendMessageRef = useRef(sendMessage);
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  const newMessageRef = useRef(newMessage);
  useEffect(() => {
    newMessageRef.current = newMessage;
  }, [newMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, demoMessages]);

  // Manage header in app shell
  useEffect(() => {
    if (persona) {
      show({
        title: persona.display_name || persona.name,
        subtitle: "Online",
        onBack: () => navigate('/app')
      });
    }
    return () => hide();
  }, [persona, show, hide, navigate]);

  useEffect(() => {
    if (persona) {
      const subtitle = modelLoading
        ? "Warming up…"
        : sending
          ? "Typing…"
          : "Online";
      update({ subtitle });
    }
  }, [modelLoading, sending, persona, update]);

  // Manage composer in app shell
  useEffect(() => {
    if (persona) {
      showComposer({
        value: newMessage,
        onChange: setNewMessage,
        // Call the latest sendMessage/newMessage via refs so this effect's
        // dependency list can stay small and avoid re-running every render.
        onSubmit: () => {
          // Debug logging to confirm composer onSubmit fires and what values are present.
          // This helps diagnose cases where the UI doesn't appear to send messages.
          // (This log is temporary and can be removed after debugging.)
          // eslint-disable-next-line no-console
          console.log("[Composer] onSubmit triggered", {
            newMessageRef: newMessageRef.current,
            hasSendMessage: !!sendMessageRef.current,
            conversationId: conversation?.id,
          });
          return Promise.resolve(
            sendMessageRef.current ? sendMessageRef.current(newMessageRef.current) : undefined
          ).then(() => setNewMessage(""));
        },
        placeholder: `Message ${persona.display_name || persona.name}...`,
      });
    }
    return () => hideComposer();
  }, [persona, showComposer, hideComposer]);

  useEffect(() => {
    updateComposer({
      value: newMessage,
      disabled: sending || modelLoading || !newMessage.trim(),
      inputDisabled: sending || modelLoading,
    });
  }, [newMessage, sending, modelLoading, updateComposer]);

  return {
    navigate,
    persona,
    // Prefer DB-backed messages when present; otherwise show demoMessages.
    messages: (messages && messages.length > 0) ? messages : demoMessages,
    demoMessages,
    loading,
    newMessage,
    setNewMessage,
    sending,
    thinking,
    messagesEndRef,
    modelLoading,
  };
}

export default useChatInterfaceController;
