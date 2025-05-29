import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Download, TrendingUp, CheckCircle, 
  AlertCircle, Calendar, BarChart as ChartIcon
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Submission {
  id: string;
  candidateName: string;
  submittedAt: string;
  status: 'pending' | 'in_progress' | 'completed';
  score?: number;
  evaluationNotes?: string;
  evaluatedBy?: string;
}

const AnalystDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [evaluationScore, setEvaluationScore] = useState('');
  const [evaluationNotes, setEvaluationNotes] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluationSubmit = async () => {
    if (!selectedSubmission) return;

    const score = parseInt(evaluationScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('Score must be between 0 and 100');
      return;
    }

    setIsEvaluating(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'completed',
          score,
          evaluation_notes: evaluationNotes,
          evaluated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      toast.success('Evaluation saved successfully');
      setSelectedSubmission(null);
      setEvaluationScore('');
      setEvaluationNotes('');
      loadSubmissions();
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast.error('Failed to save evaluation');
    } finally {
      setIsEvaluating(false);
    }
  };

  const exportData = async (format: 'csv' | 'pdf') => {
    try {
      const filteredData = filterSubmissions();
      
      if (format === 'csv') {
        const csvContent = [
          ['ID', 'Candidate', 'Date', 'Status', 'Score', 'Notes'].join(','),
          ...filteredData.map(s => [
            s.id,
            s.candidateName,
            s.submittedAt,
            s.status,
            s.score || '',
            `"${s.evaluationNotes || ''}"`
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `submissions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // For PDF, we'll use the generate-report endpoint
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ submissions: filteredData })
          }
        );

        if (!response.ok) throw new Error('Failed to generate PDF');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `submissions-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
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

  const filterSubmissions = () => {
    return submissions.filter(submission => {
      const matchesSearch = submission.candidateName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
      const matchesDate = dateFilter === 'all' || (() => {
        const date = new Date(submission.submittedAt);
        switch (dateFilter) {
          case 'today':
            return format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          case 'week':
            return date >= subDays(new Date(), 7);
          case 'month':
            return date >= subDays(new Date(), 30);
          default:
            return true;
        }
      })();

      const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;

      const matchesScore = scoreFilter === 'all' || (() => {
        if (!submission.score) return false;
        switch (scoreFilter) {
          case 'high':
            return submission.score >= 80;
          case 'medium':
            return submission.score >= 60 && submission.score < 80;
          case 'low':
            return submission.score < 60;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesDate && matchesStatus && matchesScore;
    });
  };

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateStats = () => {
    const completed = submissions.filter(s => s.status === 'completed');
    const totalScores = completed.reduce((sum, s) => sum + (s.score || 0), 0);
    const avgScore = completed.length ? totalScores / completed.length : 0;
    const passCount = completed.filter(s => (s.score || 0) >= 60).length;
    const passRate = completed.length ? (passCount / completed.length) * 100 : 0;

    return {
      avgScore: avgScore.toFixed(1),
      passRate: passRate.toFixed(1),
      completed: completed.length,
      pending: submissions.filter(s => s.status === 'pending').length
    };
  };

  const stats = calculateStats();

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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Submission Analysis</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Average Score</h3>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avgScore}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Pass Rate</h3>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.passRate}%</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Completed</h3>
              <ChartIcon className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Pending</h3>
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Score Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={submissions.filter(s => s.score !== undefined)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="candidateName"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-gray-300 rounded-md py-2 pl-2 pr-8"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md py-2 pl-2 pr-8"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="border border-gray-300 rounded-md py-2 pl-2 pr-8"
              >
                <option value="all">All Scores</option>
                <option value="high">High (≥80)</option>
                <option value="medium">Medium (60-79)</option>
                <option value="low">Low (<60)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportData('csv')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                CSV
              </button>
              <button
                onClick={() => exportData('pdf')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                PDF
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filterSubmissions().map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {submission.candidateName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {format(new Date(submission.submittedAt), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getStatusColor(submission.status)
                    }`}>
                      {submission.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.score ? (
                      <span className={`text-sm font-medium ${getScoreColor(submission.score)}`}>
                        {submission.score}/100
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {submission.status === 'completed' ? 'View' : 'Evaluate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedSubmission.status === 'completed' ? 'View Evaluation' : 'Evaluate Submission'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={evaluationScore}
                  onChange={(e) => setEvaluationScore(e.target.value)}
                  disabled={selectedSubmission.status === 'completed'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evaluation Notes
                </label>
                <textarea
                  rows={4}
                  value={evaluationNotes}
                  onChange={(e) => setEvaluationNotes(e.target.value)}
                  disabled={selectedSubmission.status === 'completed'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
                {selectedSubmission.status !== 'completed' && (
                  <button
                    onClick={handleEvaluationSubmit}
                    disabled={isEvaluating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isEvaluating ? 'Saving...' : 'Save Evaluation'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalystDashboard;