import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { authApi } from '../../api/auth.api.js';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import ErrorAlert from '../../components/common/ErrorAlert.jsx';
import { formatDate } from '../../utils/formatters.js';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  CheckCircle2,
  KeyRound
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  // Profile details state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);

  // Change password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) {
      setProfileErrors({ fullName: 'Full name is required' });
      return;
    }
    setProfileErrors({});
    setProfileLoading(true);
    try {
      const res = await authApi.updateMe({
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim() || undefined,
      });
      updateProfile(res.data.user);
      showToast('Profile information updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!passwordForm.currentPassword) {
      errs.currentPassword = 'Enter your current password';
    }
    if (!passwordForm.newPassword) {
      errs.newPassword = 'Enter a new password';
    } else if (passwordForm.newPassword.length < 8) {
      errs.newPassword = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)) {
      errs.newPassword = 'Password must include uppercase, lowercase, and a number';
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errs).length > 0) {
      setPasswordErrors(errs);
      return;
    }

    setPasswordErrors({});
    setPasswordLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showToast('Password changed successfully. Please keep your new credentials secure.', 'success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <User className="w-5 h-5" />
          </div>
          Account & Profile Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your agricultural operator identity, security credentials, and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account Summary Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-4">{user?.fullName}</h2>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  Role
                </span>
                <span className="font-semibold text-slate-700 capitalize">{user?.role || 'Farmer'}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Joined
                </span>
                <span className="font-medium text-slate-700">
                  {user?.createdAt ? formatDate(user.createdAt) : 'Recently'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Ownership Protection
            </div>
            <p className="text-xs text-emerald-950/80 leading-relaxed">
              Your AgriFarm resources, farms, and records are cryptographically bound to your unique tenant account.
            </p>
          </div>
        </div>

        {/* Right Column: Profile & Security Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Details Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Personal Information
            </h3>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <Input
                label="Full Name *"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                error={profileErrors.fullName}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Input
                      value={user?.email || ''}
                      disabled
                      className="bg-slate-50 cursor-not-allowed opacity-80"
                      icon={Mail}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Email cannot be changed directly.</p>
                </div>

                <Input
                  label="Contact Phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  icon={Phone}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="primary" type="submit" loading={profileLoading}>
                  Save Profile
                </Button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              Change Password
            </h3>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Current Password *"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                error={passwordErrors.currentPassword}
                icon={Lock}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password *"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  error={passwordErrors.newPassword}
                  icon={Lock}
                />

                <Input
                  label="Confirm New Password *"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  error={passwordErrors.confirmPassword}
                  icon={Lock}
                />
              </div>

              <div className="text-xs text-slate-400">
                Minimum 8 characters with at least one uppercase letter, one lowercase letter, and one number.
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="secondary" type="submit" loading={passwordLoading}>
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
