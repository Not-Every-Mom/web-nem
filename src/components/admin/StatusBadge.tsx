import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: 'published' | 'draft' | 'archived';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'published':
        return '●';
      case 'draft':
        return '○';
      case 'archived':
        return '◐';
      default:
        return '○';
    }
  };

  return (
    <Badge variant={getVariant()} className={cn("capitalize", className)}>
      <span className="mr-1">{getIcon()}</span>
      {status}
    </Badge>
  );
}