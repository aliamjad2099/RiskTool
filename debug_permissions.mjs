import { createClient } from '@supabase/supabase-js';

// Debug script to investigate user permission issues
const supabaseUrl = 'https://tztuagwtfjmujutuwmsm.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dHVhZ3d0ZmptdWp1dHV3bXNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTUxOTM2NCwiZXhwIjoyMDcxMDk1MzY0fQ.vF_5rdpbdq8NOKN6org_4qnF5AYH0z29hlmwQVDvDHs';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugUserPermissions() {
  try {
    console.log('🔍 Debugging user permissions for test4@riskguard.com...\n');

    // 1. Check if user_department_view exists
    console.log('1️⃣ Checking if user_department_view exists...');
    const { data: viewExists, error: viewError } = await supabase
      .from('user_department_view')
      .select('*')
      .limit(1);
    
    if (viewError) {
      console.error('❌ user_department_view does not exist:', viewError);
      console.log('Creating the view...\n');
      
      // Create the view
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE VIEW user_department_view AS
          SELECT 
              u.id as user_id,
              u.email,
              u.role,
              u.full_name,
              array_agg(ud.department_id) FILTER (WHERE ud.department_id IS NOT NULL) as department_ids,
              array_agg(d.name) FILTER (WHERE d.name IS NOT NULL) as department_names
          FROM users u 
          LEFT JOIN user_departments ud ON u.id = ud.user_id 
          LEFT JOIN departments d ON ud.department_id = d.id
          GROUP BY u.id, u.email, u.role, u.full_name;
        `
      });
      
      if (createError) {
        console.error('❌ Failed to create view:', createError);
        return;
      }
      console.log('✅ View created successfully\n');
    } else {
      console.log('✅ user_department_view exists\n');
    }

    // 2. Check all users in the database
    console.log('2️⃣ All users in database:');
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, full_name');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.table(allUsers);

    // 3. Find test4 user specifically
    console.log('\n3️⃣ Looking for test4@riskguard.com...');
    const test4Users = allUsers.filter(u => u.email === 'test4@riskguard.com');
    console.log('Found test4 users:', test4Users);

    if (test4Users.length === 0) {
      console.log('❌ test4@riskguard.com user not found in database!');
      return;
    }

    const test4User = test4Users[0];
    console.log('✅ Found test4 user:', test4User);

    // 4. Check user departments for test4
    console.log('\n4️⃣ User departments for test4:');
    const { data: userDepts, error: userDeptsError } = await supabase
      .from('user_departments')
      .select(`
        user_id,
        department_id,
        departments(id, name)
      `)
      .eq('user_id', test4User.id);
    
    if (userDeptsError) {
      console.error('❌ Error fetching user departments:', userDeptsError);
    } else {
      console.table(userDepts);
    }

    // 5. Check user_department_view for test4
    console.log('\n5️⃣ user_department_view for test4@riskguard.com:');
    const { data: viewData, error: viewDataError } = await supabase
      .from('user_department_view')
      .select('*')
      .eq('email', 'test4@riskguard.com');
    
    if (viewDataError) {
      console.error('❌ Error querying user_department_view:', viewDataError);
    } else {
      console.log('View data:', viewData);
    }

    // 6. Check all departments
    console.log('\n6️⃣ All departments:');
    const { data: depts, error: deptsError } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    
    if (deptsError) {
      console.error('❌ Error fetching departments:', deptsError);
    } else {
      console.table(depts);
    }

    // 7. Check Finance department specifically
    console.log('\n7️⃣ Finance department:');
    const { data: financeDept, error: financeError } = await supabase
      .from('departments')
      .select('*')
      .ilike('name', '%finance%');
    
    if (financeError) {
      console.error('❌ Error fetching Finance department:', financeError);
    } else {
      console.log('Finance department:', financeDept);
    }

    // 8. Check risks by department
    console.log('\n8️⃣ Risks by department:');
    const { data: risks, error: risksError } = await supabase
      .from('risks')
      .select(`
        id,
        risk_id,
        title,
        department_id,
        departments(name)
      `)
      .limit(10);
    
    if (risksError) {
      console.error('❌ Error fetching risks:', risksError);
    } else {
      console.table(risks);
    }

  } catch (error) {
    console.error('🚨 Debug script error:', error);
  }
}

// Run the debug script
debugUserPermissions();
