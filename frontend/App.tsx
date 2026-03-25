
import React, { useState, createContext, useContext, useEffect } from 'react';
import { User, UserRole, AllowedStudent, Subject, DifficultyTier } from './types';
import { INITIAL_DIFFICULTY_TIERS } from './constants';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TestHistory from './pages/TestHistory';
import DrillEngine from './pages/DrillEngine';
import Profile from './pages/Profile';
import { Layout } from './components/Layout';
import { authApi, studentApi, subjectApi, type LoginResult } from './services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  activateSession: (token: string, user: User) => void;
  logout: () => void;
  currentView: string;
  setView: (view: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  allowedStudents: AllowedStudent[];
  setAllowedStudents: React.Dispatch<React.SetStateAction<AllowedStudent[]>>;
  refreshAllowedStudents: () => Promise<void>;
  subjects: Subject[];
  refreshSubjects: () => Promise<void>;
  difficultyTiers: DifficultyTier[];
  setDifficultyTiers: React.Dispatch<React.SetStateAction<DifficultyTier[]>>;
  updateUserProfile: (newName: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const DIFFICULTY_TIERS_STORAGE_KEY = 'accountech_difficulty_tiers';

const loadDifficultyTiers = (): DifficultyTier[] => {
  try {
    const raw = localStorage.getItem(DIFFICULTY_TIERS_STORAGE_KEY);
    if (!raw) return INITIAL_DIFFICULTY_TIERS;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_DIFFICULTY_TIERS;
    }

    return parsed as DifficultyTier[];
  } catch {
    return INITIAL_DIFFICULTY_TIERS;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentView, setView] = useState<string>('DASHBOARD');
  const [activeTab, setActiveTab] = useState<string>('ANALYTICS');
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [activeTierId, setActiveTierId] = useState<string | null>(null);
  const [allowedStudents, setAllowedStudents] = useState<AllowedStudent[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [difficultyTiers, setDifficultyTiers] = useState<DifficultyTier[]>(loadDifficultyTiers);

  const activateSession = (nextToken: string, nextUser: User) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem('accountech_token', nextToken);
    setView('DASHBOARD');
  };

  const refreshSubjects = async () => {
    if (!token) return;
    const rows = await subjectApi.list(token);
    setSubjects(rows);
  };

  const refreshAllowedStudents = async () => {
    if (!token || !user || (user.role !== UserRole.ADMIN && user.role !== UserRole.FACULTY)) return;
    const rows = await studentApi.list(token);
    setAllowedStudents(rows);
  };

  useEffect(() => {
    if (user) {
      if (user.role === UserRole.ADMIN) setActiveTab('ANALYTICS');
      else if (user.role === UserRole.FACULTY) setActiveTab('INSIGHTS');
      else setActiveTab('DASHBOARD');
    }
  }, [user]);

  useEffect(() => {
    const bootstrap = async () => {
      const savedToken = localStorage.getItem('accountech_token');
      if (!savedToken) return;

      try {
        const response = await authApi.me(savedToken);
        setToken(savedToken);
        setUser(response.user);
      } catch {
        localStorage.removeItem('accountech_token');
        setToken(null);
        setUser(null);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    localStorage.setItem(DIFFICULTY_TIERS_STORAGE_KEY, JSON.stringify(difficultyTiers));
  }, [difficultyTiers]);

  useEffect(() => {
    if (!token || !user) {
      setAllowedStudents([]);
      setSubjects([]);
      return;
    }

    void refreshSubjects();
    void refreshAllowedStudents();
  }, [token, user]);

  const login = async (email: string, password: string) => authApi.login(email, password);

  const logout = () => {
    localStorage.removeItem('accountech_token');
    setToken(null);
    setUser(null);
    setView('DASHBOARD');
    setActiveSubjectId(null);
  };

  const updateUserProfile = async (newName: string) => {
    if (!token) return;
    const response = await authApi.updateProfile(token, newName);
    setUser(response.user);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!token) return;
    await authApi.changePassword(token, currentPassword, newPassword);
  };

  const handleStartDrill = (subjectId: string, difficultyTierId?: string) => {
    setActiveSubjectId(subjectId);
    setActiveTierId(difficultyTierId || null);
    setView('DRILL');
  };

  const renderContent = () => {
    if (!user) return <Login />;

    if (currentView === 'PROFILE') {
      return <Profile />;
    }

    if (currentView === 'TEST_HISTORY' && user.role === UserRole.STUDENT) {
      return <TestHistory onStartDrill={handleStartDrill} />;
    }

    if (currentView === 'DRILL' && user.role === UserRole.STUDENT) {
      return (
        <DrillEngine 
          subjectId={activeSubjectId || subjects[0]?.id || ''} 
          difficultyTierId={activeTierId || undefined}
          onComplete={() => setView('DASHBOARD')} 
        />
      );
    }

    switch (user.role) {
      case UserRole.ADMIN: return <AdminDashboard />;
      case UserRole.FACULTY: return <FacultyDashboard />;
      case UserRole.STUDENT: return <StudentDashboard onStartDrill={handleStartDrill} />;
      default: return <Login />;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      login, 
      activateSession,
      logout, 
      currentView, 
      setView, 
      activeTab,
      setActiveTab,
      allowedStudents, 
      setAllowedStudents,
      refreshAllowedStudents,
      subjects,
      refreshSubjects,
      difficultyTiers,
      setDifficultyTiers,
      updateUserProfile,
      changePassword
    }}>
      <Layout>
        {renderContent()}
      </Layout>
    </AuthContext.Provider>
  );
};

export default App;
