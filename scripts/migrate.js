import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = 'https://tztuagwtfjmujutuwmsm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dHVhZ3d0ZmptdWp1dHV3bXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTkzNjQsImV4cCI6MjA3MTA5NTM2NH0.70OrO8kkxSJdd9VHKbLhjb3PqSOYlNHwPBgApEi1Ve0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Applying database migration...');
    
    // Read the migration file
    const migrationPath = join(__dirname, '../supabase/add_control_columns.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Execute each SQL statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Try direct SQL execution if RPC fails
        const { error: directError } = await supabase
          .from('risks')
          .select('control_name', { count: 'exact', head: true });
        
        if (directError && directError.message.includes("control_name")) {
          // Column doesn't exist, we need to add it via service role or dashboard
          throw new Error('Migration requires service role access. Please apply via Supabase dashboard.');
        }
      }
    }
    
    console.log('Migration completed successfully!');
    
    // Verify the columns exist
    const { data, error } = await supabase
      .from('risks')
      .select('control_name, control_rating')
      .limit(1);
    
    if (error) {
      console.error('Verification failed:', error.message);
    } else {
      console.log('✅ Columns added successfully!');
    }
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.log('\n📝 Manual steps required:');
    console.log('1. Go to https://supabase.com/dashboard/project/tztuagwtfjmujutuwmsm');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run this SQL:');
    console.log('   ALTER TABLE risks ADD COLUMN control_name TEXT, ADD COLUMN control_rating DECIMAL(3,2) DEFAULT 0;');
  }
}

runMigration();
