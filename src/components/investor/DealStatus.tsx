import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Share2, AlertCircle, ArrowLeft, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import ShareModal from './ShareModal';

const DealStatus: React.FC = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [sections, setSections] = useState<Section[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!dealId) {
        setError('Deal ID is required');
        setIsLoading(false);
        return;
      }

      try {
        // Load deal data
        const { data: deal, error: dealError } = await supabase
          .from('deals')
          .select('progress')
          .eq('id', dealId)
          .is('deleted_at', null)
          .maybeSingle();

        if (dealError) throw dealError;
        
        if (!deal) {
          setError('Deal not found');
          setIsLoading(false);
          toast.error('Deal not found');
          navigate('/investor/dashboard');
          return;
        }

        setProgress(deal.progress);

        const { data: sectionsData, error: sectionsError } = await supabase
          .from('deal_sections')
          .select('*')
          .eq('deal_id', dealId)
          .order('type');

        if (sectionsError) throw sectionsError;
        setSections(sectionsData || []);
      } catch (error: any) {
        console.error('Error loading deal status:', error);
        setError(error.message);
        toast.error('Failed to load deal status');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dealId, navigate]);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/investor/dashboard')}
        className="mb-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {progress === 100 ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <Clock className="h-6 w-6 text-blue-500" />
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                Analysis Progress: {progress}%
              </h2>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((section, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  section.completed
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {section.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                  <span className="font-medium capitalize">
                    {section.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => navigate(`/investor/deal/${dealId}/view`)}
              disabled={progress < 100}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                progress < 100
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Eye className="h-5 w-5" />
              View Report
            </button>

            <button
              onClick={handleShare}
              disabled={progress < 100 || !reportUrl}
              className={`flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                progress < 100 || !reportUrl
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Share2 className="h-5 w-5" />
              Share
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-500 text-center">
            {progress < 100
              ? 'The report will be available once all steps are completed'
              : 'Your comprehensive due diligence report is ready'}
          </p>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        reportUrl={reportUrl}
        dealId={dealId}
      />
    </div>
  );
};

export default DealStatus;