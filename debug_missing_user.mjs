import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tztuagwtfjmujutuwmsm.supabase.co';
const supabaseKey = 'sb_publishable_ZUE5T2eL54wFM3MR0-URyg_mSi8j-vF';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMissingUser() {
  console.log('🔍 Checking Finance user issues...\n');
  
  try {
    // 1. Check both users
    console.log('1️⃣ Checking both Finance users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('email', ['test4@riskguard.com', 'test5@riskguard.com']);
    
    if (usersError) {
      console.error('❌ Users query error:', usersError);
    } else {
      console.log(`✅ Found ${users?.length || 0} Finance users:`);
      users?.forEach(user => {
        console.log(`   ${user.email}:`, {
          id: user.id,
          full_name: user.full_name,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at
        });
      });
    }
    
    // 2. Check department assignments for all Finance users
    if (users && users.length > 0) {
      console.log('\n2️⃣ Checking department assignments...');
      for (const user of users) {
        const { data: userDepts, error: deptError } = await supabase
          .from('user_departments')
          .select('department_id')
          .eq('user_id', user.id);
        
        if (deptError) {
          console.error(`❌ Department assignment error for ${user.email}:`, deptError);
        } else {
          console.log(`   ${user.email}: ${userDepts?.length || 0} departments assigned`);
          if (userDepts && userDepts.length > 0) {
            // Get department names
            const { data: depts } = await supabase
              .from('departments')
              .select('id, name')
              .in('id', userDepts.map(ud => ud.department_id));
            
            depts?.forEach(dept => {
              console.log(`     - ${dept.name} (${dept.id})`);
            });
          }
        }
      }
    }
    
    // 5. Check Finance risks specifically
    console.log('\n5️⃣ Checking Finance risks...');
    const { data: financeRisks, error: riskError } = await supabase
      .from('risks')
      .select(`
        id, title, department_id,
        departments:department_id (name)
      `)
      .eq('departments.name', 'Finance');
    
    if (riskError) {
      console.error('❌ Finance risks query error:', riskError);
    } else {
      console.log(`✅ Found ${financeRisks?.length || 0} Finance risks:`);
      financeRisks?.forEach(risk => {
        console.log(`   ${risk.title} (dept: ${risk.departments?.name})`);
      });
    }
    
    // 3. Check all users in organization to see what's loading
    console.log('\n3️⃣ Checking all users in organization...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, full_name, is_active')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allUsersError) {
      console.error('❌ All users query error:', allUsersError);
    } else {
      console.log(`✅ Recent users in database (${allUsers?.length}):`);
      allUsers?.forEach(user => {
        console.log(`   ${user.email} - ${user.full_name} - ${user.is_active ? 'Active' : 'Inactive'}`);
      });
    }
    
    // 4. Check Finance department
    console.log('\n4️⃣ Checking Finance department...');
    const { data: financeData, error: financeError } = await supabase
      .from('departments')
      .select('*')
      .eq('name', 'Finance');
    
    if (financeError) {
      console.error('❌ Finance department query error:', financeError);
    } else {
      console.log(`✅ Finance department:`, financeData);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugMissingUser();
