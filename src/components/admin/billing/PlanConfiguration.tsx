import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Star,
  ArrowUp,
  ArrowDown,
  Save,
  X
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  apple_product_id: string | null;
  google_play_product_id: string | null;
  features: any; // JSONB type from database
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface PlanFormData {
  name: string;
  description: string;
  price_monthly: string;
  price_yearly: string;
  stripe_price_id_monthly: string;
  stripe_price_id_yearly: string;
  apple_product_id: string;
  google_play_product_id: string;
  features: string;
  is_active: boolean;
}

const initialFormData: PlanFormData = {
  name: '',
  description: '',
  price_monthly: '',
  price_yearly: '',
  stripe_price_id_monthly: '',
  stripe_price_id_yearly: '',
  apple_product_id: '',
  google_play_product_id: '',
  features: '',
  is_active: true,
};

export const PlanConfiguration = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(initialFormData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order');

      if (error) throw error;
      
      setPlans((data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : []
      })));
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateDialog = () => {
    setEditingPlan(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price_monthly: (plan.price_monthly / 100).toString(),
      price_yearly: plan.price_yearly ? (plan.price_yearly / 100).toString() : '',
      stripe_price_id_monthly: plan.stripe_price_id_monthly || '',
      stripe_price_id_yearly: plan.stripe_price_id_yearly || '',
      apple_product_id: plan.apple_product_id || '',
      google_play_product_id: plan.google_play_product_id || '',
      features: plan.features.join('\n'),
      is_active: plan.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const planData = {
        name: formData.name,
        description: formData.description || null,
        price_monthly: Math.round(parseFloat(formData.price_monthly) * 100),
        price_yearly: formData.price_yearly ? Math.round(parseFloat(formData.price_yearly) * 100) : null,
        stripe_price_id_monthly: formData.stripe_price_id_monthly || null,
        stripe_price_id_yearly: formData.stripe_price_id_yearly || null,
        apple_product_id: formData.apple_product_id || null,
        google_play_product_id: formData.google_play_product_id || null,
        features: formData.features.split('\n').filter(f => f.trim()),
        is_active: formData.is_active,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Plan updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert({
            ...planData,
            display_order: plans.length + 1,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Plan created successfully",
        });
      }

      setDialogOpen(false);
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error",
        description: "Failed to save plan",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });

      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete plan",
        variant: "destructive",
      });
    }
  };

  const updateDisplayOrder = async (planId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ display_order: newOrder })
        .eq('id', planId);

      if (error) throw error;

      fetchPlans();
    } catch (error) {
      console.error('Error updating display order:', error);
      toast({
        title: "Error",
        description: "Failed to update plan order",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>
              Configure subscription plans and platform integrations
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                </DialogTitle>
                <DialogDescription>
                  Configure plan details and platform-specific product IDs
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Premium"
                    />
                  </div>
                  <div className="space-y-2 flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Plan description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_monthly">Monthly Price ($)</Label>
                    <Input
                      id="price_monthly"
                      type="number"
                      step="0.01"
                      value={formData.price_monthly}
                      onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                      placeholder="9.99"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_yearly">Yearly Price ($)</Label>
                    <Input
                      id="price_yearly"
                      type="number"
                      step="0.01"
                      value={formData.price_yearly}
                      onChange={(e) => setFormData({ ...formData, price_yearly: e.target.value })}
                      placeholder="99.99"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripe_monthly">Stripe Monthly Price ID</Label>
                    <Input
                      id="stripe_monthly"
                      value={formData.stripe_price_id_monthly}
                      onChange={(e) => setFormData({ ...formData, stripe_price_id_monthly: e.target.value })}
                      placeholder="price_..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripe_yearly">Stripe Yearly Price ID</Label>
                    <Input
                      id="stripe_yearly"
                      value={formData.stripe_price_id_yearly}
                      onChange={(e) => setFormData({ ...formData, stripe_price_id_yearly: e.target.value })}
                      placeholder="price_..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apple_id">Apple Product ID</Label>
                    <Input
                      id="apple_id"
                      value={formData.apple_product_id}
                      onChange={(e) => setFormData({ ...formData, apple_product_id: e.target.value })}
                      placeholder="com.yourapp.premium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="google_id">Google Play Product ID</Label>
                    <Input
                      id="google_id"
                      value={formData.google_play_product_id}
                      onChange={(e) => setFormData({ ...formData, google_play_product_id: e.target.value })}
                      placeholder="premium_subscription"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="features">Features (one per line)</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="Unlimited access&#10;Priority support&#10;Advanced features"
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  {editingPlan ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Platform IDs</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan, index) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {plan.name}
                        {plan.name === 'Free' && <Star className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.description}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {plan.features.slice(0, 2).map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {plan.features.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{plan.features.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(plan.price_monthly)}/mo
                      </div>
                      {plan.price_yearly && (
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(plan.price_yearly)}/yr
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs">
                      {plan.stripe_price_id_monthly && (
                        <div>Stripe: {plan.stripe_price_id_monthly.substring(0, 15)}...</div>
                      )}
                      {plan.apple_product_id && (
                        <div>Apple: {plan.apple_product_id.substring(0, 15)}...</div>
                      )}
                      {plan.google_play_product_id && (
                        <div>Google: {plan.google_play_product_id.substring(0, 15)}...</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={index === 0}
                        onClick={() => updateDisplayOrder(plan.id, plan.display_order - 1)}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <span className="text-sm">{plan.display_order}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={index === plans.length - 1}
                        onClick={() => updateDisplayOrder(plan.id, plan.display_order + 1)}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {plan.name !== 'Free' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};