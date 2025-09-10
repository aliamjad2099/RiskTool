import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tztuagwtfjmujutuwmsm.supabase.co';
const supabaseKey = 'sb_publishable_ZUE5T2eL54wFM3MR0-URyg_mSi8j-vF';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCorrectTest5User() {
  console.log('🔧 Creating missing user record for test5@riskguard.com...\n');
  
  const correctUserId = '944cba55-e6b3-43b1-89b9-c5b5974c0a8c'; // From app logs
  
  try {
    // 1. Create missing user record
    console.log('1️⃣ Creating user record...');
    const { data: userRecord, error: createError } = await supabase
      .from('users')
      .insert({
        id: correctUserId,
        email: 'test5@riskguard.com',
        full_name: 'Test Finance User',
        role: 'user',
        is_active: true,
        organization_id: '00000000-0000-0000-0000-000000000000'
      })
      .select();
    
    if (createError) {
      console.error('❌ User creation failed:', createError);
      return;
    }
    
    console.log('✅ User record created:', userRecord[0]);
    
    // 2. Get Finance department
    const { data: financeDept, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('name', 'Finance')
      .single();
    
    if (deptError) {
      console.error('❌ Finance department error:', deptError);
      return;
    }
    
    console.log('✅ Finance department:', financeDept);
    
    // 3. Assign user to Finance department
    console.log('\n2️⃣ Assigning user to Finance department...');
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
    
    // 4. Verify user_department_view
    console.log('\n3️⃣ Testing user_department_view...');
    const { data: viewData, error: viewError } = await supabase
      .from('user_department_view')
      .select('*')
      .eq('user_id', correctUserId);
    
    if (viewError) {
      console.error('❌ View query error:', viewError);
    } else if (viewData && viewData.length > 0) {
      console.log('✅ user_department_view result:');
      console.log('   - User ID:', viewData[0].user_id);
      console.log('   - Email:', viewData[0].email);
      console.log('   - Role:', viewData[0].role);
      console.log('   - Department IDs:', viewData[0].department_ids);
      console.log('   - Department Names:', viewData[0].department_names);
    } else {
      console.log('❌ No data in user_department_view');
    }
    
    // 5. Check Finance risks
    console.log('\n4️⃣ Checking Finance risks...');
    const { data: risks, error: riskError } = await supabase
      .from('risks')
      .select('id, title, department_id')
      .eq('department_id', financeDept.id);
    
    if (riskError) {
      console.error('❌ Finance risks error:', riskError);
    } else {
      console.log(`✅ Found ${risks?.length || 0} Finance risks:`);
      risks?.forEach(risk => {
        console.log(`   - ${risk.title}`);
      });
    }
    
    console.log('\n🎉 test5@riskguard.com should now see Finance risks!');
    console.log('   Refresh the Risk Register page to test.');
    
  } catch (error) {
    console.error('❌ Creation failed:', error);
  }
}

createCorrectTest5User();
