import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface Risk {
  id: string;
  organization_id: string;
  risk_id: string;
  title: string;
  description?: string;
  inherent_likelihood: number;
  inherent_impact: number;
  inherent_score?: number;
  residual_likelihood?: number;
  residual_impact?: number;
  residual_score?: number;
  department_id?: string;
  category_id?: string;
  priority?: string;
  identified_date?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  departments?: { name: string };
  risk_categories?: { name: string };
  control_id?: string;
  control_name?: string;
  control_rating?: number;
  department_name?: string;
  due_date?: string;
  comments?: string;
}

interface Department {
  id: string;
  name: string;
}

interface Control {
  id: string;
  title: string;
}

interface RiskRegisterProps {
  onBack: () => void;
  selectedProjectId?: string | null;
  selectedProjectName?: string | null;
  onClearProject?: () => void;
}

const RiskRegister: React.FC<RiskRegisterProps> = ({ onBack, selectedProjectId, selectedProjectName, onClearProject }) => {
  const [risks, setRisks] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRisk, setEditingRisk] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    riskLevel: 'all',
    department: 'all',
    project: 'all'
  });
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const hasLoadedSamples = useRef(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    department_id: '',
    inherent_likelihood: 3,
    inherent_impact: 3,
    priority: '',
    identified_date: '',
    control_name: '',
    control_rating: 0,
    due_date: '',
    comments: ''
  });

  const [riskMatrix, setRiskMatrix] = useState<any>(null);

  // Map of known sample category names to IDs inserted in loadSampleData()
  const categoryNameToId: Record<string, string> = {
    Security: 'aaaa0000-0000-0000-0000-000000000001',
    Financial: 'aaaa0000-0000-0000-0000-000000000002',
    Compliance: 'aaaa0000-0000-0000-0000-000000000003',
    Technology: 'aaaa0000-0000-0000-0000-000000000004',
    Operational: 'aaaa0000-0000-0000-0000-000000000005',
    Environmental: 'aaaa0000-0000-0000-0000-000000000006',
    Reputational: 'aaaa0000-0000-0000-0000-000000000007'
  };

  useEffect(() => {
    console.log('RiskRegister component mounted - loading data...');
    loadRiskMatrix();
    loadRisks();
    loadControls();
    loadCategories();
    loadDepartments();
    loadProjects();
  }, []);

  // Reload risks when project filter changes
  useEffect(() => {
    if (selectedProjectId !== undefined) {
      loadRisks();
    }
  }, [selectedProjectId]);

  const loadControls = async () => {
    try {
      const { data, error } = await supabase
        .from('controls')
        .select('id, title')
        .eq('organization_id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      // Controls are now stored directly in risks table
    } catch (error) {
      console.error('Error loading controls:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('risk_categories')
        .select('id, name')
        .eq('organization_id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadRiskMatrix = async () => {
    try {
      const { data, error } = await supabase
        .from('risk_matrix_config')
        .select('*')
        .eq('organization_id', '00000000-0000-0000-0000-000000000000')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        console.log('Loaded risk matrix config:', data);
        setRiskMatrix(data);
      } else {
        console.log('No risk matrix config found, using defaults');
        // Fallback to default if no configuration found
        setRiskMatrix({
          matrix_size: 5,
          risk_levels: [
            {"id": "very_low", "name": "VERY LOW", "minScore": 1, "maxScore": 4, "color": "rg-risk-very-low"},
            {"id": "low", "name": "LOW", "minScore": 5, "maxScore": 9, "color": "rg-risk-low"},
            {"id": "medium", "name": "MEDIUM", "minScore": 10, "maxScore": 14, "color": "rg-risk-medium"},
            {"id": "high", "name": "HIGH", "minScore": 15, "maxScore": 19, "color": "rg-risk-high"},
            {"id": "critical", "name": "CRITICAL", "minScore": 20, "maxScore": 25, "color": "rg-risk-critical"}
          ]
        });
      }
    } catch (error) {
      console.error('Error loading risk matrix:', error);
      // Fallback to default if error occurred
      setRiskMatrix({
        matrix_size: 5,
        risk_levels: [
          {"id": "very_low", "name": "VERY LOW", "minScore": 1, "maxScore": 4, "color": "rg-risk-very-low"},
          {"id": "low", "name": "LOW", "minScore": 5, "maxScore": 9, "color": "rg-risk-low"},
          {"id": "medium", "name": "MEDIUM", "minScore": 10, "maxScore": 14, "color": "rg-risk-medium"},
          {"id": "high", "name": "HIGH", "minScore": 15, "maxScore": 19, "color": "rg-risk-high"},
          {"id": "critical", "name": "CRITICAL", "minScore": 20, "maxScore": 25, "color": "rg-risk-critical"}
        ]
      });
    }
  };

  const loadDepartments = async () => {
    try {
      const { data: departmentsData, error: deptError } = await supabase
        .from('departments')
        .select('id, name')
        .eq('organization_id', '00000000-0000-0000-0000-000000000000');

      if (deptError) throw deptError;
      setDepartments(departmentsData || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const { data: projectsData, error: projError } = await supabase
        .from('risk_assessment_projects')
        .select('id, name')
        .eq('organization_id', '00000000-0000-0000-0000-000000000000')
        .eq('is_deleted', false);

      if (projError) throw projError;
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadRisks = async () => {
    try {
      console.log('Loading risks from database...');
      let query = supabase
        .from('risks')
        .select(`
          *,
          departments(name),
          risk_categories(name),
          risk_assessment_projects(name)
        `)
        .eq('organization_id', '00000000-0000-0000-0000-000000000000');

      // Filter by project if selected
      if (selectedProjectId) {
        query = query.eq('project_id', selectedProjectId);
        console.log('Filtering risks by project:', selectedProjectId);
      }

      const { data: risksData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to add department, category, and project names
      const flattenedRisks = risksData?.map(risk => ({
        ...risk,
        department_name: risk.departments?.name,
        category_name: risk.risk_categories?.name,
        project_name: risk.risk_assessment_projects?.name || 'No Project'
      })) || [];

      console.log('Flattened risks loaded:', flattenedRisks);
      setRisks(flattenedRisks);
    } catch (error) {
      console.error('Error loading risks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = async () => {
    try {
      // Force load sample data for testing - comment out the check
      const sampleDepartments = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          organization_id: '00000000-0000-0000-0000-000000000000',
          name: 'Information Technology',
          description: 'IT and cybersecurity operations'
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          organization_id: '00000000-0000-0000-0000-000000000000',
          name: 'Finance',
          description: 'Financial operations and accounting'
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          organization_id: '00000000-0000-0000-0000-000000000000',
          name: 'Operations',
          description: 'Business operations and logistics'
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          organization_id: '00000000-0000-0000-0000-000000000000',
          name: 'Legal & Compliance',
          description: 'Legal affairs and regulatory compliance'
        },
        {
          id: '55555555-5555-5555-5555-555555555555',
          organization_id: '00000000-0000-0000-0000-000000000000',
          name: 'Human Resources',
          description: 'HR and personnel management'
        }
      ];

      // Upsert departments idempotently to avoid duplicate insert errors even if this runs twice
      const { error: deptUpsertError } = await supabase
        .from('departments')
        .upsert(sampleDepartments, { onConflict: 'id' });
      if (deptUpsertError) {
        console.log('Department upsert note:', deptUpsertError.message);
      }

      // Insert sample controls
      const sampleControls = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          organization_id: '00000000-0000-0000-0000-000000000000',
          control_id: 'CTRL-001',
          title: 'Multi-Factor Authentication',
          description: 'Requires two or more verification factors to access accounts',
          control_type: 'preventive',
          control_nature: 'automated',
          implementation_status: 'implemented'
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          organization_id: '00000000-0000-0000-0000-000000000000',
          control_id: 'CTRL-002',
          title: 'Regular Data Backups',
          description: 'Automated daily backups of critical business data',
          control_type: 'corrective',
          control_nature: 'automated',
          implementation_status: 'implemented'
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          organization_id: '00000000-0000-0000-0000-000000000000',
          control_id: 'CTRL-003',
          title: 'Compliance Monitoring',
          description: 'Continuous monitoring of regulatory compliance',
          control_type: 'detective',
          control_nature: 'hybrid',
          implementation_status: 'implemented'
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          organization_id: '00000000-0000-0000-0000-000000000000',
          control_id: 'CTRL-004',
          title: 'Financial Controls',
          description: 'Approval workflows for financial transactions',
          control_type: 'preventive',
          control_nature: 'manual',
          implementation_status: 'implemented'
        },
        {
          id: '55555555-5555-5555-5555-555555555555',
          organization_id: '00000000-0000-0000-0000-000000000000',
          control_id: 'CTRL-005',
          title: 'Incident Response Plan',
          description: 'Structured response to security incidents',
          control_type: 'corrective',
          control_nature: 'manual',
          implementation_status: 'implemented'
        }
      ];

      const { error: controlsError } = await supabase
        .from('controls')
        .upsert(sampleControls, { onConflict: 'id' });
      if (controlsError) {
        console.log('Controls upsert note:', controlsError.message);
      }

      // Insert sample risk matrix configuration
      const sampleRiskMatrix = {
        id: 'matrix00-0000-0000-0000-000000000001',
        organization_id: '00000000-0000-0000-0000-000000000000',
        matrix_size: 5,
        risk_levels: [
          {"id": "very_low", "name": "VERY LOW", "minScore": 1, "maxScore": 4, "color": "rg-risk-very-low"},
          {"id": "low", "name": "LOW", "minScore": 5, "maxScore": 9, "color": "rg-risk-low"},
          {"id": "medium", "name": "MEDIUM", "minScore": 10, "maxScore": 14, "color": "rg-risk-medium"},
          {"id": "high", "name": "HIGH", "minScore": 15, "maxScore": 19, "color": "rg-risk-high"},
          {"id": "critical", "name": "CRITICAL", "minScore": 20, "maxScore": 25, "color": "rg-risk-critical"}
        ],
        likelihood_labels: ["Very Low", "Low", "Medium", "High", "Very High"],
        impact_labels: ["Negligible", "Minor", "Moderate", "Major", "Severe"],
        version: 1,
        is_active: true
      };

      const { error: matrixError } = await supabase
        .from('risk_matrix_config')
        .upsert(sampleRiskMatrix, { onConflict: 'id' });
      
      if (matrixError) {
        console.log('Risk matrix upsert note:', matrixError.message);
      }

      // Insert sample risk categories
      const sampleCategories = [
        { id: 'aaaa0000-0000-0000-0000-000000000001', organization_id: '00000000-0000-0000-0000-000000000000', name: 'IT Security', description: 'Information technology and cybersecurity risks', color: '#dc3545' },
        { id: 'aaaa0000-0000-0000-0000-000000000002', organization_id: '00000000-0000-0000-0000-000000000000', name: 'Financial', description: 'Financial and credit risks', color: '#28a745' },
        { id: 'aaaa0000-0000-0000-0000-000000000003', organization_id: '00000000-0000-0000-0000-000000000000', name: 'Compliance', description: 'Regulatory and legal compliance risks', color: '#ffc107' }
      ];

      for (const category of sampleCategories) {
        await supabase
          .from('risk_categories')
          .upsert(category, { onConflict: 'id' });
      }

      // Insert sample risks with residual_risk calculations
      const sampleRisks = [
        {
          organization_id: '00000000-0000-0000-0000-000000000000',
          risk_id: 'RISK-001',
          title: 'Cybersecurity Breach',
          description: 'Potential unauthorized access to sensitive data',
          inherent_likelihood: 4,
          inherent_impact: 5,
          residual_likelihood: 2, // Reduced after controls
          residual_impact: 5,
          department_id: '11111111-1111-1111-1111-111111111111',
          category_id: 'aaaa0000-0000-0000-0000-000000000001',
          priority: 'critical',
          identified_date: '2024-01-15',
          status: 'not_materialized'
        },
        {
          organization_id: '00000000-0000-0000-0000-000000000000',
          risk_id: 'RISK-002',
          title: 'Regulatory Compliance Failure',
          description: 'Risk of failing to meet regulatory requirements',
          inherent_likelihood: 3,
          inherent_impact: 4,
          residual_likelihood: 2,
          residual_impact: 4,
          department_id: '44444444-4444-4444-4444-444444444444',
          category_id: 'aaaa0000-0000-0000-0000-000000000003',
          priority: 'high',
          identified_date: '2024-01-20',
          status: 'not_materialized'
        },
        {
          organization_id: '00000000-0000-0000-0000-000000000000',
          risk_id: 'RISK-003',
          title: 'Financial Fraud',
          description: 'Risk of internal or external financial fraud',
          inherent_likelihood: 2,
          inherent_impact: 5,
          residual_likelihood: 1,
          residual_impact: 5,
          department_id: '22222222-2222-2222-2222-222222222222',
          category_id: 'aaaa0000-0000-0000-0000-000000000002',
          priority: 'high',
          identified_date: '2024-01-25',
          status: 'not_materialized'
        }
      ];

      // Only insert sample risks if they don't already exist
      for (const risk of sampleRisks) {
        const { data: existingRisk } = await supabase
          .from('risks')
          .select('id')
          .eq('organization_id', risk.organization_id)
          .eq('risk_id', risk.risk_id)
          .single();

        if (!existingRisk) {
          console.log(`Inserting sample risk: ${risk.risk_id}`);
          const { error: insertError } = await supabase
            .from('risks')
            .insert(risk);
          
          if (insertError) {
            console.log(`Error inserting risk ${risk.risk_id}:`, insertError.message);
          }
        } else {
          console.log(`Risk ${risk.risk_id} already exists, skipping...`);
        }
      }

      // Insert risk-control mappings
      const riskControlMappings = [
        {
          risk_id: sampleRisks[0].organization_id === '00000000-0000-0000-0000-000000000000' ? 
            (await supabase.from('risks').select('id').eq('risk_id', 'RISK-001').single()).data?.id : null,
          control_id: 'ctrl0000-0000-0000-0000-000000000001', // MFA
          control_effectiveness_override: 0.75
        },
        {
          risk_id: sampleRisks[1].organization_id === '00000000-0000-0000-0000-000000000000' ? 
            (await supabase.from('risks').select('id').eq('risk_id', 'RISK-002').single()).data?.id : null,
          control_id: 'ctrl0000-0000-0000-0000-000000000004', // Financial Controls
          control_effectiveness_override: 0.5
        },
        {
          risk_id: sampleRisks[2].organization_id === '00000000-0000-0000-0000-000000000000' ? 
            (await supabase.from('risks').select('id').eq('risk_id', 'RISK-003').single()).data?.id : null,
          control_id: 'ctrl0000-0000-0000-0000-000000000003', // Compliance Monitoring
          control_effectiveness_override: 0.75
        }
      ].filter(mapping => mapping.risk_id); // Remove any null risk_ids

      if (riskControlMappings.length > 0) {
        const { error: mappingError } = await supabase
          .from('risk_controls')
          .upsert(riskControlMappings, { onConflict: 'risk_id,control_id' });

        if (mappingError) {
          console.log('Risk-control mappings error:', mappingError.message);
        }
      }

      console.log('Sample data loaded successfully!');
      
      // Reload data after a short delay
      setTimeout(() => {
        loadRisks();
        loadDepartments();
      }, 1000);
    } catch (error) {
      console.log('Error loading sample data:', error);
    }
  };

  // Manual function to load sample data for testing
  const forceLoadSampleData = async () => {
    try {
      console.log('Force loading sample data...');
      setLoading(true);
      
      // First clear existing data
      console.log('Clearing existing risks...');
      const { error: clearError } = await supabase
        .from('risks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy
      
      if (clearError) {
        console.error('Error clearing risks:', clearError);
      }
      
      await loadSampleData();
      setLoading(false);
    } catch (error) {
      console.error('Error in forceLoadSampleData:', error);
      setLoading(false);
      alert('Error loading sample data. Check console for details.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    console.log('Editing risk:', editingRisk);
    
    try {
      // formData.category now contains the actual category ID from database
      if (!formData.category) {
        alert('Please select a valid category.');
        return;
      }

      const inherentRisk = formData.inherent_likelihood * formData.inherent_impact;
      // Calculate residual risk based on control effectiveness
      const effectivenessReduction = formData.control_rating;
      let residualLikelihood, residualImpact;
      if (effectivenessReduction >= 0.95) {
        // 95% Excellent control = Low risk (score 1-2)
        residualLikelihood = 1;
        residualImpact = 2;
      } else if (effectivenessReduction >= 0.8) {
        // 80% Strong control = Medium risk (score 3-4)
        residualLikelihood = 1;
        residualImpact = 3;
      } else if (effectivenessReduction >= 0.6) {
        // 60% Good control = High risk (score 6-8)
        residualLikelihood = 2;
        residualImpact = 3;
      } else if (effectivenessReduction >= 0.4) {
        // 40% Adequate control = Critical risk (reduced)
        residualLikelihood = 3;
        residualImpact = 3;
      } else if (effectivenessReduction >= 0.2) {
        // 20% Weak control = Critical risk (minimal reduction)
        residualLikelihood = Math.max(1, Math.round(formData.inherent_likelihood * 0.9));
        residualImpact = Math.max(1, Math.round(formData.inherent_impact * 0.95));
      } else {
        // 0% No control = No reduction
        residualLikelihood = formData.inherent_likelihood;
        residualImpact = formData.inherent_impact;
      }
      console.log('Risk calculation:', {
        inherent: { likelihood: formData.inherent_likelihood, impact: formData.inherent_impact, score: inherentRisk },
        control_rating: formData.control_rating,
        residual: { likelihood: residualLikelihood, impact: residualImpact }
      });

      const riskData = {
        title: formData.title,
        description: formData.description,
        category_id: formData.category,
        department_id: formData.department_id,
        inherent_likelihood: formData.inherent_likelihood,
        inherent_impact: formData.inherent_impact,
        residual_likelihood: residualLikelihood,
        residual_impact: residualImpact,
        control_name: formData.control_name,
        control_rating: formData.control_rating,
        due_date: formData.due_date || null,
        comments: formData.comments || null,
        organization_id: '00000000-0000-0000-0000-000000000000',
        project_id: selectedProjectId || null,
        risk_id: `RISK-${String(Date.now()).slice(-6)}`,
        status: 'not_materialized',
        priority: formData.priority || 'medium',
        identified_date: formData.identified_date || new Date().toISOString().split('T')[0]
      };

      if (editingRisk) {
        // Update existing risk
        const { error: riskError } = await supabase
          .from('risks')
          .update({
            title: formData.title,
            description: formData.description,
            category_id: formData.category,
            department_id: formData.department_id,
            inherent_likelihood: formData.inherent_likelihood,
            inherent_impact: formData.inherent_impact,
            residual_likelihood: residualLikelihood,
            residual_impact: residualImpact,
            control_name: formData.control_name,
            control_rating: formData.control_rating,
            due_date: formData.due_date || null,
            comments: formData.comments || null,
            priority: formData.priority || 'medium',
            identified_date: formData.identified_date || new Date().toISOString().split('T')[0]
          })
          .eq('id', editingRisk.id);

        if (riskError) {
          console.error('Error updating risk:', riskError);
          throw riskError;
        }
        console.log('Risk updated successfully');
        
        // Force database to refresh generated columns by reading the updated record
        const { data: updatedRisk } = await supabase
          .from('risks')
          .select('residual_score, residual_likelihood, residual_impact')
          .eq('id', editingRisk.id)
          .single();
        
        console.log('Post-update database values:', updatedRisk);

        // Control name is now stored directly in the risk record, no junction table needed
      } else {
        // Create new risk
        const { data: newRisk, error: riskError } = await supabase
          .from('risks')
          .insert(riskData)
          .select()
          .single();

        if (riskError) throw riskError;
        
        // Force database to refresh generated columns for new risk
        const { data: newRiskData } = await supabase
          .from('risks')
          .select('residual_score, residual_likelihood, residual_impact')
          .eq('id', newRisk.id)
          .single();
        
        console.log('New risk database values:', newRiskData);

        // Control name is now stored directly in the risk record, no junction table needed
      }

      await loadRisks();
      setShowModal(false);
      setEditingRisk(null);
      resetForm();
      alert('Risk saved successfully! Check console for calculation details.');
      
      // Debug: Log the saved risk to verify values
      console.log('Risk saved with final values - reloading data...');
    } catch (error) {
      console.error('Error saving risk:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Error saving risk: ${errorMessage}. Please try again.`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      department_id: '',
      inherent_likelihood: 3,
      inherent_impact: 3,
      priority: '',
      identified_date: '',
      control_name: '',
      control_rating: 0,
      due_date: '',
      comments: ''
    });
  };

  const handleEdit = (risk: Risk) => {
    setEditingRisk(risk);
    setFormData({
      title: risk.title,
      description: risk.description || '',
      category: risk.category_id || '',
      inherent_likelihood: risk.inherent_likelihood,
      inherent_impact: risk.inherent_impact,
      department_id: risk.department_id || '',
      priority: risk.priority || '',
      identified_date: risk.identified_date || '',
      control_name: risk.control_name || '',
      control_rating: risk.control_rating || 0,
      due_date: risk.due_date || '',
      comments: risk.comments || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (risk: Risk) => {
    if (!confirm('Are you sure you want to delete this risk?')) return;

    try {
      // Delete the risk (no junction table entries to clean up)
      const { error } = await supabase
        .from('risks')
        .delete()
        .eq('id', risk.id);

      if (error) throw error;

      await loadRisks();
    } catch (error) {
      console.error('Error deleting risk:', error);
      alert('Error deleting risk. Please try again.');
    }
  };

  // Risk matrix mapping using database configuration
  const getRiskLevelFromScore = (score: number) => {
    if (!riskMatrix || !riskMatrix.risk_levels) {
      // Fallback if no matrix loaded
      if (score >= 20) return { name: 'CRITICAL', color: 'rg-risk-critical' };
      if (score >= 15) return { name: 'HIGH', color: 'rg-risk-high' };
      if (score >= 10) return { name: 'MEDIUM', color: 'rg-risk-medium' };
      if (score >= 5) return { name: 'LOW', color: 'rg-risk-low' };
      return { name: 'VERY LOW', color: 'rg-risk-very-low' };
    }

    // Use database configuration
    const levels = riskMatrix.risk_levels;
    for (const level of levels) {
      if (score >= level.minScore && score <= level.maxScore) {
        return { name: level.name, color: level.color };
      }
    }
    
    // Default fallback
    return { name: 'UNKNOWN', color: 'rg-risk-low' };
  };

  const getRiskLevelColor = (level: string) => {
    const score = parseInt(level) || 0;
    return getRiskLevelFromScore(score).color;
  };

  const getStatusColor = (status: string) => {
    return status === 'materialized' ? 'rg-status-high' : 'rg-status-medium';
  };

  const getInherentRiskColor = (score: number) => {
    if (score >= 15) return 'rg-risk-critical';
    if (score >= 10) return 'rg-risk-high';
    if (score >= 6) return 'rg-risk-medium';
    return 'rg-risk-low';
  };

  const getControlRatingColor = (rating: number) => {
    if (rating >= 0.8) return 'rg-control-high';
    if (rating >= 0.5) return 'rg-control-medium';
    if (rating >= 0.2) return 'rg-control-low';
    return 'rg-control-none';
  };

  // Format duration in human-readable format (days, months, years)
  const formatDuration = (days: number) => {
    const absDays = Math.abs(days);
    
    if (absDays >= 365) {
      const years = Math.floor(absDays / 365);
      const remainingDays = absDays % 365;
      const months = Math.floor(remainingDays / 30);
      
      if (months > 0) {
        return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
      }
      return `${years} year${years > 1 ? 's' : ''}`;
    } else if (absDays >= 30) {
      const months = Math.floor(absDays / 30);
      const remainingDays = absDays % 30;
      
      if (remainingDays > 0) {
        return `${months} month${months > 1 ? 's' : ''}, ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
      }
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      return `${absDays} day${absDays > 1 ? 's' : ''}`;
    }
  };

  // Overdue risk calculation utility
  const getDueStatus = (dueDate: string | null | undefined) => {
    if (!dueDate) {
      return { status: 'no-date', statusText: '-', color: 'text-gray-400', daysDiff: null, dateFormatted: null };
    }

    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const dateFormatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (daysDiff < 0) {
      // Overdue
      return { 
        status: 'overdue', 
        statusText: `Overdue\n${formatDuration(daysDiff)}`, 
        color: 'text-red-600 font-medium', 
        daysDiff: daysDiff,
        dateFormatted: dateFormatted
      };
    } else if (daysDiff <= 7) {
      // Due soon (within 7 days)
      return { 
        status: 'due-soon', 
        statusText: daysDiff === 0 ? 'Due Today' : `Due in ${daysDiff} days`, 
        color: 'text-amber-600 font-medium', 
        daysDiff: daysDiff,
        dateFormatted: dateFormatted
      };
    } else {
      // On track
      return { 
        status: 'on-track', 
        statusText: `Due in ${formatDuration(daysDiff)}`, 
        color: 'text-emerald-600', 
        daysDiff: daysDiff,
        dateFormatted: dateFormatted
      };
    }
  };

  // Filter risks based on current filters
  const filteredRisks = risks.filter(risk => {
    // Search filter (title, description, comments)
    if (filters.search && ![
      risk.title?.toLowerCase(),
      risk.description?.toLowerCase(), 
      risk.comments?.toLowerCase()
    ].some(field => field?.includes(filters.search.toLowerCase()))) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all') {
      const dueStatus = getDueStatus(risk.due_date);
      if (filters.status !== dueStatus.status) {
        return false;
      }
    }

    // Risk Level filter (residual risk)
    if (filters.riskLevel !== 'all') {
      const residualScore = (risk.residual_likelihood || 0) * (risk.residual_impact || 0);
      const riskLevel = getRiskLevelFromScore(residualScore);
      if (filters.riskLevel !== riskLevel.name.toLowerCase()) {
        return false;
      }
    }

    // Department filter
    if (filters.department !== 'all') {
      if (filters.department !== risk.department_id) {
        return false;
      }
    }

    // Project filter
    if (filters.project !== 'all') {
      if (filters.project === 'no-project') {
        if (risk.project_id !== null) {
          return false;
        }
      } else {
        if (filters.project !== risk.project_id) {
          return false;
        }
      }
    }

    return true;
  });

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Quick filter functions
  const applyQuickFilter = (filterType: string) => {
    switch (filterType) {
      case 'overdue':
        setFilters(prev => ({ ...prev, status: 'overdue' }));
        break;
      case 'high-risk':
        setFilters(prev => ({ ...prev, riskLevel: 'high' }));
        break;
      case 'no-controls':
        // This would need additional logic based on control_name presence
        break;
      case 'clear':
        setFilters({ search: '', status: 'all', riskLevel: 'all', department: 'all', project: 'all' });
        break;
      default:
        break;
    }
  };

  const getResidualRiskColor = (score: number) => {
    if (score >= 15) return 'rg-risk-critical';
    if (score >= 10) return 'rg-risk-high';
    if (score >= 6) return 'rg-risk-medium';
    return 'rg-risk-low';
  };

  if (loading) {
    return (
      <div className="min-h-screen rg-theme flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="rg-text-secondary">Loading risk register...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <main className="max-w-7xl mx-auto py-8 px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="rg-header-title">
                  Risk Register
                  {selectedProjectName && (
                    <span className="text-blue-600"> - {selectedProjectName}</span>
                  )}
                </h1>
                <p className="rg-header-subtitle">
                  {selectedProjectName 
                    ? `Managing risks for ${selectedProjectName} project`
                    : 'Comprehensive risk identification and management'
                  }
                </p>
              </div>
              {selectedProjectName && onClearProject && (
                <button
                  onClick={onClearProject}
                  className="rg-btn rg-btn-secondary text-sm"
                  title="View all risks"
                >
                  <i className="fas fa-times mr-2"></i>
                  Clear Filter
                </button>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                console.log('Load Sample Data button clicked');
                forceLoadSampleData();
              }}
              disabled={loading}
              className={`rg-btn rg-btn-secondary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Loading...' : 'Load Sample Data'}
            </button>
            <button
              onClick={() => {
                setEditingRisk(null);
                resetForm();
                setShowModal(true);
              }}
              className="rg-btn rg-btn-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Risk
            </button>
          </div>
        </div>

        {/* Collapsible Filters Section */}
        <div className="rg-card mb-3">
          <div className="rg-card-header" style={{cursor: 'pointer', padding: '0.75rem 1rem'}} onClick={() => setFiltersCollapsed(!filtersCollapsed)}>
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="rg-card-title mb-0" style={{fontSize: '1rem'}}>Filters</h3>
              <div className="d-flex align-items-center">
                <small className="text-muted mr-3" style={{fontSize: '0.8rem'}}>
                  Showing {filteredRisks.length} of {risks.length} risks
                </small>
                <i className={`fas ${filtersCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
              </div>
            </div>
          </div>
          {!filtersCollapsed && (
            <div className="rg-card-body py-2">
              <div className="row">
                {/* Search Bar */}
                <div className="col-md-3 mb-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search risks..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
                
                {/* Status Filter */}
                <div className="col-md-2 mb-2">
                  <select
                    className="form-control form-control-sm"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="overdue">Overdue</option>
                    <option value="due-soon">Due Soon</option>
                    <option value="on-track">On Track</option>
                    <option value="no-date">No Date</option>
                  </select>
                </div>
                
                {/* Risk Level Filter */}
                <div className="col-md-2 mb-2">
                  <select
                    className="form-control form-control-sm"
                    value={filters.riskLevel}
                    onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                
                {/* Department Filter */}
                <div className="col-md-2 mb-2">
                  <select
                    className="form-control form-control-sm"
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-2 mb-2">
                  <select
                    className="form-control form-control-sm"
                    value={filters.project}
                    onChange={(e) => handleFilterChange('project', e.target.value)}
                  >
                    <option value="all">All Projects</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                    <option value="no-project">No Project</option>
                  </select>
                </div>
                
                {/* Clear Filter Button */}
                <div className="col-md-1 mb-2 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => applyQuickFilter('clear')}
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              {/* Active Filters Summary */}
              {(filters.search || filters.status !== 'all' || filters.riskLevel !== 'all' || filters.department !== 'all') && (
                <div className="row mt-2">
                  <div className="col-12">
                    <small className="text-muted">
                      Active filters:
                      {filters.search && ` Search: "${filters.search}"`}
                      {filters.status !== 'all' && ` | Status: ${filters.status}`}
                      {filters.riskLevel !== 'all' && ` | Risk Level: ${filters.riskLevel}`}
                      {filters.department !== 'all' && ` | Department: ${departments.find(d => d.id === filters.department)?.name || filters.department}`}
                    </small>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Risk Table */}
        <div className="rg-card">
          <div className="rg-card-body p-0">
            {filteredRisks.length > 0 ? (
              <div className="table-responsive" style={{overflowX: 'auto'}}>
                <table className="table table-striped table-hover mb-0" style={{minWidth: '1600px', width: '1600px', fontSize: '0.8rem'}}>
                  <thead className="sticky top-0 z-30">
                    <tr style={{
                      backgroundColor: '#4b5563',
                      borderBottom: '1px solid #374151'
                    }}>
                      <th className="sticky left-0 z-40 text-white" style={{
                        minWidth: '100px', 
                        padding: '8px', 
                        textAlign: 'left',
                        backgroundColor: '#4b5563',
                        borderRight: '1px solid #374151',
                        fontWeight: '600'
                      }}>Risk ID</th>
                      <th className="text-white" style={{minWidth: '200px', padding: '8px', textAlign: 'left', fontWeight: '600'}}>Risk Title</th>
                      <th className="text-white" style={{minWidth: '300px', padding: '8px', textAlign: 'left', fontWeight: '600'}}>Risk Description</th>
                      <th className="text-white" style={{minWidth: '150px', padding: '8px', textAlign: 'left', fontWeight: '600'}}>Project</th>
                      <th className="text-center text-white" style={{minWidth: '120px', padding: '8px', fontWeight: '600'}}>Inherent Risk</th>
                      <th className="text-white" style={{minWidth: '150px', padding: '8px', textAlign: 'left', fontWeight: '600'}}>Department</th>
                      <th className="text-white" style={{minWidth: '150px', padding: '8px', textAlign: 'left', fontWeight: '600'}}>Control</th>
                      <th className="text-center text-white" style={{minWidth: '120px', padding: '8px', fontWeight: '600'}}>Control Rating</th>
                      <th className="text-center text-white" style={{minWidth: '110px', padding: '8px', fontWeight: '600'}}>Due Date</th>
                      <th className="text-center text-white" style={{minWidth: '180px', padding: '8px', fontWeight: '600'}}>Status</th>
                      <th className="text-white" style={{minWidth: '200px', padding: '8px', textAlign: 'left', fontWeight: '600'}}>Comments</th>
                      <th className="text-center text-white" style={{minWidth: '120px', padding: '8px', fontWeight: '600'}}>Residual Risk</th>
                      <th className="text-center text-white" style={{minWidth: '150px', padding: '8px', fontWeight: '600'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRisks.map((risk) => {
                    const inherentRisk = risk.inherent_likelihood * risk.inherent_impact;
                    const inherentLevel = getRiskLevelFromScore(inherentRisk);
                    const residualScore = (risk.residual_likelihood || 0) * (risk.residual_impact || 0);
                    const residualLevel = getRiskLevelFromScore(residualScore);
                    
                    // Debug logging for the residual risk display
                    if ((risk.control_rating || 0) > 0) {
                      console.log(`Risk ${risk.risk_id} display values:`, {
                        inherent: { likelihood: risk.inherent_likelihood, impact: risk.inherent_impact, score: inherentRisk },
                        residual_from_db: risk.residual_score,
                        residual_calculated: (risk.residual_likelihood || 0) * (risk.residual_impact || 0),
                        residual_likelihood: risk.residual_likelihood,
                        residual_impact: risk.residual_impact,
                        final_residual_score: residualScore,
                        residual_level: residualLevel.name,
                        control_rating: risk.control_rating
                      });
                    }
                                        return (
                        <tr key={risk.risk_id} className={`${Math.floor(filteredRisks.indexOf(risk) / 1) % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`} style={{borderBottom: '1px solid #e5e7eb'}}>
                        <td className={`sticky left-0 z-10 rg-text-primary font-medium ${Math.floor(filteredRisks.indexOf(risk) / 1) % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`} style={{padding: '8px'}}>
                          {risk.risk_id}
                        </td>
                        <td className="rg-text-primary font-medium" style={{padding: '8px'}}>{risk.title}</td>
                        <td className="rg-text-secondary truncate" title={risk.description} style={{padding: '8px', maxWidth: '300px'}}>
                          {risk.description || 'No description'}
                        </td>
                        <td className="rg-text-secondary" style={{padding: '8px'}}>{risk.project_name}</td>
                        <td className="text-center" style={{padding: '8px'}}>
                          <span className={`rg-risk-badge ${inherentLevel.color}`}>
                            {inherentLevel.name}
                          </span>
                        </td>
                        <td className="rg-text-secondary" style={{padding: '8px'}}>{risk.department_name || 'Unknown'}</td>
                        <td className="rg-text-secondary" style={{padding: '8px'}}>{risk.control_name || 'No Control'}</td>
                        <td className="text-center" style={{padding: '8px'}}>
                          <span className={`badge ${getControlRatingColor(risk.control_rating || 0)}`}>
                            {((risk.control_rating || 0) * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="text-center rg-text-secondary" style={{padding: '8px'}}>
                          {risk.due_date ? new Date(risk.due_date).toLocaleDateString() : 'Not set'}
                        </td>
                        <td className="text-center" style={{padding: '8px'}}>
                          {(() => {
                            const dueStatus = getDueStatus(risk.due_date);
                            return (
                              <div className={`text-xs ${dueStatus.color}`} style={{whiteSpace: 'pre-line'}}>
                                {dueStatus.statusText}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="rg-text-secondary truncate" title={risk.comments} style={{padding: '8px', maxWidth: '200px'}}>
                          {risk.comments || 'No comments'}
                        </td>
                        <td className="text-center" style={{padding: '8px'}}>
                          <span className={`rg-risk-badge ${residualLevel.color}`}>
                            {residualLevel.name}
                          </span>
                        </td>
                        <td className="text-center" style={{padding: '8px'}}>
                          <button
                            className="btn btn-sm btn-outline-primary mr-2"
                            onClick={() => {
                              setEditingRisk(risk);
                              setFormData({
                                title: risk.title,
                                description: risk.description,
                                category: risk.category_id,
                                department_id: risk.department_id,
                                inherent_likelihood: risk.inherent_likelihood,
                                inherent_impact: risk.inherent_impact,
                                control_name: risk.control_name,
                                control_rating: risk.control_rating,
                                due_date: risk.due_date,
                                comments: risk.comments,
                                priority: risk.priority,
                                identified_date: risk.identified_date
                              });
                              setShowModal(true);
                            }}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rg-empty-state py-12">
                <svg className="w-16 h-16 mx-auto mb-4 rg-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium rg-text-primary mb-2">No risks registered</h3>
                <p className="rg-text-secondary">Start by creating your first risk assessment.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Risk Form Modal */}
      {showModal && (
        <div className="rg-modal-backdrop fixed inset-0 flex items-center justify-center z-50">
          <div className="rg-modal-content w-full max-w-2xl mx-4">
            <div className="rg-modal-header">
              <h2 className="text-xl font-bold rg-text-primary">
                {editingRisk ? 'Edit Risk' : 'Create New Risk'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="rg-text-muted hover:rg-text-primary text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="rg-modal-body">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="rg-form-label">Risk Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="rg-form-control"
                    placeholder="Enter risk title..."
                  />
                </div>

                <div>
                  <label className="rg-form-label">Risk Category</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="rg-form-control"
                  >
                    <option value="">Select category...</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="rg-form-label">Risk Description</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="rg-form-textarea"
                    placeholder="Describe the risk in detail..."
                  />
                </div>

                <div>
                  <label className="rg-form-label">Assign to Department</label>
                  <select
                    required
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="rg-form-control"
                  >
                    <option value="">Select department...</option>
                    {departments && departments.length > 0 ? departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    )) : (
                      <option value="" disabled>Loading departments...</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="rg-form-label">Inherent Likelihood (1-{riskMatrix?.matrix_size || 5})</label>
                    <select
                      value={formData.inherent_likelihood}
                      onChange={(e) => setFormData({ ...formData, inherent_likelihood: parseInt(e.target.value) })}
                      className="rg-form-control"
                    >
                      {Array.from({ length: riskMatrix?.matrix_size || 5 }, (_, i) => {
                        const value = i + 1;
                        const likelihoodLabel = riskMatrix?.likelihood_labels?.[i] || `Level ${value}`;
                        // Only show label if it's different from the number
                        const displayText = likelihoodLabel === String(value) ? value : `${value} - ${likelihoodLabel}`;
                        return (
                          <option key={value} value={value}>
                            {displayText}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="rg-form-label">Inherent Impact (1-{riskMatrix?.matrix_size || 5})</label>
                    <select
                      value={formData.inherent_impact}
                      onChange={(e) => setFormData({ ...formData, inherent_impact: parseInt(e.target.value) })}
                      className="rg-form-control"
                    >
                      {Array.from({ length: riskMatrix?.matrix_size || 5 }, (_, i) => {
                        const value = i + 1;
                        const impactLabel = riskMatrix?.impact_labels?.[i] || `Level ${value}`;
                        // Only show label if it's different from the number
                        const displayText = impactLabel === String(value) ? value : `${value} - ${impactLabel}`;
                        return (
                          <option key={value} value={value}>
                            {displayText}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="rg-form-label">Control</label>
                  <input
                    type="text"
                    value={formData.control_name}
                    onChange={(e) => setFormData({ ...formData, control_name: e.target.value })}
                    className="rg-form-control"
                    placeholder="Enter control name (optional)..."
                  />
                </div>

                <div>
                  <label className="rg-form-label">Control Effectiveness</label>
                  <select
                    value={formData.control_rating}
                    onChange={(e) => setFormData({ ...formData, control_rating: parseFloat(e.target.value) })}
                    className="rg-form-control"
                  >
                    <option value={0}>0% - No Control (No control in place)</option>
                    <option value={0.2}>20% - Weak Control (Basic/informal controls)</option>
                    <option value={0.4}>40% - Adequate Control (Documented procedures)</option>
                    <option value={0.6}>60% - Good Control (Monitored & tested)</option>
                    <option value={0.8}>80% - Strong Control (Automated/integrated)</option>
                    <option value={0.95}>95% - Excellent Control (Fail-safe/redundant)</option>
                  </select>
                </div>

                <div>
                  <label className="rg-form-label">Control Implementation Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="rg-form-control"
                  />
                </div>

                <div>
                  <label className="rg-form-label">Comments</label>
                  <textarea
                    rows={3}
                    value={formData.comments || ''}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    className="rg-form-textarea"
                    placeholder="Additional notes or comments about this risk..."
                  />
                </div>
              </form>
            </div>

            <div className="rg-modal-footer">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="rg-btn rg-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="rg-btn rg-btn-primary"
                >
                  {editingRisk ? 'Update Risk' : 'Create Risk'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskRegister;
