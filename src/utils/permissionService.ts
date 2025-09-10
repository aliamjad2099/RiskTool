import { supabase } from '../lib/supabase';

export interface UserPermissions {
  userId: string;
  email: string;
  role: string;
  departmentIds: string[];
  departmentNames: string[];
  isAdmin: boolean;
  isRiskTeamUser: boolean;
}

/**
 * Load user permissions from the database using the user_department_view
 */
export async function getUserPermissions(userId: string, email: string): Promise<UserPermissions | null> {
  try {
    console.log('🔍 Getting user permissions for:', { userId, email });
    
    // Try user_department_view first, but handle cases where it returns no rows
    const { data: userDeptData, error } = await supabase
      .from('user_department_view')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error loading from user_department_view:', error);
      // Fall back to manual join approach
    } else if (userDeptData && userDeptData.length > 0) {
      console.log('📊 Raw user department data from view:', userDeptData[0]);
      
      const permissions: UserPermissions = {
        userId,
        email,
        role: userDeptData[0].role || 'user',
        departmentIds: userDeptData[0].department_ids || [],
        departmentNames: userDeptData[0].department_names || [],
        isAdmin: userDeptData[0].role === 'admin',
        isRiskTeamUser: (userDeptData[0].department_names || []).includes('Risk')
      };

      console.log('✅ Processed permissions from view:', permissions);
      return permissions;
    }
    
    // Fallback: Manual join approach if view doesn't work
    console.log('⚠️ user_department_view returned no data, trying manual approach...');
    
    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('❌ Error loading user data:', userError);
      console.log('🔧 User exists in Auth but not in users table - creating basic permissions');
      
      // User exists in Auth but not in users table - return basic user permissions
      const basicPermissions: UserPermissions = {
        userId,
        email,
        role: 'user',
        departmentIds: [],
        departmentNames: [],
        isAdmin: false,
        isRiskTeamUser: false
      };
      
      console.log('✅ Returning basic permissions for Auth-only user:', basicPermissions);
      return basicPermissions;
    }
    
    // Get user departments
    const { data: userDepts, error: deptError } = await supabase
      .from('user_departments')
      .select(`
        department_id,
        departments:department_id (
          id,
          name
        )
      `)
      .eq('user_id', userId);
      
    if (deptError) {
      console.error('❌ Error loading user departments:', deptError);
      throw deptError;
    }
    
    console.log('📊 Manual join results:', { userData, userDepts });
    
    const departmentIds = userDepts?.map(ud => ud.department_id) || [];
    const departmentNames = userDepts?.map(ud => (ud.departments as any)?.name).filter(Boolean) || [];
    
    const permissions: UserPermissions = {
      userId,
      email,
      role: userData.role || 'user',
      departmentIds,
      departmentNames,
      isAdmin: userData.role === 'admin',
      isRiskTeamUser: departmentNames.includes('Risk')
    };

    console.log('✅ Processed permissions from manual join:', permissions);
    return permissions;
    
  } catch (error) {
    console.error('❌ Failed to load user permissions:', error);
    return null;
  }
}

/**
 * Check if user can view a risk based on department assignment
 */
export function canViewRisk(permissions: UserPermissions | null, riskDepartmentId: string): boolean {
  if (!permissions) {
    console.log('🔍 canViewRisk: No permissions - DENY');
    return false;
  }
  
  console.log('🔍 canViewRisk check:', {
    user: permissions.email,
    riskDepartmentId,
    userDepartmentIds: permissions.departmentIds,
    isAdmin: permissions.isAdmin,
    isRiskTeamUser: permissions.isRiskTeamUser,
    role: permissions.role
  });
  
  // Admin can view all risks
  if (permissions.isAdmin) {
    console.log('🔍 canViewRisk: Admin user - ALLOW');
    return true;
  }
  
  // Risk team users can view all risks
  if (permissions.isRiskTeamUser) {
    console.log('🔍 canViewRisk: Risk team user - ALLOW');
    return true;
  }
  
  // Department users can view risks from their assigned departments
  const canView = permissions.departmentIds.includes(riskDepartmentId);
  console.log(`🔍 canViewRisk: Department check - ${canView ? 'ALLOW' : 'DENY'} (${permissions.departmentIds.join(', ')} includes ${riskDepartmentId})`);
  return canView;
}

/**
 * Check if user can edit a risk
 */
export function canEditRisk(permissions: UserPermissions | null, riskDepartmentId: string): boolean {
  if (!permissions) return false;
  
  // Admin can edit all risks
  if (permissions.isAdmin) return true;
  
  // Only Risk team users can edit risks (across all departments)
  return permissions.isRiskTeamUser;
}

/**
 * Check if user can manage controls for a risk
 */
export function canManageControls(permissions: UserPermissions | null, riskDepartmentId: string): boolean {
  if (!permissions) return false;
  
  // Admin can manage all controls
  if (permissions.isAdmin) return true;
  
  // Department users can manage controls for their own department risks
  return permissions.departmentIds.includes(riskDepartmentId);
}

/**
 * Check if user can view evidence files
 */
export function canViewEvidence(permissions: UserPermissions | null): boolean {
  if (!permissions) return false;
  
  // Admin and Risk team users can view evidence
  return permissions.isAdmin || permissions.isRiskTeamUser;
}

/**
 * Filter risks based on user permissions
 */
export function filterRisksByPermissions(risks: any[], permissions: UserPermissions | null): any[] {
  if (!permissions) return [];
  
  return risks.filter(risk => canViewRisk(permissions, risk.department_id || ''));
}
