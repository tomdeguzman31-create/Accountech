
import { UserRole, Subject, Question, DifficultyTier } from './types';

export const COLORS = {
  PH_GREEN: '#065f46',
  PH_BLUE: '#1e3a8a',
  PH_YELLOW: '#facc15',
};

export const INITIAL_DIFFICULTY_TIERS: DifficultyTier[] = [
  { id: '1', name: 'Recall (Easy)', description: 'Knowledge of facts, terms, basic concepts, and answers.', weight: 1, isActive: true },
  { id: '2', name: 'Application (Average)', description: 'Solving problems in new situations by applying acquired knowledge.', weight: 2, isActive: true },
  { id: '3', name: 'Evaluation (Difficult)', description: 'Professional judgment, synthesis of multiple concepts, and complex audit logic.', weight: 3, isActive: true },
];

export const MOCK_SUBJECTS: Subject[] = [
  { id: '1', name: 'Financial Accounting and Reporting', code: 'FAR', isActive: true },
  { id: '2', name: 'Advanced Financial Accounting and Reporting', code: 'AFAR', isActive: true },
  { id: '3', name: 'Management Advisory Services', code: 'MAS', isActive: true },
  { id: '4', name: 'Taxation', code: 'TAX', isActive: true },
  { id: '5', name: 'Regulatory Framework for Business Transactions', code: 'RFBT', isActive: true },
  { id: '6', name: 'Auditing', code: 'AUD', isActive: true },
];

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    subjectId: '1',
    topic: 'IAS 1: Presentation of FS',
    difficulty: 'Easy',
    content: 'According to IAS 1, which of the following is NOT a component of a complete set of financial statements?',
    options: {
      A: 'Statement of Financial Position',
      B: 'Statement of Profit or Loss',
      C: 'The Directors Report',
      D: 'Notes to the Financial Statements'
    },
    correctAnswer: 'C',
    reference: 'IAS 1.10 - The Directors report is often included in the annual report but is NOT a component of the FS set.',
    isActive: true
  },
  {
    id: 'q2',
    subjectId: '4',
    topic: 'Income Taxation',
    difficulty: 'Average',
    content: 'Which of the following is excluded from the gross income of a resident citizen?',
    options: {
      A: 'Prizes won in a local competition',
      B: 'Proceeds from life insurance policy paid upon death',
      C: 'Interest from bank deposits',
      D: 'Rent income from residential units'
    },
    correctAnswer: 'B',
    reference: 'NIRC Sec 32(B)(1) - Proceeds of life insurance policies paid to beneficiaries upon death are exclusions.',
    isActive: true
  }
];

export const MOCK_ALLOWED_STUDENTS = [
  { studentId: '01-2223-123456', email: 'student@phinmaed.com', accuracyScore: 82 },
  { studentId: '01-2425-000001', email: 'test@phinmaed.com', accuracyScore: 45 },
  { studentId: '01-2223-998877', email: 'juan.delacruz@phinmaed.com', accuracyScore: 65 }
];

export const DEMO_USERS = [
  { email: 'admin@phinmaed.com', role: UserRole.ADMIN, name: 'Dean Morales' },
  { email: 'faculty@phinmaed.com', role: UserRole.FACULTY, name: 'Prof. Garcia' },
  { email: 'dept.head@phinmaed.com', role: UserRole.FACULTY, name: 'Prof. Reyes' },
];

export const READINESS_DATA = [
  { year: '2022', rate: 45 },
  { year: '2023', rate: 52 },
  { year: '2024', rate: 68 },
  { year: '2025 (Proj)', rate: 75 },
];
