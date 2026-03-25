"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const constants_1 = require("./constants");
const types_1 = require("./types");
const lucide_react_1 = require("lucide-react");
const DrillEngine = ({ subjectId, onComplete }) => {
    const [currentIdx, setCurrentIdx] = (0, react_1.useState)(0);
    const [selectedOption, setSelectedOption] = (0, react_1.useState)(null);
    const [isAnswered, setIsAnswered] = (0, react_1.useState)(false);
    const [score, setScore] = (0, react_1.useState)(0);
    const [showFeedback, setShowFeedback] = (0, react_1.useState)(false);
    // Filter questions for the specific subject
    const questions = constants_1.MOCK_QUESTIONS.filter(q => q.subjectId === subjectId);
    const currentSubject = constants_1.MOCK_SUBJECTS.find(s => s.id === subjectId);
    const currentQuestion = questions[currentIdx];
    const handleOptionSelect = (opt) => {
        if (isAnswered)
            return;
        setSelectedOption(opt);
    };
    const handleSubmit = () => {
        if (!selectedOption)
            return;
        setIsAnswered(true);
        const correct = selectedOption === currentQuestion.correctAnswer;
        if (correct) {
            setScore(s => s + 1);
        }
        setShowFeedback(true);
    };
    const handleNext = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(i => i + 1);
            setSelectedOption(null);
            setIsAnswered(false);
            setShowFeedback(false);
        }
        else {
            onComplete();
        }
    };
    if (questions.length === 0) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-2xl mx-auto py-12 px-4 text-center space-y-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400", children: (0, jsx_runtime_1.jsx)(lucide_react_1.BookOpen, { size: 40 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-xl font-black text-slate-800", children: "No Questions Available" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-slate-500 mt-2 text-sm", children: ["There are currently no drill questions uploaded for ", (0, jsx_runtime_1.jsx)("b", { children: currentSubject?.name }), ". Please contact your instructor."] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: onComplete, className: "w-full sm:w-auto px-8 py-3 bg-[#1e3a8a] text-white rounded-xl font-bold shadow-lg", children: "Return to Dashboard" })] }));
    }
    const progressPercentage = ((currentIdx + 1) / questions.length) * 100;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-3xl mx-auto py-4 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-[#1e3a8a] text-white px-3 py-1 rounded-lg font-black text-xs shrink-0", children: currentSubject?.code }), (0, jsx_runtime_1.jsx)("h2", { className: "text-base md:text-lg font-black text-slate-800 tracking-tight line-clamp-1", children: currentSubject?.name })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-slate-400 text-xs font-bold", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { size: 14 }), (0, jsx_runtime_1.jsx)("span", { children: "Session Progress" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-6 md:mb-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest", children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Item ", currentIdx + 1, " / ", questions.length] }), (0, jsx_runtime_1.jsxs)("span", { children: [Math.round(progressPercentage), "%"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full bg-slate-100 h-2 md:h-2.5 rounded-full overflow-hidden border border-slate-100", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-[#facc15] transition-all duration-700 ease-out", style: { width: `${progressPercentage}%` } }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-[#1e3a8a] p-5 md:p-8 text-white relative overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative z-10 flex flex-col gap-3 md:gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-400/20 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 whitespace-nowrap", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Info, { size: 10 }), " ", currentQuestion.topic] }), (0, jsx_runtime_1.jsxs)("span", { className: `inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 whitespace-nowrap
                ${currentQuestion.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-200' :
                                                    currentQuestion.difficulty === 'Average' ? 'bg-yellow-500/20 text-yellow-200' : 'bg-red-500/20 text-red-200'}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Lightbulb, { size: 10 }), " ", currentQuestion.difficulty] })] }), (0, jsx_runtime_1.jsx)("h3", { className: "text-base md:text-xl font-bold leading-relaxed text-blue-50", children: currentQuestion.content })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "p-4 md:p-8 space-y-3 md:space-y-4 bg-white", children: Object.keys(currentQuestion.options).map((key) => {
                            const label = currentQuestion.options[key];
                            const isSelected = selectedOption === key;
                            const isCorrect = isAnswered && key === currentQuestion.correctAnswer;
                            const isWrong = isAnswered && isSelected && key !== currentQuestion.correctAnswer;
                            return ((0, jsx_runtime_1.jsxs)("button", { disabled: isAnswered, onClick: () => handleOptionSelect(key), className: `w-full p-4 md:p-5 text-left rounded-xl md:rounded-2xl border-2 transition-all flex items-center justify-between group
                  ${isCorrect ? 'border-emerald-500 bg-emerald-50' :
                                    isWrong ? 'border-red-500 bg-red-50' :
                                        isSelected ? 'border-[#1e3a8a] bg-blue-50 shadow-sm' :
                                            'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}
                  ${isAnswered ? 'cursor-default' : 'active:scale-[0.99]'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 md:gap-5", children: [(0, jsx_runtime_1.jsx)("span", { className: `w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl shrink-0 flex items-center justify-center font-black text-xs md:text-sm transition-all
                    ${isSelected ? 'bg-[#1e3a8a] text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`, children: key }), (0, jsx_runtime_1.jsx)("span", { className: `font-bold text-sm md:text-base leading-snug ${isAnswered ? (isCorrect ? 'text-emerald-800' : isWrong ? 'text-red-800' : 'text-slate-400') : 'text-slate-700'}`, children: label })] }), isCorrect && (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "text-emerald-500 shrink-0", size: 20 }), isWrong && (0, jsx_runtime_1.jsx)(lucide_react_1.XCircle, { className: "text-red-500 shrink-0", size: 20 })] }, key));
                        }) }), (0, jsx_runtime_1.jsx)("div", { className: "px-4 md:px-8 pb-6 md:pb-8 pt-0 bg-white", children: !isAnswered ? ((0, jsx_runtime_1.jsx)("button", { disabled: !selectedOption, onClick: handleSubmit, className: "w-full bg-[#065f46] text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/10 active:scale-95 disabled:opacity-30 disabled:grayscale", children: "CONFIRM ANSWER" })) : ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [selectedOption === currentQuestion.correctAnswer ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 md:gap-4 text-emerald-800 font-black bg-emerald-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-emerald-100", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-emerald-500 p-2 md:p-3 rounded-xl text-white shadow-lg shadow-emerald-200 shrink-0", children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 24 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm md:text-lg", children: "Correct Execution" }), (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-bold opacity-60 uppercase tracking-widest", children: "Knowledge point mastered" })] })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "bg-slate-50 border-2 border-red-100 rounded-2xl md:rounded-[2rem] p-4 md:p-8 space-y-4 md:space-y-6 relative overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-0 right-0 p-4 opacity-5 hidden sm:block", children: (0, jsx_runtime_1.jsx)(lucide_react_1.GraduationCap, { size: 120 }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 md:gap-3 text-red-600 font-black relative z-10", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { size: 24 }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm md:text-xl uppercase tracking-tight", children: "Remedial Feedback" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[9px] font-black text-slate-400 uppercase tracking-widest", children: "Correct Solution" }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-white rounded-xl border-l-4 border-emerald-500 shadow-sm", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block mb-1", children: ["Option ", currentQuestion.correctAnswer] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs md:text-sm font-bold text-slate-800 leading-relaxed", children: currentQuestion.options[currentQuestion.correctAnswer] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[9px] font-black text-slate-400 uppercase tracking-widest", children: "Subject Part" }), (0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-white rounded-xl border-l-4 border-[#1e3a8a] shadow-sm", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block mb-1", children: [currentSubject?.code, " Section"] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs md:text-sm font-bold text-slate-800", children: currentQuestion.topic })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2 relative z-10", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[9px] font-black text-slate-400 uppercase tracking-widest", children: "Pedagogical Reference" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-xs md:text-sm text-slate-600 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 leading-relaxed italic border-b-4 border-b-[#facc15]", children: ["\"", currentQuestion.reference, "\""] })] })] })), (0, jsx_runtime_1.jsxs)("button", { onClick: handleNext, className: "w-full bg-[#1e3a8a] text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg flex items-center justify-center gap-3 hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/10 active:scale-[0.98] group", children: [currentIdx < questions.length - 1 ? 'PROCEED TO NEXT' : 'FINALIZE DRILL', (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { size: 18, className: "group-hover:translate-x-1 transition-transform" })] })] })) })] })] }));
};
exports.default = DrillEngine;
//# sourceMappingURL=DrillEngine.js.map