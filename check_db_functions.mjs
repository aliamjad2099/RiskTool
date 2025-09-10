import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tztuagwtfjmujutuwmsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dHVhZ3d0ZmptdWp1dHV3bXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUxNzU4MzAsImV4cCI6MjA0MDc1MTgzMH0.7uSKeCO69WQNllZIGCfn3QHfwhpOTWy9pQoAo5a0wtQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseFunctions() {
  console.log('🔍 Checking if required database functions exist...');
  
  try {
    // Test assign_user_to_department function
    console.log('\n1️⃣ Testing assign_user_to_department function...');
    const { data: assignResult, error: assignError } = await supabase
      .rpc('assign_user_to_department', {
        user_email: 'test@example.com', // Test email that won't exist
        dept_name: 'Test Department'
      });
    
    if (assignError) {
      if (assignError.message.includes('function assign_user_to_department') || 
          assignError.code === '42883') {
        console.log('❌ assign_user_to_department function MISSING');
      } else {
        console.log('✅ assign_user_to_department function EXISTS (test failed due to non-existent user - expected)');
        console.log('   Error:', assignError.message);
      }
    } else {
      console.log('✅ assign_user_to_department function EXISTS and working');
    }
    
    // Test get_or_create_department function  
    console.log('\n2️⃣ Testing get_or_create_department function...');
    const { data: createResult, error: createError } = await supabase
      .rpc('get_or_create_department', {
        dept_name: 'Test Department',
        org_id: '00000000-0000-0000-0000-000000000000'
      });
    
    if (createError) {
      if (createError.message.includes('function get_or_create_department') || 
          createError.code === '42883') {
        console.log('❌ get_or_create_department function MISSING');
      } else {
        console.log('✅ get_or_create_department function EXISTS');
        console.log('   Error:', createError.message);
      }
    } else {
      console.log('✅ get_or_create_department function EXISTS and working');
      console.log('   Result:', createResult);
    }
    
  } catch (error) {
    console.error('❌ Error testing functions:', error);
  }
}

checkDatabaseFunctions();
