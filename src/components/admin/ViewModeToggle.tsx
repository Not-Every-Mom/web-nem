import { Grid, List, Table } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewMode = 'grid' | 'table' | 'list';

interface ViewModeToggleProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ currentMode, onModeChange }: ViewModeToggleProps) {
  const modes = [
    { id: 'grid' as const, icon: Grid, label: 'Grid View' },
    { id: 'table' as const, icon: Table, label: 'Table View' },
    { id: 'list' as const, icon: List, label: 'List View' },
  ];

  return (
    <div className="flex border rounded-md">
      {modes.map((mode) => {
        const Icon = mode.icon;
        return (
          <Button
            key={mode.id}
            variant={currentMode === mode.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onModeChange(mode.id)}
            className="rounded-none first:rounded-l-md last:rounded-r-md"
            title={mode.label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}