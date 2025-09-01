import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface Organization {
  id: string;
  name: string;
  subdomain?: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  loading: boolean;
  setOrganization: (org: Organization) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserOrganization();
    } else {
      setOrganization(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserOrganization = async () => {
    try {
      // In a real implementation, you'd fetch the user's organization
      // For now, we'll create a default organization
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code === 'PGRST116') {
        // No organization found, create a default one
        const { data: newOrg, error: createError } = await supabase
          .from('organizations')
          .insert({
            name: 'Default Organization',
            settings: {
              defaultRiskMethodology: 'iso31000',
              riskAppetite: 'moderate'
            }
          })
          .select()
          .single();

        if (!createError && newOrg) {
          setOrganization(newOrg);
        }
      } else if (!error && data) {
        setOrganization(data);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    organization,
    loading,
    setOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
