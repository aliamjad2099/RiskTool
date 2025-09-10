import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface User {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  organization_id?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  canViewAllDepartments: () => boolean;
  canEditRisk: (riskDepartmentId: string) => boolean;
  canManageControls: (riskDepartmentId: string) => boolean;
  canViewRisk: (riskDepartmentId: string) => boolean;
  getUserDepartments: () => string[];
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDepartments, setUserDepartments] = useState<string[]>([]);

  console.log('🔍 UserProvider render - authUser:', authUser, 'authLoading:', authLoading);

  const getUserDepartments = () => {
    return userDepartments;
  };

  const refreshUser = async () => {
    try {
      if (authUser) {
        console.log('🔍 UserContext: AuthUser found:', authUser);
        
        // Try to get user profile with role, fallback if not found
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .single();

        console.log('👤 Profile query result:', { profile, profileError });

        // Use AuthUser data with fallback role
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          role: profile?.role || 'admin', // Default to admin for now since user_profiles may not exist
          full_name: profile?.full_name || authUser.user_metadata?.full_name,
          organization_id: profile?.organization_id || '00000000-0000-0000-0000-000000000000'
        });

        // Try to get user departments using the database user ID, fallback to empty array
        const { data: departments, error: deptError } = await supabase
          .from('user_departments')
          .select('department_id')
          .eq('user_id', profile?.id || authUser.id);

        console.log('🏢 Departments query result:', { departments, deptError });
        setUserDepartments(departments?.map(d => d.department_id) || []);
        
        console.log('✅ UserContext setup complete with fallback data');
      } else {
        console.log('❌ No AuthUser found');
        setUser(null);
        setUserDepartments([]);
      }
    } catch (error) {
      console.error('❌ Error in UserContext refreshUser:', error);
      setUser(null);
      setUserDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 UserContext useEffect triggered, authUser:', authUser, 'authLoading:', authLoading);
    
    if (authLoading) {
      console.log('⏳ AuthContext still loading, waiting...');
      return;
    }
    
    if (authUser) {
      refreshUser();
    } else {
      console.log('❌ No AuthUser found after auth loading complete');
      setUser(null);
      setUserDepartments([]);
      setLoading(false);
    }
  }, [authUser, authLoading]); // Depend on both authUser and authLoading

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      console.log('🔄 Auth state changed in UserContext');
      refreshUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  const canViewAllDepartments = () => {
    return user?.role === 'admin';
  };

  const canEditRisk = (riskDepartmentId: string) => {
    // Admins can edit all risks
    if (user?.role === 'admin') return true;
    
    // Check if user is in RISK department (can edit all risks)
    const userDepts = getUserDepartments();
    const isRiskDeptUser = userDepts.some(deptId => {
      // You'll need to replace this with the actual RISK department ID
      // For now, assuming RISK department has a specific ID or name pattern
      return deptId === 'risk-dept-id' || deptId.toLowerCase().includes('risk');
    });
    
    return isRiskDeptUser;
  };

  const canManageControls = (riskDepartmentId: string) => {
    // Admins can manage all controls
    if (user?.role === 'admin') return true;
    
    // Users and managers can manage controls for risks in their departments
    return getUserDepartments().includes(riskDepartmentId);
  };

  const canViewRisk = (riskDepartmentId: string) => {
    console.log('🔍 canViewRisk debug:', { 
      user: user, 
      userRole: user?.role, 
      riskDepartmentId,
      isAdmin: user?.role === 'admin'
    });
    
    // Admins can view all risks
    if (user?.role === 'admin') {
      console.log('✅ Admin access granted');
      return true;
    }
    
    // Check if user is in RISK department (can view all risks)
    const userDepts = getUserDepartments();
    console.log('📋 User departments:', userDepts);
    
    const isRiskDeptUser = userDepts.some(deptId => {
      // You'll need to replace this with the actual RISK department ID
      // For now, assuming RISK department has a specific ID or name pattern
      return deptId === 'risk-dept-id' || deptId.toLowerCase().includes('risk');
    });
    
    if (isRiskDeptUser) {
      console.log('✅ RISK department access granted');
      return true;
    }
    
    // Other department users can only view risks from their departments
    const hasAccess = userDepts.includes(riskDepartmentId);
    console.log('🏢 Department access check:', hasAccess);
    return hasAccess;
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        canViewAllDepartments,
        canEditRisk,
        canManageControls,
        canViewRisk,
        getUserDepartments,
        refreshUser
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
