import React, { useState } from 'react';
import { Calculator, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AnalyzerInputs {
  purchasePrice: string;
  monthlyRent: string;
  propertyTaxes: string;
  insurance: string;
  maintenance: string;
  utilities: string;
  vacancy: string;
  managementFee: string;
}

const DealAnalyzer: React.FC = () => {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState<AnalyzerInputs>({
    purchasePrice: '',
    monthlyRent: '',
    propertyTaxes: '',
    insurance: '',
    maintenance: '',
    utilities: '',
    vacancy: '5',
    managementFee: '8'
  });

  const [results, setResults] = useState<{
    cashflow: number;
    noi: number;
    capRate: number;
    roi: number;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateResults = () => {
    // Convert string inputs to numbers
    const purchasePrice = parseFloat(inputs.purchasePrice) || 0;
    const monthlyRent = parseFloat(inputs.monthlyRent) || 0;
    const annualRent = monthlyRent * 12;
    
    // Calculate expenses
    const propertyTaxes = parseFloat(inputs.propertyTaxes) || 0;
    const insurance = parseFloat(inputs.insurance) || 0;
    const maintenance = parseFloat(inputs.maintenance) || 0;
    const utilities = parseFloat(inputs.utilities) || 0;
    const vacancy = (parseFloat(inputs.vacancy) / 100) * annualRent;
    const managementFee = (parseFloat(inputs.managementFee) / 100) * annualRent;

    // Calculate key metrics
    const totalExpenses = propertyTaxes + insurance + maintenance + utilities + vacancy + managementFee;
    const noi = annualRent - totalExpenses;
    const monthlyCashflow = (noi / 12);
    const capRate = (noi / purchasePrice) * 100;
    const roi = (noi / purchasePrice) * 100;

    setResults({
      cashflow: monthlyCashflow,
      noi,
      capRate,
      roi
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateResults();
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

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <Calculator className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Deal Analyzer</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="purchasePrice"
                    name="purchasePrice"
                    value={inputs.purchasePrice}
                    onChange={handleInputChange}
                    className="pl-8 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="250000"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="monthlyRent" className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rent
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="monthlyRent"
                    name="monthlyRent"
                    value={inputs.monthlyRent}
                    onChange={handleInputChange}
                    className="pl-8 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2000"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="propertyTaxes" className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Property Taxes
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="propertyTaxes"
                    name="propertyTaxes"
                    value={inputs.propertyTaxes}
                    onChange={handleInputChange}
                    className="pl-8 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="3000"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="insurance" className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Insurance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="insurance"
                    name="insurance"
                    value={inputs.insurance}
                    onChange={handleInputChange}
                    className="pl-8 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1200"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="maintenance" className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Maintenance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="maintenance"
                    name="maintenance"
                    value={inputs.maintenance}
                    onChange={handleInputChange}
                    className="pl-8 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2400"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="utilities" className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Utilities
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="utilities"
                    name="utilities"
                    value={inputs.utilities}
                    onChange={handleInputChange}
                    className="pl-8 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="vacancy" className="block text-sm font-medium text-gray-700 mb-2">
                  Vacancy Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="vacancy"
                    name="vacancy"
                    value={inputs.vacancy}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="5"
                    min="0"
                    max="100"
                    required
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>

              <div>
                <label htmlFor="managementFee" className="block text-sm font-medium text-gray-700 mb-2">
                  Management Fee (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="managementFee"
                    name="managementFee"
                    value={inputs.managementFee}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="8"
                    min="0"
                    max="100"
                    required
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Calculate
              </button>
            </div>
          </form>

          {results && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Analysis Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Monthly Cashflow</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    ${results.cashflow.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Net Operating Income</h3>
                  <p className="text-2xl font-bold text-green-600">
                    ${results.noi.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Cap Rate</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {results.capRate.toFixed(2)}%
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">ROI</h3>
                  <p className="text-2xl font-bold text-orange-600">
                    {results.roi.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealAnalyzer;