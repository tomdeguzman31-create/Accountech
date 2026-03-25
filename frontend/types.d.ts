export declare enum UserRole {
    ADMIN = "ADMIN",
    FACULTY = "FACULTY",
    STUDENT = "STUDENT"
}
export interface User {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    isActivated: boolean;
    isActive: boolean;
    studentId?: string;
}
export interface DifficultyTier {
    id: string;
    name: string;
    description: string;
    weight: number;
    isActive: boolean;
}
export interface Question {
    id: string;
    subjectId: string;
    topic: string;
    difficulty: string;
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
    code: string;
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
    accuracyScore?: number;
}
export interface SessionRecord {
    id: string;
    subject: string;
    subjectFullName: string;
    score: string;
    rawScore: number;
    totalQuestions: number;
    date: string;
    fullDate: string;
    timestamp: string;
    status: 'Passed' | 'Remedial';
    percentage: number;
    timeSpent: string;
    topics: {
        name: string;
        correct: boolean;
    }[];
}
//# sourceMappingURL=types.d.ts.map