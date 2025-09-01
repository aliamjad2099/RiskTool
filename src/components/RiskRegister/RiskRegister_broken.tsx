import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Risk {
  id: string;
  organization_id: string;
  risk_id: string;
  title: string;
  description: string;
  department_id: string;
  business_unit?: string;
  inherent_likelihood: number;
  inherent_impact: number;
  inherent_score: number;
  risk_appetite?: string;
  priority?: string;
  identified_date?: string;
  target_mitigation_date?: string;
  next_review_date?: string;
  tags?: string[];
  control_title?: string;
  control_description?: string;
  control_effectiveness?: number;
  residual_score?: number;
  status: 'materialized' | 'not_materialized';
  created_at: string;
  departments?: { name: string };
}

interface Department {
  id: string;
  name: string;
  is_risk_department: boolean;
}

interface RiskRegisterProps {
  onBack: () => void;
}

const RiskRegister: React.FC<RiskRegisterProps> = ({ onBack }) => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isRiskDepartmentUser, setIsRiskDepartmentUser] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    department_id: '',
    inherent_likelihood: 3,
    inherent_impact: 3
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load risks with department names
      const { data: risksData, error: risksError } = await supabase
        .from('risks')
        .select(`
          *,
          departments (name)
        `)
        .eq('organization_id', '00000000-0000-0000-0000-000000000000')
        .order('created_at', { ascending: false });

      if (risksError) throw risksError;
      setRisks(risksData || []);

      // Load departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('organization_id', '00000000-0000-0000-0000-000000000000')
        .order('name');

      if (deptError) throw deptError;
      setDepartments(deptData || []);

      // Check if current user is in risk department (simplified for demo)
      setIsRiskDepartmentUser(true); // For now, allow all users to create risks

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const riskData = {
        organization_id: '00000000-0000-0000-0000-000000000000',
        risk_id: `RISK-${String(risks.length + 1).padStart(3, '0')}`,
        ...formData
      };

      if (editingRisk) {
        const { error } = await supabase
          .from('risks')
          .update(formData)
          .eq('id', editingRisk.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('risks')
          .insert([riskData]);

        if (error) throw error;
      }

      const resetForm = () => {
        setFormData({
          title: '',
          description: '',
          category: '',
          department_id: '',
          inherent_likelihood: 3,
          inherent_impact: 3
        });
        setEditingRisk(null);
      };

      resetForm();
      setShowRiskForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving risk:', error);
      alert('Failed to save risk. Please check the console for details.');
    }
  };

  const handleEdit = (risk: Risk) => {
    setFormData({
      title: risk.title,
      description: risk.description,
      category: risk.risk_category || '',
      department_id: risk.department_id,
      inherent_likelihood: risk.inherent_likelihood,
      inherent_impact: risk.inherent_impact
    });
    setEditingRisk(risk);
    setShowRiskForm(true);
  };

  const handleDelete = async (risk: Risk) => {
    if (!confirm(`Are you sure you want to delete "${risk.title}"?`)) return;

    try {
      const { error } = await supabase
        .from('risks')
        .delete()
        .eq('id', risk.id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting risk:', error);
      alert('Failed to delete risk.');
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 20) return { level: 'Critical', class: 'rg-risk-critical-professional' };
    if (score >= 15) return { level: 'High', class: 'rg-risk-high-professional' };
    if (score >= 8) return { level: 'Medium', class: 'rg-risk-medium-professional' };
    return { level: 'Low', class: 'rg-risk-low-professional' };
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
    <div className="min-h-screen rg-theme">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 rg-sidebar transform transition-transform duration-300 ease-in-out">
        <div className="rg-sidebar-brand flex items-center justify-center h-20 px-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold text-lg">🛡️</span>
            </div>
            <div>
              <h1 className="rg-header-title">RiskGuard</h1>
              <p className="rg-header-subtitle text-sm">Risk Register</p>
            </div>
          </div>
        </div>

        <nav className="px-6 pb-6">
          <div className="space-y-2">
            <div className="px-3 mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Main Navigation</p>
            </div>
            
            <button 
              onClick={onBack}
              className="rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span>Dashboard</span>
            </button>
            
            <button className="rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium active">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Risk Register</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-72">
        <header className="rg-header sticky top-0 z-40">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="rg-header-title">Risk Register</h2>
                <p className="rg-header-subtitle">Comprehensive risk identification and management</p>
              </div>
              {isRiskDepartmentUser && (
                <button
                  onClick={() => {
                    setEditingRisk(null);
                    setFormData({
                      title: '',
                      description: '',
                      category: '',
                      department_id: '',
                      inherent_likelihood: 3,
                      inherent_impact: 3
                    });
                      control_effectiveness: 0,
                      status: 'not_materialized'
                    });
                    setShowRiskForm(true);
                  }}
                  className="rg-btn-primary"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Risk
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="px-8 py-6">
          {/* Risk List */}
          <div className="rg-card">
            <div className="rg-card-header">
              <h3 className="rg-card-title">Risk Overview</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold rg-text-primary">Risk ID</th>
                    <th className="text-left py-4 px-4 font-semibold rg-text-primary">Title</th>
                    <th className="text-left py-4 px-4 font-semibold rg-text-primary">Department</th>
                    <th className="text-left py-4 px-4 font-semibold rg-text-primary">Inherent Risk</th>
                    <th className="text-left py-4 px-4 font-semibold rg-text-primary">Residual Risk</th>
                    <th className="text-left py-4 px-4 font-semibold rg-text-primary">Status</th>
                    {isRiskDepartmentUser && (
                      <th className="text-left py-4 px-4 font-semibold rg-text-primary">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {risks.map((risk) => {
                    const inherentLevel = getRiskLevel(risk.inherent_score);
                    const residualLevel = risk.residual_score ? getRiskLevel(risk.residual_score) : null;
                    
                    return (
                      <tr key={risk.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4 font-medium rg-text-primary">{risk.risk_id}</td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium rg-text-primary">{risk.title}</p>
                            {risk.description && (
                              <p className="text-sm rg-text-secondary mt-1">{risk.description.slice(0, 100)}...</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 rg-text-secondary">{risk.departments?.name}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${inherentLevel.class}`}>
                            {inherentLevel.level} ({risk.inherent_score})
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {residualLevel ? (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${residualLevel.class}`}>
                              {residualLevel.level} ({risk.residual_score})
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">No controls</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            risk.status === 'materialized' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {risk.status === 'materialized' ? 'Materialized' : 'Not Materialized'}
                          </span>
                        </td>
                        {isRiskDepartmentUser && (
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(risk)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit Risk"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(risk)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete Risk"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {risks.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium rg-text-primary mb-2">No risks found</h3>
                  <p className="rg-text-secondary">Start by creating your first risk assessment.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Risk Form Modal */}
      {showRiskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold rg-text-primary">
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
                    inherent_impact: 3
                  });
                  setEditingRisk(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium rg-text-primary mb-2">Risk Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter risk title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium rg-text-primary mb-2">Risk Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select category...</option>
                  <option value="Security">Security</option>
                  <option value="Financial">Financial</option>
                  <option value="Operational">Operational</option>
                  <option value="Strategic">Strategic</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Technology">Technology</option>
                  <option value="Environmental">Environmental</option>
                  <option value="Reputational">Reputational</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium rg-text-primary mb-2">Risk Description</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the risk in detail..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium rg-text-primary mb-2">Assign to Department</label>
                <select
                  required
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-sm font-medium rg-text-primary mb-2">Inherent Likelihood (1-5)</label>
                  <select
                    value={formData.inherent_likelihood}
                    onChange={(e) => setFormData({ ...formData, inherent_likelihood: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 - Very Low</option>
                    <option value={2}>2 - Low</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - High</option>
                    <option value={5}>5 - Very High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium rg-text-primary mb-2">Inherent Impact (1-5)</label>
                  <select
                    value={formData.inherent_impact}
                    onChange={(e) => setFormData({ ...formData, inherent_impact: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 - Minimal</option>
                    <option value={2}>2 - Minor</option>
                    <option value={3}>3 - Moderate</option>
                    <option value={4}>4 - Major</option>
                    <option value={5}>5 - Severe</option>
                  </select>
                </div>
              </div>

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
                      inherent_impact: 3
                    });
                    setEditingRisk(null);
                  }}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  {editingRisk ? 'Update Risk' : 'Create Risk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskRegister;
