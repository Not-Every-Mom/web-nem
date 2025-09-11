// AdminContentHeader.tsx
// Reusable header used by the AdminContentPage for FAQ and Resources tabs.

import React from 'react';
import { ViewMode } from '@/components/admin/ViewModeToggle';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface Props {
  type: 'faq' | 'resource';
  count: number;
  isMobile: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenCreate: () => void;
  onOpenEnhancedEditor: () => void;
  DialogContentNode: React.ReactNode;
}

export const AdminContentHeader: React.FC<Props> = ({
  type,
  count,
  isMobile,
  viewMode,
  onViewModeChange,
  onOpenCreate,
  onOpenEnhancedEditor,
  DialogContentNode
}) => {
  const title = type === 'faq' ? `FAQ Items (${count})` : `Learning Resources (${count})`;
  const addLabel = type === 'faq' ? 'Add FAQ' : 'Add Resource';
  const enhancedLabel = type === 'faq' ? 'Enhanced Editor' : 'Enhanced Editor';

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      <h2 className="text-xl font-semibold">{title}</h2>

      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
        {!isMobile && (
          // ViewModeToggle is rendered by the consumer through onViewModeChange prop
          // so this component only provides the area for it if caller wants it.
          <div className="mr-2" />
        )}

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size={isMobile ? 'sm' : 'default'} onClick={onOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                {addLabel}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{addLabel}</DialogTitle>
                <DialogDescription>
                  Create a new {type === 'faq' ? 'FAQ item' : 'resource'}.
                </DialogDescription>
              </DialogHeader>
              {DialogContentNode}
              <DialogFooter>
                {/* Footer actions are expected to be included inside DialogContentNode's form */}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            onClick={onOpenEnhancedEditor}
            size={isMobile ? 'sm' : 'default'}
          >
            <Plus className="h-4 w-4 mr-2" />
            {enhancedLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminContentHeader;
