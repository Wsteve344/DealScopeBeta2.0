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
        .limit(1)
        .maybeSingle();

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

  users: {
    delete: async (email: string) => {
      // First get the user ID from the email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User not found');

      // Call the Edge Function to delete the user
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ userId: userData.id })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      return { success: true };
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