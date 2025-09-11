import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw,
  CreditCard,
  Calendar,
  Target
} from 'lucide-react';
import { BillingTable } from './BillingTable';
import { PlanConfiguration } from './PlanConfiguration';
import { BillingCharts } from './BillingCharts';

interface StripeMetrics {
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  currentMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
  failedPayments: number;
  totalSubscribers: number;
  annualRecurringRevenue: number;
  updatedAt: string;
}

export const BillingDashboard = () => {
  const [metrics, setMetrics] = useState<StripeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-stripe-metrics');
      
      if (error) throw error;
      
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch billing metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMetrics();
  };

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend, 
    loading 
  }: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ElementType;
    trend?: number;
    loading?: boolean;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>{description}</span>
          {trend !== undefined && (
            <Badge 
              variant={trend >= 0 ? "default" : "destructive"}
              className="text-xs"
            >
              {trend >= 0 ? '+' : ''}{trend}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor subscription metrics and manage billing operations
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={loading ? 0 : `$${metrics?.monthlyRecurringRevenue?.toLocaleString() || 0}`}
          description="Current MRR"
          icon={DollarSign}
          trend={metrics?.revenueGrowth}
          loading={loading}
        />
        <MetricCard
          title="Active Subscriptions"
          value={loading ? 0 : metrics?.activeSubscriptions || 0}
          description="Currently active"
          icon={Users}
          loading={loading}
        />
        <MetricCard
          title="Annual Recurring Revenue"
          value={loading ? 0 : `$${metrics?.annualRecurringRevenue?.toLocaleString() || 0}`}
          description="Projected ARR"
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          title="Failed Payments"
          value={loading ? 0 : metrics?.failedPayments || 0}
          description="This month"
          icon={AlertTriangle}
          loading={loading}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Current Month Revenue"
          value={loading ? 0 : `$${metrics?.currentMonthRevenue?.toLocaleString() || 0}`}
          description="Revenue this month"
          icon={CreditCard}
          loading={loading}
        />
        <MetricCard
          title="Last Month Revenue"
          value={loading ? 0 : `$${metrics?.lastMonthRevenue?.toLocaleString() || 0}`}
          description="Previous month"
          icon={Calendar}
          loading={loading}
        />
        <MetricCard
          title="Total Subscribers"
          value={loading ? 0 : metrics?.totalSubscribers || 0}
          description="All subscribers"
          icon={Target}
          loading={loading}
        />
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <BillingCharts />
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          <BillingTable />
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <PlanConfiguration />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Detailed insights and reports (Coming Soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced analytics features including cohort analysis, churn prediction, 
                and customer segmentation will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {metrics?.updatedAt && (
        <p className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(metrics.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
};