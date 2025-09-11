import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, ExternalLink, X } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { format } from "date-fns";

interface BaseItem {
  id: string;
  created_at: string;
  updated_at: string;
  category: string | null;
  status: 'published' | 'draft' | 'archived';
}

interface FAQItem extends BaseItem {
  question: string;
  answer: string;
  content_html?: string;
}

interface ResourceItem extends BaseItem {
  title: string;
  description: string;
  type: string;
  url?: string;
  content_html?: string;
  content_markdown?: string;
  is_featured: boolean;
}

type ContentItem = FAQItem | ResourceItem;

interface ContentPreviewProps {
  item: ContentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: ContentItem) => void;
}

export function ContentPreview({ item, isOpen, onClose, onEdit }: ContentPreviewProps) {
  if (!item) return null;

  const isFAQ = 'question' in item;
  const isResource = 'title' in item;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl">
                {isFAQ ? (item as FAQItem).question : (item as ResourceItem).title}
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <StatusBadge status={item.status} />
                {item.category && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary">
                    {item.category}
                  </span>
                )}
                {isResource && (
                  <span className="capitalize">
                    {(item as ResourceItem).type}
                  </span>
                )}
                <span>
                  Updated {format(new Date(item.updated_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(item)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              {isResource && (item as ResourceItem).url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open((item as ResourceItem).url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open URL
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 mt-4">
          <div className="space-y-6">
            {/* Resource Description */}
            {isResource && (item as ResourceItem).description && (
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-muted-foreground">
                  {(item as ResourceItem).description}
                </p>
              </div>
            )}

            {/* Main Content */}
            <div>
              <h3 className="font-medium mb-2">
                {isFAQ ? 'Answer' : 'Content'}
              </h3>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {item.content_html ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: item.content_html }}
                    className="border rounded-lg p-4 bg-card"
                  />
                ) : (
                  <div className="border rounded-lg p-4 bg-card whitespace-pre-wrap">
                    {isFAQ ? (item as FAQItem).answer : (item as ResourceItem).description}
                  </div>
                )}
              </div>
            </div>

            {/* Resource URL */}
            {isResource && (item as ResourceItem).url && (
              <div>
                <h3 className="font-medium mb-2">Resource URL</h3>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono">
                    {(item as ResourceItem).url}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open((item as ResourceItem).url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Metadata</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <div>{format(new Date(item.created_at), 'PPP p')}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <div>{format(new Date(item.updated_at), 'PPP p')}</div>
                </div>
                {isResource && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Featured:</span>
                      <div>{(item as ResourceItem).is_featured ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <div className="capitalize">{(item as ResourceItem).type}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}