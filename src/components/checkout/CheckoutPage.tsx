import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Shield, Lock, CheckCircle, Coins } from 'lucide-react';
import { subscriptionPlans, creditPacks } from '../../stripe-config';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(subscriptionPlans[1]); // Pro plan by default
  const [selectedAddOn, setSelectedAddOn] = useState<typeof creditPacks[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please log in to continue');
      return;
    }

    setIsProcessing(true);
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
            priceId: selectedPlan.priceId,
            addOnPriceId: selectedAddOn?.priceId,
            customerId: user.id
          })
        }
      );

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Order</h1>
          <p className="text-gray-600 mt-2">You're just one step away from expert deal analysis</p>
        </div>

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

        {/* Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{selectedPlan.name} Plan</h3>
                  <p className="text-sm text-gray-600">{selectedPlan.description.split('\n')[0]}</p>
                </div>
                <span className="font-semibold">${selectedPlan.price}/mo</span>
              </div>

              {selectedAddOn && (
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedAddOn.name}</h3>
                    <p className="text-sm text-gray-600">{selectedAddOn.description}</p>
                  </div>
                  <span className="font-semibold">${selectedAddOn.price}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Today</span>
                <span>${selectedPlan.price + (selectedAddOn?.price || 0)}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                You will be charged monthly for the subscription plan
              </p>
            </div>
          </div>

          {/* Secure Checkout Button */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <Shield className="h-5 w-5" />
                <span className="text-sm font-medium">Secure Checkout</span>
              </div>
              
              <p className="text-gray-600 text-sm mb-6">
                Click the button below to complete your purchase securely through Stripe.
              </p>

              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  'Processing...'
                ) : (
                  <>
                    Complete Purchase
                    <CheckCircle className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-900 mb-4">What's included:</h3>
              <ul className="space-y-3">
                {selectedPlan.description.split('\n').map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500">
              <Shield className="h-5 w-5" />
              <span>256-bit encryption</span>
              <span>•</span>
              <span>SSL Secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;