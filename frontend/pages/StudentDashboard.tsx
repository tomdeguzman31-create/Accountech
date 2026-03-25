
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Target, 
  Zap, 
  Clock, 
  Trophy, 
  ChevronRight, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Award,
  BarChart3,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  FileText,
  Download,
  Bell,
  Medal
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { MOCK_SUBJECTS, COLORS } from '../constants';
import { Skeleton, DashboardSkeleton, StudentDashboardSkeleton } from '../components/Skeleton';
import { SessionRecord } from '../types';
import { useAuth } from '../App';
import { analyticsApi, announcementApi, drillApi, leaderboardApi, type Announcement, type LeaderboardEntry } from '../services/api';

type AssignedContent = {
  subjectId: string;
  code: string;
  name: string;
  questionCount: number;
  difficulties: string[];
  assignedAt: string | null;
  assignedByFacultyEmail: string | null;
};

const StudentDashboard: React.FC<{ onStartDrill: (subjectId: string, difficultyTierId?: string) => void }> = ({ onStartDrill }) => {
  const { subjects, token, user, activeTab, difficultyTiers } = useAuth();
  const availableSubjects = subjects.length ? subjects : MOCK_SUBJECTS;
  const studentDisplayName = user?.name?.trim().split(/\s+/)[0] || 'Student';
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);
  const [selectedTierId, setSelectedTierId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [assignedContent, setAssignedContent] = useState<AssignedContent[]>([]);
  const [recentSessions, setRecentSessions] = useState<SessionRecord[]>([]);

  const getRankBadgeClasses = (rank: number): string => {
    if (rank === 1) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (rank === 2) return 'bg-slate-200 text-slate-700 border-slate-300';
    if (rank === 3) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-white text-slate-600 border-slate-200';
  };

  // Simulated Loading Effect
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!token) {
      setRecentSessions([]);
      return;
    }
    announcementApi.list(token).then((rows) => setAnnouncements(rows.slice(0, 4))).catch(() => {});
    leaderboardApi.get(token).then((rows) => setLeaderboard(rows)).catch(() => {});
    drillApi.assignedContent(token).then((rows) => setAssignedContent(rows)).catch(() => setAssignedContent([]));
    analyticsApi
      .my(token)
      .then((payload) => {
        const mapped = payload.sessions.map((session) => {
          const takenAt = String(session.takenAt ?? new Date().toISOString());
          const score = Number(session.score ?? 0);
          const totalQuestions = Number(session.totalQuestions ?? 0);
          const percentage = Number(session.accuracyPercentage ?? 0);
          const takenDate = new Date(takenAt);

          return {
            id: String(session.id),
            subjectId: String(session.subjectId ?? ''),
            subject: String(session.subjectCode ?? ''),
            subjectFullName: String(session.subjectName ?? ''),
            score: `${score}/${totalQuestions}`,
            rawScore: score,
            totalQuestions,
            date: takenDate.toLocaleDateString(),
            fullDate: takenDate.toLocaleString(),
            timestamp: takenAt,
            status: percentage >= 75 ? 'Passed' : 'Remedial',
            percentage,
            timeSpent: '-',
            topics: [],
          } as SessionRecord;
        });
        setRecentSessions(mapped);
      })
      .catch(() => setRecentSessions([]));
  }, [token]);

  const assignedSubjects = useMemo(() => {
    const ids = new Set(assignedContent.map((item) => item.subjectId));
    return availableSubjects.filter((subject) => ids.has(subject.id));
  }, [availableSubjects, assignedContent]);

  const activeDifficultyTiers = useMemo(
    () => difficultyTiers.filter((tier) => tier.isActive),
    [difficultyTiers],
  );

  const launchSubjects = assignedSubjects.length ? assignedSubjects : availableSubjects;

  const assignedDifficultyNames = useMemo(() => {
    const selectedAssignment = assignedContent.find((item) => item.subjectId === selectedSubjectId);
    if (!selectedAssignment) {
      return activeDifficultyTiers.map((tier) => tier.name.match(/\((.*?)\)/)?.[1] ?? tier.name);
    }
    return selectedAssignment.difficulties;
  }, [assignedContent, selectedSubjectId, activeDifficultyTiers]);

  const launchTiers = useMemo(() => {
    return activeDifficultyTiers.filter((tier) => {
      const label = tier.name.match(/\((.*?)\)/)?.[1] ?? tier.name;
      return assignedDifficultyNames.includes(label);
    });
  }, [activeDifficultyTiers, assignedDifficultyNames]);

  useEffect(() => {
    if (!launchSubjects.length) return;

    const selectedStillValid = launchSubjects.some((subject) => subject.id === selectedSubjectId);
    if (!selectedStillValid) {
      setSelectedSubjectId(launchSubjects[0].id);
    }
  }, [launchSubjects, selectedSubjectId]);

  useEffect(() => {
    if (!launchTiers.length) return;
    const validTier = launchTiers.some((tier) => tier.id === selectedTierId);
    if (!validTier) {
      setSelectedTierId(launchTiers[0].id);
    }
  }, [launchTiers, selectedTierId]);

  const filteredSessions = useMemo(() => {
    return recentSessions.filter(s => {
      const sessionDate = new Date(s.timestamp);
      const matchesStartDate = !startDate || sessionDate >= new Date(startDate);
      const matchesEndDate = !endDate || sessionDate <= new Date(endDate);
      return matchesStartDate && matchesEndDate;
    });
  }, [recentSessions, startDate, endDate]);

  const handleDownload = () => {
    const headers = ['Subject', 'Score', 'Percentage', 'Date', 'Status', 'Time Spent'];
    const csvContent = [
      headers.join(','),
      ...filteredSessions.map(s => [
        s.subject,
        s.score,
        `${s.percentage}%`,
        s.fullDate,
        s.status,
        s.timeSpent
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Dashboard_History_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Build mastery only from subjects the student has actually taken.
  const masteryData = useMemo(() => {
    const grouped = new Map<string, SessionRecord[]>();
    recentSessions.forEach((session) => {
      const bucket = grouped.get(session.subject) ?? [];
      bucket.push(session);
      grouped.set(session.subject, bucket);
    });

    const rawData = Array.from(grouped.entries()).map(([subjectCode, sessions]) => {
      const sortedByTimeDesc = [...sessions].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      const averageMastery = Math.round(
        sessions.reduce((sum, item) => sum + item.percentage, 0) / sessions.length,
      );

      const latest = sortedByTimeDesc[0]?.percentage ?? averageMastery;
      const previous = sortedByTimeDesc[1]?.percentage ?? latest;
      const trendDelta = latest - previous;

      const matchedSubject = availableSubjects.find(
        (subject) => subject.code === subjectCode || subject.name === sessions[0].subjectFullName,
      );

      return {
        id: matchedSubject?.id ?? '',
        name: subjectCode,
        fullName: sessions[0].subjectFullName,
        mastery: averageMastery,
        trend: trendDelta >= 0 ? 'up' as const : 'down' as const,
        trendValue: Math.abs(trendDelta),
        level: averageMastery > 80 ? 'Proficient' : averageMastery > 60 ? 'Competent' : 'Developing',
      };
    }).sort((a, b) => b.mastery - a.mastery);

    if (!searchTerm) return rawData;
    return rawData.filter(d => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availableSubjects, recentSessions]);

  if (isLoading) {
    return <StudentDashboardSkeleton />;
  }

  if (activeTab === 'ANNOUNCEMENTS') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-blue-50 rounded-xl text-[#1e3a8a]">
              <Bell size={20} />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Announcements</h3>
          </div>
          <div className="space-y-3">
            {announcements.length === 0 && (
              <p className="text-sm text-slate-400 font-bold">No announcements available.</p>
            )}
            {announcements.map((a) => (
              <div key={a.id} className="p-4 md:p-5 rounded-xl border border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-black text-slate-800 line-clamp-1">{a.title}</p>
                  <span className="text-[10px] font-bold text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'LEADERBOARD') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-yellow-50 rounded-xl text-amber-600">
              <Trophy size={20} />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Leaderboard</h3>
          </div>
          <div className="space-y-3">
            {leaderboard.length === 0 && (
              <p className="text-sm text-slate-400 font-bold">No leaderboard data available.</p>
            )}
            {leaderboard.map((entry) => {
              const isMe = user?.studentId && entry.studentId === user.studentId;
              return (
                <div key={entry.rank} className={`flex items-center justify-between p-3 md:p-4 rounded-xl border ${isMe ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black ${getRankBadgeClasses(entry.rank)}`}>
                      {entry.rank <= 3 ? <Medal size={14} /> : entry.rank}
                    </div>
                    <p className={`text-sm font-black truncate ${isMe ? 'text-[#1e3a8a]' : 'text-slate-700'}`}>{entry.name}</p>
                  </div>
                  <p className="text-sm font-black text-slate-700">{entry.avgAccuracy}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'CURRICULUM') {
    const activeTiers = activeDifficultyTiers;
    const activeSubjects = availableSubjects.filter(s => s.isActive);
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Hero */}
        <div className="bg-[#1e3a8a] p-6 md:p-10 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><BookOpen size={120} /></div>
          <div className="relative z-10 space-y-2">
            <h3 className="text-3xl font-black tracking-tight">Board Curriculum</h3>
            <p className="text-blue-200 max-w-lg">Subjects and difficulty tiers configured by your administrator for board exam preparation.</p>
          </div>
          <div className="relative z-10 flex gap-4">
            <div className="bg-white/10 rounded-2xl px-6 py-4 text-center">
              <p className="text-3xl font-black">{activeSubjects.length}</p>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-1">Active Subjects</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-6 py-4 text-center">
              <p className="text-3xl font-black">{activeTiers.length}</p>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-1">Difficulty Tiers</p>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-[#1e3a8a]"><BookOpen size={20} /></div>
            <h4 className="text-lg font-black text-slate-800">Board Subjects</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSubjects.map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-[#1e3a8a] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-[#facc15] tracking-wide">{sub.code}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-800 leading-tight">{sub.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{sub.code}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty Tiers */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700"><Layers size={20} /></div>
            <h4 className="text-lg font-black text-slate-800">Difficulty Tiers</h4>
          </div>
          <div className="space-y-3">
            {activeTiers.map((tier, idx) => {
              const colors = [
                { bg: 'bg-green-50', border: 'border-green-100', badge: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
                { bg: 'bg-yellow-50', border: 'border-yellow-100', badge: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
                { bg: 'bg-red-50', border: 'border-red-100', badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
              ];
              const c = colors[idx] || colors[0];
              return (
                <div key={tier.id} className={`flex items-start gap-4 p-4 rounded-xl border ${c.bg} ${c.border}`}>
                  <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${c.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-slate-800">{tier.name}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${c.badge}`}>Weight {tier.weight}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tier.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome & Start Drill Hero Section */}
      <div className="bg-gradient-to-br from-[#1e3a8a] via-[#1e3a8a] to-[#065f46] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 lg:p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-10 shadow-2xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#facc15] opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#065f46] opacity-30 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
        
        <div className="space-y-6 flex-1 relative z-10 text-center lg:text-left w-full">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[#facc15] mx-auto lg:mx-0">
              <Activity size={12} /> Adaptive Session Active
            </div>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-tight">
              Push your limits, <span className="text-[#facc15]">{studentDisplayName}.</span>
            </h3>
            <p className="text-blue-100 text-sm md:text-base lg:text-lg opacity-80 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Your overall readiness is <span className="font-black text-white">72%</span>.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-4">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold border border-white/10 shadow-inner">
              <Zap size={14} className="text-[#facc15]" />
              <span className="text-blue-50">7 Day Hot Streak</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold border border-white/10 shadow-inner">
              <Trophy size={14} className="text-[#facc15]" />
              <span className="text-blue-50">Top 5%</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/20 w-full lg:w-96 space-y-5 shadow-2xl relative z-10">
          {assignedContent.length > 0 && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-3 space-y-1.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#facc15]">Assigned Exam Content</p>
              {assignedContent.slice(0, 2).map((item) => (
                <p key={item.subjectId} className="text-[10px] text-blue-100 font-bold truncate">
                  {item.code} - {item.questionCount} items ready
                </p>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-300 ml-1">Focus Curriculum</label>
            <div className="relative group">
              <select 
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-white text-slate-800 p-4 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-[#facc15]/30 appearance-none cursor-pointer transition-all shadow-lg"
              >
                {launchSubjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.code} — {sub.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-[#1e3a8a] transition-colors">
                <ChevronRight size={18} className="rotate-90" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-300 ml-1">Difficulty Tier</label>
            <div className="grid grid-cols-1 gap-2 max-h-[224px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
              {launchTiers.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTierId(tier.id)}
                  className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                    selectedTierId === tier.id 
                      ? 'bg-[#facc15] border-[#facc15] text-[#065f46] shadow-lg scale-[1.02]' 
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  <div>
                    <p className="text-[11px] font-black leading-none">{tier.name}</p>
                    <p className={`text-[9px] mt-0.5 font-medium opacity-70 line-clamp-1 ${selectedTierId === tier.id ? 'text-[#065f46]' : 'text-blue-100'}`}>
                      {tier.description}
                    </p>
                  </div>
                  {selectedTierId === tier.id && <CheckCircle2 size={14} />}
                </button>
              ))}
              {launchTiers.length === 0 && (
                <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-[11px] font-bold text-blue-100">
                  No active difficulty tiers are available for this subject.
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => onStartDrill(selectedSubjectId, selectedTierId)}
            disabled={!selectedSubjectId || !selectedTierId}
            className="w-full bg-[#facc15] text-[#065f46] py-5 rounded-2xl font-black text-sm hover:scale-[1.03] hover:shadow-[#facc15]/20 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            LAUNCH ADAPTIVE DRILL
            <Zap size={18} fill="currentColor" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Learning Progress Detailed Analytics */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl text-[#1e3a8a]">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">CMA Curriculum Mastery</h3>
                  <p className="text-[10px] md:text-xs text-slate-400 font-medium">Cross-subject proficiency distribution</p>
                </div>
              </div>
              <div className="flex gap-2 self-start sm:self-auto">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] md:text-[10px] font-black text-emerald-700 uppercase">Board Ready</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={masteryData} layout="vertical" margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} 
                    width={60}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                    formatter={(value: number) => [`${value}% Mastery`, 'Performance']}
                  />
                  <Bar dataKey="mastery" radius={[0, 8, 8, 0]} barSize={20}>
                    {masteryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.mastery > 75 ? COLORS.PH_GREEN : entry.mastery > 60 ? COLORS.PH_BLUE : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Subject Cards Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <BookOpen size={20} className="text-[#1e3a8a]" /> Curriculum Explorer
              </h3>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Find subject..." 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#1e3a8a] transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {masteryData.map((data, i) => (
                <div key={i} className="group p-6 rounded-[1.5rem] border border-slate-100 bg-white hover:shadow-2xl hover:border-[#facc15]/30 hover:-translate-y-1.5 transition-all relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-white bg-[#1e3a8a] px-2 py-1 rounded-md shadow-sm">{data.name}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                          data.level === 'Proficient' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          data.level === 'Competent' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                          {data.level}
                        </span>
                      </div>
                      <p className="text-sm font-black text-slate-800 pt-2 leading-tight">{data.fullName}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-slate-900 leading-none">{data.mastery}%</div>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-black uppercase ${data.trend === 'up' ? 'text-emerald-500' : 'text-red-400'}`}>
                        {data.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {data.trendValue}% trend
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ 
                          width: `${data.mastery}%`,
                          backgroundColor: data.mastery > 75 ? COLORS.PH_GREEN : COLORS.PH_BLUE 
                        }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Clock size={10} /> Last session: 2d ago
                      </p>
                      <button 
                        onClick={() => data.id && onStartDrill(data.id, selectedTierId)}
                        className="text-[10px] font-black text-[#1e3a8a] hover:text-[#065f46] flex items-center gap-1"
                      >
                        ENTER DRILL <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {masteryData.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                  No board subjects found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Recent Activity & Milestones */}
        <div className="space-y-6 md:space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl text-[#065f46]">
                  <Clock size={20} md:size={24} />
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Recent Sessions</h3>
              </div>
              <button 
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-xl font-bold text-[10px] shadow-lg hover:bg-[#1e3a8a]/90 transition-all"
              >
                <Download size={12} />
                Export Data
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  title="Start Date"
                />
                <span className="text-slate-400 font-bold text-[10px]">to</span>
                <input 
                  type="date" 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  title="End Date"
                />
              </div>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              {filteredSessions.map((session) => (
                <div 
                  key={session.id} 
                  onClick={() => setSelectedSession(session)}
                  className="flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl border border-slate-50 hover:bg-slate-50 transition-all cursor-pointer group hover:shadow-md active:scale-[0.98]"
                >
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl shrink-0 flex items-center justify-center font-black text-xs md:text-sm shadow-sm transition-transform group-hover:scale-110 ${
                    session.status === 'Passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {session.subject}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1 gap-2">
                      <p className="text-xs md:text-sm font-black text-slate-800 truncate">{session.score}</p>
                      <span className="text-[9px] md:text-[10px] font-bold text-slate-400 shrink-0">{session.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${session.status === 'Passed' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${session.percentage}%` }}></div>
                      </div>
                      <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest shrink-0 ${session.status === 'Passed' ? 'text-emerald-500' : 'text-red-500'}`}>{session.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1e3a8a] p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Award size={80} md:size={100} />
             </div>
             <h4 className="text-base md:text-lg font-black mb-2 relative z-10">Ready for the Board?</h4>
             <p className="text-[11px] md:text-xs text-blue-200 mb-6 leading-relaxed relative z-10">Based on your current trends, you have a <span className="text-[#facc15] font-black underline">82% probability</span> of passing the FAR and TAX sections of the 2025 CPA Board Exam.</p>
             <button className="w-full py-3 md:py-4 bg-[#facc15] text-[#065f46] rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all relative z-10">
               View Passing Forecast
             </button>
          </div>

        </div>
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
            {/* Modal Header */}
            <div className="bg-[#1e3a8a] p-6 md:p-8 text-white relative">
              <button 
                onClick={() => setSelectedSession(null)}
                className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 md:gap-4 mb-4">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl shrink-0 flex items-center justify-center font-black text-lg md:text-xl shadow-lg ${
                  selectedSession.status === 'Passed' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {selectedSession.subject}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg md:text-2xl font-black tracking-tight truncate">{selectedSession.subjectFullName}</h3>
                  <p className="text-blue-200 text-[10px] md:text-xs font-medium flex items-center gap-1.5">
                    <Calendar size={12} /> {selectedSession.fullDate}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <p className="text-[8px] md:text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Total Score</p>
                  <p className="text-lg md:text-2xl font-black">{selectedSession.score}</p>
                </div>
                <div className="text-center border-x border-white/10">
                  <p className="text-[8px] md:text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Accuracy</p>
                  <p className="text-lg md:text-2xl font-black">{selectedSession.percentage}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] md:text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Time Spent</p>
                  <p className="text-lg md:text-2xl font-black">{selectedSession.timeSpent}</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 space-y-6 md:space-y-8 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {/* Analytics Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={18} className="text-[#1e3a8a]" />
                  <h4 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-tight">Performance Breakdown</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="p-4 md:p-5 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Cognitive Mastery</p>
                      <p className="text-xs md:text-sm font-black text-slate-800 mt-1 truncate">
                        {selectedSession.percentage > 70 ? 'Ready for Application' : 'Focus on Recall'}
                      </p>
                    </div>
                    <Layers size={20} className="text-slate-300 shrink-0" />
                  </div>
                  <div className="p-4 md:p-5 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Result Status</p>
                      <p className={`text-xs md:text-sm font-black mt-1 truncate ${
                        selectedSession.status === 'Passed' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {selectedSession.status === 'Passed' ? 'Board Eligible' : 'Remedial Required'}
                      </p>
                    </div>
                    {selectedSession.status === 'Passed' ? <CheckCircle2 size={20} className="text-emerald-500 shrink-0" /> : <AlertCircle size={20} className="text-red-500 shrink-0" />}
                  </div>
                </div>
              </div>

              {/* Topics Explored */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={18} className="text-[#065f46]" />
                  <h4 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-tight">Topics Audited</h4>
                </div>
                <div className="space-y-2 md:space-y-3">
                  {selectedSession.topics.map((topic, i) => (
                    <div key={i} className="flex items-center justify-between p-3 md:p-4 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${topic.correct ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {topic.correct ? <CheckCircle2 size={14} /> : <X size={14} />}
                        </div>
                        <span className="text-xs md:text-sm font-bold text-slate-700 truncate">{topic.name}</span>
                      </div>
                      <span className={`text-[8px] md:text-[10px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                        topic.correct ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {topic.correct ? 'Mastered' : 'Gap Found'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 md:p-8 border-t border-slate-50 flex flex-col sm:flex-row gap-3 md:gap-4">
              <button 
                onClick={() => setSelectedSession(null)}
                className="flex-1 py-3 md:py-4 border border-slate-200 text-slate-400 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-50 transition-all order-2 sm:order-1"
              >
                Close Report
              </button>
              <button 
                onClick={() => {
                  setSelectedSession(null);
                  onStartDrill(MOCK_SUBJECTS.find(s => s.code === selectedSession.subject)?.id || '1');
                }}
                className="flex-[2] py-3 md:py-4 bg-[#1e3a8a] text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all order-1 sm:order-2"
              >
                Launch Remedial Drill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
