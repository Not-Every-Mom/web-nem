import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Check, Star, RefreshCw } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

const BillingPage = () => {
  const { user } = useAuth();
  const { 
    subscription, 
    isLoading, 
    error, 
    updateSubscription, 
    getPlanFeatures, 
    getCurrentPlan, 
    isSubscribed, 
    subscriptionTier,
    subscriptionEnd 
  } = useSubscription();

  const handleUpgradePlan = async (tier: string, price: string) => {
    // For now, simulate subscription update
    await updateSubscription.mutateAsync({
      subscribed: true,
      subscription_tier: tier,
      subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  };

  const handleManageSubscription = () => {
    // Placeholder for Stripe Customer Portal
    window.open('https://billing.stripe.com/p/login/test_00000000000000', '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <header className="bg-card/50 backdrop-blur-sm border-b border-powder-blue/20 px-6 py-4">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-8 h-8 text-powder-blue" />
            <div>
              <h1 className="font-heading text-xl text-deep-green">Billing</h1>
              <p className="font-body text-sm text-muted-foreground">
                Manage your subscription and billing
              </p>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-8">
            <Skeleton className="h-32 w-full" />
            <div className="grid md:grid-cols-3 gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <header className="bg-card/50 backdrop-blur-sm border-b border-powder-blue/20 px-6 py-4">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-8 h-8 text-powder-blue" />
            <div>
              <h1 className="font-heading text-xl text-deep-green">Billing</h1>
              <p className="font-body text-sm text-muted-foreground">
                Manage your subscription and billing
              </p>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-6 py-8">
          <Alert>
            <AlertDescription>
              Error loading subscription data: {error.message}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-powder-blue/20 px-6 py-4">
        <div className="flex items-center space-x-3">
          <CreditCard className="w-8 h-8 text-powder-blue" />
          <div>
            <h1 className="font-heading text-xl text-deep-green">Billing</h1>
            <p className="font-body text-sm text-muted-foreground">
              Manage your subscription and billing
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Current Plan */}
          <Card className="bg-gradient-primary border-powder-blue/20">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-white">
                Current Plan: {currentPlan}
              </CardTitle>
              <CardDescription className="text-white/80 font-body">
                {isSubscribed 
                  ? `You're subscribed to our ${subscriptionTier} plan`
                  : "You're currently on our free plan with limited features"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-white">
                <div className="space-y-1">
                  {getPlanFeatures(subscriptionTier).slice(0, 2).map((feature, index) => (
                    <p key={index} className="font-body text-sm">{feature}</p>
                  ))}
                  {subscriptionEnd && (
                    <p className="font-body text-xs text-white/70 mt-2">
                      {isSubscribed ? 'Renews' : 'Expires'} on {format(new Date(subscriptionEnd), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {isSubscribed && (
                    <Button 
                      variant="outline" 
                      className="border-white/30 text-white hover:bg-white/10"
                      onClick={handleManageSubscription}
                    >
                      Manage
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="border-white/30 text-white hover:bg-white/10"
                    disabled={updateSubscription.isPending}
                  >
                    {updateSubscription.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                    {isSubscribed ? 'Change Plan' : 'Upgrade Plan'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Plans */}
          <section>
            <h2 className="font-heading text-2xl text-deep-green mb-6">Choose Your Plan</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: "Free",
                  price: "$0",
                  period: "/month",
                  description: "Perfect for trying out M.O.M",
                  features: getPlanFeatures(null),
                  popular: false,
                  current: currentPlan === "Free"
                },
                {
                  name: "Care",
                  price: "$9.99",
                  period: "/month",
                  description: "For regular emotional support",
                  features: getPlanFeatures("Care"),
                  popular: true,
                  current: currentPlan === "Care"
                },
                {
                  name: "Family",
                  price: "$19.99",
                  period: "/month",
                  description: "For families seeking support",
                  features: getPlanFeatures("Family"),
                  popular: false,
                  current: currentPlan === "Family"
                }
              ].map((plan, index) => (
                <Card 
                  key={index} 
                  className={`relative border-powder-blue/20 ${
                    plan.popular ? 'border-muted-gold ring-2 ring-muted-gold/20' : ''
                  } ${plan.current ? 'bg-powder-blue/5' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-muted-gold text-white px-3 py-1 rounded-full text-xs font-body font-semibold flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="font-heading text-xl text-deep-green">
                      {plan.name}
                    </CardTitle>
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="font-heading text-3xl text-deep-green">{plan.price}</span>
                      <span className="font-body text-muted-foreground">{plan.period}</span>
                    </div>
                    <CardDescription className="font-body">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-3">
                          <Check className="w-4 h-4 text-powder-blue flex-shrink-0" />
                          <span className="font-body text-deep-green text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full ${
                        plan.current 
                          ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                          : plan.popular 
                            ? 'bg-gradient-primary hover:opacity-90 text-white' 
                            : 'border-powder-blue/30 text-powder-blue hover:bg-powder-blue/10'
                      }`}
                      variant={plan.current ? 'outline' : plan.popular ? 'default' : 'outline'}
                      disabled={plan.current || updateSubscription.isPending}
                      onClick={() => !plan.current && handleUpgradePlan(plan.name, plan.price)}
                    >
                      {updateSubscription.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                      {plan.current ? 'Current Plan' : 'Choose Plan'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Billing History */}
          <Card className="border-powder-blue/20">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-deep-green">
                Billing History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSubscribed ? (
                <div className="space-y-4">
                  {/* Sample billing history - replace with real Stripe data */}
                  <div className="flex items-center justify-between py-3 border-b border-powder-blue/10">
                    <div>
                      <p className="font-body font-medium text-deep-green">
                        {subscriptionTier} Plan - Monthly
                      </p>
                      <p className="font-body text-sm text-muted-foreground">
                        {format(new Date(), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-body font-medium text-deep-green">
                        ${subscriptionTier === 'Care' ? '9.99' : '19.99'}
                      </p>
                      <p className="font-body text-sm text-green-600">Paid</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-powder-blue/10">
                    <div>
                      <p className="font-body font-medium text-deep-green">
                        {subscriptionTier} Plan - Monthly
                      </p>
                      <p className="font-body text-sm text-muted-foreground">
                        {format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-body font-medium text-deep-green">
                        ${subscriptionTier === 'Care' ? '9.99' : '19.99'}
                      </p>
                      <p className="font-body text-sm text-green-600">Paid</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-body text-muted-foreground">
                    No billing history available
                  </p>
                  <p className="font-body text-sm text-muted-foreground mt-2">
                    Your transactions will appear here once you upgrade
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;