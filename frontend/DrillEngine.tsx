
import React, { useState, useEffect } from 'react';
import { MOCK_QUESTIONS, MOCK_SUBJECTS } from './constants';
import { Question } from './types';
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  BookOpen, 
  Clock, 
  Info,
  Lightbulb,
  GraduationCap
} from 'lucide-react';

const DrillEngine: React.FC<{ subjectId: string; onComplete: () => void }> = ({ subjectId, onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Filter questions for the specific subject
  const questions = MOCK_QUESTIONS.filter(q => q.subjectId === subjectId);
  const currentSubject = MOCK_SUBJECTS.find(s => s.id === subjectId);
  
  const currentQuestion = questions[currentIdx];

  const handleOptionSelect = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
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
    } else {
      onComplete();
    }
  };

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <BookOpen size={40} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800">No Questions Available</h3>
          <p className="text-slate-500 mt-2 text-sm">There are currently no drill questions uploaded for <b>{currentSubject?.name}</b>. Please contact your instructor.</p>
        </div>
        <button onClick={onComplete} className="w-full sm:w-auto px-8 py-3 bg-[#1e3a8a] text-white rounded-xl font-bold shadow-lg">Return to Dashboard</button>
      </div>
    );
  }

  const progressPercentage = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto py-4 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Subject Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-[#1e3a8a] text-white px-3 py-1 rounded-lg font-black text-xs shrink-0">
            {currentSubject?.code}
          </div>
          <h2 className="text-base md:text-lg font-black text-slate-800 tracking-tight line-clamp-1">{currentSubject?.name}</h2>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
          <Clock size={14} />
          <span>Session Progress</span>
        </div>
      </div>

      {/* Drill Progress Bar */}
      <div className="mb-6 md:mb-8">
        <div className="flex justify-between text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
          <span>Item {currentIdx + 1} / {questions.length}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 md:h-2.5 rounded-full overflow-hidden border border-slate-100">
          <div 
            className="h-full bg-[#facc15] transition-all duration-700 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Question Header */}
        <div className="bg-[#1e3a8a] p-5 md:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col gap-3 md:gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-400/20 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 whitespace-nowrap">
                <Info size={10} /> {currentQuestion.topic}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 whitespace-nowrap
                ${currentQuestion.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-200' : 
                  currentQuestion.difficulty === 'Average' ? 'bg-yellow-500/20 text-yellow-200' : 'bg-red-500/20 text-red-200'}`}>
                <Lightbulb size={10} /> {currentQuestion.difficulty}
              </span>
            </div>
            <h3 className="text-base md:text-xl font-bold leading-relaxed text-blue-50">
              {currentQuestion.content}
            </h3>
          </div>
        </div>

        {/* Options */}
        <div className="p-4 md:p-8 space-y-3 md:space-y-4 bg-white">
          {(Object.keys(currentQuestion.options) as Array<'A'|'B'|'C'|'D'>).map((key) => {
            const label = currentQuestion.options[key];
            const isSelected = selectedOption === key;
            const isCorrect = isAnswered && key === currentQuestion.correctAnswer;
            const isWrong = isAnswered && isSelected && key !== currentQuestion.correctAnswer;

            return (
              <button
                key={key}
                disabled={isAnswered}
                onClick={() => handleOptionSelect(key)}
                className={`w-full p-4 md:p-5 text-left rounded-xl md:rounded-2xl border-2 transition-all flex items-center justify-between group
                  ${isCorrect ? 'border-emerald-500 bg-emerald-50' : 
                    isWrong ? 'border-red-500 bg-red-50' :
                    isSelected ? 'border-[#1e3a8a] bg-blue-50 shadow-sm' : 
                    'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}
                  ${isAnswered ? 'cursor-default' : 'active:scale-[0.99]'}`}
              >
                <div className="flex items-center gap-3 md:gap-5">
                  <span className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl shrink-0 flex items-center justify-center font-black text-xs md:text-sm transition-all
                    ${isSelected ? 'bg-[#1e3a8a] text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>
                    {key}
                  </span>
                  <span className={`font-bold text-sm md:text-base leading-snug ${isAnswered ? (isCorrect ? 'text-emerald-800' : isWrong ? 'text-red-800' : 'text-slate-400') : 'text-slate-700'}`}>
                    {label}
                  </span>
                </div>
                {isCorrect && <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />}
                {isWrong && <XCircle className="text-red-500 shrink-0" size={20} />}
              </button>
            );
          })}
        </div>

        {/* Remedial Feedback Section */}
        <div className="px-4 md:px-8 pb-6 md:pb-8 pt-0 bg-white">
          {!isAnswered ? (
            <button
              disabled={!selectedOption}
              onClick={handleSubmit}
              className="w-full bg-[#065f46] text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/10 active:scale-95 disabled:opacity-30 disabled:grayscale"
            >
              CONFIRM ANSWER
            </button>
          ) : (
            <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {selectedOption === currentQuestion.correctAnswer ? (
                <div className="flex items-center gap-3 md:gap-4 text-emerald-800 font-black bg-emerald-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-emerald-100">
                  <div className="bg-emerald-500 p-2 md:p-3 rounded-xl text-white shadow-lg shadow-emerald-200 shrink-0"><CheckCircle2 size={24} /></div>
                  <div>
                    <p className="text-sm md:text-lg">Correct Execution</p>
                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Knowledge point mastered</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border-2 border-red-100 rounded-2xl md:rounded-[2rem] p-4 md:p-8 space-y-4 md:space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 hidden sm:block">
                    <GraduationCap size={120} />
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 text-red-600 font-black relative z-10">
                    <AlertCircle size={24} />
                    <span className="text-sm md:text-xl uppercase tracking-tight">Remedial Feedback</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-10">
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Correct Solution</p>
                      <div className="p-4 bg-white rounded-xl border-l-4 border-emerald-500 shadow-sm">
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block mb-1">Option {currentQuestion.correctAnswer}</span>
                        <p className="text-xs md:text-sm font-bold text-slate-800 leading-relaxed">
                          {currentQuestion.options[currentQuestion.correctAnswer]}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subject Part</p>
                      <div className="p-4 bg-white rounded-xl border-l-4 border-[#1e3a8a] shadow-sm">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block mb-1">{currentSubject?.code} Section</span>
                        <p className="text-xs md:text-sm font-bold text-slate-800">
                          {currentQuestion.topic}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 relative z-10">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pedagogical Reference</p>
                    <div className="text-xs md:text-sm text-slate-600 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 leading-relaxed italic border-b-4 border-b-[#facc15]">
                      "{currentQuestion.reference}"
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleNext}
                className="w-full bg-[#1e3a8a] text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg flex items-center justify-center gap-3 hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/10 active:scale-[0.98] group"
              >
                {currentIdx < questions.length - 1 ? 'PROCEED TO NEXT' : 'FINALIZE DRILL'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrillEngine;
