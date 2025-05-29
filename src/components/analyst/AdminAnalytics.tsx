import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, TrendingUp, Users, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface AnalyticsData {
  dailyActiveUsers: number;
  totalDeals: number;
  avgDealProgress: number;
  conversionRate: number;
  revenueMetrics: {
    mrr: number;
    arr: number;
    growth: number;
  };
}

const AdminAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    dailyActiveUsers: 0,
    totalDeals: 0,
    avgDealProgress: 0,
    conversionRate: 0,
    revenueMetrics: {
      mrr: 0,
      arr: 0,
      growth: 0
    }
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      const [usersData, dealsData, revenueData] = await Promise.all([
        fetchUserAnalytics(),
        fetchDealAnalytics(),
        fetchRevenueAnalytics()
      ]);

      setAnalyticsData({
        ...usersData,
        ...dealsData,
        revenueMetrics: revenueData
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAnalytics = async () => {
    // First try to get the latest daily active users count
    const { data: dailyData, error: dailyError } = await supabase
      .from('analytics_daily_active_users')
      .select('*')
      .order('day', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dailyError) throw dailyError;

    // If no daily data exists yet, calculate from events table
    const activeUsers = dailyData?.active_users || 0;
    
    // Get total users for conversion rate calculation
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Calculate conversion rate (active users / total users)
    const conversionRate = totalUsers ? (activeUsers / totalUsers) * 100 : 0;

    return {
      dailyActiveUsers: activeUsers,
      conversionRate: Math.round(conversionRate * 100) / 100 // Round to 2 decimal places
    };
  };

  const fetchDealAnalytics = async () => {
    const { data, error } = await supabase
      .from('deals')
      .select('id, progress')
      .is('deleted_at', null);

    if (error) throw error;
    
    const totalDeals = data?.length || 0;
    const avgProgress = totalDeals > 0 
      ? Math.round(data.reduce((sum, deal) => sum + (deal.progress || 0), 0) / totalDeals)
      : 0;

    return {
      totalDeals,
      avgDealProgress: avgProgress
    };
  };

  const fetchRevenueAnalytics = async () => {
    const { data, error } = await supabase
      .from('stripe_subscriptions')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    // Calculate MRR and ARR
    const mrr = data?.reduce((sum, sub) => sum + (sub.amount || 0), 0) || 0;
    
    return {
      mrr,
      arr: mrr * 12,
      growth: 0 // Calculate growth rate from historical data
    };
  };

  const exportData = async (format: 'csv' | 'pdf') => {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      if (format === 'csv' && data) {
        // Generate CSV
        const csvContent = [
          ['Timestamp', 'Event Type', 'Event Name', 'User ID'].join(','),
          ...data.map(event => [
            event.timestamp,
            event.event_type,
            event.event_name,
            event.user_id
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast.success(`Exported to ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export to ${format.toUpperCase()}`);
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
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-md py-2 pl-2 pr-8"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

          <button
            onClick={() => exportData('csv')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">Active Users</h3>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analyticsData.dailyActiveUsers}</p>
          <p className="text-sm text-gray-500">Daily active users</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">Total Deals</h3>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analyticsData.totalDeals}</p>
          <p className="text-sm text-gray-500">Active deals in pipeline</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">Avg Progress</h3>
            <Clock className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analyticsData.avgDealProgress}%</p>
          <p className="text-sm text-gray-500">Average deal completion</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">MRR</h3>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${analyticsData.revenueMetrics.mrr.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Monthly recurring revenue</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;