import { supabase } from './supabase';
import type { 
  User, Deal, DealSection, Message, Document, 
  Notification, CreditWallet 
} from './types';

export const api = {
  credits: {
    get: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First try to get existing wallet
      const { data: wallet, error: walletError } = await supabase
        .from('credit_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        throw walletError;
      }

      // If no wallet exists, create one with default values
      if (!wallet) {
        const { data: newWallet, error: createError } = await supabase
          .from('credit_wallets')
          .insert([{
            user_id: user.id,
            credits: 0,
            tier: 'basic',
            rollover_credits: 0
          }])
          .select()
          .single();

        if (createError) throw createError;
        return newWallet as CreditWallet;
      }

      return wallet as CreditWallet;
    }
  },

  deals: {
    get: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          sections:deal_sections(*),
          documents:documents(*),
          messages:messages(*)
        `)
        .eq('id', id)
        .eq('investor_id', user.id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      return data as Deal;
    },

    create: async (address: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deals')
        .insert({
          address,
          investor_id: user.id,
          status: 'pending',
          progress: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data as Deal;
    },

    list: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deals')
        .select(`
          id,
          address,
          investor_id,
          status,
          progress,
          created_at,
          deleted_at,
          messages:messages(count),
          documents:documents(count)
        `)
        .eq('investor_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Deal[];
    },

    delete: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('delete_deal', {
        p_deal_id: id,
        p_user_id: user.id
      });

      if (error) {
        console.error('Delete error:', error);
        throw new Error(error.message);
      }
    }
  }
};