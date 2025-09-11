import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MessageSquare, Bot, FileText, TrendingUp } from "lucide-react";

export const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [
        { count: userCount },
        { count: threadCount },
        { count: personaCount },
        { count: faqCount },
        { count: resourceCount }
      ] = await Promise.all([
        supabase.rpc('get_public_members_count').then(result => ({ count: result.data })),
        supabase.from('forum_threads').select('*', { count: 'exact', head: true }),
        supabase.from('personas').select('*', { count: 'exact', head: true }),
        supabase.from('faq').select('*', { count: 'exact', head: true }),
        supabase.from('resources').select('*', { count: 'exact', head: true })
      ]);

      return {
        users: userCount || 0,
        threads: threadCount || 0,
        personas: personaCount || 0,
        faqs: faqCount || 0,
        resources: resourceCount || 0
      };
    },
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      // Skip fetching profile data as it's now restricted
      const { data: recentThreads } = await supabase
        .from('forum_threads')
        .select('id, title, created_at, author_id')
        .order('created_at', { ascending: false })
        .limit(5);

      return recentThreads || [];
    },
  });

  const statCards = [
    {
      title: "Total Users",
      value: stats?.users,
      icon: Users,
      description: "Registered users",
    },
    {
      title: "Forum Threads",
      value: stats?.threads,
      icon: MessageSquare,
      description: "Community discussions",
    },
    {
      title: "AI Personas",
      value: stats?.personas,
      icon: Bot,
      description: "Available personas",
    },
    {
      title: "FAQ Items",
      value: stats?.faqs,
      icon: FileText,
      description: "Help articles",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your application's key metrics and recent activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  card.value?.toLocaleString() || "0"
                )}
              </div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest forum threads created</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : recentActivity?.length ? (
              <div className="space-y-4">
                {recentActivity.map((thread) => (
                  <div key={thread.id} className="space-y-1">
                    <h4 className="text-sm font-medium">{thread.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(thread.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use the sidebar to navigate to different management sections.
            </p>
            <ul className="text-sm space-y-1">
              <li>• Manage community forums and users</li>
              <li>• Create and edit AI personas</li>
              <li>• Update FAQ and resource content</li>
              <li>• Monitor billing and subscriptions</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};