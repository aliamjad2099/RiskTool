import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tztuagwtfjmujutuwmsm.supabase.co';
const supabaseKey = 'sb_publishable_ZUE5T2eL54wFM3MR0-URyg_mSi8j-vF';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTest5User() {
  console.log('🔧 Fixing test5@riskguard.com department assignment...\n');
  
  try {
    // 1. Get user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'test5@riskguard.com')
      .single();
    
    if (userError || !user) {
      console.error('❌ User not found:', userError);
      return;
    }
    
    console.log('✅ Found user:', user);
    
    // 2. Get Finance department ID
    const { data: financeDept, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('name', 'Finance')
      .single();
    
    if (deptError || !financeDept) {
      console.error('❌ Finance department not found:', deptError);
      return;
    }
    
    console.log('✅ Found Finance department:', financeDept);
    
    // 3. Assign user to Finance department
    const { data: assignment, error: assignError } = await supabase
      .from('user_departments')
      .insert({
        user_id: user.id,
        department_id: financeDept.id
      })
      .select();
    
    if (assignError) {
      console.error('❌ Assignment failed:', assignError);
    } else {
      console.log('✅ Assignment successful:', assignment);
    }
    
    // 4. Verify assignment
    const { data: verification, error: verifyError } = await supabase
      .from('user_departments')
      .select(`
        user_id,
        department_id
      `)
      .eq('user_id', user.id);
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ User now has', verification?.length || 0, 'department assignments');
    }
    
    // 5. Check Finance risks (without joins)
    console.log('\n📋 Checking Finance risks...');
    const { data: risks, error: riskError } = await supabase
      .from('risks')
      .select('id, title, department_id')
      .eq('department_id', financeDept.id);
    
    if (riskError) {
      console.error('❌ Risk query failed:', riskError);
    } else {
      console.log(`✅ Found ${risks?.length || 0} Finance risks:`);
      risks?.forEach(risk => {
        console.log(`   - ${risk.title} (ID: ${risk.id})`);
      });
    }
    
    console.log('\n🎉 test5@riskguard.com should now see Finance risks!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixTest5User();
