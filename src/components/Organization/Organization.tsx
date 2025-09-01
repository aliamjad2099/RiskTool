import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Department {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  department_code: string;
  is_risk_department: boolean;
  is_executive_department: boolean;
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  job_title: string;
  is_active: boolean;
  created_at: string;
  departments?: Department[];
}

interface OrganizationProps {}

const Organization: React.FC<OrganizationProps> = () => {
  const [activeTab, setActiveTab] = useState<'departments' | 'users'>('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [showUserActions, setShowUserActions] = useState<string | null>(null);

  // Department form state
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    department_code: '',
    parent_id: '',
    is_risk_department: false,
    is_executive_department: false
  });

  // User form state
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    job_title: '',
    department_ids: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadDepartments(), loadUsers()]);
    setLoading(false);
  };

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadUsers = async () => {
    try {
      // First get users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('full_name');

      if (usersError) throw usersError;

      // Then get user-department mappings with department details
      const { data: userDepartments, error: udError } = await supabase
        .from('user_departments')
        .select(`
          user_id,
          department_id,
          departments(id, name)
        `);

      if (udError) throw udError;

      // Combine the data
      const usersWithDepartments = usersData?.map(user => ({
        ...user,
        user_departments: userDepartments?.filter(ud => ud.user_id === user.id) || []
      })) || [];

      setUsers(usersWithDepartments);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        // Update existing department
        const { error } = await supabase
          .from('departments')
          .update({
            ...newDepartment,
            parent_id: newDepartment.parent_id || null
          })
          .eq('id', editingDepartment.id);

        if (error) throw error;
      } else {
        // Insert new department
        const { error } = await supabase
          .from('departments')
          .insert([{
            organization_id: '00000000-0000-0000-0000-000000000000',
            ...newDepartment,
            parent_id: newDepartment.parent_id || null
          }]);

        if (error) throw error;
      }

      setNewDepartment({
        name: '',
        description: '',
        department_code: '',
        parent_id: '',
        is_risk_department: false,
        is_executive_department: false
      });
      setEditingDepartment(null);
      setShowAddDepartment(false);
      loadDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Failed to save department. Please check the console for details.');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // First ensure we have a test organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();

      if (orgError && orgError.code === 'PGRST116') {
        // Organization doesn't exist, create it
        const { error: createOrgError } = await supabase
          .from('organizations')
          .insert([{
            id: '00000000-0000-0000-0000-000000000000',
            name: 'Test Organization',
            subdomain: 'test-org'
          }]);

        if (createOrgError) throw createOrgError;
      }

      // Insert or update user
      let userData;
      if (editingUser) {
        const { data, error: updateError } = await supabase
          .from('users')
          .update({
            full_name: newUser.full_name,
            email: newUser.email,
            job_title: newUser.job_title
          })
          .eq('id', editingUser.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        userData = data;
      } else {
        const { data, error: userError } = await supabase
          .from('users')
          .insert([{
            organization_id: '00000000-0000-0000-0000-000000000000',
            full_name: newUser.full_name,
            email: newUser.email,
            job_title: newUser.job_title
          }])
          .select()
          .single();
        
        if (userError) throw userError;
        userData = data;
      }

      // Handle user-department mappings
      if (editingUser) {
        // Delete existing mappings
        await supabase
          .from('user_departments')
          .delete()
          .eq('user_id', userData.id);
      }
      
      // Insert new user-department mappings
      if (newUser.department_ids.length > 0) {
        const userDepartments = newUser.department_ids.map((deptId, index) => ({
          user_id: userData.id,
          department_id: deptId,
          is_primary_department: index === 0 // First department is primary
        }));

        const { error: mappingError } = await supabase
          .from('user_departments')
          .insert(userDepartments);

        if (mappingError) throw mappingError;
      }

      setNewUser({
        full_name: '',
        email: '',
        job_title: '',
        department_ids: []
      });
      setEditingUser(null);
      setShowAddUser(false);
      loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user. Please check the console for details.');
    }
  };

  const getDepartmentBadgeClass = (dept: Department) => {
    if (dept.is_risk_department) return 'rg-badge-critical';
    if (dept.is_executive_department) return 'rg-badge-high';
    return 'rg-badge-medium';
  };

  const getDepartmentBadgeText = (dept: Department) => {
    if (dept.is_risk_department) return 'RISK DEPT';
    if (dept.is_executive_department) return 'EXECUTIVE';
    return 'STANDARD';
  };

  // Handler functions for department actions
  const handleEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    setNewDepartment({
      name: dept.name,
      description: dept.description || '',
      department_code: dept.department_code || '',
      parent_id: dept.parent_id || '',
      is_risk_department: dept.is_risk_department,
      is_executive_department: dept.is_executive_department
    });
    setShowAddDepartment(true);
  };

  const handleDeleteDepartment = async (dept: Department) => {
    if (window.confirm(`Are you sure you want to delete the ${dept.name} department?`)) {
      try {
        const { error } = await supabase
          .from('departments')
          .delete()
          .eq('id', dept.id);
        
        if (error) throw error;
        loadDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
        alert('Failed to delete department. Please check the console for details.');
      }
    }
  };

  // Handler functions for user actions
  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setNewUser({
      full_name: user.full_name,
      email: user.email,
      job_title: user.job_title,
      department_ids: [] // Will be populated from user_departments
    });
    setShowAddUser(true);
  };

  const handleToggleUserStatus = async (user: any) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);
      
      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status. Please check the console for details.');
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (window.confirm(`Are you sure you want to delete ${user.full_name}?`)) {
      try {
        // First delete user-department mappings
        const { error: mappingError } = await supabase
          .from('user_departments')
          .delete()
          .eq('user_id', user.id);
        
        if (mappingError) throw mappingError;
        
        // Then delete the user
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id);
        
        if (error) throw error;
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please check the console for details.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen rg-theme flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen rg-theme">
      <div className="rg-main">
        <div className="px-8 py-6">
          <div className="mb-8">
            <h1 className="rg-header-title">Organization Management</h1>
            <p className="rg-header-subtitle">Manage departments, users, and organizational structure</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-8">
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'departments'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              Departments
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              Users
            </button>
          </div>

          {/* Departments Tab */}
          {activeTab === 'departments' && (
            <div>
              <div className="rg-section-header">
                <div>
                  <h2 className="rg-section-title">Departments</h2>
                  <p className="rg-section-subtitle">Manage organizational departments and structure</p>
                </div>
                <button
                  onClick={() => setShowAddDepartment(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Department
                </button>
              </div>

              {/* Departments Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => (
                  <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{dept.name}</h3>
                          <p className="text-sm text-gray-500 font-medium">{dept.department_code}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dept.is_risk_department ? 'bg-red-100 text-red-700' :
                        dept.is_executive_department ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getDepartmentBadgeText(dept)}
                      </span>
                    </div>
                    
                    {dept.description && (
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">{dept.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <span>{new Date(dept.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleEditDepartment(dept)}
                          className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Department"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteDepartment(dept)}
                          className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Department"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {departments.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No departments yet</h3>
                  <p className="text-gray-500 mb-6">Get started by creating your first organizational department</p>
                  <button
                    onClick={() => setShowAddDepartment(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Department
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="rg-section-header">
                <div>
                  <h2 className="rg-section-title">Users</h2>
                  <p className="rg-section-subtitle">Manage user accounts and department assignments</p>
                </div>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add User
                </button>
              </div>

              {/* Users Table */}
              <div className="rg-table-container">
                <table className="rg-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Job Title</th>
                      <th>Departments</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="font-medium">{user.full_name}</td>
                        <td>{user.email}</td>
                        <td>{user.job_title}</td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            <span className="rg-badge rg-badge-medium text-xs">Department info needed</span>
                          </div>
                        </td>
                        <td>
                          <span className={`rg-badge ${user.is_active ? 'rg-badge-success' : 'rg-badge-secondary'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleToggleUserStatus(user)}
                              className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                                user.is_active 
                                  ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                                  : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                              }`}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-900 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {users.length === 0 && (
                <div className="rg-empty-state">
                  <svg className="w-12 h-12 rg-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <h3 className="rg-text-secondary font-medium mb-2">No users yet</h3>
                  <p className="rg-text-muted">Add users to start managing your organization</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Department Modal */}
      {showAddDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAddDepartment(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{editingDepartment ? 'Edit Department' : 'Add Department'}</h3>
              <button
                onClick={() => setShowAddDepartment(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddDepartment}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Name</label>
                  <input
                    type="text"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newDepartment.description}
                    onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Brief description of the department"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Code</label>
                  <input
                    type="text"
                    value={newDepartment.department_code}
                    onChange={(e) => setNewDepartment({...newDepartment, department_code: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., IT, FIN, HR"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parent Department</label>
                  <select
                    value={newDepartment.parent_id}
                    onChange={(e) => setNewDepartment({...newDepartment, parent_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No parent (top-level department)</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newDepartment.is_risk_department}
                      onChange={(e) => setNewDepartment({...newDepartment, is_risk_department: e.target.checked})}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Risk Department (sees all risks)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newDepartment.is_executive_department}
                      onChange={(e) => setNewDepartment({...newDepartment, is_executive_department: e.target.checked})}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Executive Department (sees all risks)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDepartment(false);
                    setEditingDepartment(null);
                    setNewDepartment({
                      name: '',
                      description: '',
                      department_code: '',
                      parent_id: '',
                      is_risk_department: false,
                      is_executive_department: false
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingDepartment ? 'Update Department' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAddUser(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{editingUser ? 'Edit User' : 'Add User'}</h3>
              <button
                onClick={() => setShowAddUser(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="user@company.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    value={newUser.job_title}
                    onChange={(e) => setNewUser({...newUser, job_title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Senior Analyst"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Department</label>
                  <select
                    value={newUser.department_ids[0] || ''}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      department_ids: e.target.value ? [e.target.value] : []
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  {departments.length === 0 && (
                    <p className="text-gray-500 text-sm mt-2">No departments available. Add departments first.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUser(false);
                    setEditingUser(null);
                    setNewUser({
                      full_name: '',
                      email: '',
                      job_title: '',
                      department_ids: []
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organization;
