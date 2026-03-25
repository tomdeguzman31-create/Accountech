import React, { useState } from 'react';
import { useAuth } from '../App';
import {
  LogOut,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Users,
  UserPlus,
  Sparkles,
  Layers,
  Database,
  UserCircle,
  Menu,
  X,
  History,
  Bell,
  Trophy,
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, setView, currentView, activeTab, setActiveTab } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) return <>{children}</>;

  const isStudentDrillLocked = user.role === 'STUDENT' && currentView === 'DRILL';

  const navigateTo = (view: string, tab: string) => {
    if (isStudentDrillLocked) return;
    setView(view);
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 overflow-hidden relative">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-[#1e3a8a] text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden border border-white/30">
                <img
                  src="/logo.jpg"
                  alt="AccounTech logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-xl font-black tracking-tighter uppercase text-white">AccounTech</h1>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 text-blue-200 hover:text-white bg-white/10 rounded-xl"
            >
              <X size={24} />
            </button>
          </div>

          <nav
            className={`flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar ${
              isStudentDrillLocked ? 'pointer-events-none opacity-70' : ''
            }`}
            aria-disabled={isStudentDrillLocked}
          >
            <button
              onClick={() => navigateTo('DASHBOARD', user.role === 'FACULTY' ? 'INSIGHTS' : 'ANALYTICS')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                currentView === 'DASHBOARD' &&
                (activeTab === 'ANALYTICS' || activeTab === 'INSIGHTS' || activeTab === 'DASHBOARD')
                  ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                  : 'hover:bg-blue-800/50 text-blue-100'
              }`}
            >
              <div className="w-6 flex justify-center shrink-0">
                <LayoutDashboard size={18} />
              </div>
              <span>Dashboard</span>
            </button>

            {user.role === 'STUDENT' && (
              <>
                <button
                  onClick={() => navigateTo('DASHBOARD', 'CURRICULUM')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    activeTab === 'CURRICULUM'
                      ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                      : 'hover:bg-blue-800/50 text-blue-100'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <GraduationCap size={18} />
                  </div>
                  <span>Curriculum</span>
                </button>
                <button
                  onClick={() => navigateTo('TEST_HISTORY', 'HISTORY')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    currentView === 'TEST_HISTORY'
                      ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                      : 'hover:bg-blue-800/50 text-blue-100'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <History size={18} />
                  </div>
                  <span>Test History</span>
                </button>
                <button
                  onClick={() => navigateTo('DASHBOARD', 'ANNOUNCEMENTS')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    activeTab === 'ANNOUNCEMENTS'
                      ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                      : 'hover:bg-blue-800/50 text-blue-100'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <Bell size={18} />
                  </div>
                  <span>Announcements</span>
                </button>
                <button
                  onClick={() => navigateTo('DASHBOARD', 'LEADERBOARD')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    activeTab === 'LEADERBOARD'
                      ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                      : 'hover:bg-blue-800/50 text-blue-100'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <Trophy size={18} />
                  </div>
                  <span>Leaderboard</span>
                </button>
              </>
            )}

            {user.role === 'ADMIN' && (
              <>
                <button
                  onClick={() => navigateTo('DASHBOARD', 'FACULTY')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    activeTab === 'FACULTY'
                      ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                      : 'hover:bg-blue-800/50 text-blue-100'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <Users size={18} />
                  </div>
                  <span>Faculty Management</span>
                </button>
                <button
                  onClick={() => navigateTo('DASHBOARD', 'DIFFICULTIES')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    activeTab === 'DIFFICULTIES'
                      ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                      : 'hover:bg-blue-800/50 text-blue-100'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <Layers size={18} />
                  </div>
                  <span>Difficulty Tiers</span>
                </button>
                <button
                  onClick={() => navigateTo('DASHBOARD', 'STRATEGIC')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm min-w-0 ${
                    activeTab === 'STRATEGIC'
                      ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                      : 'hover:bg-blue-800/50 text-blue-100'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="truncate text-left leading-tight">Curriculum Management</span>
                </button>
                <button
                  onClick={() => navigateTo('DASHBOARD', 'ANNOUNCEMENTS')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    activeTab === 'ANNOUNCEMENTS'
                      ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                      : 'hover:bg-blue-800/50 text-blue-100'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <Bell size={18} />
                  </div>
                  <span>Announcements</span>
                </button>
                <button
                  onClick={() => navigateTo('DASHBOARD', 'LEADERBOARD')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    activeTab === 'LEADERBOARD'
                      ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                      : 'hover:bg-blue-800/50 text-blue-100'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <Trophy size={18} />
                  </div>
                  <span>Leaderboard</span>
                </button>
              </>
            )}

            {user.role === 'FACULTY' && (
              <>
                <button
                  onClick={() => navigateTo('DASHBOARD', 'ROSTER')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    activeTab === 'ROSTER'
                      ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                      : 'hover:bg-blue-800/50 text-blue-100'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <Users size={18} />
                  </div>
                  <span>Student Roster</span>
                </button>
                <button
                  onClick={() => navigateTo('DASHBOARD', 'ENROLLMENT')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    activeTab === 'ENROLLMENT'
                      ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                      : 'hover:bg-blue-800/50 text-blue-100'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <UserPlus size={18} />
                  </div>
                  <span>Bulk Enrollment</span>
                </button>
                <button
                  onClick={() => navigateTo('DASHBOARD', 'PARSER')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    activeTab === 'PARSER'
                      ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                      : 'hover:bg-blue-800/50 text-blue-100'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <span>AI Question Parser</span>
                </button>
                <button
                  onClick={() => navigateTo('DASHBOARD', 'QUESTION_BANK')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    activeTab === 'QUESTION_BANK'
                      ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                      : 'hover:bg-blue-800/50 text-blue-100'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <Database size={18} />
                  </div>
                  <span>Question Bank</span>
                </button>
                <button
                  onClick={() => navigateTo('DASHBOARD', 'ANNOUNCEMENTS')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    activeTab === 'ANNOUNCEMENTS'
                      ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                      : 'hover:bg-blue-800/50 text-blue-100'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <Bell size={18} />
                  </div>
                  <span>Announcements</span>
                </button>
                <button
                  onClick={() => navigateTo('DASHBOARD', 'LEADERBOARD')}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    activeTab === 'LEADERBOARD'
                      ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                      : 'hover:bg-blue-800/50 text-blue-100'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <Trophy size={18} />
                  </div>
                  <span>Leaderboard</span>
                </button>
              </>
            )}

            <button
              onClick={() => navigateTo('PROFILE', 'PROFILE')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                currentView === 'PROFILE'
                  ? 'bg-[#065f46] text-[#facc15] shadow-lg'
                  : 'hover:bg-blue-800/50 text-blue-100'
              }`}
            >
              <div className="w-6 flex justify-center shrink-0">
                <UserCircle size={18} />
              </div>
              <span>My Profile</span>
            </button>
          </nav>

          <div className="pt-6 border-t border-blue-800/50 mt-auto">
            <button
              onClick={logout}
              disabled={isStudentDrillLocked}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                isStudentDrillLocked
                  ? 'opacity-60 cursor-not-allowed text-red-200'
                  : 'hover:bg-red-600 text-red-100'
              }`}
            >
              <div className="w-6 flex justify-center shrink-0">
                <LogOut size={18} />
              </div>
              <span>Logout System</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col h-full bg-gray-50">
        <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <button
              disabled={isStudentDrillLocked}
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 -ml-1 rounded-xl md:hidden shrink-0 ${
                isStudentDrillLocked
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-sm md:text-lg font-black text-slate-800 tracking-tight truncate" />
          </div>
          <button
            onClick={() => setView('PROFILE')}
            className="flex items-center gap-2 md:gap-3 hover:bg-slate-50 p-1 md:p-1.5 rounded-2xl transition-all group shrink-0"
          >
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl md:rounded-xl bg-[#065f46] border-2 border-emerald-100 shadow-lg flex items-center justify-center text-[#facc15] font-black text-xs md:text-base group-hover:scale-105 transition-transform">
              {user.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-black text-slate-800 leading-none group-hover:text-[#1e3a8a] transition-colors">{user.name}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{user.role}</p>
            </div>
          </button>
        </header>

        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">{children}</div>
      </main>
    </div>
  );
};
