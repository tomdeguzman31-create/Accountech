"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const recharts_1 = require("recharts");
const constants_1 = require("../constants");
const Skeleton_1 = require("../components/Skeleton");
const types_1 = require("../types");
const StudentDashboard = ({ onStartDrill }) => {
    const [selectedSubjectId, setSelectedSubjectId] = (0, react_1.useState)(constants_1.MOCK_SUBJECTS[0].id);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [selectedSession, setSelectedSession] = (0, react_1.useState)(null);
    const [selectedTierId, setSelectedTierId] = (0, react_1.useState)(constants_1.INITIAL_DIFFICULTY_TIERS[0].id);
    const [startDate, setStartDate] = (0, react_1.useState)('');
    const [endDate, setEndDate] = (0, react_1.useState)('');
    // Simulated Loading Effect
    (0, react_1.useEffect)(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);
    // Mock Session Data
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
    const filteredSessions = (0, react_1.useMemo)(() => {
        return recentSessions.filter(s => {
            const sessionDate = new Date(s.timestamp);
            const matchesStartDate = !startDate || sessionDate >= new Date(startDate);
            const matchesEndDate = !endDate || sessionDate <= new Date(endDate);
            return matchesStartDate && matchesEndDate;
        });
    }, [recentSessions, startDate, endDate]);
    const handleDownload = () => {
        const headers = ['Subject', 'Score', 'Percentage', 'Date', 'Status', 'Time Spent'];
        const csvContent = [
            headers.join(','),
            ...filteredSessions.map(s => [
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
        link.setAttribute('download', `Dashboard_History_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    // Generate mock data for visualization
    const masteryData = (0, react_1.useMemo)(() => {
        const rawData = constants_1.MOCK_SUBJECTS.map(sub => ({
            id: sub.id,
            name: sub.code,
            fullName: sub.name,
            mastery: Math.floor(Math.random() * 45) + 40, // 40-85%
            trend: Math.random() > 0.3 ? 'up' : 'down',
            trendValue: Math.floor(Math.random() * 8) + 1,
            level: '', // Calculated below
        })).map(item => ({
            ...item,
            level: item.mastery > 80 ? 'Proficient' : item.mastery > 60 ? 'Competent' : 'Developing'
        }));
        if (!searchTerm)
            return rawData;
        return rawData.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);
    if (isLoading) {
        return (0, jsx_runtime_1.jsx)(Skeleton_1.StudentDashboardSkeleton, {});
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-8 animate-in fade-in duration-500", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-gradient-to-br from-[#1e3a8a] via-[#1e3a8a] to-[#065f46] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 lg:p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-10 shadow-2xl relative overflow-hidden border border-white/10", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-0 right-0 w-64 h-64 bg-[#facc15] opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-0 left-0 w-48 h-48 bg-[#065f46] opacity-30 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6 flex-1 relative z-10 text-center lg:text-left w-full", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[#facc15] mx-auto lg:mx-0", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { size: 12 }), " Adaptive Session Active"] }), (0, jsx_runtime_1.jsxs)("h3", { className: "text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-tight", children: ["Push your limits, ", (0, jsx_runtime_1.jsx)("span", { className: "text-[#facc15]", children: "Juan." })] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-blue-100 text-sm md:text-base lg:text-lg opacity-80 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed", children: ["Your overall readiness is ", (0, jsx_runtime_1.jsx)("span", { className: "font-black text-white", children: "72%" }), ". Focus on ", (0, jsx_runtime_1.jsx)("span", { className: "font-black text-white", children: "Auditing" }), " today to maximize your board passing probability."] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 bg-white/5 backdrop-blur-xl px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold border border-white/10 shadow-inner", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { size: 14, className: "text-[#facc15]" }), (0, jsx_runtime_1.jsx)("span", { className: "text-blue-50", children: "7 Day Hot Streak" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 bg-white/5 backdrop-blur-xl px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold border border-white/10 shadow-inner", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Trophy, { size: 14, className: "text-[#facc15]" }), (0, jsx_runtime_1.jsx)("span", { className: "text-blue-50", children: "Top 5%" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white/10 backdrop-blur-2xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/20 w-full lg:w-96 space-y-5 shadow-2xl relative z-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-[10px] font-black uppercase tracking-widest text-emerald-300 ml-1", children: "Focus Curriculum" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative group", children: [(0, jsx_runtime_1.jsx)("select", { value: selectedSubjectId, onChange: (e) => setSelectedSubjectId(e.target.value), className: "w-full bg-white text-slate-800 p-4 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-[#facc15]/30 appearance-none cursor-pointer transition-all shadow-lg", children: constants_1.MOCK_SUBJECTS.map(sub => ((0, jsx_runtime_1.jsxs)("option", { value: sub.id, children: [sub.code, " \u2014 ", sub.name] }, sub.id))) }), (0, jsx_runtime_1.jsx)("div", { className: "absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-[#1e3a8a] transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { size: 18, className: "rotate-90" }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-[10px] font-black uppercase tracking-widest text-emerald-300 ml-1", children: "Difficulty Tier" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 gap-2", children: constants_1.INITIAL_DIFFICULTY_TIERS.map((tier) => ((0, jsx_runtime_1.jsxs)("button", { onClick: () => setSelectedTierId(tier.id), className: `p-3 rounded-xl border transition-all text-left flex items-center justify-between ${selectedTierId === tier.id
                                                ? 'bg-[#facc15] border-[#facc15] text-[#065f46] shadow-lg scale-[1.02]'
                                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[11px] font-black leading-none", children: tier.name }), (0, jsx_runtime_1.jsx)("p", { className: `text-[9px] mt-0.5 font-medium opacity-70 line-clamp-1 ${selectedTierId === tier.id ? 'text-[#065f46]' : 'text-blue-100'}`, children: tier.description })] }), selectedTierId === tier.id && (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 14 })] }, tier.id))) })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => onStartDrill(selectedSubjectId, selectedTierId), className: "w-full bg-[#facc15] text-[#065f46] py-5 rounded-2xl font-black text-sm hover:scale-[1.03] hover:shadow-[#facc15]/20 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl", children: ["LAUNCH ADAPTIVE DRILL", (0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { size: 18, fill: "currentColor" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "lg:col-span-2 space-y-6 md:space-y-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "p-2 bg-blue-50 rounded-xl text-[#1e3a8a]", children: (0, jsx_runtime_1.jsx)(lucide_react_1.BarChart3, { size: 24 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg md:text-xl font-black text-slate-800 tracking-tight", children: "CMA Curriculum Mastery" }), (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] md:text-xs text-slate-400 font-medium", children: "Cross-subject proficiency distribution" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex gap-2 self-start sm:self-auto", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-2 h-2 rounded-full bg-emerald-500" }), (0, jsx_runtime_1.jsx)("span", { className: "text-[9px] md:text-[10px] font-black text-emerald-700 uppercase", children: "Board Ready" })] }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-64 w-full", children: (0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.BarChart, { data: masteryData, layout: "vertical", margin: { left: -20, right: 10 }, children: [(0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3", horizontal: true, vertical: false, stroke: "#f1f5f9" }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { type: "number", hide: true, domain: [0, 100] }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { dataKey: "name", type: "category", axisLine: false, tickLine: false, tick: { fill: '#64748b', fontSize: 10, fontWeight: 800 }, width: 60 }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { cursor: { fill: '#f8fafc' }, contentStyle: { borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }, formatter: (value) => [`${value}% Mastery`, 'Performance'] }), (0, jsx_runtime_1.jsx)(recharts_1.Bar, { dataKey: "mastery", radius: [0, 8, 8, 0], barSize: 20, children: masteryData.map((entry, index) => ((0, jsx_runtime_1.jsx)(recharts_1.Cell, { fill: entry.mastery > 75 ? constants_1.COLORS.PH_GREEN : entry.mastery > 60 ? constants_1.COLORS.PH_BLUE : '#94a3b8' }, `cell-${index}`))) })] }) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-xl font-black text-slate-800 tracking-tight flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.BookOpen, { size: 20, className: "text-[#1e3a8a]" }), " Curriculum Explorer"] }), (0, jsx_runtime_1.jsxs)("div", { className: "relative max-w-xs w-full", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400", size: 16 }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Find subject...", className: "w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#1e3a8a] transition-all", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [masteryData.map((data, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "group p-6 rounded-[1.5rem] border border-slate-100 bg-white hover:shadow-2xl hover:border-[#facc15]/30 hover:-translate-y-1.5 transition-all relative overflow-hidden flex flex-col justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-start mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-[10px] font-black text-white bg-[#1e3a8a] px-2 py-1 rounded-md shadow-sm", children: data.name }), (0, jsx_runtime_1.jsx)("span", { className: `text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${data.level === 'Proficient' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                                    data.level === 'Competent' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`, children: data.level })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-black text-slate-800 pt-2 leading-tight", children: data.fullName })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-right", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-3xl font-black text-slate-900 leading-none", children: [data.mastery, "%"] }), (0, jsx_runtime_1.jsxs)("div", { className: `flex items-center justify-end gap-1 mt-1 text-[10px] font-black uppercase ${data.trend === 'up' ? 'text-emerald-500' : 'text-red-400'}`, children: [data.trend === 'up' ? (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingUp, { size: 12 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.TrendingDown, { size: 12 }), data.trendValue, "% trend"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-full bg-slate-100 h-2 rounded-full overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full rounded-full transition-all duration-1000 ease-out", style: {
                                                                        width: `${data.mastery}%`,
                                                                        backgroundColor: data.mastery > 75 ? constants_1.COLORS.PH_GREEN : constants_1.COLORS.PH_BLUE
                                                                    } }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { size: 10 }), " Last session: 2d ago"] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => onStartDrill(data.id, selectedTierId), className: "text-[10px] font-black text-[#1e3a8a] hover:text-[#065f46] flex items-center gap-1", children: ["ENTER DRILL ", (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { size: 14 })] })] })] })] }, i))), masteryData.length === 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "col-span-full py-12 text-center text-slate-400 font-medium", children: ["No board subjects found matching \"", searchTerm, "\""] }))] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6 md:space-y-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "p-2 bg-emerald-50 rounded-xl text-[#065f46]", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { size: 20, "md:size": 24 }) }), (0, jsx_runtime_1.jsx)("h3", { className: "text-lg md:text-xl font-black text-slate-800 tracking-tight", children: "Recent Sessions" })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: handleDownload, className: "flex items-center justify-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-xl font-bold text-[10px] shadow-lg hover:bg-[#1e3a8a]/90 transition-all", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 12 }), "Export Data"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-col gap-3 mb-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "date", className: "flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none", value: startDate, onChange: (e) => setStartDate(e.target.value), title: "Start Date" }), (0, jsx_runtime_1.jsx)("span", { className: "text-slate-400 font-bold text-[10px]", children: "to" }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none", value: endDate, onChange: (e) => setEndDate(e.target.value), title: "End Date" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3 md:space-y-4", children: filteredSessions.map((session) => ((0, jsx_runtime_1.jsxs)("div", { onClick: () => setSelectedSession(session), className: "flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl md:rounded-2xl border border-slate-50 hover:bg-slate-50 transition-all cursor-pointer group hover:shadow-md active:scale-[0.98]", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl shrink-0 flex items-center justify-center font-black text-xs md:text-sm shadow-sm transition-transform group-hover:scale-110 ${session.status === 'Passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`, children: session.subject }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 min-w-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-1 gap-2", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs md:text-sm font-black text-slate-800 truncate", children: session.score }), (0, jsx_runtime_1.jsx)("span", { className: "text-[9px] md:text-[10px] font-bold text-slate-400 shrink-0", children: session.date })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-1 h-1 bg-slate-100 rounded-full overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: `h-full rounded-full ${session.status === 'Passed' ? 'bg-emerald-500' : 'bg-red-500'}`, style: { width: `${session.percentage}%` } }) }), (0, jsx_runtime_1.jsx)("p", { className: `text-[9px] md:text-[10px] font-black uppercase tracking-widest shrink-0 ${session.status === 'Passed' ? 'text-emerald-500' : 'text-red-500'}`, children: session.status })] })] })] }, session.id))) }), (0, jsx_runtime_1.jsxs)("button", { onClick: handleDownload, className: "w-full mt-6 md:mt-8 py-3 md:py-4 bg-slate-50 text-slate-500 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-[#1e3a8a] hover:text-white transition-all border border-slate-100 flex items-center justify-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 14 }), "Export Data"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-[#1e3a8a] p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-0 right-0 p-4 opacity-10", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Award, { size: 80, "md:size": 100 }) }), (0, jsx_runtime_1.jsx)("h4", { className: "text-base md:text-lg font-black mb-2 relative z-10", children: "Ready for the Board?" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-[11px] md:text-xs text-blue-200 mb-6 leading-relaxed relative z-10", children: ["Based on your current trends, you have a ", (0, jsx_runtime_1.jsx)("span", { className: "text-[#facc15] font-black underline", children: "82% probability" }), " of passing the FAR and TAX sections of the 2025 CPA Board Exam."] }), (0, jsx_runtime_1.jsx)("button", { className: "w-full py-3 md:py-4 bg-[#facc15] text-[#065f46] rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all relative z-10", children: "View Passing Forecast" })] })] })] }), selectedSession && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white w-full max-w-2xl rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-[#1e3a8a] p-6 md:p-8 text-white relative", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setSelectedSession(null), className: "absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 20 }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 md:gap-4 mb-4", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl shrink-0 flex items-center justify-center font-black text-lg md:text-xl shadow-lg ${selectedSession.status === 'Passed' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`, children: selectedSession.subject }), (0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg md:text-2xl font-black tracking-tight truncate", children: selectedSession.subjectFullName }), (0, jsx_runtime_1.jsxs)("p", { className: "text-blue-200 text-[10px] md:text-xs font-medium flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Calendar, { size: 12 }), " ", selectedSession.fullDate] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-3 gap-2 md:gap-4 pt-4 border-t border-white/10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[8px] md:text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1", children: "Total Score" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg md:text-2xl font-black", children: selectedSession.score })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center border-x border-white/10", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[8px] md:text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1", children: "Accuracy" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-lg md:text-2xl font-black", children: [selectedSession.percentage, "%"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[8px] md:text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1", children: "Time Spent" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg md:text-2xl font-black", children: selectedSession.timeSpent })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-6 md:p-8 space-y-6 md:space-y-8 max-h-[50vh] overflow-y-auto custom-scrollbar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.BarChart3, { size: 18, className: "text-[#1e3a8a]" }), (0, jsx_runtime_1.jsx)("h4", { className: "text-xs md:text-sm font-black text-slate-800 uppercase tracking-tight", children: "Performance Breakdown" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-4 md:p-5 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest", children: "Cognitive Mastery" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs md:text-sm font-black text-slate-800 mt-1 truncate", children: selectedSession.percentage > 70 ? 'Ready for Application' : 'Focus on Recall' })] }), (0, jsx_runtime_1.jsx)(lucide_react_1.Layers, { size: 20, className: "text-slate-300 shrink-0" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 md:p-5 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest", children: "Result Status" }), (0, jsx_runtime_1.jsx)("p", { className: `text-xs md:text-sm font-black mt-1 truncate ${selectedSession.status === 'Passed' ? 'text-emerald-600' : 'text-red-600'}`, children: selectedSession.status === 'Passed' ? 'Board Eligible' : 'Remedial Required' })] }), selectedSession.status === 'Passed' ? (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 20, className: "text-emerald-500 shrink-0" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { size: 20, className: "text-red-500 shrink-0" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { size: 18, className: "text-[#065f46]" }), (0, jsx_runtime_1.jsx)("h4", { className: "text-xs md:text-sm font-black text-slate-800 uppercase tracking-tight", children: "Topics Audited" })] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2 md:space-y-3", children: selectedSession.topics.map((topic, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-3 md:p-4 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 md:gap-3 min-w-0", children: [(0, jsx_runtime_1.jsx)("div", { className: `p-1.5 rounded-lg shrink-0 ${topic.correct ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`, children: topic.correct ? (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 14 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 14 }) }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs md:text-sm font-bold text-slate-700 truncate", children: topic.name })] }), (0, jsx_runtime_1.jsx)("span", { className: `text-[8px] md:text-[10px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${topic.correct ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`, children: topic.correct ? 'Mastered' : 'Gap Found' })] }, i))) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-6 md:p-8 border-t border-slate-50 flex flex-col sm:flex-row gap-3 md:gap-4", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setSelectedSession(null), className: "flex-1 py-3 md:py-4 border border-slate-200 text-slate-400 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-50 transition-all order-2 sm:order-1", children: "Close Report" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => {
                                        setSelectedSession(null);
                                        onStartDrill(constants_1.MOCK_SUBJECTS.find(s => s.code === selectedSession.subject)?.id || '1');
                                    }, className: "flex-[2] py-3 md:py-4 bg-[#1e3a8a] text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all order-1 sm:order-2", children: "Launch Remedial Drill" })] })] }) }))] }));
};
exports.default = StudentDashboard;
//# sourceMappingURL=StudentDashboard.js.map