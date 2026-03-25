"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const types_1 = require("./types");
const Login_1 = require("./pages/Login");
const AdminDashboard_1 = require("./pages/AdminDashboard");
const FacultyDashboard_1 = require("./pages/FacultyDashboard");
const StudentDashboard_1 = require("./pages/StudentDashboard");
const TestHistory_1 = require("./pages/TestHistory");
const DrillEngine_1 = require("./pages/DrillEngine");
const Profile_1 = require("./pages/Profile");
const Layout_1 = require("./components/Layout");
const constants_1 = require("./constants");
const AuthContext = (0, react_1.createContext)(undefined);
const useAuth = () => {
    const context = (0, react_1.useContext)(AuthContext);
    if (!context)
        throw new Error("useAuth must be used within AuthProvider");
    return context;
};
exports.useAuth = useAuth;
const App = () => {
    const [user, setUser] = (0, react_1.useState)(null);
    const [currentView, setView] = (0, react_1.useState)('DASHBOARD');
    const [activeTab, setActiveTab] = (0, react_1.useState)('ANALYTICS');
    const [activeSubjectId, setActiveSubjectId] = (0, react_1.useState)(null);
    const [activeTierId, setActiveTierId] = (0, react_1.useState)(null);
    const [allowedStudents, setAllowedStudents] = (0, react_1.useState)(constants_1.MOCK_ALLOWED_STUDENTS);
    (0, react_1.useEffect)(() => {
        if (user) {
            if (user.role === types_1.UserRole.ADMIN)
                setActiveTab('ANALYTICS');
            else if (user.role === types_1.UserRole.FACULTY)
                setActiveTab('INSIGHTS');
            else
                setActiveTab('DASHBOARD');
        }
    }, [user]);
    const login = (email, role) => {
        setUser({
            id: '1',
            email,
            role,
            name: role === types_1.UserRole.STUDENT ? 'Juan De La Cruz' : (email.includes('admin') ? 'Dean Morales' : 'Prof. Garcia'),
            isActivated: true,
            studentId: role === types_1.UserRole.STUDENT ? '01-2223-123456' : undefined
        });
        setView('DASHBOARD');
    };
    const logout = () => {
        setUser(null);
        setView('DASHBOARD');
        setActiveSubjectId(null);
    };
    const updateUserProfile = (newName) => {
        if (user) {
            setUser({ ...user, name: newName });
        }
    };
    const handleStartDrill = (subjectId, difficultyTierId) => {
        setActiveSubjectId(subjectId);
        setActiveTierId(difficultyTierId || null);
        setView('DRILL');
    };
    const renderContent = () => {
        if (!user)
            return (0, jsx_runtime_1.jsx)(Login_1.default, {});
        if (currentView === 'PROFILE') {
            return (0, jsx_runtime_1.jsx)(Profile_1.default, {});
        }
        if (currentView === 'TEST_HISTORY' && user.role === types_1.UserRole.STUDENT) {
            return (0, jsx_runtime_1.jsx)(TestHistory_1.default, { onStartDrill: handleStartDrill });
        }
        if (currentView === 'DRILL' && user.role === types_1.UserRole.STUDENT) {
            return ((0, jsx_runtime_1.jsx)(DrillEngine_1.default, { subjectId: activeSubjectId || '1', difficultyTierId: activeTierId || undefined, onComplete: () => setView('DASHBOARD') }));
        }
        switch (user.role) {
            case types_1.UserRole.ADMIN: return (0, jsx_runtime_1.jsx)(AdminDashboard_1.default, {});
            case types_1.UserRole.FACULTY: return (0, jsx_runtime_1.jsx)(FacultyDashboard_1.default, {});
            case types_1.UserRole.STUDENT: return (0, jsx_runtime_1.jsx)(StudentDashboard_1.default, { onStartDrill: handleStartDrill });
            default: return (0, jsx_runtime_1.jsx)(Login_1.default, {});
        }
    };
    return ((0, jsx_runtime_1.jsx)(AuthContext.Provider, { value: {
            user,
            login,
            logout,
            currentView,
            setView,
            activeTab,
            setActiveTab,
            allowedStudents,
            setAllowedStudents,
            updateUserProfile
        }, children: (0, jsx_runtime_1.jsx)(Layout_1.Layout, { children: renderContent() }) }));
};
exports.default = App;
//# sourceMappingURL=App.js.map