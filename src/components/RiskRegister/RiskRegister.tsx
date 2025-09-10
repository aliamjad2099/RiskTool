import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { getUserPermissions, canViewRisk, canEditRisk, canManageControls, canViewEvidence, UserPermissions } from '../../utils/permissionService';
import { supabase } from '../../lib/supabase';
import ControlManagement from '../ControlManagement/ControlManagement';

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
  project_name?: string;
  project_id?: string;
  residual_risk?: string;
}

interface Department {
  id: string;
  name: string;
}

interface Control {
  id: string;
  title: string;
}

interface Category {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface RiskRegisterProps {
  onBack: () => void;
  selectedProjectId?: string | null;
  selectedProjectName?: string | null;
  onClearProject?: () => void;
}

const RiskRegister: React.FC<RiskRegisterProps> = ({ onBack, selectedProjectId, selectedProjectName, onClearProject }) => {
  // Props validation removed from production
  
  const { user } = useAuth();
  const { createUser } = useAdmin();
  
  // Permission state
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  
  const [risks, setRisks] = useState<Risk[]>([]);
  const [filteredRisks, setFilteredRisks] = useState<Risk[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [riskMatrix, setRiskMatrix] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [showControlManagement, setShowControlManagement] = useState(false);
  const [selectedRiskForControl, setSelectedRiskForControl] = useState<Risk | null>(null);
  const [evidence, setEvidence] = useState<any[]>([]);

  // Filter states - initialize project filter from prop
  const [filters, setFilters] = useState(() => ({
    search: '',
    status: '',
    riskLevel: '',
    department: '',
    project: selectedProjectId || ''
  }));

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    department_id: '',
    inherent_likelihood: 3,
    inherent_impact: 3,
    control_name: '',
    control_rating: 0,
    due_date: '',
    comments: '',
    project_id: ''
  });


  // Load user permissions
  useEffect(() => {
    if (!user) {
      return;
    }

    const loadUserPermissions = async () => {
      try {
        const permissions = await getUserPermissions(user.id, user.email || '');
        setUserPermissions(permissions);
      } catch (error) {
        console.error('❌ RiskRegister: Permission loading error:', error);
        setUserPermissions(null);
      }
    };

    loadUserPermissions();
  }, [user]);

  // Permission check functions using the service
  const canViewRiskLocal = (riskDepartmentId: string) => {
    console.log('🔍 canViewRiskLocal called:', {
      riskDepartmentId,
      userPermissions: userPermissions ? 'loaded' : 'null',
      departmentIds: userPermissions?.departmentIds
    });
    
    if (!userPermissions) {
      console.log('⚠️ Permissions not loaded, DENYING access');
      return false;
    }
    return canViewRisk(userPermissions, riskDepartmentId);
  };

  const canEditRiskLocal = (riskDepartmentId: string) => {
    return canEditRisk(userPermissions, riskDepartmentId);
  };

  const canManageControlsLocal = (riskDepartmentId: string) => {
    return canManageControls(userPermissions, riskDepartmentId);
  };

  const canViewEvidenceLocal = () => {
    return canViewEvidence(userPermissions);
  };

  // Utility functions
  const calculateRiskLevel = (likelihood: number, impact: number) => {
    const score = likelihood * impact;
    // console.log(`🎯 Risk calc: L=${likelihood} × I=${impact} = ${score}`);
    
    if (!riskMatrix || !riskMatrix.risk_levels) {
      console.log('⚠️ Using fallback - no risk matrix');
      if (score >= 12) return 'Critical';
      if (score >= 8) return 'High';
      if (score >= 4) return 'Medium';
      return 'Low';
    }
    
    // console.log('📊 Risk levels:', JSON.stringify(riskMatrix.risk_levels, null, 2));
    const levels = riskMatrix.risk_levels.sort((a: any, b: any) => a.minScore - b.minScore);
    
    // Find the appropriate level based on score
    for (let i = levels.length - 1; i >= 0; i--) {
      if (score >= levels[i].minScore) {
        return levels[i].name;
      }
    }
    
    console.log('🟢 Default: Low');
    return 'Low';
  };

  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return 'no-date';
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 7) return 'due-soon';
    return 'on-track';
  };

  const loadData = async () => {
    try {
      console.log('📊 Loading data...');
      console.log('🔍 Current userPermissions state:', userPermissions);
      console.log('🔍 User object:', user);
      setLoading(true);
      setError(null);

      // Load risk matrix configuration
      const { data: matrixData } = await supabase
        .from('risk_matrix_config')
        .select('*')
        .eq('organization_id', '00000000-0000-0000-0000-000000000000')
        .single();
      
      setRiskMatrix(matrixData || {
        low_threshold: 4,
        medium_threshold: 8,
        high_threshold: 12
      });

      // Load risks with explicit column selection (no auto-joins to avoid PGRST201)
      const { data: riskData, error: riskError } = await supabase
        .from('risks')
        .select('id, organization_id, risk_id, title, description, department_id, category_id, inherent_likelihood, inherent_impact, residual_likelihood, residual_impact, due_date, comments, project_id, created_at, updated_at')
        .eq('organization_id', '00000000-0000-0000-0000-000000000000')
        .order('created_at', { ascending: false });

      if (riskError) {
        console.error('❌ Risk loading error:', riskError);
        throw riskError;
      }

      // Load supporting data for manual joins
      const [deptResult, catResult, projResult, controlResult] = await Promise.all([
        supabase.from('departments').select('*').eq('organization_id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('risk_categories').select('*').eq('organization_id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('risk_assessment_projects').select('*').eq('organization_id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('controls').select('*').eq('organization_id', '00000000-0000-0000-0000-000000000000').order('title')
      ]);

      const departments = deptResult.data || [];
      const categories = catResult.data || [];
      const projects = projResult.data || [];
      const controls = controlResult.data || [];

      // Transform risk data with manual joins and calculate scores
      const transformedRisks = riskData?.map(risk => {
        const inherentScore = risk.inherent_likelihood * risk.inherent_impact;
        const residualScore = (risk.residual_likelihood || risk.inherent_likelihood) * (risk.residual_impact || risk.inherent_impact);
        
        // Manual joins
        const department = departments.find(d => d.id === risk.department_id);
        const category = categories.find(c => c.id === risk.category_id);
        const project = projects.find(p => p.id === risk.project_id);
        
        console.log(`🔄 Processing risk ${risk.risk_id}:`, {
          department_id: risk.department_id,
          department_name: department?.name,
          inherent: `L=${risk.inherent_likelihood} I=${risk.inherent_impact} Score=${inherentScore}`,
          residual: `L=${risk.residual_likelihood || risk.inherent_likelihood} I=${risk.residual_impact || risk.inherent_impact} Score=${residualScore}`
        });

        return {
          ...risk,
          inherent_score: inherentScore,
          residual_score: residualScore,
          department_name: department?.name || 'Unknown',
          category_name: category?.name || 'Uncategorized',
          project_name: project?.name || null,
          control_name: undefined, // Column doesn't exist in database
          control_rating: undefined // Will be handled separately if needed
        };
      }) || [];

      // Store all risks - filtering will be handled by applyFilters()
      setRisks(transformedRisks);

      // Set state with the already loaded data
      setDepartments(departments);
      setCategories(categories);
      setProjects(projects);
      setControls(controls);

      console.log('✅ All data loaded successfully');
    } catch (error) {
      console.error('❌ Data loading error:', error);
      setError(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter risks based on current filter state
  const applyFilters = useCallback(() => {
    // Applying filters
    
    // Start from permission-filtered risks, not all risks
    let filtered = [...risks];
    
    // First apply permission filtering
    if (userPermissions) {
      filtered = filtered.filter(risk => {
        return canViewRisk(userPermissions, risk.department_id || '');
      });
      // Permission filter applied
    } else {
      // Secure default: show no risks if permissions not loaded
      filtered = [];
    }

    // Apply project filter - prioritize selectedProjectId, but also respect dropdown filter
    if (selectedProjectId) {
      // Applying selectedProjectId filter
      filtered = filtered.filter(risk => risk.project_id === selectedProjectId);
    } else if (filters.project && filters.project !== '') {
      // Apply dropdown project filter only when no selectedProjectId
      if (filters.project === 'no-project') {
        filtered = filtered.filter(risk => !risk.project_id);
      } else {
        filtered = filtered.filter(risk => risk.project_id === filters.project);
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(risk => 
        risk.title.toLowerCase().includes(searchLower) ||
        risk.description?.toLowerCase().includes(searchLower) ||
        risk.risk_id.toLowerCase().includes(searchLower)
      );
    }

    // Status filter (based on due date)
    if (filters.status) {
      filtered = filtered.filter(risk => {
        const status = getDueDateStatus(risk.due_date || null);
        return status === filters.status;
      });
    }

    // Risk level filter
    if (filters.riskLevel) {
      filtered = filtered.filter(risk => {
        const level = calculateRiskLevel(
          risk.residual_likelihood || risk.inherent_likelihood,
          risk.residual_impact || risk.inherent_impact
        );
        return level === filters.riskLevel;
      });
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter(risk => risk.department_id === filters.department);
    }

    
    setFilteredRisks(filtered);
  }, [selectedProjectId, filters, risks, userPermissions]);

  // Auto-populate project when selectedProjectId changes
  useEffect(() => {
    // selectedProjectId changed
    
    if (selectedProjectId !== undefined) {
      console.log('📝 Updating filters.project to:', selectedProjectId);
      setFilters(prev => ({ ...prev, project: selectedProjectId || '' }));
    }
    if (selectedProjectId && (showRiskForm || !editingRisk)) {
      setFormData(prev => ({ ...prev, project_id: selectedProjectId }));
    }
  }, [selectedProjectId, showRiskForm, editingRisk]);

  // Apply filters whenever filter state changes OR selectedProjectId changes
  useEffect(() => {
    console.log('🚀 useEffect triggered:', {
      risksLength: risks.length,
      hasUserPermissions: !!userPermissions,
      selectedProjectId,
      filterProject: filters.project
    });
    
    if (risks.length > 0 && userPermissions) {
      applyFilters();
    } else {
      console.log('⏳ Waiting for data:', {
        risks: risks.length,
        permissions: !!userPermissions
      });
    }
  }, [filters, risks, selectedProjectId, userPermissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Form submitted', { editingRisk, formData });
    
    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.department_id) {
        alert('Please fill in all required fields (Title, Description, Department)');
        return;
      }

      // Calculate residual risk based on control effectiveness
      const controlEffectiveness = formData.control_rating / 100;
      console.log(`🔧 Control calc: ${formData.control_rating}% = ${controlEffectiveness}`);
      
      // With 0% control, residual should equal inherent
      // With higher control, reduce risk proportionally
      const residualLikelihood = controlEffectiveness === 0 ? 
        formData.inherent_likelihood : 
        Math.max(1, Math.round(formData.inherent_likelihood * (1 - controlEffectiveness * 0.8)));
      const residualImpact = controlEffectiveness === 0 ? 
        formData.inherent_impact : 
        Math.max(1, Math.round(formData.inherent_impact * (1 - controlEffectiveness * 0.3)));
      
      console.log(`📊 Residual calc: Inherent L=${formData.inherent_likelihood} I=${formData.inherent_impact} → Residual L=${residualLikelihood} I=${residualImpact}`);
      
      const riskData: any = {
        organization_id: '00000000-0000-0000-0000-000000000000',
        risk_id: editingRisk ? editingRisk.risk_id : `RISK-${String(risks.length + 1).padStart(3, '0')}`,
        title: formData.title,
        description: formData.description,
        department_id: formData.department_id,
        category_id: formData.category || null,
        inherent_likelihood: formData.inherent_likelihood,
        inherent_impact: formData.inherent_impact,
        // Remove inherent_score - it's a generated column
        residual_likelihood: residualLikelihood,
        residual_impact: residualImpact,
        // Remove residual_score - it's a generated column
        control_name: formData.control_name || null,
        control_rating: formData.control_rating ? Math.min(formData.control_rating / 100, 1.0) : null,
        due_date: formData.due_date || null,
        comments: formData.comments || null,
        project_id: formData.project_id || selectedProjectId || null,
        status: editingRisk ? editingRisk.status : 'not_materialized',
        identified_date: new Date().toISOString().split('T')[0]
      };

      console.log('💾 Saving risk data:', riskData);

      if (editingRisk) {
        console.log('✏️ Updating existing risk:', editingRisk.id);
        const { error } = await supabase
          .from('risks')
          .update(riskData)
          .eq('id', editingRisk.id);
        if (error) {
          console.error('❌ Update error:', error);
          throw error;
        }
        console.log('✅ Risk updated successfully');
      } else {
        console.log('➕ Creating new risk');
        const { error } = await supabase
          .from('risks')
          .insert([riskData]);
        if (error) {
          console.error('❌ Insert error:', error);
          throw error;
        }
        console.log('✅ Risk created successfully');
      }

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        category: '',
        department_id: '',
        inherent_likelihood: 3,
        inherent_impact: 3,
        control_name: '',
        control_rating: 0,
        due_date: '',
        comments: '',
        project_id: selectedProjectId || ''
      });
      setEditingRisk(null);
      setShowRiskForm(false);
      
      // Reload data to show changes
      await loadData();
      
    } catch (error) {
      console.error('❌ Error saving risk:', error);
      alert(`Failed to ${editingRisk ? 'update' : 'create'} risk: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadEvidence = async (riskId: string) => {
    try {
      const { data, error } = await supabase
        .from('control_evidence')
        .select('*')
        .eq('risk_uuid', riskId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setEvidence(data || []);
    } catch (error) {
      console.error('Error loading evidence:', error);
    }
  };

  const downloadEvidence = async (filePath: string, fileName: string) => {
    try {
      const { data: urlData } = await supabase.storage
        .from('control-evidence')
        .createSignedUrl(filePath, 60);

      if (urlData?.signedUrl) {
        const response = await fetch(urlData.signedUrl);
        const blob = await response.blob();
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading evidence:', error);
    }
  };

  const handleEdit = (risk: Risk) => {
    setFormData({
      title: risk.title,
      description: risk.description || '',
      category: risk.category_id || '',
      department_id: risk.department_id || '',
      inherent_likelihood: risk.inherent_likelihood || 3,
      inherent_impact: risk.inherent_impact || 3,
      control_name: risk.control_name || '',
      control_rating: risk.control_rating || 0,
      due_date: risk.due_date || '',
      comments: risk.comments || '',
      project_id: risk.project_id || ''
    });
    setEditingRisk(risk);
    setShowRiskForm(true);
    
    // Load evidence for Risk team users and admins
    console.log('🔍 Evidence loading check:', {
      user: user?.email,
      isAdmin: user?.role === 'admin',
      isRiskTeamUser: userPermissions?.isRiskTeamUser,
      shouldLoadEvidence: userPermissions?.isRiskTeamUser || user?.role === 'admin'
    });
    
    if (canViewEvidenceLocal()) {
      loadEvidence(risk.id);
    }
  };

  const handleManageControl = (risk: Risk) => {
    setSelectedRiskForControl(risk);
    setShowControlManagement(true);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      riskLevel: '',
      department: '',
      project: ''
    });
  };

  const handleDelete = async (risk: Risk) => {
    if (!window.confirm(`Are you sure you want to delete the risk "${risk.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting risk:', risk.id);
      const { error } = await supabase
        .from('risks')
        .delete()
        .eq('id', risk.id);
      
      if (error) {
        console.error('❌ Delete error:', error);
        throw error;
      }
      
      console.log('✅ Risk deleted successfully');
      await loadData(); // Reload data to reflect deletion
    } catch (error) {
      console.error('❌ Error deleting risk:', error);
      alert(`Failed to delete risk: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Load data when user and permissions are both available
  useEffect(() => {
    if (user && userPermissions) {
      console.log('👤 User and permissions available, loading data...');
      loadData();
    } else if (user && !userPermissions) {
      // User available but permissions not loaded yet
    } else if (!user) {
      // No user available
    }
  }, [user, userPermissions]);

  // Re-filter risks when permissions change - CRITICAL FIX
  useEffect(() => {
    if (risks.length > 0 && userPermissions) {
      // Permissions loaded - applyFilters will handle filtering
    }
  }, [risks, userPermissions]);

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

  if (error) {
    return (
      <div className="min-h-screen rg-theme flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Risk Register</h3>
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={loadData} className="rg-btn rg-btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen rg-theme">
      <main className="max-w-7xl mx-auto py-8 px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="rg-header-title">Risk Register</h2>
            <p className="rg-header-subtitle">Comprehensive risk identification and management</p>
            {selectedProjectName && (
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-blue-600">Filtered by project: {selectedProjectName}</span>
                {onClearProject && (
                  <button onClick={onClearProject} className="text-sm text-gray-500 hover:text-gray-700">
                    Clear filter
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {canEditRiskLocal('') && (
              <button
                onClick={() => {
                  setEditingRisk(null);
                  setFormData({
                    title: '',
                    description: '',
                    category: '',
                    department_id: '',
                    inherent_likelihood: 3,
                    inherent_impact: 3,
                    control_name: '',
                    control_rating: 0,
                    due_date: '',
                    comments: '',
                    project_id: selectedProjectId || ''
                  });
                  setShowRiskForm(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-sm font-semibold rounded-lg shadow-md hover:from-slate-800 hover:to-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Risk
              </button>
            )}
            <button onClick={onBack} className="rg-btn rg-btn-secondary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          </div>
        </div>

        {/* Collapsible Filters Section */}
        <div className="rg-card mb-4">
          <div 
            className="rg-card-header cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setFiltersCollapsed(!filtersCollapsed)}
          >
            <div className="flex items-center justify-between w-full">
              <h3 className="rg-card-title flex items-center">
                <svg 
                  className={`w-5 h-5 mr-2 transition-transform duration-200 ${
                    filtersCollapsed ? 'rotate-0' : 'rotate-90'
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Filters
              </h3>
              <div className="text-sm text-gray-600">Showing {filteredRisks.length} of {risks.length} risks</div>
            </div>
          </div>
          {!filtersCollapsed && (
            <div className="rg-card-body">
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                <div>
                  <input 
                    type="text" 
                    placeholder="Search risks..." 
                    className="form-control"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
                <div>
                  <select 
                    className="form-control"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">All Status</option>
                    <option value="overdue">Overdue</option>
                    <option value="due-soon">Due Soon</option>
                    <option value="on-track">On Track</option>
                    <option value="no-date">No Date</option>
                  </select>
                </div>
                <div>
                  <select 
                    className="form-control"
                    value={filters.riskLevel}
                    onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
                  >
                    <option value="">All Risk Levels</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <select 
                    className="form-control"
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select 
                    className="form-control"
                    value={selectedProjectId || filters.project}
                    onChange={(e) => {
                      // Clear selectedProjectId when using dropdown
                      if (onClearProject && selectedProjectId) {
                        onClearProject();
                      }
                      setFilters({ ...filters, project: e.target.value });
                    }}
                  >
                    <option value="">All Projects</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                    <option value="no-project">No Project</option>
                  </select>
                </div>
                <div>
                  <button 
                    onClick={clearFilters}
                    className="btn btn-outline-secondary w-full"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {filteredRisks.length > 0 ? (
              <table className="w-full" style={{ minWidth: '1200px' }}>
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                    <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider border-r border-slate-600 last:border-r-0">Risk ID</th>
                    <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider border-r border-slate-600 last:border-r-0">Risk Title</th>
                    <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider border-r border-slate-600 last:border-r-0">Description</th>
                    <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider border-r border-slate-600 last:border-r-0">Project</th>
                    <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider border-r border-slate-600 last:border-r-0">Inherent Risk</th>
                    <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider border-r border-slate-600 last:border-r-0">Department</th>
                    <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider border-r border-slate-600 last:border-r-0">Control</th>
                    <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider border-r border-slate-600 last:border-r-0">Control Rating</th>
                    <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider border-r border-slate-600 last:border-r-0">Due Date</th>
                    <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider border-r border-slate-600 last:border-r-0">Status</th>
                    <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider border-r border-slate-600 last:border-r-0">Comments</th>
                    <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider border-r border-slate-600 last:border-r-0">Residual Risk</th>
                    <th className="px-6 py-2 text-left text-sm font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRisks.map((risk, index) => (
                    <tr key={risk.id} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 last:border-r-0">
                        <span className="font-mono text-sm font-medium text-slate-900">{risk.risk_id}</span>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200 last:border-r-0">
                        <div className="font-semibold text-slate-900 leading-tight">{risk.title}</div>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200 last:border-r-0">
                        <div className="max-w-xs text-sm text-slate-600 leading-relaxed" title={risk.description}>
                          {risk.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 last:border-r-0">
                        <span className="text-sm text-slate-600">{risk.project_name || '—'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 last:border-r-0">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                          calculateRiskLevel(risk.inherent_likelihood, risk.inherent_impact) === 'Critical' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' :
                          calculateRiskLevel(risk.inherent_likelihood, risk.inherent_impact) === 'High' ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20' :
                          calculateRiskLevel(risk.inherent_likelihood, risk.inherent_impact) === 'Medium' ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20' :
                          'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                        }`}>
                          {calculateRiskLevel(risk.inherent_likelihood, risk.inherent_impact)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 last:border-r-0">
                        <span className="text-sm font-medium text-slate-700">{risk.department_name}</span>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200 last:border-r-0">
                        <span className="text-sm text-slate-600">{risk.control_name || '—'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 last:border-r-0">
                        <span className="text-sm text-slate-600">
                          {(() => {
                            const rating = risk.control_rating ? Math.round(risk.control_rating * 100) : 0;
                            switch(rating) {
                              case 0: return '0%';
                              case 20: return '20%';
                              case 40: return '40%';
                              case 60: return '60%';
                              case 80: return '80%';
                              case 95: return '95%';
                              default: return `${rating}%`;
                            }
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 last:border-r-0">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                          getDueDateStatus(risk.due_date || null) === 'overdue' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' :
                          getDueDateStatus(risk.due_date || null) === 'due-soon' ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20' :
                          getDueDateStatus(risk.due_date || null) === 'on-track' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' :
                          'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20'
                        }`}>
                          {risk.due_date || 'No Date'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 last:border-r-0">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 shadow-sm">
                          {risk.status || 'Identified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-r border-gray-200 last:border-r-0">
                        <div className="max-w-xs text-sm text-slate-600 leading-relaxed" title={risk.comments || ''}>
                          {risk.comments || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 last:border-r-0">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                          risk.residual_risk === 'Critical' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' :
                          risk.residual_risk === 'High' ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20' :
                          risk.residual_risk === 'Medium' ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20' :
                          'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                        }`}>
                          {risk.residual_risk || 'Medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {canEditRiskLocal(risk.department_id || '') && (
                            <button 
                              onClick={() => handleEdit(risk)}
                              className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200" 
                              title="Edit Risk"
                            >
                              <i className="fas fa-edit text-sm"></i>
                            </button>
                          )}
                          {canManageControlsLocal(risk.department_id || '') && !canEditRiskLocal(risk.department_id || '') && (
                            <button 
                              onClick={() => handleManageControl(risk)}
                              className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-all duration-200" 
                              title="Manage Control"
                            >
                              <i className="fas fa-cogs text-sm"></i>
                            </button>
                          )}
                          {canEditRiskLocal(risk.department_id || '') && (
                            <button 
                              onClick={() => handleDelete(risk)}
                              className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200" 
                              title="Delete Risk"
                            >
                              <i className="fas fa-trash text-sm"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No risks found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {filters.search || filters.status || filters.riskLevel || filters.department || filters.project 
                    ? 'Try adjusting your filters to see more results.' 
                    : 'Get started by creating your first risk.'}
                </p>
                {canEditRiskLocal('') && !filters.search && !filters.status && !filters.riskLevel && !filters.department && !filters.project && (
                  <button
                    onClick={() => {
                      setEditingRisk(null);
                      setFormData({
                        title: '',
                        description: '',
                        category: '',
                        department_id: '',
                        inherent_likelihood: 3,
                        inherent_impact: 3,
                        control_name: '',
                        control_rating: 0,
                        due_date: '',
                        comments: '',
                        project_id: selectedProjectId || ''
                      });
                      setShowRiskForm(true);
                    }}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New Risk
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Risk Form Modal */}
      {showRiskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingRisk ? 'Edit Risk' : 'Create New Risk'}
              </h2>
              <button
                onClick={() => {
                  setShowRiskForm(false);
                  setFormData({
                    title: '',
                    description: '',
                    category: '',
                    department_id: '',
                    inherent_likelihood: 3,
                    inherent_impact: 3,
                    control_name: '',
                    control_rating: 0,
                    due_date: '',
                    comments: '',
                    project_id: ''
                  });
                  setEditingRisk(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Risk Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter risk title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Risk Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the risk in detail..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Department *</label>
                  <select
                    required
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project (Optional)</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inherent Likelihood (1-5)</label>
                  <select
                    value={formData.inherent_likelihood}
                    onChange={(e) => setFormData({ ...formData, inherent_likelihood: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 - Very Low</option>
                    <option value={2}>2 - Low</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - High</option>
                    <option value={5}>5 - Very High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inherent Impact (1-5)</label>
                  <select
                    value={formData.inherent_impact}
                    onChange={(e) => setFormData({ ...formData, inherent_impact: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 - Minimal</option>
                    <option value={2}>2 - Minor</option>
                    <option value={3}>3 - Moderate</option>
                    <option value={4}>4 - Major</option>
                    <option value={5}>5 - Severe</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Control Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.control_name}
                    onChange={(e) => setFormData({ ...formData, control_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter control name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Control Effectiveness</label>
                  <select
                    value={formData.control_rating}
                    onChange={(e) => setFormData({ ...formData, control_rating: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>0% - No Control (No control in place)</option>
                    <option value={20}>20% - Weak Control (Basic/informal controls)</option>
                    <option value={40}>40% - Adequate Control (Documented procedures)</option>
                    <option value={60}>60% - Good Control (Monitored & tested)</option>
                    <option value={80}>80% - Strong Control (Automated/integrated)</option>
                    <option value={95}>95% - Excellent Control (Fail-safe/redundant)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
                  <textarea
                    rows={3}
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional comments..."
                  />
                </div>
              </div>

              {/* Evidence Review Section for Risk Team Users */}
              {editingRisk && canViewEvidenceLocal() && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Control Evidence Review</h3>
                  {evidence.length > 0 ? (
                    <div className="space-y-3">
                      {evidence.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <i className="fas fa-file-alt text-blue-500"></i>
                              <div>
                                <p className="font-medium text-gray-900">{item.file_name}</p>
                                <p className="text-sm text-gray-500">
                                  Uploaded: {new Date(item.uploaded_at).toLocaleDateString()} | 
                                  Size: {(item.file_size / 1024 / 1024).toFixed(2)} MB |
                                  Status: <span className={`px-2 py-1 rounded-full text-xs ${
                                    item.review_status === 'approved' ? 'bg-green-100 text-green-800' :
                                    item.review_status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {item.review_status}
                                  </span>
                                </p>
                                {item.control_description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    Control: {item.control_description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => downloadEvidence(item.file_path, item.file_name)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              <i className="fas fa-download mr-1"></i> Download
                            </button>
                            {user?.role === 'admin' && (
                              <>
                                <select
                                  value={item.review_status}
                                  onChange={async (e) => {
                                    try {
                                      await supabase
                                        .from('control_evidence')
                                        .update({ 
                                          review_status: e.target.value,
                                          review_date: new Date().toISOString()
                                        })
                                        .eq('id', item.id);
                                      loadEvidence(editingRisk.id);
                                    } catch (error) {
                                      console.error('Error updating review status:', error);
                                    }
                                  }}
                                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="approved">Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No evidence files uploaded for this risk.</p>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowRiskForm(false);
                    setFormData({
                      title: '',
                      description: '',
                      category: '',
                      department_id: '',
                      inherent_likelihood: 3,
                      inherent_impact: 3,
                      control_name: '',
                      control_rating: 0,
                      due_date: '',
                      comments: '',
                      project_id: ''
                    });
                    setEditingRisk(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingRisk ? 'Update Risk' : 'Create Risk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Control Management Modal */}
      <ControlManagement
        risk={selectedRiskForControl}
        isOpen={showControlManagement}
        onClose={() => {
          setShowControlManagement(false);
          setSelectedRiskForControl(null);
        }}
        onSave={() => {
          loadData(); // Refresh the risk data when control is saved
        }}
      />
    </div>
  );
};

export default RiskRegister;
