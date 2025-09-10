import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tztuagwtfjmujutuwmsm.supabase.co';
const supabaseKey = 'sb_publishable_ZUE5T2eL54wFM3MR0-URyg_mSi8j-vF';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCorrectTest5User() {
  console.log('🔧 Fixing correct test5@riskguard.com user...\n');
  
  const correctUserId = '944cba55-e6b3-43b1-89b9-c5b5974c0a8c'; // From app logs
  const wrongUserId = '4cd456f3-e906-4782-ad36-6779f426f9be'; // I used wrong one
  
  try {
    // 1. Check both users
    console.log('1️⃣ Checking both test5@riskguard.com users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test5@riskguard.com');
    
    if (usersError) {
      console.error('❌ Users query error:', usersError);
      return;
    }
    
    console.log(`✅ Found ${users?.length || 0} test5@riskguard.com users:`);
    users?.forEach(user => {
      const isCorrect = user.id === correctUserId;
      console.log(`   ${isCorrect ? '✅ CORRECT' : '❌ WRONG'} ID: ${user.id}`);
      console.log(`     - Full name: ${user.full_name}`);
      console.log(`     - Email: ${user.email}`);
      console.log(`     - Created: ${user.created_at}`);
    });
    
    // 2. Remove wrong assignment
    console.log('\n2️⃣ Removing wrong department assignment...');
    const { error: removeError } = await supabase
      .from('user_departments')
      .delete()
      .eq('user_id', wrongUserId);
    
    if (removeError) {
      console.error('❌ Remove assignment error:', removeError);
    } else {
      console.log('✅ Removed assignment from wrong user');
    }
    
    // 3. Get Finance department
    const { data: financeDept, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('name', 'Finance')
      .single();
    
    if (deptError || !financeDept) {
      console.error('❌ Finance department not found:', deptError);
      return;
    }
    
    console.log('✅ Finance department:', financeDept);
    
    // 4. Assign correct user to Finance
    console.log('\n3️⃣ Assigning correct user to Finance...');
    const { data: assignment, error: assignError } = await supabase
      .from('user_departments')
      .insert({
        user_id: correctUserId,
        department_id: financeDept.id
      })
      .select();
    
    if (assignError) {
      console.error('❌ Assignment failed:', assignError);
    } else {
      console.log('✅ Assignment successful:', assignment);
    }
    
    // 5. Verify correct user assignment
    console.log('\n4️⃣ Verifying correct user assignment...');
    const { data: verification, error: verifyError } = await supabase
      .from('user_departments')
      .select('user_id, department_id')
      .eq('user_id', correctUserId);
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log(`✅ Correct user (${correctUserId}) now has ${verification?.length || 0} department assignments`);
    }
    
    // 6. Test user_department_view for correct user
    console.log('\n5️⃣ Testing user_department_view for correct user...');
    const { data: viewData, error: viewError } = await supabase
      .from('user_department_view')
      .select('*')
      .eq('user_id', correctUserId);
    
    if (viewError) {
      console.error('❌ View query error:', viewError);
    } else if (viewData && viewData.length > 0) {
      console.log('✅ user_department_view result:', viewData[0]);
      console.log('   - Department IDs:', viewData[0].department_ids);
      console.log('   - Department Names:', viewData[0].department_names);
    } else {
      console.log('❌ No data in user_department_view for correct user');
    }
    
    console.log('\n🎉 test5@riskguard.com (correct user) should now see Finance risks!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixCorrectTest5User();
