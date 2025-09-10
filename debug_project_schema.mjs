import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tztuagwtfjmujutuwmsm.supabase.co';
const supabaseKey = 'sb_publishable_ZUE5T2eL54wFM3MR0-URyg_mSi8j-vF';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProjectSchema() {
  console.log('🔍 Debugging project-risk relationship and schema...\n');
  
  try {
    // 1. Check projects table
    console.log('1️⃣ Checking projects table...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*');
    
    if (projectsError) {
      console.error('❌ Projects error:', projectsError);
    } else {
      console.log(`✅ Found ${projects?.length || 0} projects:`);
      projects?.forEach(project => {
        console.log(`   - ${project.name} (ID: ${project.id})`);
        console.log(`     Status: ${project.status}, Created: ${project.created_at}`);
      });
    }
    
    // 2. Check risks table project_id column
    console.log('\n2️⃣ Checking risks table project assignments...');
    const { data: risks, error: risksError } = await supabase
      .from('risks')
      .select('id, title, project_id, risk_id');
    
    if (risksError) {
      console.error('❌ Risks error:', risksError);
    } else {
      console.log(`✅ Found ${risks?.length || 0} risks:`);
      risks?.forEach(risk => {
        console.log(`   - ${risk.title} (${risk.risk_id})`);
        console.log(`     Project ID: ${risk.project_id || 'NULL'}`);
      });
    }
    
    // 3. Check which risks are assigned to "Test RA Project"
    if (projects && projects.length > 0) {
      const testProject = projects.find(p => p.name === 'Test RA Project');
      if (testProject) {
        console.log(`\n3️⃣ Checking risks assigned to Test RA Project (${testProject.id})...`);
        const { data: projectRisks, error: projectRisksError } = await supabase
          .from('risks')
          .select('id, title, risk_id, project_id')
          .eq('project_id', testProject.id);
        
        if (projectRisksError) {
          console.error('❌ Project risks error:', projectRisksError);
        } else {
          console.log(`✅ Found ${projectRisks?.length || 0} risks assigned to Test RA Project:`);
          projectRisks?.forEach(risk => {
            console.log(`   - ${risk.title} (${risk.risk_id})`);
          });
        }
      }
    }
    
    // 4. Check foreign key constraints
    console.log('\n4️⃣ Checking database schema for project-risk relationship...');
    const { data: schema, error: schemaError } = await supabase
      .rpc('get_table_info', { table_name: 'risks' });
    
    if (schemaError) {
      console.log('⚠️ Could not get schema info, checking manually...');
    }
    
    // 5. Try to get one risk with project info
    console.log('\n5️⃣ Testing project join...');
    const { data: riskWithProject, error: joinError } = await supabase
      .from('risks')
      .select(`
        id, title, risk_id, project_id,
        projects:project_id (
          id, name, status
        )
      `)
      .limit(5);
    
    if (joinError) {
      console.error('❌ Project join error:', joinError);
    } else {
      console.log('✅ Risk-Project join successful:');
      riskWithProject?.forEach(risk => {
        console.log(`   - ${risk.title}: Project = ${risk.projects?.name || 'No Project'}`);
      });
    }
    
    console.log('\n6️⃣ Summary of findings:');
    console.log(`   - Total projects: ${projects?.length || 0}`);
    console.log(`   - Total risks: ${risks?.length || 0}`);
    console.log(`   - Risks with projects: ${risks?.filter(r => r.project_id).length || 0}`);
    console.log(`   - Risks without projects: ${risks?.filter(r => !r.project_id).length || 0}`);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugProjectSchema();
