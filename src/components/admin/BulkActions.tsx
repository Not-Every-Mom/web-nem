import { Trash2, Archive, Eye, EyeOff, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from "react";

interface BulkActionsProps {
  selectedCount: number;
  onBulkStatusChange: (status: 'published' | 'draft' | 'archived') => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

export function BulkActions({ 
  selectedCount, 
  onBulkStatusChange, 
  onBulkDelete, 
  onClearSelection 
}: BulkActionsProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  if (selectedCount === 0) return null;

  const handleStatusChange = (status: string) => {
    if (status === 'published' || status === 'draft' || status === 'archived') {
      onBulkStatusChange(status);
      onClearSelection();
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span>{selectedCount} item{selectedCount !== 1 ? 's' : ''} selected</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Status Change */}
        <Select onValueChange={handleStatusChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Change status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="published">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Publish
              </div>
            </SelectItem>
            <SelectItem value="draft">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Draft
              </div>
            </SelectItem>
            <SelectItem value="archived">
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Archive
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Delete Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedCount} item{selectedCount !== 1 ? 's' : ''}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onBulkDelete();
                  onClearSelection();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete {selectedCount} item{selectedCount !== 1 ? 's' : ''}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clear Selection */}
        <Button variant="outline" size="sm" onClick={onClearSelection}>
          Clear Selection
        </Button>
      </div>
    </div>
  );
}