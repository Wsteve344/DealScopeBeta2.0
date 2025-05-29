import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, FileText, MessageSquare } from 'lucide-react';

const ThankYou: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to DealScope!
            </h1>
            <p className="text-lg text-gray-600">
              Your account has been successfully created and your subscription is active.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Getting Started Guide</h3>
              <p className="text-gray-600 text-sm mb-4">
                We've sent you a comprehensive guide to help you get started with DealScope.
              </p>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Download Guide
              </button>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Connect with Your Analyst</h3>
              <p className="text-gray-600 text-sm mb-4">
                Schedule a welcome call with your dedicated deal analyst.
              </p>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Schedule Call
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/investor/dashboard')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="h-5 w-5" />
            </button>

            <button
              onClick={() => navigate('/investor/new-deal')}
              className="w-full bg-gray-100 text-gray-900 py-3 px-6 rounded-md hover:bg-gray-200 transition-colors"
            >
              Submit Your First Deal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;