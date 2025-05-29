import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { PlusCircle, Users, Search, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

interface PipelineEntry {
  id: string;
  email: string;
  status: string;
  source?: string;
  metadata?: any;
}

const columns = [
  { id: 'lead', title: 'Leads' },
  { id: 'signup', title: 'Sign Ups' },
  { id: 'trial', title: 'Trials' },
  { id: 'checkout_started', title: 'Checkout Started' },
  { id: 'paying_customer', title: 'Paying Customers' },
  { id: 'churned', title: 'Churned' }
];

const PipelineCRM: React.FC = () => {
  const [entries, setEntries] = useState<PipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
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

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    try {
      const { error } = await supabase
        .from('client_pipeline')
        .update({ status: destination.droppableId })
        .eq('id', draggableId);

      if (error) throw error;

      setEntries(entries.map(entry => 
        entry.id === draggableId 
          ? { ...entry, status: destination.droppableId }
          : entry
      ));

      toast.success('Status updated successfully');
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

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

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-6 gap-4">
          {columns.map(column => (
            <div key={column.id} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-4">
                {column.title}
                <span className="ml-2 text-sm text-gray-500">
                  ({entries.filter(e => e.status === column.id).length})
                </span>
              </h3>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[500px]"
                  >
                    {entries
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
                              className="bg-white p-4 rounded-lg shadow mb-3"
                            >
                              <div className="text-sm font-medium text-gray-900">
                                {entry.metadata?.name || entry.email}
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <Mail className="h-4 w-4" />
                                {entry.email}
                              </div>
                              {entry.metadata?.phone && (
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                  <Phone className="h-4 w-4" />
                                  {entry.metadata.phone}
                                </div>
                              )}
                              {entry.source && (
                                <div className="mt-2 text-xs text-gray-500">
                                  Source: {entry.source}
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
    </div>
  );
};

export default PipelineCRM;