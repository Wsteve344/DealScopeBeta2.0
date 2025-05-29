import React, { useState } from 'react';
import { X, Copy, Mail, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportUrl: string | null;
  dealId: string | undefined;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, reportUrl, dealId }) => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleEmailShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportUrl || !dealId) return;

    setIsSending(true);
    try {
      // Create a sharing record in the database
      const { error } = await supabase
        .from('shared_reports')
        .insert([
          {
            deal_id: dealId,
            shared_with: email,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
          }
        ]);

      if (error) throw error;

      // In a real app, you would send an email here
      // For now, we'll just show a success message
      toast.success(`Report shared with ${email}`);
      setEmail('');
      onClose();
    } catch (err) {
      toast.error('Failed to share report');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = async () => {
    if (!reportUrl) return;
    
    try {
      await navigator.clipboard.writeText(reportUrl);
      toast.success('Link copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Share Report</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleEmailShare} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Share via Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!email || isSending}
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                  !email || isSending
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                <Mail className="h-5 w-5" />
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share via Link
            </label>
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={!reportUrl}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <LinkIcon className="h-5 w-5 text-gray-400" />
              <Copy className="h-5 w-5 text-gray-400" />
              Copy Link
            </button>
          </div>
        </form>

        <p className="mt-4 text-sm text-gray-500">
          Shared links expire after 7 days for security.
        </p>
      </div>
    </div>
  );
};

export default ShareModal;