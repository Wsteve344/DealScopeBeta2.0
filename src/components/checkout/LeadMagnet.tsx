import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const LeadMagnet: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real app, this would call an API to save the lead
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/signup');
      toast.success('Your free guide is on its way!');
    } catch (error) {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Free Guide: The Ultimate Real Estate Due Diligence Checklist
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Don't miss critical details in your next property deal. Get our comprehensive checklist used by top investors.
          </p>
          
          <div className="flex justify-center mb-12">
            <FileText className="h-24 w-24 text-blue-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">100+ Checkpoints</h3>
              <p className="text-gray-600 text-sm">Comprehensive property evaluation criteria</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Shield className="h-8 w-8 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Risk Assessment</h3>
              <p className="text-gray-600 text-sm">Identify potential issues early</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <FileText className="h-8 w-8 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Expert Tips</h3>
              <p className="text-gray-600 text-sm">Professional insights and guidance</p>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8">
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your email to get instant access
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors"
            >
              {isLoading ? (
                'Sending...'
              ) : (
                <>
                  Get Free Checklist
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <p className="mt-4 text-sm text-gray-500 text-center">
              No credit card required. Unsubscribe anytime.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeadMagnet;