import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { useToast } from "@/hooks/use-toast";

// Reaction types and emoji mapping
const REACTIONS = [
  { type: "support" as const, emoji: "\uD83E\uDEF6", label: "Support" }, // 🫶
  { type: "like" as const, emoji: "\uD83D\uDC4D", label: "Like" }, // 👍
  { type: "cheer" as const, emoji: "\uD83C\uDF89", label: "Cheer" }, // 🎉
  { type: "sad" as const, emoji: "\uD83D\uDE22", label: "Sad" }, // 😢
  { type: "thinking" as const, emoji: "\uD83E\uDD14", label: "Thinking" }, // 🤔
];

interface ReactionsBarProps {
  threadId?: string;
  postId?: string;
  className?: string;
}

interface ReactionRow {
  id: string;
  user_id: string;
  reaction_type: "support" | "like" | "cheer" | "sad" | "thinking";
}

export const ReactionsBar = ({ threadId, postId, className = "" }: ReactionsBarProps) => {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const { toast } = useToast();

  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const scopeFilter = useMemo(() => {
    if (threadId) return { column: "thread_id", value: threadId } as const;
    return { column: "post_id", value: postId! } as const;
  }, [threadId, postId]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reactions) {
      map.set(r.reaction_type, (map.get(r.reaction_type) || 0) + 1);
    }
    return map;
  }, [reactions]);

  const userReaction = useMemo(() => {
    if (!user) return undefined;
    return reactions.find((r) => r.user_id === user.id)?.reaction_type;
  }, [reactions, user]);

  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase
        .from("forum_reactions")
        .select("id, user_id, reaction_type")
        .eq(scopeFilter.column, scopeFilter.value);
      if (error) throw error;
      setReactions(data || []);
    } catch (e) {
      console.error("Error loading reactions", e);
    }
  };

  useEffect(() => {
    fetchReactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, postId]);

  const handleReact = async (type: ReactionRow["reaction_type"]) => {
    if (isDemoMode) {
      toast({ title: "Demo Mode", description: "Reactions are disabled in demo mode." });
      return;
    }
    if (!user) {
      toast({ variant: "destructive", title: "Sign in required", description: "Please sign in to react." });
      return;
    }

    setLoading(true);
    try {
      if (userReaction === type) {
        // remove existing reaction
        const { error } = await supabase
          .from("forum_reactions")
          .delete()
          .eq("user_id", user.id)
          .eq(scopeFilter.column, scopeFilter.value);
        if (error) throw error;
      } else {
        // upsert new reaction
        const payload: any = {
          user_id: user.id,
          reaction_type: type,
        };
        payload[scopeFilter.column] = scopeFilter.value;

        const { error } = await supabase
          .from("forum_reactions")
          .upsert(payload, { onConflict: scopeFilter.column === "thread_id" ? "user_id,thread_id" : "user_id,post_id" });
        if (error) throw error;
      }
      await fetchReactions();
    } catch (e) {
      console.error("Error updating reaction", e);
      toast({ variant: "destructive", title: "Reaction failed", description: "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 pt-2 ${className}`}>
      {REACTIONS.map((r) => {
        const isActive = userReaction === r.type;
        const count = counts.get(r.type) || 0;
        return (
          <Button
            key={r.type}
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            disabled={loading}
            className={isActive ? "bg-gradient-primary text-white border-transparent" : "border-powder-blue/30"}
            onClick={() => handleReact(r.type)}
            aria-label={`${r.label} reaction`}
            title={r.label}
          >
            <span className="mr-1" aria-hidden>
              {r.emoji}
            </span>
            <span className="font-body text-sm text-deep-green">
              {count}
            </span>
          </Button>
        );
      })}
    </div>
  );
};

export default ReactionsBar;
