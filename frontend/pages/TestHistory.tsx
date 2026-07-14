import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Layers,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '../App';
import { Skeleton } from '../components/Skeleton';
import { analyticsApi } from '../services/api';
import { SessionRecord } from '../types';

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
    return recentSessions.filter((session) => {
      const matchesSearch =
        session.subjectFullName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
        session.subject.toLowerCase().includes(historySearchTerm.toLowerCase());
      const matchesSubject = historySubjectFilter === 'All' || session.subject === historySubjectFilter;
      const matchesStatus = historyStatusFilter === 'All' || session.status === historyStatusFilter;
      const sessionDate = new Date(session.timestamp);
      const matchesStartDate = !startDate || sessionDate >= new Date(startDate);
      const matchesEndDate = !endDate || sessionDate <= new Date(endDate);

      return matchesSearch && matchesSubject && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [endDate, historySearchTerm, historyStatusFilter, historySubjectFilter, recentSessions, startDate]);

  const handleDownload = () => {
    const headers = ['Subject', 'Score', 'Percentage', 'Date', 'Status', 'Time Spent'];
    const csvContent = [
      headers.join(','),
      ...filteredHistory.map((session) =>
        [
          session.subject,
          session.score,
          `${session.percentage}%`,
          session.fullDate,
          session.status,
          session.timeSpent,
        ].join(','),
      ),
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

  const clearFilters = () => {
    setHistorySearchTerm('');
    setHistorySubjectFilter('All');
    setHistoryStatusFilter('All');
    setStartDate('');
    setEndDate('');
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[780px] space-y-4 pt-6 animate-pulse">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[780px] pt-6">
      <section className="rounded-[1rem] border border-slate-300 bg-white px-4 py-4">
        <div className="mb-4 flex items-start justify-between gap-4 px-4">
          <div className="flex items-start gap-2">
            <div className="mt-1 flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-700">
              <Activity size={16} />
            </div>
            <div>
              <h1 className="text-base font-black leading-none text-slate-950">Comprehensive Test History</h1>
              <p className="mt-1 text-[10px] font-bold leading-none text-slate-500">Audit trail of all adaptive drill attempts</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="flex h-8 items-center justify-center gap-2 rounded bg-[#243f84] px-6 text-[10px] font-black text-white transition-colors hover:bg-[#1e3a8a]"
          >
            <Download size={12} />
            Export Data
          </button>
        </div>

        <div className="mb-5 rounded-lg border border-slate-300 bg-slate-50 px-9 py-3">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search by subject or topic..."
              className="h-6 w-full rounded border border-slate-300 bg-white pl-8 pr-3 text-[9px] font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#1e3a8a]"
              value={historySearchTerm}
              onChange={(event) => setHistorySearchTerm(event.target.value)}
            />
          </label>

          <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto_1fr_1fr_1fr_auto] md:items-center">
            <label className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                type="date"
                className="h-7 w-full rounded border border-slate-300 bg-white pl-7 pr-2 text-[9px] font-semibold text-slate-600 outline-none focus:border-[#1e3a8a]"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <span className="hidden text-[9px] font-black text-slate-400 md:block">TO</span>
            <label className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                type="date"
                className="h-7 w-full rounded border border-slate-300 bg-white pl-7 pr-2 text-[9px] font-semibold text-slate-600 outline-none focus:border-[#1e3a8a]"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
            <label className="relative">
              <Filter className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <select
                className="h-7 w-full appearance-none rounded border border-slate-300 bg-white pl-7 pr-7 text-[9px] font-semibold text-slate-600 outline-none focus:border-[#1e3a8a]"
                value={historySubjectFilter}
                onChange={(event) => setHistorySubjectFilter(event.target.value)}
              >
                <option value="All">All Subjects</option>
                {Array.from(new Set(recentSessions.map((session) => session.subject))).map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
            </label>
            <label className="relative">
              <select
                className="h-7 w-full appearance-none rounded border border-slate-300 bg-white pl-4 pr-7 text-[9px] font-semibold text-slate-600 outline-none focus:border-[#1e3a8a]"
                value={historyStatusFilter}
                onChange={(event) => setHistoryStatusFilter(event.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Passed">Passed</option>
                <option value="Remedial">Failed</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
            </label>
            <button
              type="button"
              onClick={clearFilters}
              className="flex h-7 w-7 items-center justify-center rounded bg-slate-300 text-slate-700 hover:bg-slate-400 hover:text-white"
              title="Reset filters"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        <div className="hidden overflow-x-auto px-3 md:block">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-[8px] font-black uppercase text-slate-500">
                <th className="pb-1 pl-2">Subject</th>
                <th className="pb-1">Date & Time</th>
                <th className="pb-1">Score</th>
                <th className="pb-1">Accuracy</th>
                <th className="pb-1">Time Spent</th>
                <th className="pb-1">Status</th>
                <th className="pb-1 pr-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((session) => {
                const isPassed = session.status === 'Passed';
                return (
                  <tr key={session.id} className="rounded-lg bg-white">
                    <td className="rounded-l-lg border-y border-l border-slate-300 py-4 pl-2">
                      <div className="flex min-w-[210px] items-center gap-2">
                        <span
                          className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-[8px] font-black ${
                            isPassed ? 'bg-[#bbf7d0] text-[#16a34a]' : 'bg-[#fecaca] text-[#ef4444]'
                          }`}
                        >
                          {session.subject}
                        </span>
                        <span className="max-w-[210px] text-[10px] font-black leading-tight text-slate-950">
                          {session.subjectFullName}
                        </span>
                      </div>
                    </td>
                    <td className="border-y border-slate-300 py-4 text-[9px] font-black text-slate-950">{session.fullDate}</td>
                    <td className="border-y border-slate-300 py-4 text-[10px] font-black text-slate-950">{session.score}</td>
                    <td className="border-y border-slate-300 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-12 bg-slate-300">
                          <div
                            className={`h-full ${isPassed ? 'bg-[#16a34a]' : 'bg-[#ef4444]'}`}
                            style={{ width: `${session.percentage}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-black text-slate-950">{session.percentage}%</span>
                      </div>
                    </td>
                    <td className="border-y border-slate-300 py-4 text-[9px] font-black text-slate-950">{session.timeSpent}</td>
                    <td className="border-y border-slate-300 py-4">
                      <span
                        className={`rounded px-2 py-1 text-[7px] font-black uppercase ${
                          isPassed ? 'bg-[#bbf7d0] text-[#16a34a]' : 'bg-[#fecaca] text-[#ef4444]'
                        }`}
                      >
                        {isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="rounded-r-lg border-y border-r border-slate-300 py-4 pr-5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedSession(session)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm hover:text-[#1e3a8a]"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {filteredHistory.map((session) => {
            const isPassed = session.status === 'Passed';
            return (
              <button
                type="button"
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="w-full rounded-lg border border-slate-300 bg-white p-4 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-1 text-[8px] font-black ${isPassed ? 'bg-[#bbf7d0] text-[#16a34a]' : 'bg-[#fecaca] text-[#ef4444]'}`}>
                      {session.subject}
                    </span>
                    <span className="text-[11px] font-black leading-tight text-slate-950">{session.subjectFullName}</span>
                  </div>
                  <ChevronRight size={15} className="shrink-0 text-slate-400" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-[9px] font-black text-slate-700">
                  <span>{session.score}</span>
                  <span>{session.percentage}%</span>
                  <span className={isPassed ? 'text-[#16a34a]' : 'text-[#ef4444]'}>{isPassed ? 'Passed' : 'Failed'}</span>
                </div>
              </button>
            );
          })}
        </div>

        {filteredHistory.length === 0 && (
          <div className="px-3 py-10 text-center text-xs font-bold text-slate-400">
            No test records found matching your filters.
          </div>
        )}
      </section>

      {selectedSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="relative bg-[#1e3a8a] p-8 text-white">
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="absolute right-6 top-6 rounded-xl bg-white/10 p-2 transition-colors hover:bg-white/20"
              >
                <X size={20} />
              </button>

              <div className="mb-4 flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black shadow-lg ${
                  selectedSession.status === 'Passed' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {selectedSession.subject}
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{selectedSession.subjectFullName}</h3>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-blue-200">
                    <Calendar size={12} /> {selectedSession.fullDate}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
                <div className="text-center">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-blue-300">Total Score</p>
                  <p className="text-2xl font-black">{selectedSession.score}</p>
                </div>
                <div className="border-x border-white/10 text-center">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-blue-300">Accuracy</p>
                  <p className="text-2xl font-black">{selectedSession.percentage}%</p>
                </div>
                <div className="text-center">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-blue-300">Time Spent</p>
                  <p className="text-2xl font-black">{selectedSession.timeSpent}</p>
                </div>
              </div>
            </div>

            <div className="max-h-[60vh] space-y-8 overflow-y-auto p-8">
              <div className="space-y-4">
                <div className="mb-2 flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#1e3a8a]" />
                  <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">Performance Breakdown</h4>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cognitive Mastery</p>
                      <p className="mt-1 text-sm font-black text-slate-800">
                        {selectedSession.percentage > 70 ? 'Ready for Application' : 'Focus on Recall'}
                      </p>
                    </div>
                    <Layers size={24} className="text-slate-300" />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Result Status</p>
                      <p className={`mt-1 text-sm font-black ${selectedSession.status === 'Passed' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {selectedSession.status === 'Passed' ? 'Board Eligible' : 'Remedial Required'}
                      </p>
                    </div>
                    {selectedSession.status === 'Passed' ? (
                      <CheckCircle2 size={24} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={24} className="text-red-500" />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="mb-2 flex items-center gap-2">
                  <FileText size={18} className="text-[#065f46]" />
                  <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">Topics Audited</h4>
                </div>
                <div className="space-y-3">
                  {selectedSession.topics.length ? (
                    selectedSession.topics.map((topic, index) => (
                      <div key={index} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg p-1.5 ${topic.correct ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {topic.correct ? <CheckCircle2 size={16} /> : <X size={16} />}
                          </div>
                          <span className="text-sm font-bold text-slate-700">{topic.name}</span>
                        </div>
                        <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                          topic.correct ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {topic.correct ? 'Mastered' : 'Gap Found'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs font-bold text-slate-400">
                      No topic details were recorded for this attempt.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 border-t border-slate-50 p-8">
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="flex-1 rounded-2xl border border-slate-200 py-4 text-xs font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-slate-50"
              >
                Close Report
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSession(null);
                  if (selectedSession.subjectId) {
                    onStartDrill(selectedSession.subjectId);
                  }
                }}
                className="flex-[2] rounded-2xl bg-[#1e3a8a] py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-95"
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
