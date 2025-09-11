import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SubscriptionData {
  id: string;
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  stripe_customer_id: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: subscription,
    isLoading,
    error
  } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.email) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      // If no subscription record exists, create one
      if (!data) {
        const { data: newSubscription, error: insertError } = await supabase
          .from('subscribers')
          .insert({
            user_id: user.id,
            email: user.email,
            subscribed: false,
            subscription_tier: null
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
        return newSubscription as SubscriptionData;
      }
      
      return data as SubscriptionData;
    },
    enabled: !!user?.email,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateSubscription = useMutation({
    mutationFn: async (updates: Partial<SubscriptionData>) => {
      if (!user?.email) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('subscribers')
        .update(updates)
        .eq('email', user.email)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Subscription updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update subscription: ' + error.message);
    }
  });

  const getPlanFeatures = (tier: string | null) => {
    switch (tier) {
      case 'Care':
        return [
          'Unlimited conversations',
          'Access to all AI mothers',
          'Priority support',
          'Advanced features',
          'Conversation history'
        ];
      case 'Family':
        return [
          'Everything in Care',
          'Multiple user profiles',
          'Family sharing',
          'Premium content',
          '1-on-1 support sessions'
        ];
      default:
        return [
          '5 conversations per day',
          'Access to one AI mother',
          'Basic support',
          'Community access'
        ];
    }
  };

  const getCurrentPlan = () => {
    if (!subscription) return 'Free';
    return subscription.subscribed ? subscription.subscription_tier || 'Free' : 'Free';
  };

  const isSubscribed = subscription?.subscribed || false;
  const subscriptionTier = subscription?.subscription_tier;
  const subscriptionEnd = subscription?.subscription_end;

  return {
    subscription,
    isLoading,
    error,
    updateSubscription,
    getPlanFeatures,
    getCurrentPlan,
    isSubscribed,
    subscriptionTier,
    subscriptionEnd
  };
};