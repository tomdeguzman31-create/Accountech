"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const constants_1 = require("../constants");
const types_1 = require("../types");
const lucide_react_1 = require("lucide-react");
const DrillEngine = ({ subjectId, difficultyTierId, onComplete }) => {
    const [currentIdx, setCurrentIdx] = (0, react_1.useState)(0);
    const [selectedOption, setSelectedOption] = (0, react_1.useState)(null);
    const [isAnswered, setIsAnswered] = (0, react_1.useState)(false);
    const [score, setScore] = (0, react_1.useState)(0);
    const [isSpeaking, setIsSpeaking] = (0, react_1.useState)(false);
    const questions = (0, react_1.useMemo)(() => {
        let filtered = constants_1.MOCK_QUESTIONS.filter(q => q.subjectId === subjectId);
        if (difficultyTierId) {
            const tier = constants_1.INITIAL_DIFFICULTY_TIERS.find(t => t.id === difficultyTierId);
            if (tier) {
                // Extract the difficulty label from the name, e.g., "Recall (Easy)" -> "Easy"
                const difficultyLabel = tier.name.match(/\((.*?)\)/)?.[1];
                if (difficultyLabel) {
                    filtered = filtered.filter(q => q.difficulty === difficultyLabel);
                }
            }
        }
        return filtered;
    }, [subjectId, difficultyTierId]);
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
        if (selectedOption === currentQuestion.correctAnswer) {
            setScore(s => s + 1);
        }
    };
    const handleNext = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(i => i + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        }
        else {
            onComplete();
        }
    };
    const toggleSpeech = (text) => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
        else {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };
    const speakQuestionAndOptions = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }
        let fullText = currentQuestion.content + ". ";
        fullText += "Option A: " + currentQuestion.options.A + ". ";
        fullText += "Option B: " + currentQuestion.options.B + ". ";
        fullText += "Option C: " + currentQuestion.options.C + ". ";
        fullText += "Option D: " + currentQuestion.options.D + ". ";
        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };
    if (questions.length === 0) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-2xl mx-auto py-12 px-4 text-center space-y-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400", children: (0, jsx_runtime_1.jsx)(lucide_react_1.BookOpen, { size: 40 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-xl font-black text-slate-800", children: "No Questions Available" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-slate-500 mt-2 text-sm", children: ["There are currently no drill questions for ", (0, jsx_runtime_1.jsx)("b", { children: currentSubject?.name }), "."] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: onComplete, className: "w-full sm:w-auto px-8 py-3 bg-[#1e3a8a] text-white rounded-xl font-bold shadow-lg", children: "Return to Dashboard" })] }));
    }
    const progressPercentage = ((currentIdx + 1) / questions.length) * 100;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-3xl mx-auto py-2 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 md:gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-[#1e3a8a] text-white px-2 md:px-3 py-1 rounded-lg font-black text-[10px] md:text-xs shrink-0", children: currentSubject?.code }), (0, jsx_runtime_1.jsx)("h2", { className: "text-sm md:text-lg font-black text-slate-800 tracking-tight truncate", children: currentSubject?.name })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-slate-400 text-[10px] md:text-xs font-bold", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { size: 14 }), (0, jsx_runtime_1.jsx)("span", { children: "Drill Progress" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-6 md:mb-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between text-[9px] md:text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest", children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Item ", currentIdx + 1, " / ", questions.length] }), (0, jsx_runtime_1.jsxs)("span", { children: [Math.round(progressPercentage), "%"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full bg-slate-100 h-2 md:h-2.5 rounded-full overflow-hidden border border-slate-100", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-[#facc15] transition-all duration-700 ease-out", style: { width: `${progressPercentage}%` } }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-[1.5rem] md:rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-[#1e3a8a] p-6 md:p-8 text-white relative", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative z-10 space-y-3 md:space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "px-2 py-0.5 bg-blue-400/20 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/10", children: currentQuestion.topic }), (0, jsx_runtime_1.jsx)("span", { className: `px-2 py-0.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 ${currentQuestion.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-200' : currentQuestion.difficulty === 'Average' ? 'bg-yellow-500/20 text-yellow-200' : 'bg-red-500/20 text-red-200'}`, children: currentQuestion.difficulty })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-base md:text-xl font-bold leading-relaxed flex-1", children: currentQuestion.content }), (0, jsx_runtime_1.jsx)("button", { onClick: speakQuestionAndOptions, className: "p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all shrink-0", title: isSpeaking ? "Stop Reading" : "Read Question and Options", children: isSpeaking ? (0, jsx_runtime_1.jsx)(lucide_react_1.VolumeX, { size: 20 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Volume2, { size: 20 }) })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "p-4 md:p-8 space-y-3 md:space-y-4", children: Object.keys(currentQuestion.options).map((key) => {
                            const label = currentQuestion.options[key];
                            const isSelected = selectedOption === key;
                            const isCorrect = isAnswered && key === currentQuestion.correctAnswer;
                            const isWrong = isAnswered && isSelected && key !== currentQuestion.correctAnswer;
                            return ((0, jsx_runtime_1.jsx)("button", { disabled: isAnswered, onClick: () => handleOptionSelect(key), className: `w-full p-3 md:p-5 text-left rounded-xl md:rounded-2xl border-2 transition-all flex items-center justify-between group
                  ${isCorrect ? 'border-emerald-500 bg-emerald-50' : isWrong ? 'border-red-500 bg-red-50' : isSelected ? 'border-[#1e3a8a] bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 md:gap-5", children: [(0, jsx_runtime_1.jsx)("span", { className: `w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl shrink-0 flex items-center justify-center font-black text-xs md:text-sm ${isSelected ? 'bg-[#1e3a8a] text-white' : 'bg-slate-100 text-slate-500'}`, children: key }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs md:text-sm font-bold text-slate-700", children: label })] }) }, key));
                        }) }), (0, jsx_runtime_1.jsx)("div", { className: "px-4 md:px-8 pb-6 md:pb-8", children: !isAnswered ? ((0, jsx_runtime_1.jsx)("button", { disabled: !selectedOption, onClick: handleSubmit, className: "w-full bg-[#065f46] text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:bg-emerald-800 transition-all shadow-xl disabled:opacity-30", children: "CONFIRM ANSWER" })) : ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [(0, jsx_runtime_1.jsxs)("div", { className: `p-4 md:p-6 rounded-xl md:rounded-2xl border-2 ${selectedOption === currentQuestion.correctAnswer ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-2 md:gap-3 font-black mb-3 md:mb-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 md:gap-3", children: [selectedOption === currentQuestion.correctAnswer ? (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { size: 20, "md:size": 24 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { size: 20, "md:size": 24 }), (0, jsx_runtime_1.jsx)("span", { className: "uppercase tracking-tight text-sm md:text-lg", children: selectedOption === currentQuestion.correctAnswer ? 'Correct Execution' : 'Remedial Feedback' })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => toggleSpeech(currentQuestion.reference), className: "p-2 bg-black/5 hover:bg-black/10 rounded-lg transition-all", title: "Read Feedback", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Volume2, { size: 16 }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-4 md:p-6 rounded-lg md:rounded-xl border border-slate-100 shadow-sm italic text-xs md:text-sm text-slate-600", children: ["\"", currentQuestion.reference, "\""] })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: handleNext, className: "w-full bg-[#1e3a8a] text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg flex items-center justify-center gap-3", children: [currentIdx < questions.length - 1 ? 'NEXT ITEM' : 'FINISH DRILL', " ", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { size: 20 })] })] })) })] })] }));
};
exports.default = DrillEngine;
//# sourceMappingURL=DrillEngine.js.map