import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from './RichTextEditor';
import { MarkdownPreview } from './MarkdownPreview';
import { URLPreview } from './URLPreview';
import { Save, Clock, History, FileText, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentData {
  id?: string;
  title?: string;
  question?: string;
  answer?: string;
  description?: string;
  content_html?: string;
  content_markdown?: string;
  category?: string;
  type?: string;
  url?: string;
  url_metadata?: any;
  order_index?: number;
  is_featured?: boolean;
  image_url?: string;
  draft_content?: any;
  version?: number;
  auto_save_timestamp?: string;
}

interface EnhancedContentEditorProps {
  type: 'faq' | 'resource';
  initialData?: ContentData;
  onSave: (data: ContentData) => Promise<void>;
  onAutoSave?: (data: ContentData) => Promise<void>;
  onCancel: () => void;
  categories?: string[];
}

export const EnhancedContentEditor: React.FC<EnhancedContentEditorProps> = ({
  type,
  initialData,
  onSave,
  onAutoSave,
  onCancel,
  categories = []
}) => {
  const { toast } = useToast();
  const [data, setData] = useState<ContentData>(initialData || {});
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const updateData = useCallback((updates: Partial<ContentData>) => {
    setData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  const handleContentChange = useCallback((html: string, markdown: string) => {
    updateData({
      content_html: html,
      content_markdown: markdown,
      ...(type === 'faq' ? { answer: html } : { description: html })
    });
  }, [type, updateData]);

  const handleAutoSave = useCallback(async (html: string, markdown: string) => {
    if (!onAutoSave) return;

    const autoSaveData = {
      ...data,
      content_html: html,
      content_markdown: markdown,
      auto_save_timestamp: new Date().toISOString(),
      draft_content: {
        html,
        markdown,
        timestamp: new Date().toISOString()
      }
    };

    try {
      await onAutoSave(autoSaveData);
      setLastAutoSave(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [data, onAutoSave]);

  const handleSave = async () => {
    if (!data.title && !data.question) {
      toast({
        title: "Validation Error",
        description: type === 'faq' ? "Question is required" : "Title is required",
        variant: "destructive"
      });
      return;
    }

    if (!data.content_html && !data.answer && !data.description) {
      toast({
        title: "Validation Error", 
        description: "Content is required",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const saveData = {
        ...data,
        version: (data.version || 0) + 1
      };
      
      await onSave(saveData);
      setHasUnsavedChanges(false);
      toast({
        title: "Success",
        description: `${type === 'faq' ? 'FAQ' : 'Resource'} saved successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getContentForEditor = () => {
    if (type === 'faq') {
      return data.content_html || data.answer || '';
    }
    return data.content_html || data.description || '';
  };

  const getContentForPreview = () => {
    return data.content_markdown || data.content_html || '';
  };

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {type === 'faq' ? 'FAQ Editor' : 'Resource Editor'}
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="ml-2">
                Unsaved changes
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastAutoSave && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                Auto-saved {lastAutoSave.toLocaleTimeString()}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={type === 'faq' ? 'question' : 'title'}>
              {type === 'faq' ? 'Question' : 'Title'} *
            </Label>
            <Input
              id={type === 'faq' ? 'question' : 'title'}
              value={type === 'faq' ? data.question || '' : data.title || ''}
              onChange={(e) => updateData(
                type === 'faq' 
                  ? { question: e.target.value }
                  : { title: e.target.value }
              )}
              placeholder={type === 'faq' ? 'Enter the FAQ question...' : 'Enter resource title...'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={data.category || ''}
              onValueChange={(value) => updateData({ category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Resource-specific fields */}
        {type === 'resource' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={data.type || 'article'}
                  onValueChange={(value) => updateData({ type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="link">External Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_index">Order</Label>
                <Input
                  id="order_index"
                  type="number"
                  value={data.order_index || 0}
                  onChange={(e) => updateData({ order_index: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <URLPreview
              url={data.url || ''}
              onChange={(url) => updateData({ url })}
              onMetadataChange={(metadata) => updateData({ url_metadata: metadata })}
            />
          </>
        )}

        {/* Content Editor */}
        <div className="space-y-4">
          <Label>{type === 'faq' ? 'Answer' : 'Description'} *</Label>
          
          {showPreview ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RichTextEditor
                content={getContentForEditor()}
                onChange={handleContentChange}
                onAutoSave={handleAutoSave}
                placeholder={type === 'faq' ? 'Enter the answer...' : 'Enter description...'}
                showPreview={showPreview}
                onTogglePreview={() => setShowPreview(!showPreview)}
              />
              <MarkdownPreview content={getContentForPreview()} />
            </div>
          ) : (
            <RichTextEditor
              content={getContentForEditor()}
              onChange={handleContentChange}
              onAutoSave={handleAutoSave}
              placeholder={type === 'faq' ? 'Enter the answer...' : 'Enter description...'}
              showPreview={showPreview}
              onTogglePreview={() => setShowPreview(!showPreview)}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {data.version && (
              <Badge variant="outline">
                Version {data.version}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};