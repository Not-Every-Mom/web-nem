import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export const useFAQ = (searchQuery?: string, category?: string) => {
  return useQuery({
    queryKey: ['faq', searchQuery, category],
    queryFn: async () => {
      let query = supabase
        .from('faq')
        .select('*')
        .order('order_index', { ascending: true });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (searchQuery) {
        query = query.or(`question.ilike.%${searchQuery}%,answer.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FAQ[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useFAQCategories = () => {
  return useQuery({
    queryKey: ['faq-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faq')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;
      
      const categories = [...new Set(data.map(item => item.category))].filter(Boolean);
      return categories as string[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};