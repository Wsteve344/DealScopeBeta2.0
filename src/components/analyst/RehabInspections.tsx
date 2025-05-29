import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wrench, DollarSign, Plus, Trash2, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface RehabEstimate {
  category: string;
  description: string;
  cost: number;
  timeframe: number;
}

interface ContractorRecommendation {
  name: string;
  specialty: string;
  rating: number;
  contactInfo: string;
  estimatedCost: number;
  estimatedTime: string;
  notes: string;
}

const RehabInspections: React.FC = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [estimates, setEstimates] = useState<RehabEstimate[]>([]);
  const [contractors, setContractors] = useState<ContractorRecommendation[]>([]);
  const [newEstimate, setNewEstimate] = useState<RehabEstimate>({
    category: '',
    description: '',
    cost: 0,
    timeframe: 0
  });
  const [newContractor, setNewContractor] = useState<ContractorRecommendation>({
    name: '',
    specialty: '',
    rating: 5,
    contactInfo: '',
    estimatedCost: 0,
    estimatedTime: '',
    notes: ''
  });

  useEffect(() => {
    loadExistingData();
  }, [dealId]);

  const loadExistingData = async () => {
    if (!dealId) return;

    try {
      const { data, error } = await supabase
        .from('deal_sections')
        .select('data')
        .eq('deal_id', dealId)
        .eq('type', 'rehab')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.data) {
        setEstimates(data.data.estimates || []);
        setContractors(data.data.contractors || []);
      }
    } catch (error) {
      console.error('Error loading rehab data:', error);
      toast.error('Failed to load existing data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealId) return;

    setIsLoading(true);
    try {
      const sectionData = {
        estimates,
        contractors,
        totalCost: estimates.reduce((sum, est) => sum + est.cost, 0),
        averageTimeframe: Math.ceil(
          estimates.reduce((sum, est) => sum + est.timeframe, 0) / estimates.length
        )
      };

      // Create or update deal section
      const { error: sectionError } = await supabase
        .from('deal_sections')
        .upsert({
          deal_id: dealId,
          type: 'rehab',
          data: sectionData,
          completed: true
        });

      if (sectionError) throw sectionError;

      // Update deal progress to 45%
      await api.deals.updateProgress(dealId, 45);
      
      toast.success('Rehab information saved successfully');
      navigate(`/analyst/deal/${dealId}/legal`);
    } catch (error) {
      console.error('Error saving rehab info:', error);
      toast.error('Failed to save rehab information');
    } finally {
      setIsLoading(false);
    }
  };

  const addEstimate = () => {
    if (!newEstimate.category || !newEstimate.description || newEstimate.cost <= 0) {
      toast.error('Please fill in all estimate fields');
      return;
    }
    setEstimates([...estimates, newEstimate]);
    setNewEstimate({ category: '', description: '', cost: 0, timeframe: 0 });
  };

  const removeEstimate = (index: number) => {
    setEstimates(estimates.filter((_, i) => i !== index));
  };

  const addContractor = () => {
    if (!newContractor.name || !newContractor.specialty || !newContractor.contactInfo) {
      toast.error('Please fill in all contractor fields');
      return;
    }
    setContractors([...contractors, newContractor]);
    setNewContractor({
      name: '',
      specialty: '',
      rating: 5,
      contactInfo: '',
      estimatedCost: 0,
      estimatedTime: '',
      notes: ''
    });
  };

  const removeContractor = (index: number) => {
    setContractors(contractors.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Rehab & Inspections</h2>
        <p className="text-gray-600">Enter rehab estimates and contractor recommendations.</p>
      </div>

      <div className="space-y-8">
        {/* Rehab Estimates Section */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rehab Estimates</h3>
          
          <div className="space-y-4 mb-6">
            {estimates.map((estimate, index) => (
              <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{estimate.category}</span>
                    <span className="text-sm text-gray-500">({estimate.timeframe} days)</span>
                  </div>
                  <p className="text-gray-600">{estimate.description}</p>
                  <p className="text-blue-600 font-medium">${estimate.cost.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => removeEstimate(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={newEstimate.category}
                onChange={(e) => setNewEstimate({ ...newEstimate, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Roofing, Plumbing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeframe (days)
              </label>
              <input
                type="number"
                value={newEstimate.timeframe || ''}
                onChange={(e) => setNewEstimate({ ...newEstimate, timeframe: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="1"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={newEstimate.description}
              onChange={(e) => setNewEstimate({ ...newEstimate, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe the work needed"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Cost
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={newEstimate.cost || ''}
                onChange={(e) => setNewEstimate({ ...newEstimate, cost: parseInt(e.target.value) })}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                min="0"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={addEstimate}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-5 w-5" />
            Add Estimate
          </button>
        </section>

        {/* Contractor Recommendations Section */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contractor Recommendations</h3>
          
          <div className="space-y-4 mb-6">
            {contractors.map((contractor, index) => (
              <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{contractor.name}</span>
                    <span className="text-sm text-blue-600">({contractor.specialty})</span>
                  </div>
                  <p className="text-gray-600">{contractor.contactInfo}</p>
                  <p className="text-sm text-gray-500">
                    Est. Cost: ${contractor.estimatedCost.toLocaleString()} • 
                    Time: {contractor.estimatedTime} •
                    Rating: {contractor.rating}/5
                  </p>
                  {contractor.notes && (
                    <p className="text-sm text-gray-600 italic">{contractor.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => removeContractor(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contractor Name
              </label>
              <input
                type="text"
                value={newContractor.name}
                onChange={(e) => setNewContractor({ ...newContractor, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialty
              </label>
              <input
                type="text"
                value={newContractor.specialty}
                onChange={(e) => setNewContractor({ ...newContractor, specialty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., General, Electrical"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Information
              </label>
              <input
                type="text"
                value={newContractor.contactInfo}
                onChange={(e) => setNewContractor({ ...newContractor, contactInfo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Phone or email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating (1-5)
              </label>
              <input
                type="number"
                value={newContractor.rating}
                onChange={(e) => setNewContractor({ ...newContractor, rating: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="1"
                max="5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Cost
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={newContractor.estimatedCost || ''}
                  onChange={(e) => setNewContractor({ ...newContractor, estimatedCost: parseInt(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Time
              </label>
              <input
                type="text"
                value={newContractor.estimatedTime}
                onChange={(e) => setNewContractor({ ...newContractor, estimatedTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., 2-3 weeks"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={newContractor.notes}
              onChange={(e) => setNewContractor({ ...newContractor, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Additional notes about the contractor"
            />
          </div>

          <button
            type="button"
            onClick={addContractor}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-5 w-5" />
            Add Contractor
          </button>
        </section>

        {/* Summary Section */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Total Estimated Cost</h4>
              <p className="text-2xl font-bold text-blue-600">
                ${estimates.reduce((sum, est) => sum + est.cost, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Average Timeframe</h4>
              <p className="text-2xl font-bold text-green-600">
                {Math.ceil(estimates.reduce((sum, est) => sum + est.timeframe, 0) / (estimates.length || 1))} days
              </p>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isLoading || estimates.length === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              'Saving...'
            ) : (
              <>
                Save & Continue
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RehabInspections;