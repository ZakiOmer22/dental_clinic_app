// Front_End/src/components/ProtectedRoute.tsx
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getUser } from '@/services/api';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string | string[];
  requireSubscription?: boolean;
  redirectTo?: string;
}

/**
 * Protected Route Component with Role-Based Access Control
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  roles = null, 
  requireSubscription = false,
  redirectTo = '/login' 
}) => {
  const location = useLocation();
  const token = localStorage.getItem('accessToken');
  const user = getUser();

  // Not authenticated
  if (!token || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role requirements
  if (roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check subscription requirement
  if (requireSubscription) {
    const subscriptionStatus = user.subscriptionStatus || user.clinic?.subscription_status;
    if (subscriptionStatus !== 'active' && subscriptionStatus !== 'trialing') {
      return <Navigate to="/settings/billing" replace />;
    }
  }

  return <>{children}</>;
};

interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Public Route Component (redirects to dashboard if already authenticated)
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  redirectTo = '/dashboard' 
}) => {
  const token = localStorage.getItem('accessToken');
  
  if (token) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
};

interface AdminRouteProps {
  children: ReactNode;
  requireSubscription?: boolean;
  redirectTo?: string;
}

/**
 * Admin Only Route
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children, ...props }) => {
  return (
    <ProtectedRoute roles={['admin', 'super_admin']} {...props}>
      {children}
    </ProtectedRoute>
  );
};

interface SuperAdminRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Super Admin Only Route
 */
export const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({ children, ...props }) => {
  return (
    <ProtectedRoute roles="super_admin" {...props}>
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;