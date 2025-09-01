import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import '../../styles/corporate-theme.css';

interface RiskAssessmentProps {
  onBack: () => void;
}

interface RiskFormData {
  title: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  businessUnit: string;
  owner: string;
}

const RiskAssessment: React.FC<RiskAssessmentProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<RiskFormData>({
    title: '',
    description: '',
    category: 'operational',
    likelihood: 1,
    impact: 1,
    businessUnit: '',
    owner: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Risk scoring scales
  const likelihoodScale = [
    { value: 1, label: 'Very Low', description: 'Rare (< 5% chance)' },
    { value: 2, label: 'Low', description: 'Unlikely (5-25% chance)' },
    { value: 3, label: 'Medium', description: 'Possible (25-50% chance)' },
    { value: 4, label: 'High', description: 'Likely (50-75% chance)' },
    { value: 5, label: 'Very High', description: 'Almost Certain (> 75% chance)' }
  ];

  const impactScale = [
    { value: 1, label: 'Very Low', description: 'Minimal impact' },
    { value: 2, label: 'Low', description: 'Minor impact' },
    { value: 3, label: 'Medium', description: 'Moderate impact' },
    { value: 4, label: 'High', description: 'Major impact' },
    { value: 5, label: 'Very High', description: 'Severe impact' }
  ];

  const riskScore = formData.likelihood * formData.impact;
  
  const getRiskLevel = (score: number) => {
    if (score <= 5) return { level: 'Low', className: 'rg-badge rg-badge-low' };
    if (score <= 12) return { level: 'Medium', className: 'rg-badge rg-badge-medium' };
    if (score <= 20) return { level: 'High', className: 'rg-badge rg-badge-high' };
    return { level: 'Critical', className: 'rg-badge rg-badge-critical' };
  };

  const riskLevel = getRiskLevel(riskScore);

  const handleInputChange = (field: keyof RiskFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // First, create a test organization if none exists
      let orgId = null;
      const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
      
      if (orgs && orgs.length > 0) {
        orgId = orgs[0].id;
      } else {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert([{
            name: 'Demo Organization',
            subdomain: 'demo-' + Date.now(),
            settings: {}
          }])
          .select('id')
          .single();

        if (orgError) throw orgError;
        orgId = newOrg.id;
      }

      // Create the risk
      const { data, error } = await supabase
        .from('risks')
        .insert([{
          organization_id: orgId,
          risk_id: 'RISK-' + Date.now().toString().slice(-6),
          title: formData.title,
          description: formData.description,
          business_unit: formData.businessUnit,
          inherent_likelihood: formData.likelihood,
          inherent_impact: formData.impact,
          status: 'open',
          priority: riskLevel.level.toLowerCase(),
          identified_date: new Date().toISOString().split('T')[0]
        }])
        .select();

      if (error) throw error;

      console.log('Risk created successfully:', data);
      setSubmitStatus('success');
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          category: 'operational',
          likelihood: 1,
          impact: 1,
          businessUnit: '',
          owner: ''
        });
        setSubmitStatus('idle');
      }, 2000);

    } catch (error) {
      console.error('Error creating risk:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen rg-theme">
      {/* Enhanced Corporate Header */}
      <header className="rg-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={onBack}
                className="rg-btn rg-btn-outline flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Dashboard</span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🛡️</span>
                </div>
                <div>
                  <h1 className="rg-header-title">RiskGuard</h1>
                  <p className="rg-header-subtitle text-sm">Risk Assessment</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold rg-text-primary">Admin User</p>
                <p className="text-xs rg-text-secondary">Risk Assessor</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center ring-2 ring-slate-200">
                <span className="text-white text-sm font-bold">A</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="mb-8">
          <div className="rg-fade-in">
            <h1 className="text-4xl font-bold rg-text-primary mb-3">Risk Assessment Workflow</h1>
            <p className="rg-text-secondary text-lg font-medium">
              Comprehensive risk evaluation using likelihood × impact scoring methodology
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rg-card rg-fade-in" style={{animationDelay: '0.2s'}}>
          <div className="rg-card-body">
            {/* Risk Information Section */}
            <div className="mb-8">
              <div className="rg-section-header mb-6">
                <h3 className="rg-section-title">Risk Information</h3>
                <p className="rg-section-subtitle">Basic details about the identified risk</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="rg-form-label">Risk Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                    className="rg-form-input"
                    placeholder="e.g., Data breach due to inadequate access controls"
                  />
                </div>

                <div>
                  <label className="rg-form-label">Risk Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="rg-form-textarea"
                    placeholder="Provide a detailed description of the risk scenario, potential causes, and business context..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="rg-form-label">Business Unit</label>
                    <input
                      type="text"
                      value={formData.businessUnit}
                      onChange={(e) => handleInputChange('businessUnit', e.target.value)}
                      className="rg-form-input"
                      placeholder="e.g., IT Department, Finance, Operations"
                    />
                  </div>
                  <div>
                    <label className="rg-form-label">Risk Owner</label>
                    <input
                      type="text"
                      value={formData.owner}
                      onChange={(e) => handleInputChange('owner', e.target.value)}
                      className="rg-form-input"
                      placeholder="e.g., John Smith, Risk Manager"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Assessment Section */}
            <div className="mb-8">
              <div className="rg-section-header mb-6">
                <h3 className="rg-section-title">Risk Assessment Matrix</h3>
                <p className="rg-section-subtitle">Evaluate likelihood and impact to determine overall risk level</p>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Likelihood Assessment */}
                <div className="rg-assessment-section">
                  <div className="rg-assessment-header">
                    <h4 className="rg-assessment-title">Likelihood Assessment</h4>
                    <div className="rg-assessment-selected">
                      Current: <span className="font-bold rg-text-primary">{likelihoodScale.find(s => s.value === formData.likelihood)?.label}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {likelihoodScale.map(scale => (
                      <div key={scale.value} className={`rg-scale-option ${
                        formData.likelihood === scale.value ? 'rg-scale-selected' : ''
                      }`}>
                        <label className="flex items-start cursor-pointer p-4">
                          <input
                            type="radio"
                            name="likelihood"
                            value={scale.value}
                            checked={formData.likelihood === scale.value}
                            onChange={(e) => handleInputChange('likelihood', parseInt(e.target.value))}
                            className="rg-radio mt-1 mr-4"
                          />
                          <div className="flex-1">
                            <div className="rg-scale-label">{scale.value} - {scale.label}</div>
                            <div className="rg-scale-description">{scale.description}</div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact Assessment */}
                <div className="rg-assessment-section">
                  <div className="rg-assessment-header">
                    <h4 className="rg-assessment-title">Impact Assessment</h4>
                    <div className="rg-assessment-selected">
                      Current: <span className="font-bold rg-text-primary">{impactScale.find(s => s.value === formData.impact)?.label}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {impactScale.map(scale => (
                      <div key={scale.value} className={`rg-scale-option ${
                        formData.impact === scale.value ? 'rg-scale-selected' : ''
                      }`}>
                        <label className="flex items-start cursor-pointer p-4">
                          <input
                            type="radio"
                            name="impact"
                            value={scale.value}
                            checked={formData.impact === scale.value}
                            onChange={(e) => handleInputChange('impact', parseInt(e.target.value))}
                            className="rg-radio mt-1 mr-4"
                          />
                          <div className="flex-1">
                            <div className="rg-scale-label">{scale.value} - {scale.label}</div>
                            <div className="rg-scale-description">{scale.description}</div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Score Display */}
            <div className="rg-risk-score-card mb-8">
              <div className="text-center">
                <div className="rg-score-header mb-4">
                  <h4 className="text-xl font-bold rg-text-primary mb-2">Calculated Risk Score</h4>
                  <p className="rg-text-secondary">Based on likelihood and impact assessment</p>
                </div>
                <div className="rg-score-display mb-6">
                  <div className={`rg-score-badge ${riskLevel.className}`}>
                    <div className="rg-score-number">{riskScore}</div>
                    <div className="rg-score-level">{riskLevel.level} Risk</div>
                  </div>
                </div>
                <div className="rg-score-calculation">
                  <div className="flex items-center justify-center space-x-4 text-lg font-semibold rg-text-secondary">
                    <span className="rg-calc-item">Likelihood: {formData.likelihood}</span>
                    <span className="rg-calc-operator">×</span>
                    <span className="rg-calc-item">Impact: {formData.impact}</span>
                    <span className="rg-calc-operator">=</span>
                    <span className="rg-calc-result rg-text-primary">{riskScore}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Status Messages */}
            {submitStatus === 'success' && (
              <div className="rg-alert rg-alert-success mb-6">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-semibold text-green-800">Risk Assessment Created Successfully!</div>
                    <div className="text-sm text-green-700">The risk has been added to your organization's risk register.</div>
                  </div>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="rg-alert rg-alert-error mb-6">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-semibold text-red-800">Error Creating Risk Assessment</div>
                    <div className="text-sm text-red-700">Please check your inputs and try again. Contact support if the issue persists.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Actions */}
            <div className="rg-form-actions">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="rg-form-progress">
                  <p className="text-sm rg-text-secondary">
                    {formData.title ? '✓' : '○'} Risk Information • 
                    {formData.likelihood && formData.impact ? '✓' : '○'} Assessment Complete
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title}
                  className={`rg-btn rg-btn-lg ${
                    isSubmitting ? 'rg-btn-secondary cursor-not-allowed' : 'rg-btn-primary'
                  } flex items-center space-x-3`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Creating Risk Assessment...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Create Risk Assessment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RiskAssessment;
