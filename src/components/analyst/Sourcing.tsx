import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DollarSign, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface SourcingData {
  listingPrice: string;
  currentRents: string;
  comps: string;
}

const Sourcing: React.FC = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SourcingData>({
    listingPrice: '',
    currentRents: '',
    comps: ''
  });

  useEffect(() => {
    const loadExistingData = async () => {
      if (!dealId) return;

      try {
        const { data, error } = await supabase
          .from('deal_sections')
          .select('data')
          .eq('deal_id', dealId)
          .eq('type', 'sourcing')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        if (data?.data) {
          setFormData(data.data as SourcingData);
        }
      } catch (error) {
        console.error('Error loading sourcing data:', error);
        toast.error('Failed to load existing data');
      }
    };

    loadExistingData();
  }, [dealId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealId) return;

    setIsLoading(true);
    try {
      // Create or update deal section
      const { data: section, error: sectionError } = await supabase
        .from('deal_sections')
        .upsert({
          deal_id: dealId,
          type: 'sourcing',
          data: formData,
          completed: true
        })
        .select()
        .single();

      if (sectionError) throw sectionError;

      // Create audit log
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          deal_id: dealId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'update',
          changes: {
            section: 'sourcing',
            data: formData
          }
        });

      if (auditError) throw auditError;

      // Update deal progress
      await api.deals.updateProgress(dealId, 15);
      
      toast.success('Sourcing information saved successfully');
      navigate(`/analyst/deal/${dealId}/financial`);
    } catch (error: any) {
      console.error('Error saving sourcing info:', error);
      toast.error(error.message || 'Failed to save sourcing information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sourcing & Screening</h2>
        <p className="text-gray-600">Enter property details and comparable sales data.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="listingPrice" className="block text-sm font-medium text-gray-700 mb-2">
            Listing Price
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              id="listingPrice"
              name="listingPrice"
              value={formData.listingPrice}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1,000,000"
            />
          </div>
        </div>

        <div>
          <label htmlFor="currentRents" className="block text-sm font-medium text-gray-700 mb-2">
            Current Monthly Rents
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              id="currentRents"
              name="currentRents"
              value={formData.currentRents}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="5,000"
            />
          </div>
        </div>

        <div>
          <label htmlFor="comps" className="block text-sm font-medium text-gray-700 mb-2">
            Comparable Properties
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
            <textarea
              id="comps"
              name="comps"
              value={formData.comps}
              onChange={handleChange}
              rows={4}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter comparable property addresses and details..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save & Continue'}
        </button>
      </form>
    </div>
  );
};

export default Sourcing;