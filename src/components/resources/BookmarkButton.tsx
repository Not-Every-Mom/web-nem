
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBookmarks } from "@/hooks/useBookmarks";

export const BookmarkButton = ({ resourceId, className }: { resourceId: string; className?: string }) => {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const active = isBookmarked(resourceId);

  return (
    <button
      aria-label={active ? "Remove bookmark" : "Save bookmark"}
      onClick={(e) => {
        e.stopPropagation();
        toggleBookmark(resourceId);
      }}
      className={cn(
        "rounded-md p-2 hover:bg-powder-blue/10 transition-colors",
        className
      )}
    >
      <Heart
        className={cn(
          "w-5 h-5",
          active ? "text-muted-gold fill-muted-gold" : "text-muted-foreground"
        )}
      />
    </button>
  );
};
