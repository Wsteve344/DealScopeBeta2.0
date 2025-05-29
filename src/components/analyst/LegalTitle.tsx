import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Scale, FileText, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface LegalData {
  titleCompany: string;
  titleSearchStatus: 'not_started' | 'in_progress' | 'completed';
  purchaseAgreement: {
    status: 'not_uploaded' | 'pending_review' | 'approved' | 'rejected';
    notes: string;
  };
  titleInsurance: {
    status: 'pending' | 'ordered' | 'received';
    provider?: string;
    policyNumber?: string;
    coverage?: number;
  };
  legalReview: {
    status: 'pending' | 'in_progress' | 'completed';
    findings: string[];
    recommendations: string[];
  };
}

const LegalTitle: React.FC = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [legalData, setLegalData] = useState<LegalData>({
    titleCompany: '',
    titleSearchStatus: 'not_started',
    purchaseAgreement: {
      status: 'not_uploaded',
      notes: ''
    },
    titleInsurance: {
      status: 'pending'
    },
    legalReview: {
      status: 'pending',
      findings: [],
      recommendations: []
    }
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
        .eq('type', 'legal')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      if (data?.data) {
        setLegalData(data.data as LegalData);
      }
    } catch (error) {
      console.error('Error loading legal data:', error);
      toast.error('Failed to load existing data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealId) return;

    setIsLoading(true);
    try {
      // Create or update deal section
      const { error: sectionError } = await supabase
        .from('deal_sections')
        .upsert({
          deal_id: dealId,
          type: 'legal',
          data: legalData,
          completed: true
        });

      if (sectionError) throw sectionError;

      // Update deal progress to 60%
      await api.deals.updateProgress(dealId, 60);
      
      toast.success('Legal information saved successfully');
      navigate(`/analyst/deal/${dealId}/financing`);
    } catch (error) {
      console.error('Error saving legal info:', error);
      toast.error('Failed to save legal information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    section: keyof LegalData,
    field: string,
    value: any
  ) => {
    setLegalData(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object'
        ? { ...prev[section], [field]: value }
        : value
    }));
  };

  const addFinding = () => {
    setLegalData(prev => ({
      ...prev,
      legalReview: {
        ...prev.legalReview,
        findings: [...prev.legalReview.findings, '']
      }
    }));
  };

  const addRecommendation = () => {
    setLegalData(prev => ({
      ...prev,
      legalReview: {
        ...prev.legalReview,
        recommendations: [...prev.legalReview.recommendations, '']
      }
    }));
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Legal & Title Review</h2>
        <p className="text-gray-600">Manage legal documentation and title search process.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title Company Section */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Title Company</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={legalData.titleCompany}
                onChange={(e) => handleInputChange('titleCompany', '', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter title company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title Search Status
              </label>
              <select
                value={legalData.titleSearchStatus}
                onChange={(e) => handleInputChange('titleSearchStatus', '', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </section>

        {/* Purchase Agreement Section */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Agreement</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={legalData.purchaseAgreement.status}
                onChange={(e) => handleInputChange('purchaseAgreement', 'status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="not_uploaded">Not Uploaded</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={legalData.purchaseAgreement.notes}
                onChange={(e) => handleInputChange('purchaseAgreement', 'notes', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter notes about the purchase agreement"
              />
            </div>
          </div>
        </section>

        {/* Title Insurance Section */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Title Insurance</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={legalData.titleInsurance.status}
                onChange={(e) => handleInputChange('titleInsurance', 'status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="ordered">Ordered</option>
                <option value="received">Received</option>
              </select>
            </div>

            {legalData.titleInsurance.status !== 'pending' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    value={legalData.titleInsurance.provider || ''}
                    onChange={(e) => handleInputChange('titleInsurance', 'provider', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter insurance provider"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    value={legalData.titleInsurance.policyNumber || ''}
                    onChange={(e) => handleInputChange('titleInsurance', 'policyNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter policy number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coverage Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={legalData.titleInsurance.coverage || ''}
                      onChange={(e) => handleInputChange('titleInsurance', 'coverage', parseFloat(e.target.value))}
                      className="w-full pl-8 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter coverage amount"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Legal Review Section */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal Review</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Status
              </label>
              <select
                value={legalData.legalReview.status}
                onChange={(e) => handleInputChange('legalReview', 'status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Findings
                </label>
                <button
                  type="button"
                  onClick={addFinding}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Finding
                </button>
              </div>
              <div className="space-y-2">
                {legalData.legalReview.findings.map((finding, index) => (
                  <input
                    key={index}
                    type="text"
                    value={finding}
                    onChange={(e) => {
                      const newFindings = [...legalData.legalReview.findings];
                      newFindings[index] = e.target.value;
                      handleInputChange('legalReview', 'findings', newFindings);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter finding"
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Recommendations
                </label>
                <button
                  type="button"
                  onClick={addRecommendation}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Recommendation
                </button>
              </div>
              <div className="space-y-2">
                {legalData.legalReview.recommendations.map((recommendation, index) => (
                  <input
                    key={index}
                    type="text"
                    value={recommendation}
                    onChange={(e) => {
                      const newRecommendations = [...legalData.legalReview.recommendations];
                      newRecommendations[index] = e.target.value;
                      handleInputChange('legalReview', 'recommendations', newRecommendations);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter recommendation"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
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
      </form>
    </div>
  );
};

export default LegalTitle;