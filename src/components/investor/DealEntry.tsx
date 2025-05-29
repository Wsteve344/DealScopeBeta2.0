import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, AlertCircle, ArrowLeft, Upload, FileText, CreditCard, Coins } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AnalysisDepth {
  id: 'basic' | 'standard' | 'premium';
  name: string;
  description: string;
  creditCost: number;
  features: string[];
  color: string;
}

const analysisDepths: AnalysisDepth[] = [
  {
    id: 'basic',
    name: 'Basic Analysis',
    description: 'Essential property evaluation',
    creditCost: 1,
    features: [
      'Property valuation',
      'Basic financial metrics',
      'Location analysis',
      'Standard report'
    ],
    color: 'bg-gray-100 text-gray-900'
  },
  {
    id: 'standard',
    name: 'Standard Analysis',
    description: 'Comprehensive property analysis',
    creditCost: 2,
    features: [
      'All Basic features',
      'Detailed market research',
      'Renovation potential',
      'Comparative market analysis',
      'Investment projections'
    ],
    color: 'bg-blue-100 text-blue-900'
  },
  {
    id: 'premium',
    name: 'Premium Analysis',
    description: 'In-depth investment analysis',
    creditCost: 3,
    features: [
      'All Standard features',
      'Advanced financial modeling',
      'Risk assessment',
      'Growth potential analysis',
      'Investment strategy consultation',
      'Priority processing'
    ],
    color: 'bg-purple-100 text-purple-900'
  }
];

const DealEntry: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [address, setAddress] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [credits, setCredits] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedDepth, setSelectedDepth] = useState<AnalysisDepth>(analysisDepths[0]);

  useEffect(() => {
    const loadCredits = async () => {
      if (!user) return;
      try {
        const wallet = await api.credits.get();
        setCredits(wallet.credits);
      } catch (error) {
        console.error('Error loading credits:', error);
        toast.error('Failed to load credit balance');
      }
    };

    loadCredits();
  }, [user]);

  const validateAddress = async (address: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      isValid: true,
      lat: 39.6418,
      lng: -77.7200,
      formattedAddress: address
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    setError('');

    try {
      if (credits < selectedDepth.creditCost) {
        throw new Error(`You need ${selectedDepth.creditCost} credits for a ${selectedDepth.name}`);
      }

      const validationResult = await validateAddress(address);
      
      if (validationResult.isValid) {
        // Create the deal with analysis depth
        const deal = await api.deals.create(validationResult.formattedAddress, selectedDepth.id);

        // Upload any attached files
        if (files.length > 0) {
          await Promise.all(
            files.map(file => api.documents.upload(deal.id, file))
          );
        }

        toast.success('Deal submitted successfully');
        navigate('/investor/dashboard');
      } else {
        setError('Please enter a valid property address');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      toast.error(err.message || 'Failed to create deal');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/investor/dashboard')}
          className="mb-8 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Coins className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Available Credits</h3>
                <p className="text-sm text-gray-600">Use credits to submit deals for analysis</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{credits}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center">
              <Building2 className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Submit a New Deal
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Select analysis depth and enter property details
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                Credits available: {credits}
              </span>
            </div>
          </div>

          {/* Analysis Depth Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Analysis Depth</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysisDepths.map((depth) => (
                <div
                  key={depth.id}
                  onClick={() => setSelectedDepth(depth)}
                  className={cn(
                    "p-4 rounded-lg border-2 cursor-pointer transition-all",
                    selectedDepth.id === depth.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{depth.name}</h4>
                    <Badge className={depth.color}>
                      {depth.creditCost} {depth.creditCost === 1 ? 'Credit' : 'Credits'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{depth.description}</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {depth.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Property Address
              </label>
              <div className="relative">
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter complete property address"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Documents (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="files"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="files"
                        name="files"
                        type="file"
                        multiple
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, XLS up to 10MB each
                  </p>
                </div>
              </div>
              {files.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-sm font-medium text-gray-700">Selected files:</h4>
                  <ul className="mt-1 space-y-1">
                    {files.map((file, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-500">
                        <FileText className="h-4 w-4 mr-2" />
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isValidating || !address.trim() || credits < selectedDepth.creditCost}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  isValidating || !address.trim() || credits < selectedDepth.creditCost
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isValidating ? 'Submitting...' : credits < selectedDepth.creditCost ? 'Insufficient Credits' : 'Submit Deal'}
              </button>
            </div>

            {credits < selectedDepth.creditCost && (
              <p className="text-sm text-center text-red-600">
                You need {selectedDepth.creditCost} credits for this analysis depth.
                <button
                  type="button"
                  onClick={() => navigate('/credits/purchase')}
                  className="ml-2 text-blue-600 hover:text-blue-500"
                >
                  Purchase Credits
                </button>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default DealEntry;