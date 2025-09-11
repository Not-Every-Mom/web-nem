// Lightweight admin types used during refactor.
// These are intentionally narrow — we can expand them later as needed.

export type ID = string;

export type FAQItem = {
  id: ID;
  question: string;
  answer: string;
  category?: string | null;
  status?: 'published' | 'draft' | 'archived';
  order_index?: number;
  [k: string]: unknown;
};

export type ResourceItem = {
  id: ID;
  title: string;
  description?: string | null;
  url?: string | null;
  type?: string | null;
  category?: string | null;
  image_url?: string | null;
  is_featured?: boolean;
  order_index?: number;
  status?: 'published' | 'draft' | 'archived';
  [k: string]: unknown;
};
