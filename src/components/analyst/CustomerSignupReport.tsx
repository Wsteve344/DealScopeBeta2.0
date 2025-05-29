import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ArrowUpDown, Calendar, Users, UserCheck, UserX } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

interface CustomerSignup {
  id: string;
  email: string;
  created_at: string;
  phone_number: string | null;
  status: string;
  metadata: {
    name?: string;
  };
}

interface SignupSummary {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  peakDate: string;
  peakCount: number;
}

const CustomerSignupReport: React.FC = () => {
  const navigate = useNavigate();
  const [signups, setSignups] = useState<CustomerSignup[]>([]);
  const [summary, setSummary] = useState<SignupSummary>({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    peakDate: '',
    peakCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof CustomerSignup>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [mostRecentSignup, setMostRecentSignup] = useState<CustomerSignup | null>(null);

  useEffect(() => {
    loadSignups();
  }, []);

  const loadSignups = async () => {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      // Get signups from last 30 days
      const { data: recentSignups, error: recentError } = await supabase
        .from('users')
        .select('id, email, created_at, phone_number, metadata')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });

      if (recentError) throw recentError;

      if (!recentSignups?.length) {
        // If no recent signups, get most recent signup before 30 days ago
        const { data: lastSignup, error: lastError } = await supabase
          .from('users')
          .select('id, email, created_at, phone_number, metadata')
          .lt('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastError && lastError.code !== 'PGRST116') throw lastError;
        setMostRecentSignup(lastSignup);
      } else {
        setSignups(recentSignups);
        
        // Calculate summary
        const signupsByDate = recentSignups.reduce((acc: Record<string, number>, signup) => {
          const date = format(new Date(signup.created_at), 'yyyy-MM-dd');
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const peakDate = Object.entries(signupsByDate).reduce((a, b) => 
          b[1] > (a[1] || 0) ? b : a
        );

        setSummary({
          total: recentSignups.length,
          active: recentSignups.filter(s => !s.metadata?.suspended).length,
          pending: recentSignups.filter(s => s.metadata?.pending).length,
          suspended: recentSignups.filter(s => s.metadata?.suspended).length,
          peakDate: peakDate[0],
          peakCount: peakDate[1]
        });
      }
    } catch (error) {
      console.error('Error loading signups:', error);
      toast.error('Failed to load signup data');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof CustomerSignup) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedSignups = [...signups].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    const comparison = typeof aValue === 'string' && typeof bValue === 'string'
      ? aValue.localeCompare(bValue)
      : 0;
      
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const exportReport = () => {
    try {
      const csvContent = [
        ['Customer ID', 'Full Name', 'Email', 'Phone', 'Registration Date', 'Status'].join(','),
        ...sortedSignups.map(signup => [
          signup.id,
          signup.metadata?.name || 'N/A',
          signup.email,
          signup.phone_number || 'N/A',
          format(new Date(signup.created_at), 'yyyy-MM-dd HH:mm:ss'),
          signup.metadata?.suspended ? 'Suspended' : signup.metadata?.pending ? 'Pending' : 'Active'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customer-signups-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
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
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Customer Sign-up Report</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {format(subDays(new Date(), 30), 'MMM d, yyyy')} - {format(new Date(), 'MMM d, yyyy')}
          </span>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            Export Report
          </button>
        </div>
      </div>

      {signups.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Total Sign-ups</h3>
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Active Accounts</h3>
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {Math.round((summary.active / summary.total) * 100)}%
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Pending Accounts</h3>
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {Math.round((summary.pending / summary.total) * 100)}%
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Peak Sign-ups</h3>
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary.peakCount}</p>
              <p className="text-sm text-gray-600">on {format(new Date(summary.peakDate), 'MMM d')}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('metadata')}
                    >
                      <div className="flex items-center gap-2">
                        Full Name
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-2">
                        Email
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-2">
                        Registration Date
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedSignups.map((signup) => (
                    <tr key={signup.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {signup.metadata?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{signup.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(signup.created_at), 'MMM d, yyyy HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {signup.phone_number || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          signup.metadata?.suspended
                            ? 'bg-red-100 text-red-800'
                            : signup.metadata?.pending
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {signup.metadata?.suspended
                            ? 'Suspended'
                            : signup.metadata?.pending
                            ? 'Pending'
                            : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{signup.id}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No new registrations in the past 30 days
          </h3>
          {mostRecentSignup && (
            <div className="mt-4 text-gray-600">
              <p>Most recent registration:</p>
              <p className="font-medium text-gray-900">
                {mostRecentSignup.metadata?.name || mostRecentSignup.email}
              </p>
              <p className="text-sm">
                {format(new Date(mostRecentSignup.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSignupReport;