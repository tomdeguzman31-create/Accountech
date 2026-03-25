import { User, AllowedStudent } from '../types';

const API_BASE = (import.meta as ImportMeta & { env: { VITE_API_BASE_URL?: string } }).env
  .VITE_API_BASE_URL
  ? `${(import.meta as ImportMeta & { env: { VITE_API_BASE_URL?: string } }).env.VITE_API_BASE_URL}/api`
  : 'http://localhost:4000/api';

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message ?? 'Request failed');
  }

  return payload as T;
}

export type LoginResponse = { token: string; user: User };
export type LoginResult = LoginResponse;
export type OtpRequestResponse = { message: string; delivery?: 'email' | 'fallback' };

export const authApi = {
  requestOtp(email: string, termsAccepted = false) {
    return request<OtpRequestResponse>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email, termsAccepted }),
    });
  },

  verifyOtp(payload: { email: string; otp: string; purpose?: 'verification' | 'password-reset' | 'login' }) {
    return request<{ message: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  activate(payload: { email: string; password: string; name: string; otp: string }) {
    return request<{ message: string }>('/auth/activate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  requestResetOtp(email: string) {
    return request<OtpRequestResponse>('/auth/request-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(payload: { email: string; password: string; otp: string }) {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login(email: string, password: string) {
    return request<LoginResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  me(token: string) {
    return request<{ user: User }>('/auth/me', { method: 'GET' }, token);
  },

  updateProfile(token: string, name: string) {
    return request<{ user: User; message: string }>(
      '/auth/me/profile',
      { method: 'PUT', body: JSON.stringify({ name }) },
      token,
    );
  },

  changePassword(token: string, currentPassword: string, newPassword: string) {
    return request<{ message: string }>(
      '/auth/me/password',
      { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) },
      token,
    );
  },
};

export const studentApi = {
  list(token: string) {
    return request<AllowedStudent[]>('/students', { method: 'GET' }, token);
  },

  bulkEnroll(
    token: string,
    students: Array<{ studentId: string; email: string; section?: string; department?: string }>,
  ) {
    return request<{ message: string }>('/students/bulk', {
      method: 'POST',
      body: JSON.stringify({ students }),
    }, token);
  },

  remove(token: string, studentId: string) {
    return request<{ message: string }>(`/students/${studentId}`, { method: 'DELETE' }, token);
  },

  assignContent(
    token: string,
    payload: {
      subjectIds?: string[];
      studentIds?: string[];
      placements?: Array<{ subjectId: string; difficulty?: 'Easy' | 'Average' | 'Difficult' }>;
    },
  ) {
    return request<{
      message: string;
      studentsAffected: number;
      subjectsAssigned: number;
      recordsUpserted: number;
    }>(
      '/students/assign-content',
      { method: 'POST', body: JSON.stringify(payload) },
      token,
    );
  },
};

export const subjectApi = {
  list(token: string) {
    return request<Array<{ id: string; code: string; name: string; isActive: boolean }>>(
      '/subjects',
      { method: 'GET' },
      token,
    );
  },
};

export const questionApi = {
  list(token: string, query: { subjectId?: string; difficulty?: string } = {}) {
    const params = new URLSearchParams();
    if (query.subjectId) params.set('subjectId', query.subjectId);
    if (query.difficulty) params.set('difficulty', query.difficulty);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request<Array<Record<string, unknown>>>(`/questions${suffix}`, { method: 'GET' }, token);
  },

  bulk(token: string, questions: unknown[]) {
    return request<{ message: string }>('/questions/bulk', {
      method: 'POST',
      body: JSON.stringify({ questions }),
    }, token);
  },
};

export const drillApi = {
  assignedContent(token: string) {
    return request<Array<{
      subjectId: string;
      code: string;
      name: string;
      questionCount: number;
      difficulties: string[];
      assignedAt: string | null;
      assignedByFacultyEmail: string | null;
    }>>('/drills/assigned-content', { method: 'GET' }, token);
  },

  createSession(token: string, subjectId: string, requestedDifficulty?: 'Easy' | 'Average' | 'Difficult') {
    return request<{
      subjectId: string;
      targetDifficulty: string;
      totalQuestions: number;
      questions: Array<{
        id: string;
        topic: string;
        difficulty: string;
        content: string;
        options: { A: string; B: string; C: string; D: string };
        correctAnswer: 'A' | 'B' | 'C' | 'D';
        reference: string;
      }>;
    }>(
      '/drills/session',
      { method: 'POST', body: JSON.stringify({ subjectId, requestedDifficulty }) },
      token,
    );
  },

  submit(token: string, payload: { subjectId: string; answers: Array<{ questionId: string; selectedAnswer: 'A' | 'B' | 'C' | 'D' }> }) {
    return request<{
      score: number;
      totalQuestions: number;
      accuracyPercentage: number;
      status: 'Passed' | 'Remedial';
      remedials: Array<{
        questionId: string;
        topic: string;
        correctAnswer: string;
        selectedAnswer: string;
        referenceText: string | null;
      }>;
    }>('/drills/submit', { method: 'POST', body: JSON.stringify(payload) }, token);
  },
};

export interface IStudentAtRisk {
  studentId: string;
  studentName: string;
  email: string;
  section: string | null;
  department: string | null;
  averageAccuracy: number;
  completionRate: number;
  proficiencyScore: number;
  subjectWeakness: string;
  riskReason: string;
}

export interface IFacultyOverview {
  facultyUserId: string;
  facultyName: string;
  facultyEmail: string | null;
  totalStudentsHandled: number;
  averageClassReadiness: number;
  totalDrillsUploaded: number;
  lastActivityAt: string | null;
}

export interface IBatchReadiness {
  batchYear: number;
  batchLabel: string;
  studentCount: number;
  averageAccuracy: number;
  completionRate: number;
  passingLikelihood: number;
}

export type FacultyInstructionalReport = {
  generatedAt: string;
  thresholds: { atRiskAccuracyBelow: number; atRiskCompletionBelow: number };
  totals: { rosterSize: number; atRiskCount: number; averageAccuracy: number; averageCompletionRate: number };
  atRiskStudents: IStudentAtRisk[];
  topicMastery: Array<{
    topic: string;
    subjectLabel: string;
    attempts: number;
    mastery: number;
    struggleLevel: number;
  }>;
  topLeaderboard: Array<{
    rank: number;
    studentId: string;
    studentName: string;
    proficiencyScore: number;
    averageAccuracy: number;
    completionRate: number;
    sessionsTaken: number;
  }>;
  studentProgressSchema: {
    collection: string;
    fields: Record<string, string>;
  };
};

export type AdminReadinessReport = {
  generatedAt: string;
  readinessMath: string;
  globalReadiness: {
    boardPassingLikelihood: number;
    currentBatchYear: number;
    components: {
      passRateWeight: number;
      accuracyWeight: number;
      completionWeight: number;
      averageAccuracy: number;
      completionRate: number;
      passRate: number;
    };
  };
  historicalTrend: IBatchReadiness[];
  facultyOverview: IFacultyOverview[];
};

export const analyticsApi = {
  my(token: string) {
    return request<{ summary: { overallAccuracy: number; totalSessions: number; passedSessions: number }; sessions: Array<Record<string, unknown>> }>(
      '/analytics/me',
      { method: 'GET' },
      token,
    );
  },

  overview(token: string) {
    return request<{
      subjectAverages: Array<Record<string, unknown>>;
      topStudents: Array<Record<string, unknown>>;
      engagement: Record<string, number>;
    }>('/analytics/overview', { method: 'GET' }, token);
  },

  facultyReadiness(token: string) {
    return request<{ items: FacultyRosterReadinessRow[] }>(
      '/analytics/faculty-readiness',
      { method: 'GET' },
      token,
    ).then((payload) => payload.items);
  },

  facultyInstructionalReport(token: string, facultyUserId?: string) {
    const params = new URLSearchParams();
    if (facultyUserId) params.set('facultyUserId', facultyUserId);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request<FacultyInstructionalReport>(
      `/analytics/faculty-instructional-report${suffix}`,
      { method: 'GET' },
      token,
    );
  },
};

export const adminApi = {
  readinessReport(token: string) {
    return request<AdminReadinessReport>(
      '/admin/readiness-report',
      { method: 'GET' },
      token,
    );
  },
};

export type FacultyRosterReadinessRow = {
  facultyUserId: string | null;
  facultyEmail: string | null;
  facultyName: string;
  rosterSize: number;
  overallReadiness: number;
  pendingCount: number;
  atRiskCount: number;
  developingCount: number;
  readyCount: number;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  targetRoles: string[];
  createdAt: string;
};

export const announcementApi = {
  list(token: string) {
    return request<Announcement[]>('/announcements', { method: 'GET' }, token);
  },
  create(token: string, payload: { title: string; content: string }) {
    return request<{ id: string; message: string }>(
      '/announcements',
      { method: 'POST', body: JSON.stringify(payload) },
      token,
    );
  },
  remove(token: string, id: string) {
    return request<{ message: string }>(`/announcements/${id}`, { method: 'DELETE' }, token);
  },
};

export type LeaderboardEntry = {
  rank: number;
  name: string;
  studentId?: string;
  avgAccuracy: number;
  sessionsTaken: number;
};

export const leaderboardApi = {
  get(token: string, query: { scope?: 'FACULTY' | 'SECTION' | 'DEPARTMENT' | 'GLOBAL'; section?: string; department?: string; subjectId?: string; difficulty?: string; dateFrom?: string; dateTo?: string } = {}) {
    const params = new URLSearchParams();
    if (query.scope) params.set('scope', query.scope);
    if (query.section) params.set('section', query.section);
    if (query.department) params.set('department', query.department);
    if (query.subjectId) params.set('subjectId', query.subjectId);
    if (query.difficulty) params.set('difficulty', query.difficulty);
    if (query.dateFrom) params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params.set('dateTo', query.dateTo);
    const suffix = params.toString() ? `?${params.toString()}` : '';

    return request<LeaderboardEntry[] | { scope: string; totalStudents: number; items: LeaderboardEntry[] }>(
      `/analytics/leaderboard${suffix}`,
      { method: 'GET' },
      token,
    ).then((payload) => (Array.isArray(payload) ? payload : payload.items));
  },
};

export function parserUpload(token: string, file: File): Promise<{ totalExtracted: number; questions: unknown[] }> {
  const formData = new FormData();
  formData.append('file', file);

  return fetch(`${API_BASE}/parser/question-bank`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message ?? 'Parser request failed');
    }
    return payload;
  });
}
