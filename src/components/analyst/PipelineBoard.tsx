import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { PlusCircle, Users, Search, Mail, Phone, Trash2, AlertCircle, Filter, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface PipelineEntry {
  id: string;
  email: string;
  status: string;
  source?: string;
  metadata?: any;
  converted_from?: string;
  converted_at?: string;
  last_activity?: string;
}

const columns = [
  { id: 'lead', title: 'Leads', color: 'bg-gray-100' },
  { id: 'signup', title: 'Sign Ups', color: 'bg-blue-100' },
  { id: 'trial', title: 'Trials', color: 'bg-purple-100' },
  { id: 'checkout_started', title: 'Checkout Started', color: 'bg-yellow-100' },
  { id: 'paying_customer', title: 'Paying Customers', color: 'bg-green-100' },
  { id: 'churned', title: 'Churned', color: 'bg-red-100' }
];

const PipelineBoard: React.FC = () => {
  const [entries, setEntries] = useState<PipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'manual'
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchPipelineEntries();
  }, []);

  const fetchPipelineEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('client_pipeline')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching pipeline entries:', err);
      toast.error('Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('client_pipeline')
        .insert([{
          email: newLead.email,
          status: 'lead',
          source: newLead.source,
          metadata: {
            name: newLead.name,
            phone: newLead.phone
          }
        }]);

      if (error) throw error;

      toast.success('Lead added successfully');
      setShowNewLeadForm(false);
      setNewLead({ name: '', email: '', phone: '', source: 'manual' });
      fetchPipelineEntries();
    } catch (err) {
      console.error('Error adding lead:', err);
      toast.error('Failed to add lead');
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('client_pipeline')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEntries(entries.filter(entry => entry.id !== id));
      toast.success('Lead deleted successfully');
    } catch (err) {
      console.error('Error deleting lead:', err);
      toast.error('Failed to delete lead');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    try {
      const { error } = await supabase
        .from('client_pipeline')
        .update({
          status: destination.droppableId,
          converted_from: source.droppableId,
          converted_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        })
        .eq('id', draggableId);

      if (error) throw error;

      setEntries(entries.map(entry => 
        entry.id === draggableId 
          ? {
              ...entry,
              status: destination.droppableId,
              converted_from: source.droppableId,
              converted_at: new Date().toISOString(),
              last_activity: new Date().toISOString()
            }
          : entry
      ));

      toast.success('Status updated successfully');
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.metadata?.phone?.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;

    const matchesDate = dateFilter === 'all' || (() => {
      const date = new Date(entry.created_at || '');
      const now = new Date();
      switch (dateFilter) {
        case 'today':
          return date.toDateString() === now.toDateString();
        case 'week':
          return date >= new Date(now.setDate(now.getDate() - 7));
        case 'month':
          return date >= new Date(now.setMonth(now.getMonth() - 1));
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Pipeline Board</h2>
        <button
          onClick={() => setShowNewLeadForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="h-5 w-5" />
          Add Lead
        </button>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-gray-300 rounded-md py-2 pl-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md py-2 pl-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              {columns.map(column => (
                <option key={column.id} value={column.id}>
                  {column.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-6 gap-4">
          {columns.map(column => (
            <div key={column.id} className={`${column.color} rounded-lg p-4`}>
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center justify-between">
                {column.title}
                <span className="text-sm text-gray-500">
                  ({filteredEntries.filter(e => e.status === column.id).length})
                </span>
              </h3>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[500px] space-y-3"
                  >
                    {filteredEntries
                      .filter(entry => entry.status === column.id)
                      .map((entry, index) => (
                        <Draggable
                          key={entry.id}
                          draggableId={entry.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {entry.metadata?.name || entry.email}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                    <Mail className="h-4 w-4" />
                                    {entry.email}
                                  </div>
                                  {entry.metadata?.phone && (
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                      <Phone className="h-4 w-4" />
                                      {entry.metadata.phone}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => setShowDeleteConfirm(entry.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                              
                              {entry.converted_at && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    Moved from {entry.converted_from} {' '}
                                    {formatDistanceToNow(new Date(entry.converted_at), { addSuffix: true })}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* New Lead Modal */}
      {showNewLeadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Lead</h3>
            <form onSubmit={handleAddLead} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewLeadForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Lead
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
                Confirm Deletion
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this lead? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => showDeleteConfirm && handleDeleteLead(showDeleteConfirm)}
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

export default PipelineBoard;