import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ColorTheme {
  name: string;
  value: string;
  primary: string;
  secondary: string;
  accent: string;
  description: string;
}

const colorThemes: ColorTheme[] = [
  {
    name: "Powder Blue",
    value: "powder-blue",
    primary: "hsl(var(--powder-blue))",
    secondary: "hsl(var(--muted-gold))",
    accent: "hsl(var(--deep-green))",
    description: "Calm and nurturing"
  },
  {
    name: "Muted Gold",
    value: "muted-gold", 
    primary: "hsl(var(--muted-gold))",
    secondary: "hsl(var(--powder-blue))",
    accent: "hsl(var(--deep-green))",
    description: "Warm and reassuring"
  },
  {
    name: "Deep Green",
    value: "deep-green",
    primary: "hsl(var(--deep-green))",
    secondary: "hsl(var(--powder-blue))",
    accent: "hsl(var(--muted-gold))",
    description: "Natural and grounding"
  },
  {
    name: "Light Cyan",
    value: "light-cyan",
    primary: "hsl(var(--light-cyan))",
    secondary: "hsl(var(--powder-blue))",
    accent: "hsl(var(--muted-gold))",
    description: "Fresh and peaceful"
  },
  {
    name: "Dark Brown",
    value: "dark-brown",
    primary: "hsl(var(--dark-brown))",
    secondary: "hsl(var(--muted-gold))",
    accent: "hsl(var(--powder-blue))",
    description: "Stable and protective"
  }
];

interface ColorThemePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function ColorThemePicker({ value, onChange, label }: ColorThemePickerProps) {
  const [open, setOpen] = useState(false);
  
  const selectedTheme = colorThemes.find(theme => theme.value === value);

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-3">
              {selectedTheme ? (
                <>
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-4 h-4 rounded-full border border-border/50"
                      style={{ backgroundColor: selectedTheme.primary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-border/50" 
                      style={{ backgroundColor: selectedTheme.secondary }}
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-border/50"
                      style={{ backgroundColor: selectedTheme.accent }}
                    />
                  </div>
                  <span>{selectedTheme.name}</span>
                </>
              ) : (
                <>
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Select theme...</span>
                </>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b border-border">
            <h4 className="font-medium text-sm">Choose Color Theme</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Select a color theme that matches the persona's personality
            </p>
          </div>
          <div className="p-2">
            {colorThemes.map((theme) => (
              <button
                key={theme.value}
                className={cn(
                  "w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  value === theme.value && "bg-accent text-accent-foreground"
                )}
                onClick={() => {
                  onChange(theme.value);
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-1">
                  <div 
                    className="w-4 h-4 rounded-full border border-border/50 shadow-sm"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-border/50 shadow-sm" 
                    style={{ backgroundColor: theme.secondary }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-border/50 shadow-sm"
                    style={{ backgroundColor: theme.accent }}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{theme.name}</div>
                  <div className="text-xs text-muted-foreground">{theme.description}</div>
                </div>
                {value === theme.value && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}