import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import '../../styles/corporate-theme.css';

interface Risk {
  id: string;
  title: string;
  description: string;
  likelihood: number;
  impact: number;
  category: string;
}

interface RiskLevel {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  color: string;
}

interface RiskMatrixProps {
  onBack: () => void;
}

const RiskMatrix: React.FC<RiskMatrixProps> = ({ onBack }) => {
  const [matrixSize, setMatrixSize] = useState<3 | 4 | 5>(5);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [matrixConfigId, setMatrixConfigId] = useState<string | null>(null);

  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [showAddRisk, setShowAddRisk] = useState(false);
  const [showEditLevels, setShowEditLevels] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [newRisk, setNewRisk] = useState({
    title: '',
    description: '',
    category: '',
    likelihood: 1,
    impact: 1
  });

  const getDefaultRiskLevels = (size: 3 | 4 | 5): RiskLevel[] => {
    const maxScore = size * size;
    const ranges = {
      3: { critical: [7, 9], high: [5, 6], medium: [3, 4], low: [1, 2] },
      4: { critical: [13, 16], high: [9, 12], medium: [5, 8], low: [1, 4] },
      5: { critical: [20, 25], high: [15, 19], medium: [8, 14], low: [1, 7] }
    };
    
    const levelRanges = ranges[size];
    return [
      { id: 'critical', name: 'Critical', minScore: levelRanges.critical[0], maxScore: levelRanges.critical[1], color: 'rg-risk-critical-professional' },
      { id: 'high', name: 'High', minScore: levelRanges.high[0], maxScore: levelRanges.high[1], color: 'rg-risk-high-professional' },
      { id: 'medium', name: 'Medium', minScore: levelRanges.medium[0], maxScore: levelRanges.medium[1], color: 'rg-risk-medium-professional' },
      { id: 'low', name: 'Low', minScore: levelRanges.low[0], maxScore: levelRanges.low[1], color: 'rg-risk-low-professional' }
    ];
  };

  const [riskLevels, setRiskLevels] = useState<RiskLevel[]>(getDefaultRiskLevels(5));

  const [originalRiskLevels, setOriginalRiskLevels] = useState<RiskLevel[]>([...riskLevels]);
  const [originalMatrixSize, setOriginalMatrixSize] = useState<3 | 4 | 5>(5);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load risk matrix configuration from database on mount
  useEffect(() => {
    loadRiskMatrixFromDB();
  }, []);

  const loadRiskMatrixFromDB = async () => {
    try {
      console.log('Loading risk matrix configuration from database...');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('risk_matrix_config')
        .select('*')
        .eq('organization_id', '00000000-0000-0000-0000-000000000000')
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error loading risk matrix config:', error);
        // Use default values if error occurred
        console.log('Using default risk matrix configuration due to error');
        const defaultSize = 5;
        const defaultLevels = getDefaultRiskLevels(defaultSize);
        setMatrixSize(defaultSize);
        setRiskLevels(defaultLevels);
        setOriginalRiskLevels([...defaultLevels]);
        setOriginalMatrixSize(defaultSize);
      } else if (data) {
        console.log('Loaded risk matrix config from database:', data);
        setMatrixConfigId(data.id);
        setMatrixSize(data.matrix_size);
        setRiskLevels(data.risk_levels);
        setOriginalRiskLevels([...data.risk_levels]);
        setOriginalMatrixSize(data.matrix_size);
      } else {
        // No configuration found, use defaults
        console.log('No risk matrix config found in database, using defaults');
        const defaultSize = 5;
        const defaultLevels = getDefaultRiskLevels(defaultSize);
        setMatrixSize(defaultSize);
        setRiskLevels(defaultLevels);
        setOriginalRiskLevels([...defaultLevels]);
        setOriginalMatrixSize(defaultSize);
      }
    } catch (error) {
      console.error('Error in loadRiskMatrixFromDB:', error);
      // Use defaults on any unexpected error
      const defaultSize = 5;
      const defaultLevels = getDefaultRiskLevels(defaultSize);
      setMatrixSize(defaultSize);
      setRiskLevels(defaultLevels);
      setOriginalRiskLevels([...defaultLevels]);
      setOriginalMatrixSize(defaultSize);
    } finally {
      setLoading(false);
    }
  };

  const getRiskScore = (likelihood: number, impact: number): string => {
    const score = likelihood * impact;
    for (const level of riskLevels) {
      if (score >= level.minScore && score <= level.maxScore) {
        return level.name;
      }
    }
    return riskLevels[riskLevels.length - 1]?.name || 'Low';
  };

  const getRiskColor = (likelihood: number, impact: number): string => {
    const score = likelihood * impact;
    for (const level of riskLevels) {
      if (score >= level.minScore && score <= level.maxScore) {
        return level.color;
      }
    }
    return riskLevels[riskLevels.length - 1]?.color || 'rg-risk-low-professional';
  };

  const getLikelihoodLabel = (value: number): string => {
    return value.toString();
  };

  const getImpactLabel = (value: number): string => {
    return value.toString();
  };

  const handleCellClick = (likelihood: number, impact: number) => {
    if (selectedRisk) {
      const updatedRisks = risks.map(risk =>
        risk.id === selectedRisk.id
          ? { ...risk, likelihood, impact }
          : risk
      );
      setRisks(updatedRisks);
      setSelectedRisk(null);
    }
  };

  const addNewRisk = () => {
    const risk: Risk = {
      id: Date.now().toString(),
      title: newRisk.title,
      description: newRisk.description,
      likelihood: newRisk.likelihood,
      impact: newRisk.impact,
      category: newRisk.category
    };
    setRisks([...risks, risk]);
    setNewRisk({ title: '', description: '', category: '', likelihood: 1, impact: 1 });
    setShowAddRisk(false);
  };

  const updateRiskLevel = (index: number, field: keyof RiskLevel, value: string | number) => {
    const updatedLevels = [...riskLevels];
    updatedLevels[index] = { ...updatedLevels[index], [field]: value };

    // Only ensure ranges are valid within each level
    updatedLevels.forEach((level, i) => {
      if (level.minScore > level.maxScore) {
        updatedLevels[i] = { ...level, maxScore: level.minScore };
      }
    });

    setRiskLevels(updatedLevels);
    setHasUnsavedChanges(true);
  };

  const updateMatrixSize = (size: 3 | 4 | 5) => {
    setMatrixSize(size);
    setRiskLevels(getDefaultRiskLevels(size));
    setHasUnsavedChanges(true);
  };

  const saveRiskMatrix = async () => {
    try {
      console.log('Saving risk matrix configuration to database...');
      
      const matrixConfig = {
        organization_id: '00000000-0000-0000-0000-000000000000',
        matrix_size: matrixSize,
        risk_levels: riskLevels,
        likelihood_labels: Array.from({ length: matrixSize }, (_, i) => `${i + 1}`),
        impact_labels: Array.from({ length: matrixSize }, (_, i) => `${i + 1}`),
        version: 1,
        is_active: true
      };

      if (matrixConfigId) {
        // Update existing configuration
        console.log('Updating existing risk matrix config:', matrixConfigId);
        const { error } = await supabase
          .from('risk_matrix_config')
          .update(matrixConfig)
          .eq('id', matrixConfigId);

        if (error) {
          console.error('Error updating risk matrix config:', error);
          alert('Error saving changes. Please try again.');
          return;
        }
      } else {
        // Create new configuration - first check if any config exists for this org
        console.log('Creating new risk matrix config');
        
        // First, deactivate any existing active configs for this organization
        const { error: deactivateError } = await supabase
          .from('risk_matrix_config')
          .update({ is_active: false })
          .eq('organization_id', '00000000-0000-0000-0000-000000000000')
          .eq('is_active', true);

        if (deactivateError) {
          console.error('Error deactivating existing configs:', deactivateError);
        }

        // Now insert the new configuration
        const { data, error } = await supabase
          .from('risk_matrix_config')
          .insert(matrixConfig)
          .select()
          .single();

        if (error) {
          console.error('Error creating risk matrix config:', error);
          alert('Error saving changes. Please try again.');
          return;
        }
        
        setMatrixConfigId(data.id);
      }

      console.log('Risk matrix configuration saved successfully');
      setOriginalRiskLevels([...riskLevels]);
      setOriginalMatrixSize(matrixSize);
      setHasUnsavedChanges(false);
      setShowEditLevels(false);
      setShowSaveConfirmation(false);
      alert('Risk matrix configuration saved successfully!');
      
    } catch (error) {
      console.error('Error in saveRiskMatrix:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Error saving risk matrix: ${errorMessage}. Please try again.`);
    }
  };

  const cancelChanges = () => {
    setRiskLevels([...originalRiskLevels]);
    setMatrixSize(originalMatrixSize);
    setHasUnsavedChanges(false);
    setShowEditLevels(false);
  };

  const getRisksInCell = (likelihood: number, impact: number) => {
    return risks.filter(risk => risk.likelihood === likelihood && risk.impact === impact);
  };

  if (loading) {
    return (
      <div className="rg-page-container">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading risk matrix configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rg-page-container">
      {/* System-Wide Impact Warning */}
      <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-amber-800 mb-1">⚠️ System-Wide Configuration</h4>
            <div className="text-sm text-amber-700 space-y-1">
              <p>• Changes to matrix size or risk levels affect <strong>ALL risk types</strong> across the entire system</p>
              <p>• This includes: Inherent Risk, Residual Risk, Control Risk, and future risk assessments</p>
              <p>• Existing risks will be automatically re-categorized based on new configurations</p>
              <p>• Consider the impact on reports and analytics before making changes</p>
            </div>
          </div>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-blue-700">You have unsaved changes to the matrix configuration.</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={cancelChanges}
                className="px-3 py-1 text-xs text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSaveConfirmation(true)}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Matrix Controls */}
        <div className="xl:col-span-1 space-y-6">
          {/* Matrix Size Selector */}
          <div className="rg-card">
            <div className="rg-card-header">
              <h3 className="rg-card-title">Matrix Configuration</h3>
            </div>
            <div className="rg-card-body space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Matrix Size</label>
                <div className="space-y-2">
                  {[3, 4, 5].map(size => (
                    <button
                      key={size}
                      onClick={() => updateMatrixSize(size as 3 | 4 | 5)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                        matrixSize === size
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-medium">{size}×{size} Matrix</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {size === 3 && 'Basic assessment'}
                        {size === 4 && 'Standard assessment'}
                        {size === 5 && 'Comprehensive assessment'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Legend */}
          <div className="rg-card">
            <div className="rg-card-header">
              <div className="flex items-center justify-between">
                <h3 className="rg-card-title">Risk Levels</h3>
                <button
                  onClick={() => setShowEditLevels(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Customize
                </button>
              </div>
            </div>
            <div className="rg-card-body space-y-3">
              {riskLevels.map(level => (
                <div key={level.id} className="flex items-center space-x-3">
                  <div className={`w-6 h-4 ${level.color} rounded`}></div>
                  <span className="font-medium text-slate-700">
                    {level.name} ({level.minScore}-{level.maxScore})
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Matrix Visualization and Stats */}
        <div className="xl:col-span-3">
          {/* Matrix Visualization - moved to top */}
          <div className="rg-card mb-6">
            <div className="rg-card-header">
              <h3 className="rg-card-title">Risk Matrix</h3>
            </div>
            <div className="rg-card-body">
              <p className="text-slate-600 mb-4">
                {selectedRisk ? (
                  <span className="text-blue-600 font-medium">
                    Positioning: "{selectedRisk.title}" - Click any cell to place this risk
                  </span>
                ) : (
                  'Select a risk from the sidebar to position it based on likelihood and impact'
                )}
              </p>
            
            <div className="relative">
              {/* Top axis label */}
              <div className="flex justify-center mb-4">
                <div className="rg-axis-label">
                  Likelihood Level
                </div>
              </div>
              
              {/* Professional Axis Labels */}
              <div className="absolute -left-20 top-1/2 transform -translate-y-1/2">
                <div className="rg-axis-label transform -rotate-90 whitespace-nowrap text-sm">
                  Impact Level
                </div>
              </div>
              
              {/* Professional Matrix Grid */}
              <div 
                className="rg-matrix-grid ml-4" 
                style={{ gridTemplateColumns: `60px repeat(${matrixSize}, 1fr)` }}
              >
                {/* Top-left corner */}
                <div className="rg-matrix-header h-12">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                
                {/* Likelihood headers */}
                {Array.from({ length: matrixSize }, (_, i) => (
                  <div key={`likelihood-${i}`} className="rg-matrix-header h-12">
                    <div className="text-center">
                      <div className="font-bold text-lg">{i + 1}</div>
                    </div>
                  </div>
                ))}
                
                {/* Matrix rows */}
                {Array.from({ length: matrixSize }, (_, impactIndex) => (
                  <React.Fragment key={`row-${impactIndex}`}>
                    {/* Impact header */}
                    <div className="rg-matrix-header">
                      <div className="text-center">
                        <div className="font-bold text-lg">{matrixSize - impactIndex}</div>
                      </div>
                    </div>
                    
                    {/* Professional Matrix cells */}
                    {Array.from({ length: matrixSize }, (_, likelihoodIndex) => {
                      const likelihood = likelihoodIndex + 1;
                      const impact = matrixSize - impactIndex;
                      const cellRisks = getRisksInCell(likelihood, impact);
                      const riskColor = getRiskColor(likelihood, impact);
                      const riskScore = getRiskScore(likelihood, impact);
                      
                      return (
                        <div
                          key={`cell-${likelihood}-${impact}`}
                          onClick={() => handleCellClick(likelihood, impact)}
                          className={`rg-matrix-cell ${riskColor} ${
                            selectedRisk && cellRisks.some(r => r.id === selectedRisk.id)
                              ? 'ring-4 ring-blue-500 ring-opacity-50'
                              : ''
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center h-full w-full">
                            {cellRisks.length > 0 ? (
                              <div className="rg-risk-counter">
                                <div className="font-bold">{cellRisks.length}</div>
                                <div className="text-xs opacity-75">
                                  {cellRisks.length === 1 ? 'Risk' : 'Risks'}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs font-medium opacity-50">
                                {riskScore}
                              </div>
                            )}
                            <div className="absolute bottom-1 right-2 text-xs font-bold opacity-30">
                              {likelihood * impact}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
              
            </div>
            </div>
          </div>

          {/* Professional Matrix Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg border">
              <div className="text-2xl font-bold text-slate-700">{risks.length}</div>
              <div className="text-sm text-slate-500 font-medium">Total Risks</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">
                {risks.filter(r => getRiskScore(r.likelihood, r.impact) === 'Critical').length}
              </div>
              <div className="text-sm text-red-600 font-medium">Critical</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-700">
                {risks.filter(r => getRiskScore(r.likelihood, r.impact) === 'High').length}
              </div>
              <div className="text-sm text-orange-600 font-medium">High</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">
                {risks.filter(r => ['Low', 'Medium'].includes(getRiskScore(r.likelihood, r.impact))).length}
              </div>
              <div className="text-sm text-green-600 font-medium">Low-Medium</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Risk Modal */}
      {showAddRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddRisk(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Risk</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Risk Title</label>
                  <input
                    type="text"
                    value={newRisk.title}
                    onChange={(e) => setNewRisk({...newRisk, title: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter risk title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={newRisk.description}
                    onChange={(e) => setNewRisk({...newRisk, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter risk description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={newRisk.category}
                    onChange={(e) => setNewRisk({...newRisk, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select category</option>
                    <option value="Operational">Operational</option>
                    <option value="Financial">Financial</option>
                    <option value="Strategic">Strategic</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddRisk(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewRisk}
                  disabled={!newRisk.title || !newRisk.category}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Risk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customize Risk Levels Modal */}
      {showEditLevels && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowEditLevels(false)}></div>
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-xl flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Customize Risk Levels</h3>
              

              {/* Visual Range Preview */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Range Preview</h4>
                <div className="relative h-8 bg-white rounded border overflow-hidden">
                  {riskLevels.map((level, index) => {
                    const totalRange = Math.max(...riskLevels.map(l => l.maxScore)) - Math.min(...riskLevels.map(l => l.minScore)) + 1;
                    const startPos = ((level.minScore - Math.min(...riskLevels.map(l => l.minScore))) / totalRange) * 100;
                    const width = ((level.maxScore - level.minScore + 1) / totalRange) * 100;
                    
                    return (
                      <div
                        key={level.id}
                        className={`absolute h-full ${level.color} flex items-center justify-center text-xs font-medium text-white`}
                        style={{
                          left: `${startPos}%`,
                          width: `${width}%`
                        }}
                      >
                        {level.name}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>{Math.min(...riskLevels.map(l => l.minScore))}</span>
                  <span>{Math.max(...riskLevels.map(l => l.maxScore))}</span>
                </div>
              </div>

              <div className="space-y-4">
                {riskLevels.map((level, index) => (
                  <div key={level.id} className="flex items-start space-x-4 p-4 border border-slate-200 rounded-lg">
                    <div className={`w-8 h-6 ${level.color} rounded mt-6`}></div>
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">Name</label>
                        <input
                          type="text"
                          value={level.name}
                          onChange={(e) => updateRiskLevel(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">
                          Min Score
                          {index === riskLevels.length - 1 && <span className="text-slate-400 ml-1">(Fixed)</span>}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="25"
                          value={level.minScore}
                          onChange={(e) => updateRiskLevel(index, 'minScore', parseInt(e.target.value) || 1)}
                          disabled={index === riskLevels.length - 1}
                          className={`w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-medium ${
                            index === riskLevels.length - 1 ? 'bg-slate-100 text-slate-500' : ''
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">
                          Max Score
                          {index === 0 && <span className="text-slate-400 ml-1">(Fixed)</span>}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="25"
                          value={level.maxScore}
                          onChange={(e) => updateRiskLevel(index, 'maxScore', parseInt(e.target.value) || 25)}
                          disabled={index === 0}
                          className={`w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-medium ${
                            index === 0 ? 'bg-slate-100 text-slate-500' : ''
                          }`}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-6 min-w-fit">
                      {level.maxScore - level.minScore + 1} scores
                    </div>
                  </div>
                ))}
              </div>
              
              {hasUnsavedChanges && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-blue-700">You have unsaved changes that will be lost if you cancel.</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={cancelChanges}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSaveConfirmation(true)}
                  disabled={!hasUnsavedChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {showSaveConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowSaveConfirmation(false)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-amber-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-800">Confirm Configuration Changes</h3>
              </div>
              
              <div className="text-sm text-slate-600 mb-6 space-y-2">
                <p>You are about to make changes that will affect <strong>ALL risk assessments</strong> across the entire system.</p>
                <p>This includes all current and future risk types: Inherent, Residual, Control, and others.</p>
                <p>Are you sure you want to proceed?</p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSaveConfirmation(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRiskMatrix}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskMatrix;
