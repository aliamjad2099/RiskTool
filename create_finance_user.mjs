import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tztuagwtfjmujutuwmsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dHVhZ3d0ZmptdWp1dHV3bXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUxNzU4MzAsImV4cCI6MjA0MDc1MTgzMH0.7uSKeCO69WQNllZIGCfn3QHfwhpOTWy9pQoAo5a0wtQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFinanceUser() {
  console.log('🔧 Creating Finance user record and department assignment...');
  
  const userId = '128850eb-1509-4a17-8e5f-17f5d98280b7';
  const userEmail = 'test4@riskguard.com';
  
  try {
    // 1. Create user record
    console.log('1️⃣ Creating user record...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: userEmail,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (userError) {
      console.error('❌ User creation error:', userError);
    } else {
      console.log('✅ User record created/updated');
    }
    
    // 2. Get Finance department ID
    console.log('2️⃣ Finding Finance department...');
    const { data: deptData, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('name', 'Finance')
      .single();
    
    if (deptError) {
      console.error('❌ Department query error:', deptError);
      return;
    }
    
    console.log('✅ Finance department found:', deptData);
    
    // 3. Create department assignment
    console.log('3️⃣ Creating department assignment...');
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('user_departments')
      .upsert({
        user_id: userId,
        department_id: deptData.id,
        created_at: new Date().toISOString()
      });
    
    if (assignmentError) {
      console.error('❌ Assignment error:', assignmentError);
    } else {
      console.log('✅ Department assignment created');
    }
    
    // 4. Verify user_department_view
    console.log('4️⃣ Verifying user_department_view...');
    const { data: viewData, error: viewError } = await supabase
      .from('user_department_view')
      .select('*')
      .eq('user_id', userId);
    
    if (viewError) {
      console.error('❌ View query error:', viewError);
    } else {
      console.log('✅ user_department_view result:', viewData);
    }
    
    console.log('🎉 Finance user setup complete! Refresh the Risk Register to see Finance risks.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

createFinanceUser();
