"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const recharts_1 = require("recharts");
const geminiService_1 = require("../geminiService");
const types_1 = require("../types");
const App_1 = require("../App");
const constants_1 = require("../constants");
const Skeleton_1 = require("../components/Skeleton");
const FacultyDashboard = () => {
    const { allowedStudents, setAllowedStudents, activeTab, setActiveTab } = (0, App_1.useAuth)();
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    // Parser State
    const [isParsing, setIsParsing] = (0, react_1.useState)(false);
    const [parsedQuestions, setParsedQuestions] = (0, react_1.useState)([]);
    const [uploadText, setUploadText] = (0, react_1.useState)('');
    const [selectedFile, setSelectedFile] = (0, react_1.useState)(null);
    const [parserMode, setParserMode] = (0, react_1.useState)('DOCUMENT');
    const [selectedSubjectId, setSelectedSubjectId] = (0, react_1.useState)(constants_1.MOCK_SUBJECTS[0].id);
    const [selectedDifficulty, setSelectedDifficulty] = (0, react_1.useState)(constants_1.INITIAL_DIFFICULTY_TIERS[1].name);
    const fileInputRef = (0, react_1.useRef)(null);
    // Question Bank State
    const [allQuestions, setAllQuestions] = (0, react_1.useState)(constants_1.MOCK_QUESTIONS);
    const [bankSearch, setBankSearch] = (0, react_1.useState)('');
    const [bankSubjectFilter, setBankSubjectFilter] = (0, react_1.useState)('ALL');
    const [bankDifficultyFilter, setBankDifficultyFilter] = (0, react_1.useState)('ALL');
    const [selectedQuestionIds, setSelectedQuestionIds] = (0, react_1.useState)([]);
    const filteredQuestions = (0, react_1.useMemo)(() => {
        return allQuestions.filter(q => {
            const matchesSearch = q.content.toLowerCase().includes(bankSearch.toLowerCase()) ||
                q.topic.toLowerCase().includes(bankSearch.toLowerCase());
            const matchesSubject = bankSubjectFilter === 'ALL' || q.subjectId === bankSubjectFilter;
            const matchesDifficulty = bankDifficultyFilter === 'ALL' || q.difficulty === bankDifficultyFilter;
            return matchesSearch && matchesSubject && matchesDifficulty;
        });
    }, [allQuestions, bankSearch, bankSubjectFilter, bankDifficultyFilter]);
    // Enrollment State
    const [bulkInput, setBulkInput] = (0, react_1.useState)('');
    const [enrollmentError, setEnrollmentError] = (0, react_1.useState)('');
    const [successMessage, setSuccessMessage] = (0, react_1.useState)('');
    // Roster Filter State
    const [rosterSearch, setRosterSearch] = (0, react_1.useState)('');
    const [rosterAccuracyFilter, setRosterAccuracyFilter] = (0, react_1.useState)('ALL');
    const [startDate, setStartDate] = (0, react_1.useState)('');
    const [endDate, setEndDate] = (0, react_1.useState)('');
    const filteredRoster = (0, react_1.useMemo)(() => {
        let result = allowedStudents.filter(s => {
            const matchesSearch = s.studentId.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                s.email.toLowerCase().includes(rosterSearch.toLowerCase());
            if (!matchesSearch)
                return false;
            const score = s.accuracyScore || 0;
            if (rosterAccuracyFilter === 'READY')
                return score >= 75;
            if (rosterAccuracyFilter === 'DEVELOPING')
                return score >= 50 && score < 75;
            if (rosterAccuracyFilter === 'AT_RISK')
                return score < 50;
            return true;
        });
        return result.sort((a, b) => (b.accuracyScore || 0) - (a.accuracyScore || 0));
    }, [allowedStudents, rosterSearch, rosterAccuracyFilter]);
    (0, react_1.useEffect)(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, [activeTab]);
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };
    const handleSimulateUpload = async () => {
        if (parserMode === 'TEXT' && !uploadText)
            return;
        if (parserMode === 'DOCUMENT' && !selectedFile)
            return;
        setIsParsing(true);
        try {
            const subject = constants_1.MOCK_SUBJECTS.find(s => s.id === selectedSubjectId);
            let input = uploadText;
            if (parserMode === 'DOCUMENT' && selectedFile) {
                const base64 = await fileToBase64(selectedFile);
                input = { data: base64, mimeType: selectedFile.type };
            }
            const results = await (0, geminiService_1.parseDocumentToQuestions)(input, subject?.name, selectedDifficulty);
            const formattedResults = results.map((q) => ({
                ...q,
                id: Math.random().toString(36).substr(2, 9),
                subjectId: selectedSubjectId,
                isActive: true
            }));
            setParsedQuestions(formattedResults);
            setAllQuestions(prev => [...prev, ...formattedResults]);
        }
        catch (err) {
            console.error(err);
            alert("Error parsing document. Please ensure it's a valid PDF or text file.");
        }
        finally {
            setIsParsing(false);
        }
    };
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/pdf' || file.type === 'text/plain') {
                setSelectedFile(file);
            }
            else {
                alert("Only .pdf and .txt are supported.");
            }
        }
    };
    const handleWhitelistStudents = () => {
        setEnrollmentError('');
        setSuccessMessage('');
        if (!bulkInput.trim())
            return setEnrollmentError('Input cannot be empty.');
        const lines = bulkInput.split('\n');
        const newStudents = [];
        const errors = [];
        lines.forEach((line, index) => {
            if (!line.trim())
                return;
            const parts = line.split(',').map(p => p.trim());
            if (parts.length !== 2) {
                errors.push(`Line ${index + 1}: Format error.`);
                return;
            }
            const [id, email] = parts;
            if (allowedStudents.some(s => s.studentId === id || s.email === email)) {
                errors.push(`Line ${index + 1}: Duplicate.`);
            }
            else {
                newStudents.push({ studentId: id, email: email });
            }
        });
        if (errors.length > 0)
            return setEnrollmentError(errors.join(' '));
        setAllowedStudents([...allowedStudents, ...newStudents]);
        setBulkInput('');
        setSuccessMessage(`Enrolled ${newStudents.length} students.`);
        setTimeout(() => setSuccessMessage(''), 3000);
    };
    const handleToggleQuestionStatus = (id) => {
        setAllQuestions(prev => prev.map(q => q.id === id ? { ...q, isActive: !q.isActive } : q));
    };
    const handleDeleteQuestion = (id) => {
        setAllQuestions(prev => prev.filter(q => q.id !== id));
        setSelectedQuestionIds(prev => prev.filter(qid => qid !== id));
    };
    const handleBulkToggleStatus = (active) => {
        setAllQuestions(prev => prev.map(q => selectedQuestionIds.includes(q.id) ? { ...q, isActive: active } : q));
        setSelectedQuestionIds([]);
    };
    const handleBulkDelete = () => {
        setAllQuestions(prev => prev.filter(q => !selectedQuestionIds.includes(q.id)));
        setSelectedQuestionIds([]);
    };
    const handleToggleSelect = (id) => {
        setSelectedQuestionIds(prev => prev.includes(id) ? prev.filter(qid => qid !== id) : [...prev, id]);
    };
    const handleSelectAll = () => {
        if (selectedQuestionIds.length === filteredQuestions.length) {
            setSelectedQuestionIds([]);
        }
        else {
            setSelectedQuestionIds(filteredQuestions.map(q => q.id));
        }
    };
    const stats = (0, react_1.useMemo)(() => {
        const total = allowedStudents.length;
        const avg = total > 0
            ? allowedStudents.reduce((acc, s) => acc + (s.accuracyScore || 0), 0) / total
            : 0;
        const atRisk = allowedStudents.filter(s => (s.accuracyScore || 0) < 50).length;
        const developing = allowedStudents.filter(s => (s.accuracyScore || 0) >= 50 && (s.accuracyScore || 0) < 75).length;
        const ready = allowedStudents.filter(s => (s.accuracyScore || 0) >= 75).length;
        return { total, avg, atRisk, developing, ready };
    }, [allowedStudents]);
    const readinessData = [
        { name: 'Ready', value: stats.ready, color: '#10b981' },
        { name: 'Developing', value: stats.developing, color: '#facc15' },
        { name: 'At Risk', value: stats.atRisk, color: '#ef4444' },
    ];
    const topPerformers = [...allowedStudents]
        .sort((a, b) => (b.accuracyScore || 0) - (a.accuracyScore || 0))
        .slice(0, 5)
        .map(s => ({ name: s.studentId, score: s.accuracyScore || 0 }));
    const downloadAnalytics = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        if (activeTab === 'ROSTER') {
            csvContent += "Student ID,Email,Accuracy Score,Status\n";
            allowedStudents.forEach(s => {
                const status = (s.accuracyScore || 0) >= 75 ? "READY" : (s.accuracyScore || 0) >= 50 ? "DEVELOPING" : "AT_RISK";
                csvContent += `${s.studentId},${s.email},${s.accuracyScore || 0}%,${status}\n`;
            });
        }
        else if (activeTab === 'QUESTION_BANK') {
            csvContent += "ID,Subject,Topic,Difficulty,Status\n";
            allQuestions.forEach(q => {
                const subject = constants_1.MOCK_SUBJECTS.find(s => s.id === q.subjectId)?.code || q.subjectId;
                csvContent += `${q.id},${subject},${q.topic},${q.difficulty},${q.isActive ? 'Active' : 'Inactive'}\n`;
            });
        }
        else {
            // General Insights
            csvContent += "Metric,Value\n";
            if (startDate || endDate) {
                csvContent += `Date Range,${startDate || 'N/A'} to ${endDate || 'N/A'}\n`;
            }
            csvContent += `Board Readiness,${stats.avg.toFixed(1)}%\n`;
            csvContent += `Total Questions,${allQuestions.length}\n`;
            csvContent += `At-Risk Students,${stats.atRisk}\n`;
            csvContent += `Developing Students,${stats.developing}\n`;
            csvContent += `Ready Students,${stats.ready}\n`;
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
    if (isLoading) {
        if (activeTab === 'ROSTER')
            return (0, jsx_runtime_1.jsx)(Skeleton_1.RosterSkeleton, {});
        if (activeTab === 'QUESTION_BANK')
            return (0, jsx_runtime_1.jsx)(Skeleton_1.QuestionBankSkeleton, {});
        return activeTab === 'INSIGHTS' ? (0, jsx_runtime_1.jsx)(Skeleton_1.DashboardSkeleton, {}) : (0, jsx_runtime_1.jsx)(Skeleton_1.TableSkeleton, {});
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6 animate-in fade-in duration-500", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex flex-col md:flex-row justify-between items-center gap-4", children: activeTab === 'INSIGHTS' && ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-3 w-full md:w-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Calendar, { size: 14, className: "text-slate-400" }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "text-[11px] font-bold text-slate-600 outline-none bg-transparent", value: startDate, onChange: (e) => setStartDate(e.target.value) }), (0, jsx_runtime_1.jsx)("span", { className: "text-slate-300 text-[10px] font-black", children: "TO" }), (0, jsx_runtime_1.jsx)("input", { type: "date", className: "text-[11px] font-bold text-slate-600 outline-none bg-transparent", value: endDate, onChange: (e) => setEndDate(e.target.value) }), (startDate || endDate) && ((0, jsx_runtime_1.jsx)("button", { onClick: () => { setStartDate(''); setEndDate(''); }, className: "text-slate-400 hover:text-red-500 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 14 }) }))] }), (0, jsx_runtime_1.jsxs)("button", { onClick: downloadAnalytics, className: "flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-all shadow-md", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { size: 14 }), "Export Data"] })] })) }), activeTab === 'INSIGHTS' && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-6 rounded-2xl border border-slate-100 shadow-sm", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest", children: "Board Readiness" }), (0, jsx_runtime_1.jsxs)("h4", { className: "text-2xl font-black text-slate-800 mt-1", children: [stats.avg.toFixed(1), "%"] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-emerald-500", style: { width: `${stats.avg}%` } }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-6 rounded-2xl border border-slate-100 shadow-sm", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest", children: "Question Bank Size" }), (0, jsx_runtime_1.jsx)("h4", { className: "text-2xl font-black text-slate-800 mt-1", children: allQuestions.length }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-emerald-600 font-bold mt-2", children: ["\u2191 ", parsedQuestions.length, " parsed items"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-6 rounded-2xl border border-slate-100 shadow-sm", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest", children: "At-Risk Students" }), (0, jsx_runtime_1.jsx)("h4", { className: "text-2xl font-black text-red-600 mt-1", children: stats.atRisk }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-400 font-bold mt-2", children: "Immediate intervention suggested" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-8 rounded-2xl border border-slate-100 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-8", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.PieChart, { className: "text-blue-500", size: 20 }), (0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-black text-slate-800", children: "Readiness Distribution" })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-64", children: (0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.PieChart, { children: [(0, jsx_runtime_1.jsx)(recharts_1.Pie, { data: readinessData, cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 80, paddingAngle: 5, dataKey: "value", children: readinessData.map((entry, index) => ((0, jsx_runtime_1.jsx)(recharts_1.Cell, { fill: entry.color }, `cell-${index}`))) }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, {})] }) }) }), (0, jsx_runtime_1.jsx)("div", { className: "mt-4 space-y-3", children: readinessData.map((entry, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: entry.color } }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-bold text-slate-600", children: entry.name })] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs font-black text-slate-800", children: [entry.value, " students"] })] }, i))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-8 rounded-2xl border border-slate-100 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-8", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Target, { className: "text-emerald-500", size: 20 }), (0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-black text-slate-800", children: "Top Performers" })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-80", children: (0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.BarChart, { data: topPerformers, layout: "vertical", children: [(0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3", horizontal: false, stroke: "#f1f5f9" }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { type: "number", domain: [0, 100], hide: true }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { dataKey: "name", type: "category", axisLine: false, tickLine: false, tick: { fill: '#64748b', fontSize: 10, fontWeight: 'bold' }, width: 100 }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { cursor: { fill: '#f8fafc' } }), (0, jsx_runtime_1.jsx)(recharts_1.Bar, { dataKey: "score", radius: [0, 8, 8, 0], barSize: 30, children: topPerformers.map((entry, index) => ((0, jsx_runtime_1.jsx)(recharts_1.Cell, { fill: entry.score >= 75 ? '#10b981' : constants_1.COLORS.PH_BLUE }, `cell-${index}`))) })] }) }) })] })] })] })), activeTab === 'PARSER' && ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-3xl mx-auto bg-white p-6 md:p-12 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 animate-in zoom-in-95", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-xl md:text-2xl font-black text-slate-800 tracking-tight", children: "AI Curriculum Parser" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs md:text-sm text-slate-500", children: "Ingest board exam papers for automated digitization." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex p-1 bg-slate-100 rounded-2xl w-full sm:w-auto", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setParserMode('DOCUMENT'), className: `flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all ${parserMode === 'DOCUMENT' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`, children: "File Drop" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setParserMode('TEXT'), className: `flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black transition-all ${parserMode === 'TEXT' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`, children: "Manual Paste" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.BookOpen, { size: 12 }), " Target Subject"] }), (0, jsx_runtime_1.jsx)("select", { value: selectedSubjectId, onChange: (e) => setSelectedSubjectId(e.target.value), className: "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 md:px-5 md:py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all", children: constants_1.MOCK_SUBJECTS.map(sub => (0, jsx_runtime_1.jsxs)("option", { value: sub.id, children: [sub.code, " - ", sub.name] }, sub.id)) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Layers, { size: 12 }), " Cognitive Weight"] }), (0, jsx_runtime_1.jsx)("select", { value: selectedDifficulty, onChange: (e) => setSelectedDifficulty(e.target.value), className: "w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 md:px-5 md:py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all", children: constants_1.INITIAL_DIFFICULTY_TIERS.map(tier => (0, jsx_runtime_1.jsx)("option", { value: tier.name, children: tier.name }, tier.id)) })] })] }), parserMode === 'DOCUMENT' ? ((0, jsx_runtime_1.jsxs)("div", { onDrop: handleDrop, onDragOver: (e) => e.preventDefault(), onClick: () => fileInputRef.current?.click(), className: `relative border-2 border-dashed rounded-3xl md:rounded-[2rem] p-8 md:p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${selectedFile ? 'bg-blue-50/30 border-blue-200' : 'bg-slate-50/50 border-slate-200 hover:border-blue-300'}`, children: [(0, jsx_runtime_1.jsx)("input", { type: "file", ref: fileInputRef, onChange: handleFileChange, className: "hidden", accept: ".pdf,.txt" }), selectedFile ? ((0, jsx_runtime_1.jsxs)("div", { className: "text-center space-y-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-14 h-14 md:w-16 md:h-16 bg-blue-100 text-[#1e3a8a] rounded-2xl flex items-center justify-center mx-auto shadow-lg", children: selectedFile.type === 'application/pdf' ? (0, jsx_runtime_1.jsx)(lucide_react_1.FileType, { size: 28 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { size: 28 }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs md:text-sm font-black text-slate-800 break-all px-4", children: selectedFile.name })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "text-center space-y-4", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UploadCloud, { size: 32, className: "mx-auto text-slate-300" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs md:text-sm font-black text-slate-800", children: "Drop PDF or TXT here" })] }))] })) : ((0, jsx_runtime_1.jsx)("textarea", { value: uploadText, onChange: (e) => setUploadText(e.target.value), placeholder: "Paste exam content...", className: "w-full h-48 md:h-64 p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-mono outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all" })), (0, jsx_runtime_1.jsx)("button", { onClick: handleSimulateUpload, disabled: isParsing, className: "w-full bg-[#1e3a8a] text-white py-4 md:py-5 rounded-2xl font-black flex justify-center items-center gap-3 shadow-xl disabled:opacity-50 active:scale-95 transition-transform", children: isParsing ? (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "animate-spin", size: 20 }), " Processing..."] }) : (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { size: 20, className: "text-yellow-400" }), " Extract Board Items"] }) }), parsedQuestions.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-between animate-in slide-in-from-top-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 20 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-black text-emerald-800", children: ["Successfully extracted ", parsedQuestions.length, " items"] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-emerald-600", children: "Items have been added to the Validated Item Repository." })] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setActiveTab('QUESTION_BANK'), className: "px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-colors", children: "View Repository" })] }))] })), activeTab === 'ROSTER' && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative flex-1 w-full", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400", size: 18 }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search by ID or Email...", className: "w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a8a] transition-all", value: rosterSearch, onChange: (e) => setRosterSearch(e.target.value) })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-4 w-full lg:w-auto", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex p-1 bg-slate-100 rounded-xl flex-1 lg:flex-none", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setRosterAccuracyFilter('ALL'), className: `flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${rosterAccuracyFilter === 'ALL' ? 'bg-white text-[#1e3a8a] shadow-sm' : 'text-slate-400'}`, children: "All" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setRosterAccuracyFilter('READY'), className: `flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${rosterAccuracyFilter === 'READY' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`, children: "Ready" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setRosterAccuracyFilter('DEVELOPING'), className: `flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${rosterAccuracyFilter === 'DEVELOPING' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`, children: "Developing" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setRosterAccuracyFilter('AT_RISK'), className: `flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${rosterAccuracyFilter === 'AT_RISK' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`, children: "At Risk" })] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-6 border-b border-slate-50 flex justify-between items-center", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-black text-slate-800", children: "Authorized Student Roster" }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] font-black text-slate-400 uppercase", children: [filteredRoster.length, " Records Found"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "overflow-x-auto", children: [(0, jsx_runtime_1.jsxs)("table", { className: "w-full text-left min-w-[800px]", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4", children: "Student ID" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4", children: "Institutional Email" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4", children: "Accuracy" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4", children: "Status" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4 text-right", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-slate-50", children: filteredRoster.map((s, i) => {
                                                    const score = s.accuracyScore || 0;
                                                    const isReady = score >= 75;
                                                    const isDeveloping = score >= 50 && score < 75;
                                                    const isAtRisk = score < 50;
                                                    return ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-slate-50/30 transition-colors", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 font-bold text-slate-700", children: s.studentId }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-slate-500", children: s.email }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: `h-full transition-all duration-1000 ${isReady ? 'bg-emerald-500' : isDeveloping ? 'bg-blue-500' : 'bg-red-500'}`, style: { width: `${score}%` } }) }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs font-black text-slate-700", children: [score, "%"] })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: isReady ? ((0, jsx_runtime_1.jsx)("span", { className: "px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100", children: "Ready" })) : isDeveloping ? ((0, jsx_runtime_1.jsx)("span", { className: "px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100", children: "Developing" })) : ((0, jsx_runtime_1.jsx)("span", { className: "px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100", children: "At Risk" })) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-right", children: (0, jsx_runtime_1.jsx)("button", { className: "p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { size: 16 }) }) })] }, i));
                                                }) })] }), filteredRoster.length === 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "p-20 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "text-slate-200", size: 32 }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-bold text-slate-400", children: "No students found matching your criteria." })] }))] })] })] })), activeTab === 'ENROLLMENT' && ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-2xl mx-auto bg-white p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 mb-6", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.UserPlus, { size: 24, className: "text-[#065f46]" }), (0, jsx_runtime_1.jsx)("h3", { className: "text-2xl font-black text-slate-800", children: "Bulk Whitelist Enrollment" })] }), (0, jsx_runtime_1.jsx)("textarea", { value: bulkInput, onChange: (e) => setBulkInput(e.target.value), placeholder: "01-2223-123456, student@phinmaed.com", className: "w-full h-48 p-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono" }), enrollmentError && (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-red-500 font-bold", children: enrollmentError }), successMessage && (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-emerald-600 font-bold", children: successMessage }), (0, jsx_runtime_1.jsx)("button", { onClick: handleWhitelistStudents, className: "w-full bg-[#065f46] text-white py-5 rounded-2xl font-black shadow-xl", children: "Enroll Batch" })] })), activeTab === 'QUESTION_BANK' && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col md:flex-row gap-4 justify-between items-start md:items-center", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative flex-1 w-full", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400", size: 18 }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search by question content or topic...", className: "w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1e3a8a] transition-all", value: bankSearch, onChange: (e) => setBankSearch(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-2 w-full md:w-auto", children: [(0, jsx_runtime_1.jsxs)("select", { value: bankSubjectFilter, onChange: (e) => setBankSubjectFilter(e.target.value), className: "bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none", children: [(0, jsx_runtime_1.jsx)("option", { value: "ALL", children: "All Subjects" }), constants_1.MOCK_SUBJECTS.map(s => (0, jsx_runtime_1.jsx)("option", { value: s.id, children: s.code }, s.id))] }), (0, jsx_runtime_1.jsxs)("select", { value: bankDifficultyFilter, onChange: (e) => setBankDifficultyFilter(e.target.value), className: "bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none", children: [(0, jsx_runtime_1.jsx)("option", { value: "ALL", children: "All Difficulties" }), constants_1.INITIAL_DIFFICULTY_TIERS.map(t => (0, jsx_runtime_1.jsx)("option", { value: t.name, children: t.name }, t.id))] })] })] }), selectedQuestionIds.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl animate-in slide-in-from-top-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Info, { size: 18, className: "text-[#1e3a8a]" }), (0, jsx_runtime_1.jsxs)("span", { className: "text-sm font-bold text-[#1e3a8a]", children: [selectedQuestionIds.length, " items selected"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => handleBulkToggleStatus(true), className: "px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-colors", children: "Activate" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleBulkToggleStatus(false), className: "px-4 py-2 bg-slate-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-700 transition-colors", children: "Deactivate" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleBulkDelete, className: "px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:bg-red-700 transition-colors", children: "Delete" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setSelectedQuestionIds([]), className: "px-4 py-2 text-slate-400 hover:text-slate-600 text-xs font-black uppercase tracking-widest", children: "Cancel" })] })] }))] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden", children: (0, jsx_runtime_1.jsxs)("div", { className: "overflow-x-auto", children: [(0, jsx_runtime_1.jsxs)("table", { className: "w-full text-left min-w-[1000px]", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4 w-12", children: (0, jsx_runtime_1.jsx)("button", { onClick: handleSelectAll, className: "text-slate-400 hover:text-[#1e3a8a] transition-colors", children: selectedQuestionIds.length === filteredQuestions.length && filteredQuestions.length > 0 ? (0, jsx_runtime_1.jsx)(lucide_react_1.CheckSquare, { size: 20 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Square, { size: 20 }) }) }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4", children: "Question Stem" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4", children: "Subject" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4", children: "Difficulty" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4", children: "Status" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-4 text-right", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-slate-50", children: filteredQuestions.map((q) => ((0, jsx_runtime_1.jsxs)("tr", { className: `hover:bg-slate-50/30 transition-colors ${!q.isActive ? 'bg-slate-50/50' : ''}`, children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsx)("button", { onClick: () => handleToggleSelect(q.id), className: "text-slate-300 hover:text-[#1e3a8a] transition-colors", children: selectedQuestionIds.includes(q.id) ? (0, jsx_runtime_1.jsx)(lucide_react_1.CheckSquare, { size: 20, className: "text-[#1e3a8a]" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Square, { size: 20 }) }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-md", children: [(0, jsx_runtime_1.jsx)("p", { className: `text-sm font-bold truncate ${q.isActive ? 'text-slate-700' : 'text-slate-400'}`, children: q.content }), (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black", children: q.topic })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsx)("span", { className: "px-2 py-1 bg-blue-50 text-[#1e3a8a] rounded text-[10px] font-black uppercase tracking-widest", children: constants_1.MOCK_SUBJECTS.find(s => s.id === q.subjectId)?.code }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] font-black text-slate-500 uppercase tracking-widest", children: q.difficulty }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsxs)("button", { onClick: () => handleToggleQuestionStatus(q.id), className: `flex items-center gap-2 transition-all ${q.isActive ? 'text-emerald-600' : 'text-slate-300'}`, children: [q.isActive ? (0, jsx_runtime_1.jsx)(lucide_react_1.ToggleRight, { size: 24 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.ToggleLeft, { size: 24 }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] font-black uppercase tracking-widest", children: q.isActive ? 'Active' : 'Inactive' })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-right", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end gap-2", children: [(0, jsx_runtime_1.jsx)("button", { className: "p-2 text-slate-300 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-all", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { size: 16 }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleDeleteQuestion(q.id), className: "p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { size: 16 }) })] }) })] }, q.id))) })] }), filteredQuestions.length === 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "p-20 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Database, { className: "text-slate-200", size: 32 }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-bold text-slate-400", children: "No questions found matching your filters." })] }))] }) })] }))] }));
};
exports.default = FacultyDashboard;
//# sourceMappingURL=FacultyDashboard.js.map