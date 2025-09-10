import { supabase } from '../lib/supabase';

/**
 * Permission Manager - Handles department-based permissions consistently
 * Solves the UUID vs name mismatch in permission checking
 */

export interface DepartmentInfo {
  id: string;
  name: string;
}

let departmentCache: DepartmentInfo[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all departments (cached for performance)
 */
async function getDepartments(): Promise<DepartmentInfo[]> {
  const now = Date.now();
  
  if (departmentCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
    return departmentCache;
  }

  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .order('name');
    
    if (error) throw error;
    
    departmentCache = data || [];
    cacheTimestamp = now;
    return departmentCache;
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
}

/**
 * Convert department UUIDs to names
 */
export async function getDepartmentNames(departmentIds: string[]): Promise<string[]> {
  const departments = await getDepartments();
  const departmentMap = new Map(departments.map(d => [d.id, d.name]));
  
  return departmentIds
    .map(id => departmentMap.get(id))
    .filter((name): name is string => name !== undefined);
}

/**
 * Check if user has any of the specified department roles
 */
export async function hasAnyDepartmentRole(
  userDepartmentIds: string[], 
  targetDepartmentNames: string[]
): Promise<boolean> {
  const departments = await getDepartments();
  const targetIds = departments
    .filter(d => targetDepartmentNames.some(name => 
      d.name.toLowerCase() === name.toLowerCase()
    ))
    .map(d => d.id);
  
  return targetIds.some(id => userDepartmentIds.includes(id));
}

/**
 * Enhanced permission checker for Risk team users
 */
export async function isRiskTeamUser(userDepartmentIds: string[]): Promise<boolean> {
  return hasAnyDepartmentRole(userDepartmentIds, [
    'Risk',
    'Risk Team', 
    'Risk Department',
    'Risk Management'
  ]);
}

/**
 * Check if user can manage controls for a specific department
 */
export function canManageControlsForDepartment(
  userDepartmentIds: string[], 
  targetDepartmentId: string
): boolean {
  return userDepartmentIds.includes(targetDepartmentId);
}

/**
 * Clear department cache (useful for testing or after department changes)
 */
export function clearDepartmentCache(): void {
  departmentCache = [];
  cacheTimestamp = 0;
}
