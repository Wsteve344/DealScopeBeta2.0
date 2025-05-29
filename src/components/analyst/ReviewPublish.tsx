import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardCheck, Send, AlertCircle, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Section {
  name: string;
  status: 'complete' | 'incomplete' | 'in-progress';
  lastUpdated: string;
}

const ReviewPublish: React.FC = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [finalNotes, setFinalNotes] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const sections: Section[] = [
    { name: 'Sourcing & Screening', status: 'complete', lastUpdated: '2024-02-20' },
    { name: 'Financial Analysis', status: 'complete', lastUpdated: '2024-02-21' },
    { name: 'Rehab & Inspections', status: 'complete', lastUpdated: '2024-02-22' },
    { name: 'Legal & Title', status: 'complete', lastUpdated: '2024-02-23' },
    { name: 'Financing & Equity', status: 'complete', lastUpdated: '2024-02-24' },
    { name: 'Marketplace Comparisons', status: 'complete', lastUpdated: '2024-02-25' }
  ];

  const allSectionsComplete = sections.every(section => section.status === 'complete');

  const handlePublish = async () => {
    if (!dealId) return;
    setIsPublishing(true);

    try {
      // Update deal status to completed
      const { error: updateError } = await supabase
        .from('deals')
        .update({ 
          status: 'completed',
          progress: 100 
        })
        .eq('id', dealId);

      if (updateError) throw updateError;

      // Notify investor
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-investor`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dealId })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to notify investor');
      }
      
      toast.success('Deal analysis published successfully');
      navigate(`/analyst`);
    } catch (err) {
      console.error('Publish error:', err);
      toast.error('Failed to publish deal analysis');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ dealId })
        }
      );

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'deal-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Report generated successfully');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardCheck className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Review & Publish</h1>
        </div>
        <p className="text-gray-600">Review all analysis details before publishing the final report.</p>
      </div>

      <div className="space-y-8">
        {/* Analysis Status */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Status</h2>
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  section.status === 'complete' ? 'bg-green-50' : 'bg-yellow-50'
                }`}
              >
                <div>
                  <p className={`font-medium ${
                    section.status === 'complete' ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {section.name}
                  </p>
                  <p className="text-sm text-gray-500">Last updated: {section.lastUpdated}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  section.status === 'complete' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {section.status.charAt(0).toUpperCase() + section.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Final Notes */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Final Notes</h2>
          <textarea
            value={finalNotes}
            onChange={(e) => setFinalNotes(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any final notes, recommendations, or important observations..."
          />
        </section>

        {/* Publication Warning */}
        {!allSectionsComplete && (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <p className="text-yellow-700">
              All sections must be completed before publishing the final report.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleGenerateReport}
            disabled={!allSectionsComplete || isGeneratingReport}
            className={`flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg transition-colors ${
              allSectionsComplete && !isGeneratingReport
                ? 'text-gray-700 hover:bg-gray-50'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            <Download className="h-5 w-5" />
            {isGeneratingReport ? 'Generating...' : 'Download Report'}
          </button>
          
          <button
            onClick={handlePublish}
            disabled={!allSectionsComplete || isPublishing}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
              allSectionsComplete && !isPublishing
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="h-5 w-5" />
            {isPublishing ? 'Publishing...' : 'Publish Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewPublish;