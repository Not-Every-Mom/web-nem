import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, HelpCircle, Edit, Trash2, Settings, Grid, Table as TableIcon, List } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import { EnhancedContentEditor } from "@/components/admin/EnhancedContentEditor";
import { ViewModeToggle, ViewMode } from "@/components/admin/ViewModeToggle";
import { ContentFilters, FilterState } from "@/components/admin/ContentFilters";
import { ContentTable, SortConfig } from "@/components/admin/ContentTable";
import { ContentPreview } from "@/components/admin/ContentPreview";
import { BulkActions } from "@/components/admin/BulkActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useIsMobile } from "@/hooks/use-mobile";

import FAQList from "@/components/admin/FAQList";
import ResourceList from "@/components/admin/ResourceList";

interface FAQForm {
  question: string;
  answer: string;
  category: string;
  order_index: number;
  status: 'published' | 'draft' | 'archived';
}

interface ResourceForm {
  title: string;
  description: string;
  url: string;
  type: string;
  category: string;
  image_url: string;
  is_featured: boolean;
  order_index: number;
  status: 'published' | 'draft' | 'archived';
}

const initialFAQForm: FAQForm = {
  question: "",
  answer: "",
  category: "",
  order_index: 0,
  status: 'published',
};

const initialResourceForm: ResourceForm = {
  title: "",
  description: "",
  url: "",
  type: "article",
  category: "",
  image_url: "",
  is_featured: false,
  order_index: 0,
  status: 'published',
};

const initialFilters: FilterState = {
  search: '',
  category: 'all',
  status: 'all',
  type: 'all'
};

export const AdminContentPage = () => {
  const [faqForm, setFaqForm] = useState<FAQForm>(initialFAQForm);
  const [resourceForm, setResourceForm] = useState<ResourceForm>(initialResourceForm);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [showEnhancedEditor, setShowEnhancedEditor] = useState(false);
  const [enhancedEditorType, setEnhancedEditorType] = useState<'faq' | 'resource'>('faq');
  const [enhancedEditorData, setEnhancedEditorData] = useState<any>(null);
  
  // New UI state
  const [faqViewMode, setFaqViewMode] = useState<ViewMode>(() => 
    (localStorage.getItem('admin-faq-view-mode') as ViewMode) || 'grid'
  );
  const [resourceViewMode, setResourceViewMode] = useState<ViewMode>(() => 
    (localStorage.getItem('admin-resource-view-mode') as ViewMode) || 'grid'
  );
  const [faqFilters, setFaqFilters] = useState<FilterState>(initialFilters);
  const [resourceFilters, setResourceFilters] = useState<FilterState>(initialFilters);
  const [faqSortConfig, setFaqSortConfig] = useState<SortConfig>({ field: 'updated_at', direction: 'desc' });
  const [resourceSortConfig, setResourceSortConfig] = useState<SortConfig>({ field: 'updated_at', direction: 'desc' });
  const [selectedFaqs, setSelectedFaqs] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'faq' | 'resources'>('faq');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Save view mode preferences
  useEffect(() => {
    localStorage.setItem('admin-faq-view-mode', faqViewMode);
  }, [faqViewMode]);

  useEffect(() => {
    localStorage.setItem('admin-resource-view-mode', resourceViewMode);
  }, [resourceViewMode]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'n',
        ctrlKey: true,
        action: () => {
          if (activeTab === 'faq') {
            setFaqDialogOpen(true);
          } else {
            setResourceDialogOpen(true);
          }
        },
        description: 'Create new content'
      },
      {
        key: 'f',
        ctrlKey: true,
        action: () => {
          searchInputRef.current?.focus();
        },
        description: 'Focus search'
      },
      {
        key: 'Escape',
        action: () => {
          setFaqDialogOpen(false);
          setResourceDialogOpen(false);
          setShowEnhancedEditor(false);
          setPreviewItem(null);
        },
        description: 'Close dialogs'
      },
      {
        key: 'Delete',
        action: () => {
          if (activeTab === 'faq' && selectedFaqs.length > 0) {
            handleBulkDeleteFaqs();
          } else if (activeTab === 'resources' && selectedResources.length > 0) {
            handleBulkDeleteResources();
          }
        },
        description: 'Delete selected items'
      }
    ]
  });

  const { data: allFaqs, isLoading: faqsLoading } = useQuery({
    queryKey: ['admin-faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: allResources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['admin-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Filter and sort data
  const filteredFaqs = useMemo(() => {
    if (!allFaqs) return [];
    
    return allFaqs
      .filter(faq => {
        const matchesSearch = !faqFilters.search || 
          faq.question.toLowerCase().includes(faqFilters.search.toLowerCase()) ||
          faq.answer.toLowerCase().includes(faqFilters.search.toLowerCase());
        
        const matchesCategory = faqFilters.category === 'all' || 
          faq.category === faqFilters.category;
        
        const matchesStatus = faqFilters.status === 'all' || 
          faq.status === faqFilters.status;
        
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        const { field, direction } = faqSortConfig;
        const aVal = a[field] || '';
        const bVal = b[field] || '';
        
        if (field === 'created_at' || field === 'updated_at') {
          return direction === 'asc' 
            ? new Date(aVal).getTime() - new Date(bVal).getTime()
            : new Date(bVal).getTime() - new Date(aVal).getTime();
        }
        
        return direction === 'asc' 
          ? aVal.toString().localeCompare(bVal.toString())
          : bVal.toString().localeCompare(aVal.toString());
      });
  }, [allFaqs, faqFilters, faqSortConfig]);

  const filteredResources = useMemo(() => {
    if (!allResources) return [];
    
    return allResources
      .filter(resource => {
        const matchesSearch = !resourceFilters.search || 
          resource.title.toLowerCase().includes(resourceFilters.search.toLowerCase()) ||
          resource.description.toLowerCase().includes(resourceFilters.search.toLowerCase());
        
        const matchesCategory = resourceFilters.category === 'all' || 
          resource.category === resourceFilters.category;
        
        const matchesStatus = resourceFilters.status === 'all' || 
          resource.status === resourceFilters.status;
        
        const matchesType = resourceFilters.type === 'all' || 
          resource.type === resourceFilters.type;
        
        return matchesSearch && matchesCategory && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const { field, direction } = resourceSortConfig;
        const aVal = a[field] || '';
        const bVal = b[field] || '';
        
        if (field === 'created_at' || field === 'updated_at') {
          return direction === 'asc' 
            ? new Date(aVal).getTime() - new Date(bVal).getTime()
            : new Date(bVal).getTime() - new Date(aVal).getTime();
        }
        
        return direction === 'asc' 
          ? aVal.toString().localeCompare(bVal.toString())
          : bVal.toString().localeCompare(aVal.toString());
      });
  }, [allResources, resourceFilters, resourceSortConfig]);

  // Get unique categories
  const faqCategories = useMemo<string[]>(() => {
    if (!allFaqs) return [];
    const cats = allFaqs
      .map((faq: any) => (faq.category ?? '').toString().trim())
      .filter((c: string) => c.length > 0);
    return Array.from(new Set(cats));
  }, [allFaqs]);

  const resourceCategories = useMemo<string[]>(() => {
    if (!allResources) return [];
    const cats = allResources
      .map((resource: any) => (resource.category ?? '').toString().trim())
      .filter((c: string) => c.length > 0);
    return Array.from(new Set(cats));
  }, [allResources]);

  // Check if filters are active
  const faqFiltersActive = faqFilters.search !== '' || faqFilters.category !== 'all' || faqFilters.status !== 'all';
  const resourceFiltersActive = resourceFilters.search !== '' || resourceFilters.category !== 'all' || 
    resourceFilters.status !== 'all' || resourceFilters.type !== 'all';

  // Mutations
  const createFaqMutation = useMutation({
    mutationFn: async (faq: FAQForm) => {
      const { error } = await supabase.from('faq').insert([faq]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      setFaqDialogOpen(false);
      setFaqForm(initialFAQForm);
      toast({ title: "FAQ Created", description: "FAQ item has been created successfully." });
    },
    onError: (error) => {
      toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
    },
  });

  const updateFaqMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FAQForm> }) => {
      const { error } = await supabase.from('faq').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      setFaqDialogOpen(false);
      setFaqForm(initialFAQForm);
      setEditingFaqId(null);
      toast({ title: "FAQ Updated", description: "FAQ item has been updated successfully." });
    },
    onError: (error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (faqId: string) => {
      const { error } = await supabase.from('faq').delete().eq('id', faqId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast({ title: "FAQ Deleted", description: "FAQ item has been deleted successfully." });
    },
    onError: (error) => {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    },
  });

  const createResourceMutation = useMutation({
    mutationFn: async (resource: ResourceForm) => {
      const { error } = await supabase.from('resources').insert([resource]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
      setResourceDialogOpen(false);
      setResourceForm(initialResourceForm);
      toast({ title: "Resource Created", description: "Resource has been created successfully." });
    },
    onError: (error) => {
      toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ResourceForm> }) => {
      const { error } = await supabase.from('resources').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
      setResourceDialogOpen(false);
      setResourceForm(initialResourceForm);
      setEditingResourceId(null);
      toast({ title: "Resource Updated", description: "Resource has been updated successfully." });
    },
    onError: (error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const { error } = await supabase.from('resources').delete().eq('id', resourceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
      toast({ title: "Resource Deleted", description: "Resource has been deleted successfully." });
    },
    onError: (error) => {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    },
  });

  // Bulk operations
  const handleBulkFaqStatusChange = async (status: 'published' | 'draft' | 'archived') => {
    try {
      const { error } = await supabase
        .from('faq')
        .update({ status })
        .in('id', selectedFaqs);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast({ 
        title: "Status Updated", 
        description: `${selectedFaqs.length} FAQ items updated to ${status}.` 
      });
    } catch (error: any) {
      toast({ 
        title: "Update Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const handleBulkResourceStatusChange = async (status: 'published' | 'draft' | 'archived') => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ status })
        .in('id', selectedResources);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
      toast({ 
        title: "Status Updated", 
        description: `${selectedResources.length} resources updated to ${status}.` 
      });
    } catch (error: any) {
      toast({ 
        title: "Update Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const handleBulkDeleteFaqs = async () => {
    try {
      const { error } = await supabase
        .from('faq')
        .delete()
        .in('id', selectedFaqs);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast({ 
        title: "FAQs Deleted", 
        description: `${selectedFaqs.length} FAQ items deleted.` 
      });
    } catch (error: any) {
      toast({ 
        title: "Delete Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const handleBulkDeleteResources = async () => {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .in('id', selectedResources);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
      toast({ 
        title: "Resources Deleted", 
        description: `${selectedResources.length} resources deleted.` 
      });
    } catch (error: any) {
      toast({ 
        title: "Delete Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  // Handlers
  const handleFaqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFaqId) {
      updateFaqMutation.mutate({ id: editingFaqId, updates: faqForm });
    } else {
      createFaqMutation.mutate(faqForm);
    }
  };

  const handleResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingResourceId) {
      updateResourceMutation.mutate({ id: editingResourceId, updates: resourceForm });
    } else {
      createResourceMutation.mutate(resourceForm);
    }
  };

  const handleEditFaq = (faq: any) => {
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "",
      order_index: faq.order_index || 0,
      status: faq.status || 'published',
    });
    setEditingFaqId(faq.id);
    setFaqDialogOpen(true);
  };

  const handleEditFaqEnhanced = (faq: any) => {
    setEnhancedEditorData(faq);
    setEditingFaqId(faq.id);
    setEnhancedEditorType('faq');
    setShowEnhancedEditor(true);
  };

  const handleEditResourceEnhanced = (resource: any) => {
    setEnhancedEditorData(resource);
    setEditingResourceId(resource.id);
    setEnhancedEditorType('resource');
    setShowEnhancedEditor(true);
  };

  const handleEnhancedFaqSave = async (data: any) => {
    if (editingFaqId) {
      await updateFaqMutation.mutateAsync({
        id: editingFaqId,
        updates: data,
      });
    } else {
      await createFaqMutation.mutateAsync(data);
    }
    setShowEnhancedEditor(false);
    setEditingFaqId(null);
    setEnhancedEditorData(null);
  };

  const handleEnhancedResourceSave = async (data: any) => {
    if (editingResourceId) {
      await updateResourceMutation.mutateAsync({
        id: editingResourceId,
        updates: data,
      });
    } else {
      await createResourceMutation.mutateAsync(data);
    }
    setShowEnhancedEditor(false);
    setEditingResourceId(null);
    setEnhancedEditorData(null);
  };

  const handleEditResource = (resource: any) => {
    setResourceForm({
      title: resource.title,
      description: resource.description,
      url: resource.url || "",
      type: resource.type,
      category: resource.category || "",
      image_url: resource.image_url || "",
      is_featured: resource.is_featured,
      order_index: resource.order_index || 0,
      status: resource.status || 'published',
    });
    setEditingResourceId(resource.id);
    setResourceDialogOpen(true);
  };

  // Selection handlers
  const handleFaqSelect = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedFaqs(prev => [...prev, id]);
    } else {
      setSelectedFaqs(prev => prev.filter(faqId => faqId !== id));
    }
  };

  const handleFaqSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedFaqs(filteredFaqs.map(faq => faq.id));
    } else {
      setSelectedFaqs([]);
    }
  };

  const handleResourceSelect = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedResources(prev => [...prev, id]);
    } else {
      setSelectedResources(prev => prev.filter(resourceId => resourceId !== id));
    }
  };

  const handleResourceSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedResources(filteredResources.map(resource => resource.id));
    } else {
      setSelectedResources([]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
        <p className="text-muted-foreground">
          Manage FAQ items and learning resources with advanced filtering, sorting, and bulk operations.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'faq' | 'resources')} className="space-y-4">
        <TabsList>
          <TabsTrigger value="faq">FAQ Management</TabsTrigger>
          <TabsTrigger value="resources">Resource Management</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-4">
          {/* FAQ Header Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <h2 className="text-xl font-semibold">FAQ Items ({filteredFaqs.length})</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {!isMobile && (
                <ViewModeToggle 
                  currentMode={faqViewMode} 
                  onModeChange={setFaqViewMode} 
                />
              )}
              
              <div className="flex gap-2">
                <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size={isMobile ? "sm" : "default"}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add FAQ
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingFaqId ? "Edit FAQ" : "Create FAQ"}</DialogTitle>
                      <DialogDescription>
                        {editingFaqId ? "Update the FAQ details." : "Add a new frequently asked question."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFaqSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="question">Question</Label>
                        <Input
                          id="question"
                          value={faqForm.question}
                          onChange={(e) => setFaqForm(prev => ({ ...prev, question: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="answer">Answer</Label>
                        <Textarea
                          id="answer"
                          value={faqForm.answer}
                          onChange={(e) => setFaqForm(prev => ({ ...prev, answer: e.target.value }))}
                          rows={4}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            value={faqForm.category}
                            onChange={(e) => setFaqForm(prev => ({ ...prev, category: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select value={faqForm.status} onValueChange={(value: any) => setFaqForm(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setFaqDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingFaqId ? "Update" : "Create"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={() => {
                    setEnhancedEditorData(null);
                    setEditingFaqId(null);
                    setEnhancedEditorType('faq');
                    setShowEnhancedEditor(true);
                  }}
                  size={isMobile ? "sm" : "default"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Enhanced Editor
                </Button>
              </div>
            </div>
          </div>

          {/* FAQ Filters */}
          <ContentFilters
            filters={faqFilters}
            onFiltersChange={setFaqFilters}
            categories={faqCategories}
            hasActiveFilters={faqFiltersActive}
          />

          {/* FAQ Bulk Actions */}
          {selectedFaqs.length > 0 && (
            <BulkActions
              selectedCount={selectedFaqs.length}
              onBulkStatusChange={handleBulkFaqStatusChange}
              onBulkDelete={handleBulkDeleteFaqs}
              onClearSelection={() => setSelectedFaqs([])}
            />
          )}

          {/* FAQ Content */}
          <FAQList
            viewMode={faqViewMode}
            isMobile={isMobile}
            loading={faqsLoading}
            items={filteredFaqs}
            selectedItems={selectedFaqs}
            sortConfig={faqSortConfig}
            onSort={setFaqSortConfig}
            onItemSelect={handleFaqSelect}
            onSelectAll={handleFaqSelectAll}
            onEdit={handleEditFaq}
            onEditEnhanced={handleEditFaqEnhanced}
            onDelete={(id) => deleteFaqMutation.mutate(id)}
            onPreview={setPreviewItem}
          />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          {/* Resources Header Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <h2 className="text-xl font-semibold">Learning Resources ({filteredResources.length})</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {!isMobile && (
                <ViewModeToggle 
                  currentMode={resourceViewMode} 
                  onModeChange={setResourceViewMode} 
                />
              )}
              
              <div className="flex gap-2">
                <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size={isMobile ? "sm" : "default"}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Resource
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingResourceId ? "Edit Resource" : "Create Resource"}</DialogTitle>
                      <DialogDescription>
                        {editingResourceId ? "Update the resource details." : "Add a new learning resource."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResourceSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            value={resourceForm.title}
                            onChange={(e) => setResourceForm(prev => ({ ...prev, title: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type">Type</Label>
                          <Select value={resourceForm.type} onValueChange={(value) => setResourceForm(prev => ({ ...prev, type: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="article">Article</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="guide">Guide</SelectItem>
                              <SelectItem value="tool">Tool</SelectItem>
                              <SelectItem value="course">Course</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={resourceForm.description}
                          onChange={(e) => setResourceForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="url">URL</Label>
                          <Input
                            id="url"
                            value={resourceForm.url}
                            onChange={(e) => setResourceForm(prev => ({ ...prev, url: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            value={resourceForm.category}
                            onChange={(e) => setResourceForm(prev => ({ ...prev, category: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select value={resourceForm.status} onValueChange={(value: any) => setResourceForm(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={resourceForm.is_featured}
                              onChange={(e) => setResourceForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                            />
                            Featured Resource
                          </Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setResourceDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingResourceId ? "Update" : "Create"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={() => {
                    setEnhancedEditorData(null);
                    setEditingResourceId(null);
                    setEnhancedEditorType('resource');
                    setShowEnhancedEditor(true);
                  }}
                  size={isMobile ? "sm" : "default"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Enhanced Editor
                </Button>
              </div>
            </div>
          </div>

          {/* Resources Filters */}
          <ContentFilters
            filters={resourceFilters}
            onFiltersChange={setResourceFilters}
            categories={resourceCategories}
            showTypeFilter={true}
            hasActiveFilters={resourceFiltersActive}
          />

          {/* Resources Bulk Actions */}
          {selectedResources.length > 0 && (
            <BulkActions
              selectedCount={selectedResources.length}
              onBulkStatusChange={handleBulkResourceStatusChange}
              onBulkDelete={handleBulkDeleteResources}
              onClearSelection={() => setSelectedResources([])}
            />
          )}

          {/* Resources Content */}
          <ResourceList
            viewMode={resourceViewMode}
            isMobile={isMobile}
            loading={resourcesLoading}
            items={filteredResources}
            selectedItems={selectedResources}
            sortConfig={resourceSortConfig}
            onSort={setResourceSortConfig}
            onItemSelect={handleResourceSelect}
            onSelectAll={handleResourceSelectAll}
            onEdit={handleEditResource}
            onEditEnhanced={handleEditResourceEnhanced}
            onDelete={(id) => deleteResourceMutation.mutate(id)}
            onPreview={setPreviewItem}
          />
        </TabsContent>
      </Tabs>

      {/* Enhanced Content Editor */}
      {showEnhancedEditor && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-7xl max-h-[90vh] overflow-auto">
            <EnhancedContentEditor
              type={enhancedEditorType}
              initialData={enhancedEditorData}
              onSave={enhancedEditorType === 'faq' ? handleEnhancedFaqSave : handleEnhancedResourceSave}
              onCancel={() => {
                setShowEnhancedEditor(false);
                setEditingFaqId(null);
                setEditingResourceId(null);
                setEnhancedEditorData(null);
              }}
              categories={enhancedEditorType === 'faq' ? faqCategories : resourceCategories}
            />
          </div>
        </div>
      )}

      {/* Content Preview Modal */}
      <ContentPreview
        item={previewItem}
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        onEdit={previewItem && 'question' in previewItem ? handleEditFaq : handleEditResource}
      />
    </div>
  );
};
