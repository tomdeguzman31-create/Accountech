"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const constants_1 = require("../constants");
const types_1 = require("../types");
const Skeleton_1 = require("../components/Skeleton");
const TestHistory = ({ onStartDrill }) => {
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [selectedSession, setSelectedSession] = (0, react_1.useState)(null);
    const [historySearchTerm, setHistorySearchTerm] = (0, react_1.useState)('');
    const [historySubjectFilter, setHistorySubjectFilter] = (0, react_1.useState)('All');
    const [historyStatusFilter, setHistoryStatusFilter] = (0, react_1.useState)('All');
    const [startDate, setStartDate] = (0, react_1.useState)('');
    const [endDate, setEndDate] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);
    // Mock Session Data (Same as in StudentDashboard for consistency)
    const recentSessions = [
        {
            id: 's1',
            subject: 'FAR',
            subjectFullName: 'Financial Accounting and Reporting',
            score: '18/20',
            rawScore: 18,
            totalQuestions: 20,
            date: 'Today, 10:15 AM',
            fullDate: 'October 24, 2024 - 10:15 AM',
            timestamp: '2024-10-24T10:15:00Z',
            status: 'Passed',
            percentage: 90,
            timeSpent: '14m 22s',
            topics: [
                { name: 'IAS 1: Presentation of FS', correct: true },
                { name: 'IFRS 15: Revenue Recognition', correct: true },
                { name: 'IAS 16: Property, Plant & Equipment', correct: false },
                { name: 'Conceptual Framework', correct: true }
            ]
        },
        {
            id: 's2',
            subject: 'TAX',
            subjectFullName: 'Taxation',
            score: '14/20',
            rawScore: 14,
            totalQuestions: 20,
            date: 'Yesterday',
            fullDate: 'October 23, 2024 - 03:45 PM',
            timestamp: '2024-10-23T15:45:00Z',
            status: 'Passed',
            percentage: 70,
            timeSpent: '18m 05s',
            topics: [
                { name: 'Income Taxation', correct: true },
                { name: 'Value Added Tax', correct: false },
                { name: 'Estate Tax', correct: true },
                { name: 'Tax Remedies', correct: true }
            ]
        },
        {
            id: 's3',
            subject: 'AUD',
            subjectFullName: 'Auditing',
            score: '9/20',
            rawScore: 9,
            totalQuestions: 20,
            date: 'Oct 22',
            fullDate: 'October 22, 2024 - 11:20 AM',
            timestamp: '2024-10-22T11:20:00Z',
            status: 'Remedial',
            percentage: 45,
            timeSpent: '22m 10s',
            topics: [
                { name: 'Audit Reports', correct: false },
                { name: 'Internal Control', correct: false },
                { name: 'Audit Evidence', correct: true },
                { name: 'Professional Ethics', correct: false }
            ]
        },
        {
            id: 's4',
            subject: 'MAS',
            subjectFullName: 'Management Advisory Services',
            score: '16/20',
            rawScore: 16,
            totalQuestions: 20,
            date: 'Oct 20',
            fullDate: 'October 20, 2024 - 09:00 AM',
            timestamp: '2024-10-20T09:00:00Z',
            status: 'Passed',
            percentage: 80,
            timeSpent: '25m 30s',
            topics: [
                { name: 'Cost-Volume-Profit', correct: true },
                { name: 'Budgeting', correct: true },
                { name: 'Standard Costing', correct: false },
                { name: 'Financial Statement Analysis', correct: true }
            ]
        },
        {
            id: 's5',
            subject: 'RFBT',
            subjectFullName: 'Regulatory Framework for Business Transactions',
            score: '12/20',
            rawScore: 12,
            totalQuestions: 20,
            date: 'Oct 18',
            fullDate: 'October 18, 2024 - 02:15 PM',
            timestamp: '2024-10-18T14:15:00Z',
            status: 'Passed',
            percentage: 60,
            timeSpent: '30m 00s',
            topics: [
                { name: 'Obligations', correct: true },
                { name: 'Contracts', correct: true },
                { name: 'Sales', correct: false },
                { name: 'Agency', correct: false }
            ]
        },
        {
            id: 's6',
            subject: 'AFAR',
            subjectFullName: 'Advanced Financial Accounting and Reporting',
            score: '15/20',
            rawScore: 15,
            totalQuestions: 20,
            date: 'Oct 15',
            fullDate: 'October 15, 2024 - 10:30 AM',
            timestamp: '2024-10-15T10:30:00Z',
            status: 'Passed',
            percentage: 75,
            timeSpent: '28m 15s',
            topics: [
                { name: 'Partnership', correct: true },
                { name: 'Corporate Liquidation', correct: true },
                { name: 'Joint Arrangements', correct: true },
                { name: 'Consolidation', correct: false }
            ]
        },
    ];
    const filteredHistory = (0, react_1.useMemo)(() => {
        return recentSessions.filter(session => {
            const matchesSearch = session.subjectFullName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                session.subject.toLowerCase().includes(historySearchTerm.toLowerCase());
            const matchesSubject = historySubjectFilter === 'All' || session.subject === historySubjectFilter;
            const matchesStatus = historyStatusFilter === 'All' || session.status === historyStatusFilter;
            const sessionDate = new Date(session.timestamp);
            const matchesStartDate = !startDate || sessionDate >= new Date(startDate);
            const matchesEndDate = !endDate || sessionDate <= new Date(endDate);
            return matchesSearch && matchesSubject && matchesStatus && matchesStartDate && matchesEndDate;
        });
    }, [historySearchTerm, historySubjectFilter, historyStatusFilter, startDate, endDate, recentSessions]);
    const handleDownload = () => {
        const headers = ['Subject', 'Score', 'Percentage', 'Date', 'Status', 'Time Spent'];
        const csvContent = [
            headers.join(','),
            ...filteredHistory.map(s => [
                s.subject,
                s.score,
                `${s.percentage}%`,
                s.fullDate,
                s.status,
                s.timeSpent
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Test_History_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    if (isLoading) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-8 animate-pulse", children: [(0, jsx_runtime_1.jsx)(Skeleton_1.Skeleton, { className: "h-20 w-full rounded-2xl" }), (0, jsx_runtime_1.jsx)(Skeleton_1.Skeleton, { className: "h-[600px] w-full rounded-[2rem]" })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-8 animate-in fade-in duration-500", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col md:flex-row items-center justify-between gap-6 mb-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "p-2 bg-slate-100 rounded-xl text-slate-600", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { size: 24 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg md:text-xl font-black text-slate-800 tracking-tight", children: "Comprehensive Test History" }), (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] md:text-xs text-slate-400 font-medium", children: "Audit trail of all adaptive drill attempts" })] })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: handleDownload, className: "flex items-center justify-center gap-2 px-6 py-3 bg-[#1e3a8a] text-white rounded-xl font-bold text-sm shadow-lg hover:bg-[#1e3a8a]/90 transition-all active:scale-95", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 16 }), "Export Data"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8 p-4 bg-slate-50/50 rounded-2xl border border-slate-100", children: [(0, jsx_runtime_1.jsxs)("div", { className: "lg:col-span-12 relative", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400", size: 16 }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search by subject or topic...", className: "w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all", value: historySearchTerm, onChange: (e) => setHistorySearchTerm(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "lg:col-span-6 flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative flex-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Calendar, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400", size: 14 }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all", value: startDate, onChange: (e) => setStartDate(e.target.value) })] }), (0, jsx_runtime_1.jsx)("span", { className: "text-slate-400 font-bold text-[10px] uppercase", children: "to" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative flex-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Calendar, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400", size: 14 }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] transition-all", value: endDate, onChange: (e) => setEndDate(e.target.value) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "lg:col-span-6 flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative flex-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Filter, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400", size: 14 }), (0, jsx_runtime_1.jsxs)("select", { className: "w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer hover:bg-slate-50 transition-all focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]", value: historySubjectFilter, onChange: (e) => setHistorySubjectFilter(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "All", children: "All Subjects" }), constants_1.MOCK_SUBJECTS.map(sub => ((0, jsx_runtime_1.jsx)("option", { value: sub.code, children: sub.code }, sub.id)))] }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", size: 12 })] }), (0, jsx_runtime_1.jsxs)("div", { className: "relative flex-1", children: [(0, jsx_runtime_1.jsxs)("select", { className: "w-full pl-4 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer hover:bg-slate-50 transition-all focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]", value: historyStatusFilter, onChange: (e) => setHistoryStatusFilter(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "All", children: "All Status" }), (0, jsx_runtime_1.jsx)("option", { value: "Passed", children: "Passed" }), (0, jsx_runtime_1.jsx)("option", { value: "Remedial", children: "Remedial" })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", size: 12 })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                            setHistorySearchTerm('');
                                            setHistorySubjectFilter('All');
                                            setHistoryStatusFilter('All');
                                            setStartDate('');
                                            setEndDate('');
                                        }, className: "p-2.5 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all", title: "Reset Filters", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 18 }) })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "hidden md:block overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full border-separate border-spacing-y-3", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4", children: [(0, jsx_runtime_1.jsx)("th", { className: "pb-4 pl-6", children: "Subject" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-4", children: "Date & Time" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-4", children: "Score" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-4", children: "Accuracy" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-4", children: "Time Spent" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-4", children: "Status" }), (0, jsx_runtime_1.jsx)("th", { className: "pb-4 text-right pr-6", children: "Action" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: filteredHistory.map((session) => ((0, jsx_runtime_1.jsxs)("tr", { className: "bg-white group hover:bg-slate-50 transition-all border border-slate-50 rounded-2xl shadow-sm", children: [(0, jsx_runtime_1.jsx)("td", { className: "py-4 pl-6 rounded-l-2xl border-y border-l border-slate-50", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${session.status === 'Passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`, children: session.subject }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-black text-slate-800", children: session.subjectFullName })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-4 border-y border-slate-50", children: (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-bold text-slate-500", children: session.fullDate }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-4 border-y border-slate-50", children: (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-black text-slate-800", children: session.score }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-4 border-y border-slate-50", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: `h-full rounded-full ${session.status === 'Passed' ? 'bg-emerald-500' : 'bg-red-500'}`, style: { width: `${session.percentage}%` } }) }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs font-black text-slate-700", children: [session.percentage, "%"] })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-4 border-y border-slate-50", children: (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-bold text-slate-500", children: session.timeSpent }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-4 border-y border-slate-50", children: (0, jsx_runtime_1.jsx)("span", { className: `text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${session.status === 'Passed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`, children: session.status }) }), (0, jsx_runtime_1.jsx)("td", { className: "py-4 pr-6 text-right rounded-r-2xl border-y border-r border-slate-50", children: (0, jsx_runtime_1.jsx)("button", { onClick: () => setSelectedSession(session), className: "p-2 hover:bg-white rounded-xl text-slate-400 hover:text-[#1e3a8a] transition-all shadow-sm border border-transparent hover:border-slate-100", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { size: 18 }) }) })] }, session.id))) })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "md:hidden space-y-4", children: filteredHistory.map((session) => ((0, jsx_runtime_1.jsxs)("div", { onClick: () => setSelectedSession(session), className: "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] transition-all", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${session.status === 'Passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`, children: session.subject }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-black text-slate-800 leading-none", children: session.subjectFullName }), (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] text-slate-400 font-bold mt-1", children: session.date })] })] }), (0, jsx_runtime_1.jsx)("span", { className: `text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${session.status === 'Passed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`, children: session.status })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4 pt-4 border-t border-slate-50", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Score" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-black text-slate-800", children: session.score })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Time Spent" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-black text-slate-800", children: session.timeSpent })] }), (0, jsx_runtime_1.jsxs)("div", { className: "col-span-2", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1", children: "Accuracy" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: `h-full rounded-full ${session.status === 'Passed' ? 'bg-emerald-500' : 'bg-red-500'}`, style: { width: `${session.percentage}%` } }) }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs font-black text-slate-700", children: [session.percentage, "%"] })] })] })] })] }, session.id))) }), filteredHistory.length === 0 && ((0, jsx_runtime_1.jsx)("div", { className: "py-12 text-center text-slate-400 font-medium", children: "No test records found matching your filters." }))] }), selectedSession && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-[#1e3a8a] p-8 text-white relative", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setSelectedSession(null), className: "absolute top-6 right-6 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 20 }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4 mb-4", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${selectedSession.status === 'Passed' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`, children: selectedSession.subject }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-2xl font-black tracking-tight", children: selectedSession.subjectFullName }), (0, jsx_runtime_1.jsxs)("p", { className: "text-blue-200 text-xs font-medium flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Calendar, { size: 12 }), " ", selectedSession.fullDate] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-3 gap-4 pt-4 border-t border-white/10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1", children: "Total Score" }), (0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-black", children: selectedSession.score })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center border-x border-white/10", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1", children: "Accuracy" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-2xl font-black", children: [selectedSession.percentage, "%"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1", children: "Time Spent" }), (0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-black", children: selectedSession.timeSpent })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-8 space-y-8 max-h-[60vh] overflow-y-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.BarChart3, { size: 18, className: "text-[#1e3a8a]" }), (0, jsx_runtime_1.jsx)("h4", { className: "text-sm font-black text-slate-800 uppercase tracking-tight", children: "Performance Breakdown" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest", children: "Cognitive Mastery" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-black text-slate-800 mt-1", children: selectedSession.percentage > 70 ? 'Ready for Application' : 'Focus on Recall' })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.Layers, { size: 24, className: "text-slate-300" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest", children: "Result Status" }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm font-black mt-1 ${selectedSession.status === 'Passed' ? 'text-emerald-600' : 'text-red-600'}`, children: selectedSession.status === 'Passed' ? 'Board Eligible' : 'Remedial Required' })] }), selectedSession.status === 'Passed' ? (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 24, className: "text-emerald-500" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { size: 24, className: "text-red-500" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { size: 18, className: "text-[#065f46]" }), (0, jsx_runtime_1.jsx)("h4", { className: "text-sm font-black text-slate-800 uppercase tracking-tight", children: "Topics Audited" })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: selectedSession.topics.map((topic, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: `p-1.5 rounded-lg ${topic.correct ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`, children: topic.correct ? (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 16 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 16 }) }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-bold text-slate-700", children: topic.name })] }), (0, jsx_runtime_1.jsx)("span", { className: `text-[10px] font-black uppercase px-2 py-0.5 rounded ${topic.correct ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`, children: topic.correct ? 'Mastered' : 'Gap Found' })] }, i))) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-8 border-t border-slate-50 flex gap-4", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setSelectedSession(null), className: "flex-1 py-4 border border-slate-200 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all", children: "Close Report" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                        setSelectedSession(null);
                                        onStartDrill(constants_1.MOCK_SUBJECTS.find(s => s.code === selectedSession.subject)?.id || '1');
                                    }, className: "flex-[2] py-4 bg-[#1e3a8a] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all", children: "Launch Remedial Drill" })] })] }) }))] }));
};
exports.default = TestHistory;
//# sourceMappingURL=TestHistory.js.map