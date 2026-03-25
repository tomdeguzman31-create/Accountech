
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  Activity,
  Calendar,
  Clock,
  BarChart3,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Download
} from 'lucide-react';
import { COLORS } from '../constants';
import { SessionRecord } from '../types';
import { Skeleton } from '../components/Skeleton';
import { analyticsApi } from '../services/api';
import { useAuth } from '../App';

const TestHistory: React.FC<{ onStartDrill: (subjectId: string, difficultyTierId?: string) => void }> = ({ onStartDrill }) => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historySubjectFilter, setHistorySubjectFilter] = useState('All');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [recentSessions, setRecentSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    if (!token) {
      setRecentSessions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
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
      .finally(() => setIsLoading(false));
  }, [token]);

  const filteredHistory = useMemo(() => {
    return recentSessions.filter(session => {
      const matchesSearch = session.subjectFullName.toLowerCase().includes(historySearchTerm.toLowerCase()) || 
                           session.subject.toLowerCase().includes(historySearchTerm.toLowerCase());
      const matchesSubject = historySubjectFilter === 'All' || session.subject === historySubjectFilter;
      const matchesStatus = historyStatusFilter === 'All' || session.status === historyStatusFilter;
      
      const sessionDate = new Date(session.timestamp);
      const matchesStartDate = !startDate || sessionDate >= new Date(startDate);
      const matchesEndDate = !endDate || sessionDate <= new Date(endDate);

      return matchesSearch && matchesSubject && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [historySearchTerm, historySubjectFilter, historyStatusFilter, startDate, endDate, recentSessions]);

  const handleDownload = () => {
    const headers = ['Subject', 'Score', 'Percentage', 'Date', 'Status', 'Time Spent'];
    const csvContent = [
      headers.join(','),
      ...filteredHistory.map(s => [
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
    link.setAttribute('download', `Test_History_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-[600px] w-full rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Comprehensive Test History</h3>
              <p className="text-[10px] md:text-xs text-slate-400 font-medium">Audit trail of all adaptive drill attempts</p>
            </div>
          </div>

          <button 
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1e3a8a] text-white rounded-xl font-bold text-sm shadow-lg hover:bg-[#1e3a8a]/90 transition-all active:scale-95"
          >
            <Download size={16} />
            Export Data
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
          {/* Search */}
          <div className="lg:col-span-12 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by subject or topic..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all"
              value={historySearchTerm}
              onChange={(e) => setHistorySearchTerm(e.target.value)}
            />
          </div>

          {/* Date Range */}
          <div className="lg:col-span-6 flex items-center gap-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="date" 
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <span className="text-slate-400 font-bold text-[10px] uppercase">to</span>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="date" 
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Selects */}
          <div className="lg:col-span-6 flex items-center gap-2">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select 
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer hover:bg-slate-50 transition-all focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
                value={historySubjectFilter}
                onChange={(e) => setHistorySubjectFilter(e.target.value)}
              >
                <option value="All">All Subjects</option>
                {Array.from(new Set(recentSessions.map((session) => session.subject))).map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>

            <div className="relative flex-1">
              <select 
                className="w-full pl-4 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer hover:bg-slate-50 transition-all focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Passed">Passed</option>
                <option value="Remedial">Remedial</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>

            <button 
              onClick={() => {
                setHistorySearchTerm('');
                setHistorySubjectFilter('All');
                setHistoryStatusFilter('All');
                setStartDate('');
                setEndDate('');
              }}
              className="p-2.5 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all"
              title="Reset Filters"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                <th className="pb-4 pl-6">Subject</th>
                <th className="pb-4">Date & Time</th>
                <th className="pb-4">Score</th>
                <th className="pb-4">Accuracy</th>
                <th className="pb-4">Time Spent</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((session) => (
                <tr 
                  key={session.id} 
                  className="bg-white group hover:bg-slate-50 transition-all border border-slate-50 rounded-2xl shadow-sm"
                >
                  <td className="py-4 pl-6 rounded-l-2xl border-y border-l border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                        session.status === 'Passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {session.subject}
                      </div>
                      <span className="text-sm font-black text-slate-800">{session.subjectFullName}</span>
                    </div>
                  </td>
                  <td className="py-4 border-y border-slate-50">
                    <span className="text-xs font-bold text-slate-500">{session.fullDate}</span>
                  </td>
                  <td className="py-4 border-y border-slate-50">
                    <span className="text-sm font-black text-slate-800">{session.score}</span>
                  </td>
                  <td className="py-4 border-y border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${session.status === 'Passed' ? 'bg-emerald-500' : 'bg-red-500'}`} 
                          style={{ width: `${session.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-black text-slate-700">{session.percentage}%</span>
                    </div>
                  </td>
                  <td className="py-4 border-y border-slate-50">
                    <span className="text-xs font-bold text-slate-500">{session.timeSpent}</span>
                  </td>
                  <td className="py-4 border-y border-slate-50">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                      session.status === 'Passed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="py-4 pr-6 text-right rounded-r-2xl border-y border-r border-slate-50">
                    <button 
                      onClick={() => setSelectedSession(session)}
                      className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-[#1e3a8a] transition-all shadow-sm border border-transparent hover:border-slate-100"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {filteredHistory.map((session) => (
            <div 
              key={session.id} 
              onClick={() => setSelectedSession(session)}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                    session.status === 'Passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {session.subject}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 leading-none">{session.subjectFullName}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">{session.date}</p>
                  </div>
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                  session.status === 'Passed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {session.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                  <p className="text-sm font-black text-slate-800">{session.score}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Spent</p>
                  <p className="text-sm font-black text-slate-800">{session.timeSpent}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${session.status === 'Passed' ? 'bg-emerald-500' : 'bg-red-500'}`} 
                        style={{ width: `${session.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-black text-slate-700">{session.percentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredHistory.length === 0 && (
          <div className="py-12 text-center text-slate-400 font-medium">
            No test records found matching your filters.
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-[#1e3a8a] p-8 text-white relative">
              <button 
                onClick={() => setSelectedSession(null)}
                className="absolute top-6 right-6 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${
                  selectedSession.status === 'Passed' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {selectedSession.subject}
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{selectedSession.subjectFullName}</h3>
                  <p className="text-blue-200 text-xs font-medium flex items-center gap-1.5">
                    <Calendar size={12} /> {selectedSession.fullDate}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Total Score</p>
                  <p className="text-2xl font-black">{selectedSession.score}</p>
                </div>
                <div className="text-center border-x border-white/10">
                  <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Accuracy</p>
                  <p className="text-2xl font-black">{selectedSession.percentage}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Time Spent</p>
                  <p className="text-2xl font-black">{selectedSession.timeSpent}</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
              {/* Analytics Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={18} className="text-[#1e3a8a]" />
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Performance Breakdown</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cognitive Mastery</p>
                      <p className="text-sm font-black text-slate-800 mt-1">
                        {selectedSession.percentage > 70 ? 'Ready for Application' : 'Focus on Recall'}
                      </p>
                    </div>
                    <Layers size={24} className="text-slate-300" />
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Result Status</p>
                      <p className={`text-sm font-black mt-1 ${
                        selectedSession.status === 'Passed' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {selectedSession.status === 'Passed' ? 'Board Eligible' : 'Remedial Required'}
                      </p>
                    </div>
                    {selectedSession.status === 'Passed' ? <CheckCircle2 size={24} className="text-emerald-500" /> : <AlertCircle size={24} className="text-red-500" />}
                  </div>
                </div>
              </div>

              {/* Topics Explored */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={18} className="text-[#065f46]" />
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Topics Audited</h4>
                </div>
                <div className="space-y-3">
                  {selectedSession.topics.map((topic, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${topic.correct ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {topic.correct ? <CheckCircle2 size={16} /> : <X size={16} />}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{topic.name}</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
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
            <div className="p-8 border-t border-slate-50 flex gap-4">
              <button 
                onClick={() => setSelectedSession(null)}
                className="flex-1 py-4 border border-slate-200 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Close Report
              </button>
              <button 
                onClick={() => {
                  setSelectedSession(null);
                  if (selectedSession.subjectId) {
                    onStartDrill(selectedSession.subjectId);
                  }
                }}
                className="flex-[2] py-4 bg-[#1e3a8a] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all"
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

export default TestHistory;
