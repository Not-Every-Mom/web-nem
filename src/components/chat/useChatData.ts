/* Chat data fetching and management hook
   Handles persona, conversation, and messages data.
   NOTE: added auto-create/reuse conversation behavior when personaId exists,
   user is authenticated, and conversationId is missing. This will navigate the
   app to /app/chat/:personaId/:conversationId so the normal DB-backed flow runs.
*/

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { useToast } from "@/hooks/use-toast";
import type { Message, Persona, Conversation } from "./types";

export const useChatData = () => {
  const { personaId, conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const { toast } = useToast();

  const [persona, setPersona] = useState<Persona | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPersona = useCallback(async () => {
    if (!personaId) return;
    try {
      const { data, error } = await supabase
        .from("personas")
        .select("*")
        .eq("id", personaId)
        .single();

      if (error) {
        console.error("Error fetching persona:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load persona information",
        });
        return;
      }

      setPersona(data as Persona);
    } catch (error) {
      console.error("Error fetching persona:", error);
    } finally {
      setLoading(false);
    }
  }, [personaId, toast]);

  const fetchConversation = useCallback(async () => {
    if (!user || !conversationId) return;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching conversation:", error);
        return;
      }

      setConversation(data);
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  }, [conversationId, user]);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      const typedMessages: Message[] = (data || []).map((msg) => ({
        ...msg,
        sender_type: msg.sender_type as "user" | "persona",
      }));

      setMessages(typedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [conversationId]);

  // Ensure an authenticated user on a persona-only route gets a conversation.
  useEffect(() => {
    const ensureConversation = async () => {
      if (!personaId || conversationId || !user) return;

      try {
        // Try to find an existing conversation for this user+persona
        const { data: existing, error: fetchErr } = await supabase
          .from("conversations")
          .select("*")
          .eq("user_id", user.id)
          .eq("persona_id", personaId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchErr) {
          console.error("Error checking existing conversation:", fetchErr);
        }

        if (existing) {
          // navigate to the existing conversation route
          navigate(`/app/chat/${personaId}/${existing.id}`, { replace: true });
          return;
        }

        // No existing conversation — create one
        const title = persona?.name ?? "Conversation";
        const { data: created, error: insertErr } = await supabase
          .from("conversations")
          .insert({
            user_id: user.id,
            persona_id: personaId,
            title,
          })
          .select()
          .single();

        if (insertErr) {
          console.error("Error creating conversation:", insertErr);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not create conversation",
          });
          return;
        }

        if (created) {
          setConversation(created as Conversation);
          navigate(`/app/chat/${personaId}/${(created as Conversation).id}`, { replace: true });
        }
      } catch (err) {
        console.error("ensureConversation error:", err);
      }
    };

    // Only run when on a persona-only route and we have an authenticated user
    if (personaId && !conversationId && user && !isDemoMode) {
      ensureConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId, conversationId, user, persona, isDemoMode, navigate]);

  useEffect(() => {
    if (personaId) {
      fetchPersona();
      if (conversationId && (user || isDemoMode)) {
        fetchConversation();
        fetchMessages();
      }
    }
  }, [personaId, conversationId, user, isDemoMode, fetchPersona, fetchConversation, fetchMessages]);

  return {
    persona,
    conversation,
    messages,
    loading,
    fetchMessages,
  };
};
