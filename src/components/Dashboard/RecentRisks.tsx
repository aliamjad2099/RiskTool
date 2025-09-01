import React from 'react';
import { AlertTriangle, Clock, User } from 'lucide-react';

interface RecentRisk {
  id: string;
  risk_id: string;
  title: string;
  status: string;
  priority: string;
  inherent_score: number;
  updated_at: string;
  owner: string;
}

const RecentRisks: React.FC = () => {
  // Mock data - will be replaced with real data from Supabase
  const recentRisks: RecentRisk[] = [
    {
      id: '1',
      risk_id: 'RISK-001',
      title: 'Cybersecurity breach in customer data systems',
      status: 'open',
      priority: 'critical',
      inherent_score: 20,
      updated_at: '2024-01-15T10:30:00Z',
      owner: 'John Smith'
    },
    {
      id: '2',
      risk_id: 'RISK-002',
      title: 'Supply chain disruption from key vendor',
      status: 'in_progress',
      priority: 'high',
      inherent_score: 15,
      updated_at: '2024-01-14T15:45:00Z',
      owner: 'Sarah Johnson'
    },
    {
      id: '3',
      risk_id: 'RISK-003',
      title: 'Regulatory compliance gap in new jurisdiction',
      status: 'open',
      priority: 'medium',
      inherent_score: 12,
      updated_at: '2024-01-13T09:15:00Z',
      owner: 'Mike Chen'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'mitigated': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="overflow-hidden">
      <div className="divide-y divide-gray-200">
        {recentRisks.map((risk) => (
          <div key={risk.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-gray-400 mt-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-primary-600">
                      {risk.risk_id}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(risk.priority)}`}>
                      {risk.priority}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(risk.status)}`}>
                      {risk.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {risk.title}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {risk.owner}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(risk.updated_at)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-medium text-gray-900">
                  Risk Score: {risk.inherent_score}
                </div>
                <div className="text-xs text-gray-500">
                  Inherent Risk
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {recentRisks.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          <AlertTriangle className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm">No recent risk updates</p>
        </div>
      )}
    </div>
  );
};

export default RecentRisks;
