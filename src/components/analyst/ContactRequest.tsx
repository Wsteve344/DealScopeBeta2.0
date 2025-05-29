import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Clock, UserPlus, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ContactRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
}

interface Analyst {
  id: string;
  email: string;
  name?: string;
}

const ContactRequest: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ContactRequest | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAnalyst, setSelectedAnalyst] = useState<string | null>(null);

  useEffect(() => {
    loadRequest();
    loadAnalysts();
  }, [requestId]);

  const loadRequest = async () => {
    if (!requestId) return;

    try {
      const [requestData, notesData] = await Promise.all([
        supabase
          .from('contact_requests')
          .select(`
            *,
            assigned_analyst:assigned_to(
              id,
              email,
              name
            )
          `)
          .eq('id', requestId)
          .single(),
        supabase
          .from('contact_notes')
          .select(`
            id, 
            content, 
            created_at, 
            user:user_id(
              email,
              name
            )
          `)
          .eq('request_id', requestId)
          .order('created_at', { ascending: true })
      ]);

      if (requestData.error) throw requestData.error;
      if (notesData.error) throw notesData.error;

      setRequest(requestData.data);
      setNotes(notesData.data);
    } catch (error) {
      console.error('Error loading request:', error);
      toast.error('Failed to load contact request');
      navigate('/analyst/contacts');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysts = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('role', 'analyst');

      if (error) throw error;
      setAnalysts(data || []);
    } catch (error) {
      console.error('Error loading analysts:', error);
      toast.error('Failed to load analysts');
    }
  };

  const handleAssign = async () => {
    if (!selectedAnalyst || !request) return;

    try {
      const { error } = await supabase
        .from('contact_requests')
        .update({
          assigned_to: selectedAnalyst,
          status: 'in_progress'
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Request assigned successfully');
      setShowAssignModal(false);
      loadRequest();
    } catch (error) {
      console.error('Error assigning request:', error);
      toast.error('Failed to assign request');
    }
  };

  const handleUnassign = async () => {
    if (!request) return;

    try {
      const { error } = await supabase
        .from('contact_requests')
        .update({
          assigned_to: null,
          status: 'pending'
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Request unassigned successfully');
      loadRequest();
    } catch (error) {
      console.error('Error unassigning request:', error);
      toast.error('Failed to unassign request');
    }
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestId || !newNote.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('contact_notes')
        .insert([{
          request_id: requestId,
          content: newNote.trim(),
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select(`
          id,
          content,
          created_at,
          user:user_id(
            email,
            name
          )
        `)
        .single();

      if (error) throw error;

      setNotes([...notes, data]);
      setNewNote('');
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Request not found</h3>
          <button
            onClick={() => navigate('/analyst/contacts')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Contact Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/analyst/contacts')}
        className="flex items-center text-gray-600 hover:text-blue-600 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Contact Requests
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{request.name}</h2>
            <div className="flex items-center gap-4 text-gray-600">
              <a href={`mailto:${request.email}`} className="hover:text-blue-600">
                {request.email}
              </a>
              <span>•</span>
              <a href={`tel:${request.phone}`} className="hover:text-blue-600">
                {request.phone}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {request.assigned_to ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-md">
                  <Users className="h-5 w-5" />
                  <span>Assigned to {request.assigned_analyst?.email}</span>
                </div>
                <button
                  onClick={handleUnassign}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  Unassign
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-5 w-5" />
                Assign Analyst
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium capitalize text-gray-700">
                {request.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Message</h3>
          <p className="text-gray-700">{request.message}</p>
        </div>

        <div className="text-sm text-gray-500">
          Submitted {new Date(request.created_at).toLocaleDateString()}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-medium text-gray-900 mb-4">Notes</h3>

        <div className="space-y-4 mb-6">
          {notes.map((note) => (
            <div key={note.id} className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 mb-2">{note.content}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{note.user?.email}</span>
                <span>{new Date(note.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmitNote}>
          <div className="mb-4">
            <label htmlFor="note" className="sr-only">
              Add a note
            </label>
            <textarea
              id="note"
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a note..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newNote.trim()}
              className={`flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assign Contact Request
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Analyst
              </label>
              <select
                value={selectedAnalyst || ''}
                onChange={(e) => setSelectedAnalyst(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select an analyst...</option>
                {analysts.map((analyst) => (
                  <option key={analyst.id} value={analyst.id}>
                    {analyst.name || analyst.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedAnalyst}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactRequest;