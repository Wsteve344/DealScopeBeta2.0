import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, UserPlus, FileText, MessageSquare, Clock, CheckCircle, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import type { Deal } from '../../lib/types';
import toast from 'react-hot-toast';

const DealInformationHub: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<string | null>(null);

  useEffect(() => {
    const loadDeals = async () => {
      try {
        const dealsData = await api.deals.list();
        setDeals(dealsData);
        setError(null);
      } catch (error) {
        console.error('Error loading deals:', error);
        setError('Failed to load deals. Please try again.');
        toast.error('Failed to load deals');
      } finally {
        setLoading(false);
      }
    };

    loadDeals();
  }, []);

  const filteredDeals = deals.filter(deal => 
    deal.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deal.users?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      return;
    }

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
          <p className="mt-4 text-gray-600">Loading deals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-4">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Deals</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search deals by address or investor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredDeals.length > 0 ? (
          filteredDeals.map((deal) => (
            <div
              key={deal.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="cursor-pointer" onClick={() => navigate(`/analyst/deal/${deal.id}/overview`)}>
                  <h3 className="text-lg font-semibold text-gray-900">{deal.address}</h3>
                  <p className="text-sm text-gray-600">
                    Submitted by {deal.users?.email || 'Unknown Investor'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {deal.messages?.[0]?.count > 0 && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <MessageSquare className="h-4 w-4" />
                      {deal.messages[0].count} messages
                    </span>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Implement invite functionality
                        toast.success('Invite functionality coming soon');
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <UserPlus className="h-5 w-5" />
                    </button>
                    {deal.progress === 100 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Implement PDF generation
                          toast.success('PDF generation coming soon');
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <FileText className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDeal(deal.id);
                      }}
                      disabled={deletingDeal === deal.id}
                      className={`p-2 text-gray-600 hover:text-red-600 transition-colors ${
                        deletingDeal === deal.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(deal.status)}
                      <span className="text-sm font-medium capitalize text-gray-700">
                        {deal.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
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

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    Submitted {new Date(deal.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No deals found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'New deals will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealInformationHub;