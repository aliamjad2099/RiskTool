import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tztuagwtfjmujutuwmsm.supabase.co';
const supabaseKey = 'sb_publishable_ZUE5T2eL54wFM3MR0-URyg_mSi8j-vF';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPermissionService() {
  console.log('🔍 Debugging permission service for test5@riskguard.com...\n');
  
  const userId = '4cd456f3-e906-4782-ad36-6779f426f9be';
  const email = 'test5@riskguard.com';
  
  try {
    // 1. Test user_department_view (what the permission service uses first)
    console.log('1️⃣ Testing user_department_view...');
    const { data: viewData, error: viewError } = await supabase
      .from('user_department_view')
      .select('*')
      .eq('user_id', userId);

    if (viewError) {
      console.error('❌ user_department_view error:', viewError);
    } else {
      console.log('✅ user_department_view result:', viewData);
      if (viewData && viewData.length > 0) {
        console.log('   - User Role:', viewData[0].role);
        console.log('   - Department IDs:', viewData[0].department_ids);
        console.log('   - Department Names:', viewData[0].department_names);
      } else {
        console.log('   - NO DATA RETURNED from view');
      }
    }
    
    // 2. Test manual approach (fallback)
    console.log('\n2️⃣ Testing manual approach...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('❌ Users table error:', userError);
    } else {
      console.log('✅ Users table result:', userData);
    }
    
    // 3. Test user_departments
    console.log('\n3️⃣ Testing user_departments...');
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
      console.error('❌ user_departments error:', deptError);
    } else {
      console.log('✅ user_departments result:', userDepts);
      
      if (userDepts && userDepts.length > 0) {
        const departmentIds = userDepts.map(ud => ud.department_id);
        const departmentNames = userDepts.map(ud => (ud.departments)?.name).filter(Boolean);
        
        console.log('   - Processed department IDs:', departmentIds);
        console.log('   - Processed department names:', departmentNames);
      }
    }
    
    // 4. Check if user_department_view exists and has data for any user
    console.log('\n4️⃣ Testing user_department_view for all users...');
    const { data: allViewData, error: allViewError } = await supabase
      .from('user_department_view')
      .select('user_id, email, department_ids, department_names')
      .limit(5);
      
    if (allViewError) {
      console.error('❌ user_department_view (all users) error:', allViewError);
    } else {
      console.log('✅ user_department_view (sample):', allViewData);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugPermissionService();
