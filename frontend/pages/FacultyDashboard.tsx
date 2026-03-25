
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Trash2, Search, Loader2, Sparkles, UserPlus, Users, BarChart3, BookOpen, Layers,
  Eye, FileText, AlertCircle, CheckCircle2,
  ChevronDown, X, Save, ToggleLeft, ToggleRight, Database, Edit2,
  UploadCloud, FileType, Info, CheckSquare, Square, Download,
  PieChart as PieIcon, Target, Calendar, Bell, Trophy, Megaphone, Send, Medal
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Question, AllowedStudent } from '../types';
import { useAuth } from '../App';
import { MOCK_SUBJECTS, MOCK_QUESTIONS, COLORS } from '../constants';
import {
  analyticsApi,
  announcementApi,
  leaderboardApi,
  parserUpload,
  questionApi,
  studentApi,
  subjectApi,
  type Announcement,
  type FacultyInstructionalReport,
  type LeaderboardEntry,
} from '../services/api';
import { Skeleton, TableSkeleton, DashboardSkeleton, RosterSkeleton, QuestionBankSkeleton } from '../components/Skeleton';

const ROSTER_PAGE_SIZE = 5;

const FacultyDashboard: React.FC = () => {
  const { token, subjects, allowedStudents, setAllowedStudents, refreshAllowedStudents, activeTab, setActiveTab, difficultyTiers } = useAuth();
  const availableSubjects = subjects.length ? subjects : MOCK_SUBJECTS;
  const activeDifficultyTiers = useMemo(() => difficultyTiers.filter((tier) => tier.isActive), [difficultyTiers]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Parser State
  const [isParsing, setIsParsing] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [uploadText, setUploadText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parserMode, setParserMode] = useState<'DOCUMENT' | 'TEXT'>('DOCUMENT');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDifficultyId, setSelectedDifficultyId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Question Bank State
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [bankSearch, setBankSearch] = useState('');
  const [bankSubjectFilter, setBankSubjectFilter] = useState('ALL');
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState('ALL');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isAssigningContent, setIsAssigningContent] = useState(false);
  const [assignContentMessage, setAssignContentMessage] = useState('');
  const [assignContentError, setAssignContentError] = useState('');

  // Parser auto-assign result state
  const [parserAssignResult, setParserAssignResult] = useState<{ items: number; students: number } | null>(null);

  const getRankBadgeClasses = (rank: number): string => {
    if (rank === 1) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (rank === 2) return 'bg-slate-200 text-slate-700 border-slate-300';
    if (rank === 3) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      const matchesSearch = q.content.toLowerCase().includes(bankSearch.toLowerCase()) || 
                           q.topic.toLowerCase().includes(bankSearch.toLowerCase());
      const matchesSubject = bankSubjectFilter === 'ALL' || q.subjectId === bankSubjectFilter;
      const selectedDifficultyLabel = bankDifficultyFilter.match(/\((.*?)\)/)?.[1] ?? bankDifficultyFilter;
      const matchesDifficulty = bankDifficultyFilter === 'ALL' || q.difficulty === selectedDifficultyLabel;
      return matchesSearch && matchesSubject && matchesDifficulty;
    });
  }, [allQuestions, bankSearch, bankSubjectFilter, bankDifficultyFilter]);

  // Enrollment State
  const [bulkInput, setBulkInput] = useState('');
  const [enrollmentError, setEnrollmentError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Roster Filter State
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterAccuracyFilter, setRosterAccuracyFilter] = useState<'ALL' | 'PENDING' | 'PASSED' | 'FAILED'>('ALL');
  const [rosterPage, setRosterPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Announcements + Leaderboard State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showComposeAnnouncement, setShowComposeAnnouncement] = useState(false);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [announcementPosting, setAnnouncementPosting] = useState(false);
  const [instructionalReport, setInstructionalReport] = useState<FacultyInstructionalReport | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [lbSubjects, setLbSubjects] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [lbSubjectId, setLbSubjectId] = useState('');
  const [lbDifficulty, setLbDifficulty] = useState('');
  const [lbDateFrom, setLbDateFrom] = useState('');
  const [lbDateTo, setLbDateTo] = useState('');

  const getAccuracyScore = (student: AllowedStudent): number => {
    const parsed = Number(student.accuracyScore ?? 0);
    if (!Number.isFinite(parsed)) return 0;
    if (parsed < 0) return 0;
    if (parsed > 100) return 100;
    return parsed;
  };

  const filteredRoster = useMemo(() => {
    let result = allowedStudents.filter(s => {
      const matchesSearch = s.studentId.toLowerCase().includes(rosterSearch.toLowerCase()) || 
                           s.email.toLowerCase().includes(rosterSearch.toLowerCase());
      
      if (!matchesSearch) return false;

      const score = getAccuracyScore(s);
      if (rosterAccuracyFilter === 'PENDING') return score === 0;
      if (rosterAccuracyFilter === 'PASSED') return score >= 75;
      if (rosterAccuracyFilter === 'FAILED') return score > 0 && score < 75;
      return true;
    });

    return result.sort((a, b) => getAccuracyScore(b) - getAccuracyScore(a));
  }, [allowedStudents, rosterSearch, rosterAccuracyFilter]);

  const rosterPageCount = Math.max(1, Math.ceil(filteredRoster.length / ROSTER_PAGE_SIZE));

  const paginatedRoster = useMemo(() => {
    const start = (rosterPage - 1) * ROSTER_PAGE_SIZE;
    return filteredRoster.slice(start, start + ROSTER_PAGE_SIZE);
  }, [filteredRoster, rosterPage]);

  useEffect(() => {
    setRosterPage(1);
  }, [rosterSearch, rosterAccuracyFilter, allowedStudents.length]);

  const normalizeQuestionRows = (rows: Array<Record<string, unknown>>): Question[] => {
    return rows.map((row) => ({
      id: String(row.id),
      subjectId: String(row.subjectId),
      topic: String(row.topic),
      difficulty: String(row.difficulty),
      content: String(row.content),
      options: {
        A: String(row.optionA ?? ''),
        B: String(row.optionB ?? ''),
        C: String(row.optionC ?? ''),
        D: String(row.optionD ?? ''),
      },
      correctAnswer: String(row.correctAnswer ?? 'A') as 'A' | 'B' | 'C' | 'D',
      reference: String(row.referenceText ?? ''),
      isActive: true,
    }));
  };

  const toBackendDifficulty = (label: string): 'Easy' | 'Average' | 'Difficult' => {
    const normalized = label.toLowerCase();
    if (normalized.includes('difficult') || normalized.includes('evaluation')) return 'Difficult';
    if (normalized.includes('easy') || normalized.includes('recall')) return 'Easy';
    return 'Average';
  };

  const toBackendDifficultyFromTierId = (tierId: string): 'Easy' | 'Average' | 'Difficult' => {
    const tier = activeDifficultyTiers.find((item) => item.id === tierId);
    if (!tier) return 'Average';
    if (tier.weight <= 1) return 'Easy';
    if (tier.weight >= 3) return 'Difficult';
    return 'Average';
  };

  useEffect(() => {
    if (!activeDifficultyTiers.length) {
      setSelectedDifficultyId('');
      return;
    }

    const selectedStillValid = activeDifficultyTiers.some((tier) => tier.id === selectedDifficultyId);
    if (!selectedStillValid) {
      setSelectedDifficultyId(activeDifficultyTiers[0].id);
    }
  }, [activeDifficultyTiers, selectedDifficultyId]);

  useEffect(() => {
    if (!availableSubjects.length) return;
    const isValid = availableSubjects.some((s) => s.id === selectedSubjectId);
    if (!isValid) {
      setSelectedSubjectId(availableSubjects[0].id);
    }
  }, [availableSubjects]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        if (['INSIGHTS', 'ROSTER', 'ENROLLMENT'].includes(activeTab)) {
          await refreshAllowedStudents();
        }

        if (activeTab === 'QUESTION_BANK' || activeTab === 'INSIGHTS') {
          const rows = await questionApi.list(token);
          setAllQuestions(normalizeQuestionRows(rows));
        }

        if (activeTab === 'ANNOUNCEMENTS') {
          const rows = await announcementApi.list(token);
          setAnnouncements(rows);
        }

        if (activeTab === 'INSIGHTS') {
          const report = await analyticsApi.facultyInstructionalReport(token);
          setInstructionalReport(report);
        }
      } catch {
        if (activeTab === 'INSIGHTS') {
          setInstructionalReport(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();
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

  const parseQuestionsFromText = (
    rawText: string,
    subjectId: string,
    preferredDifficulty: string,
  ): Question[] => {
    const normalized = rawText.replace(/\r/g, '').trim();
    if (!normalized) return [];

    const numberedChunks = normalized
      .split(/\n(?=\s*\d+[\.)]\s)/g)
      .map((v) => v.trim())
      .filter(Boolean);

    const chunks =
      numberedChunks.length > 1 || /^\s*\d+[\.)]\s/.test(normalized)
        ? numberedChunks
        : normalized
            .split(/\n\s*\n/g)
            .map((v) => v.trim())
            .filter(Boolean);

    const parsed: Question[] = [];

    for (const chunk of chunks) {
      const header = chunk.match(/^\s*(?:\d+[\.)]\s*)?([\s\S]*?)(?=\n\s*A[\.):\-]?\s)/i);
      if (!header) continue;

      const content = header[1].trim();
      const optionA = chunk.match(/\n\s*A[\.):\-]?\s*([\s\S]*?)(?=\n\s*B[\.):\-]?\s)/i)?.[1]?.trim() ?? '';
      const optionB = chunk.match(/\n\s*B[\.):\-]?\s*([\s\S]*?)(?=\n\s*C[\.):\-]?\s)/i)?.[1]?.trim() ?? '';
      const optionC = chunk.match(/\n\s*C[\.):\-]?\s*([\s\S]*?)(?=\n\s*D[\.):\-]?\s)/i)?.[1]?.trim() ?? '';
      const optionD =
        chunk.match(/\n\s*D[\.):\-]?\s*([\s\S]*?)(?=\n\s*(?:[^A-Za-z\n]*\s*)?(?:Ans(?:wer)?|Key|Ref)\b|\s*$)/i)?.[1]?.trim() ?? '';

      if (!optionA || !optionB || !optionC || !optionD) continue;

      const answer =
        (chunk.match(/\n\s*(?:[^A-Za-z\n]*\s*)?(?:Ans(?:wer)?|Key)\s*[:\-]?\s*([ABCD])/i)?.[1]?.toUpperCase() as
          | 'A'
          | 'B'
          | 'C'
          | 'D'
          | undefined) ?? 'A';

      const reference = chunk.match(/\n\s*Ref\s*[:\-]?\s*([\s\S]*)$/i)?.[1]?.trim() ?? '';
      const topic = content.split('?')[0].trim().slice(0, 80) || 'Board Item';
      const difficultyLabel = preferredDifficulty.match(/\((.*?)\)/)?.[1] ?? preferredDifficulty;

      parsed.push({
        id: Math.random().toString(36).substr(2, 9),
        subjectId,
        topic,
        difficulty: difficultyLabel,
        content,
        options: {
          A: optionA,
          B: optionB,
          C: optionC,
          D: optionD,
        },
        correctAnswer: answer,
        reference,
        isActive: true,
      });
    }

    return parsed;
  };

  const handleSimulateUpload = async () => {
    if (parserMode === 'TEXT' && !uploadText) return;
    if (parserMode === 'DOCUMENT' && !selectedFile) return;
    if (!token) {
      setEnrollmentError('Session expired. Please sign in again.');
      return;
    }

    setIsParsing(true);
    try {
      let resolvedSubjectId = selectedSubjectId;
      if (!/^[a-f\d]{24}$/i.test(resolvedSubjectId)) {
        const selectedSubject = availableSubjects.find((s) => s.id === selectedSubjectId);
        const liveSubjects = subjects.length ? subjects : await subjectApi.list(token).catch(() => []);
        const mapped = liveSubjects.find((s) => {
          if (selectedSubject) {
            return s.code === selectedSubject.code || s.name === selectedSubject.name;
          }
          return s.code === selectedSubjectId || s.name === selectedSubjectId;
        });

        if (mapped) {
          resolvedSubjectId = mapped.id;
          setSelectedSubjectId(mapped.id);
        }
      }

      if (!/^[a-f\d]{24}$/i.test(resolvedSubjectId)) {
        throw new Error('Cannot map selected subject to a live backend subject. Please reload and try again.');
      }

      let formattedResults: Question[] = [];

      if (parserMode === 'DOCUMENT' && selectedFile) {
        const payload = await parserUpload(token, selectedFile);
        const selectedDifficultyLabel =
          activeDifficultyTiers.find((tier) => tier.id === selectedDifficultyId)?.name ?? '';
        formattedResults = payload.questions.map((q: any) => {
          const difficultyLabel = selectedDifficultyLabel.match(/\((.*?)\)/)?.[1] ?? selectedDifficultyLabel;
          return {
            id: Math.random().toString(36).substr(2, 9),
            subjectId: resolvedSubjectId,
            topic: String(q.content ?? 'Board Item').split('?')[0].slice(0, 80),
            difficulty: difficultyLabel,
            content: String(q.content ?? ''),
            options: {
              A: String(q.options?.A ?? ''),
              B: String(q.options?.B ?? ''),
              C: String(q.options?.C ?? ''),
              D: String(q.options?.D ?? ''),
            },
            correctAnswer: String(q.answer ?? 'A') as 'A' | 'B' | 'C' | 'D',
            reference: String(q.reference ?? ''),
            isActive: true,
          };
        });
      }

      if (parserMode === 'TEXT') {
        const selectedDifficultyLabel =
          activeDifficultyTiers.find((tier) => tier.id === selectedDifficultyId)?.name ?? '';
        formattedResults = parseQuestionsFromText(uploadText, resolvedSubjectId, selectedDifficultyLabel);
      }

      if (!formattedResults.length) {
        throw new Error('No valid questions found. Use numbered items with A-D options and an answer key.');
      }

      await questionApi.bulk(
        token,
        formattedResults.map((q) => ({
          subjectId: q.subjectId,
          topic: q.topic,
          difficulty: toBackendDifficulty(String(q.difficulty)),
          content: q.content,
          options: q.options,
          correctAnswer: q.correctAnswer,
          referenceText: q.reference,
        })),
      );

      const rows = await questionApi.list(token);
      setAllQuestions(normalizeQuestionRows(rows));
      setParsedQuestions(formattedResults);

      // Auto-assign parsed questions to all enrolled students immediately
      const backendDifficulty = toBackendDifficultyFromTierId(selectedDifficultyId);
      try {
        const assignResult = await studentApi.assignContent(token, {
          placements: [{ subjectId: resolvedSubjectId, difficulty: backendDifficulty }],
        });
        setParserAssignResult({ items: formattedResults.length, students: assignResult.studentsAffected });
      } catch {
        // Assignment is best-effort — questions are saved even if no students enrolled yet
        setParserAssignResult({ items: formattedResults.length, students: 0 });
      }

      // Clear inputs after success
      setUploadText('');
      setSelectedFile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Parser failed. Please try again.';
      alert(message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (
        file.type === 'application/pdf' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        setSelectedFile(file);
      } else {
        alert('Only .pdf and .docx are supported in File Drop mode. Use Manual Paste for plain text.');
      }
    }
  };

  const handleWhitelistStudents = () => {
    setEnrollmentError('');
    setSuccessMessage('');
    if (!bulkInput.trim()) return setEnrollmentError('Input cannot be empty.');

    const lines = bulkInput.split('\n');
    const newStudents: AllowedStudent[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      if (!line.trim()) return;
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 2 || parts.length > 4) {
        errors.push(`Line ${index + 1}: Use studentId,email[,section][,department].`);
        return;
      }
      const [id, email, section, department] = parts;
      if (allowedStudents.some(s => s.studentId === id || s.email === email)) {
        errors.push(`Line ${index + 1}: Duplicate.`);
      } else {
        newStudents.push({
          studentId: id,
          email,
          section: section || undefined,
          department: department || undefined,
        });
      }
    });

    if (errors.length > 0) return setEnrollmentError(errors.join(' '));

    if (!token) {
      setEnrollmentError('Session expired. Please sign in again.');
      return;
    }

    studentApi
      .bulkEnroll(token, newStudents)
      .then(async () => {
        await refreshAllowedStudents();
        setBulkInput('');
        setSuccessMessage(`Enrolled ${newStudents.length} students.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Enrollment failed.';
        setEnrollmentError(message);
      });
  };

  const handleRemoveStudent = (studentId: string) => {
    if (!token) return;
    studentApi
      .remove(token, studentId)
      .then(() => refreshAllowedStudents())
      .catch(() => undefined);
  };

  const handleToggleQuestionStatus = (id: string) => {
    setAllQuestions(prev => prev.map(q => q.id === id ? { ...q, isActive: !q.isActive } : q));
  };

  const handleDeleteQuestion = (id: string) => {
    setAllQuestions(prev => prev.filter(q => q.id !== id));
    setSelectedQuestionIds(prev => prev.filter(qid => qid !== id));
  };

  const handleBulkToggleStatus = (active: boolean) => {
    setAllQuestions(prev => prev.map(q => selectedQuestionIds.includes(q.id) ? { ...q, isActive: active } : q));
    setSelectedQuestionIds([]);
  };

  const handleBulkDelete = () => {
    setAllQuestions(prev => prev.filter(q => !selectedQuestionIds.includes(q.id)));
    setSelectedQuestionIds([]);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(id) ? prev.filter(qid => qid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestionIds.length === filteredQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(filteredQuestions.map(q => q.id));
    }
  };

  const handleAssignSelectedContent = async () => {
    setAssignContentError('');
    setAssignContentMessage('');

    if (!token) {
      setAssignContentError('Session expired. Please sign in again.');
      return;
    }

    const selectedPlacements: Array<{
      subjectId: string;
      difficulty: 'Easy' | 'Average' | 'Difficult';
    }> = Array.from(
      new Map<string, { subjectId: string; difficulty: 'Easy' | 'Average' | 'Difficult' }>(
        allQuestions
          .filter((q) => selectedQuestionIds.includes(q.id))
          .map((q) => ({
            subjectId: String(q.subjectId),
            difficulty: toBackendDifficulty(String(q.difficulty)),
          }))
          .filter((placement) => placement.subjectId.length > 0)
          .map((placement) => [`${placement.subjectId}::${placement.difficulty}`, placement]),
      ).values(),
    );

    if (!selectedPlacements.length) {
      setAssignContentError('Select at least one question with a valid subject.');
      return;
    }

    setIsAssigningContent(true);
    try {
      const response = await studentApi.assignContent(token, { placements: selectedPlacements });
      setAssignContentMessage(
        `Assigned ${response.subjectsAssigned} subject/difficulty placement(s) to ${response.studentsAffected} student(s).`,
      );
      setSelectedQuestionIds([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to assign exam content.';
      setAssignContentError(message);
    } finally {
      setIsAssigningContent(false);
    }
  };

  const stats = useMemo(() => {
    const rosterAccuracies = allowedStudents.map((student) => getAccuracyScore(student));
    const total = rosterAccuracies.length;
    const avg = total > 0
      ? rosterAccuracies.reduce((acc, score) => acc + score, 0) / total
      : 0;
    // Only count students who have drilled (score > 0) for readiness buckets
    const drilledScores = rosterAccuracies.filter((score) => score > 0);
    const failed = drilledScores.filter((score) => score < 75).length;
    const passed = drilledScores.filter((score) => score >= 75).length;

    return { total, avg, failed, passed };
  }, [allowedStudents]);

  const readinessData = [
    { name: 'Passed', value: stats.passed, color: '#10b981' },
    { name: 'Failed', value: stats.failed, color: '#ef4444' },
  ];

  const topPerformers = [...allowedStudents]
    .sort((a, b) => getAccuracyScore(b) - getAccuracyScore(a))
    .slice(0, 5)
    .map(s => ({ name: s.studentId, score: getAccuracyScore(s) }));

  const failedStudents = useMemo(
    () =>
      [...allowedStudents]
        .filter((student) => getAccuracyScore(student) < 75)
        .sort((a, b) => getAccuracyScore(a) - getAccuracyScore(b)),
    [allowedStudents],
  );

  const atRiskStudents = instructionalReport?.atRiskStudents ?? [];
  const topicMasteryRows = instructionalReport?.topicMastery ?? [];
  const top10Leaderboard = instructionalReport?.topLeaderboard ?? [];

  const downloadAnalytics = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeTab === 'ROSTER') {
      csvContent += "Student ID,Email,Accuracy Score,Status\n";
      allowedStudents.forEach(s => {
        const score = getAccuracyScore(s);
        const status = score >= 75 ? "PASSED" : "FAILED";
        csvContent += `${s.studentId},${s.email},${score}%,${status}\n`;
      });
    } else if (activeTab === 'QUESTION_BANK') {
      csvContent += "ID,Subject,Topic,Difficulty,Status\n";
      allQuestions.forEach(q => {
        const subject = MOCK_SUBJECTS.find(s => s.id === q.subjectId)?.code || q.subjectId;
        csvContent += `${q.id},${subject},${q.topic},${q.difficulty},${q.isActive ? 'Active' : 'Inactive'}\n`;
      });
    } else {
      // General Insights
      csvContent += "Metric,Value\n";
      if (startDate || endDate) {
        csvContent += `Date Range,${startDate || 'N/A'} to ${endDate || 'N/A'}\n`;
      }
      csvContent += `Board Readiness,${stats.avg.toFixed(1)}%\n`;
      csvContent += `Total Questions,${allQuestions.length}\n`;
      csvContent += `Failed Students,${stats.failed}\n`;
      csvContent += `Passed Students,${stats.passed}\n`;
      csvContent += `Total Enrolled Students,${stats.total}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `faculty_analytics_${activeTab.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newAnnouncementTitle.trim() || !newAnnouncementContent.trim()) return;
    setAnnouncementPosting(true);
    try {
      await announcementApi.create(token, {
        title: newAnnouncementTitle.trim(),
        content: newAnnouncementContent.trim(),
      });
      const rows = await announcementApi.list(token);
      setAnnouncements(rows);
      setNewAnnouncementTitle('');
      setNewAnnouncementContent('');
      setShowComposeAnnouncement(false);
    } finally {
      setAnnouncementPosting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!token) return;
    await announcementApi.remove(token, id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  if (isLoading) {
    if (activeTab === 'ROSTER') return <RosterSkeleton />;
    if (activeTab === 'QUESTION_BANK') return <QuestionBankSkeleton />;
    return activeTab === 'INSIGHTS' ? <DashboardSkeleton /> : <TableSkeleton />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {activeTab === 'INSIGHTS' && (
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
              onClick={downloadAnalytics}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-all shadow-md"
            >
              <Download size={14} />
              Export Data
            </button>
          </div>
        )}
      </div>

      {activeTab === 'INSIGHTS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Board Readiness</p>
              <h4 className="text-2xl font-black text-slate-800 mt-1">{stats.avg.toFixed(1)}%</h4>
              <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${stats.avg}%` }}></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Bank Size</p>
              <h4 className="text-2xl font-black text-slate-800 mt-1">{allQuestions.length}</h4>
              <p className="text-xs text-emerald-600 font-bold mt-2">↑ {parsedQuestions.length} parsed items</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Failed Students</p>
              <h4 className="text-2xl font-black text-red-600 mt-1">{stats.failed}</h4>
              <p className="text-xs text-slate-400 font-bold mt-2">Immediate intervention suggested</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-wrap gap-3 justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-800">Students At-Risk</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Rule: Accuracy &lt; 60% across assigned sets.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                  {atRiskStudents.length} Flagged
                </span>
                <button
                  className="px-3 py-1.5 text-[10px] font-black rounded-lg bg-[#1e3a8a] text-white"
                  onClick={downloadAnalytics}
                >
                  Download CSV
                </button>
                <button
                  className="px-3 py-1.5 text-[10px] font-black rounded-lg bg-[#065f46] text-[#facc15]"
                  onClick={() => window.alert('PDF export placeholder. Backend PDF export can be connected next.')}
                >
                  Download PDF
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[920px]">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Subject Weakness</th>
                    <th className="px-6 py-3 text-right">Accuracy</th>
                    <th className="px-6 py-3 text-right">Completion</th>
                    <th className="px-6 py-3 text-right">Proficiency</th>
                    <th className="px-6 py-3">Risk Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm font-bold text-emerald-600">
                        No at-risk students based on current thresholds.
                      </td>
                    </tr>
                  ) : (
                    atRiskStudents.map((student) => (
                      <tr key={student.studentId} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-black text-slate-800">{student.studentName}</p>
                          <p className="text-xs text-slate-500">{student.studentId}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">{student.subjectWeakness}</td>
                        <td className="px-6 py-4 text-right font-black text-red-600">{student.averageAccuracy.toFixed(1)}%</td>
                        <td className="px-6 py-4 text-right font-black text-amber-600">{student.completionRate.toFixed(1)}%</td>
                        <td className="px-6 py-4 text-right font-black text-[#1e3a8a]">{student.proficiencyScore.toFixed(1)}%</td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">{student.riskReason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-8">
                <PieIcon className="text-blue-500" size={20} />
                <h3 className="text-lg font-black text-slate-800">Readiness Distribution</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={readinessData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {readinessData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-3">
                {readinessData.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                      <span className="text-xs font-bold text-slate-600">{entry.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800">{entry.value} students</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-8">
                <Target className="text-[#065f46]" size={20} />
                <h3 className="text-lg font-black text-slate-800">Top 10 Proficiency Leaderboard</h3>
              </div>
              <div className="space-y-3 max-h-80 overflow-auto pr-1">
                {top10Leaderboard.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-sm font-bold text-slate-400">
                    No leaderboard data yet.
                  </div>
                ) : (
                  top10Leaderboard.map((row) => (
                    <div key={row.studentId} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-800">#{row.rank} {row.studentName}</p>
                        <p className="text-[11px] text-slate-500">{row.studentId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#1e3a8a]">{row.proficiencyScore.toFixed(1)}%</p>
                        <p className="text-[10px] text-slate-500">Acc {row.averageAccuracy.toFixed(1)}% · Comp {row.completionRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-8">
              <BarChart3 className="text-[#facc15]" size={20} />
              <h3 className="text-lg font-black text-slate-800">Topic Mastery Heatmap</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicMasteryRows} layout="vertical" margin={{ left: 80, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                  <YAxis dataKey="topic" type="category" width={180} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip
                    formatter={(value: number, _name, payload: { payload?: { attempts?: number; subjectLabel?: string } }) => [
                      `${value}% mastery`,
                      `Attempts: ${payload?.payload?.attempts ?? 0} · ${payload?.payload?.subjectLabel ?? ''}`,
                    ]}
                  />
                  <Bar dataKey="mastery" radius={[0, 8, 8, 0]}>
                    {topicMasteryRows.map((row, index) => (
                      <Cell
                        key={`topic-${index}`}
                        fill={row.mastery < 55 ? '#ef4444' : row.mastery < 75 ? '#facc15' : '#10b981'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PARSER' && (
        <div className="max-w-3xl mx-auto bg-white p-6 md:p-12 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 animate-in zoom-in-95">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-1">
              <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">AI Curriculum Parser</h3>
              <p className="text-xs md:text-sm text-slate-500">Ingest board exam papers for automated digitization.</p>
            </div>
            <div className="flex p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
              <button onClick={() => setParserMode('DOCUMENT')} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all ${parserMode === 'DOCUMENT' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`}>File Drop</button>
              <button onClick={() => setParserMode('TEXT')} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all ${parserMode === 'TEXT' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`}>Manual Paste</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1"><BookOpen size={12} /> Target Subject</label>
              <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 md:px-5 md:py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all">
                {availableSubjects.map(sub => <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1"><Layers size={12} /> Cognitive Weight</label>
              <select value={selectedDifficultyId} onChange={(e) => setSelectedDifficultyId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 md:px-5 md:py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all">
                {activeDifficultyTiers.map(tier => <option key={tier.id} value={tier.id}>{tier.name}</option>)}
              </select>
            </div>
          </div>

          {parserMode === 'DOCUMENT' ? (
            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()} className={`relative border-2 border-dashed rounded-3xl md:rounded-[2rem] p-8 md:p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${selectedFile ? 'bg-blue-50/30 border-blue-200' : 'bg-slate-50/50 border-slate-200 hover:border-blue-300'}`}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx" />
              {selectedFile ? (
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 text-[#1e3a8a] rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    {selectedFile.type === 'application/pdf' ? <FileType size={28} /> : <FileText size={28} />}
                  </div>
                  <p className="text-xs md:text-sm font-black text-slate-800 break-all px-4">{selectedFile.name}</p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <UploadCloud size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs md:text-sm font-black text-slate-800">Drop PDF or DOCX here</p>
                </div>
              )}
            </div>
          ) : (
            <textarea value={uploadText} onChange={(e) => setUploadText(e.target.value)} placeholder="Paste exam content..." className="w-full h-48 md:h-64 p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-mono outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all" />
          )}

          <button onClick={handleSimulateUpload} disabled={isParsing} className="w-full bg-[#1e3a8a] text-white py-4 md:py-5 rounded-2xl font-black flex justify-center items-center gap-3 shadow-xl disabled:opacity-50 active:scale-95 transition-transform">
            {isParsing ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : <><Sparkles size={20} className="text-yellow-400" /> Extract Board Items</>}
          </button>

          {parserAssignResult && (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-emerald-800">{parserAssignResult.items} item{parserAssignResult.items !== 1 ? 's' : ''} extracted and saved to Question Bank</p>
                  {parserAssignResult.students > 0
                    ? <p className="text-xs text-emerald-600 mt-0.5">Automatically assigned to <span className="font-black">{parserAssignResult.students}</span> enrolled student{parserAssignResult.students !== 1 ? 's' : ''} — they can now launch the drill.</p>
                    : <p className="text-xs text-amber-600 mt-0.5">No enrolled students found yet. Enroll students and they will get access immediately.</p>
                  }
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setParserAssignResult(null); setParsedQuestions([]); }}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Parse More
                </button>
                <button
                  onClick={() => setActiveTab('QUESTION_BANK')}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  View Question Bank
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ROSTER' && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by ID or Email..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a8a] transition-all"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-4 w-full lg:w-auto">
              <div className="flex p-1 bg-slate-100 rounded-xl flex-1 lg:flex-none">
                <button 
                  onClick={() => setRosterAccuracyFilter('ALL')} 
                  className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${rosterAccuracyFilter === 'ALL' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setRosterAccuracyFilter('PENDING')} 
                  className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${rosterAccuracyFilter === 'PENDING' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Pending
                </button>
                <button 
                  onClick={() => setRosterAccuracyFilter('PASSED')} 
                  className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${rosterAccuracyFilter === 'PASSED' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Passed
                </button>
                <button 
                  onClick={() => setRosterAccuracyFilter('FAILED')} 
                  className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${rosterAccuracyFilter === 'FAILED' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Failed
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800">Authorized Student Roster</h3>
              <span className="text-[10px] font-black text-slate-400 uppercase">{filteredRoster.length} Records Found</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Student ID</th>
                    <th className="px-6 py-4">Institutional Email</th>
                    <th className="px-6 py-4">Accuracy</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedRoster.map((s) => {
                    const score = getAccuracyScore(s);
                    const isPending = score === 0;
                    const isPassed = score >= 75;
                    const isFailed = score > 0 && score < 75;
                    
                    return (
                      <tr key={s.studentId} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">{s.studentId}</td>
                        <td className="px-6 py-4 text-slate-500">{s.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${isPending ? 'bg-amber-500' : isPassed ? 'bg-emerald-500' : 'bg-red-500'}`} 
                                style={{ width: `${score}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-black text-slate-700">{score}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isPending ? (
                            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">Pending</span>
                          ) : isPassed ? (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Passed</span>
                          ) : (
                            <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">Failed</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleRemoveStudent(s.studentId)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredRoster.length === 0 && (
                <div className="p-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="text-slate-200" size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-400">No students found matching your criteria.</p>
                </div>
              )}
            </div>
            {filteredRoster.length > ROSTER_PAGE_SIZE && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-center gap-2">
                {Array.from({ length: rosterPageCount }, (_, idx) => idx + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setRosterPage(page)}
                    className={`min-w-8 h-8 px-2 rounded-lg text-xs font-black transition-all ${rosterPage === page ? 'bg-[#1e3a8a] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ENROLLMENT' && (
        <div className="max-w-2xl mx-auto bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus size={24} className="text-[#065f46]" />
            <h3 className="text-2xl font-black text-slate-800">Bulk Whitelist Enrollment</h3>
          </div>
          <textarea value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} placeholder="01-2223-123456, student@phinmaed.com, BSMA-3A, School of Business" className="w-full h-48 p-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono" />
          <p className="text-[11px] text-slate-400 font-bold">Format per line: studentId,email or studentId,email,section,department</p>
          {enrollmentError && <p className="text-xs text-red-500 font-bold">{enrollmentError}</p>}
          {successMessage && <p className="text-xs text-emerald-600 font-bold">{successMessage}</p>}
          <button onClick={handleWhitelistStudents} className="w-full bg-[#065f46] text-white py-5 rounded-2xl font-black shadow-xl">Enroll Batch</button>
        </div>
      )}

      {activeTab === 'QUESTION_BANK' && (
        <div className="space-y-4">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by question content or topic..." 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a8a] transition-all"
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select 
                  value={bankSubjectFilter} 
                  onChange={(e) => setBankSubjectFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none"
                >
                  <option value="ALL">All Subjects</option>
                  {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                </select>
                <select 
                  value={bankDifficultyFilter} 
                  onChange={(e) => setBankDifficultyFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none"
                >
                  <option value="ALL">All Difficulties</option>
                  {activeDifficultyTiers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            </div>

            {selectedQuestionIds.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <Info size={18} className="text-[#1e3a8a]" />
                  <span className="text-sm font-bold text-[#1e3a8a]">{selectedQuestionIds.length} items selected</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAssignSelectedContent}
                    disabled={isAssigningContent}
                    className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:bg-blue-800 transition-colors disabled:opacity-60"
                  >
                    {isAssigningContent ? 'Assigning...' : 'Assign Content'}
                  </button>
                  <button 
                    onClick={() => handleBulkToggleStatus(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-colors"
                  >
                    Activate
                  </button>
                  <button 
                    onClick={() => handleBulkToggleStatus(false)}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-700 transition-colors"
                  >
                    Deactivate
                  </button>
                  <button 
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => setSelectedQuestionIds([])}
                    className="px-4 py-2 text-slate-400 hover:text-slate-600 text-xs font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {(assignContentMessage || assignContentError) && (
              <div className={`px-4 py-3 rounded-xl border text-xs font-bold ${assignContentError ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                {assignContentError || assignContentMessage}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1000px]">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 w-12">
                      <button onClick={handleSelectAll} className="text-slate-400 hover:text-[#1e3a8a] transition-colors">
                        {selectedQuestionIds.length === filteredQuestions.length && filteredQuestions.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </th>
                    <th className="px-6 py-4">Question Stem</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Difficulty</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredQuestions.map((q) => (
                    <tr key={q.id} className={`hover:bg-slate-50/30 transition-colors ${!q.isActive ? 'bg-slate-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <button onClick={() => handleToggleSelect(q.id)} className="text-slate-300 hover:text-[#1e3a8a] transition-colors">
                          {selectedQuestionIds.includes(q.id) ? <CheckSquare size={20} className="text-[#1e3a8a]" /> : <Square size={20} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <p className={`text-sm font-bold truncate ${q.isActive ? 'text-slate-700' : 'text-slate-400'}`}>{q.content}</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">{q.topic}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-50 text-[#1e3a8a] rounded text-[10px] font-black uppercase tracking-widest">
                          {availableSubjects.find(s => s.id === q.subjectId)?.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{q.difficulty}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleToggleQuestionStatus(q.id)}
                          className={`flex items-center gap-2 transition-all ${q.isActive ? 'text-emerald-600' : 'text-slate-300'}`}
                        >
                          {q.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                          <span className="text-[10px] font-black uppercase tracking-widest">{q.isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-slate-300 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                          <button 
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredQuestions.length === 0 && (
                <div className="p-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Database className="text-slate-200" size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-400">No questions found matching your filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-6">
          <div className="bg-[#1e3a8a] p-6 md:p-10 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Megaphone size={120} /></div>
            <div className="relative z-10 space-y-2">
              <h3 className="text-3xl font-black tracking-tight">Class Announcements</h3>
              <p className="text-blue-200 max-w-lg">Broadcast updates to students and fellow faculty members.</p>
            </div>
            <button onClick={() => setShowComposeAnnouncement(true)} className="relative z-10 bg-[#facc15] text-[#065f46] px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-all">
              <Bell size={18} /> New Announcement
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
                      <span className="text-[10px] px-2 py-1 bg-blue-100 text-[#1e3a8a] rounded-full font-black uppercase tracking-widest">{a.authorRole}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800">{a.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{a.content}</p>
                    <p className="text-[10px] text-slate-400 font-bold">by {a.authorName}</p>
                  </div>
                  <button onClick={() => handleDeleteAnnouncement(a.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'LEADERBOARD' && (
        <div className="space-y-6">
          <div className="bg-[#1e3a8a] p-6 md:p-10 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={120} /></div>
            <div className="relative z-10 space-y-2">
              <h3 className="text-3xl font-black tracking-tight">Top 10 Class Leaderboard</h3>
              <p className="text-blue-200 max-w-lg">Top 10 live ranking based on average drill accuracy.</p>
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
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-2xl text-[#1e3a8a]"><Megaphone size={24} /></div>
                <h3 className="text-2xl font-black text-[#1e3a8a]">New Announcement</h3>
              </div>
              <button onClick={() => setShowComposeAnnouncement(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={28} /></button>
            </div>
            <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
              <AlertCircle size={18} className="text-[#1e3a8a] shrink-0" />
              <p className="text-sm font-bold text-[#1e3a8a]">This announcement will be sent to all Students in your courses.</p>
            </div>
            <form onSubmit={handlePostAnnouncement} className="space-y-6">
              <input required type="text" placeholder="Title" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-black text-slate-800" value={newAnnouncementTitle} onChange={e => setNewAnnouncementTitle(e.target.value)} />
              <textarea required rows={5} placeholder="Write your announcement..." className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm leading-relaxed resize-none" value={newAnnouncementContent} onChange={e => setNewAnnouncementContent(e.target.value)} />
              <button type="submit" disabled={announcementPosting} className="w-full bg-[#1e3a8a] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition-all hover:bg-blue-800 flex items-center justify-center gap-2 disabled:opacity-60">
                <Send size={18} /> {announcementPosting ? 'Posting...' : 'Post Announcement'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
