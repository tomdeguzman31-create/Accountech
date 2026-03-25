
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { READINESS_DATA, COLORS, DEMO_USERS, MOCK_SUBJECTS } from '../constants';
import { 
  TrendingUp, Users, BookOpen, Target, Settings, Plus, Edit2, Trash2, X, 
  UserPlus, Shield, AlertCircle, Save, Layers, Award, ToggleLeft, 
  ToggleRight, Eye, EyeOff, Search, CheckCircle2, MinusCircle,
  Activity, PieChart as PieIcon, BarChart3, Calendar as CalendarIcon, Download, Calendar,
  Bell, Trophy, Megaphone, Send, Medal
} from 'lucide-react';
import { DifficultyTier, UserRole, Subject } from '../types';
import { useAuth } from '../App';
import { Skeleton, DashboardSkeleton, TableSkeleton } from '../components/Skeleton';
import {
  adminApi,
  announcementApi,
  leaderboardApi,
  questionApi,
  studentApi,
  subjectApi,
  type AdminReadinessReport,
  type Announcement,
  type LeaderboardEntry,
} from '../services/api';

const AdminDashboard: React.FC = () => {
  const { activeTab, token, difficultyTiers, setDifficultyTiers } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showComposeAnnouncement, setShowComposeAnnouncement] = useState(false);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [announcementPosting, setAnnouncementPosting] = useState(false);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [lbSubjects, setLbSubjects] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [lbSubjectId, setLbSubjectId] = useState('');
  const [lbDifficulty, setLbDifficulty] = useState('');
  const [lbDateFrom, setLbDateFrom] = useState('');
  const [lbDateTo, setLbDateTo] = useState('');
  
  // Difficulty Tiers State
  const [editingTier, setEditingTier] = useState<DifficultyTier | null>(null);
  const [showAddTierModal, setShowAddTierModal] = useState(false);
  const [newTier, setNewTier] = useState<Partial<DifficultyTier>>({ name: '', description: '', weight: 1 });
  
  // Subjects State
  const [subjects, setSubjects] = useState<Subject[]>(MOCK_SUBJECTS);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubData, setEditSubData] = useState<Subject | null>(null);
  const [newSub, setNewSub] = useState<Partial<Subject>>({ code: '', name: '' });
  const [showAddSub, setShowAddSub] = useState(false);

  // Faculty Management State
  const [facultyList, setFacultyList] = useState(DEMO_USERS.filter(u => u.role === UserRole.FACULTY).map(u => ({ ...u, isActive: true, id: Math.random().toString(36).substr(2, 9), isActivated: true })));
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ name: '', email: '' });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [questionBankCount, setQuestionBankCount] = useState(0);
  const [adminReadinessReport, setAdminReadinessReport] = useState<AdminReadinessReport | null>(null);

  const getRankBadgeClasses = (rank: number): string => {
    if (rank === 1) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (rank === 2) return 'bg-slate-200 text-slate-700 border-slate-300';
    if (rank === 3) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  // Reset search when tab changes
  useEffect(() => {
    setSearchTerm('');
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'ANNOUNCEMENTS') {
      announcementApi.list(token).then(setAnnouncements).catch(() => {});
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (!token || activeTab !== 'ANALYTICS') return;

    studentApi
      .list(token)
      .then((rows) => setTotalStudentsCount(rows.length))
      .catch(() => setTotalStudentsCount(0));

    questionApi
      .list(token)
      .then((rows) => setQuestionBankCount(rows.length))
      .catch(() => setQuestionBankCount(0));

    adminApi
      .readinessReport(token)
      .then(setAdminReadinessReport)
      .catch(() => setAdminReadinessReport(null));
  }, [activeTab, token]);

  useEffect(() => {
    if (!token || activeTab !== 'LEADERBOARD') return;
    setLeaderboardLoading(true);
    if (!lbSubjects.length) subjectApi.list(token).then(setLbSubjects).catch(() => {});
    leaderboardApi.get(token, {
      subjectId: lbSubjectId || undefined,
      difficulty: lbDifficulty || undefined,
      dateFrom: lbDateFrom || undefined,
      dateTo: lbDateTo || undefined,
    }).then(setLeaderboard).catch(() => {}).finally(() => setLeaderboardLoading(false));
  }, [activeTab, token, lbSubjectId, lbDifficulty, lbDateFrom, lbDateTo]);

  const handlePostAnnouncement = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newAnnouncementTitle.trim() || !newAnnouncementContent.trim()) return;
    setAnnouncementPosting(true);
    try {
      await announcementApi.create(token, {
        title: newAnnouncementTitle.trim(),
        content: newAnnouncementContent.trim(),
      });
      const updated = await announcementApi.list(token);
      setAnnouncements(updated);
      setNewAnnouncementTitle('');
      setNewAnnouncementContent('');
      setShowComposeAnnouncement(false);
    } catch {
      // silent
    } finally {
      setAnnouncementPosting(false);
    }
  }, [token, newAnnouncementTitle, newAnnouncementContent]);

  const handleDeleteAnnouncement = useCallback(async (id: string) => {
    if (!token) return;
    try {
      await announcementApi.remove(token, id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // silent
    }
  }, [token]);

  // Filtered lists based on search
  const filteredFaculty = useMemo(() => 
    facultyList.filter(f => 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      f.email.toLowerCase().includes(searchTerm.toLowerCase())
    ), [facultyList, searchTerm]);

  const filteredTiers = useMemo(() => 
    difficultyTiers.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    ), [difficultyTiers, searchTerm]);

  const filteredSubjects = useMemo(() => 
    subjects.filter(s => 
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [subjects, searchTerm]);

  // Difficulty Tier Handlers
  const handleAddTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTier.name && newTier.description) {
      const id = Math.random().toString(36).substr(2, 9);
      setDifficultyTiers([...difficultyTiers, { 
        id, 
        name: newTier.name, 
        description: newTier.description, 
        weight: Number(newTier.weight) || 1,
        isActive: true 
      }]);
      setNewTier({ name: '', description: '', weight: 1 });
      setShowAddTierModal(false);
    }
  };

  const handleUpdateTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTier) {
      setDifficultyTiers(difficultyTiers.map(t => t.id === editingTier.id ? editingTier : t));
      setEditingTier(null);
    }
  };

  const handleToggleTierStatus = (id: string) => {
    setDifficultyTiers(difficultyTiers.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
  };

  // Subject Handlers
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSub.code && newSub.name) {
      const id = (subjects.length + 1).toString();
      setSubjects([...subjects, { id, code: newSub.code, name: newSub.name, isActive: true }]);
      setNewSub({ code: '', name: '' });
      setShowAddSub(false);
    }
  };

  const startEditSub = (sub: Subject) => {
    setEditingSubId(sub.id);
    setEditSubData({ ...sub });
  };

  const handleToggleSubStatus = (id: string) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const handleSaveEditSub = () => {
    if (editingSubId && editSubData) {
      setSubjects(subjects.map(s => s.id === editingSubId ? editSubData : s));
      setEditingSubId(null);
      setEditSubData(null);
    }
  };

  // Faculty Handlers
  const handleAddFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    const faculty = { 
      id: Math.random().toString(36).substr(2, 9),
      name: newFaculty.name, 
      email: newFaculty.email,
      role: UserRole.FACULTY,
      isActivated: false,
      isActive: true
    };
    setFacultyList([...facultyList, faculty as any]);
    setNewFaculty({ name: '', email: '' });
    setShowAddFaculty(false);
  };

  const handleToggleFacultyStatus = (id: string) => {
    setFacultyList(facultyList.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f));
  };

  const stats = [
    { label: 'Total Faculty', val: facultyList.length, icon: Users, color: COLORS.PH_BLUE },
    { label: 'Total Students', val: totalStudentsCount.toLocaleString(), icon: Target, color: COLORS.PH_GREEN },
    { label: 'Question Bank', val: questionBankCount.toLocaleString(), icon: BookOpen, color: '#4f46e5' },
    {
      label: 'Passing Forecast',
      val: `${(adminReadinessReport?.globalReadiness.boardPassingLikelihood ?? 75).toFixed(1)}%`,
      icon: TrendingUp,
      color: COLORS.PH_YELLOW,
    }
  ];

  const historicalReadiness =
    adminReadinessReport?.historicalTrend.map((row) => ({
      year: row.batchLabel,
      rate: row.passingLikelihood,
      accuracy: row.averageAccuracy,
      completion: row.completionRate,
      students: row.studentCount,
    })) ?? READINESS_DATA;

  const facultyPerformanceOverview = adminReadinessReport?.facultyOverview ?? [];

  const gaps = [
    { label: 'FAR', score: 85, color: '#10b981' },
    { label: 'TAX', score: 64, color: COLORS.PH_YELLOW },
    { label: 'AUD', score: 45, color: '#ef4444' }
  ];

  const userDistribution = [
    { name: 'Students', value: totalStudentsCount, color: COLORS.PH_BLUE },
    { name: 'Faculty', value: facultyList.length, color: COLORS.PH_YELLOW },
  ];

  const subjectPerformance = [
    { subject: 'FAR', average: 78, target: 85 },
    { subject: 'TAX', average: 65, target: 85 },
    { subject: 'AUD', average: 58, target: 85 },
    { subject: 'MAS', average: 82, target: 85 },
    { subject: 'RFBT', average: 71, target: 85 },
    { subject: 'AFAR', average: 62, target: 85 },
  ];

  const activityData = [
    { day: 'Mon', active: 450 },
    { day: 'Tue', active: 520 },
    { day: 'Wed', active: 480 },
    { day: 'Thu', active: 610 },
    { day: 'Fri', active: 590 },
    { day: 'Sat', active: 320 },
    { day: 'Sun', active: 280 },
  ];

  const difficultyDist = difficultyTiers.map(t => ({
    name: t.name,
    count: Math.floor(Math.random() * 3000) + 1000,
    weight: t.weight
  }));

  const downloadAdminAnalytics = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeTab === 'FACULTY') {
      csvContent += "Name,Email,Role,Status\n";
      facultyList.forEach(f => {
        csvContent += `${f.name},${f.email},${f.role},${f.isActive ? 'Active' : 'Inactive'}\n`;
      });
    } else if (activeTab === 'DIFFICULTIES') {
      csvContent += "Name,Weight,Description,Status\n";
      difficultyTiers.forEach(t => {
        csvContent += `${t.name},${t.weight},${t.description.replace(/,/g, ';')},${t.isActive ? 'Active' : 'Inactive'}\n`;
      });
    } else if (activeTab === 'STRATEGIC') {
      csvContent += "Code,Name,Status\n";
      subjects.forEach(s => {
        csvContent += `${s.code},${s.name},${s.isActive ? 'Active' : 'Inactive'}\n`;
      });
    } else {
      // Analytics Tab
      csvContent += "Category,Metric,Value\n";
      if (startDate || endDate) {
        csvContent += `Filter,Date Range,${startDate || 'N/A'} to ${endDate || 'N/A'}\n`;
      }
      stats.forEach(s => csvContent += `General,${s.label},${s.val}\n`);
      READINESS_DATA.forEach(d => csvContent += `Readiness,${d.year},${d.rate}%\n`);
      subjectPerformance.forEach(p => csvContent += `Performance,${p.subject},${p.average}% (Target: ${p.target}%)\n`);
      activityData.forEach(a => csvContent += `Engagement,${a.day},${a.active} active users\n`);
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `admin_analytics_${activeTab.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        {activeTab === 'ANALYTICS' && (
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <Calendar size={14} className="text-slate-400" />
              <input 
                type="date" 
                className="text-[11px] font-bold text-slate-600 outline-none bg-transparent"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-slate-300 text-[10px] font-black">TO</span>
              <input 
                type="date" 
                className="text-[11px] font-bold text-slate-600 outline-none bg-transparent"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {(startDate || endDate) && (
                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            <button 
              onClick={downloadAdminAnalytics}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-all shadow-md"
            >
              <Download size={14} />
              Export Data
            </button>
          </div>
        )}
      </div>

      {activeTab === 'ANALYTICS' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-2xl font-black mt-1 text-slate-800">{stat.val}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                  <stat.icon size={24} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Historical Trend Line</h3>
                  <p className="text-sm text-gray-500 mt-1">Accuracy and passing likelihood for 2022, 2023, 2024, and current batch</p>
                </div>
                <button
                  className="px-3 py-1.5 text-[10px] font-black rounded-lg bg-[#1e3a8a] text-white"
                  onClick={downloadAdminAnalytics}
                >
                  Download CSV
                </button>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalReadiness}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis unit="%" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="#1e3a8a" strokeWidth={3} dot={{ r: 5 }} name="Passing Likelihood" />
                    <Line type="monotone" dataKey="accuracy" stroke="#065f46" strokeWidth={2} dot={{ r: 4 }} name="Average Accuracy" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <PieIcon className="text-[#065f46]" size={20} />
                  <h3 className="text-lg font-black text-slate-800">Global Readiness Gauge</h3>
                </div>
                <button
                  className="px-3 py-1.5 text-[10px] font-black rounded-lg bg-[#065f46] text-[#facc15]"
                  onClick={() => window.alert('PDF export placeholder. Connect to PDF service when ready.')}
                >
                  Download PDF
                </button>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Ready', value: adminReadinessReport?.globalReadiness.boardPassingLikelihood ?? 0, color: '#065f46' },
                        { name: 'Remaining', value: 100 - (adminReadinessReport?.globalReadiness.boardPassingLikelihood ?? 0), color: '#e2e8f0' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      startAngle={220}
                      endAngle={-40}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#065f46" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="-mt-36 text-center">
                <p className="text-4xl font-black text-[#1e3a8a]">
                  {(adminReadinessReport?.globalReadiness.boardPassingLikelihood ?? 0).toFixed(1)}%
                </p>
                <p className="text-xs font-bold text-slate-500 mt-1">Board Passing Likelihood</p>
              </div>
              <p className="text-[11px] text-slate-500 mt-8 leading-relaxed">
                {adminReadinessReport?.readinessMath ?? 'Readiness formula not available yet.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-8">
                <Target className="text-emerald-500" size={20} />
                <h3 className="text-lg font-black text-slate-800">Subject Performance Radar</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subjectPerformance}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 12}} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Radar
                      name="Average Score"
                      dataKey="average"
                      stroke={COLORS.PH_BLUE}
                      fill={COLORS.PH_BLUE}
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Target Score"
                      dataKey="target"
                      stroke={COLORS.PH_YELLOW}
                      fill={COLORS.PH_YELLOW}
                      fillOpacity={0.1}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-8">
                <Activity className="text-indigo-500" size={20} />
                <h3 className="text-lg font-black text-slate-800">Weekly Engagement</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="active" stroke="#4f46e5" fillOpacity={1} fill="url(#colorActive)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-800">Faculty Performance Overview</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {facultyPerformanceOverview.length} Professor{facultyPerformanceOverview.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Professor</th>
                    <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Students Handled</th>
                    <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Class Readiness</th>
                    <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Drills Uploaded</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyPerformanceOverview.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm font-bold text-slate-400">
                        No faculty performance data yet.
                      </td>
                    </tr>
                  ) : (
                    facultyPerformanceOverview.map((row) => (
                      <tr key={row.facultyUserId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-black text-slate-800">{row.facultyName}</p>
                          <p className="text-[11px] text-slate-400">{row.facultyEmail ?? 'No email on file'}</p>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-700">{row.totalStudentsHandled}</td>
                        <td className="px-6 py-4 text-right font-bold text-[#065f46]">{row.averageClassReadiness.toFixed(1)}%</td>
                        <td className="px-6 py-4 text-right font-bold text-[#1e3a8a]">{row.totalDrillsUploaded}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                          {row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleString() : 'No activity yet'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-8">
                <BarChart3 className="text-orange-500" size={20} />
                <h3 className="text-lg font-black text-slate-800">Question Bank Distribution</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={difficultyDist} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} width={150} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={30}>
                      {difficultyDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.weight >= 4 ? '#ef4444' : entry.weight >= 2.5 ? COLORS.PH_YELLOW : COLORS.PH_BLUE} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-8">
                <AlertCircle className="text-orange-500" size={20} />
                <h3 className="text-lg font-black text-slate-800">Knowledge Gaps</h3>
              </div>
              <div className="space-y-6">
                {gaps.map((sub, i) => (
                  <div key={i} className="group">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-black text-slate-700">{sub.label}</span>
                      <span className="font-bold text-gray-400">{sub.score}%</span>
                    </div>
                    <div className="w-full bg-slate-50 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${sub.score}%`, backgroundColor: sub.color }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex gap-3">
                  <AlertCircle className="text-orange-500 shrink-0" size={20} />
                  <div>
                    <h4 className="text-xs font-black text-orange-900 uppercase tracking-wider">Critical Alert</h4>
                    <p className="text-[11px] text-orange-700 mt-1 leading-relaxed font-medium">
                      AUD (Auditing) scores have dropped by 12% this week. Adaptive engine is prioritizing remedial drills for all affected students.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'FACULTY' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="p-8 border-b border-gray-50 flex flex-wrap gap-4 justify-between items-center bg-slate-50/30">
            <div className="flex items-center gap-6 flex-1">
              <h3 className="text-xl font-black text-slate-800 shrink-0">Faculty Management</h3>
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search faculty by name or email..." 
                  className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a8a] transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <button onClick={() => setShowAddFaculty(true)} className="bg-[#1e3a8a] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
              <UserPlus size={18} /> Add Instructor
            </button>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFaculty.map((faculty, i) => (
              <div key={i} className={`p-6 border border-slate-100 rounded-2xl relative group bg-white transition-all ${!faculty.isActive ? 'grayscale opacity-60' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black transition-colors ${faculty.isActive ? 'bg-slate-100 text-[#1e3a8a]' : 'bg-slate-100 text-slate-400'}`}>
                    {faculty.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-800">{faculty.name}</h4>
                      {!faculty.isActive && (
                        <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-full font-black uppercase tracking-widest">Disabled</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{faculty.email}</p>
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleToggleFacultyStatus(faculty.id)} 
                    className={`p-2 rounded-lg transition-all duration-300 ${faculty.isActive ? 'text-[#065f46] hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-50'}`}
                    title={faculty.isActive ? "Deactivate Instructor" : "Activate Instructor"}
                  >
                    {faculty.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                </div>
              </div>
            ))}
            {filteredFaculty.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                No faculty found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'DIFFICULTIES' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-[#1e3a8a] p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Layers size={140} />
             </div>
             <div className="relative z-10 space-y-2">
               <h3 className="text-3xl font-black tracking-tight">Difficulty Level Management</h3>
               <p className="text-blue-200 max-w-lg">Define how the Difficulty levels of specific questions based on Blooms Taxonomy and CMA complexity standards.</p>
             </div>
             <div className="flex flex-col gap-4 relative z-10 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search tiers..." 
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#facc15] transition-all text-white placeholder:text-blue-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button onClick={() => setShowAddTierModal(true)} className="bg-[#facc15] text-[#065f46] px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all active:scale-95">
                  <Plus size={20} /> New Tier
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTiers.map((tier) => (
              <div key={tier.id} className={`bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:border-blue-100 transition-all ${!tier.isActive ? 'grayscale opacity-60' : ''}`}>
                <div className="p-8 flex-1 space-y-5">
                  <div className="flex justify-between items-start">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm transition-all duration-300 ${tier.isActive ? 'text-[#1e3a8a] bg-blue-50' : 'text-slate-400 bg-slate-100'}`}>
                      {tier.weight}x
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingTier({...tier})} className="p-2 text-slate-400 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                      <button 
                        onClick={() => handleToggleTierStatus(tier.id)} 
                        className={`p-2 rounded-lg transition-all duration-300 ${tier.isActive ? 'text-slate-400 hover:text-[#1e3a8a] hover:bg-blue-50' : 'text-[#065f46] hover:bg-emerald-50'}`}
                        title={tier.isActive ? "Deactivate Tier" : "Activate Tier"}
                      >
                        {tier.isActive ? <ToggleRight size={22} className="text-[#065f46]" /> : <ToggleLeft size={22} className="text-slate-300" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xl font-black text-slate-800 leading-tight">{tier.name}</h4>
                      {!tier.isActive && (
                        <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full font-black uppercase tracking-widest">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-3 leading-relaxed">{tier.description}</p>
                  </div>
                </div>
                <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Adaptive Influence</span>
                   <div className="flex gap-1">
                     {[...Array(5)].map((_, i) => (
                       <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i < tier.weight ? (tier.isActive ? 'bg-[#facc15]' : 'bg-slate-300') : 'bg-slate-200'}`}></div>
                     ))}
                   </div>
                </div>
              </div>
            ))}
            {filteredTiers.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-400 font-medium">
                No difficulty tiers found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'STRATEGIC' && (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex flex-wrap justify-between items-center mb-10 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-2xl text-[#1e3a8a]">
                   <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">CPA Board Curriculum</h3>
                  <p className="text-sm text-slate-400">Manage standard board exam subjects</p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search curriculum by code or title..." 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a8a] transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button onClick={() => setShowAddSub(true)} className="bg-[#1e3a8a] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-900/20 whitespace-nowrap">
                  <Plus size={20} /> Add Subject
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubjects.map((sub) => (
                <div key={sub.id} className={`p-6 bg-slate-50 rounded-[1.5rem] border border-transparent hover:border-[#facc15] hover:bg-white transition-all group shadow-sm flex flex-col justify-between ${!sub.isActive ? 'grayscale opacity-60' : ''}`}>
                  {editingSubId === sub.id && editSubData ? (
                    <div className="flex flex-col gap-4">
                      <div className="space-y-3">
                        <input 
                          type="text" 
                          value={editSubData.code} 
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-[#1e3a8a]" 
                          placeholder="Code (e.g., FAR)"
                          onChange={(e) => setEditSubData({...editSubData, code: e.target.value.toUpperCase()})} 
                        />
                        <input 
                          type="text" 
                          value={editSubData.name} 
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#1e3a8a]" 
                          placeholder="Subject Name"
                          onChange={(e) => setEditSubData({...editSubData, name: e.target.value})} 
                        />
                      </div>
                      <div className="flex gap-3 justify-end pt-2">
                        <button onClick={() => setEditingSubId(null)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                        <button onClick={handleSaveEditSub} className="bg-[#065f46] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-md"><Save size={12} /> Save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-black px-3 py-1.5 rounded-lg tracking-widest transition-colors ${sub.isActive ? 'text-[#1e3a8a] bg-blue-100' : 'text-slate-400 bg-slate-200'}`}>{sub.code}</span>
                          {!sub.isActive && <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Offline</span>}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditSub(sub)} className="p-2 text-slate-400 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                          <button 
                            onClick={() => handleToggleSubStatus(sub.id)} 
                            className={`p-2 rounded-lg transition-all duration-300 ${sub.isActive ? 'text-[#065f46]' : 'text-slate-300'}`}
                            title={sub.isActive ? "Deactivate Subject" : "Activate Subject"}
                          >
                            {sub.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                          </button>
                        </div>
                      </div>
                      <span className={`text-sm font-black leading-tight transition-colors ${sub.isActive ? 'text-slate-700' : 'text-slate-400'}`}>{sub.name}</span>
                    </>
                  )}
                </div>
              ))}
              {filteredSubjects.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                  No subjects found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Tier Modal */}
      {showAddTierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-50 rounded-2xl text-[#facc15]">
                  <Award size={24} />
                </div>
                <h3 className="text-2xl font-black text-[#1e3a8a]">New Difficulty Tier</h3>
              </div>
              <button onClick={() => setShowAddTierModal(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={28} /></button>
            </div>
            <form onSubmit={handleAddTier} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tier Designation Name</label>
                <input required type="text" placeholder="e.g., Professional Evaluation" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-black text-slate-800" value={newTier.name} onChange={e => setNewTier({...newTier, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cognitive Weight (Complexity Multiplier)</label>
                <input required type="number" step="0.5" min="1" max="5" placeholder="1.0" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-black" value={newTier.weight} onChange={e => setNewTier({...newTier, weight: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Pedagogical Description</label>
                <textarea required placeholder="Define the level of professional judgment required for this tier..." className="w-full h-32 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm leading-relaxed" value={newTier.description} onChange={e => setNewTier({...newTier, description: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-[#1e3a8a] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition-all hover:bg-blue-800">Deploy New Difficulty Tier</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tier Modal */}
      {editingTier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-2xl text-[#1e3a8a]">
                  <Edit2 size={24} />
                </div>
                <h3 className="text-2xl font-black text-[#1e3a8a]">Edit Difficulty Tier</h3>
              </div>
              <button onClick={() => setEditingTier(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={28} /></button>
            </div>
            <form onSubmit={handleUpdateTier} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tier Designation Name</label>
                <input required type="text" placeholder="e.g., Professional Evaluation" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-black text-slate-800" value={editingTier.name} onChange={e => setEditingTier({...editingTier, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cognitive Weight (Complexity Multiplier)</label>
                <input required type="number" step="0.5" min="1" max="5" placeholder="1.0" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-black" value={editingTier.weight} onChange={e => setEditingTier({...editingTier, weight: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Pedagogical Description</label>
                <textarea required placeholder="Define the level of professional judgment required for this tier..." className="w-full h-32 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm leading-relaxed" value={editingTier.description} onChange={e => setEditingTier({...editingTier, description: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setEditingTier(null)} className="flex-1 py-4 border border-slate-200 rounded-2xl text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-[2] bg-[#065f46] text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/10 active:scale-95 transition-all hover:bg-emerald-800">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddFaculty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-[#1e3a8a]">Register Faculty</h3>
              <button onClick={() => setShowAddFaculty(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddFaculty} className="space-y-4">
              <input required type="text" placeholder="Full Name" className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1e3a8a]" value={newFaculty.name} onChange={e => setNewFaculty({...newFaculty, name: e.target.value})} />
              <input required type="email" placeholder="Phinma Email" className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1e3a8a]" value={newFaculty.email} onChange={e => setNewFaculty({...newFaculty, email: e.target.value})} />
              <button type="submit" className="w-full bg-[#1e3a8a] text-white py-4 rounded-xl font-black shadow-lg shadow-blue-900/20 active:scale-95 transition-all">Register Instructor</button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-[#1e3a8a] p-6 md:p-10 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Megaphone size={120} /></div>
            <div className="relative z-10 space-y-2">
              <h3 className="text-3xl font-black tracking-tight">Announcements</h3>
              <p className="text-blue-200 max-w-lg">Post and manage system-wide notices for students, faculty, or staff.</p>
            </div>
            <button onClick={() => setShowComposeAnnouncement(true)} className="relative z-10 bg-[#facc15] text-[#065f46] px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-all active:scale-95">
              <Plus size={20} /> New Announcement
            </button>
          </div>
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400 font-bold">No announcements yet.</div>
            ) : announcements.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest bg-blue-100 text-[#1e3a8a]">{a.authorRole}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800">{a.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{a.content}</p>
                    <p className="text-[10px] text-slate-400 font-bold">by {a.authorName}</p>
                  </div>
                  <button onClick={() => handleDeleteAnnouncement(a.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0" title="Delete announcement">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'LEADERBOARD' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-[#1e3a8a] p-6 md:p-10 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={120} /></div>
            <div className="relative z-10 space-y-2">
              <h3 className="text-3xl font-black tracking-tight">Top 10 Student Leaderboard</h3>
              <p className="text-blue-200 max-w-lg">Top 10 system-wide ranking by average drill accuracy across all board subjects.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</label>
              <select value={lbSubjectId} onChange={e => setLbSubjectId(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a8a] min-w-[160px]">
                <option value="">All Subjects</option>
                {lbSubjects.map(s => <option key={s.id} value={s.id}>{s.code} – {s.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Difficulty</label>
              <select value={lbDifficulty} onChange={e => setLbDifficulty(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a8a] min-w-[140px]">
                <option value="">All Levels</option>
                <option value="Easy">Easy</option>
                <option value="Average">Average</option>
                <option value="Difficult">Difficult</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date From</label>
              <input type="date" value={lbDateFrom} onChange={e => setLbDateFrom(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date To</label>
              <input type="date" value={lbDateTo} onChange={e => setLbDateTo(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
            </div>
            {(lbSubjectId || lbDifficulty || lbDateFrom || lbDateTo) && (
              <button onClick={() => { setLbSubjectId(''); setLbDifficulty(''); setLbDateFrom(''); setLbDateTo(''); }} className="px-4 py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors mt-4">
                Reset Filters
              </button>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {leaderboardLoading ? (
              <div className="p-16 text-center text-slate-400 font-bold">Loading leaderboard...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Rank</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student ID</th>
                    <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Accuracy</th>
                    <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr key={entry.rank} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-black text-xs ${getRankBadgeClasses(entry.rank)}`}>
                          {entry.rank <= 3 ? <Medal size={14} /> : entry.rank}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-800">{entry.name}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{entry.studentId ?? '—'}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-800">{entry.avgAccuracy}%</td>
                      <td className="px-6 py-4 text-right text-slate-500 font-bold">{entry.sessionsTaken}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showComposeAnnouncement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-[#1e3a8a]">New Announcement</h3>
              <button onClick={() => setShowComposeAnnouncement(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={28} /></button>
            </div>
            <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
              <AlertCircle size={18} className="text-[#1e3a8a] shrink-0" />
              <p className="text-sm font-bold text-[#1e3a8a]">This announcement will be sent to all Faculty Members.</p>
            </div>
            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <input required type="text" placeholder="Title" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl" value={newAnnouncementTitle} onChange={e => setNewAnnouncementTitle(e.target.value)} />
              <textarea required rows={5} placeholder="Message" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl" value={newAnnouncementContent} onChange={e => setNewAnnouncementContent(e.target.value)} />
              <button type="submit" disabled={announcementPosting} className="w-full bg-[#1e3a8a] text-white py-4 rounded-2xl font-black">{announcementPosting ? 'Posting...' : 'Post Announcement'}</button>
            </form>
          </div>
        </div>
      )}

      {showAddSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-[#1e3a8a]">Add New Subject</h3>
              <button onClick={() => setShowAddSub(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Code</label>
                <input required type="text" placeholder="e.g., FAR, TAX, AFAR" className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1e3a8a] text-sm font-black" value={newSub.code} onChange={e => setNewSub({...newSub, code: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Name</label>
                <input required type="text" placeholder="Full name of the board subject" className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1e3a8a] text-sm font-bold" value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-[#065f46] text-white py-4 rounded-xl font-black shadow-lg shadow-emerald-900/20 active:scale-95 transition-all mt-4">Create Subject Entry</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
