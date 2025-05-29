import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Plus, Search, CreditCard, Clock, CheckCircle, 
  FileText, TrendingUp, Trash2, AlertCircle, Filter, ShoppingCart,
  Calculator, UserCircle
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { Deal } from '../../lib/types';

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed';
type SortOption = 'date' | 'status' | 'progress';

const InvestorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [credits, setCredits] = useState(0);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [deletingDeal, setDeletingDeal] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [dealsData, userCredits] = await Promise.all([
          api.deals.list(),
          api.credits.get()
        ]);

        setDeals(dealsData);
        setCredits(userCredits.credits);
      } catch (error) {
        console.error('Error loading dashboard:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingDeal(dealId);
      await api.deals.delete(dealId);
      
      // Immediately update the UI by filtering out the deleted deal
      setDeals(currentDeals => currentDeals.filter(d => d.id !== dealId));
      
      toast.success('Deal deleted successfully');
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal');
    } finally {
      setDeletingDeal(null);
    }
  };

  const filteredAndSortedDeals = deals
    .filter(deal => {
      const matchesSearch = deal.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || deal.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'status':
          return a.status.localeCompare(b.status);
        case 'progress':
          return b.progress - a.progress;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const getTierBadge = (deal: Deal) => {
    const section = deal.sections?.find(s => s.type === 'financial');
    if (!section) return null;

    let tier = 'basic';
    if (section.data.premium) tier = 'premium';
    else if (section.data.standard) tier = 'standard';

    return (
      <span className={`
        px-2 py-1 rounded-full text-xs font-medium
        ${tier === 'premium' ? 'bg-purple-100 text-purple-700' : 
          tier === 'standard' ? 'bg-blue-100 text-blue-700' : 
          'bg-gray-100 text-gray-700'}
      `}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
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
                <CreditCard className="h-5 w-5 text-blue-600" />
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

          <button
            onClick={() => navigate('/credits/purchase')}
            className="bg-white p-6 rounded-lg shadow-sm hover:ring-2 hover:ring-blue-500 transition-all"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Available Credits</h3>
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{credits}</p>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search deals by address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                    className="border border-gray-300 rounded-md py-2 pl-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="border border-gray-300 rounded-md py-2 pl-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date">Sort by Date</option>
                  <option value="status">Sort by Status</option>
                  <option value="progress">Sort by Progress</option>
                </select>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredAndSortedDeals.length > 0 ? (
              filteredAndSortedDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="cursor-pointer" onClick={() => navigate(`/investor/deal/${deal.id}/status`)}>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900">{deal.address}</h3>
                        {getTierBadge(deal)}
                      </div>
                      <p className="text-sm text-gray-500">
                        Submitted {format(new Date(deal.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {deal.status === 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/investor/deal/${deal.id}/view`);
                          }}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Report"
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
                        title="Delete Deal"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <div className={`flex items-center gap-2 ${
                        deal.status === 'completed' ? 'text-green-600' :
                        deal.status === 'in_progress' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
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
                {searchTerm || filterStatus !== 'all' ? (
                  <div>
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search or filters
                    </p>
                  </div>
                ) : (
                  <div>
                    <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No deals yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by submitting your first deal
                    </p>
                    <button
                      onClick={() => navigate('/investor/new-deal')}
                      className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      New Deal
                    </button>
                  </div>
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