import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  user: any;
  signUp: (email: string, password: string, role: string, phoneNumber: string) => Promise<void>;
  login: (email: string, password: string, role: string, rememberMe: boolean) => Promise<{ role: string | null }>;
  logout: () => void;
  updateProfile: (data: { name: string; email: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const signUp = async (email: string, password: string, role: string, phoneNumber: string) => {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create user account');

      // Create user profile in the database
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: authData.user.email,
          role: role,
          phone_number: phoneNumber
        }]);

      if (profileError) throw profileError;

      // Create credit wallet with 3 complementary credits
      const { error: walletError } = await supabase
        .from('credit_wallets')
        .insert([{
          user_id: authData.user.id,
          credits: 3,
          tier: 'basic',
          rollover_credits: 0
        }]);

      if (walletError) throw walletError;

      // Record the complementary credit transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert([{
          user_id: authData.user.id,
          amount: 3,
          type: 'purchase',
          status: 'completed'
        }]);

      if (transactionError) throw transactionError;

      // Now log the user in
      await login(email, password, role, false);

    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string, role: string, rememberMe: boolean): Promise<{ role: string | null }> => {
    try {
      // Set session persistence based on rememberMe
      await supabase.auth.setSession({
        access_token: '',
        refresh_token: ''
      });

      // First authenticate the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          persistSession: rememberMe
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Authentication failed');

      // Get user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      // If profile doesn't exist, create it using the role from auth metadata
      if (!profile) {
        const userRole = role || authData.user.user_metadata?.role || 'investor';
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email: authData.user.email,
            role: userRole
          }]);

        if (insertError) {
          throw new Error('Failed to create user profile. Please contact support.');
        }

        // Create credit wallet with 3 complementary credits for new users
        const { error: walletError } = await supabase
          .from('credit_wallets')
          .insert([{
            user_id: authData.user.id,
            credits: 3,
            tier: 'basic',
            rollover_credits: 0
          }]);

        if (walletError) {
          throw new Error('Failed to initialize credit wallet. Please contact support.');
        }

        // Record the complementary credit transaction
        const { error: transactionError } = await supabase
          .from('credit_transactions')
          .insert([{
            user_id: authData.user.id,
            amount: 3,
            type: 'purchase',
            status: 'completed'
          }]);

        if (transactionError) {
          console.error('Failed to record credit transaction:', transactionError);
        }

        // Fetch the newly created profile
        const { data: newProfile, error: newProfileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (newProfileError) {
          throw new Error('Failed to verify user profile. Please try again.');
        }

        // Verify role matches
        if (newProfile.role !== role) {
          throw new Error(`Please select ${newProfile.role} when logging in.`);
        }

        setIsAuthenticated(true);
        setUserRole(newProfile.role);
        setUser(authData.user);

        toast.success('Successfully logged in');
        return { role: newProfile.role };

      } else {
        // Verify role matches for existing profile
        if (profile.role !== role) {
          throw new Error(`Please select ${profile.role} when logging in.`);
        }

        setIsAuthenticated(true);
        setUserRole(profile.role);
        setUser(authData.user);

        toast.success('Successfully logged in');
        return { role: profile.role };
      }

    } catch (error: any) {
      setIsAuthenticated(false);
      setUser(null);
      setUserRole(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUser(null);
      setUserRole(null);
      navigate('/login');
      toast.success('Successfully logged out');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const updateProfile = async (data: { name: string; email: string }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: data.email,
        data: { name: data.name }
      });

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      userRole, 
      user,
      signUp,
      login, 
      logout,
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}