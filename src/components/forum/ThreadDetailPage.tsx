
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Send, MessageCircle, Clock, User, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import ReactionsBar from "@/components/forum/ReactionsBar";

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author_id: string;
  reply_count: number;
  created_at: string;
  is_anonymous?: boolean;
  profiles?: {
    full_name: string | null;
    username: string | null;
  };
}

interface ForumPost {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  is_anonymous?: boolean;
  profiles?: {
    full_name: string | null;
    username: string | null;
  };
}

const ThreadDetailPage = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const { toast } = useToast();
  
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [newReply, setNewReply] = useState("");
  const [postAnonymously, setPostAnonymously] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (threadId) {
      fetchThread();
      fetchPosts();
    }
  }, [threadId]);

  const fetchThread = async () => {
    try {
      const { data: threadData, error: threadError } = await supabase
        .from('forum_threads')
        .select('*')
        .eq('id', threadId)
        .single();

      if (threadError) {
        console.error('Error fetching thread:', threadError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load thread details"
        });
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .rpc('get_public_profiles', { _user_ids: [threadData.author_id] });

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      const threadWithProfile: ForumThread = {
        ...threadData,
        profiles: profileData && profileData.length > 0 ? {
          full_name: null, // Not exposed in public view
          username: profileData[0].username
        } : { full_name: null, username: null }
      };

      setThread(threadWithProfile);
    } catch (error) {
      console.error('Error fetching thread:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        return;
      }

      const authorIds = postsData?.map(p => p.author_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .rpc('get_public_profiles', { _user_ids: authorIds });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const postsWithProfiles: ForumPost[] = (postsData || []).map(post => {
        const profile = profilesData?.find(p => p.user_id === post.author_id);
        return {
          ...post,
          profiles: profile ? {
            full_name: null, // Not exposed in public view
            username: profile.username
          } : { full_name: null, username: null }
        };
      });

      setPosts(postsWithProfiles);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const submitReply = async () => {
    if (!newReply.trim()) return;

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Replies are not available in demo mode. Please sign up to participate in discussions."
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to reply to this thread."
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert({
          thread_id: threadId,
          content: newReply.trim(),
          author_id: user.id,
          is_anonymous: postAnonymously
        });

      if (error) {
        console.error('Error creating reply:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to post reply. Please try again."
        });
        return;
      }

      toast({
        title: "Reply posted!",
        description: postAnonymously ? "Posted anonymously." : "Your name will be visible."
      });

      setNewReply("");
      await fetchPosts();
      await fetchThread();
      
    } catch (error) {
      console.error('Error creating reply:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to post reply. Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisplayName = (isAnon?: boolean, profiles?: any) => {
    if (isAnon) return 'Anonymous';
    return profiles?.username || 'Anonymous User';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-powder-blue"></div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-2xl text-deep-green mb-4">Thread not found</h2>
          <Button onClick={() => navigate('/community')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-powder-blue/20 px-6 py-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/community')}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <MessageCircle className="w-6 h-6 text-powder-blue" />
          <div>
            <h1 className="font-heading text-lg text-deep-green line-clamp-1">
              {thread.title}
            </h1>
            <p className="font-body text-sm text-muted-foreground">
              Community Discussion
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Original Thread */}
        <Card className="mb-6 border-powder-blue/20">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h2 className="font-heading text-2xl text-deep-green">
                  {thread.title}
                </h2>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span className="font-body">
                    {getDisplayName(thread.is_anonymous, thread.profiles)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-body">
                    {formatDate(thread.created_at)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-body">
                    {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
                  </span>
                </div>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <p className="font-body text-deep-green leading-relaxed whitespace-pre-wrap">
                  {thread.content}
                </p>
              </div>
              <ReactionsBar threadId={thread.id} />
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        {posts.length > 0 && (
          <div className="space-y-4 mb-8">
            <h3 className="font-heading text-xl text-deep-green">
              Replies ({posts.length})
            </h3>
            
            {posts.map((post) => (
              <Card key={post.id} className="border-powder-blue/20 bg-powder-blue/5">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span className="font-body font-medium">
                          {getDisplayName(post.is_anonymous, post.profiles)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-body">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="font-body text-deep-green leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                    <ReactionsBar postId={post.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reply Form */}
        <Card className="border-powder-blue/20">
          <CardContent className="p-6">
            <h4 className="font-heading text-lg text-deep-green mb-4">
              Add a Reply
            </h4>
            
            <div className="space-y-4">
              <Textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Share your thoughts or offer support..."
                className="font-body border-powder-blue/30 focus:border-powder-blue focus:ring-powder-blue min-h-[100px]"
                disabled={submitting}
                maxLength={1500}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={postAnonymously}
                    onCheckedChange={setPostAnonymously}
                    id="anon"
                  />
                  <label htmlFor="anon" className="text-sm text-muted-foreground font-body">
                    Post anonymously
                  </label>
                </div>
                <p className="text-xs text-muted-foreground font-body">
                  {newReply.length}/1500 characters
                </p>
              </div>
              
              <div className="flex items-center justify-end">
                <Button
                  onClick={submitReply}
                  disabled={!newReply.trim() || submitting}
                  className="bg-gradient-primary hover:opacity-90 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThreadDetailPage;
