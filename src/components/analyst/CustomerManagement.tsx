import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, UserCog, CreditCard, Trash2, RefreshCw, Download, 
  AlertCircle, CheckCircle, History, Plus, Minus, FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  email: string;
  created_at: string;
  subscription_status?: string;
  credits: number;
  phone_number?: string;
}

const CustomerManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof Customer>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNotes, setCreditNotes] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      // Get all users except analysts
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*, credit_wallets(credits)')
        .eq('role', 'investor')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get subscription statuses
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('stripe_subscriptions')
        .select('user_id, status');

      if (subscriptionsError) throw subscriptionsError;

      // Create a map of user_id to subscription status
      const subscriptionMap = subscriptionsData?.reduce((acc, sub) => {
        acc[sub.user_id] = sub.status;
        return acc;
      }, {} as Record<string, string>);

      // Combine the data
      const formattedCustomers = usersData?.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        subscription_status: subscriptionMap?.[user.id] || null,
        credits: user.credit_wallets?.[0]?.credits || 0,
        phone_number: user.phone_number
      }));

      setCustomers(formattedCustomers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const loadCreditHistory = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCreditHistory(data || []);
    } catch (error) {
      console.error('Error loading credit history:', error);
      toast.error('Failed to load credit history');
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.email.toLowerCase().includes(searchLower) ||
      customer.id.toLowerCase().includes(searchLower) ||
      (customer.phone_number && customer.phone_number.toLowerCase().includes(searchLower))
    );
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const handleSort = (field: keyof Customer) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
      toast.success('Password reset email sent');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to send password reset email');
    }
  };

  const handleCreditAdjustment = async () => {
    if (!selectedCustomer || !creditAmount) return;

    try {
      const amount = parseInt(creditAmount);
      const { error: walletError } = await supabase
        .from('credit_wallets')
        .upsert({
          user_id: selectedCustomer.id,
          credits: selectedCustomer.credits + amount
        });

      if (walletError) throw walletError;

      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: selectedCustomer.id,
          amount,
          type: amount > 0 ? 'purchase' : 'debit',
          notes: creditNotes,
          status: 'completed'
        });

      if (transactionError) throw transactionError;

      toast.success('Credits adjusted successfully');
      setShowCreditModal(false);
      setCreditAmount('');
      setCreditNotes('');
      loadCustomers();
      loadCreditHistory(selectedCustomer.id);
    } catch (error) {
      console.error('Error adjusting credits:', error);
      toast.error('Failed to adjust credits');
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedCustomer || deleteConfirmation !== selectedCustomer.email) return;

    try {
      // Call the Edge Function to delete the user and associated data
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: selectedCustomer.id })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user via Edge Function');
      }

      toast.success('Account deleted successfully');
      setShowDeleteModal(false);
      setDeleteConfirmation('');
      loadCustomers(); // Reload customers to reflect changes
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    }
  };

  const handleExportData = async (customerId: string) => {
    setIsExporting(true);
    try {
      const [
        { data: userData },
        { data: walletData },
        { data: transactionData }
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', customerId).single(),
        supabase.from('credit_wallets').select('*').eq('user_id', customerId).single(),
        supabase.from('credit_transactions').select('*').eq('user_id', customerId)
      ]);

      const exportData = {
        user: userData,
        wallet: walletData,
        transactions: transactionData,
        exported_at: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customer-data-${customerId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Management</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by email, ID, or phone number..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('email')}
                >
                  Email
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  Signup Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('credits')}
                >
                  Credits
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.email}</div>
                    {customer.phone_number && (
                      <div className="text-sm text-gray-500">{customer.phone_number}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      customer.subscription_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.subscription_status || 'None'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.credits}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          loadCreditHistory(customer.id);
                          setShowCreditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Manage Credits"
                      >
                        <CreditCard className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(customer.email)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Reset Password"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleExportData(customer.id)}
                        disabled={isExporting}
                        className="text-green-600 hover:text-green-900"
                        title="Export Data"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Account"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Management Modal */}
      {showCreditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Manage Credits - {selectedCustomer.email}
              </h3>
              <button
                onClick={() => setShowCreditModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">Current Balance</span>
                <span className="text-lg font-bold text-gray-900">{selectedCustomer.credits}</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adjustment Amount
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCreditAmount('-1')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <input
                      type="number"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter amount"
                    />
                    <button
                      type="button"
                      onClick={() => setCreditAmount('1')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={creditNotes}
                    onChange={(e) => setCreditNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Add notes about this adjustment"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-4">Credit History</h4>
              <div className="max-h-60 overflow-y-auto">
                {creditHistory.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                      </div>
                      {transaction.notes && (
                        <div className="text-sm text-gray-500">{transaction.notes}</div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreditModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreditAdjustment}
                disabled={!creditAmount}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Account
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              This action cannot be undone. Please type <strong>{selectedCustomer.email}</strong> to confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-6"
              placeholder="Type email to confirm"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== selectedCustomer.email}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;