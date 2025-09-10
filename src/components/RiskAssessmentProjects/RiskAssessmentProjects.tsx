import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface RiskAssessmentProject {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  start_date: string | null;
  target_completion_date: string | null;
  created_at: string;
  risk_count?: number;
  overdue_count?: number;
  high_risk_count?: number;
  completion_percentage?: number;
}

interface RiskAssessmentProjectsProps {
  onBack: () => void;
  onNavigateToRiskRegister: (projectId: string, projectName: string) => void;
}

const RiskAssessmentProjects: React.FC<RiskAssessmentProjectsProps> = ({ onBack, onNavigateToRiskRegister }) => {
  console.log('🏗️ RiskAssessmentProjects component mounted');
  const [projects, setProjects] = useState<RiskAssessmentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'draft' as const,
    start_date: '',
    target_completion_date: ''
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Load projects with risk statistics
  const loadProjects = async () => {
    try {
      setLoading(true);
      
      // First get a valid organization_id
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

      if (orgError) {
        console.error('Error getting organization:', orgError);
        return;
      }

      const organizationId = orgData.id;
      
      // Get projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('risk_assessment_projects')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Get risk statistics for each project
      const projectsWithStats = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { data: risks, error: risksError } = await supabase
            .from('risks')
            .select('*')
            .eq('project_id', project.id);

          if (risksError) {
            console.error('Error loading risk stats:', risksError);
            return { ...project, risk_count: 0, overdue_count: 0, high_risk_count: 0, completion_percentage: 0 };
          }

          const riskCount = risks?.length || 0;
          const overdueCount = risks?.filter(risk => {
            if (!risk.due_date) return false;
            const today = new Date();
            const dueDate = new Date(risk.due_date);
            return dueDate < today;
          }).length || 0;

          const highRiskCount = risks?.filter(risk => {
            const score = risk.inherent_likelihood * risk.inherent_impact;
            return score >= 15; // High and Critical risks
          }).length || 0;

          const completedRisks = risks?.filter(risk => 
            risk.status === 'closed' || risk.status === 'mitigated'
          ).length || 0;
          
          const completionPercentage = riskCount > 0 ? Math.round((completedRisks / riskCount) * 100) : 0;

          return {
            ...project,
            risk_count: riskCount,
            overdue_count: overdueCount,
            high_risk_count: highRiskCount,
            completion_percentage: completionPercentage
          };
        })
      );

      setProjects(projectsWithStats);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First, get the organization ID
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

      if (orgError) throw orgError;

      const { data, error } = await supabase
        .from('risk_assessment_projects')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            status: formData.status,
            start_date: formData.start_date || null,
            target_completion_date: formData.target_completion_date || null,
            organization_id: orgData.id,
            created_by: 'user-placeholder', // Replace with actual user ID when auth is implemented
            completion_percentage: 0
          }
        ])
        .select();

      if (error) throw error;

      console.log('Project created successfully:', data);
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        start_date: '',
        target_completion_date: '',
        status: 'draft'
      });
      setShowCreateModal(false);
      
      // Reload projects
      loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      start_date: project.start_date || '',
      target_completion_date: project.target_completion_date || ''
    });
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('risk_assessment_projects')
        .update({
          name: formData.name,
          description: formData.description,
          status: formData.status,
          start_date: formData.start_date || null,
          target_completion_date: formData.target_completion_date || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProject.id)
        .select();

      if (error) throw error;

      console.log('Project updated successfully:', data);
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        start_date: '',
        target_completion_date: '',
        status: 'draft'
      });
      setShowEditModal(false);
      setEditingProject(null);
      
      // Reload projects
      loadProjects();
    } catch (error) {
      console.error('Error updating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (project: any) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('risk_assessment_projects')
        .update({ is_deleted: true })
        .eq('id', project.id);

      if (error) throw error;

      console.log('Project deleted successfully');
      loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
    setActiveDropdown(null);
  };

  // Open project for risk management
  const openProject = (project: RiskAssessmentProject) => {
    onNavigateToRiskRegister(project.id, project.name);
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft': return 'badge-secondary';
      case 'active': return 'badge-primary';
      case 'completed': return 'badge-success';
      case 'archived': return 'badge-dark';
      default: return 'badge-secondary';
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rg-theme">
      <main className="max-w-7xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-8">
          <button onClick={onBack} className="rg-btn rg-btn-secondary mb-4">
            <i className="fas fa-arrow-left mr-2"></i> Back to Dashboard
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="rg-header-title">Risk Assessment Projects</h1>
              <p className="rg-header-subtitle">Organize and manage your risk assessments by project</p>
            </div>
            <button 
              className="rg-btn rg-btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fas fa-plus mr-2"></i> New Project
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="rg-card text-center" style={{padding: '4rem 2rem'}}>
            <div className="rg-card-body">
              <i className="fas fa-project-diagram" style={{fontSize: '3rem', color: 'var(--rg-slate-400)', marginBottom: '1.5rem'}}></i>
              <h4 className="rg-text-primary mb-3">No Risk Assessment Projects</h4>
              <p className="rg-text-secondary mb-4">Create your first project to start organizing your risk assessments.</p>
              <button 
                className="rg-btn rg-btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="fas fa-plus mr-2"></i> Create First Project
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="rg-card rg-slide-in" style={{cursor: 'pointer'}} onClick={() => openProject(project)}>
                <div className="rg-card-header">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="rg-text-primary font-bold mb-2">{project.name}</h5>
                      <span className={`rg-status-badge rg-status-${project.status}`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </div>
                    <div className="relative">
                      <button 
                        className="rg-btn rg-btn-secondary"
                        style={{padding: '0.5rem', fontSize: '0.75rem'}}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === project.id ? null : project.id);
                        }}
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {activeDropdown === project.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                          <div className="py-1">
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditProject(project);
                              }}
                            >
                              <i className="fas fa-edit mr-2"></i>
                              Edit Project
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project);
                              }}
                            >
                              <i className="fas fa-trash mr-2"></i>
                              Delete Project
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="rg-card-body" style={{padding: '1rem'}}>
                  <p className="rg-text-secondary mb-3" style={{fontSize: '0.8rem', lineHeight: '1.3'}}>
                    {project.description || 'No description provided'}
                  </p>
                  
                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center">
                      <div className="rg-text-primary font-bold text-lg">{project.risk_count || 0}</div>
                      <div className="rg-text-muted text-xs">Total Risks</div>
                    </div>
                    <div className="text-center">
                      <div className="rg-text-success font-bold text-lg">{project.completion_percentage || 0}%</div>
                      <div className="rg-text-muted text-xs">Complete</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full" style={{height: '4px'}}>
                      <div 
                        className="rg-bg-success rounded-full transition-all duration-300"
                        style={{height: '4px', width: `${project.completion_percentage}%`}}
                      ></div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex justify-between rg-text-muted" style={{fontSize: '0.7rem'}}>
                    <span>
                      Started: {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                    </span>
                    <span>
                      Due: {project.target_completion_date ? new Date(project.target_completion_date).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rg-modal-content w-full max-w-2xl mx-4">
            <div className="rg-modal-header">
              <h2 className="text-xl font-bold rg-text-primary">Edit Project: {editingProject.name}</h2>
              <button 
                type="button"
                className="rg-text-muted hover:rg-text-primary text-2xl font-bold"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProject(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="rg-modal-body">
              <form onSubmit={handleUpdateProject} className="space-y-6">
                <div>
                  <label className="rg-form-label">Project Name *</label>
                  <input 
                    type="text" 
                    required
                    className="rg-form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label className="rg-form-label">Description</label>
                  <textarea 
                    className="rg-form-control"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Project description and objectives"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="rg-form-label">Status</label>
                    <select 
                      className="rg-form-control"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="rg-form-label">Start Date</label>
                    <input 
                      type="date" 
                      className="rg-form-control"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="rg-form-label">Target Completion Date</label>
                  <input 
                    type="date" 
                    className="rg-form-control"
                    name="target_completion_date"
                    value={formData.target_completion_date}
                    onChange={handleInputChange}
                  />
                </div>
              </form>
            </div>
            
            <div className="rg-modal-footer">
              <button 
                type="button"
                className="rg-btn rg-btn-secondary mr-3"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProject(null);
                }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="rg-btn rg-btn-primary"
                onClick={handleUpdateProject}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rg-modal-content w-full max-w-2xl mx-4">
            <div className="rg-modal-header">
              <h2 className="text-xl font-bold rg-text-primary">Create New Risk Assessment Project</h2>
              <button 
                type="button"
                className="rg-text-muted hover:rg-text-primary text-2xl font-bold"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="rg-modal-body">
              <form onSubmit={handleCreateProject} className="space-y-6">
                <div>
                  <label className="rg-form-label">Project Name *</label>
                  <input 
                    type="text" 
                    required
                    className="rg-form-control"
                    name="name"
                    placeholder="Enter project name..."
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label className="rg-form-label">Description</label>
                  <textarea 
                    className="rg-form-textarea"
                    rows={4}
                    name="description"
                    placeholder="Describe the project objectives and scope..."
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="rg-form-label">Status</label>
                    <select 
                      className="rg-form-control"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="rg-form-label">Start Date</label>
                    <input 
                      type="date" 
                      className="rg-form-control"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="rg-form-label">Target Completion Date</label>
                  <input 
                    type="date" 
                    className="rg-form-control"
                    name="target_completion_date"
                    value={formData.target_completion_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button" 
                    className="rg-btn rg-btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="rg-btn rg-btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="rg-spinner mr-2"></span>
                        Creating...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAssessmentProjects;
