import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Package, CheckCircle, Coins } from 'lucide-react';
import { creditPacks, subscriptionPlans } from '../../stripe-config';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

const CreditPurchase: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(0);

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

  const handlePurchase = async (priceId: string, mode: 'payment' | 'subscription') => {
    if (!user) {
      toast.error('Please log in to purchase credits');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId,
            mode,
            customerId: user.id
          })
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/profile')}
          className="mb-8 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Profile
        </button>

        {/* Credit Balance Display */}
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

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Purchase Credits</h1>
          <p className="text-lg text-gray-600">
            Choose a credit pack or subscription plan that fits your needs
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Credit Packs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPacks.map((pack) => (
              <div
                key={pack.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">{pack.name}</h3>
                <p className="text-gray-600 text-center mb-4">{pack.description}</p>
                <p className="text-3xl font-bold text-center text-gray-900 mb-6">
                  ${pack.price}
                </p>
                <button
                  onClick={() => handlePurchase(pack.priceId, 'payment')}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="h-5 w-5" />
                  {isLoading ? 'Processing...' : 'Purchase'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Subscription Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <h3 className="text-xl font-semibold text-center mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold text-center text-gray-900 mb-4">
                  ${plan.price}/mo
                </p>
                <div className="space-y-3 mb-6">
                  {plan.description.split('\n').map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handlePurchase(plan.priceId, 'subscription')}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="h-5 w-5" />
                  {isLoading ? 'Processing...' : 'Subscribe'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditPurchase;