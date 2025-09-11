import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Bot, Edit, Trash2, Search, Filter } from "lucide-react";
import { ColorThemePicker } from "@/components/ui/color-theme-picker";
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

interface PersonaForm {
  display_name: string;
  name: string;
  description: string;
  personality: string;
  specialty: string;
  color_theme: string;
  avatar_url: string;
  profile?: any;
}

const initialForm: PersonaForm = {
  display_name: "",
  name: "",
  description: "",
  personality: "",
  specialty: "",
  color_theme: "",
  avatar_url: "",
  profile: null,
};

export const AdminPersonasPage = () => {
  const [form, setForm] = useState<PersonaForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileJson, setProfileJson] = useState<string>("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: personas, isLoading } = useQuery({
    queryKey: ['admin-personas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createPersonaMutation = useMutation({
    mutationFn: async (persona: PersonaForm) => {
      const { error } = await supabase
        .from('personas')
        .insert([persona]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-personas'] });
      setDialogOpen(false);
      setForm(initialForm);
      setProfileJson("");
      setProfileError(null);
      setEditingId(null);
      toast({
        title: "Persona Created",
        description: "New persona has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePersonaMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PersonaForm }) => {
      const { error } = await supabase
        .from('personas')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-personas'] });
      setDialogOpen(false);
      setForm(initialForm);
      setEditingId(null);
      setProfileJson("");
      setProfileError(null);
      toast({
        title: "Persona Updated",
        description: "Persona has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePersonaMutation = useMutation({
    mutationFn: async (personaId: string) => {
      const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', personaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-personas'] });
      toast({
        title: "Persona Deleted",
        description: "Persona has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let parsedProfile: any = null;
    if (profileJson.trim()) {
      try {
        parsedProfile = JSON.parse(profileJson);
        setProfileError(null);
      } catch (err: any) {
        setProfileError("Invalid JSON format");
        toast({
          title: "Invalid profile JSON",
          description: "Please fix the JSON format before saving.",
          variant: "destructive",
        });
        return;
      }
    }

    const payload: PersonaForm = { ...form, profile: parsedProfile };

    if (editingId) {
      updatePersonaMutation.mutate({ id: editingId, updates: payload });
    } else {
      createPersonaMutation.mutate(payload);
    }
  };

const handleEdit = (persona: any) => {
  setForm({
    display_name: persona.display_name || persona.name || "",
    name: persona.name,
    description: persona.description || "",
    personality: persona.personality || "",
    specialty: persona.specialty || "",
    color_theme: persona.color_theme || "",
    avatar_url: persona.avatar_url || "",
    profile: persona.profile || null,
  });
  setProfileJson(persona.profile ? JSON.stringify(persona.profile, null, 2) : "");
  setProfileError(null);
  setEditingId(persona.id);
  setDialogOpen(true);
};

  const handleDelete = (personaId: string) => {
    deletePersonaMutation.mutate(personaId);
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setProfileJson("");
    setProfileError(null);
  };

  // Filter personas based on search query
const filteredPersonas = personas?.filter(persona =>
  (persona.display_name || persona.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
  persona.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  persona.description?.toLowerCase().includes(searchQuery.toLowerCase())
) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Persona Management</h1>
          <p className="text-muted-foreground">
            Create and manage AI personas for your application.
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary border-0 text-primary-foreground shadow-gentle transition-gentle hover:shadow-warm">
              <Plus className="h-4 w-4 mr-2" />
              Create Persona
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Persona" : "Create New Persona"}
              </DialogTitle>
              <DialogDescription>
                {editingId 
                  ? "Update the persona details below."
                  : "Fill in the details to create a new AI persona."
                }
              </DialogDescription>
            </DialogHeader>
<form onSubmit={handleSubmit} className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="display_name">Display Name (shown to users)</Label>
    <Input
      id="display_name"
      value={form.display_name}
      onChange={(e) => setForm(prev => ({ ...prev, display_name: e.target.value }))}
      placeholder="e.g., Vera Alessandra Alvarez – The Passionate Rebel"
      required
    />
  </div>
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="name">Archetype Name (internal)</Label>
      <Input
        id="name"
        value={form.name}
        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
        required
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="specialty">Specialty</Label>
      <Input
        id="specialty"
        value={form.specialty}
        onChange={(e) => setForm(prev => ({ ...prev, specialty: e.target.value }))}
      />
    </div>
  </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="personality">Personality</Label>
                <Textarea
                  id="personality"
                  value={form.personality}
                  onChange={(e) => setForm(prev => ({ ...prev, personality: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profile_json">Advanced Profile (JSON)</Label>
                <Textarea
                  id="profile_json"
                  value={profileJson}
                  onChange={(e) => setProfileJson(e.target.value)}
                  placeholder='{"safety_protocols":["..."], "adaptation": {"tone":"..."}, "techniques":["..."], "escalation": {"keywords": ["..."], "action": "..."}}'
                  rows={8}
                />
                {profileError && (
                  <p className="text-destructive text-sm">{profileError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Optional. Defines safety_protocols, adaptation, techniques, escalation used by chat.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <ColorThemePicker
                    label="Color Theme"
                    value={form.color_theme}
                    onChange={(value) => setForm(prev => ({ ...prev, color_theme: value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    value={form.avatar_url}
                    onChange={(e) => setForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingId ? "Update" : "Create"} Persona
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 bg-gradient-warm rounded-lg p-4 border border-border/50">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search personas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50 border-border/50"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>{filteredPersonas.length} of {personas?.length || 0} personas</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Bot className="h-8 w-8 text-muted-foreground mx-auto animate-pulse" />
              <p className="text-muted-foreground">Loading personas...</p>
            </div>
          </div>
        ) : filteredPersonas.length ? (
          filteredPersonas.map((persona) => (
            <Card key={persona.id} className="transition-gentle hover:shadow-gentle bg-gradient-warm border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
<CardTitle className="flex items-center gap-2 font-heading">
  <div className="p-2 rounded-lg bg-primary/10">
    <Bot className="h-4 w-4 text-primary" />
  </div>
  {persona.display_name || persona.name}
</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(persona)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Persona</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this persona? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(persona.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {persona.specialty && (
                  <CardDescription className="text-accent font-medium">
                    {persona.specialty}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {persona.description && (
                  <p className="text-sm text-foreground/80 leading-relaxed">{persona.description}</p>
                )}
                {persona.color_theme && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <div className="w-3 h-3 rounded-full bg-primary/60 border border-border/50"></div>
                    <span className="text-xs text-muted-foreground font-medium">
                      {persona.color_theme}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="bg-gradient-warm rounded-2xl p-8 border border-border/50 max-w-md mx-auto">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium font-heading mb-2">
                {searchQuery ? "No matching personas" : "No personas found"}
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                {searchQuery 
                  ? `No personas match "${searchQuery}". Try adjusting your search.`
                  : "Get started by creating your first AI persona to bring life to your application."
                }
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className="bg-gradient-primary border-0 text-primary-foreground shadow-gentle transition-gentle hover:shadow-warm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Persona
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};