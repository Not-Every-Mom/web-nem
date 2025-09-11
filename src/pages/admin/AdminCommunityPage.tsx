import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Pin, Lock, Trash2, Users, MessageSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export const AdminCommunityPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: threads, isLoading: threadsLoading } = useQuery({
    queryKey: ['admin-forum-threads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_threads')
        .select(`
          *,
          profiles!inner(full_name, username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Admin can access all profiles due to RLS policy
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateThreadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('forum_threads')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-forum-threads'] });
      toast({
        title: "Thread Updated",
        description: "Thread status has been updated successfully.",
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

  const deleteThreadMutation = useMutation({
    mutationFn: async (threadId: string) => {
      // First delete all posts in the thread
      await supabase.from('forum_posts').delete().eq('thread_id', threadId);
      
      // Then delete the thread
      const { error } = await supabase
        .from('forum_threads')
        .delete()
        .eq('id', threadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-forum-threads'] });
      toast({
        title: "Thread Deleted",
        description: "Thread has been deleted successfully.",
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

  const handleTogglePin = (threadId: string, isPinned: boolean) => {
    updateThreadMutation.mutate({
      id: threadId,
      updates: { is_pinned: !isPinned }
    });
  };

  const handleToggleLock = (threadId: string, isLocked: boolean) => {
    updateThreadMutation.mutate({
      id: threadId,
      updates: { is_locked: !isLocked }
    });
  };

  const handleDeleteThread = (threadId: string) => {
    deleteThreadMutation.mutate(threadId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Management</h1>
        <p className="text-muted-foreground">
          Manage forum threads, moderate content, and oversee user activity.
        </p>
      </div>

      <Tabs defaultValue="threads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="threads">Forum Threads</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="threads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Forum Threads
              </CardTitle>
              <CardDescription>
                Manage and moderate community forum threads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {threadsLoading ? (
                <div className="p-4">Loading threads...</div>
              ) : threads?.length ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Thread</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Replies</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {threads.map((thread) => (
                        <TableRow key={thread.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{thread.title}</div>
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {thread.content}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {(thread.profiles as any)?.full_name || (thread.profiles as any)?.username || "Unknown"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(thread.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{thread.reply_count}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {thread.is_pinned && (
                                <Badge variant="secondary" className="text-xs">Pinned</Badge>
                              )}
                              {thread.is_locked && (
                                <Badge variant="destructive" className="text-xs">Locked</Badge>
                              )}
                              {!thread.is_pinned && !thread.is_locked && (
                                <Badge variant="outline" className="text-xs">Active</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant={thread.is_pinned ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleTogglePin(thread.id, thread.is_pinned)}
                              >
                                <Pin className="h-3 w-3" />
                              </Button>
                              
                              <Button
                                variant={thread.is_locked ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleToggleLock(thread.id, thread.is_locked)}
                              >
                                <Lock className="h-3 w-3" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Thread</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this thread? This action cannot be undone and will also delete all replies.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteThread(thread.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground p-4">No threads found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                View and manage registered users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div>Loading users...</div>
              ) : users?.length ? (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">
                            {user.full_name || user.username || "Unknown User"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {user.subscription_status || "free"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No users found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};