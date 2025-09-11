// ResourceList.tsx
// Extracted Resource rendering (table / grid / list) from AdminContentPage

import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Edit, Trash2, Settings } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ContentTable, SortConfig } from './ContentTable'; // keep relative to existing module location
import { StatusBadge } from './StatusBadge';

interface ResourceListProps {
  viewMode: 'grid' | 'list' | 'table';
  isMobile: boolean;
  loading: boolean;
  items: any[]; // resource items
  selectedItems: string[];
  sortConfig: SortConfig;
  onSort: (cfg: SortConfig) => void;
  onItemSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onEdit: (item: any) => void;
  onEditEnhanced: (item: any) => void;
  onDelete: (id: string) => void;
  onPreview: (item: any) => void;
}

export const ResourceList: React.FC<ResourceListProps> = ({
  viewMode,
  isMobile,
  loading,
  items,
  selectedItems,
  sortConfig,
  onSort,
  onItemSelect,
  onSelectAll,
  onEdit,
  onEditEnhanced,
  onDelete,
  onPreview,
}) => {
  if (viewMode === 'table') {
    return (
      <ContentTable
        items={items as any}
        type="resource"
        sortConfig={sortConfig}
        onSort={onSort}
        selectedItems={selectedItems}
        onItemSelect={onItemSelect}
        onSelectAll={onSelectAll}
        onEdit={onEdit}
        onDelete={(id) => onDelete(id)}
        onPreview={onPreview}
        loading={loading}
      />
    );
  }

  return (
    <div className={`grid gap-4 ${viewMode === 'list' ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
      {loading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))
      ) : items.length ? (
        items.map((resource) => (
          <Card key={resource.id} className={viewMode === 'list' ? 'flex' : ''}>
            <CardHeader className={viewMode === 'list' ? 'flex-1' : ''}>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    {resource.title}
                    {resource.is_featured && <span className="text-primary">★</span>}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={resource.status as 'published' | 'draft' | 'archived'} />
                    <CardDescription className="text-xs capitalize">{resource.type}</CardDescription>
                    {resource.category && (
                      <CardDescription className="text-xs">{resource.category}</CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => onPreview(resource)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(resource)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onEditEnhanced(resource)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this resource? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(resource.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            {viewMode !== 'list' && (
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{resource.description}</p>
                {resource.url && (
                  <p className="text-xs text-muted-foreground mt-2 truncate">
                    URL: {resource.url}
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        ))
      ) : (
        <div className="col-span-full text-center py-8">
          <p className="text-muted-foreground">No resources found</p>
        </div>
      )}
    </div>
  );
};

export default ResourceList;
