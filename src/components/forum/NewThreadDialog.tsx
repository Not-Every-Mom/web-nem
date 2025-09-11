import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface NewThreadDialogProps {
  onThreadCreated: () => void;
}

export const NewThreadDialog = ({ onThreadCreated }: NewThreadDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [postAnonymously, setPostAnonymously] = useState(true);
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide both a title and content for your thread."
      });
      return;
    }

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Thread creation is not available in demo mode. Please sign up to create posts."
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to create a new thread."
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('forum_threads')
        .insert({
          title: title.trim(),
          content: content.trim(),
          author_id: user.id,
          is_anonymous: postAnonymously
        });

      if (error) {
        console.error('Error creating thread:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create thread. Please try again."
        });
        return;
      }

      toast({
        title: "Success!",
        description: "Your thread has been created successfully."
      });

      // Reset form and close dialog
      setTitle("");
      setContent("");
      setIsOpen(false);
      onThreadCreated();
      
    } catch (error) {
      console.error('Error creating thread:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create thread. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:opacity-90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-deep-green">
            Create New Thread
          </DialogTitle>
          <DialogDescription className="font-body text-muted-foreground">
            Start a new discussion in the community. Share your thoughts, ask questions, or offer support.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-body font-medium text-deep-green">
              Thread Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for your thread"
              className="font-body border-powder-blue/30 focus:border-powder-blue focus:ring-powder-blue"
              disabled={loading}
              maxLength={200}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content" className="font-body font-medium text-deep-green">
              Content
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, ask a question, or start a discussion..."
              className="font-body border-powder-blue/30 focus:border-powder-blue focus:ring-powder-blue min-h-[120px]"
              disabled={loading}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground font-body">
              {content.length}/2000 characters
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={postAnonymously}
                onCheckedChange={setPostAnonymously}
                id="anon-thread"
              />
              <label htmlFor="anon-thread" className="text-sm text-muted-foreground font-body">
                Post anonymously
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="font-body"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !title.trim() || !content.trim()}
              className="bg-gradient-primary hover:opacity-90 text-white font-body"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Thread'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};