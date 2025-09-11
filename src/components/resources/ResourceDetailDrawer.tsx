
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

type Resource = {
  id: string;
  title: string;
  description: string;
  content_html?: string | null;
  type: string;
};

export const ResourceDetailDrawer = ({
  open,
  onOpenChange,
  resource,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: Resource | null;
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Focus management when drawer opens
  useEffect(() => {
    if (open && contentRef.current) {
      // Focus the content area when drawer opens
      contentRef.current.focus();
    }
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]" ref={contentRef} tabIndex={-1}>
        <DrawerHeader className="border-b border-powder-blue/20">
          <DrawerTitle className="font-heading text-deep-green" id="resource-title">
            {resource?.title}
          </DrawerTitle>
        </DrawerHeader>
        <div className="p-4">
          <ScrollArea 
            className="h-[60vh] pr-3"
            role="document" 
            aria-labelledby="resource-title"
            aria-describedby="resource-description"
          >
            {resource?.content_html ? (
              <div
                id="resource-description"
                className="prose prose-sm max-w-none font-body text-deep-green"
                dangerouslySetInnerHTML={{ __html: resource.content_html }}
              />
            ) : (
              <p id="resource-description" className="font-body text-muted-foreground">
                {resource?.description}
              </p>
            )}
          </ScrollArea>
          <div className="mt-4 flex justify-end">
            <DrawerClose asChild>
              <Button variant="outline" aria-label={`Close ${resource?.title || 'resource'} drawer`}>
                Close
              </Button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
