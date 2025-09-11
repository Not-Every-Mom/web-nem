
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const CommunityFilters = ({
  search,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (v: string) => void;
}) => {
  return (
    <div className="space-y-3 mb-6">
      <div className="relative">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search discussions..."
          className="pl-3 font-body"
        />
      </div>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {["All", ...categories].map((cat) => {
          const value = cat.toLowerCase();
          const active = selectedCategory === value || (value === "all" && selectedCategory === "all");
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(value)}
              className={cn(
                "shrink-0",
              )}
            >
              <Badge
                variant={active ? "default" : "outline"}
                className={cn(
                  "font-body",
                  active ? "bg-powder-blue text-white" : "text-muted-foreground border-powder-blue/30"
                )}
              >
                {cat}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
};
