
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type Bookmark = {
  id: string;
  user_id: string;
  resource_id: string;
  created_at: string;
};

export const useBookmarks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ["resource-bookmarks", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resource_bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Bookmark[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const ids = new Set((bookmarks || []).map((b) => b.resource_id));

  const isBookmarked = (resourceId: string) => ids.has(resourceId);

  const toggleBookmark = async (resourceId: string) => {
    if (!user?.id) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save resources.",
        variant: "destructive",
      });
      return;
    }

    const already = isBookmarked(resourceId);

    if (already) {
      const { error } = await supabase
        .from("resource_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("resource_id", resourceId);

      if (error) {
        console.error("Error removing bookmark", error);
        toast({
          title: "Error",
          description: "Could not remove bookmark.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Removed from favorites" });
    } else {
      const { error } = await supabase.from("resource_bookmarks").insert({
        user_id: user.id,
        resource_id: resourceId,
      });

      if (error) {
        console.error("Error adding bookmark", error);
        toast({
          title: "Error",
          description: "Could not save resource.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Saved to favorites" });
    }

    await queryClient.invalidateQueries({ queryKey: ["resource-bookmarks", user.id] });
  };

  return {
    bookmarks: bookmarks || [],
    isLoading,
    isBookmarked,
    toggleBookmark,
    bookmarkedIds: ids,
  };
};
