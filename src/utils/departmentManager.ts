import { supabase } from '../lib/supabase';

/**
 * Department Manager Utility
 * Provides consistent department management across the application
 */

export interface Department {
  id: string;
  name: string;
  organization_id: string;
  created_at?: string;
}

export interface DepartmentAssignment {
  user_id: string;
  department_id: string;
}

/**
 * Get or create a department by name
 * Uses the database function we created to ensure consistency
 */
export async function getOrCreateDepartment(
  departmentName: string, 
  organizationId: string = '00000000-0000-0000-0000-000000000000'
): Promise<{ data?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_or_create_department', {
      dept_name: departmentName,
      org_id: organizationId
    });

    if (error) throw error;

    return { data };
  } catch (error) {
    console.error('Error getting/creating department:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Assign user to department using the database function
 */
export async function assignUserToDepartment(
  userEmail: string,
  departmentName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔍 departmentManager: Attempting department assignment:', {
      userEmail,
      departmentName
    });

    const { data, error } = await supabase.rpc('assign_user_to_department', {
      user_email: userEmail,
      dept_name: departmentName
    });

    console.log('🔍 departmentManager: RPC response:', { data, error });

    if (error) throw error;

    console.log('✅ departmentManager: Assignment successful');
    return { success: data || true };
  } catch (error) {
    console.error('❌ departmentManager: Error assigning user to department:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get all departments for an organization
 */
export async function getDepartments(
  organizationId: string = '00000000-0000-0000-0000-000000000000'
): Promise<{ data?: Department[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) throw error;

    return { data: data || [] };
  } catch (error) {
    console.error('Error fetching departments:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Get user's department assignments
 */
export async function getUserDepartments(userId: string): Promise<{ data?: Department[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_departments')
      .select(`
        department_id,
        departments (
          id,
          name,
          organization_id,
          created_at
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const departments = data?.map(item => item.departments).filter(Boolean).flat() || [];
    return { data: departments as Department[] };
  } catch (error) {
    console.error('Error fetching user departments:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Standard department names used in the application
 * These ensure consistency when creating departments
 */
export const STANDARD_DEPARTMENTS = {
  IT_SECURITY: 'IT Security',
  FINANCE: 'Finance', 
  OPERATIONS: 'Operations',
  HUMAN_RESOURCES: 'Human Resources',
  MARKETING: 'Marketing',
  RISK: 'Risk',
  LEGAL: 'Legal',
  COMPLIANCE: 'Compliance'
} as const;

/**
 * Validate and normalize department name
 */
export function normalizeDepartmentName(name: string): string {
  const normalized = name.trim();
  
  // Check if it matches a standard department
  const standardValues = Object.values(STANDARD_DEPARTMENTS);
  const match = standardValues.find(std => 
    std.toLowerCase() === normalized.toLowerCase()
  );
  
  return match || normalized;
}
