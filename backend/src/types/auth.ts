export type UserRole = 'ADMIN' | 'FACULTY' | 'STUDENT';

export interface AuthClaims {
  userId: string;
  email: string;
  role: UserRole;
  studentId: string | null;
}
