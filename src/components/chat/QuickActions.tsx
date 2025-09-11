import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface QuickActionsProps {
  profile?: any;
  onInsert: (text: string) => void;
}

const titleMap: Record<string, string> = {
  regulation: "Regulate",
  boundaries: "Set Boundary",
  processing: "Process Trauma",
  selfCompassion: "Self‑Compassion",
  intergenerational: "Break Pattern",
  secureAttachment: "Build Security",
  emotionalVocabulary: "Name Feelings",
};

export default function QuickActions({ profile, onInsert }: QuickActionsProps) {
  const specs = profile?.healingSpecializations || {};
  const entries = Object.entries(specs).slice(0, 4) as Array<[
    string,
    { technique?: string; script?: string }
  ]>;

  if (!entries.length) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2 px-2">
        <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Try a quick practice</p>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-2">
        {entries.map(([key, val]) => {
          const label = titleMap[key] || key;
          const script = val?.script || val?.technique || label;
          return (
            <Button
              key={key}
              variant="secondary"
              size="sm"
              className="shrink-0 h-8"
              onClick={() => onInsert(script)}
            >
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
