import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  user: any;
  isLoadingAuth: boolean;
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
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔄 AuthProvider: Starting auth initialization');
    console.log('Current auth state:', { isAuthenticated, userRole, isLoadingAuth });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state change event:', event);
      console.log('Session present:', !!session);

      try {
        if (session?.user) {
          console.log('👤 User found in session:', session.user.email);
          
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            if (profileError.code !== 'PGRST116') {
              console.error('❌ Error fetching user profile:', profileError);
              throw profileError;
            }
            console.log('⚠️ No user profile found');
          } else {
            console.log('✅ User profile loaded:', profile);
          }

          setIsAuthenticated(true);
          setUser(session.user);
          setUserRole(profile?.role || null);
          console.log('🔐 Auth state updated - authenticated:', { role: profile?.role });
        } else {
          console.log('👤 No user in session, clearing auth state');
          setIsAuthenticated(false);
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error);
        setIsAuthenticated(false);
        setUser(null);
        setUserRole(null);
      } finally {
        console.log('🏁 Finishing auth state change, setting isLoadingAuth to false');
        setIsLoadingAuth(false);
      }
    });

    // Initial session check
    console.log('🔍 Checking initial session');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check result:', !!session);
      if (!session) {
        console.log('No initial session found, setting isLoadingAuth to false');
        setIsLoadingAuth(false);
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, role: string, phoneNumber: string) => {
    console.log('📝 Starting signup process');
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        throw new Error('This email is already registered. Please log in or use a different email.');
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
            phone_number: phoneNumber
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create user account');

      console.log('✅ User created successfully:', authData.user.email);

      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: authData.user.email,
          role: role,
          phone_number: phoneNumber,
          created_at: new Date().toISOString()
        }]);

      if (profileError) throw profileError;

      const { error: walletError } = await supabase
        .from('credit_wallets')
        .insert([{
          user_id: authData.user.id,
          credits: 3,
          tier: 'basic',
          rollover_credits: 0
        }]);

      if (walletError) throw walletError;

      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert([{
          user_id: authData.user.id,
          amount: 3,
          type: 'purchase',
          status: 'completed',
          created_at: new Date().toISOString()
        }]);

      if (transactionError) throw transactionError;

      await supabase
        .from('analytics_events')
        .insert([{
          user_id: authData.user.id,
          event_type: 'auth',
          event_name: 'signup',
          metadata: {
            role: role,
            signup_method: 'email'
          }
        }]);

      console.log('✅ All signup related records created successfully');
      toast.success('Account created successfully');
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string, role: string, rememberMe: boolean): Promise<{ role: string | null }> => {
    console.log('🔑 Starting login process:', { email, role, rememberMe });
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          persistSession: rememberMe
        }
      });

      if (authError) {
        console.error('❌ Auth error:', authError);
        throw authError;
      }
      
      if (!authData.user) {
        console.error('❌ No user data returned');
        throw new Error('Authentication failed');
      }

      console.log('✅ Authentication successful');

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError);
        throw profileError;
      }

      console.log('✅ User profile loaded:', profile);

      if (profile.role !== role) {
        console.error('❌ Role mismatch:', { expected: role, actual: profile.role });
        throw new Error(`Please select ${profile.role} when logging in.`);
      }

      console.log('✅ Login successful:', { role: profile.role });
      return { role: profile.role };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('🚪 Starting logout process');
    try {
      await supabase.auth.signOut();
      navigate('/login');
      console.log('✅ Logout successful');
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const updateProfile = async (data: { name: string; email: string }) => {
    console.log('📝 Starting profile update');
    try {
      const { error } = await supabase.auth.updateUser({
        email: data.email,
        data: { name: data.name }
      });

      if (error) throw error;
      console.log('✅ Profile updated successfully');
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      userRole, 
      user,
      isLoadingAuth,
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