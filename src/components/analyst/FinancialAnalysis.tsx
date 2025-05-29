import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calculator, TrendingUp } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface FinancialData {
  currentRent: string;
  stabilizedRent: string;
  vacancy: string;
  opex: string;
  noi: string;
  capRate?: string;
  grm?: string;
}

const FinancialAnalysis: React.FC = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData>({
    currentRent: '',
    stabilizedRent: '',
    vacancy: '',
    opex: '',
    noi: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFinancialData(prev => ({ ...prev, [name]: value }));
  };

  const calculateMetrics = async () => {
    if (!dealId) return financialData;

    try {
      // Get the sourcing section to fetch listing price
      const sourcingSection = await api.sections.get(dealId, 'sourcing');
      const listingPrice = sourcingSection?.data?.listingPrice;

      if (!listingPrice) {
        return financialData;
      }

      const noi = parseFloat(financialData.noi.replace(/[^0-9.]/g, '')) || 0;
      const currentRent = parseFloat(financialData.currentRent.replace(/[^0-9.]/g, '')) || 0;
      const price = parseFloat(String(listingPrice).replace(/[^0-9.]/g, '')) || 0;

      // Calculate cap rate: (NOI / Price) * 100
      const capRate = price > 0 ? ((noi / price) * 100).toFixed(2) : '0';

      // Calculate Gross Rent Multiplier: Price / (Annual Rent)
      const annualRent = currentRent * 12;
      const grm = annualRent > 0 ? (price / annualRent).toFixed(2) : '0';

      return {
        ...financialData,
        capRate,
        grm
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return financialData;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealId) return;

    setIsLoading(true);
    try {
      // Calculate financial metrics
      const enrichedData = await calculateMetrics();

      // Get existing section or create new one
      const section = await api.sections.get(dealId, 'financial');
      
      if (section) {
        await api.sections.update(section.id, {
          data: enrichedData,
          completed: true
        });
      } else {
        await api.sections.create(dealId, 'financial', enrichedData);
      }

      // Update deal progress to 30%
      await api.deals.updateProgress(dealId, 30);
      
      toast.success('Financial analysis saved successfully');
      // Navigate to next section
      navigate(`/analyst/deal/${dealId}/rehab`);
    } catch (error) {
      console.error('Error saving financial analysis:', error);
      toast.error('Failed to save financial analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const runSensitivity = () => {
    toast.success('Running sensitivity analysis...');
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Financial Analysis</h2>
        <p className="text-gray-600">Enter financial details and run sensitivity analysis.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="currentRent" className="block text-sm font-medium text-gray-700 mb-2">
              Current Monthly Rent
            </label>
            <input
              type="text"
              id="currentRent"
              name="currentRent"
              value={financialData.currentRent}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="5,000"
              required
            />
          </div>

          <div>
            <label htmlFor="stabilizedRent" className="block text-sm font-medium text-gray-700 mb-2">
              Stabilized Monthly Rent
            </label>
            <input
              type="text"
              id="stabilizedRent"
              name="stabilizedRent"
              value={financialData.stabilizedRent}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="6,000"
              required
            />
          </div>

          <div>
            <label htmlFor="vacancy" className="block text-sm font-medium text-gray-700 mb-2">
              Vacancy Rate (%)
            </label>
            <input
              type="text"
              id="vacancy"
              name="vacancy"
              value={financialData.vacancy}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="5"
              required
            />
          </div>

          <div>
            <label htmlFor="opex" className="block text-sm font-medium text-gray-700 mb-2">
              Operating Expenses
            </label>
            <input
              type="text"
              id="opex"
              name="opex"
              value={financialData.opex}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="2,000"
              required
            />
          </div>

          <div>
            <label htmlFor="noi" className="block text-sm font-medium text-gray-700 mb-2">
              Net Operating Income
            </label>
            <input
              type="text"
              id="noi"
              name="noi"
              value={financialData.noi}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="48,000"
              required
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={runSensitivity}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Calculator className="h-5 w-5" />
            Run Sensitivity
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrendingUp className="h-5 w-5" />
            {isLoading ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FinancialAnalysis;