import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import RiskMatrix from './components/RiskMatrix/RiskMatrix';
import Organization from './components/Organization/Organization';
import RiskRegister from './components/RiskRegister/RiskRegister';
import './styles/corporate-theme.css';

function App() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [organizations, setOrganizations] = useState<any[]>([]);
  type ViewType = 'dashboard' | 'risk-assessment' | 'risk-register' | 'organization' | 'settings';
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  const handleNavigate = (view: string) => {
    setCurrentView(view as ViewType);
  };

  // Risk Register State
  type ColumnType = 'text' | 'textarea' | 'select' | 'number' | 'date';
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState<any>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<ColumnType>('text');

  const [riskColumns, setRiskColumns] = useState([
    { id: 'title', label: 'Risk Title', type: 'text', visible: true, required: true },
    { id: 'description', label: 'Description', type: 'textarea', visible: true, required: false },
    { id: 'category', label: 'Category', type: 'select', visible: true, required: true, options: ['Operational', 'Financial', 'Strategic', 'Compliance', 'Cybersecurity'] },
    { id: 'owner', label: 'Risk Owner', type: 'text', visible: true, required: true },
    { id: 'status', label: 'Status', type: 'select', visible: true, required: true, options: ['Open', 'In Progress', 'Monitoring', 'Closed'] },
    { id: 'likelihood', label: 'Likelihood', type: 'number', visible: true, required: true },
    { id: 'impact', label: 'Impact', type: 'number', visible: true, required: true },
    { id: 'inherentRisk', label: 'Inherent Risk', type: 'select', visible: true, required: false, options: ['Low', 'Medium', 'High', 'Critical'] },
    { id: 'reviewDate', label: 'Review Date', type: 'date', visible: true, required: false },
  ]);

  const [risks] = useState([
    {
      id: 1,
      title: 'Data Breach Risk',
      description: 'Potential unauthorized access to customer data',
      category: 'Cybersecurity',
      owner: 'John Smith',
      status: 'Open',
      likelihood: 3,
      impact: 4,
      inherentRisk: 'High',
      reviewDate: '2024-12-31'
    },
    {
      id: 2,
      title: 'Market Volatility',
      description: 'Economic downturn affecting revenue',
      category: 'Financial',
      owner: 'Sarah Johnson',
      status: 'Monitoring',
      likelihood: 2,
      impact: 3,
      inherentRisk: 'Medium',
      reviewDate: '2024-11-30'
    },
    {
      id: 3,
      title: 'Regulatory Compliance',
      description: 'Changes in industry regulations affecting operations',
      category: 'Compliance',
      owner: 'Michael Brown',
      status: 'In Progress',
      likelihood: 4,
      impact: 3,
      inherentRisk: 'High',
      reviewDate: '2024-10-15'
    }
  ]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .limit(5);

      if (error) {
        console.error('Supabase connection error:', error);
        setConnectionStatus('error');
      } else {
        console.log('Supabase connected successfully:', data);
        setConnectionStatus('connected');
        setOrganizations(data || []);
      }
    } catch (err) {
      console.error('Connection test failed:', err);
      setConnectionStatus('error');
    }
  };

  const createTestOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert([
          {
            name: 'Demo Organization',
            subdomain: 'demo-' + Date.now(),
            settings: { theme: 'default' }
          }
        ])
        .select();

      if (error) {
        console.error('Error creating organization:', error);
      } else {
        console.log('Organization created:', data);
        testConnection();
      }
    } catch (err) {
      console.error('Failed to create organization:', err);
    }
  };

  // Risk Register helper functions
  const visibleColumns = riskColumns.filter(column => column.visible);

  const toggleColumnVisibility = (columnId: string) => {
    setRiskColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  const toggleColumnRequired = (columnId: string) => {
    setRiskColumns(prev =>
      prev.map(col => (col.id === columnId ? { ...col, required: !col.required } : col))
    );
  };

  const addNewColumn = () => {
    const name = newColumnName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (riskColumns.some(c => c.id === id)) {
      alert('A column with this name already exists.');
      return;
    }
    const newCol: any = { id, label: name, type: newColumnType, visible: true, required: false };
    if (newColumnType === 'select') newCol.options = [];
    setRiskColumns(prev => [...prev, newCol]);
    setNewColumnName('');
    setNewColumnType('text');
  };

  const deleteColumn = (columnId: string) => {
    const col = riskColumns.find(c => c.id === columnId);
    if (!col) return;
    if (col.required) {
      alert('Cannot delete a required column.');
      return;
    }
    if (confirm('Delete this column?')) {
      setRiskColumns(prev => prev.filter(c => c.id !== columnId));
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'rg-badge rg-badge-low';
      case 'Medium': return 'rg-badge rg-badge-medium';
      case 'High': return 'rg-badge rg-badge-high';
      case 'Critical': return 'rg-badge rg-badge-critical';
      default: return 'rg-badge rg-badge-minimal';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'rg-badge rg-status-open';
      case 'In Progress': return 'rg-badge rg-status-progress';
      case 'Monitoring': return 'rg-badge rg-status-monitoring';
      case 'Closed': return 'rg-badge rg-status-closed';
      default: return 'rg-badge rg-status-progress';
    }
  };

  if (currentView === 'risk-assessment') {
    return (
      <div className="min-h-screen rg-theme">
        {/* Enhanced Corporate Sidebar */}
        <div className="fixed inset-y-0 left-0 z-50 w-72 rg-sidebar transform transition-transform duration-300 ease-in-out">
          {/* Enhanced Logo */}
          <div className="rg-sidebar-brand flex items-center justify-center h-20 px-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-lg">🛡️</span>
              </div>
              <div>
                <h1 className="text-white text-xl font-bold tracking-tight">RiskGuard</h1>
                <p className="text-white/70 text-xs font-medium">Enterprise Risk Platform</p>
              </div>
            </div>
          </div>
          
          {/* Enhanced Navigation */}
          <nav className="mt-8 px-4">
            <div className="space-y-2">
              <div className="px-3 mb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Main Navigation</p>
              </div>
              
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5zM3 7h18M8 11h8" />
                </svg>
                <span>Dashboard</span>
              </button>
              
              <button 
                onClick={() => setCurrentView('risk-register')}
                className={`rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Risk Register</span>
              </button>
              
              <button 
                onClick={() => setCurrentView('risk-assessment')}
                className={`rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium active`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Risk Matrix</span>
              </button>
              
              <div className="px-3 mt-8 mb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Administration</p>
              </div>
              
              <button 
                onClick={() => setCurrentView('organization')}
                className={`rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Organization</span>
              </button>
              
              <button className="rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </button>
            </div>
          </nav>
        </div>

        <div className="ml-72">
          <RiskMatrix onBack={() => setCurrentView('dashboard')} />
        </div>
      </div>
    );
  } else if (currentView === 'risk-register') {
    return (
      <div className="min-h-screen rg-theme">
        {/* Enhanced Corporate Sidebar */}
        <div className="fixed inset-y-0 left-0 z-50 w-72 rg-sidebar transform transition-transform duration-300 ease-in-out">
          {/* Enhanced Logo */}
          <div className="rg-sidebar-brand flex items-center justify-center h-20 px-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-lg">🛡️</span>
              </div>
              <div>
                <h1 className="text-white text-xl font-bold tracking-tight">RiskGuard</h1>
                <p className="text-white/70 text-xs font-medium">Enterprise Risk Platform</p>
              </div>
            </div>
          </div>
          
          {/* Enhanced Navigation */}
          <nav className="mt-8 px-4">
            <div className="space-y-2">
              <div className="px-3 mb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Main Navigation</p>
              </div>
              
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5zM3 7h18M8 11h8" />
                </svg>
                <span>Dashboard</span>
              </button>
              
              <button 
                onClick={() => setCurrentView('risk-register')}
                className={`rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium active`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Risk Register</span>
              </button>
              
              <button 
                onClick={() => setCurrentView('risk-assessment')}
                className={`rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Risk Matrix</span>
              </button>
              
              <div className="px-3 mt-8 mb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Administration</p>
              </div>
              
              <button 
                onClick={() => setCurrentView('organization')}
                className={`rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Organization</span>
              </button>
              
              <button className="rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </button>
            </div>
          </nav>
        </div>

        <div className="ml-72">
          {/* Enhanced Corporate Header */}
          <header className="rg-header sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex justify-between items-center h-20">
                <div className="flex items-center space-x-6">
                <button
                  onClick={() => setCurrentView('dashboard' as ViewType)}
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
                    <p className="rg-header-subtitle text-sm">Risk Register Management</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 px-4 py-2 bg-slate-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm font-medium rg-text-secondary">
                    {connectionStatus === 'connected' ? 'Connected' : 
                     connectionStatus === 'error' ? 'Connection Error' : 'Connecting...'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">A</span>
                  </div>
                  <span className="font-semibold rg-text-primary">Admin User</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Main Content */}
        <main className="max-w-7xl mx-auto py-8 px-6">
          <div className="space-y-8">
            {/* Enhanced Page Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-3xl font-bold rg-text-primary mb-2">Risk Register</h1>
                <p className="rg-text-secondary font-medium">Comprehensive risk identification, assessment, and monitoring dashboard</p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setShowRiskForm(true)}
                  className="rg-btn rg-btn-primary flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add New Risk</span>
                </button>
                <button
                  onClick={() => setShowColumnModal(true)}
                  className="rg-btn rg-btn-secondary flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  <span>Manage Columns</span>
                </button>
              </div>
            </div>

            {/* Enhanced Risk Table */}
            <div className="rg-card rg-slide-up">
              <div className="rg-card-header flex justify-between items-center">
                <h3 className="text-lg font-semibold">Active Risk Portfolio</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-sm rg-text-secondary">{risks.length} total risks</span>
                  <div className="flex space-x-2">
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                      </svg>
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="rg-table">
                  <thead>
                    <tr>
                      {visibleColumns.map((column: any) => (
                        <th key={column.id}>
                          <div className="flex items-center space-x-2">
                            <span>{column.label}</span>
                            {column.required && (
                              <span className="text-red-500 text-xs">*</span>
                            )}
                          </div>
                        </th>
                      ))}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {risks.map((risk) => (
                      <tr key={risk.id}>
                        {visibleColumns.map((column: any) => (
                          <td key={column.id}>
                            {column.id === 'status' ? (
                              <span className={getStatusColor((risk as any)[column.id])}>
                                {(risk as any)[column.id]}
                              </span>
                            ) : column.id === 'inherentRisk' ? (
                              <span className={getRiskLevelColor((risk as any)[column.id])}>
                                {(risk as any)[column.id]}
                              </span>
                            ) : column.id === 'title' ? (
                              <div className="font-semibold rg-text-primary">
                                {(risk as any)[column.id]}
                              </div>
                            ) : column.type === 'textarea' ? (
                              <div className="max-w-xs truncate rg-text-secondary" title={(risk as any)[column.id]}>
                                {(risk as any)[column.id]}
                              </div>
                            ) : (
                              <span className="font-medium">{(risk as any)[column.id]}</span>
                            )}
                          </td>
                        ))}
                        <td>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => setEditingRisk(risk)}
                              className="rg-text-primary hover:rg-text-success font-medium text-sm transition-colors"
                            >
                              Edit
                            </button>
                            <button className="rg-text-danger hover:opacity-75 font-medium text-sm transition-opacity">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>

        {/* Column Management Modal - THE MAIN FIX */}
        {showColumnModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  {/* Backdrop (no click handler to prevent accidental close) */}
                  <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true"></div>

                  {/* Dialog */}
                  <div className="relative w-full max-w-3xl transform overflow-hidden bg-white rounded-lg shadow-xl">
                    {/* Header (no close button) */}
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold leading-6">Manage Columns</h3>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4">
                      {/* Add Column Form */}
                      <div className="mb-6 rg-card rg-card-body">
                        <h4 className="mb-3 text-sm font-medium">Add New Column</h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <input
                            type="text"
                            placeholder="Column name"
                            value={newColumnName}
                            onChange={(e) => setNewColumnName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <select
                            value={newColumnType}
                            onChange={(e) => setNewColumnType(e.target.value as ColumnType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="text">Text</option>
                            <option value="textarea">Textarea</option>
                            <option value="select">Select</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                          </select>
                          <button
                            type="button"
                            onClick={addNewColumn}
                            disabled={!newColumnName.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add Column
                          </button>
                        </div>
                      </div>

                      {/* Existing Columns */}
                      <div className="max-h-96 overflow-y-auto">
                        <div className="mb-3 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                          <div className="col-span-5">Column Name</div>
                          <div className="col-span-2 text-center">Visible</div>
                          <div className="col-span-2 text-center">Required</div>
                          <div className="col-span-3 text-center">Actions</div>
                        </div>
                        <div className="space-y-2">
                          {riskColumns.map((column) => (
                            <div key={column.id} className="grid grid-cols-12 gap-4 items-center rg-card p-3">
                              <div className="col-span-5">
                                <div className="text-sm font-medium">{column.label}</div>
                                <div className="text-xs text-gray-500 capitalize">{column.type}</div>
                              </div>
                              <div className="col-span-2 flex justify-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={column.visible}
                                    onChange={() => toggleColumnVisibility(column.id)}
                                  />
                                  <span className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></span>
                                </label>
                              </div>
                              <div className="col-span-2 flex justify-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={column.required}
                                    onChange={() => toggleColumnRequired(column.id)}
                                  />
                                  <span className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${column.required ? 'bg-red-600' : 'bg-gray-200'} peer-checked:bg-red-600`}></span>
                                </label>
                              </div>
                              <div className="col-span-3 flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => deleteColumn(column.id)}
                                  disabled={column.required}
                                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer - ONLY way to close modal */}
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        onClick={() => setShowColumnModal(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Simple Risk Form Modal */}
              {showRiskForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true"></div>
                  <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium">
                        {editingRisk ? 'Edit Risk' : 'Add New Risk'}
                      </h3>
                    </div>
                    <div className="px-6 py-4">
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Risk Title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          defaultValue={editingRisk ? editingRisk.title : ''}
                        />
                        <textarea
                          placeholder="Description"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          defaultValue={editingRisk ? editingRisk.description : ''}
                        />
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                      <button
                        onClick={() => {setShowRiskForm(false); setEditingRisk(null);}}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {setShowRiskForm(false); setEditingRisk(null);}}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {editingRisk ? 'Update Risk' : 'Add Risk'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
        </div>
      </div>
    );
  } else if (currentView === 'risk-assessment') {
    return <RiskMatrix onBack={() => setCurrentView('dashboard')} />;
  } else if (currentView === 'risk-register') {
    return <RiskRegister onBack={() => setCurrentView('dashboard')} />;
  } else if (currentView === 'organization') {
    return <Organization onBack={() => setCurrentView('dashboard')} onNavigate={handleNavigate} />;
  } else {
    return (
      <div className="min-h-screen rg-theme flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="rg-btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'organization') {
    return <Organization onBack={() => setCurrentView('dashboard')} onNavigate={handleNavigate} />;
  }

  // Default return (should not reach here with current views)
  return (
    <div className="min-h-screen rg-theme flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <button 
          onClick={() => setCurrentView('dashboard')}
          className="rg-btn-primary"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
            <button onClick={() => setCurrentView('dashboard')} className="rg-nav-item rg-nav-item-active">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m7 7 5-5 5 5" />
              </svg>
              Dashboard
            </button>
            <button onClick={() => setCurrentView('risk-register')} className="rg-nav-item">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Risk Register
            </button>
            <button onClick={() => setCurrentView('risk-assessment')} className="rg-nav-item">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Risk Matrix
            </button>
            <button onClick={() => setCurrentView('organization')} className="rg-nav-item">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Organization
            </button>
            <button className="rg-nav-item">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </nav>
        </div>

        <main className="rg-main-content">
          <div className="rg-page-header">
            <div>
              <h1 className="rg-page-title">Risk Management Dashboard</h1>
              <p className="rg-page-subtitle">Monitor and assess organizational risks</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="rg-metric-card rg-metric-card-primary">
              <div className="rg-metric-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="rg-metric-value">124</div>
                <div className="rg-metric-label">Total Risks</div>
              </div>
            </div>

            <div className="rg-metric-card rg-metric-card-success">
              <div className="rg-metric-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="rg-metric-value">89</div>
                <div className="rg-metric-label">Mitigated</div>
              </div>
            </div>

            <div className="rg-metric-card rg-metric-card-warning">
              <div className="rg-metric-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="rg-stat-icon rg-bg-success">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="rg-stat-value">{Math.round((risks.filter(r => r.status !== 'Open').length / risks.length) * 100)}%</p>
                </div>
              </div>
              <div>
                <p className="rg-stat-label mb-2">Risk Coverage</p>
                <div className="flex items-center justify-between">
                  <span className="rg-stat-trend rg-text-success">✓ {risks.filter(r => r.status !== 'Open').length} risks managed</span>
                  <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Open Actions */}
            <div className="rg-stat-card rg-fade-in" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center justify-between mb-4">
                <div className="rg-stat-icon rg-bg-warning">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="rg-stat-value">{risks.filter(r => r.status === 'Open').length}</p>
                </div>
              </div>
              <div>
                <p className="rg-stat-label mb-2">Pending Actions</p>
                <div className="flex items-center justify-between">
                  <span className="rg-stat-trend rg-text-warning">⏳ Awaiting review</span>
                  <div className="w-12 h-1 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Quick Actions & Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Quick Actions Card */}
            <div className="rg-card rg-fade-in" style={{animationDelay: '0.4s'}}>
              <div className="rg-card-header">
                <h3 className="rg-card-title">Quick Actions</h3>
                <p className="rg-card-subtitle">Common risk management tasks</p>
              </div>
              <div className="rg-card-body">
                <div className="space-y-4">
                  <button 
                    onClick={() => setCurrentView('risk-register')}
                    className="rg-action-btn rg-action-btn-primary group"
                  >
                    <div className="flex items-center">
                      <div className="rg-action-icon rg-bg-primary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-left ml-4">
                        <h4 className="font-semibold rg-text-primary">Risk Register</h4>
                        <p className="text-sm rg-text-secondary">Manage all organizational risks</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 rg-text-primary group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => setCurrentView('risk-assessment')}
                    className="rg-action-btn rg-action-btn-secondary group"
                  >
                    <div className="flex items-center">
                      <div className="rg-action-icon rg-bg-success">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="text-left ml-4">
                        <h4 className="font-semibold rg-text-primary">Risk Matrix</h4>
                        <p className="text-sm rg-text-secondary">Evaluate and score new risks</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 rg-text-primary group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Risk Activity */}
            <div className="rg-card rg-fade-in" style={{animationDelay: '0.5s'}}>
              <div className="rg-card-header">
                <h3 className="rg-card-title">Recent Risk Activity</h3>
                <p className="rg-card-subtitle">Latest risk updates and changes</p>
              </div>
              <div className="rg-card-body">
                <div className="space-y-4">
                  {risks.slice(0, 3).map((risk, index) => (
                    <div key={risk.id} className="rg-activity-item">
                      <div className="flex items-center space-x-4">
                        <div className={`rg-risk-indicator ${
                          risk.inherentRisk === 'Critical' ? 'rg-risk-critical' :
                          risk.inherentRisk === 'High' ? 'rg-risk-high' : 
                          risk.inherentRisk === 'Medium' ? 'rg-risk-medium' : 'rg-risk-low'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold rg-text-primary truncate">{risk.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="rg-activity-meta">{risk.category}</span>
                            <span className="rg-activity-separator">•</span>
                            <span className={`rg-status-badge rg-status-${risk.status.toLowerCase()}`}>
                              {risk.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`rg-risk-badge ${getRiskLevelColor(risk.inherentRisk)}`}>
                            {risk.inherentRisk}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {risks.length === 0 && (
                    <div className="text-center py-8">
                      <div className="rg-empty-state">
                        <svg className="w-12 h-12 mx-auto mb-4 rg-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="rg-text-secondary font-medium">No recent risk activity</p>
                        <p className="rg-text-muted text-sm mt-1">Start by creating your first risk assessment</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
        </div>
      </div>
    );
  }

  if (currentView === 'organization') {
    return <Organization onBack={() => setCurrentView('dashboard')} onNavigate={handleNavigate} />;
  }

  // Default return (should not reach here with current views)
  return (
    <div className="min-h-screen rg-theme flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <button 
          onClick={() => setCurrentView('dashboard')}
          className="rg-btn-primary"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export default App;
