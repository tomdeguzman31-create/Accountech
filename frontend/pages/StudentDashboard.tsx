import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  CheckCircle2,
  Download,
  Layers,
  Loader2,
  Search,
  Trophy,
  TrendingUp,
  Zap,
  Target,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../App';
import { MOCK_SUBJECTS } from '../constants';
import {
  analyticsApi,
  announcementApi,
  leaderboardApi,
  type Announcement,
  type LeaderboardEntry,
} from '../services/api';
import { SessionRecord, Subject } from '../types';

interface StudentDashboardProps {
  onStartDrill: (subjectId: string, difficultyTierId?: string) => void;
}

// ---------------------------------------------------------------------------
// Helper: export sessions as CSV
// ---------------------------------------------------------------------------
function exportSessionsCSV(sessions: SessionRecord[]) {
  if (!sessions.length) {
    alert('No sessions to export.');
    return;
  }
  const header = 'Subject,Score,Total,Accuracy (%),Status,Date';
  const rows = sessions.map((s) =>
    [s.subject, s.rawScore, s.totalQuestions, s.percentage.toFixed(1), s.status, s.fullDate].join(
      ',',
    ),
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'accountech_sessions.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------
const Skel: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const StudentDashboard: React.FC<StudentDashboardProps> = ({ onStartDrill }) => {
  const { activeTab, subjects, difficultyTiers, token, user } = useAuth();

  // -- derived subject list (fallback to mock if API not yet loaded)
  const availableSubjects: Subject[] = subjects.length ? subjects : MOCK_SUBJECTS;
  const activeDifficultyTiers = useMemo(
    () => difficultyTiers.filter((tier) => tier.isActive),
    [difficultyTiers],
  );

  // -- local UI state
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    availableSubjects[1]?.id ?? availableSubjects[0]?.id ?? '',
  );
  const [selectedTierId, setSelectedTierId] = useState(activeDifficultyTiers[0]?.id ?? '');
  const [curriculumSearch, setCurriculumSearch] = useState('');
  const [recentDateFrom, setRecentDateFrom] = useState('');
  const [recentDateTo, setRecentDateTo] = useState('');

  // -- analytics data
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [overallAccuracy, setOverallAccuracy] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [passedSessions, setPassedSessions] = useState(0);
  const [recentSessions, setRecentSessions] = useState<SessionRecord[]>([]);
  const [subjectAccuracy, setSubjectAccuracy] = useState<Record<string, number>>({});

  // -- announcements data
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annLoading, setAnnLoading] = useState(false);

  // -- leaderboard data
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Load analytics (on mount / token change)
  // ---------------------------------------------------------------------------
  const loadAnalytics = useCallback(() => {
    if (!token) return;
    setAnalyticsLoading(true);
    analyticsApi
      .my(token)
      .then((payload) => {
        const { summary, sessions } = payload;
        setOverallAccuracy(summary.overallAccuracy ?? 0);
        setTotalSessions(summary.totalSessions ?? 0);
        setPassedSessions(summary.passedSessions ?? 0);

        // Build per-subject accuracy map
        const accMap: Record<string, { total: number; count: number }> = {};
        const mapped = sessions.map((session) => {
          const takenAt = String((session as Record<string, unknown>).takenAt ?? new Date().toISOString());
          const score = Number((session as Record<string, unknown>).score ?? 0);
          const totalQ = Number((session as Record<string, unknown>).totalQuestions ?? 0);
          const pct = Number((session as Record<string, unknown>).accuracyPercentage ?? 0);
          const code = String((session as Record<string, unknown>).subjectCode ?? '');
          const takenDate = new Date(takenAt);

          if (code) {
            if (!accMap[code]) accMap[code] = { total: 0, count: 0 };
            accMap[code].total += pct;
            accMap[code].count += 1;
          }

          return {
            id: String((session as Record<string, unknown>).id),
            subjectId: String((session as Record<string, unknown>).subjectId ?? ''),
            subject: code,
            subjectFullName: String((session as Record<string, unknown>).subjectName ?? ''),
            score: `${score}/${totalQ}`,
            rawScore: score,
            totalQuestions: totalQ,
            date: takenDate.toLocaleDateString(),
            fullDate: takenDate.toLocaleString(),
            timestamp: takenAt,
            status: (pct >= 75 ? 'Passed' : 'Remedial') as 'Passed' | 'Remedial',
            percentage: pct,
            timeSpent: '-',
            topics: [],
          } as SessionRecord;
        });

        // Compute average per subject
        const avg: Record<string, number> = {};
        for (const [code, val] of Object.entries(accMap)) {
          avg[code] = Math.round(val.total / val.count);
        }
        setSubjectAccuracy(avg);
        setRecentSessions(mapped);
      })
      .catch(() => {
        /* silently ignore */
      })
      .finally(() => setAnalyticsLoading(false));
  }, [token]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // ---------------------------------------------------------------------------
  // Load announcements when tab is active
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'ANNOUNCEMENTS' || !token) return;
    setAnnLoading(true);
    announcementApi
      .list(token)
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]))
      .finally(() => setAnnLoading(false));
  }, [activeTab, token]);

  // ---------------------------------------------------------------------------
  // Load leaderboard when tab is active
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'LEADERBOARD' || !token) return;
    setLbLoading(true);
    leaderboardApi
      .get(token)
      .then((rows) => setLeaderboard(rows))
      .catch(() => setLeaderboard([]))
      .finally(() => setLbLoading(false));
  }, [activeTab, token]);

  // Keep selectedSubjectId in sync when subjects load
  useEffect(() => {
    if (availableSubjects.length && !selectedSubjectId) {
      setSelectedSubjectId(availableSubjects[1]?.id ?? availableSubjects[0]?.id ?? '');
    }
  }, [availableSubjects, selectedSubjectId]);

  useEffect(() => {
    if (activeDifficultyTiers.length && !selectedTierId) {
      setSelectedTierId(activeDifficultyTiers[0]?.id ?? '');
    }
  }, [activeDifficultyTiers, selectedTierId]);

  const selectedSubject = availableSubjects.find((s) => s.id === selectedSubjectId) ?? availableSubjects[0];
  const selectedTier = activeDifficultyTiers.find((t) => t.id === selectedTierId) ?? activeDifficultyTiers[0];

  // Filtered recent sessions for the sidebar widget
  const filteredSideSessions = useMemo(() => {
    return recentSessions.filter((s) => {
      if (!recentDateFrom && !recentDateTo) return true;
      const d = new Date(s.timestamp);
      if (recentDateFrom && d < new Date(recentDateFrom)) return false;
      if (recentDateTo && d > new Date(recentDateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [recentSessions, recentDateFrom, recentDateTo]);

  // Filtered curriculum subjects
  const filteredCurriculumSubjects = useMemo(() => {
    if (!curriculumSearch.trim()) return availableSubjects;
    const q = curriculumSearch.toLowerCase();
    return availableSubjects.filter(
      (s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    );
  }, [availableSubjects, curriculumSearch]);

  // Readiness percentage
  const readinessPct = totalSessions > 0 ? Math.round(overallAccuracy) : 0;
  const passRate = totalSessions > 0 ? Math.round((passedSessions / totalSessions) * 100) : 0;

  // ============================================================
  // TAB: CURRICULUM
  // ============================================================
  if (activeTab === 'CURRICULUM') {
    const tierDescriptions = [
      'Knowledge of facts, terms, basic concepts, and answer.',
      'Solving problems in new situations by applying acquired knowledge.',
      'Professional judgement synthesis of multiple concepts and complex audit logic.',
    ];
    const tierStyles = [
      { dot: 'bg-emerald-500', badge: 'bg-[#86efac] text-[#16a34a]', panel: 'bg-[#c7f9d4]' },
      { dot: 'bg-amber-500', badge: 'bg-[#fde68a] text-[#d97706]', panel: 'bg-[#fef9a7]' },
      { dot: 'bg-red-500', badge: 'bg-[#fca5a5] text-[#ef4444]', panel: 'bg-[#fecaca]' },
    ];

    return (
      <div className="mx-auto w-full max-w-[660px] space-y-5 pt-8">
        <section className="relative overflow-hidden rounded-[1rem] bg-[#344f91] px-7 py-6 text-white">
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-base font-black leading-none">Board Curriculum</h1>
              <p className="mt-2 max-w-[380px] text-[13px] font-bold leading-tight text-white/55">
                Subject and difficulty tiers configured by your administrator for board exam preparation.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex h-12 w-[86px] flex-col items-center justify-center rounded-lg border border-white/50 bg-white/10">
                <span className="text-base font-black leading-none">{availableSubjects.length}</span>
                <span className="mt-1 text-[7px] font-black uppercase leading-none text-white">Active Subjects</span>
              </div>
              <div className="flex h-12 w-[86px] flex-col items-center justify-center rounded-lg border border-white/50 bg-white/10">
                <span className="text-base font-black leading-none">{activeDifficultyTiers.length}</span>
                <span className="mt-1 text-[7px] font-black uppercase leading-none text-white">Difficulty Tiers</span>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute right-7 top-3 h-12 w-12 rounded border-[3px] border-white/15" />
          <div className="pointer-events-none absolute right-11 top-5 h-12 w-12 rounded border-[3px] border-white/15" />
        </section>

        <section className="rounded-[1rem] border border-slate-300 bg-white px-5 py-4">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-50 text-[#2f4f93]">
              <BookOpen size={15} />
            </div>
            <h2 className="text-[12px] font-black text-slate-900">Board Subjects</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {availableSubjects.map((subject) => (
              <div key={subject.id} className="flex min-h-[36px] items-center gap-3 rounded bg-[#eeecec] px-3 py-2">
                <span className="flex h-5 min-w-7 items-center justify-center rounded bg-[#2f4f93] px-1.5 text-[7px] font-black text-[#facc15]">
                  {subject.code}
                </span>
                <span className="text-[9px] font-black leading-tight text-slate-950">{subject.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1rem] border border-slate-300 bg-white px-5 py-4">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-50 text-[#16a34a]">
              <Layers size={15} />
            </div>
            <h2 className="text-[12px] font-black text-slate-900">Difficulty Tiers</h2>
          </div>
          <div className="space-y-3">
            {activeDifficultyTiers.map((tier, index) => {
              const style = tierStyles[index] ?? tierStyles[1];
              return (
                <div key={tier.id} className={`rounded px-3 py-3 ${style.panel}`}>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                    <h3 className="text-[10px] font-black leading-none text-slate-950">{tier.name}</h3>
                    <span className={`rounded px-2 py-0.5 text-[6px] font-black uppercase ${style.badge}`}>
                      Weight {tier.weight}
                    </span>
                  </div>
                  <p className="mt-2 pl-4 text-[8px] font-semibold leading-tight text-slate-800">
                    {tier.description || tierDescriptions[index] || tierDescriptions[1]}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  // ============================================================
  // TAB: ANNOUNCEMENTS
  // ============================================================
  if (activeTab === 'ANNOUNCEMENTS') {
    return (
      <div className="mx-auto max-w-4xl pt-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="text-[#1e3a8a]" size={22} />
          <h2 className="text-xl font-black text-slate-900">Announcements</h2>
        </div>
        {annLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
                <Skel className="h-4 w-1/3" />
                <Skel className="h-3 w-full" />
                <Skel className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <Bell size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-bold text-slate-400">No announcements yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-black text-slate-900">{ann.title}</h3>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#2f4f93]">
                    {ann.authorRole}
                  </span>
                </div>
                <p className="text-[12px] font-semibold text-slate-600 leading-relaxed">{ann.content}</p>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  <Calendar size={11} />
                  <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>{ann.authorName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // TAB: LEADERBOARD
  // ============================================================
  if (activeTab === 'LEADERBOARD') {
    const rankStyles = [
      'bg-[#fef3c7] text-[#facc15] border-[#facc15]',
      'bg-slate-100 text-slate-400 border-slate-300',
      'bg-[#f3dfc7] text-[#a16207] border-[#a16207]',
    ];
    const rows = leaderboard;

    return (
      <div className="mx-auto w-full max-w-[860px] pt-8">
        <section className="overflow-hidden rounded-[1rem] border border-slate-300 bg-white">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-[#fef3c7] text-[#facc15]">
              <Trophy size={17} />
            </div>
            <h1 className="text-xl font-black leading-none text-slate-950">Leaderboard</h1>
          </div>

          {lbLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skel className="h-8 w-8 rounded-full" />
                  <Skel className="h-4 flex-1" />
                  <Skel className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center">
              <Trophy size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-bold text-slate-400">No leaderboard data yet. Complete some drills!</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[12px] font-black uppercase text-slate-600">
                      <th className="w-[16%] px-9 pb-3">Rank</th>
                      <th className="w-[22%] px-4 pb-3">Student</th>
                      <th className="w-[24%] px-4 pb-3">Student ID</th>
                      <th className="w-[20%] px-4 pb-3">Avg Accuracy</th>
                      <th className="w-[18%] px-4 pb-3">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((entry, index) => {
                      const rank = entry.rank || index + 1;
                      const isMe = user?.studentId && entry.studentId === user.studentId;
                      return (
                        <tr
                          key={`${entry.studentId ?? entry.name}-${rank}`}
                          className={`border-b border-slate-200 last:border-b-0 ${isMe ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-9 py-4">
                            {rank <= 3 ? (
                              <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${rankStyles[rank - 1]}`}>
                                <Trophy size={13} />
                              </span>
                            ) : (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-[11px] font-black text-slate-950">
                                {rank}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-[11px] font-black text-slate-950">
                            {entry.name} {isMe && <span className="ml-1 text-[#2f4f93] font-black">(You)</span>}
                          </td>
                          <td className="px-4 py-4 text-[11px] font-semibold text-slate-800">{entry.studentId ?? '-'}</td>
                          <td className="px-4 py-4 text-[13px] font-black text-slate-950">{Math.round(entry.avgAccuracy)}%</td>
                          <td className="px-4 py-4 text-[13px] font-black text-slate-950">{entry.sessionsTaken}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {rows.map((entry, index) => {
                  const rank = entry.rank || index + 1;
                  const isMe = user?.studentId && entry.studentId === user.studentId;
                  return (
                    <div
                      key={`${entry.studentId ?? entry.name}-${rank}-mobile`}
                      className={`rounded-lg border border-slate-200 p-4 ${isMe ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {rank <= 3 ? (
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${rankStyles[rank - 1]}`}>
                              <Trophy size={14} />
                            </span>
                          ) : (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-xs font-black text-slate-950">
                              {rank}
                            </span>
                          )}
                          <div>
                            <p className="text-xs font-black text-slate-950">
                              {entry.name} {isMe && <span className="text-[#2f4f93]">(You)</span>}
                            </p>
                            <p className="mt-1 text-[10px] font-semibold text-slate-500">{entry.studentId ?? '-'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-950">{Math.round(entry.avgAccuracy)}%</p>
                          <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">{entry.sessionsTaken} sessions</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  // ============================================================
  // TAB: DASHBOARD (default)
  // ============================================================
  return (
    <div className="mx-auto w-full max-w-[900px] space-y-9 pt-4">
      {/* Hero card */}
      <section className="relative mx-auto min-h-[520px] w-full max-w-[760px] overflow-hidden rounded-[1.8rem] bg-[linear-gradient(145deg,#345397_0%,#2f4c8f_48%,#137744_100%)] px-10 py-12 text-white shadow-sm md:px-14 md:py-16">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.25fr_0.9fr] lg:items-start">
          <div className="pt-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-[10px] font-black uppercase text-[#facc15]">
              <Zap size={14} fill="currentColor" />
              Adaptive Session Active
            </div>
            <h1 className="max-w-md text-3xl font-black leading-tight tracking-tight md:text-4xl">
              Push your limits,{' '}
              <span className="text-[#facc15]">{user?.name?.split(' ')[0] ?? 'Student'}.</span>
            </h1>

            {analyticsLoading ? (
              <div className="mt-3 space-y-2">
                <Skel className="h-3 w-48 bg-white/20" />
              </div>
            ) : (
              <p className="mt-2 text-sm font-semibold text-white/75">
                Your overall readiness is&nbsp;
                <span className="text-[#facc15] font-black">{readinessPct}%</span>
                {totalSessions > 0 && (
                  <span className="text-white/60">
                    {' '}·{' '}{totalSessions} session{totalSessions !== 1 ? 's' : ''} completed
                  </span>
                )}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {passRate > 0 && (
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-3 py-1 text-[11px] font-black text-white">
                  <CheckCircle2 size={12} className="text-[#86efac]" />
                  {passRate}% Pass Rate
                </span>
              )}
              {totalSessions > 0 && (
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-3 py-1 text-[11px] font-black text-white">
                  <Trophy size={12} className="text-[#facc15]" fill="currentColor" />
                  {totalSessions} Sessions
                </span>
              )}
            </div>
          </div>

          {/* Drill launcher */}
          <div className="rounded-lg border border-white/35 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <label className="mb-2 block text-[11px] font-black uppercase text-[#86efac]">Focus Curriculum</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="mb-5 h-10 w-full rounded-lg border-0 bg-white px-3 text-[11px] font-black text-slate-950 outline-none"
            >
              {availableSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} — {subject.name}
                </option>
              ))}
            </select>

            <p className="mb-2 text-[11px] font-black uppercase text-[#86efac]">Difficulty Tier</p>
            <div className="max-h-[170px] space-y-3 overflow-y-auto pr-2">
              {activeDifficultyTiers.map((tier, index) => {
                const isSelected = selectedTier?.id === tier.id;
                const descriptions = [
                  'Knowledge of facts, terms, basic concept, and answers.',
                  'Solving problem in new situations by applying acquired...',
                  'Professional judgment, synthesis of multiple concepts and...',
                ];
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedTierId(tier.id)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                      isSelected
                        ? 'border-[#facc15] bg-[#facc15] text-[#166534]'
                        : 'border-white/25 bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-black">{tier.name}</p>
                      {isSelected && <CheckCircle2 size={14} />}
                    </div>
                    <p className={`mt-1 truncate text-[9px] font-bold ${isSelected ? 'text-[#166534]' : 'text-white/55'}`}>
                      {descriptions[index] ?? descriptions[1]}
                    </p>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => selectedSubject && onStartDrill(selectedSubject.id, selectedTier?.id)}
              className="mt-5 flex h-10 w-full items-center justify-center gap-4 rounded-lg bg-[#facc15] text-[11px] font-black uppercase text-[#047857] transition-transform active:scale-95"
            >
              Launch Adaptive Drill
              <Zap size={14} fill="currentColor" />
            </button>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.8fr]">
        <div className="space-y-8">
          {/* CMA Curriculum Mastery */}
          <div className="rounded-[1.5rem] border border-slate-300 bg-white px-6 py-5">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2f4f93]">
                  <BookOpen size={17} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">CMA Curriculum Mastery</h2>
                  <p className="text-[10px] font-bold text-slate-500">Your accuracy per subject</p>
                </div>
              </div>
              {analyticsLoading ? (
                <Skel className="h-6 w-20" />
              ) : (
                <span className={`rounded px-4 py-1.5 text-[10px] font-black uppercase ${readinessPct >= 75 ? 'bg-[#dcffe9] text-[#16a34a]' : 'bg-amber-50 text-amber-600'}`}>
                  {readinessPct >= 75 ? 'Board Ready' : 'In Progress'}
                </span>
              )}
            </div>

            {analyticsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="grid grid-cols-[42px_1fr] items-center gap-3">
                    <Skel className="h-3 w-full" />
                    <Skel className="h-3 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {availableSubjects.map((subject) => {
                  const acc = subjectAccuracy[subject.code] ?? 0;
                  const color = acc >= 75 ? '#2f4f93' : acc >= 50 ? '#d97706' : '#c6cfdf';
                  return (
                    <div key={subject.id} className="grid grid-cols-[42px_1fr_36px] items-center gap-3">
                      <span className="text-[10px] font-black text-slate-900">{subject.code}</span>
                      <div className="h-3 rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${acc}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-[9px] font-black text-slate-500 text-right">{acc}%</span>
                    </div>
                  );
                })}
                {totalSessions === 0 && (
                  <p className="text-center text-[10px] font-bold text-slate-400 pt-2">
                    Complete drills to see your mastery progress.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Curriculum Explorer */}
          <div>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-[#2f4f93]" />
                <h2 className="text-base font-black text-slate-900">Curriculum Explorer</h2>
              </div>
              <label className="flex h-8 w-full items-center gap-2 rounded border border-slate-300 bg-white px-3 md:w-56">
                <Search size={14} className="text-slate-400" />
                <input
                  value={curriculumSearch}
                  onChange={(e) => setCurriculumSearch(e.target.value)}
                  className="min-w-0 flex-1 text-[10px] font-bold outline-none placeholder:text-slate-400"
                  placeholder="Find subject..."
                />
              </label>
            </div>

            {filteredCurriculumSubjects.length === 0 ? (
              <div className="rounded-lg border border-slate-200 p-6 text-center text-[11px] font-bold text-slate-400">
                No subjects match "{curriculumSearch}"
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredCurriculumSubjects.map((subject) => {
                  const acc = subjectAccuracy[subject.code] ?? 0;
                  const status = acc >= 75 ? 'Competent' : acc >= 50 ? 'Developing' : acc > 0 ? 'Needs Work' : 'Not Started';
                  const statusColor = acc >= 75 ? 'text-[#16a34a] bg-[#dcffe9]' : acc >= 50 ? 'text-amber-600 bg-amber-50' : acc > 0 ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100';
                  const barColor = acc >= 75 ? '#2f4f93' : acc >= 50 ? '#d97706' : '#ef4444';
                  const sessionCount = recentSessions.filter((s) => s.subject === subject.code).length;

                  return (
                    <div key={subject.id} className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <span className="rounded bg-[#2f4f93] px-2 py-1 text-[9px] font-black text-white">{subject.code}</span>
                            <span className={`rounded px-2 py-1 text-[8px] font-black uppercase ${statusColor}`}>{status}</span>
                          </div>
                          <h3 className="line-clamp-2 text-[12px] font-black leading-tight text-slate-900">{subject.name}</h3>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-slate-900">{acc}%</p>
                          <p className="text-[8px] font-bold text-slate-400">{sessionCount} session{sessionCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="mb-3 h-1.5 rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${acc}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-400">
                        <span>
                          {analyticsLoading ? (
                            <Skel className="h-2 w-20 inline-block" />
                          ) : sessionCount > 0 ? (
                            `${sessionCount} drill${sessionCount !== 1 ? 's' : ''} taken`
                          ) : (
                            'No drills yet'
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => onStartDrill(subject.id, selectedTier?.id)}
                          className="text-[#2f4f93] hover:underline"
                        >
                          Enter Drill &gt;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          {/* Recent sessions */}
          <div className="rounded-[1.5rem] border border-slate-300 bg-white px-5 py-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#16a34a]" />
                <h2 className="text-sm font-black text-slate-900">Recent Sessions</h2>
              </div>
              <button
                type="button"
                onClick={() => exportSessionsCSV(recentSessions)}
                className="rounded bg-[#2f4f93] px-3 py-2 text-[10px] font-black text-white flex items-center gap-1 hover:bg-[#1e3a8a] transition-colors"
              >
                <Download size={11} />
                Export
              </button>
            </div>

            {/* Date filter */}
            <div className="mb-5 flex gap-2">
              <input
                type="date"
                value={recentDateFrom}
                onChange={(e) => setRecentDateFrom(e.target.value)}
                className="h-8 min-w-0 flex-1 rounded border border-slate-300 px-2 text-[10px] font-bold text-slate-500 outline-none"
              />
              <span className="pt-2 text-[10px] font-black text-slate-400">to</span>
              <input
                type="date"
                value={recentDateTo}
                onChange={(e) => setRecentDateTo(e.target.value)}
                className="h-8 min-w-0 flex-1 rounded border border-slate-300 px-2 text-[10px] font-bold text-slate-500 outline-none"
              />
            </div>

            {analyticsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skel className="h-7 w-7 rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <Skel className="h-2 w-full" />
                      <Skel className="h-2 w-3/4" />
                    </div>
                    <Skel className="h-6 w-10" />
                  </div>
                ))}
              </div>
            ) : filteredSideSessions.length === 0 ? (
              <div className="py-6 text-center">
                <Target size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-[10px] font-bold text-slate-400">
                  {recentSessions.length === 0 ? 'No sessions yet. Start a drill!' : 'No sessions in the selected date range.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {filteredSideSessions.slice(0, 8).map((session, i) => {
                  const color = session.status === 'Passed' ? '#86efac' : '#fca5a5';
                  return (
                    <div key={session.id ?? i} className="grid grid-cols-[34px_1fr_48px] items-center gap-2 rounded-lg bg-white">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[9px] font-black"
                        style={{ backgroundColor: color, color: session.status === 'Remedial' ? '#dc2626' : '#16a34a' }}
                      >
                        {session.subject}
                      </span>
                      <div>
                        <p className="text-[10px] font-black text-slate-900">{session.score}</p>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-[#16e04f]" style={{ width: `${session.percentage}%` }} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-bold text-slate-400">{session.date}</p>
                        <p className={`text-[8px] font-black uppercase ${session.status === 'Remedial' ? 'text-red-600' : 'text-[#16a34a]'}`}>
                          {session.status}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {recentSessions.length > 0 && (
              <button
                type="button"
                onClick={() => exportSessionsCSV(filteredSideSessions.length ? filteredSideSessions : recentSessions)}
                className="mt-5 h-10 w-full rounded-lg bg-slate-200 text-[10px] font-black text-slate-500 flex items-center justify-center gap-2 hover:bg-slate-300 transition-colors"
              >
                <Download size={12} />
                Export Data
              </button>
            )}
          </div>

          {/* Stats card */}
          <div className="rounded-[1.2rem] bg-[#355396] p-7 text-white">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-[#facc15]" />
              <h3 className="text-base font-black">Your Stats</h3>
            </div>
            {analyticsLoading ? (
              <div className="space-y-2 mt-2">
                <Skel className="h-3 w-full bg-white/20" />
                <Skel className="h-3 w-3/4 bg-white/20" />
              </div>
            ) : totalSessions === 0 ? (
              <p className="mt-2 text-xs font-bold leading-snug text-white/75">
                You haven't taken any drills yet. Launch your first drill to start tracking your progress!
              </p>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/10 p-3 text-center">
                    <p className="text-xl font-black text-[#facc15]">{readinessPct}%</p>
                    <p className="text-[8px] font-black uppercase text-white/60 mt-1">Avg Accuracy</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-3 text-center">
                    <p className="text-xl font-black text-[#86efac]">{passRate}%</p>
                    <p className="text-[8px] font-black uppercase text-white/60 mt-1">Pass Rate</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-3 text-center">
                    <p className="text-xl font-black text-white">{totalSessions}</p>
                    <p className="text-[8px] font-black uppercase text-white/60 mt-1">Total Sessions</p>
                  </div>
                  <div className="rounded-lg bg-white/10 p-3 text-center">
                    <p className="text-xl font-black text-white">{passedSessions}</p>
                    <p className="text-[8px] font-black uppercase text-white/60 mt-1">Passed</p>
                  </div>
                </div>
                <p className="mt-4 text-[10px] font-bold leading-snug text-white/60">
                  Based on your {totalSessions} completed drill session{totalSessions !== 1 ? 's' : ''}.
                </p>
              </>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
};

export default StudentDashboard;
