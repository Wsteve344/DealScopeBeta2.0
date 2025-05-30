import { NavigateFunction } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface LoginResponse {
  role: string | null;
}

interface LoginFunction {
  (email: string, password: string, role: string, rememberMe: boolean): Promise<LoginResponse>;
}

interface LoginHandlerParams {
  email: string;
  password: string;
  selectedRole: string;
  rememberMe: boolean;
  setLoading: (loading: boolean) => void;
  navigate: NavigateFunction;
  login: LoginFunction;
}

export const handleLogin = async ({
  email,
  password,
  selectedRole,
  rememberMe,
  setLoading,
  navigate,
  login
}: LoginHandlerParams): Promise<void> => {
  setLoading(true);

  try {
    // Attempt login and get role from response
    const { role } = await login(email, password, selectedRole, rememberMe);

    if (!role) {
      throw new Error('No role returned from login');
    }

    // Handle navigation based on user role
    switch (role) {
      case 'investor':
        navigate('/investor/dashboard');
        break;
      case 'analyst':
        navigate('/analyst');
        break;
      default:
        navigate('/');
        break;
    }

    // Show success message
    toast.success('Login successful');
  } catch (error) {
    // Type guard to ensure error is an Error object
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';

    // Show error message to user
    toast.error(errorMessage);

    // Re-throw error for potential upstream handling
    throw error;
  } finally {
    // Reset loading state regardless of outcome
    setLoading(false);
  }
};