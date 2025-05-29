import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, Settings, Bell, Shield, CreditCard, Plus, LogOut, ArrowLeft, Pencil, X, Check } from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface Profile {
  name: string;
  email: string;
  notifications: {
    email: boolean;
    sms: boolean;
    progress: boolean;
    reports: boolean;
  };
}

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, isAuthenticated, logout, userRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    notifications: {
      email: true,
      sms: true,
      progress: true,
      reports: true
    }
  });
  const [editedProfile, setEditedProfile] = useState<Profile>(profile);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadCredits = async () => {
      try {
        if (isAuthenticated) {
          const wallet = await api.credits.get();
          setCredits(wallet.credits);
        }
      } catch (error) {
        console.error('Error loading credits:', error);
        if (isAuthenticated) {
          toast.error('Failed to load credits');
        }
      }
    };

    loadCredits();
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      const newProfile = {
        ...profile,
        name: user.user_metadata?.name || '',
        email: user.email || ''
      };
      setProfile(newProfile);
      setEditedProfile(newProfile);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile({
        name: editedProfile.name,
        email: editedProfile.email
      });
      setProfile(editedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationChange = (key: keyof typeof profile.notifications) => {
    setProfile(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const cancelEdit = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  // Return null while checking authentication or if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(userRole === 'investor' ? '/investor/dashboard' : '/analyst')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>

      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {/* Credits Section */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Credits</h2>
            </div>
            <button
              onClick={() => navigate('/credits/purchase')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Purchase Credits
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Available Credits</span>
              <span className="text-2xl font-bold text-gray-900">{credits}</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Each credit allows you to submit one property for analysis
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Pencil className="h-5 w-5" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-green-600 hover:text-green-700 ml-4"
                >
                  <Check className="h-5 w-5" />
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.name}
                  onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="px-4 py-2 bg-gray-50 rounded-md text-gray-900">{profile.name || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedProfile.email}
                  onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="px-4 py-2 bg-gray-50 rounded-md text-gray-900">{profile.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-500" />
              Notification Preferences
            </h2>
          </div>

          <div className="space-y-4">
            {Object.entries(profile.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleNotificationChange(key as keyof typeof profile.notifications)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Security Settings */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-500" />
              Security
            </h2>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {/* Implement password change */}}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Change Password
            </button>
            <button
              onClick={() => {/* Implement 2FA setup */}}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Set up Two-Factor Authentication
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;