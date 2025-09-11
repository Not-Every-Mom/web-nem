import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink,
  Calendar,
  DollarSign,
  Mail,
  User
} from 'lucide-react';

interface SubscriberData {
  id: string;
  email: string;
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  } | null;
  stripeData: {
    customer: any;
    subscription: any;
    nextBilling: string | null;
    amount: number;
  } | null;
}

export const BillingTable = () => {
  const [subscribers, setSubscribers] = useState<SubscriberData[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<SubscriberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const { toast } = useToast();

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-billing-data');
      
      if (error) throw error;
      
      setSubscribers(data.subscribers || []);
      setFilteredSubscribers(data.subscribers || []);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch billing data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  useEffect(() => {
    let filtered = subscribers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.stripe_customer_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => {
        if (statusFilter === 'active') return sub.subscribed;
        if (statusFilter === 'inactive') return !sub.subscribed;
        return true;
      });
    }

    // Plan filter
    if (planFilter !== 'all') {
      filtered = filtered.filter(sub => sub.subscription_tier === planFilter);
    }

    setFilteredSubscribers(filtered);
  }, [subscribers, searchTerm, statusFilter, planFilter]);

  const getStatusBadge = (subscribed: boolean, subscription: any) => {
    if (!subscribed) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (subscription) {
      const status = subscription.status;
      switch (status) {
        case 'active':
          return <Badge variant="default">Active</Badge>;
        case 'past_due':
          return <Badge variant="destructive">Past Due</Badge>;
        case 'canceled':
          return <Badge variant="secondary">Canceled</Badge>;
        case 'trialing':
          return <Badge variant="outline">Trial</Badge>;
        default:
          return <Badge variant="secondary">{status}</Badge>;
      }
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const uniquePlans = [...new Set(subscribers.map(sub => sub.subscription_tier).filter(Boolean))];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscribers</CardTitle>
          <CardDescription>Manage subscription data and billing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscribers ({filteredSubscribers.length})</CardTitle>
        <CardDescription>
          Manage subscription data and billing information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subscribers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {uniquePlans.map(plan => (
                <SelectItem key={plan} value={plan!}>{plan}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No subscribers found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={subscriber.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {subscriber.profiles?.full_name?.charAt(0) || subscriber.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {subscriber.profiles?.full_name || subscriber.profiles?.username || 'Unknown'}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {subscriber.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(subscriber.subscribed, subscriber.stripeData?.subscription)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {subscriber.subscription_tier || 'Free'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {subscriber.stripeData?.amount 
                          ? formatCurrency(subscriber.stripeData.amount)
                          : '$0.00'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      {subscriber.stripeData?.nextBilling ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(subscriber.stripeData.nextBilling)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {subscriber.stripe_customer_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Open Stripe customer portal (would need customer-portal edge function)
                              console.log('Open customer portal for:', subscriber.stripe_customer_id);
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};