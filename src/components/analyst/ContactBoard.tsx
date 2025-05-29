import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, CheckCircle, Trash2, UserCircle, Plus, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ContactRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

interface NewContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const ContactBoard: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContactData, setNewContactData] = useState<NewContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Failed to load contact requests');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      // First, delete all associated contact notes
      const { error: notesError } = await supabase
        .from('contact_notes')
        .delete()
        .eq('request_id', id);

      if (notesError) throw notesError;

      // Then delete the contact request
      const { error: requestError } = await supabase
        .from('contact_requests')
        .delete()
        .eq('id', id);

      if (requestError) throw requestError;

      setRequests(requests.filter(r => r.id !== id));
      toast.success('Contact request permanently deleted');
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting request:', err);
      toast.error('Failed to delete contact request');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('contact_requests')
        .insert([{
          ...newContactData,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      setRequests([data, ...requests]);
      setShowNewContactModal(false);
      setNewContactData({ name: '', email: '', phone: '', message: '' });
      toast.success('Contact created successfully');
    } catch (err) {
      console.error('Error creating contact:', err);
      toast.error('Failed to create contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contact requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-4">
            {error}
          </div>
          <button
            onClick={() => {
              setLoading(true);
              loadRequests();
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Contact Requests</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowNewContactModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Contact
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <UserCircle className="h-6 w-6" />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Contact Requests</h3>
            <p className="mt-1 text-sm text-gray-500">
              New contact requests will appear here
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:border-blue-300 border border-gray-200 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{request.name}</h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(request.status)}
                  <span className="text-sm font-medium capitalize">
                    {request.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">{request.email}</p>
                <p className="text-sm text-gray-600">{request.phone}</p>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{request.message}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {new Date(request.created_at).toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/analyst/contacts/${request.id}`)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(request.id);
                    }}
                    disabled={deletingId === request.id}
                    className={`text-gray-400 hover:text-red-600 transition-colors ${
                      deletingId === request.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Contact Modal */}
      {showNewContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Contact</h3>
            <form onSubmit={handleCreateContact}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newContactData.name}
                    onChange={(e) => setNewContactData({ ...newContactData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter contact name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newContactData.email}
                    onChange={(e) => setNewContactData({ ...newContactData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={newContactData.phone}
                    onChange={(e) => setNewContactData({ ...newContactData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message/Notes
                  </label>
                  <textarea
                    required
                    value={newContactData.message}
                    onChange={(e) => setNewContactData({ ...newContactData, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Enter any additional notes"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewContactModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Permanent Deletion
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete this contact request? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactBoard;