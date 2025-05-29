import React from 'react';
import { useParams } from 'react-router-dom';

const FinancingEquity: React.FC = () => {
  const { dealId } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Financing & Equity Analysis</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          {/* Financing Structure Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Financing Structure</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Debt Financing</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loan Amount</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter loan amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter interest rate"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Equity Structure</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Required Equity</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter required equity"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Investor Split (%)</label>
                    <input
                      type="number"
                      step="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter investor split percentage"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Returns Analysis Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Returns Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">ROI</h3>
                <p className="text-2xl font-bold text-green-600">24.5%</p>
                <p className="text-sm text-gray-600">Projected Return on Investment</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">IRR</h3>
                <p className="text-2xl font-bold text-green-600">18.2%</p>
                <p className="text-sm text-gray-600">Internal Rate of Return</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Cash Multiple</h3>
                <p className="text-2xl font-bold text-green-600">1.8x</p>
                <p className="text-sm text-gray-600">Expected Cash Multiple</p>
              </div>
            </div>
          </section>

          {/* Notes Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Additional Notes</h2>
            <textarea
              className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter any additional notes about financing and equity structure..."
            />
          </section>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
            Save Draft
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Submit Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinancingEquity;