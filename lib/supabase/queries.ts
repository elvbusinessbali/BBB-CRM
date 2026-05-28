import type { SupabaseClient } from '@supabase/supabase-js';
import type { Status } from '@/lib/status';

export type Customer = {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  tags: string[];
  notes: string | null;
  status: Status;
  created_at: string;
};

export type Interaction = {
  id: string;
  business_id: string;
  customer_id: string;
  kind: string;
  amount: number | null;
  notes: string | null;
  occurred_at: string;
  created_at: string;
};

export async function getMyBusiness(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, language')
    .single();
  if (error) throw error;
  return data;
}

export async function getCustomers(supabase: SupabaseClient): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCustomer(supabase: SupabaseClient, id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getInteractionsForCustomer(supabase: SupabaseClient, customerId: string): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('occurred_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getLastInteractionPerCustomer(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('interactions')
    .select('customer_id, occurred_at')
    .order('occurred_at', { ascending: false });
  if (error) throw error;
  const latest = new Map<string, string>();
  for (const row of data ?? []) {
    if (!latest.has(row.customer_id)) latest.set(row.customer_id, row.occurred_at);
  }
  return latest;
}

/** Returns a Map of customer_id → total amount (sum of all interactions). */
export async function getInteractionTotalsPerCustomer(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('interactions').select('customer_id, amount');
  if (error) throw error;
  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    if (row.amount == null) continue;
    totals.set(row.customer_id, (totals.get(row.customer_id) ?? 0) + Number(row.amount));
  }
  return totals;
}

export async function updateCustomerStatus(supabase: SupabaseClient, id: string, status: Status) {
  const { error } = await supabase.from('customers').update({ status }).eq('id', id);
  if (error) throw error;
}
