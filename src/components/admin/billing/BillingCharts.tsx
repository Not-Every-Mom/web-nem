import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const BillingCharts = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Monthly revenue over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">Revenue Chart</p>
              <p className="text-sm text-muted-foreground">
                Chart integration coming soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Subscription Growth</CardTitle>
          <CardDescription>New subscriptions over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">Growth Chart</p>
              <p className="text-sm text-muted-foreground">
                Chart integration coming soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Plan Distribution</CardTitle>
          <CardDescription>Current subscribers by plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">Plan Distribution Chart</p>
              <p className="text-sm text-muted-foreground">
                Chart integration coming soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Churn Analysis</CardTitle>
          <CardDescription>Subscription cancellations and churn rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">Churn Analysis Chart</p>
              <p className="text-sm text-muted-foreground">
                Chart integration coming soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};