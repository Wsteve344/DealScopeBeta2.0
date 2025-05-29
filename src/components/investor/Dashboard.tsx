import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Clock, CheckCircle, CreditCard, Search, MessageSquare, FileText, TrendingUp, ShoppingCart, Calculator, Trash2, Coins, UserCircle } from 'lucide-react';
import { api } from '../../lib/api';
import type { Deal } from '../../lib/types';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-600';
    case 'in_progress':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

const InvestorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [credits, setCredits] = useState(3);
  const [deletingDeal, setDeletingDeal] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Wait for authentication to be determined
        if (loading && !isAuthenticated) {
          return;
        }

        // Only attempt to load data if we have a user
        if (user) {
          const [dealsData, userCredits] = await Promise.all([
            api.deals.list(),
            api.credits.get().catch(() => ({ credits: 0 }))
          ]);
          setDeals(dealsData);
          setCredits(userCredits.credits);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
        if (isAuthenticated && user) {
          toast.error('Failed to load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [isAuthenticated, user, loading]);

  // Filter deals based on search term
  const filteredDeals = deals.filter(deal => 
    deal.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDealClick = (dealId: string) => {
    navigate(`/investor/deal/${dealId}/status`);
  };

  const handleDeleteDeal = async (dealId: string) => {
    try {
      setDeletingDeal(dealId);
      await api.deals.delete(dealId);
      setDeals(deals.filter(d => d.id !== dealId));
      toast.success('Deal deleted successfully');
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
    } finally {
      setDeletingDeal(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Property Investor Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/credits/purchase')}
                className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Coins className="h-5 w-5 text-blue-600" />
                <span className="text-blue-600 font-medium">{credits} Credits</span>
              </button>
              <button
                onClick={() => navigate('/investor/analyzer')}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                title="Deal Analyzer"
              >
                <Calculator className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                title="Profile"
              >
                <UserCircle className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/investor/new-deal')}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                New Deal
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Active Deals</h3>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {deals.filter(d => d.status !== 'completed').length}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Completed</h3>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {deals.filter(d => d.status === 'completed').length}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Credits</h3>
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{credits}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">My Deals</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="cursor-pointer" onClick={() => handleDealClick(deal.id)}>
                      <h3 className="text-lg font-medium text-gray-900">{deal.address}</h3>
                      <p className="text-sm text-gray-500">
                        Submitted {new Date(deal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {deal.messages?.[0]?.count || 0}
                        </span>
                      </div>
                      {deal.status === 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle PDF download
                          }}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <FileText className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteDeal(deal.id)}
                        disabled={deletingDeal === deal.id}
                        className={`text-gray-400 hover:text-red-600 transition-colors ${
                          deletingDeal === deal.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <div className={`flex items-center gap-2 ${getStatusColor(deal.status)}`}>
                        {deal.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                        <span className="text-sm font-medium capitalize">
                          {deal.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Analysis Progress</span>
                      <span>{deal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${deal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No deals found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding a new deal'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => navigate('/investor/new-deal')}
                    className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    New Deal
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InvestorDashboard;