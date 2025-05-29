import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';
import type { Deal } from '../../lib/types';
import toast from 'react-hot-toast';

const DealOverview: React.FC = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeal = async () => {
      try {
        if (!dealId) return;
        const dealData = await api.deals.get(dealId);
        setDeal(dealData);
      } catch (error) {
        console.error('Error loading deal:', error);
        toast.error('Failed to load deal information');
      } finally {
        setLoading(false);
      }
    };

    loadDeal();
  }, [dealId]);

  const navigateToSection = (section: string) => {
    navigate(`/analyst/deal/${dealId}/${section}`);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Deal Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The requested deal could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">{deal.address}</h1>
        </div>
        <p className="text-gray-600">
          Submitted by {deal.investor_name || 'Unknown Investor'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          onClick={() => navigateToSection('financial')}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-700">Current ARV</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${deal.arvs?.current.toLocaleString() || 'N/A'}
          </p>
        </div>

        <div 
          onClick={() => navigateToSection('financial')}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-700">GRM</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {deal.metrics?.grm || 'N/A'}x
          </p>
        </div>

        <div 
          onClick={() => navigateToSection('financial')}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-700">Cap Rate</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {deal.metrics?.capRate || 'N/A'}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Progress</h2>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-gray-700">{deal.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${deal.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { name: 'Sourcing & Screening', status: deal.progress >= 15 ? 'completed' : 'pending', path: 'sourcing' },
            { name: 'Financial Analysis', status: deal.progress >= 30 ? 'completed' : 'pending', path: 'financial' },
            { name: 'Rehab & Inspections', status: deal.progress >= 45 ? 'completed' : 'pending', path: 'rehab' },
            { name: 'Legal & Title', status: deal.progress >= 60 ? 'completed' : 'pending', path: 'legal' },
            { name: 'Financing & Equity', status: deal.progress >= 75 ? 'completed' : 'pending', path: 'financing' },
            { name: 'Marketplace Analysis', status: deal.progress >= 90 ? 'completed' : 'pending', path: 'marketplace' },
            { name: 'Final Review', status: deal.progress === 100 ? 'completed' : 'pending', path: 'review' }
          ].map((step, index) => (
            <div
              key={index}
              onClick={() => navigateToSection(step.path)}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {step.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
                <span className="font-medium text-gray-900">{step.name}</span>
              </div>
              <span className={`text-sm font-medium ${
                step.status === 'completed' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {step.status === 'completed' ? 'Completed' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DealOverview;