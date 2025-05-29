import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, TrendingUp, ShoppingCart } from 'lucide-react';
import { api } from '../../lib/api';
import { creditPacks } from '../../stripe-config';
import toast from 'react-hot-toast';

const CreditManager: React.FC = () => {
  const navigate = useNavigate();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCredits = async () => {
      try {
        const wallet = await api.credits.get();
        setCredits(wallet.credits);
      } catch (error) {
        console.error('Error loading credits:', error);
        toast.error('Failed to load credit balance');
      } finally {
        setLoading(false);
      }
    };

    loadCredits();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Credit Management</h2>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-600">Available Credits</p>
              <p className="text-3xl font-bold text-gray-900">{credits}</p>
            </div>
            <button
              onClick={() => navigate('/credits/purchase')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              Buy Credits
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Packs</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {creditPacks.map((pack) => (
                  <div
                    key={pack.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{pack.name}</h4>
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{pack.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        ${pack.price}
                      </span>
                      {pack.description.includes('Save') && (
                        <span className="flex items-center text-sm text-green-600">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Best Value
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Usage</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-3">
                  <li className="flex items-center justify-between">
                    <span className="text-gray-600">Basic Report</span>
                    <span className="font-medium text-gray-900">1 Credit</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-600">Standard Report</span>
                    <span className="font-medium text-gray-900">2 Credits</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-600">Premium Report</span>
                    <span className="font-medium text-gray-900">3 Credits</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditManager;