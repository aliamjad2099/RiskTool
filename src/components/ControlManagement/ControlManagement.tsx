import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';

interface Risk {
  id: string;
  risk_id: string;
  title: string;
  description?: string;
  department_id?: string;
  category_id?: string;
  control_name?: string;
  due_date?: string;
}

interface ControlEvidence {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  control_description: string;
  uploaded_by: string;
  uploaded_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_comments?: string;
}

interface ControlManagementProps {
  risk: Risk | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const ControlManagement: React.FC<ControlManagementProps> = ({ risk, isOpen, onClose, onSave }) => {
  const { user } = useUser();
  const { user: authUser } = useAuth();
  const [controlDescription, setControlDescription] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [evidence, setEvidence] = useState<ControlEvidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, evidenceId: string, filePath: string}>({
    show: false,
    evidenceId: '',
    filePath: ''
  });

  useEffect(() => {
    if (risk && isOpen) {
      loadControlData();
      loadEvidence();
    }
  }, [risk, isOpen]);

  const loadControlData = async () => {
    if (!risk) return;
    
    // Load existing control data from the risk record
    setControlDescription(risk.control_name || '');
    setProposedDate(risk.due_date || '');
  };

  const loadEvidence = async () => {
    if (!risk) return;

    try {
      console.log('🔍 Loading evidence for risk:', risk.id);
      const { data, error } = await supabase
        .from('control_evidence')
        .select('*')
        .eq('risk_uuid', risk.id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading evidence:', error);
        return;
      }

      console.log('📁 Evidence loaded:', data);
      setEvidence(data || []);
    } catch (error) {
      console.error('❌ Error loading evidence:', error);
    }
  };

  const handleSaveControl = async () => {
    if (!risk || !user) return;

    setLoading(true);
    try {
      // Update the risks table with control description and proposed date
      const updateData: any = {};
      
      if (controlDescription.trim()) {
        updateData.control_name = controlDescription.trim();
      }
      
      if (proposedDate && !risk.due_date) {
        // Only allow setting date if it's currently empty
        updateData.due_date = proposedDate;
      }

      const { error } = await supabase
        .from('risks')
        .update(updateData)
        .eq('id', risk.id);

      if (error) {
        throw error;
      }
      
      alert('Control information updated successfully!');
      onSave?.(); // Refresh parent data
      onClose(); // Close modal after successful save
    } catch (error) {
      console.error('Error saving control:', error);
      alert('Error saving control information');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !risk || !user) return;

    // Validate file size (10MB)
    if (file.size > 10485760) {
      alert('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpg', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF and image files (PNG, JPG, JPEG) are allowed');
      return;
    }

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `evidence/${risk.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('control-evidence')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Save evidence record to database
      const evidenceData = {
        organization_id: user.organization_id,
        risk_uuid: risk.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_path: filePath,
        control_description: controlDescription,
        uploaded_by: authUser?.id,
        review_status: 'pending'
      };

      console.log('🔍 AuthUser ID:', authUser?.id);
      console.log('🔍 User from context:', user);
      console.log('💾 Saving evidence data:', evidenceData);

      const { data: insertedData, error: dbError } = await supabase
        .from('control_evidence')
        .insert(evidenceData)
        .select();

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        throw dbError;
      }

      console.log('✅ Evidence saved to database:', insertedData);

      // Refresh evidence list
      loadEvidence();
      
      // Clear file input
      event.target.value = '';
      
      alert('Evidence uploaded successfully!');
    } catch (error) {
      console.error('Error uploading evidence:', error);
      alert('Error uploading evidence');
    } finally {
      setUploading(false);
    }
  };

  const showDeleteConfirm = (evidenceId: string, filePath: string) => {
    console.log('🗑️ Showing delete confirmation for:', { evidenceId, filePath });
    setDeleteConfirm({ show: true, evidenceId, filePath });
  };

  const deleteEvidence = async () => {
    try {
      const { evidenceId, filePath } = deleteConfirm;
      console.log('✅ Delete confirmed, proceeding with:', { evidenceId, filePath });
      
      // Delete from storage first
      console.log('🗑️ Deleting from storage...');
      const { error: storageError } = await supabase.storage
        .from('control-evidence')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue anyway - file might not exist in storage
      } else {
        console.log('✅ File deleted from storage');
      }

      // Delete from database
      console.log('🗑️ Deleting from database...');
      const { error: dbError } = await supabase
        .from('control_evidence')
        .delete()
        .eq('id', evidenceId);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw dbError;
      }

      console.log('✅ Record deleted from database');
      
      // Refresh evidence list
      await loadEvidence();
      setDeleteConfirm({ show: false, evidenceId: '', filePath: '' });
      alert('Evidence deleted successfully!');
      
    } catch (error) {
      console.error('❌ Error deleting evidence:', error);
      alert(`Error deleting evidence: ${error instanceof Error ? error.message : error}`);
    }
  };

  const cancelDelete = () => {
    console.log('❌ Delete cancelled by user');
    setDeleteConfirm({ show: false, evidenceId: '', filePath: '' });
  };

  const downloadEvidence = async (filePath: string, fileName: string) => {
    try {
      console.log('🔽 Starting download for:', { filePath, fileName });
      
      // Try using the public URL method instead
      const { data: urlData } = await supabase.storage
        .from('control-evidence')
        .createSignedUrl(filePath, 60); // 60 seconds

      if (urlData?.signedUrl) {
        console.log('✅ Got signed URL, downloading via fetch...');
        
        const response = await fetch(urlData.signedUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log('✅ Blob downloaded, size:', blob.size, 'type:', blob.type);
        
        // Get proper MIME type from the original file name
        const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
        let mimeType = blob.type;
        
        if (!mimeType || mimeType === 'application/octet-stream') {
          // Set proper MIME type based on extension
          const mimeTypes: { [key: string]: string } = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'pdf': 'application/pdf'
          };
          mimeType = mimeTypes[fileExtension] || 'application/octet-stream';
        }
        
        console.log('🎯 Using MIME type:', mimeType, 'for extension:', fileExtension);
        
        // Create proper blob with correct MIME type and force download via different method
        const properBlob = new Blob([blob], { type: mimeType });
        
        // Try using a different download approach to preserve filename
        if ('showSaveFilePicker' in window) {
          // Modern File System Access API (if supported)
          try {
            const fileHandle = await (window as any).showSaveFilePicker({
              suggestedName: fileName,
              types: [{
                description: 'Files',
                accept: { [mimeType]: [`.${fileExtension}`] }
              }]
            });
            const writable = await fileHandle.createWritable();
            await writable.write(properBlob);
            await writable.close();
            console.log('✅ File saved via File System Access API');
            return;
          } catch (err) {
            console.log('⚠️ File System Access API failed, falling back to blob URL');
          }
        }
        
        // Fallback to traditional blob URL download
        const url = URL.createObjectURL(properBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.setAttribute('download', fileName);
        a.style.display = 'none';
        
        // Try adding the element to body first, then clicking
        document.body.appendChild(a);
        console.log('🚀 Triggering download with filename:', fileName);
        
        // Use setTimeout to ensure the element is fully added to DOM
        setTimeout(() => {
          a.click();
        }, 10);
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        console.log('✅ Download completed for:', fileName);
      } else {
        // Fallback to direct download
        console.log('⚠️ No signed URL, trying direct download...');
        
        const { data, error } = await supabase.storage
          .from('control-evidence')
          .download(filePath);

        if (error) {
          console.error('Download error:', error);
          alert(`Download failed: ${error.message}`);
          return;
        }

        if (!data) {
          console.error('No file data received');
          alert('No file data received');
          return;
        }

        console.log('✅ Direct download data received, size:', data.size, 'type:', data.type);

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }
    } catch (error) {
      console.error('Error downloading evidence:', error);
      alert(`Error downloading evidence: ${error}`);
    }
  };

  if (!isOpen || !risk) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Manage Control - {risk.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Risk Information (Read-only) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Risk Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Risk ID</label>
                <p className="mt-1 text-sm text-gray-900">{risk.risk_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="mt-1 text-sm text-gray-900">{risk.title}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{risk.description}</p>
              </div>
            </div>
          </div>

          {/* Control Management */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Control Management</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Control Description</label>
                <textarea
                  value={controlDescription}
                  onChange={(e) => setControlDescription(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the control measures and procedures..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Proposed Implementation Date</label>
                {risk?.due_date ? (
                  <div className="mt-1 p-3 bg-gray-100 border border-gray-300 rounded-md">
                    <p className="text-sm text-gray-700">
                      Implementation date: <span className="font-medium">{risk.due_date}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Contact the Risk Team to modify this date
                    </p>
                  </div>
                ) : (
                  <input
                    type="date"
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSaveControl}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Control'}
                </button>
              </div>
            </div>
          </div>

          {/* Evidence Management */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Evidence Attachments</h3>
            
            {/* Upload Section */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Evidence (PDF, PNG, JPG, JPEG - Max 10MB)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploading && <p className="mt-2 text-sm text-blue-600">Uploading...</p>}
            </div>

            {/* Evidence List */}
            <div className="space-y-3">
              {evidence.length === 0 ? (
                <p className="text-gray-500 text-sm">No evidence uploaded yet.</p>
              ) : (
                evidence.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {item.file_type === 'pdf' ? (
                          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 18h12V6l-4-4H4v16zm8-14v4h4l-4-4z"/>
                          </svg>
                        ) : (
                          <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {(item.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(item.uploaded_at).toLocaleDateString()} • {item.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          console.log('🎯 Download button clicked for item:', item);
                          downloadEvidence(item.file_path, item.file_name);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          showDeleteConfirm(item.id, item.file_path);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
      
      {/* Custom Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Delete
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this evidence file? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteEvidence}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlManagement;
