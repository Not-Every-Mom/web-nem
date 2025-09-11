
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, Clock, User, Pin, Lock } from "lucide-react";
import { NewThreadDialog } from "@/components/forum/NewThreadDialog";
import { useDemo } from "@/hooks/useDemo";
import { CommunityFilters } from "@/components/forum/CommunityFilters";

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author_id: string;
  reply_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  last_activity_at: string;
  created_at: string;
  category?: string | null;
  is_anonymous?: boolean;
  profiles?: {
    full_name: string | null;
    username: string | null;
  };
}

const CommunityPage = () => {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();

  useEffect(() => {
    fetchThreads();
    fetchCommunityStats();
  }, []);

  const fetchThreads = async () => {
    try {
      const { data: threadsData, error: threadsError } = await supabase
        .from('forum_threads')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('last_activity_at', { ascending: false });

      if (threadsError) {
        console.error('Error fetching threads:', threadsError);
        return;
      }

      const authorIds = threadsData?.map(t => t.author_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .rpc('get_public_profiles', { _user_ids: authorIds });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const threadsWithProfiles: ForumThread[] = (threadsData || []).map(thread => {
        const profile = profilesData?.find(p => p.user_id === thread.author_id);
        return {
          ...thread,
          profiles: profile ? {
            full_name: null, // Not exposed in public view
            username: profile.username
          } : { full_name: null, username: null }
        };
      });

      setThreads(threadsWithProfiles);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunityStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_public_members_count');

      if (error) {
        console.error('Error fetching community stats:', error);
        return;
      }

      setTotalMembers(data || 0);
    } catch (error) {
      console.error('Error fetching community stats:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getDisplayName = (t: ForumThread) => {
    if (t.is_anonymous) return 'Anonymous';
    return t.profiles?.username || 'Anonymous User';
  };

  const handleThreadClick = (threadId: string) => {
    navigate(`/app/community/thread/${threadId}`);
  };

  const getTodaysPostCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return threads.filter(thread => {
      const threadDate = new Date(thread.created_at);
      threadDate.setHours(0, 0, 0, 0);
      return threadDate.getTime() === today.getTime();
    }).length;
  };

  const categories = useMemo(() => {
    const preset = ["Daily Check-ins", "Support Requests", "Success Stories"];
    const dynamic = Array.from(new Set(threads.map(t => t.category).filter(Boolean))) as string[];
    const merged = Array.from(new Set([...preset, ...dynamic]));
    return merged;
  }, [threads]);

  const filteredThreads = useMemo(() => {
    let list = threads;

    if (category !== "all") {
      list = list.filter(t => (t.category || "").toLowerCase() === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q)
      );
    }
    return list;
  }, [threads, search, category]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-powder-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-powder-blue/20 px-6 py-4" role="banner">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-powder-blue" aria-hidden="true" />
            <div>
              <h1 className="font-heading text-2xl text-deep-green">Community</h1>
              <p className="font-body text-sm text-muted-foreground">
                Connect with others on similar wellbeing journeys
              </p>
            </div>
          </div>
          <NewThreadDialog onThreadCreated={fetchThreads} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl" role="main">
        {/* Filters */}
        <CommunityFilters
          search={search}
          onSearchChange={setSearch}
          categories={categories}
          selectedCategory={category}
          onCategoryChange={setCategory}
        />

        {/* Community Stats */}
        <section className="grid grid-cols-2 gap-4 mb-8" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">Community Statistics</h2>
          
          <Card className="bg-powder-blue/10 border-powder-blue/20">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-powder-blue" aria-hidden="true" />
                <div>
                  <p className="font-heading text-2xl text-deep-green" aria-describedby="members-desc">
                    {totalMembers.toLocaleString()}
                  </p>
                  <p id="members-desc" className="font-body text-sm text-muted-foreground">Active Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted-gold/10 border-muted-gold/20">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-8 h-8 text-muted-gold" aria-hidden="true" />
                <div>
                  <p className="font-heading text-2xl text-deep-green" aria-describedby="posts-desc">
                    {getTodaysPostCount()}
                  </p>
                  <p id="posts-desc" className="font-body text-sm text-muted-foreground">Today's Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Thread List */}
        <section className="space-y-4" aria-labelledby="discussions-heading">
          <div className="flex items-center justify-between">
            <h2 id="discussions-heading" className="font-heading text-2xl text-deep-green">
              Recent Discussions
            </h2>
            {isDemoMode && (
              <Badge variant="outline" className="text-muted-gold border-muted-gold/30">
                Demo Mode - Read Only
              </Badge>
            )}
          </div>

          {filteredThreads.length === 0 ? (
            <Card className="border-powder-blue/20">
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-lg text-deep-green mb-2">
                  No discussions found
                </h3>
                <p className="font-body text-muted-foreground">
                  Try adjusting your search or category filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredThreads.map((thread) => (
              <Card 
                key={thread.id}
                className="border-powder-blue/20 hover:bg-powder-blue/5 transition-colors cursor-pointer"
                onClick={() => handleThreadClick(thread.id)}
              >
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          {thread.is_pinned && (
                            <Pin className="w-4 h-4 text-muted-gold flex-shrink-0" />
                          )}
                          {thread.is_locked && (
                            <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <h3 className="font-heading text-lg text-deep-green truncate">
                            {thread.title}
                          </h3>
                          {thread.category && (
                            <Badge variant="outline" className="ml-2 text-xs border-powder-blue/30">
                              {thread.category}
                            </Badge>
                          )}
                        </div>
                        <p className="font-body text-sm text-muted-foreground line-clamp-2">
                          {thread.content}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span className="font-body">
                            {getDisplayName(thread)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <span className="font-body">
                            {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-body">
                          {formatDate(thread.last_activity_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>
        
        {/* Live region for filter results */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {search && (
            `Found ${filteredThreads.length} discussion${filteredThreads.length !== 1 ? 's' : ''} matching "${search}"`
          )}
        </div>
      </main>
    </div>
  );
};

export default CommunityPage;
