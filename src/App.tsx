import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { UserProvider } from './contexts/UserContext';
import { Auth } from './components/Auth/Auth';
import { PasswordChange } from './components/Auth/PasswordChange';
import RiskMatrix from './components/RiskMatrix/RiskMatrix';
import RiskRegister from './components/RiskRegister/RiskRegister';
import RiskAssessmentProjects from './components/RiskAssessmentProjects/RiskAssessmentProjects';
import Organization from './components/Organization/Organization';
import './styles/corporate-theme.css';

const AppContent: React.FC = () => {
  const { user, loading, requiresPasswordChange, checkPasswordChangeRequirement, signOut } = useAuth();

  // ALL useState hooks MUST be declared before any conditional logic or early returns
  const [currentView, setCurrentView] = useState<'dashboard' | 'risk-register' | 'risk-assessment' | 'reports' | 'settings' | 'risk-projects' | 'organization'>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);
  
  // Risk Register State hooks moved from below
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState<any>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<'text' | 'textarea' | 'select' | 'number' | 'date'>('text');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (requiresPasswordChange) {
    return (
      <PasswordChange 
        onPasswordChanged={() => {
          checkPasswordChangeRequirement();
        }} 
      />
    );
  }

  const handleNavigate = (view: string) => {
    setCurrentView(view as 'dashboard' | 'risk-register' | 'risk-assessment' | 'reports' | 'settings' | 'risk-projects' | 'organization');
  };

  const handleNavigateToRiskRegister = (projectId: string, projectName: string) => {
    console.log('🚀 App.tsx - Navigating to risk register:', { projectId, projectName });
    setSelectedProjectId(projectId);
    setSelectedProjectName(projectName);
    setCurrentView('risk-register');
    console.log('✅ App.tsx - State set:', { selectedProjectId: projectId, selectedProjectName: projectName });
  };

  // Risk Register State (hooks moved to top of function)
  type ColumnType = 'text' | 'textarea' | 'select' | 'number' | 'date';

  const risks = [
    {
      title: 'Data Breach Risk',
      category: 'Security',
      riskLevel: 'High',
      status: 'Open',
      owner: 'IT Team',
      description: 'Potential unauthorized access to customer data',
      priority: 'High'
    },
    {
      title: 'Market Volatility',
      category: 'Financial',
      riskLevel: 'Medium',
      status: 'Monitoring',
      owner: 'Finance Team',
      description: 'Fluctuations in market conditions affecting revenue',
      priority: 'Medium'
    },
    {
      title: 'Regulatory Compliance',
      category: 'Compliance',
      riskLevel: 'High',
      status: 'In Progress',
      owner: 'Legal Team',
      description: 'Changes in industry regulations affecting operations',
      priority: 'High'
    }
  ];

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'rg-badge-danger';
      case 'High': return 'rg-badge-warning';
      case 'Medium': return 'rg-badge-info';
      case 'Low': return 'rg-badge-success';
      default: return 'rg-badge-secondary';
    }
  };

  const renderSidebar = () => (
    <div className="fixed inset-y-0 left-0 z-50 w-72 rg-sidebar">
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
      
      <nav className="mt-8 px-4">
        <div className="space-y-2">
          <div className="px-3 mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Main Navigation</p>
          </div>
          
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className={`rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium ${
              currentView === 'dashboard' ? 'active' : ''
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m7 7 5-5 5 5" />
            </svg>
            Dashboard
          </button>
          <button 
            onClick={() => {
              setCurrentView('risk-register');
              setSelectedProjectId(null);
              setSelectedProjectName(null);
            }} 
            className={`rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium ${
              currentView === 'risk-register' ? 'active' : ''
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Risk Register
          </button>
          <button 
            onClick={() => setCurrentView('risk-projects')} 
            className={`rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium ${
              currentView === 'risk-projects' ? 'active' : ''
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Risk Assessment Projects
          </button>
          <button 
            onClick={() => setCurrentView('risk-assessment')} 
            className={`rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium ${
              currentView === 'risk-assessment' ? 'active' : ''
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Risk Matrix
          </button>
          
          <div className="px-3 mt-8 mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Administration</p>
          </div>
          
          <button 
            onClick={() => setCurrentView('organization')} 
            className={`rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium ${
              currentView === 'organization' ? 'active' : ''
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Organization
          </button>
          <button className="rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
          
          <div className="px-3 mt-8 mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</p>
          </div>
          
          <div className="px-4 py-3">
            <p className="text-xs text-slate-400 mb-2">Signed in as:</p>
            <p className="text-sm text-white font-medium truncate">{user?.email}</p>
          </div>
          
          <button 
            onClick={() => signOut()}
            className="rg-nav-item w-full flex items-center px-4 py-3 text-sm font-medium hover:bg-red-600/10 text-red-400 hover:text-red-300"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </nav>
    </div>
  );

  switch (currentView) {
    case 'dashboard':
      return (
        <div className="min-h-screen rg-theme">
          {renderSidebar()}
          <div className="ml-72">
            <main className="max-w-7xl mx-auto py-8 px-6">
              <div className="mb-8">
                <div>
                  <h1 className="rg-header-title">Risk Management Dashboard</h1>
                  <p className="rg-header-subtitle">Monitor and assess organizational risks</p>
                </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="rg-stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="rg-stat-value">124</div>
                    <div className="rg-stat-label">Total Risks</div>
                  </div>
                  <div className="rg-stat-icon rg-bg-primary">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="rg-stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="rg-stat-value">89</div>
                    <div className="rg-stat-label">Mitigated</div>
                  </div>
                  <div className="rg-stat-icon rg-bg-success">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="rg-stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="rg-stat-value">23</div>
                    <div className="rg-stat-label">High Risk</div>
                  </div>
                  <div className="rg-stat-icon rg-bg-warning">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="rg-stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="rg-stat-value">12</div>
                    <div className="rg-stat-label">Critical</div>
                  </div>
                  <div className="rg-stat-icon rg-bg-danger">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="rg-card rg-fade-in">
                <div className="rg-card-header">
                  <h3 className="text-lg font-semibold rg-text-primary">Risk Trend Analysis</h3>
                </div>
                <div className="rg-card-body">
                  <div className="h-64 flex items-center justify-center rg-text-muted">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p>Risk trend visualization will be displayed here</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rg-card rg-fade-in">
                <div className="rg-card-header">
                  <h3 className="text-lg font-semibold rg-text-primary">Recent Risk Activities</h3>
                </div>
                <div className="rg-card-body">
                  <div className="space-y-4">
                    <div className="rg-activity-item">
                      <div className="flex items-center">
                        <div className="rg-risk-indicator rg-risk-low mr-3"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium rg-text-primary">New risk identified: Data Security</p>
                          <p className="text-xs rg-text-secondary">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="rg-activity-item">
                      <div className="flex items-center">
                        <div className="rg-risk-indicator rg-risk-low mr-3"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium rg-text-primary">Risk mitigated: Network Vulnerability</p>
                          <p className="text-xs rg-text-secondary">1 day ago</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="rg-activity-item">
                      <div className="flex items-center">
                        <div className="rg-risk-indicator rg-risk-medium mr-3"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium rg-text-primary">Risk assessment updated: Compliance Risk</p>
                          <p className="text-xs rg-text-secondary">3 days ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </main>
          </div>
        </div>
      );
    case 'risk-register':
      return (
        <div className="min-h-screen rg-theme">
          {renderSidebar()}
          <div className="ml-72">
            <RiskRegister 
              onBack={() => setCurrentView('dashboard')} 
              selectedProjectId={selectedProjectId}
              selectedProjectName={selectedProjectName}
              onClearProject={() => {
                setSelectedProjectId(null);
                setSelectedProjectName(null);
              }}
            />
          </div>
        </div>
      );
    case 'risk-projects':
      return (
        <div className="min-h-screen rg-theme">
          {renderSidebar()}
          <div className="ml-72">
            <RiskAssessmentProjects 
              onBack={() => setCurrentView('dashboard')} 
              onNavigateToRiskRegister={handleNavigateToRiskRegister}
            />
          </div>
        </div>
      );
    case 'risk-assessment':
      return (
        <div className="min-h-screen rg-theme">
          {renderSidebar()}
          <div className="ml-72">
            <RiskMatrix onBack={() => setCurrentView('dashboard')} />
          </div>
        </div>
      );
    case 'organization':
      return (
        <div className="min-h-screen rg-theme">
          {renderSidebar()}
          <div className="ml-72">
            <Organization />
          </div>
        </div>
      );
    default:
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
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <UserProvider>
        <AdminProvider>
          <AppContent />
        </AdminProvider>
      </UserProvider>
    </AuthProvider>
  );
};

export default App;
