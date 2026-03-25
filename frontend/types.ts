
export enum UserRole {
  ADMIN = 'ADMIN',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  isActivated?: boolean;
  isActive?: boolean;
  studentId?: string; // Format: 01-XXXX-XXXXXX
}

export interface DifficultyTier {
  id: string;
  name: string;
  description: string;
  weight: number; // For adaptive scoring logic
  isActive: boolean;
}

export interface Question {
  id: string;
  subjectId: string;
  topic: string;
  difficulty: string; // Changed from enum to string to support dynamic tiers
  content: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  reference: string;
  isActive: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string; // FAR, AFAR, TAX, etc.
  isActive: boolean;
}

export interface DrillSession {
  id: string;
  studentId: string;
  subjectId: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
}

export interface AllowedStudent {
  studentId: string;
  email: string;
  accuracyScore?: number; // 0-100
  isRegistered?: boolean;
  section?: string;
  department?: string;
  enrolledByFacultyEmail?: string;
}

export interface SessionRecord {
  id: string;
  subjectId?: string;
  subject: string;
  subjectFullName: string;
  score: string;
  rawScore: number;
  totalQuestions: number;
  date: string;
  fullDate: string;
  timestamp: string; // ISO string for sorting and filtering
  status: 'Passed' | 'Remedial';
  percentage: number;
  timeSpent: string;
  topics: { name: string; correct: boolean }[];
}
