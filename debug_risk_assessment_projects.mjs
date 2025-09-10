import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tztuagwtfjmujutuwmsm.supabase.co';
const supabaseKey = 'sb_publishable_ZUE5T2eL54wFM3MR0-URyg_mSi8j-vF';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRiskAssessmentProjects() {
  console.log('🔍 Checking risk_assessment_projects table...\n');
  
  try {
    // 1. Check risk_assessment_projects table
    console.log('1️⃣ Checking risk_assessment_projects table...');
    const { data: projects, error: projectsError } = await supabase
      .from('risk_assessment_projects')
      .select('*');
    
    if (projectsError) {
      console.error('❌ risk_assessment_projects error:', projectsError);
    } else {
      console.log(`✅ Found ${projects?.length || 0} projects:`);
      projects?.forEach(project => {
        console.log(`   - ${project.name} (ID: ${project.id})`);
        console.log(`     Status: ${project.status}, Created: ${project.created_at}`);
      });
      
      // 2. Find Test RA Project ID
      const testProject = projects?.find(p => p.name === 'Test RA Project');
      if (testProject) {
        console.log(`\n✅ Test RA Project ID: ${testProject.id}`);
        
        // 3. Check which risks are assigned to this project
        const { data: projectRisks, error: riskError } = await supabase
          .from('risks')
          .select('id, title, risk_id, project_id')
          .eq('project_id', testProject.id);
        
        if (riskError) {
          console.error('❌ Risk query error:', riskError);
        } else {
          console.log(`\n2️⃣ Risks assigned to Test RA Project:`);
          console.log(`   Found ${projectRisks?.length || 0} risks:`);
          projectRisks?.forEach(risk => {
            console.log(`   - ${risk.title} (${risk.risk_id})`);
          });
        }
      }
    }
    
    // 4. Check all risks project assignments
    console.log('\n3️⃣ All risks project assignments:');
    const { data: allRisks, error: allRisksError } = await supabase
      .from('risks')
      .select('id, title, risk_id, project_id');
    
    if (allRisksError) {
      console.error('❌ All risks error:', allRisksError);
    } else {
      allRisks?.forEach(risk => {
        console.log(`   - ${risk.title}: ${risk.project_id || 'No project'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugRiskAssessmentProjects();
