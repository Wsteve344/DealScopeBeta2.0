import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';
import toast from 'react-hot-toast';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: 'investor' | 'analyst';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole }) => {
  const location = useLocation();
  const { isAuthenticated, userRole, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    toast.error('Please log in to continue');
    return <Navigate to="/login\" state={{ from: location }} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    toast.error('You do not have permission to access this page');
    return <Navigate to="/\" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;