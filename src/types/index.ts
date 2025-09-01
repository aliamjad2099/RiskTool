// Core Risk Management Types

export interface Organization {
  id: string;
  name: string;
  subdomain?: string;
  settings: OrganizationSettings;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  defaultRiskMethodology?: string;
  riskAppetite?: 'low' | 'moderate' | 'high';
  currency?: string;
  timezone?: string;
}

export interface RiskMethodology {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  likelihood_scale: ScaleItem[];
  impact_scale: ScaleItem[];
  scoring_formula: string;
  risk_matrix: RiskMatrix;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScaleItem {
  value: number;
  label: string;
  description?: string;
  color?: string;
}

export interface RiskMatrix {
  levels: RiskLevel[];
  matrix: number[][]; // 2D array mapping likelihood x impact to risk level
}

export interface RiskLevel {
  id: string;
  name: string;
  color: string;
  min_score: number;
  max_score: number;
  action_required: string;
}

export interface RiskCategory {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  created_at: string;
}

export interface Risk {
  id: string;
  organization_id: string;
  risk_id: string; // user-friendly ID
  title: string;
  description?: string;
  category_id?: string;
  methodology_id?: string;
  
  // Ownership
  owner_id?: string;
  stakeholders?: string[];
  business_unit?: string;
  
  // Inherent risk
  inherent_likelihood: number;
  inherent_impact: number;
  inherent_score: number;
  
  // Risk appetite
  risk_appetite?: 'acceptable' | 'review' | 'unacceptable';
  risk_tolerance_threshold?: number;
  
  // Status
  status: 'open' | 'in_progress' | 'mitigated' | 'closed';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  
  // Dates
  identified_date: string;
  target_mitigation_date?: string;
  last_reviewed_date?: string;
  next_review_date?: string;
  
  // Metadata
  tags?: string[];
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Relationships (populated via joins)
  category?: RiskCategory;
  methodology?: RiskMethodology;
  controls?: RiskControl[];
  latest_assessment?: RiskAssessment;
}

export interface Control {
  id: string;
  organization_id: string;
  control_id: string; // user-friendly ID
  title: string;
  description?: string;
  
  // Classification
  control_type: 'preventive' | 'detective' | 'corrective';
  control_nature: 'manual' | 'automated' | 'hybrid';
  control_frequency?: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  
  // Effectiveness
  design_effectiveness?: number; // 1-5
  operating_effectiveness?: number; // 1-5
  overall_effectiveness?: number; // calculated
  
  // Ownership
  owner_id?: string;
  implementer_id?: string;
  
  // Implementation
  implementation_status: 'planned' | 'in_progress' | 'implemented' | 'not_effective';
  implementation_date?: string;
  last_tested_date?: string;
  next_test_date?: string;
  
  // Cost-benefit
  implementation_cost?: number;
  annual_operating_cost?: number;
  
  // Metadata
  tags?: string[];
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RiskControl {
  id: string;
  risk_id: string;
  control_id: string;
  control_effectiveness_override?: number;
  notes?: string;
  created_at: string;
  
  // Populated via joins
  control?: Control;
}

export interface RiskAssessment {
  id: string;
  risk_id: string;
  assessment_date: string;
  assessor_id?: string;
  
  // Scores
  likelihood: number;
  impact: number;
  inherent_score: number;
  
  // Residual risk
  residual_likelihood?: number;
  residual_impact?: number;
  residual_score?: number;
  
  // Details
  assessment_notes?: string;
  evidence_links?: string[];
  confidence_level?: number; // 1-5
  
  created_at: string;
}

export interface KeyRiskIndicator {
  id: string;
  organization_id: string;
  risk_id?: string;
  name: string;
  description?: string;
  
  // Configuration
  measurement_unit?: string;
  target_value?: number;
  threshold_yellow?: number;
  threshold_red?: number;
  frequency?: 'daily' | 'weekly' | 'monthly';
  
  // Current status
  current_value?: number;
  last_measured_date?: string;
  status: 'green' | 'yellow' | 'red';
  
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  table_name: string;
  record_id: string;
  action: 'insert' | 'update' | 'delete';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id?: string;
  timestamp: string;
}

// UI Types
export interface DashboardStats {
  totalRisks: number;
  highRisks: number;
  criticalRisks: number;
  controlsImplemented: number;
  averageRiskScore: number;
  riskTrend: 'up' | 'down' | 'stable';
}

export interface RiskFilters {
  status?: string[];
  priority?: string[];
  category?: string[];
  owner?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, record: any) => React.ReactNode;
}
