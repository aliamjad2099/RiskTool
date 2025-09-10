import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tztuagwtfjmujutuwmsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dHVhZ3d0ZmptdWp1dHV3bXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTkzNjQsImV4cCI6MjA3MTA5NTM2NH0.70OrO8kkxSJdd9VHKbLhjb3PqSOYlNHwPBgApEi1Ve0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseAccess() {
  console.log('🔍 Testing Supabase database access...\n');
  
  try {
    // Test 1: Basic connection and read access to risks table
    console.log('1️⃣ Testing risks table access...');
    const { data: risks, error: risksError } = await supabase
      .from('risks')
      .select('*')
      .limit(3);
    
    if (risksError) {
      console.log('❌ Cannot read risks table:', risksError.message);
    } else {
      console.log(`✅ Successfully read risks table (${risks?.length || 0} records)`);
      if (risks && risks.length > 0) {
        console.log('   Sample risk:', risks[0].risk_id, '-', risks[0].risk_name);
      }
    }
    
    // Test 2: Read access to departments table
    console.log('\n2️⃣ Testing departments table access...');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .limit(5);
    
    if (deptError) {
      console.log('❌ Cannot read departments table:', deptError.message);
    } else {
      console.log(`✅ Successfully read departments table (${departments?.length || 0} records)`);
      if (departments && departments.length > 0) {
        departments.forEach(dept => console.log(`   - ${dept.name} (${dept.department_id})`));
      }
    }
    
    // Test 3: Read access to users table
    console.log('\n3️⃣ Testing users table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('email, name, role')
      .limit(3);
    
    if (usersError) {
      console.log('❌ Cannot read users table:', usersError.message);
    } else {
      console.log(`✅ Successfully read users table (${users?.length || 0} records)`);
      if (users && users.length > 0) {
        users.forEach(user => console.log(`   - ${user.email} (${user.role})`));
      }
    }
    
    // Test 4: Test user_department_view 
    console.log('\n4️⃣ Testing user_department_view access...');
    const { data: userDepts, error: userDeptsError } = await supabase
      .from('user_department_view')
      .select('*')
      .limit(3);
    
    if (userDeptsError) {
      console.log('❌ Cannot read user_department_view:', userDeptsError.message);
    } else {
      console.log(`✅ Successfully read user_department_view (${userDepts?.length || 0} records)`);
      if (userDepts && userDepts.length > 0) {
        userDepts.forEach(ud => console.log(`   - ${ud.email} -> ${ud.department_name}`));
      }
    }
    
    // Test 5: Try to write (should fail for readonly)
    console.log('\n5️⃣ Testing write access (should fail for readonly)...');
    const { data: writeTest, error: writeError } = await supabase
      .from('risks')
      .insert([{ 
        risk_name: 'Test Risk - DELETE ME',
        risk_description: 'This is a test'
      }]);
    
    if (writeError) {
      console.log('✅ Confirmed readonly access - cannot write:', writeError.message);
    } else {
      console.log('⚠️  WARNING: Write access is enabled! This should be readonly.');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  }
}

testDatabaseAccess();
