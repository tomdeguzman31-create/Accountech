
import React, { useState } from 'react';
import { useAuth } from '../App';
import { UserRole } from '../types';
import { 
  User, 
  Mail, 
  Shield, 
  Fingerprint, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  KeyRound,
  ShieldCheck,
  ChevronRight,
  X,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

const Profile: React.FC = () => {
  const { user, updateUserProfile, changePassword } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [showSuccess, setShowSuccess] = useState(false);

  // Password Change State
  const [passwordStep, setPasswordStep] = useState<'NONE' | 'NEW_PASSWORD'>('NONE');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!user) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(name)
      .then(() => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Profile update failed.';
        setPasswordError(message);
      });
  };

  const isEmailReadOnly = true; // Per requirement: Students and Faculty emails are none editable

  // Password Change Logic
  const startPasswordChange = () => {
    setPasswordStep('NEW_PASSWORD');
    setPasswordError('');
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError('Enter your current password to continue.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Security protocol requires at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    changePassword(currentPassword, newPassword)
      .then(() => {
        setPasswordStep('NONE');
        setPasswordSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
        setTimeout(() => setPasswordSuccess(false), 5000);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to update password.';
        setPasswordError(message);
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div></div>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-[#1e3a8a] rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
          <Shield size={12} /> Secure Account Management
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-[#1e3a8a] to-[#065f46]"></div>
            <div className="relative z-10 pt-4">
              <div className="w-24 h-24 rounded-3xl bg-white border-4 border-slate-50 shadow-xl mx-auto flex items-center justify-center text-4xl font-black text-[#1e3a8a]">
                {user.name.charAt(0)}
              </div>
              <h3 className="text-xl font-black text-slate-800 mt-6 tracking-tight">{user.name}</h3>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{user.role}</p>
              
              <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Account Status</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-black">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Institution</span>
                  <span className="font-black text-slate-700">CMA Department</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-widest">Member Since</span>
                  <span className="font-black text-slate-700">Oct 2024</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#facc15] p-8 rounded-[2rem] text-[#065f46] shadow-xl shadow-yellow-500/10 border border-yellow-300">
             <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={20} />
                <h4 className="font-black text-sm uppercase tracking-tight">Security Protocol</h4>
             </div>
             <p className="text-xs font-bold leading-relaxed opacity-80">
              Your identity and institutional email are tied to the CMA Department whitelist. Account modifications require your current password.
             </p>
          </div>
        </div>

        {/* Edit Form & Password Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-3 bg-blue-50 text-[#1e3a8a] rounded-2xl">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Informatics Profile</h3>
                <p className="text-sm text-slate-400 font-medium">Verify and update your legal identification</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1e3a8a] transition-colors" size={18} />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#1e3a8a] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phinma Institutional Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="email" 
                      readOnly
                      value={user.email}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-400 outline-none cursor-not-allowed"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <span title="Locked by System">
                        <Shield size={14} className="text-slate-300" />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Access Tier</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      readOnly
                      value={user.role}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-400 outline-none cursor-not-allowed uppercase tracking-widest"
                    />
                  </div>
                </div>

                {user.role === UserRole.STUDENT && user.studentId && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phinma Student ID</label>
                    <div className="relative">
                      <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="text" 
                        readOnly
                        value={user.studentId}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-400 outline-none cursor-not-allowed tracking-widest"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <span title="Read-only Identity">
                          <Lock size={14} className="text-slate-300" />
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {showSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm animate-in fade-in zoom-in-95">
                  <CheckCircle2 size={18} />
                  Identity synchronized with Departmental Informatics.
                </div>
              )}

              <div className="pt-4">
                <button 
                  type="submit"
                  className="bg-[#1e3a8a] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-blue-900/10 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Save size={18} /> Save Name Changes
                </button>
              </div>
            </form>
          </div>

          {/* Secure Password Change Section */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-50 text-[#065f46] rounded-2xl">
                  <KeyRound size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Security Credentials</h3>
                  <p className="text-sm text-slate-400 font-medium">Update your encrypted access key</p>
                </div>
              </div>
              {passwordStep === 'NONE' && !passwordSuccess && (
                <button 
                  onClick={startPasswordChange}
                  disabled={isLoading}
                  className="px-6 py-3 bg-[#065f46] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-900/10 hover:bg-[#044e3a] transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Change Password'}
                </button>
              )}
            </div>

            {passwordSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm mb-6 animate-in fade-in slide-in-from-top-2">
                <ShieldCheck size={18} />
                Security key successfully rotated and encrypted.
              </div>
            )}

            {passwordStep === 'NEW_PASSWORD' && (
              <form onSubmit={handlePasswordUpdate} className="space-y-6 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        type="password"
                        required
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#065f46]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">New Security Key</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        required
                        placeholder="Min 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#065f46]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Identity Key</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        required
                        placeholder="Repeat key"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#065f46]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                {passwordError && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">{passwordError}</p>}
                <div className="flex gap-4">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-[#065f46] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-emerald-900/10 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Rotate Access Key
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPasswordStep('NONE')}
                    className="px-6 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600"
                  >
                    Discard
                  </button>
                </div>
              </form>
            )}

            {passwordStep === 'NONE' && !passwordSuccess && (
              <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                    <ShieldCheck size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-700 tracking-tight">Password-Based Security</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Changes require your current password</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
