import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xtyobkihlpvkqcxcotiv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0eW9ia2lobHB2a3FjeGNvdGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQzMTcxMTIsImV4cCI6MjAzOTg5MzExMn0.wWV6Wzq_PT6IbmZdoUIm8VYzuWlUJhqRbsB-DOgRbPM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRiskFiltering() {
  console.log('🔍 Debugging Risk Filtering for Finance User');
  
  try {
    // Get Finance user permissions
    const financeUserId = 'dea4011d-10e8-48de-9cf9-10b7964c00e5';
    
    console.log('\n1️⃣ Finance User Permissions:');
    const { data: permissions, error: permError } = await supabase
      .from('user_department_view')
      .select('*')
      .eq('user_id', financeUserId)
      .single();
    
    if (permError) {
      console.error('Permission error:', permError);
      return;
    }
    
    console.log('Finance user permissions:', permissions);
    
    // Get all risks with their department info
    console.log('\n2️⃣ All Risks with Department Info:');
    const { data: risks, error: risksError } = await supabase
      .from('risks')
      .select('risk_id, title, department_id')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000');
    
    if (risksError) {
      console.error('Risks error:', risksError);
      return;
    }
    
    console.log('All risks:', risks);
    
    // Get department names for the risks
    console.log('\n3️⃣ Department Details:');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000');
    
    if (deptError) {
      console.error('Departments error:', deptError);
      return;
    }
    
    console.log('All departments:', departments);
    
    // Show which risks belong to which departments
    console.log('\n4️⃣ Risk-Department Mapping:');
    const riskMapping = risks.map(risk => {
      const dept = departments.find(d => d.id === risk.department_id);
      return {
        risk_id: risk.risk_id,
        title: risk.title,
        department_id: risk.department_id,
        department_name: dept?.name || 'Unknown'
      };
    });
    
    console.table(riskMapping);
    
    // Test the filtering logic
    console.log('\n5️⃣ Testing Filter Logic:');
    const financeUserDepartments = permissions.department_ids;
    console.log('Finance user departments:', financeUserDepartments);
    
    const filteredRisks = risks.filter(risk => {
      const shouldShow = financeUserDepartments.includes(risk.department_id);
      console.log(`Risk ${risk.risk_id}: department_id=${risk.department_id}, shouldShow=${shouldShow}`);
      return shouldShow;
    });
    
    console.log('\n6️⃣ Filtered Results:');
    console.log(`Finance user should see ${filteredRisks.length} out of ${risks.length} risks:`);
    console.table(filteredRisks.map(risk => ({
      risk_id: risk.risk_id,
      title: risk.title,
      department_id: risk.department_id
    })));
    
    // Check if Finance department ID matches
    console.log('\n7️⃣ Department ID Analysis:');
    const financeDepIds = financeUserDepartments;
    console.log('Finance user department IDs:', financeDepIds);
    
    risks.forEach(risk => {
      console.log(`Risk ${risk.risk_id}:`);
      console.log(`  - department_id: "${risk.department_id}"`);
      console.log(`  - is in user departments: ${financeDepIds.includes(risk.department_id)}`);
      console.log(`  - exact match check: ${JSON.stringify(risk.department_id)} === ${JSON.stringify(financeDepIds[0])}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugRiskFiltering();
