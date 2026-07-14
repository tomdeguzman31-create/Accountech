
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Trash2, Search, Loader2, Sparkles, UserPlus, Users, BookOpen, Layers, TrendingUp, BarChart3,
  Eye, FileText, AlertCircle, CheckCircle2,
  ChevronDown, X, Save, ToggleLeft, ToggleRight, Database, Edit2,
  UploadCloud, FileType, Info, CheckSquare, Square, Download,
  Target, Calendar, Bell, Trophy, Megaphone, Send, Medal
} from 'lucide-react';
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

type BoardReadinessReportRow = {
  id: string;
  name: string;
  studentId: string;
  section: string;
  accuracy: number;
  attempts: number;
  correct: number;
  wrong: number;
  weakestSubject: string;
};

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
  const [boardReadinessSearch, setBoardReadinessSearch] = useState('');

  // Announcements + Leaderboard State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showComposeAnnouncement, setShowComposeAnnouncement] = useState(false);
  const [showBoardReadinessReport, setShowBoardReadinessReport] = useState(false);
  const [showQuestionBankDifficultyReport, setShowQuestionBankDifficultyReport] = useState(false);
  const [selectedBoardReadinessStudent, setSelectedBoardReadinessStudent] = useState<BoardReadinessReportRow | null>(null);
  const [studentHistoryData, setStudentHistoryData] = useState<any | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Edit Question State
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editStem, setEditStem] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('');
  const [editOptA, setEditOptA] = useState('');
  const [editOptB, setEditOptB] = useState('');
  const [editOptC, setEditOptC] = useState('');
  const [editOptD, setEditOptD] = useState('');
  const [editAnswer, setEditAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [editReference, setEditReference] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [announcementPosting, setAnnouncementPosting] = useState(false);
  const [instructionalReport, setInstructionalReport] = useState<FacultyInstructionalReport | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardView, setLeaderboardView] = useState<'GLOBAL' | 'PASSED'>('GLOBAL');
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
      isActive: row.isActive !== false,
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
        if (['INSIGHTS', 'ITEM_ANALYSIS', 'ROSTER', 'ENROLLMENT'].includes(activeTab)) {
          await refreshAllowedStudents();
        }

        if (activeTab === 'QUESTION_BANK' || activeTab === 'INSIGHTS' || activeTab === 'ITEM_ANALYSIS') {
          const rows = await questionApi.list(token);
          setAllQuestions(normalizeQuestionRows(rows));
        }

        if (activeTab === 'ANNOUNCEMENTS') {
          const rows = await announcementApi.list(token);
          setAnnouncements(rows);
        }

        if (activeTab === 'INSIGHTS' || activeTab === 'ITEM_ANALYSIS') {
          const report = await analyticsApi.facultyInstructionalReport(token);
          setInstructionalReport(report);
        }
      } catch {
        if (activeTab === 'INSIGHTS' || activeTab === 'ITEM_ANALYSIS') {
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

  useEffect(() => {
    if (!token || !selectedBoardReadinessStudent) {
      setStudentHistoryData(null);
      return;
    }
    setLoadingHistory(true);
    analyticsApi.studentHistory(token, selectedBoardReadinessStudent.studentId)
      .then((data) => {
        setStudentHistoryData(data);
      })
      .catch((err) => {
        console.error(err);
        setStudentHistoryData(null);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [selectedBoardReadinessStudent, token]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingQuestion) return;
    setIsSavingEdit(true);
    try {
      await questionApi.update(token, editingQuestion.id, {
        content: editStem.trim(),
        topic: editTopic.trim(),
        difficulty: editDifficulty,
        options: {
          A: editOptA.trim(),
          B: editOptB.trim(),
          C: editOptC.trim(),
          D: editOptD.trim(),
        },
        correctAnswer: editAnswer,
        referenceText: editReference.trim() || null,
      });

      // Update local state
      setAllQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestion.id
            ? {
                ...q,
                content: editStem.trim(),
                topic: editTopic.trim(),
                difficulty: editDifficulty,
                options: {
                  A: editOptA.trim(),
                  B: editOptB.trim(),
                  C: editOptC.trim(),
                  D: editOptD.trim(),
                },
                correctAnswer: editAnswer,
                reference: editReference.trim(),
              }
            : q
        )
      );
      setEditingQuestion(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update question');
    } finally {
      setIsSavingEdit(false);
    }
  };

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
        // Assignment is best-effort â€” questions are saved even if no students enrolled yet
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
    if (!token) return;
    const q = allQuestions.find(item => item.id === id);
    if (!q) return;
    const newStatus = !q.isActive;
    // Optimistic update
    setAllQuestions(prev => prev.map(item => item.id === id ? { ...item, isActive: newStatus } : item));
    questionApi.update(token, id, { isActive: newStatus }).catch(() => {
      // Revert on failure
      setAllQuestions(prev => prev.map(item => item.id === id ? { ...item, isActive: q.isActive } : item));
    });
  };

  const handleDeleteQuestion = (id: string) => {
    if (!token) return;
    if (!window.confirm('Delete this question permanently?')) return;
    setAllQuestions(prev => prev.filter(q => q.id !== id));
    setSelectedQuestionIds(prev => prev.filter(qid => qid !== id));
    questionApi.delete(token, id).catch(() => {
      // If delete fails, reload from backend
      questionApi.list(token).then(rows => setAllQuestions(normalizeQuestionRows(rows))).catch(() => {});
    });
  };

  const handleBulkToggleStatus = (active: boolean) => {
    if (!token || !selectedQuestionIds.length) return;
    setAllQuestions(prev => prev.map(q => selectedQuestionIds.includes(q.id) ? { ...q, isActive: active } : q));
    Promise.all(selectedQuestionIds.map(id => questionApi.update(token, id, { isActive: active })))
      .catch(() => {
        questionApi.list(token).then(rows => setAllQuestions(normalizeQuestionRows(rows))).catch(() => {});
      });
    setSelectedQuestionIds([]);
  };

  const handleBulkDelete = () => {
    if (!token || !selectedQuestionIds.length) return;
    if (!window.confirm(`Delete ${selectedQuestionIds.length} selected questions permanently?`)) return;
    const toDelete = [...selectedQuestionIds];
    setAllQuestions(prev => prev.filter(q => !toDelete.includes(q.id)));
    setSelectedQuestionIds([]);
    Promise.all(toDelete.map(id => questionApi.delete(token, id)))
      .catch(() => {
        questionApi.list(token).then(rows => setAllQuestions(normalizeQuestionRows(rows))).catch(() => {});
      });
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
  const failureRate = stats.total > 0 ? (stats.failed / stats.total) * 100 : 0;
  const perfectLeaderboardRows = top10Leaderboard
    .filter((row) => row.proficiencyScore >= 100 || row.averageAccuracy >= 100)
    .slice(0, 4);
  const perfectFallbackRows = topPerformers
    .filter((row) => row.score >= 100)
    .slice(0, Math.max(0, 4 - perfectLeaderboardRows.length));
  const compactLeaderboardRows = top10Leaderboard.slice(0, 4);
  const overallEfficiencyRows = [...allowedStudents]
    .sort((a, b) => getAccuracyScore(b) - getAccuracyScore(a))
    .slice(0, 5)
    .map((student, index) => ({
      label: `STUDENT ${index + 1}`,
      score: getAccuracyScore(student),
    }));
  const overallEfficiencyFallbackRows = [
    { label: 'STUDENT 1', score: 75 },
    { label: 'STUDENT 2', score: 43 },
    { label: 'STUDENT 3', score: 75 },
    { label: 'STUDENT 4', score: 43 },
    { label: 'STUDENT 5', score: 75 },
  ];
  const displayedOverallEfficiencyRows = overallEfficiencyRows.length
    ? overallEfficiencyRows
    : overallEfficiencyFallbackRows;
  const subjectEfficiencyFallback = [75, 43, 75, 43, 75];
  const displayedSubjectEfficiencyRows = availableSubjects.slice(0, 5).map((subject, index) => {
    const matchedTopicRows = topicMasteryRows.filter((row) => {
      const label = row.subjectLabel.toLowerCase();
      return label.includes(subject.code.toLowerCase()) || label.includes(subject.name.toLowerCase());
    });
    const score = matchedTopicRows.length
      ? matchedTopicRows.reduce((sum, row) => sum + row.mastery, 0) / matchedTopicRows.length
      : subjectEfficiencyFallback[index] ?? 50;
    return { label: subject.code, score };
  });
  const questionBankFallbackScores: Record<string, number> = {
    FAR: 85,
    TAX: 60,
    AUD: 40,
    AFAR: 39,
    MAS: 20,
    RFBT: 19,
  };
  const preferredQuestionBankOrder = ['FAR', 'TAX', 'AUD', 'AFAR', 'MAS', 'RFBT'];
  const displayedQuestionBankRows = preferredQuestionBankOrder
    .map((code) => availableSubjects.find((subject) => subject.code === code))
    .filter((subject): subject is typeof availableSubjects[number] => Boolean(subject))
    .map((subject) => {
      const subjectQuestions = allQuestions.filter((question) => question.subjectId === subject.id).length;
      const maxSubjectQuestions = Math.max(
        1,
        ...availableSubjects.map((item) => allQuestions.filter((question) => question.subjectId === item.id).length),
      );
      const score = allQuestions.length
        ? Math.max(19, Math.round((subjectQuestions / maxSubjectQuestions) * 85))
        : questionBankFallbackScores[subject.code] ?? 20;
      return { code: subject.code, score };
    });
  const boardReadinessRows: BoardReadinessReportRow[] = (allowedStudents.length
    ? allowedStudents.map((student, index) => {
        const accuracy = getAccuracyScore(student);
        const attempts = Math.max(1, Math.round((accuracy || 50) / 5));
        const correct = Math.round((attempts * accuracy) / 100);
        return {
          id: student.studentId,
          name: `Student${index > 0 ? ` ${index + 1}` : ''}`,
          studentId: student.studentId,
          section: student.section ?? 'Section A',
          accuracy,
          attempts,
          correct,
          wrong: Math.max(0, attempts - correct),
          weakestSubject: 'AFAR',
        };
      })
    : [
        { id: 'demo-1', name: 'Student', studentId: '01-1234-123456', section: 'Section A', accuracy: 70, attempts: 10, correct: 5, wrong: 5, weakestSubject: 'AFAR' },
        { id: 'demo-2', name: 'Student', studentId: '01-1234-123456', section: 'Section A', accuracy: 80, attempts: 15, correct: 10, wrong: 5, weakestSubject: 'AFAR' },
      ]).filter((student) => {
        const needle = boardReadinessSearch.trim().toLowerCase();
        if (!needle) return true;
        return student.name.toLowerCase().includes(needle) || student.studentId.toLowerCase().includes(needle);
      });
  const filteredLeaderboard = useMemo(() => {
    const rows = leaderboardView === 'PASSED' ? leaderboard.filter((entry) => entry.avgAccuracy >= 75) : leaderboard;
    return [...rows].sort((a, b) => a.rank - b.rank).slice(0, 4);
  }, [leaderboard, leaderboardView]);

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
        <div className="space-y-6 text-slate-950">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-300 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-400">Board Readiness</p>
                  <h4 className="mt-2 text-base font-black">{stats.avg.toFixed(1)}%</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBoardReadinessReport(true)}
                  className="rounded bg-[#28447e] px-5 py-2 text-[10px] font-black leading-tight text-white"
                >
                  View Detailed<br />Reports
                </button>
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-[#16e04f]" style={{ width: `${Math.min(stats.avg, 100)}%` }} />
              </div>
            </div>

            <div className="rounded-lg border border-slate-300 bg-white p-4">
              <p className="text-[11px] font-black uppercase text-slate-400">Question Bank Size</p>
              <h4 className="mt-2 text-base font-black">{allQuestions.length}</h4>
              <p className="mt-3 text-[11px] font-black text-[#16d04a]">+ {parsedQuestions.length} parsed items</p>
            </div>

            <div className="rounded-lg border border-slate-300 bg-white p-4">
              <p className="text-[11px] font-black uppercase text-slate-400">Overall Failure Rate</p>
              <h4 className="mt-2 text-base font-black text-red-600">{failureRate.toFixed(0)}%</h4>
              <p className="mt-3 text-[11px] font-bold text-slate-500">Immediate intervention suggested</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 px-5 py-4">
              <h3 className="text-lg font-black">Student At-Risk</h3>
              <button
                onClick={downloadAnalytics}
                className="flex items-center gap-2 rounded bg-[#28447e] px-5 py-2 text-[10px] font-black text-white"
              >
                <Download size={12} />
                Export Data
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-slate-300 bg-slate-100 text-[11px] font-black uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4 text-center">Subject Weakness</th>
                    <th className="px-5 py-4 text-center">Accuracy Rate</th>
                    <th className="px-5 py-4 text-center">Attempts</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {atRiskStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-sm font-bold text-emerald-600">
                        No at-risk students based on current thresholds.
                      </td>
                    </tr>
                  ) : (
                    atRiskStudents.slice(0, 4).map((student) => (
                      <tr key={student.studentId}>
                        <td className="px-5 py-4">
                          <p className="text-xs font-black">{student.studentName}</p>
                          <p className="text-xs text-slate-700">{student.studentId}</p>
                        </td>
                        <td className="px-5 py-4 text-center text-xs font-black text-slate-700">{student.subjectWeakness}</td>
                        <td className="px-5 py-4 text-center text-xs font-black text-red-600">{student.averageAccuracy.toFixed(1)}%</td>
                        <td className="px-5 py-4 text-center text-xs font-black text-[#28447e]">{Math.max(1, Math.round(student.completionRate / 4))}</td>
                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedBoardReadinessStudent({
                              id: student.studentId,
                              name: student.studentName || 'Student',
                              studentId: student.studentId,
                              section: student.section ?? 'Section 1',
                              accuracy: student.averageAccuracy,
                              attempts: 10,
                              correct: 5,
                              wrong: 5,
                              weakestSubject: 'AUD',
                            })}
                            className="rounded-xl bg-[#2f4f93] px-4 py-2 text-xs font-black text-white"
                          >
                            View History
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div className="min-h-[315px] rounded-lg border border-slate-300 bg-white p-6">
              <div className="mb-3 flex items-center gap-2">
                <Target className="text-[#16a34a]" size={18} />
                <h3 className="text-base font-black">Top 10 Perfect Scorers Leaderboard</h3>
              </div>
              <div className="space-y-3">
                {perfectLeaderboardRows.length === 0 && perfectFallbackRows.length === 0 ? (
                  <p className="py-12 text-center text-sm font-bold text-slate-400">No perfect scores yet.</p>
                ) : (
                  <>
                    {perfectLeaderboardRows.map((row, index) => (
                      <div key={row.studentId} className="flex items-center justify-between rounded-lg border border-slate-300 px-5 py-3">
                        <div>
                          <p className="text-xs font-black">#{index + 1} {row.studentName}</p>
                          <p className="text-xs text-slate-700">{row.studentId}</p>
                        </div>
                        <p className="text-xs font-black text-[#28447e]">{Math.max(row.proficiencyScore, row.averageAccuracy).toFixed(0)}%</p>
                      </div>
                    ))}
                    {perfectFallbackRows.map((row, index) => (
                      <div key={row.name} className="flex items-center justify-between rounded-lg border border-slate-300 px-5 py-3">
                        <div>
                          <p className="text-xs font-black">#{perfectLeaderboardRows.length + index + 1} Student</p>
                          <p className="text-xs text-slate-700">{row.name}</p>
                        </div>
                        <p className="text-xs font-black text-[#28447e]">{row.score.toFixed(0)}%</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="min-h-[315px] rounded-lg border border-slate-300 bg-white p-6">
              <div className="mb-3 flex items-center gap-2">
                <Target className="text-[#16a34a]" size={18} />
                <h3 className="text-base font-black">Top 10 Leaderboard</h3>
              </div>
              <div className="space-y-3">
                {compactLeaderboardRows.length === 0 ? (
                  <p className="py-12 text-center text-sm font-bold text-slate-400">No leaderboard data yet.</p>
                ) : (
                  compactLeaderboardRows.map((row) => (
                    <div key={row.studentId} className="flex items-center justify-between rounded-lg border border-slate-300 px-5 py-3">
                      <div>
                        <p className="text-xs font-black">#{row.rank} {row.studentName}</p>
                        <p className="text-xs text-slate-700">{row.studentId}</p>
                      </div>
                      <p className="text-xs font-black text-[#28447e]">{row.averageAccuracy.toFixed(1)}%</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-lg border border-slate-300 bg-white p-7">
              <div className="mb-8 flex items-center gap-3">
                <TrendingUp className="text-[#28447e]" size={20} />
                <h3 className="text-lg font-black">Overall Efficiency Analysis</h3>
              </div>
              <div className="flex h-[245px] gap-4">
                <div className="flex w-10 flex-col items-center justify-between pb-8 text-[11px] font-bold text-slate-500">
                  <span>100</span>
                  <span>75</span>
                  <span>50</span>
                  <span>25</span>
                  <span>0</span>
                </div>
                <div className="relative flex-1 border-l border-slate-400 border-b border-slate-400">
                  <span className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-bold text-slate-600">Readiness Score (%)</span>
                  <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-red-300" />
                  <span className="absolute right-2 top-[calc(50%-10px)] text-[10px] font-bold text-red-600">At - Risk</span>
                  <div className="grid h-full grid-cols-5 items-end gap-7 px-7 pb-0">
                    {displayedOverallEfficiencyRows.map((row) => (
                      <div key={row.label} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
                        <div
                          className={`w-full max-w-[38px] rounded-t ${row.score < 50 ? 'bg-red-600' : 'bg-[#2f4f93]'}`}
                          style={{ height: `${Math.max(4, Math.min(row.score, 100))}%` }}
                        />
                        <span className="-rotate-45 whitespace-nowrap text-[10px] font-black text-slate-500">{row.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-300 bg-white p-7">
              <div className="mb-4 flex items-center gap-3">
                <AlertCircle className="text-amber-500" size={20} />
                <h3 className="text-lg font-black">Question Bank Analysis</h3>
              </div>
              <div className="mb-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('ITEM_ANALYSIS')}
                  className="rounded bg-[#28447e] px-7 py-2 text-[10px] font-black leading-tight text-white"
                >
                  View Detailed<br />Reports
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuestionBankDifficultyReport(true)}
                  className="rounded bg-[#28447e] px-7 py-2 text-[10px] font-black leading-tight text-white"
                >
                  View Difficulty<br />Reports
                </button>
              </div>
              <div className="space-y-5">
                {displayedQuestionBankRows.map((row) => (
                  <div key={row.code} className="grid grid-cols-[48px_1fr_42px] items-center gap-3">
                    <span className="text-[11px] font-black">{row.code}</span>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-[#2f4f93]" style={{ width: `${Math.min(row.score, 100)}%` }} />
                    </div>
                    <span className={`text-right text-sm font-black ${row.score < 20 ? 'text-red-600' : row.score < 40 ? 'text-amber-500' : 'text-[#16d04a]'}`}>
                      {row.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-300 bg-white p-7 lg:max-w-[680px]">
              <div className="mb-8 flex items-center gap-3">
                <TrendingUp className="text-[#28447e]" size={20} />
                <h3 className="text-lg font-black">Subject Efficiency Analysis</h3>
              </div>
              <div className="flex h-[245px] gap-4">
                <div className="flex w-10 flex-col items-center justify-between pb-8 text-[11px] font-bold text-slate-500">
                  <span>100</span>
                  <span>75</span>
                  <span>50</span>
                  <span>25</span>
                  <span>0</span>
                </div>
                <div className="relative flex-1 border-l border-slate-400 border-b border-slate-400">
                  <span className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-bold text-slate-600">Readiness Score (%)</span>
                  <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-red-300" />
                  <span className="absolute right-2 top-[calc(50%-10px)] text-[10px] font-bold text-red-600">At - Risk</span>
                  <div className="grid h-full grid-cols-5 items-end gap-8 px-8 pb-0">
                    {displayedSubjectEfficiencyRows.map((row) => (
                      <div key={row.label} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
                        <div
                          className={`w-full max-w-[38px] rounded-t ${row.score < 50 ? 'bg-red-600' : 'bg-[#2f4f93]'}`}
                          style={{ height: `${Math.max(4, Math.min(row.score, 100))}%` }}
                        />
                        <span className="-rotate-45 whitespace-nowrap text-[10px] font-black text-slate-500">{row.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ITEM_ANALYSIS' && (
        <div className="mx-auto w-full max-w-[980px] border border-slate-300 bg-white px-5 py-4 text-slate-950">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <h2 className="text-2xl font-black leading-tight">
              Question Bank<br />Analysis Metric
            </h2>
            <div className="flex flex-wrap gap-2 pt-2 text-[10px] font-black uppercase">
              <span className="rounded-lg bg-[#8cf0a5] px-4 py-2 text-[#16753a]">Ideal (40%+)</span>
              <span className="rounded-lg bg-[#f2c51b] px-3 py-2 text-black">Average(20%-39%)</span>
              <span className="rounded-lg bg-[#ff9da0] px-3 py-2 text-red-700">For Review(&lt;19%)</span>
            </div>
          </div>

          <div className="mb-5 rounded-lg border border-slate-300 bg-white p-3">
            <label className="mb-4 flex h-9 items-center gap-3 rounded-lg border border-slate-300 bg-[#f4eeee] px-3">
              <Search size={16} className="text-slate-400" />
              <input
                value={bankSearch}
                onChange={(event) => setBankSearch(event.target.value)}
                placeholder="Search by question content or topic..."
                className="min-w-0 flex-1 bg-transparent text-xs font-bold outline-none placeholder:text-slate-500"
              />
            </label>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <select
                value={bankSubjectFilter}
                onChange={(event) => setBankSubjectFilter(event.target.value)}
                className="h-8 w-28 rounded border border-slate-300 bg-white px-2 text-[10px] font-black uppercase outline-none"
              >
                <option value="ALL">All Subjects</option>
                {availableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.code}</option>
                ))}
              </select>
              <select
                value={bankDifficultyFilter}
                onChange={(event) => setBankDifficultyFilter(event.target.value)}
                className="h-8 w-32 rounded border border-slate-300 bg-white px-2 text-[10px] font-black uppercase outline-none"
              >
                <option value="ALL">All Difficulties</option>
                {activeDifficultyTiers.map((tier) => (
                  <option key={tier.id} value={tier.name}>{tier.name}</option>
                ))}
              </select>
              <div className="flex h-8 items-center gap-2 rounded border border-slate-300 bg-white px-3 text-[10px] font-bold text-slate-500">
                <Calendar size={12} />
                <span>dd/mm/yyyy</span>
                <span className="text-slate-400">TO</span>
                <span>dd/mm/yyyy</span>
                <Calendar size={12} />
              </div>
              <button
                type="button"
                onClick={() => {
                  setBankSearch('');
                  setBankSubjectFilter('ALL');
                  setBankDifficultyFilter('ALL');
                }}
                className="flex h-8 w-8 items-center justify-center rounded bg-slate-200 text-slate-900"
                aria-label="Reset filters"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 bg-[#f7f4f4]">
            <table className="w-full min-w-[900px] text-left">
              <thead className="text-[11px] font-black uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-5">Question Stem</th>
                  <th className="px-4 py-5 text-center">Subject</th>
                  <th className="px-4 py-5 text-center">Difficulty</th>
                  <th className="px-4 py-5 text-center">Total Attempts</th>
                  <th className="px-4 py-5 text-center">Passing Rate</th>
                  <th className="px-4 py-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 bg-[#f7f4f4]">
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.slice(0, 8).map((q) => {
                    const metric = instructionalReport?.questionMetrics?.find((m) => m.questionId === q.id);
                    const attempts = metric?.attempts ?? 0;
                    const correct = metric?.correct ?? 0;
                    const rate = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
                    
                    let status = 'FOR REVIEW';
                    if (attempts === 0) {
                      status = 'AVERAGE';
                    } else if (rate >= 40) {
                      status = 'IDEAL';
                    } else if (rate >= 20) {
                      status = 'AVERAGE';
                    }

                    const subjectCode = availableSubjects.find(s => s.id === q.subjectId)?.code ?? 'N/A';

                    return (
                      <tr key={q.id}>
                        <td className="px-4 py-3">
                          <p className="max-w-[280px] text-[11px] font-black leading-tight truncate" title={q.content}>
                            {q.content}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded bg-slate-300 px-3 py-1 text-[10px] font-black text-[#28447e]">{subjectCode}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-[11px] font-black uppercase">{q.difficulty}</td>
                        <td className="px-4 py-3 text-center text-2xl font-black text-[#28447e]">{attempts}</td>
                        <td className="px-4 py-3 text-center text-2xl font-black text-[#28447e]">{attempts > 0 ? `${rate}%` : '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex min-w-[76px] items-center justify-center rounded-lg px-3 py-2 text-[10px] font-black uppercase ${
                              status === 'IDEAL'
                                ? 'bg-[#8cf0a5] text-[#16753a]'
                                : status === 'AVERAGE'
                                  ? 'bg-[#f2c51b] text-black'
                                  : 'bg-[#ff9da0] text-red-700'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm font-bold text-slate-400">
                      No questions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex h-12 items-center justify-center border-t border-slate-300 text-sm font-black">
              &lt;&lt;1 2 3 4 5&gt;&gt;
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
                    ? <p className="text-xs text-emerald-600 mt-0.5">Automatically assigned to <span className="font-black">{parserAssignResult.students}</span> enrolled student{parserAssignResult.students !== 1 ? 's' : ''} â€” they can now launch the drill.</p>
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
        <div className="mx-auto w-full max-w-[760px] space-y-5 text-slate-950">
          <div className="rounded-lg border border-slate-300 bg-white p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <label className="flex h-10 flex-1 items-center gap-3 rounded-lg border border-slate-300 bg-[#f4eeee] px-3">
                <Search size={17} className="text-slate-400" />
                <input
                  value={rosterSearch}
                  onChange={(event) => setRosterSearch(event.target.value)}
                  placeholder="Search by ID or Email..."
                  className="min-w-0 flex-1 bg-transparent text-xs font-bold outline-none placeholder:text-slate-500"
                />
              </label>

              <div className="flex h-10 items-center gap-1 rounded-lg border border-slate-300 bg-white p-1">
                {(['ALL', 'PENDING', 'PASSED', 'FAILED'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setRosterAccuracyFilter(filter)}
                    className={`h-8 rounded-md px-4 text-[10px] font-black uppercase transition-colors ${
                      rosterAccuracyFilter === filter
                        ? 'border border-slate-300 bg-white text-[#28447e] shadow-sm'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
            <div className="flex items-center justify-between border-b border-slate-300 px-4 py-4">
              <h3 className="text-lg font-black">Student Roster</h3>
              <span className="text-[10px] font-black uppercase text-slate-500">{filteredRoster.length} records found</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px] text-left">
                <thead className="bg-[#f7f4f4] text-[11px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-4">Student ID</th>
                    <th className="px-4 py-4">Institutional<br />Email</th>
                    <th className="px-4 py-4">Accuracy</th>
                    <th className="px-4 py-4 text-center">Weakest<br />Subject</th>
                    <th className="px-4 py-4 text-center">Status</th>
                    <th className="px-4 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {(paginatedRoster.length ? paginatedRoster : [
                    { studentId: '01-1234-123456', email: 'student@phinmaed.com', accuracyScore: 80, section: 'Section 1' },
                    { studentId: '01-1234-123456', email: 'student@phinmaed.com', accuracyScore: 20, section: 'Section 1' },
                  ]).map((student) => {
                    const score = getAccuracyScore(student);
                    const passed = score >= 75;
                    return (
                      <tr key={`${student.studentId}-${student.email}`}>
                        <td className="px-4 py-3 text-[10px] font-black">{student.studentId}</td>
                        <td className="px-4 py-3 text-[10px] font-bold text-slate-500">{student.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-14 rounded-full bg-slate-200">
                              <div
                                className={`h-full rounded-full ${passed ? 'bg-[#16e04f]' : 'bg-red-600'}`}
                                style={{ width: `${Math.max(8, Math.min(score, 100))}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black">{score.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex min-w-[62px] items-center justify-center rounded-lg bg-slate-300 px-3 py-1 text-[10px] font-black text-[#28447e]">AUD</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex min-w-[60px] items-center justify-center rounded-lg px-3 py-1 text-[10px] font-black uppercase ${
                            passed ? 'bg-[#8cf0a5] text-[#16753a]' : 'bg-[#ff9da0] text-red-700'
                          }`}>
                            {passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedBoardReadinessStudent({
                              id: student.studentId,
                              name: 'Student',
                              studentId: student.studentId,
                              section: student.section ?? 'Section 1',
                              accuracy: 50,
                              attempts: 10,
                              correct: 5,
                              wrong: 5,
                              weakestSubject: 'AUD',
                            })}
                            className="rounded-lg bg-[#2f4f93] px-4 py-2 text-xs font-black text-white"
                          >
                            View History
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {false && activeTab === 'ROSTER' && (
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
                           <button 
                            onClick={() => {
                              setEditingQuestion(q);
                              setEditStem(q.content);
                              setEditTopic(q.topic);
                              setEditDifficulty(q.difficulty);
                              setEditOptA(q.options.A);
                              setEditOptB(q.options.B);
                              setEditOptC(q.options.C);
                              setEditOptD(q.options.D);
                              setEditAnswer(q.correctAnswer);
                              setEditReference(q.reference || '');
                            }}
                            className="p-2 text-slate-300 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-all"
                            aria-label="Edit question"
                          >
                            <Edit2 size={16} />
                          </button>
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
        <div className="mx-auto w-full max-w-[840px] space-y-5 pb-8 text-slate-900">
          <section className="relative overflow-hidden rounded-[2rem] bg-[#355396] px-10 py-7 text-white shadow-[0_4px_6px_rgba(15,23,42,0.35)]">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Top 10 Class Leaderboard</h1>
              <p className="mt-1 text-lg font-medium text-white/75">Live ranking based on average drill accuracy.</p>
            </div>
            <Trophy className="absolute right-7 top-5 text-white/25" size={96} strokeWidth={2.8} />
          </section>

          <div className="mx-auto w-full max-w-[690px] rounded-md bg-[#355396] px-5 py-4 text-white">
            <div className="grid gap-3 md:grid-cols-[1.7fr_0.65fr_1.15fr] md:items-end">
              <div>
                <label className="mb-1 block text-xs font-black uppercase">Subject</label>
                <select
                  value={lbSubjectId}
                  onChange={(event) => setLbSubjectId(event.target.value)}
                  className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs font-black text-slate-900 outline-none"
                >
                  <option value="">All Subjects</option>
                  {lbSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.code}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-black uppercase">Difficulty</label>
                <select
                  value={lbDifficulty}
                  onChange={(event) => setLbDifficulty(event.target.value)}
                  className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs font-black text-slate-900 outline-none"
                >
                  <option value="">All Levels</option>
                  <option value="Easy">Easy</option>
                  <option value="Average">Average</option>
                  <option value="Difficult">Difficult</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-black uppercase">Date</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={lbDateFrom}
                    onChange={(event) => setLbDateFrom(event.target.value)}
                    className="h-7 min-w-0 flex-1 rounded border border-slate-300 bg-white px-2 text-[10px] font-bold text-slate-900 outline-none"
                  />
                  <span className="text-xs font-black">TO</span>
                  <input
                    type="date"
                    value={lbDateTo}
                    onChange={(event) => setLbDateTo(event.target.value)}
                    className="h-7 min-w-0 flex-1 rounded border border-slate-300 bg-white px-2 text-[10px] font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-white">
                  <th className="px-8 py-5 text-left text-sm font-black uppercase text-slate-500">Rank</th>
                  <th className="px-8 py-5 text-left text-sm font-black uppercase text-slate-500">Student</th>
                  <th className="px-8 py-5 text-left text-sm font-black uppercase text-slate-500">Student ID</th>
                  <th className="px-8 py-5 text-center text-sm font-black uppercase text-slate-500">Avg Accuracy</th>
                  <th className="px-8 py-5 text-center text-sm font-black uppercase text-slate-500">Sessions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leaderboardLoading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-sm font-bold text-slate-400">Loading leaderboard...</td>
                  </tr>
                ) : filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-sm font-bold text-slate-400">No leaderboard data yet.</td>
                  </tr>
                ) : (
                  filteredLeaderboard.map((entry) => (
                    <tr key={entry.rank}>
                      <td className="px-8 py-4">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                            entry.rank === 1
                              ? 'bg-[#f4c21f] text-[#8a6410]'
                              : entry.rank === 2
                                ? 'bg-slate-200 text-slate-500'
                                : entry.rank === 3
                                  ? 'bg-[#b99166] text-[#65441e]'
                                  : 'bg-slate-300 text-slate-900'
                          }`}
                        >
                          {entry.rank <= 3 ? <Medal size={14} /> : entry.rank}
                        </div>
                      </td>
                      <td className="px-8 py-4 text-xs font-black lowercase text-slate-900">{entry.name || 'student'}</td>
                      <td className="px-8 py-4 text-xs font-medium text-slate-900">{entry.studentId ?? '01-1234-123456'}</td>
                      <td className="px-8 py-4 text-center text-sm font-black text-slate-900">{entry.avgAccuracy}%</td>
                      <td className="px-8 py-4 text-center text-sm font-black text-slate-900">{entry.sessionsTaken}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showBoardReadinessReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
          <div className="w-full max-w-[690px] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="px-6 pb-5 pt-4">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black uppercase text-[#28447e]">Board Readiness</h3>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="text-sm font-black">{stats.avg.toFixed(1)}%</span>
                    <div className="h-2 w-56 rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-[#16e04f]" style={{ width: `${Math.min(stats.avg, 100)}%` }} />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBoardReadinessReport(false)}
                  className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Close board readiness report"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="rounded-lg border border-slate-300">
                <div className="grid gap-2 border-b border-slate-300 bg-white p-2 md:grid-cols-[1.4fr_0.55fr_0.55fr_0.9fr]">
                  <label className="flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3">
                    <Search size={14} className="text-slate-400" />
                    <input
                      value={boardReadinessSearch}
                      onChange={(event) => setBoardReadinessSearch(event.target.value)}
                      placeholder="Search"
                      className="min-w-0 flex-1 bg-transparent text-xs font-bold outline-none placeholder:text-slate-400"
                    />
                  </label>
                  <div>
                    <p className="mb-1 text-[8px] font-black uppercase text-slate-500">Section</p>
                    <select className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-[10px] font-bold text-slate-500 outline-none">
                      <option>All Sections</option>
                    </select>
                  </div>
                  <div>
                    <p className="mb-1 text-[8px] font-black uppercase text-slate-500">Difficulty</p>
                    <select className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-[10px] font-bold text-slate-500 outline-none">
                      <option>All Difficulty</option>
                    </select>
                  </div>
                  <div>
                    <p className="mb-1 text-[8px] font-black uppercase text-slate-500">Subject</p>
                    <select className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-[10px] font-bold text-slate-500 outline-none">
                      <option>All Subjects</option>
                      {availableSubjects.map((subject) => (
                        <option key={subject.id}>{subject.code}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <thead className="text-[10px] font-black uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-4">Students</th>
                        <th className="px-4 py-4 text-center">Accuracy Rate</th>
                        <th className="px-4 py-4 text-center">Attempts</th>
                        <th className="px-4 py-4 text-center">Correct</th>
                        <th className="px-4 py-4 text-center">Wrong</th>
                        <th className="px-4 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {boardReadinessRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm font-bold text-slate-400">
                            No students found.
                          </td>
                        </tr>
                      ) : (
                        boardReadinessRows.slice(0, 6).map((student) => (
                          <tr key={student.id}>
                            <td className="px-4 py-3">
                              <p className="text-xs font-black">{student.name}</p>
                              <p className="text-[11px] text-slate-700">{student.studentId}</p>
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-black">{student.accuracy.toFixed(0)}%</td>
                            <td className="px-4 py-3 text-center text-2xl font-black text-[#28447e]">{student.attempts}</td>
                            <td className="px-4 py-3 text-center text-2xl font-black text-[#065f46]">{student.correct}</td>
                            <td className="px-4 py-3 text-center text-2xl font-black text-red-600">{student.wrong}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedBoardReadinessStudent(student)}
                                className="rounded-lg bg-[#2f4f93] px-4 py-2 text-xs font-black text-white"
                              >
                                View History
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="h-20 bg-white" />
          </div>
        </div>
      )}

      {selectedBoardReadinessStudent && (() => {
        const attempts = studentHistoryData 
          ? studentHistoryData.sessions.reduce((acc: number, s: any) => acc + s.totalQuestions, 0)
          : selectedBoardReadinessStudent.attempts;

        const correct = studentHistoryData
          ? studentHistoryData.sessions.reduce((acc: number, s: any) => acc + s.score, 0)
          : selectedBoardReadinessStudent.correct;

        const wrong = studentHistoryData
          ? Math.max(0, attempts - correct)
          : selectedBoardReadinessStudent.wrong;

        const weakestSubject = studentHistoryData && studentHistoryData.sessions.length > 0
          ? (() => {
              const subjectAccuracies: Record<string, { sum: number; count: number }> = {};
              studentHistoryData.sessions.forEach((s: any) => {
                if (!subjectAccuracies[s.subjectCode]) {
                  subjectAccuracies[s.subjectCode] = { sum: 0, count: 0 };
                }
                subjectAccuracies[s.subjectCode].sum += s.accuracyPercentage;
                subjectAccuracies[s.subjectCode].count += 1;
              });
              let minAcc = Infinity;
              let weakest = 'N/A';
              Object.keys(subjectAccuracies).forEach((code) => {
                const avg = subjectAccuracies[code].sum / subjectAccuracies[code].count;
                if (avg < minAcc) {
                  minAcc = avg;
                  weakest = code;
                }
              });
              return weakest;
            })()
          : selectedBoardReadinessStudent.weakestSubject;

        const displayName = studentHistoryData ? studentHistoryData.name : selectedBoardReadinessStudent.name;
        const displayEmail = studentHistoryData ? studentHistoryData.email : 'student@phinmaed.com';
        const displayAccuracy = studentHistoryData ? studentHistoryData.summary.overallAccuracy : selectedBoardReadinessStudent.accuracy;

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-4">
            <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-lg bg-white shadow-2xl">
              <div className="p-5">
                <div className="mb-7 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-slate-300 bg-white text-4xl font-black text-cyan-900 shadow-md">
                      {displayName.charAt(0)}
                    </div>
                    <div className="text-sm leading-tight text-slate-950">
                      <p className="font-black">{displayName}</p>
                      <p className="font-black">{selectedBoardReadinessStudent.studentId} · {selectedBoardReadinessStudent.section}</p>
                      <p className="font-black">Batch: 2024</p>
                      <p className="text-xs font-bold text-slate-400">{displayEmail}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBoardReadinessStudent(null)}
                    className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Close student history"
                  >
                    <X size={26} />
                  </button>
                </div>

                <div className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-[1.05fr_0.75fr_1.95fr] text-slate-950">
                  <div className="rounded-lg border border-slate-300 bg-white p-5">
                    <h3 className="text-xl font-black">Accuracy Rate</h3>
                    <div className="relative mx-auto mt-2 h-28 w-36 overflow-hidden">
                      <div
                        className="absolute inset-x-0 top-0 h-36 rounded-full"
                        style={{
                          background: `conic-gradient(#00a80d 0deg ${Math.min(displayAccuracy, 100) * 1.8}deg, #d0d0d0 ${Math.min(displayAccuracy, 100) * 1.8}deg 180deg, transparent 180deg 360deg)`,
                        }}
                      />
                      <div className="absolute left-1/2 top-6 h-24 w-24 -translate-x-1/2 rounded-full bg-white" />
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-4xl font-black">
                        {displayAccuracy.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-300 bg-white p-5">
                    <h3 className="text-sm font-black">Weakest Subject</h3>
                    <div className="mt-6 flex h-24 items-center justify-center rounded-lg bg-red-200 text-2xl font-black text-red-600">
                      {weakestSubject}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 rounded-lg border border-slate-300 bg-white p-5 text-center">
                    <div>
                      <h3 className="text-xl font-black">Attempts</h3>
                      <p className="mt-12 text-2xl font-black text-[#28447e]">{attempts}</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-black">Correct</h3>
                      <p className="mt-12 text-2xl font-black text-[#065f46]">{correct}</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-black">Wrong</h3>
                      <p className="mt-12 text-2xl font-black text-red-600">{wrong}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6 rounded-none border border-slate-300 bg-white p-2">
                  <div className="flex items-start justify-between gap-3 text-slate-950">
                    <h3 className="text-base font-black">Performance Over Time</h3>
                    <span className="mr-12 rounded-lg bg-[#187054] px-7 py-2 text-[10px] font-black text-white">+12% Improvement</span>
                  </div>
                  <div className="mt-2 h-[300px]">
                    <svg viewBox="0 0 620 250" className="h-full w-full" role="img" aria-label="Performance over time">
                      <line x1="80" y1="25" x2="80" y2="205" stroke="#cfcfcf" />
                      <line x1="80" y1="205" x2="560" y2="205" stroke="#cfcfcf" />
                      {[25, 70, 115, 160, 205].map((y) => (
                        <line key={y} x1="80" y1={y} x2="560" y2={y} stroke="#d8d8d8" />
                      ))}
                      {[160, 250, 345, 452, 560].map((x) => (
                        <line key={x} x1={x} y1="25" x2={x} y2="205" stroke="#d8d8d8" />
                      ))}
                      {[100, 75, 50, 25, 0].map((tick, index) => (
                        <text key={tick} x="62" y={30 + index * 45} textAnchor="end" className="fill-slate-400 text-[12px] font-black">{tick}</text>
                      ))}
                      {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'].map((label, index) => (
                        <text key={label} x={80 + index * 96} y="226" textAnchor="middle" className="fill-slate-400 text-[12px] font-black">{label}</text>
                      ))}
                      <path d="M80 158 C130 156 140 145 176 135 S260 110 272 112 S370 96 416 72 S510 80 560 88" fill="none" stroke="#187054" strokeWidth="2" />
                      {[
                        [176, 135],
                        [272, 112],
                        [416, 72],
                        [560, 88],
                      ].map(([x, y]) => (
                        <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="white" stroke="#187054" strokeWidth="2" />
                      ))}
                      <g transform="translate(210 238)">
                        <line x1="0" y1="0" x2="34" y2="0" stroke="#187054" strokeWidth="2" />
                        <circle cx="17" cy="0" r="5" fill="white" stroke="#187054" strokeWidth="2" />
                        <text x="38" y="5" className="fill-[#187054] text-[14px] font-black">FAR</text>
                        <line x1="95" y1="0" x2="129" y2="0" stroke="#28447e" strokeWidth="2" />
                        <circle cx="112" cy="0" r="5" fill="white" stroke="#28447e" strokeWidth="2" />
                        <text x="133" y="5" className="fill-[#28447e] text-[14px] font-black">AUD</text>
                        <line x1="190" y1="0" x2="224" y2="0" stroke="#f4aa00" strokeWidth="2" />
                        <circle cx="207" cy="0" r="5" fill="white" stroke="#f4aa00" strokeWidth="2" />
                        <text x="228" y="5" className="fill-[#f4aa00] text-[14px] font-black">TAX</text>
                      </g>
                    </svg>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-300 bg-white text-slate-950">
                  <h3 className="px-4 py-4 text-base font-black">Drill History</h3>
                  <table className="w-full text-left">
                    <thead className="border-y border-slate-300 text-[10px] font-black uppercase text-slate-400">
                      <tr>
                        <th className="px-4 py-4">Date</th>
                        <th className="px-4 py-4">Subject</th>
                        <th className="px-4 py-4 text-center">Correct</th>
                        <th className="px-4 py-4 text-center">Wrong</th>
                        <th className="px-4 py-4 text-center">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingHistory ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm font-bold text-slate-400">
                            Loading drill history...
                          </td>
                        </tr>
                      ) : studentHistoryData && studentHistoryData.sessions.length > 0 ? (
                        studentHistoryData.sessions.map((session: any, index: number) => {
                          let trendText = '—';
                          let trendColor = 'text-slate-500';
                          if (index < studentHistoryData.sessions.length - 1) {
                            const prevSession = studentHistoryData.sessions[index + 1];
                            const diff = session.accuracyPercentage - prevSession.accuracyPercentage;
                            if (diff > 0) {
                              trendText = `+${diff.toFixed(0)}`;
                              trendColor = 'text-[#065f46]';
                            } else if (diff < 0) {
                              trendText = `${diff.toFixed(0)}`;
                              trendColor = 'text-red-600';
                            }
                          }
                          const formattedDate = new Date(session.takenAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          }).replace(/\//g, '-');
                          
                          const wrongCount = session.totalQuestions - session.score;

                          return (
                            <tr key={session.id}>
                              <td className="px-4 py-4 text-xl font-black">{formattedDate}</td>
                              <td className="px-4 py-4 text-base font-black">{session.subjectCode}</td>
                              <td className="px-4 py-4 text-center text-2xl font-black text-[#065f46]">{session.score}</td>
                              <td className="px-4 py-4 text-center text-2xl font-black text-red-600">{wrongCount}</td>
                              <td className={`px-4 py-4 text-center text-2xl font-black ${trendColor}`}>{trendText}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm font-bold text-slate-400">
                            No drill history found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {showQuestionBankDifficultyReport && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/75 p-4">
          <div className="relative w-full max-w-[405px] bg-white px-9 pb-8 pt-9 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowQuestionBankDifficultyReport(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close question bank difficulty distribution"
            >
              <X size={28} strokeWidth={1.6} />
            </button>

            <div className="mb-9 flex items-start gap-2">
              <BarChart3 className="mt-1 text-[#f2c51b]" size={18} />
              <h3 className="text-lg font-black leading-tight">
                Question Bank Difficulty<br />Distribution
              </h3>
            </div>

            <div className="space-y-12">
              {[
                { label: 'Recall (Easy)', width: 100 },
                { label: 'Application (Average)', width: 87 },
                { label: 'Evaluation (Difficult)', width: 50 },
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-[78px_1fr] items-center gap-2">
                  <p className="text-right text-[10px] font-black leading-tight">{row.label}</p>
                  <div className="h-4 rounded bg-slate-100">
                    <div className="h-full rounded bg-[#2f4f93]" style={{ width: `${row.width}%` }} />
                  </div>
                </div>
              ))}
            </div>
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
      {editingQuestion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-10 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center text-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-2xl text-[#1e3a8a]"><Edit2 size={24} /></div>
                <h3 className="text-2xl font-black text-[#1e3a8a]">Edit Question</h3>
              </div>
              <button onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={28} /></button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="space-y-4 text-slate-950">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Question Stem</label>
                <textarea 
                  required 
                  rows={3} 
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm" 
                  value={editStem} 
                  onChange={e => setEditStem(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Topic</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm" 
                    value={editTopic} 
                    onChange={e => setEditTopic(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Difficulty</label>
                  <select 
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold" 
                    value={editDifficulty} 
                    onChange={e => setEditDifficulty(e.target.value)}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Average">Average</option>
                    <option value="Difficult">Difficult</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Option A</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-xs" 
                    value={editOptA} 
                    onChange={e => setEditOptA(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Option B</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-xs" 
                    value={editOptB} 
                    onChange={e => setEditOptB(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Option C</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-xs" 
                    value={editOptC} 
                    onChange={e => setEditOptC(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Option D</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-xs" 
                    value={editOptD} 
                    onChange={e => setEditOptD(e.target.value)} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Correct Answer</label>
                  <select 
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold" 
                    value={editAnswer} 
                    onChange={e => setEditAnswer(e.target.value as any)}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Reference Text</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm" 
                    value={editReference} 
                    onChange={e => setEditReference(e.target.value)} 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSavingEdit} 
                className="w-full bg-[#1e3a8a] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition-all hover:bg-blue-800 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save size={18} /> {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;

