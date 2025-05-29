import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, DollarSign, Wrench, Scale, Store,
  Clock, CheckCircle, AlertCircle, Download, TrendingUp
} from 'lucide-react';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { Deal, DealSection } from '../../lib/types';

const ViewDeal: React.FC = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [sections, setSections] = useState<DealSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDeal = async () => {
      if (!dealId) return;

      try {
        // For demo purposes, use mock data
        if (dealId === 'd7c1a6b9-8e4f-4f3b-9d5a-12c3e4b5a6c7') {
          const { mockDeal } = await import('../../lib/mock-data');
          setDeal(mockDeal);
          setSections(mockDeal.sections || []);
          setIsLoading(false);
          return;
        }

        const dealData = await api.deals.get(dealId);
        setDeal(dealData);
        setSections(dealData.sections || []);
      } catch (error) {
        console.error('Error loading deal:', error);
        setError('Failed to load deal information');
        toast.error('Failed to load deal information');
      } finally {
        setIsLoading(false);
      }
    };

    loadDeal();
  }, [dealId]);

  const handleDownload = async () => {
    if (!dealId) return;

    try {
      setIsGeneratingReport(true);

      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No active session');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dealId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deal-report-${dealId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Report downloaded successfully');
    } catch (err) {
      console.error('Error downloading report:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to download report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertCircle className="h-5 w-5" />
          <p>{error || 'Deal not found'}</p>
        </div>
        <button
          onClick={() => navigate('/investor/dashboard')}
          className="text-blue-600 hover:text-blue-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const getSection = (type: string) => sections.find(s => s.type === type);

  const financialSection = getSection('financial');
  const rehabSection = getSection('rehab');
  const legalSection = getSection('legal');
  const marketplaceSection = getSection('marketplace');

  // Safe number formatting helper
  const formatNumber = (value: any) => {
    const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    return !isNaN(num) ? num.toLocaleString() : 'N/A';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/investor/dashboard')}
        className="mb-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{deal.address}</h1>
            <p className="text-gray-600">
              Submitted on {format(new Date(deal.created_at), 'MMMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={handleDownload}
            disabled={isGeneratingReport}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-5 w-5" />
            {isGeneratingReport ? 'Generating...' : 'Download Report'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">Analysis Score</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">{deal.analyst_score || 'N/A'}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-green-600" />
              <h3 className="font-medium text-gray-900">Time Spent</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {deal.time_spent ? `${deal.time_spent} hours` : 'N/A'}
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              <h3 className="font-medium text-gray-900">Status</h3>
            </div>
            <div className="flex items-center gap-2">
              {deal.status === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-blue-600" />
              )}
              <p className="text-lg font-medium capitalize">{deal.status.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {deal.executive_summary && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Executive Summary</h2>
            <p className="text-gray-700 leading-relaxed">{deal.executive_summary}</p>
          </div>
        )}

        <div className="space-y-8">
          {financialSection && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Financial Analysis</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Monthly Income</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    ${formatNumber(financialSection.data.currentRent)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">NOI</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    ${formatNumber(financialSection.data.noi)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Cap Rate</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {financialSection.data.capRate ? `${financialSection.data.capRate}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {rehabSection && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Rehab Estimates</h2>
              </div>
              <div className="space-y-4">
                {rehabSection.data.estimates?.map((estimate: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{estimate.category}</h3>
                        <p className="text-gray-600">{estimate.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${formatNumber(estimate.cost)}</p>
                        <p className="text-sm text-gray-500">{estimate.timeframe} days</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">Total Cost</h3>
                    <p className="text-xl font-bold text-blue-600">
                      ${formatNumber(rehabSection.data.totalCost)}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {legalSection && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Legal & Title</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Title Information</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      <span className="font-medium">Company:</span> {legalSection.data.titleCompany || 'N/A'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Status:</span>{' '}
                      <span className="capitalize">{legalSection.data.titleSearchStatus || 'N/A'}</span>
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Title Insurance</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      <span className="font-medium">Provider:</span>{' '}
                      {legalSection.data.titleInsurance?.provider || 'N/A'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Coverage:</span> $
                      {formatNumber(legalSection.data.titleInsurance?.coverage)}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {marketplaceSection && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Store className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Market Analysis</h2>
              </div>
              <div className="space-y-4">
                {marketplaceSection.data.comparableProperties?.map((prop: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{prop.address}</h3>
                        <p className="text-gray-600">{formatNumber(prop.sqft)} sqft</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${formatNumber(prop.price)}</p>
                        <p className="text-sm text-gray-500">${formatNumber(prop.pricePerSqft)}/sqft</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">Average Market Price</h3>
                    <p className="text-xl font-bold text-blue-600">
                      ${formatNumber(marketplaceSection.data.averagePrice)}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewDeal;