import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const SupportSafetyBanner = () => {
  return (
    <Card className="mb-4 border-powder-blue/30 bg-card/60 backdrop-blur-sm">
      <CardContent className="py-3 px-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-primary/80 text-white flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="text-left">
          <p className="font-heading text-sm text-foreground">Support & Safety</p>
          <p className="font-body text-xs text-muted-foreground">
            This app offers emotional support, not medical advice. If you’re in crisis, contact local emergency services or your regional helpline.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportSafetyBanner;
