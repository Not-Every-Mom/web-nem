import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Edit, 
  Trash2, 
  Eye,
  ExternalLink
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { format } from "date-fns";

export type SortField = 'created_at' | 'updated_at' | 'title' | 'question' | 'category' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

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
}

interface ResourceItem extends BaseItem {
  title: string;
  description: string;
  type: string;
  url?: string;
  is_featured: boolean;
}

type ContentItem = FAQItem | ResourceItem;

interface ContentTableProps {
  items: ContentItem[];
  type: 'faq' | 'resource';
  sortConfig: SortConfig;
  onSort: (config: SortConfig) => void;
  selectedItems: string[];
  onItemSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (id: string) => void;
  onPreview: (item: ContentItem) => void;
  loading?: boolean;
}

export function ContentTable({
  items,
  type,
  sortConfig,
  onSort,
  selectedItems,
  onItemSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onPreview,
  loading = false
}: ContentTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    const newDirection = 
      sortConfig.field === field && sortConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc';
    onSort({ field, direction: newDirection });
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium text-left justify-start"
    >
      {children}
      {getSortIcon(field)}
    </Button>
  );

  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < items.length;

  if (loading) {
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              </TableHead>
              <TableHead><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableHead>
              <TableHead><div className="h-4 w-16 bg-muted rounded animate-pulse" /></TableHead>
              <TableHead><div className="h-4 w-16 bg-muted rounded animate-pulse" /></TableHead>
              <TableHead><div className="h-4 w-16 bg-muted rounded animate-pulse" /></TableHead>
              <TableHead><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><div className="h-4 w-4 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-32 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse" /></TableCell>
                <TableCell><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all items"
                className={someSelected ? "opacity-50" : ""}
              />
            </TableHead>
            <TableHead>
              <SortableHeader field={type === 'faq' ? 'question' : 'title'}>
                {type === 'faq' ? 'Question' : 'Title'}
              </SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="category">Category</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="status">Status</SortableHeader>
            </TableHead>
            {type === 'resource' && (
              <TableHead>Type</TableHead>
            )}
            <TableHead>
              <SortableHeader field="updated_at">Updated</SortableHeader>
            </TableHead>
            <TableHead className="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isSelected = selectedItems.includes(item.id);
            const isFAQ = 'question' in item;
            const isResource = 'title' in item;
            
            return (
              <TableRow
                key={item.id}
                className={`${isSelected ? 'bg-muted/50' : ''} ${
                  hoveredRow === item.id ? 'bg-muted/25' : ''
                }`}
                onMouseEnter={() => setHoveredRow(item.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onItemSelect(item.id, !!checked)}
                    aria-label={`Select ${isFAQ ? (item as FAQItem).question : (item as ResourceItem).title}`}
                  />
                </TableCell>
                <TableCell className="font-medium max-w-md">
                  <div className="truncate">
                    {isFAQ ? (item as FAQItem).question : (item as ResourceItem).title}
                  </div>
                  {isResource && (item as ResourceItem).description && (
                    <div className="text-sm text-muted-foreground truncate mt-1">
                      {(item as ResourceItem).description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {item.category && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                      {item.category}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
                {type === 'resource' && (
                  <TableCell>
                    <span className="capitalize text-sm">
                      {(item as ResourceItem).type}
                    </span>
                    {(item as ResourceItem).is_featured && (
                      <span className="ml-2 text-xs text-primary">★</span>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(item.updated_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPreview(item)}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {isResource && (item as ResourceItem).url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open((item as ResourceItem).url, '_blank')}
                        title="Open URL"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item.id)}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {items.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <div className="text-lg font-medium mb-2">No items found</div>
          <div className="text-sm">
            Try adjusting your filters or create a new {type === 'faq' ? 'FAQ' : 'resource'}.
          </div>
        </div>
      )}
    </div>
  );
}