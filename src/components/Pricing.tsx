import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionPlans, creditPacks } from '../stripe-config';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handlePlanSelection = (priceId: string) => {
    if (!isAuthenticated) {
      // Store selected plan in URL params for post-signup redirect
      navigate('/signup', { state: { redirect: `/checkout?plan=${priceId}` } });
    } else {
      navigate(`/checkout?plan=${priceId}`);
    }
  };

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Transparent Pricing</h2>
          <p className="text-lg text-gray-600">
            Choose the plan that fits your investment strategy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {subscriptionPlans.map((tier) => (
            <div
              key={tier.priceId}
              className={`bg-white rounded-xl shadow-sm p-8 relative ${
                tier.name === 'Pro' ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {tier.name === 'Pro' && (
                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Popular
                </span>
              )}
              
              <h3 className="text-xl font-bold text-gray-900 mb-4">{tier.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">${tier.price}</span>
                <span className="text-gray-500">/month</span>
              </div>
              
              <div className="space-y-4 mb-8">
                {tier.description.split('\n').map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => handlePlanSelection(tier.priceId)}
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors ${
                  tier.name === 'Pro'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Additional Credit Packs
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPacks.map((pack) => (
              <div
                key={pack.priceId}
                className="bg-white rounded-lg shadow-sm p-6 text-center"
              >
                <h4 className="font-semibold text-gray-900 mb-2">{pack.name}</h4>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  ${pack.price}
                </p>
                <p className="text-blue-600 font-medium mb-4">
                  {pack.description}
                </p>
                <button
                  onClick={() => handlePlanSelection(pack.priceId)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Purchase
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;